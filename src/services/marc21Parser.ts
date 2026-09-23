/**
 * PLiMS Universal MARC21 & ISO-2709 Bibliographic Record Parser
 * 
 * Supports:
 * 1. ISO 2709 Binary Format (.mrc, .marc, .marc21, .dat)
 * 2. MarcEdit Mnemonic Text Format (.mrk, .txt)
 * 3. MARCXML Library of Congress Standard (.xml, .marcxml)
 * 4. MARC-in-JSON & Koha / Evergreen JSON records
 */

import { BookRecord, BookCopy } from '../types/alims';

export interface MarcSubfield {
  code: string;
  value: string;
}

export interface MarcDataField {
  tag: string;
  ind1: string;
  ind2: string;
  subfields: MarcSubfield[];
}

export interface ParsedMarcRecord {
  leader: string;
  controlFields: Record<string, string>;
  dataFields: MarcDataField[];
  rawText?: string;
  // Normalized mapped bibliographic properties
  title: string;
  subtitle?: string;
  authors: string[];
  isbn?: string;
  issn?: string;
  ddc?: string;
  callNumber?: string;
  edition?: string;
  publisher?: string;
  publisherLocation?: string;
  publisherYear?: number;
  physicalDescription?: string;
  pageCount?: number;
  series?: string;
  subjects: string[];
  summary?: string;
  shelfLocation?: string;
  accessionNumber?: string;
  language?: string;
}

/**
 * Normalizes indicators (replaces \ with space or #)
 */
function normalizeIndicator(char: string | undefined): string {
  if (!char || char === '\\' || char === ' ') return '#';
  return char;
}

/**
 * Extracts all subfields for a given tag
 */
export function getSubfields(rec: ParsedMarcRecord, tag: string, code?: string): string[] {
  const fields = rec.dataFields.filter(f => f.tag === tag);
  const results: string[] = [];
  for (const f of fields) {
    for (const sf of f.subfields) {
      if (!code || sf.code === code) {
        results.push(sf.value);
      }
    }
  }
  return results;
}

/**
 * Extracts first subfield value for a tag and code
 */
export function getFirstSubfield(rec: ParsedMarcRecord, tag: string, code: string): string | undefined {
  const field = rec.dataFields.find(f => f.tag === tag);
  if (!field) return undefined;
  const sf = field.subfields.find(s => s.code === code);
  return sf ? sf.value : undefined;
}

/**
 * Maps raw parsed MARC data fields to standard BookRecord fields
 */
