import { MarcSubjectEntry, MarcSubjectTag, BookRecord } from '../types/alims';

export interface SubjectThesaurusDef {
  code: string;
  name: string;
  ind2: string;
  subfield2?: string;
  description: string;
}

export const SUBJECT_THESAURI: SubjectThesaurusDef[] = [
  { code: 'LCSH', name: 'Library of Congress (LCSH)', ind2: '0', description: 'Standard international subject authority' },
  { code: 'FAST', name: 'Faceted Terminology (FAST / OCLC)', ind2: '7', subfield2: 'fast', description: 'Simplified faceted access vocabulary' },
  { code: 'SEARS', name: 'Sears List of Subject Headings', ind2: '4', subfield2: 'sears', description: 'Small to medium academic library headings' },
  { code: 'MESH', name: 'Medical Subject Headings (MeSH)', ind2: '2', description: 'NLM health and biomedical terminology' },
  { code: 'NLP', name: 'National Library of Pakistan (NLP-SH)', ind2: '7', subfield2: 'nlpsh', description: 'Pakistan cultural, regional & Islamic subjects' },
  { code: 'LOCAL', name: 'University Institutional Authority', ind2: '4', description: 'Local campus authority heading' }
];

export const COMMON_SUBDIVISIONS = {
  general: [
    'Study and teaching',
    'Research',
    'History',
    'Philosophy',
    'Law and legislation',
    'Government policy',
    'Social aspects',
    'Economic aspects',
    'Management',
    'Mathematical models',
    'Security measures',
    'Design and construction',
    'Textbooks',
    'Technological innovations'
  ],
  geographic: [
    'Pakistan',
    'South Asia',
    'Developing countries',
    'Punjab (Pakistan)',
    'Sindh (Pakistan)',
    'Khyber Pakhtunkhwa (Pakistan)',
    'Balochistan (Pakistan)',
    'Islamabad (Pakistan)',
    'Middle East',
    'Asia'
  ],
  chronological: [
    '21st century',
    '20th century',
    '1947-',
    '1947-1971',
    '1971-',
    '2000-2025',
    'Early works to 1800'
  ],
  form: [
    'Handbooks, manuals, etc.',
    'Textbooks',
    'Case studies',
    'Dictionaries',
    'Encyclopedias',
    'Periodicals',
    'Congresses',
    'Bibliography',
    'Laboratory manuals',
    'Outlines, syllabi, etc.',
    'Indexes'
  ]
};

export interface SubjectPreset {
  discipline: string;
  tag: MarcSubjectTag;
  term: string;
  subdivisions?: {
    general?: string;
    geographic?: string;
    chronological?: string;
    form?: string;
  };
  thesaurus: string;
}

