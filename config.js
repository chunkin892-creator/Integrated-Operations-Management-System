const firebaseConfig = {
  apiKey: "AIzaSyCnToMYsM7pIGeGHLt5xFbQfT5RAIWzTQA",
  authDomain: "van-v9-41439.firebaseapp.com",
  databaseURL: "https://van-v9-41439-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "van-v9-41439",
  storageBucket: "van-v9-41439.firebasestorage.app",
  messagingSenderId: "434506286219",
  appId: "1:434506286219:web:00a57d319da5c6cc4fc08e"
};

const CONFIG = {
  TRIGGER_DISTANCE: 100,
  GPS_TIMEOUT: 20000,
  GPS_ACCURACY_THRESHOLD: 50,
  GPS_RETRY_DELAY: 5000,
  MIN_SPEED_FOR_TRIGGER: 1.0,
  SMOOTHING_WINDOW: 3,
  VOICE_BITRATE: 24000,
  RECORD_MAX_SECONDS: 30,
  ACTIVE_BUS_TIMEOUT: 300000,
  MESSAGE_LIMIT: 100
};

const SUPER_ADMIN_EMAILS = ['cheungyiufai1810@gmail.com', 'hujiaboy@gmail.com'];

const VOICE_TEXTS = {
  startDuty: '開始當值',
  stopDuty: '已停止當值',
  arrived: '到達 ',
  nextStation: '下一站 ',
  lastStation: '已到達總站',
  turnAround: '已調頭',
  arrivedTerminus: '已到達總站，清客完畢，現已調頭',
  welcomeAdmin: '管理員登入成功',
  welcomeDriver: '司機登入成功',
  welcomePassenger: '乘客登入成功',
  loggedOut: '已登出，下次見',
  permissionDenied: '權限不足',
  passengerPage: '乘客頁面',
  driverPage: '司機頁面',
  adminPage: '管理後台',
  backToLobby: '返回大堂',
  backToList: '返回列表',
  sent: '已發送',
  announce: '自動報站已開啟',
  announceOff: '自動報站已關閉',
  modeBusy: '西鐵快線',
  modeNormal: '市中心循環線',
  switchedTo: '已切換至 ',
  carPlateSet: '車牌已設定'
};