export function enrichMarcRecordMetadata(
  leader: string,
  controlFields: Record<string, string>,
  dataFields: MarcDataField[]
): ParsedMarcRecord {
  // Title (245 $a, $b, $c)
  const f245 = dataFields.find(f => f.tag === '245');
  let title = f245?.subfields.find(s => s.code === 'a')?.value || 'Untitled MARC Record';
  // Strip trailing punctuation like " /", " :", "."
  title = title.replace(/\s*[/:]\s*$/, '').trim();

  let subtitle = f245?.subfields.find(s => s.code === 'b')?.value?.replace(/\s*[/:]\s*$/, '').trim();

  // Authors: 100 $a (Primary), 700 $a (Added entries), or 245 $c (Statement of responsibility)
  const authors: string[] = [];
  const f100a = dataFields.find(f => f.tag === '100')?.subfields.find(s => s.code === 'a')?.value;
  if (f100a) {
    authors.push(f100a.replace(/[.,;]\s*$/, '').trim());
  }

  // 700 added authors
  dataFields.filter(f => f.tag === '700').forEach(f => {
    const val = f.subfields.find(s => s.code === 'a')?.value;
    if (val) {
      const clean = val.replace(/[.,;]\s*$/, '').trim();
      if (!authors.includes(clean)) authors.push(clean);
    }
  });

  // Fallback to 245 $c if 100 is absent
  if (authors.length === 0) {
    const f245c = f245?.subfields.find(s => s.code === 'c')?.value;
    if (f245c) {
      authors.push(f245c.replace(/[.,;]\s*$/, '').trim());
    } else {
      authors.push('Unknown Author');
    }
  }

  // ISBN: 020 $a
  const rawIsbn = dataFields.find(f => f.tag === '020')?.subfields.find(s => s.code === 'a')?.value;
  const isbn = rawIsbn ? rawIsbn.split(/[\s(:]/)[0].replace(/[^0-9X-]/gi, '') : undefined;

  // DDC: 082 $a
  const ddc = dataFields.find(f => f.tag === '082')?.subfields.find(s => s.code === 'a')?.value?.trim();

  // Call Number: 090 $a or 050 $a (LCC) or synthesized DDC + author cutter
  const f090a = dataFields.find(f => f.tag === '090')?.subfields.find(s => s.code === 'a')?.value;
  const f050a = dataFields.find(f => f.tag === '050')?.subfields.find(s => s.code === 'a')?.value;
  const callNumber = f090a || f050a || (ddc ? `${ddc} ${authors[0]?.substring(0, 3).toUpperCase()}` : '025.3 PLI/M');

  // Accession Number: 090 $b or 852 $p
  const accNum =
    dataFields.find(f => f.tag === '852')?.subfields.find(s => s.code === 'p')?.value ||
    dataFields.find(f => f.tag === '090')?.subfields.find(s => s.code === 'b')?.value;

  // Shelf Location: 852 $c
  const shelfLocation = dataFields.find(f => f.tag === '852')?.subfields.find(s => s.code === 'c')?.value || 'Main Stacks';

  // Publisher: 260 $b or 264 $b
  const pubField = dataFields.find(f => f.tag === '260' || f.tag === '264');
  let publisher = pubField?.subfields.find(s => s.code === 'b')?.value?.replace(/[.,;]\s*$/, '').trim();
  let publisherLocation = pubField?.subfields.find(s => s.code === 'a')?.value?.replace(/[.,;:]\s*$/, '').trim();
  
  // Year: 260 $c or 264 $c
  const rawYear = pubField?.subfields.find(s => s.code === 'c')?.value;
  let publisherYear: number | undefined;
  if (rawYear) {
    const match = rawYear.match(/\b(19\d\d|20\d\d)\b/);
    if (match) publisherYear = parseInt(match[1], 10);
  }

  // Edition: 250 $a
  const edition = dataFields.find(f => f.tag === '250')?.subfields.find(s => s.code === 'a')?.value?.trim();

  // Physical description & page count: 300 $a
  const physDesc = dataFields.find(f => f.tag === '300')?.subfields.find(s => s.code === 'a')?.value;
  let pageCount = 280;
  if (physDesc) {
    const pageMatch = physDesc.match(/(\d+)\s*(?:p|pages)/i);
    if (pageMatch) pageCount = parseInt(pageMatch[1], 10);
  }

  // Subjects: 650, 600, 651, 655
  const subjects: string[] = [];
  dataFields.filter(f => ['650', '600', '651', '655'].includes(f.tag)).forEach(f => {
    const term = f.subfields.map(s => s.value.replace(/[.,;]\s*$/, '').trim()).join(' -- ');
    if (term && !subjects.includes(term)) subjects.push(term);
  });

  // Summary: 520 $a
  const summary = dataFields.find(f => f.tag === '520')?.subfields.find(s => s.code === 'a')?.value;

  // Language from 008 (chars 35-37) or 041 $a
  let language = controlFields['008'] ? controlFields['008'].substring(35, 38).trim() : undefined;
  if (!language || language.length === 0) {
    language = dataFields.find(f => f.tag === '041')?.subfields.find(s => s.code === 'a')?.value;
  }

  return {
    leader,
    controlFields,
    dataFields,
    title,
    subtitle,
    authors,
    isbn,
    ddc,
    callNumber,
    edition,
    publisher: publisher || 'Academic Press',
    publisherLocation: publisherLocation || 'Islamabad, PK',
    publisherYear: publisherYear || 2024,
    physicalDescription: physDesc,
    pageCount,
    subjects: subjects.length > 0 ? subjects : ['Academic Collection'],
    summary,
    shelfLocation,
    accessionNumber: accNum,
    language
  };
}

/**
 * 1. ISO 2709 Binary Parser (.mrc / .marc / .dat)
 * Fully compliant with ISO 2709 standard record specifications.
 */
export function parseMarc21Binary(buffer: ArrayBuffer | Uint8Array): ParsedMarcRecord[] {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const records: ParsedMarcRecord[] = [];
  const textDecoderUtf8 = new TextDecoder('utf-8', { fatal: false });
  const textDecoderAscii = new TextDecoder('iso-8859-1');

  let offset = 0;
  const totalLength = bytes.length;

  while (offset < totalLength - 24) {
    // Find next leader (must start with 5 ASCII digits)
    const recLenStr = String.fromCharCode(...bytes.subarray(offset, offset + 5));
    const recordLen = parseInt(recLenStr, 10);

    if (isNaN(recordLen) || recordLen < 25 || offset + recordLen > totalLength) {
      // If corrupted byte, search forward for record terminator 0x1D
      let nextRec = -1;
      for (let i = offset; i < Math.min(offset + 1000, totalLength); i++) {
        if (bytes[i] === 0x1d) {
          nextRec = i + 1;
          break;
        }
      }
      if (nextRec !== -1 && nextRec < totalLength) {
        offset = nextRec;
        continue;
      }
      break;
    }

    const recBytes = bytes.subarray(offset, offset + recordLen);
    const leader = String.fromCharCode(...recBytes.subarray(0, 24));

    // Base address of data is in leader characters 12..17
    const baseAddressStr = leader.substring(12, 17);
    const baseAddress = parseInt(baseAddressStr, 10);

    if (isNaN(baseAddress) || baseAddress <= 24 || baseAddress > recordLen) {
      offset += recordLen;
      continue;
    }

    // Encoding: Leader character 9 is 'a' for UTF-8, ' ' for MARC-8/ASCII
    const isUtf8 = leader.charAt(9) === 'a';
    const decoder = isUtf8 ? textDecoderUtf8 : textDecoderAscii;

    const controlFields: Record<string, string> = {};
    const dataFields: MarcDataField[] = [];

    // Directory runs from index 24 up to baseAddress - 1
    // Each directory entry is 12 bytes: 3 bytes tag, 4 bytes length, 5 bytes starting position
    const directoryLength = baseAddress - 24 - 1; // excluding field terminator 0x1E
    const entryCount = Math.floor(directoryLength / 12);

    for (let e = 0; e < entryCount; e++) {
      const entryOffset = 24 + e * 12;
      const tag = String.fromCharCode(...recBytes.subarray(entryOffset, entryOffset + 3));
      const fieldLen = parseInt(String.fromCharCode(...recBytes.subarray(entryOffset + 3, entryOffset + 7)), 10);
      const fieldStart = parseInt(String.fromCharCode(...recBytes.subarray(entryOffset + 7, entryOffset + 12)), 10);

      if (isNaN(fieldLen) || isNaN(fieldStart)) continue;

      const fieldAbsStart = baseAddress + fieldStart;
      const fieldAbsEnd = fieldAbsStart + fieldLen;

      if (fieldAbsStart >= recordLen || fieldAbsEnd > recordLen) continue;

      // Extract field data up to field terminator (0x1E)
      let actualEnd = fieldAbsEnd;
      if (recBytes[actualEnd - 1] === 0x1e) {
        actualEnd--;
      }

      const fieldBytes = recBytes.subarray(fieldAbsStart, actualEnd);

      // Control field (001 - 009)
      if (tag.startsWith('00')) {
        controlFields[tag] = decoder.decode(fieldBytes).trim();
      } else {
        // Variable Data Field (>= 010)
        // First 2 bytes are indicators
        const ind1 = fieldBytes.length > 0 ? String.fromCharCode(fieldBytes[0]) : '#';
        const ind2 = fieldBytes.length > 1 ? String.fromCharCode(fieldBytes[1]) : '#';

        const subfields: MarcSubfield[] = [];
        // Subfields start from index 2 and are delimited by 0x1F
        let sfStart = 2;
        while (sfStart < fieldBytes.length) {
          if (fieldBytes[sfStart] === 0x1f) {
            const code = String.fromCharCode(fieldBytes[sfStart + 1] || 0x61); // default 'a'
            let sfEnd = sfStart + 2;
            while (sfEnd < fieldBytes.length && fieldBytes[sfEnd] !== 0x1f && fieldBytes[sfEnd] !== 0x1e) {
              sfEnd++;
            }
            const sfValBytes = fieldBytes.subarray(sfStart + 2, sfEnd);
            const val = decoder.decode(sfValBytes).trim();
            subfields.push({ code, value: val });
            sfStart = sfEnd;
          } else {
            sfStart++;
          }
        }

        dataFields.push({
          tag,
          ind1: normalizeIndicator(ind1),
          ind2: normalizeIndicator(ind2),
          subfields
        });
      }
    }

    const enriched = enrichMarcRecordMetadata(leader, controlFields, dataFields);
    records.push(enriched);

    offset += recordLen;
  }

  return records;
}

/**
 * 2. MarcEdit Mnemonic Format Parser (.mrk, .txt)
 * Handles `=LDR  00000...`, `=001  12345`, `=245  10$a...`
 */
export function parseMarc21Mnemonic(text: string): ParsedMarcRecord[] {
  const records: ParsedMarcRecord[] = [];
  const lines = text.split(/\r?\n/);

  let currentLeader = '00000nam a2200000 u 4500';
  let currentControl: Record<string, string> = {};
  let currentData: MarcDataField[] = [];
  let inRecord = false;

  const commitRecord = () => {
    if (inRecord && (Object.keys(currentControl).length > 0 || currentData.length > 0)) {
      records.push(enrichMarcRecordMetadata(currentLeader, currentControl, currentData));
    }
    currentLeader = '00000nam a2200000 u 4500';
    currentControl = {};
    currentData = [];
    inRecord = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inRecord) commitRecord();
      continue;
    }

    if (trimmed.startsWith('=LDR')) {
      if (inRecord) commitRecord();
      inRecord = true;
      currentLeader = trimmed.substring(5).trim() || currentLeader;
      continue;
    }

    if (trimmed.startsWith('=')) {
      inRecord = true;
      const tag = trimmed.substring(1, 4);
      const rest = trimmed.substring(4).trim();

      // Control field
      if (tag.startsWith('00')) {
        currentControl[tag] = rest;
        continue;
      }

      // Variable data field
      // Indicators are 2 chars before first '$'
      const firstDollar = rest.indexOf('$');
      let ind1 = '#';
      let ind2 = '#';
      let subfieldsPart = rest;

      if (firstDollar > 0) {
        const indPart = rest.substring(0, firstDollar).trim();
        ind1 = indPart.charAt(0) || '#';
        ind2 = indPart.charAt(1) || '#';
        subfieldsPart = rest.substring(firstDollar);
      }

      const subfields: MarcSubfield[] = [];
      const parts = subfieldsPart.split('$').filter(Boolean);
      for (const p of parts) {
        const code = p.charAt(0);
        const value = p.substring(1).trim();
        if (code) {
          subfields.push({ code, value });
        }
      }

      currentData.push({
        tag,
        ind1: normalizeIndicator(ind1),
        ind2: normalizeIndicator(ind2),
        subfields
      });
    }
  }

  commitRecord();
  return records;
}

