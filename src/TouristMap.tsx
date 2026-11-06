import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Map, 
  Marker, 
  LngLatBounds, 
  NavigationControl, 
  setWorkerUrl 
} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  MapPin, 
  Search, 
  Compass, 
  Landmark, 
  Navigation, 
  Bookmark, 
  Check, 
  ExternalLink, 
  X, 
  Clock, 
  Ticket, 
  Building2, 
  Palmtree, 
  Waves, 
  BookOpen,
  Share2
} from 'lucide-react';
import { safeCover } from './coverImage';
import { subscribePublic, firebaseReady } from './firebase';
import { normalize } from './data';
import './touristMap.css';

setWorkerUrl(workerUrl);

export interface TouristPlace {
  id: string;
  name: string;
  category: 'landmarks' | 'museums' | 'palaces' | 'scenic' | 'culture';
  categoryLabel: string;
  region: string;
  address: string;
  lat: number;
  lng: number;
  summary: string;
  description?: string;
  imageUrl?: string;
  openingHours?: string;
  priceNote?: string;
  ticketPrice?: { adult?: number; student?: number };
  sourceName?: string;
  sourceUrl?: string;
}

export const ALEX_TOURIST_PLACES: TouristPlace[] = [
  {
    id: 'qaitbay',
    name: 'قلعة قايتباي',
    category: 'landmarks',
    categoryLabel: 'معالم أثرية',
    region: 'الأنفوشي / بحري',
    address: 'نهاية ممشى قايتباي، رأس التين، الأنفوشي',
    lat: 31.2141,
    lng: 29.8856,
    summary: 'أعرق قلاع البحر المتوسط، شُيدت مكان فنار الإسكندرية القديم سنة ١٤٧٧م وتجمع التاريخ والأطلال الساحلية الساحرة.',
    description: 'قلعة دفاعية مهيبة أسسها السلطان الأشرف سيف الدين قايتباي في القرن الخامس عشر لحماية الثغور المصرية من الغزوات. تضم مسجداً قديماً وأبراجاً استطلاعية وإطلالة فريدة بزاوية ٣٦٠ درجة على الميناء الشرقي والبحر المفتوح.',
    imageUrl: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=900&q=80',
    openingHours: '٩:٠٠ ص – ٥:٠٠ م يومياً (شباك التذاكر يغلق ٤:٠٠ م)',
    priceNote: 'المصريون: ٦٠ جنيهاً للكبار و٣٠ للطلبة',
    ticketPrice: { adult: 60, student: 30 },
    sourceName: 'وزارة السياحة والآثار',
    sourceUrl: 'https://egymonuments.gov.eg/monuments/qaitbay-fort/'
  },
  {
    id: 'library',
    name: 'مكتبة الإسكندرية',
    category: 'culture',
    categoryLabel: 'ثقافة ومراكز علمية',
    region: 'الشاطبي',
    address: 'طريق الجيش، كورنيش الشاطبي',
    lat: 31.2089,
    lng: 29.9092,
    summary: 'صرح المعرفة العالمي وأيقونة الثقافة المطلة على الكورنيش، تضم متاحف آثار ومخطوطات وقبة سماوية ومعارض عالمية.',
    description: 'إعادة إحياء لمكتبة الإسكندرية القديمة، بتصميم معماري دائري مائل كقرص شمس يشرق على البحر. تحتوي على قاعات قراءة كبرى ومتحف الآثار ومتحف المخطوطات ومركز القبة السماوية العلمي ومكتبة الفنون والوسائط.',
    imageUrl: 'https://images.unsplash.com/photo-1590076215667-873d3b02a806?auto=format&fit=crop&w=900&q=80',
    openingHours: '٩:٣٠ ص – ٧:٠٠ م (الجمعة والسبت مواعيد خاصة)',
    priceNote: 'دخول مجمع المكتبة: تذكرة عامة وتذاكر متخصصة للمتاحف والقبة السماوية',
    sourceName: 'مكتبة الإسكندرية',
    sourceUrl: 'https://www.bibalex.org/'
  },
  {
    id: 'graeco-roman',
    name: 'المتحف اليوناني الروماني',
    category: 'museums',
    categoryLabel: 'متاحف وتراث',
    region: 'وسط البلد / محطة الرمل',
    address: 'شارع المتحف، متفرع من طريق الحرية، محطة الرمل',
    lat: 31.1992,
    lng: 29.9064,
    summary: 'أكبر وأهم متحف متخصص في حضارة مصر خلال العصرين اليوناني والروماني بعد تطويره وتحديثه بالكامل.',
    description: 'يضم آلاف القطع الأثرية النادرة من تماثيل رخامية للإسكندر الأكبر وبطليموس وعملات ذهبية ومومياوات وزخارف حجرية تروي امتزاج الثقافتين المصرية واليونانية في الإسكندرية.',
    imageUrl: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=900&q=80',
    openingHours: '٩:٠٠ ص – ٥:٠٠ م يومياً',
    priceNote: 'المصريون: ٤٠ جنيهاً للكبار و٢٠ للطلبة',
    ticketPrice: { adult: 40, student: 20 },
    sourceName: 'وزارة السياحة والآثار',
    sourceUrl: 'https://egymonuments.gov.eg/en/museums/graeco-roman-museum'
  },
  {
    id: 'jewelry',
    name: 'متحف المجوهرات الملكية',
    category: 'palaces',
    categoryLabel: 'قصور وحدائق',
    region: 'زيزينيا',
    address: '٢٧ شارع أحمد يحيى باشا، زيزينيا',
    lat: 31.2408,
    lng: 29.9634,
    summary: 'قصر الأميرة فاطمة الزهراء، يجمع روعة العمارة الأوروبية الزاخرة بالفسيفساء مع أندر تيجان ومجوهرات الأسرة العلوية.',
    description: 'تحفة معمارية لا مثيل لها بنيت عام ١٩١٩م، تضم لوحات زيتية جدارية وزجاجاً معشقاً فريداً ومجموعات مذهلة من مجوهرات الملك فاروق والملكة ناريمان وأسرة محمد علي باشا المرصعة بالألماس والزمرد.',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=80',
    openingHours: '٩:٠٠ ص – ٥:٠٠ م (التذاكر حتى ٤:٠٠ م)',
    priceNote: 'المصريون: ٣٠ جنيهاً للكبار و١٠ للطلبة',
    ticketPrice: { adult: 30, student: 10 },
    sourceName: 'وزارة السياحة والآثار',
    sourceUrl: 'https://egymonuments.gov.eg/ar/museums/royal-jewelry-museum/'
  },
  {
    id: 'montaza',
    name: 'حدائق وقصر المنتزه الملكية',
    category: 'palaces',
    categoryLabel: 'قصور وحدائق',
    region: 'المنتزه',
    address: 'نهاية كورنيش الإسكندرية شرقاً، المنتزه',
    lat: 31.2882,
    lng: 30.0163,
    summary: 'واحة الطبيعة والبحر الملكية، تضم قصري الحرملك والسلاملك والكوبري التاريخي وغابات الصنوبر الشاسعة.',
    description: 'أكبر متنزه ساحلي ملكي في الإسكندرية بمساحة تتجاوز ٣٧٠ فداناً، يطل على خلجان ساحرة وأشجار نادرة وجسور عتيقة وسط أجواء راقية ونسيم بحري عليل.',
    imageUrl: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=900&q=80',
    openingHours: 'مفتوح يومياً من ٨:٠٠ ص حتى منتصف الليل',
    priceNote: 'تذكرة دخول بوابات الحدائق: ٢٥ جنيهاً للفرد',
    ticketPrice: { adult: 25 },
    sourceName: 'إدارة حدائق المنتزه'
  },
  {
    id: 'stanley',
    name: 'كوبري ستانلي',
    category: 'scenic',
    categoryLabel: 'بحر وكورنيش',
    region: 'ستانلي',
    address: 'طريق الجيش، خليج ستانلي',
    lat: 31.2355,
    lng: 29.9488,
    summary: 'أشهر معالم الإسكندرية الحديثة، بأبراجه الفلورنسية الأربعة وإطلالته الخلابة على خليج البحر وشاطئ ستانلي.',
    description: 'جسر مشاة ومركبات يمتد بطول ٤٠٠ متر فوق مياه البحر المتوسط، صمم على طراز العمارة الإيطالية الفلورنسية ويعد الوجهة المفضلة للممشى المسائي والتقاط الصور التذكارية.',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80',
    openingHours: 'مفتوح للجمهور على مدار ٢٤ ساعة مجاناً',
    priceNote: 'زيارة مجانية للممشى العام'
  },
  {
    id: 'dikka',
    name: 'المسرح الروماني وآثار كوم الدكة',
    category: 'landmarks',
    categoryLabel: 'معالم أثرية',
    region: 'كوم الدكة / وسط البلد',
    address: 'ميدان الشهداء، كوم الدكة، وسط الإسكندرية',
    lat: 31.1950,
    lng: 29.9048,
    summary: 'المسرح الروماني الوحيد المكتشف في مصر، وحمامات أثرية ومدرجات رخامية وفيلا الطيور الشهيرة.',
    description: 'مجمع أثري فريد يعود للقرن الرابع الميلادي، يضم مدرجاً نصف دائري من الرخام الأبيض كان يُستخدم للمحاضرات والعروض، إضافة إلى حمامات رومانية وأكاديمية قديمة للمحاضرات الفلسفية.',
    imageUrl: 'https://images.unsplash.com/photo-1548625361-1250325a7251?auto=format&fit=crop&w=900&q=80',
    openingHours: '٩:٠٠ ص – ٥:٠٠ م يومياً',
    priceNote: 'المصريون: ٢٠ جنيهاً للكبار و١٠ للطلبة',
    ticketPrice: { adult: 20, student: 10 },
    sourceName: 'وزارة السياحة والآثار',
    sourceUrl: 'https://egymonuments.gov.eg/ar/archaeological-sites/kom-el-dikka/'
  },
  {
    id: 'pompeys-pillar',
    name: 'عمود السواري ومعبد السرابيوم',
    category: 'landmarks',
    categoryLabel: 'معالم أثرية',
    region: 'كرموز',
    address: 'هضبة كرموز، شارع عمود السواري',
    lat: 31.1825,
    lng: 29.8965,
    summary: 'أعلى نصب تذكاري منفرد من الجرانيت الوردي في العالم القديم بارتفاع ٢٧ متراً، شُيد تكريماً للإمبراطور دقلديانوس.',
    description: 'يقف العمود شامخاً فوق هضبة أثرية تضم بقايا معبد السرابيوم العظيم ومقاييس نيلية وأنفاق سرية وتماثيل لأبي الهول من الجرانيت تعود للعهد البطلمي.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=80',
    openingHours: '٩:٠٠ ص – ٤:٣٠ م',
    priceNote: 'المصريون: ٢٠ جنيهاً للكبار و١٠ للطلبة',
    ticketPrice: { adult: 20, student: 10 },
    sourceName: 'وزارة السياحة والآثار'
  },
  {
    id: 'kom-shoqafa',
    name: 'مقابر كوم الشقافة الكاتاكومب',
    category: 'landmarks',
    categoryLabel: 'معالم أثرية',
    region: 'كرموز',
    address: 'شارع كوم الشقافة، كرموز',
    lat: 31.1786,
    lng: 29.8931,
    summary: 'إحدى عجائب القرون الوسطى السبع، مقابر أثرية ضخمة منحوتة داخل الصخر بعمق ثلاثة طوابق تحت الأرض.',
    description: 'تمزج مقابر كوم الشقافة بين الفنون الجنائزية الفرعونية واليونانية والرومانية في مشهد فريد يضم قاعة طعام الموتى ونقوشاً أسطورية لحراس المقبرة برؤوس كلاب وأنوف ملونة.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
    openingHours: '٩:٠٠ ص – ٤:٣٠ م يومياً',
    priceNote: 'المصريون: ٢٠ جنيهاً للكبار و١٠ للطلبة',
    ticketPrice: { adult: 20, student: 10 },
    sourceName: 'وزارة السياحة والآثار'
  },
  {
    id: 'national',
    name: 'متحف الإسكندرية القومي',
    category: 'museums',
    categoryLabel: 'متاحف وتراث',
    region: 'طريق الحرية / الشلالات',
    address: '١١٠ طريق الحرية (شارع فؤاد سابقاً)',
    lat: 31.2009,
    lng: 29.9132,
    summary: 'قصر إيطالي فخم يعرض أكثر من ١٨٠٠ قطعة أثرية تمثل العصور الفرعونية واليونانية والبيزنطية والإسلامية والآثار الغارقة.',
    description: 'قصر التاجر أسعد باسيلي الذي تحول إلى متحف قومي متميز سنة ٢٠٠٣، يعرض آثاراً منتقاة بعناية تشمل الآثار المستخرجة من قاع البحر وقسماً مخصصاً لعصر الأسرة العلوية.',
    imageUrl: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=900&q=80',
    openingHours: '٩:٠٠ ص – ٥:٠٠ م (شباك التذاكر يغلق ٤:٠٠ م)',
    priceNote: 'المصريون: ٢٠ جنيهاً للكبار و٥ جنيهات للطلبة',
    ticketPrice: { adult: 20, student: 5 },
    sourceName: 'وزارة السياحة والآثار',
    sourceUrl: 'https://egymonuments.gov.eg/en/museums/alexandria-national-museum'
  },
  {
    id: 'mursi-abbas',
    name: 'جامع المرسي أبو العباس وميدان المساجد',
    category: 'landmarks',
    categoryLabel: 'معالم أثرية',
    region: 'بحري / الأنفوشي',
    address: 'ميدان المساجد، الأنفوشي، بحري',
    lat: 31.2057,
    lng: 29.8822,
    summary: 'درة العمارة الأندلسية والإسلامية في الإسكندرية بقبابه الثمانية المضلعة ومئذنته الباسقة المطلة على البحر.',
    description: 'المسجد الأهم في قلب حي بحري التاريخي، شيد فوق ضريح الشيخ الأندلسي شهاب الدين أبو العباس المرسي، ويتميز بالزخارف الجبسية الأندلسية والفوانيس النحاسية الفاخرة.',
    imageUrl: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=900&q=80',
    openingHours: 'مفتوح للصلوات والزيارة طوال اليوم',
    priceNote: 'زيارة مجانية'
  },
  {
    id: 'planetarium',
    name: 'مركز القبة السماوية العلمي',
    category: 'culture',
    categoryLabel: 'ثقافة ومراكز علمية',
    region: 'الشاطبي',
    address: 'مجمع مكتبة الإسكندرية، الشاطبي',
    lat: 31.2095,
    lng: 29.9095,
    summary: 'عروض فلكية وبصرية مبهرة للفضاء الخارجي ومتحف تاريخ العلوم وقاعة استكشافية للأطفال والشباب.',
    description: 'يقدم رحلات تفاعلية في أعماق الفضاء وعجائب النجوم، ومتحفاً يوثق إسهامات العلماء المسلمين والمصريين واليونانيين في الطب والفلك والرياضيات.',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=900&q=80',
    openingHours: 'حسب جدول العروض الرسمي المعلن بموقع المركز',
    priceNote: 'المصريون: ٥٠ جنيهاً للكبار و٢٠ للطلبة',
    ticketPrice: { adult: 50, student: 20 },
    sourceName: 'مركز القبة السماوية العلمي'
  },
  {
    id: 'shallalat',
    name: 'حدائق الشلالات التاريخية',
    category: 'palaces',
    categoryLabel: 'قصور وحدائق',
    region: 'باب شرق / وسط البلد',
    address: 'بين باب شرق ومحطة مصر، وسط البلد',
    lat: 31.2003,
    lng: 29.9115,
    summary: 'متنزه تراثي واسع يضم بقايا السور العربي القديم للإسكندرية وأبراج مراقبة وبحيرات مائية خلابة.',
    description: 'أنشئت الحدائق في أواخر القرن التاسع عشر على مساحة خضراء شاسعة مقسمة لقسمين بحري وقبلي، وتعتبر متنفساً هادئاً لهواة الطبيعة والآثار الإسلامية المحصنة.',
    imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=900&q=80',
    openingHours: 'مفتوح يومياً من ٨:٠٠ ص حتى غروب الشمس',
    priceNote: 'دخول عام مجاني أو رمزي'
  },
  {
    id: 'ras-el-tin',
    name: 'قصر وممشى رأس التين الملكي',
    category: 'palaces',
    categoryLabel: 'قصور وحدائق',
    region: 'رأس التين / بحري',
    address: 'أقصى غرب شبه جزيرة بحري، رأس التين',
    lat: 31.1996,
    lng: 29.8698,
    summary: 'أقدم القصور الحكومية الرسمية في مصر، شهد عهد محمد علي باشا وتوديع الملك فاروق على متن المحروسة.',
    description: 'تحفة معمارية بنيت على الطراز الإيطالي المطل مباشرة على الميناء الغربي والبحر، ويتميز بممشاه الساحلي الهادئ ومحلات الأسماك التراثية القريبة.',
    imageUrl: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=900&q=80',
    openingHours: 'الممشى الخارجي والمناطق المحيطة متاحة للتنزه',
    priceNote: 'تنزه حر بالممشى الساحلي'
  },
  {
    id: 'mostafa-kamel',
    name: 'مقابر مصطفى كامل الأثرية',
    category: 'landmarks',
    categoryLabel: 'معالم أثرية',
    region: 'رشدي',
    address: 'شارع المعسكر الروماني، رشدي',
    lat: 31.2265,
    lng: 29.9360,
    summary: 'أربع مقابر بطلمية منحوتة في الصخر الرملي تعود للقرنين الثاني والثالث قبل الميلاد ببهو مفتوح ملون.',
    description: 'موقع جنائزي بطلمي بارز اكتشف عام ١٩٣٣م، يتميز بفناء مفتوح منحوت تحت مستوى الأرض وأعمدة دورية وألوان أصلية ما زالت بادية على الجدران.',
    imageUrl: 'https://images.unsplash.com/photo-1548625361-1250325a7251?auto=format&fit=crop&w=900&q=80',
    openingHours: '٩:٠٠ ص – ٤:٠٠ م',
    priceNote: 'المصريون: ٢٠ جنيهاً للكبار و١٠ للطلبة',
    ticketPrice: { adult: 20, student: 10 },
    sourceName: 'وزارة السياحة والآثار'
  },
  {
    id: 'raml-corniche',
    name: 'ممشى محطة الرمل وكورنيش المنشية',
    category: 'scenic',
    categoryLabel: 'بحر وكورنيش',
    region: 'محطة الرمل / المنشية',
    address: 'ميدان سعد زغلول والكورنيش، محطة الرمل',
    lat: 31.2015,
    lng: 29.9002,
    summary: 'قلب الإسكندرية النابض بالحياة، يجمع العمارة الكلاسيكية الإيطالية واليونانية ومقاهي القهوة العريقة والممشى البحري.',
    description: 'أشهر ميادين وممشى ساحلي في المدينة، موطن حلواني ديليس وكافيه تريانون التاريخيين وتماثيل سعد زغلول وبداية خط ترام الرمل العتيق.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    openingHours: 'متاح على مدار الساعة',
    priceNote: 'ممشى عام مفتوح'
  },
  {
    id: 'maamoura',
    name: 'شواطئ وحدائق المعمورة',
    category: 'scenic',
    categoryLabel: 'بحر وكورنيش',
    region: 'المعمورة',
    address: 'شرق المنتزه، المعمورة الشاطئ',
    lat: 31.2820,
    lng: 30.0305,
    summary: 'شاطئ هادئ وممشى سياحي ممتد ومساحات خضراء لتأجير الدراجات والتنزه العائلي المريح.',
    description: 'منطقة سياحية متكاملة شرق الإسكندرية تشتهر بنظافة شواطئها وأشجار الكازوارينا ومطاعم البحر ومسارات ركوب العجل.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    openingHours: 'مفتوح يومياً على مدار اليوم',
    priceNote: 'رسوم دخول بوابات المعمورة: ٢٠ جنيهاً للفرد'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'كل المعالم', icon: Landmark },
  { id: 'landmarks', label: 'معالم أثرية', icon: Landmark },
  { id: 'museums', label: 'متاحف وتراث', icon: Building2 },
  { id: 'palaces', label: 'قصور وحدائق', icon: Palmtree },
  { id: 'scenic', label: 'بحر وكورنيش', icon: Waves },
  { id: 'culture', label: 'ثقافة وعلوم', icon: BookOpen }
];

