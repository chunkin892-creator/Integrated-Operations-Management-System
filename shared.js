/* ============================================================
 * 浚鍵管理有限公司 - 共享資料層 v1.0
 * 五份檔案共用：Firebase、工具、資料讀寫
 * ============================================================ */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyANWLqV5bIFfMX_-byunnEBQ-gZmSn1cj4",
  authDomain: "driver-s-shift-report.firebaseapp.com",
  databaseURL: "https://driver-s-shift-report-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "driver-s-shift-report",
  storageBucket: "driver-s-shift-report.firebasestorage.app",
  messagingSenderId: "790331468274",
  appId: "1:790331468274:web:a0cecd6a8d5f8e157ba36b",
  measurementId: "G-JZSZKCSS27"
};

/* ---------- 初始化 ---------- */
let SHARED_app, SHARED_auth, SHARED_db, SHARED_storage;
try {
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  SHARED_app = firebase.app();
  SHARED_auth = firebase.auth();
  SHARED_db = firebase.database();
  if (firebase.storage) SHARED_storage = firebase.storage();
} catch (e) {
  console.error('[shared] Firebase 初始化失敗：', e);
}

/* ---------- 全域狀態 ---------- */
const SHARED = {
  user: null,
  role: 'admin',
  config: { price9: 9, price6: 6, hourlyRate: 75 },
  cloudOk: false,
  version: '1.0'
};

/* ---------- 工具 ---------- */
const U = {
  esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },
  pad(n) { return String(n).padStart(2, '0'); },
  today() {
    const d = new Date();
    return `${d.getFullYear()}-${U.pad(d.getMonth()+1)}-${U.pad(d.getDate())}`;
  },
  thisMonth() { return U.today().substring(0, 7); },
  nowTime() {
    const d = new Date();
    return `${U.pad(d.getHours())}:${U.pad(d.getMinutes())}`;
  },
  fmt(n) {
    return Number(n||0).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  },
  fmt0(n) {
    return Number(n||0).toLocaleString('en-US', {maximumFractionDigits:0});
  },
  lastDay(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  },
  range(monthStr, mode) {
    const last = U.lastDay(monthStr);
    if (mode === 'half1') return { start: `${monthStr}-01`, end: `${monthStr}-15` };
    if (mode === 'half2') return { start: `${monthStr}-16`, end: `${monthStr}-${U.pad(last)}` };
    return { start: `${monthStr}-01`, end: `${monthStr}-${U.pad(last)}` };
  },
  toast(msg, type) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'visibility:hidden;min-width:200px;background:#333;color:#fff;text-align:center;border-radius:8px;padding:10px 16px;position:fixed;bottom:26px;left:50%;transform:translateX(-50%);z-index:9998;opacity:0;transition:opacity .3s;font-size:14px;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'show ' + (type || '');
    t.style.visibility = 'visible';
    t.style.opacity = '1';
    if (type === 'ok') t.style.background = '#059669';
    else if (type === 'err') t.style.background = '#dc2626';
    else if (type === 'warn') t.style.background = '#d97706';
    else t.style.background = '#333';
    clearTimeout(t._tm);
    t._tm = setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => { t.style.visibility = 'hidden'; }, 300);
    }, 2600);
  },
  loading(show, text) {
    let el = document.getElementById('loadingOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'loadingOverlay';
      el.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(15,23,42,.7);z-index:9999;justify-content:center;align-items:center;flex-direction:column;color:#fff;backdrop-filter:blur(4px);';
      el.innerHTML = '<div style="width:50px;height:50px;border:5px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:spin .9s linear infinite;margin-bottom:14px;"></div><div id="loadingText">處理中...</div>';
      document.body.appendChild(el);
      if (!document.getElementById('sharedSpinStyle')) {
        const s = document.createElement('style');
        s.id = 'sharedSpinStyle';
        s.textContent = '@keyframes spin{to{transform:rotate(360deg);}}';
        document.head.appendChild(s);
      }
    }
    if (text) document.getElementById('loadingText').textContent = text;
    el.style.display = show ? 'flex' : 'none';
  },
  confirm(msg) { return window.confirm(msg); },
  setCloud(status, isErr) {
    const el = document.getElementById('cloudStatus');
    if (!el) return;
    el.textContent = status;
    el.className = 'cloud-status ' + (isErr ? 'err' : 'ok');
  }
};

