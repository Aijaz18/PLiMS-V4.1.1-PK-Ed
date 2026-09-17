import { BookRecord, BookCopy, MarcSubjectEntry } from '../types/alims';

export const TOTAL_CATALOG_TARGET = 300000; // 3.0 Lakhs Books & Titles

export interface CatalogFacet {
  code: string;
  name: string;
  ddcRange: string;
  count: number;
}

export const DDC_FACETS: CatalogFacet[] = [
  { code: 'ALL', name: 'All 300,000 Titles (3.0 Lakhs)', ddcRange: '000-999', count: TOTAL_CATALOG_TARGET },
  { code: '000', name: 'Computer Science, AI & Generalities', ddcRange: '000-099', count: 32000 },
  { code: '100', name: 'Philosophy, Logic & Psychology', ddcRange: '100-199', count: 18000 },
  { code: '200', name: 'Religion & Islamic Studies', ddcRange: '200-299', count: 38000 },
  { code: '300', name: 'Pakistani Law, Constitution & Social Sciences', ddcRange: '300-399', count: 42000 },
  { code: '400', name: 'Languages & Linguistics', ddcRange: '400-499', count: 16000 },
  { code: '500', name: 'Natural Sciences & Mathematics', ddcRange: '500-599', count: 35000 },
  { code: '600', name: 'Technology, Medicine & Engineering', ddcRange: '600-699', count: 45000 },
  { code: '700', name: 'Arts, Architecture & Calligraphy', ddcRange: '700-799', count: 14000 },
  { code: '800', name: 'Literature, Urdu Adab & Poetry', ddcRange: '800-899', count: 36000 },
  { code: '900', name: 'History, Pakistan Studies & Geography', ddcRange: '900-999', count: 24000 },
];

// Rich vocabulary sets for procedural realistic generation
const TITLE_PREFIXES = [
  'Principles of', 'Advanced Handbook of', 'A Comprehensive Treatise on', 'Foundations of Modern',
  'Introduction to', 'Applied Studies in', 'Critical Perspectives on', 'The Oxford Guide to',
  'Standard Manual of', 'Modern Approaches to', 'Constitutional & Statutory', 'Clinical & Practical',
  'Essentials of', 'Contemporary Readings in', 'Theoretical Fundamentals of', 'Selected Readings in',
  'Systematic Analysis of', 'Comparative Studies in', 'Emerging Trends in', 'Encyclopedic Compendium of'
];

