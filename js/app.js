// ============================================================================
// מנוע המסכים של האפליקציה - state machine פשוט עם מחסנית ניווט (back/next).
// ============================================================================

const STORAGE_KEY_SALESPERSON = "tikbulim.salesperson";

let currentSalesperson = null; // { name, email }
let navStack = []; // רשימת מזהי מסכים שביקרנו בהם בתהליך הנוכחי
let draft = null; // התקבול שבתהליך מילוי

function el(id) { return document.getElementById(id); }

// מאפשר להתקדם גם בלחיצת Enter/Go במקלדת, לא רק בהקשה על כפתור "הבא"
function bindEnterToAdvance(inputEl, advanceFn) {
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      advanceFn();
    }
  });
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = true));
  el(id).hidden = false;
  const isFlowScreen = el(id).classList.contains("flow-screen");
  el("flow-nav").hidden = !isFlowScreen || navStack.length === 0;
}

function goTo(id) {
  navStack.push(id);
  showScreen(id);
}

function replaceScreen(id) {
  if (navStack.length > 0) navStack[navStack.length - 1] = id;
  else navStack.push(id);
  showScreen(id);
}

function goBack() {
  if (navStack.length <= 1) {
    goHome();
    return;
  }
  navStack.pop();
  const prev = navStack[navStack.length - 1];
  showScreen(prev);
}

function goHome() {
  navStack = [];
  showScreen("screen-home");
}

// ---------------------------------------------------------------------------
// התחברות ראשונית
// ---------------------------------------------------------------------------

