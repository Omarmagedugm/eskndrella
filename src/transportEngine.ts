import {normalize, modes, places} from './data';
import {rideGuides, guideFare} from './rideGuide';
import catalog from './sourceCatalog.json';
import {MapRoutePoint} from './MapFallback';

export type CorridorType =
  | 'الكورنيش'
  | 'شارع أبو قير'
  | 'الترام'
  | 'المحمودية / قبلي'
  | 'وسط البلد'
  | 'غرب والعجمي'
  | 'العامرية وبرج العرب';

export type StopNode = {
  id: string;
  name: string;
  area: string;
  corridor: CorridorType;
  lat: number;
  lng: number;
  landmark: string;
  streetSideTowardsWest: string; // اتجاه محطة الرمل / المنشية / محطة مصر / بحري
  streetSideTowardsEast: string; // اتجاه سيدي بشر / المندرة / أبو قير / العوايد
  aliases: string[];
};

export const CORRIDOR_STOPS: StopNode[] = [
  {
    id: 'sidi-bishr-corniche',
    name: 'سيدي بشر (الكورنيش)',
    area: 'سيدي بشر',
    corridor: 'الكورنيش',
    lat: 31.2632,
    lng: 29.9912,
    landmark: 'أمام مسجد سيدي بشر وميدان خالد بن الوليد على طريق الجيش (الكورنيش)',
    streetSideTowardsWest: 'الرصيف البحري أو ناصية المسجد على الكورنيش — اتجاه سان ستيفانو ومحطة الرمل والمنشية',
    streetSideTowardsEast: 'الرصيف القبلي المقابل للبحر على الكورنيش — اتجاه ميامي والعصافرة والمندرة',
    aliases: ['سيدى بشر الكورنيش', 'سيدي بشر بحري', 'كورنيش سيدي بشر']
  },
  {
    id: 'sidi-bishr-abuqir',
    name: 'سيدي بشر (شارع أبو قير / الترام)',
    area: 'سيدي بشر',
    corridor: 'شارع أبو قير',
    lat: 31.2554,
    lng: 29.9945,
    landmark: 'تقاطع شارع أبو قير (الحرية) مع حي المنتزه ومحطة ترام سيدي بشر',
    streetSideTowardsWest: 'رصيف شارع أبو قير البحري أمام الحي — اتجاه فيكتوريا وسيدي جابر ومحطة مصر',
    streetSideTowardsEast: 'رصيف شارع أبو قير القبلي — اتجاه العصافرة والمندرة وأبو قير',
    aliases: ['سيدي بشر الترام', 'سيدي بشر شارع ابو قير', 'مزلقان سيدي بشر']
  },
  {
    id: 'sidi-bishr-qebly',
    name: 'سيدي بشر قبلي (المزلقان / شارع القاهرة)',
    area: 'سيدي بشر',
    corridor: 'المحمودية / قبلي',
    lat: 31.2498,
    lng: 29.9980,
    landmark: 'موقف مزلقان سيدي بشر قبلي وبداية شارع القاهرة',
    streetSideTowardsWest: 'موقف المزلقان قبلي — اتجاه فيكتوريا والعوايد والموقف الجديد',
    streetSideTowardsEast: 'موقف سيدي بشر قبلي — اتجاه السيوف والعصافرة قبلي',
    aliases: ['سيدي بشر قبلي']
  },
  {
    id: 'sidi-gaber-corniche',
    name: 'سيدي جابر (الكورنيش)',
    area: 'سيدي جابر',
    corridor: 'الكورنيش',
    lat: 31.2268,
    lng: 29.9402,
    landmark: 'طريق الجيش عند كوبري مشاة سيدي جابر وفندق كليوباترا',
    streetSideTowardsWest: 'الرصيف البحري على الكورنيش — اتجاه الشاطبي ومحطة الرمل وبحري',
    streetSideTowardsEast: 'الرصيف القبلي على الكورنيش — اتجاه ستانلي وسان ستيفانو وسيدي بشر',
    aliases: ['كورنيش سيدي جابر', 'سيدي جابر البحر']
  },
  {
    id: 'sidi-gaber-abuqir',
    name: 'سيدي جابر (شارع أبو قير / المحطة)',
    area: 'سيدي جابر',
    corridor: 'شارع أبو قير',
    lat: 31.2185,
    lng: 29.9422,
    landmark: 'ميدان محطة قطار سيدي جابر وشارع أبو قير (طريق الحرية)',
    streetSideTowardsWest: 'أمام محطة قطار سيدي جابر — اتجاه الحضرة ومحطة مصر ووسط البلد',
    streetSideTowardsEast: 'الرصيف المقابل على شارع أبو قير — اتجاه مصطفى كامل وسيدي بشر وأبو قير',
    aliases: ['محطة سيدي جابر', 'سيدي جابر الشيخ', 'سيدي جابر المحطة']
  },
  {
    id: 'san-corniche',
    name: 'سان ستيفانو (الكورنيش)',
    area: 'سان ستيفانو',
    corridor: 'الكورنيش',
    lat: 31.2465,
    lng: 29.9675,
    landmark: 'أمام مول وفندق فورسيزونز سان ستيفانو على طريق الكورنيش',
    streetSideTowardsWest: 'الرصيف البحري أمام المول — اتجاه سيدي جابر ومحطة الرمل',
    streetSideTowardsEast: 'الرصيف القبلي تحت المول — اتجاه سيدي بشر والمندرة',
    aliases: ['سان ستيفانو البحر', 'فورسيزونز']
  },
  {
    id: 'san-abuqir',
    name: 'سان ستيفانو (الترام / شارع أبو قير)',
    area: 'سان ستيفانو',
    corridor: 'الترام',
    lat: 31.2432,
    lng: 29.9698,
    landmark: 'محطة ترام سان ستيفانو وتقاطع شارع عبد السلام عارف',
    streetSideTowardsWest: 'رصيف الترام / شارع أبو قير — اتجاه سيدي جابر ومحطة الرمل',
    streetSideTowardsEast: 'رصيف الترام / شارع أبو قير — اتجاه فيكتوريا وسيدي بشر',
    aliases: ['ترام سان ستيفانو']
  },
  {
    id: 'asafra-corniche',
    name: 'العصافرة (الكورنيش / كوبري ٤٥)',
    area: 'العصافرة',
    corridor: 'الكورنيش',
    lat: 31.2782,
    lng: 30.0045,
    landmark: 'مطلع ومنزل كوبري ٤٥ على طريق الكورنيش بالعصافرة بحري',
    streetSideTowardsWest: 'الرصيف البحري عند كوبري ٤٥ — اتجاه ميامي وسيدي بشر والمنشية',
    streetSideTowardsEast: 'الرصيف القبلي على الكورنيش — اتجاه المندرة والمنتزه والمعمورة',
    aliases: ['العصافرة بحري', 'كوبري 45', 'شارع ٤٥']
  },
  {
    id: 'asafra-abuqir',
    name: 'العصافرة (شارع أبو قير / المزلقان)',
    area: 'العصافرة',
    corridor: 'شارع أبو قير',
    lat: 31.2718,
    lng: 30.0085,
    landmark: 'مزلقان العصافرة وتقاطع شارع أبو قير',
    streetSideTowardsWest: 'شارع أبو قير — اتجاه سيدي بشر وفيكتوريا ومحطة مصر',
    streetSideTowardsEast: 'شارع أبو قير — اتجاه المندرة وأبو قير',
    aliases: ['مزلقان العصافرة', 'العصافرة قبلي']
  },
  {
    id: 'mandara-corniche',
    name: 'المندرة (الكورنيش / شيراتون)',
    area: 'المندرة',
    corridor: 'الكورنيش',
    lat: 31.2855,
    lng: 30.0142,
    landmark: 'دوران شيراتون المنتزه وبوابة حدائق المنتزه على الكورنيش',
    streetSideTowardsWest: 'الرصيف البحري بدوران المندرة — اتجاه العصافرة وسيدي بشر ومحطة الرمل',
    streetSideTowardsEast: 'الرصيف المقابل — اتجاه قصر المنتزه وشاطئ المعمورة وأبو قير',
    aliases: ['المندرة بحري', 'شيراتون المنتزه']
  },
  {
    id: 'mandara-abuqir',
    name: 'المندرة (شارع أبو قير / الكوبري)',
    area: 'المندرة',
    corridor: 'شارع أبو قير',
    lat: 31.2802,
    lng: 30.0168,
    landmark: 'موقف كوبري المندرة وميدان المندرة البلد',
    streetSideTowardsWest: 'موقف المندرة تحت الكوبري — اتجاه العصافرة وسيدي بشر وفيكتوريا',
    streetSideTowardsEast: 'موقف المندرة — اتجاه المعمورة البلد وأبو قير',
    aliases: ['كوبري المندرة', 'المندرة قبلي']
  },
  {
    id: 'raml',
    name: 'محطة الرمل',
    area: 'محطة الرمل',
    corridor: 'وسط البلد',
    lat: 31.2007,
    lng: 29.8996,
    landmark: 'ميدان محطة الرمل أمام الغرفة التجارية وتمثال سعد زغلول ومحطة الترام النهائية',
    streetSideTowardsWest: 'ناصية الكورنيش والغرفة التجارية — اتجاه المنشية وبحري والأنفوشي',
    streetSideTowardsEast: 'طريق الكورنيش أو محطة الترام — اتجاه الشاطبي وسيدي جابر وسيدي بشر',
    aliases: ['محطه الرمل', 'ميدان سعد زغلول']
  },
  {
    id: 'mansheya',
    name: 'المنشية',
    area: 'المنشية',
    corridor: 'وسط البلد',
    lat: 31.198,
    lng: 29.893,
    landmark: 'ميدان المنشية أمام المحكمة وحديقة محمد علي وموقف الكورنيش',
    streetSideTowardsWest: 'موقف المنشية اتجاه القباري والورديان والبيطاش والهانوفيل وبحري',
    streetSideTowardsEast: 'موقف المنشية على الكورنيش — اتجاه محطة الرمل وسيدي بشر وأبو قير',
    aliases: ['ميدان المنشية']
  },
  {
    id: 'bahary',
    name: 'بحري / الأنفوشي',
    area: 'بحري',
    corridor: 'الكورنيش',
    lat: 31.212,
    lng: 29.884,
    landmark: 'ميدان المساجد وأبو العباس المرسي وحلقة السمك بالأنفوشي',
    streetSideTowardsWest: 'نهاية خطوط الكورنيش عند قلعة قايتباي ورأس التين',
    streetSideTowardsEast: 'موقف بحري والأنفوشي على طريق الجيش — اتجاه المنشية ومحطة الرمل وسيدي بشر',
    aliases: ['الأنفوشي', 'رأس التين', 'أبو العباس']
  },
  {
    id: 'misr',
    name: 'محطة مصر (ميدان الشهداء)',
    area: 'محطة مصر',
    corridor: 'وسط البلد',
    lat: 31.189,
    lng: 29.905,
    landmark: 'موقف ميدان محطة مصر الحضاري أمام محطة السكة الحديد',
    streetSideTowardsWest: 'ساحة الخطوط الغربية — اتجاه كرموز والموقف الجديد والعجمي',
    streetSideTowardsEast: 'حارات شرق البلد — اتجاه الحضرة وسموحة وسيدي بشر وأبو قير',
    aliases: ['ميدان الشهداء', 'المحطة']
  },
  {
    id: 'smouha',
    name: 'سموحة',
    area: 'سموحة',
    corridor: 'شارع أبو قير',
    lat: 31.214,
    lng: 29.948,
    landmark: 'ميدان فيكتور عمانويل ودوران عزبة سعد وأمام نادي سموحة',
    streetSideTowardsWest: 'اتجاه الحضرة ومحطة مصر والموقف الجديد',
    streetSideTowardsEast: 'اتجاه سيدي جابر وكوبري كليوباترا والعوايد',
    aliases: ['سموحه', 'عزبة سعد (سموحة)', 'عزبة سعد']
  },
  {
    id: 'hadra',
    name: 'الحضرة',
    area: 'الحضرة',
    corridor: 'شارع أبو قير',
    lat: 31.2035,
    lng: 29.9285,
    landmark: 'ميدان الحضرة وأمام مستشفى الحضرة الجامعي ومجمع الكليات',
    streetSideTowardsWest: 'اتجاه محطة مصر ومحطة الرمل',
    streetSideTowardsEast: 'اتجاه سموحة وسيدي جابر والعوايد',
    aliases: ['الحضره', 'مجمع الكليات', 'الشاطبي']
  },
  {
    id: 'victoria',
    name: 'فيكتوريا',
    area: 'فيكتوريا',
    corridor: 'الترام',
    lat: 31.2485,
    lng: 29.9825,
    landmark: 'ميدان ساعة فيكتوريا ومحطة ترام فيكتوريا النهائية وشارع الجلاء',
    streetSideTowardsWest: 'اتجاه سان ستيفانو وسيدي جابر ومحطة الرمل أو العوايد',
    streetSideTowardsEast: 'اتجاه سيدي بشر والعصافرة والمندرة وأبو قير',
    aliases: ['فكتوريا', 'ميدان فيكتوريا']
  },
  {
    id: 'miami',
    name: 'ميامي',
    area: 'ميامي',
    corridor: 'الكورنيش',
    lat: 31.27,
    lng: 30.001,
    landmark: 'تقاطع شارع خالد بن الوليد وشارع إسكندر إبراهيم على الكورنيش',
    streetSideTowardsWest: 'الرصيف البحري — اتجاه سيدي بشر ومحطة الرمل',
    streetSideTowardsEast: 'الرصيف القبلي — اتجاه العصافرة والمندرة والمنتزه',
    aliases: ['خالد بن الوليد']
  },
  {
    id: 'montaza',
    name: 'المنتزه / المعمورة',
    area: 'المنتزه',
    corridor: 'الكورنيش',
    lat: 31.289,
    lng: 30.015,
    landmark: 'بوابة قصر المنتزه ومزلقان المعمورة الشاطئ',
    streetSideTowardsWest: 'اتجاه المندرة وسيدي بشر ومحطة الرمل',
    streetSideTowardsEast: 'اتجاه شاطئ المعمورة وأبو قير',
    aliases: ['قصر المنتزه', 'شاطئ المعمورة', 'المعمورة البلد', 'الملاحة', 'مستشفى الصدر']
  },
  {
    id: 'abuqir',
    name: 'أبو قير',
    area: 'أبو قير',
    corridor: 'شارع أبو قير',
    lat: 31.319,
    lng: 30.063,
    landmark: 'موقف أبو قير النهائي بجوار المزلقان وميدان أبو قير',
    streetSideTowardsWest: 'موقف القيام — اتجاه المندرة وسيدي بشر والمنشية ومحطة مصر',
    streetSideTowardsEast: 'نهاية الخط بأبو قير',
    aliases: ['ابو قير']
  },
  {
    id: 'mawqaf',
    name: 'الموقف الجديد (محرم بك)',
    area: 'الموقف الجديد',
    corridor: 'المحمودية / قبلي',
    lat: 31.1695,
    lng: 29.9195,
    landmark: 'الموقف الجديد بمحرم بك — ساحة الخطوط الداخلية والأقاليم',
    streetSideTowardsWest: 'أرصفة العامرية وبرج العرب والعجمي والكيلو ٢١',
    streetSideTowardsEast: 'حارات محطة مصر والمنشية وسموحة والعوايد عبر المحمودية',
    aliases: ['الموقف الجديد', 'موقف محرم بك']
  },
  {
    id: 'awayed',
    name: 'العوايد / السيوف',
    area: 'العوايد',
    corridor: 'المحمودية / قبلي',
    lat: 31.2145,
    lng: 29.988,
    landmark: 'موقف أسفل كوبري العوايد ودوران السيوف شماعة',
    streetSideTowardsWest: 'اتجاه سموحة والحضرة والموقف الجديد عبر المحمودية',
    streetSideTowardsEast: 'اتجاه فيكتوريا وسيدي بشر والعصافرة',
    aliases: ['السيوف', 'السيوف — الفلكي', 'كوبري الساعة', 'باكوس']
  },
  {
    id: 'karmouz',
    name: 'كرموز / القباري',
    area: 'كرموز',
    corridor: 'غرب والعجمي',
    lat: 31.1815,
    lng: 29.8885,
    landmark: 'ميدان كرموز وبجوار عمود السواري وطريق القباري',
    streetSideTowardsWest: 'اتجاه الورديان والمكس والدخيلة والعجمي',
    streetSideTowardsEast: 'اتجاه محطة مصر والمنشية ومحطة الرمل',
    aliases: ['القباري', 'الورديان', 'المكس', 'الدخيلة']
  },
  {
    id: 'agami',
    name: 'العجمي (البيطاش / الهانوفيل / الكيلو ٢١)',
    area: 'العجمي',
    corridor: 'غرب والعجمي',
    lat: 31.092,
    lng: 29.768,
    landmark: 'طريق إسكندرية مطروح الساحلي — موقف البيطاش والهانوفيل والكيلو ٢١',
    streetSideTowardsWest: 'اتجاه الكيلو ٢١ وأبو تلات وبرج العرب',
    streetSideTowardsEast: 'اتجاه الدخيلة والمنشية ومحطة الرمل والموقف الجديد',
    aliases: ['البيطاش', 'الهانوفيل', 'الكيلو 21', 'البيطاش — شهر العسل', 'الزهراء']
  },
  {
    id: 'amriya',
    name: 'العامرية / الكافوري',
    area: 'العامرية',
    corridor: 'العامرية وبرج العرب',
    lat: 31.0155,
    lng: 29.805,
    landmark: 'موقف العامرية على الطريق الصحراوي وموقف الكافوري',
    streetSideTowardsWest: 'اتجاه مدينة برج العرب الجديدة',
    streetSideTowardsEast: 'اتجاه الموقف الجديد بمحرم بك ووسط الإسكندرية',
    aliases: ['العامريه', 'الكافوري']
  },
  {
    id: 'borg',
    name: 'برج العرب',
    area: 'برج العرب',
    corridor: 'العامرية وبرج العرب',
    lat: 30.917,
    lng: 29.55,
    landmark: 'موقف مدينة برج العرب الجديدة ومحطة قطار برج العرب',
    streetSideTowardsWest: 'نهاية الخط بمدينة برج العرب',
    streetSideTowardsEast: 'اتجاه الكافوري والعامرية والموقف الجديد ومحطة مصر',
    aliases: ['برج العرب الجديدة']
  },
  {
    id: 'stanley',
    name: 'ستانلي',
    area: 'ستانلي',
    corridor: 'الكورنيش',
    lat: 31.233,
    lng: 29.95,
    landmark: 'كوبري ستانلي على طريق الكورنيش',
    streetSideTowardsWest: 'الرصيف البحري على الكورنيش — اتجاه سيدي جابر ومحطة الرمل',
    streetSideTowardsEast: 'الرصيف القبلي — اتجاه سان ستيفانو وسيدي بشر',
    aliases: ['كوبري ستانلي']
  }
];

