/**
 * PSLiMS Multilingual Classification & Call Number Generation Engine
 * Supports: DDC, LCC, UDC, NLM, Colon Classification (CC), HEC-PK, and Islamic Jurisprudence
 * 
 * Multilingual Title & Author Processing:
 * - English (Latin)
 * - Urdu (اردو)
 * - Arabic (العربية)
 * - Sindhi (سنڌي)
 * - Chinese (中文)
 * - Persian (فارسی)
 * - Other Unicode scripts
 */

import { LibraryScheme } from '../types/alims';

export interface GeneratedCallNumberResult {
  callNumber: string;
  classNumber: string;
  cutterNumber: string;
  schemeCode: string;
  schemeName: string;
  detectedSubject: string;
  language: string;
}

// Multilingual Subject Keywords Map to DDC and LCC classes
interface SubjectRule {
  keywords: string[];
  ddc: string;
  lcc: string;
  udc: string;
  nlm?: string;
  islLaw?: string;
  hecPk: string;
  subjectName: string;
}

const SUBJECT_RULES: SubjectRule[] = [
  // Computer Science & IT / AI
  {
    keywords: [
      // English
      'computer', 'software', 'programming', 'algorithm', 'python', 'java', 'c++', 'javascript',
      'artificial intelligence', 'machine learning', 'data science', 'database', 'cyber', 'network', 'web', 'architecture', 'coding', 'operating system',
      // Urdu
      'کمپیوٹر', 'سائنس', 'پروگرامنگ', 'ڈیٹا', 'انفارمیشن', 'نیٹ ورک', 'سافٹ ویئر', 'الگورتھم', 'مصنوعی ذہانت',
      // Arabic
      'حاسوب', 'حاسب', 'برمجة', 'ذكاء اصطناعي', 'بيانات', 'شبكات', 'خوارزميات', 'نظم معلومات',
      // Sindhi
      'ڪمپيوٽر', 'سافٽويئر', 'پروگرامنگ', 'ڊيٽا',
      // Chinese
      '计算机', '编程', '算法', '人工智能', '软件', '网络', '数据库', '程序设计', '操作系统',
      // Persian
      'کامپیوتر', 'رایانه', 'برنامه نویسی', 'داده'
    ],
    ddc: '005.1',
    lcc: 'QA76.73',
    udc: '004.43',
    nlm: 'W 26.5',
    hecPk: 'HEC-CS-005',
    subjectName: 'Computer Science & Software Systems'
  },
  // Library & Information Science / Management
  {
    keywords: [
      // English
      'library', 'cataloguing', 'cataloging', 'classification', 'information science', 'librarianship',
      'marc', 'rda', 'opac', 'archive', 'documentation', 'library management',
      // Urdu
      'لائبریری', 'کتب خانہ', 'کتب خانوں', 'علم کتب', 'کیٹلاگ', 'درجہ بندی', 'لائبریرین',
      // Arabic
      'مكتبات', 'مكتبة', 'علم المكتبات', 'فهرسة', 'تصنيف', 'توثيق', 'أرشفة',
      // Sindhi
      'ڪتب خانو', 'لائبريري', 'فهرست',
      // Chinese
      '图书馆', '图书', '文献', '分类法', '编目', '图书馆学', '档案',
      // Persian
      'کتابخانه', 'کتابداری', 'فهرست نویسی'
    ],
    ddc: '025.3',
    lcc: 'Z668',
    udc: '025.4',
    nlm: 'Z 675',
    hecPk: 'HEC-LIS-020',
    subjectName: 'Library & Information Science'
  },
  // Islamic Studies, Quran, Hadith, Fiqh
  {
    keywords: [
      // English
      'islam', 'islamic', 'quran', 'hadith', 'fiqh', 'shariah', 'seerah', 'prophet', 'tafseer', 'sunnah',
      // Urdu
      'اسلام', 'اسلامی', 'قرآن', 'حدیث', 'فقہ', 'شریعت', 'سیرت', 'تفسیر', 'سنت', 'بخاری', 'مسلم', 'فتاویٰ', 'دین',
      // Arabic
      'إسلام', 'اسلام', 'قرآن', 'حديث', 'فقه', 'شريعة', 'سيرة', 'تفسير', 'سنة', 'بخاري', 'مسلم', 'فتاوى', 'عقيدة',
      // Sindhi
      'اسلام', 'قرآن', 'حديث', 'فقهه', 'سيرت', 'تفسير',
      // Chinese
      '伊斯兰', '古兰经', '圣训', '穆斯林',
      // Persian
      'اسلام', 'قرآن', 'حدیث', 'فقه', 'تفسیر'
    ],
    ddc: '297.12',
    lcc: 'BP130',
    udc: '28-23',
    islLaw: 'ISL-FIQH-297',
    hecPk: 'HEC-ISL-297',
    subjectName: 'Islamic Studies & Jurisprudence'
  },
  // History & Geography (World, Pakistan, Middle East, Asia)
  {
    keywords: [
      // English
      'history', 'pakistan', 'historical', 'civilization', 'war', 'ancient', 'modern', 'geography', 'chronicle',
      // Urdu
      'تاریخ', 'پاکستان', 'سوانح', 'تہذیب', 'جغرافیہ', 'عہد', 'واقعات',
      // Arabic
      'تاريخ', 'حضارة', 'جغرافيا', 'أندلس', 'حروب', 'عصور', 'سيرة تاريخية',
      // Sindhi
      'تاريخ', 'سنڌ', 'پاڪستان', 'تهذيب', 'جاگرافي',
      // Chinese
      '历史', '中国历史', '世界史', '地理', '通史', '近代史', '古代史',
      // Persian
      'تاریخ', 'ایران', 'تمدن', 'جغرافیا'
    ],
    ddc: '954.91',
    lcc: 'DS384',
    udc: '94(549)',
    hecPk: 'HEC-HIST-950',
    subjectName: 'History & Civilization'
  },
  // Literature, Poetry, Fiction, Ghazals
  {
    keywords: [
      // English
      'literature', 'poetry', 'novel', 'drama', 'fiction', 'poems', 'diwan', 'kulliyat', 'short stories', 'anthology',
      // Urdu
      'ادب', 'شاعری', 'دیوان', 'کلیات', 'غالب', 'اقبال', 'میر', 'فیض', 'نظم', 'غزل', 'افسانہ', 'ناول',
      // Arabic
      'أدب', 'ادب', 'شعر', 'ديوان', 'قصائد', 'رواية', 'نثر', 'معلقات', 'بلاغة',
      // Sindhi
      'ادب', 'شاعري', 'رسالو', 'شاهه', 'لطيف', 'بيت', 'سنڌي شاعري',
      // Chinese
      '文学', '诗歌', '小说', '散文', '作品选', '全集', '戏剧',
      // Persian
      'ادبیات', 'شعر', 'دیوان', 'حافظ', 'سعدی', 'مولوی', 'فردوسی'
    ],
    ddc: '891.439',
    lcc: 'PK2198',
    udc: '821.214',
    hecPk: 'HEC-LIT-890',
    subjectName: 'Literature & Poetry'
  },
  // Medicine, Health, Pharmacy, Biology
  {
    keywords: [
      // English
      'medicine', 'clinical', 'medical', 'surgery', 'pharmacology', 'pathology', 'anatomy', 'health', 'disease', 'hospital', 'nursing', 'biology',
      // Urdu
      'طب', 'طبی', 'صحت', 'جراحت', 'ادویات', 'بیماری', 'حیاتیات',
      // Arabic
      'طب', 'طبي', 'جراحة', 'صيدلة', 'أمراض', 'صحة', 'تشريح', 'علاج',
      // Sindhi
      'طب', 'صحت', 'علاج',
      // Chinese
      '医学', '临床', '药理', '解剖', '病理', '卫生', '疾病', '医院', '护理', '生物',
      // Persian
      'پزشکی', 'درمان', 'داروسازی', 'بهداشت'
    ],
    ddc: '610.7',
    lcc: 'R118',
    udc: '61',
    nlm: 'WB 100',
    hecPk: 'HEC-MED-610',
    subjectName: 'Medical Sciences & Clinical Medicine'
  },
  // Engineering & Technology
  {
    keywords: [
      // English
      'engineering', 'electrical', 'mechanical', 'civil', 'electronics', 'telecom', 'robotics', 'signal',
      // Urdu
      'انجینئرنگ', 'برقیات', 'میکینکل', 'تعمیرات', 'ٹیکنالوجی',
      // Arabic
      'هندسة', 'كهرباء', 'ميكانيك', 'مدنية', 'إلكترونيات', 'تقنية',
      // Sindhi
      'انجنيئرنگ', 'ٽيڪنالاجي',
      // Chinese
      '工程', '电气', '机械', '土木', '电子', '技术',
      // Persian
      'مهندسی', 'برق', 'مکانیک', 'فناوری'
    ],
    ddc: '621.3',
    lcc: 'TK5101',
    udc: '621.3',
    hecPk: 'HEC-ENG-620',
    subjectName: 'Engineering & Applied Technology'
  },
  // Mathematics & Natural Sciences (Physics, Chemistry, Math)
  {
    keywords: [
      // English
      'mathematics', 'calculus', 'algebra', 'physics', 'chemistry', 'geometry', 'quantum', 'mechanics', 'statistics',
      // Urdu
      'ریاضی', 'طبیعیات', 'کیمیا', 'شماریات', 'الجبر', 'حساب',
      // Arabic
      'رياضيات', 'فيزياء', 'كيمياء', 'إحصاء', 'جبر', 'تفاضل', 'هندسة رياضية',
      // Sindhi
      'حساب', 'فزڪس', 'ڪيمسٽري',
      // Chinese
      '数学', '物理', '化学', '统计', '代数', '微积分', '几何',
      // Persian
      'ریاضیات', 'فیزیک', 'شیمی', 'آمار'
    ],
    ddc: '510.1',
    lcc: 'QA303',
    udc: '51',
    hecPk: 'HEC-SCI-500',
    subjectName: 'Mathematics & Natural Sciences'
  },
  // Economics, Business, Finance, Management
  {
    keywords: [
      // English
      'economics', 'business', 'finance', 'accounting', 'marketing', 'banking', 'management', 'commerce',
      // Urdu
      'معاشیات', 'بینکنگ', 'تجارت', 'اکاؤنٹنگ', 'مارکیٹنگ', 'کاروبار', 'انتظام',
      // Arabic
      'اقتصاد', 'تجارة', 'محاسبة', 'إدارة أعمال', 'تسويق', 'بنوك', 'مالية',
      // Sindhi
      'معاشيات', 'واپار', 'ڪاروبار',
      // Chinese
      '经济', '金融', '会计', '管理学', '商业', '贸易', '市场营销',
      // Persian
      'اقتصاد', 'مدیریت', 'حسابداری', 'بازرگانی'
    ],
    ddc: '330.1',
    lcc: 'HB171',
    udc: '33',
    hecPk: 'HEC-ECO-330',
    subjectName: 'Economics, Commerce & Business'
  },
  // Law & Legal Studies
  {
    keywords: [
      // English
      'law', 'legal', 'jurisprudence', 'constitution', 'court', 'criminal', 'justice', 'statute',
      // Urdu
      'قانون', 'عدالت', 'آئین', 'دستور', 'فوجداری', 'انصاف',
      // Arabic
      'قانون', 'قضاء', 'دستور', 'حقوق', 'تشريع', 'محكمة', 'جنائي',
      // Sindhi
      'قانون', 'عدالت', 'آئين',
      // Chinese
      '法律', '法学', '宪法', '刑法', '民法', '诉讼', '司法',
      // Persian
      'حقوق', 'قانون', 'دادگاه', 'قضاوت'
    ],
    ddc: '340.1',
    lcc: 'K100',
    udc: '34',
    islLaw: 'ISL-LAW-340',
    hecPk: 'HEC-LAW-340',
    subjectName: 'Law & Jurisprudence'
  },
  // Linguistics & Language
  {
    keywords: [
      // English
      'language', 'linguistics', 'grammar', 'dictionary', 'lexicon', 'syntax', 'phonetics', 'urdu language', 'arabic language', 'sindhi language',
      // Urdu
      'لسانیات', 'زبان', 'گرامر', 'قواعد', 'لغت', 'اردو زبان', 'صرف و نحو',
      // Arabic
      'لغة', 'لسانيات', 'نحو', 'صرف', 'معجم', 'قاموس', 'لغة عربية', 'بلاغة',
      // Sindhi
      'ٻولي', 'سنڌي ٻولي', 'گرامر', 'لغت',
      // Chinese
      '语言', '语言学', '语法', '词典', '汉语', '文字',
      // Persian
      'زبان شناسی', 'دستور زبان', 'فرهنگ لغت', 'زبان فارسی'
    ],
    ddc: '410.1',
    lcc: 'P121',
    udc: '81',
    hecPk: 'HEC-LANG-400',
    subjectName: 'Linguistics & Languages'
  }
];