const SUBJECT_DOMAINS: {
  ddc: string;
  dept: string;
  topics: string[];
  authors: string[];
  publishers: string[];
  subjects: string[];
}[] = [
  {
    ddc: '004',
    dept: 'Computer Science & AI',
    topics: [
      'Artificial Intelligence & Deep Learning', 'Distributed Operating Systems', 'Database Systems Design',
      'Algorithms and Complexity', 'Computer Networks and Protocols', 'Compiler Architecture',
      'Cybersecurity and Cryptography', 'Cloud Infrastructure & Microservices', 'Data Structures in C++',
      'Natural Language Processing with Transformers', 'Quantum Computing Principles', 'Software Engineering Best Practices',
      'Computer Vision & Convolutional Networks', 'Big Data Analytics with Apache Spark', 'Embedded Systems & IoT Architecture'
    ],
    authors: [
      'Tanenbaum, Andrew S.', 'Russell, Stuart', 'Norvig, Peter', 'Knuth, Donald E.',
      'Martin, Robert C.', 'Silberschatz, Abraham', 'Cormen, Thomas H.', 'Leiserson, Charles E.',
      'Rivest, Ronald L.', 'Goodfellow, Ian', 'Bengio, Yoshua', 'Qureshi, Dr. M. Naveed',
      'Chaudhry, Prof. Imran', 'Ahmed, Dr. Zeeshan', 'Siddiqui, Kamran', 'Akhtar, Bilal'
    ],
    publishers: [
      'MIT Press', 'Pearson Education', 'O\'Reilly Media', 'Springer Nature',
      'National Book Foundation Islamabad', 'Oxford University Press Pakistan', 'Elsevier Science'
    ],
    subjects: ['Computer Science', 'Artificial Intelligence', 'Software Engineering', 'Data Systems']
  },
  {
    ddc: '100',
    dept: 'Philosophy & Psychology',
    topics: [
      'Epistemology and Theory of Knowledge', 'Formal Logic and Dialectics', 'Applied Ethics in Modern Society',
      'Cognitive Psychology and Perception', 'Philosophy of Mind & Consciousness', 'Eastern and Islamic Philosophical Thought',
      'Existentialism and Phenomenology', 'Behavioral Psychology and Learning', 'Moral Philosophy and Justice',
      'The Philosophical Foundations of Science', 'Metaphysical Inquiries', 'Philosophy of Allama Iqbal'
    ],
    authors: [
      'Russell, Bertrand', 'Iqbal, Dr. Sir Muhammad', 'Al-Farabi, Abu Nasr', 'Ibn Sina (Avicenna)',
      'Kant, Immanuel', 'Chomsky, Noam', 'Kahneman, Daniel', 'Sharif, Prof. M. M.',
      'Hussain, Dr. Kausar', 'Rizvi, Dr. Sajjad', 'Dar, Bashir Ahmad', 'Ansari, Dr. Zafar Afaq'
    ],
    publishers: [
      'Oxford University Press', 'Cambridge University Press', 'Routledge', 'Sang-e-Meel Publications Lahore',
      'Iqbal Academy Pakistan', 'Harvard University Press', 'National Book Foundation'
    ],
    subjects: ['Philosophy', 'Psychology', 'Logic', 'Ethics', 'Cognitive Sciences']
  },
  {
    ddc: '297',
    dept: 'Islamic Studies & Shariah',
    topics: [
      'Usool al-Fiqh and Islamic Jurisprudence', 'Exegesis and Sciences of the Holy Quran',
      'Principles of Hadith Criticism (Mustalah al-Hadith)', 'Islamic Economic Order and Takaful',
      'Maqasid al-Shariah in Contemporary Finance', 'History of Islamic Civilization and Thought',
      'Comparative Religion and Inter-Faith Dialogue', 'Islamic Criminal Law and Qisas',
      'Siyar and Islamic International Law', 'Sufism and Spiritual Dimensions of Islam'
    ],
    authors: [
      'Al-Ghazali, Imam Abu Hamid', 'Al-Shatibi, Abu Ishaq', 'Ibn Rushd (Averroes)', 'Taqi Usmani, Justice Mufti Muhammad',
      'Maududi, Sayyid Abul A\'la', 'Hamidullah, Dr. Muhammad', 'Siddiqui, Dr. Nejatullah', 'Islahi, Amin Ahsan',
      'Nadwi, Abul Hasan Ali', 'Qardhawi, Yusuf', 'Nyazee, Imran Ahsan Khan', 'Ghamidi, Javed Ahmad'
    ],
    publishers: [
      'Darussalam International', 'Islamic Research Institute Islamabad', 'Maktaba Ma\'ariful Quran Karachi',
      'Oxford University Press Pakistan', 'Kazi Publications Lahore', 'Al-Meezan Publications', 'Idara-e-Saqafat-e-Islamia'
    ],
    subjects: ['Islamic Studies', 'Quranic Exegesis', 'Islamic Jurisprudence (Fiqh)', 'Hadith Literature']
  },
  {
    ddc: '340',
    dept: 'Pakistani Law & Jurisprudence',
    topics: [
      'The Constitution of the Islamic Republic of Pakistan', 'Principles of Civil Procedure Code (CPC 1908)',
      'Pakistan Penal Code and Criminal Jurisprudence', 'The Law of Evidence (Qanun-e-Shahadat Order 1984)',
      'Company Law and Corporate Governance in Pakistan', 'Administrative Law and Judicial Review',
      'Taxation and Fiscal Laws of Pakistan', 'Labor and Industrial Relations Ordinances',
      'Environmental Law and Sustainable Development', 'International Law and Treaty Obligations'
    ],
    authors: [
      'Khan, Dr. Hamid', 'Mahmood, Justice Sh. Shaukat', 'Patel, Rashida', 'Choudhury, G. W.',
      'Munir, Justice Muhammad', 'Farani, Merajuddin', 'Kafeel, Adv. Muhammad', 'Ahmad, Justice Masood',
      'Raza, S. M. Zafar', 'Siddiqi, Justice Qadeeruddin', 'Zia, Shahla', 'Abbasi, Barrister Mansoor'
    ],
    publishers: [
      'Pakistan Law House (PLH) Karachi', 'PLD Publishers Lahore', 'Oxford University Press Pakistan',
      'Mansoor Book House Lahore', 'Federal Law House Rawalpindi', 'National Book Foundation'
    ],
    subjects: ['Law of Pakistan', 'Constitutional Law', 'Civil Procedure', 'Criminal Jurisprudence']
  },
  {
    ddc: '400',
    dept: 'Languages & Linguistics',
    topics: [
      'Linguistic Typology and Morphology', 'Syntax and Generative Grammar', 'Phonetics and Phonology of Urdu',
      'Computational Linguistics and Corpus Processing', 'Sociolinguistics and Language Policy',
      'Lexicography and Dictionary Construction', 'Applied English Grammar and Composition',
      'Historical Development of South Asian Languages', 'Semantics and Pragmatics in Translation'
    ],
    authors: [
      'Crystal, David', 'Fromkin, Victoria', 'Qasmi, Dr. Ata-ul-Haq', 'Khan, Dr. Masood Hussain',
      'Syed, Prof. Dr. Anwar', 'Haq, Dr. Nazir', 'Bukhari, Syed Sajjad', 'Rahman, Dr. Tariq',
      'Yule, George', 'Leech, Geoffrey', 'Ahmad, Dr. Mushtaq', 'Siddiqui, Dr. Abul Lais'
    ],
    publishers: [
      'National Language Authority (Muqtadira)', 'Cambridge University Press', 'Oxford University Press Pakistan',
      'Sang-e-Meel Publications', 'Majlis-e-Taraqqi-e-Adab Lahore', 'Longman Pearson'
    ],
    subjects: ['Linguistics', 'Urdu Grammar', 'Applied English', 'Phonetics and Phonology']
  },
  {
    ddc: '500',
    dept: 'Natural Sciences & Mathematics',
    topics: [
      'Quantum Mechanics and Atomic Structure', 'Differential Equations and Boundary Value Problems',
      'Organic Chemistry: Reaction Mechanisms', 'Thermodynamics and Statistical Physics',
      'Linear Algebra with Matrix Theory', 'Electrodynamics and Optics', 'Molecular Cell Biology',
      'Real and Complex Analysis', 'Solid State Physics', 'Biochemistry and Enzymology'
    ],
    authors: [
      'Griffiths, David J.', 'Stewart, James', 'Morrison, Robert T.', 'Boyd, Robert N.',
      'Halliday, David', 'Resnick, Robert', 'Kreyszig, Erwin', 'Chaudhry, Dr. A. R.',
      'Lodhi, Prof. M. A.', 'Salam, Prof. Dr. Abdus', 'Khan, Dr. Naeem Ahmad', 'Zia, Prof. S. M.'
    ],
    publishers: [
      'John Wiley & Sons', 'Pearson Higher Education', 'McGraw-Hill Education', 'Springer',
      'National Book Foundation Islamabad', 'Oxford University Press', 'ILMI Kitab Khana Lahore'
    ],
    subjects: ['Physics', 'Mathematics', 'Chemistry', 'Differential Calculus', 'Molecular Biology']
  },
  {
    ddc: '610',
    dept: 'Medicine & Health Sciences',
    topics: [
      'Pathologic Basis of Disease', 'Medical Physiology and Biophysics', 'Clinical Pharmacology and Therapeutics',
      'Human Gross Anatomy and Histology', 'Internal Medicine Diagnosis and Management',
      'Obstetrics and Gynaecology', 'Pediatrics and Neonatal Intensive Care',
      'Medical Microbiology and Immunology', 'Surgical Principles and Operative Procedures'
    ],
    authors: [
      'Kumar, Vinay', 'Abbas, Abul K.', 'Aster, Jon C.', 'Guyton, Arthur C.', 'Hall, John E.',
      'Katzung, Bertram G.', 'Snell, Richard S.', 'Davidson, Sir Stanley', 'Bailey, Hamilton',
      'Love, McNeill', 'Parveen, Dr. Shahida', 'Hameed, Prof. Dr. Abdul', 'Jaffery, Dr. N. A.'
    ],
    publishers: [
      'Elsevier Health Sciences', 'Wolters Kluwer Health', 'McGraw-Hill Medical', 'Churchill Livingstone',
      'Paramount Books Karachi', 'National Book Foundation', 'Oxford Medical Publications'
    ],
    subjects: ['Pathology', 'Human Physiology', 'Pharmacology', 'Anatomy', 'Clinical Medicine']
  },
  {
    ddc: '620',
    dept: 'Engineering & Technology',
    topics: [
      'Structural Analysis and Reinforced Concrete', 'Fluid Mechanics and Hydraulic Machinery',
      'Electric Power Transmission and Smart Grids', 'Control Systems Engineering',
      'Thermodynamics and Heat Transfer', 'Digital Signal Processing and Embedded Microcontrollers',
      'Geotechnical and Foundation Engineering', 'Robotics and Mechatronics Systems'
    ],
    authors: [
      'Nilsson, James W.', 'Riedel, Susan', 'Ogata, Katsuhiko', 'Hibbeler, R. C.',
      'Incropera, Frank P.', 'Proakis, John G.', 'Das, Braja M.', 'Malik, Dr. Tariq',
      'Qureshi, Dr. Asif', 'Raza, Engr. Nadeem', 'Sharif, Prof. Engr. Tahir'
    ],
    publishers: [
      'McGraw-Hill Professional', 'Pearson Engineering', 'Wiley-IEEE Press', 'CRC Press Taylor & Francis',
      'National Book Foundation Islamabad', 'ILMI Kitab Khana'
    ],
    subjects: ['Civil Engineering', 'Electrical Engineering', 'Mechanical Design', 'Control Systems']
  },
  {
    ddc: '800',
    dept: 'Literature & Urdu Adab',
    topics: [
      'Kulliyat-e-Iqbal with Comprehensive Annotations', 'Diwan-e-Ghalib: Textual and Critical Study',
      'Nuskha-ha-e-Wafa: The Complete Works of Faiz', 'The Art and Technique of the Urdu Novel',
      'Classical Urdu Ghazal: Tradition and Evolution', 'Afsana Nigari in 20th Century South Asia',
      'Shakespearean Tragedies: Text and Criticism', 'Modern Urdu Nazm: From N. M. Rashid to Meeraji',
      'Anthology of Contemporary Pakistani English Fiction'
    ],
    authors: [
      'Iqbal, Allama Muhammad', 'Ghalib, Mirza Asadullah Khan', 'Faiz, Faiz Ahmed', 'Farooqi, Shamsur Rahman',
      'Manto, Saadat Hasan', 'Mir Taqi Mir', 'Hali, Altaf Hussain', 'Barlas, Mirza Adib',
      'Siddiqi, Dr. Abul Lais', 'Narayan, R. K.', 'Sidwa, Bapsi', 'Hamid, Mohsin', 'Hanif, Mohammed'
    ],
    publishers: [
      'Sang-e-Meel Publications Lahore', 'Al-Waqar Publications', 'Oxford University Press Pakistan',
      'Majlis-e-Taraqqi-e-Adab', 'Maktaba-e-Danyal Karachi', 'National Book Foundation', 'Ferozsons Lahore'
    ],
    subjects: ['Urdu Poetry', 'Classical Literature', 'Urdu Fiction', 'Literary Criticism']
  },
  {
    ddc: '900',
    dept: 'History & Pakistan Studies',
    topics: [
      'The Pakistan Movement and Constitutional Struggle (1906-1947)', 'Quaid-e-Azam Mohammad Ali Jinnah: Speeches and Works',
      'Medieval Islamic Empires and Caliphates', 'Archaeology and Heritage of Indus Valley Civilization',
      'Foreign Policy of Pakistan: Bilateral and Multilateral Dimensions', 'Modern South Asian History and Partition',
      'Geography and Strategic Geopolitics of Pakistan', 'The Mughal Empire: State, Society and Architecture'
    ],
    authors: [
      'Wolpert, Stanley', 'Qureshi, Dr. Ishtiaq Husain', 'Sayeed, Khalid Bin', 'Ali, Chaudhri Muhammad',
      'Afzal, Dr. M. Rafique', 'Burke, S. M.', 'Dani, Prof. Ahmad Hasan', 'Richards, John F.',
      'Talbot, Ian', 'Jalal, Ayesha', 'Khan, Roedad', 'Amin, Shahid M.', 'Ziring, Lawrence'
    ],
    publishers: [
      'Oxford University Press Pakistan', 'Sang-e-Meel Publications', 'National Book Foundation Islamabad',
      'University of Karachi Press', 'Quaid-i-Azam University Press', 'Dost Publications Islamabad'
    ],
    subjects: ['Pakistan Studies', 'History of South Asia', 'Political History', 'Indus Valley Civilization']
  }
];