/**
 * 3. MARCXML Parser (.xml, .marcxml)
 */
export function parseMarcXML(xmlText: string): ParsedMarcRecord[] {
  const records: ParsedMarcRecord[] = [];
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const recordElements = Array.from(xmlDoc.getElementsByTagName('record'));
  // If no <record> tag, check if root is <record>
  const targetElements = recordElements.length > 0 ? recordElements : [xmlDoc.documentElement];

  for (const recElem of targetElements) {
    if (recElem.nodeName !== 'record' && recordElements.length === 0) continue;

    const leaderElem = recElem.getElementsByTagName('leader')[0];
    const leader = leaderElem?.textContent || '00000nam a2200000 u 4500';

    const controlFields: Record<string, string> = {};
    const controlElems = Array.from(recElem.getElementsByTagName('controlfield'));
    for (const c of controlElems) {
      const tag = c.getAttribute('tag');
      if (tag) controlFields[tag] = c.textContent || '';
    }

    const dataFields: MarcDataField[] = [];
    const dataElems = Array.from(recElem.getElementsByTagName('datafield'));
    for (const d of dataElems) {
      const tag = d.getAttribute('tag') || '999';
      const ind1 = normalizeIndicator(d.getAttribute('ind1') || undefined);
      const ind2 = normalizeIndicator(d.getAttribute('ind2') || undefined);

      const subfields: MarcSubfield[] = [];
      const subElems = Array.from(d.getElementsByTagName('subfield'));
      for (const s of subElems) {
        const code = s.getAttribute('code') || 'a';
        subfields.push({ code, value: s.textContent || '' });
      }

      dataFields.push({ tag, ind1, ind2, subfields });
    }

    if (Object.keys(controlFields).length > 0 || dataFields.length > 0) {
      records.push(enrichMarcRecordMetadata(leader, controlFields, dataFields));
    }
  }

  return records;
}