/**
 * Detects the script/language family of the title text
 */
export function detectTextScript(text: string): { lang: string; isRTL: boolean; script: string } {
  if (!text) return { lang: 'en', isRTL: false, script: 'Latin' };

  // Arabic / Urdu / Sindhi / Persian script range
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  // Chinese Han characters
  const chineseRegex = /[\u4E00-\u9FFF\u3400-\u4DBF]/;
  // Cyrillic
  const cyrillicRegex = /[\u0400-\u04FF]/;
  // Devanagari
  const devanagariRegex = /[\u0900-\u097F]/;

  if (arabicRegex.test(text)) {
    // Specific Urdu/Sindhi checks
    if (/[\u067E\u0686\u0698\u06AF\u06BA\u06D2\u06C1]/.test(text)) {
      return { lang: 'ur', isRTL: true, script: 'Arabic (Urdu/Sindhi)' };
    }
    return { lang: 'ar', isRTL: true, script: 'Arabic' };
  }

  if (chineseRegex.test(text)) {
    return { lang: 'zh', isRTL: false, script: 'Chinese (Han)' };
  }

  if (cyrillicRegex.test(text)) {
    return { lang: 'ru', isRTL: false, script: 'Cyrillic' };
  }

  if (devanagariRegex.test(text)) {
    return { lang: 'hi', isRTL: false, script: 'Devanagari' };
  }

  return { lang: 'en', isRTL: false, script: 'Latin' };
}

