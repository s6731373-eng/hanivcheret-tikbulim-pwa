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

  // קישור למסוף הסליקה של Tranzila (התקבל מהחברה).
  // *** לב שימת: זהו קישור מסוג pay.tranzila.com/crmnew/... - "עמוד תשלום" מוכן מראש מה-CRM
  // של טרנזילה, בשונה מ-Terminal API רגיל (direct.tranzila.com/.../iframenew.php).
  // לא ברור עדיין אם עמוד כזה תומך בהעברת סכום דינמית דרך פרמטרים ב-URL (sum=...) -
  // יש לבדוק בפועל מול טרנזילה/בהרצת בדיקה: האם הסכום מוזן אוטומטית מהקישור,
  // או שהלקוחה/המשווקת תצטרך להזין אותו ידנית בעמוד הסליקה עצמו.
  TRANZILA_TERMINAL_URL: "https://pay.tranzila.com/crmnew/TVI1L3NJU2k1d054VUliQjN0QzZDQT09",
};