/**
 * Universal Auto-Detecting Parser
 * Handles .mrc, .marc, .marc21, .mrk, .xml, .marcxml, .json, or raw text paste.
 */
export async function parseUniversalMarcFile(file: File): Promise<ParsedMarcRecord[]> {
  const name = file.name.toLowerCase();

  // If binary MARC21 (.mrc, .marc, .marc21, .dat)
  if (name.endsWith('.mrc') || name.endsWith('.marc') || name.endsWith('.marc21') || name.endsWith('.dat')) {
    const buffer = await file.arrayBuffer();
    // Test if file is actually ASCII mnemonic
    const preview = new TextDecoder('utf-8').decode(buffer.slice(0, 100));
    if (preview.startsWith('=LDR') || preview.startsWith('=')) {
      const text = await file.text();
      return parseMarc21Mnemonic(text);
    }
    return parseMarc21Binary(buffer);
  }

  // If MARCXML (.xml, .marcxml)
  if (name.endsWith('.xml') || name.endsWith('.marcxml')) {
    const text = await file.text();
    return parseMarcXML(text);
  }

  // If MarcEdit Mnemonic text (.mrk, .txt)
  if (name.endsWith('.mrk') || name.endsWith('.txt')) {
    const text = await file.text();
    if (text.includes('<record>') || text.includes('<collection')) {
      return parseMarcXML(text);
    }
    return parseMarc21Mnemonic(text);
  }

  // If JSON
  if (name.endsWith('.json')) {
    const text = await file.text();
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data.map((d, i) => enrichMarcRecordMetadata(
        d.leader || '00000nam a2200000 u 4500',
        d.controlFields || {},
        d.dataFields || []
      ));
    }
  }

  // Fallback: examine first 500 bytes to auto-detect binary vs text
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // Check if starts with 5 digits (ISO 2709)
  const first5 = String.fromCharCode(...bytes.subarray(0, 5));
  if (/^\d{5}$/.test(first5)) {
    return parseMarc21Binary(buffer);
  }

  const text = new TextDecoder('utf-8').decode(buffer);
  if (text.includes('<record') || text.includes('</record>')) {
    return parseMarcXML(text);
  }

  return parseMarc21Mnemonic(text);
}

