import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Database,
  Layers,
  Server,
  Terminal,
  FileText,
  CheckCircle2,
  Copy,
  Download,
  Search,
  Cpu,
  Workflow,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  Table,
  Box,
  Key,
  GitBranch,
  BookMarked,
  Info
} from 'lucide-react';

export interface DocumentationModuleProps {
  currentLanguage?: string;
}

export const DocumentationModule: React.FC<DocumentationModuleProps> = () => {
  const [activeTab, setActiveTab] = useState<
    'ARCH' | 'FRONTEND' | 'BACKEND' | 'SCHEMA' | 'ER_DIAGRAM' | 'FLOWS' | 'DEPLOY' | 'MANUAL'
  >('ARCH');

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [searchManual, setSearchManual] = useState('');
  const [selectedTableEr, setSelectedTableEr] = useState<string | null>('books');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sampleLaravelControllerCode = `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\BookRecord;
use App\\Models\\CirculationTransaction;
use App\\Services\\GeminiCataloguingService;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;

class CataloguingController extends Controller
{
    protected GeminiCataloguingService $aiService;

    public function __construct(GeminiCataloguingService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Search catalog with MARC21 & Full-Text indexing
     */
    public function index(Request $request): JsonResponse
    {
        $query = BookRecord::with(['copies', 'authorityLink']);

        if ($request->filled('q')) {
            $searchTerm = $request->query('q');
            $query->whereRaw("MATCH(title, author, isbn, ddc_classification, subjects) AGAINST(? IN BOOLEAN MODE)", [$searchTerm]);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        $records = $query->paginate($request->query('per_page', 20));

        return response()->json([
            'status' => 'success',
            'data' => $records
        ]);
    }

    /**
     * AI-Assisted MARC21 & DDC Auto-Cataloguing using Gemini API
     */
    public function generateAiMetadata(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title_or_isbn' => 'required|string|min:3'
        ]);

        $metadata = $this->aiService->catalogBook($validated['title_or_isbn']);

        return response()->json([
            'status' => 'success',
            'data' => $metadata
        ]);
    }
}`;

  const mysqlSchemaDdl = `-- ========================================================
-- PLiMS V4.1.1 PK edition - Enterprise MySQL 8.0 DDL Schema
-- Standard: MARC21, RDA, DDC 23rd Edition, Z39.50, OAI-PMH
-- ========================================================

CREATE DATABASE IF NOT EXISTS \`plims_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`plims_db\`;

-- 1. Branches & Campuses
CREATE TABLE IF NOT EXISTS \`branches\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`code\` VARCHAR(50) UNIQUE NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`address\` TEXT NULL,
  \`phone\` VARCHAR(50) NULL,
  \`email\` VARCHAR(100) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Users / Patrons / Staff (RBAC)
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`member_code\` VARCHAR(100) UNIQUE NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) UNIQUE NOT NULL,
  \`password\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('SUPER_ADMIN','SUPERINTENDENT','HEAD_LIBRARIAN','SENIOR_LIBRARIAN','ASSISTANT_LIBRARIAN','CATALOGER','CIRCULATION_OFFICER','ACQUISITION_OFFICER','FACULTY','STUDENT','RESEARCH_SCHOLAR','GUEST') NOT NULL DEFAULT 'STUDENT',
  \`department\` VARCHAR(150) DEFAULT 'General',
  \`designation\` VARCHAR(150) DEFAULT 'Member',
  \`branch_id\` BIGINT UNSIGNED NULL,
  \`phone\` VARCHAR(50) NULL,
  \`status\` ENUM('ACTIVE','SUSPENDED','EXPIRED','BLOCKED') DEFAULT 'ACTIVE',
  \`rfid_tag\` VARCHAR(100) UNIQUE NULL,
  \`qr_code_data\` TEXT NULL,
  \`max_borrow_limit\` INT UNSIGNED DEFAULT 5,
  \`current_borrowed\` INT UNSIGNED DEFAULT 0,
  \`fine_pending\` DECIMAL(10,2) DEFAULT 0.00,
  \`avatar_url\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Bibliographic Catalog Records (MARC21 / DDC)
CREATE TABLE IF NOT EXISTS \`books\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`bib_id\` VARCHAR(100) UNIQUE NOT NULL,
  \`isbn\` VARCHAR(50) INDEX NULL,
  \`issn\` VARCHAR(50) NULL,
  \`title\` VARCHAR(500) NOT NULL,
  \`subtitle\` VARCHAR(500) NULL,
  \`author\` VARCHAR(255) NOT NULL,
  \`additional_authors\` JSON NULL,
  \`edition\` VARCHAR(100) DEFAULT '1st Edition',
  \`publisher_name\` VARCHAR(255) NULL,
  \`publisher_location\` VARCHAR(255) NULL,
  \`publisher_year\` INT UNSIGNED NULL,
  \`call_number\` VARCHAR(100) NOT NULL,
  \`ddc_classification\` VARCHAR(50) NOT NULL,
  \`cutter_number\` VARCHAR(50) NULL,
  \`language\` VARCHAR(50) DEFAULT 'en',
  \`category\` VARCHAR(100) NOT NULL,
  \`subjects\` JSON NULL,
  \`abstract\` TEXT NULL,
  \`total_copies\` INT UNSIGNED DEFAULT 1,
  \`available_copies\` INT UNSIGNED DEFAULT 1,
  \`location_rack\` VARCHAR(100) DEFAULT 'Main Stacks',
  \`cover_image_url\` TEXT NULL,
  \`marc21_json\` JSON NULL,
  \`is_digital\` TINYINT(1) DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FULLTEXT INDEX \`ft_catalog\` (\`title\`, \`author\`, \`isbn\`, \`ddc_classification\`, \`call_number\`)
) ENGINE=InnoDB;

-- 4. Physical Book Copies / Accession Barcodes / RFID
CREATE TABLE IF NOT EXISTS \`book_copies\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`book_id\` BIGINT UNSIGNED NOT NULL,
  \`barcode\` VARCHAR(100) UNIQUE NOT NULL,
  \`accession_number\` VARCHAR(100) UNIQUE NOT NULL,
  \`rfid_tag\` VARCHAR(100) UNIQUE NULL,
  \`branch_id\` BIGINT UNSIGNED NULL,
  \`status\` ENUM('AVAILABLE','ISSUED','RESERVED','IN_REPAIR','LOST','DAMAGED','WEAVED') DEFAULT 'AVAILABLE',
  \`condition\` ENUM('EXCELLENT','GOOD','FAIR','POOR') DEFAULT 'EXCELLENT',
  \`price\` DECIMAL(10,2) DEFAULT 0.00,
  \`date_acquired\` DATE NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`book_id\`) REFERENCES \`books\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Circulation Transactions (Loans / Returns / Renewals)
CREATE TABLE IF NOT EXISTS \`circulation_transactions\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`transaction_number\` VARCHAR(100) UNIQUE NOT NULL,
  \`copy_id\` BIGINT UNSIGNED NOT NULL,
  \`user_id\` BIGINT UNSIGNED NOT NULL,
  \`issue_date\` DATE NOT NULL,
  \`due_date\` DATE NOT NULL,
  \`return_date\` DATE NULL,
  \`renewal_count\` INT UNSIGNED DEFAULT 0,
  \`fine_amount\` DECIMAL(10,2) DEFAULT 0.00,
  \`fine_paid\` TINYINT(1) DEFAULT 0,
  \`status\` ENUM('ISSUED','RETURNED','OVERDUE','RENEWED','LOST') DEFAULT 'ISSUED',
  \`issued_by_user_id\` BIGINT UNSIGNED NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`copy_id\`) REFERENCES \`book_copies\`(\`id\`) ON DELETE RESTRICT,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. Digital Library & Institutional Repository
CREATE TABLE IF NOT EXISTS \`digital_assets\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`title\` VARCHAR(500) NOT NULL,
  \`author\` VARCHAR(255) NOT NULL,
  \`asset_type\` ENUM('EBOOK','RESEARCH_PAPER','THESIS','JOURNAL_ARTICLE','CONFERENCE_PROC','AUDIO','VIDEO','ARCHIVE') NOT NULL,
  \`file_url\` TEXT NOT NULL,
  \`file_size\` VARCHAR(50) NULL,
  \`format\` VARCHAR(50) DEFAULT 'PDF',
  \`doi_handle\` VARCHAR(100) NULL,
  \`access_level\` ENUM('PUBLIC','PATRON_ONLY','FACULTY_ONLY','RESTRICTED') DEFAULT 'PATRON_ONLY',
  \`downloads_count\` INT UNSIGNED DEFAULT 0,
  \`ocr_extracted_text\` LONGTEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;`;

  const manualSections = [
    {
      id: 'getting-started',
      title: '1. Getting Started & User Authentication',
      category: 'General',
      content:
        'PLiMS V4.1.1 PK edition supports multi-branch, role-based login. Enter your member credentials or select a role persona from the persona bar (e.g. Head Librarian, Chief Cataloger, Faculty, Student) to switch access levels. The system persists offline states automatically in localStorage.'
    },
    {
      id: 'cataloguing-guide',
      title: '2. Cataloguing, MARC21 & AI Metadata Generation',
      category: 'Cataloguing',
      content:
        'Navigate to Cataloguing -> Add New Title. Enter an ISBN or title query and click "AI MARC21 Auto-Catalog". Gemini AI extracts title, authors, publisher, DDC classification, Cutter number, and generates MARC21 tags (020, 082, 100, 245, 264, 300, 650) in seconds.'
    },
    {
      id: 'circulation-guide',
      title: '3. Circulation Engine (Check-Out, Return & Fine Waiver)',
      category: 'Circulation',
      content:
        'Use Circulation module for fast barcode scanning or RFID reader input. Scan Copy Barcode and Patron Member ID to issue books instantly. The system enforces max loan limits (e.g., 5 for students, 15 for faculty) and overdue grace periods.'
    },
    {
      id: 'opac-search',
      title: '4. OPAC & Semantic AI Search',
      category: 'OPAC',
      content:
        'The Online Public Access Catalog allows patrons to search by title, author, subject, DDC, or plain natural language. Switch between Grid, Table, and MARC views, generate academic citations (APA 7th, IEEE, MLA 9th, BibTeX), or place hold reservations.'
    },
    {
      id: 'serials-acquisitions',
      title: '5. Acquisitions & Serials Management',
      category: 'Collection',
      content:
        'Manage vendors, purchase orders, budget funds, and serials subscription patterns (e.g. Monthly, Vol/No). Track issue check-ins, binding batches, and claims for missing periodical issues.'
    },
    {
      id: 'digital-repository',
      title: '6. Institutional Digital Repository & IIIF Viewer',
      category: 'Digital',
      content:
        'Upload theses, e-books, research papers, and archival manuscripts with DOI handles and OCR text extraction. Integrated PDF reader and IIIF image viewer support full-text search and watermarking.'
    }
  ];

  const filteredManual = manualSections.filter(
    m =>
      m.title.toLowerCase().includes(searchManual.toLowerCase()) ||
      m.content.toLowerCase().includes(searchManual.toLowerCase()) ||
      m.category.toLowerCase().includes(searchManual.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Module Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BookOpen className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
              <Sparkles className="h-4 w-4" />
              <span>Enterprise System Documentation & Specs</span>
            </div>
            <h1 className="text-2xl font-bold font-serif">PLiMS V4.1.1 PK edition Architecture, Specs & User Manual</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Complete technical specification, ER diagram, database schema (DDL), Laravel 12 API controllers, React component hierarchy, deployment scripts, and operational user handbook.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => handleCopy(mysqlSchemaDdl, 'schema')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer shadow-md"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copiedSection === 'schema' ? 'Schema Copied!' : 'Copy SQL Schema'}</span>
            </button>
          </div>
        </div>

        {/* Tab Selector Nav */}
        <div className="flex items-center space-x-1 sm:space-x-2 mt-6 overflow-x-auto pb-1 border-t border-slate-800/80 pt-4 text-xs font-medium scrollbar-thin">
          <button
            onClick={() => setActiveTab('ARCH')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'ARCH' ? 'bg-indigo-600 text-white shadow-md font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Overview & Stack</span>
          </button>
          <button
            onClick={() => setActiveTab('FRONTEND')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'FRONTEND' ? 'bg-indigo-600 text-white shadow-md font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>React Components</span>
          </button>
          <button
            onClick={() => setActiveTab('BACKEND')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'BACKEND' ? 'bg-indigo-600 text-white shadow-md font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Laravel 12 Specs</span>
          </button>
          <button
            onClick={() => setActiveTab('SCHEMA')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'SCHEMA' ? 'bg-indigo-600 text-white shadow-md font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>MySQL Schema (DDL)</span>
          </button>
          <button
            onClick={() => setActiveTab('ER_DIAGRAM')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'ER_DIAGRAM' ? 'bg-indigo-600 text-white shadow-md font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>Interactive ER Diagram</span>
          </button>
          <button
            onClick={() => setActiveTab('FLOWS')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'FLOWS' ? 'bg-indigo-600 text-white shadow-md font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Workflow className="h-3.5 w-3.5" />
            <span>User & Data Flows</span>
          </button>
          <button
            onClick={() => setActiveTab('DEPLOY')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'DEPLOY' ? 'bg-indigo-600 text-white shadow-md font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Deployment Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('MANUAL')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'MANUAL' ? 'bg-indigo-600 text-white shadow-md font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>User & Admin Handbook</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Overview & Stack */}
      {activeTab === 'ARCH' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Box className="h-5 w-5 text-indigo-400" />
                <span>Enterprise Architecture Blueprint</span>
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                PLiMS V4.1.1 PK edition combines standard international cataloging protocol compliance (MARC21, RDA, DDC 23rd Edition, Z39.50, OAI-PMH) with edge offline-first service workers and serverless Gemini AI copilot intelligence.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200/90">
                  <div className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Frontend Architecture</div>
                  <div className="text-sm font-bold text-white mt-1">React 18 / Vite / TypeScript</div>
                  <p className="text-[11px] text-slate-500 mt-1">Tailwind CSS v4, Lucide React, Framer Motion, Offline PWA Service Workers & LocalStorage Queue.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200/90">
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Backend API Architecture</div>
                  <div className="text-sm font-bold text-white mt-1">Laravel 12 / PHP 8.4 REST API</div>
                  <p className="text-[11px] text-slate-500 mt-1">Sanctum RBAC tokens, Redis queue processing, MySQL 8 full-text indexing, and Gemini GenAI SDK.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-4">
              <h3 className="text-base font-bold text-white">Standards & Protocol Compliance</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200/90 text-center">
                  <div className="text-xs font-bold text-indigo-400">MARC21</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Machine Readable Cataloging</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200/90 text-center">
                  <div className="text-xs font-bold text-emerald-400">RDA</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Resource Description & Access</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200/90 text-center">
                  <div className="text-xs font-bold text-amber-400">DDC 23</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Dewey Decimal Classification</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200/90 text-center">
                  <div className="text-xs font-bold text-purple-400">Z39.50 / OAI</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Federated Search & Harvesting</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Security & Roles (RBAC)</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-500">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>12 Fine-Grained User Roles (Super Admin to Guest)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>CSRF & XSS Protection via Laravel Sanctum</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Audit Logging & Real-time Action History</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Offline Circulation Queue Data Encryption</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-3">
              <h3 className="text-sm font-bold text-white">System Authors</h3>
              <p className="text-xs text-slate-500">
                Designed, architected, and copyrighted by <strong className="text-white">Mr. Aijaz Akhter Ahmedani</strong> & <strong className="text-white">Sara Khan</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: React Components Architecture */}
      {activeTab === 'FRONTEND' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Code2 className="h-5 w-5 text-blue-400" />
              <span>React Component & State Directory</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'DashboardModule.tsx', desc: 'KPI operational metrics, chart visualizations, active widgets' },
              { name: 'CataloguingModule.tsx', desc: 'MARC21 editor, DDC classification, AI auto-catalog, ISBN lookup' },
              { name: 'CirculationModule.tsx', desc: 'Check-out/in, renewal, barcode/RFID scanner, fine calculation' },
              { name: 'OpacModule.tsx', desc: 'Online Public Access Catalog, semantic search, citation generator' },
              { name: 'DigitalLibraryModule.tsx', desc: 'Institutional repository, e-books, theses, PDF viewer' },
              { name: 'AcquisitionModule.tsx', desc: 'Vendors, purchase orders, budgets, invoice tracking' },
              { name: 'SerialsModule.tsx', desc: 'Periodicals, issue prediction patterns, routing lists' },
              { name: 'UserMemberModule.tsx', desc: 'Patron registration, RFID tag assignment, loan rules' },
              { name: 'ReportsModule.tsx', desc: 'Analytical charts, customizable report generator, activity log audit trail, CSV/PDF export' },
              { name: 'AiAssistantModule.tsx', desc: 'Gemini GenAI copilot, research assistant, policy Q&A' },
              { name: 'BarcodeGeneratorModule.tsx', desc: 'Accession barcode generator, RFID tag writer, spine label sheet' },
              { name: 'OfflineSyncBar.tsx', desc: 'Offline queue indicator, PWA sync button, local cache stats' }
            ].map((comp, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-100 border border-slate-200/90 space-y-1.5">
                <div className="text-xs font-mono font-bold text-blue-400 flex items-center justify-between">
                  <span>{comp.name}</span>
                  <span className="text-[10px] text-emerald-400 font-sans">Active</span>
                </div>
                <p className="text-xs text-slate-500">{comp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Backend Specs */}
      {activeTab === 'BACKEND' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Server className="h-5 w-5 text-emerald-400" />
                <span>Laravel 12 API Controllers & Endpoints</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Standard RESTful API routing structure for enterprise integration</p>
            </div>
            <button
              onClick={() => handleCopy(sampleLaravelControllerCode, 'laravel_code')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200/90 text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-1.5 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copiedSection === 'laravel_code' ? 'Copied!' : 'Copy Controller Code'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96">
            <code>{sampleLaravelControllerCode}</code>
          </pre>
        </div>
      )}

      {/* Tab 4: MySQL Schema DDL */}
      {activeTab === 'SCHEMA' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Database className="h-5 w-5 text-amber-400" />
                <span>MySQL 8.0 Relational DDL Script</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Complete database structure for multi-campus library automation</p>
            </div>
            <button
              onClick={() => handleCopy(mysqlSchemaDdl, 'schema_tab')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200/90 text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-1.5 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copiedSection === 'schema_tab' ? 'Copied!' : 'Copy All SQL'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-[#f1f5f9] border border-slate-200/90 text-xs font-mono text-amber-300 overflow-x-auto max-h-96">
            <code>{mysqlSchemaDdl}</code>
          </pre>
        </div>
      )}

      {/* Tab 5: Interactive ER Diagram */}
      {activeTab === 'ER_DIAGRAM' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Table className="h-5 w-5 text-purple-400" />
                <span>Entity-Relationship (ER) Diagram</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Click a entity box to highlight its foreign key relationships</p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> <span>Primary Table</span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> <span>Foreign Relation</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 p-6 rounded-xl bg-[#f1f5f9] border border-slate-200/90 relative overflow-x-auto min-h-[400px] flex items-center justify-center">
              {/* Relational Box Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {[
                  {
                    id: 'branches',
                    title: 'BRANCHES',
                    fields: ['id (PK)', 'code (UNIQUE)', 'name', 'phone', 'email']
                  },
                  {
                    id: 'users',
                    title: 'USERS / PATRONS',
                    fields: ['id (PK)', 'member_code (UNIQUE)', 'name', 'email', 'role', 'branch_id (FK)', 'rfid_tag']
                  },
                  {
                    id: 'books',
                    title: 'BOOKS (BIBLIOGRAPHIC)',
                    fields: ['id (PK)', 'bib_id (UNIQUE)', 'isbn', 'title', 'author', 'ddc_classification', 'call_number']
                  },
                  {
                    id: 'book_copies',
                    title: 'BOOK_COPIES (ITEMS)',
                    fields: ['id (PK)', 'book_id (FK)', 'barcode (UNIQUE)', 'accession_number', 'branch_id (FK)', 'status']
                  },
                  {
                    id: 'circulation_transactions',
                    title: 'CIRCULATION_TRANSACTIONS',
                    fields: ['id (PK)', 'copy_id (FK)', 'user_id (FK)', 'issue_date', 'due_date', 'status', 'fine_amount']
                  },
                  {
                    id: 'digital_assets',
                    title: 'DIGITAL_ASSETS',
                    fields: ['id (PK)', 'title', 'asset_type', 'file_url', 'doi_handle', 'downloads_count']
                  }
                ].map(tbl => {
                  const isSelected = selectedTableEr === tbl.id;
                  return (
                    <div
                      key={tbl.id}
                      onClick={() => setSelectedTableEr(tbl.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/80 border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105'
                          : 'bg-slate-100 border-slate-200/90 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold font-mono text-white flex items-center justify-between pb-2 border-b border-slate-200/90">
                        <span>{tbl.title}</span>
                        <Key className="h-3 w-3 text-amber-400" />
                      </div>
                      <ul className="mt-2 space-y-1 text-[11px] font-mono text-slate-500">
                        {tbl.fields.map((fld, i) => (
                          <li key={i} className="truncate">
                            {fld.includes('(PK)') ? (
                              <strong className="text-amber-400">{fld}</strong>
                            ) : fld.includes('(FK)') ? (
                              <span className="text-emerald-400 font-semibold">{fld}</span>
                            ) : (
                              <span>{fld}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200/90 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Relationship Details</h3>
              {selectedTableEr ? (
                <div className="text-xs text-slate-500 space-y-2">
                  <div className="font-semibold text-indigo-400 uppercase">{selectedTableEr}</div>
                  {selectedTableEr === 'books' && (
                    <p>1-to-Many relationship with <strong className="text-white">book_copies</strong>. Each bibliographic record can have multiple physical copies with unique barcodes.</p>
                  )}
                  {selectedTableEr === 'book_copies' && (
                    <p>Belongs to <strong className="text-white">books</strong> (FK: book_id) and assigned to a <strong className="text-white">branches</strong> (FK: branch_id).</p>
                  )}
                  {selectedTableEr === 'circulation_transactions' && (
                    <p>Connects a <strong className="text-white">book_copies</strong> item with a <strong className="text-white">users</strong> patron to log issue, due, return, and fine amounts.</p>
                  )}
                  {selectedTableEr === 'users' && (
                    <p>Patron profile linked to <strong className="text-white">branches</strong> and referenced in circulation loans and holds.</p>
                  )}
                  {selectedTableEr === 'branches' && (
                    <p>Master multi-campus library location table referencing local copies and user enrollments.</p>
                  )}
                  {selectedTableEr === 'digital_assets' && (
                    <p>Standalone or linked e-resource table for institutional repository, theses, and journals.</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Select a table box to view detailed key links.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: User & Data Flows */}
      {activeTab === 'FLOWS' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Workflow className="h-5 w-5 text-indigo-400" />
            <span>Core Navigation & Circulation Data Flow</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-slate-100 border border-slate-200/90 space-y-3">
              <div className="text-xs font-bold text-blue-400 uppercase">1. Cataloguing & AI Auto-Tagging</div>
              <p className="text-xs text-slate-500">
                Librarian submits ISBN or Title → Gemini API generates MARC21 JSON & DDC classification → Record saved in MySQL & local browser cache → Copies generated with accession barcodes.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-slate-100 border border-slate-200/90 space-y-3">
              <div className="text-xs font-bold text-emerald-400 uppercase">2. Circulation Loan Workflow</div>
              <p className="text-xs text-slate-500">
                Patron scans RFID or Member Card → Copy barcode scanned → Validation check (Loan limit & fines) → Due date calculated → Transaction logged & synced when online.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-slate-100 border border-slate-200/90 space-y-3">
              <div className="text-xs font-bold text-amber-400 uppercase">3. OPAC & AI Research Search</div>
              <p className="text-xs text-slate-500">
                Patron searches keyword → Full-text match + AI Semantic ranking → Item status checked → Citation generated (APA/IEEE) → Hold reservation option triggered.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Deployment Guide */}
      {activeTab === 'DEPLOY' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <span>Production Deployment Guide</span>
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200/90 space-y-2">
              <div className="text-xs font-bold text-white">1. Local & Container Setup (Vite + React)</div>
              <pre className="p-3 rounded-lg bg-[#f1f5f9] text-xs font-mono text-slate-300">
                npm install{'\n'}npm run build{'\n'}npm run preview
              </pre>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200/90 space-y-2">
              <div className="text-xs font-bold text-white">2. Environment Configuration (.env)</div>
              <pre className="p-3 rounded-lg bg-[#f1f5f9] text-xs font-mono text-emerald-400">
                GEMINI_API_KEY=your_gemini_api_key_here{'\n'}
                DATABASE_URL=mysql://root:password@localhost:3306/plims_db
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: User & Admin Handbook */}
      {activeTab === 'MANUAL' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-indigo-400" />
                <span>User & Administrator Manual</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Operational procedures for librarians, catalogers, and system administrators</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search manual topics..."
                value={searchManual}
                onChange={e => setSearchManual(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 border border-slate-200/90 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredManual.map(sec => (
              <div key={sec.id} className="p-5 rounded-xl bg-slate-100 border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{sec.title}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-semibold uppercase">
                    {sec.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{sec.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
