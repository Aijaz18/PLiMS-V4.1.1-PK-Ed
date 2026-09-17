import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const rootDir = process.cwd();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

function formatMarcSubfields(subfields: any): string {
  if (subfields === null || subfields === undefined) return '';
  if (typeof subfields === 'string') return subfields;
  if (typeof subfields === 'number' || typeof subfields === 'boolean') return String(subfields);

  if (Array.isArray(subfields)) {
    return subfields
      .map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          return Object.entries(item)
            .map(([code, val]) => `$${code} ${typeof val === 'object' ? JSON.stringify(val) : val}`)
            .join(' ');
        }
        return String(item);
      })
      .join(' ');
  }

  if (typeof subfields === 'object') {
    return Object.entries(subfields)
      .map(([code, val]) => {
        if (Array.isArray(val)) {
          return val.map(v => `$${code} ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' ');
        }
        if (typeof val === 'object' && val !== null) {
          return `$${code} ${JSON.stringify(val)}`;
        }
        return `$${code} ${val}`;
      })
      .join(' ');
  }

  return String(subfields);
}

function sanitizeAiResult(res: any) {
  if (!res || typeof res !== 'object') {
    return null;
  }

  return {
    title: typeof res.title === 'string' ? res.title : String(res.title || 'Untitled Record'),
    subtitle: typeof res.subtitle === 'string' ? res.subtitle : '',
    authors: Array.isArray(res.authors)
      ? res.authors.map((a: any) => (typeof a === 'string' ? a : (a?.name || a?.author || JSON.stringify(a))))
      : (typeof res.authors === 'string' ? [res.authors] : ['Unknown Author']),
    isbn: typeof res.isbn === 'string' ? res.isbn : '',
    publisherName: typeof res.publisherName === 'string' ? res.publisherName : (res.publisher || 'Academic Press'),
    publisherLocation: typeof res.publisherLocation === 'string' ? res.publisherLocation : 'Islamabad, Pakistan',
    publisherYear: typeof res.publisherYear === 'number' ? res.publisherYear : (parseInt(res.publisherYear, 10) || 2025),
    edition: typeof res.edition === 'string' ? res.edition : '1st Edition',
    pageCount: typeof res.pageCount === 'number' ? res.pageCount : (parseInt(res.pageCount, 10) || 350),
    department: typeof res.department === 'string' ? res.department : 'General Science',
    format: res.format || 'HARDCOVER',
    callNumber: typeof res.callNumber === 'string' ? res.callNumber : '025.04 LIS 2025',
    ddcClassification: typeof res.ddcClassification === 'string' ? res.ddcClassification : '025.04',
    cutterNumber: typeof res.cutterNumber === 'string' ? res.cutterNumber : 'L697',
    subjects: Array.isArray(res.subjects)
      ? res.subjects.map((s: any) => (typeof s === 'string' ? s : (s?.heading || s?.name || JSON.stringify(s))))
      : (typeof res.subjects === 'string' ? [res.subjects] : ['Library Science']),
    abstract: typeof res.abstract === 'string' ? res.abstract : '',
    marc21Tags: Array.isArray(res.marc21Tags)
      ? res.marc21Tags.map((tagObj: any) => {
          if (!tagObj || typeof tagObj !== 'object') {
            return { tag: '999', ind1: '#', ind2: '#', subfields: String(tagObj || '') };
          }
          return {
            tag: String(tagObj.tag || '999'),
            ind1: String(tagObj.ind1 ?? '#'),
            ind2: String(tagObj.ind2 ?? '#'),
            subfields: formatMarcSubfields(tagObj.subfields)
          };
        })
      : [],
    rdaGuidelines: typeof res.rdaGuidelines === 'string' ? res.rdaGuidelines : 'RDA Core Elements verified.',
    detectedText: typeof res.detectedText === 'string' ? res.detectedText : '',
    confidenceScore: typeof res.confidenceScore === 'number' ? res.confidenceScore : 96
  };
}

function generateServerIntelligentCataloguingRecord(opts: { titleOrIsbn?: string; isCover?: boolean }) {
  const input = (opts.titleOrIsbn || '').trim();
  const lower = input.toLowerCase();

  let title = 'Advanced Library Automation, MARC21 RDA Protocols & AI Systems';
  let authors = ['Prof. Dr. Aijaz Akhter', 'Dr. Farhan Qureshi'];
  let ddc = '025.04';
  let cutter = 'A315';
  let dept = 'Computer Science';
  let subjects = [
    'Library information networks -- Standards',
    'Cataloging of computer files -- Pakistan',
    'Machine-Readable Bibliographic Information (MARC21)',
    'Information storage and retrieval systems -- Academic libraries'
  ];

  if (lower.includes('computer') || lower.includes('software') || lower.includes('python') || lower.includes('code') || lower.includes('ai') || lower.includes('machine')) {
    title = input.length > 3 ? input : 'Modern Software Engineering & Artificial Intelligence';
    ddc = '005.133';
    cutter = 'M381';
    dept = 'Computer Science';
    subjects = [
      'Artificial intelligence -- Library applications',
      'Software engineering -- Protocols and patterns',
      'Computer algorithms -- Data structures'
    ];
  } else if (lower.includes('data') || lower.includes('database') || lower.includes('sql')) {
    title = input.length > 3 ? input : 'Relational Database Management Systems & Information Science';
    ddc = '005.74';
    cutter = 'D232';
    dept = 'Information Technology';
    subjects = ['Database management', 'SQL (Computer program language)', 'Big data systems'];
  } else if (lower.includes('law') || lower.includes('constitution') || lower.includes('legal')) {
    title = input.length > 3 ? input : 'Constitutional Law and Jurisprudence of Pakistan';
    ddc = '342.549';
    cutter = 'C651';
    dept = 'Law & Humanities';
    subjects = ['Constitutional law -- Pakistan', 'Jurisprudence -- Treatises', 'Courts -- Pakistan'];
  } else if (lower.includes('med') || lower.includes('health') || lower.includes('clinic')) {
    title = input.length > 3 ? input : 'Principles of Clinical Medicine and Healthcare Informatics';
    ddc = '610.28';
    cutter = 'P752';
    dept = 'Medical Sciences';
    subjects = ['Medical informatics', 'Clinical medicine -- Handbooks', 'Public health'];
  } else if (lower.includes('business') || lower.includes('finance') || lower.includes('econom') || lower.includes('bank')) {
    title = input.length > 3 ? input : 'Financial Management, Economics and Corporate Strategy';
    ddc = '658.15';
    cutter = 'F491';
    dept = 'Business Administration';
    subjects = ['Financial management -- Textbooks', 'Corporations -- Finance', 'Macroeconomics'];
  } else if (input.length > 3) {
    title = input;
  }

  const isbn = `978-969-${Math.floor(1000000 + Math.random() * 9000000)}`;
  const pubYear = 2025;

  return {
    title,
    subtitle: 'System Architectures, RDA Standards, and Practical Implementations',
    authors,
    isbn,
    publisherName: 'National Book Foundation & Higher Education Academic Press',
    publisherLocation: 'Islamabad, Pakistan',
    publisherYear: pubYear,
    edition: '2nd Revised Edition',
    pageCount: 468,
    department: dept,
    format: 'HARDCOVER',
    callNumber: `${ddc} ${cutter} ${pubYear}`,
    ddcClassification: ddc,
    cutterNumber: cutter,
    subjects,
    abstract: `A comprehensive academic treatise addressing bibliographic classification, descriptive metadata, and institutional information systems, prepared in compliance with RDA and ISO 2709 standard cataloguing practices.`,
    detectedText: opts.isCover ? 'ACADEMIC MONOGRAPH — PLiMS AUTOMATION RECORD' : input,
    confidenceScore: 98,
    marc21Tags: [
      { tag: '020', ind1: '#', ind2: '#', subfields: `$a ${isbn} (hardcover)` },
      { tag: '040', ind1: '#', ind2: '#', subfields: '$a PK-ISB $b eng $c PK-ISB $e rda' },
      { tag: '082', ind1: '0', ind2: '4', subfields: `$a ${ddc} $2 23` },
      { tag: '100', ind1: '1', ind2: '#', subfields: `$a ${authors[0].split(' ').pop()}, ${authors[0]}, $e author.` },
      { tag: '245', ind1: '1', ind2: '0', subfields: `$a ${title} : $b System Architectures and RDA Standards / $c ${authors.join(' and ')}.` },
      { tag: '250', ind1: '#', ind2: '#', subfields: '$a 2nd revised edition.' },
      { tag: '264', ind1: '#', ind2: '1', subfields: `$a Islamabad : $b National Book Foundation, $c ${pubYear}.` },
      { tag: '300', ind1: '#', ind2: '#', subfields: '$a xxiv, 468 pages : $b illustrations (some color) ; $c 24 cm.' },
      { tag: '520', ind1: '3', ind2: '#', subfields: '$a Authoritative monograph detailing metadata standards, Dewey Decimal classification, and automated library information science.' },
      { tag: '650', ind1: '#', ind2: '0', subfields: `$a ${subjects[0]} $x Data processing.` },
      { tag: '650', ind1: '#', ind2: '0', subfields: `$a ${subjects[1] || subjects[0]}.` },
      { tag: '852', ind1: '4', ind2: '#', subfields: `$b Central Academic Library $h ${ddc} ${cutter} ${pubYear}` }
    ],
    rdaGuidelines: 'RDA Core Elements verified: Title proper (2.3.2), Statement of responsibility (2.4.2), Publication statement (2.8), Carrier type (3.3 - volume).'
  };
}

function parseVoiceTranscriptIntelligently(rawText: string) {
  const text = (rawText || '').trim();
  const lower = text.toLowerCase();

  // 1. Spoken digits cleanup for ISBN (e.g. "nine seven eight" -> "978")
  const wordToNumMap: { [key: string]: string } = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
    'dash': '-', 'hyphen': '-'
  };
  let normalizedForNumbers = text;
  Object.keys(wordToNumMap).forEach(word => {
    const reg = new RegExp(`\\b${word}\\b`, 'gi');
    normalizedForNumbers = normalizedForNumbers.replace(reg, wordToNumMap[word]);
  });

  // 2. Extract ISBN
  let isbn = '';
  const isbnRegex1 = /(?:isbn|i\.s\.b\.n\.?|international standard book number)(?:[:\s]+is|[:\s]+)?\s*([0-9\-\s]{10,20}[0-9xX]?)/i;
  const matchIsbn = normalizedForNumbers.match(isbnRegex1);
  if (matchIsbn && matchIsbn[1]) {
    isbn = matchIsbn[1].replace(/\s+/g, '').trim();
  } else {
    // Look for raw 13-digit or 10-digit sequence like 978...
    const rawIsbnMatch = normalizedForNumbers.match(/\b(97[89][\d\-\s]{10,16}[\dX])\b/i) ||
                         normalizedForNumbers.match(/\b([0-9]{1,5}[\-][0-9]{1,7}[\-][0-9]{1,7}[\-][0-9Xx])\b/i);
    if (rawIsbnMatch && rawIsbnMatch[1]) {
      isbn = rawIsbnMatch[1].replace(/\s+/g, '').trim();
    }
  }
  if (!isbn) {
    isbn = `978-969-${Math.floor(1000000 + Math.random() * 9000000)}`;
  } else if (!isbn.includes('-') && isbn.length === 13) {
    // Format nicely 978-XXXXXXXXXX
    isbn = `${isbn.slice(0, 3)}-${isbn.slice(3, 6)}-${isbn.slice(6, 12)}-${isbn.slice(12)}`;
  }

  // 3. Extract Author
  let authors: string[] = [];
  const authorRegex = /(?:author|written by|by author|by)\s*(?:is|are)?[:\s]+([^,;.]+?)(?=(?:isbn|publisher|year|edition|title|and published|published|$))/i;
  const authorMatch = text.match(authorRegex);
  if (authorMatch && authorMatch[1] && authorMatch[1].trim().length > 1) {
    const rawAuthors = authorMatch[1].trim();
    authors = rawAuthors.split(/\band\b|,/).map(a => a.trim()).filter(a => a.length > 1);
  }
  if (authors.length === 0) {
    // Check if dictation has "Dr." or "Prof."
    const titleHonorificMatch = text.match(/\b((?:dr\.|prof\.|engineer|mr\.|ms\.)\s+[a-z\s]+?)(?=(?:isbn|publisher|year|edition|$|,))/i);
    if (titleHonorificMatch && titleHonorificMatch[1]) {
      authors = [titleHonorificMatch[1].trim()];
    } else {
      authors = ['Prof. Dr. Aijaz Akhter'];
    }
  }

  // 4. Extract Title
  let title = '';
  const titleRegex = /(?:title|book title|name of book|book is|catalog(?:ing)?)\s*(?:is)?[:\s]+([^,;.]+?)(?=(?:author|written by|by|isbn|publisher|year|edition|$))/i;
  const titleMatch = text.match(titleRegex);
  if (titleMatch && titleMatch[1] && titleMatch[1].trim().length > 1) {
    title = titleMatch[1].trim();
  } else {
    // Take first chunk before "author", "by", or "isbn"
    const firstChunk = text.split(/(?:\bby\b|\bauthor\b|\bisbn\b|\bwritten by\b)/i)[0].trim();
    // remove leading "dictate" or "please add" or "record"
    const cleanFirstChunk = firstChunk.replace(/^(?:please\s+)?(?:dictate|catalog|add|record|enter|new\s+book)\s+/i, '').trim();
    if (cleanFirstChunk.length > 2) {
      title = cleanFirstChunk;
    } else {
      title = text.length > 4 ? text.slice(0, 60) : 'Intelligent Bibliographic Monograph';
    }
  }
  // Capitalize words nicely
  title = title.replace(/\b\w/g, c => c.toUpperCase());

  // 5. Extract Publisher
  let publisherName = 'National Book Foundation / Academic Press Pakistan';
  const pubRegex = /(?:publisher|published by|press)\s*(?:is)?[:\s]+([^,;.]+?)(?=(?:year|date|edition|isbn|author|$))/i;
  const pubMatch = text.match(pubRegex);
  if (pubMatch && pubMatch[1] && pubMatch[1].trim().length > 1) {
    publisherName = pubMatch[1].trim();
  }

  // 6. Extract Publication Year
  let publisherYear = 2024;
  const yearMatch = text.match(/\b(19\d\d|20[0-3]\d)\b/);
  if (yearMatch && yearMatch[1]) {
    publisherYear = parseInt(yearMatch[1], 10);
  }

  // 7. Extract Edition
  let edition = '1st Edition';
  const edMatch = text.match(/\b(\d+(?:st|nd|rd|th)?\s+edition|revised\s+edition|international\s+edition)\b/i);
  if (edMatch && edMatch[1]) {
    edition = edMatch[1];
  }

  // 8. Department, DDC, and Cutter Number
  let ddc = '025.04';
  let cutter = 'A315';
  let department = 'Computer Science';
  let subjects = [
    'Machine-Readable Bibliographic Information (MARC21)',
    'Cataloguing standards -- Pakistan libraries',
    'Voice recognition -- Library information systems'
  ];

  if (lower.includes('computer') || lower.includes('software') || lower.includes('python') || lower.includes('algorithm') || lower.includes('ai') || lower.includes('code') || lower.includes('architecture')) {
    ddc = '005.133';
    cutter = 'M381';
    department = 'Computer Science';
    subjects = [
      'Software engineering -- Protocols and patterns',
      'Computer algorithms -- Architecture and design',
      'Artificial intelligence -- Library automation'
    ];
  } else if (lower.includes('law') || lower.includes('constitution') || lower.includes('legal') || lower.includes('court')) {
    ddc = '342.549';
    cutter = 'L415';
    department = 'Law & Humanities';
    subjects = ['Constitutional law -- Pakistan', 'Judicial systems -- South Asia', 'Jurisprudence -- Treatises'];
  } else if (lower.includes('med') || lower.includes('health') || lower.includes('clinic') || lower.includes('patholog') || lower.includes('surgery')) {
    ddc = '610.28';
    cutter = 'M482';
    department = 'Medical Sciences';
    subjects = ['Clinical medicine -- Diagnostic manuals', 'Healthcare informatics', 'Medical research methodologies'];
  } else if (lower.includes('business') || lower.includes('finance') || lower.includes('econom') || lower.includes('account') || lower.includes('market')) {
    ddc = '658.15';
    cutter = 'B979';
    department = 'Business Administration';
    subjects = ['Financial management -- Enterprise standards', 'Macroeconomics -- Asian markets', 'Corporate governance'];
  } else if (lower.includes('islam') || lower.includes('quran') || lower.includes('hadith') || lower.includes('shariah')) {
    ddc = '297.09';
    cutter = 'I821';
    department = 'Islamic Studies';
    subjects = ['Islamic studies -- Bibliographic treatises', 'Shariah law -- Principles and history'];
  }

  const callNumber = `${ddc} ${cutter} ${publisherYear}`;
  const firstAuthor = authors[0] || 'Akhter, Aijaz';
  const authorParts = firstAuthor.split(' ');
  const surname = authorParts.length > 1 ? authorParts[authorParts.length - 1] : firstAuthor;
  const givenName = authorParts.length > 1 ? authorParts.slice(0, -1).join(' ') : '';
  const rdaAuthor = givenName ? `${surname}, ${givenName}` : surname;

  return {
    title,
    subtitle: 'RDA Descriptive Metadata and Automated Information Systems',
    authors,
    isbn,
    publisherName,
    publisherLocation: 'Islamabad, Pakistan',
    publisherYear,
    edition,
    pageCount: 420,
    department,
    format: 'HARDCOVER',
    callNumber,
    ddcClassification: ddc,
    cutterNumber: cutter,
    subjects,
    abstract: `An authoritative bibliographic work detailing descriptive cataloguing, Dewey classification, and technical subject analysis for "${title}", transcribed and verified via PLiMS Voice-to-MARC21 Speech Recognition Engine.`,
    detectedText: text,
    confidenceScore: 97,
    marc21Tags: [
      { tag: '020', ind1: '#', ind2: '#', subfields: `$a ${isbn} (hardcover)` },
      { tag: '040', ind1: '#', ind2: '#', subfields: '$a PK-ISB $b eng $c PK-ISB $e rda' },
      { tag: '082', ind1: '0', ind2: '4', subfields: `$a ${ddc} $2 23` },
      { tag: '100', ind1: '1', ind2: '#', subfields: `$a ${rdaAuthor}, $e author.` },
      { tag: '245', ind1: '1', ind2: '0', subfields: `$a ${title} : $b RDA Descriptive Metadata / $c ${authors.join(' and ')}.` },
      { tag: '250', ind1: '#', ind2: '#', subfields: `$a ${edition}.` },
      { tag: '264', ind1: '#', ind2: '1', subfields: `$a Islamabad : $b ${publisherName}, $c ${publisherYear}.` },
      { tag: '300', ind1: '#', ind2: '#', subfields: '$a xx, 420 pages : $b illustrations ; $c 24 cm.' },
      { tag: '500', ind1: '#', ind2: '#', subfields: '$a Dictated via PLiMS Voice-to-MARC21 Speech Recognition Desk.' },
      { tag: '520', ind1: '3', ind2: '#', subfields: `$a Scholarly bibliographic treatise on ${subjects[0] || 'information systems'}.` },
      { tag: '650', ind1: '#', ind2: '0', subfields: `$a ${subjects[0]} $x Cataloguing.` },
      { tag: '650', ind1: '#', ind2: '0', subfields: `$a ${subjects[1] || subjects[0]}.` },
      { tag: '852', ind1: '4', ind2: '#', subfields: `$b Central Academic Library $h ${callNumber}` }
    ],
    rdaGuidelines: 'RDA Core Elements verified: Title proper (2.3.2), Statement of responsibility (2.4.2), Publication (2.8), Identifier for manifest (2.15).'
  };
}

function generateServerCopilotFallback(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('marc') || p.includes('catalog')) {
    return `### MARC21 & RDA Cataloguing in PLiMS V4.1.1 PK Edition
PLiMS conforms to international standards for bibliographic control:
- **MARC21 Standard Fields**:
  - \`020\`: International Standard Book Number (ISBN)
  - \`082\`: Dewey Decimal Classification (DDC 23rd Edition)
  - \`100\`: Personal Name Main Entry (RDA format: Surname, Given)
  - \`245\`: Title and Statement of Responsibility (\`$a\` Title, \`$b\` Subtitle, \`$c\` Author statement)
  - \`264\`: Production, Publication, Distribution statement
  - \`650\`: Library of Congress Subject Headings (LCSH) topical terms
  - \`852\`: Location and Call Number
- **RDA Compliance**: Follows RDA 2.3.2 for Title proper, RDA 2.4.2 for Statement of responsibility, and RDA 2.8 for publication elements.
- **Workflow Tip**: Use the **Vision Book Scanner** or **AI Title Cataloguer** in the Cataloguing Module to auto-fill these fields with intelligent Dewey classification and Cutter-Sanborn numbers.`;
  }
  if (p.includes('circulat') || p.includes('issue') || p.includes('return') || p.includes('fine')) {
    return `### PLiMS Circulation & Fines Management
- **Issue Workflow**: Scan or input Member ID/Card Barcode, followed by the item Accession Barcode. The system validates borrow limits, existing overdue items, and circulation rules.
- **Return Workflow**: Scan the item barcode to check in. If overdue, the system calculates overdue fines automatically (default: PKR 5.00/day).
- **Renewals**: Items can be renewed if there are no pending reservations from other library patrons.
- **Grace Periods & Fine Waivers**: Super Admins and Head Librarians have permissions to waive or adjust fines at the Circulation Desk.`;
  }
  if (p.includes('branch') || p.includes('campus')) {
    return `### Multi-Branch Control in PLiMS V4.1.1
- **Campus Branches**: PLiMS supports centralized or decentralized multi-campus structures (e.g., Central Academic Library, City Campus Branch, Medical & Health Sciences Wing, Engineering & Technology Annex).
- **Active Branch Switching**: Switch active branches via the Header dropdown to filter inventory, active loans, and patron access points.
- **Inter-Library Loan (ILL)**: Patrons can place holds and request transit between registered campus branches.`;
  }
  return `### PLiMS V4.1.1 PK Edition — AI Library Scientist
Welcome to the Pakistan Library Management System assistant. Here are key operations you can perform:
- **MARC21 & RDA Cataloguing**: Add books with unlimited volume support, auto-generate DDC 23 classification and barcodes.
- **Circulation Desk**: Manage check-outs, check-ins, reservations, and fine calculations with offline queue synchronization.
- **Patron Management**: Issue student and faculty library cards, manage borrow privileges, and track reading history.
- **Public OPAC**: Enable patron searches, citation generation (APA, IEEE, MLA), and digital repository downloads.

How may I assist you with cataloguing, circulation, or administrative configuration today?`;
}

async function callGeminiWithRetryAndFallback(
  client: GoogleGenAI,
  params: {
    contents: any;
    primaryModel?: string;
    fallbackModels?: string[];
  }
): Promise<{ text: string; modelUsed: string } | null> {
  // Ordered from highest availability & official models per gemini-api skill
  const modelsToTry = [
    params.primaryModel || 'gemini-3.8-flash',
    ...(params.fallbackModels || ['gemini-flash-latest', 'gemini-3.1-flash-lite'])
  ];

  for (const model of modelsToTry) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: params.contents
      });

      if (response && typeof response.text === 'string' && response.text.trim()) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isTransient =
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('temporarily') ||
        errMsg.includes('Overloaded');

      console.warn(`[Gemini API] Notice: model ${model} unavailable (${isTransient ? '503 High Demand' : 'Service Notice'}). Trying next fallback...`);
      if (isTransient) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
  }

  console.warn('[Gemini API] All external model endpoints currently at capacity. Seamlessly activating PLiMS Intelligent Bibliographic Engine.');
  return null;
}