/**
 * Universal Raw String Parser (for copy-pasting raw MARC text)
 */
export function parseRawMarcText(raw: string): ParsedMarcRecord[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith('<') || trimmed.includes('<record')) {
    return parseMarcXML(trimmed);
  }
  return parseMarc21Mnemonic(trimmed);
}

/**
 * Converts a ParsedMarcRecord into a PLiMS BookRecord and associated copies
 */
export function convertMarcRecordToBook(
  marc: ParsedMarcRecord,
  index: number = 0,
  options?: {
    defaultBranch?: string;
    copiesCount?: number;
    generateCopies?: boolean;
  }
): { book: BookRecord; copies: BookCopy[] } {
  const {
    defaultBranch = 'Central Academic Library',
    copiesCount = 2,
    generateCopies = true
  } = options || {};

  const timestamp = Date.now();
  const bookId = `bk_marc_${timestamp}_${index + 1}`;
  const ddc = marc.ddc || '000';
  const author = marc.authors[0] || 'Unknown Author';
  const callNumber = marc.callNumber || `${ddc} ${author.substring(0, 3).toUpperCase()}`;
  const accessionNumber = marc.accessionNumber || `ACC-MARC-${(350000 + index).toString()}`;
  const isbn = marc.isbn || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  const book: BookRecord = {
    id: bookId,
    isbn,
    title: marc.title,
    subtitle: marc.subtitle || '',
    authors: marc.authors.length > 0 ? marc.authors : ['Unknown Author'],
    department: 'Academic Holdings',
    callNumber,
    edition: marc.edition || '1st Edition',
    publisherName: marc.publisher || 'Academic Press',
    publisherLocation: marc.publisherLocation || 'Islamabad, PK',
    publisherYear: marc.publisherYear || 2024,
    pageCount: marc.pageCount || 280,
    totalCopies: copiesCount,
    availableCopies: copiesCount,
    shelfLocation: marc.shelfLocation || 'Main Stacks',
    subjects: marc.subjects.length > 0 ? marc.subjects : ['General Collection'],
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&auto=format&fit=crop&q=80',
    ddcClassification: ddc,
    accessionNumber,
    isCustomAdded: true,
    cataloguedDate: new Date().toISOString().split('T')[0],
    description: marc.summary || `Standard MARC21 bibliographic record for "${marc.title}". Leader: ${marc.leader}`,
    format: 'HARDCOVER'
  };

  const copies: BookCopy[] = [];
  if (generateCopies) {
    for (let c = 1; c <= copiesCount; c++) {
      copies.push({
        id: `copy_${bookId}_${c}`,
        bookId,
        accessionNumber: `${accessionNumber}-C${c}`,
        barcode: `BC-MARC-${(600000 + index * 10 + c).toString()}`,
        branchLocation: defaultBranch,
        status: 'AVAILABLE'
      });
    }
  }

  return { book, copies };
}

