import {useEffect,useRef,useState} from 'react';
import {Map,Marker,LngLatBounds,setWorkerUrl} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import MapFallback,{MapRoutePoint} from './MapFallback';
import 'maplibre-gl/dist/maplibre-gl.css';
import {places} from './data';

setWorkerUrl(workerUrl);

function isValidCoord(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -85 &&
    lat <= 85 &&
    lng >= -180 &&
    lng <= 180
  );
}

function safeFitBounds(
  map: Map,
  container: HTMLElement | null,
  bounds: LngLatBounds,
  maxZoom = 13.8,
  duration = 500
) {
  try {
    if (bounds.isEmpty()) return;
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    if (!isValidCoord(sw.lat, sw.lng) || !isValidCoord(ne.lat, ne.lng)) return;

    const samePoint =
      Math.abs(sw.lat - ne.lat) < 0.0001 && Math.abs(sw.lng - ne.lng) < 0.0001;
    if (samePoint) {
      map.flyTo({ center: [sw.lng, sw.lat], zoom: maxZoom, duration });
      return;
    }

    const rect = container?.getBoundingClientRect();
    const width = rect?.width ?? 0;
    const height = rect?.height ?? 0;

    if (width < 140 || height < 140) {
      const center = bounds.getCenter();
      if (isValidCoord(center.lat, center.lng)) {
        map.jumpTo({ center: [center.lng, center.lat], zoom: 12.2 });
      }
      return;
    }

    const padX = Math.max(16, Math.min(44, Math.floor(width * 0.12)));
    const padY = Math.max(16, Math.min(44, Math.floor(height * 0.12)));

    map.fitBounds(bounds, {
      padding: { top: padY, bottom: padY, left: padX, right: padX },
      maxZoom,
      duration
    });
  } catch (err) {
    console.warn('Map fitBounds fallback:', err);
  }
}

