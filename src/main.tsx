import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';

class Boundary extends React.Component<{ children: React.ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div dir="rtl" style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <h2>حصلت مشكلة في التحميل</h2>
        <p>جرّب تفتح التطبيق تاني. محفوظاتك على الجهاز لسه موجودة.</p>
        <button onClick={() => location.reload()}>حاول تاني</button>
      </div>
    ) : (
      this.props.children
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <Boundary>
    <App />
  </Boundary>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}


import './editorial.css';
