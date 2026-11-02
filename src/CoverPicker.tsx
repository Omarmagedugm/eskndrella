import { useRef, useState, useEffect } from 'react';
import { ImagePlus, Trash2, CheckCircle2 } from 'lucide-react';
import { prepareCover, safeCover } from './coverImage';

export default function CoverPicker({
  value,
  onChange,
  label = 'صورة الكوفر',
  help,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  help?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sequence = useRef(0);

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

  return (
    <div className="cover-picker wide">
      <b>{label}</b>
      <small>{help || 'اختار صورة من جهازك أو حط رابط صورة مباشر.'}</small>
      {preview ? (
        <div style={{ display: 'grid', gap: 6 }}>
          <img
            key={preview}
            src={preview}
            alt={`معاينة ${label}`}
            onError={() => setError('الصورة مش ظاهرة. راجع الرابط أو اختار صورة من جهازك.')}
          />
          <small style={{ color: 'var(--teal)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={15} /> الصورة الحالية مفعّلة ومحفوظة (تقدر تسيبها زي ما هي أو تغيرها)
          </small>
        </div>
      ) : (
        <div className="cover-placeholder">
          <ImagePlus size={30} />
          <span>مفيش {label}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label className="secondary cover-file">
          <ImagePlus size={17} />
          {busy ? 'بنجهز الصورة…' : 'ارفع صورة من جهازك'}
          <input
            type="file"
            aria-label={`اختيار ${label} من الجهاز`}
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={async e => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const current = ++sequence.current;
              setBusy(true);
              setError('');
              try {
                const result = await prepareCover(file);
                if (sequence.current === current) onChange(result);
              } catch (err) {
                if (sequence.current === current) setError(err instanceof Error ? err.message : 'الصورة مش مدعومة');
              } finally {
                if (sequence.current === current) setBusy(false);
              }
            }}
          />
        </label>
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
      </div>
      <label>
        أو رابط صورة خارجي (اختياري — سيبه فاضي لو الصورة مرفوعة أو افتراضية)
        <input
          type="text"
          inputMode="url"
          placeholder={
            isBuiltInBrand
              ? `مفعّل حاليًا: ${value} (اكتب رابط https:// هنا لو عايز تغيره)`
              : isDataUri
                ? 'مفعّل حاليًا: صورة مرفوعة من جهازك'
                : 'https://…'
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
          <Trash2 size={16} /> إزالة الصورة
        </button>
      )}
      <small>JPG / PNG / WebP حتى ١٠ ميجابايت. الصورة بتتصغّر تلقائيًا وبتتنشر فورًا مع السجل.</small>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
    </div>
  );
}