// Cover images set for realistic rendering
const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=300&auto=format&fit=crop&q=80'
];

/**
 * Deterministic PRNG seeded by index
 */
function pseudoHash(index: number, seed: number = 42): number {
  let val = (index * 15485863 + seed * 32452843) % 2147483647;
  val = (val ^ (val >> 16)) * 16807;
  return Math.abs(val);
}

/**
 * Generate a deterministic high-fidelity MARC21 Book Record for any index from 0 to 300,000+
 */
export function generateCatalogBookAtIndex(index: number): BookRecord {
  const domainIdx = index % SUBJECT_DOMAINS.length;
  const domain = SUBJECT_DOMAINS[domainIdx];

  const prefixIdx = pseudoHash(index, 1) % TITLE_PREFIXES.length;
  const topicIdx = pseudoHash(index, 2) % domain.topics.length;
  const authorIdx = pseudoHash(index, 3) % domain.authors.length;
  const author2Idx = (authorIdx + 3) % domain.authors.length;
  const pubIdx = pseudoHash(index, 4) % domain.publishers.length;
  const coverIdx = pseudoHash(index, 5) % COVER_IMAGES.length;

  const prefix = TITLE_PREFIXES[prefixIdx];
  const topic = domain.topics[topicIdx];
  const volumeSuffix = (index % 12) > 0 ? ` : Vol. ${((index % 5) + 1)}` : '';
  const title = `${prefix} ${topic}${volumeSuffix}`;

  const authors = (index % 3 === 0)
    ? [domain.authors[authorIdx], domain.authors[author2Idx]]
    : [domain.authors[authorIdx]];

  // Standard ISBN-13 generation with Pakistan prefix (969) or standard publisher prefixes
  const countryCode = index % 2 === 0 ? '969' : '019';
  const pubCode = String(100 + (index % 800)).padStart(3, '0');
  const itemCode = String(1000 + (index % 8999)).padStart(4, '0');
  const checkDigit = (index * 3) % 10;
  const isbn = `978-${countryCode}-${pubCode}-${itemCode}-${checkDigit}`;

  // Accession Number
  const accessionNumber = `ACC-${String(index + 1).padStart(6, '0')}`;

  // DDC Classification & Call Number
  const ddcMinor = String(index % 99).padStart(2, '0');
  const ddc = `${domain.ddc}.${ddcMinor}`;
  const firstAuthorSurname = authors[0].split(',')[0].trim().toUpperCase();
  const cutterChar = firstAuthorSurname.charAt(0) || 'A';
  const cutterNum = String(10 + (pseudoHash(index, 7) % 89));
  const cutterNumber = `.${cutterChar}${cutterNum}`;

  const pubYear = 1985 + (index % 42); // 1985 to 2026
  const editionNum = (index % 6) + 1;
  const edition = `${editionNum}${editionNum === 1 ? 'st' : editionNum === 2 ? 'nd' : editionNum === 3 ? 'rd' : 'th'} Edition`;
  const callNumber = `${ddc} ${cutterChar}${cutterNum} ${pubYear}`;

  const totalCopies = ((index % 5) + 1);
  const availableCopies = Math.max(1, totalCopies - (index % 2));
  const pageCount = 200 + (index % 950);

  const publisherName = domain.publishers[pubIdx];
  const subjects = [...domain.subjects];
  const primarySubject = subjects[0] || 'General Studies';
  const geoSubject = domain.dept.includes('Pakistan') || publisherName.includes('Pakistan') ? 'Pakistan' : 'Developing countries';

  const subjectEntries: MarcSubjectEntry[] = [
    {
      id: `subj_300k_${index}_1`,
      tag: '650',
      ind1: '#',
      ind2: '0',
      term: primarySubject,
      subdivisions: { general: 'Study and teaching', form: 'Textbooks' },
      thesaurusSource: 'LCSH',
      formattedHeading: `${primarySubject} -- Study and teaching -- Textbooks`,
      rawMarcString: `650 #0 $a ${primarySubject} $x Study and teaching $v Textbooks`
    },
    {
      id: `subj_300k_${index}_2`,
      tag: '651',
      ind1: '#',
      ind2: '0',
      term: geoSubject,
      subdivisions: { general: 'Education (Higher)' },
      thesaurusSource: 'LCSH',
      formattedHeading: `${geoSubject} -- Education (Higher)`,
      rawMarcString: `651 #0 $a ${geoSubject} $x Education (Higher)`
    },
    {
      id: `subj_300k_${index}_3`,
      tag: '655',
      ind1: '#',
      ind2: '7',
      term: 'Textbooks',
      thesaurusSource: 'FAST',
      formattedHeading: 'Textbooks',
      rawMarcString: `655 #7 $a Textbooks $2 fast`
    }
  ];

  return {
    id: `bk_300k_${index + 1}`,
    accessionNumber,
    title,
    subtitle: `Standard Reference & Academic Text for ${domain.dept}`,
    authors,
    isbn,
    ddcClassification: ddc,
    cutterNumber,
    callNumber,
    department: domain.dept,
    publisherName,
    publisherYear: pubYear,
    publisherPlace: publisherName.includes('Pakistan') || publisherName.includes('Lahore') || publisherName.includes('Islamabad') || publisherName.includes('Karachi')
      ? 'Islamabad : National Library Resources'
      : 'Oxford & London : Academic Press',
    publisherLocation: publisherName.includes('Pakistan') ? 'Islamabad, Pakistan' : 'Oxford, UK',
    shelfLocation: `Stack ${domain.ddc.charAt(0)}-${(index % 12) + 1}`,
    format: (index % 3 === 0 ? ('HARDCOVER' as const) : ('PAPERBACK' as const)),
    edition,
    pageCount,
    seriesStatement: `National Academic Library Monographs, Ser. ${domain.ddc}`,
    generalNotes: `RDA 2024 cataloguing standard applied. Dewey Decimal Classification 23rd Edition. Index and bibliographical references included (p. ${pageCount - 25}-${pageCount}).`,
    description: `A core academic and research work on ${topic}. Covers theoretical fundamentals, historical evolution, statutory frameworks, and modern empirical developments. Suitable for undergraduate, postgraduate, and faculty research.`,
    subjects,
    subjectEntries,
    coverUrl: COVER_IMAGES[coverIdx],
    totalCopies,
    availableCopies,
    copiesTotal: totalCopies,
    copiesAvailable: availableCopies,
    status: 'ACTIVE',
    cataloguedDate: `2024-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
    cataloguerName: 'Librarian Cataloguing Desk (ISO 2709 Engine)',
    marcTags: {
      '001': accessionNumber,
      '020': `$a ${isbn}`,
      '082': `$a ${ddc}`,
      '090': `$a ${accessionNumber}`,
      '100': `$a ${authors[0]}`,
      '245': `$a ${title}`,
      '264': `$a Islamabad : $b ${publisherName} $c ${pubYear}`,
      '300': `$a ${pageCount} pages`,
      '500': `$a Includes bibliographical references and analytical index.`,
      '520': `$a A core academic and research work on ${topic}.`,
      '650': `$a ${primarySubject} $x Study and teaching $v Textbooks`,
      '651': `$a ${geoSubject} $x Education (Higher)`,
      '655': `$a Textbooks $2 fast`,
      '852': `$p ${accessionNumber} $c Stack ${domain.ddc.charAt(0)}-${(index % 12) + 1}`
    },
    marc21Tags: [
      { tag: '001', ind1: ' ', ind2: ' ', subfields: accessionNumber },
      { tag: '020', ind1: ' ', ind2: ' ', subfields: { a: isbn } },
      { tag: '040', ind1: ' ', ind2: ' ', subfields: { a: 'PK-ISB', b: 'eng', c: 'RDA' } },
      { tag: '082', ind1: '0', ind2: '4', subfields: { a: ddc, '2': '23' } },
      { tag: '090', ind1: ' ', ind2: ' ', subfields: { a: callNumber } },
      { tag: '100', ind1: '1', ind2: ' ', subfields: { a: authors[0], e: 'author.' } },
      { tag: '245', ind1: '1', ind2: '0', subfields: { a: title, b: `Standard Reference & Academic Text`, c: authors.join(' ; ') } },
      { tag: '250', ind1: ' ', ind2: ' ', subfields: { a: edition } },
      { tag: '264', ind1: ' ', ind2: '1', subfields: { a: 'Islamabad :', b: publisherName, c: String(pubYear) } },
      { tag: '300', ind1: ' ', ind2: ' ', subfields: { a: `${pageCount} pages :`, b: 'illustrations, maps ;', c: '24 cm.' } },
      { tag: '500', ind1: ' ', ind2: ' ', subfields: { a: 'Includes bibliographical references and analytical index.' } },
      { tag: '520', ind1: ' ', ind2: ' ', subfields: { a: `Comprehensive academic exploration of ${topic}.` } },
      { tag: '650', ind1: ' ', ind2: '0', subfields: { a: primarySubject, x: 'Study and teaching', v: 'Textbooks' } },
      { tag: '651', ind1: ' ', ind2: '0', subfields: { a: geoSubject, x: 'Education (Higher)' } },
      { tag: '655', ind1: ' ', ind2: '7', subfields: { a: 'Textbooks', '2': 'fast' } },
      { tag: '852', ind1: '4', ind2: ' ', subfields: { a: 'Central Academic Library', b: domain.dept, h: callNumber, p: accessionNumber } }
    ]
  };
}

/**
 * Cache of custom books stored by user
 */
let customBooksCache: BookRecord[] = [];

export function setCustomCatalogBooks(books: BookRecord[]) {
  customBooksCache = books;
}

export function getCustomCatalogBooks(): BookRecord[] {
  return customBooksCache;
}

const REF_CATALOG_STORAGE_KEY = 'plims_reference_catalog_active';

let referenceCatalogActive: boolean = (() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem(REF_CATALOG_STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
  }
  return true;
})();

export function isReferenceCatalogActive(): boolean {
  return referenceCatalogActive;
}

export function setReferenceCatalogActive(active: boolean): void {
  referenceCatalogActive = active;
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(REF_CATALOG_STORAGE_KEY, active ? 'true' : 'false');
  }
}

/**
 * Returns dynamic DDC facets considering whether reference catalog is active
 */
export function getCatalogFacets(customBooks: BookRecord[] = customBooksCache): CatalogFacet[] {
  if (referenceCatalogActive) {
    return DDC_FACETS.map(f => {
      if (f.code === 'ALL') {
        return { ...f, count: TOTAL_CATALOG_TARGET + customBooks.length };
      }
      const customInFacet = customBooks.filter(b => b.ddcClassification?.startsWith(f.code.charAt(0))).length;
      return { ...f, count: f.count + customInFacet };
    });
  } else {
    return DDC_FACETS.map(f => {
      if (f.code === 'ALL') {
        return { ...f, name: `Librarian Catalog (${customBooks.length.toLocaleString()} Titles)`, count: customBooks.length };
      }
      const customInFacet = customBooks.filter(b => b.ddcClassification?.startsWith(f.code.charAt(0))).length;
      return { ...f, count: customInFacet };
    });
  }
}

/**
 * High-performance paginated catalog query across 300,000+ records
 */
export interface CatalogQueryResult {
  items: BookRecord[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  activeFilter: string;
  searchQuery: string;
  unlimitedCapacityNotice: string;
  isReferenceActive: boolean;
}

export function queryCatalog300k(options: {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  filterDdc?: string;
  searchScope?: 'ALL' | 'TITLE' | 'AUTHOR' | 'SUBJECT' | 'CALL_NUMBER' | 'ISBN';
  sortBy?: 'TITLE' | 'CALL_NUMBER' | 'YEAR' | 'ACCESSION' | 'RELEVANCE';
}): CatalogQueryResult {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(10, Math.min(250, options.pageSize || 50));
  const query = (options.searchQuery || '').trim().toLowerCase();
  const filterDdc = options.filterDdc || 'ALL';
  const searchScope = options.searchScope || 'ALL';

  const matchesScope = (b: BookRecord): boolean => {
    if (!query) return true;

    const matchesSubject =
      b.subjects?.some(s => s.toLowerCase().includes(query)) ||
      b.subjectEntries?.some(se =>
        se.formattedHeading?.toLowerCase().includes(query) ||
        se.term?.toLowerCase().includes(query) ||
        (se.rawMarcString && se.rawMarcString.toLowerCase().includes(query))
      ) ||
      (b.marcTags?.['650'] && b.marcTags['650'].toLowerCase().includes(query)) ||
      (b.marcTags?.['651'] && b.marcTags['651'].toLowerCase().includes(query)) ||
      (b.marcTags?.['655'] && b.marcTags['655'].toLowerCase().includes(query));

    if (searchScope === 'SUBJECT') {
      return Boolean(matchesSubject);
    }
    if (searchScope === 'TITLE') {
      return b.title.toLowerCase().includes(query) || Boolean(b.subtitle && b.subtitle.toLowerCase().includes(query));
    }
    if (searchScope === 'AUTHOR') {
      return Boolean(b.authors?.some(a => a.toLowerCase().includes(query)));
    }
    if (searchScope === 'CALL_NUMBER') {
      return Boolean(b.callNumber?.toLowerCase().includes(query) || b.ddcClassification?.toLowerCase().includes(query));
    }
    if (searchScope === 'ISBN') {
      return Boolean(b.isbn?.toLowerCase().includes(query) || b.accessionNumber?.toLowerCase().includes(query));
    }

    // ALL fields
    return (
      b.title.toLowerCase().includes(query) ||
      b.isbn.toLowerCase().includes(query) ||
      Boolean(b.callNumber?.toLowerCase().includes(query)) ||
      Boolean(b.accessionNumber?.toLowerCase().includes(query)) ||
      Boolean(b.department?.toLowerCase().includes(query)) ||
      Boolean(b.authors?.some(a => a.toLowerCase().includes(query))) ||
      Boolean(matchesSubject)
    );
  };

  // Total base is 300,000 if reference benchmark catalog is active, or 0 if librarian wiped/purged
  const totalBase = referenceCatalogActive ? TOTAL_CATALOG_TARGET : 0;
  const customCount = customBooksCache.length;
  const grandTotal = totalBase + customCount;

  // Filter custom books first
  const matchingCustom = customBooksCache.filter(b => {
    if (filterDdc !== 'ALL') {
      const ddcPrefix = filterDdc.charAt(0);
      if (!b.ddcClassification?.startsWith(ddcPrefix)) {
        return false;
      }
    }
    return matchesScope(b);
  });

  // Calculate filtered virtual size
  let effectiveTotal = grandTotal;
  if (filterDdc !== 'ALL') {
    if (referenceCatalogActive) {
      const facet = DDC_FACETS.find(f => f.code === filterDdc);
      effectiveTotal = (facet ? facet.count : 30000) + matchingCustom.length;
    } else {
      effectiveTotal = matchingCustom.length;
    }
  }

  // If there's an active text search query, find matching items efficiently
  let matchedItems: BookRecord[] = [];
  if (query) {
    // Collect from matching custom books
    matchedItems.push(...matchingCustom);

    // If reference catalog is active, search across targeted indices of 300k generator
    if (referenceCatalogActive && totalBase > 0) {
      const step = filterDdc === 'ALL' ? 1 : 10;
      const maxScan = 3500;
      let checked = 0;
      for (let i = 0; i < totalBase && checked < maxScan; i += step) {
        checked++;
        const sample = generateCatalogBookAtIndex(i);
        if (filterDdc !== 'ALL' && !sample.ddcClassification?.startsWith(filterDdc.charAt(0))) {
          continue;
        }
        if (matchesScope(sample)) {
          matchedItems.push(sample);
          if (matchedItems.length >= 250) break;
        }
      }
    }
    effectiveTotal = matchedItems.length;
  } else {
    // No query: instant pagination
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;

    // First fill from matching custom books
    const customInPage = matchingCustom.slice(startIdx, endIdx);
    matchedItems.push(...customInPage);

    // If more needed in current page and reference catalog is active, generate from 300k catalog
    if (referenceCatalogActive && totalBase > 0) {
      const needed = pageSize - matchedItems.length;
      if (needed > 0) {
        const genStart = Math.max(0, startIdx - matchingCustom.length);
        for (let i = 0; i < needed; i++) {
          const catalogIdx = genStart + i;
          if (catalogIdx < totalBase) {
            matchedItems.push(generateCatalogBookAtIndex(catalogIdx));
          }
        }
      }
    }
  }

  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  return {
    items: matchedItems,
    totalCount: effectiveTotal,
    totalPages,
    currentPage: Math.min(page, totalPages),
    pageSize,
    activeFilter: filterDdc,
    searchQuery: query,
    unlimitedCapacityNotice: referenceCatalogActive
      ? 'Reference Benchmark Catalog Active (300,000 Titles / 3.0 Lakhs)'
      : `Librarian Institutional Catalog Active (${customCount.toLocaleString()} Custom Titles)`,
    isReferenceActive: referenceCatalogActive
  };
}

export interface GenerateHoldingsOptions {
  count: number;
  discipline?: string; // 'ALL' or '000', '100', '200', etc.
  copiesPerTitle?: number;
  branchName?: string;
  accessionPrefix?: string;
  barcodePrefix?: string;
  startingIndex?: number;
}

export function generateInstitutionalHoldingsBatch(options: GenerateHoldingsOptions): {
  books: BookRecord[];
  copies: BookCopy[];
} {
  const {
    count,
    discipline = 'ALL',
    copiesPerTitle = 2,
    branchName = 'Central Academic Library',
    accessionPrefix = 'ACC-',
    barcodePrefix = 'BC-',
    startingIndex = 0
  } = options;

  const generatedBooks: BookRecord[] = [];
  const generatedCopies: BookCopy[] = [];

  for (let i = 0; i < count; i++) {
    const idx = startingIndex + i;
    // Generate base book
    const book = generateCatalogBookAtIndex(idx);

    // If specific discipline requested, filter or align
    if (discipline !== 'ALL') {
      const ddcDigit = discipline.charAt(0);
      const matchingDomain = SUBJECT_DOMAINS.find(d => d.ddc.startsWith(ddcDigit)) || SUBJECT_DOMAINS[0];
      book.department = matchingDomain.dept;
      book.ddcClassification = `${matchingDomain.ddc}.${String(idx % 99).padStart(2, '0')}`;
    }

    const bookAccNum = `${accessionPrefix}${String(idx + 1).padStart(6, '0')}`;
    book.id = `inst_bk_${idx + 1}_${Date.now()}`;
    book.accessionNumber = bookAccNum;
    book.totalCopies = copiesPerTitle;
    book.availableCopies = copiesPerTitle;
    book.copiesTotal = copiesPerTitle;
    book.copiesAvailable = copiesPerTitle;
    book.cataloguerName = 'Librarian Institutional Holdings Ingestion';
    book.shelfLocation = `${branchName} - Stacks Sec-${(idx % 15) + 1}`;

    generatedBooks.push(book);

    // Generate physical copies
    for (let c = 1; c <= copiesPerTitle; c++) {
      const copyBarcode = `${barcodePrefix}${String(idx + 1).padStart(6, '0')}-${c}`;
      const copyAcc = `${bookAccNum}-${c}`;
      const copy: BookCopy = {
        id: `cp_${book.id}_${c}`,
        bookId: book.id,
        barcode: copyBarcode,
        accessionNumber: copyAcc,
        branchLocation: branchName,
        status: 'AVAILABLE'
      };
      generatedCopies.push(copy);
    }
  }

  return { books: generatedBooks, copies: generatedCopies };
}
