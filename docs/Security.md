# PLiMS V4.1.1 PK edition Security & Access Control Specification
**Pakistan Library Management System (PLiMS V4.1.1 PK edition)**

---

## 1. Overview & Security Architecture

PLiMS implements defense-in-depth security to protect sensitive patron records, system catalog data, circulation financial logs, and API credentials.

---

## 2. Role-Based Access Control (RBAC)

User privileges are enforced at both the UI component and service operational levels according to user roles:

| Role | Catalog View | OPAC Holds | Circulation Desk | Catalog Editing | Fine Collection | System Settings |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | Full | Full | Full | Full | Full | Full |
| **Chief Librarian** | Full | Full | Full | Full | Full | Full |
| **Cataloguer** | Full | Full | Read-Only | Full | Read-Only | Read-Only |
| **Circulation Staff** | Full | Full | Full | Read-Only | Full | Read-Only |
| **Member / Student** | Read-Only | Self Holds | None | None | None | None |

---

## 3. API Key & Server Security

- **Server-Side Proxy Architecture**: All Google Gemini API keys (`process.env.GEMINI_API_KEY`) reside strictly on the Node.js / Express backend server. They are never exposed in browser client JavaScript bundles or `VITE_` public variables.
- **Lazy SDK Initialization**: The Google GenAI client is lazily instantiated inside API route handlers to prevent service crashes if environmental variables are missing or misconfigured during startup.
- **Port Ingress Controls**: All external HTTP requests are routed through port 3000 via container ingress reverse proxies.

---

## 4. Patron Data Privacy & PII Protection

- **Personally Identifiable Information (PII)**: Patron names, emails, phone numbers, and fine balances are restricted to authorized circulation staff and administrative users.
- **Anonymized Historical Circulation Records**: Once a borrowed library item is returned and all applicable fines are paid, active transaction references are decoupled from public OPAC views to protect reading history privacy.
- **Local Storage Encryption**: Stored LocalStorage cache keys are sanitized against XSS execution.

---

## 5. Input Validation & Sanitization

- **Barcode & Accession Sanitization**: Barcode scanner inputs are filtered against SQL/script injection attempts and validated against regex formats (e.g. `BC-[0-9]{6}`).
- **ISBN Checksum Validation**: Cataloguing inputs validate standard ISBN-10 and ISBN-13 modulo checksums before record persistence.
- **DDC & MARC Validation**: MARC21 tag key format checks ensure Leader, 008, 020, 082, 100, 245 tags maintain correct subfield delimiters (`$a`, `$b`, `$c`).

---

## 6. Audit Logging & System Backups

- **Activity Trail**: System modifications (e.g., adding/deleting books, branch removals, fine collections, role updates) are logged in the administrative audit feed.
- **Immutable JSON Backups**: Admins can export encrypted JSON state snapshots from `SettingsModule` for disaster recovery.