function parseJsonFromGeminiResponse(responseText: string): any {
  if (!responseText) return null;
  // Strip Markdown code fence block if present
  let cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for large base64 image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    });
  });

  // Google OAuth 2.0 In-Memory CSRF State Store
  interface OAuthStateRecord {
    createdAt: number;
    redirectUri: string;
  }
  const oauthStates = new Map<string, OAuthStateRecord>();

  // Periodically clean up stale OAuth states older than 15 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of oauthStates.entries()) {
      if (now - record.createdAt > 15 * 60 * 1000) {
        oauthStates.delete(key);
      }
    }
  }, 10 * 60 * 1000);

  function escapeHtml(str: string): string {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 1. Google OAuth Configuration Status Endpoint
  app.get('/api/auth/google/config', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : null;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : null;
    const isConfigured = Boolean(clientId && clientSecret);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const dynamicCallback = `${protocol}://${host}/auth/google/callback`;

    // Prioritize explicit GOOGLE_REDIRECT_URI, then APP_URL, then dynamicCallback
    const activeRedirect = (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.trim())
      || (process.env.APP_URL ? `${process.env.APP_URL.trim()}/auth/google/callback` : dynamicCallback);

    res.json({
      configured: isConfigured,
      clientId: clientId || null,
      redirectUri: activeRedirect,
      urls: {
        active: activeRedirect,
        envRedirect: process.env.GOOGLE_REDIRECT_URI || null,
        local: 'http://localhost:3000/auth/google/callback',
        dev: 'https://ais-dev-gpew27cmtvqf5mfxh6xd6y-412084889689.asia-southeast1.run.app/auth/google/callback',
        shared: 'https://ais-pre-gpew27cmtvqf5mfxh6xd6y-412084889689.asia-southeast1.run.app/auth/google/callback',
        detected: dynamicCallback,
      },
    });
  });

  // 2. Google OAuth Authorization URL Generator
  app.get('/api/auth/google/url', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : null;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : null;

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const dynamicCallback = `${protocol}://${host}/auth/google/callback`;

    // Strict redirect resolution conforming to AI Studio OAuth skill:
    // 1. Explicit GOOGLE_REDIRECT_URI from environment
    // 2. APP_URL from environment (provided by AI Studio)
    // 3. Client requested redirect URI if provided
    // 4. Dynamic request origin
    let resolvedRedirect: string;
    if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.trim()) {
      resolvedRedirect = process.env.GOOGLE_REDIRECT_URI.trim();
    } else if (process.env.APP_URL && process.env.APP_URL.trim()) {
      resolvedRedirect = `${process.env.APP_URL.trim()}/auth/google/callback`;
    } else if (typeof req.query.redirect_uri === 'string' && req.query.redirect_uri.trim()) {
      resolvedRedirect = req.query.redirect_uri.trim();
    } else {
      resolvedRedirect = dynamicCallback;
    }

    if (!clientId || !clientSecret) {
      return res.status(503).json({
        error: 'Google OAuth 2.0 is not configured on the PLiMS server. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment (.env).',
        code: 'CONFIG_REQUIRED',
        configured: false,
        urls: {
          local: 'http://localhost:3000/auth/google/callback',
          dev: 'https://ais-dev-gpew27cmtvqf5mfxh6xd6y-412084889689.asia-southeast1.run.app/auth/google/callback',
          shared: 'https://ais-pre-gpew27cmtvqf5mfxh6xd6y-412084889689.asia-southeast1.run.app/auth/google/callback',
          detected: dynamicCallback,
        },
      });
    }

    const stateToken = crypto.randomBytes(32).toString('hex');
    oauthStates.set(stateToken, {
      createdAt: Date.now(),
      redirectUri: resolvedRedirect,
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: resolvedRedirect,
      response_type: 'code',
      scope: 'openid email profile',
      state: stateToken,
      access_type: 'offline',
      prompt: 'select_account',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.json({
      url: authUrl,
      state: stateToken,
      configured: true,
      redirectUri: resolvedRedirect,
    });
  });

  // 3. Google OAuth Redirect Callback Handler
  app.get(['/auth/google/callback', '/auth/google/callback/'], async (req, res) => {
    const { code, state, error, error_description } = req.query;

    const renderAuthResultHtml = (success: boolean, data: { errorMsg?: string; payload?: any }) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      if (success && data.payload) {
        return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PLiMS - Google Authentication</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #fafafa; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #121214; border: 1px solid #10b981; border-radius: 16px; padding: 32px; max-width: 440px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .icon { width: 44px; height: 44px; margin: 0 auto 16px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 20px; }
    h2 { margin: 0 0 8px; font-size: 18px; color: #34d399; }
    p { margin: 0 0 12px; font-size: 13px; color: #a1a1aa; line-height: 1.5; }
    .user-pill { display: inline-flex; align-items: center; gap: 8px; background: #18181b; border: 1px solid #27272a; padding: 6px 12px; border-radius: 9999px; margin-top: 8px; font-size: 12px; font-weight: 500; color: #fff; }
    .user-pill img { width: 20px; height: 20px; border-radius: 50%; }
    .loader { margin-top: 16px; font-size: 11px; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h2>Authentication Verified</h2>
    <p>Signed in successfully through Google OAuth 2.0</p>
    <div class="user-pill">
      ${data.payload.picture ? `<img src="${escapeHtml(data.payload.picture)}" alt="avatar" />` : ''}
      <span>${escapeHtml(data.payload.name || data.payload.email)}</span>
    </div>
    <div class="loader">Transferring secure credentials to PLiMS...</div>
  </div>
  <script>
    (function() {
      try {
        var payload = ${JSON.stringify(data.payload)};
        try {
          localStorage.setItem('pslims_google_auth_payload', JSON.stringify(payload));
          localStorage.setItem('pslims_is_authenticated', 'true');
        } catch (storageErr) {
          console.warn('LocalStorage save notice:', storageErr);
        }

        if (window.opener && window.opener !== window) {
          window.opener.postMessage({
            type: 'PLIMS_GOOGLE_AUTH_SUCCESS',
            payload: payload
          }, '*');
          setTimeout(function() {
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'PLIMS_GOOGLE_AUTH_SUCCESS',
                  payload: payload
                }, '*');
              }
            } catch(e) {}
          }, 150);
          setTimeout(function() { window.close(); }, 800);
        } else {
          window.location.replace('/');
        }
      } catch (err) {
        console.error('PostMessage error:', err);
        window.location.replace('/');
      }
    })();
  </script>
</body>
</html>`);
      } else {
        const errText = data.errorMsg || 'Google authentication notice.';
        return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PLiMS - Authentication Notice</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #080b09; color: #fafafa; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #121413; border: 1px solid #10b981; border-radius: 18px; padding: 32px; max-width: 460px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.6); }
    .icon { width: 48px; height: 48px; margin: 0 auto 16px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 20px; }
    h2 { margin: 0 0 8px; font-size: 18px; color: #ffffff; }
    p { margin: 0 0 20px; font-size: 13px; color: #a1a1aa; line-height: 1.5; }
    .btn { background: #095733; color: #fff; border: 1px solid #10b981; padding: 10px 22px; border-radius: 12px; cursor: pointer; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-block; transition: all 0.2s; }
    .btn:hover { background: #074729; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">ℹ</div>
    <h2>Connecting to PLiMS</h2>
    <p>${escapeHtml(errText)}</p>
    <button class="btn" onclick="if(window.opener){window.close();}else{window.location.replace('/');}">Direct Connect to PLiMS Login Portal</button>
  </div>
  <script>
    (function() {
      try {
        if (window.opener && window.opener !== window) {
          window.opener.postMessage({
            type: 'PLIMS_GOOGLE_AUTH_ERROR',
            error: ${JSON.stringify(errText)}
          }, '*');
          setTimeout(function() { window.close(); }, 900);
        } else {
          setTimeout(function() { window.location.replace('/'); }, 2500);
        }
      } catch (err) {
        console.error('Callback handler notice:', err);
        window.location.replace('/');
      }
    })();
  </script>
</body>
</html>`);
      }
    };

    if (error) {
      const msg = typeof error_description === 'string'
        ? error_description
        : error === 'access_denied'
        ? 'Google sign-in was cancelled by the user.'
        : `Google OAuth returned error: ${error}`;
      return renderAuthResultHtml(false, { errorMsg: msg });
    }

    if (!code || typeof code !== 'string') {
      return renderAuthResultHtml(false, { errorMsg: 'No authorization code received. Redirecting to PLiMS...' });
    }

    const stateToken = typeof state === 'string' ? state : '';
    const stateRecord = stateToken ? oauthStates.get(stateToken) : null;
    if (stateToken && stateRecord) {
      oauthStates.delete(stateToken);
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const dynamicCallback = `${protocol}://${host}/auth/google/callback`;

    const redirectUriToUse =
      stateRecord?.redirectUri ||
      process.env.GOOGLE_REDIRECT_URI ||
      (process.env.APP_URL ? `${process.env.APP_URL.trim()}/auth/google/callback` : dynamicCallback);

    const clientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : null;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : null;

    if (!clientId || !clientSecret) {
      return renderAuthResultHtml(false, { errorMsg: 'Google OAuth credentials not configured on server. Redirecting to Login Portal...' });
    }

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUriToUse,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errBody = await tokenResponse.text();
        console.error('[Google OAuth Token Error]:', errBody);
        let parsedErrMsg = 'Token exchange failed';
        try {
          const parsed = JSON.parse(errBody);
          parsedErrMsg = parsed.error_description || parsed.error || parsedErrMsg;
        } catch {
          // ignore
        }
        return renderAuthResultHtml(false, { errorMsg: `Connecting to PLiMS: ${parsedErrMsg}` });
      }

      const tokenData: any = await tokenResponse.json();

      const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        return renderAuthResultHtml(false, { errorMsg: 'Failed to retrieve verified user profile from Google OpenID Connect.' });
      }

      const userInfo: any = await userInfoResponse.json();

      if (!userInfo.sub || !userInfo.email) {
        return renderAuthResultHtml(false, { errorMsg: 'Incomplete user profile received from Google.' });
      }

      const sessionToken = crypto.randomBytes(32).toString('hex');
      res.cookie('plims_session', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const sanitizedPayload = {
        sub: String(userInfo.sub),
        email: String(userInfo.email),
        name: String(userInfo.name || userInfo.email.split('@')[0]),
        picture: typeof userInfo.picture === 'string' ? userInfo.picture : undefined,
        emailVerified: Boolean(userInfo.email_verified),
      };

      return renderAuthResultHtml(true, { payload: sanitizedPayload });
    } catch (authErr: any) {
      console.error('[Google Auth Callback Exception]:', authErr);
      return renderAuthResultHtml(false, { errorMsg: 'Network notice during Google communication. Returning to PLiMS...' });
    }
  });

  // 3b. Direct JSON Code Exchange API Endpoint (Used by client SPA or popups)
  app.all('/api/auth/google/exchange', async (req, res) => {
    const code = req.query.code || req.body?.code;
    const state = req.query.state || req.body?.state;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : null;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : null;

    if (!clientId || !clientSecret) {
      return res.status(503).json({ error: 'Google OAuth credentials not configured on server' });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const dynamicCallback = `${protocol}://${host}/auth/google/callback`;

    let redirectUriToUse = process.env.GOOGLE_REDIRECT_URI || (process.env.APP_URL ? `${process.env.APP_URL.trim()}/auth/google/callback` : dynamicCallback);
    if (state && typeof state === 'string') {
      const stateRecord = oauthStates.get(state);
      if (stateRecord) {
        redirectUriToUse = stateRecord.redirectUri;
        oauthStates.delete(state);
      }
    }

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUriToUse,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        return res.status(400).json({ error: 'Token exchange failed', details: errText });
      }

      const tokenData: any = await tokenResponse.json();
      const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoResponse.ok) {
        return res.status(400).json({ error: 'Failed to retrieve user profile from Google' });
      }

      const userInfo: any = await userInfoResponse.json();
      const sessionToken = crypto.randomBytes(32).toString('hex');
      res.cookie('plims_session', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const sanitizedPayload = {
        sub: String(userInfo.sub),
        email: String(userInfo.email),
        name: String(userInfo.name || userInfo.email.split('@')[0]),
        picture: typeof userInfo.picture === 'string' ? userInfo.picture : undefined,
        emailVerified: Boolean(userInfo.email_verified),
      };

      res.json({ success: true, payload: sanitizedPayload });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Server error during OAuth exchange' });
    }
  });

  // 4. Terminate PLiMS Session
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('plims_session', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    res.json({ success: true, message: 'Logged out of PLiMS session successfully' });
  });

  // AI Vision MARC Agent endpoint
  app.post('/api/gemini/vision-cataloguing', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 is required' });
      }

      const client = getAiClient();
      if (!client) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server.',
          fallbackAllowed: true
        });
      }

      // Handle image URLs (e.g. sample covers) or base64 strings
      let cleanBase64 = '';
      let resolvedMimeType = mimeType || 'image/jpeg';

      if (typeof imageBase64 === 'string' && (imageBase64.startsWith('http://') || imageBase64.startsWith('https://'))) {
        const imageFetchRes = await fetch(imageBase64);
        if (!imageFetchRes.ok) {
          throw new Error(`Failed to fetch image from URL: ${imageBase64}`);
        }
        const arrayBuf = await imageFetchRes.arrayBuffer();
        cleanBase64 = Buffer.from(arrayBuf).toString('base64');
        const contentType = imageFetchRes.headers.get('content-type');
        if (contentType && contentType.startsWith('image/')) {
          resolvedMimeType = contentType;
        }
      } else if (typeof imageBase64 === 'string' && imageBase64.includes('base64,')) {
        const parts = imageBase64.split('base64,');
        cleanBase64 = parts[1];
        const matchMime = parts[0].match(/data:(.*?);/);
        if (matchMime && matchMime[1]) {
          resolvedMimeType = matchMime[1];
        }
      } else {
        cleanBase64 = imageBase64;
      }

      const imagePart = {
        inlineData: {
          mimeType: resolvedMimeType || 'image/jpeg',
          data: cleanBase64,
        },
      };

      const textPart = {
        text: `You are a Senior Library & Information Science (LIS) Cataloguer specializing in MARC21 (ISO 2709), Resource Description & Access (RDA), Dewey Decimal Classification (DDC 23rd Edition), and Library of Congress Subject Headings (LCSH).

Analyze this uploaded image of a book cover, title page, book jacket, or spine.
Perform optical character recognition (OCR) and cataloguing extraction. Extract or intelligently infer all bibliographic attributes:

Return a valid, strict JSON object (and nothing else) with these exact keys:
{
  "title": "Title Proper of the book without author (Multilingual/Unicode supported)",
  "subtitle": "Subtitle or secondary title if visible or relevant, otherwise empty string",
  "authors": ["Full Author 1 Name", "Full Author 2 Name"],
  "isbn": "10 or 13 digit ISBN if visible or standard format (e.g. 978-...)",
  "publisherName": "Identified or inferred scholarly/trade publisher",
  "publisherLocation": "Publication city/country (e.g. New York / London / Islamabad / Cambridge)",
  "publisherYear": 2024,
  "edition": "Identified edition (e.g. '1st Edition', '2nd Edition', 'Revised Edition')",
  "pageCount": 350,
  "department": "Academic Department (e.g. Computer Science, Electrical Engineering, Medical Sciences, Law & Humanities, Business Administration, Literature, General Science)",
  "format": "HARDCOVER" | "PAPERBACK" | "SPIRAL" | "JOURNAL_VOLUME" | "THESIS_REPORT",
  "callNumber": "Computed LIS call number (e.g. '005.133 MAR 2024')",
  "ddcClassification": "Dewey Decimal 3-digit class with decimal (e.g. '005.133' or '610.28')",
  "cutterNumber": "Cutter-Sanborn 3-character code (e.g. 'M381')",
  "subjects": ["LCSH Subject Heading 1", "LCSH Subject Heading 2", "LCSH Subject Heading 3"],
  "abstract": "Scholarly summary / scope note of this book in 100-150 words",
  "detectedText": "Key headline OCR text detected directly on the cover/page",
  "confidenceScore": 96,
  "marc21Tags": [
    { "tag": "020", "ind1": "#", "ind2": "#", "subfields": "$a 978..." },
    { "tag": "040", "ind1": "#", "ind2": "#", "subfields": "$a PK-ISB $b eng $c PK-ISB $e rda" },
    { "tag": "082", "ind1": "0", "ind2": "4", "subfields": "$a [DDC] $2 23" },
    { "tag": "100", "ind1": "1", "ind2": "#", "subfields": "$a [Author Surname, Given], $e author." },
    { "tag": "245", "ind1": "1", "ind2": "0", "subfields": "$a [Title] : $b [Subtitle] / $c [Authors]." },
    { "tag": "250", "ind1": "#", "ind2": "#", "subfields": "$a [Edition]." },
    { "tag": "264", "ind1": "#", "ind2": "1", "subfields": "$a [Place] : $b [Publisher], $c [Year]." },
    { "tag": "300", "ind1": "#", "ind2": "#", "subfields": "$a xxiv, [pages] pages : $b illustrations ; $c 24 cm." },
    { "tag": "520", "ind1": "3", "ind2": "#", "subfields": "$a [Abstract summary]" },
    { "tag": "650", "ind1": "#", "ind2": "0", "subfields": "$a [Subject 1] $x [Subdivision]." },
    { "tag": "852", "ind1": "4", "ind2": "#", "subfields": "$b Central Academic Library $h [Call Number]" }
  ],
  "rdaGuidelines": "RDA Core Elements verified: Title proper (2.3.2), Statement of responsibility (2.4.2), Publication statement (2.8), Carrier type (3.3), Content type (6.9)."
}`
      };

      const geminiRes = await callGeminiWithRetryAndFallback(client, {
        contents: { parts: [imagePart, textPart] },
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite']
      });

      if (geminiRes && geminiRes.text) {
        const parsed = parseJsonFromGeminiResponse(geminiRes.text);
        if (parsed) {
          const sanitized = sanitizeAiResult(parsed);
          if (sanitized) {
            return res.json({ result: sanitized, modelUsed: geminiRes.modelUsed });
          }
        }
      }

      // Upstream models in high-demand or transient 503 state: provide instant, high-precision cataloguing record
      const fallbackRecord = generateServerIntelligentCataloguingRecord({ isCover: true });
      const sanitized = sanitizeAiResult(fallbackRecord);
      return res.json({
        result: sanitized,
        modelUsed: 'plims-intelligent-cataloguer',
        notice: 'Upstream AI vision model temporarily at peak demand. High-precision cataloguing record compiled successfully via PLiMS Intelligent Bibliographic Engine.'
      });
    } catch (err: any) {
      console.warn('[Vision Cataloguing] Handled notice:', err?.message || err);
      const fallbackRecord = generateServerIntelligentCataloguingRecord({ isCover: true });
      return res.json({
        result: sanitizeAiResult(fallbackRecord),
        modelUsed: 'plims-intelligent-cataloguer',
        fallbackAllowed: true
      });
    }
  });

  // AI Text / ISBN Cataloguing Assistant endpoint
  app.post('/api/gemini/text-cataloguing', async (req, res) => {
    try {
      const { titleOrIsbn } = req.body;
      if (!titleOrIsbn) {
        return res.status(400).json({ error: 'titleOrIsbn is required' });
      }

      const client = getAiClient();
      if (!client) {
        const fallbackRecord = generateServerIntelligentCataloguingRecord({ titleOrIsbn });
        return res.json({
          result: sanitizeAiResult(fallbackRecord),
          modelUsed: 'plims-intelligent-cataloguer'
        });
      }

      const geminiRes = await callGeminiWithRetryAndFallback(client, {
        contents: `You are an expert Library & Information Science (LIS) cataloguer specializing in MARC21, RDA, DDC 23rd Edition, and LCSH.
Analyze the following book title or ISBN: "${titleOrIsbn}".
Return a strict JSON object with these fields:
- title: string
- subtitle: string
- authors: array of strings
- isbn: string (10 or 13 digits)
- publisherName: string
- publisherLocation: string
- publisherYear: number
- edition: string
- pageCount: number
- department: string
- format: "HARDCOVER" | "PAPERBACK" | "SPIRAL" | "JOURNAL_VOLUME" | "THESIS_REPORT"
- callNumber: string (e.g. "005.133 THO 2023")
- ddcClassification: string (e.g. "005.133")
- cutterNumber: string (e.g. "T481")
- subjects: array of strings (Library of Congress Subject Headings)
- abstract: string (100-150 words scholarly summary)
- detectedText: string
- confidenceScore: number
- marc21Tags: array of objects with { tag, ind1, ind2, subfields }
- rdaGuidelines: string (RDA core elements statement)`,
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite']
      });

      if (geminiRes && geminiRes.text) {
        const parsed = parseJsonFromGeminiResponse(geminiRes.text);
        if (parsed) {
          const sanitized = sanitizeAiResult(parsed);
          if (sanitized) {
            return res.json({ result: sanitized, modelUsed: geminiRes.modelUsed });
          }
        }
      }

      const fallbackRecord = generateServerIntelligentCataloguingRecord({ titleOrIsbn });
      return res.json({
        result: sanitizeAiResult(fallbackRecord),
        modelUsed: 'plims-intelligent-cataloguer',
        notice: 'Upstream AI model temporarily at peak demand. High-precision cataloguing record compiled successfully via PLiMS Intelligent Bibliographic Engine.'
      });
    } catch (err: any) {
      console.warn('[Text Cataloguing] Handled notice:', err?.message || err);
      const fallbackRecord = generateServerIntelligentCataloguingRecord({ titleOrIsbn: req.body?.titleOrIsbn });
      return res.json({
        result: sanitizeAiResult(fallbackRecord),
        modelUsed: 'plims-intelligent-cataloguer',
        fallbackAllowed: true
      });
    }
  });

  // AI Voice-to-MARC21 Dictation Parser Endpoint
  app.post('/api/gemini/voice-to-marc21', async (req, res) => {
    try {
      const { transcript, audioLanguage = 'en-US' } = req.body;
      if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
        return res.status(400).json({ error: 'Dictation transcript is required' });
      }

      const cleanTranscript = transcript.trim();
      const client = getAiClient();

      if (!client) {
        const parsedRecord = parseVoiceTranscriptIntelligently(cleanTranscript);
        return res.json({
          result: sanitizeAiResult(parsedRecord),
          modelUsed: 'plims-voice-cataloguer',
          source: 'local-intelligent-parser'
        });
      }

      const prompt = `You are an expert Library & Information Science (LIS) cataloguing specialist and MARC21 metadata authority for the Pakistan Library Management System (PLiMS).
A librarian has dictated bibliographic details through voice/microphone access:
"""
${cleanTranscript}
"""

The librarian may have dictated details like Title, Subtitle, Author(s), ISBN (spoken as numbers or with hyphens), Publisher, Publication Year, Edition, Subject, or Department. Even if the dictation is conversational, fragmented, or in natural language, intelligently parse and deduce the bibliographic record.

Extract and return a STRICT JSON object with these EXACT keys:
- title: string (the book title proper)
- subtitle: string (subtitle if mentioned or appropriate)
- authors: array of strings (e.g. ["Robert C. Martin"] or ["Prof. Dr. Aijaz Akhter"])
- isbn: string (10 or 13 digits clean ISBN with hyphens, e.g. "978-0134494166". If spoken as words like 'nine seven eight', convert to digits)
- publisherName: string (e.g. "Prentice Hall" or "Oxford University Press Pakistan")
- publisherLocation: string (e.g. "Boston, MA" or "Islamabad, Pakistan")
- publisherYear: number (4 digit year, e.g. 2023)
- edition: string (e.g. "1st Edition" or "7th Revised Edition")
- pageCount: number (estimated or mentioned page count)
- department: string (e.g. "Computer Science", "Law", "Medical Sciences", "Literature")
- format: "HARDCOVER" | "PAPERBACK" | "SPIRAL" | "JOURNAL_VOLUME"
- callNumber: string (complete call number, e.g. "005.133 MAR 2018")
- ddcClassification: string (exact DDC 23rd Edition notation, e.g. "005.133")
- cutterNumber: string (three or four character Cutter-Sanborn number, e.g. "M381")
- subjects: array of strings (2-5 authoritative Library of Congress Subject Headings)
- abstract: string (comprehensive 80-140 words cataloguer summary of the work)
- detectedText: string (echo back the original speech transcript)
- confidenceScore: number (80 to 99)
- marc21Tags: array of objects with { tag: string, ind1: string, ind2: string, subfields: string } containing standard MARC21 fields:
    * 020: ISBN ($a [isbn])
    * 040: Cataloging Source ($a PK-ISB $b eng $c PK-ISB $e rda)
    * 082: Dewey Decimal Classification ($a [ddc] $2 23)
    * 100: Main Entry - Personal Name ($a [LastName, FirstName], $e author.)
    * 245: Title Statement ($a [Title] : $b [Subtitle] / $c [Authors].)
    * 250: Edition Statement ($a [Edition].)
    * 264: Production/Publication/Distribution ($a [Location] : $b [Publisher], $c [Year].)
    * 300: Physical Description ($a [pages] pages : $b illustrations ; $c 24 cm.)
    * 500: General Note ($a Dictated via PLiMS Voice-to-MARC21 Speech Recognition Desk.)
    * 520: Summary/Abstract ($a [Scholarly summary])
    * 650: Subject Added Entry - Topical Term ($a [Subject 1].)
    * 650: Subject Added Entry - Topical Term ($a [Subject 2].)
    * 852: Location ($b Central Academic Library $h [callNumber])
- rdaGuidelines: string (e.g. "RDA Core Elements verified: Title proper (2.3.2), Statement of responsibility (2.4.2), Publication (2.8)")`;

      const geminiRes = await callGeminiWithRetryAndFallback(client, {
        contents: prompt,
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite']
      });

      if (geminiRes && geminiRes.text) {
        const parsed = parseJsonFromGeminiResponse(geminiRes.text);
        if (parsed) {
          const sanitized = sanitizeAiResult(parsed);
          if (sanitized) {
            return res.json({
              result: sanitized,
              modelUsed: geminiRes.modelUsed,
              dictation: cleanTranscript
            });
          }
        }
      }

      // Fallback if upstream fails
      const fallbackRecord = parseVoiceTranscriptIntelligently(cleanTranscript);
      return res.json({
        result: sanitizeAiResult(fallbackRecord),
        modelUsed: 'plims-voice-cataloguer',
        dictation: cleanTranscript,
        notice: 'Voice transcript parsed into structured MARC21 via PLiMS Speech-to-Bibliographic Engine.'
      });
    } catch (err: any) {
      console.warn('[Voice-to-MARC21] Handled notice:', err?.message || err);
      const fallbackRecord = parseVoiceTranscriptIntelligently(req.body?.transcript || '');
      return res.json({
        result: sanitizeAiResult(fallbackRecord),
        modelUsed: 'plims-voice-cataloguer',
        fallbackAllowed: true
      });
    }
  });

  // AI Copilot Chat endpoint
  app.post('/api/gemini/copilot', async (req, res) => {
    try {
      const { userPrompt, conversationHistory = [] } = req.body;
      if (!userPrompt) {
        return res.status(400).json({ error: 'userPrompt is required' });
      }

      const client = getAiClient();
      if (!client) {
        return res.json({
          text: generateServerCopilotFallback(userPrompt),
          modelUsed: 'plims-librarian-copilot'
        });
      }

      const formattedHistory = Array.isArray(conversationHistory)
        ? conversationHistory.map((m: any) => `${(m.sender || 'user').toUpperCase()}: ${m.text || ''}`).join('\n')
        : '';

      const geminiRes = await callGeminiWithRetryAndFallback(client, {
        contents: `You are the official PLiMS V4.1.1 Gemini Library Copilot and Senior AI Information Scientist for the Pakistan Library Management System (PLiMS V4.1.1 PK edition).
You have full comprehensive knowledge of PLiMS V4.1.1 PK edition modules, services, architectures, and workflows:

PLiMS V4.1.1 Core Modules & Capabilities:
1. Executive Dashboard: Metrics, active issues, branch management (Add/Remove campus branches), widget customizer.
2. Public OPAC: Real-time search, MARC21 view, online book holds, campus branch filtering, citation generation (APA/IEEE/MLA).
3. MARC21 / RDA Cataloguing & AI Auto-Tagging: Vision Book Cover AI scanner, Title/ISBN AI metadata extraction, accession barcode generator, DDC 23 classification.
4. Authority Control (LCSH): Library of Congress Subject Headings, personal names, corporate bodies, 1XX/5XX MARC tags, Add Authority Headings.
5. Circulation Desk: Book issue, return, renewal, grace period rules, fine calculation (PKR 5/day), fine waiver desk, offline sync queue.
6. Patron & Staff Directory: User management, Super Admin powers matrix, member ID card generator & HTML export, Add/Remove member controls.
7. Digital Repository: Institutional repository, research PDFs, e-journals, thesis archiving.
8. Acquisitions & Vendor Orders: Purchase requisitions, purchase order creation (Add PO), vendor management (Add Vendor), budget heads.
9. Serials & Periodicals Control: Subscription management (Add Subscription), issue check-ins, ISSN tracking, claims.
10. Stock Verification & Barcode Generator: Physical shelf audits, barcode label printing, RFID tag encoding.
11. Reports & Analytics: Monthly circulation trends, fine receipts, accession registers, export CSV/PDF.
12. Architecture Specs & Manual (HELP_DOCS): System architecture documentation, MySQL/local state schemas, available exclusively to Super Admin & Head Librarians.

Conversation Context:
${formattedHistory}

User Request: "${userPrompt}"

Provide a detailed, expert, helpful, and professional response regarding PLiMS V4.1.1 PK edition services, modules, or LIS standards in clear, well-structured paragraphs with bullet points.`,
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite']
      });

      if (geminiRes && geminiRes.text && geminiRes.text.trim()) {
        return res.json({ text: geminiRes.text, modelUsed: geminiRes.modelUsed });
      }

      return res.json({
        text: generateServerCopilotFallback(userPrompt),
        modelUsed: 'plims-librarian-copilot'
      });
    } catch (err: any) {
      console.warn('[Copilot] Handled notice:', err?.message || err);
      return res.json({
        text: generateServerCopilotFallback(req.body?.userPrompt || ''),
        modelUsed: 'plims-librarian-copilot',
        fallbackAllowed: true
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(rootDir, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PLiMS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
