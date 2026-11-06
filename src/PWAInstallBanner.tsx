import React, { useState } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone, CheckCircle2, ChevronLeft } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, isDismissed, install, dismiss } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already running as installed standalone PWA or dismissed, hide
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      try {
        await install();
      } finally {
        setInstalling(false);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <aside
        className="pwa-install-banner"
        role="region"
        aria-label="رسالة تنصيب تطبيق إسكندريلا"
        style={{
          position: 'fixed',
          bottom: 74, // just above bottom nav
          left: 14,
          right: 14,
          maxWidth: 520,
          margin: '0 auto',
          background: 'linear-gradient(135deg, #102a43 0%, #0d2238 100%)',
          color: '#FAF6EE',
          borderRadius: 18,
          padding: '14px 16px',
          boxShadow: '0 12px 32px rgba(16, 42, 67, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
          border: '1.5px solid rgba(240, 198, 74, 0.35)',
          zIndex: 998,
          direction: 'rtl',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          backdropFilter: 'blur(10px)',
          animation: 'pwaSlideUp 0.35s ease-out forwards',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* App Icon */}
          <img
            src="/brand/eskendrella.png"
            alt="أيقونة إسكندريلا"
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              objectFit: 'cover',
              flexShrink: 0,
              background: '#ffffff',
              padding: 2,
              border: '1.5px solid #F0C64A',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <strong style={{ fontSize: 14.5, fontWeight: 900, color: '#F0C64A' }}>
                ثبّت إسكندريلا على موبايلك 📲
              </strong>
              <button
                type="button"
                onClick={dismiss}
                aria-label="إغلاق رسالة التثبيت"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#FAF6EE',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: 12, lineHeight: 1.45, color: 'rgba(250, 246, 238, 0.88)' }}>
              تصفّح أسرع بدون فتح المتصفح، مع وصول فوري لمواعيد مباريات الأندية، والمواصلات، وأماكن الخروج.
            </p>
          </div>
        </div>

        {/* Buttons Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          {isIOS ? (
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              style={{
                flex: 1,
                background: '#F0C64A',
                color: '#102A43',
                border: 'none',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(240, 198, 74, 0.3)',
              }}
            >
              <Smartphone size={15} />
              طريقة التثبيت للآيفون 🍎
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={installing}
              style={{
                flex: 1,
                background: '#F0C64A',
                color: '#102A43',
                border: 'none',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: installing ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(240, 198, 74, 0.3)',
              }}
            >
              <Download size={15} />
              {installing ? 'جاري الفتح…' : 'تثبيت التطبيق الآن'}
            </button>
          )}

          <button
            type="button"
            onClick={dismiss}
            style={{
              background: 'transparent',
              color: 'rgba(250, 246, 238, 0.75)',
              border: '1px solid rgba(250, 246, 238, 0.25)',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            لاحقًا
          </button>
        </div>
      </aside>

      {/* Guide Modal (For iOS Safari or manual installation instructions) */}
      {showGuide && (
        <div
          className="modal-overlay"
          onClick={() => setShowGuide(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            direction: 'rtl',
          }}
        >
          <div
            className="card"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 420,
              width: '100%',
              background: 'var(--card)',
              borderRadius: 20,
              padding: 22,
              border: '2px solid var(--border)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src="/brand/eskendrella.png"
                  alt=""
                  style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>
                    {isIOS ? 'تثبيت إسكندريلا على الآيفون' : 'تثبيت تطبيق إسكندريلا'}
                  </h3>
                  <small style={{ color: 'var(--muted)', fontSize: 11.5 }}>خطوتان سهلتان لتثبيت التطبيق</small>
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowGuide(false)}
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            {isIOS ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '14px 0' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#102A43',
                      color: '#F0C64A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    ١
                  </span>
                  <div>
                    <strong style={{ fontSize: 13.5, display: 'block', color: 'var(--text)' }}>
                      اضغط على زر المشاركة (Share)
                    </strong>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      الموجود في شريط متصفح سفاري السفلي <Share2 size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#102A43',
                      color: '#F0C64A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    ٢
                  </span>
                  <div>
                    <strong style={{ fontSize: 13.5, display: 'block', color: 'var(--text)' }}>
                      اختر «إضافة إلى الشاشة الرئيسية»
                    </strong>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Add to Home Screen <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> ثم اضغط «إضافة».
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '14px 0' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#102A43',
                      color: '#F0C64A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    ١
                  </span>
                  <div>
                    <strong style={{ fontSize: 13.5, display: 'block', color: 'var(--text)' }}>
                      من قائمة المتصفح (⋮)
                    </strong>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      اضغط على خيارات المتصفح أعلى أو أسفل الشاشة.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#102A43',
                      color: '#F0C64A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    ٢
                  </span>
                  <div>
                    <strong style={{ fontSize: 13.5, display: 'block', color: 'var(--text)' }}>
                      اختر «تثبيت التطبيق» أو «إضافة للشاشة»
                    </strong>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Install App وسيظهر إسكندريلا كأيقونة تطبيق كامل على جهازك.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              className="primary"
              onClick={() => setShowGuide(false)}
              style={{ width: '100%', marginTop: 8 }}
            >
              فهمت، شكرًا
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Compact install button for Header or Menu
export function PWAInstallHeaderButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="تثبيت تطبيق إسكندريلا على جهازك"
        className="pwa-header-install" aria-label="تثبيت التطبيق"
        style={{
          background: 'rgba(240, 198, 74, 0.15)',
          color: 'var(--accent-text, #F0C64A)',
          border: '1px solid rgba(240, 198, 74, 0.4)',
          borderRadius: 99,
          padding: '4px 10px',
          fontSize: 11.5,
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s ease',
        }}
      >
        <Download size={13} />
        <span>تثبيت التطبيق</span>
      </button>

      {showGuide && (
        <div
          className="modal-overlay"
          onClick={() => setShowGuide(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            direction: 'rtl',
          }}
        >
          <div
            className="card"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 380,
              width: '100%',
              background: 'var(--card)',
              borderRadius: 18,
              padding: 20,
              border: '2px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15.5 }}>تثبيت إسكندريلا</h3>
              <button type="button" className="icon-button" onClick={() => setShowGuide(false)}>
                <X size={17} />
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 14px' }}>
              {isIOS
                ? 'على الآيفون: اضغط على زر المشاركة (Share ⎋) في سفاري ثم اختر «إضافة إلى الشاشة الرئيسية».'
                : 'على الأندرويد والكمبيوتر: اضغط على خيارات المتصفح (⋮) واختر «تثبيت التطبيق». '}
            </p>
            <button type="button" className="primary" onClick={() => setShowGuide(false)} style={{ width: '100%' }}>
              حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
}
