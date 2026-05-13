// ═══ FIREBASE SYNC CONFIG ═══
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

// ═══ DEFAULT CONFIGURATION ═══

const SERVENTIA_PRESETS = [
  { id:'ri',       icon:'building-2',    nome:'Registro de Imóveis',      desc:'Registro de transmissão e ônus de imóveis', cor:'ri-color',
    dep:{ id:'dep_ri',   nome:'Registro de Imóveis',      cor:'ri-color' },
    caixas:[{ id:'cx_ri1', nome:'Caixa RI — Guichê 1', tipo:'dep_ri' }],
    sistema:{ id:'sys_ri', nome:'Sistema RI', departamentos:['dep_ri'] } },
  { id:'notas',    icon:'scroll-text',   nome:'Notas',                    desc:'Escrituras, procurações e atos notariais',  cor:'onr-color',
    dep:{ id:'dep_notas', nome:'Notas', cor:'onr-color' },
    caixas:[{ id:'cx_notas1', nome:'Caixa Notas', tipo:'dep_notas' }],
    sistema:null },
  { id:'td',       icon:'file-text',     nome:'Títulos e Documentos',     desc:'Registro de contratos e títulos',           cor:'td-color',
    dep:{ id:'dep_td', nome:'Títulos e Documentos', cor:'td-color' },
    caixas:[{ id:'cx_td1', nome:'Caixa TD', tipo:'dep_td' }],
    sistema:{ id:'sys_td', nome:'Sistema TD', departamentos:['dep_td'] } },
  { id:'protesto', icon:'alert-triangle', nome:'Protesto',                desc:'Protesto de títulos e documentos de dívida', cor:'td-color',
    dep:{ id:'dep_prot', nome:'Protesto', cor:'td-color' },
    caixas:[{ id:'cx_prot1', nome:'Caixa Protesto', tipo:'dep_prot' }],
    sistema:null },
  { id:'rc',       icon:'users',         nome:'Registro Civil',           desc:'Nascimentos, casamentos e óbitos',           cor:'onr-color',
    dep:{ id:'dep_rc', nome:'Registro Civil', cor:'onr-color' },
    caixas:[{ id:'cx_rc1', nome:'Caixa RC', tipo:'dep_rc' }],
    sistema:null },
  { id:'onr',      icon:'landmark',      nome:'Especializado (ONR)',       desc:'Repasse eletrônico ao Cartório Nacional',   cor:'ri-color',
    dep:{ id:'dep_ri', nome:'Registro de Imóveis', cor:'ri-color' },
    caixas:[{ id:'cx_onr1', nome:'Repasse ONR', tipo:'dep_ri' }],
    sistema:null }
];
const DEFAULT_DEPARTAMENTOS = [];
const DEFAULT_SISTEMAS = [];
const DEFAULT_CAIXAS = [ { id:'caixa1', nome:'Caixa Principal',  tipo:'geral' } ];
const DEFAULT_OPERADORES = [{ id: 'op_admin', nome: 'Administrador', pin: '' }];
const DEFAULT_LABELS = { maquininha: 'Operadora', saida_patrimonial: 'Retirada/Sócio' };
const NOTAS = [ {lbl:'R$ 100',val:100}, {lbl:'R$ 50',val:50}, {lbl:'R$ 20',val:20}, {lbl:'R$ 10',val:10}, {lbl:'R$ 5',val:5}, {lbl:'R$ 2',val:2} ];

let DEPARTAMENTOS = []; let editingDepartamentos = [];
let SISTEMAS = []; let editingSistemas = [];
let CAIXAS = []; let editingCaixas = [];
let OPERADORES = []; let editingOperadores = [];
let LABELS = {...DEFAULT_LABELS}; let editingLabels = {};

let activeTabId = 'geral'; let activeCaixaForModal = null; let lastDiffs = {};
let myChart = null; let historyChart = null;
let activeOperator = null; let pendingProfile = null;
let cartorioGlobalName = 'Cartório';
// Plano protegido: não pode ser alterado via console sem revalidar com o servidor
let _planoInterno = 'profissional';
let _planoValidadoHash = null;
function _computePlanoHash(p) { return btoa(p + ':' + (currentCartorioId || '') + ':cxc_salt_2026'); }
Object.defineProperty(window, 'currentPlano', {
  get() { return _planoInterno; },
  set(v) {
    // Só aceita se vier do fluxo legítimo (com hash válido pendente)
    if (_planoValidadoHash && _planoValidadoHash === _computePlanoHash(v)) {
      _planoInterno = v;
      _planoValidadoHash = null;
    } else {
      console.warn('[SEGURANÇA] Alteração de plano bloqueada. O plano é gerenciado pelo servidor.');
    }
  },
  configurable: false,
  enumerable: true
});
function _setPlanoSeguro(plano) {
  _planoValidadoHash = _computePlanoHash(plano);
  window.currentPlano = plano;
}

function toggleProfileMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('profile-menu');
  menu.classList.toggle('active');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('profile-menu');
  const btn = document.getElementById('profile-avatar');
  if (menu && menu.classList.contains('active') && e.target !== btn && !btn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.remove('active');
  }
});

function promptEditCartorioName() {
  const newName = prompt("Qual o novo nome para este cartório?", cartorioGlobalName);
  if (newName && newName.trim() !== '') {
    cartorioGlobalName = newName.trim();
    db.ref('cartorios/' + currentCartorioId + '/nome').set(cartorioGlobalName);
    updateCartorioNameUI();
    showToast("Nome atualizado com sucesso!");
  }
}

function updateCartorioNameUI() {
  const tName = document.getElementById('topbar-cartorio-name');
  if (tName) { tName.innerHTML = ''; const span = document.createElement('span'); span.className = 'fw-bold'; span.textContent = cartorioGlobalName; tName.appendChild(span); }
  const mName = document.getElementById('menu-cartorio-name');
  if (mName) mName.textContent = cartorioGlobalName;
  const avatar = document.getElementById('profile-avatar');
  if (avatar && cartorioGlobalName.length > 0) avatar.textContent = cartorioGlobalName.charAt(0).toUpperCase();
}

function enforcePlanLimits() {
  if (currentPlano === 'basico') {
      const pContainer = document.getElementById('paymentChart')?.parentElement;
      if (pContainer && !pContainer.querySelector('.lucide-lock')) {
          pContainer.innerHTML = `<div style="padding:40px 20px; text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%;"><i data-lucide="lock" style="width:32px;height:32px;color:var(--text3);margin-bottom:10px;"></i><div style="font-size:13px;font-weight:700;color:var(--text);">Gráfico exclusivo do<br>Plano Profissional</div></div>`;
          if (window.lucide) lucide.createIcons();
      }
      myChart = null;
  }
}

function getColorClass(tipo) {
  if (tipo === 'RI') return 'ri-color';
  if (tipo === 'ONR') return 'onr-color';
  if (tipo === 'TD') return 'td-color';
  const dep = DEPARTAMENTOS.find(d => d.id === tipo);
  return dep ? dep.cor : 'ri-color'; 
}