/**
 * Generates Cutter / Book number representation for Latin, Arabic/Urdu/Sindhi, and Chinese titles/authors
 */
export function generateCutterNumber(author: string, title: string): string {
  const authorClean = (author || '').trim();
  const titleClean = (title || '').trim();

  // Transliterate/normalize leading characters from Arabic/Urdu/Sindhi scripts to standard 3-letter Roman cutter or phonetic representation
  const arabicToRomanMap: Record<string, string> = {
    'ا': 'A', 'آ': 'A', 'أ': 'A', 'إ': 'I', 'ب': 'B', 'پ': 'P', 'ت': 'T', 'ٹ': 'T', 'ث': 'S',
    'ج': 'J', 'چ': 'C', 'ح': 'H', 'خ': 'K', 'د': 'D', 'ڈ': 'D', 'ذ': 'Z', 'ر': 'R', 'ڑ': 'R',
    'ز': 'Z', 'ژ': 'Z', 'س': 'S', 'ش': 'S', 'ص': 'S', 'ض': 'D', 'ط': 'T', 'ظ': 'Z', 'ع': 'A',
    'غ': 'G', 'ف': 'F', 'ق': 'Q', 'ک': 'K', 'گ': 'G', 'ل': 'L', 'م': 'M', 'ن': 'N', 'ں': 'N',
    'و': 'W', 'ہ': 'H', 'ھ': 'H', 'ء': 'A', 'ی': 'Y', 'ے': 'E',
    // Sindhi specific letters
    'ٻ': 'B', 'ٺ': 'T', 'ٽ': 'T', 'ٿ': 'T', 'ڀ': 'B', 'ڃ': 'J', 'ڄ': 'J', 'ڇ': 'C', 'ڌ': 'D',
    'ڏ': 'D', 'ڊ': 'D', 'ڍ': 'D', 'ڙ': 'R', 'ڦ': 'P', 'ڪ': 'K', 'ڳ': 'G', 'ڱ': 'N', 'ڻ': 'N', 'ه': 'H'
  };

  const chinesePinyinInitials: Record<string, string> = {
    '图': 'TUS', '书': 'SHU', '馆': 'GUA', '计': 'JIS', '算': 'SUA', '机': 'JI', '科': 'KEX', '学': 'XUE',
    '人': 'REN', '工': 'GNG', '智': 'ZHI', '能': 'NEN', '中': 'ZHO', '国': 'GUO', '历': 'LIS', '史': 'SHI',
    '文': 'WEN', '数': 'SHU', '理': 'LIX', '化': 'HUA', '法': 'FAL', '律': 'LV', '医': 'YIX',
    '李': 'LI', '王': 'WNG', '张': 'ZHA', '刘': 'LIU', '陈': 'CHE', '杨': 'YAN', '黄': 'HUA', '赵': 'ZHA'
  };

  // 1. Author cutter code (3 uppercase letters)
  let authorCode = 'AUT';
  if (authorClean) {
    // If Latin script
    const latinMatch = authorClean.match(/[a-zA-Z]/);
    if (latinMatch) {
      const parts = authorClean.split(/\s+/);
      const lastName = parts[parts.length - 1].replace(/[^a-zA-Z]/g, '').toUpperCase();
      authorCode = (lastName.slice(0, 3) || 'AUT').padEnd(3, 'X');
    } else {
      // Non-Latin (Urdu, Arabic, Sindhi, Chinese)
      const firstChar = authorClean.charAt(0);
      if (arabicToRomanMap[firstChar]) {
        let romanized = '';
        for (let i = 0; i < Math.min(6, authorClean.length); i++) {
          const ch = authorClean.charAt(i);
          if (arabicToRomanMap[ch]) romanized += arabicToRomanMap[ch];
        }
        authorCode = (romanized.slice(0, 3) || 'ARA').padEnd(3, 'X');
      } else if (chinesePinyinInitials[firstChar]) {
        authorCode = (chinesePinyinInitials[firstChar] || 'ZHO').padEnd(3, 'X');
      } else {
        // Unicode fallback: take char code modulus
        authorCode = `U${(firstChar.charCodeAt(0) % 89 + 10)}`;
      }
    }
  }

  // 2. Title cutter initial (1 uppercase letter)
  let titleInitial = 'T';
  if (titleClean) {
    const latinMatch = titleClean.match(/[a-zA-Z]/);
    if (latinMatch) {
      // Skip common articles
      const filtered = titleClean.replace(/^(A|An|The)\s+/i, '');
      titleInitial = (filtered.charAt(0) || 'T').toUpperCase();
    } else {
      const firstChar = titleClean.charAt(0);
      if (arabicToRomanMap[firstChar]) {
        titleInitial = arabicToRomanMap[firstChar];
      } else if (chinesePinyinInitials[firstChar]) {
        titleInitial = chinesePinyinInitials[firstChar].charAt(0);
      } else {
        titleInitial = 'T';
      }
    }
  }

  return `${authorCode}/${titleInitial}`;
}

