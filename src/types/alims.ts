export type AppTheme = 'pakistan-flag' | 'pakistan-dark' | 'light-clean' | 'dark-slate' | 'high-contrast';

export interface LibraryScheme {
  id: string;
  name: string;
  code: string;
  marcTag: string;
  prefix: string;
  description: string;
  isDefault?: boolean;
}

export type UserRole =
  | 'SUPER_ADMIN'
  | 'SYSTEM_ADMIN'
  | 'PRINCIPAL'
  | 'CHIEF_LIBRARIAN'
  | 'LIBRARIAN'
  | 'ASSISTANT_LIBRARIAN'
  | 'ACCOUNTS_OFFICER'
  | 'FACULTY'
  | 'STUDENT'
  | 'RESEARCH_SCHOLAR'
  | 'GUEST';

export type StaffPower =
  | 'CAN_CATALOG'
  | 'CAN_CIRCULATE'
  | 'CAN_ACQUIRE'
  | 'CAN_STOCK_AUDIT'
  | 'CAN_MANAGE_USERS'
  | 'CAN_CLEAR_FINES'
  | 'CAN_SYSTEM_CONFIG'
  | 'CAN_GENERATE_BARCODES'
  | 'CAN_DIGITAL_ASSETS'
  | 'CAN_INTER_LIBRARY_TRANSFER';

export interface PowerAssignmentLog {
  id: string;
  timestamp: string;
  assignedBy: string;
  targetStaffId: string;
  targetStaffName: string;
  powersGranted: StaffPower[];
  notes?: string;
}

export interface InterLibraryTransfer {
  id: string;
  copyBarcode: string;
  bookTitle: string;
  fromBranch: string;
  toBranch: string;
  requestedBy: string;
  requestDate: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'REJECTED';
  approvedBy?: string;
}

export interface UserProfile {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  designation?: string;
  phone?: string;
  mobileNo?: string;
  officeNo?: string;
  location?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  joinedDate?: string;
  expiryDate?: string;
  maxBorrowLimit: number;
  activeBorrowCount?: number;
  currentBorrowed?: number;
  finePending: number;
  rfidTag?: string;
  qrCodeData?: string;
  avatarUrl?: string;
  staffPowers?: StaffPower[];
  assignedBranch?: string;
  password?: string;
  authProvider?: 'LOCAL' | 'GOOGLE';
  googleSub?: string;
  googleEmailVerified?: boolean;
  googleAccountLinkedAt?: string;
}

export interface BookRecord {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  department: string;
  callNumber: string;
  edition: string;
  publisherName: string;
  publisherLocation: string;
  publisherYear: number;
  pageCount: number;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  subjects: string[];
  coverUrl: string;
  format: 'HARDCOVER' | 'PAPERBACK' | 'DIGITAL';
  accessionNumber?: string;
  copyNumber?: string;
  copyNo?: string;
  description?: string;
  generalNotes?: string;
  notes?: string;
  marcTags?: Record<string, string>;
}

export interface BookCopy {
  id: string;
  bookId: string;
  accessionNumber: string;
  barcode: string;
  rfidUid?: string;
  rfidTag?: string;
  status: 'AVAILABLE' | 'ISSUED' | 'RESERVED' | 'UNDER_REPAIR' | 'LOST';
  branchLocation: string;
}

export interface CirculationTransaction {
  id: string;
  transactionNumber?: string;
  accessionNumber?: string;
  copyBarcode?: string;
  bookTitle: string;
  memberId?: string;
  memberCode?: string;
  memberName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'LOST';
  renewCount?: number;
  renewalCount?: number;
  fineAmount?: number;
  finePaid?: boolean;
}

export interface BookReservation {
  id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  reservationDate: string;
  expiryDate: string;
  status: 'PENDING' | 'READY' | 'CANCELLED' | 'FULFILLED';
  priorityQueue: number;
}

export interface DigitalAsset {
  id: string;
  title: string;
  author: string;
  fileType: 'PDF' | 'EPUB' | 'AUDIO' | 'JOURNAL' | 'THESIS' | 'DOCX' | 'PPTX' | 'VIDEO' | string;
  category: string;
  fileSize: string;
  accessLevel: 'OPEN' | 'STUDENT_ONLY' | 'FACULTY_ONLY';
  downloadUrl: string;
  department?: string;
  year?: number;
  doi?: string;
  abstract?: string;
  ocrStatus?: 'INDEXED' | 'SEARCHABLE' | 'PROCESSING';
  downloadsCount?: number;
  keywords?: string[];
}

export interface OverdueNoticeDraft {
  id: string;
  transactionId: string;
  memberId?: string;
  memberCode?: string;
  memberName: string;
  memberEmail: string;
  bookTitle: string;
  accessionNumber?: string;
  dueDate: string;
  overdueDays: number;
  fineAmount: number;
  subject: string;
  body: string;
  status: 'DRAFT_PENDING_REVIEW' | 'APPROVED' | 'DISPATCHED' | 'DISCARDED';
  generatedAt: string;
  dispatchedAt?: string;
}

export interface SystemSettings {
  libraryName: string;
  institutionName: string;
  branches: string[];
  maxIssueDaysStudent?: number;
  maxBorrowDaysStudent?: number;
  maxIssueDaysFaculty?: number;
  maxBorrowDaysFaculty?: number;
  finePerDay: number;
  gracePeriodDays?: number;
  autoSendEmailAlerts: boolean;
  enableRfidGates: boolean;
  currencySymbol: string;
  libraryPlace?: string;
  libraryLocation?: string;
  libraryEmail?: string;
  libraryMobileNo?: string;
  libraryOfficeNo?: string;
  websiteUrl?: string;
  openingHours?: string;
  chiefLibrarianName?: string;
  postalCode?: string;
  customWelcomeNote?: string;
}

export type LibrarySettings = SystemSettings;