export type TransitLineRecord = {
  id: string;
  name: string;
  lineNumber?: string;
  mode: string;
  corridor: CorridorType;
  origin: string;
  destination: string;
  stops: string[];
  boarding: string;
  exit: string;
  returnBoarding?: string;
  returnExit?: string;
  fare: number | null;
  fareNote?: string;
  status: string;
  verifiedByAdmin?: boolean;
  liveTrackingAvailable?: boolean;
  sourceLabel?: string;
};

// خطوط أتوبيسات هيئة نقل الركاب بالإسكندرية بأرقامها الرسمية + الميكروباص والترام والقطار
export const NUMBERED_BUS_LINES: TransitLineRecord[] = [
  {
    id: 'bus-11',
    lineNumber: '11',
    name: 'أتوبيس 11 — الأنفوشي / شاطئ المعمورة (الكورنيش)',
    mode: 'bus',
    corridor: 'الكورنيش',
    origin: 'بحري',
    destination: 'المنتزه',
    stops: ['بحري', 'المنشية', 'محطة الرمل', 'الحضرة', 'سيدي جابر', 'سان ستيفانو', 'سيدي بشر', 'ميامي', 'العصافرة', 'المندرة', 'المنتزه'],
    boarding: 'موقف الأنفوشي وبحري أو محطات الكورنيش الرسمية (الرصيف المقابل للبحر اتجاه الشرق)',
    exit: 'بوابة شاطئ المعمورة والمنتزه عبر طريق الكورنيش وشارع ٤٥',
    returnBoarding: 'موقف المعمورة والمنتزه أو الرصيف البحري على الكورنيش اتجاه محطة الرمل والأنفوشي',
    returnExit: 'ميدان محطة الرمل أو المنشية أو حلقة السمك بالأنفوشي',
    fare: null,
    fareNote: 'البيانات دي محتاجة تأكيد (تعريفة هيئة نقل الركاب حسب نوع الأتوبيس عادي/مكيف)',
    status: 'active',
    sourceLabel: 'دليل هيئة نقل الركاب بالإسكندرية — خط رقم 11'
  },
  {
    id: 'bus-20',
    lineNumber: '20',
    name: 'أتوبيس 20 — الأنفوشي / قصر المنتزه (الكورنيش)',
    mode: 'bus',
    corridor: 'الكورنيش',
    origin: 'بحري',
    destination: 'المنتزه',
    stops: ['بحري', 'المنشية', 'محطة الرمل', 'سيدي جابر', 'ستانلي', 'سان ستيفانو', 'سيدي بشر', 'ميامي', 'العصافرة', 'المندرة', 'المنتزه'],
    boarding: 'موقف الأنفوشي أو محطة الرمل على طريق الجيش (الكورنيش)',
    exit: 'أمام بوابة قصر المنتزه ودوران شيراتون المندرة على الكورنيش',
    returnBoarding: 'أمام قصر المنتزه أو الرصيف البحري على الكورنيش (مثل أمام مسجد سيدي بشر اتجاه المنشية)',
    returnExit: 'ميدان محطة الرمل أو المنشية أو الأنفوشي',
    fare: null,
    fareNote: 'البيانات دي محتاجة تأكيد',
    status: 'active',
    sourceLabel: 'دليل هيئة نقل الركاب بالإسكندرية — خط رقم 20'
  },
  {
    id: 'bus-25',
    lineNumber: '25',
    name: 'أتوبيس 25 — رأس التين / سيدي بشر / شارع ٤٥',
    mode: 'bus',
    corridor: 'الكورنيش',
    origin: 'بحري',
    destination: 'العصافرة',
    stops: ['بحري', 'محطة الرمل', 'سيدي جابر', 'سان ستيفانو', 'سيدي بشر', 'العصافرة'],
    boarding: 'موقف رأس التين ببحري أو ميدان محطة الرمل',
    exit: 'سيدي بشر وشارع ٤٥ والملاحة ومستشفى الصدر',
    returnBoarding: 'شارع ٤٥ أو كورنيش سيدي بشر اتجاه محطة الرمل ورأس التين',
    returnExit: 'محطة الرمل أو رأس التين ببحري',
    fare: null,
    fareNote: 'البيانات دي محتاجة تأكيد',
    status: 'active',
    sourceLabel: 'دليل هيئة نقل الركاب بالإسكندرية — خط رقم 25'
  },
  {
    id: 'bus-32',
    lineNumber: '32',
    name: 'أتوبيس 32 — محطة الرمل / البيطاش (شهر العسل)',
    mode: 'bus',
    corridor: 'غرب والعجمي',
    origin: 'محطة الرمل',
    destination: 'العجمي',
    stops: ['محطة الرمل', 'المنشية', 'كرموز', 'العجمي'],
    boarding: 'موقف محطة الرمل والمنشية اتجاه القباري والمكس والدخيلة',
    exit: 'البيطاش ومنطقة شهر العسل بالعجمي',
    returnBoarding: 'موقف البيطاش وطريق العجمي اتجاه الدخيلة ومحطة الرمل',
    returnExit: 'ميدان المنشية ومحطة الرمل',
    fare: null,
    fareNote: 'البيانات دي محتاجة تأكيد',
    status: 'active',
    sourceLabel: 'دليل هيئة نقل الركاب بالإسكندرية — خط رقم 32'
  },
  {
    id: 'bus-60',
    lineNumber: '60',
    name: 'أتوبيس 60 — محطة الرمل / الورديان / الهانوفيل',
    mode: 'bus',
    corridor: 'غرب والعجمي',
    origin: 'محطة الرمل',
    destination: 'العجمي',
    stops: ['محطة الرمل', 'المنشية', 'كرموز', 'العجمي'],
    boarding: 'ميدان محطة الرمل والمنشية عبر القباري والورديان',
    exit: 'البيطاش والهانوفيل والزهراء بالعجمي',
    returnBoarding: 'طريق الهانوفيل والبيطاش اتجاه المنشية ومحطة الرمل',
    returnExit: 'المنشية ومحطة الرمل',
    fare: null,
    fareNote: 'البيانات دي محتاجة تأكيد',
    status: 'active',
    sourceLabel: 'دليل هيئة نقل الركاب بالإسكندرية — خط رقم 60'
  },
  {
    id: 'bus-100',
    lineNumber: '100',
    name: 'أتوبيس 100 — محطة مصر / سيدي بشر / أبو قير (شارع أبو قير)',
    mode: 'bus',
    corridor: 'شارع أبو قير',
    origin: 'محطة مصر',
    destination: 'أبو قير',
    stops: ['محطة مصر', 'الحضرة', 'سيدي جابر', 'فيكتوريا', 'سيدي بشر', 'العصافرة', 'المندرة', 'أبو قير'],
    boarding: 'ميدان محطة مصر عبر طريق الحرية (شارع أبو قير)',
    exit: 'شارع أبو قير (سيدي جابر، سيدي بشر الترام، المندرة الكوبري، حتى موقف أبو قير)',
    returnBoarding: 'رصيف شارع أبو قير البحري (مثل سيدي بشر أمام الحي ومزلقان الترام) اتجاه سيدي جابر ومحطة مصر',
    returnExit: 'محطة قطار سيدي جابر أو ميدان محطة مصر',
    fare: null,
    fareNote: 'البيانات دي محتاجة تأكيد',
    status: 'active',
    sourceLabel: 'مسار شارع أبو قير الرئيسي — خط 100'
  },
  {
    id: 'bus-231',
    lineNumber: '231',
    name: 'أتوبيس 231 — الأنفوشي / سيدي جابر / السيوف الفلكي',
    mode: 'bus',
    corridor: 'شارع أبو قير',
    origin: 'بحري',
    destination: 'العوايد',
    stops: ['بحري', 'محطة الرمل', 'الحضرة', 'سيدي جابر', 'فيكتوريا', 'العوايد'],
    boarding: 'الأنفوشي ومحطة الرمل ومجمع الكليات',
    exit: 'سيدي جابر وباكوس وكوبري الساعة والسيوف الفلكي',
    returnBoarding: 'السيوف وكوبري الساعة وسيدي جابر اتجاه مجمع الكليات ومحطة الرمل',
    returnExit: 'محطة الرمل والأنفوشي',
    fare: null,
    fareNote: 'البيانات دي محتاجة تأكيد',
    status: 'active',
    sourceLabel: 'دليل هيئة نقل الركاب بالإسكندرية — خط رقم 231'
  },
  {
    id: 'bus-260',
    lineNumber: '260',
    name: 'أتوبيس 260 — الأنفوشي / الكورنيش / أبو قير',
    mode: 'bus',
    corridor: 'الكورنيش',
    origin: 'بحري',
    destination: 'أبو قير',
    stops: ['بحري', 'المنشية', 'محطة الرمل', 'سيدي جابر', 'سان ستيفانو', 'سيدي بشر', 'ميامي', 'العصافرة', 'المندرة', 'المنتزه', 'أبو قير'],
    boarding: 'الأنفوشي أو محطة الرمل على طريق الكورنيش',
    exit: 'ميامي، المنتزه، المعمورة البلد، وأبو قير',
    returnBoarding: 'موقف أبو قير أو الرصيف البحري على الكورنيش (سيدي بشر الكورنيش أمام المسجد) اتجاه محطة الرمل',
    returnExit: 'محطة الرمل والمنشية والأنفوشي',
    fare: null,
    fareNote: 'البيانات دي محتاجة تأكيد',
    status: 'active',
    sourceLabel: 'دليل هيئة نقل الركاب بالإسكندرية — خط رقم 260'
  },
  {
    id: 'bus-290',
    lineNumber: '290',
    name: 'أتوبيس 290 — محطة مصر / الكورنيش / أبو قير',
    mode: 'bus',
    corridor: 'الكورنيش',
    origin: 'محطة مصر',
    destination: 'أبو قير',
    stops: ['محطة مصر', 'الحضرة', 'سيدي جابر', 'سان ستيفانو', 'سيدي بشر', 'العصافرة', 'المندرة', 'أبو قير'],
    boarding: 'ميدان الشهداء (محطة مصر) عبر البطالسة والشاطبي إلى طريق الكورنيش',
    exit: 'سيدي بشر (الكورنيش)، المندرة، المعمورة البلد، وأبو قير',
    returnBoarding: 'أبو قير أو المندرة أو سيدي بشر (الكورنيش) اتجاه الشاطبي ومحطة مصر',
    returnExit: 'الشاطبي أو ميدان الشهداء بمحطة مصر',
    fare: null,
    fareNote: 'البيانات دي محتاجة تأكيد',
    status: 'active',
    sourceLabel: 'دليل هيئة نقل الركاب بالإسكندرية — خط رقم 290'
  },
  {
    id: 'bus-732',
    lineNumber: '732',
    name: 'أتوبيس 732 — السيوف / العوايد / الموقف الجديد / الهانوفيل',
    mode: 'bus',
    corridor: 'المحمودية / قبلي',
    origin: 'العوايد',
    destination: 'العجمي',
    stops: ['العوايد', 'سموحة', 'الموقف الجديد', 'كرموز', 'العجمي'],
    boarding: 'دوران السيوف وكوبري العوايد عبر المحمودية إلى الموقف الجديد',
    exit: 'الموقف الجديد، الدخيلة، البيطاش، والهانوفيل',
    returnBoarding: 'الهانوفيل والبيطاش أو الموقف الجديد اتجاه سموحة والعوايد والسيوف',
    returnExit: 'كوبري العوايد والسيوف',
    fare: null,
    fareNote: 'البيانات دي محتاجة تأكيد',
    status: 'active',
    sourceLabel: 'دليل هيئة نقل الركاب بالإسكندرية — خط رقم 732'
  },
  {
    id: 'bus-810',
    lineNumber: '810',
    name: 'أتوبيس 810 — السيوف / فيكتوريا / الكورنيش / البيطاش',
    mode: 'bus',
    corridor: 'الكورنيش',
    origin: 'العوايد',
    destination: 'العجمي',
    stops: ['العوايد', 'فيكتوريا', 'سان ستيفانو', 'سيدي جابر', 'محطة الرمل', 'المنشية', 'كرموز', 'العجمي'],
    boarding: 'السيوف وميدان فيكتوريا نزولًا من شارع الإقبال إلى الكورنيش',
    exit: 'محطة الرمل والمنشية والدخيلة والبيطاش',
    returnBoarding: 'البيطاش أو محطة الرمل على الكورنيش صعودًا من الإقبال إلى فيكتوريا والسيوف',
    returnExit: 'ميدان فيكتوريا والسيوف',
    fare: null,
    fareNote: 'البيانات دي محتاجة تأكيد',
    status: 'active',
    sourceLabel: 'دليل هيئة نقل الركاب بالإسكندرية — خط رقم 810'
  }
];