/* ---------- 主題 ---------- */
function applySharedTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('shared_theme', t); } catch (e) {}
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
}
function toggleSharedTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  applySharedTheme(cur === 'dark' ? 'light' : 'dark');
}
(function initSharedTheme() {
  let t = 'light';
  try {
    t = localStorage.getItem('shared_theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) {}
  applySharedTheme(t);
})();

/* ---------- Auth ---------- */
function sharedLogin() {
  if (!SHARED_auth) { U.toast('Auth 未初始化', 'err'); return; }
  const p = new firebase.auth.GoogleAuthProvider();
  SHARED_auth.signInWithPopup(p).catch(e => U.toast('登入失敗：' + e.message, 'err'));
}
function sharedLogout() {
  if (SHARED_auth && U.confirm('確定要登出？')) SHARED_auth.signOut();
}
if (SHARED_auth) {
  SHARED_auth.onAuthStateChanged(user => {
    SHARED.user = user;
    if (typeof onSharedLogin === 'function' && user) onSharedLogin(user);
    if (typeof onSharedLogout === 'function' && !user) onSharedLogout();
  });
}
if (SHARED_db) {
  SHARED_db.ref('.info/connected').on('value', snap => {
    SHARED.cloudOk = snap.val() === true;
    U.setCloud(SHARED.cloudOk ? '☁️ 已連線 · 實時同步' : '⚠️ 離線中', !SHARED.cloudOk);
  });
}

/* ============================================================
 * 統一資料層
 * 路徑：
 *   config
 *   records/{date}/trips
 *   rosters/{month}
 *   attendance/{date}/{driver_shift}
 *   finance/{month}
 *   fuel/{date}/{id}
 * ============================================================ */
const DataLayer = {

  /* ---------- 行車收入 ---------- */
  async getDayRecords(date) {
    const snap = await SHARED_db.ref('records/' + date).once('value');
    return snap.val() || null;
  },
  watchDayRecords(date, cb) {
    const ref = SHARED_db.ref('records/' + date);
    const handler = snap => cb(snap.val() || null);
    ref.on('value', handler);
    return () => ref.off('value', handler);
  },
  normalizeTrips(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean).map((t, i) => ({ ...t, id: t.id || ('lg_' + i) }));
    return Object.keys(raw).map(k => ({ ...raw[k], id: k }));
  },
  async saveBasic(date, plate, driver) {
    return SHARED_db.ref('records/' + date).update({ plate, driver });
  },
  async addTrip(date, trip) {
    const ref = SHARED_db.ref('records/' + date + '/trips').push();
    trip.id = ref.key;
    await ref.set(trip);
    return trip;
  },
  async deleteTrip(date, id) {
    return SHARED_db.ref('records/' + date + '/trips/' + id).remove();
  },
  async monthIncome(month) {
    const rg = U.range(month, 'month');
    const snap = await SHARED_db.ref('records').orderByKey().startAt(rg.start).endAt(rg.end + '\uf8ff').once('value');
    const all = snap.val() || {};
    let elec = 0, cash = 0, total = 0, trips = 0;
    Object.keys(all).forEach(d => {
      const day = all[d];
      if (!day || !day.trips) return;
      DataLayer.normalizeTrips(day.trips).forEach(t => {
        elec += (t.c9Elec||0) * SHARED.config.price9 + (t.c6Elec||0) * SHARED.config.price6;
        cash += (t.c9Cash||0) * SHARED.config.price9 + (t.c6Cash||0) * SHARED.config.price6;
        total += t.total || 0;
        trips++;
      });
    });
    return { elec, cash, total, trips };
  },

  /* ---------- 排更 ---------- */
  async getRoster(month) {
    const snap = await SHARED_db.ref('rosters/' + month).once('value');
    return snap.val();
  },
  watchRoster(month, cb) {
    const ref = SHARED_db.ref('rosters/' + month);
    const handler = snap => cb(snap.val());
    ref.on('value', handler);
    return () => ref.off('value', handler);
  },
  async saveRoster(month, data) {
    return SHARED_db.ref('rosters/' + month).set(data);
  },

  /* ---------- 考勤 ---------- */
  async getDayAttendance(date) {
    const snap = await SHARED_db.ref('attendance/' + date).once('value');
    return snap.val() || {};
  },
  watchDayAttendance(date, cb) {
    const ref = SHARED_db.ref('attendance/' + date);
    const handler = snap => cb(snap.val() || {});
    ref.on('value', handler);
    return () => ref.off('value', handler);
  },
  async saveAttendance(date, key, record) {
    return SHARED_db.ref('attendance/' + date + '/' + key).set(record);
  },
  async updateAttendance(date, key, patch) {
    return SHARED_db.ref('attendance/' + date + '/' + key).update(patch);
  },
  async deleteAttendance(date, key) {
    return SHARED_db.ref('attendance/' + date + '/' + key).remove();
  },
  async monthAttendance(month) {
    const rg = U.range(month, 'month');
    const snap = await SHARED_db.ref('attendance').orderByKey().startAt(rg.start).endAt(rg.end + '\uf8ff').once('value');
    const all = snap.val() || {};
    const sum = { early: { hours: 0, salary: 0 }, late: { hours: 0, salary: 0 } };
    Object.keys(all).forEach(d => {
      const day = all[d];
      const dayNum = parseInt(d.split('-')[2]);
      Object.values(day).forEach(r => {
        const bucket = dayNum <= 15 ? 'early' : 'late';
        sum[bucket].hours += r.hours || 0;
        sum[bucket].salary += r.salary || 0;
      });
    });
    return sum;
  },
  async allDrivers() {
    const snap = await SHARED_db.ref('attendance').once('value');
    const all = snap.val() || {};
    const set = new Set();
    Object.values(all).forEach(day => {
      Object.values(day).forEach(r => {
        if (r.driverName) set.add(r.driverName);
      });
    });
    return Array.from(set).sort();
  },

  /* ---------- 財務 ---------- */
  async getFinance(month) {
    const snap = await SHARED_db.ref('finance/' + month).once('value');
    return snap.val() || {};
  },
  watchFinance(month, cb) {
    const ref = SHARED_db.ref('finance/' + month);
    const handler = snap => cb(snap.val() || {});
    ref.on('value', handler);
    return () => ref.off('value', handler);
  },
  async saveFinance(month, payload) {
    return SHARED_db.ref('finance/' + month).set(payload);
  },

  /* ---------- 燃料費 ---------- */
  async getDayFuel(date) {
    const snap = await SHARED_db.ref('fuel/' + date).once('value');
    return snap.val() || {};
  },
  watchDayFuel(date, cb) {
    const ref = SHARED_db.ref('fuel/' + date);
    const handler = snap => cb(snap.val() || {});
    ref.on('value', handler);
    return () => ref.off('value', handler);
  },
  async addFuel(date, fuel) {
    const ref = SHARED_db.ref('fuel/' + date).push();
    fuel.id = ref.key;
    fuel.createdAt = Date.now();
    await ref.set(fuel);
    return fuel;
  },
  async deleteFuel(date, id) {
    return SHARED_db.ref('fuel/' + date + '/' + id).remove();
  },
  async monthFuel(month) {
    const rg = U.range(month, 'month');
    const snap = await SHARED_db.ref('fuel').orderByKey().startAt(rg.start).endAt(rg.end + '\uf8ff').once('value');
    const all = snap.val() || {};
    let total = 0, count = 0;
    Object.values(all).forEach(day => {
      Object.values(day).forEach(f => {
        total += f.amount || 0;
        count++;
      });
    });
    return { total, count };
  },

  /* ---------- 設定 ---------- */
  async getConfig() {
    const snap = await SHARED_db.ref('config').once('value');
    return snap.val() || {};
  },
  async saveConfig(cfg) {
    return SHARED_db.ref('config').set(cfg);
  }
};

/* ---------- 自動載入 config ---------- */
(async function loadSharedConfig() {
  try {
    const cfg = await DataLayer.getConfig();
    if (cfg.price9) SHARED.config.price9 = cfg.price9;
    if (cfg.price6) SHARED.config.price6 = cfg.price6;
    if (cfg.hourlyRate) SHARED.config.hourlyRate = cfg.hourlyRate;
    if (typeof onSharedConfigReady === 'function') onSharedConfigReady(SHARED.config);
  } catch (e) {
    console.warn('[shared] config 載入失敗：', e);
  }
})();

/* ---------- 對外暴露 ---------- */
window.SHARED = SHARED;
window.U = U;
window.DataLayer = DataLayer;
window.sharedLogin = sharedLogin;
window.sharedLogout = sharedLogout;
window.applySharedTheme = applySharedTheme;
window.toggleSharedTheme = toggleSharedTheme;