/**
 * Sample standard Library of Congress MARC21 Mnemonic Record for testing & demonstration
 */
export const SAMPLE_MARC21_DEMO_TEXT = `=LDR  01120nam a2200325 a 4500
=001  PLIMS-MARC-2026-001
=005  20260923055410.0
=008  240115s2024    pk a    sb    001 0 eng d
=020  \\\\$a9780132350884$qhardcover
=040  \\\\$aDLC$beng$cPakLibNet$erda
=082  04$a025.04$223
=090  \\\\$a025.04 AKH$bACC-PK-8801
=100  1\\$aAkhter, Aijaz,$eauthor
=245  10$aModern Library Automation & Cognitive Knowledge Systems :$bArchitectures, MARC21 RDA Protocols, and Neural Discovery /$cProf. Dr. Aijaz Akhter and Dr. Farhan Qureshi.
=250  \\\\$a2nd revised edition.
=260  \\\\$aIslamabad, Pakistan :$bNational Book Foundation,$c2024.
=300  \\\\$axvii, 482 pages :$billustrations (some color) ;$c24 cm.
=500  \\\\$aIncludes bibliographical references (pages 465-478) and index.
=520  \\\\$aA comprehensive postgraduate reference on next-generation library automation, MARC21/RDA descriptive cataloguing, automated RFID shelf telemetry, and cloud OPAC architecture.
=650  \\0$aLibrary automation$xData processing.
=650  \\0$aMARC formats$xStandards.
=650  \\0$aMachine-readable bibliographic data.
=655  \\7$aTextbooks.$2fast
=700  1\\$aQureshi, Farhan,$d1979-$eauthor.
=852  \\\\$aCentral Academic Library$cMain Stack Shelf 12-B$pACC-PK-8801`;