interface TouristMapProps {
  navigate: (tab: string) => void;
  save?: (text: string) => void;
  saved?: string[];
}

export default function TouristMap({ navigate, save, saved = [] }: TouristMapProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlace, setSelectedPlace] = useState<TouristPlace | null>(ALEX_TOURIST_PLACES[0]);
  const [modalPlace, setModalPlace] = useState<TouristPlace | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [remotePlaces, setRemotePlaces] = useState<any[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);

  // Listen to custom places added via Admin / Firestore
  useEffect(() => {
    let unsub = () => {};
    if (firebaseReady) {
      unsub = subscribePublic('city_places', (data: any[]) => {
        if (Array.isArray(data)) {
          setRemotePlaces(data.filter(d => typeof d.lat === 'number' && typeof d.lng === 'number' && !d.archived));
        }
      });
    }
    return () => unsub();
  }, []);

  // Combine default with custom remote places
  const allPlaces = useMemo(() => {
    const list: TouristPlace[] = [...ALEX_TOURIST_PLACES];
    if (remotePlaces.length > 0) {
      remotePlaces.forEach(rp => {
        if (!list.some(p => p.id === rp.id)) {
          list.push({
            id: rp.id,
            name: rp.name,
            category: (rp.category as any) || 'landmarks',
            categoryLabel: rp.category === 'museum' ? 'متاحف وتراث' : 'معالم أثرية',
            region: rp.region || 'إسكندرية',
            address: rp.address || rp.region || 'إسكندرية',
            lat: rp.lat,
            lng: rp.lng,
            summary: rp.summary || 'معلم أثري وسياحي في الإسكندرية.',
            description: rp.description || rp.summary,
            imageUrl: rp.imageUrl,
            openingHours: rp.openingHours,
            priceNote: rp.priceNote,
            sourceName: rp.sourceName,
            sourceUrl: rp.sourceUrl
          });
        }
      });
    }
    return list;
  }, [remotePlaces]);

  // Filtered places according to category and search query
  const filteredPlaces = useMemo(() => {
    return allPlaces.filter(p => {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = normalize(searchQuery);
        const text = normalize(`${p.name} ${p.region} ${p.summary} ${p.categoryLabel}`);
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [allPlaces, activeCategory, searchQuery]);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let map: Map;
    try {
      map = new Map({
        container: mapContainerRef.current,
        style: import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty',
        center: [29.93, 31.22],
        zoom: 12,
        attributionControl: { compact: true }
      });
      map.addControl(new NavigationControl({ showCompass: true }), 'top-left');
      mapInstanceRef.current = map;
    } catch (err) {
      console.warn('MapLibre GL failed to initialize in TouristMap:', err);
      return;
    }

    map.on('load', () => {
      try {
        map.resize();
      } catch {}

      // Prefer Arabic names on map layers
      for (const layer of map.getStyle().layers) {
        if (layer.type === 'symbol' && layer.layout?.['text-field']) {
          try {
            map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name:ar'], ['get', 'name']]);
          } catch {}
        }
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map markers when filtered places or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = new LngLatBounds();

    filteredPlaces.forEach(place => {
      bounds.extend([place.lng, place.lat]);

      const isSelected = selectedPlace?.id === place.id;

      // Pin DOM element
      const pinEl = document.createElement('button');
      pinEl.type = 'button';
      pinEl.className = `tourist-map-pin ${isSelected ? 'active' : ''}`;
      pinEl.setAttribute('aria-label', place.name);
      pinEl.title = `${place.name} — ${place.region}`;

      pinEl.innerHTML = `
        <div class="tourist-pin-badge">
          <span></span>
        </div>
        <div class="tourist-pin-pointer"></div>
      `;

      pinEl.querySelector('span')!.textContent=place.name;
      pinEl.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedPlace(place);
        map.flyTo({
          center: [place.lng, place.lat],
          zoom: 14.2,
          duration: 600
        });
      });

      const marker = new Marker({ element: pinEl })
        .setLngLat([place.lng, place.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // If initial load or filter changed, adjust map bounds smoothly
    if (filteredPlaces.length > 1 && !selectedPlace) {
      try {
        map.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          maxZoom: 13.5,
          duration: 700
        });
      } catch {}
    }
  }, [filteredPlaces, selectedPlace]);

  // Center map on selected place
  const handleLocatePlace = (place: TouristPlace) => {
    setSelectedPlace(place);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [place.lng, place.lat],
        zoom: 14.5,
        duration: 700
      });
    }
    // Scroll smoothly to map on small screens
    if (window.innerWidth < 768 && mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSavePlace = (place: TouristPlace) => {
    const text = `معلم سياحي: ${place.name} (${place.region}) - ${place.address}`;
    if (save) save(text);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2200);
  };

  const getGoogleDirectionsUrl = (place: TouristPlace) => {
    return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  };

  return (
    <div className="tourist-map-page" aria-label="خريطة إسكندرية السياحية والمعالم">
      {/* Hero Header */}
      <section className="tourist-map-hero">
        <div className="tourist-hero-copy">
          <span className="tourist-kicker">
            <Compass size={15} />
            دليل السياحة والمعالم
          </span>
          <h1>
            خريطة معالم <span>إسكندرية.</span>
          </h1>
          <p>
            استكشف أروع القلاع، المتاحف، القصور التاريخية، والأنشطة الساحلية على خريطة المدينة التفاعلية بدون تشتت.
          </p>

          <div className="tourist-stats-pills">
            <span className="tourist-stat-pill">
              <Landmark size={14} color="#f0c64a" />
              {allPlaces.length} معالم سياحية موثقة
            </span>
            <span className="tourist-stat-pill">
              <Compass size={14} color="#f0c64a" />
              تحديد فوري للموقع والاتجاهات
            </span>
          </div>
        </div>
      </section>

      {/* Control Card: Search & Categories */}
      <div className="tourist-controls-card">
        <div className="tourist-search-box">
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="ابحث باسم المعلم، الحي (مثل: بحري، الشاطبي، المنتزه)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="icon-button"
              style={{ width: 28, height: 28 }}
              onClick={() => setSearchQuery('')}
              aria-label="مسح البحث"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="tourist-cat-track" role="tablist" aria-label="أقسام المعالم">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`tourist-cat-chip ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
                role="tab"
                aria-selected={isActive}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Map */}
      <div className="tourist-map-wrapper">
        <div className="tourist-map-overlay-badge">
          <MapPin size={14} color="#f0c64a" />
          <span>{filteredPlaces.length} موقع على الخريطة</span>
        </div>
        <div className="tourist-map-container" ref={mapContainerRef} />
      </div>

      {/* Selected Landmark Highlight Banner */}
      {selectedPlace && (
        <article className="tourist-selected-card" aria-label="المعلم المحدد">
          <img
            src={safeCover(selectedPlace.imageUrl) || '/brand/eskendrella.png'}
            alt={selectedPlace.name}
            className="tourist-selected-img"
          />

          <div className="tourist-selected-info">
            <div className="tourist-selected-tags">
              <span className="tourist-pill-tag gold">
                <Landmark size={12} />
                {selectedPlace.categoryLabel}
              </span>
              <span className="tourist-pill-tag">
                <MapPin size={12} />
                {selectedPlace.region}
              </span>
            </div>

            <h3>{selectedPlace.name}</h3>
            <p>{selectedPlace.summary}</p>

            {selectedPlace.priceNote && (
              <div style={{ fontSize: '0.8rem', color: '#1b7a42', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Ticket size={13} />
                <span>{selectedPlace.priceNote}</span>
              </div>
            )}
          </div>

          <div className="tourist-selected-actions">
            <button
              type="button"
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '0.55rem 0.9rem' }}
              onClick={() => setModalPlace(selectedPlace)}
            >
              عرض التفاصيل الكاملة
            </button>

            <a
              href={getGoogleDirectionsUrl(selectedPlace)}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.55rem 0.9rem', justifyContent: 'center' }}
            >
              <Navigation size={13} />
              الاتجاهات في خرائط جوجل
            </a>

            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.55rem 0.9rem', justifyContent: 'center' }}
              onClick={() => handleSavePlace(selectedPlace)}
            >
              {savedSuccess ? (
                <>تم الحفظ <Check size={14} color="#16a34a" /></>
              ) : (
                <>حفظ في المحفوظات <Bookmark size={13} /></>
              )}
            </button>
          </div>
        </article>
      )}

      {/* Places Cards Grid Section */}
      <section className="tourist-places-section">
        <div className="tourist-section-head">
          <h2>
            <Landmark size={18} />
            <span>قائمة المعالم السياحية</span>
          </h2>
          <span className="tourist-section-count">
            {filteredPlaces.length} معالم مطابقة
          </span>
        </div>

        <div className="tourist-grid">
          {filteredPlaces.map(place => {
            const isSelected = selectedPlace?.id === place.id;
            return (
              <article
                key={place.id}
                className={`tourist-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleLocatePlace(place)}
              >
                <div className="tourist-card-cover-wrap">
                  <img
                    src={safeCover(place.imageUrl) || '/brand/eskendrella.png'}
                    alt={place.name}
                    className="tourist-card-img"
                    loading="lazy"
                  />
                  <span className="tourist-card-cat-badge">
                    {place.categoryLabel}
                  </span>
                </div>

                <div className="tourist-card-body">
                  <div className="tourist-card-location">
                    <MapPin size={12} color="#102a43" />
                    <span>{place.region}</span>
                  </div>

                  <h3>{place.name}</h3>
                  <p className="tourist-card-desc">{place.summary}</p>

                  <div className="tourist-card-foot">
                    <button
                      type="button"
                      className="tourist-btn-locate"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLocatePlace(place);
                      }}
                    >
                      <MapPin size={12} />
                      تحديد على الخريطة
                    </button>

                    <button
                      type="button"
                      className="icon-button"
                      style={{ width: 32, height: 32 }}
                      title="تفاصيل المعلم"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalPlace(place);
                      }}
                    >
                      <ExternalLink size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Full Landmark Details Modal */}
      {modalPlace && (
        <div className="tourist-modal-overlay" onClick={() => setModalPlace(null)}>
          <div className="tourist-modal-card" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="tourist-modal-close"
              onClick={() => setModalPlace(null)}
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>

            <img
              src={safeCover(modalPlace.imageUrl) || '/brand/eskendrella.png'}
              alt={modalPlace.name}
              className="tourist-modal-cover"
            />

            <div className="tourist-modal-content">
              <div className="tourist-modal-header">
                <div className="tourist-selected-tags" style={{ marginBottom: 6 }}>
                  <span className="tourist-pill-tag gold">
                    {modalPlace.categoryLabel}
                  </span>
                  <span className="tourist-pill-tag">
                    <MapPin size={12} />
                    {modalPlace.region}
                  </span>
                </div>
                <h2>{modalPlace.name}</h2>
              </div>

              <p style={{ color: 'var(--text-muted, #475569)', lineHeight: 1.7, fontSize: '0.94rem', margin: 0 }}>
                {modalPlace.description || modalPlace.summary}
              </p>

              {/* Information Grid */}
              <div className="tourist-modal-details-grid">
                <div className="tourist-modal-detail-item">
                  <MapPin size={18} color="#102a43" />
                  <div>
                    <strong>العنوان والموقع:</strong>
                    <span>{modalPlace.address}</span>
                  </div>
                </div>

                {modalPlace.openingHours && (
                  <div className="tourist-modal-detail-item">
                    <Clock size={18} color="#102a43" />
                    <div>
                      <strong>مواعيد الزيارة:</strong>
                      <span>{modalPlace.openingHours}</span>
                    </div>
                  </div>
                )}

                {modalPlace.priceNote && (
                  <div className="tourist-modal-detail-item">
                    <Ticket size={18} color="#1b7a42" />
                    <div>
                      <strong>أسعار التذاكر الرسمية:</strong>
                      <span>{modalPlace.priceNote}</span>
                    </div>
                  </div>
                )}

                {modalPlace.sourceName && (
                  <div className="tourist-modal-detail-item">
                    <Landmark size={18} color="#102a43" />
                    <div>
                      <strong>المصدر الموثوق:</strong>
                      <span>{modalPlace.sourceName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="tourist-modal-actions">
                <a
                  href={getGoogleDirectionsUrl(modalPlace)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Navigation size={15} />
                  الاتجاهات على خرائط جوجل
                </a>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleSavePlace(modalPlace)}
                >
                  {savedSuccess ? (
                    <>تم الحفظ <Check size={16} color="#16a34a" /></>
                  ) : (
                    <>حفظ بالمفضلة <Bookmark size={15} /></>
                  )}
                </button>

                {modalPlace.sourceUrl && (
                  <a
                    href={modalPlace.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                    title="زيارة الموقع الرسمي"
                  >
                    الموقع الرسمي <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
