/* ==========================================================================
   COPRACURE — UPDATED JAVASCRIPT LOGIC (script.js)
   - First-time Account Sign In: "Welcome to CopraCure Dashboard, [Name]!"
   - Returning User (Signed in before -> Logged out -> Signed in again): "Welcome Back, [Name]!"
   - Sign In Page Heading: "Welcome to CopraCure!"
   - Clean Error Messages:
     * "Invalid email or number"
     * "The password you enter is incorrect"
     * "Please enter at least 8 characters"
     * "Password does not match"
   - Icon Buttons for Theme Mode & System Language
   - SMS Dispatched ONLY for Important Alerts (High Temperature, Mold Detected,
     Calibration Needed, AccountUpdated, Welcome Sign-In)
   - Red Alert Message on 16x2 I2C LCD Module
   - Admin / Developer Lock for Sensor Calibration (Passcode: admin123)
   ========================================================================== */

const SUPABASE_URL = "https://wvpyqzzcfzwtmcfaeejz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_h0U05WcbvI6VT03EVrxtgg_Acj5c_zK";

let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("Supabase Client Initialized Successfully!");
} else {
  console.error("Supabase SDK not loaded! Check internet connection or adblockers.");
}

const PASSWORD_MIN_LENGTH = 8;
const MOBILE_MAX_LENGTH = 13;
const ADMIN_DEVELOPER_PASSCODE = "admin123";

// GLOBAL STATE
const state = {
  theme: "light",
  lang: "en",
  currentUser: "Caocao",
  currentUserFullName: "Caocao",
  currentUserIdentifier: "09123456789",
  isFirstTimeLogin: true,
  smsRecipientNumber: "09123456789",
  sessionId: "BATCH-2026-001",
  sessionActive: true,
  wifiOnline: true,
  ssrEngaged: true,
  autoMode: true,
  camFlash: false,
  adminCalibrationUnlocked: false,
  autoSmsOnImportantAlerts: true,
  temperature: 56.1,
  humidity: 37.5,
  moisture: 13.0,
  refTemperature: 55.9,
  refHumidity: 37.1,
  refMoisture: 12.7,
  initialMoisture: 50.0,
  targetMoisture: 6.0,
  plannedDurationHours: 48.0,
  moldCategory: "NONE",
  calibrationStatus: "Calibrated & Verified",
  lcdAlertActive: false,
  lcdAlertShortCode: "",
  lcdAlertFullText: "",
  generatedResetOtp: null,
  resetTargetAccount: null,
  resetMethod: "sms",
  smsMessages: [
    {
      to: "09123456789",
      message: "Thank you for signing In, Caocao! Welcome to CopraCure Dashboard!",
      time: "Just now",
      mode: "Important Auto-SMS",
      urgent: false
    }
  ],
  notifications: [
    {
      id: 1,
      text: "CopraCure Chamber BATCH-2026-001 initialized. SHT31 & 16x2 I2C LCD online.",
      time: "Just now",
      unread: true,
      danger: false
    },
    {
      id: 2,
      text: "600W PTC Heater SSR Module is ENGAGED (Closed-Loop Active).",
      time: "2 mins ago",
      unread: true,
      danger: false
    }
  ],
  calibrationLogs: [
    {
      date: "2026-10-20",
      time: "08:15 AM",
      operator: "Admin / Developer (Nicole Banzuela)",
      offsets: "temp_offset = -0.20°C | rh_offset = -0.40% | mc_offset = -0.30%",
      maeSummary: "T: 0.20°C | RH: 0.40% | MC: 0.30%",
      status: "Calibrated & Verified"
    }
  ]
};

// DICTIONARY PARA SA ENGLISH AT TAGALOG TRANSLATION
const i18nDict = {
  en: {
    welcome_copracure: "Welcome to CopraCure!",
    create_account: "Create An Account",
    auth_sub: "Please enter your details to access the dashboard",
    lbl_fullname: "FULL NAME",
    lbl_mobile_email: "MOBILE NUMBER OR EMAIL",
    lbl_password: "PASSWORD",
    lbl_confirm_pass: "CONFIRM PASSWORD",
    remember_me: "Remember",
    forgot_pass: "Forgot Password?",
    btn_signin: "Sign In",
    btn_signup: "Sign Up",
    no_account: "Don't have an account?",
    has_account: "Already have an account?",
    link_signup: "Sign up",
    nav_dashboard: "Dashboard",
    nav_sessions: "Drying Sessions",
    nav_mold: "Mold Classification",
    nav_control: "Control System",
    nav_alerts: "Preventive Alerts",
    nav_calibration: "Sensor Calibration",
    nav_datalogs: "Data Logs",
    nav_notifications: "Notification",
    notif_title: "System Notifications",
    mark_read: "Mark all read",
    clear_all: "Clear",
    sec_sessions_title: "Drying Sessions — Active Progress & Moisture Trajectory",
    sec_sessions_sub: "Real-time monitoring of active session status, drying duration, and initial-to-final moisture reduction progress.",
    alert_module_title: "Preventive Alerts — Drying Rate, High Temp & Contamination Protocol",
    alert_module_desc: "Optimal / On Track: SMS and Red LCD Alerts are dispatched strictly for important warnings such as High Temperature, Mold Detection, Sensor Calibration Needed, and Account Updates.",
    btn_sim_mold: "Simulate High Mold Alert",
    btn_reset_alert: "Reset Alert",
    lbl_mold_risk: "MOLD & SYSTEM PERFORMANCE RISK",
    pill_optimal: "Optimal / On track",
    pill_48h: "48H Drying Rate Warning",
    pill_isolation: "Mold Detected - Isolation Required",
    card_temp: "CHAMBER TEMPERATURE",
    card_rh: "RELATIVE HUMIDITY",
    card_mc: "COPRA MOISTURE",
    card_est: "EST. COMPLETION (48H TRIAL)",
    cam_title: "Mold Classification — ESP32-CAM Computer Vision",
    cam_active_msg: "Single-Tray Chamber Inspection Active",
    heater_title: "Control System — 600W PTC Heater • SSR",
    lbl_wattage: "WATTAGE",
    actuator_title: "ACTUATOR & AIRFLOW CONTROLS",
    actuator_hint: "Switch to MANUAL mode or toggle any switch to override automated fans",
    cal_title: "Sensor Calibration & ESP32 Accuracy Verification",
    cal_sub: "Monitoring SHT31 Temperature, SHT31 Relative Humidity, and Experimental Moisture Probe. (Admin / Developer Only for Calibration Controls)",
    diag_title: "Data Logs & Technical Diagnostics (ESP32 Serial & Supabase Telemetry)",
    trends_title: "Historical Trends: 24h",
    log_batch_title: "Log Batch Results",
    sec_notif_center_title: "Notification & Important Chamber SMS Center",
    sec_notif_center_sub: "SMS notifications are reserved only for important events: High Temperature, Mold Detection, Sensor Calibration Needed, Account Updated, and Welcome Sign-In."
  },

  tl: {
    welcome_copracure: "Welcome to CopraCure!",
    create_account: "Gumawa ng Account",
    auth_sub: "Ilagay ang iyong detalye upang mabuksan ang dashboard",
    lbl_fullname: "BUONG PANGALAN",
    lbl_mobile_email: "MOBILE NUMBER O EMAIL",
    lbl_password: "PASSWORD",
    lbl_confirm_pass: "KUMPIRMAHIN ANG PASSWORD",
    remember_me: "Tandaan ako",
    forgot_pass: "Nakalimutan ang Password?",
    btn_signin: "Mag-Sign In",
    btn_signup: "Mag-Sign Up",
    no_account: "Wala pang account?",
    has_account: "Mayroon nang account?",
    link_signup: "Gumawa rito",
    nav_dashboard: "Dashboard",
    nav_sessions: "Drying Sessions",
    nav_mold: "Mold Classification",
    nav_control: "Control System",
    nav_alerts: "Preventive Alerts",
    nav_calibration: "Sensor Calibration",
    nav_datalogs: "Data Logs",
    nav_notifications: "Notification",
    notif_title: "Mga Notipikasyon sa Chamber",
    mark_read: "Markahang nabasa",
    clear_all: "Burahin",
    sec_sessions_title: "Sesyon ng Pagpapatuyo — Aktibong Progreso ng Moisture",
    sec_sessions_sub: "Pag-monitor ng active session status, tagal ng pagpapatuyo, at progreso ng pagbaba ng moisture mula umpisa hanggang dulo.",
    alert_module_title: "Preventive Alerts — Babala sa Temperatura, Drying Rate at Amag",
    alert_module_desc: "Optimal / Nasa Track: Ang SMS at Pulang LCD Alert ay para lamang sa mahahalagang babala gaya ng High Temperature, Mold Detection, Calibration Needed, at Account Updates.",
    btn_sim_mold: "Subukan ang High Mold Alert",
    btn_reset_alert: "I-reset ang Alert",
    lbl_mold_risk: "PANGANIB NG AMAG AT SISTEMA",
    pill_optimal: "Optimal / Nasa Track",
    pill_48h: "Babala sa 48 Oras na Pagpapatuyo",
    pill_isolation: "May Amag - Ihiwalay ang Sample",
    card_temp: "TEMPERATURA NG CHAMBER",
    card_rh: "RELATIBONG HALUMIGMIG (RH)",
    card_mc: "MOISTURE NG KOPRA",
    card_est: "TANTYANG PAGKATAPOS (48H)",
    cam_title: "Mold Classification — ESP32-CAM Computer Vision",
    cam_active_msg: "Aktibo ang Pagsusuri sa Single-Tray Chamber",
    heater_title: "Control System — 600W PTC Heater • SSR",
    lbl_wattage: "LAKAS (WATTAGE)",
    actuator_title: "KONTROL NG ACTUATOR AT HANGIN",
    actuator_hint: "Lumipat sa MANUAL mode upang kontrolin ang mga fan at heater",
    cal_title: "Sensor Calibration at Pagsusuri ng Katumpakan ng ESP32",
    cal_sub: "Pag-monitor ng SHT31 Temperature, SHT31 Relative Humidity, at Experimental Moisture Probe. (Admin / Developer Lamang ang Makakapag-Calibrate)",
    diag_title: "Data Logs at Teknikal na Diagnostics (ESP32 at Supabase)",
    trends_title: "Historikal na Trend: 24 Oras",
    log_batch_title: "Itala ang Resulta ng Batch",
    sec_notif_center_title: "Sentro ng Notification at Mahahalagang SMS",
    sec_notif_center_sub: "Ang SMS alerts ay para lamang sa mahahalagang mensahe: High Temperature, Mold Detection, Sensor Calibration Needed, Account Updated, at Welcome Sign-In.",
    ph_admin_pass: "Ilagay ang developer passcode",
    modal_forgot_sub: "Piliin kung saan mo gustong ipadala ang iyong 6-digit Reset Code (SMS sa iyong Mobile Number o sa iyong Email).",
    modal_profile_sub: "I-update ang iyong personal na detalye, mobile number/email para sa important SMS alerts, o burahin ang iyong account.",
    modal_sms_sub: "Ang SMS notifications ay naka-filter para lamang sa mahahalagang alerts (High Temperature, Mold Detection, Calibration Needed, Account Updated, at Sign-In Welcome).",
    modal_lcd_sub: "Eksaktong salamin ng inyong 16x2 I2C LCD module sa chamber. Nagiging pula (Red Alert) kapag may urgent chamber warning.",
    modal_admin_sub: "Tanging ang Admin o Developer lamang ang maaaring mag-calibrate ng mga sensors sa chamber. Ilagay ang developer passcode upang buksan.",
    admin_lock_restricted: "Restricted Access: Tanging Admin o Developer lamang ang maaaring mag-calibrate ng sensors at magbago ng reference offsets. Pindutin ang Admin / Developer Access upang buksan.",
    cal_table_ref_desc: "Ang Reference Value ay ma-e-edit lamang kapag naka-unlock ang Admin / Developer Mode.",
    cal_history_desc: "Talaan ng mga nakaraang calibration session ng Admin / Developer at mga offset values sa ESP32 code."
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();

  initInputValidators();
  initAuthViews();
  initForgotPasswordModal();
  initPasswordVisibility();
  initThemeAndLanguageIcons();
  initNotificationsDropdown();
  initUserProfileModal();
  initNavigationAndSidebar();
  initDryingSessionsModule();
  initPreventiveAlertModule();
  initSmsAlertSystem();
  initCameraSsrAndActuators();
  initSensorCalibrationModule();
  initBatchCalculationsAndCsv();
  initLocal16x2LcdModal();
  initSupabaseRealtime();

  // Pinapanatili ang active session kapag nag-refresh ng page
  checkActiveSession();

  document.getElementById("close-sms-banner")?.addEventListener("click", () => {
    document.getElementById("live-sms-banner")?.classList.remove("show");
  });
});