export const PAKISTANI_ACADEMIC_SUBJECT_PRESETS: SubjectPreset[] = [
  // Islamic Studies & Shariah (297 / 200)
  { discipline: 'Islamic Studies & Shariah', tag: '650', term: 'Islamic law', subdivisions: { geographic: 'Pakistan', general: 'Interpretation and construction' }, thesaurus: 'LCSH' },
  { discipline: 'Islamic Studies & Shariah', tag: '650', term: 'Hadith', subdivisions: { general: 'Criticism, interpretation, etc.', form: 'Early works to 1800' }, thesaurus: 'LCSH' },
  { discipline: 'Islamic Studies & Shariah', tag: '650', term: 'Quran', subdivisions: { general: 'Hermeneutics', form: 'Commentaries' }, thesaurus: 'LCSH' },
  { discipline: 'Islamic Studies & Shariah', tag: '650', term: 'Islamic finance and banking', subdivisions: { geographic: 'Pakistan', form: 'Case studies' }, thesaurus: 'LCSH' },
  { discipline: 'Islamic Studies & Shariah', tag: '600', term: 'Ghazālī, 1058-1111', subdivisions: { general: 'Philosophy and ethics' }, thesaurus: 'LCSH' },

  // Pakistani Law & Jurisprudence (340)
  { discipline: 'Pakistani Law', tag: '650', term: 'Constitutional law', subdivisions: { geographic: 'Pakistan', chronological: '1973-', form: 'Commentaries' }, thesaurus: 'LCSH' },
  { discipline: 'Pakistani Law', tag: '650', term: 'Criminal law', subdivisions: { geographic: 'Pakistan', general: 'Cases' }, thesaurus: 'LCSH' },
  { discipline: 'Pakistani Law', tag: '650', term: 'Civil procedure', subdivisions: { geographic: 'Pakistan', form: 'Handbooks, manuals, etc.' }, thesaurus: 'LCSH' },
  { discipline: 'Pakistani Law', tag: '610', term: 'Supreme Court of Pakistan', subdivisions: { general: 'Rules and practice' }, thesaurus: 'LCSH' },
  { discipline: 'Pakistani Law', tag: '650', term: 'Law of evidence', subdivisions: { geographic: 'Pakistan', chronological: '1984-' }, thesaurus: 'NLP' },

  // Computer Science & AI (004-006)
  { discipline: 'Computer Science & AI', tag: '650', term: 'Artificial intelligence', subdivisions: { general: 'Technological innovations', form: 'Textbooks' }, thesaurus: 'LCSH' },
  { discipline: 'Computer Science & AI', tag: '650', term: 'Software engineering', subdivisions: { general: 'Design patterns', form: 'Handbooks, manuals, etc.' }, thesaurus: 'LCSH' },
  { discipline: 'Computer Science & AI', tag: '650', term: 'Computer networks', subdivisions: { general: 'Security measures', form: 'Textbooks' }, thesaurus: 'LCSH' },
  { discipline: 'Computer Science & AI', tag: '650', term: 'Machine learning', subdivisions: { general: 'Algorithms', form: 'Laboratory manuals' }, thesaurus: 'LCSH' },
  { discipline: 'Computer Science & AI', tag: '655', term: 'Textbooks', subdivisions: {}, thesaurus: 'FAST' },

  // Medical & Health Sciences (610)
  { discipline: 'Medical & Health Sciences', tag: '650', term: 'Internal medicine', subdivisions: { general: 'Diagnosis', form: 'Handbooks, manuals, etc.' }, thesaurus: 'MESH' },
  { discipline: 'Medical & Health Sciences', tag: '650', term: 'Public health', subdivisions: { geographic: 'Pakistan', chronological: '21st century' }, thesaurus: 'MESH' },
  { discipline: 'Medical & Health Sciences', tag: '650', term: 'Pharmacology, Clinical', subdivisions: { general: 'Dosage', form: 'Tables' }, thesaurus: 'MESH' },

  // Urdu Literature & Linguistics (891.439)
  { discipline: 'Urdu Literature', tag: '600', term: 'Iqbal, Muhammad, Sir, 1877-1938', subdivisions: { general: 'Poetry and philosophy', form: 'Criticism and interpretation' }, thesaurus: 'NLP' },
  { discipline: 'Urdu Literature', tag: '650', term: 'Urdu poetry', subdivisions: { chronological: '20th century', form: 'History and criticism' }, thesaurus: 'LCSH' },
  { discipline: 'Urdu Literature', tag: '650', term: 'Urdu language', subdivisions: { general: 'Grammar', form: 'Textbooks' }, thesaurus: 'NLP' },

  // Pakistan Studies & History (954.91)
  { discipline: 'Pakistan Studies', tag: '651', term: 'Pakistan', subdivisions: { general: 'History', chronological: '1947-' }, thesaurus: 'LCSH' },
  { discipline: 'Pakistan Studies', tag: '651', term: 'Pakistan', subdivisions: { general: 'Foreign relations', geographic: 'South Asia' }, thesaurus: 'LCSH' },
  { discipline: 'Pakistan Studies', tag: '600', term: 'Jinnah, Mahomed Ali, 1876-1948', subdivisions: { general: 'Political and social views' }, thesaurus: 'LCSH' }
];