function detectCorridor(name: string, board: string, stops: string[]): CorridorType {
  const txt = `${name} ${board}`;
  if (txt.includes('الكورنيش') || txt.includes('طريق الجيش')) return 'الكورنيش';
  if (txt.includes('المحمودية') || txt.includes('العوايد') || txt.includes('قبلي')) return 'المحمودية / قبلي';
  if (txt.includes('ترام')) return 'الترام';
  if (stops.includes('العجمي')) return 'غرب والعجمي';
  if (stops.includes('برج العرب') || stops.includes('العامرية')) return 'العامرية وبرج العرب';
  if (stops.includes('أبو قير') || stops.includes('فيكتوريا') || stops.includes('سموحة') || stops.includes('الحضرة')) return 'شارع أبو قير';
  return 'وسط البلد';
}

export function buildAllTransitLines(liveLines?: any[]): TransitLineRecord[] {
  const map = new Map<string, TransitLineRecord>();

  // 1. Add numbered official bus lines
  for (const b of NUMBERED_BUS_LINES) {
    map.set(b.id, { ...b });
  }

  // 2. Add lines from rideGuides
  for (const g of rideGuides) {
    if (g.mode === 'metro') continue; // تحت الإنشاء ولا يوصى به للركوب الحالي
    const fareObj = guideFare(g);
    const corridor = detectCorridor(g.name, g.board, g.stops);
    map.set(g.id, {
      id: g.id,
      name: g.name,
      lineNumber: undefined,
      mode: g.mode,
      corridor,
      origin: g.stops[0] || '',
      destination: g.stops.at(-1) || '',
      stops: g.stops,
      boarding: g.board,
      exit: g.exit,
      fare: fareObj ? fareObj.fareEGP : null,
      fareNote: fareObj ? `حسب جدول تعريفة مارس ٢٠٢٦ (${fareObj.label})` : 'البيانات دي محتاجة تأكيد',
      status: g.status === 'unknown' ? 'active' : g.status,
      verifiedByAdmin: false,
      liveTrackingAvailable: false,
      sourceLabel: fareObj ? `جدول تعريفة مارس ٢٠٢٦ — ${fareObj.label}` : 'وصف ميداني قيد المراجعة'
    });
  }

  // 3. Merge live admin lines from Firestore
  if (Array.isArray(liveLines)) {
    for (const l of liveLines) {
      if (l.archived) {
        map.delete(l.id);
        continue;
      }
      const existing = map.get(l.id);
      const stops = Array.isArray(l.stops) && l.stops.length > 0
        ? l.stops
        : existing?.stops || [l.origin, l.destination].filter(Boolean);
      if (stops.length < 2) continue;
      const corridor = (l.corridor as CorridorType) || existing?.corridor || detectCorridor(l.name || '', l.boarding || '', stops);
      map.set(l.id, {
        id: l.id,
        name: l.name || existing?.name || `${l.origin} / ${l.destination}`,
        lineNumber: l.lineNumber || existing?.lineNumber || undefined,
        mode: l.mode || existing?.mode || 'micro',
        corridor,
        origin: l.origin || stops[0],
        destination: l.destination || stops.at(-1),
        stops,
        boarding: l.boarding || existing?.boarding || '',
        exit: l.exit || existing?.exit || '',
        returnBoarding: l.returnBoarding || existing?.returnBoarding,
        returnExit: l.returnExit || existing?.returnExit,
        fare: typeof l.fare === 'number' ? l.fare : (existing?.fare ?? null),
        fareNote: typeof l.fare === 'number' ? 'سعر معتمد من لوحة تحكم إسكندريلا' : (existing?.fareNote || 'البيانات دي محتاجة تأكيد'),
        status: l.status || existing?.status || 'active',
        verifiedByAdmin: true,
        liveTrackingAvailable: Boolean(l.liveTrackingAvailable),
        sourceLabel: 'معتمد من إدارة إسكندريلا'
      });
    }
  }

  return Array.from(map.values());
}

