# PLiMS V4.1.1 PK edition Database Schema & Data Models
**Pakistan Library Management System (PLiMS V4.1.1 PK edition)**

---

## 1. Overview & Data Architecture

PLiMS utilizes a structured entity data model defined in `src/types/alims.ts`. In the primary browser environment, data is synchronized in real time with high-performance LocalStorage caching. The entity relationships are designed for seamless migration to relational databases (PostgreSQL / Cloud SQL via Drizzle ORM) or document stores (Firestore).

---

## 2. Core Entities & TypeScript Schemas

### 2.1 `BookRecord` (Bibliographic Record)
Represents a MARC21 / RDA compliant bibliographic title entry.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key (e.g. `BK-9012`) |
| `title` | `string` | Main Title ($a Tag 245) |
| `authors` | `string[]` | Primary & Secondary Authors ($a Tag 100 / 700) |
| `isbn` | `string` | ISBN-10 or ISBN-13 ($a Tag 020) |
| `callNumber` | `string` | DDC or LCC Call Number ($a Tag 082) |
| `department` | `string` | Associated Academic Department |
| `publisherName` | `string` | Publisher Name ($b Tag 264) |
| `publisherYear` | `number` | Publication Year ($c Tag 264) |
| `edition` | `string` | Edition Statement ($a Tag 250) |
| `pageCount` | `number` | Physical Description Extent ($a Tag 300) |
| `subjects` | `string[]` | LCSH Subject Headings ($a Tag 650) |
| `totalCopies` | `number` | Total Holdings Count across all branches |
| `availableCopies` | `number` | Number of copies currently on shelf |
| `shelfLocation` | `string` | Shelf Bay & Rack Location (e.g. `CS-Bay-04`) |
| `coverUrl` | `string` | Cover Image URL |
| `marcTags` | `Record<string, string>` | Raw MARC21 Tag Map (`001`, `020`, `082`, `100`, `245`, `264`, `650`) |

---

### 2.2 `BookCopy` (Physical Item Copy)
Represents an individual physical barcode-tracked copy of a book.

| Field | Type | Description |
| :--- | :--- | :--- |
| `copyId` | `string` | Primary Key (e.g. `CPY-9012-01`) |
| `bookId` | `string` | Foreign Key to `BookRecord.id` |
| `barcode` | `string` | Scannable Item Barcode (e.g. `BC-901201`) |
| `accessionNumber` | `string` | Accession Number in Register (e.g. `ACC-88219`) |
| `branch` | `string` | Branch Name (e.g. `Central Campus Library`) |
| `shelfLocation` | `string` | Specific Shelf Rack |
| `status` | `'AVAILABLE' \| 'LOANED' \| 'RESERVED' \| 'MAINTENANCE' \| 'LOST'` | Current Copy Status |
| `condition` | `'NEW' \| 'GOOD' \| 'FAIR' \| 'DAMAGED'` | Physical Item Condition |

---

### 2.3 `UserProfile` (Patron & Staff User)
Represents library members, librarians, and system administrators.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key (e.g. `USR-101`) |
| `name` | `string` | Full Member Name |
| `email` | `string` | Contact Email Address |
| `barcode` | `string` | Scannable Patron Card Barcode |
| `role` | `'SUPER_ADMIN' \| 'CHIEF_LIBRARIAN' \| 'CATALOGUER' \| 'CIRCULATION_STAFF' \| 'MEMBER'` | Role-Based Access Control |
| `department` | `string` | Department / Faculty |
| `branch` | `string` | Primary Branch Assignment |
| `maxLoanLimit` | `number` | Maximum allowed simultaneous loans (e.g. 5) |
| `activeLoansCount` | `number` | Current active loans count |
| `outstandingFines` | `number` | Balance of unpaid fines (PKR) |
| `photoUrl` | `string` | Patron Avatar / ID Photo |

---

### 2.4 `CirculationTransaction`
Tracks check-out, check-in, renewal, and fine accruals.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key (e.g. `TX-5001`) |
| `bookId` | `string` | Foreign Key to `BookRecord.id` |
| `copyId` | `string` | Foreign Key to `BookCopy.copyId` |
| `memberId` | `string` | Foreign Key to `UserProfile.id` |
| `issueDate` | `string` | ISO Date String of Issue |
| `dueDate` | `string` | ISO Date String of Due Date |
| `returnDate` | `string \| null` | ISO Date String of Return (or null) |
| `branch` | `string` | Branch where transaction occurred |
| `fineAmount` | `number` | Calculated overdue fine (PKR) |
| `status` | `'ACTIVE' \| 'RETURNED' \| 'OVERDUE' \| 'LOST'` | Transaction Status |

---

### 2.5 `InterLibraryTransfer`
Tracks book movements between library branches.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key (e.g. `TR-301`) |
| `bookId` | `string` | Foreign Key to `BookRecord.id` |
| `fromBranch` | `string` | Origin Branch |
| `toBranch` | `string` | Destination Branch |
| `requestDate` | `string` | ISO Date String |
| `status` | `'PENDING' \| 'IN_TRANSIT' \| 'COMPLETED' \| 'CANCELLED'` | Transfer Status |

---

### 2.6 `SystemSettings`
Global system configuration and policy parameters.

| Field | Type | Description |
| :--- | :--- | :--- |
| `libraryName` | `string` | System Name |
| `branches` | `string[]` | List of Active Library Branches |
| `fineRatePerDay` | `number` | Overdue fine rate per day (PKR) |
| `gracePeriodDays` | `number` | Days before fine accrual begins |
| `defaultLoanPeriodDays` | `number` | Standard loan period for members |
| `theme` | `'DARK_PREMIUM' \| 'LIGHT_CLASSIC' \| 'TEAL_EMERALD'` | System Theme |
| `aiParsingEnabled` | `boolean` | Toggle Gemini AI search parsing |

---

## 3. LocalStorage Caching Strategy

The following browser local storage keys persist state across browser reloads:

- `plims_books_v3`: Serialized array of `BookRecord` entities.
- `plims_users_v3`: Serialized array of `UserProfile` entities.
- `plims_circulation_v3`: Serialized array of `CirculationTransaction` entities.
- `plims_transfers_v3`: Serialized array of `InterLibraryTransfer` entities.
- `plims_settings_v3`: Serialized `SystemSettings` object.

---

## 4. Relational Database Migration Schema (PostgreSQL / Drizzle ORM)

```sql
-- Books Table
CREATE TABLE books (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  authors TEXT[] NOT NULL,
  isbn VARCHAR(32) NOT NULL,
  call_number VARCHAR(64) NOT NULL,
  department VARCHAR(128),
  publisher_name VARCHAR(128),
  publisher_year INT,
  available_copies INT DEFAULT 0,
  total_copies INT DEFAULT 0,
  marc_tags JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  email VARCHAR(128) UNIQUE NOT NULL,
  role VARCHAR(32) NOT NULL,
  branch VARCHAR(128) NOT NULL,
  outstanding_fines NUMERIC(10,2) DEFAULT 0.00
);

-- Circulation Table
CREATE TABLE circulation_transactions (
  id VARCHAR(64) PRIMARY KEY,
  book_id VARCHAR(64) REFERENCES books(id),
  member_id VARCHAR(64) REFERENCES users(id),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  fine_amount NUMERIC(10,2) DEFAULT 0.00,
  status VARCHAR(32) NOT NULL
);
```
