// ============================================================================
// שכבת גישה לנתונים - נקודת הכניסה היחידה לשמירת תקבול.
// כל שאר הקוד קורא ל-saveReceipt() בלבד ולא נוגע ב-IndexedDB או ברשת ישירות.
// מטרת הריכוז: מעבר עתידי ל-Firebase ידרוש שינוי במקום אחד בלבד (sendReceiptToServer).
// ============================================================================

/**
 * שומרת תקבול חדש (או מעדכנת קיים) - קודם מקומית, ואז מנסה לסנכרן לשרת.
 * @param {object} receipt - אובייקט תקבול מלא (ראו app.js ליצירתו)
 */
async function saveReceipt(receipt) {
  await DB.dbPut(receipt);
  // ניסיון סנכרון מיידי - לא חוסם את זרימת המסכים, לא נכשל אם אין אינטרנט
  trySyncAll();
  return receipt;
}

/**
 * שולחת תקבול בודד לשרת (Google Apps Script -> Google Sheets).
 * זוהי הפונקציה היחידה שיודעת "איפה" נשמרים הנתונים בפועל.
 * מעבר ל-Firebase בעתיד = שינוי הגוף של הפונקציה הזו בלבד.
 */
async function sendReceiptToServer(receipt) {
  const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // נמנעים מ-preflight CORS מול Apps Script
    body: JSON.stringify(receipt),
  });
  if (!response.ok) {
    throw new Error("server-error");
  }
  const result = await response.json();
  if (!result || result.success !== true) {
    throw new Error("server-rejected");
  }
  return result;
}

const API = { saveReceipt, sendReceiptToServer };
