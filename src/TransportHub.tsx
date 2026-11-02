import {useState, useMemo, Suspense, lazy} from 'react';
import {
  MapPin,
  LocateFixed,
  ArrowUpDown,
  BusFront,
  TramFront,
  ChevronUp,
  ChevronDown,
  Bookmark,
  Check,
  Search,
  Plus,
  X,
  ExternalLink,
  AlertCircle,
  Compass,
  FileText
} from 'lucide-react';
import {normalize, modes, places} from './data';
import {
  CORRIDOR_STOPS,
  buildAllTransitLines,
  findJourneyOptions,
  resolveStopNode,
  canonicalAreaName,
  type JourneyOption,
  type TransitLineRecord,
  type CorridorType
} from './transportEngine';
import SourceCatalog, {SourceFareMatches} from './SourceCatalog';
import InternetTransport from './InternetTransport';
import {call} from './firebase';
import type {MapRoutePoint} from './MapFallback';

const MapView = lazy(() => import('./Map'));

const ModeBadgeIcon = ({mode, size = 20}: {mode: string; size?: number}) =>
  ['blue', 'yellow', 'train', 'metro'].includes(mode) ? <TramFront size={size}/> : <BusFront size={size}/>;

export default function TransportHub({
  from,
  setFrom,
  to,
  setTo,
  saved,
  save,
  recent,
  setRecent,
  liveLines,
  liveStops,
  liveAlerts,
  locate,
  notify,
  onRefreshLines,
  initialSubView = 'planner',
  showFaresSetting = true
}: {
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
  saved: string[];
  save: (v: string) => void;
  recent: string[];
  setRecent: (v: string[]) => void;
  liveLines: any[];
  liveStops: any[];
  liveAlerts: any[];
  locate: () => void;
  notify: (msg: string) => void;
  onRefreshLines?: () => void;
  initialSubView?: 'planner' | 'nearby' | 'lines';
  showFaresSetting?: boolean;
}) {
  const [subView, setSubView] = useState<'planner' | 'nearby' | 'lines'>(initialSubView);
  const [focusedField, setFocusedField] = useState<'from' | 'to' | ''>('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [showRideDetails, setShowRideDetails] = useState(false);
  const [showOtherRoutes, setShowOtherRoutes] = useState(false);
  const [compareFilter, setCompareFilter] = useState<'all' | 'fastest' | 'cheapest' | 'fewest_transfers'>('all');
  const [expandedStopsLegs, setExpandedStopsLegs] = useState<Record<number, boolean>>({});
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [focusCoord, setFocusCoord] = useState<{lat: number; lng: number; label?: string} | null>(null);

  // Nearby & All Lines state
  const [nearbyAreaFilter, setNearbyAreaFilter] = useState<string>('سيدي بشر');
  const [lineQuery, setLineQuery] = useState('');
  const [lineModeFilter, setLineModeFilter] = useState('all');
  const [activeDirectoryLineId, setActiveDirectoryLineId] = useState<string>('');
  const [lineDirection, setLineDirection] = useState<'go' | 'return'>('go');
  const [showFareTableInDirectory, setShowFareTableInDirectory] = useState(false);

  // Add New Bus Line Modal
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [savingLine, setSavingLine] = useState(false);
  const [newLineForm, setNewLineForm] = useState({
    lineNumber: '',
    name: '',
    mode: 'bus',
    corridor: 'الكورنيش' as CorridorType,
    origin: '',
    destination: '',
    stopsText: '',
    boarding: '',
    exit: '',
    returnBoarding: '',
    returnExit: '',
    fare: ''
  });

  const allLines = useMemo(() => buildAllTransitLines(liveLines), [liveLines]);

  // Searchable places combining distinct corridor stops and general areas
  const searchableLocations = useMemo(() => {
    const items: {id: string; name: string; area: string; subtitle: string; lat: number; lng: number}[] = [];
    const seen = new Set<string>();

    // Add distinct area names first so users can type "سيدي بشر" or pick specific corridor
    for (const p of places) {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        items.push({
          id: p.id,
          name: p.name,
          area: p.name,
          subtitle: 'منطقة رئيسية — نقطة الركوب تتحدد تلقائيًا حسب الخط واتجاهه',
          lat: p.lat,
          lng: p.lng
        });
      }
    }

    // Add distinct corridor stops (e.g., سيدي بشر (الكورنيش) vs سيدي بشر (شارع أبو قير))
    for (const cs of CORRIDOR_STOPS) {
      if (!seen.has(cs.name)) {
        seen.add(cs.name);
        items.push({
          id: cs.id,
          name: cs.name,
          area: cs.area,
          subtitle: `${cs.corridor} · ${cs.landmark}`,
          lat: cs.lat,
          lng: cs.lng
        });
      }
    }

    // Add any custom stops from liveStops
    for (const ls of liveStops) {
      if (!ls.archived && ls.name && !seen.has(ls.name) && typeof ls.lat === 'number' && typeof ls.lng === 'number') {
        seen.add(ls.name);
        items.push({
          id: ls.id,
          name: ls.name,
          area: ls.name,
          subtitle: ls.landmark || 'محطة معتمدة',
          lat: ls.lat,
          lng: ls.lng
        });
      }
    }

    return items;
  }, [liveStops]);

  const journeyOptions: JourneyOption[] = useMemo(() => {
    if (!hasSearched || !from.trim() || !to.trim()) return [];
    return findJourneyOptions(from, to, liveLines);
  }, [hasSearched, from, to, liveLines]);

  const activeOption: JourneyOption | null = useMemo(() => {
    if (!journeyOptions.length) return null;
    return journeyOptions.find(o => o.id === selectedOptionId) || journeyOptions[0];
  }, [journeyOptions, selectedOptionId]);

  const activeDirectoryLine: TransitLineRecord | null = useMemo(() => {
    if (!activeDirectoryLineId) return null;
    return allLines.find(l => l.id === activeDirectoryLineId) || null;
  }, [allLines, activeDirectoryLineId]);

  // Compute routePoints for the Map: highlights ONLY the selected journey or selected directory line
  const activeMapRoutePoints: MapRoutePoint[] | undefined = useMemo(() => {
    if (subView === 'lines' && activeDirectoryLine) {
      const orderedStops = lineDirection === 'go'
        ? activeDirectoryLine.stops
        : [...activeDirectoryLine.stops].reverse();
      return orderedStops.map((sName, idx) => {
        const node = resolveStopNode(sName, activeDirectoryLine.corridor);
        return {
          id: node.id,
          name: node.name,
          lat: node.lat,
          lng: node.lng,
          kind: idx === 0 ? 'board' : idx === orderedStops.length - 1 ? 'exit' : 'stop',
          sublabel: activeDirectoryLine.name
        };
      });
    }
    if (activeOption) {
      return activeOption.routePoints;
    }
    return undefined;
  }, [subView, activeDirectoryLine, lineDirection, activeOption]);

  function handleSearch() {
    if (!from.trim() || !to.trim()) {
      notify('اختار «هتتحرك منين؟» و«رايح فين؟» الأول');
      return;
    }
    if (normalize(canonicalAreaName(from)) === normalize(canonicalAreaName(to))) {
      notify('نقطة البداية والوصول في نفس المنطقة — اختار وجهة مختلفة');
      return;
    }
    setFocusedField('');
    setHasSearched(true);
    setSubView('planner');
    setSelectedOptionId('');
    setShowRideDetails(false);
    setShowOtherRoutes(false);
    setExpandedStopsLegs({});
    setSheetExpanded(true);
    setFocusCoord(null);

    const pair = `${canonicalAreaName(from)} ← ${canonicalAreaName(to)}`;
    const nextRecent = [pair, ...recent].filter((x, i, a) => a.indexOf(x) === i).slice(0, 6);
    setRecent(nextRecent);
    try {
      localStorage.setItem('at-recent', JSON.stringify(nextRecent));
    } catch {}
  }

  function focusOnMap(lat: number, lng: number, label: string) {
    setFocusCoord({lat, lng, label});
    window.scrollTo({top: 0, behavior: 'smooth'});
    notify(`تم تحديد موقع «${label}» على الخريطة`);
  }

  // Saved shortcuts combining saved journeys and recent searches
  const savedTripShortcuts = useMemo(() => {
    const pairs: {label: string; from: string; to: string}[] = [];
    for (const s of saved) {
      const cleaned = s.replace(/^تجربة:\s*/, '').replace(/^دليل قيد المراجعة:\s*/, '').split(' (')[0];
      if (cleaned.includes(' ← ')) {
        const [a, b] = cleaned.split(' ← ').map(x => x.trim());
        if (a && b) pairs.push({label: `${a} ← ${b}`, from: a, to: b});
      }
    }
    for (const r of recent) {
      if (r.includes(' ← ')) {
        const [a, b] = r.split(' ← ').map(x => x.trim());
        if (a && b && !pairs.some(p => p.label === `${a} ← ${b}`)) {
          pairs.push({label: `${a} ← ${b}`, from: a, to: b});
        }
      }
    }
    if (pairs.length === 0) {
      return [
        {label: 'سيدي بشر ← محطة الرمل', from: 'سيدي بشر', to: 'محطة الرمل'},
        {label: 'محطة مصر ← أبو قير', from: 'محطة مصر', to: 'أبو قير'},
        {label: 'الموقف الجديد ← المنشية', from: 'الموقف الجديد', to: 'المنشية'},
        {label: 'سموحة ← بحري', from: 'سموحة', to: 'بحري'}
      ];
    }
    return pairs.slice(0, 5);
  }, [saved, recent]);

  // Nearby stops filtered by area (showing separate Corniche vs Abu Qir St stops!)
  const nearbyCorridorStops = useMemo(() => {
    const q = normalize(nearbyAreaFilter);
    const list = CORRIDOR_STOPS.filter(
      s => !q || normalize(s.area).includes(q) || normalize(s.name).includes(q) || normalize(s.corridor).includes(q)
    );
    return (list.length ? list : CORRIDOR_STOPS).map(stop => {
      const passingLines = allLines.filter(
        l =>
          l.stops.some(st => normalize(st) === normalize(stop.area)) &&
          (l.corridor === stop.corridor || stop.corridor === 'وسط البلد' || stop.corridor === 'غرب والعجمي')
      );
      return {stop, passingLines};
    });
  }, [nearbyAreaFilter, allLines]);

  // Filtered lines for "كل الخطوط"
  const filteredLines = useMemo(() => {
    const q = normalize(lineQuery).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    return allLines.filter(l => {
      if (lineModeFilter !== 'all' && l.mode !== lineModeFilter) return false;
      if (!q) return true;
      const haystack = normalize(
        [l.lineNumber || '', l.name, l.origin, l.destination, l.corridor, l.boarding, l.exit, ...l.stops].join(' ')
      );
      return haystack.includes(q);
    });
  }, [allLines, lineQuery, lineModeFilter]);

  async function handleAddBusLineSubmit(e: React.FormEvent) {
    e.preventDefault();
    const stopsArr = newLineForm.stopsText
      .split(/[\n،,|]/)
      .map(s => s.trim())
      .filter(Boolean);
    if (stopsArr.length < 2) {
      notify('اكتب محطتين على الأقل في خط السير');
      return;
    }
    setSavingLine(true);
    try {
      const origin = newLineForm.origin.trim() || stopsArr[0];
      const destination = newLineForm.destination.trim() || stopsArr[stopsArr.length - 1];
      const lineNum = newLineForm.lineNumber.trim();
      const autoName = newLineForm.name.trim() || (
        lineNum
          ? `أتوبيس ${lineNum} — ${origin} / ${destination} (${newLineForm.corridor})`
          : `${origin} / ${destination} — ${newLineForm.corridor}`
      );
      const id = lineNum ? `bus-${lineNum}-${Date.now().toString(36)}` : `line-${Date.now().toString(36)}`;
      await call('adminSave', {
        collection: 'transport_lines',
        id,
        record: {
          lineNumber: lineNum,
          name: autoName,
          mode: newLineForm.mode,
          corridor: newLineForm.corridor,
          origin,
          destination,
          stops: stopsArr,
          boarding: newLineForm.boarding.trim() || 'البيانات دي محتاجة تأكيد',
          exit: newLineForm.exit.trim() || 'البيانات دي محتاجة تأكيد',
          returnBoarding: newLineForm.returnBoarding.trim(),
          returnExit: newLineForm.returnExit.trim(),
          fare: newLineForm.fare.trim() ? Number(newLineForm.fare) : null,
          status: 'active',
          liveTrackingAvailable: false
        }
      });
      setShowAddBusModal(false);
      setNewLineForm({
        lineNumber: '',
        name: '',
        mode: 'bus',
        corridor: 'الكورنيش',
        origin: '',
        destination: '',
        stopsText: '',
        boarding: '',
        exit: '',
        returnBoarding: '',
        returnExit: '',
        fare: ''
      });
      onRefreshLines?.();
      notify('تم حفظ ونشر الخط الجديد أونلاين بنجاح');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'تأكد من تسجيل الدخول بحساب الأدمن لنشر الخط أونلاين');
    } finally {
      setSavingLine(false);
    }
  }

  function renderLocationInput(which: 'from' | 'to', label: string, placeholder: string) {
    const val = which === 'from' ? from : to;
    const setVal = which === 'from' ? setFrom : setTo;
    const isFocused = focusedField === which;
    const matches = val.trim()
      ? searchableLocations.filter(
          loc =>
            normalize(loc.name).includes(normalize(val)) ||
            normalize(loc.area).includes(normalize(val)) ||
            normalize(loc.subtitle).includes(normalize(val))
        ).slice(0, 7)
      : searchableLocations.slice(0, 7);

    return (
      <div className={`esk-search-field ${isFocused ? 'focused' : ''}`}>
        <span className={`esk-field-dot ${which}`} aria-hidden="true"/>
        <div className="esk-field-body">
          <label htmlFor={`esk-${which}`}>{label}</label>
          <input
            id={`esk-${which}`}
            autoComplete="off"
            value={val}
            placeholder={placeholder}
            onFocus={() => setFocusedField(which)}
            onChange={e => setVal(e.target.value)}
          />
        </div>
        {val && (
          <button
            type="button"
            className="icon-button esk-clear-btn"
            aria-label="مسح الخانة"
            onClick={() => setVal('')}
          >
            <X size={16}/>
          </button>
        )}
        {which === 'from' && (
          <button
            type="button"
            className="esk-locate-pill"
            title="استخدم موقعي الحالي"
            onClick={locate}
          >
            <LocateFixed size={15}/> موقعي
          </button>
        )}
        {isFocused && (
          <div className="esk-autocomplete" role="listbox">
            {matches.map(loc => (
              <button
                type="button"
                key={loc.id}
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  setVal(loc.area);
                  setFocusedField('');
                }}
              >
                <MapPin size={16}/>
                <div>
                  <strong>{loc.name}</strong>
                  <small>{loc.subtitle}</small>
                </div>
              </button>
            ))}
            {matches.length === 0 && (
              <p className="esk-autocomplete-empty">مفيش مكان بالاسم ده — جرّب اسم المنطقة الرئيسية مثل سيدي بشر أو محطة الرمل.</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="esk-transport-shell" onClick={() => focusedField && setFocusedField('')}>
      {/* Active alerts if any */}
      {liveAlerts
        .filter(a => !a.archived && a.active && (!a.expiresAt || Date.parse(a.expiresAt) > Date.now()))
        .map(a => (
          <div className="warning esk-alert-banner" key={a.id}>
            <AlertCircle size={18}/>
            <span><b>{a.name}:</b> {a.description}</span>
          </div>
        ))}

      {/* MAP STAGE + FLOATING TOP SEARCH OVERLAY */}
      <section className="esk-map-stage" onClick={e => e.stopPropagation()}>
        <div className="esk-map-canvas">
          <Suspense fallback={<div className="skeleton map-loading">بنجهز خريطة إسكندرية…</div>}>
            <MapView
              routePoints={activeMapRoutePoints}
              focusCoord={focusCoord}
              onStop={id => {
                const found = CORRIDOR_STOPS.find(s => s.id === id) || places.find(p => p.id === id);
                if (found) {
                  const areaName = String('area' in found ? found.area : found.name);
                  if (!from) setFrom(areaName);
                  else setTo(areaName);
                  notify(`اخترنا «${found.name}»`);
                }
              }}
            />
          </Suspense>

          <div className="esk-map-status-bar">
            <span>
              {activeMapRoutePoints && activeMapRoutePoints.length > 0
                ? `المعروض على الخريطة: مسار الرحلة المختارة فقط (${activeMapRoutePoints.length} محطات)`
                : 'خريطة مواصلات إسكندريلا · اختار مشوارك علشان نبرز مسارك بس'}
            </span>
            {focusCoord && (
              <button type="button" className="esk-reset-map-btn" onClick={() => setFocusCoord(null)}>
                عرض المسار كامل
              </button>
            )}
          </div>
        </div>

        {/* FLOATING SEARCH CARD ON TOP OF MAP */}
        <div className="esk-floating-search-card">
          <div className="esk-search-header">
            <div>
              <span className="esk-kicker">مواصلات إسكندريلا</span>
              <h1>رايح فين؟</h1>
            </div>
            <span className="esk-corridor-hint">نقطة الركوب بتتحدد حسب الخط واتجاهه (الكورنيش ≠ شارع أبو قير)</span>
          </div>

          <div className="esk-fields-stack">
            {renderLocationInput('from', 'هتتحرك منين؟', 'مثال: سيدي بشر، محطة مصر، سموحة…')}
            <button
              type="button"
              className="esk-swap-btn"
              title="بدّل البداية والوصول"
              onClick={() => {
                const temp = from;
                setFrom(to);
                setTo(temp);
              }}
            >
              <ArrowUpDown size={17}/>
            </button>
            {renderLocationInput('to', 'رايح فين؟', 'اختار وجهتك في إسكندرية…')}
          </div>

          {/* BIG YELLOW CTA BUTTON */}
          <button type="button" className="esk-yellow-cta" onClick={handleSearch}>
            <BusFront size={20}/>
            <span>وريني أركب إيه</span>
          </button>

          {/* SAVED / QUICK TRIP SHORTCUTS */}
          <div className="esk-shortcuts-row" aria-label="اختصارات المشاوير المحفوظة">
            <span className="esk-shortcuts-label"><Bookmark size={13}/> مشاوير سريعة ومحفوظة:</span>
            <div className="esk-shortcuts-chips">
              {savedTripShortcuts.map(item => (
                <button
                  type="button"
                  key={item.label}
                  className="esk-shortcut-chip"
                  onClick={() => {
                    setFrom(item.from);
                    setTo(item.to);
                    setFocusedField('');
                    setHasSearched(true);
                    setSubView('planner');
                    setSelectedOptionId('');
                    setShowRideDetails(false);
                    setShowOtherRoutes(false);
                    setSheetExpanded(true);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* TWO ADDITIONAL OPTIONS: مواقف قريبة & كل الخطوط */}
          <div className="esk-mode-switch-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={subView === 'planner'}
              className={subView === 'planner' ? 'active' : ''}
              onClick={() => setSubView('planner')}
            >
              <Compass size={16}/> تخطيط المشوار
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subView === 'nearby'}
              className={subView === 'nearby' ? 'active' : ''}
              onClick={() => setSubView('nearby')}
            >
              <MapPin size={16}/> مواقف قريبة
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subView === 'lines'}
              className={subView === 'lines' ? 'active' : ''}
              onClick={() => setSubView('lines')}
            >
              <BusFront size={16}/> كل الخطوط والأتوبيسات
            </button>
          </div>
        </div>
      </section>

      {/* DRAGGABLE / EXPANDABLE BOTTOM SHEET CARD */}
      <section
        className={`esk-bottom-sheet ${sheetExpanded ? 'expanded' : ''}`}
        aria-live="polite"
      >
        <button
          type="button"
          className="esk-sheet-handle"
          onClick={() => setSheetExpanded(!sheetExpanded)}
          aria-label={sheetExpanded ? 'تصغير كارت الرحلة' : 'سحب كارت الرحلة لفوق'}
        >
          <span className="esk-sheet-pill"/>
          <small>
            {sheetExpanded ? 'اسحب لتحت أو اضغط لتصغير الكارت' : 'اسحب لفوق لعرض كل التفاصيل'}
            {sheetExpanded ? <ChevronDown size={15}/> : <ChevronUp size={15}/>}
          </small>
        </button>

        {/* SUBVIEW 1: TRIP PLANNER RESULTS (PROGRESSIVE DISCLOSURE) */}
        {subView === 'planner' && (
          <div className="esk-sheet-content">
            {!hasSearched ? (
              <div className="esk-initial-prompt">
                <div>
                  <h2>اكتب «هتتحرك منين؟» و«رايح فين؟» واضغط «وريني أركب إيه»</h2>
                  <p>
                    هيظهرلك طريق مقترح واحد مختصر في الأول، ولما تحتاج تفاصيل الركوب بالمعلم واتجاه الشارع أو مقارنة الطرق التانية هتفتحهم بضغطة واحدة.
                  </p>
                </div>
                <div className="esk-corridor-callout">
                  <strong>ليه فصلنا الكورنيش عن شارع أبو قير؟</strong>
                  <p>
                    في مناطق زي سيدي بشر وسيدي جابر والعصافرة والمندرة، خطوط الكورنيش ليها نقطة ركوب منفصلة تمامًا عن خطوط شارع أبو قير والترام. إسكندريلا بيحددلك نقطة الركوب الصح حسب الخط واتجاهه.
                  </p>
                </div>
              </div>
            ) : journeyOptions.length > 0 && activeOption ? (
              <div className="esk-journey-result-wrap">
                {/* STAGE 1: CONCISE SUGGESTED ROUTE CARD */}
                <article className="esk-primary-route-card">
                  <div className="esk-route-header-line">
                    <span className="esk-route-from-to">
                      من <b>{activeOption.fromArea}</b> إلى <b>{activeOption.toArea}</b>
                    </span>
                    <button
                      type="button"
                      className="esk-save-trip-btn"
                      onClick={() => save(`${activeOption.fromArea} ← ${activeOption.toArea}`)}
                    >
                      {saved.includes(`${activeOption.fromArea} ← ${activeOption.toArea}`) ? <Check size={15}/> : <Bookmark size={15}/>}
                      حفظ المشوار
                    </button>
                  </div>

                  <div className="esk-route-main-line">
                    <span className="esk-bus-emoji" aria-hidden="true">🚐</span>
                    <div>
                      <h3>
                        {activeOption.summaryLineTitle}
                        {' · '}
                        <span className="esk-transfer-badge">
                          {activeOption.transfers === 0 ? 'مباشر' : `تبديلة واحدة (${activeOption.transfers})`}
                        </span>
                      </h3>
                      <p className="esk-corridor-sub">{activeOption.corridorSummary}</p>
                    </div>
                  </div>

                  <div className="esk-route-fare-line">
                    <span>الأجرة: <b>{activeOption.fareSummary}</b></span>
                    <span className="esk-live-honesty">
                      {activeOption.legs.some(l => l.line.liveTrackingAvailable)
                        ? 'متاح تتبع حي للخط'
                        : 'التتبع الحي وموعد وصول الأتوبيس يظهران عند توفر مصدر فعلي'}
                    </span>
                  </div>

                  <div className="esk-route-action-row">
                    <button
                      type="button"
                      className={`esk-btn-details ${showRideDetails ? 'active' : ''}`}
                      onClick={() => {
                        setShowRideDetails(!showRideDetails);
                        setSheetExpanded(true);
                      }}
                    >
                      {showRideDetails ? 'إخفاء تفاصيل الركوب' : 'تفاصيل الركوب'}
                    </button>
                    {journeyOptions.length > 1 && (
                      <button
                        type="button"
                        className={`esk-btn-alternatives ${showOtherRoutes ? 'active' : ''}`}
                        onClick={() => {
                          setShowOtherRoutes(!showOtherRoutes);
                          setSheetExpanded(true);
                        }}
                      >
                        طرق تانية ({journeyOptions.length - 1})
                      </button>
                    )}
                  </div>
                </article>

                {/* STAGE 1.5: OTHER ROUTES COMPARISON (الأسرع / الأرخص / أقل تبديلات) */}
                {showOtherRoutes && (
                  <div className="esk-alternatives-drawer">
                    <div className="esk-alternatives-header">
                      <h4>قارن بين الطرق المتاحة للمشوار ده</h4>
                      <div className="esk-compare-tabs">
                        {[
                          ['all', 'كل البدائل'],
                          ['fastest', 'الأسرع (أقل محطات)'],
                          ['cheapest', 'الأرخص'],
                          ['fewest_transfers', 'أقل تبديلات']
                        ].map(([id, label]) => (
                          <button
                            type="button"
                            key={id}
                            className={compareFilter === id ? 'active' : ''}
                            onClick={() => setCompareFilter(id as any)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="esk-alternatives-list">
                      {journeyOptions
                        .filter(opt => compareFilter === 'all' || opt.tags.includes(compareFilter as any))
                        .map(opt => (
                          <button
                            type="button"
                            key={opt.id}
                            className={`esk-alt-option-card ${opt.id === activeOption.id ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedOptionId(opt.id);
                              setShowRideDetails(true);
                              setFocusCoord(null);
                            }}
                          >
                            <div className="esk-alt-top">
                              <strong>🚐 {opt.summaryLineTitle}</strong>
                              <span>{opt.transfers === 0 ? 'مباشر' : `${opt.transfers} تبديلة`}</span>
                            </div>
                            <div className="esk-alt-meta">
                              <span>المسار: {opt.legs[0].line.corridor}</span>
                              <span>·</span>
                              <span>نقطة الركوب: {opt.legs[0].boardNode.name}</span>
                              <span>·</span>
                              <span>الأجرة: {opt.fareSummary}</span>
                            </div>
                            <div className="esk-alt-tags">
                              {opt.tags.includes('fastest') && <span>الأسرع ({opt.stopCount} محطات)</span>}
                              {opt.tags.includes('cheapest') && <span>الأرخص</span>}
                              {opt.tags.includes('fewest_transfers') && <span>أقل تبديلات</span>}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* STAGE 2: ORDERED STEP-BY-STEP RIDE DETAILS (تفاصيل الركوب بالترتيب) */}
                {showRideDetails && (
                  <div className="esk-ordered-steps-container">
                    <h4>خطوات الركوب بالترتيب</h4>

                    {activeOption.legs.map((leg, legIdx) => {
                      const isExpandedStops = Boolean(expandedStopsLegs[legIdx]);
                      const previewStops = isExpandedStops
                        ? leg.stopsAlongLeg
                        : leg.stopsAlongLeg.slice(0, 3);
                      const isFirstLeg = legIdx === 0;
                      const isLastLeg = legIdx === activeOption.legs.length - 1;
                      const nextLeg = activeOption.legs[legIdx + 1];

                      return (
                        <div key={leg.line.id + legIdx} className="esk-leg-steps-group">
                          {/* STEP 1: روح نقطة الركوب (shown on first leg) */}
                          {isFirstLeg && (
                            <div className="esk-step-card step-board">
                              <div className="esk-step-badge">١</div>
                              <div className="esk-step-body">
                                <h5>🚶 روح نقطة الركوب — {leg.boardNode.name}</h5>
                                <p><b>المعلم المحدد:</b> {leg.boardLandmark}</p>
                                <p><b>اتجاه الشارع والرصيف:</b> {leg.boardStreetSide}</p>
                                <button
                                  type="button"
                                  className="esk-map-pin-btn"
                                  onClick={() => focusOnMap(leg.boardNode.lat, leg.boardNode.lng, leg.boardNode.name)}
                                >
                                  <MapPin size={15}/> افتح مكانها على الخريطة
                                </button>
                              </div>
                            </div>
                          )}

                          {/* STEP 2: اركب الخط ده */}
                          <div className="esk-step-card step-ride">
                            <div className="esk-step-badge">{isFirstLeg ? '٢' : '٤-ب'}</div>
                            <div className="esk-step-body">
                              <div className="esk-step-line-head">
                                {leg.line.lineNumber && (
                                  <span className="esk-bus-num-badge">خط {leg.line.lineNumber}</span>
                                )}
                                <h5>🚐 اركب الخط ده — {leg.line.name}</h5>
                              </div>
                              <p><b>الاتجاه:</b> {leg.directionLabel}</p>
                              <p><b>الأجرة:</b> {leg.legFareNote}</p>
                            </div>
                          </div>

                          {/* STEP 3: هتعدّي على إيه؟ */}
                          <div className="esk-step-card step-stops">
                            <div className="esk-step-badge">{isFirstLeg ? '٣' : '٤-ج'}</div>
                            <div className="esk-step-body">
                              <div className="esk-step-stops-head">
                                <h5>📍 هتعدّي على إيه؟ ({leg.stopsAlongLeg.length} محطات)</h5>
                                {leg.stopsAlongLeg.length > 3 && (
                                  <button
                                    type="button"
                                    className="esk-expand-stops-btn"
                                    onClick={() =>
                                      setExpandedStopsLegs(prev => ({
                                        ...prev,
                                        [legIdx]: !prev[legIdx]
                                      }))
                                    }
                                  >
                                    {isExpandedStops ? 'اختصار المحطات' : `شوف كل المحطات (${leg.stopsAlongLeg.length})`}
                                  </button>
                                )}
                              </div>
                              <ol className="esk-stops-timeline">
                                {previewStops.map((stopName, sIdx) => {
                                  const sNode = resolveStopNode(stopName, leg.line.corridor);
                                  return (
                                    <li key={sIdx}>
                                      <span className="esk-timeline-dot"/>
                                      <div>
                                        <strong>{sNode.name}</strong>
                                        <small>{sNode.landmark}</small>
                                      </div>
                                    </li>
                                  );
                                })}
                                {!isExpandedStops && leg.stopsAlongLeg.length > 3 && (
                                  <li className="esk-more-stops-hint">
                                    <span>… وباقي المحطات حتى {leg.toArea}</span>
                                  </li>
                                )}
                              </ol>
                            </div>
                          </div>

                          {/* STEP 4: بدّل هنا (if there is a transfer to nextLeg — separate Exit and Next Boarding!) */}
                          {nextLeg && (
                            <div className="esk-step-card step-transfer">
                              <div className="esk-step-badge">٤</div>
                              <div className="esk-step-body">
                                <h5>🔄 بدّل هنا في {leg.toArea}</h5>
                                <div className="esk-transfer-split">
                                  <div className="esk-transfer-box exit-box">
                                    <small>أولًا: نقطة النزول من الخط الأول ({leg.line.name})</small>
                                    <strong>{leg.exitNode.name}</strong>
                                    <p>{leg.exitLandmark}</p>
                                    <button
                                      type="button"
                                      className="esk-map-pin-btn"
                                      onClick={() => focusOnMap(leg.exitNode.lat, leg.exitNode.lng, leg.exitNode.name)}
                                    >
                                      <MapPin size={14}/> موقع النزول على الخريطة
                                    </button>
                                  </div>
                                  <div className="esk-transfer-box board-box">
                                    <small>ثانيًا: نقطة الركوب للخط التاني ({nextLeg.line.name})</small>
                                    <strong>{nextLeg.boardNode.name}</strong>
                                    <p>{nextLeg.boardLandmark}</p>
                                    <p><b>اتجاه الشارع:</b> {nextLeg.boardStreetSide}</p>
                                    <button
                                      type="button"
                                      className="esk-map-pin-btn"
                                      onClick={() => focusOnMap(nextLeg.boardNode.lat, nextLeg.boardNode.lng, nextLeg.boardNode.name)}
                                    >
                                      <MapPin size={14}/> موقع الركوب التاني على الخريطة
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* STEP 5: انزل هنا (shown on last leg) */}
                          {isLastLeg && (
                            <div className="esk-step-card step-exit">
                              <div className="esk-step-badge">{activeOption.transfers > 0 ? '٥' : '٤'}</div>
                              <div className="esk-step-body">
                                <h5>🏁 انزل هنا — {leg.exitNode.name}</h5>
                                <p><b>مكان النزول بالمعلم:</b> {leg.exitLandmark}</p>
                                <p><b>الوصول للوجهة ({activeOption.toArea}):</b> بعد النزول عند المعلم، اتجه مباشرة لوجهتك في {activeOption.toArea}.</p>
                                <button
                                  type="button"
                                  className="esk-map-pin-btn"
                                  onClick={() => focusOnMap(leg.exitNode.lat, leg.exitNode.lng, leg.exitNode.name)}
                                >
                                  <MapPin size={15}/> افتح مكان النزول على الخريطة
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="esk-no-route-card">
                <h3>البيانات دي محتاجة تأكيد للمشوار ده</h3>
                <p>
                  لسه معندناش خط مباشر أو تبديلة مؤكدة بين «{from}» و«{to}» في قاعدة البيانات الحالية. تقدر تراجع تعريفات الجداول المتاحة أو تفتح «كل الخطوط» لإضافة خط جديد.
                </p>
                <SourceFareMatches from={from} to={to}/>
              </div>
            )}
          </div>
        )}

        {/* SUBVIEW 2: NEARBY STOPS (مواقف قريبة — منفصلة حسب الكورنيش وشارع أبو قير) */}
        {subView === 'nearby' && (
          <div className="esk-sheet-content">
            <div className="esk-subview-header">
              <div>
                <h2>مواقف ونقط ركوب قريبة</h2>
                <p>نقط الركوب مفصولة حسب المسار (الكورنيش مستقل عن شارع أبو قير والترام ومحور المحمودية).</p>
              </div>
              <div className="esk-nearby-filter">
                <input
                  aria-label="فلتر المنطقة للمواقف القريبة"
                  placeholder="ابحث بالمنطقة (مثل: سيدي بشر، سيدي جابر، محطة الرمل)…"
                  value={nearbyAreaFilter}
                  onChange={e => setNearbyAreaFilter(e.target.value)}
                />
                <button type="button" className="secondary" onClick={locate}>
                  <LocateFixed size={16}/> أقرب منطقة لموقعي
                </button>
              </div>
            </div>

            <div className="esk-nearby-grid">
              {nearbyCorridorStops.map(({stop, passingLines}) => (
                <article key={stop.id} className="esk-nearby-stop-card">
                  <div className="esk-nearby-stop-top">
                    <div>
                      <span className="esk-corridor-tag">{stop.corridor}</span>
                      <h3>{stop.name}</h3>
                    </div>
                    <button
                      type="button"
                      className="esk-open-map-btn"
                      onClick={() => focusOnMap(stop.lat, stop.lng, stop.name)}
                    >
                      <MapPin size={15}/> افتح على الخريطة
                    </button>
                  </div>
                  <p className="esk-nearby-landmark"><b>المعلم:</b> {stop.landmark}</p>
                  <div className="esk-nearby-directions">
                    <small><b>اتجاه غرب البلد (محطة الرمل / المنشية / محطة مصر):</b> {stop.streetSideTowardsWest}</small>
                    <small><b>اتجاه شرق البلد (سيدي بشر / المندرة / أبو قير):</b> {stop.streetSideTowardsEast}</small>
                  </div>
                  <div className="esk-passing-lines">
                    <small>الخطوط والأتوبيسات اللي بتعدي من هنا ({passingLines.length}):</small>
                    <div className="esk-passing-chips">
                      {passingLines.slice(0, 6).map(line => (
                        <button
                          type="button"
                          key={line.id}
                          className="esk-line-mini-chip"
                          onClick={() => {
                            setActiveDirectoryLineId(line.id);
                            setSubView('lines');
                            setFocusCoord(null);
                          }}
                        >
                          {line.lineNumber ? `أتوبيس ${line.lineNumber}` : line.name}
                        </button>
                      ))}
                      {passingLines.length === 0 && <span>البيانات دي محتاجة تأكيد</span>}
                    </div>
                  </div>
                  <div className="esk-nearby-use-btns">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setFrom(stop.area);
                        setSubView('planner');
                        notify(`حددنا البداية: ${stop.name}`);
                      }}
                    >
                      ابدأ مشوارك من هنا
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setTo(stop.area);
                        setSubView('planner');
                        notify(`حددنا الوجهة: ${stop.name}`);
                      }}
                    >
                      خلّيها وجهتك
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* SUBVIEW 3: ALL LINES & BUS NUMBERS + FARE TABLE INSIDE DIRECTORY (كل الخطوط + جدول الأسعار) */}
        {subView === 'lines' && (
          <div className="esk-sheet-content">
            <div className="esk-subview-header">
              <div>
                <h2>كل الخطوط وأرقام الأتوبيسات</h2>
                <p>دليل خطوط الأتوبيسات بأرقامها، الميكروباص، الميني باص، الترام، والقطار — مع جدول الأسعار بالداخل.</p>
              </div>
              <div className="esk-lines-header-actions">
                <button
                  type="button"
                  className="esk-add-bus-btn"
                  onClick={() => setShowAddBusModal(true)}
                >
                  <Plus size={16}/> أضف خط أتوبيس أو مواصلة برقمها
                </button>
                {showFaresSetting && (
                  <button
                    type="button"
                    className={`secondary ${showFareTableInDirectory ? 'active' : ''}`}
                    onClick={() => setShowFareTableInDirectory(!showFareTableInDirectory)}
                  >
                    <FileText size={16}/> {showFareTableInDirectory ? 'إخفاء جدول الأسعار' : 'جدول الأسعار والتعريفات'}
                  </button>
                )}
              </div>
            </div>

            <div className="esk-lines-toolbar">
              <label className="catalog-search">
                <Search size={18}/>
                <input
                  aria-label="ابحث برقم الأتوبيس أو اسم الخط أو المنطقة"
                  placeholder="ابحث برقم الأتوبيس (مثل 11، 20، 260، 732) أو اسم المنطقة…"
                  value={lineQuery}
                  onChange={e => setLineQuery(e.target.value)}
                />
              </label>
              <div className="filter-row">
                <button
                  type="button"
                  className={lineModeFilter === 'all' ? 'active' : ''}
                  onClick={() => setLineModeFilter('all')}
                >
                  الكل ({allLines.length})
                </button>
                {modes.filter(m => m.id !== 'metro').map(m => (
                  <button
                    type="button"
                    key={m.id}
                    className={lineModeFilter === m.id ? 'active' : ''}
                    onClick={() => setLineModeFilter(m.id)}
                  >
                    <ModeBadgeIcon mode={m.id} size={15}/> {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Line Interactive Detail (inspired by Screenshot 3: Go/Return toggle + Stop list + Map highlight) */}
            {activeDirectoryLine && (
              <article className="esk-selected-line-panel">
                <div className="esk-selected-line-banner">
                  <div className="esk-selected-line-title">
                    {activeDirectoryLine.lineNumber && (
                      <span className="esk-big-line-num">{activeDirectoryLine.lineNumber}</span>
                    )}
                    <div>
                      <small>{modes.find(m => m.id === activeDirectoryLine.mode)?.name} · مسار {activeDirectoryLine.corridor}</small>
                      <h3>{activeDirectoryLine.name}</h3>
                    </div>
                  </div>
                  <div className="esk-selected-line-actions">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="حفظ الخط"
                      onClick={() => save(activeDirectoryLine.name)}
                    >
                      <Bookmark size={18}/>
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="إغلاق تفاصيل الخط"
                      onClick={() => setActiveDirectoryLineId('')}
                    >
                      <X size={18}/>
                    </button>
                  </div>
                </div>

                <div className="esk-direction-bar">
                  <div className="esk-go-return-toggle">
                    <button
                      type="button"
                      className={lineDirection === 'go' ? 'active' : ''}
                      onClick={() => setLineDirection('go')}
                    >
                      ذهاب ({activeDirectoryLine.origin} ← {activeDirectoryLine.destination})
                    </button>
                    <button
                      type="button"
                      className={lineDirection === 'return' ? 'active' : ''}
                      onClick={() => setLineDirection('return')}
                    >
                      عودة ({activeDirectoryLine.destination} ← {activeDirectoryLine.origin})
                    </button>
                  </div>
                  <div className="esk-selected-line-fare">
                    الأجرة: <b>{activeDirectoryLine.fare != null ? `${activeDirectoryLine.fare} جنيه` : 'البيانات دي محتاجة تأكيد'}</b>
                  </div>
                </div>

                <div className="esk-line-endpoints-box">
                  <div>
                    <small>🚶 نقطة الركوب في الاتجاه ده:</small>
                    <p>
                      {lineDirection === 'go'
                        ? activeDirectoryLine.boarding || 'البيانات دي محتاجة تأكيد'
                        : activeDirectoryLine.returnBoarding || `من ${activeDirectoryLine.destination} اتجاه ${activeDirectoryLine.origin} (${activeDirectoryLine.corridor}) — البيانات الدقيقة محتاجة تأكيد`}
                    </p>
                  </div>
                  <div>
                    <small>🏁 نقطة النزول النهائية:</small>
                    <p>
                      {lineDirection === 'go'
                        ? activeDirectoryLine.exit || 'البيانات دي محتاجة تأكيد'
                        : activeDirectoryLine.returnExit || activeDirectoryLine.boarding || 'البيانات دي محتاجة تأكيد'}
                    </p>
                  </div>
                </div>

                <div className="esk-line-stops-table">
                  <div className="esk-line-stops-header">
                    <span>ترتيب المحطات ونقط الركوب ({activeDirectoryLine.stops.length})</span>
                    <span>حالة التوقيت</span>
                  </div>
                  <ol className="esk-line-stops-list">
                    {(lineDirection === 'go' ? activeDirectoryLine.stops : [...activeDirectoryLine.stops].reverse()).map((stopName, idx) => {
                      const stopNode = resolveStopNode(stopName, activeDirectoryLine.corridor);
                      return (
                        <li key={`${stopName}-${idx}`}>
                          <div className="esk-stop-row-main">
                            <span className="esk-stop-circle"/>
                            <div>
                              <strong>{stopNode.name}</strong>
                              <small>{stopNode.landmark}</small>
                            </div>
                          </div>
                          <div className="esk-stop-row-right">
                            <span className="esk-stop-eta-note">
                              {activeDirectoryLine.liveTrackingAvailable ? 'تتبع حي متاح' : 'حسب التوافر الميداني'}
                            </span>
                            <button
                              type="button"
                              className="esk-mini-map-btn"
                              onClick={() => focusOnMap(stopNode.lat, stopNode.lng, stopNode.name)}
                            >
                              الخريطة
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </article>
            )}

            {/* All Lines Cards Grid (like Screenshot 2 & 3) */}
            <div className="esk-lines-grid">
              {filteredLines.map(line => (
                <article
                  key={line.id}
                  className={`esk-line-card ${activeDirectoryLineId === line.id ? 'selected' : ''}`}
                >
                  <div className="esk-line-card-top">
                    <div className="esk-line-badge-group">
                      <span className="esk-line-icon">
                        <ModeBadgeIcon mode={line.mode} size={19}/>
                      </span>
                      {line.lineNumber && (
                        <span className="esk-line-number-pill">خط {line.lineNumber}</span>
                      )}
                      <span className="esk-corridor-tag">{line.corridor}</span>
                    </div>
                    <span className="esk-line-fare-tag">
                      {line.fare != null ? `${line.fare} ج` : 'الأجرة محتاجة تأكيد'}
                    </span>
                  </div>

                  <h3>{line.name}</h3>
                  <p className="esk-line-route-text">
                    من <b>{line.origin}</b> إلى <b>{line.destination}</b> · يمر على: {line.stops.slice(0, 5).join('، ')}
                    {line.stops.length > 5 ? ` (+${line.stops.length - 5} محطات)` : ''}
                  </p>

                  <div className="esk-line-card-footer">
                    <button
                      type="button"
                      className="esk-btn-details"
                      onClick={() => {
                        setActiveDirectoryLineId(line.id);
                        setLineDirection('go');
                        setFocusCoord(null);
                      }}
                    >
                      تفاصيل المحطات والمسار على الخريطة
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setFrom(line.origin);
                        setTo(line.destination);
                        setHasSearched(true);
                        setSubView('planner');
                        setSheetExpanded(true);
                      }}
                    >
                      خطط رحلة عليه
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Official Bus Reference & Fare Table inside Lines Directory */}
            <div className="esk-directory-extras">
              <InternetTransport/>
              {showFaresSetting && (
                <div className="esk-fare-catalog-inside">
                  <SourceCatalog/>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* MODAL FOR ADDING A BUS LINE WITH ITS NUMBER */}
      {showAddBusModal && (
        <div className="modal-overlay" onClick={() => setShowAddBusModal(false)}>
          <div
            className="modal card esk-add-bus-modal"
            role="dialog"
            aria-modal="true"
            aria-label="إضافة خط أتوبيس أو مواصلة برقمها"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              className="close icon-button"
              aria-label="إغلاق"
              onClick={() => setShowAddBusModal(false)}
            >
              <X/>
            </button>
            <h2>إضافة خط أتوبيس أو مواصلة برقمها</h2>
            <p>أضف رقم الأتوبيس أو الخط، المسار (الكورنيش أو شارع أبو قير)، نقط الركوب والنزول، والمحطات بالترتيب.</p>

            <form onSubmit={handleAddBusLineSubmit}>
              <div className="admin-field-grid">
                <label>
                  رقم الخط (للأتوبيس أو الميني باص)
                  <input
                    placeholder="مثال: 11، 20، 260، 732"
                    value={newLineForm.lineNumber}
                    onChange={e => setNewLineForm({...newLineForm, lineNumber: e.target.value})}
                  />
                </label>
                <label>
                  وسيلة النقل
                  <select
                    value={newLineForm.mode}
                    onChange={e => setNewLineForm({...newLineForm, mode: e.target.value})}
                  >
                    {modes.filter(m => m.id !== 'metro').map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  المسار الرئيسي (لتحديد نقطة الركوب)
                  <select
                    value={newLineForm.corridor}
                    onChange={e => setNewLineForm({...newLineForm, corridor: e.target.value as CorridorType})}
                  >
                    <option value="الكورنيش">طريق الكورنيش</option>
                    <option value="شارع أبو قير">شارع أبو قير (الحرية)</option>
                    <option value="الترام">مسار الترام</option>
                    <option value="المحمودية / قبلي">محور المحمودية / قبلي</option>
                    <option value="وسط البلد">وسط البلد</option>
                    <option value="غرب والعجمي">غرب الإسكندرية والعجمي</option>
                    <option value="العامرية وبرج العرب">العامرية وبرج العرب</option>
                  </select>
                </label>
                <label>
                  سعر الأجرة بالجنيه (اختياري)
                  <input
                    type="number"
                    step="0.5"
                    placeholder="اتركه فارغًا لو محتاج تأكيد"
                    value={newLineForm.fare}
                    onChange={e => setNewLineForm({...newLineForm, fare: e.target.value})}
                  />
                </label>
                <label>
                  بداية الخط
                  <input
                    required
                    placeholder="مثال: بحري أو محطة مصر"
                    value={newLineForm.origin}
                    onChange={e => setNewLineForm({...newLineForm, origin: e.target.value})}
                  />
                </label>
                <label>
                  نهاية الخط
                  <input
                    required
                    placeholder="مثال: سيدي بشر أو أبو قير"
                    value={newLineForm.destination}
                    onChange={e => setNewLineForm({...newLineForm, destination: e.target.value})}
                  />
                </label>
                <label className="wide">
                  اسم الخط (اختياري — بيتكون تلقائيًا لو تركته فارغًا)
                  <input
                    placeholder="مثال: أتوبيس 260 — الأنفوشي / أبو قير (الكورنيش)"
                    value={newLineForm.name}
                    onChange={e => setNewLineForm({...newLineForm, name: e.target.value})}
                  />
                </label>
                <label className="wide">
                  المحطات بالترتيب (افصل بين كل محطة بفاصلة أو سطر جديد)
                  <textarea
                    required
                    placeholder="بحري، المنشية، محطة الرمل، سيدي جابر، سان ستيفانو، سيدي بشر، ميامي، العصافرة، المندرة"
                    value={newLineForm.stopsText}
                    onChange={e => setNewLineForm({...newLineForm, stopsText: e.target.value})}
                  />
                </label>
                <label className="wide">
                  نقطة الركوب بالمعلم واتجاه الشارع
                  <input
                    placeholder="مثال: أمام مسجد سيدي بشر على الكورنيش اتجاه المنشية"
                    value={newLineForm.boarding}
                    onChange={e => setNewLineForm({...newLineForm, boarding: e.target.value})}
                  />
                </label>
                <label className="wide">
                  نقطة النزول بالمعلم
                  <input
                    placeholder="مثال: ميدان محطة الرمل أمام الغرفة التجارية"
                    value={newLineForm.exit}
                    onChange={e => setNewLineForm({...newLineForm, exit: e.target.value})}
                  />
                </label>
              </div>
              <button type="submit" className="esk-yellow-cta" disabled={savingLine}>
                {savingLine ? 'جاري النشر أونلاين…' : 'حفظ ونشر الخط أونلاين'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
