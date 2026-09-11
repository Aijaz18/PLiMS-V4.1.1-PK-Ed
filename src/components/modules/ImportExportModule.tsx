import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  FileText,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  BookOpen,
  Users,
  ShieldCheck,
  Building2,
  ArrowRight,
  X,
  FileCheck,
  Search,
  HelpCircle,
  Layers,
  Table
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BookRecord, UserProfile, CirculationTransaction, SystemSettings } from '../../types/alims';

interface ImportExportModuleProps {
  books: BookRecord[];
  users: UserProfile[];
  transactions?: CirculationTransaction[];
  settings?: SystemSettings;
  onImportBooks?: (newBooks: BookRecord[]) => void;
  onImportUsers?: (newUsers: UserProfile[]) => void;
}

interface AttachedFileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  rowCount: number;
  format: 'EXCEL' | 'CSV' | 'JSON' | 'MARCXML' | 'UNKNOWN';
}

export const ImportExportModule: React.FC<ImportExportModuleProps> = ({
  books,
  users,
  transactions = [],
  settings,
  onImportBooks,
  onImportUsers
}) => {
  const [activeTab, setActiveTab] = useState<'EXPORT' | 'IMPORT' | 'MARC_CONVERTER' | 'LOCALHOST_PACKAGE'>('IMPORT');
  const [exportTarget, setExportTarget] = useState<'BOOKS' | 'MEMBERS' | 'TRANSACTIONS' | 'FULL_DATABASE'>('BOOKS');
  const [exportFormat, setExportFormat] = useState<'CSV' | 'JSON' | 'EXCEL' | 'MARCXML'>('EXCEL');

  // Import State
  const [importTarget, setImportTarget] = useState<'BOOKS' | 'MEMBERS'>('BOOKS');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFileInfo | null>(null);
  const [importedPreview, setImportedPreview] = useState<any[] | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewSearch, setPreviewSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to trigger binary / text file download
  const downloadFile = (filename: string, content: string | ArrayBuffer | Uint8Array, contentType: string) => {
    let blob: Blob;
    if (typeof content === 'string') {
      blob = new Blob([content], { type: contentType });
    } else if (content instanceof Uint8Array) {
      blob = new Blob([content.buffer as ArrayBuffer], { type: contentType });
    } else {
      blob = new Blob([content], { type: contentType });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Convert array to CSV string
  const convertToCSV = (objArray: any[]) => {
    if (!objArray || objArray.length === 0) return '';
    const keys = Object.keys(objArray[0]);
    const header = keys.join(',');
    const rows = objArray.map(obj =>
      keys
        .map(k => {
          let val = obj[k];
          if (Array.isArray(val)) val = val.join('; ');
          if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
          val = String(val ?? '').replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    );
    return [header, ...rows].join('\n');
  };

  // Convert books to MARCXML representation
  const convertBooksToMARCXML = (bookList: BookRecord[]) => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<collection xmlns="http://www.loc.gov/MARC21/slim">\n`;
    bookList.forEach(b => {
      xml += `  <record>\n`;
      xml += `    <leader>00000nam a2200000 u 4500</leader>\n`;
      xml += `    <datafield tag="020" ind1=" " ind2=" "><subfield code="a">${b.isbn || ''}</subfield></datafield>\n`;
      xml += `    <datafield tag="082" ind1="0" ind2="4"><subfield code="a">${b.callNumber || ''}</subfield></datafield>\n`;
      xml += `    <datafield tag="100" ind1="1" ind2=" "><subfield code="a">${(b.authors || []).join(', ')}</subfield></datafield>\n`;
      xml += `    <datafield tag="245" ind1="1" ind2="0"><subfield code="a">${b.title || ''}</subfield></datafield>\n`;
      xml += `    <datafield tag="260" ind1=" " ind2=" "><subfield code="b">${b.publisherName || ''}</subfield><subfield code="c">${b.publisherYear || ''}</subfield></datafield>\n`;
      xml += `    <datafield tag="300" ind1=" " ind2=" "><subfield code="a">${b.pageCount || 0} p.</subfield></datafield>\n`;
      xml += `  </record>\n`;
    });
    xml += `</collection>`;
    return xml;
  };

  // Execute Data Export
  const handleExecuteExport = () => {
    let dataToExport: any[] = [];
    const filename = `plims_${exportTarget.toLowerCase()}_${new Date().toISOString().split('T')[0]}`;

    if (exportTarget === 'BOOKS') {
      dataToExport = books;
    } else if (exportTarget === 'MEMBERS') {
      dataToExport = users;
    } else if (exportTarget === 'TRANSACTIONS') {
      dataToExport = transactions;
    } else if (exportTarget === 'FULL_DATABASE') {
      const fullDb = { books, users, transactions, settings };
      downloadFile(`${filename}.json`, JSON.stringify(fullDb, null, 2), 'application/json');
      return;
    }

    if (exportFormat === 'JSON') {
      downloadFile(`${filename}.json`, JSON.stringify(dataToExport, null, 2), 'application/json');
    } else if (exportFormat === 'EXCEL') {
      try {
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, exportTarget);
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        downloadFile(`${filename}.xlsx`, new Uint8Array(excelBuffer), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } catch (err: any) {
        console.warn('Excel export fallback to CSV:', err);
        const csvStr = convertToCSV(dataToExport);
        downloadFile(`${filename}.csv`, csvStr, 'text/csv');
      }
    } else if (exportFormat === 'CSV') {
      const csvStr = convertToCSV(dataToExport);
      downloadFile(`${filename}.csv`, csvStr, 'text/csv');
    } else if (exportFormat === 'MARCXML') {
      if (exportTarget !== 'BOOKS') {
        alert('MARCXML format is only supported for Bibliographic Books dataset export.');
        return;
      }
      const marcStr = convertBooksToMARCXML(books);
      downloadFile(`${filename}.xml`, marcStr, 'application/xml');
    }
  };

  // Download Sample Import Templates
  const handleDownloadSampleTemplate = (type: 'BOOKS' | 'MEMBERS', format: 'CSV' | 'EXCEL' = 'CSV') => {
    if (type === 'BOOKS') {
      const sampleBooks = [
        {
          ISBN: '978-0131103627',
          Title: 'The C Programming Language',
          Authors: 'Brian W. Kernighan, Dennis M. Ritchie',
          Department: 'Computer Science',
          CallNumber: '005.133 KER/C',
          Edition: '2nd Edition',
          Publisher: 'Prentice Hall',
          Year: 1988,
          Pages: 272,
          Copies: 5,
          ShelfLocation: 'Stack CS-01-A',
          Subjects: 'C Programming, Software Engineering'
        },
        {
          ISBN: '978-0201633610',
          Title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
          Authors: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
          Department: 'Computer Science',
          CallNumber: '005.12 GAM/D',
          Edition: '1st Edition',
          Publisher: 'Addison-Wesley',
          Year: 1994,
          Pages: 395,
          Copies: 4,
          ShelfLocation: 'Stack CS-02-B',
          Subjects: 'OOP, Software Architecture'
        },
        {
          ISBN: '978-0073529325',
          Title: 'Principles of Electronic Materials and Devices',
          Authors: 'S.O. Kasap',
          Department: 'Electrical Engineering',
          CallNumber: '621.381 KAS/P',
          Edition: '3rd Edition',
          Publisher: 'McGraw-Hill',
          Year: 2006,
          Pages: 840,
          Copies: 6,
          ShelfLocation: 'Stack EE-04-C',
          Subjects: 'Semiconductors, Electronics'
        }
      ];

      if (format === 'EXCEL') {
        const ws = XLSX.utils.json_to_sheet(sampleBooks);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Books_Catalog');
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        downloadFile('plims_books_import_template.xlsx', new Uint8Array(buf), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } else {
        const csv = convertToCSV(sampleBooks);
        downloadFile('plims_books_import_template.csv', csv, 'text/csv');
      }
    } else {
      const sampleMembers = [
        {
          MemberCode: 'STU-2026-101',
          FullName: 'Ayesha Khan',
          Email: 'ayesha.k@university.edu.pk',
          Role: 'STUDENT',
          Department: 'Computer Science',
          Designation: 'BS-CS Final Year',
          BorrowLimit: 5,
          Status: 'ACTIVE'
        },
        {
          MemberCode: 'FAC-2026-042',
          FullName: 'Dr. Tariq Mahmood',
          Email: 'tariq.m@university.edu.pk',
          Role: 'FACULTY',
          Department: 'Physics',
          Designation: 'Professor & Dean',
          BorrowLimit: 15,
          Status: 'ACTIVE'
        },
        {
          MemberCode: 'RES-2026-088',
          FullName: 'Zainab Bibi',
          Email: 'zainab.b@university.edu.pk',
          Role: 'RESEARCH_SCHOLAR',
          Department: 'Bio-Technology',
          Designation: 'PhD Candidate',
          BorrowLimit: 10,
          Status: 'ACTIVE'
        }
      ];

      if (format === 'EXCEL') {
        const ws = XLSX.utils.json_to_sheet(sampleMembers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Member_Profiles');
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        downloadFile('plims_members_import_template.xlsx', new Uint8Array(buf), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } else {
        const csv = convertToCSV(sampleMembers);
        downloadFile('plims_members_import_template.csv', csv, 'text/csv');
      }
    }
  };

  // Parse Raw Uploaded / Dropped File
  const processUploadedFile = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    setImportError(null);
    setImportStatus(null);
    setImportedPreview(null);

    const fileName = file.name;
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

    try {
      let rawRows: any[] = [];
      let detectedFormat: AttachedFileInfo['format'] = 'UNKNOWN';

      if (fileExt === 'xlsx' || fileExt === 'xls') {
        detectedFormat = 'EXCEL';
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error('No worksheets found in this Excel workbook.');
        }
        const worksheet = workbook.Sheets[sheetName];
        rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      } else if (fileExt === 'json') {
        detectedFormat = 'JSON';
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          rawRows = parsed;
        } else if (parsed.books && Array.isArray(parsed.books) && importTarget === 'BOOKS') {
          rawRows = parsed.books;
        } else if (parsed.users && Array.isArray(parsed.users) && importTarget === 'MEMBERS') {
          rawRows = parsed.users;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          rawRows = parsed.data;
        } else if (parsed.records && Array.isArray(parsed.records)) {
          rawRows = parsed.records;
        } else {
          // If single object, wrap in array
          rawRows = [parsed];
        }
      } else if (fileExt === 'csv' || fileExt === 'tsv' || fileExt === 'txt') {
        detectedFormat = 'CSV';
        const buffer = await file.arrayBuffer();
        // Use SheetJS to accurately parse CSV with comma, semicolon, quotes, or tabs
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (sheetName) {
          const worksheet = workbook.Sheets[sheetName];
          rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        }
      } else {
        // Generic fallback attempt via SheetJS
        try {
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          if (sheetName) {
            rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
            detectedFormat = 'CSV';
          }
        } catch {
          throw new Error(`Unsupported file type (.${fileExt}). Please upload a CSV, Excel (.xlsx/.xls), or JSON file.`);
        }
      }

      if (!rawRows || rawRows.length === 0) {
        throw new Error('The uploaded file appears to be empty or contains no data rows.');
      }

      // Normalize and Map Rows to PLiMS Datatypes
      if (importTarget === 'BOOKS') {
        const normalizedBooks: BookRecord[] = rawRows.map((row, idx) => {
          // Get values flexibly regardless of case or spacing in header
          const findVal = (...keys: string[]) => {
            for (const k of keys) {
              for (const rowKey of Object.keys(row)) {
                if (rowKey.trim().toLowerCase() === k.trim().toLowerCase()) {
                  return row[rowKey];
                }
              }
            }
            return '';
          };

          const title = findVal('title', 'book_title', 'book title', 'name', 'bookname') || `Imported Book #${idx + 1}`;
          const rawAuthors = findVal('authors', 'author', 'creator', 'by') || 'Unknown Author';
          const authors = typeof rawAuthors === 'string'
            ? rawAuthors.split(/[,;&]/).map(a => a.trim()).filter(Boolean)
            : Array.isArray(rawAuthors) ? rawAuthors : ['Unknown Author'];

          const isbn = String(findVal('isbn', 'isbn10', 'isbn13', 'barcode', 'accession', 'code') || `IMP-${Date.now()}-${idx + 1}`);
          const department = String(findVal('department', 'dept', 'category', 'faculty', 'section') || 'General Collection');
          const callNumber = String(findVal('callnumber', 'call_number', 'call number', 'call no', 'ddc', 'classification') || `000.${idx + 1} IMP`);
          const publisherName = String(findVal('publisher', 'publishername', 'publisher_name', 'press') || 'Academic Press');
          const publisherYear = parseInt(String(findVal('year', 'publisheryear', 'publisher_year', 'publication_year', 'pub_year') || '2024'), 10) || 2024;
          const pageCount = parseInt(String(findVal('pages', 'pagecount', 'page_count', 'length') || '250'), 10) || 250;
          const totalCopies = parseInt(String(findVal('copies', 'totalcopies', 'total_copies', 'quantity', 'qty') || '3'), 10) || 3;
          const edition = String(findVal('edition', 'ed') || '1st Edition');
          const shelfLocation = String(findVal('shelf', 'shelflocation', 'shelf_location', 'rack', 'location') || 'Main Stacks');

          const rawSubjects = findVal('subjects', 'subject', 'tags', 'keywords') || department;
          const subjects = typeof rawSubjects === 'string'
            ? rawSubjects.split(/[,;&]/).map(s => s.trim()).filter(Boolean)
            : Array.isArray(rawSubjects) ? rawSubjects : [department];

          return {
            id: `bk_imp_${Date.now()}_${idx + 1}`,
            isbn,
            title,
            authors: authors.length > 0 ? authors : ['Unknown Author'],
            department,
            callNumber,
            edition,
            publisherName,
            publisherLocation: String(findVal('publisherlocation', 'publisher_location', 'city', 'location') || 'Islamabad, PK'),
            publisherYear,
            pageCount,
            totalCopies,
            availableCopies: totalCopies,
            shelfLocation,
            subjects,
            coverUrl: String(findVal('cover', 'coverurl', 'cover_url', 'image') || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80'),
            format: (String(findVal('format', 'binding')).toUpperCase() === 'HARDCOVER' ? 'HARDCOVER' : 'PAPERBACK') as any
          };
        });

        setImportedPreview(normalizedBooks);
        setImportStatus(`Successfully parsed ${normalizedBooks.length} Bibliographic Books from "${fileName}"`);
      } else {
        // MEMBERS NORMALIZATION
        const normalizedMembers: UserProfile[] = rawRows.map((row, idx) => {
          const findVal = (...keys: string[]) => {
            for (const k of keys) {
              for (const rowKey of Object.keys(row)) {
                if (rowKey.trim().toLowerCase() === k.trim().toLowerCase()) {
                  return row[rowKey];
                }
              }
            }
            return '';
          };

          const name = findVal('name', 'fullname', 'full_name', 'member_name', 'student_name', 'faculty_name') || `Member #${idx + 1}`;
          const memberCode = String(findVal('membercode', 'member_code', 'code', 'memberid', 'member_id', 'rollno', 'roll_no', 'regno', 'card_number') || `MEM-2026-${String(idx + 101).padStart(3, '0')}`);
          const email = String(findVal('email', 'email_address', 'mail') || `${memberCode.toLowerCase()}@university.edu.pk`);
          const rawRole = String(findVal('role', 'type', 'member_type', 'role_name') || 'STUDENT').toUpperCase();
          const role = (rawRole.includes('FAC') ? 'FACULTY' : rawRole.includes('RES') ? 'RESEARCH_SCHOLAR' : rawRole.includes('LIB') ? 'LIBRARIAN' : 'STUDENT') as any;
          const department = String(findVal('department', 'dept', 'program', 'faculty', 'class') || 'General Studies');
          const designation = String(findVal('designation', 'title', 'semester', 'year') || (role === 'FACULTY' ? 'Assistant Professor' : 'Student'));
          const maxBorrowLimit = parseInt(String(findVal('borrowlimit', 'borrow_limit', 'maxborrowlimit', 'max_borrow_limit', 'limit') || (role === 'FACULTY' ? '15' : '5')), 10) || 5;

          return {
            id: `usr_imp_${Date.now()}_${idx + 1}`,
            memberCode,
            name,
            email,
            role,
            department,
            designation,
            status: 'ACTIVE',
            joinedDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            maxBorrowLimit,
            activeBorrowCount: 0,
            finePending: 0
          };
        });

        setImportedPreview(normalizedMembers);
        setImportStatus(`Successfully parsed ${normalizedMembers.length} Patron Profiles from "${fileName}"`);
      }

      setAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type || fileExt.toUpperCase(),
        lastModified: file.lastModified,
        rowCount: rawRows.length,
        format: detectedFormat
      });
    } catch (err: any) {
      console.error('File parsing error:', err);
      setImportError(err.message || 'Failed to process and parse the uploaded file.');
      setAttachedFile(null);
      setImportedPreview(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Input File Element Selection
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
    // Reset file input so same file can be re-selected if needed
    e.target.value = '';
  };

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the main drop container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processUploadedFile(droppedFile);
    }
  };

  // Demo Sample File Loader
  const handleLoadSampleDemo = () => {
    if (importTarget === 'BOOKS') {
      const sampleImportedBooks: BookRecord[] = [
        {
          id: `imp_bk_${Date.now()}_1`,
          isbn: '978-0201633610',
          title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
          authors: ['Erich Gamma', 'Richard Helm', 'Ralph Johnson', 'John Vlissides'],
          department: 'Computer Science',
          callNumber: '005.12 GAM/D',
          edition: '1st Edition',
          publisherName: 'Addison-Wesley',
          publisherLocation: 'Boston, MA',
          publisherYear: 1994,
          pageCount: 395,
          totalCopies: 4,
          availableCopies: 4,
          shelfLocation: 'Stack CS-01-A',
          subjects: ['Software Architecture', 'OOP', 'Design Patterns'],
          coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&auto=format&fit=crop&q=80',
          format: 'HARDCOVER'
        },
        {
          id: `imp_bk_${Date.now()}_2`,
          isbn: '978-0131103627',
          title: 'The C Programming Language (2nd Edition)',
          authors: ['Brian W. Kernighan', 'Dennis M. Ritchie'],
          department: 'Computer Science',
          callNumber: '005.133 KER/C',
          edition: '2nd Edition',
          publisherName: 'Prentice Hall',
          publisherLocation: 'Englewood Cliffs, NJ',
          publisherYear: 1988,
          pageCount: 272,
          totalCopies: 6,
          availableCopies: 6,
          shelfLocation: 'Stack CS-02-B',
          subjects: ['C Language', 'Systems Programming'],
          coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
          format: 'PAPERBACK'
        },
        {
          id: `imp_bk_${Date.now()}_3`,
          isbn: '978-0132350884',
          title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          authors: ['Robert C. Martin'],
          department: 'Computer Science',
          callNumber: '005.1 MAR/C',
          edition: '1st Edition',
          publisherName: 'Prentice Hall',
          publisherLocation: 'Upper Saddle River, NJ',
          publisherYear: 2008,
          pageCount: 464,
          totalCopies: 5,
          availableCopies: 5,
          shelfLocation: 'Stack CS-03-A',
          subjects: ['Agile', 'Software Craftsmanship', 'Refactoring'],
          coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=80',
          format: 'PAPERBACK'
        }
      ];
      setImportedPreview(sampleImportedBooks);
      setAttachedFile({
        name: 'sample_library_catalog_demo.xlsx',
        size: 14200,
        type: 'Excel (.xlsx)',
        lastModified: Date.now(),
        rowCount: sampleImportedBooks.length,
        format: 'EXCEL'
      });
      setImportStatus('3 Sample Bibliographic Records Loaded & Validated!');
      setImportError(null);
    } else {
      const sampleImportedUsers: UserProfile[] = [
        {
          id: `imp_usr_${Date.now()}_1`,
          memberCode: 'FAC-809',
          name: 'Dr. Hamza Siddiqui',
          email: 'hamza.s@university.edu.pk',
          role: 'FACULTY',
          department: 'Electrical Engineering',
          designation: 'Associate Professor',
          status: 'ACTIVE',
          joinedDate: '2025-01-10',
          expiryDate: '2028-12-31',
          maxBorrowLimit: 15,
          activeBorrowCount: 0,
          finePending: 0
        },
        {
          id: `imp_usr_${Date.now()}_2`,
          memberCode: 'STU-920',
          name: 'Fatima Zahra',
          email: 'fatima.z@university.edu.pk',
          role: 'STUDENT',
          department: 'Computer Science',
          designation: 'BS Software Engineering',
          status: 'ACTIVE',
          joinedDate: '2025-02-15',
          expiryDate: '2029-06-30',
          maxBorrowLimit: 5,
          activeBorrowCount: 0,
          finePending: 0
        }
      ];
      setImportedPreview(sampleImportedUsers);
      setAttachedFile({
        name: 'sample_patron_directory_demo.csv',
        size: 8900,
        type: 'CSV (.csv)',
        lastModified: Date.now(),
        rowCount: sampleImportedUsers.length,
        format: 'CSV'
      });
      setImportStatus('2 Sample Patron Profiles Loaded & Validated!');
      setImportError(null);
    }
  };

  // Commit Ingestion into Application State
  const handleCommitImport = () => {
    if (!importedPreview || importedPreview.length === 0) return;
    if (importTarget === 'BOOKS' && onImportBooks) {
      onImportBooks(importedPreview);
      alert(`🎉 Successfully ingested and saved ${importedPreview.length} book records into the PLiMS Library Catalog!`);
    } else if (importTarget === 'MEMBERS' && onImportUsers) {
      onImportUsers(importedPreview);
      alert(`🎉 Successfully ingested and saved ${importedPreview.length} patron profiles into the PLiMS Member Directory!`);
    }
    setImportedPreview(null);
    setAttachedFile(null);
    setImportStatus(null);
    setImportError(null);
  };

  // Remove attached file
  const handleRemoveAttachedFile = () => {
    setAttachedFile(null);
    setImportedPreview(null);
    setImportStatus(null);
    setImportError(null);
  };

  // Filtered Preview Data
  const filteredPreview = (importedPreview || []).filter(item => {
    if (!previewSearch.trim()) return true;
    const term = previewSearch.toLowerCase();
    return (
      (item.title || '').toLowerCase().includes(term) ||
      (item.name || '').toLowerCase().includes(term) ||
      (item.isbn || '').toLowerCase().includes(term) ||
      (item.memberCode || '').toLowerCase().includes(term) ||
      (item.department || '').toLowerCase().includes(term) ||
      (Array.isArray(item.authors) ? item.authors.join(' ') : '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#121214] via-[#18181b] to-[#121214] border border-[#27272a] shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-[#fafafa]">Centralized Import & Export Center</h2>
          </div>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Batch Data Ingestion & Open Source ISO/MARC21 Data Exchange Hub (CSV, Excel .xlsx, MARCXML, JSON)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>Excel, CSV & Koha/SLiMS Ready</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#27272a] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('IMPORT')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'IMPORT'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-[#121214] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]'
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Batch Import Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPORT')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'EXPORT'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-[#121214] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]'
          }`}
        >
          <Download className="h-4 w-4" />
          <span>Export Center</span>
        </button>

        <button
          onClick={() => setActiveTab('MARC_CONVERTER')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'MARC_CONVERTER'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-[#121214] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]'
          }`}
        >
          <FileCode className="h-4 w-4 text-purple-300" />
          <span>MARC21 / MARCXML Converter</span>
        </button>

        <button
          onClick={() => setActiveTab('LOCALHOST_PACKAGE')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'LOCALHOST_PACKAGE'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-[#121214] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]'
          }`}
        >
          <Building2 className="h-4 w-4 text-amber-300" />
          <span>Localhost & XAMPP PC Launcher</span>
        </button>
      </div>

      {/* TAB 1: BATCH IMPORT HUB */}
      {activeTab === 'IMPORT' && (
        <div className="space-y-6">
          {/* Ingestion Configuration & Dropzone Card */}
          <div className="p-6 rounded-2xl border border-[#27272a] bg-[#121214] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#fafafa] flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-emerald-400" />
                  <span>Batch Data Ingestion Engine</span>
                </h3>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Import bibliographic holdings or patron records from CSV spreadsheets, Excel workbooks (.xlsx/.xls), or JSON exports.
                </p>
              </div>

              {/* Target Selector */}
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-xs text-[#a1a1aa]">Ingestion Target:</span>
                <select
                  value={importTarget}
                  onChange={e => {
                    setImportTarget(e.target.value as any);
                    setImportedPreview(null);
                    setAttachedFile(null);
                    setImportStatus(null);
                    setImportError(null);
                  }}
                  className="bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-1.5 text-xs text-[#fafafa] font-bold cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  <option value="BOOKS">📚 Bibliographic Books Catalog</option>
                  <option value="MEMBERS">👥 Patron / Member Profiles</option>
                </select>
              </div>
            </div>

            {/* Hidden File Input for click-to-upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".csv,.xlsx,.xls,.tsv,.txt,.json,.xml"
              className="hidden"
            />

            {/* DRAG & DROP ZONE */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed text-center space-y-4 transition-all cursor-pointer relative select-none ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01] shadow-xl ring-4 ring-emerald-500/20'
                  : 'border-[#27272a] bg-[#09090b] hover:border-emerald-500/60 hover:bg-[#0c0c0e]'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <Upload className="h-7 w-7 animate-pulse" />
              </div>

              <div>
                <h4 className="font-bold text-base text-[#fafafa]">
                  Drag & Drop your CSV or Excel (.xlsx) file here
                </h4>
                <p className="text-xs text-[#a1a1aa] mt-1 max-w-md mx-auto leading-relaxed">
                  Supports <strong className="text-emerald-400">Excel (.xlsx, .xls)</strong>, <strong className="text-blue-400">CSV</strong>, TSV, JSON, and MARCXML records. Or click anywhere in this box to browse from your device.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Browse & Attach File</span>
                </button>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleLoadSampleDemo();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-zinc-300 hover:text-white text-xs cursor-pointer border border-[#27272a] flex items-center space-x-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Load Sample Demo Batch</span>
                </button>
              </div>

              {/* Supported Formats Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[10px] font-mono text-[#71717a]">
                <span className="px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a]">.XLSX</span>
                <span className="px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a]">.XLS</span>
                <span className="px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a]">.CSV</span>
                <span className="px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a]">.TSV</span>
                <span className="px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a]">.JSON</span>
              </div>
            </div>

            {/* ATTACHED FILE CARD */}
            {attachedFile && (
              <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white truncate max-w-xs">{attachedFile.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {attachedFile.format}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#a1a1aa] flex items-center space-x-2 mt-0.5">
                      <span>{(attachedFile.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">{attachedFile.rowCount} Record(s) Detected</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCommitImport}
                    disabled={!importedPreview || importedPreview.length === 0}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Commit Ingestion ({importedPreview?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveAttachedFile}
                    className="p-2 rounded-xl bg-[#18181b] hover:bg-red-500/20 hover:text-red-400 text-zinc-400 text-xs border border-[#27272a] cursor-pointer"
                    title="Remove attached file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {importError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Success Status Banner */}
            {importStatus && !importError && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              </div>
            )}

            {/* Sample Template Download Helper Bar */}
            <div className="pt-2 border-t border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-[#a1a1aa] flex items-center space-x-1.5">
                <HelpCircle className="h-4 w-4 text-emerald-400" />
                <span>Need a starter spreadsheet template?</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadSampleTemplate(importTarget, 'EXCEL')}
                  className="px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-emerald-400 hover:text-emerald-300 font-medium text-xs border border-emerald-500/30 flex items-center space-x-1 cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Download {importTarget === 'BOOKS' ? 'Books' : 'Members'} Template (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadSampleTemplate(importTarget, 'CSV')}
                  className="px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-blue-400 hover:text-blue-300 font-medium text-xs border border-blue-500/30 flex items-center space-x-1 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Download CSV Template</span>
                </button>
              </div>
            </div>
          </div>

          {/* INGESTION PREVIEW TABLE */}
          {importedPreview && importedPreview.length > 0 && (
            <div className="p-6 rounded-2xl border border-[#27272a] bg-[#121214] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Table className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider font-mono">
                    Ingestion Live Preview ({filteredPreview.length} of {importedPreview.length} Records)
                  </h4>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="h-3.5 w-3.5 text-[#71717a] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={e => setPreviewSearch(e.target.value)}
                    placeholder="Search parsed preview..."
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#27272a] overflow-x-auto bg-[#09090b]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#27272a] text-[#a1a1aa] bg-[#121214]">
                      <th className="p-3">#</th>
                      <th className="p-3 font-mono">{importTarget === 'BOOKS' ? 'ISBN / Accession' : 'Member Code'}</th>
                      <th className="p-3">{importTarget === 'BOOKS' ? 'Book Title & Authors' : 'Patron Full Name'}</th>
                      <th className="p-3">{importTarget === 'BOOKS' ? 'Call No / Classification' : 'Role & Designation'}</th>
                      <th className="p-3">Department</th>
                      <th className="p-3 text-right">{importTarget === 'BOOKS' ? 'Copies' : 'Borrow Limit'}</th>
                      <th className="p-3 text-center">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]">
                    {filteredPreview.slice(0, 50).map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="p-3 text-[#71717a] font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-3 font-mono text-blue-400 font-bold">{item.isbn || item.memberCode}</td>
                        <td className="p-3">
                          <div className="font-bold text-[#fafafa]">{item.title || item.name}</div>
                          {item.authors && (
                            <div className="text-[11px] text-[#a1a1aa]">
                              By {Array.isArray(item.authors) ? item.authors.join(', ') : item.authors}
                            </div>
                          )}
                          {item.email && <div className="text-[10px] text-zinc-400 font-mono">{item.email}</div>}
                        </td>
                        <td className="p-3">
                          {importTarget === 'BOOKS' ? (
                            <span className="font-mono text-emerald-300 text-[11px]">{item.callNumber}</span>
                          ) : (
                            <div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {item.role}
                              </span>
                              <div className="text-[10px] text-zinc-400 mt-0.5">{item.designation}</div>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-[#a1a1aa]">{item.department}</td>
                        <td className="p-3 text-right font-mono font-bold text-[#fafafa]">
                          {item.totalCopies ?? item.maxBorrowLimit}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                            <span>✓ Ready</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredPreview.length > 50 && (
                <p className="text-center text-xs text-[#a1a1aa] pt-2">
                  Showing first 50 of {filteredPreview.length} parsed records. Click <strong>Commit Ingestion</strong> above to save all records.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPORT CENTER */}
      {activeTab === 'EXPORT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-[#27272a] bg-[#121214] space-y-5">
            <h3 className="text-sm font-bold text-[#fafafa] flex items-center space-x-2">
              <Download className="h-4 w-4 text-blue-400" />
              <span>Configure Data Export Stream</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] mb-1.5 font-medium">1. Select Target Dataset</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportTarget('BOOKS')}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-2 cursor-pointer transition-all ${
                      exportTarget === 'BOOKS'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa]'
                    }`}
                  >
                    <BookOpen className="h-4 w-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="font-bold">Bibliographic Holdings</div>
                      <div className="text-[10px] text-[#71717a]">{books.length} Records</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setExportTarget('MEMBERS')}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-2 cursor-pointer transition-all ${
                      exportTarget === 'MEMBERS'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa]'
                    }`}
                  >
                    <Users className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold">Patrons & Staff Directory</div>
                      <div className="text-[10px] text-[#71717a]">{users.length} Profiles</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setExportTarget('TRANSACTIONS')}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-2 cursor-pointer transition-all ${
                      exportTarget === 'TRANSACTIONS'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa]'
                    }`}
                  >
                    <FileText className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold">Circulation Logs</div>
                      <div className="text-[10px] text-[#71717a]">{transactions.length} Records</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setExportTarget('FULL_DATABASE')}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-2 cursor-pointer transition-all ${
                      exportTarget === 'FULL_DATABASE'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa]'
                    }`}
                  >
                    <Database className="h-4 w-4 text-purple-400 shrink-0" />
                    <div>
                      <div className="font-bold">Full PLiMS System Backup</div>
                      <div className="text-[10px] text-[#71717a]">All Tables & Configs</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#a1a1aa] mb-1.5 font-medium">2. Select Export File Format</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setExportFormat('EXCEL')}
                    className={`py-2 rounded-xl border font-mono text-center cursor-pointer transition-all ${
                      exportFormat === 'EXCEL'
                        ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-md'
                        : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa]'
                    }`}
                  >
                    Excel (.xlsx)
                  </button>

                  <button
                    onClick={() => setExportFormat('CSV')}
                    className={`py-2 rounded-xl border font-mono text-center cursor-pointer transition-all ${
                      exportFormat === 'CSV'
                        ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-md'
                        : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa]'
                    }`}
                  >
                    CSV
                  </button>

                  <button
                    onClick={() => setExportFormat('JSON')}
                    className={`py-2 rounded-xl border font-mono text-center cursor-pointer transition-all ${
                      exportFormat === 'JSON'
                        ? 'bg-amber-600 text-white border-amber-500 font-bold shadow-md'
                        : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa]'
                    }`}
                  >
                    JSON
                  </button>

                  <button
                    onClick={() => setExportFormat('MARCXML')}
                    className={`py-2 rounded-xl border font-mono text-center cursor-pointer transition-all ${
                      exportFormat === 'MARCXML'
                        ? 'bg-purple-600 text-white border-purple-500 font-bold shadow-md'
                        : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa]'
                    }`}
                  >
                    MARC21
                  </button>
                </div>
              </div>

              <button
                onClick={handleExecuteExport}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Generate & Download Export File</span>
              </button>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[#27272a] bg-[#121214] flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#fafafa] flex items-center space-x-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                <span>Export Stream Information</span>
              </h3>

              <div className="bg-[#09090b] p-4 rounded-xl border border-[#27272a] text-xs space-y-2 font-mono">
                <div className="flex justify-between text-[#a1a1aa]">
                  <span>Target Dataset:</span>
                  <span className="text-blue-400 font-bold">{exportTarget}</span>
                </div>
                <div className="flex justify-between text-[#a1a1aa]">
                  <span>Output Encoding:</span>
                  <span className="text-emerald-400 font-bold">UTF-8 / ISO-2709</span>
                </div>
                <div className="flex justify-between text-[#a1a1aa]">
                  <span>Delimiter Standard:</span>
                  <span className="text-[#fafafa]">Workbook Binary / Comma Separated</span>
                </div>
                <div className="flex justify-between text-[#a1a1aa]">
                  <span>Selected Format:</span>
                  <span className="text-amber-400 font-bold">{exportFormat}</span>
                </div>
              </div>

              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                Export files generated from PLiMS studio are 100% compliant with standard ILS systems including
                Koha, SLiMS 9 Bulian, LibraryThing, and MARC21 ISO-2709 cataloguing specifications.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Ready to package and download.</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MARC CONVERTER */}
      {activeTab === 'MARC_CONVERTER' && (
        <div className="p-6 rounded-2xl border border-[#27272a] bg-[#121214] space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-[#fafafa] flex items-center space-x-2">
            <FileCode className="h-4 w-4 text-purple-400" />
            <span>ISO-2709 / MARC21 XML Live Converter</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[#a1a1aa]">PLiMS Bibliographic JSON Source</label>
              <textarea
                readOnly
                rows={12}
                value={JSON.stringify(books.slice(0, 2), null, 2)}
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-[#fafafa] text-[10px] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-purple-400">Converted MARC21 ISO-2709 XML Output</label>
              <textarea
                readOnly
                rows={12}
                value={convertBooksToMARCXML(books.slice(0, 2))}
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-emerald-400 text-[10px] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LOCALHOST PC & XAMPP LAUNCHER PACKAGE */}
      {activeTab === 'LOCALHOST_PACKAGE' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#121214] to-[#121214] space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-base">
              <Building2 className="h-6 w-6" />
              <h3>PSLiMS Localhost PC & XAMPP Deployment Center</h3>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Run PSLiMS locally on any Windows PC, Mac, or Linux desktop. You can launch it using a standalone Node.js server, an automated <code className="text-amber-300 font-mono">.bat</code> launcher script, or host the compiled production build inside a local XAMPP <code className="text-amber-300 font-mono">C:\xampp\htdocs\pslims</code> web server directory.
            </p>
          </div>

          {/* Quick Script Download Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Windows Bat Launcher */}
            <div className="p-5 rounded-2xl border border-[#27272a] bg-[#121214] space-y-3 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileCode className="h-4 w-4" />
                  <span>Windows PC Batch Script</span>
                </div>
                <h4 className="font-bold text-sm text-[#fafafa] mt-2">start-pslims-windows.bat</h4>
                <p className="text-[11px] text-[#a1a1aa] mt-1 leading-relaxed">
                  One-click Windows batch file that automatically checks Node.js, installs dependencies, and boots the local web server on port 3000.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const scriptContent = `@echo off
