export type AppLanguage = 'en' | 'ur' | 'zh';

export interface LanguageInfo {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', dir: 'rtl' },
  { code: 'zh', name: 'Chinese', nativeName: '简体中文', flag: '🇨🇳', dir: 'ltr' }
];

export const translations: Record<AppLanguage, Record<string, string>> = {
  en: {
    system_title: 'Pakistan Library Management System (PLiMS v3.0)',
    tagline: 'OSS AI & Standards Compliant Automation',
    search_placeholder: 'Global Search (Ctrl + K)...',
    theme: 'Theme',
    language: 'Language',
    add_branch: '+ Branch / Staff',
    sign_out: 'Sign Out',
    dashboard: 'Dashboard',
    cataloguing: 'Cataloguing (MARC21/RDA)',
    circulation: 'Circulation & Fines',
    opac: 'OPAC Online Catalog',
    users: 'User & Member Control',
    classification: 'Classification (DDC/LCC)',
    digital_library: 'Digital & Thesis Repository',
    acquisition: 'Acquisition & Vendors',
    serials: 'Serials & Periodicals',
    stock_verification: 'Stock Verification',
    reports: 'Reports & Analytics',
    barcode_gen: 'Barcode & RFID Labels',
    ai_assistant: 'Gemini Library Copilot',
    notifications: 'Notifications & Alerts',
    my_library: 'My Member Portal',
    import_export: 'Import / Export & Migration',
    backup_logs: 'Backup & Security Logs',
    settings: 'Settings & Profile',
    help_docs: 'Architecture Specs & Manual',
    authority_control: 'Authority Control (LCSH)',
    xampp_export: 'XAMPP & SQL Export',
    portable_edition: 'Desktop Portable Edition',
    welcome_back: 'Welcome to PLiMS V4.1.1 PK edition',
    quick_stats: 'Real-Time Library Metrics',
    total_books: 'Total Title Records',
    total_copies: 'Total Book Copies',
    active_members: 'Active Library Members',
    issued_books: 'Books Currently Issued',
    overdue_loans: 'Overdue Books',
    pending_fines: 'Pending Fine Fines (PKR)',
  },
  ur: {
    system_title: 'پاکستان لائبریری مینجمنٹ سسٹم (PLiMS v3.0)',
    tagline: 'انٹرپرائز آرٹیفیشل انٹیلی جنس اور بین الاقوامی معیار کے مطابق لائبریری آٹومیشن',
    search_placeholder: 'تلاش کریں (Ctrl + K)...',
    theme: 'تھیم',
    language: 'زبان',
    add_branch: '+ برانچ / عملہ',
    sign_out: 'سائن آؤٹ',
    dashboard: 'ڈیش بورڈ',
    cataloguing: 'کیٹلاگ سازی (MARC21/RDA)',
    circulation: 'اجراء و واپسی و جرمانہ',
    opac: 'آن لائن آن لائن کیٹلاگ (OPAC)',
    users: 'صارفین و ممبران کا کنٹرول',
    classification: 'درجہ بندی (DDC/LCC)',
    digital_library: 'ڈیجیٹل لائبریری و تھیسس اسٹور',
    acquisition: 'خریداری و سپلائرز',
    serials: 'رسائل و اخبارات',
    stock_verification: 'سٹاک ویریفیکیشن',
    reports: 'رپورٹس و تجزيات',
    barcode_gen: 'بار کوڈ اور RFID لیبل',
    ai_assistant: 'جیپنی لائبریری کوپائلٹ (AI)',
    notifications: 'نوٹیفیکیشنز اور الرٹس',
    my_library: 'میرا ممبر پورٹل',
    import_export: 'امپورٹ و ایکسپورٹ و مائیگریشن',
    backup_logs: 'بیک اپ اور سیکورٹی لاگز',
    settings: 'سیٹنگز اور پروپائل',
    xampp_export: 'XAMPP اور SQL ایکسپورٹ',
    portable_edition: 'ڈیسک ٹاپ پورٹیبل ایڈیشن',
    welcome_back: 'پاکستان لائبریری مینجمنٹ سسٹم میں خوش آمدید',
    quick_stats: 'لائبریری کے حقیقی اعداد و شمار',
    total_books: 'کل کتابیں',
    total_copies: 'کل نسخے',
    active_members: 'فعال ارکان',
    issued_books: 'جاری کردہ کتب',
    overdue_loans: 'میعاد ختم کتب',
    pending_fines: 'واجب الادا جرمانہ (روپے)',
  },
  zh: {
    system_title: '巴基斯坦图书馆管理系统 (PLiMS v3.0)',
    tagline: '企业级人工智能与国际标准图书馆自动化平台',
    search_placeholder: '全局搜索 (Ctrl + K)...',
    theme: '主题',
    language: '语言',
    add_branch: '+ 分馆 / 员工',
    sign_out: '退出登录',
    dashboard: '控制面板',
    cataloguing: '图书编目 (MARC21/RDA)',
    circulation: '图书流通与罚款',
    opac: '公共查询系统 (OPAC)',
    users: '用户与读者管理',
    classification: '图书分类 (DDC/LCC)',
    digital_library: '数字图书馆与论文库',
    acquisition: '图书采访与供应商',
    serials: '连续出版物与期刊',
    stock_verification: '清查与盘点',
    reports: '报表与数据分析',
    barcode_gen: '条形码与RFID标签',
    ai_assistant: 'Gemini AI 图书馆助手',
    notifications: '通知与预警',
    my_library: '我的读者中心',
    import_export: '数据导入导出与迁移',
    backup_logs: '备份与安全日志',
    settings: '系统设置与属性',
    xampp_export: 'XAMPP 与 SQL 导出',
    portable_edition: '便携式桌面版',
    welcome_back: '欢迎使用 PLiMS v3.0 企业级AI版',
    quick_stats: '实时图书馆指标',
    total_books: '图书总品种',
    total_copies: '图书总册数',
    active_members: '有效读者数',
    issued_books: '当前外借数',
    overdue_loans: '逾期未还数',
    pending_fines: '待缴罚款 (PKR)',
  }
};

export function getTranslation(lang: AppLanguage, key: string): string {
  if (translations[lang] && translations[lang][key]) {
    return translations[lang][key];
  }
  return translations.en[key] || key;
}