export function resolveStopNode(areaOrStopName: string, corridor: CorridorType): StopNode {
  const norm = normalize(areaOrStopName);
  // First try exact match on area + corridor
  const exactCorridor = CORRIDOR_STOPS.find(
    s => s.corridor === corridor && (normalize(s.area) === norm || normalize(s.name) === norm || s.aliases.some(a => normalize(a) === norm))
  );
  if (exactCorridor) return exactCorridor;

  // Next try any stop matching area or alias
  const anyMatch = CORRIDOR_STOPS.find(
    s => normalize(s.area) === norm || normalize(s.name) === norm || s.aliases.some(a => normalize(a) === norm)
  );
  if (anyMatch) return anyMatch;

  // Fallback to places coordinate
  const p = places.find(pl => normalize(pl.name) === norm || pl.aliases.some(a => normalize(a) === norm));
  return {
    id: p?.id || norm,
    name: areaOrStopName,
    area: areaOrStopName,
    corridor,
    lat: p?.lat ?? 31.215,
    lng: p?.lng ?? 29.94,
    landmark: 'البيانات دي محتاجة تأكيد (المعلم الدقيق للمحطة قيد المراجعة)',
    streetSideTowardsWest: 'البيانات دي محتاجة تأكيد',
    streetSideTowardsEast: 'البيانات دي محتاجة تأكيد',
    aliases: []
  };
}

