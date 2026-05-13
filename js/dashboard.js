// ==========================================
// INITIALIZATION & UI GENERATION
// ==========================================
function loadConfigAndBuildUI() {
  if (window._uiInitialized) return;
  if (CAIXAS.length === 0) CAIXAS = [...DEFAULT_CAIXAS];

  let tabsHtml = `<button class="tab-btn active" onclick="switchTab('geral',this)">Geral <span class="tab-badge" id="tb-geral">R$ 0</span></button>`;
  CAIXAS.forEach(cfg => { 
    tabsHtml += `<button class="tab-btn" onclick="switchTab('${cfg.id}',this)">${cfg.nome} <span class="tab-badge" id="tb-${cfg.id}">R$ 0</span></button>`; 
  });
  const nav = document.getElementById('tab-nav-container');
  if(nav) nav.innerHTML = tabsHtml;

  const container = document.getElementById('pages-container');
  if(container) {
    CAIXAS.forEach(cfg => {
      const div = document.createElement('div'); div.id = `page-${cfg.id}`; div.className = 'page';
      div.innerHTML = `<div class="content"><div id="caixa-${cfg.id}">${renderCaixaHTML(cfg)}</div></div>`;
      container.appendChild(div);
    });
  }

  window._uiInitialized = true;
  if (window.lucide) lucide.createIcons();
}

function renderCaixaHTML(cfg) {
  const c = cfg.id;
  const notasHTML = NOTAS.map(n => `<div class="nota-row"><span class="nota-lbl">R$ ${n.val}</span><input type="number" class="nota-qty" id="${c}-nota-${n.val}" oninput="calcularCaixa('${c}')"><span class="nota-sub" id="${c}-nota-${n.val}-val">R$ 0,00</span></div>`).join('');
  return `<div class="page-header"><div class="page-title">${cfg.nome}</div><div class="total-display-val" id="${c}-total-badge">R$ 0,00</div></div><div class="g2"><div><div class="card"><div class="card-head">Numerario Fisico</div><input type="text" class="field-input math-input" id="${c}-abertura" placeholder="Abertura"><hr>${notasHTML}<input type="text" class="field-input math-input" id="${c}-moeda" placeholder="Moedas"></div></div><div><div class="card"><div class="card-head">Eletronico</div><input type="text" class="field-input math-input" id="${c}-pix" placeholder="PIX"><input type="text" class="field-input math-input" id="${c}-debito" placeholder="Debito"><input type="text" class="field-input math-input" id="${c}-credito" placeholder="Credito"><input type="text" class="field-input math-input" id="${c}-taxa" placeholder="Taxas"></div><div class="card"><div class="card-head">Depositos</div><input type="text" class="field-input math-input" id="${c}-deposito" placeholder="Deposito"></div><div class="card"><div class="card-head">Sistema</div><input type="text" class="field-input math-input" id="${c}-imob" placeholder="Valor Sistema"><div id="${c}-diff-block" class="diff-block"><div id="${c}-diff-val"></div></div></div></div></div>`;
}

// ==========================================
// SYNC & AUTH
// ==========================================
let isRemoteUpdate = false;
let saveTimeout = null;

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const authCont = document.getElementById('auth-container');
    if(authCont) authCont.style.display = 'none';
    const snap = await db.ref('users/' + user.uid).once('value');
    if (snap.exists()) {
      currentCartorioId = snap.val().cartorioId;
      db.ref('cartorios/' + currentCartorioId + '/config').on('value', (cSnap) => {
        if(cSnap.exists()) {
          const cfg = cSnap.val();
          CAIXAS = cfg.caixas || DEFAULT_CAIXAS;
          OPERADORES = cfg.operadores || DEFAULT_OPERADORES;
          if(!window._uiInitialized) { 
            loadConfigAndBuildUI(); 
            showProfileSelector(); 
            dismissSplash();
          }
        }
      });
    }
  } else {
    const authCont = document.getElementById('auth-container');
    if(authCont) authCont.style.display = 'flex';
    dismissSplash();
  }
});

function carregarDados() {
  const dateStr = document.getElementById('mainDate').value;
  db.ref(`cartorios/${currentCartorioId}/caixas/${dateStr}`).on('value', (snap) => {
    isRemoteUpdate = true;
    const data = snap.val();
    if(data) {
       CAIXAS.forEach(cfg => {
         const c = cfg.id; if(!data[c]) return;
         document.getElementById(`${c}-abertura`).value = data[c].abertura || '';
         document.getElementById(`${c}-moeda`).value = data[c].moeda || '';
         NOTAS.forEach(n => document.getElementById(`${c}-nota-${n.val}`).value = data[c][`n${n.val}`] || '');
         ['pix','debito','credito','taxa','deposito','imob'].forEach(f => {
             const el = document.getElementById(`${c}-${f}`);
             if(el) el.value = data[c][f] || '';
         });
         calcularCaixa(c);
       });
    }
    isRemoteUpdate = false;
    dismissSplash();
  });
}

function salvarDados() {
  if (isRemoteUpdate || !currentCartorioId || !activeOperator) return;
  const dateStr = document.getElementById('mainDate').value;
  const obj = {};
  CAIXAS.forEach(cfg => {
    const c = cfg.id; obj[c] = { abertura: document.getElementById(`${c}-abertura`).value };
    NOTAS.forEach(n => obj[c][`n${n.val}`] = document.getElementById(`${c}-nota-${n.val}`).value);
    ['moeda','pix','debito','credito','taxa','deposito','imob'].forEach(f => obj[c][f] = document.getElementById(`${c}-${f}`).value);
  });
  db.ref(`cartorios/${currentCartorioId}/caixas/${dateStr}`).update(obj);
}

function salvarDadosDebounced() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(salvarDados, 1500);
}

function switchTab(id, btn) {
  document.querySelectorAll('.page, .tab-btn').forEach(el => el.classList.remove('active'));
  const p = document.getElementById(`page-${id}`);
  if(p) p.classList.add('active'); 
  if(btn) btn.classList.add('active');
}

function showProfileSelector() {
  const modal = document.getElementById('profileModal');
  if(modal) modal.style.display = 'flex';
  const list = document.getElementById('profile-list');
  if(list) list.innerHTML = OPERADORES.map(op => `<button onclick="setActiveOperator('${op.id}')">${op.nome}</button>`).join('');
}

function setActiveOperator(id) {
  activeOperator = OPERADORES.find(x => x.id === id);
  const modal = document.getElementById('profileModal');
  if(modal) modal.style.display = 'none';
  const opDisp = document.getElementById('active-operator-display');
  if(opDisp) opDisp.textContent = `Operador: ${activeOperator.nome}`;
  carregarDados();
}

document.addEventListener('DOMContentLoaded', () => {
  const dateEl = document.getElementById('mainDate');
  if(dateEl) {
    const today = new Date().toLocaleDateString('en-CA');
    dateEl.value = today;
  }
  if(window.lucide) lucide.createIcons();
});
