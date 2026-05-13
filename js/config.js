// ==========================================
// FIREBASE SYNC CONFIG
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyClMGH7dCh98WReopZpNk9Kd52TxhSF-xQ",
  authDomain: "caixacartorio-70b6a.firebaseapp.com",
  databaseURL: "https://caixacartorio-70b6a-default-rtdb.firebaseio.com",
  projectId: "caixacartorio-70b6a",
  storageBucket: "caixacartorio-70b6a.firebasestorage.app",
  messagingSenderId: "912268046292",
  appId: "1:912268046292:web:0df9526d679e0322ac3041",
  measurementId: "G-Q3KLFCLGKT"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// ==========================================
// DEFAULT CONFIGURATION
// ==========================================
const DEFAULT_CAIXAS = [ { id: "caixa1", nome: "Caixa Principal", tipo: "geral" } ];
const DEFAULT_OPERADORES = [{ id: "op_admin", nome: "Administrador", pin: "" }];
const DEFAULT_LABELS = { maquininha: "Operadora", saida_patrimonial: "Retirada/Socio" };
const NOTAS = [ {lbl:"R$ 100",val:100}, {lbl:"R$ 50",val:50}, {lbl:"R$ 20",val:20}, {lbl:"R$ 10",val:10}, {lbl:"R$ 5",val:5}, {lbl:"R$ 2",val:2} ];

let DEPARTAMENTOS = []; 
let SISTEMAS = []; 
let CAIXAS = []; 
let OPERADORES = []; 
let LABELS = {...DEFAULT_LABELS};
let activeTabId = "geral"; 
let activeCaixaForModal = null; 
let lastDiffs = {};
let myChart = null; 
let activeOperator = null; 
let cartorioGlobalName = "Cartorio";
let currentCartorioId = null;
let cartorioCode = null;
let configOperadoresPodemDestravar = false;

let _planoInterno = "profissional";
let _planoValidadoHash = null;
function _computePlanoHash(p) { return btoa(p + ":" + (currentCartorioId || "") + ":cxc_salt_2026"); }
Object.defineProperty(window, "currentPlano", {
  get() { return _planoInterno; },
  set(v) {
    if (_planoValidadoHash && _planoValidadoHash === _computePlanoHash(v)) {
      _planoInterno = v;
      _planoValidadoHash = null;
    } else {
      console.warn("[SEGURANÇA] Alteração de plano bloqueada.");
    }
  },
  configurable: false,
  enumerable: true
});
function _setPlanoSeguro(plano) {
  _planoValidadoHash = _computePlanoHash(plano);
  window.currentPlano = plano;
}

function updateCartorioNameUI() {
  const tName = document.getElementById("topbar-cartorio-name");
  if (tName) tName.textContent = cartorioGlobalName;
  const mName = document.getElementById("menu-cartorio-name");
  if (mName) mName.textContent = cartorioGlobalName;
  const avatar = document.getElementById("profile-avatar");
  if (avatar && cartorioGlobalName.length > 0) avatar.textContent = cartorioGlobalName.charAt(0).toUpperCase();
}

function getColorClass(tipo) {
  const dep = DEPARTAMENTOS.find(d => d.id === tipo);
  return dep ? dep.cor : "ri-color"; 
}
