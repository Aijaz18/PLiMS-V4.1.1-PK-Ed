// Library Circulation Slip Printer and Formatter Utility
export interface SlipReceiptData {
  type: 'ISSUE' | 'RETURN';
  receiptNumber: string;
  libraryName: string;
  institutionName: string;
  libraryLocation?: string;
  libraryPhone?: string;
  bookTitle: string;
  accessionNumber: string;
  copyBarcode?: string;
  callNumber?: string;
  patronName: string;
  memberCode: string;
  patronRole?: string;
  patronDepartment?: string;
  issueDate: string;
  dueDate?: string;
  returnDate?: string;
  overdueDays?: number;
  fineAmount?: number;
  fineStatus?: string;
  librarianName?: string;
  finePerDay?: number;
}

export function generateSlipText(data: SlipReceiptData): string {
  const isIssue = data.type === 'ISSUE';
  const divider = '==================================================';
  const subDivider = '--------------------------------------------------';

  const lines = [
    divider,
    `       ${(data.libraryName || 'CENTRAL ACADEMIC LIBRARY').toUpperCase()}`,
    `       ${(data.institutionName || 'INSTITUTION OF HIGHER LEARNING').toUpperCase()}`,
    data.libraryLocation ? `       ${data.libraryLocation}` : '',
    data.libraryPhone ? `       Tel: ${data.libraryPhone}` : '',
    divider,
    isIssue ? '       *** OFFICIAL BOOK ISSUE SLIP ***' : '       *** OFFICIAL BOOK RETURN RECEIPT ***',
    subDivider,
    `Receipt No   : ${data.receiptNumber}`,
    `Date & Time  : ${new Date().toLocaleString()}`,
    `Librarian    : ${data.librarianName || 'Circulation Desk Officer'}`,
    subDivider,
    'BORROWER DETAILS:',
    `  Name       : ${data.patronName}`,
    `  Member Code: ${data.memberCode}`,
    data.patronRole ? `  Role       : ${data.patronRole}` : '',
    data.patronDepartment ? `  Department : ${data.patronDepartment}` : '',
    subDivider,
    'BOOK PARTICULARS:',
    `  Title      : ${data.bookTitle}`,
    `  Accession #: ${data.accessionNumber}`,
    data.copyBarcode ? `  Barcode    : ${data.copyBarcode}` : '',
    data.callNumber ? `  Call No    : ${data.callNumber}` : '',
    subDivider,
    'CIRCULATION STATUS:',
    `  Issue Date : ${data.issueDate}`,
    isIssue && data.dueDate ? `  DUE DATE   : >>> ${data.dueDate} <<< [IMPORTANT]` : '',
    !isIssue && data.returnDate ? `  Return Date: ${data.returnDate}` : '',
    !isIssue && data.overdueDays !== undefined && data.overdueDays > 0 ? `  Overdue    : ${data.overdueDays} Days Late` : '',
    !isIssue && data.fineAmount !== undefined ? `  Fine Status: ${data.fineStatus || `${data.fineAmount} PKR`}` : '',
    subDivider,
    isIssue
      ? 'LIBRARY POLICY:\n  1. Please return on or before the due date.\n  2. Overdue fine: PKR ' + (data.finePerDay || 50) + '/day after due date.\n  3. Lost or damaged books must be replaced/compensated.'
      : 'STATUS: Book received in catalog inventory.\nThank you for using the Library Circulation Services.',
    divider,
    '         Authorized Signature / Stamp',
    '\n\n       _______________________________',
    divider
  ];

  return lines.filter(line => line !== '').join('\n');
}

