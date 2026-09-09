// ============================================================================
// מנהל סנכרון - שולח לשרת כל דיווח שנמצא במצב "ממתין" ב-IndexedDB.
// מנסה בכל אחת משלוש הנקודות: פתיחת האפליקציה, חזרה אליה, וחזרת חיבור אינטרנט.
// לא מסתמך על Background Sync (לא אמין באייפון).
// ============================================================================

let _syncInProgress = false;

async function trySyncAll() {
  if (_syncInProgress) return;
  if (!navigator.onLine) return;
  _syncInProgress = true;
  try {
    const all = await DB.dbGetAll();
    const pending = all.filter((r) => r.status === "pending");
    for (const receipt of pending) {
      await trySyncOne(receipt);
    }
  } finally {
    _syncInProgress = false;
  }
}

async function trySyncOne(receipt) {
  try {
    const result = await API.sendReceiptToServer(receipt);
    receipt.status = "synced";
    receipt.syncedAt = new Date().toISOString();
    if (result.serverMessage) receipt.serverMessage = result.serverMessage;
    await DB.dbPut(receipt);
    notifySyncListeners(receipt);
  } catch (err) {
    // נכשל - נשאר "pending" וינסה שוב בפעם הבאה. הדיווח לעולם לא נמחק.
  }
}

// מאפשר למסכי ה-UI להירשם לעדכון כשדיווח מסתנכרן (למשל כדי לרענן מסך סיום)
const _syncListeners = [];
function onSyncComplete(fn) {
  _syncListeners.push(fn);
}
function notifySyncListeners(receipt) {
  _syncListeners.forEach((fn) => {
    try {
      fn(receipt);
    } catch (e) {}
  });
}

// שלוש נקודות ההפעלה האוטומטיות
window.addEventListener("load", trySyncAll);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") trySyncAll();
});
window.addEventListener("online", trySyncAll);

const SYNC = { trySyncAll, onSyncComplete };