/**
 * Formats a subject entry into both human-readable and raw MARC21 subfield string
 */
export function formatMarcSubjectString(entry: {
  tag: MarcSubjectTag;
  term: string;
  ind1?: string;
  ind2?: string;
  thesaurusSource?: string;
  subdivisions?: {
    general?: string;
    geographic?: string;
    chronological?: string;
    form?: string;
  };
}): { formattedHeading: string; rawMarcString: string } {
  const parts: string[] = [entry.term.trim()];
  const sub = entry.subdivisions || {};

  if (sub.general && sub.general.trim()) parts.push(sub.general.trim());
  if (sub.geographic && sub.geographic.trim()) parts.push(sub.geographic.trim());
  if (sub.chronological && sub.chronological.trim()) parts.push(sub.chronological.trim());
  if (sub.form && sub.form.trim()) parts.push(sub.form.trim());

  const formattedHeading = parts.join(' -- ');

  const i1 = entry.ind1 || (entry.tag === '600' ? '1' : entry.tag === '610' ? '2' : '#');
  const i2 = entry.ind2 || (entry.thesaurusSource === 'MESH' ? '2' : entry.thesaurusSource === 'FAST' || entry.thesaurusSource === 'NLP' ? '7' : '0');

  let marcSubfields = `$a ${entry.term.trim()}`;
  if (sub.general && sub.general.trim()) marcSubfields += ` $x ${sub.general.trim()}`;
  if (sub.geographic && sub.geographic.trim()) marcSubfields += ` $z ${sub.geographic.trim()}`;
  if (sub.chronological && sub.chronological.trim()) marcSubfields += ` $y ${sub.chronological.trim()}`;
  if (sub.form && sub.form.trim()) marcSubfields += ` $v ${sub.form.trim()}`;
  if (i2 === '7') {
    const src = entry.thesaurusSource ? entry.thesaurusSource.toLowerCase() : 'fast';
    marcSubfields += ` $2 ${src}`;
  }

  const rawMarcString = `${entry.tag} ${i1}${i2} ${marcSubfields}`;

  return { formattedHeading, rawMarcString };
}

/**
 * Creates a structured MarcSubjectEntry with auto-calculated strings
 */