title PSLiMS - Localhost PC Server
echo ========================================================
echo      PSLiMS - Pakistan System Library Management
echo      Localhost PC Server Startup Launcher
echo ========================================================
echo.
echo [1/3] Checking Node.js Environment...
node -v
if %errorlevel% neq 0 (
    echo [!] ERROR: Node.js is not installed on this PC.
    echo Please download & install Node.js LTS from: https://nodejs.org/
    pause
    exit /b
)
echo.
echo [2/3] Installing Project Dependencies...
call npm install
echo.
echo [3/3] Launching PSLiMS Local Server on http://localhost:3000 ...
call npm run dev
pause`;
                  downloadFile('start-pslims-windows.bat', scriptContent, 'text/plain');
                }}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Download className="h-4 w-4" />
                <span>Download .BAT Launcher</span>
              </button>
            </div>

            {/* Mac / Linux Shell Launcher */}
            <div className="p-5 rounded-2xl border border-[#27272a] bg-[#121214] space-y-3 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileCode className="h-4 w-4" />
                  <span>Mac / Linux Shell Script</span>
                </div>
                <h4 className="font-bold text-sm text-[#fafafa] mt-2">start-pslims-mac-linux.sh</h4>
                <p className="text-[11px] text-[#a1a1aa] mt-1 leading-relaxed">
                  Executable shell script for macOS and Linux operating systems to launch local library terminal instances.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const scriptContent = `#!/bin/bash
