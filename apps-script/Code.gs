/**
 * ============================================================================
 * קוד Google Apps Script - צד השרת של אפליקציית התקבולים.
 *
 * הוראות התקנה:
 * 1. פתחו את גיליון ה-Google Sheets שבו יישמרו התקבולים.
 * 2. תפריט "הרחבות" (Extensions) > "Apps Script".
 * 3. מחקו את הקוד הקיים והדביקו לתוכו את כל הקובץ הזה.
 * 4. ודאו שבגיליון קיים טאב (Sheet) בשם "תקבולים" עם שורת כותרות כבשורה 1 בלבד
 *    (הסקריפט מוסיף כותרות אוטומטית אם הטאב ריק).
 * 5. עדכנו למטה את OFFICE_EMAIL לכתובת המייל האמיתית של המזכירות.
 * 6. "פריסה" (Deploy) > "פריסה חדשה" (New deployment) > סוג: "אפליקציית אתר" (Web app).
 *    - Execute as: Me
 *    - Who has access: Anyone (כדי שהאפליקציה תוכל לשלוח נתונים בלי התחברות לגוגל)
 * 7. העתיקו את כתובת ה-URL שמתקבלת (מסתיימת ב-/exec) והדביקו אותה כערך
 *    CONFIG.APPS_SCRIPT_URL בקובץ js/config.js של האפליקציה.
 * ============================================================================
 */

const SHEET_NAME = "תקבולים";
const OFFICE_EMAIL = "office@example.com"; // *** יש להחליף בכתובת המייל האמיתית של המזכירות ***

const COLUMNS = [
  "מזהה ייחודי",
  "תאריך",
  "שעה",
  "משווקת",
  "פאנית מפנה",
  "על שם מי",
  "שם לקוחה",
  "סכום",
  "תעודת זהות",
  "אמצעי תשלום",
  "סטטוס תשלום",
  "פרטי תשלום נוספים",
  "מועד יצירה במכשיר",
  "מועד קבלה בשרת",
];

function doPost(e) {
  let result;
  try {
    const data = JSON.parse(e.postData.contents);
    result = saveReceiptToSheet(data);
  } catch (err) {
    result = { success: false, error: String(err) };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveReceiptToSheet(data) {
  if (!data || !data.id) {
    return { success: false, error: "missing-id" };
  }

  const sheet = getOrCreateSheet();
  const existingRow = findRowById(sheet, data.id);
  const receivedAt = new Date();
  const rowValues = buildRowValues(data, receivedAt);

  let isNew = false;
  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
    isNew = true;
  }

  // שולחים מייל רק בפעם הראשונה שהדיווח נקלט, כדי למנוע כפילויות אם הלקוח שולח שוב
  if (isNew) {
    sendReceiptEmails(data);
  }

  return { success: true, duplicate: !isNew };
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
  }
  return sheet;
}

function findRowById(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2; // +2 כי מתחילים משורה 2 (אחרי כותרות) והאינדקס מתחיל מ-0
  }
  return null;
}

function buildRowValues(data, receivedAt) {
  const created = data.createdAt ? new Date(data.createdAt) : receivedAt;
  return [
    data.id,
    Utilities.formatDate(created, Session.getScriptTimeZone(), "dd/MM/yyyy"),
    Utilities.formatDate(created, Session.getScriptTimeZone(), "HH:mm"),
    data.salesperson || "",
    data.referringPania || "",
    data.onWhoseBehalf || "",
    data.customerName || "",
    data.amount || 0,
    data.idNumber || "",
    data.paymentMethod || "",
    data.paymentStatus || "",
    formatPaymentDetails(data),
    data.createdAt || "",
    receivedAt.toISOString(),
  ];
}

function formatPaymentDetails(data) {
  const details = data.paymentDetails || {};
  if (data.paymentMethod === "צ'קים" && details.checks) {
    return details.checks
      .map((c) => `${c.amount} ₪ לפירעון ב-${c.dueDate}`)
      .join(" | ");
  }
  if (data.paymentMethod === "העברה בנקאית" && details.transferDate) {
    return `בוצעה בתאריך ${details.transferDate}`;
  }
  if (data.paymentMethod === "אשראי") {
    const parts = [];
    if (details.mode) parts.push(`מצב: ${details.mode}`);
    if (details.confirmationCode) parts.push(`מזהה עסקה: ${details.confirmationCode}`);
    if (details.last4) parts.push(`4 ספרות אחרונות: ${details.last4}`);
    return parts.join(" | ");
  }
  return "";
}

function sendReceiptEmails(data) {
  const subject = `תקבול חדש - ${data.salesperson || ""} - ${data.amount || 0} ₪`;
  const body = buildEmailBody(data);

  const recipients = [OFFICE_EMAIL];
  if (data.salespersonEmail) recipients.push(data.salespersonEmail);

  recipients.forEach((address) => {
    try {
      MailApp.sendEmail(address, subject, body);
    } catch (err) {
      // אם שליחת מייל נכשלת, לא רוצים שזה יפיל את כל הבקשה - הנתונים כבר נשמרו בגיליון
    }
  });
}

function buildEmailBody(data) {
  const details = data.paymentDetails || {};
  const lines = [
    `מספר דיווח: ${data.id}`,
    `משווקת: ${data.salesperson || ""}`,
    `פאנית מפנה: ${data.referringPania || ""}`,
    `על שם מי התקבול: ${data.onWhoseBehalf || ""}${data.customerName ? " - " + data.customerName : ""}`,
    `סכום: ${data.amount || 0} ₪`,
    `אמצעי תשלום: ${data.paymentMethod || ""}`,
  ];

  const detailsText = formatPaymentDetails(data);
  if (detailsText) lines.push(`פרטים נוספים: ${detailsText}`);

  lines.push(`תאריך ושעה: ${data.createdAt || ""}`);
  lines.push(`סטטוס תשלום: ${data.paymentStatus || ""}`);

  return lines.join("\n");
}