export function canonicalAreaName(input: string): string {
  const n = normalize(input);
  if (!n) return '';
  for (const s of CORRIDOR_STOPS) {
    if (normalize(s.name) === n || normalize(s.area) === n || s.aliases.some(a => normalize(a) === n)) {
      return s.area;
    }
  }
  const p = places.find(pl => normalize(pl.name) === n || pl.aliases.some(a => normalize(a) === n));
  return p ? p.name : input.trim();
}

export type JourneyLeg = {
  line: TransitLineRecord;
  fromArea: string;
  toArea: string;
  boardNode: StopNode;
  exitNode: StopNode;
  boardLandmark: string;
  boardStreetSide: string;
  exitLandmark: string;
  directionLabel: string;
  stopsAlongLeg: string[];
  legFare: number | null;
  legFareNote: string;
};

export type JourneyOption = {
  id: string;
  fromArea: string;
  toArea: string;
  legs: JourneyLeg[];
  transfers: number;
  totalFare: number | null;
  fareSummary: string;
  summaryLineTitle: string;
  corridorSummary: string;
  stopCount: number;
  tags: ('recommended' | 'fastest' | 'cheapest' | 'fewest_transfers')[];
  routePoints: MapRoutePoint[];
};

function buildLeg(line: TransitLineRecord, fromIdx: number, toIdx: number): JourneyLeg {
  const forward = fromIdx < toIdx;
  const stopsSlice = forward
    ? line.stops.slice(fromIdx, toIdx + 1)
    : line.stops.slice(toIdx, fromIdx + 1).reverse();

  const fromArea = stopsSlice[0];
  const toArea = stopsSlice[stopsSlice.length - 1];
  const boardNode = resolveStopNode(fromArea, line.corridor);
  const exitNode = resolveStopNode(toArea, line.corridor);

  // Determine geographical direction (East vs West)
  const goingWest = exitNode.lng < boardNode.lng;
  const directionTarget = forward ? line.stops[line.stops.length - 1] : line.stops[0];
  const directionLabel = `اتجاه ${directionTarget} (${line.corridor})`;

  const isOriginStart = forward && fromIdx === 0;
  const isReverseStart = !forward && fromIdx === line.stops.length - 1;
  const isDestinationEnd = forward && toIdx === line.stops.length - 1;
  const isReverseEnd = !forward && toIdx === 0;

  const boardLandmark = isOriginStart && line.boarding
    ? `${boardNode.name} — ${line.boarding}`
    : isReverseStart && line.returnBoarding
      ? `${boardNode.name} — ${line.returnBoarding}`
      : `${boardNode.name} — ${boardNode.landmark}`;

  const boardStreetSide = goingWest
    ? boardNode.streetSideTowardsWest
    : boardNode.streetSideTowardsEast;

  const exitLandmark = isDestinationEnd && line.exit
    ? `${exitNode.name} — ${line.exit}`
    : isReverseEnd && line.returnExit
      ? `${exitNode.name} — ${line.returnExit}`
      : `${exitNode.name} — ${exitNode.landmark}`;

  // Fare: if full line or fixed bus fare, use line.fare; if partial microbus without confirmed partial fare, show note
  const isFullLine = (fromIdx === 0 && toIdx === line.stops.length - 1) || (fromIdx === line.stops.length - 1 && toIdx === 0);
  const legFare = line.fare != null && (isFullLine || line.verifiedByAdmin) ? line.fare : line.fare;
  const legFareNote = legFare != null
    ? `${legFare} جنيه (${isFullLine ? 'تعريفة الخط الكامل' : 'تعريفة الخط — تأكد من أجرة المسافة البينية'})`
    : 'البيانات دي محتاجة تأكيد';

  return {
    line,
    fromArea,
    toArea,
    boardNode,
    exitNode,
    boardLandmark,
    boardStreetSide,
    exitLandmark,
    directionLabel,
    stopsAlongLeg: stopsSlice,
    legFare,
    legFareNote
  };
}