function initLogin() {
  el("input-login-name").value = "";
  el("input-login-email").value = "";
  el("login-error").hidden = true;
  showScreen("screen-login");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

el("btn-login-submit").addEventListener("click", () => {
  const name = el("input-login-name").value.trim();
  const email = el("input-login-email").value.trim();
  if (!name || !isValidEmail(email)) {
    el("login-error").hidden = false;
    return;
  }
  currentSalesperson = { name, email };
  localStorage.setItem(STORAGE_KEY_SALESPERSON, JSON.stringify(currentSalesperson));
  showHome();
});

function showHome() {
  el("home-salesperson-name").textContent = currentSalesperson.name;
  goHome();
}

// ---------------------------------------------------------------------------
// יצירת דיווח חדש
// ---------------------------------------------------------------------------

function newDraft() {
  return {
    id: crypto.randomUUID(),
    status: "draft", // draft -> pending -> synced
    salesperson: currentSalesperson.name,
    salespersonEmail: currentSalesperson.email,
    createdAt: new Date().toISOString(),
    referringPania: "",
    onWhoseBehalf: "", // 'פאנית מפנה' | 'לקוחה'
    customerName: "",
    amount: 0,
    idNumber: "",
    paymentMethod: "", // מזומן | אשראי | צ'קים | העברה בנקאית
    paymentDetails: {},
    paymentStatus: "", // תלוי אמצעי תשלום
  };
}

function startAddReceipt() {
  draft = newDraft();
  navStack = [];
  el("input-pania").value = "";
  el("input-customer-name").value = "";
  el("customer-name-wrap").hidden = true;
  el("onbehalf-bottom-bar").hidden = true;
  ["btn-onbehalf-pania", "btn-onbehalf-customer"].forEach((id) => el(id).classList.remove("primary"));
  el("input-amount").value = "";
  el("input-id-number").value = "";
  el("id-number-error").hidden = true;
  goTo("screen-pania");
}

// ---------------------------------------------------------------------------
// 1. פאנית מפנה
// ---------------------------------------------------------------------------

function commitPaniaAndAdvance() {
  const value = el("input-pania").value.trim();
  if (!value) {
    el("input-pania").focus();
    return;
  }
  draft.referringPania = value;
  goTo("screen-onbehalf");
}

el("btn-pania-next").addEventListener("click", commitPaniaAndAdvance);
bindEnterToAdvance(el("input-pania"), commitPaniaAndAdvance);

// ---------------------------------------------------------------------------
// 2. על שם מי
// ---------------------------------------------------------------------------

// "על שם הפאנית המפנה" היא תשובה שלמה בפני עצמה - עוברים למסך הבא מיד, בלי כפתור "הבא" נוסף.
el("btn-onbehalf-pania").addEventListener("click", () => {
  draft.onWhoseBehalf = "פאנית מפנה";
  draft.customerName = "";
  goTo("screen-amount");
});

// "על שם לקוחה" דורשת עוד שדה טקסט - חושפים אותו ומציגים כפתור "הבא" לאישור השם.
el("btn-onbehalf-customer").addEventListener("click", () => {
  el("customer-name-wrap").hidden = false;
  el("onbehalf-bottom-bar").hidden = false;
  el("input-customer-name").focus();
  ["btn-onbehalf-pania", "btn-onbehalf-customer"].forEach((id) => {
    el(id).classList.toggle("primary", id === "btn-onbehalf-customer");
  });
});

function commitCustomerNameAndAdvance() {
  const name = el("input-customer-name").value.trim();
  if (!name) {
    el("input-customer-name").focus();
    return;
  }
  draft.onWhoseBehalf = "לקוחה";
  draft.customerName = name;
  goTo("screen-amount");
}

el("btn-onbehalf-next").addEventListener("click", commitCustomerNameAndAdvance);
bindEnterToAdvance(el("input-customer-name"), commitCustomerNameAndAdvance);

// ---------------------------------------------------------------------------
// 3. סכום
// ---------------------------------------------------------------------------

function commitAmountAndAdvance() {
  const raw = el("input-amount").value.replace(/[^\d.]/g, "");
  const amount = parseFloat(raw);
  if (!amount || amount <= 0) {
    el("input-amount").focus();
    return;
  }
  draft.amount = amount;
  if (amount > CONFIG.ID_NUMBER_THRESHOLD) {
    goTo("screen-id");
  } else {
    goToPaymentScreen();
  }
}

el("btn-amount-next").addEventListener("click", commitAmountAndAdvance);
bindEnterToAdvance(el("input-amount"), commitAmountAndAdvance);

// ---------------------------------------------------------------------------
// 4. תעודת זהות
// ---------------------------------------------------------------------------

function commitIdNumberAndAdvance() {
  const value = el("input-id-number").value.trim();
  const isValid = /^\d{9}$/.test(value);
  el("id-number-error").hidden = isValid;
  if (!isValid) {
    el("input-id-number").focus();
    return;
  }
  draft.idNumber = value;
  goToPaymentScreen();
}

el("btn-id-next").addEventListener("click", commitIdNumberAndAdvance);
bindEnterToAdvance(el("input-id-number"), commitIdNumberAndAdvance);

// ---------------------------------------------------------------------------
// 5. אמצעי תשלום
// ---------------------------------------------------------------------------

function goToPaymentScreen() {
  const cashAllowed = draft.amount <= CONFIG.CASH_CEILING;
  el("btn-pay-cash").disabled = !cashAllowed;
  el("btn-pay-cash").classList.toggle("disabled", !cashAllowed);
  el("cash-disabled-msg").hidden = cashAllowed;
  goTo("screen-payment");
}

el("btn-pay-cash").addEventListener("click", () => {
  if (el("btn-pay-cash").disabled) return;
  draft.paymentMethod = "מזומן";
  draft.paymentDetails = {};
  draft.paymentStatus = "שולם";
  goTo("screen-review");
  renderReview();
});

el("btn-pay-credit").addEventListener("click", () => {
  draft.paymentMethod = "אשראי";
  el("credit-offline-msg").hidden = navigator.onLine;
  goTo("screen-credit-choice");
});

el("btn-pay-checks").addEventListener("click", () => {
  draft.paymentMethod = "צ'קים";
  draft.paymentDetails = { checks: [] };
  resetChecksScreen();
  goTo("screen-checks");
});

el("btn-pay-transfer").addEventListener("click", () => {
  draft.paymentMethod = "העברה בנקאית";
  const today = new Date().toISOString().slice(0, 10);
  el("input-transfer-date").value = today;
  goTo("screen-transfer");
});

// ---------------------------------------------------------------------------
// 5א. אשראי - עכשיו / מאוחר יותר
// ---------------------------------------------------------------------------

el("btn-credit-now").addEventListener("click", async () => {
  if (!navigator.onLine) {
    el("credit-offline-msg").hidden = false;
    return;
  }
  // status נשאר "draft" בכוונה - לא רוצים לסנכרן לשרת לפני שידוע סופית אם הסליקה הצליחה
  draft.paymentDetails = { mode: "עכשיו" };
  draft.paymentStatus = "ממתין לתוצאת סליקה";
  await DB.dbPut(draft); // שמירה מקומית לפני יציאה לעמוד הסליקה, כדי שהדיווח לא יאבד
  TRANZILA.goToTranzilaTerminal();
});

el("btn-credit-later").addEventListener("click", () => {
  draft.paymentDetails = { mode: "מאוחר יותר" };
  draft.paymentStatus = "ממתין לסליקה";
  goTo("screen-review");
  renderReview();
});

// ---------------------------------------------------------------------------
// 5ב. צ'קים
// ---------------------------------------------------------------------------

function resetChecksScreen() {
  el("checks-list").innerHTML = "";
  addCheckRow();
  updateChecksSummary();
}

function addCheckRow() {
  const row = document.createElement("div");
  row.className = "check-row";

  const amountInput = document.createElement("input");
  amountInput.type = "tel";
  amountInput.inputMode = "numeric";
  amountInput.placeholder = "סכום";
  amountInput.addEventListener("input", updateChecksSummary);

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.addEventListener("input", updateChecksSummary);

  const removeBtn = document.createElement("button");
  removeBtn.className = "check-remove";
  removeBtn.type = "button";
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", () => {
    row.remove();
    updateChecksSummary();
  });

  row.appendChild(removeBtn);
  row.appendChild(dateInput);
  row.appendChild(amountInput);
  el("checks-list").appendChild(row);
}