/**
 * Serializes a ParsedMarcRecord back into ISO 2709 binary format
 */
export function serializeToMarc21Binary(records: ParsedMarcRecord[]): Uint8Array {
  const textEncoder = new TextEncoder();
  const allBuffers: Uint8Array[] = [];

  for (const rec of records) {
    const directoryEntries: Uint8Array[] = [];
    const fieldDataBuffers: Uint8Array[] = [];

    let currentOffset = 0;

    // Control fields (001-009)
    for (const [tag, val] of Object.entries(rec.controlFields)) {
      const dataBytes = textEncoder.encode(val + '\x1E');
      fieldDataBuffers.push(dataBytes);
      const entryStr = `${tag}${String(dataBytes.length).padStart(4, '0')}${String(currentOffset).padStart(5, '0')}`;
      directoryEntries.push(textEncoder.encode(entryStr));
      currentOffset += dataBytes.length;
    }

    // Data fields
    for (const field of rec.dataFields) {
      let fieldStr = `${field.ind1}${field.ind2}`;
      for (const sf of field.subfields) {
        fieldStr += `\x1F${sf.code}${sf.value}`;
      }
      fieldStr += '\x1E';
      const dataBytes = textEncoder.encode(fieldStr);
      fieldDataBuffers.push(dataBytes);

      const entryStr = `${field.tag}${String(dataBytes.length).padStart(4, '0')}${String(currentOffset).padStart(5, '0')}`;
      directoryEntries.push(textEncoder.encode(entryStr));
      currentOffset += dataBytes.length;
    }

    // Calculate Leader
    const directoryByteLen = directoryEntries.reduce((acc, b) => acc + b.length, 0) + 1; // +1 for 0x1E
    const baseAddress = 24 + directoryByteLen;
    const recordLength = baseAddress + currentOffset + 1; // +1 for 0x1D

    let leader = rec.leader.length === 24 ? rec.leader : '00000nam a2200000 u 4500';
    leader = `${String(recordLength).padStart(5, '0')}${leader.substring(5, 12)}${String(baseAddress).padStart(5, '0')}${leader.substring(17)}`;

    const recBuf = new Uint8Array(recordLength);
    recBuf.set(textEncoder.encode(leader), 0);

    let dOffset = 24;
    for (const d of directoryEntries) {
      recBuf.set(d, dOffset);
      dOffset += d.length;
    }
    recBuf[dOffset] = 0x1e;
    dOffset++;

    let fOffset = baseAddress;
    for (const f of fieldDataBuffers) {
      recBuf.set(f, fOffset);
      fOffset += f.length;
    }
    recBuf[recordLength - 1] = 0x1d;

    allBuffers.push(recBuf);
  }

  // Combine all buffers
  const totalLen = allBuffers.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(totalLen);
  let cur = 0;
  for (const b of allBuffers) {
    out.set(b, cur);
    cur += b.length;
  }
  return out;
}
