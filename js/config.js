// ============================================================================
// קונפיגורציה כללית של האפליקציה - כל הערכים שעשויים להשתנות מרוכזים כאן
// ============================================================================

const CONFIG = {
  // כתובת ה-Web App של Google Apps Script (לאחר פרסום הסקריפט מהתיקייה apps-script)
  // יש להחליף את הערך הזה בכתובת האמיתית לאחר פריסת הסקריפט (Deploy > New deployment > Web app)
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzDeCkUUEZ8GSU5U1rfvHuw3j72u35QTZaQ8-J9n2_JyQNukoTQxXcClpCcVBhILZlWIw/exec",

  // סף תעודת זהות - מעל סכום זה חובה להזין ת.ז. (טרם אומת סופית מול רואה חשבון)
  ID_NUMBER_THRESHOLD: 5000,

  // תקרת מזומן לפי חוק צמצום השימוש במזומן
  CASH_CEILING: 6000,

  // כתובת מייל קבועה של המזכירות - מקבלת עותק מכל תקבול
  OFFICE_EMAIL: "office@example.com",

  // קישור למסוף הסליקה של Tranzila.
  // *** יש להחליף בקישור האמיתי כשיתקבל מהחברה - זהו רק Placeholder לצורכי פיתוח ***
  // הפרמטרים הנפוצים בטרמינל המתארח (Hosted Page) של טרנזילה הם בערך הזה:
  //   sum            - סכום העסקה
  //   currency        - 1 = שקל
  //   success_url_address / fail_url_address - הפניה חזרה לאחר הסליקה (מוגדר גם בפאנל טרנזילה עצמו)
  // יש לוודא מול טרנזילה את שמות הפרמטרים המדויקים בעת קבלת הקישור הסופי.
  TRANZILA_TERMINAL_URL: "https://direct.tranzila.com/PASTE_YOUR_TERMINAL_NAME_HERE/iframenew.php",
};