el("btn-add-check").addEventListener("click", addCheckRow);

function updateChecksSummary() {
  const rows = Array.from(el("checks-list").querySelectorAll(".check-row"));
  let entered = 0;
  let allDatesFilled = true;
  rows.forEach((row) => {
    const val = parseFloat(row.querySelector('input[type="tel"]').value) || 0;
    entered += val;
    if (!row.querySelector('input[type="date"]').value) allDatesFilled = false;
  });
  const total = draft.amount;
  const remaining = total - entered;

  el("checks-total-amount").textContent = total.toLocaleString("he-IL");
  el("checks-entered-amount").textContent = entered.toLocaleString("he-IL");
  el("checks-remaining-amount").textContent = remaining.toLocaleString("he-IL");

  const matches = Math.abs(remaining) < 0.01 && entered > 0 && allDatesFilled;
  el("btn-checks-next").disabled = !matches;
}

el("btn-checks-next").addEventListener("click", () => {
  const rows = Array.from(el("checks-list").querySelectorAll(".check-row"));
  const checks = rows.map((row) => ({
    amount: parseFloat(row.querySelector('input[type="tel"]').value) || 0,
    dueDate: row.querySelector('input[type="date"]').value,
  }));
  draft.paymentDetails = { checks };
  draft.paymentStatus = "שולם בצ'קים";
  goTo("screen-review");
  renderReview();
});

// ---------------------------------------------------------------------------
// 5ג. העברה בנקאית
// ---------------------------------------------------------------------------

function commitTransferAndAdvance() {
  const date = el("input-transfer-date").value;
  if (!date) return;
  draft.paymentDetails = { transferDate: date };
  draft.paymentStatus = "שולם";
  goTo("screen-review");
  renderReview();
}

el("btn-transfer-next").addEventListener("click", commitTransferAndAdvance);
bindEnterToAdvance(el("input-transfer-date"), commitTransferAndAdvance);

// ---------------------------------------------------------------------------
// 6. בדיקה ואישור
// ---------------------------------------------------------------------------