echo "========================================================"
echo "     PSLiMS - Pakistan System Library Management"
echo "     Localhost PC Server Startup Launcher"
echo "========================================================"
echo ""
echo "[1/3] Checking Node.js..."
node -v || { echo "Node.js missing. Please install nodejs from https://nodejs.org/"; exit 1; }
echo ""
echo "[2/3] Installing Dependencies..."
npm install
echo ""
echo "[3/3] Starting PSLiMS on http://localhost:3000 ..."
npm run dev`;
                  downloadFile('start-pslims-mac-linux.sh', scriptContent, 'text/plain');
                }}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Download className="h-4 w-4" />
                <span>Download .SH Shell Script</span>
              </button>
            </div>

            {/* XAMPP Guide & Package */}
            <div className="p-5 rounded-2xl border border-[#27272a] bg-[#121214] space-y-3 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="h-4 w-4" />
                  <span>XAMPP htdocs Guide</span>
                </div>
                <h4 className="font-bold text-sm text-[#fafafa] mt-2">XAMPP_HTDOCS_INSTRUCTIONS.txt</h4>
                <p className="text-[11px] text-[#a1a1aa] mt-1 leading-relaxed">
                  Detailed step-by-step documentation for placing PSLiMS static web builds inside XAMPP Apache <code className="text-amber-300 font-mono">htdocs</code> folder.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const guideContent = `========================================================================
     PSLiMS - PAKISTAN SYSTEM LIBRARY MANAGEMENT SOFTWARE
     HOW TO RUN PSLiMS ON LOCAL HOST USING XAMPP SERVER
