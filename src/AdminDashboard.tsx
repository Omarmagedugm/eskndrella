import CoverPicker from './CoverPicker';
import { safeCover, prepareClubLogo } from './coverImage';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  BusFront,
  MapPin,
  Wallet,
  Bell,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  FileText,
  Check,
  X,
  Eye,
  History,
  Settings,
  ChevronLeft,
  Newspaper,
  Compass,
  CalendarDays,
  Store,
  Trophy,
  Trash2,
  Upload,
} from 'lucide-react';
import { call, ADMIN_EMAIL } from './firebase';
import { sections, emptyRecord, normalizeDraft, seedWorkspace, type Section } from './adminModel';
import { sportsContent } from './sportsModel';
import { ClubLogo, registerCustomClubLogos } from './clubLogos';
import { normalize } from './data';
import type { User } from 'firebase/auth';

const reviewers = ['community_reports', 'contribution_submissions', 'contributor_applications'];
const icons: Record<string, any> = {
  overview: LayoutDashboard,
  app_settings: Settings,
  city_news: Newspaper,
  city_places: MapPin,
  city_outings: Compass,
  city_events: CalendarDays,
  city_services: Store,
  city_businesses: Store,
  sports_clubs: Trophy,
  sports_fixtures: CalendarDays,
  sports_activities: Trophy,
  transport_lines: BusFront,
  stops: MapPin,
  fares: Wallet,
  alerts: Bell,
  user_roles: ShieldCheck,
  audit_logs: History,
};

function display(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'boolean') return v ? 'أيوه' : 'لأ';
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}

const stateLabels: Record<string, string> = {
  draft: 'مسودة',
  pending: 'في انتظار المراجعة',
  verification: 'جاري التحقق',
  clarification: 'محتاج توضيح',
  approved: 'مقبول',
  rejected: 'مرفوض',
  published: 'منشور أونلاين',
  active: 'شغال',
  unknown: 'الحالة غير مؤكدة',
  construction: 'تحت الإنشاء',
  development: 'تحت التطوير',
  suspended: 'متوقف مؤقتًا',
};

