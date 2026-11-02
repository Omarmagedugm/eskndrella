import SideNavigation from './SideNavigation';
import TransportHub from './TransportHub';
import { geography } from './adminModel';
import CityHub, { cityTabs } from './CityHub';
import AdminDashboard from './AdminDashboard';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  BusFront,
  TramFront,
  Home,
  Map as MapIcon,
  Bookmark,
  UserRound,
  Bell,
  ChevronLeft,
  Sun,
  Moon,
  LocateFixed,
  ShieldCheck,
  X,
  LogOut,
  Menu,
  Info,
  ArrowUpLeft,
  ExternalLink,
} from 'lucide-react';
import { places, modes, statuses, normalize } from './data';
import {
  auth,
  login,
  logout,
  emailLogin,
  call,
  firebaseReady,
  loadLines,
  loadEdges,
  loadPublic,
  subscribeLines,
  subscribePublic,
  syncLocalDraftsToCloud,
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { plan, Edge } from './routing';

const tabs = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'map', label: 'الخريطة', icon: MapIcon },
  { id: 'directory', label: 'المواصلات', icon: BusFront },
  { id: 'saved', label: 'المحفوظات', icon: Bookmark },
  { id: 'profile', label: 'حسابي', icon: UserRound },
];

function Logo({ src }: { src?: string }) {
  return (
    <div className="logo city-logo">
      <img src={src || '/brand/eskendrella.png'} alt="شعار إسكندريلا" />
    </div>
  );
}