========================================================================

STEP 1: DOWNLOAD & EXTRACT FILES
---------------------------------
1. Extract all PSLiMS source code files into your local computer directory.
2. If using XAMPP on Windows, copy the extracted folder to:
   C:\\xampp\\htdocs\\pslims\\

STEP 2: RUNNING WITH NODE.JS / NPM (RECOMMENDED)
-------------------------------------------------
1. Open Command Prompt (cmd) or PowerShell on your PC.
2. Navigate to your folder:
   cd C:\\xampp\\htdocs\\pslims
3. Run the installer:
   npm install
4. Start the application:
   npm run dev
5. Open your browser and go to:
   http://localhost:3000

STEP 3: HOSTING VIA XAMPP APACHE WEB SERVER
--------------------------------------------
1. Build the production distribution by running:
   npm run build
2. This creates a compiled 'dist/' directory containing index.html and static JavaScript/CSS assets.
3. Copy all contents from the 'dist/' folder into 'C:\\xampp\\htdocs\\pslims\\'.
4. Open XAMPP Control Panel and click "Start" next to Apache.
5. Visit http://localhost/pslims in Google Chrome, Microsoft Edge, or Firefox.

STEP 4: OFFLINE LOCALSTORAGE DATA PERSISTENCE
----------------------------------------------
PSLiMS features a built-in Service Worker and LocalStorage Indexed Engine.
All MARC21 records, library catalog scans, member lists, and overdue notices operate 100% offline without requiring internet access.
`;
                  downloadFile('XAMPP_HTDOCS_INSTRUCTIONS.txt', guideContent, 'text/plain');
                }}
                className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Download className="h-4 w-4" />
                <span>Download XAMPP Guide</span>
              </button>
            </div>
          </div>

          {/* Full Database Backup for Local Seeding */}
          <div className="p-6 rounded-2xl border border-[#27272a] bg-[#121214] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-[#fafafa] flex items-center space-x-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span>Download Localhost Initial Seed Database JSON</span>
                </h4>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Export the current catalog, user directory, active loans, and settings as a JSON file to populate your local PC database.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const fullDb = { books, users, transactions, settings };
                  downloadFile('pslims_localhost_seed_database.json', JSON.stringify(fullDb, null, 2), 'application/json');
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg cursor-pointer shrink-0"
              >
                <Download className="h-4 w-4" />
                <span>Download Seed Database JSON</span>
              </button>
            </div>
          </div>

          {/* Step-by-Step Interactive Accordion Guide */}
          <div className="p-6 rounded-2xl border border-[#27272a] bg-[#121214] space-y-4">
            <h4 className="font-bold text-sm text-[#fafafa] flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Step-by-Step Localhost PC & XAMPP Setup Walkthrough</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] space-y-1">
                <div className="font-bold text-amber-300 font-mono">Method A: Using Node.js Desktop Server (Quickest)</div>
                <p className="text-[#a1a1aa] leading-relaxed">
                  1. Download Node.js LTS installer from <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-blue-400 underline">nodejs.org</a> and install on PC.<br />
                  2. Extract the downloaded PSLiMS project folder to your desktop or documents folder.<br />
                  3. Double-click <code className="text-emerald-400 font-mono">start-pslims-windows.bat</code> (on Windows) or run <code className="text-emerald-400 font-mono">./start-pslims-mac-linux.sh</code> in terminal.<br />
                  4. The browser will open automatically at <code className="text-emerald-400 font-mono">http://localhost:3000</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] space-y-1">
                <div className="font-bold text-blue-300 font-mono">Method B: Using XAMPP Apache Server (C:\xampp\htdocs\pslims)</div>
                <p className="text-[#a1a1aa] leading-relaxed">
                  1. Download and install XAMPP for Windows from ApacheFriends.<br />
                  2. Place your PSLiMS folder inside <code className="text-amber-300 font-mono">C:\xampp\htdocs\pslims</code>.<br />
                  3. Run <code className="text-emerald-400 font-mono">npm run build</code> in command prompt inside that folder to compile the static application into <code className="text-amber-300 font-mono">dist/</code>.<br />
                  4. Copy the contents of <code className="text-amber-300 font-mono">dist/</code> directly into <code className="text-amber-300 font-mono">C:\xampp\htdocs\pslims\</code>.<br />
                  5. Start Apache from XAMPP Control Panel and open <code className="text-emerald-400 font-mono">http://localhost/pslims</code> in your web browser.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
