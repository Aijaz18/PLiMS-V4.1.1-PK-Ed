# PLiMS V4.1.1 PK edition Architecture Documentation
**Pakistan Library Management System (PLiMS V4.1.1 PK edition)**

---

## 1. Executive Summary

**PLiMS (Pakistan / Premier Integrated Management System v3.0)** is an enterprise-grade, international standards-compliant Library Automation and Discovery Platform. Designed for academic institutions, public library networks, research organizations, and multi-branch systems, PLiMS provides seamless cataloguing, OPAC discovery, multi-branch circulation, serials control, authority management, and AI-assisted librarian copilot capabilities.

---

## 2. High-Level System Architecture

PLiMS follows a **Full-Stack Modular Architecture** combining a fast React + Vite client-side SPA with a secure Node.js / Express backend server proxying AI workflows via the Google Gemini API.

```
+-------------------------------------------------------------------+
|                           PLiMS CLIENT                            |
|  +-------------------------------------------------------------+  |
|  |                 React 18 Single Page Application             |  |
|  |  +------------------+ +-------------------+ +------------+  |  |
|  |  |  Executive Dash  | |  OPAC NL Search   | | MARC21 RDA |  |  |
|  |  +------------------+ +-------------------+ +------------+  |  |
|  |  +------------------+ +-------------------+ +------------+  |  |
|  |  | Circulation Desk | | Digital Library   | | AI Copilot |  |  |
|  |  +------------------+ +-------------------+ +------------+  |  |
|  +-------------------------------------------------------------+  |
|  |              State Engine & LocalStorage Caching            |  |
|  +-------------------------------------------------------------+  |
+---------------------------------+---------------------------------+
                                  |
                           REST / JSON APIs
                                  |
+---------------------------------v---------------------------------+
|                       PLiMS SERVER (Express)                      |
|  +-------------------------------------------------------------+  |
|  |                    Gemini 2.5 AI Service                    |  |
|  |   - OPAC Natural Language Query Parsing                     |  |
|  |   - Automated MARC21 Bibliographic Tag Generation          |  |
|  |   - APA / MLA / Chicago Academic Citation Engine            |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
```

---

## 3. Core Component Modules

PLiMS is divided into functional, decoupled component modules located under `src/components/modules/`:

1. **Executive Dashboard (`DashboardModule.tsx`)**
   - Live telemetry on total holdings, active loans, overdue fines, and branch status.
   - Customizable widget layout stored in local state.
   - Quick branch switcher & circulation alerts.

2. **OPAC & Natural Language Discovery (`OpacModule.tsx`)**
   - Conversational AI search using Gemini 2.5 LIS parser.
   - Multi-criteria filtering (Title, Author, Call No, ISBN, LCSH Subject, Branch, Stock).
   - Display modes: Grid Cards, Detailed List, and MARC21 Table View.
   - Real-time book hold reservation modal and APA citation copier.

3. **Cataloguing & MARC21 RDA Desk (`CataloguingModule.tsx`)**
   - Full MARC21 tag editor (Leader, 008, 020, 082, 100, 245, 260/264, 300, 650, 700).
   - AI-assisted cataloguing: Automatically extracts catalog records from raw title/ISBN inputs.
   - MARC21 record removal & accession management.

4. **Circulation & Desk Control (`CirculationModule.tsx`)**
   - Real-time item check-out and check-in via barcode scanners.
   - Automated fine calculator based on loan policy rules and grace periods.
   - Inter-library loan (ILL) transfers between branches.

5. **Authority Control (`AuthorityControlModule.tsx`)**
   - Library of Congress Subject Headings (LCSH) & Personal Name authority verification.
   - Standardized cross-referencing (*See* and *See Also* linkages).

6. **Digital Library & Repository (`DigitalLibraryModule.tsx`)**
   - Digital asset repository for PDFs, EPUBs, research papers, and theses.
   - Built-in document viewer with full-text search indexing.

7. **Serials & Periodicals Control (`SerialsModule.tsx`)**
   - Management of journal subscriptions, issue claims, and binding sets.

8. **Stock Verification & Inventory Audit (`StockVerificationModule.tsx`)**
   - Automated shelf auditing via barcode scanning.
   - Identification of missing, misplaced, or damaged volumes.

9. **AI Copilot & Assistant (`AiAssistantModule.tsx`)**
   - Conversational librarian copilot providing research assistance, catalog insights, and policy answers.

10. **System Settings & Branch Management (`SettingsModule.tsx`)**
    - Multi-branch administration (+ Add / Remove Branches).
    - Circulation rules, fine rates, theme selection, and system backup management.

---

## 4. International Standards Compliance

PLiMS adheres strictly to modern Library and Information Science (LIS) standards:

- **MARC21 Bibliographic Format**: Full support for Machine-Readable Cataloging tags (001-999).
- **RDA (Resource Description and Access)**: Core element compliance for catalog records (Field 264 for publication, 336/337/338 for content/media/carrier types).
- **Dewey Decimal Classification (DDC 23rd Edition)** & **Library of Congress Classification (LCC)**: Standardized call number generation.
- **Z39.50 / SRU Protocol Compatibility**: Architecture structured for remote catalog fetching and copy cataloguing.
- **OAI-PMH (Open Archives Initiative Protocol for Metadata Harvesting)**: Ready for institutional repository indexing.
- **Multilingual Support**: Bi-directional UI supporting English (LTR), Urdu (RTL), and Chinese (LTR).

---

## 5. Deployment & Runtime Environment

- **Frontend**: Built with React 18, Vite, and Tailwind CSS.
- **Backend**: Express server running on Node.js.
- **Port Ingress**: Bound exclusively to Port 3000 (0.0.0.0 host binding).
- **Persistence**: Hybrid local persistence layer using structured browser LocalStorage with ready hooks for PostgreSQL / Cloud SQL / Firestore migration.