function buildRoutePointsForLegs(legs: JourneyLeg[]): MapRoutePoint[] {
  const points: MapRoutePoint[] = [];
  legs.forEach((leg, legIndex) => {
    leg.stopsAlongLeg.forEach((stopName, idx) => {
      const node = resolveStopNode(stopName, leg.line.corridor);
      const isFirst = legIndex === 0 && idx === 0;
      const isLast = legIndex === legs.length - 1 && idx === leg.stopsAlongLeg.length - 1;
      const isTransfer =
        (legIndex === 0 && idx === leg.stopsAlongLeg.length - 1 && legs.length > 1) ||
        (legIndex > 0 && idx === 0);

      let kind: MapRoutePoint['kind'] = 'stop';
      if (isFirst) kind = 'board';
      else if (isLast) kind = 'exit';
      else if (isTransfer) kind = 'transfer';

      // Avoid duplicating identical consecutive coordinates unless it's a distinct corridor transfer
      const prev = points[points.length - 1];
      if (prev && prev.id === node.id) {
        if (kind === 'transfer' || kind === 'exit') prev.kind = kind;
        return;
      }

      points.push({
        id: node.id,
        name: node.name,
        lat: node.lat,
        lng: node.lng,
        kind,
        sublabel: leg.line.name
      });
    });
  });
  return points;
}