const IconMode = ({ id, size = 22 }: { id: string; size?: number }) =>
  ['blue', 'yellow', 'train', 'metro'].includes(id) ? <TramFront size={size} /> : <BusFront size={size} />;

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem('at-saved') || '[]');
  } catch {
    return [];
  }
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState('city');
  const [dark, setDark] = useState(localStorage.getItem('at-dark') === 'true');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [focused, setFocused] = useState('');
  const [pref, setPref] = useState('fastest');
  const [results, setResults] = useState(false);
  const [demo, setDemo] = useState(false);
  const [selected, setSelected] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState('');
  const [toast, setToast] = useState('');
  const [saved, setSaved] = useState<string[]>(readSaved);
  const [user, setUser] = useState<User | null>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [computed, setComputed] = useState<ReturnType<typeof plan>>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [splash, setSplash] = useState(!sessionStorage.getItem('at-loaded'));
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [liveStops, setLiveStops] = useState<any[]>([]);
  const [liveModes, setLiveModes] = useState<any[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('at-recent') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    // Automatically migrate any previous local drafts to Firestore online
    syncLocalDraftsToCloud().catch(() => {});

    const unsubSettings = subscribePublic('app_settings', r => {
      const main = r.find(x => x.id === 'main' && !x.archived);
      if (main) setSettings(main);
    });
    const unsubStops = subscribePublic('stops', setLiveStops);
    const unsubModes = subscribePublic('transport_modes', setLiveModes);
    const unsubAlerts = subscribePublic('alerts', setLiveAlerts);
    const unsubLines = subscribeLines(setLines);

    loadEdges()
      .then(e => setEdges(e as Edge[]))
      .catch(() => {});

    return () => {
      unsubSettings();
      unsubStops();
      unsubModes();
      unsubAlerts();
      unsubLines();
    };
  }, []);

  const availablePlaces = [
    ...liveStops.filter(s => !s.archived && typeof s.lat === 'number' && typeof s.lng === 'number'),
    ...places.filter(p => !liveStops.some(s => s.id === p.id)),
  ];
  const availableModes = liveModes.length ? liveModes.filter(m => !m.archived && m.enabled) : modes;

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('at-dark', String(dark));
  }, [dark]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSplash(false);
      sessionStorage.setItem('at-loaded', '1');
    }, 1000);
    const un = auth ? onAuthStateChanged(auth, setUser) : () => {};
    const on = () => setOnline(navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', on);
    return () => {
      clearTimeout(t);
      un();
      window.removeEventListener('online', on);
      window.removeEventListener('offline', on);
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function navigate(id: string) {
    setTab(id);
    setResults(false);
    setDemo(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function save(value: string) {
    const next = saved.includes(value) ? saved.filter(x => x !== value) : [...saved, value];
    setSaved(next);
    localStorage.setItem('at-saved', JSON.stringify(next));
    setToast(next.includes(value) ? 'تم الحفظ في مفضلتك بنجاح' : 'اتشالت من المحفوظات');
  }

  function search() {
    if (!from.trim() || !to.trim()) {
      setToast('اختار مكان الركوب والوصول الأول');
      return;
    }
    if (from === to) {
      setToast('مكان الركوب والوصول نفس المكان');
      return;
    }
    setLoading(true);
    setFocused('');
    setTimeout(() => {
      const a = availablePlaces.find(
          p => normalize(p.name) === normalize(from) || (p.aliases || []).some((n: string) => normalize(n) === normalize(from))
        ),
        b = availablePlaces.find(
          p => normalize(p.name) === normalize(to) || (p.aliases || []).some((n: string) => normalize(n) === normalize(to))
        );
      setComputed(
        a && b
          ? plan(
              edges.filter(e => e.walking || lines.some(l => l.id === e.line && !l.archived && l.status === 'active')),
              a.id,
              b.id,
              pref as any
            )
          : null
      );
      setResults(true);
      setDemo(false);
      setLoading(false);
      const r = [`${from} ← ${to}`, ...recent].filter((x, i, a) => a.indexOf(x) === i).slice(0, 5);
      setRecent(r);
      localStorage.setItem('at-recent', JSON.stringify(r));
    }, 350);
  }

  async function execute(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      setModal('');
      setToast('تم بنجاح');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'حصلت مشكلة، جرب تاني');
    } finally {
      setBusy(false);
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      setToast('اختار مكانك يدويًا من البحث');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p => {
        const near = [...availablePlaces].sort(
          (a, b) =>
            (a.lat - p.coords.latitude) ** 2 +
            (a.lng - p.coords.longitude) ** 2 -
            ((b.lat - p.coords.latitude) ** 2 + (b.lng - p.coords.longitude) ** 2)
        )[0];
        if (Math.abs(near.lat - p.coords.latitude) > 0.5) {
          setToast('موقعك بعيد عن إسكندرية. اختار البداية يدويًا');
          return;
        }
        setFrom(near.name);
        setSelected(near.id);
        setToast('حددنا أقرب منطقة ليك، راجع نقطة الركوب');
      },
      () => setToast('مش قادرين نحدد موقعك. تقدر تختاره يدويًا'),
      { timeout: 10000 }
    );
  }

  const rootNavigation = tab.startsWith('city') || tab === 'profile' || tab === 'admin';
  const navigationTabs = rootNavigation ? cityTabs : tabs;
  const appName = settings.name || 'إسكندريلا';
  const appSubtitle = settings.subtitle || 'ESKENDRELLA · ALEXANDRIA';
  const appLogo = settings.logoUrl || '/brand/eskendrella.png';

  return (
    <>
      <AnimatePresence>
        {splash && (
          <motion.div className="splash" exit={{ opacity: 0 }}>
            <Logo src={appLogo} />
            <h2>{appName}</h2>
            <p>{settings.slogan || 'إسكندرية، بكل تفاصيلها'}</p>
            <span className="loader" />
          </motion.div>
        )}
      </AnimatePresence>
      {menuOpen && <SideNavigation active={tab} navigate={navigate} onClose={() => setMenuOpen(false)} />}
      <header>
        <div className="header-inner">
          <button
            className="icon-button menu-toggle"
            aria-label="فتح القائمة الجانبية"
            aria-expanded={menuOpen}
            aria-controls="app-side-navigation"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} />
          </button>
          <button className="brand" onClick={() => navigate('city')}>
            <Logo src={appLogo} />
            <div>
              <strong>{appName}</strong>
              <small>{appSubtitle}</small>
            </div>
          </button>
          <nav className="desktop-nav">
            {navigationTabs.slice(0, 4).map(t => (
              <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => navigate(t.id)}>
                <t.icon size={18} />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <span className="city-label">
              <span /> {settings.cityLabel || 'إسكندرية، مصر'}
            </span>
            <button className="icon-button" aria-label="تغيير المظهر" onClick={() => setDark(!dark)}>
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="icon-button notification" aria-label="الإشعارات" onClick={() => setModal('notifications')}>
              <Bell size={20} />
            </button>
            <button className="avatar" aria-label="حسابي" onClick={() => navigate('profile')}>
              <UserRound size={20} />
            </button>
          </div>
        </div>
      </header>
      {!online && <div className="offline-bar">إنت مش متصل بالإنترنت حاليًا — هيتم تحديث البيانات فور عودة الاتصال.</div>}
      {settings.notice && <div className="offline-bar">{settings.notice}</div>}
      {settings.maintenance && (
        <div className="offline-bar">إسكندريلا تحت الصيانة حاليًا؛ بعض البيانات ممكن تتأخر في التحديث.</div>
      )}
      <main onClick={() => focused && setFocused('')}>
        <div className="content" onClick={e => e.stopPropagation()}>
          {tab.startsWith('city') && (
            <CityHub
              tab={tab}
              navigate={navigate}
              save={save}
              slogan={settings.slogan}
              saved={saved}
              settings={settings}
            />
          )}
          {!rootNavigation && (
            <div className="transport-breadcrumb">
              <button className="text-button" onClick={() => navigate('city')}>
                {appName}
              </button>
              <ChevronLeft size={15} />
              <b>مواصلات إسكندرية</b>
            </div>
          )}
          {(tab === 'home' || tab === 'map' || tab === 'directory') && (
            <TransportHub
              key={tab}
              from={from}
              setFrom={setFrom}
              to={to}
              setTo={setTo}
              saved={saved}
              save={save}
              recent={recent}
              setRecent={setRecent}
              liveLines={lines}
              liveStops={liveStops}
              liveAlerts={liveAlerts}
              locate={locate}
              notify={setToast}
              onRefreshLines={() => {
                loadLines()
                  .then(setLines)
                  .catch(() => {});
              }}
              initialSubView={tab === 'directory' ? 'lines' : tab === 'map' ? 'nearby' : 'planner'}
              showFaresSetting={settings.showFares !== false}
            />
          )}
          {tab === 'saved' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow">مشاويرك، أقرب ليك</div>
                  <h1>
                    المحفوظات<span>.</span>
                  </h1>
                  <p>المشاوير والأماكن والخطوط المفضلة اللي حفظتها عشان ترجع لها بسرعة.</p>
                </div>
              </section>
              <div className="card">
                {saved.length ? (
                  saved.map(s => (
                    <div className="saved-row" key={s}>
                      <Bookmark />
                      <div>
                        <b>{s}</b>
                        {/^(مباراة:|نادي:|نشاط رياضي:)/.test(s) && (
                          <button className="text-button" onClick={() => navigate('city-sports')}>
                            افتح قسم الرياضة <ArrowLeft size={15} />
                          </button>
                        )}
                        {s.startsWith('دليل قيد المراجعة: ') && (
                          <button
                            className="text-button"
                            onClick={() => {
                              const pair = s
                                .replace('دليل قيد المراجعة: ', '')
                                .split(' (')[0]
                                .split(' ← ');
                              setFrom(pair[0]);
                              setTo(pair[1]);
                              setTab('home');
                              setDemo(false);
                              setComputed(null);
                              setResults(true);
                              window.scrollTo({ top: 0 });
                            }}
                          >
                            افتح تفاصيل المشوار <ArrowLeft size={15} />
                          </button>
                        )}
                        <small>في قائمة مفضلتك السريعة</small>
                      </div>
                      <button className="icon-button" aria-label="حذف المحفوظ" onClick={() => save(s)}>
                        <X size={18} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    <Bookmark size={42} />
                    <h3>مشاويرك المفضلة هتكون هنا</h3>
                    <p>احفظ رحلة أو محطة علشان ترجع لها بسهولة.</p>
                    <button className="secondary" onClick={() => navigate('home')}>
                      خطط مشوارك <ArrowLeft size={17} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {tab === 'profile' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow">أهلًا بيك في إسكندرية</div>
                  <h1>
                    حسابي<span>.</span>
                  </h1>
                  <p>رحلتك على مزاجك، والاختيار دايمًا ليك.</p>
                </div>
              </section>
              <div className="profile-grid">
                <div className="card profile-card">
                  <div className="profile-avatar">
                    <UserRound size={35} />
                  </div>
                  <h2>{user?.displayName || 'نوّرت إسكندريلا'}</h2>
                  <p>{user ? 'حسابك متصل أونلاين' : 'تقدر تتصفح وتخطط وتفتح لوحة التحكم مباشرة.'}</p>
                  {user ? (
                    <button className="secondary" onClick={() => execute(logout)}>
                      <LogOut size={17} /> تسجيل الخروج
                    </button>
                  ) : (
                    <button className="primary" onClick={() => setModal('login')}>
                      تسجيل الدخول <ArrowLeft size={18} />
                    </button>
                  )}
                  <small>مش بنحتفظ بسجل تحركاتك أو بنتتبع موقعك.</small>
                </div>
                <div className="card profile-menu">
                  <button onClick={() => setModal('apply')}>
                    <span>
                      <b>ساهم معانا</b>
                      <small>ساعدنا نكمل دليل مواصلات إسكندرية</small>
                    </span>
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => setDark(!dark)}>
                    <span>
                      <b>المظهر</b>
                      <small>{dark ? 'الوضع الداكن' : 'الوضع الفاتح'}</small>
                    </span>
                    {dark ? <Moon /> : <Sun />}
                  </button>
                  <button onClick={() => setModal('notifications')}>
                    <span>
                      <b>إشعاراتي</b>
                      <small>تحديثات الخطوط اللي تهمك</small>
                    </span>
                    <Bell size={21} />
                  </button>
                  <button onClick={() => navigate('admin')}>
                    <span>
                      <b>لوحة الإدارة والنشر أونلاين</b>
                      <small>تحكم كامل في الموقع ونشر التعديلات أونلاين فورًا</small>
                    </span>
                    <ShieldCheck size={21} />
                  </button>
                </div>
              </div>
            </>
          )}
          {tab === 'admin' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow">إدارة إسكندريلا أونلاين</div>
                  <h1>
                    لوحة الإدارة<span>.</span>
                  </h1>
                  <p>أي تعديل أو إضافة بيتنشر أونلاين فوراً على الموقع لكل الزوار.</p>
                </div>
              </section>
              <AdminDashboard
                user={user}
                notify={msg => {
                  setToast(msg);
                  loadLines()
                    .then(setLines)
                    .catch(() => {});
                  loadEdges()
                    .then(e => setEdges(e as Edge[]))
                    .catch(() => {});
                  loadPublic('app_settings')
                    .then(r => setSettings(r.find(x => x.id === 'main') || {}))
                    .catch(() => {});
                  loadPublic('stops')
                    .then(setLiveStops)
                    .catch(() => {});
                  loadPublic('transport_modes')
                    .then(setLiveModes)
                    .catch(() => {});
                  loadPublic('alerts')
                    .then(setLiveAlerts)
                    .catch(() => {});
                }}
              />
            </>
          )}
          <footer>
            <div className="footer-brand">
              <Logo src={appLogo} />
              <div>
                <b>{appName}</b>
                <small>{settings.slogan || 'إسكندرية، بكل تفاصيلها'}</small>
              </div>
            </div>
            <span>
              {settings.footerText || 'معاك في كل مشوار'} <span className="yellow-heart">♥</span>
            </span>
            <small>إسكندريلا • متصل ومحدّث أونلاين</small>
          </footer>
        </div>
      </main>
      <nav className="bottom-nav">
        {navigationTabs.map(t => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => navigate(t.id)}>
            <t.icon size={21} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            role="status"
            className="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Info size={18} />
            {toast}
          </motion.div>
        )}
        {modal && (
          <div key="modal" className="modal-overlay" onClick={() => setModal('')}>
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label="تفاصيل"
              className="modal card"
              onClick={e => e.stopPropagation()}
            >
              <button className="close icon-button" aria-label="إغلاق" onClick={() => setModal('')}>
                <X />
              </button>
              {modal === 'login' && (
                <>
                  <Logo />
                  <h2>{register ? 'اعمل حساب جديد' : 'نوّرتنا'}</h2>
                  <p>احفظ مشاويرك وساهم في تحسين المعلومة.</p>
                  {!firebaseReady && <div className="warning">تسجيل الدخول لسه بيتجهز. التصفح متاح من غير حساب.</div>}
                  <button className="secondary full" disabled={busy} onClick={() => execute(login)}>
                    كمّل بحساب Google <ExternalLink size={16} />
                  </button>
                  <div className="or">أو بالإيميل</div>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      execute(() => emailLogin(email, password, register));
                    }}
                  >
                    <label>
                      البريد الإلكتروني
                      <input
                        required
                        type="email"
                        dir="ltr"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </label>
                    <label>
                      كلمة السر
                      <input
                        required
                        minLength={8}
                        type="password"
                        dir="ltr"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </label>
                    <button className="primary full" disabled={busy}>
                      {busy ? 'لحظة…' : register ? 'إنشاء الحساب' : 'تسجيل الدخول'}
                    </button>
                  </form>
                  <button className="text-button" onClick={() => setRegister(!register)}>
                    {register ? 'عندك حساب؟ سجّل دخول' : 'جديد هنا؟ اعمل حساب'}
                  </button>
                </>
              )}
              {modal === 'notifications' && (
                <>
                  <Bell size={35} />
                  <h2>إشعاراتك</h2>
                  <div className="empty">
                    <p>مفيش إشعارات جديدة.</p>
                    <small>لما تتفعل الخدمة، تقدر تتابع تحديثات الخطوط من هنا.</small>
                  </div>
                </>
              )}
              {modal === 'apply' && (
                <>
                  <h2>ساهم في تطوير مواصلات إسكندرية</h2>
                  <p>تعرف خطوط مواصلات ومواقف مش موجودة؟ ساعدنا نكمل دليل مواصلات إسكندرية.</p>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      const d = Object.fromEntries(new FormData(e.currentTarget));
                      execute(() => call('submitApplication', d));
                    }}
                  >
                    {[
                      ['name', 'اسمك'],
                      ['regions', 'المناطق اللي تعرفها'],
                      ['modes', 'المواصلات اللي بتستخدمها'],
                    ].map(([n, l]) => (
                      <label key={n}>
                        {l}
                        <input required name={n} maxLength={180} />
                      </label>
                    ))}
                    <label>
                      حابب تساهم ليه؟
                      <textarea required name="reason" maxLength={1000} />
                    </label>
                    <button className="primary full" disabled={busy}>
                      ابعت الطلب للمراجعة أونلاين
                    </button>
                  </form>
                </>
              )}
              {modal === 'stop' && (
                <>
                  <div className="eyebrow">موقع منطقة • مش موقف مؤكد</div>
                  <h2>
                    <MapPin /> {availablePlaces.find(p => p.id === selected)?.name}
                  </h2>
                  <p>الإحداثيات تقريبية للمنطقة. مفيش نقطة ركوب أو خدمات مؤكدة منشورة هنا لسه.</p>
                  <button
                    className="primary full"
                    onClick={() => {
                      setTo(availablePlaces.find(p => p.id === selected)?.name || '');
                      setModal('');
                      setTab('home');
                    }}
                  >
                    اختارها كوجهة <ArrowLeft size={17} />
                  </button>
                  <button
                    className="secondary full"
                    onClick={() => save(availablePlaces.find(p => p.id === selected)?.name || '')}
                  >
                    حفظ المنطقة <Bookmark size={17} />
                  </button>
                </>
              )}
              {modal === 'line' && (
                <LineDetails
                  line={lines.find(l => l.id === selected)}
                  save={save}
                  report={() => setModal('report')}
                />
              )}
              {modal === 'report' && (
                <>
                  <h2>اقترح تعديل</h2>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      execute(() =>
                        call('submitReport', {
                          lineId: selected,
                          ...Object.fromEntries(new FormData(e.currentTarget)),
                        })
                      );
                    }}
                  >
                    <label>
                      نوع المعلومة
                      <select name="type">
                        {['أجرة', 'تغيير مسار', 'مكان موقف', 'توقف خدمة', 'خط ناقص'].map(x => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      قولنا التفاصيل
                      <textarea name="details" required minLength={10} maxLength={1500} />
                    </label>
                    <button className="primary full" disabled={busy}>
                      إرسال للمراجعة أونلاين
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function LineDetails({ line, save, report }: any) {
  if (!line) return null;
  return (
    <>
      <IconMode id={line.mode} />
      <h2>{line.name}</h2>
      <p>
        {line.origin} ← {line.destination}
      </p>
      <div className="outline-tag">{statuses[line.status] || statuses.unknown}</div>
      <p>
        <b>سعر الأجرة:</b> {line.fare == null ? 'الأجرة غير مؤكدة' : `${line.fare} جنيه`}
      </p>
      {line.boarding && (
        <p>
          <b>مكان الركوب:</b> {line.boarding}
        </p>
      )}
      {line.exit && (
        <p>
          <b>مكان النزول:</b> {line.exit}
        </p>
      )}
      <p>آخر تحقق: {line.verifiedAt?.toDate?.().toLocaleDateString('ar-EG') || 'معتمد من الإدارة'}</p>
      {(line.stops || []).length > 0 && (
        <>
          <h4>المحطات وخط السير:</h4>
          <ol>
            {(line.stops || []).map((s: string, i: number) => (
              <li key={`${s}-${i}`}>{s}</li>
            ))}
          </ol>
        </>
      )}
      <button className="secondary full" onClick={() => save(line.name)}>
        حفظ الخط <Bookmark size={17} />
      </button>
      <button className="text-button" onClick={report}>
        اقترح تعديل
      </button>
    </>
  );
}