function HomeWidgetsManager({
  currentSettings,
  onSave,
  busy,
}: {
  currentSettings: Record<string, any>;
  onSave: (newSettings: Record<string, any>) => Promise<void>;
  busy: boolean;
}) {
  const DEFAULT_KEYS = ['widgets', 'matches', 'news', 'sections', 'features'];
  const rawOrder = currentSettings.homeWidgetsOrder;
  const initialOrder: string[] = Array.isArray(rawOrder) && rawOrder.length > 0
    ? rawOrder
    : typeof rawOrder === 'string' && rawOrder.trim()
      ? rawOrder.split(/[\n,]/).map((s: string) => s.trim().toLowerCase()).filter(Boolean)
      : DEFAULT_KEYS;

  const [order, setOrder] = useState<string[]>(Array.from(new Set([...initialOrder, ...DEFAULT_KEYS])));
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    widgets: currentSettings.showWidgets !== false,
    matches: currentSettings.showMatchesSlider !== false,
    news: currentSettings.showNewsSlider !== false,
    sections: currentSettings.showSections !== false,
    features: currentSettings.showFeatures !== false,
  });

  // Keep state synced if currentSettings change
  useEffect(() => {
    const raw = currentSettings.homeWidgetsOrder;
    const current: string[] = Array.isArray(raw) && raw.length > 0
      ? raw
      : typeof raw === 'string' && raw.trim()
        ? raw.split(/[\n,]/).map((s: string) => s.trim().toLowerCase()).filter(Boolean)
        : DEFAULT_KEYS;
    setOrder(Array.from(new Set([...current, ...DEFAULT_KEYS])));
    setToggles({
      widgets: currentSettings.showWidgets !== false,
      matches: currentSettings.showMatchesSlider !== false,
      news: currentSettings.showNewsSlider !== false,
      sections: currentSettings.showSections !== false,
      features: currentSettings.showFeatures !== false,
    });
  }, [currentSettings]);

  const WIDGET_INFO: Record<string, { title: string; desc: string; icon: string }> = {
    widgets: { title: 'إسكندرية النهارده (الطقس والصلاة والعملات)', desc: 'ودجات معلومات اليوم الأساسية أعلى الرئيسية', icon: '🌤️' },
    matches: { title: 'مباريات ونتائج أندية إسكندرية', desc: 'سلايدر مواعيد ونتائج الأندية السكندرية مع الشعارات الرسمية', icon: '🏆' },
    news: { title: 'سلايدر إسكندريلا ماجازين', desc: 'سلايدر الأخبار والحكايات والفعاليات المميزة', icon: '📰' },
    sections: { title: 'أقسام إسكندرية الرئيسية', desc: 'كروت الأقسام (الخروجات، الرياضة، الخدمات، المواصلات...)', icon: '🧭' },
    features: { title: 'كروت الترويج المميزة', desc: 'كارت مواصلات إسكندرية الكبير وكارت مجلة إسكندريلا', icon: '🚌' },
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    const temp = next[idx];
    next[idx] = next[target];
    next[target] = temp;
    setOrder(next);
  };

  const handleSave = () => {
    const updated = {
      ...currentSettings,
      homeWidgetsOrder: order,
      showWidgets: toggles.widgets,
      showMatchesSlider: toggles.matches,
      showNewsSlider: toggles.news,
      showSections: toggles.sections,
      showFeatures: toggles.features,
    };
    void onSave(updated);
  };

  return (
    <div className="card admin-widgets-manager" style={{ marginTop: 14, marginBottom: 20, padding: 20, border: '2px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
            <span>🎛️</span> ترتيب وإدارة ودجات الصفحة الرئيسية
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
            تحكم في إظهار أو إخفاء أي ودجت، ورتب ظهورها في الصفحة الرئيسية بالأسهم (أعلى ⬆️ / أسفل ⬇️).
          </p>
        </div>
        <button
          type="button"
          className="primary"
          onClick={handleSave}
          disabled={busy}
          style={{ minHeight: 38, padding: '8px 16px', fontSize: 13 }}
        >
          <Check size={16} /> {busy ? 'جاري الحفظ…' : 'حفظ ترتيب الودجات ونشرها أونلاين'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {order.map((key, index) => {
          const info = WIDGET_INFO[key] || { title: key, desc: '', icon: '📌' };
          const isEnabled = toggles[key] !== false;
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 12,
                background: isEnabled ? 'var(--card)' : 'var(--soft)',
                border: isEnabled ? '1.5px solid var(--border)' : '1px dashed var(--border)',
                opacity: isEnabled ? 1 : 0.65,
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
                <span style={{ fontSize: 12, fontWeight: 900, background: '#102a43', color: '#f0c64a', width: 26, height: 26, borderRadius: 7, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {index + 1}
                </span>
                <span style={{ fontSize: 20 }}>{info.icon}</span>
                <div>
                  <strong style={{ fontSize: 13.5, display: 'block', color: 'var(--text)' }}>{info.title}</strong>
                  <small style={{ color: 'var(--muted)', fontSize: 11 }}>{info.desc}</small>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={e => setToggles({ ...toggles, [key]: e.target.checked })}
                  />
                  <span>{isEnabled ? 'مفعلة' : 'معطلة'}</span>
                </label>

                <div style={{ display: 'inline-flex', gap: 4 }}>
                  <button
                    type="button"
                    className="secondary"
                    style={{ padding: '4px 8px', minHeight: 32, fontSize: 12 }}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    title="تحريك للأعلى"
                  >
                    ⬆️ أعلى
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    style={{ padding: '4px 8px', minHeight: 32, fontSize: 12 }}
                    disabled={index === order.length - 1}
                    onClick={() => move(index, 1)}
                    title="تحريك للأسفل"
                  >
                    ⬇️ أسفل
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClubLogosManager({
  rows,
  onUploadLogo,
  onResetLogo,
  onEditClub,
  canEdit,
  busy,
}: {
  rows: any[];
  onUploadLogo: (club: any, file: File) => Promise<void>;
  onResetLogo: (club: any) => Promise<void>;
  onEditClub: (club: any) => void;
  canEdit: boolean;
  busy: boolean;
}) {
  const [uploadingClubId, setUploadingClubId] = useState<string | null>(null);

  const defaultClubs = sportsContent.clubs;
  const mergedClubs = defaultClubs.map(dc => {
    const remote = rows.find(r => r.id === dc.id);
    return remote ? { ...dc, ...remote } : dc;
  });
  const extraClubs = rows.filter(r => !defaultClubs.some(dc => dc.id === r.id));
  const allClubs = [...mergedClubs, ...extraClubs];

  return (
    <div
      className="card admin-club-logos-manager"
      style={{
        marginTop: 14,
        marginBottom: 20,
        padding: 20,
        border: '2px solid var(--border)',
        background: 'linear-gradient(180deg, var(--card) 0%, var(--soft) 100%)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
            <span>🛡️</span> شعارات أندية إسكندرية (رفع واختيار PNG شفاف)
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
            اختر شعار PNG مفرغ لكل نادي وارفعه مباشرة من جهازك. يتم حفظ شفافية الخلفية، ويظهر الشعار فورًا بجوار اسم النادي في شريط المباريات والنتائج وقسم الرياضة.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {allClubs.map(club => {
          const hasCustom = Boolean(club.imageUrl && safeCover(club.imageUrl));
          const isCurrentUploading = uploadingClubId === club.id && busy;

          return (
            <div
              key={club.id}
              style={{
                borderRadius: 14,
                border: '1.5px solid var(--border)',
                background: 'var(--card)',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <strong style={{ fontSize: 14, display: 'block', color: 'var(--text)' }}>
                    {club.name}
                  </strong>
                  <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                    {club.shortName} • {club.region}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    padding: '2px 8px',
                    borderRadius: 99,
                    fontWeight: 700,
                    background: hasCustom ? '#e8f5e9' : '#e3f2fd',
                    color: hasCustom ? '#1b5e20' : '#0d47a1',
                  }}
                >
                  {hasCustom ? '✓ PNG مخصص' : 'فيكتور مدمج'}
                </span>
              </div>

              {/* Logo Preview in Checkerboard box */}
              <div
                style={{
                  height: 96,
                  borderRadius: 10,
                  backgroundImage: 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%)',
                  backgroundPosition: '50%',
                  backgroundSize: '14px 14px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <ClubLogo name={club.name} id={club.id} customUrl={club.imageUrl} size={58} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
                <label
                  className="primary"
                  style={{
                    cursor: canEdit && !busy ? 'pointer' : 'not-allowed',
                    opacity: canEdit && !busy ? 1 : 0.65,
                    fontSize: 12,
                    padding: '7px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    borderRadius: 8,
                    background: '#102a43',
                    color: '#f0c64a',
                    border: '1px solid #f0c64a',
                    margin: 0,
                    fontWeight: 700,
                  }}
                >
                  <Upload size={14} />
                  <span>{isCurrentUploading ? 'جاري رفع الشعار…' : 'اختيار ورفع شعار PNG'}</span>
                  <input
                    type="file"
                    accept="image/png,image/webp,image/jpeg,image/svg+xml"
                    disabled={!canEdit || busy}
                    style={{ display: 'none' }}
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      setUploadingClubId(club.id);
                      try {
                        await onUploadLogo(club, file);
                      } finally {
                        setUploadingClubId(null);
                      }
                    }}
                  />
                </label>

                <div style={{ display: 'flex', gap: 6 }}>
                  {hasCustom && (
                    <button
                      type="button"
                      className="secondary"
                      style={{ flex: 1, padding: '5px 8px', fontSize: 11, minHeight: 30 }}
                      disabled={!canEdit || busy}
                      onClick={() => onResetLogo(club)}
                    >
                      استعادة الافتراضي
                    </button>
                  )}
                  <button
                    type="button"
                    className="secondary"
                    style={{ flex: 1, padding: '5px 8px', fontSize: 11, minHeight: 30 }}
                    disabled={!canEdit || busy}
                    onClick={() => onEditClub(club)}
                  >
                    تعديل البيانات
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboard({ user, notify }: { user: User | null; notify: (s: string) => void }) {
  const [role, setRole] = useState('');
  const [sectionId, setSectionId] = useState('overview');
  const [rows, setRows] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [editor, setEditor] = useState<{
    section: Section;
    id?: string;
    revision: number;
    record: Record<string, any>;
  } | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [note, setNote] = useState('');
  const [userId, setUserId] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [regions, setRegions] = useState('');
  const [suspended, setSuspended] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const request = useRef(0);

  const section = sections.find(s => s.id === sectionId)!;
  const canEdit = ['admin', 'super_admin', 'data_editor'].includes(role);
  const canPublish = ['admin', 'super_admin'].includes(role);

  useEffect(() => {
    let cancelled = false;
    call('adminSession', {})
      .then((r: any) => {
        if (!cancelled && r?.role) setRole(r.role);
      })
      .catch(e => {if(!cancelled)setError(e instanceof Error?e.message:'تعذّر التحقق من الصلاحيات');});

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function refresh(append = false) {
    const seq = ++request.current;
    setError('');
    if (!role) return;
    setLoading(true);
    try {
      if (sectionId === 'overview') {
        const r: any = await call('adminOverview', {});
        if (seq === request.current) setStats(r.counts);
      } else {
        const r: any = await call('adminRecords', {
          collection: sectionId,
          ...(append && cursor ? { cursor } : {}),
        });
        if (seq === request.current) {
          setRows(prev => (append ? [...prev, ...r.records] : r.records));
          setCursor(r.cursor);
        }
      }
    } catch (e) {
      if (seq === request.current) setError(e instanceof Error ? e.message : 'مش قادرين نحمل القسم');
    } finally {
      if (seq === request.current) setLoading(false);
    }
  }

  useEffect(() => {
    setRows([]);
    setCursor(null);
    setDetail(null);
    setQ('');
    void refresh();
    return () => {
      request.current++;
    };
  }, [sectionId, role]);

  async function action(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError('');
    try {
      await fn();
      notify(message);
      setEditor(null);
      setDetail(null);
      setNote('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حصلت مشكلة أثناء النشر أونلاين');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!editor) return;
    await action(async () => {
      const record = normalizeDraft(editor.section.fields!, editor.record);
      await call('adminSave', {
        collection: editor.section.id,
        ...(editor.id ? { id: editor.id } : {}),
        revision: editor.revision,
        record,
      });
    }, canPublish?'تم حفظ السجل ونشره.':'تم حفظ المسودة للمراجعة.');
  }

  async function deleteItem(row: any) {
    if (!row?.id) return;
    await action(async () => {
      await call('adminDelete', {
        collection: sectionId,
        id: row.id,
        revision: row.revision||1,
        reason: 'أرشفة من لوحة التحكم',
      });
    }, 'تم حذف السجل أونلاين من الموقع بنجاح');
  }

  function edit(row?: any, targetSection: Section = section) {
    const baseDefaults =
      targetSection.id === 'app_settings'
        ? { ...emptyRecord(targetSection), ...(seedWorkspace().app_settings?.[0] || {}) }
        : emptyRecord(targetSection);
    const sourceRow =
      targetSection.id === 'app_settings' ? { ...baseDefaults, ...(row || rows[0] || {}) } : row;
    const clean = sourceRow
      ? Object.fromEntries(
          targetSection.fields!.map(f => {
            const val = sourceRow[f.key];
            return [f.key, val !== undefined && val !== '' ? val : baseDefaults[f.key]];
          })
        )
      : baseDefaults;
    setEditor({
      section: targetSection,
      id: targetSection.id === 'app_settings' ? 'main' : row?.id,
      revision: sourceRow?.revision || 0,
      record: clean,
    });
    setDetail(null);
  }

  const visible = sections
    .filter(s => role !== 'moderator' || ['overview', ...reviewers, 'audit_logs'].includes(s.id))
    .filter(s => s.id !== 'user_roles' || role === 'super_admin');

  const shown = rows.filter(r =>
    normalize(
      [
        r.name,
        r.title,
        r.home,
        r.away,
        r.id,
        r.status,
        r.category,
        r.region,
        r.summary,
        r.details,
        r.action,
        r.targetLineName,
        r.boarding,
        r.origin,
        r.destination,
        r.lineNumber,
      ]
        .filter(Boolean)
        .join(' ')
    ).includes(normalize(q))
  );

  const counts = stats;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">
          <ShieldCheck size={26} />
          <b>
            مركز التحكم السحابي
            <small>{user?.email || 'لم يتم تسجيل الدخول'} • مساحة الإدارة</small>
          </b>
        </div>
        <nav aria-label="أقسام لوحة التحكم">
          {visible.map(s => {
            const Icon = icons[s.id] || FileText;
            return (
              <button
                key={s.id}
                className={sectionId === s.id ? 'active' : ''}
                onClick={() => {
                  setSectionId(s.id);
                  setEditor(null);
                }}
              >
                <Icon size={18} />
                <span>{s.label}</span>
                <ChevronLeft size={14} />
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="admin-main">
        <div className="admin-connection live">
          <span className="small-dot" />
          متصل بقاعدة البيانات أونلاين • أي تعديل أو إضافة أو حذف في أي قسم بيتنشر فوراً على الموقع لكل الزوار
        </div>

        <div className="admin-title">
          <div>
            <span className="eyebrow">إسكندريلا / إدارة ونشر مباشر أونلاين</span>
            <h2>{section.label}</h2>
            <p>{section.description}</p>
          </div>
          <button
            className="icon-button"
            aria-label="تحديث بيانات القسم"
            onClick={() => refresh()}
            disabled={loading}
          >
            <RefreshCw size={19} />
          </button>
        </div>

        {error && (
          <div className="admin-error" role="alert">
            {error}
          </div>
        )}

        {sectionId === 'overview' ? (
          <>
            <div className="admin-stats">
              {[
                ['city_news', 'الأخبار والمقالات', Newspaper],
                ['transport_lines', 'خطوط النقل والأتوبيسات', BusFront],
                ['city_outings', 'الخروجات والفسح', Compass],
                ['city_places', 'الأماكن والمعالم', MapPin],
                ['city_events', 'الفعاليات والحفلات', CalendarDays],
                ['city_services', 'الخدمات والمرافق', Store],
                ['sports_fixtures', 'جدول المباريات', Trophy],
                ['fares', 'تعريفات المواصلات', Wallet],
              ].map(([key, label, Icon]: any) => (
                <button key={key} className="card" onClick={() => setSectionId(key)}>
                  <Icon size={23} />
                  <strong>{loading ? '…' : (counts[key] || 0).toLocaleString('ar-EG')}</strong>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="card admin-welcome">
              <div>
                <span className="eyebrow">نشر فوري أونلاين</span>
                <h3>
                  تحكم كامل في الأخبار والمقالات (بصورة كوفر خارجية وداخلية)، المواصلات والأتوبيسات، الخروجات، الرياضة، والواجهة.
                </h3>
                <p>
                  كل بيانات الموقع متصلة بقاعدة البيانات السحابية؛ أي تغيير تحفظه هنا بيتنشر أونلاين فوراً ويظهر لكل زوار الموقع على كل الأجهزة.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className="primary"
                    onClick={() => {
                      const sec = sections.find(s => s.id === 'city_news')!;
                      setSectionId('city_news');
                      edit(undefined, sec);
                    }}
                    disabled={!canEdit}
                  >
                    <Plus size={17} /> أضف خبر أو مقال جديد أونلاين
                  </button>
                  <button className="secondary" onClick={() => setSectionId('city_news')}>
                    <Newspaper size={17} /> إدارة الأخبار والمقالات
                  </button>
                  <button className="secondary" onClick={() => setSectionId('transport_lines')}>
                    <BusFront size={17} /> إدارة المواصلات والأتوبيسات
                  </button>
                  <button className="secondary" onClick={() => setSectionId('app_settings')}>
                    <Settings size={17} /> إعدادات الواجهة والنصوص
                  </button>
                </div>
              </div>
              <RouteChecklist />
            </div>

            <div className="admin-summary">
              <div className="card">
                <h3>أقسام المدينة والرياضة</h3>
                {[
                  ['city_news', 'الأخبار والمقالات'],
                  ['city_places', 'الأماكن والمعالم'],
                  ['city_outings', 'الخروجات والفسح'],
                  ['city_events', 'الفعاليات والحفلات'],
                  ['city_businesses', 'المحلات والأعمال'],
                  ['sports_clubs', 'الأندية الرياضية'],
                ].map(([id, label]) => (
                  <button key={id} onClick={() => setSectionId(id)}>
                    {label}
                    <b>{counts[id] || 0}</b>
                    <ChevronLeft size={16} />
                  </button>
                ))}
              </div>
              <div className="card">
                <h3>المراجعات والنظام</h3>
                {[
                  ['community_reports', 'بلاغات المستخدمين'],
                  ['contributor_applications', 'طلبات المساهمين'],
                  ['app_settings', 'إعدادات الواجهة والنصوص'],
                ].map(([id, label]) => (
                  <button key={id} onClick={() => setSectionId(id)}>
                    {label}
                    <b>{counts[id] || 0}</b>
                    <ChevronLeft size={16} />
                  </button>
                ))}
                <p style={{ marginTop: 12 }}>
                  الحفظ والنشر متاحان فقط حسب صلاحيات حسابك المعتمدة على الخادم.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {section.fields && (
              <div className="admin-toolbar">
                <label className="catalog-search">
                  <Search size={18} />
                  <input
                    aria-label="ابحث في سجلات القسم"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="دور بالاسم أو الرقم أو العنوان أو المنطقة…"
                  />
                </label>
                {sectionId === 'app_settings' && shown[0] ? (
                  <button className="primary" onClick={() => edit(shown[0])} disabled={!canEdit}>
                    <Settings size={18} /> تعديل إعدادات ونصوص وصور الموقع أونلاين
                  </button>
                ) : (
                  <button className="primary" onClick={() => edit()} disabled={!canEdit}>
                    <Plus size={18} /> إضافة ونشر سجل جديد أونلاين
                  </button>
                )}
              </div>
            )}

            {sectionId === 'app_settings' && (
              <HomeWidgetsManager
                currentSettings={rows[0] || seedWorkspace().app_settings?.[0] || {}}
                onSave={async (newSettings) => {
                  await action(async () => {
                    await call('adminWrite', {
                      collection: 'app_settings',
                      id: 'main',
                      revision:newSettings.revision||0,
                      record:normalizeDraft(sections.find(s=>s.id==='app_settings')!.fields!,newSettings),
                    });
                  }, 'تم حفظ ترتيب وإعدادات ودجات الرئيسية ونشرها أونلاين بنجاح');
                }}
                busy={busy}
              />
            )}

            {sectionId === 'sports_clubs' && (
              <ClubLogosManager
                rows={rows}
                canEdit={canEdit}
                busy={busy}
                onUploadLogo={async (club, file) => {
                  const pngResult = await prepareClubLogo(file);
                  await action(async () => {
                    const record = {
                      ...club,
                      id: club.id,
                      imageUrl: pngResult,
                      published: true,
                    };
                    await call('adminWrite', {
                      collection: 'sports_clubs',
                      id: club.id,
                      revision:club.revision||0,
                      record:normalizeDraft(sections.find(s=>s.id==='sports_clubs')!.fields!,record),
                    });
                    registerCustomClubLogos([record]);
                  }, `تم رفع ونشر شعار ${club.name} (PNG شفاف) أونلاين بنجاح!`);
                }}
                onResetLogo={async (club) => {
                  await action(async () => {
                    const record = {
                      ...club,
                      id: club.id,
                      imageUrl: '',
                      published: true,
                    };
                    await call('adminWrite', {
                      collection: 'sports_clubs',
                      id: club.id,
                      revision:club.revision||0,
                      record:normalizeDraft(sections.find(s=>s.id==='sports_clubs')!.fields!,record),
                    });
                    registerCustomClubLogos([record]);
                  }, `تمت استعادة الشعار الفيكتور الافتراضي لـ ${club.name}`);
                }}
                onEditClub={(club) => edit(club)}
              />
            )}

            {sectionId === 'user_roles' && (
              <form
                className="card admin-form"
                onSubmit={e => {
                  e.preventDefault();
                  action(
                    () => call('adminRole', { uid: userId, role: newRole, reason: note }),
                    'تم تحديث الصلاحية على الخادم أونلاين'
                  );
                }}
              >
                <h3>تعيين أو سحب صلاحية</h3>
                <label>
                  معرّف حساب المستخدم
                  <input required value={userId} onChange={e => setUserId(e.target.value)} dir="ltr" />
                </label>
                <label>
                  الدور
                  <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                    {[
                      ['user', 'مستخدم عادي'],
                      ['moderator', 'مراجع'],
                      ['data_editor', 'محرر بيانات'],
                      ['admin', 'مسؤول'],
                      ['super_admin', 'مسؤول رئيسي'],
                    ].map(([v, n]) => (
                      <option key={v} value={v}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  سبب التغيير
                  <textarea required minLength={5} value={note} onChange={e => setNote(e.target.value)} />
                </label>
                <button className="primary" disabled={busy || role !== 'super_admin'}>
                  تطبيق الصلاحية أونلاين
                </button>
              </form>
            )}

            {sectionId === 'approved_contributors' && (
              <form
                className="card admin-form"
                onSubmit={e => {
                  e.preventDefault();
                  action(
                    () =>
                      call('assignContributor', {
                        uid: userId,
                        regions: regions
                          .split(/[\n،,]/)
                          .map(v => v.trim())
                          .filter(Boolean),
                        suspended,
                      }),
                    'تم تحديث صلاحيات المساهم أونلاين'
                  );
                }}
              >
                <h3>مناطق المساهم المعتمد</h3>
                <p>لازم طلب المساهمة يكون مقبول يدويًا الأول. اكتب أسماء المناطق بنفس صيغة سجلاتها.</p>
                <label>
                  معرّف حساب المساهم
                  <input required value={userId} onChange={e => setUserId(e.target.value)} />
                </label>
                <label>
                  المناطق المسموحة
                  <textarea
                    required
                    value={regions}
                    onChange={e => setRegions(e.target.value)}
                    placeholder="سيدي بشر، ميامي"
                  />
                </label>
                <label className="admin-check">
                  <input type="checkbox" checked={suspended} onChange={e => setSuspended(e.target.checked)} /> إيقاف
                  صلاحيات المساهم
                </label>
                <button className="primary" disabled={!canPublish || busy}>
                  حفظ صلاحيات المناطق أونلاين
                </button>
              </form>
            )}

            {loading ? (
              <div className="card skeleton admin-loading">بنحمّل السجلات المنشورة أونلاين…</div>
            ) : (
              <div className="card admin-records">
                <div className="admin-records-caption">
                  <b>
                    {shown.length.toLocaleString('ar-EG')} سجل {cursor ? '• فيه صفحات إضافية' : ''}
                  </b>
                  <span>بيانات الموقع المنشورة أونلاين (قابلة للتعديل والحذف المباشر)</span>
                </div>
                {shown.length ? (
                  shown.map(r => {
                    const thumb =
                      safeCover(r.imageUrl) ||
                      safeCover(r.innerImageUrl) ||
                      safeCover(r.heroImageUrl) ||
                      safeCover(r.logoUrl);
                    return (
                      <div className="admin-record" key={r.id}>
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 10,
                              objectFit: 'cover',
                              flexShrink: 0,
                              border: '1px solid var(--border)',
                            }}
                          />
                        ) : (
                          <span className="admin-record-icon">
                            <FileText size={19} />
                          </span>
                        )}
                        <div>
                          <b>
                            {r.lineNumber ? `[خط ${r.lineNumber}] ` : ''}
                            {r.name ||
                              r.title ||
                              (r.home ? `${r.home} × ${r.away}` : '') ||
                              r.record?.name ||
                              r.targetLineName ||
                              r.action ||
                              r.id}
                          </b>
                          <small dir="auto">
                            {sectionId === 'transport_lines'
                              ? `${r.corridor ? `${r.corridor} • ` : ''}${r.origin || ''} ← ${r.destination || ''}${
                                  r.fare != null ? ` • ${r.fare} جنيه` : ''
                                }${Array.isArray(r.stops) && r.stops.length ? ` • ${r.stops.length} محطات` : ''}`
                              : sectionId === 'city_news'
                                ? `${r.category || 'خبر / مقال'}${r.publishedDate ? ` • ${r.publishedDate}` : ''}${
                                    r.imageUrl ? ' • كوفر خارجي ✓' : ''
                                  }${r.innerImageUrl ? ' • كوفر داخلي ✓' : ''}`
                                : r.summary
                                  ? String(r.summary).slice(0, 90)
                                  : r.id}
                          </small>
                        </div>
                        <span className={'admin-status ' + (r.published ? 'published' : '')}>
                          {r.published ? 'منشور أونلاين' : stateLabels[r.status] || 'منشور أونلاين'}
                        </span>
                        <button
                          className="secondary"
                          onClick={() => {
                            setDetail(r);
                            setNote('');
                            setSourceId('');
                          }}
                        >
                          <Eye size={15} /> تفاصيل
                        </button>
                        {section.fields && canEdit && (
                          <button
                            className="primary"
                            style={{ minHeight: 38, padding: '8px 14px', fontSize: 11 }}
                            onClick={() => edit(r)}
                          >
                            تعديل ونشر
                          </button>
                        )}
                        {section.fields && sectionId !== 'app_settings' && canPublish && (
                          <button
                            className="secondary"
                            style={{ minHeight: 38, padding: '8px 10px', fontSize: 11, color: '#a22f24' }}
                            disabled={busy}
                            onClick={() => deleteItem(r)}
                            title="حذف من الموقع أونلاين"
                          >
                            <Trash2 size={14} /> حذف
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="empty">
                    <FileText size={35} />
                    <h3>مفيش سجلات مطابقة في القسم ده</h3>
                    <p>
                      {section.fields
                        ? 'تقدر تضيف سجل جديد دلوقتي وهيتنشر أونلاين فوراً لكل الزوار.'
                        : 'هتظهر السجلات هنا لما تبقى متاحة على الخادم.'}
                    </p>
                  </div>
                )}
              </div>
            )}
            {cursor && (
              <button className="secondary" disabled={loading} onClick={() => refresh(true)}>
                تحميل سجلات أكتر
              </button>
            )}
          </>
        )}
      </div>

      {editor && (
        <div className="modal-overlay admin-overlay">
          <section className="admin-editor card" role="dialog" aria-modal="true" aria-label="تعديل بيانات السجل">
            <div className="admin-editor-heading">
              <div>
                <small>{editor.section.label}</small>
                <h2>{editor.id ? 'تعديل ونشر السجل أونلاين' : 'إضافة ونشر سجل جديد أونلاين'}</h2>
              </div>
              <button className="icon-button" aria-label="إغلاق محرر السجل" onClick={() => setEditor(null)}>
                <X />
              </button>
            </div>
            <div className="admin-connection live" style={{ marginBottom: 14 }}>
              <span className="small-dot" />
              أي تعديل هتحفظه هنا هيتنشر أونلاين فوراً على الموقع لجميع الزوار وعلى كل الأجهزة.
            </div>
            {error && (
              <div className="admin-error" role="alert">
                {error}
              </div>
            )}
            <form
              noValidate
              onSubmit={e => {
                e.preventDefault();
                void save();
              }}
            >
              <div className="admin-field-grid">
                {editor.section.fields!.map(f =>
                  f.type === 'image' ? (
                    <CoverPicker
                      key={`${editor.section.id}-${editor.id || 'new'}-${f.key}`}
                      label={f.label}
                      help={f.help}
                      isLogo={
                        editor.section.id === 'sports_clubs' ||
                        f.key === 'homeLogo' ||
                        f.key === 'awayLogo' ||
                        f.key === 'logoUrl'
                      }
                      value={editor.record[f.key] || ''}
                      onChange={value =>
                        setEditor(current =>
                          current ? { ...current, record: { ...current.record, [f.key]: value } } : current
                        )
                      }
                    />
                  ) : (
                    <label key={f.key} className={['textarea', 'list', 'json'].includes(f.type || '') ? 'wide' : ''}>
                      {f.label}
                      {f.type === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={!!editor.record[f.key]}
                          onChange={e =>
                            setEditor({ ...editor, record: { ...editor.record, [f.key]: e.target.checked } })
                          }
                        />
                      ) : f.type === 'select' ? (
                        <select
                          value={editor.record[f.key]}
                          onChange={e =>
                            setEditor({ ...editor, record: { ...editor.record, [f.key]: e.target.value } })
                          }
                        >
                          {f.options!.map(([v, n]) => (
                            <option key={v} value={v}>
                              {n}
                            </option>
                          ))}
                        </select>
                      ) : ['textarea', 'list', 'json'].includes(f.type || '') ? (
                        <textarea
                          rows={f.type === 'json' ? 5 : 3}
                          dir={f.type === 'json' ? 'ltr' : 'rtl'}
                          value={
                            Array.isArray(editor.record[f.key])
                              ? f.type === 'json'
                                ? JSON.stringify(editor.record[f.key], null, 2)
                                : editor.record[f.key].join('\n')
                              : editor.record[f.key] || ''
                          }
                          onChange={e =>
                            setEditor({ ...editor, record: { ...editor.record, [f.key]: e.target.value } })
                          }
                        />
                      ) : (
                        <input
                          type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                          step="any"
                          maxLength={1000}
                          value={editor.record[f.key] ?? ''}
                          onChange={e =>
                            setEditor({ ...editor, record: { ...editor.record, [f.key]: e.target.value } })
                          }
                        />
                      )}
                      {f.help && <small>{f.help}</small>}
                    </label>
                  )
                )}
              </div>
              <div className="admin-editor-actions">
                <button className="primary" disabled={busy}>
                  <Check size={17} />
                  {busy ? 'جاري النشر أونلاين…' : 'حفظ ونشر أونلاين الآن'}
                </button>
                <button type="button" className="secondary" onClick={() => setEditor(null)}>
                  إلغاء
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {detail && (
        <div className="modal-overlay admin-overlay">
          <section className="admin-editor card" role="dialog" aria-modal="true" aria-label="تفاصيل السجل ومراجعته">
            <div className="admin-editor-heading">
              <h2>{detail.name || detail.title || detail.record?.name || 'تفاصيل السجل'}</h2>
              <button className="icon-button" aria-label="إغلاق تفاصيل السجل" onClick={() => setDetail(null)}>
                <X />
              </button>
            </div>
            <dl className="admin-detail-list">
              {Object.entries(detail.record || detail)
                .filter(([k]) => !['editorUid', 'actorUid', '_seeded'].includes(k))
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>
                      {(section.fields || sections.find(s => s.id === detail.collection)?.fields)?.find(
                        f => f.key === k
                      )?.label ||
                        (
                          {
                            id: 'المعرّف',
                            status: 'الحالة',
                            revision: 'رقم النسخة',
                            verification: 'التحقق',
                            createdAt: 'تاريخ الإنشاء',
                            updatedAt: 'آخر تعديل',
                            published: 'منشور أونلاين',
                            action: 'العملية',
                            details: 'التفاصيل',
                            reason: 'السبب',
                          } as Record<string, string>
                        )[k] ||
                        k}
                    </dt>
                    <dd dir="auto">
                      {['imageUrl', 'innerImageUrl', 'heroImageUrl', 'logoUrl', 'magazineImageUrl'].includes(k) &&
                      safeCover(v) ? (
                        <img
                          src={safeCover(v)!}
                          alt=""
                          style={{ maxWidth: 260, borderRadius: 12, display: 'block', marginTop: 6 }}
                        />
                      ) : (
                        display(v)
                      )}
                    </dd>
                  </div>
                ))}
            </dl>
            {error && (
              <div className="admin-error" role="alert">
                {error}
              </div>
            )}

            {sectionId === 'admin_drafts' && (
              <>
                <div className="admin-compare">
                  <h3>مقارنة قبل النشر</h3>
                  {Object.keys(detail.record || {})
                    .filter(k => JSON.stringify(detail.before?.[k]) !== JSON.stringify(detail.record[k]))
                    .map(k => (
                      <div key={k}>
                        <b>
                          {sections
                            .find(s => s.id === detail.collection)
                            ?.fields?.find(f => f.key === k)?.label || k}
                        </b>
                        <p>
                          <del>{display(detail.before?.[k])}</del>
                        </p>
                        <p>{display(detail.record[k])}</p>
                      </div>
                    ))}
                </div>
                <button
                  className="secondary"
                  disabled={!canEdit}
                  onClick={() => {
                    const target = sections.find(s => s.id === detail.collection)!;
                    setEditor({
                      section: target,
                      id: detail.recordId,
                      revision: detail.revision,
                      record: detail.record,
                    });
                    setDetail(null);
                  }}
                >
                  كمّل تعديل المسودة
                </button>
                <label>
                  معرّف مصدر التحقق
                  <input
                    value={sourceId}
                    onChange={e => setSourceId(e.target.value)}
                    placeholder={detail.collection === 'data_sources' ? detail.recordId : 'معرّف مصدر منشور'}
                  />
                </label>
                <label>
                  إيه اللي اتراجع واتأكد؟
                  <textarea minLength={5} value={note} onChange={e => setNote(e.target.value)} />
                </label>
                <button
                  className="primary"
                  disabled={!canPublish || busy}
                  onClick={() =>
                    action(
                      () =>
                        call('adminPublish', {
                          draftId: detail.id,
                          revision: detail.revision,
                          sourceId: sourceId || 'admin-direct',
                          verificationNote: note,
                        }),
                      'تم نشر النسخة أونلاين بنجاح'
                    )
                  }
                >
                  <Check size={17} /> اعتماد ونشر أونلاين
                </button>
              </>
            )}

            {reviewers.includes(sectionId) && (
              <>
                <label>
                  ملاحظات المراجعة / سبب الرفض
                  <textarea minLength={5} value={note} onChange={e => setNote(e.target.value)} />
                </label>
                <div className="admin-review-actions">
                  {[
                    ['verification', 'بدء التحقق'],
                    ['clarification', 'طلب توضيح'],
                    ['approved', 'قبول'],
                    ['rejected', 'رفض'],
                  ].map(([decision, label]) => (
                    <button
                      className="secondary"
                      key={decision}
                      disabled={busy || note.trim().length < 5 || ['approved', 'rejected'].includes(detail.status)}
                      onClick={() =>
                        action(
                          () => call('adminReview', { collection: sectionId, id: detail.id, decision, note }),
                          'اتسجل قرار المراجعة أونلاين'
                        )
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {section.fields && sectionId !== 'app_settings' && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                <button className="primary" onClick={() => edit(detail)}>
                  <Check size={16} /> تعديل ونشر أونلاين
                </button>
                {canPublish && (
                  <button
                    className="secondary"
                    style={{ color: '#a22f24' }}
                    disabled={busy}
                    onClick={() => deleteItem(detail)}
                  >
                    <Trash2 size={16} /> حذف من الموقع أونلاين
                  </button>
                )}
              </div>
            )}

            {sectionId === 'data_versions' && (
              <button
                className="secondary"
                disabled={!canPublish || busy || !detail.before}
                onClick={() =>
                  action(
                    () => call('adminRestore', { versionId: detail.id }),
                    'تم استرجاع النسخة السابقة للمراجعة'
                  )
                }
              >
                <History size={17} /> استرجاع النسخة السابقة
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function RouteChecklist() {
  return (
    <ol className="admin-checklist">
      {[
        'تحكم ونشر مباشر أونلاين للأخبار والمقالات بصورة كوفر خارجية وداخلية',
        'تحكم ونشر مباشر أونلاين لخطوط المواصلات وأرقام الأتوبيسات ومكان الركوب والأجرة والمحطات',
        'تحكم ونشر مباشر أونلاين للأماكن والخروجات والفعاليات والرياضة',
        'تحكم ونشر مباشر أونلاين لنصوص وصور الواجهة الرئيسية وإعدادات الموقع',
      ].map((s, i) => (
        <li key={s}>
          <span>{i + 1}</span>
          {s}
        </li>
      ))}
    </ol>
  );
}