function checkActiveSession() {
  try {
    const sessionRaw = localStorage.getItem("copracure_active_session");
    if (!sessionRaw) return;

    const session = JSON.parse(sessionRaw);
    if (!session || !session.identifier) return;

    const account = findAccountByIdentifier(session.identifier) || session;

    state.currentUserFullName = account.fullName || "User";
    state.currentUser = state.currentUserFullName.split(" ")[0];
    state.currentUserIdentifier = account.identifier;
    state.smsRecipientNumber = account.identifier;
    state.isFirstTimeLogin = false;

    document.getElementById("signin-view")?.classList.remove("active-view");
    document.getElementById("signup-view")?.classList.remove("active-view");
    document.getElementById("dashboard-view")?.classList.add("active-view");

    const smsActiveEl = document.getElementById("sms-active-number");
    if (smsActiveEl) smsActiveEl.textContent = account.identifier;

    const smsInputEl = document.getElementById("sms-recipient-input");
    if (smsInputEl) smsInputEl.value = account.identifier;

    updateDashboardWelcomeBanner();
  } catch (e) {
    console.error("Session check failed:", e);
  }
}

/* ==========================================================================
   1. VALIDATORS (CONCISE ERROR MESSAGES)
   ========================================================================== */
function isMobileInput(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return false;
  return !/[a-zA-Z@]/.test(trimmed);
}

/**
 * Nagbabalik ng "Invalid email or number" kapag mali ang format ng mobile o email
 */
function validateIdentifierInput(inputEl, wrapEl, errorEl) {
  if (!inputEl) return false;
  let raw = inputEl.value.trim();

  if (!raw) {
    if (wrapEl) wrapEl.classList.add("input-error");
    if (errorEl) errorEl.textContent = "Invalid email or number";
    return false;
  }

  if (isMobileInput(raw)) {
    const cleaned = raw.replace(/(?!^\+)[^\d]/g, "");
    if (cleaned.length > MOBILE_MAX_LENGTH) {
      inputEl.value = cleaned.slice(0, MOBILE_MAX_LENGTH);
    } else {
      inputEl.value = cleaned;
    }

    const validPhMobile = /^(09\d{9}|\+639\d{9})$/.test(inputEl.value);
    if (!validPhMobile) {
      if (wrapEl) wrapEl.classList.add("input-error");
      if (errorEl) errorEl.textContent = "Invalid email or number";
      return false;
    }
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(raw)) {
      if (wrapEl) wrapEl.classList.add("input-error");
      if (errorEl) errorEl.textContent = "Invalid email or number";
      return false;
    }
  }

  if (wrapEl) wrapEl.classList.remove("input-error");
  if (errorEl) errorEl.textContent = "";
  return true;
}

/**
 * Sa Sign Up / Profile / Reset: "Please enter at least 8 characters"
 */
function validateSignupPasswordInput(inputEl, wrapEl, errorEl) {
  if (!inputEl) return false;
  const val = inputEl.value;

  if (val.length < PASSWORD_MIN_LENGTH) {
    if (wrapEl) wrapEl.classList.add("input-error");
    if (errorEl) errorEl.textContent = "Please enter at least 8 characters";
    return false;
  }

  if (wrapEl) wrapEl.classList.remove("input-error");
  if (errorEl) errorEl.textContent = "";
  return true;
}

/**
 * Sa Sign Up Confirm Password: "Password does not match"
 */
function validateConfirmPasswordInput() {
  const passEl = document.getElementById("signup-password");
  const confirmEl = document.getElementById("signup-confirm");
  const wrapEl = document.getElementById("signup-confirm-wrap");
  const errorEl = document.getElementById("signup-confirm-error");

  if (!confirmEl || !passEl || !confirmEl.value || confirmEl.value !== passEl.value) {
    if (wrapEl) wrapEl.classList.add("input-error");
    if (errorEl) errorEl.textContent = "Password does not match";
    return false;
  }

  if (wrapEl) wrapEl.classList.remove("input-error");
  if (errorEl) errorEl.textContent = "";
  return true;
}

function initInputValidators() {
  const idFields = [
    { input: "signin-identifier", wrap: "signin-id-wrap", err: "signin-id-error" },
    { input: "signup-identifier", wrap: "signup-id-wrap", err: "signup-id-error" },
    { input: "reset-identifier", wrap: "reset-id-wrap", err: "reset-id-error" },
    { input: "profile-identifier", wrap: "profile-id-wrap", err: "profile-id-error" }
  ];

  idFields.forEach(({ input, wrap, err }) => {
    const el = document.getElementById(input);
    if (el) {
      el.addEventListener("input", () => {
        document.getElementById(wrap)?.classList.remove("input-error");
        const errNode = document.getElementById(err);
        if (errNode) errNode.textContent = "";
      });
    }
  });

  const signinPass = document.getElementById("signin-password");
  if (signinPass) {
    signinPass.addEventListener("input", () => {
      document.getElementById("signin-pass-wrap")?.classList.remove("input-error");
      const errNode = document.getElementById("signin-pass-error");
      if (errNode) errNode.textContent = "";
    });
  }

  const signupPassFields = [
    { input: "signup-password", wrap: "signup-pass-wrap", err: "signup-pass-error" },
    { input: "signup-confirm", wrap: "signup-confirm-wrap", err: "signup-confirm-error" },
    { input: "reset-new-password", wrap: "reset-pass-wrap", err: "reset-pass-error" },
    { input: "profile-password", wrap: "profile-pass-wrap", err: "profile-pass-error" }
  ];

  signupPassFields.forEach(({ input, wrap, err }) => {
    const el = document.getElementById(input);
    if (el) {
      el.addEventListener("input", () => {
        document.getElementById(wrap)?.classList.remove("input-error");
        const errNode = document.getElementById(err);
        if (errNode) errNode.textContent = "";
      });
    }
  });
}

/* ==========================================================================
   2. ICON BUTTONS PARA SA THEME MODE & SYSTEM LANGUAGE
   ========================================================================== */
function initThemeAndLanguageIcons() {
  const btnThemeToggle = document.getElementById("btn-theme-toggle");
  const btnLangToggle = document.getElementById("btn-lang-toggle");

  btnThemeToggle?.addEventListener("click", () => {
    const nextTheme = state.theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
  });

  btnLangToggle?.addEventListener("click", () => {
    const nextLang = state.lang === "en" ? "tl" : "en";
    setLanguage(nextLang);
  });
}

function setTheme(mode) {
  state.theme = mode;
  document.documentElement.setAttribute("data-theme", mode);
  const btnThemeToggle = document.getElementById("btn-theme-toggle");
  if (btnThemeToggle) {
    btnThemeToggle.innerHTML = `<i data-lucide="${mode === "dark" ? "moon" : "sun"}"></i>`;
    if (window.lucide) lucide.createIcons();
  }
  showToast(`Theme switched to ${mode.toUpperCase()} mode.`);
}

function setLanguage(langCode) {
  state.lang = langCode;
  const badgeText = document.getElementById("lang-badge-text");
  if (badgeText) badgeText.textContent = langCode.toUpperCase();

  const dict = i18nDict[langCode];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  updateDashboardWelcomeBanner();
  showToast(langCode === "tl" ? "Pinalitan ang wika sa Tagalog." : "Language switched to English.");
}

/* ==========================================================================
   3. NOTIFICATIONS & IMPORTANT-ONLY SMS DISPATCH ENGINE
   ========================================================================== */
function initNotificationsDropdown() {
  const bellBtn = document.getElementById("notif-bell-btn");
  const dropdown = document.getElementById("notif-dropdown");
  const btnMarkRead = document.getElementById("btn-mark-read");
  const btnClear = document.getElementById("btn-clear-notifs");
  const masterAutoToggle = document.getElementById("toggle-auto-sms-master");

  renderNotificationsList();
  renderPhoneSmsInbox();

  bellBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle("open");
  });

  btnMarkRead?.addEventListener("click", () => {
    state.notifications.forEach((n) => (n.unread = false));
    renderNotificationsList();
    showToast("All notifications marked as read.");
  });

  btnClear?.addEventListener("click", () => {
    state.notifications = [];
    renderNotificationsList();
    showToast("Notifications cleared.");
  });

  if (masterAutoToggle) {
    masterAutoToggle.addEventListener("change", (e) => {
      state.autoSmsOnImportantAlerts = e.target.checked;
      const trigAll = document.getElementById("sms-trig-all-notifs");
      if (trigAll) trigAll.checked = e.target.checked;
      showToast(
        e.target.checked
          ? "Important SMS Alerts: ENABLED"
          : "Important SMS Alerts: PAUSED"
      );
    });
  }

  document.addEventListener("click", (e) => {
    if (dropdown && bellBtn && !dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });
}

/**
 * Adds a notification to the website and saves it to the Supabase alerts table.
 * Nagpapadala LAMANG ng SMS kapag `sendImportantSms = true`
 */
