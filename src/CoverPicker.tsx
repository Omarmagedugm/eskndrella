import { useRef, useState, useEffect } from 'react';
import { ImagePlus, Trash2, CheckCircle2, Shield, Upload } from 'lucide-react';
import { prepareCover, prepareClubLogo, safeCover } from './coverImage';
import { ALEX_CLUB_LOGOS, getAlexClubVectorDataUri } from './clubLogos';

export default function CoverPicker({
  value,
  onChange,
  label = 'صورة الكوفر',
  help,
  isLogo,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  help?: string;
  isLogo?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sequence = useRef(0);

  // Automatically detect if field is a logo field
  const isLogoField = isLogo ?? /شعار|لوجو|logo|crest|badge/i.test(label || '');

  useEffect(
    () => () => {
      sequence.current++;
    },
    []
  );

  const preview = safeCover(value);
  const isDataUri = typeof value === 'string' && value.startsWith('data:');
  const isBuiltInBrand = typeof value === 'string' && value.startsWith('/');
  const externalUrlValue = isDataUri || isBuiltInBrand ? '' : value || '';

  const checkerboardStyle: React.CSSProperties = isLogoField
    ? {
        backgroundImage:
          'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%)',
        backgroundPosition: '50%',
        backgroundSize: '16px 16px',
        padding: 12,
        borderRadius: 12,
        border: '1px solid var(--border)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 110,
        maxHeight: 180,
      }
    : {};

  return (
    <div className="cover-picker wide">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <b style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {isLogoField && <span>🛡️</span>}
          {label}
        </b>
        {isLogoField && (
          <span style={{ fontSize: 11, background: '#e8f5e9', color: '#1b5e20', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
            يدعم PNG بخلفية شفافة
          </span>
        )}
      </div>

      <small>
        {help ||
          (isLogoField
            ? 'ارفع ملف PNG شفاف من جهازك للحفاظ على تفاصيل الشعار وخلفيته الشفافة بدون مربعات بيضاء.'
            : 'اختار صورة من جهازك أو حط رابط صورة مباشر.')}
      </small>

      {preview ? (
        <div style={{ display: 'grid', gap: 8, justifyItems: isLogoField ? 'center' : 'stretch' }}>
          <div style={checkerboardStyle}>
            <img
              key={preview}
              src={preview}
              alt={`معاينة ${label}`}
              style={
                isLogoField
                  ? {
                      maxHeight: 120,
                      maxWidth: 160,
                      objectFit: 'contain',
                      display: 'block',
                    }
                  : undefined
              }
              onError={() => setError('الصورة مش ظاهرة. راجع الرابط أو اختار صورة من جهازك.')}
            />
          </div>
          <small
            style={{
              color: 'var(--teal)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <CheckCircle2 size={15} />
            {isLogoField
              ? 'شعار النادي مفعّل ومحفوظ (جاهز للعرض بجوار الاسم في كل الأماكن)'
              : 'الصورة الحالية مفعّلة ومحفوظة (تقدر تسيبها زي ما هي أو تغيرها)'}
          </small>
        </div>
      ) : (
        <div className="cover-placeholder" style={checkerboardStyle}>
          <ImagePlus size={30} />
          <span>مفيش {label}</span>
        </div>
      )}

      {/* Upload and Presets */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="secondary cover-file" style={isLogoField ? { background: '#102a43', color: '#f0c64a', borderColor: '#f0c64a' } : undefined}>
          <Upload size={17} />
          {busy ? 'بنجهز الشعار…' : isLogoField ? 'ارفع شعار PNG شفاف من جهازك' : 'ارفع صورة من جهازك'}
          <input
            type="file"
            aria-label={`اختيار ${label} من الجهاز`}
            accept={isLogoField ? 'image/png,image/webp,image/jpeg,image/svg+xml' : 'image/jpeg,image/png,image/webp'}
            disabled={busy}
            onChange={async e => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const current = ++sequence.current;
              setBusy(true);
              setError('');
              try {
                const result = isLogoField
                  ? await prepareClubLogo(file)
                  : await prepareCover(file);
                if (sequence.current === current) onChange(result);
              } catch (err) {
                if (sequence.current === current)
                  setError(err instanceof Error ? err.message : 'الصورة مش مدعومة');
              } finally {
                if (sequence.current === current) setBusy(false);
              }
            }}
          />
        </label>

        {isLogoField ? (
          /* Presets for Alexandria clubs */
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>أو اختر من شعارات إسكندرية الجاهزة:</span>
            {Object.entries(ALEX_CLUB_LOGOS).map(([key, item]) => {
              const vectorUri = getAlexClubVectorDataUri(key);
              if (!vectorUri) return null;
              return (
                <button
                  key={key}
                  type="button"
                  className="secondary"
                  style={{ padding: '4px 8px', fontSize: 11.5, minHeight: 30 }}
                  disabled={busy}
                  onClick={() => {
                    setError('');
                    onChange(vectorUri);
                  }}
                  title={`استخدام شعار فيكتور ${item.name}`}
                >
                  {item.short}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => {
                setError('');
                onChange('/brand/magazine.jpeg');
              }}
            >
              غلاف المجلة الافتراضي
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => {
                setError('');
                onChange('/brand/eskendrella.png');
              }}
            >
              شعار إسكندريلا
            </button>
          </>
        )}
      </div>

      {/* External URL */}
      <label>
        أو رابط صورة خارجي (اختياري — سيبه فاضي لو الصورة مرفوعة أو افتراضية)
        <input
          type="text"
          inputMode="url"
          placeholder={
            isBuiltInBrand
              ? `مفعّل حاليًا: ${value} (اكتب رابط https:// هنا لو عايز تغيره)`
              : isDataUri
                ? isLogoField
                  ? 'مفعّل حاليًا: شعار PNG مرفوع ومحفوظ'
                  : 'مفعّل حاليًا: صورة مرفوعة من جهازك'
                : 'https://… (رابط صورة مباشر)'
          }
          dir="ltr"
          maxLength={1000}
          disabled={busy}
          value={externalUrlValue}
          onChange={e => {
            setError('');
            onChange(e.target.value);
          }}
        />
      </label>

      {value && (
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={() => {
            onChange('');
            setError('');
          }}
        >
          <Trash2 size={16} /> {isLogoField ? 'إزالة الشعار واستعادة الافتراضي' : 'إزالة الصورة'}
        </button>
      )}

      <small>
        {isLogoField
          ? 'ملفات PNG أو WebP أو SVG أو JPG حتى ١٠ ميجابايت. يتم حفظ شفافية الخلفية وضغطها تلقائيًا لقاعدة البيانات.'
          : 'JPG / PNG / WebP حتى ١٠ ميجابايت. الصورة بتتصغّر تلقائيًا وتتحفظ مع السجل؛ النشر حسب صلاحيات حسابك.'}
      </small>

      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
    </div>
  );
}