function renderReview() {
  const rows = [];
  rows.push(["פאנית מפנה", draft.referringPania]);
  rows.push(["על שם מי", draft.onWhoseBehalf === "לקוחה" ? `לקוחה - ${draft.customerName}` : "הפאנית המפנה"]);
  rows.push(["סכום", `${draft.amount.toLocaleString("he-IL")} ₪`]);
  if (draft.idNumber) rows.push(["תעודת זהות", draft.idNumber]);
  rows.push(["אמצעי תשלום", draft.paymentMethod]);

  if (draft.paymentMethod === "אשראי") {
    rows.push(["סטטוס סליקה", draft.paymentStatus]);
  }
  if (draft.paymentMethod === "צ'קים") {
    const checks = draft.paymentDetails.checks || [];
    rows.push(["מספר צ'קים", String(checks.length)]);
  }
  if (draft.paymentMethod === "העברה בנקאית") {
    rows.push(["תאריך ההעברה", draft.paymentDetails.transferDate]);
  }
  rows.push(["תאריך", new Date(draft.createdAt).toLocaleDateString("he-IL")]);

  const container = el("review-summary");
  container.innerHTML = "";
  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "review-row";
    row.innerHTML = `<span class="label">${label}</span><span class="value"></span>`;
    row.querySelector(".value").textContent = value;
    container.appendChild(row);
  });
}

el("btn-review-back").addEventListener("click", goBack);

el("btn-confirm-save").addEventListener("click", async () => {
  draft.status = "pending";
  draft.submittedAt = new Date().toISOString();
  await API.saveReceipt(draft);
  showDoneScreen();
});

// ---------------------------------------------------------------------------
// 7. סיום
// ---------------------------------------------------------------------------

function showDoneScreen() {
  navStack = ["screen-done"];
  showScreen("screen-done");
  setTimeout(() => {
    if (!el("screen-done").hidden) {
      goHome();
    }
  }, 5000);
}

// ---------------------------------------------------------------------------
// כפתורי מסך הבית וניווט כללי
// ---------------------------------------------------------------------------

el("btn-add-receipt").addEventListener("click", startAddReceipt);
el("btn-back").addEventListener("click", goBack);
el("btn-switch-user").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY_SALESPERSON);
  currentSalesperson = null;
  initLogin();
});

// ---------------------------------------------------------------------------
// באנר אופליין
// ---------------------------------------------------------------------------

function updateOfflineBanner() {
  el("offline-banner").hidden = navigator.onLine;
}
window.addEventListener("online", updateOfflineBanner);
window.addEventListener("offline", updateOfflineBanner);

// ---------------------------------------------------------------------------
// חזרה מעמוד הסליקה של טרנזילה
// ---------------------------------------------------------------------------
// עמוד הסליקה בפועל לא מחזיר אותנו לאפליקציה עם תוצאה (לא Terminal API) - אז לפי
// ההחלטה המקורית, עצם החזרה של המשווקת לאפליקציה נחשבת הוכחת הצלחה. בכל פעם שהאפליקציה
// עולה/חוזרת לפוקוס, בודקים אם יש דיווח שממתין לתוצאת סליקה ומסמנים אותו כשולם.

async function finalizePendingTranzilaIfAny() {
  const all = await DB.dbGetAll();
  const pending = all.find((r) => r.paymentStatus === "ממתין לתוצאת סליקה");
  if (!pending) return;

  pending.paymentStatus = "שולם";
  pending.status = "pending";
  pending.submittedAt = new Date().toISOString();

  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_SALESPERSON) || "null");
  if (saved) {
    currentSalesperson = saved;
    el("home-salesperson-name").textContent = currentSalesperson.name;
  }

  draft = pending;
  await API.saveReceipt(pending);
  showDoneScreen();
}

window.addEventListener("pageshow", finalizePendingTranzilaIfAny);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") finalizePendingTranzilaIfAny();
});

// ---------------------------------------------------------------------------
// אתחול
// ---------------------------------------------------------------------------

async function init() {
  updateOfflineBanner();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }

  const all = await DB.dbGetAll();
  const pendingTranzila = all.find((r) => r.paymentStatus === "ממתין לתוצאת סליקה");
  if (pendingTranzila) {
    await finalizePendingTranzilaIfAny();
    return;
  }

  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_SALESPERSON) || "null");
  if (saved) {
    currentSalesperson = saved;
    showHome();
  } else {
    initLogin();
  }
}

init();