function addNotification(message, isDanger = false, sendImportantSms = false, customSmsText = null) {
  const nowStr = new Date().toLocaleTimeString();

  state.notifications.unshift({
    id: Date.now(),
    text: message,
    time: nowStr,
    unread: true,
    danger: isDanger
  });

  renderNotificationsList();

  if (isDanger || sendImportantSms) {
    insertSupabaseRecord("alerts", {
      session_id: state.sessionId,
      alert_type: message.substring(0, 255),
      alert_status: "ACTIVE"
    });
  }

  const trigImportantCheck = document.getElementById("sms-trig-all-notifs");
  const shouldSendSms =
    sendImportantSms &&
    (state.autoSmsOnImportantAlerts || (trigImportantCheck && trigImportantCheck.checked));

  if (shouldSendSms) {
    const recipient = state.smsRecipientNumber || state.currentUserIdentifier || "09123456789";
    const smsBody = customSmsText || message;
    dispatchDirectSms(recipient, smsBody, isDanger, false);
  }
}

function renderNotificationsList() {
  const container = document.getElementById("notif-list-container");
  const sectionContainer = document.getElementById("section-notif-list");
  const sectionCount = document.getElementById("section-notif-count");
  const badge = document.getElementById("notif-count-badge");
  if (!container || !badge) return;

  const unreadCount = state.notifications.filter((n) => n.unread).length;
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }

  if (sectionCount) {
    sectionCount.textContent = `${state.notifications.length} Alerts`;
  }

  const html =
    state.notifications.length === 0
      ? `<div class="notif-item">No notifications at the moment.</div>`
      : state.notifications
          .map(
            (n) => `
          <div class="notif-item ${n.unread ? "unread" : ""} ${n.danger ? "danger" : ""}">
            <div>${n.text}</div>
            <span class="notif-time">${n.time}</span>
          </div>
        `
          )
          .join("");

  container.innerHTML = html;
  if (sectionContainer) sectionContainer.innerHTML = html;
}

/* ==========================================================================
   4. AUTHENTICATION & CONDITIONAL DASHBOARD WELCOME GREETING
   ========================================================================== */
function getRegisteredAccounts() {
  try {
    const raw = localStorage.getItem("copracure_registered_users");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRegisteredAccounts(accounts) {
  localStorage.setItem("copracure_registered_users", JSON.stringify(accounts));
}

function findAccountByIdentifier(identifier) {
  const clean = (identifier || "").trim().toLowerCase();
  if (!clean) return undefined;
  return getRegisteredAccounts().find(
    (acc) => acc && typeof acc.identifier === "string" && acc.identifier.trim().toLowerCase() === clean
  );
}

/**
 * Ina-update ang greeting sa Dashboard:
 * - Kapag bagong gawa lang ang account (first sign-in): "Welcome to CopraCure Dashboard, Caocao!"
 * - Kapag nag-sign in na dati, nag-log out, at nag-sign in ulit: "Welcome Back, Nicole!"
 */
function updateDashboardWelcomeBanner() {
  const prefixEl = document.getElementById("welcome-greeting-prefix");
  const nameEl = document.getElementById("display-user-name");
  if (!prefixEl || !nameEl) return;

  if (state.isFirstTimeLogin) {
    prefixEl.textContent =
      state.lang === "tl"
        ? "Maligayang Pagdating sa CopraCure Dashboard,"
        : "Welcome to CopraCure Dashboard,";
  } else {
    prefixEl.textContent =
      state.lang === "tl" ? "Maligayang Pagbabalik," : "Welcome Back,";
  }

  nameEl.textContent = `${state.currentUser}!`;
}

function showFormAlert(boxId, message, isSuccess = false) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.style.display = "block";
  box.className = isSuccess ? "auth-alert-box success" : "auth-alert-box";
  box.textContent = message;
}

function hideFormAlert(boxId) {
  const box = document.getElementById(boxId);
  if (box) box.style.display = "none";
}

function initAuthViews() {
  const signinView = document.getElementById("signin-view");
  const signupView = document.getElementById("signup-view");
  const dashboardView = document.getElementById("dashboard-view");

  document.getElementById("go-to-signup")?.addEventListener("click", (e) => {
    e.preventDefault();
    hideFormAlert("signin-alert-box");
    signinView?.classList.remove("active-view");
    signupView?.classList.add("active-view");
  });

  document.getElementById("go-to-signin")?.addEventListener("click", (e) => {
    e.preventDefault();
    hideFormAlert("signup-alert-box");
    signupView?.classList.remove("active-view");
    signinView?.classList.add("active-view");
  });

  // SIGN UP
  document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFormAlert("signup-alert-box");

    const fullName = document.getElementById("signup-fullname")?.value.trim() || "";
    const idEl = document.getElementById("signup-identifier");
    const passEl = document.getElementById("signup-password");
    const confirmEl = document.getElementById("signup-confirm");

    let hasError = false;

    // 1. Check Full Name
    const nameErrEl = document.getElementById("signup-name-error");
    if (!fullName) {
      if (nameErrEl) nameErrEl.textContent = "Please enter your full name";
      hasError = true;
    } else {
      if (nameErrEl) nameErrEl.textContent = "";
    }

    // 2. Check Identifier Format at kung may Account na
    const idValid = validateIdentifierInput(
      idEl,
      document.getElementById("signup-id-wrap"),
      document.getElementById("signup-id-error")
    );
    const identifier = idEl ? idEl.value.trim() : "";
    const existingAccount = findAccountByIdentifier(identifier);

    if (!idValid) {
      document.getElementById("signup-id-wrap")?.classList.add("input-error");
      const errEl = document.getElementById("signup-id-error");
      if (errEl) errEl.textContent = "Invalid email or number";
      hasError = true;
    } else if (existingAccount) {
      document.getElementById("signup-id-wrap")?.classList.add("input-error");
      const errEl = document.getElementById("signup-id-error");
      if (errEl) errEl.textContent = "Account already exists. Please Sign In.";
      hasError = true;
    } else {
      document.getElementById("signup-id-wrap")?.classList.remove("input-error");
      const errEl = document.getElementById("signup-id-error");
      if (errEl) errEl.textContent = "";
    }

    // 3. Password Check (At least 8 characters)
    if (!passEl || passEl.value.length < PASSWORD_MIN_LENGTH) {
      document.getElementById("signup-pass-wrap")?.classList.add("input-error");
      const errEl = document.getElementById("signup-pass-error");
      if (errEl) errEl.textContent = "Please enter at least 8 characters";
      hasError = true;
    } else {
      document.getElementById("signup-pass-wrap")?.classList.remove("input-error");
      const errEl = document.getElementById("signup-pass-error");
      if (errEl) errEl.textContent = "";
    }

    // 4. Confirm Password Check
    if (!confirmEl || !confirmEl.value || confirmEl.value !== passEl.value) {
      document.getElementById("signup-confirm-wrap")?.classList.add("input-error");
      const errEl = document.getElementById("signup-confirm-error");
      if (errEl) errEl.textContent = "Password does not match";
      hasError = true;
    } else {
      document.getElementById("signup-confirm-wrap")?.classList.remove("input-error");
      const errEl = document.getElementById("signup-confirm-error");
      if (errEl) errEl.textContent = "";
    }

    if (hasError) return;

    const newAcc = {
      fullName,
      identifier,
      password: passEl.value,
      mobileNumber: identifier,
      loginCount: 0,
      role: fullName.toLowerCase().includes("admin") ? "Admin" : "User",
      createdAt: new Date().toISOString()
    };

    const accounts = getRegisteredAccounts();
    accounts.push(newAcc);
    saveRegisteredAccounts(accounts);

    insertSupabaseRecord("registered_users", {
      full_name: fullName,
      identifier: identifier,
      mobile_number: newAcc.mobileNumber
    });

    document.getElementById("signup-form")?.reset();
    signupView?.classList.remove("active-view");
    signinView?.classList.add("active-view");

    const signinIdEl = document.getElementById("signin-identifier");
    if (signinIdEl) signinIdEl.value = identifier;

    showFormAlert(
      "signin-alert-box",
      `Account created for ${fullName}! Please Sign In to continue.`,
      true
    );
  });

  // SIGN IN
  document.getElementById("signin-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFormAlert("signin-alert-box");

    const idEl = document.getElementById("signin-identifier");
    const passEl = document.getElementById("signin-password");
    const password = passEl ? passEl.value : "";

    let hasError = false;

    // 1. Check Identifier (Email or Number) at Account Existence
    const idValid = validateIdentifierInput(
      idEl,
      document.getElementById("signin-id-wrap"),
      document.getElementById("signin-id-error")
    );
    const identifier = idEl ? idEl.value.trim() : "";
    const existingAccount = findAccountByIdentifier(identifier);

    const signinIdWrap = document.getElementById("signin-id-wrap");
    const signinIdErr = document.getElementById("signin-id-error");
    const signinPassWrap = document.getElementById("signin-pass-wrap");
    const signinPassErr = document.getElementById("signin-pass-error");

    if (!idValid) {
      signinIdWrap?.classList.add("input-error");
      if (signinIdErr) signinIdErr.textContent = "Invalid email or number";
      showFormAlert("signin-alert-box", "Invalid email or number", false);
      hasError = true;
    } else if (!existingAccount) {
      signinIdWrap?.classList.add("input-error");
      const msg = "Account does not exist! Please sign up to access the dashboard.";
      if (signinIdErr) signinIdErr.textContent = msg;
      showFormAlert("signin-alert-box", msg, false);
      hasError = true;
    } else {
      signinIdWrap?.classList.remove("input-error");
      if (signinIdErr) signinIdErr.textContent = "";
    }

    // 2. Check Password
    if (existingAccount && !password) {
      signinPassWrap?.classList.add("input-error");
      if (signinPassErr) signinPassErr.textContent = "Please enter your password";
      showFormAlert("signin-alert-box", "Please enter your password", false);
      hasError = true;
    } else if (existingAccount && password !== existingAccount.password) {
      signinPassWrap?.classList.add("input-error");
      if (signinPassErr) signinPassErr.textContent = "The password you enter is incorrect";
      showFormAlert("signin-alert-box", "The password you enter is incorrect", false);
      hasError = true;
    } else {
      signinPassWrap?.classList.remove("input-error");
      if (signinPassErr) signinPassErr.textContent = "";
    }

    if (hasError) return;

    // I-save ang active session para manatili sa Dashboard kahit i-refresh ang browser
    localStorage.setItem(
      "copracure_active_session",
      JSON.stringify({
        identifier: existingAccount.identifier,
        fullName: existingAccount.fullName
      })
    );

    const previousLogins = Number(existingAccount.loginCount || 0);
    state.isFirstTimeLogin = previousLogins === 0;

    const accounts = getRegisteredAccounts();
    const accIdx = accounts.findIndex(
      (a) => a && typeof a.identifier === "string" && a.identifier.trim().toLowerCase() === identifier.toLowerCase()
    );
    if (accIdx !== -1) {
      accounts[accIdx].loginCount = previousLogins + 1;
      saveRegisteredAccounts(accounts);
    }

    state.currentUserFullName = existingAccount.fullName || "User";
    state.currentUser = state.currentUserFullName.split(" ")[0];
    state.currentUserIdentifier = existingAccount.identifier;
    state.smsRecipientNumber = existingAccount.identifier;

    // Lumipat agad sa Dashboard view
    signinView?.classList.remove("active-view");
    signupView?.classList.remove("active-view");
    dashboardView?.classList.add("active-view");

    // Null-safe updates sa Dashboard UI
    try {
      const smsActiveEl = document.getElementById("sms-active-number");
      if (smsActiveEl) smsActiveEl.textContent = existingAccount.identifier;

      const smsInputEl = document.getElementById("sms-recipient-input");
      if (smsInputEl) smsInputEl.value = existingAccount.identifier;

      updateDashboardWelcomeBanner();

      if (state.isFirstTimeLogin) {
        const welcomeSms = `Thank you for signing In, ${state.currentUser}! Welcome to CopraCure Dashboard!`;
        addNotification(welcomeSms, false, true, welcomeSms);
      } else {
        addNotification(`Welcome Back, ${state.currentUser}! Signed in to CopraCure Dashboard.`, false, false);
      }
    } catch (uiErr) {
      console.warn("Non-critical UI update warning:", uiErr);
    }
  });

  // LOG OUT
  document.getElementById("btn-logout")?.addEventListener("click", () => {
    localStorage.removeItem("copracure_active_session");
    dashboardView?.classList.remove("active-view");
    signinView?.classList.add("active-view");
    const passInput = document.getElementById("signin-password");
    if (passInput) passInput.value = "";
    showToast("Signed out successfully.");
  });
}