export function findJourneyOptions(
  fromInput: string,
  toInput: string,
  liveLines?: any[]
): JourneyOption[] {
  const fromArea = canonicalAreaName(fromInput);
  const toArea = canonicalAreaName(toInput);
  if (!fromArea || !toArea || normalize(fromArea) === normalize(toArea)) return [];

  const allLines = buildAllTransitLines(liveLines).filter(
    l => l.status !== 'construction' && l.status !== 'closed'
  );

  const options: JourneyOption[] = [];

  // 1. Direct routes (0 transfers)
  for (const line of allLines) {
    const a = line.stops.findIndex(s => normalize(s) === normalize(fromArea));
    const b = line.stops.findIndex(s => normalize(s) === normalize(toArea));
    if (a >= 0 && b >= 0 && a !== b) {
      const leg = buildLeg(line, a, b);
      const modeLabel = modes.find(m => m.id === line.mode)?.name || 'مواصلة';
      const title = line.lineNumber
        ? `${modeLabel} رقم ${line.lineNumber} (${line.origin} ⇄ ${line.destination})`
        : `${modeLabel} — ${line.name}`;
      options.push({
        id: `direct-${line.id}`,
        fromArea,
        toArea,
        legs: [leg],
        transfers: 0,
        totalFare: leg.legFare,
        fareSummary: leg.legFare != null ? `${leg.legFare} جنيه` : 'البيانات دي محتاجة تأكيد',
        summaryLineTitle: title,
        corridorSummary: `خط مباشر عبر ${line.corridor} · من ${leg.boardNode.name}`,
        stopCount: leg.stopsAlongLeg.length,
        tags: [],
        routePoints: buildRoutePointsForLegs([leg])
      });
    }
  }

  // 2. 1-Transfer routes (if user wants alternatives or no direct route exists)
  for (const line1 of allLines) {
    const a1 = line1.stops.findIndex(s => normalize(s) === normalize(fromArea));
    if (a1 < 0) continue;

    for (let midIdx1 = 0; midIdx1 < line1.stops.length; midIdx1++) {
      if (midIdx1 === a1) continue;
      const transferArea = line1.stops[midIdx1];
      if (normalize(transferArea) === normalize(toArea)) continue;

      for (const line2 of allLines) {
        if (line2.id === line1.id) continue;
        const a2 = line2.stops.findIndex(s => normalize(s) === normalize(transferArea));
        const b2 = line2.stops.findIndex(s => normalize(s) === normalize(toArea));
        if (a2 >= 0 && b2 >= 0 && a2 !== b2) {
          // Avoid redundant transfer if both lines already go direct
          if (
            line1.stops.some(s => normalize(s) === normalize(toArea)) ||
            line2.stops.some(s => normalize(s) === normalize(fromArea))
          ) {
            continue;
          }
          const leg1 = buildLeg(line1, a1, midIdx1);
          const leg2 = buildLeg(line2, a2, b2);
          const totalFare =
            leg1.legFare != null && leg2.legFare != null
              ? Number((leg1.legFare + leg2.legFare).toFixed(2))
              : null;
          const m1 = line1.lineNumber ? `أتوبيس ${line1.lineNumber}` : line1.name;
          const m2 = line2.lineNumber ? `أتوبيس ${line2.lineNumber}` : line2.name;

          options.push({
            id: `transfer-${line1.id}-${line2.id}-${transferArea}`,
            fromArea,
            toArea,
            legs: [leg1, leg2],
            transfers: 1,
            totalFare,
            fareSummary: totalFare != null ? `${totalFare} جنيه (مجموع المرحلتين)` : 'البيانات دي محتاجة تأكيد',
            summaryLineTitle: `${m1} ثم تبديل في ${transferArea} إلى ${m2}`,
            corridorSummary: `تبديلة واحدة في ${transferArea}`,
            stopCount: leg1.stopsAlongLeg.length + leg2.stopsAlongLeg.length - 1,
            tags: [],
            routePoints: buildRoutePointsForLegs([leg1, leg2])
          });
        }
      }
    }
  }

  // Deduplicate transfer options by transfer hub (keep best per transfer hub)
  const deduped: JourneyOption[] = [];
  const seenTransfers = new Set<string>();
  for (const opt of options) {
    if (opt.transfers === 0) {
      deduped.push(opt);
    } else {
      const key = `${opt.legs[0].toArea}|${opt.legs[0].line.mode}|${opt.legs[1].line.mode}`;
      if (!seenTransfers.has(key) && deduped.filter(d => d.transfers > 0).length < 4) {
        seenTransfers.add(key);
        deduped.push(opt);
      }
    }
  }

  // Sort: direct first, verified first, fewer stops first
  deduped.sort((x, y) => {
    if (x.transfers !== y.transfers) return x.transfers - y.transfers;
    if (x.stopCount !== y.stopCount) return x.stopCount - y.stopCount;
    const xFare = x.totalFare ?? 999;
    const yFare = y.totalFare ?? 999;
    return xFare - yFare;
  });

  if (deduped.length > 0) {
    deduped[0].tags.push('recommended');
    const fastest = [...deduped].sort((a, b) => a.stopCount - b.stopCount)[0];
    if (fastest) fastest.tags.push('fastest');

    const withKnownFare = deduped.filter(d => d.totalFare != null).sort((a, b) => a.totalFare! - b.totalFare!);
    if (withKnownFare[0]) withKnownFare[0].tags.push('cheapest');

    const fewestTransfers = [...deduped].sort((a, b) => a.transfers - b.transfers || a.stopCount - b.stopCount)[0];
    if (fewestTransfers) fewestTransfers.tags.push('fewest_transfers');
  }

  // Also check fare catalog if no route had a known fare
  if (deduped.length > 0) {
    const catalogMatch = catalog.records.find(
      r =>
        normalize(r.label).includes(normalize(fromArea)) &&
        normalize(r.label).includes(normalize(toArea))
    );
    if (catalogMatch) {
      for (const opt of deduped) {
        if (opt.transfers === 0 && opt.totalFare == null && opt.legs[0].line.mode !== 'bus') {
          opt.totalFare = catalogMatch.fareEGP;
          opt.fareSummary = `${catalogMatch.fareEGP} جنيه (حسب جدول تعريفة ${catalogMatch.label})`;
          opt.legs[0].legFare = catalogMatch.fareEGP;
          opt.legs[0].legFareNote = `${catalogMatch.fareEGP} جنيه (مرجع تعريفة مارس ٢٠٢٦)`;
        }
      }
    }
  }

  return deduped;
}
