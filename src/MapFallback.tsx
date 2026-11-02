import {useEffect,useRef} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {places} from './data';

export type MapRoutePoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind?: 'board' | 'transfer' | 'exit' | 'stop';
  sublabel?: string;
};

export default function MapFallback({
  demo,
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
  const ref=useRef<HTMLDivElement>(null),cb=useRef(onStop);
  cb.current=onStop;

  useEffect(()=>{
    if(!ref.current)return;
    const map=L.map(ref.current,{
      zoomControl:false,
      scrollWheelZoom:false,
      doubleClickZoom:false,
      touchZoom:false,
      boxZoom:false,
      keyboard:false,
      minZoom:10,
      maxZoom:16,
      attributionControl:false
    }).setView([31.235,29.955],12);

    L.control.attribution({prefix:false,position:'bottomright'})
      .addAttribution('خريطة إسكندريلا التوضيحية')
      .addTo(map);

    const coast:[[number,number],...[number,number][]]=[
      [31.15,29.83],[31.2,29.878],[31.215,29.885],[31.207,29.9],
      [31.22,29.938],[31.237,29.956],[31.249,29.97],[31.264,29.987],
      [31.277,30.006],[31.29,30.023],[31.31,30.05],[31.33,30.07]
    ];
    L.polygon([...coast,[31.13,30.16],[31.1,29.8]],{
      color:'#b7d6d9',
      weight:2,
      fillColor:'#faf6ee',
      fillOpacity:1,
      interactive:false
    }).addTo(map);

    const label=(name:string,lat:number,lng:number,cls='region-label')=>
      L.marker([lat,lng],{
        icon:L.divIcon({className:cls,html:name,iconSize:[110,22],iconAnchor:[55,11]}),
        interactive:false
      }).addTo(map);

    label('البحر المتوسط',31.285,29.936,'sea-label');
    label('إسكندرية',31.201,29.976,'city-map-label');

    const validRoutePoints = (routePoints || []).filter(
      p => typeof p.lat === 'number' && typeof p.lng === 'number' && Number.isFinite(p.lat) && Number.isFinite(p.lng)
    );

    if(validRoutePoints.length>0){
      const pts=validRoutePoints.map(p=>[p.lat,p.lng] as [number,number]);
      if(pts.length>1){
        L.polyline(pts,{color:'#102A43',weight:7,opacity:0.9}).addTo(map);
        L.polyline(pts,{color:'#F0C64A',weight:3,opacity:1}).addTo(map);
      }
      validRoutePoints.forEach(p=>{
        const fill=p.kind==='board'?'#16a34a':p.kind==='exit'?'#dc2626':p.kind==='transfer'?'#f59e0b':'#102A43';
        const radius=p.kind==='board'||p.kind==='exit'||p.kind==='transfer'?8:5;
        L.circleMarker([p.lat,p.lng],{
          radius,
          color:'#ffffff',
          weight:3,
          fillColor:fill,
          fillOpacity:1
        }).addTo(map).on('click',()=>cb.current?.(p.id));
        label(p.name,p.lat-0.0032,p.lng,'region-label route-pin-label');
      });
      if(focusCoord && Number.isFinite(focusCoord.lat) && Number.isFinite(focusCoord.lng)){
        map.setView([focusCoord.lat,focusCoord.lng],14);
      }else if(pts.length>1){
        try {
          map.fitBounds(L.latLngBounds(pts),{padding:[32,32],maxZoom:14});
        } catch {}
      }else if(pts.length===1){
        map.setView(pts[0],14);
      }
    }else{
      places.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&(overview?overview.split('|').includes(p.name):!['borg','agami','asafra','mandara','miami','sidi-gaber'].includes(p.id))).forEach(p=>{
        L.circleMarker([p.lat,p.lng],{
          radius:6,
          color:'white',
          weight:3,
          fillColor:'#102A43',
          fillOpacity:1
        }).addTo(map).on('click',()=>cb.current?.(p.id));
        label(p.name,p.lat-0.0028,p.lng);
      });
      if(demo){
        const pts=places.filter(p=>['sidi-bishr','san','stanley','sidi-gaber','raml'].includes(p.id)).sort((a,b)=>b.lng-a.lng).map(p=>[p.lat,p.lng] as [number,number]);
        const l=L.polyline(pts,{color:'#102A43',weight:5,dashArray:'7 8'}).addTo(map);
        try {
          map.fitBounds(l.getBounds(),{padding:[32,32]});
        } catch {}
      }
      if(overview){
        const pts=places.filter(p=>overview.split('|').includes(p.name)).map(p=>[p.lat,p.lng] as [number,number]);
        if(pts.length){
          try {
            map.fitBounds(L.latLngBounds(pts),{padding:[32,32],maxZoom:13});
          } catch {}
        }
      }
      if(focusCoord && Number.isFinite(focusCoord.lat) && Number.isFinite(focusCoord.lng)){
        map.setView([focusCoord.lat,focusCoord.lng],14);
      }else if(selected){
        const p=places.find(p=>p.id===selected);
        if(p && Number.isFinite(p.lat) && Number.isFinite(p.lng))map.setView([p.lat,p.lng],13);
      }
    }

    const resize=new ResizeObserver(()=>map.invalidateSize());
    resize.observe(ref.current);
    return()=>{resize.disconnect();map.remove()};
  },[demo,selected,overview,routePoints,focusCoord]);

  return (
    <>
      <div className="leaflet fallback-map" ref={ref}/>
      <div className="map-fallback-note">خريطة مناطق مبسطة • تبرز مسار الرحلة المختارة</div>
    </>
  );
}