/* ==========================================================================
   5. USER PROFILE MODAL (UPDATE ACCOUNT -> SENDS "AccountUpdated!" SMS)
   ========================================================================== */
function initUserProfileModal() {
  const btnProfile = document.getElementById("btn-user-profile");
  const modal = document.getElementById("profile-modal");
  const btnClose = document.getElementById("close-profile-modal");
  const formUpdate = document.getElementById("profile-update-form");
  const btnDelete = document.getElementById("btn-delete-account");

  btnProfile?.addEventListener("click", () => {
    hideFormAlert("profile-alert-box");
    const acc = findAccountByIdentifier(state.currentUserIdentifier);
    const nameInput = document.getElementById("profile-fullname");
    const idInput = document.getElementById("profile-identifier");
    const passInput = document.getElementById("profile-password");

    if (nameInput) nameInput.value = acc ? acc.fullName : state.currentUserFullName;
    if (idInput) idInput.value = acc ? acc.identifier : state.currentUserIdentifier;
    if (passInput) passInput.value = acc ? acc.password : "12345678";
    modal?.classList.add("open");
  });

  btnClose?.addEventListener("click", () => modal?.classList.remove("open"));

  formUpdate?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newName = document.getElementById("profile-fullname")?.value.trim() || "";
    const idEl = document.getElementById("profile-identifier");
    const passEl = document.getElementById("profile-password");

    const idValid = validateIdentifierInput(idEl, document.getElementById("profile-id-wrap"), document.getElementById("profile-id-error"));
    const passValid = validateSignupPasswordInput(passEl, document.getElementById("profile-pass-wrap"), document.getElementById("profile-pass-error"));

    if (!newName || !idValid || !passValid) {
      return;
    }

    const accounts = getRegisteredAccounts();
    const idx = accounts.findIndex(
      (a) => a && typeof a.identifier === "string" && a.identifier.toLowerCase() === state.currentUserIdentifier.toLowerCase()
    );
    const prevLoginCount = idx !== -1 ? Number(accounts[idx].loginCount || 1) : 1;

    const updatedAccount = {
      fullName: newName,
      identifier: idEl.value.trim(),
      password: passEl.value,
      mobileNumber: idEl.value.trim(),
      loginCount: prevLoginCount,
      createdAt: new Date().toISOString()
    };

    if (idx !== -1) {
      accounts[idx] = updatedAccount;
    } else {
      accounts.push(updatedAccount);
    }
    saveRegisteredAccounts(accounts);

    localStorage.setItem(
      "copracure_active_session",
      JSON.stringify({
        identifier: updatedAccount.identifier,
        fullName: updatedAccount.fullName
      })
    );

    state.currentUserFullName = newName;
    state.currentUser = newName.split(" ")[0];
    state.currentUserIdentifier = updatedAccount.identifier;
    state.smsRecipientNumber = updatedAccount.identifier;

    updateDashboardWelcomeBanner();
    const smsActiveEl = document.getElementById("sms-active-number");
    if (smsActiveEl) smsActiveEl.textContent = updatedAccount.identifier;
    const smsInputEl = document.getElementById("sms-recipient-input");
    if (smsInputEl) smsInputEl.value = updatedAccount.identifier;

    addNotification(
      `AccountUpdated! Profile details for ${newName} have been updated.`,
      false,
      true,
      `AccountUpdated! Hello ${state.currentUser}, your CopraCure account details were successfully updated.`
    );

    showFormAlert("profile-alert-box", "AccountUpdated! Your profile was updated successfully.", true);
    showToast("AccountUpdated!");
  });

  btnDelete?.addEventListener("click", async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the account of ${state.currentUserFullName}?`
    );
    if (!confirmed) return;

    // 1. I-delete ang record mula sa Supabase 'registered_users' table
    if (supabaseClient) {
      try {
        // Sinisiguro nating mabubura kahit alin sa identifier o mobile_number ang tumutugma
        const { error } = await supabaseClient
          .from("registered_users")
          .delete()
          .or(`identifier.eq.${state.currentUserIdentifier},mobile_number.eq.${state.currentUserIdentifier}`);

        if (error) {
          console.error("❌ Supabase Delete Error:", error.message);
        } else {
          console.log("✅ Account successfully deleted from Supabase!");
        }
      } catch (err) {
        console.error("❌ System error deleting from Supabase:", err.message);
      }
    }

    // 2. I-filter at alisin sa local storage ang account
    const accounts = getRegisteredAccounts().filter(
      (a) => a && typeof a.identifier === "string" && a.identifier.toLowerCase() !== state.currentUserIdentifier.toLowerCase()
    );
    saveRegisteredAccounts(accounts);
    localStorage.removeItem("copracure_active_session");

    // 3. I-reset ang view patungo sa Sign In screen
    modal?.classList.remove("open");
    document.getElementById("dashboard-view")?.classList.remove("active-view");
    document.getElementById("signin-view")?.classList.add("active-view");
    
    const signinId = document.getElementById("signin-identifier");
    const signinPass = document.getElementById("signin-password");
    if (signinId) signinId.value = "";
    if (signinPass) signinPass.value = "";

    showFormAlert("signin-alert-box", "Your account has been deleted.", false);
    showToast("Account deleted successfully.");
  });
}

/* ==========================================================================
   6. FORGOT PASSWORD MODAL
   ========================================================================== */
function initForgotPasswordModal() {
  const modal = document.getElementById("forgot-modal");
  const openLink = document.getElementById("forgot-password-link");
  const closeBtn = document.getElementById("close-forgot-modal");
  const tabSms = document.getElementById("tab-reset-sms");
  const tabEmail = document.getElementById("tab-reset-email");
  const targetLabel = document.getElementById("reset-target-label");
  const resetInput = document.getElementById("reset-identifier");
  const btnSendCode = document.getElementById("btn-send-reset-code");
  const btnConfirmPass = document.getElementById("btn-confirm-new-password");
  const step2 = document.getElementById("reset-step-2");

  openLink?.addEventListener("click", (e) => {
    e.preventDefault();
    hideFormAlert("forgot-alert-box");
    if (step2) step2.style.display = "none";
    if (resetInput) {
      resetInput.value = document.getElementById("signin-identifier")?.value.trim() || "";
    }
    modal?.classList.add("open");
  });

  closeBtn?.addEventListener("click", () => modal?.classList.remove("open"));

  tabSms?.addEventListener("click", () => {
    state.resetMethod = "sms";
    tabSms.classList.add("active");
    tabEmail?.classList.remove("active");
    if (targetLabel) targetLabel.textContent = "REGISTERED MOBILE NUMBER";
    if (resetInput) resetInput.placeholder = "09123456789 or +639123456789";
  });

  tabEmail?.addEventListener("click", () => {
    state.resetMethod = "email";
    tabEmail.classList.add("active");
    tabSms?.classList.remove("active");
    if (targetLabel) targetLabel.textContent = "REGISTERED EMAIL ADDRESS";
    if (resetInput) resetInput.placeholder = "example@gmail.com";
  });

  btnSendCode?.addEventListener("click", async () => {
    hideFormAlert("forgot-alert-box");
    if (!resetInput) return;

    if (!validateIdentifierInput(resetInput, document.getElementById("reset-id-wrap"), document.getElementById("reset-id-error"))) {
      return;
    }

    const targetVal = resetInput.value.trim();
    const account = findAccountByIdentifier(targetVal);
    if (!account) {
      document.getElementById("reset-id-wrap")?.classList.add("input-error");
      const errEl = document.getElementById("reset-id-error");
      if (errEl) errEl.textContent = "Invalid email or number";
      return;
    }

    state.generatedResetOtp = String(Math.floor(100000 + Math.random() * 900000));
    state.resetTargetAccount = account.identifier;
    if (step2) step2.style.display = "block";

    const otpMessage = `COPRACURE PASSWORD RESET: Your 6-digit OTP Code is ${state.generatedResetOtp}.`;
    await dispatchDirectSms(targetVal, otpMessage, true, false);
    showFormAlert("forgot-alert-box", `OTP Code sent to ${targetVal}!`, true);
  });

  btnConfirmPass?.addEventListener("click", () => {
    const otpEntered = document.getElementById("reset-otp-input")?.value.trim() || "";
    const newPassEl = document.getElementById("reset-new-password");

    if (otpEntered !== state.generatedResetOtp) {
      showFormAlert("forgot-alert-box", "Invalid 6-digit OTP Code.");
      return;
    }

    const passValid = validateSignupPasswordInput(
      newPassEl,
      document.getElementById("reset-pass-wrap"),
      document.getElementById("reset-pass-error")
    );
    if (!passValid) return;

    const accounts = getRegisteredAccounts();
    const idx = accounts.findIndex(
      (a) => a && typeof a.identifier === "string" && a.identifier.toLowerCase() === state.resetTargetAccount.toLowerCase()
    );
    if (idx !== -1) {
      accounts[idx].password = newPassEl.value;
      saveRegisteredAccounts(accounts);
    }

    modal?.classList.remove("open");
    const signinId = document.getElementById("signin-identifier");
    const signinPass = document.getElementById("signin-password");
    if (signinId) signinId.value = state.resetTargetAccount;
    if (signinPass) signinPass.value = "";
    showFormAlert("signin-alert-box", "AccountUpdated! Password reset successful. Please Sign In.", true);
  });
}

function initPasswordVisibility() {
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      btn.innerHTML = `<i data-lucide="${isPass ? "eye" : "eye-off"}"></i>`;
      if (window.lucide) lucide.createIcons();
    });
  });
}

/* ==========================================================================
   7. IMPORTANT SMS DISPATCH ENGINE
   ========================================================================== */
function showLiveSmsBanner(recipient, messageText, isUrgent = false) {
  const banner = document.getElementById("live-sms-banner");
  if (!banner) return;

  const senderTitle = isUrgent
    ? "COPRACURE URGENT CHAMBER ALERT • SMS SENT"
    : "COPRACURE IMPORTANT SMS • SENT";

  banner.classList.toggle("urgent-banner", isUrgent);
  const senderEl = document.getElementById("sms-banner-sender");
  const recEl = document.getElementById("sms-banner-recipient");
  const txtEl = document.getElementById("sms-banner-text");

  if (senderEl) senderEl.textContent = senderTitle;
  if (recEl) recEl.textContent = `To: ${recipient}`;
  if (txtEl) txtEl.textContent = messageText;

  banner.classList.add("show");
  setTimeout(() => {
    banner.classList.remove("show");
  }, 8000);
}

async function dispatchDirectSms(recipientTarget, messageText, isUrgent = false, alsoLogNotification = false) {
  const cleanRecipient = (recipientTarget || state.smsRecipientNumber || "09123456789").trim();
  const timestamp = new Date().toLocaleTimeString();
  const isEmailTarget = cleanRecipient.includes("@");

  showLiveSmsBanner(cleanRecipient, messageText, isUrgent);

  const gatewayUrl =
    document.getElementById("sms-gateway-url")?.value.trim() ||
    localStorage.getItem("copracure_sms_gateway_url") ||
    "";
  const apiKey =
    document.getElementById("sms-api-key")?.value.trim() ||
    localStorage.getItem("copracure_sms_api_key") ||
    "";

  let modeUsed = isEmailTarget
    ? "Important Email Alert"
    : state.wifiOnline
    ? "Important GSM SMS"
    : "OFFLINE GSM SIM800L";

  if (gatewayUrl && gatewayUrl.startsWith("http")) {
    try {
      const isTextBee = gatewayUrl.includes("textbee.dev");
      const response = await fetch(gatewayUrl, {
        method: "POST",
        headers: isTextBee
          ? { "Content-Type": "application/json", "x-api-key": apiKey }
          : { "Content-Type": "application/json" },
        body: JSON.stringify(
          isTextBee
            ? { recipients: [cleanRecipient], message: messageText }
            : { apikey: apiKey, number: cleanRecipient, email: cleanRecipient, message: messageText, sendername: "COPRACURE" }
        )
      });
      if (response.ok) {
        modeUsed = isTextBee ? "TextBee Android GSM" : "Live Cloud Webhook";
      }
    } catch (err) {
      console.warn("SMS/Email Webhook skipped:", err.message);
    }
  }

  const useNativeSmsApp = document.getElementById("sms-open-native-app")?.checked;
  if (useNativeSmsApp && !isEmailTarget) {
    const smsUri = `sms:${encodeURIComponent(cleanRecipient)}?body=${encodeURIComponent(messageText)}`;
    window.open(smsUri, "_self");
  }

  state.smsMessages.unshift({
    to: cleanRecipient,
    message: messageText,
    time: timestamp,
    mode: modeUsed,
    urgent: isUrgent
  });
  renderPhoneSmsInbox();

  if (alsoLogNotification) {
    addNotification(`Important SMS sent to ${cleanRecipient}: "${messageText}"`, isUrgent, false);
  }

  await insertSupabaseRecord("sms_logs", {
    session_id: state.sessionId,
    recipient_number: cleanRecipient,
    message_body: messageText,
    transmission_mode: modeUsed
  });
}

function initSmsAlertSystem() {
  const smsModal = document.getElementById("sms-modal");
  const btnOpenBar = document.getElementById("btn-configure-sms");
  const btnOpenSide = document.getElementById("btn-open-sms-settings");
  const btnClose = document.getElementById("close-sms-modal");
  const btnSendNow = document.getElementById("btn-send-chamber-sms");
  const btnSave = document.getElementById("btn-save-sms-settings");
  const smsInput = document.getElementById("sms-recipient-input");
  const gatewayUrlInput = document.getElementById("sms-gateway-url");
  const apiKeyInput = document.getElementById("sms-api-key");
  const btnWifiToggle = document.getElementById("btn-toggle-wifi-sim");

  if (gatewayUrlInput) gatewayUrlInput.value = localStorage.getItem("copracure_sms_gateway_url") || "";
  if (apiKeyInput) apiKeyInput.value = localStorage.getItem("copracure_sms_api_key") || "";

  function openModal() {
    renderPhoneSmsInbox();
    smsModal?.classList.add("open");
  }

  btnOpenBar?.addEventListener("click", openModal);
  btnOpenSide?.addEventListener("click", openModal);
  btnClose?.addEventListener("click", () => smsModal?.classList.remove("open"));

  btnSave?.addEventListener("click", () => {
    if (!smsInput) return;
    if (!validateIdentifierInput(smsInput, document.getElementById("sms-input-wrap"), document.getElementById("sms-input-error"))) {
      return;
    }

    const recipientVal = smsInput.value.trim();
    if (gatewayUrlInput) localStorage.setItem("copracure_sms_gateway_url", gatewayUrlInput.value.trim());
    if (apiKeyInput) localStorage.setItem("copracure_sms_api_key", apiKeyInput.value.trim());

    state.smsRecipientNumber = recipientVal;
    const activeNumEl = document.getElementById("sms-active-number");
    if (activeNumEl) activeNumEl.textContent = recipientVal;
    showToast("SMS Gateway settings saved.");
    smsModal?.classList.remove("open");
  });

  btnSendNow?.addEventListener("click", () => {
    const urgentMsg = `High Temperature! Chamber ${state.sessionId} reached ${state.temperature.toFixed(1)}°C (Mold: ${state.moldCategory}). Check chamber immediately!`;
    triggerLcdRedAlert("ALRT:CHAMBER CHK", urgentMsg);
    addNotification(urgentMsg, true, true, urgentMsg);
  });

  btnWifiToggle?.addEventListener("click", () => {
    state.wifiOnline = !state.wifiOnline;
    const dot = document.getElementById("wifi-pulse-dot");
    const txt = document.getElementById("wifi-status-text");

    if (!state.wifiOnline) {
      dot?.classList.add("offline");
      if (txt) txt.textContent = "Wi-Fi OFFLINE • GSM Auto-SMS Active";
      addNotification(
        `Wi-Fi connection lost on ${state.sessionId}. Offline GSM SIM800L standby active.`,
        true,
        false
      );
    } else {
      dot?.classList.remove("offline");
      if (txt) txt.textContent = "Wi-Fi Online • Critical SMS Ready";
      addNotification(`Wi-Fi connection restored for ${state.sessionId}.`, false, false);
    }
  });
}

function renderPhoneSmsInbox() {
  const container = document.getElementById("phone-sms-messages");
  const sectionOutbox = document.getElementById("section-sms-outbox-list");

  const html =
    state.smsMessages.length === 0
      ? `<div class="sms-bubble">No important SMS alerts sent yet.</div>`
      : state.smsMessages
          .map(
            (m) => `
          <div class="sms-bubble ${m.urgent ? "urgent" : ""}">
            <div class="sms-bubble-meta">
              <span>To: ${m.to} (${m.mode})</span>
              <span>${m.time}</span>
            </div>
            <div>${m.message}</div>
          </div>
        `
          )
          .join("");

  if (container) container.innerHTML = html;
  if (sectionOutbox) sectionOutbox.innerHTML = html;
}

/* ==========================================================================
   8. DRYING SESSIONS MODULE
   ========================================================================== */
function initDryingSessionsModule() {
  const btnPauseResume = document.getElementById("btn-pause-resume-session");
  const badge = document.getElementById("session-state-badge");
  const stageText = document.getElementById("session-stage-text");

  if (!btnPauseResume) return;

  btnPauseResume.addEventListener("click", () => {
    state.sessionActive = !state.sessionActive;
    if (state.sessionActive) {
      if (badge) badge.innerHTML = `<span class="pulse-dot"></span> ACTIVE SESSION: <strong>${state.sessionId}</strong>`;
      if (stageText) stageText.textContent = "Stage 2: Falling-Rate Drying";
      btnPauseResume.innerHTML = `<i data-lucide="pause"></i> <span>Pause Session</span>`;
      addNotification(`Drying Session ${state.sessionId} RESUMED.`, false, false);
    } else {
      if (badge) badge.innerHTML = `<span class="pulse-dot offline"></span> STANDBY / PAUSED: <strong>${state.sessionId}</strong>`;
      if (stageText) stageText.textContent = "Standby Mode";
      btnPauseResume.innerHTML = `<i data-lucide="play"></i> <span>Resume Session</span>`;
      addNotification(`Drying Session ${state.sessionId} PAUSED.`, false, false);
    }
    if (window.lucide) lucide.createIcons();
  });
}

function updateDryingSessionProgressUI() {
  const mi = state.initialMoisture;
  const mc = state.moisture;
  const target = state.targetMoisture;
  const totalToDrop = Math.max(1, mi - target);
  const droppedSoFar = Math.max(0, mi - mc);
  const pct = Math.min(100, Math.max(0, (droppedSoFar / totalToDrop) * 100));

  const sessMc = document.getElementById("sess-mc");
  const sessRed = document.getElementById("sess-reduction-pct");
  const trajMid = document.getElementById("trajectory-mid-label");
  const progBar = document.getElementById("session-main-progress-bar");

  if (sessMc) sessMc.textContent = `${mc.toFixed(1)}%`;
  if (sessRed) sessRed.textContent = `${pct.toFixed(1)}% Complete`;
  if (trajMid) trajMid.textContent = `Current Moisture: ${mc.toFixed(1)}% WB (${pct.toFixed(1)}% toward Safe Copra Threshold)`;
  if (progBar) progBar.style.width = `${pct.toFixed(1)}%`;
}

/* ==========================================================================
   9. MOLD CLASSIFICATION & CONTROL SYSTEM (MOLD TRIGGERS SMS + RED LCD ALERT)
   ========================================================================== */
function setMoldClassificationState(level) {
  state.moldCategory = level;

  const riskText = document.getElementById("risk-text");
  const riskDot = document.getElementById("risk-dot");
  const pillOpt = document.getElementById("pill-optimal");
  const pill48 = document.getElementById("pill-48h-warning");
  const pillIso = document.getElementById("pill-mold-isolation");
  const cvText = document.getElementById("cv-class-text");
  const camNote = document.getElementById("cam-surface-note");
  const selectCvMold = document.getElementById("select-cv-mold");

  document.querySelectorAll(".mold-state-btn").forEach((btn) => {
    const bState = btn.getAttribute("data-mold-state");
    btn.className = "mold-state-btn";
    if (bState === level) {
      btn.classList.add(level === "NONE" ? "active-none" : level === "LOW" ? "active-low" : "active-high");
    }
  });

  if (level === "HIGH") {
    if (riskText) {
      riskText.textContent = "HIGH RISK (ISOLATION REQUIRED)";
      riskText.style.color = "#dc2626";
    }
    if (riskDot) riskDot.className = "status-dot red";
    if (pillOpt) pillOpt.className = "proto-pill";
    if (pill48) pill48.className = "proto-pill active-red";
    if (pillIso) pillIso.className = "proto-pill active-red";
    if (cvText) {
      cvText.textContent = "HIGH (ISOLATION)";
      cvText.style.color = "#dc2626";
    }
    if (camNote) camNote.textContent = "Visible Mold Classification: HIGH — Critical Contamination Detected!";
    if (selectCvMold) selectCvMold.value = "HIGH";

    const moldSms = `Mold Detected in Chamber! HIGH mold contamination detected on ${state.sessionId}. Immediate sample isolation required!`;
    triggerLcdRedAlert("ALRT:HIGH MOLD!", moldSms);
    addNotification(moldSms, true, true, moldSms);
  } else if (level === "LOW") {
    if (riskText) {
      riskText.textContent = "MODERATE RISK (LOW MOLD WARNING)";
      riskText.style.color = "#d97706";
    }
    if (riskDot) riskDot.className = "status-dot amber";
    if (pillOpt) pillOpt.className = "proto-pill";
    if (pill48) pill48.className = "proto-pill active-amber";
    if (pillIso) pillIso.className = "proto-pill";
    if (cvText) {
      cvText.textContent = "LOW (EARLY WARNING)";
      cvText.style.color = "#d97706";
    }
    if (camNote) camNote.textContent = "Visible Mold Classification: LOW — Increasing airflow & thermal check.";
    if (selectCvMold) selectCvMold.value = "LOW";

    const lowMoldSms = `Mold Warning in Chamber! Early spore (LOW mold) detected on ${state.sessionId}. Increasing chamber ventilation.`;
    triggerLcdRedAlert("ALRT:LOW MOLD!", lowMoldSms);
    addNotification(lowMoldSms, true, true, lowMoldSms);
  } else {
    if (riskText) {
      riskText.textContent = "LOW RISK (OPTIMAL)";
      riskText.style.color = "#16a34a";
    }
    if (riskDot) riskDot.className = "status-dot green";
    if (pillOpt) pillOpt.className = "proto-pill active-green";
    if (pill48) pill48.className = "proto-pill";
    if (pillIso) pillIso.className = "proto-pill";
    if (cvText) {
      cvText.textContent = "NONE (0%)";
      cvText.style.color = "#15803d";
    }
    if (camNote) camNote.textContent = "Visible Mold Classification: NONE (Healthy Kernel Surface)";
    if (selectCvMold) selectCvMold.value = "NONE";

    clearLcdRedAlert();
    addNotification(
      `ESP32-CAM Mold Classification verified as NONE (Clean Copra Surface) for ${state.sessionId}.`,
      false,
      false
    );
  }

  update16x2LcdText();
  updateBatchSafetyStatus();
}

function initCameraSsrAndActuators() {
  document.querySelectorAll(".mold-state-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetState = btn.getAttribute("data-mold-state");
      setMoldClassificationState(targetState);
    });
  });

  const btnSsr = document.getElementById("btn-ssr-engaged");
  const wattageEl = document.getElementById("heater-wattage");
  const ssrStateText = document.getElementById("ssr-state-text");
  const flameIcon = document.getElementById("heater-flame-icon");

  btnSsr?.addEventListener("click", () => {
    state.ssrEngaged = !state.ssrEngaged;

    if (state.ssrEngaged) {
      btnSsr.textContent = "ENGAGED";
      btnSsr.classList.remove("disengaged");
      btnSsr.classList.add("engaged");
      if (wattageEl) wattageEl.textContent = "600 W";
      if (ssrStateText) ssrStateText.textContent = "SSR State: ON (Closed-Loop Active)";
      if (flameIcon) flameIcon.classList.add("flame-active");
    } else {
      btnSsr.textContent = "DISENGAGED";
      btnSsr.classList.remove("engaged");
      btnSsr.classList.add("disengaged");
      if (wattageEl) wattageEl.textContent = "0 W";
      if (ssrStateText) ssrStateText.textContent = "SSR State: OFF (Manual Standby)";
      if (flameIcon) flameIcon.classList.remove("flame-active");
    }

    update16x2LcdText();
    addNotification(
      `Control System: 600W PTC Heater SSR Module switched to ${state.ssrEngaged ? "ENGAGED" : "DISENGAGED"}.`,
      false,
      false
    );
  });

  document.getElementById("btn-refresh-cam")?.addEventListener("click", () => {
    const now = new Date().toLocaleTimeString();
    const camTs = document.getElementById("cam-timestamp");
    if (camTs) camTs.textContent = `${state.sessionId} • ${now}`;
    showToast("ESP32-CAM captured a new overhead frame.");
  });

  const viewport = document.getElementById("camera-viewport");
  document.getElementById("btn-cam-flash")?.addEventListener("click", () => {
    state.camFlash = !state.camFlash;
    viewport?.classList.toggle("flash-active", state.camFlash);
    showToast(`ESP32-CAM Flash: ${state.camFlash ? "ON" : "OFF"}`);
  });

  const btnMode = document.getElementById("btn-toggle-control-mode");
  const modeText = document.getElementById("control-mode-text");
  btnMode?.addEventListener("click", () => {
    state.autoMode = !state.autoMode;
    if (modeText) modeText.textContent = state.autoMode ? "AUTO ENGAGED" : "MANUAL OVERRIDE";
    update16x2LcdText();
    addNotification(
      `Control System switched to ${state.autoMode ? "AUTOMATED Mode" : "MANUAL Override Mode"}.`,
      false,
      false
    );
  });

  document.querySelectorAll(".actuator-toggle").forEach((toggle) => {
    toggle.addEventListener("change", (e) => {
      const eq = e.target.getAttribute("data-equipment");
      const iconBoxId = e.target.getAttribute("data-icon-box");
      const isOn = e.target.checked;

      if (iconBoxId) {
        const boxEl = document.getElementById(iconBoxId);
        if (boxEl) boxEl.classList.toggle("spin-active", isOn);
      }

      if (state.autoMode) {
        state.autoMode = false;
        if (modeText) modeText.textContent = "MANUAL OVERRIDE";
      }

      addNotification(`Control System: ${eq} turned ${isOn ? "ON" : "OFF"}.`, false, false);
    });
  });

  const slider = document.getElementById("led-brightness-slider");
  const val = document.getElementById("led-brightness-val");
  slider?.addEventListener("input", (e) => {
    if (val) val.textContent = `${e.target.value}%`;
  });
}

/* ==========================================================================
   10. PREVENTIVE ALERT MODULE (HIGH TEMP, MOLD, 48H WARNING + LCD RED ALERT)
   ========================================================================== */
function initPreventiveAlertModule() {
  const btnSimHighTemp = document.getElementById("btn-simulate-high-temp");
  const btnSimMold = document.getElementById("btn-simulate-mold");
  const btnSimRate = document.getElementById("btn-simulate-rate-warn");
  const btnReset = document.getElementById("btn-reset-mold");

  if (btnSimHighTemp) {
    btnSimHighTemp.addEventListener("click", () => {
      state.temperature = 64.8;
      const tempEl = document.getElementById("val-temperature");
      const riskText = document.getElementById("risk-text");
      const riskDot = document.getElementById("risk-dot");

      if (tempEl) tempEl.textContent = state.temperature.toFixed(1);
      if (riskText) {
        riskText.textContent = "HIGH TEMPERATURE ALERT (>60°C)";
        riskText.style.color = "#dc2626";
      }
      if (riskDot) riskDot.className = "status-dot red";

      const highTempSms = `High Temperature! Chamber ${state.sessionId} reached ${state.temperature.toFixed(1)}°C (exceeding 60°C cutoff). KSD301 & Exhaust Fans triggered!`;
      triggerLcdRedAlert("ALRT:HIGH TEMP!", highTempSms);
      addNotification(highTempSms, true, true, highTempSms);
    });
  }

  btnSimMold?.addEventListener("click", () => {
    setMoldClassificationState("HIGH");
  });

  if (btnSimRate) {
    btnSimRate.addEventListener("click", () => {
      const pillOpt = document.getElementById("pill-optimal");
      const pill48 = document.getElementById("pill-48h-warning");
      const riskText = document.getElementById("risk-text");
      const riskDot = document.getElementById("risk-dot");

      if (pillOpt) pillOpt.className = "proto-pill";
      if (pill48) pill48.className = "proto-pill active-amber";
      if (riskText) {
        riskText.textContent = "48H DRYING RATE WARNING";
        riskText.style.color = "#d97706";
      }
      if (riskDot) riskDot.className = "status-dot amber";

      const rateWarnSms = `48H Drying Rate Warning! Moisture reduction on ${state.sessionId} is slower than target trajectory. Check heater and airflow.`;
      triggerLcdRedAlert("ALRT:SLOW DRYING", rateWarnSms);
      addNotification(rateWarnSms, true, true, rateWarnSms);
    });
  }

  btnReset?.addEventListener("click", () => {
    state.temperature = 56.1;
    const tempEl = document.getElementById("val-temperature");
    if (tempEl) tempEl.textContent = state.temperature.toFixed(1);
    clearLcdRedAlert();
    setMoldClassificationState("NONE");
    showToast("Chamber alerts reset to optimal state.");
  });
}

/* ==========================================================================
   11. SENSOR CALIBRATION MODULE (ADMIN / DEVELOPER ONLY LOCK)
   ========================================================================== */
function initSensorCalibrationModule() {
  const refTempInput = document.getElementById("ref-input-temp");
  const refRhInput = document.getElementById("ref-input-rh");
  const refMcInput = document.getElementById("ref-input-mc");

  const btnRunCal = document.getElementById("btn-run-calibration");
  const btnZeroProbe = document.getElementById("btn-zero-probe");
  const btnSimDrift = document.getElementById("btn-sim-drift");

  const btnAdminToggle = document.getElementById("btn-admin-cal-toggle");
  const adminModal = document.getElementById("admin-cal-modal");
  const closeAdminModal = document.getElementById("close-admin-cal-modal");
  const btnVerifyAdmin = document.getElementById("btn-verify-admin-cal");
  const adminPassInput = document.getElementById("admin-passcode-input");

  renderCalibrationHistoryTable();
  computeAndRenderCalibrationMetrics(false);

  btnAdminToggle?.addEventListener("click", () => {
    if (state.adminCalibrationUnlocked) {
      setAdminCalibrationAccess(false);
      showToast("Admin / Developer Calibration Mode locked.");
    } else {
      hideFormAlert("admin-cal-alert-box");
      if (adminPassInput) adminPassInput.value = "";
      const errEl = document.getElementById("admin-pass-error");
      if (errEl) errEl.textContent = "";
      adminModal?.classList.add("open");
    }
  });

  closeAdminModal?.addEventListener("click", () => adminModal?.classList.remove("open"));

  btnVerifyAdmin?.addEventListener("click", () => {
    const pass = adminPassInput ? adminPassInput.value.trim() : "";
    if (pass !== ADMIN_DEVELOPER_PASSCODE) {
      document.getElementById("admin-pass-wrap")?.classList.add("input-error");
      const errEl = document.getElementById("admin-pass-error");
      if (errEl) errEl.textContent = "The password you enter is incorrect";
      return;
    }

    document.getElementById("admin-pass-wrap")?.classList.remove("input-error");
    const errEl = document.getElementById("admin-pass-error");
    if (errEl) errEl.textContent = "";
    adminModal?.classList.remove("open");
    setAdminCalibrationAccess(true);
    showToast("Admin / Developer Calibration Access unlocked!");
  });

  [refTempInput, refRhInput, refMcInput].forEach((input) => {
    if (input) {
      input.addEventListener("input", () => {
        if (!state.adminCalibrationUnlocked) return;
        computeAndRenderCalibrationMetrics(true);
      });
    }
  });

  btnRunCal?.addEventListener("click", () => {
    if (!state.adminCalibrationUnlocked) return;

    const progBox = document.getElementById("cal-progress-box");
    const progBar = document.getElementById("cal-progress-bar");
    const progText = document.getElementById("cal-progress-text");

    if (progBox) progBox.style.display = "block";
    if (progBar) progBar.style.width = "30%";
    if (progText) progText.textContent = "Step 1/3: Sampling SHT31 Temperature & Humidity I2C registers...";

    setTimeout(() => {
      if (progBar) progBar.style.width = "70%";
      if (progText) progText.textContent = "Step 2/3: Comparing Experimental Moisture Probe ADC vs Reference Values...";
    }, 500);

    setTimeout(() => {
      if (progBar) progBar.style.width = "100%";
      if (progText) progText.textContent = "Step 3/3: Applying ESP32 offset factors and verifying MAE thresholds...";

      state.refTemperature = +(state.temperature - 0.1).toFixed(1);
      state.refHumidity = +(state.humidity - 0.3).toFixed(1);
      state.refMoisture = +(state.moisture - 0.2).toFixed(1);

      if (refTempInput) refTempInput.value = state.refTemperature;
      if (refRhInput) refRhInput.value = state.refHumidity;
      if (refMcInput) refMcInput.value = state.refMoisture;

      const metrics = computeAndRenderCalibrationMetrics(false);
      clearLcdRedAlert();

      const now = new Date();
      state.calibrationLogs.unshift({
        date: now.toISOString().slice(0, 10),
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        operator: `Admin / Dev (${state.currentUserFullName})`,
        offsets: `temp_offset = ${metrics.tempOffset}°C | rh_offset = ${metrics.rhOffset}% | mc_offset = ${metrics.mcOffset}%`,
        maeSummary: `T: ${metrics.errTemp}°C | RH: ${metrics.errRh}% | MC: ${metrics.errMc}%`,
        status: state.calibrationStatus
      });

      renderCalibrationHistoryTable();
      addNotification(
        `Sensor Calibration completed by Admin/Developer (${state.currentUserFullName}). Status: ${state.calibrationStatus}.`,
        false,
        false
      );

      setTimeout(() => {
        if (progBox) progBox.style.display = "none";
        if (progBar) progBar.style.width = "0%";
      }, 1000);
    }, 1100);
  });

  btnZeroProbe?.addEventListener("click", () => {
    if (!state.adminCalibrationUnlocked) return;

    state.refMoisture = state.moisture;
    if (refMcInput) refMcInput.value = state.moisture.toFixed(1);
    const offsetCode = document.getElementById("mc-offset-code");
    if (offsetCode) offsetCode.textContent = "mc_offset = 0.00 (ZEROED)";
    computeAndRenderCalibrationMetrics(false);

    const now = new Date();
    state.calibrationLogs.unshift({
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      operator: `Admin / Dev (${state.currentUserFullName})`,
      offsets: "Experimental Moisture Probe Zero/Reset Executed (mc_offset = 0.00%)",
      maeSummary: `T: 0.20°C | RH: 0.40% | MC: 0.00%`,
      status: "Calibrated & Verified"
    });
    renderCalibrationHistoryTable();
    showToast("Moisture Probe zeroed by Admin/Developer.");
  });

  btnSimDrift?.addEventListener("click", () => {
    if (!state.adminCalibrationUnlocked) return;

    if (refTempInput) refTempInput.value = (state.temperature - 1.4).toFixed(1);
    if (refRhInput) refRhInput.value = (state.humidity - 3.2).toFixed(1);
    if (refMcInput) refMcInput.value = (state.moisture - 1.8).toFixed(1);
    computeAndRenderCalibrationMetrics(true);
  });
}

function setAdminCalibrationAccess(unlocked) {
  state.adminCalibrationUnlocked = unlocked;
  const btn = document.getElementById("btn-admin-cal-toggle");
  const banner = document.getElementById("admin-cal-lock-banner");
  const lockMsg = document.getElementById("admin-lock-msg");

  document.querySelectorAll(".cal-admin-only").forEach((el) => {
    el.disabled = !unlocked;
  });

  if (unlocked) {
    btn?.classList.remove("locked");
    btn?.classList.add("unlocked");
    if (btn) btn.innerHTML = `<i data-lucide="unlock"></i> <span>Admin / Developer Mode: UNLOCKED (Click to Lock)</span>`;
    banner?.classList.add("unlocked");
    if (lockMsg) lockMsg.innerHTML = `<strong>Admin / Developer Mode Active:</strong> You can now calibrate the SHT31 and Moisture Probe sensors and adjust the reference values.`;
  } else {
    btn?.classList.remove("unlocked");
    btn?.classList.add("locked");
    if (btn) btn.innerHTML = `<i data-lucide="lock"></i> <span>Admin / Developer Access (Locked)</span>`;
    banner?.classList.remove("unlocked");
    if (lockMsg) lockMsg.innerHTML = `<strong>Restricted Access:</strong> Tanging Admin o Developer lamang ang maaaring mag-calibrate ng sensors at magbago ng reference offsets sa chamber. Pindutin ang <em>Admin / Developer Access</em> (Passcode: <code>admin123</code>) upang buksan.`;
  }

  if (window.lucide) lucide.createIcons();
}

function computeAndRenderCalibrationMetrics(notifyOnAnomaly = false) {
  const liveT = state.temperature;
  const liveRh = state.humidity;
  const liveMc = state.moisture;

  const refT = parseFloat(document.getElementById("ref-input-temp")?.value) || liveT;
  const refRh = parseFloat(document.getElementById("ref-input-rh")?.value) || liveRh;
  const refMc = parseFloat(document.getElementById("ref-input-mc")?.value) || liveMc;

  const errT = Math.abs(liveT - refT);
  const errRh = Math.abs(liveRh - refRh);
  const errMc = Math.abs(liveMc - refMc);

  const offsetT = (refT - liveT).toFixed(2);
  const offsetRh = (refRh - liveRh).toFixed(2);
  const offsetMc = (refMc - liveMc).toFixed(2);

  const calLiveT = document.getElementById("cal-live-temp");
  const calLiveRh = document.getElementById("cal-live-rh");
  const calLiveMc = document.getElementById("cal-live-mc");
  if (calLiveT) calLiveT.textContent = liveT.toFixed(1);
  if (calLiveRh) calLiveRh.textContent = liveRh.toFixed(1);
  if (calLiveMc) calLiveMc.textContent = liveMc.toFixed(1);

  const calErrT = document.getElementById("cal-err-temp");
  const calErrRh = document.getElementById("cal-err-rh");
  const calErrMc = document.getElementById("cal-err-mc");
  if (calErrT) calErrT.textContent = `${errT.toFixed(2)} °C`;
  if (calErrRh) calErrRh.textContent = `${errRh.toFixed(2)} %`;
  if (calErrMc) calErrMc.textContent = `${errMc.toFixed(2)} %`;

  const maeT = document.getElementById("mae-temp-val");
  const maeRh = document.getElementById("mae-rh-val");
  const maeMc = document.getElementById("mae-mc-val");
  if (maeT) maeT.textContent = errT.toFixed(2);
  if (maeRh) maeRh.textContent = errRh.toFixed(2);
  if (maeMc) maeMc.textContent = errMc.toFixed(2);

  const statusT = errT <= 0.5 ? "verified" : errT <= 1.0 ? "needs-cal" : "out-of-range";
  const statusRh = errRh <= 2.0 ? "verified" : errRh <= 3.0 ? "needs-cal" : "out-of-range";
  const statusMc = errMc <= 1.0 ? "verified" : errMc <= 1.5 ? "needs-cal" : "out-of-range";

  updateRowBadge("row-status-temp", "mae-temp-pill", statusT, "±0.5°C");
  updateRowBadge("row-status-rh", "mae-rh-pill", statusRh, "±2.0%");
  updateRowBadge("row-status-mc", "mae-mc-pill", statusMc, "±1.0%");

  const globalBadge = document.getElementById("cal-global-badge");
  const globalText = document.getElementById("cal-badge-text");

  if ([statusT, statusRh, statusMc].includes("out-of-range")) {
    state.calibrationStatus = "Out of Range";
    if (globalBadge) globalBadge.className = "cal-status-badge out-of-range";
    if (globalText) globalText.textContent = "Out of Range";
    if (notifyOnAnomaly) {
      const calSms = `Sensor Calibration Needed! Chamber ${state.sessionId} sensors are OUT OF RANGE (MAE T:${errT.toFixed(2)}°C, RH:${errRh.toFixed(2)}%, MC:${errMc.toFixed(2)}%). Admin/Developer calibration required!`;
      triggerLcdRedAlert("ALRT:CAL NEEDED!", calSms);
      addNotification(calSms, true, true, calSms);
    }
  } else if ([statusT, statusRh, statusMc].includes("needs-cal")) {
    state.calibrationStatus = "Needs Calibration";
    if (globalBadge) globalBadge.className = "cal-status-badge needs-cal";
    if (globalText) globalText.textContent = "Needs Calibration";
    if (notifyOnAnomaly) {
      const calWarnSms = `Sensor Calibration Needed! One or more sensors in ${state.sessionId} drifted (MAE T:${errT.toFixed(2)}°C, RH:${errRh.toFixed(2)}%, MC:${errMc.toFixed(2)}%).`;
      triggerLcdRedAlert("ALRT:CAL NEEDED!", calWarnSms);
      addNotification(calWarnSms, true, true, calWarnSms);
    }
  } else {
    state.calibrationStatus = "Calibrated & Verified";
    if (globalBadge) globalBadge.className = "cal-status-badge verified";
    if (globalText) globalText.textContent = "Calibrated & Verified";
  }

  return {
    errTemp: errT.toFixed(2),
    errRh: errRh.toFixed(2),
    errMc: errMc.toFixed(2),
    tempOffset: offsetT,
    rhOffset: offsetRh,
    mcOffset: offsetMc
  };
}

function updateRowBadge(rowBadgeId, pillId, statusKey, thresholdLabel) {
  const rowBadge = document.getElementById(rowBadgeId);
  const pill = document.getElementById(pillId);
  if (!rowBadge || !pill) return;

  if (statusKey === "verified") {
    rowBadge.className = "table-status-badge verified";
    rowBadge.textContent = "Calibrated & Verified";
    pill.className = "mae-pill green";
    pill.textContent = `Within ${thresholdLabel}`;
  } else if (statusKey === "needs-cal") {
    rowBadge.className = "table-status-badge needs-cal";
    rowBadge.textContent = "Needs Calibration";
    pill.className = "mae-pill amber";
    pill.textContent = "Needs Calibration";
  } else {
    rowBadge.className = "table-status-badge out-of-range";
    rowBadge.textContent = "Out of Range";
    pill.className = "mae-pill red";
    pill.textContent = "Out of Range";
  }
}

function renderCalibrationHistoryTable() {
  const tbody = document.getElementById("calibration-logs-tbody");
  if (!tbody) return;

  tbody.innerHTML = state.calibrationLogs
    .map((log) => {
      const badgeClass =
        log.status === "Calibrated & Verified"
          ? "verified"
          : log.status === "Needs Calibration"
          ? "needs-cal"
          : "out-of-range";
      return `
        <tr>
          <td><strong>${log.date}</strong></td>
          <td>${log.time}</td>
          <td>${log.operator}</td>
          <td><code>${log.offsets}</code></td>
          <td><strong>${log.maeSummary}</strong></td>
          <td><span class="table-status-badge ${badgeClass}">${log.status}</span></td>
        </tr>
      `;
    })
    .join("");
}

/* ==========================================================================
   12. LOCAL 16x2 I2C LCD MODULE MIRROR (WITH RED MESSAGE ALERT)
   ========================================================================== */
function initLocal16x2LcdModal() {
  const modal = document.getElementById("lcd-modal");
  const btnSide = document.getElementById("btn-toggle-lcd");
  const btnInline = document.getElementById("btn-inline-lcd");
  const btnClose = document.getElementById("close-lcd-modal");

  function openLcd() {
    update16x2LcdText();
    modal?.classList.add("open");
  }

  btnSide?.addEventListener("click", openLcd);
  btnInline?.addEventListener("click", openLcd);
  btnClose?.addEventListener("click", () => modal?.classList.remove("open"));
}

function triggerLcdRedAlert(shortCode16Char, fullAlertMessage) {
  state.lcdAlertActive = true;
  state.lcdAlertShortCode = shortCode16Char.slice(0, 16);
  state.lcdAlertFullText = fullAlertMessage;
  update16x2LcdText();
}

function clearLcdRedAlert() {
  state.lcdAlertActive = false;
  state.lcdAlertShortCode = "";
  state.lcdAlertFullText = "";
  update16x2LcdText();
}

function update16x2LcdText() {
  const ssrTxt = state.ssrEngaged ? "ON " : "OFF";
  const row1 = `T:${state.temperature.toFixed(1)}C RH:${state.humidity.toFixed(1)}%`.slice(0, 16);
  const row2 = state.lcdAlertActive
    ? state.lcdAlertShortCode.padEnd(16, " ").slice(0, 16)
    : `MC:${state.moisture.toFixed(1)}% SSR:${ssrTxt}`.slice(0, 16);

  const inlineBadge = document.getElementById("btn-inline-lcd");
  const lcdScreen = document.getElementById("lcd-hardware-screen");
  const redAlertBox = document.getElementById("lcd-red-alert-box");
  const redAlertMsg = document.getElementById("lcd-red-alert-msg");
  const inlineTxt = document.getElementById("lcd-inline-text");
  const line1 = document.getElementById("lcd-line-1");
  const line2 = document.getElementById("lcd-line-2");

  if (inlineTxt) inlineTxt.textContent = `${row1} | ${row2.trim()}`;
  if (line1) line1.textContent = row1;
  if (line2) line2.textContent = row2;

  if (state.lcdAlertActive) {
    inlineBadge?.classList.add("lcd-alert-active");
    lcdScreen?.classList.add("lcd-danger-mode");
    if (redAlertBox) redAlertBox.style.display = "flex";
    if (redAlertMsg) redAlertMsg.textContent = state.lcdAlertFullText;
  } else {
    inlineBadge?.classList.remove("lcd-alert-active");
    lcdScreen?.classList.remove("lcd-danger-mode");
    if (redAlertBox) redAlertBox.style.display = "none";
  }
}

/* ==========================================================================
   13. NAVIGATION, SENSOR SYNC, BATCH CALCULATOR & SUPABASE
   ========================================================================== */
function initNavigationAndSidebar() {
  document.querySelectorAll(".nav-pill-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-pill-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const sec = document.getElementById(btn.getAttribute("data-section"));
      if (sec) sec.scrollIntoView({ behavior: "smooth" });
    });
  });

  document.querySelectorAll(".side-icon-btn[data-scroll]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".side-icon-btn[data-scroll]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const el = document.getElementById(btn.getAttribute("data-scroll"));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    });
  });

  document.getElementById("btn-sync-telemetry")?.addEventListener("click", async () => {
    state.temperature = +(55.7 + Math.random() * 0.9).toFixed(1);
    state.humidity = +(36.9 + Math.random() * 1.0).toFixed(1);
    state.moisture = Math.max(6.0, +(state.moisture - 0.2).toFixed(1));

    const tempEl = document.getElementById("val-temperature");
    const rhEl = document.getElementById("val-humidity");
    const mcEl = document.getElementById("val-moisture");
    if (tempEl) tempEl.textContent = state.temperature.toFixed(1);
    if (rhEl) rhEl.textContent = state.humidity.toFixed(1);
    if (mcEl) mcEl.textContent = state.moisture.toFixed(1);

    update16x2LcdText();
    updateDryingSessionProgressUI();
    computeAndRenderCalibrationMetrics(false);

    await insertSupabaseRecord("sensor_readings", {
      session_id: state.sessionId,
      temperature: state.temperature,
      humidity: state.humidity,
      moisture_probe_reading: state.moisture
    });

    showToast("SHT31, Moisture Probe & 16x2 I2C LCD synchronized.");
  });
}

function initBatchCalculationsAndCsv() {
  const inputMi = document.getElementById("input-mi");
  const inputMf = document.getElementById("input-mf");
  const outputReduction = document.getElementById("output-reduction");
  const outputRate = document.getElementById("output-rate");
  const selectMold = document.getElementById("select-cv-mold");
  const selectAflatoxin = document.getElementById("select-aflatoxin");

  function compute() {
    const mi = parseFloat(inputMi?.value) || 0;
    const mf = parseFloat(inputMf?.value) || 0;
    if (mi > 0 && mi >= mf) {
      if (outputReduction) outputReduction.value = (((mi - mf) / mi) * 100).toFixed(1);
      if (outputRate) outputRate.value = ((mi - mf) / state.plannedDurationHours).toFixed(2);
    }
    updateBatchSafetyStatus();
  }

  inputMi?.addEventListener("input", compute);
  inputMf?.addEventListener("input", compute);
  selectMold?.addEventListener("change", (e) => {
    setMoldClassificationState(e.target.value);
  });
  selectAflatoxin?.addEventListener("change", updateBatchSafetyStatus);

  document.getElementById("btn-export-csv")?.addEventListener("click", () => {
    const csv = [
      "Session_ID,Recipient,Temp_C,RH_Pct,Mi_Pct,Mf_Pct,Reduction_Pct,Rate_Pct_Hr,CV_Mold,Calibration_Status,Aflatoxin_Kit",
      `${state.sessionId},${state.smsRecipientNumber},${state.temperature},${state.humidity},${inputMi?.value || ""},${inputMf?.value || ""},${outputReduction?.value || ""},${outputRate?.value || ""},${selectMold?.value || ""},"${state.calibrationStatus}","${selectAflatoxin?.value || ""}"`
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CopraCure_${state.sessionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Batch Data exported to CSV.");
  });
}

function updateBatchSafetyStatus() {
  const mf = parseFloat(document.getElementById("input-mf")?.value) || 0;
  const mold = document.getElementById("select-cv-mold")?.value || "NONE";
  const afla = document.getElementById("select-aflatoxin")?.value || "Negative";
  const box = document.getElementById("batch-safety-status");
  const txt = document.getElementById("batch-safety-text");

  if (!box || !txt) return;

  if (mf <= 6.5 && mold !== "HIGH" && afla.startsWith("Negative")) {
    box.style.color = "#15803d";
    txt.textContent = "Target Moisture (≤6%) & Screening Threshold Met";
  } else {
    box.style.color = "#dc2626";
    txt.textContent = "Requires Further Drying or Analytical Verification";
  }
}

function initSupabaseRealtime() {
  if (!supabaseClient) return;
  supabaseClient
    .channel("copracure-live")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "sensor_readings" },
      (payload) => {
        const r = payload.new;
        if (r) {
          state.temperature = Number(r.temperature ?? state.temperature);
          state.humidity = Number(r.humidity ?? state.humidity);
          state.moisture = Number(r.moisture_probe_reading ?? state.moisture);

          const tempEl = document.getElementById("val-temperature");
          const rhEl = document.getElementById("val-humidity");
          const mcEl = document.getElementById("val-moisture");
          if (tempEl) tempEl.textContent = state.temperature.toFixed(1);
          if (rhEl) rhEl.textContent = state.humidity.toFixed(1);
          if (mcEl) mcEl.textContent = state.moisture.toFixed(1);

          if (state.temperature > 60.0) {
            const highTempMsg = `High Temperature! Chamber reached ${state.temperature.toFixed(1)}°C!`;
            triggerLcdRedAlert("ALRT:HIGH TEMP!", highTempMsg);
            addNotification(highTempMsg, true, true, highTempMsg);
          }

          update16x2LcdText();
          updateDryingSessionProgressUI();
          computeAndRenderCalibrationMetrics(true);
        }
      }
    )
    .subscribe();
}

async function insertSupabaseRecord(tableName, data) {
  if (!supabaseClient) {
    console.error(`Supabase is offline. Cannot save data to ${tableName}.`);
    return;
  }

  try {
    const { error } = await supabaseClient.from(tableName).insert([data]);

    if (error) {
      console.error(`❌ Supabase Insert Error (${tableName}):`, error.message, error.details || "");
    } else {
      console.log(`✅ Data successfully saved to ${tableName}!`);
    }
  } catch (e) {
    console.error(`❌ System error saving to ${tableName}:`, e.message);
  }
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}