export function createMarcSubjectEntry(data: {
  tag?: MarcSubjectTag;
  term: string;
  ind1?: string;
  ind2?: string;
  thesaurusSource?: string;
  subdivisions?: {
    general?: string;
    geographic?: string;
    chronological?: string;
    form?: string;
  };
}): MarcSubjectEntry {
  const tag: MarcSubjectTag = data.tag || '650';
  const term = data.term.trim();
  const thesaurus = data.thesaurusSource || 'LCSH';

  const defaultInd1 = tag === '600' ? '1' : tag === '610' ? '2' : '#';
  const defaultInd2 = thesaurus === 'MESH' ? '2' : thesaurus === 'FAST' || thesaurus === 'NLP' ? '7' : '0';

  const { formattedHeading, rawMarcString } = formatMarcSubjectString({
    tag,
    term,
    ind1: data.ind1 || defaultInd1,
    ind2: data.ind2 || defaultInd2,
    thesaurusSource: thesaurus,
    subdivisions: data.subdivisions
  });

  return {
    id: `subj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tag,
    ind1: data.ind1 || defaultInd1,
    ind2: data.ind2 || defaultInd2,
    term,
    subdivisions: data.subdivisions,
    thesaurusSource: thesaurus,
    formattedHeading,
    rawMarcString
  };
}

/**
 * Parses freeform text or comma/dash separated strings into structured MarcSubjectEntries
 */
export function parseRawSubjectStrings(input: string, defaultTag: MarcSubjectTag = '650'): MarcSubjectEntry[] {
  if (!input || !input.trim()) return [];

  const rawItems = input.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
  const entries: MarcSubjectEntry[] = [];

  for (const item of rawItems) {
    // Check if it already has subfield dashes like "Computer architecture -- Design -- Pakistan"
    if (item.includes(' -- ')) {
      const parts = item.split(' -- ').map(p => p.trim()).filter(Boolean);
      const mainTerm = parts[0];
      const remaining = parts.slice(1);

      let general: string | undefined;
      let geographic: string | undefined;
      let form: string | undefined;

      for (const part of remaining) {
        if (COMMON_SUBDIVISIONS.geographic.includes(part) || part.toLowerCase().includes('pakistan') || part.toLowerCase().includes('asia')) {
          geographic = part;
        } else if (COMMON_SUBDIVISIONS.form.includes(part) || part.toLowerCase().includes('textbook') || part.toLowerCase().includes('handbook')) {
          form = part;
        } else {
          general = general ? `${general} -- ${part}` : part;
        }
      }

      entries.push(createMarcSubjectEntry({
        tag: defaultTag,
        term: mainTerm,
        subdivisions: { general, geographic, form }
      }));
    } else {
      entries.push(createMarcSubjectEntry({
        tag: defaultTag,
        term: item
      }));
    }
  }

  return entries;
}

/**
 * Extracts or synthesizes standard Subject Entries from a BookRecord
 */
export function ensureBookSubjectEntries(book: BookRecord): MarcSubjectEntry[] {
  if (book.subjectEntries && book.subjectEntries.length > 0) {
    return book.subjectEntries;
  }

  const entries: MarcSubjectEntry[] = [];

  // Check marc21Tags if available
  if (book.marc21Tags && Array.isArray(book.marc21Tags)) {
    for (const mt of book.marc21Tags) {
      if (['600', '610', '611', '630', '650', '651', '653', '655'].includes(mt.tag)) {
        let term = '';
        let general: string | undefined;
        let geographic: string | undefined;
        let form: string | undefined;

        if (typeof mt.subfields === 'object' && mt.subfields !== null) {
          term = mt.subfields.a || '';
          general = mt.subfields.x;
          geographic = mt.subfields.z;
          form = mt.subfields.v;
        } else if (typeof mt.subfields === 'string') {
          term = mt.subfields;
        }

        if (term) {
          entries.push(createMarcSubjectEntry({
            tag: mt.tag as MarcSubjectTag,
            ind1: mt.ind1,
            ind2: mt.ind2,
            term,
            subdivisions: { general, geographic, form }
          }));
        }
      }
    }
  }

  // If no marc21Tags, build from book.subjects
  if (entries.length === 0 && book.subjects && book.subjects.length > 0) {
    for (const s of book.subjects) {
      const parsed = parseRawSubjectStrings(s);
      entries.push(...parsed);
    }
  }

  // Fallback to title/department topic
  if (entries.length === 0) {
    entries.push(createMarcSubjectEntry({
      tag: '650',
      term: book.department || 'General Library Collection',
      subdivisions: { form: 'Textbooks' }
    }));
  }

  return entries;
}

/**
 * Smart RDA & MARC21 Subject Suggester
 * Analyzes Title, DDC, and Description to recommend standardized subject access points
 */
export function suggestRdaSubjects(title: string, ddc: string, description?: string): MarcSubjectEntry[] {
  const suggestions: MarcSubjectEntry[] = [];
  const text = `${title} ${ddc} ${description || ''}`.toLowerCase();

  // Shariah & Islamic Studies
  if (text.includes('islam') || text.includes('quran') || text.includes('hadith') || text.includes('fiqh') || ddc.startsWith('297') || ddc.startsWith('2')) {
    suggestions.push(createMarcSubjectEntry({
      tag: '650',
      term: 'Islamic law',
      subdivisions: { geographic: 'Pakistan', general: 'Interpretation and construction' },
      thesaurusSource: 'LCSH'
    }));
    suggestions.push(createMarcSubjectEntry({
      tag: '650',
      term: 'Islamic ethics',
      subdivisions: { general: 'Early works to 1800' },
      thesaurusSource: 'LCSH'
    }));
    suggestions.push(createMarcSubjectEntry({
      tag: '655',
      term: 'Commentaries',
      thesaurusSource: 'FAST'
    }));
  }

  // Pakistani Law & Constitution
  if (text.includes('law') || text.includes('constitution') || text.includes('penal') || text.includes('procedure') || ddc.startsWith('34')) {
    suggestions.push(createMarcSubjectEntry({
      tag: '650',
      term: 'Constitutional law',
      subdivisions: { geographic: 'Pakistan', form: 'Commentaries' },
      thesaurusSource: 'LCSH'
    }));
    suggestions.push(createMarcSubjectEntry({
      tag: '651',
      term: 'Pakistan',
      subdivisions: { general: 'Politics and government', chronological: '1947-' },
      thesaurusSource: 'LCSH'
    }));
    suggestions.push(createMarcSubjectEntry({
      tag: '655',
      term: 'Statutes and codes',
      thesaurusSource: 'FAST'
    }));
  }

  // Computer Science, Software & AI
  if (text.includes('software') || text.includes('computer') || text.includes('architect') || text.includes('data') || text.includes('neural') || text.includes('ai') || text.includes('pattern') || ddc.startsWith('00')) {
    suggestions.push(createMarcSubjectEntry({
      tag: '650',
      term: 'Software architecture',
      subdivisions: { general: 'Design and construction', form: 'Handbooks, manuals, etc.' },
      thesaurusSource: 'LCSH'
    }));
    suggestions.push(createMarcSubjectEntry({
      tag: '650',
      term: 'Computer algorithms',
      subdivisions: { general: 'Evaluation', form: 'Textbooks' },
      thesaurusSource: 'LCSH'
    }));
    suggestions.push(createMarcSubjectEntry({
      tag: '655',
      term: 'Textbooks',
      thesaurusSource: 'FAST'
    }));
  }

  // Medicine & Health Sciences
  if (text.includes('medic') || text.includes('pathol') || text.includes('health') || text.includes('clinic') || text.includes('pediatr') || ddc.startsWith('61')) {
    suggestions.push(createMarcSubjectEntry({
      tag: '650',
      term: 'Clinical medicine',
      subdivisions: { general: 'Diagnosis', form: 'Handbooks, manuals, etc.' },
      thesaurusSource: 'MESH'
    }));
    suggestions.push(createMarcSubjectEntry({
      tag: '650',
      term: 'Public health administration',
      subdivisions: { geographic: 'Developing countries' },
      thesaurusSource: 'MESH'
    }));
  }

  // Literature & Urdu
  if (text.includes('urdu') || text.includes('poet') || text.includes('literat') || text.includes('novel') || ddc.startsWith('8')) {
    suggestions.push(createMarcSubjectEntry({
      tag: '650',
      term: 'Urdu literature',
      subdivisions: { chronological: '20th century', form: 'History and criticism' },
      thesaurusSource: 'NLP'
    }));
    suggestions.push(createMarcSubjectEntry({
      tag: '600',
      term: 'Iqbal, Muhammad, Sir, 1877-1938',
      subdivisions: { general: 'Criticism and interpretation' },
      thesaurusSource: 'LCSH'
    }));
  }

  // If none matched, provide generic high-quality academic subjects
  if (suggestions.length === 0) {
    const cleanWord = title.split(/[:;,]/)[0].trim();
    suggestions.push(createMarcSubjectEntry({
      tag: '650',
      term: cleanWord,
      subdivisions: { general: 'Study and teaching', form: 'Textbooks' },
      thesaurusSource: 'LCSH'
    }));
    suggestions.push(createMarcSubjectEntry({
      tag: '650',
      term: 'Academic research',
      subdivisions: { general: 'Methodology' },
      thesaurusSource: 'LCSH'
    }));
  }

  return suggestions;
}
