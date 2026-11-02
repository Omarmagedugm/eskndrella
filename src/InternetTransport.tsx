import {useState} from 'react';
import {BusFront, ExternalLink, Search} from 'lucide-react';
import {normalize} from './data';
import {formatCityDate} from './cityContent';
import content from './researchedContent.json';
import './internetTransport.css';

const searchText = (value: string) => normalize(value).replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));

export default function InternetTransport() {
  const [search, setSearch] = useState('');
  const query = searchText(search);
  const lines = content.transportLines.filter(line =>
    searchText([line.number, line.origin, line.destination, ...line.via].join(' ')).includes(query));

  return <section className="internet-transport" aria-labelledby="internet-transport-title">
    <div className="catalog-heading">
      <span className="outline-tag"><BusFront size={16}/> {content.transportLines.length.toLocaleString('ar-EG')} خطوط من دليل الهيئة</span>
      <h2 id="internet-transport-title">خطوط الأتوبيس من المصدر الرسمي</h2>
      <p>أرقام الخطوط وأبرز المناطق المذكورة في دليل هيئة نقل الركاب. مراجعة المصدر: {formatCityDate(content.reviewedAt)}.</p>
    </div>
    <p className="content-note">الدليل لا يوضح التشغيل اللحظي أو مواعيد القيام والأجرة الحالية. المناطق التالية مختارة من المسار المنشور؛ تأكد من الهيئة قبل السفر.</p>
    <label className="catalog-search">
      <Search size={18}/>
      <input aria-label="ابحث في خطوط الهيئة بالرقم أو المنطقة" placeholder="رقم الخط أو المنطقة…" value={search} onChange={event => setSearch(event.target.value)}/>
    </label>
    <p className="catalog-count" role="status">{lines.length.toLocaleString('ar-EG')} خطوط مطابقة</p>
    <div className="internet-transport-grid">
      {lines.map(line => <article className="card internet-transport-card" key={line.number}>
        <div className="internet-line-heading"><span className="internet-line-number">{line.number}</span><h3>{line.origin} ← {line.destination}</h3></div>
        <p className="internet-line-via"><b>من المناطق المذكورة:</b> {line.via.join('، ')}</p>
        <details>
          <summary>مصدر الخط وحالة المعلومة</summary>
          <p>بيانات مرجعية من موقع الهيئة؛ التشغيل الحالي والأجرة غير مؤكدين هنا، ولا تُستخدم هذه القائمة في حساب الرحلات تلقائيًا.</p>
          <a href={content.transportSource.url} target="_blank" rel="noreferrer">{content.transportSource.name} <ExternalLink size={14}/></a>
        </details>
      </article>)}
    </div>
    {!lines.length && <p className="card city-empty">مفيش خط مطابق. جرّب رقمًا أو منطقة تانية.</p>}
  </section>;
}
