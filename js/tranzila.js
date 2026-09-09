// ============================================================================
// אינטגרציית סליקה עם Tranzila.
// ה-URL עצמו מוגדר ב-CONFIG.TRANZILA_TERMINAL_URL (Placeholder עד קבלת הקישור הסופי).
// פרטי הכרטיס המלאים מוזנים אך ורק בדף של Tranzila - לעולם לא ב-Sheets/בשרת שלנו.
// ============================================================================

/**
 * בונה קישור למסוף הסליקה עבור דיווח נתון, כולל הפניה חזרה לאפליקציה.
 * הפרמטרים המדויקים (שמות שדות ה-Query) יש לאמת מול טרנזילה בעת קבלת הקישור האמיתי.
 */
function buildTranzilaUrl(receipt) {
  const returnUrl = new URL(window.location.href);
  returnUrl.search = ""; // מנקים פרמטרים קודמים
  returnUrl.searchParams.set("tranzilaReturn", "1");
  returnUrl.searchParams.set("receiptId", receipt.id);

  const url = new URL(CONFIG.TRANZILA_TERMINAL_URL);
  url.searchParams.set("sum", receipt.amount);
  url.searchParams.set("currency", "1");
  url.searchParams.set("success_url_address", returnUrl.toString());
  url.searchParams.set("fail_url_address", returnUrl.toString());
  return url.toString();
}

/** שולח את הדפדפן למסוף הסליקה עבור הדיווח הנתון */
function goToTranzilaTerminal(receipt) {
  window.location.href = buildTranzilaUrl(receipt);
}

/**
 * בודקת אם חזרנו זה עתה ממסוף הסליקה, ואם כן מחזירה את מזהה הדיווח הרלוונטי.
 * הבדיקה מסתמכת על פרמטרים ב-URL (tranzilaReturn, receiptId, ותוצאת הסליקה אם קיימת).
 */
function checkTranzilaReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("tranzilaReturn") !== "1") return null;
  const receiptId = params.get("receiptId");
  if (!receiptId) return null;

  // פרמטרים נפוצים בתגובת טרנזילה: Response (000 = הצלחה), ConfirmationCode, index (4 ספרות אחרונות)
  const responseCode = params.get("Response");
  const success = responseCode === "000" || responseCode === null; // ללא מידע חד-משמעי - מניחים הצלחה על בסיס עצם החזרה
  const last4 = params.get("index") || params.get("last4") || null;
  const confirmationCode = params.get("ConfirmationCode") || params.get("Order") || null;

  // ניקוי ה-URL כדי שרענון עתידי לא יפעיל את הלוגיקה שוב
  const clean = new URL(window.location.href);
  clean.search = "";
  window.history.replaceState({}, document.title, clean.toString());

  return { receiptId, success, last4, confirmationCode };
}

const TRANZILA = { buildTranzilaUrl, goToTranzilaTerminal, checkTranzilaReturn };