export default function MapView({
  demo=false,
  selected,
  onStop,
  overview,
  routePoints,
  focusCoord
}:{
  demo?:boolean;
  overview?:string;
  selected?:string;
  onStop?:(id:string)=>void;
  routePoints?:MapRoutePoint[];
  focusCoord?:{lat:number;lng:number;label?:string}|null;
}){
  const ref=useRef<HTMLDivElement>(null),[failed,setFailed]=useState(false);
  const cb=useRef(onStop);
  cb.current=onStop;

  useEffect(()=>{
    if(!ref.current)return;
    setFailed(false);
    let map:Map;
    try{
      map=new Map({
        container:ref.current,
        style:import.meta.env.VITE_MAP_STYLE_URL||'https://tiles.openfreemap.org/styles/liberty',
        center:[29.956,31.239],
        zoom:11.8,
        attributionControl:{compact:true},
        scrollZoom:false,
        doubleClickZoom:false,
        touchZoomRotate:false,
        boxZoom:false,
        keyboard:false
      });
    }catch(error){
      console.error('Map initialization failed',String(error));
      setFailed(true);
      return;
    }

    map.on('error',()=>setFailed(true));

    map.on('load',()=>{
      setFailed(false);
      try {
        map.resize();
      } catch {}

      for(const layer of map.getStyle().layers){
        if(layer.type==='symbol'&&layer.layout?.['text-field']){
          try{
            map.setLayoutProperty(layer.id,'text-field',['coalesce',['get','name:ar'],['get','name']]);
          }catch{}
        }
      }

      const validRoutePoints = (routePoints || []).filter(p => isValidCoord(p.lat, p.lng));

      if(validRoutePoints.length>0){
        const coordinates=validRoutePoints.map(p=>[p.lng,p.lat]);
        if(coordinates.length>1){
          map.addSource('selected-route',{
            type:'geojson',
            data:{
              type:'Feature',
              properties:{},
              geometry:{type:'LineString',coordinates}
            }
          });
          map.addLayer({
            id:'selected-route-casing',
            type:'line',
            source:'selected-route',
            paint:{
              'line-color':'#102A43',
              'line-width':8,
              'line-opacity':0.92
            }
          });
          map.addLayer({
            id:'selected-route-line',
            type:'line',
            source:'selected-route',
            paint:{
              'line-color':'#F0C64A',
              'line-width':4,
              'line-opacity':1
            }
          });
        }

        const bounds=new LngLatBounds();
        validRoutePoints.forEach(p=>{
          bounds.extend([p.lng,p.lat]);
          const el=document.createElement('button');
          el.className=`map-pin route-map-pin ${p.kind||'stop'}`;
          el.title=p.sublabel?`${p.name} — ${p.sublabel}`:p.name;
          el.setAttribute('aria-label',p.name);
          const badge=document.createElement('span');
          badge.className='map-pin-caption';
          badge.textContent=p.name;
          el.appendChild(badge);
          el.addEventListener('click',()=>cb.current?.(p.id));
          new Marker({element:el}).setLngLat([p.lng,p.lat]).addTo(map);
        });

        if(focusCoord && isValidCoord(focusCoord.lat, focusCoord.lng)){
          try {
            map.flyTo({center:[focusCoord.lng,focusCoord.lat],zoom:14.5,duration:500});
          } catch {}
        }else if(!bounds.isEmpty()){
          safeFitBounds(map, ref.current, bounds, 13.8, 500);
        }
      }else{
        places
          .filter(p=>isValidCoord(p.lat,p.lng) && (overview?overview.split('|').includes(p.name):!['borg','agami'].includes(p.id)))
          .forEach(p=>{
            const el=document.createElement('button');
            el.className='map-pin';
            el.title=p.name;
            el.setAttribute('aria-label',p.name);
            el.addEventListener('click',()=>cb.current?.(p.id));
            new Marker({element:el}).setLngLat([p.lng,p.lat]).addTo(map);
          });

        if(demo){
          const points=places
            .filter(p=>isValidCoord(p.lat,p.lng)&&['sidi-bishr','san','stanley','sidi-gaber','raml'].includes(p.id))
            .sort((a,b)=>b.lng-a.lng)
            .map(p=>[p.lng,p.lat]);
          if(points.length>1){
            map.addSource('demo',{type:'geojson',data:{type:'Feature',properties:{},geometry:{type:'LineString',coordinates:points}}});
            map.addLayer({id:'demo',type:'line',source:'demo',paint:{'line-color':'#102A43','line-width':5,'line-dasharray':[2,2]}});
            const bounds=new LngLatBounds();
            points.forEach(p=>bounds.extend(p as [number,number]));
            safeFitBounds(map, ref.current, bounds, 13.5, 500);
          }
        }
        if(overview){
          const bounds=new LngLatBounds();
          places
            .filter(p=>isValidCoord(p.lat,p.lng)&&overview.split('|').includes(p.name))
            .forEach(p=>bounds.extend([p.lng,p.lat]));
          if(!bounds.isEmpty()){
            safeFitBounds(map, ref.current, bounds, 13, 0);
          }
        }
        if(focusCoord && isValidCoord(focusCoord.lat, focusCoord.lng)){
          try {
            map.flyTo({center:[focusCoord.lng,focusCoord.lat],zoom:14.5,duration:500});
          } catch {}
        }else if(selected){
          const p=places.find(p=>p.id===selected && isValidCoord(p.lat,p.lng));
          if(p){
            try {
              map.flyTo({center:[p.lng,p.lat],zoom:13});
            } catch {}
          }
        }
      }
    });

    const resize=new ResizeObserver(()=>{
      try {
        map.resize();
      } catch {}
    });
    resize.observe(ref.current);
    return()=>{resize.disconnect();map.remove()};
  },[demo,selected,overview,routePoints,focusCoord]);

  if(failed)return <MapFallback overview={overview} demo={demo} selected={selected} onStop={onStop} routePoints={routePoints} focusCoord={focusCoord}/>;
  return (
    <>
      <div className="leaflet" ref={ref} aria-label="خريطة إسكندرية التفاعلية"/>
      {failed&&<div className="map-error">الخريطة مش متاحة دلوقتي. البحث لسه شغال.</div>}
    </>
  );
}