/**
 * Automatically calculates and generates a Call Number according to the selected classification scheme
 */
export function generateCallNumberForTitle(
  title: string,
  author: string = '',
  department: string = '',
  scheme: LibraryScheme | string = 'scheme_1',
  schemesList: LibraryScheme[] = []
): GeneratedCallNumberResult {
  const cleanTitle = (title || '').trim().toLowerCase();
  const cleanDept = (department || '').trim().toLowerCase();
  const scriptInfo = detectTextScript(title);

  // Match active scheme
  let activeScheme: LibraryScheme | undefined;
  if (typeof scheme === 'string') {
    activeScheme = schemesList.find(s => s.id === scheme || s.code === scheme.toLowerCase());
  } else {
    activeScheme = scheme;
  }

  const schemeCode = (activeScheme?.code || 'ddc').toLowerCase();
  const schemeName = activeScheme?.name || 'Dewey Decimal Classification (DDC)';

  // Find best matching subject rule by checking keywords in title or department
  let matchedRule = SUBJECT_RULES.find(rule => {
    return rule.keywords.some(kw => cleanTitle.includes(kw.toLowerCase()));
  });

  // If not matched from title keywords, check department
  if (!matchedRule && cleanDept) {
    matchedRule = SUBJECT_RULES.find(rule => {
      return rule.keywords.some(kw => cleanDept.includes(kw.toLowerCase()));
    });
  }

  // Fallback to General classification
  if (!matchedRule) {
    matchedRule = {
      keywords: [],
      ddc: '000.1',
      lcc: 'Z1001',
      udc: '0',
      nlm: 'Z 100',
      hecPk: 'HEC-GEN-000',
      subjectName: 'General Bibliography & Information'
    };
  }

  const cutter = generateCutterNumber(author, title);
  let classNumber = matchedRule.ddc;

  // Resolve classification number based on selected scheme
  switch (schemeCode) {
    case 'ddc':
      classNumber = matchedRule.ddc;
      break;
    case 'lcc':
      classNumber = matchedRule.lcc;
      break;
    case 'udc':
      classNumber = matchedRule.udc;
      break;
    case 'nlm':
      classNumber = matchedRule.nlm || matchedRule.ddc;
      break;
    case 'cc':
      classNumber = `2:${matchedRule.ddc.replace(/\./g, '')}`;
      break;
    case 'hec-pk':
      classNumber = matchedRule.hecPk;
      break;
    case 'isl-law':
      classNumber = matchedRule.islLaw || `ISL-${matchedRule.ddc}`;
      break;
    default:
      if (activeScheme?.prefix) {
        classNumber = `${activeScheme.prefix}-${matchedRule.ddc}`;
      } else {
        classNumber = matchedRule.ddc;
      }
      break;
  }

  // Complete Call Number structure: [Class Number] [Cutter/Book Number]
  const fullCallNumber = `${classNumber} ${cutter}`;

  return {
    callNumber: fullCallNumber,
    classNumber,
    cutterNumber: cutter,
    schemeCode,
    schemeName,
    detectedSubject: matchedRule.subjectName,
    language: scriptInfo.script
  };
}
