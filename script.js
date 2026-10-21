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

const SUPABASE_URL = "https://oaqqewkfmkhbauvauiaa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1SOgbmak8sO1SxRFMVFaHw_hyd-PkVD";

let supabaseClient = null;
if (window.supabase) {
  // Ginamit ang mismong variables para tama ang format
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
  }, // <-- DINAGDAG NA KUWIT DITO

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
    sec_notif_center_sub: "Ang SMS alerts ay para lamang sa mahahalagang mensahe: High Temperature, Mold Detection, Sensor Calibration Needed, Account Updated, at Welcome Sign-In.", // <-- DINAGDAG NA KUWIT DITO
  
  // Idagdag ito sa loob ng i18nDict.tl
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

  document.getElementById("close-sms-banner").addEventListener("click", () => {
    document.getElementById("live-sms-banner").classList.remove("show");
  });
});

/* ==========================================================================
   1. VALIDATORS (CONCISE ERROR MESSAGES)
   ========================================================================== */
function isMobileInput(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !/[a-zA-Z@]/.test(trimmed);
}

/**
 * Nagbabalik ng "Invalid email or number" kapag mali ang format ng mobile o email
 */
function validateIdentifierInput(inputEl, wrapEl, errorEl) {
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

  if (!confirmEl.value || confirmEl.value !== passEl.value) {
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

  // Nililinis lamang ang error kapag nag-type ulit ang user (Walang real-time validation)
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

  // Sign In password: clear error while typing
  const signinPass = document.getElementById("signin-password");
  if (signinPass) {
    signinPass.addEventListener("input", () => {
      document.getElementById("signin-pass-wrap")?.classList.remove("input-error");
      const errNode = document.getElementById("signin-pass-error");
      if (errNode) errNode.textContent = "";
    });
  }

  // Sign Up / Reset / Profile password: clear error while typing
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

  btnThemeToggle.addEventListener("click", () => {
    const nextTheme = state.theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
  });

  btnLangToggle.addEventListener("click", () => {
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

  bellBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  btnMarkRead.addEventListener("click", () => {
    state.notifications.forEach((n) => (n.unread = false));
    renderNotificationsList();
    showToast("All notifications marked as read.");
  });

  btnClear.addEventListener("click", () => {
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
    if (!dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
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

  // 1. I-save sa local memory para makita sa dashboard
  state.notifications.unshift({
    id: Date.now(),
    text: message,
    time: nowStr,
    unread: true,
    danger: isDanger
  });

  renderNotificationsList();

  // 2. I-save sa Supabase 'alerts' table kapag ito ay mahalagang babala (Danger o SMS triggered)
  if (isDanger || sendImportantSms) {
    insertSupabaseRecord("alerts", {
      session_id: state.sessionId,
      alert_type: message.substring(0, 255), // Sinisiguro na hindi lalagpas sa text limit
      alert_status: "ACTIVE"
    });
  }

  // 3. I-trigger ang SMS dispatch kung kailangan
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
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredAccounts(accounts) {
  localStorage.setItem("copracure_registered_users", JSON.stringify(accounts));
}

function findAccountByIdentifier(identifier) {
  const clean = identifier.trim().toLowerCase();
  return getRegisteredAccounts().find((acc) => acc.identifier.toLowerCase() === clean);
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

  document.getElementById("go-to-signup").addEventListener("click", (e) => {
    e.preventDefault();
    hideFormAlert("signin-alert-box");
    signinView.classList.remove("active-view");
    signupView.classList.add("active-view");
  });

  document.getElementById("go-to-signin").addEventListener("click", (e) => {
    e.preventDefault();
    hideFormAlert("signup-alert-box");
    signupView.classList.remove("active-view");
    signinView.classList.add("active-view");
  });

  // SIGN UP
  document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFormAlert("signup-alert-box");

    const fullName = document.getElementById("signup-fullname").value.trim();
    const idEl = document.getElementById("signup-identifier");
    const passEl = document.getElementById("signup-password");
    const confirmEl = document.getElementById("signup-confirm");
    const identifier = idEl.value.trim();

    let hasError = false;

    // 1. Check Full Name
    if (!fullName) {
      document.getElementById("signup-name-error").textContent = "Please enter your full name";
      hasError = true;
    } else {
      document.getElementById("signup-name-error").textContent = "";
    }

    // 2. Check Identifier Format at kung may Account na
    const idValid = validateIdentifierInput(idEl, document.getElementById("signup-id-wrap"), document.getElementById("signup-id-error"));
    const existingAccount = findAccountByIdentifier(identifier);

    if (!idValid) {
      document.getElementById("signup-id-wrap").classList.add("input-error");
      document.getElementById("signup-id-error").textContent = "Invalid email or number";
      hasError = true;
    } else if (existingAccount) {
      document.getElementById("signup-id-wrap").classList.add("input-error");
      document.getElementById("signup-id-error").textContent = "Account already exists. Please Sign In.";
      hasError = true;
    } else {
      document.getElementById("signup-id-wrap").classList.remove("input-error");
      document.getElementById("signup-id-error").textContent = "";
    }

    // 3. Strict Password Check (Eksaktong 8 characters)
    if (passEl.value.length !== 8) {
      document.getElementById("signup-pass-wrap").classList.add("input-error");
      document.getElementById("signup-pass-error").textContent = "Please enter exactly 8 characters";
      hasError = true;
    } else {
      document.getElementById("signup-pass-wrap").classList.remove("input-error");
      document.getElementById("signup-pass-error").textContent = "";
    }

    // 4. Confirm Password Check
    if (!confirmEl.value || confirmEl.value !== passEl.value) {
      document.getElementById("signup-confirm-wrap").classList.add("input-error");
      document.getElementById("signup-confirm-error").textContent = "Password does not match";
      hasError = true;
    } else {
      document.getElementById("signup-confirm-wrap").classList.remove("input-error");
      document.getElementById("signup-confirm-error").textContent = "";
    }

    if (hasError) return;

    const newAcc = {
      fullName,
      identifier,
      password: passEl.value,
      mobileNumber: identifier,
      loginCount: 0,
      role: fullName.toLowerCase().includes('admin') ? 'Admin' : 'User',
      createdAt: new Date().toISOString()
    };

    const accounts = getRegisteredAccounts();
    accounts.push(newAcc);
    saveRegisteredAccounts(accounts);

    await insertSupabaseRecord("registered_users", {
      full_name: fullName,
      identifier: identifier,
      mobile_number: newAcc.mobileNumber
    });

    document.getElementById("signup-form").reset();
    document.getElementById("signup-view").classList.remove("active-view");
    document.getElementById("signin-view").classList.add("active-view");
    document.getElementById("signin-identifier").value = identifier;

    showFormAlert(
      "signin-alert-box",
      `Account created for ${fullName}! Please Sign In to continue.`,
      true
    );
  });

  // SIGN IN
  document.getElementById("signin-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFormAlert("signin-alert-box");

    const idEl = document.getElementById("signin-identifier");
    const passEl = document.getElementById("signin-password");
    const identifier = idEl.value.trim();
    const password = passEl.value;

    let hasError = false;

    // 1. Check Identifier (Email or Number) at Account Existence
    const idValid = validateIdentifierInput(idEl, document.getElementById("signin-id-wrap"), document.getElementById("signin-id-error"));
    const existingAccount = findAccountByIdentifier(identifier);

    if (!idValid) {
      document.getElementById("signin-id-wrap").classList.add("input-error");
      document.getElementById("signin-id-error").textContent = "Invalid email or number";
      hasError = true;
    } else if (!existingAccount) {
      document.getElementById("signin-id-wrap").classList.add("input-error");
      document.getElementById("signin-id-error").textContent = "Account does not exist! please sign up to access the dashboard.";
      hasError = true;
    } else {
      document.getElementById("signin-id-wrap").classList.remove("input-error");
      document.getElementById("signin-id-error").textContent = "";
    }

    // 2. Check Password (Lalabas lang kung tama ang email ngunit mali ang password)
    if (existingAccount && password !== existingAccount.password) {
      document.getElementById("signin-pass-wrap").classList.add("input-error");
      document.getElementById("signin-pass-error").textContent = "The password you enter is incorrect";
      hasError = true;
    } else if (existingAccount && !password) {
      document.getElementById("signin-pass-wrap").classList.add("input-error");
      document.getElementById("signin-pass-error").textContent = "Please enter your password";
      hasError = true;
    } else {
      document.getElementById("signin-pass-wrap").classList.remove("input-error");
      document.getElementById("signin-pass-error").textContent = "";
    }

    if (hasError) return;

    // Proceed to login
    const previousLogins = Number(existingAccount.loginCount || 0);
    state.isFirstTimeLogin = previousLogins === 0;

    const accounts = getRegisteredAccounts();
    const accIdx = accounts.findIndex((a) => a.identifier.toLowerCase() === identifier.toLowerCase());
    if (accIdx !== -1) {
      accounts[accIdx].loginCount = previousLogins + 1;
      saveRegisteredAccounts(accounts);
    }

    state.currentUserFullName = existingAccount.fullName;
    state.currentUser = existingAccount.fullName.split(" ")[0];
    state.currentUserIdentifier = existingAccount.identifier;
    state.smsRecipientNumber = existingAccount.identifier;

    document.getElementById("sms-active-number").textContent = existingAccount.identifier;
    document.getElementById("sms-recipient-input").value = existingAccount.identifier;

    updateDashboardWelcomeBanner();

    document.getElementById("signin-view").classList.remove("active-view");
    document.getElementById("dashboard-view").classList.add("active-view");

    if (state.isFirstTimeLogin) {
      const welcomeSms = `Thank you for signing In, ${state.currentUser}! Welcome to CopraCure Dashboard!`;
      addNotification(welcomeSms, false, true, welcomeSms);
    } else {
      addNotification(`Welcome Back, ${state.currentUser}! Signed in to CopraCure Dashboard.`, false, false);
    }
  });

  // LOG OUT
  document.getElementById("btn-logout").addEventListener("click", () => {
    dashboardView.classList.remove("active-view");
    signinView.classList.add("active-view");
    document.getElementById("signin-password").value = "";
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

  btnProfile.addEventListener("click", () => {
    hideFormAlert("profile-alert-box");
    const acc = findAccountByIdentifier(state.currentUserIdentifier);
    document.getElementById("profile-fullname").value = acc ? acc.fullName : state.currentUserFullName;
    document.getElementById("profile-identifier").value = acc ? acc.identifier : state.currentUserIdentifier;
    document.getElementById("profile-password").value = acc ? acc.password : "12345678";
    modal.classList.add("open");
  });

  btnClose.addEventListener("click", () => modal.classList.remove("open"));

  formUpdate.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newName = document.getElementById("profile-fullname").value.trim();
    const idEl = document.getElementById("profile-identifier");
    const passEl = document.getElementById("profile-password");

    const idValid = validateIdentifierInput(idEl, document.getElementById("profile-id-wrap"), document.getElementById("profile-id-error"));
    const passValid = validateSignupPasswordInput(passEl, document.getElementById("profile-pass-wrap"), document.getElementById("profile-pass-error"));

    if (!newName || !idValid || !passValid) {
      return;
    }

    const accounts = getRegisteredAccounts();
    const idx = accounts.findIndex((a) => a.identifier.toLowerCase() === state.currentUserIdentifier.toLowerCase());
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

    state.currentUserFullName = newName;
    state.currentUser = newName.split(" ")[0];
    state.currentUserIdentifier = updatedAccount.identifier;
    state.smsRecipientNumber = updatedAccount.identifier;

    updateDashboardWelcomeBanner();
    document.getElementById("sms-active-number").textContent = updatedAccount.identifier;
    document.getElementById("sms-recipient-input").value = updatedAccount.identifier;

    // Important SMS Alert para sa Account Update
    addNotification(
      `AccountUpdated! Profile details for ${newName} have been updated.`,
      false,
      true,
      `AccountUpdated! Hello ${state.currentUser}, your CopraCure account details were successfully updated.`
    );

    showFormAlert("profile-alert-box", "AccountUpdated! Your profile was updated successfully.", true);
    showToast("AccountUpdated!");
  });

  btnDelete.addEventListener("click", async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the account of ${state.currentUserFullName}?`
    );
    if (!confirmed) return;

    const accounts = getRegisteredAccounts().filter(
      (a) => a.identifier.toLowerCase() !== state.currentUserIdentifier.toLowerCase()
    );
    saveRegisteredAccounts(accounts);

    modal.classList.remove("open");
    document.getElementById("dashboard-view").classList.remove("active-view");
    document.getElementById("signin-view").classList.add("active-view");
    document.getElementById("signin-identifier").value = "";
    document.getElementById("signin-password").value = "";

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

  openLink.addEventListener("click", (e) => {
    e.preventDefault();
    hideFormAlert("forgot-alert-box");
    step2.style.display = "none";
    resetInput.value = document.getElementById("signin-identifier").value.trim();
    modal.classList.add("open");
  });

  closeBtn.addEventListener("click", () => modal.classList.remove("open"));

  tabSms.addEventListener("click", () => {
    state.resetMethod = "sms";
    tabSms.classList.add("active");
    tabEmail.classList.remove("active");
    targetLabel.textContent = "REGISTERED MOBILE NUMBER";
    resetInput.placeholder = "09123456789 or +639123456789";
  });

  tabEmail.addEventListener("click", () => {
    state.resetMethod = "email";
    tabEmail.classList.add("active");
    tabSms.classList.remove("active");
    targetLabel.textContent = "REGISTERED EMAIL ADDRESS";
    resetInput.placeholder = "example@gmail.com";
  });

  btnSendCode.addEventListener("click", async () => {
    hideFormAlert("forgot-alert-box");
    const targetVal = resetInput.value.trim();

    if (!validateIdentifierInput(resetInput, document.getElementById("reset-id-wrap"), document.getElementById("reset-id-error"))) {
      return;
    }

    const account = findAccountByIdentifier(targetVal);
    if (!account) {
      document.getElementById("reset-id-wrap").classList.add("input-error");
      document.getElementById("reset-id-error").textContent = "Invalid email or number";
      return;
    }

    state.generatedResetOtp = String(Math.floor(100000 + Math.random() * 900000));
    state.resetTargetAccount = account.identifier;
    step2.style.display = "block";

    const otpMessage = `COPRACURE PASSWORD RESET: Your 6-digit OTP Code is ${state.generatedResetOtp}.`;
    await dispatchDirectSms(targetVal, otpMessage, true, false);
    showFormAlert("forgot-alert-box", `OTP Code sent to ${targetVal}!`, true);
  });

  btnConfirmPass.addEventListener("click", () => {
    const otpEntered = document.getElementById("reset-otp-input").value.trim();
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
    const idx = accounts.findIndex((a) => a.identifier.toLowerCase() === state.resetTargetAccount.toLowerCase());
    if (idx !== -1) {
      accounts[idx].password = newPassEl.value;
      saveRegisteredAccounts(accounts);
    }

    modal.classList.remove("open");
    document.getElementById("signin-identifier").value = state.resetTargetAccount;
    document.getElementById("signin-password").value = "";
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
  const senderTitle = isUrgent
    ? "COPRACURE URGENT CHAMBER ALERT • SMS SENT"
    : "COPRACURE IMPORTANT SMS • SENT";

  banner.classList.toggle("urgent-banner", isUrgent);
  document.getElementById("sms-banner-sender").textContent = senderTitle;
  document.getElementById("sms-banner-recipient").textContent = `To: ${recipient}`;
  document.getElementById("sms-banner-text").textContent = messageText;

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
    smsModal.classList.add("open");
  }

  btnOpenBar.addEventListener("click", openModal);
  btnOpenSide.addEventListener("click", openModal);
  btnClose.addEventListener("click", () => smsModal.classList.remove("open"));

  btnSave.addEventListener("click", () => {
    const recipientVal = smsInput.value.trim();
    if (!validateIdentifierInput(smsInput, document.getElementById("sms-input-wrap"), document.getElementById("sms-input-error"))) {
      return;
    }

    if (gatewayUrlInput) localStorage.setItem("copracure_sms_gateway_url", gatewayUrlInput.value.trim());
    if (apiKeyInput) localStorage.setItem("copracure_sms_api_key", apiKeyInput.value.trim());

    state.smsRecipientNumber = recipientVal;
    document.getElementById("sms-active-number").textContent = recipientVal;
    showToast("SMS Gateway settings saved.");
    smsModal.classList.remove("open");
  });

  btnSendNow.addEventListener("click", () => {
    const urgentMsg = `High Temperature! Chamber ${state.sessionId} reached ${state.temperature.toFixed(1)}°C (Mold: ${state.moldCategory}). Check chamber immediately!`;
    triggerLcdRedAlert("ALRT:CHAMBER CHK", urgentMsg);
    addNotification(urgentMsg, true, true, urgentMsg);
  });

  btnWifiToggle.addEventListener("click", () => {
    state.wifiOnline = !state.wifiOnline;
    const dot = document.getElementById("wifi-pulse-dot");
    const txt = document.getElementById("wifi-status-text");

    if (!state.wifiOnline) {
      dot.classList.add("offline");
      txt.textContent = "Wi-Fi OFFLINE • GSM Auto-SMS Active";
      addNotification(
        `Wi-Fi connection lost on ${state.sessionId}. Offline GSM SIM800L standby active.`,
        true,
        false
      );
    } else {
      dot.classList.remove("offline");
      txt.textContent = "Wi-Fi Online • Critical SMS Ready";
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
      badge.innerHTML = `<span class="pulse-dot"></span> ACTIVE SESSION: <strong>${state.sessionId}</strong>`;
      stageText.textContent = "Stage 2: Falling-Rate Drying";
      btnPauseResume.innerHTML = `<i data-lucide="pause"></i> <span>Pause Session</span>`;
      addNotification(`Drying Session ${state.sessionId} RESUMED.`, false, false);
    } else {
      badge.innerHTML = `<span class="pulse-dot offline"></span> STANDBY / PAUSED: <strong>${state.sessionId}</strong>`;
      stageText.textContent = "Standby Mode";
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

  document.getElementById("sess-mc").textContent = `${mc.toFixed(1)}%`;
  document.getElementById("sess-reduction-pct").textContent = `${pct.toFixed(1)}% Complete`;
  document.getElementById("trajectory-mid-label").textContent = `Current Moisture: ${mc.toFixed(1)}% WB (${pct.toFixed(1)}% toward Safe Copra Threshold)`;
  document.getElementById("session-main-progress-bar").style.width = `${pct.toFixed(1)}%`;
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

  document.querySelectorAll(".mold-state-btn").forEach((btn) => {
    const bState = btn.getAttribute("data-mold-state");
    btn.className = "mold-state-btn";
    if (bState === level) {
      btn.classList.add(level === "NONE" ? "active-none" : level === "LOW" ? "active-low" : "active-high");
    }
  });

  if (level === "HIGH") {
    riskText.textContent = "HIGH RISK (ISOLATION REQUIRED)";
    riskText.style.color = "#dc2626";
    riskDot.className = "status-dot red";
    pillOpt.className = "proto-pill";
    pill48.className = "proto-pill active-red";
    pillIso.className = "proto-pill active-red";
    cvText.textContent = "HIGH (ISOLATION)";
    cvText.style.color = "#dc2626";
    camNote.textContent = "Visible Mold Classification: HIGH — Critical Contamination Detected!";
    document.getElementById("select-cv-mold").value = "HIGH";

    const moldSms = `Mold Detected in Chamber! HIGH mold contamination detected on ${state.sessionId}. Immediate sample isolation required!`;
    triggerLcdRedAlert("ALRT:HIGH MOLD!", moldSms);
    addNotification(moldSms, true, true, moldSms);
  } else if (level === "LOW") {
    riskText.textContent = "MODERATE RISK (LOW MOLD WARNING)";
    riskText.style.color = "#d97706";
    riskDot.className = "status-dot amber";
    pillOpt.className = "proto-pill";
    pill48.className = "proto-pill active-amber";
    pillIso.className = "proto-pill";
    cvText.textContent = "LOW (EARLY WARNING)";
    cvText.style.color = "#d97706";
    camNote.textContent = "Visible Mold Classification: LOW — Increasing airflow & thermal check.";
    document.getElementById("select-cv-mold").value = "LOW";

    const lowMoldSms = `Mold Warning in Chamber! Early spore (LOW mold) detected on ${state.sessionId}. Increasing chamber ventilation.`;
    triggerLcdRedAlert("ALRT:LOW MOLD!", lowMoldSms);
    addNotification(lowMoldSms, true, true, lowMoldSms);
  } else {
    riskText.textContent = "LOW RISK (OPTIMAL)";
    riskText.style.color = "#16a34a";
    riskDot.className = "status-dot green";
    pillOpt.className = "proto-pill active-green";
    pill48.className = "proto-pill";
    pillIso.className = "proto-pill";
    cvText.textContent = "NONE (0%)";
    cvText.style.color = "#15803d";
    camNote.textContent = "Visible Mold Classification: NONE (Healthy Kernel Surface)";
    document.getElementById("select-cv-mold").value = "NONE";

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

  btnSsr.addEventListener("click", () => {
    state.ssrEngaged = !state.ssrEngaged;

    if (state.ssrEngaged) {
      btnSsr.textContent = "ENGAGED";
      btnSsr.classList.remove("disengaged");
      btnSsr.classList.add("engaged");
      wattageEl.textContent = "600 W";
      ssrStateText.textContent = "SSR State: ON (Closed-Loop Active)";
      if (flameIcon) flameIcon.classList.add("flame-active");
    } else {
      btnSsr.textContent = "DISENGAGED";
      btnSsr.classList.remove("engaged");
      btnSsr.classList.add("disengaged");
      wattageEl.textContent = "0 W";
      ssrStateText.textContent = "SSR State: OFF (Manual Standby)";
      if (flameIcon) flameIcon.classList.remove("flame-active");
    }

    update16x2LcdText();
    // Hindi nagpapadala ng SMS sa simpleng pag-toggle ng SSR switch
    addNotification(
      `Control System: 600W PTC Heater SSR Module switched to ${state.ssrEngaged ? "ENGAGED" : "DISENGAGED"}.`,
      false,
      false
    );
  });

  document.getElementById("btn-refresh-cam").addEventListener("click", () => {
    const now = new Date().toLocaleTimeString();
    document.getElementById("cam-timestamp").textContent = `${state.sessionId} • ${now}`;
    showToast("ESP32-CAM captured a new overhead frame.");
  });

  const viewport = document.getElementById("camera-viewport");
  document.getElementById("btn-cam-flash").addEventListener("click", () => {
    state.camFlash = !state.camFlash;
    viewport.classList.toggle("flash-active", state.camFlash);
    showToast(`ESP32-CAM Flash: ${state.camFlash ? "ON" : "OFF"}`);
  });

  const btnMode = document.getElementById("btn-toggle-control-mode");
  const modeText = document.getElementById("control-mode-text");
  btnMode.addEventListener("click", () => {
    state.autoMode = !state.autoMode;
    modeText.textContent = state.autoMode ? "AUTO ENGAGED" : "MANUAL OVERRIDE";
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
        modeText.textContent = "MANUAL OVERRIDE";
      }

      addNotification(`Control System: ${eq} turned ${isOn ? "ON" : "OFF"}.`, false, false);
    });
  });

  const slider = document.getElementById("led-brightness-slider");
  const val = document.getElementById("led-brightness-val");
  slider.addEventListener("input", (e) => {
    val.textContent = `${e.target.value}%`;
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
      document.getElementById("val-temperature").textContent = state.temperature.toFixed(1);
      document.getElementById("risk-text").textContent = "HIGH TEMPERATURE ALERT (>60°C)";
      document.getElementById("risk-text").style.color = "#dc2626";
      document.getElementById("risk-dot").className = "status-dot red";

      const highTempSms = `High Temperature! Chamber ${state.sessionId} reached ${state.temperature.toFixed(1)}°C (exceeding 60°C cutoff). KSD301 & Exhaust Fans triggered!`;
      triggerLcdRedAlert("ALRT:HIGH TEMP!", highTempSms);
      addNotification(highTempSms, true, true, highTempSms);
    });
  }

  btnSimMold.addEventListener("click", () => {
    setMoldClassificationState("HIGH");
  });

  if (btnSimRate) {
    btnSimRate.addEventListener("click", () => {
      document.getElementById("pill-optimal").className = "proto-pill";
      document.getElementById("pill-48h-warning").className = "proto-pill active-amber";
      document.getElementById("risk-text").textContent = "48H DRYING RATE WARNING";
      document.getElementById("risk-text").style.color = "#d97706";
      document.getElementById("risk-dot").className = "status-dot amber";

      const rateWarnSms = `48H Drying Rate Warning! Moisture reduction on ${state.sessionId} is slower than target trajectory. Check heater and airflow.`;
      triggerLcdRedAlert("ALRT:SLOW DRYING", rateWarnSms);
      addNotification(rateWarnSms, true, true, rateWarnSms);
    });
  }

  btnReset.addEventListener("click", () => {
    state.temperature = 56.1;
    document.getElementById("val-temperature").textContent = state.temperature.toFixed(1);
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

  // Admin / Developer Lock Controls
  const btnAdminToggle = document.getElementById("btn-admin-cal-toggle");
  const adminModal = document.getElementById("admin-cal-modal");
  const closeAdminModal = document.getElementById("close-admin-cal-modal");
  const btnVerifyAdmin = document.getElementById("btn-verify-admin-cal");
  const adminPassInput = document.getElementById("admin-passcode-input");

  renderCalibrationHistoryTable();
  computeAndRenderCalibrationMetrics(false);

  btnAdminToggle.addEventListener("click", () => {
    if (state.adminCalibrationUnlocked) {
      // Lock it back
      setAdminCalibrationAccess(false);
      showToast("Admin / Developer Calibration Mode locked.");
    } else {
      hideFormAlert("admin-cal-alert-box");
      adminPassInput.value = "";
      document.getElementById("admin-pass-error").textContent = "";
      adminModal.classList.add("open");
    }
  });

  closeAdminModal.addEventListener("click", () => adminModal.classList.remove("open"));

  btnVerifyAdmin.addEventListener("click", () => {
    const pass = adminPassInput.value.trim();
    if (pass !== ADMIN_DEVELOPER_PASSCODE) {
      document.getElementById("admin-pass-wrap").classList.add("input-error");
      document.getElementById("admin-pass-error").textContent = "The password you enter is incorrect";
      return;
    }

    document.getElementById("admin-pass-wrap").classList.remove("input-error");
    document.getElementById("admin-pass-error").textContent = "";
    adminModal.classList.remove("open");
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

  // Trigger Button 1: Run Calibration Check (Admin/Developer Only)
  btnRunCal.addEventListener("click", () => {
    if (!state.adminCalibrationUnlocked) return;

    const progBox = document.getElementById("cal-progress-box");
    const progBar = document.getElementById("cal-progress-bar");
    const progText = document.getElementById("cal-progress-text");

    progBox.style.display = "block";
    progBar.style.width = "30%";
    progText.textContent = "Step 1/3: Sampling SHT31 Temperature & Humidity I2C registers...";

    setTimeout(() => {
      progBar.style.width = "70%";
      progText.textContent = "Step 2/3: Comparing Experimental Moisture Probe ADC vs Reference Values...";
    }, 500);

    setTimeout(() => {
      progBar.style.width = "100%";
      progText.textContent = "Step 3/3: Applying ESP32 offset factors and verifying MAE thresholds...";

      state.refTemperature = +(state.temperature - 0.1).toFixed(1);
      state.refHumidity = +(state.humidity - 0.3).toFixed(1);
      state.refMoisture = +(state.moisture - 0.2).toFixed(1);

      refTempInput.value = state.refTemperature;
      refRhInput.value = state.refHumidity;
      refMcInput.value = state.refMoisture;

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
        progBox.style.display = "none";
        progBar.style.width = "0%";
      }, 1000);
    }, 1100);
  });

  // Trigger Button 2: Zero / Reset Moisture Probe (Admin/Developer Only)
  btnZeroProbe.addEventListener("click", () => {
    if (!state.adminCalibrationUnlocked) return;

    state.refMoisture = state.moisture;
    refMcInput.value = state.moisture.toFixed(1);
    document.getElementById("mc-offset-code").textContent = "mc_offset = 0.00 (ZEROED)";
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

  // Trigger Button 3: Simulate Sensor Drift (Triggers Important SMS + Red LCD Alert)
  btnSimDrift.addEventListener("click", () => {
    if (!state.adminCalibrationUnlocked) return;

    refTempInput.value = (state.temperature - 1.4).toFixed(1);
    refRhInput.value = (state.humidity - 3.2).toFixed(1);
    refMcInput.value = (state.moisture - 1.8).toFixed(1);
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
    btn.classList.remove("locked");
    btn.classList.add("unlocked");
    btn.innerHTML = `<i data-lucide="unlock"></i> <span>Admin / Developer Mode: UNLOCKED (Click to Lock)</span>`;
    banner.classList.add("unlocked");
    lockMsg.innerHTML = `<strong>Admin / Developer Mode Active:</strong> You can now calibrate the SHT31 and Moisture Probe sensors and adjust the reference values.`;
  } else {
    btn.classList.remove("unlocked");
    btn.classList.add("locked");
    btn.innerHTML = `<i data-lucide="lock"></i> <span>Admin / Developer Access (Locked)</span>`;
    banner.classList.remove("unlocked");
    lockMsg.innerHTML = `<strong>Restricted Access:</strong> Tanging Admin o Developer lamang ang maaaring mag-calibrate ng sensors at magbago ng reference offsets sa chamber. Pindutin ang <em>Admin / Developer Access</em> (Passcode: <code>admin123</code>) upang buksan.`;
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

  document.getElementById("cal-live-temp").textContent = liveT.toFixed(1);
  document.getElementById("cal-live-rh").textContent = liveRh.toFixed(1);
  document.getElementById("cal-live-mc").textContent = liveMc.toFixed(1);

  document.getElementById("cal-err-temp").textContent = `${errT.toFixed(2)} °C`;
  document.getElementById("cal-err-rh").textContent = `${errRh.toFixed(2)} %`;
  document.getElementById("cal-err-mc").textContent = `${errMc.toFixed(2)} %`;

  document.getElementById("mae-temp-val").textContent = errT.toFixed(2);
  document.getElementById("mae-rh-val").textContent = errRh.toFixed(2);
  document.getElementById("mae-mc-val").textContent = errMc.toFixed(2);

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
    globalBadge.className = "cal-status-badge out-of-range";
    globalText.textContent = "Out of Range";
    if (notifyOnAnomaly) {
      const calSms = `Sensor Calibration Needed! Chamber ${state.sessionId} sensors are OUT OF RANGE (MAE T:${errT.toFixed(2)}°C, RH:${errRh.toFixed(2)}%, MC:${errMc.toFixed(2)}%). Admin/Developer calibration required!`;
      triggerLcdRedAlert("ALRT:CAL NEEDED!", calSms);
      addNotification(calSms, true, true, calSms);
    }
  } else if ([statusT, statusRh, statusMc].includes("needs-cal")) {
    state.calibrationStatus = "Needs Calibration";
    globalBadge.className = "cal-status-badge needs-cal";
    globalText.textContent = "Needs Calibration";
    if (notifyOnAnomaly) {
      const calWarnSms = `Sensor Calibration Needed! One or more sensors in ${state.sessionId} drifted (MAE T:${errT.toFixed(2)}°C, RH:${errRh.toFixed(2)}%, MC:${errMc.toFixed(2)}%).`;
      triggerLcdRedAlert("ALRT:CAL NEEDED!", calWarnSms);
      addNotification(calWarnSms, true, true, calWarnSms);
    }
  } else {
    state.calibrationStatus = "Calibrated & Verified";
    globalBadge.className = "cal-status-badge verified";
    globalText.textContent = "Calibrated & Verified";
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
    modal.classList.add("open");
  }

  btnSide.addEventListener("click", openLcd);
  btnInline.addEventListener("click", openLcd);
  btnClose.addEventListener("click", () => modal.classList.remove("open"));
}

/**
 * Naglalagay ng pulang message alert sa 16x2 I2C LCD
 */
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

  document.getElementById("lcd-inline-text").textContent = `${row1} | ${row2.trim()}`;
  document.getElementById("lcd-line-1").textContent = row1;
  document.getElementById("lcd-line-2").textContent = row2;

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

  document.getElementById("btn-sync-telemetry").addEventListener("click", async () => {
    state.temperature = +(55.7 + Math.random() * 0.9).toFixed(1);
    state.humidity = +(36.9 + Math.random() * 1.0).toFixed(1);
    state.moisture = Math.max(6.0, +(state.moisture - 0.2).toFixed(1));

    document.getElementById("val-temperature").textContent = state.temperature.toFixed(1);
    document.getElementById("val-humidity").textContent = state.humidity.toFixed(1);
    document.getElementById("val-moisture").textContent = state.moisture.toFixed(1);

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
    const mi = parseFloat(inputMi.value) || 0;
    const mf = parseFloat(inputMf.value) || 0;
    if (mi > 0 && mi >= mf) {
      outputReduction.value = (((mi - mf) / mi) * 100).toFixed(1);
      outputRate.value = ((mi - mf) / state.plannedDurationHours).toFixed(2);
    }
    updateBatchSafetyStatus();
  }

  inputMi.addEventListener("input", compute);
  inputMf.addEventListener("input", compute);
  selectMold.addEventListener("change", (e) => {
    setMoldClassificationState(e.target.value);
  });
  selectAflatoxin.addEventListener("change", updateBatchSafetyStatus);

  document.getElementById("btn-export-csv").addEventListener("click", () => {
    const csv = [
      "Session_ID,Recipient,Temp_C,RH_Pct,Mi_Pct,Mf_Pct,Reduction_Pct,Rate_Pct_Hr,CV_Mold,Calibration_Status,Aflatoxin_Kit",
      `${state.sessionId},${state.smsRecipientNumber},${state.temperature},${state.humidity},${inputMi.value},${inputMf.value},${outputReduction.value},${outputRate.value},${selectMold.value},"${state.calibrationStatus}","${selectAflatoxin.value}"`
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
  const mf = parseFloat(document.getElementById("input-mf").value) || 0;
  const mold = document.getElementById("select-cv-mold").value;
  const afla = document.getElementById("select-aflatoxin").value;
  const box = document.getElementById("batch-safety-status");
  const txt = document.getElementById("batch-safety-text");

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
          document.getElementById("val-temperature").textContent = state.temperature.toFixed(1);
          document.getElementById("val-humidity").textContent = state.humidity.toFixed(1);
          document.getElementById("val-moisture").textContent = state.moisture.toFixed(1);

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
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}