export function printSlipInNewWindow(data: SlipReceiptData): boolean {
  const isIssue = data.type === 'ISSUE';
  const receiptTitle = isIssue ? 'Library Issue Slip' : 'Library Return Receipt';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${receiptTitle} - ${data.accessionNumber}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; background: #fff; }
      .no-print { display: none !important; }
      .slip-card { box-shadow: none !important; border: 1px dashed #000 !important; width: 100% !important; max-width: 100% !important; }
    }
    body {
      font-family: 'Courier New', Courier, monospace, sans-serif;
      background: #f4f4f5;
      margin: 0;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #111;
    }
    .no-print {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
    }
    .btn {
      padding: 10px 20px;
      font-size: 14px;
      font-weight: bold;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-family: system-ui, sans-serif;
    }
    .btn-print { background: #059669; color: white; }
    .btn-close { background: #52525b; color: white; }
    .slip-card {
      background: #fff;
      width: 320px;
      max-width: 100%;
      padding: 20px;
      border: 1px solid #ccc;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      font-size: 12px;
      line-height: 1.4;
    }
    .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 12px; margin-bottom: 12px; }
    .header h2 { margin: 0 0 4px; font-size: 15px; font-weight: bold; }
    .header h3 { margin: 0 0 4px; font-size: 12px; color: #444; font-weight: normal; }
    .badge {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 8px;
      background: #000;
      color: #fff;
      font-weight: bold;
      font-size: 11px;
      border-radius: 3px;
    }
    .section { border-bottom: 1px dashed #bbb; padding: 8px 0; }
    .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; color: #222; }
    .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
    .row-label { color: #555; }
    .row-val { font-weight: bold; text-align: right; word-break: break-word; max-width: 60%; }
    .highlight-box {
      background: #f0fdf4;
      border: 1px solid #86efac;
      padding: 8px;
      margin: 8px 0;
      border-radius: 4px;
      text-align: center;
    }
    .highlight-due {
      font-size: 14px;
      font-weight: bold;
      color: #065f46;
    }
    .barcode-display {
      text-align: center;
      margin: 15px 0 10px;
      font-family: monospace;
      letter-spacing: 4px;
      font-size: 14px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #666;
      margin-top: 15px;
      border-top: 1px dashed #000;
      padding-top: 10px;
    }
    .signature-box {
      margin-top: 25px;
      border-top: 1px solid #000;
      text-align: center;
      padding-top: 4px;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn btn-print" onclick="window.print()">🖨️ Print Slip Now</button>
    <button class="btn btn-close" onclick="window.close()">✖ Close Window</button>
  </div>

  <div class="slip-card">
    <div class="header">
      <h2>${data.libraryName || 'CENTRAL ACADEMIC LIBRARY'}</h2>
      <h3>${data.institutionName || 'INSTITUTION OF HIGHER LEARNING'}</h3>
      ${data.libraryLocation ? `<div style="font-size:10px; color:#666;">${data.libraryLocation}</div>` : ''}
      <div class="badge">${isIssue ? 'BOOK ISSUE SLIP' : 'BOOK RETURN RECEIPT'}</div>
    </div>

    <div class="section">
      <div class="row"><span class="row-label">Slip No:</span><span class="row-val">${data.receiptNumber}</span></div>
      <div class="row"><span class="row-label">Date:</span><span class="row-val">${new Date().toLocaleDateString()}</span></div>
      <div class="row"><span class="row-label">Time:</span><span class="row-val">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
      <div class="row"><span class="row-label">Officer:</span><span class="row-val">${data.librarianName || 'Chief Librarian'}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Borrower Particulars</div>
      <div class="row"><span class="row-label">Name:</span><span class="row-val">${data.patronName}</span></div>
      <div class="row"><span class="row-label">Member ID:</span><span class="row-val">${data.memberCode}</span></div>
      ${data.patronRole ? `<div class="row"><span class="row-label">Role:</span><span class="row-val">${data.patronRole}</span></div>` : ''}
      ${data.patronDepartment ? `<div class="row"><span class="row-label">Dept:</span><span class="row-val">${data.patronDepartment}</span></div>` : ''}
    </div>

    <div class="section">
      <div class="section-title">Book Particulars</div>
      <div class="row"><span class="row-label">Title:</span><span class="row-val">${data.bookTitle}</span></div>
      <div class="row"><span class="row-label">Accession:</span><span class="row-val" style="color:#b45309;">${data.accessionNumber}</span></div>
      ${data.copyBarcode ? `<div class="row"><span class="row-label">Barcode:</span><span class="row-val">${data.copyBarcode}</span></div>` : ''}
      ${data.callNumber ? `<div class="row"><span class="row-label">Call No:</span><span class="row-val">${data.callNumber}</span></div>` : ''}
    </div>

    <div class="section">
      <div class="row"><span class="row-label">Issue Date:</span><span class="row-val">${data.issueDate}</span></div>
      ${isIssue && data.dueDate ? `
        <div class="highlight-box">
          <div style="font-size:10px; color:#065f46; font-weight:bold;">RETURN DUE DATE:</div>
          <div class="highlight-due">${data.dueDate}</div>
        </div>
      ` : ''}
      ${!isIssue && data.returnDate ? `
        <div class="row"><span class="row-label">Return Date:</span><span class="row-val" style="color:#0284c7;">${data.returnDate}</span></div>
        <div class="row"><span class="row-label">Fine Status:</span><span class="row-val" style="color:${data.overdueDays ? '#dc2626' : '#059669'};">${data.fineStatus || 'None'}</span></div>
      ` : ''}
    </div>

    <div class="barcode-display">
      ||| | |||| || ||| |||| |<br>
      ${data.accessionNumber}
    </div>

    <div class="signature-box">
      Authorized Librarian Stamp / Signature
    </div>

    <div class="footer">
      ${isIssue 
        ? 'Please retain this slip until the book is returned.<br>Overdue Fine: PKR ' + (data.finePerDay || 50) + ' per day.' 
        : 'Book returned & verified into catalog inventory.<br>Thank you for using the library.'}
    </div>
  </div>

  <script>
    window.onload = function() {
      // Auto open print dialog
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
`;

  try {
    const printWindow = window.open('', '_blank', 'width=450,height=650,toolbar=0,menubar=0,location=0');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      return true;
    }
  } catch (err) {
    console.error('Error opening print window:', err);
  }
  return false;
}

export function downloadSlipAsText(data: SlipReceiptData): void {
  const text = generateSlipText(data);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Library_${data.type}_Slip_${data.accessionNumber}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
