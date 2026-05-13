// ══════════════════════════════════════════════════════════
// INITIALIZATION & UI GENERATION
// ══════════════════════════════════════════════════════════
function loadConfigAndBuildUI() {
  if (window._uiInitialized) return;

  // Defaults fallback
  if (CAIXAS.length === 0) CAIXAS = [...DEFAULT_CAIXAS];
  if (OPERADORES.length === 0) OPERADORES = [...DEFAULT_OPERADORES];
  if (DEPARTAMENTOS.length === 0) DEPARTAMENTOS.push({ id: 'geral', nome: 'Departamento Geral', cor: 'ri-color' });

  setEl('lbl-infinity-geral', `Total do Relatório da ${LABELS.maquininha}`);

  // Departamentos UI
  const depContainer = document.getElementById('geral-departamentos-container');
  if(depContainer) {
    depContainer.innerHTML = DEPARTAMENTOS.map(d => `<div class="stat"><div class="stat-lbl">${d.nome}</div><div class="stat-val ${d.cor}" id="g-dep-${d.id}-total">R$ 0,00</div><div class="stat-sub">Soma de caixas vinculados</div></div>`).join('');
  }

  // Sistemas UI
  const sysContainer = document.getElementById('geral-sistemas-container');
  if(sysContainer) {
    sysContainer.innerHTML = SISTEMAS.map(s => {
      let depNames = s.departamentos.map(did => { const d = DEPARTAMENTOS.find(x => x.id === did); return d ? d.nome : did; }).join(', ');
      return `<div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar yellow"></div>Conferência com ${s.nome}</div></div><div class="field"><div class="field-label">Valor gerado pelo relatório de fechamento do sistema <span class="field-hint">Compara com o total dos caixas de: ${depNames || 'Nenhum'}</span></div><input type="text" autocomplete="off" class="field-input math-input" id="sys-input-${s.id}" placeholder="0,00"></div><div id="g-diff-block-${s.id}" class="diff-block"><div><div class="diff-info-label" id="g-diff-label-${s.id}">Aguardando lançamento</div><div class="diff-info-sub">Comparativo: Caixas × Sistema</div></div><div class="diff-val dim" id="g-diff-val-${s.id}">—</div></div></div>`;
    }).join('');
  }

  // Tabs Nav
  let tabsHtml = `<button class="tab-btn active" onclick="switchTab('geral',this)">Fechamento Geral<span class="tab-badge" id="tb-geral">R$ 0</span></button>`;
  CAIXAS.forEach(cfg => { const clr = getColorClass(cfg.tipo); tabsHtml += `<button class="tab-btn" draggable="true" data-caixa-id="${cfg.id}" onclick="switchTab('${cfg.id}',this)"><span class="${clr}">${cfg.nome}</span><span class="tab-badge" id="tb-${cfg.id}">R$ 0</span></button>`; });
  tabsHtml += `<button class="tab-btn" onclick="switchTab('dashboard',this)"><i data-lucide="bar-chart-3" style="width:14px; margin-right:4px;"></i> Histórico</button>`;
  document.getElementById('tab-nav-container').innerHTML = tabsHtml;

  // Resumo Table
  let tableHtml = '';
  CAIXAS.forEach(cfg => { const clr = getColorClass(cfg.tipo); tableHtml += `<tr><td class="${clr}">${cfg.nome}</td><td id="g-${cfg.id}-din">—</td><td id="g-${cfg.id}-pix">—</td><td id="g-${cfg.id}-cred">—</td><td id="g-${cfg.id}-taxa" style="color:var(--accent-r)">—</td><td id="g-${cfg.id}-deb">—</td><td id="g-${cfg.id}-dep">—</td><td id="g-${cfg.id}-tot" class="v-green">—</td></tr>`; });
  tableHtml += `<tr class="tot-row"><td>TOTAL GERAL</td><td id="g-sum-din">—</td><td id="g-sum-pix">—</td><td id="g-sum-cred">—</td><td id="g-sum-taxa" style="color:var(--accent-r)">—</td><td id="g-sum-deb">—</td><td id="g-sum-dep">—</td><td id="g-sum-tot" class="v-green">—</td></tr>`;
  document.getElementById('resumo-tbody').innerHTML = tableHtml;

  // Create Pages
  const container = document.getElementById('pages-container');
  CAIXAS.forEach(cfg => {
    const div = document.createElement('div'); div.id = `page-${cfg.id}`; div.className = 'page';
    div.innerHTML = `<div class="content"><div id="caixa-${cfg.id}">${renderCaixaHTML(cfg)}</div></div>`;
    container.appendChild(div);
  });

  window._uiInitialized = true;
  if (window.lucide) lucide.createIcons();
  if (activeOperator) setActiveOperator(activeOperator);
}

function renderFieldWithDetails(c, id, label, hint) {
  return `<div class="field"><div class="field-label" style="display:flex; justify-content:space-between; align-items:center;"><div>${label} <span class="field-hint">${hint}</span></div><button class="btn-toggle-detalhes" onclick="toggleDetalhes('${c}', '${id}')" id="btn-det-${c}-${id}" title="Lançamentos individuais"><i data-lucide="list-plus" style="width:14px; height:14px;"></i></button></div><input type="text" autocomplete="off" class="field-input math-input" id="${c}-${id}" placeholder="0,00"><div class="detalhes-wrap" id="${c}-${id}-det-wrap"><div id="${c}-${id}-det-list"></div><button class="btn btn-ghost btn-detalhe-add" onclick="addDetalhe('${c}', '${id}')"><i data-lucide="plus" style="width:12px; height:12px;"></i> Adicionar Recibo</button></div></div>`;
}

function renderCaixaHTML(cfg) {
  const c = cfg.id; const cColor = getColorClass(cfg.tipo);
  const anotacoesHTML = `<div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar"></div>Anotações</div><button class="btn btn-ghost" style="padding:4px 10px;font-size:11px;" onclick="addAnotacao('${c}')"><i data-lucide="plus" style="width:12px;"></i> Adicionar</button></div><div id="${c}-anots-wrap"></div></div>`;
  
  const notasHTML = NOTAS.map(n => `<div class="nota-row"><span class="nota-lbl">${n.lbl}</span><input type="number" autocomplete="off" class="nota-qty" id="${c}-nota-${n.val}" placeholder="0" oninput="calcularCaixa('${c}')"><span class="nota-sub" id="${c}-nota-${n.val}-val">R$ 0,00</span></div>`).join('');
  const depObj = DEPARTAMENTOS.find(d => d.id === cfg.tipo);
  const subTitle = depObj ? depObj.nome : 'Departamento Geral';

  return `<div class="page-header"><div class="title-wrap"><div><div class="page-title ${cColor}">${cfg.nome}</div><div class="page-sub">${subTitle}</div></div><button class="btn btn-ghost" onclick="limparCaixa('${c}')" title="Limpar caixa"><i data-lucide="eraser"></i></button></div><div class="total-display"><div class="total-display-label">Total Líquido do Caixa</div><div class="total-display-val" id="${c}-total-badge">R$ 0,00</div></div></div><div class="g2"><div><div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar green"></div>Numerário Físico (Cédulas e Moedas)</div></div><div class="field"><div class="field-label">Fundo de Caixa Inicial <span class="field-hint">Troco recebido na abertura</span></div><input type="text" autocomplete="off" class="field-input math-input neg" id="${c}-abertura" placeholder="0,00"></div><hr class="div"><div class="notas-wrap">${notasHTML}</div><hr class="div"><div class="field-label" style="margin-bottom:6px;">Moedas e Frações</div><div class="moeda-row"><span class="nota-lbl">Total em Moedas</span><input type="text" autocomplete="off" class="moeda-input math-input" id="${c}-moeda" placeholder="0,00"><button class="btn btn-ghost" style="padding:4px 8px;" onclick="openMoedaModal('${c}')"><i data-lucide="calculator"></i></button></div><div class="sub-row"><span class="sub-row-lbl">Subtotal Numerário Físico</span><span class="sub-row-val" id="${c}-sub-din">R$ 0,00</span></div></div>
  <div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar purple"></div>Saídas de Caixa (Patrimônio)</div><span class="info-tag">Não deduz do total</span></div>
  <div class="field"><div class="field-label">Consolidação Patrimonial <span class="field-hint">Lucro retirado para o patrimônio</span></div><input type="text" autocomplete="off" class="field-input math-input" id="${c}-bernadete" placeholder="0,00"></div>
  <div class="field"><div class="field-label">Adiantamento / Vale a Funcionário</div><input type="text" autocomplete="off" class="field-input math-input" id="${c}-vale" placeholder="0,00"></div>
  <div class="field"><div class="field-label">Saldo Remanescente p/ Abertura do Dia Seguinte</div>
    <input type="text" autocomplete="off" class="field-input math-input" id="${c}-saldo-remanescente" placeholder="0,00" oninput="calcularCaixa('${c}')">
    <div style="display:flex;gap:8px;margin-top:8px;">
      <button class="btn btn-ghost" style="font-size:11px;padding:5px 12px;flex:1;" onclick="aplicarSaldoProximoDia('${c}')">
        <i data-lucide="arrow-right-circle" style="width:13px;"></i> Transferir para amanhã
      </button>
    </div>
    <div id="${c}-saldo-status" style="margin-top:6px;font-size:11px;color:var(--text3);"></div>
  </div>
  </div></div><div><div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar" style="background:var(--accent);"></div>Recebimentos Eletrônicos (Maquininha)</div></div>${renderFieldWithDetails(c, 'pix', 'PIX', 'Recebimentos via PIX')}${renderFieldWithDetails(c, 'debito', 'Cartão de Débito', '')}${renderFieldWithDetails(c, 'credito', 'Cartão de Crédito', 'Valor bruto')}<div class="sub-row" style="background:rgba(59,130,246,0.05); border-color:rgba(59,130,246,0.2);"><span class="sub-row-lbl">Total Eletrônico (Bruto)</span><span class="sub-row-val text-blue" id="${c}-maq-bruta">R$ 0,00</span></div><hr class="div"><div class="field"><div class="field-label">Taxa Administrativa Bancária</div><input type="text" autocomplete="off" class="field-input math-input neg" id="${c}-taxa" placeholder="0,00"></div><div class="sub-row"><span class="sub-row-lbl">Saldo Líquido Eletrônico (após taxas)</span><span class="sub-row-val" id="${c}-maq-liq">R$ 0,00</span></div></div><div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar green"></div>Depósitos Bancários</div></div>${renderFieldWithDetails(c, 'deposito', 'Depósito em Conta', 'Comprovante de depósito')}</div><div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar yellow"></div>Conferência de Relatório do Caixa</div></div><div class="field"><div class="field-label">Valor gerado no relatório deste caixa</div><input type="text" autocomplete="off" class="field-input math-input" id="${c}-imob" placeholder="0,00"></div><div id="${c}-diff-block" class="diff-block"><div><div class="diff-info-label" id="${c}-diff-label">Aguardando lançamento</div><div class="diff-info-sub" style="font-size:10px;color:var(--text3);">Comparativo: Total do caixa × Total do sistema</div></div><div class="diff-val dim" id="${c}-diff-val">—</div></div></div>${anotacoesHTML}</div></div>`;
}

// ══════════════════════════════════════════════════════════
// THEME & CHARTS
// ══════════════════════════════════════════════════════════
function toggleTheme() {
  const isLight = document.body.getAttribute('data-theme') === 'light';
  document.body.setAttribute('data-theme', isLight ? 'dark' : 'light');
  document.getElementById('theme-icon').setAttribute('data-lucide', isLight ? 'sun' : 'moon'); lucide.createIcons();
  localStorage.setItem('caixa_theme', isLight ? 'dark' : 'light'); if(myChart) updateChartColors(); if(historyChart) updateHistoryChartColors();
}
function initTheme() { if (localStorage.getItem('caixa_theme') === 'light') { document.body.setAttribute('data-theme', 'light'); } }
function initChart() {
  const canvas = document.getElementById('paymentChart');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  myChart = new Chart(ctx, { type: 'doughnut', data: { labels: ['Dinheiro Fís.', 'Maquininha Líq.', 'Depósito'], datasets: [{ data: [0,0,0], backgroundColor: ['#3b82f6', '#22c55e', '#eab308'], borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#888', font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } } } }, cutout: '70%' } });
}

// ══════════════════════════════════════════════════════════
// SYNC & DATA PERSISTENCE
// ══════════════════════════════════════════════════════════
let currentCartorioId = null;
let cartorioCode = null;
let isRemoteUpdate = false;
let saveTimeout = null;
let lastKnownState = null;

auth.onAuthStateChanged(async (user) => {
  if(window.isRegistering) return;
  
  if (user) {
    document.getElementById('auth-container').style.display = 'none';
    document.body.classList.remove('auth-mode');
    
    const splashStatus = document.getElementById('splash-status');
    if (splashStatus) splashStatus.textContent = 'Autenticando...';

    const snap = await db.ref('users/' + user.uid).once('value');
    if (snap.exists()) {
      currentCartorioId = snap.val().cartorioId;
      
      // Load info
      const cartSnap = await db.ref('cartorios/' + currentCartorioId + '/info').once('value');
      if(cartSnap.exists()) {
        const info = cartSnap.val();
        cartorioCode = info.codigoAcesso;
        cartorioGlobalName = info.nome || 'Cartório';
        _setPlanoSeguro(info.plano || 'profissional');
        updateCartorioNameUI();
        enforcePlanLimits();
        const disp = document.getElementById('cartorio-code-display');
        if(disp) { disp.textContent = `Código: ${cartorioCode}`; disp.style.display = 'inline'; }
      }
      
      // Listeners
      db.ref('cartorios/' + currentCartorioId + '/config/caixas').on('value', (cfgSnap) => {
        if (cfgSnap.exists()) {
          const remoteConfig = cfgSnap.val();
          if (JSON.stringify(remoteConfig) !== JSON.stringify(CAIXAS)) {
            CAIXAS = remoteConfig;
            if (window._uiInitialized) location.reload();
            else softReloadUI();
          }
        }
      });
      
      db.ref('cartorios/' + currentCartorioId + '/config/operadores').on('value', (opSnapLive) => {
        if (opSnapLive.exists()) {
          OPERADORES = opSnapLive.val();
          if (!window._uiInitialized) {
            if (splashStatus) splashStatus.textContent = 'Configurações prontas!';
            loadConfigAndBuildUI();
            checkProfileSelection(); 
          }
        }
      });

      db.ref('cartorios/' + currentCartorioId + '/config/labels').on('value', (lblSnap) => {
        if (lblSnap.exists()) { 
          LABELS = lblSnap.val(); 
          if(document.getElementById('lbl-infinity-geral')) setEl('lbl-infinity-geral', `Total do Relatório da ${LABELS.maquininha}`); 
        }
      });

      db.ref('cartorios/' + currentCartorioId + '/config/departamentos').on('value', (depSnap) => {
        if (depSnap.exists()) { DEPARTAMENTOS = depSnap.val(); }
      });

      db.ref('cartorios/' + currentCartorioId + '/config/sistemas').on('value', (sysSnap) => {
        if (sysSnap.exists()) { SISTEMAS = sysSnap.val(); }
      });
      
      db.ref('cartorios/' + currentCartorioId + '/config/lockPermission').on('value', (lockSnap) => {
        if (lockSnap.exists()) configOperadoresPodemDestravar = lockSnap.val();
      });
    } else {
      if (window.dismissSplash) dismissSplash();
      alert("Erro: Perfil não encontrado.");
      auth.signOut();
    }
  } else {
    if (window.dismissSplash) dismissSplash();
    document.getElementById('auth-container').style.display = 'flex';
    document.body.classList.add('auth-mode');
    currentCartorioId = null;
  }
});

async function carregarDados() {
  if (!currentCartorioId || !activeOperator) return;
  const dateStr = document.getElementById('mainDate').value;
  const splashStatus = document.getElementById('splash-status');
  if (splashStatus) splashStatus.textContent = `Sincronizando ${dateStr}...`;
  
  db.ref(`cartorios/${currentCartorioId}/caixas/${dateStr}`).on('value', (snap) => {
    isRemoteUpdate = true;
    const obj = snap.val();
    lastKnownState = obj;
    _preencherFormulario(obj);
    if (window.dismissSplash) dismissSplash();
    isRemoteUpdate = false;
    setEl('last-saved', '✓ Sincronizado');
    window._firebaseDataLoaded = true;
  });
}

async function salvarDados(manual = false) {
  if (isRemoteUpdate || !currentCartorioId || !activeOperator) return;
  const dateStr = document.getElementById('mainDate').value;
  
  if (!window._firebaseDataLoaded && !manual) return;

  const dados = coletarDados();
  
  const diff = getDeltaNested(dados, lastKnownState);
  if (diff) {
    setEl('last-saved', '⏳ Salvando...');
    await db.ref(`cartorios/${currentCartorioId}/caixas/${dateStr}`).update(diff);
    setEl('last-saved', '✓ Salvo na nuvem');
  } else {
    setEl('last-saved', '✓ Sincronizado');
  }
}

function salvarDadosDebounced() {
  if (isRemoteUpdate) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  setEl('last-saved', '⏳ Aguardando...');
  saveTimeout = setTimeout(() => salvarDados(false), 1500);
}

function coletarDados() {
  const now = new Date();
  const hhmm = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const obj = { 
    _modificadoPor: activeOperator ? activeOperator.nome : 'Desconhecido',
    _modificadoAs: hhmm
  };
  SISTEMAS.forEach(sys => {
    const el = document.getElementById(`sys-input-${sys.id}`);
    if(el) obj[`sys_input_${sys.id}`] = el.value;
  });
  CAIXAS.forEach(cfg => { 
    const c = cfg.id; obj[c] = {}; 
    NOTAS.forEach(n => obj[c][`n${n.val}`] = document.getElementById(`${c}-nota-${n.val}`)?.value || ''); 
    ['moeda','pix','credito','taxa','debito','deposito','abertura','bernadete','vale','imob','saldo-remanescente'].forEach(f => { obj[c][f] = document.getElementById(`${c}-${f}`)?.value || ''; }); 
    
    // Detalhes
    ['pix','debito','credito','deposito'].forEach(f => {
      const list = document.getElementById(`${c}-${f}-det-list`);
      if(list && list.children.length > 0) {
        const inputs = list.querySelectorAll('.detalhe-input');
        obj[c][`${f}_det`] = Array.from(inputs).map(inp => inp.value).join('||');
      }
    });

    const anotsWrap = document.getElementById(`${c}-anots-wrap`); 
    if(anotsWrap) { 
      const anots = anotsWrap.querySelectorAll('.anot-input'); 
      for(let i=0; i<anots.length; i++) { obj[c][`a${i+1}`] = anots[i].value; } 
    } 
  }); 
  return obj;
}

function _preencherFormulario(obj) {
  updateLockUI(obj && obj._locked === true);
  document.querySelectorAll('input:not([type="date"]):not([type="month"])').forEach(i => { if(i !== document.activeElement) i.value = ''; });
  CAIXAS.forEach(cfg => { 
    const wrap=document.getElementById(`${cfg.id}-anots-wrap`); 
    if(wrap && !wrap.contains(document.activeElement)) wrap.innerHTML = ''; 
    ['pix','debito','credito','deposito'].forEach(f => {
       const list = document.getElementById(`${cfg.id}-${f}-det-list`);
       if(list && !list.contains(document.activeElement)) list.innerHTML = '';
       const mainInput = document.getElementById(`${cfg.id}-${f}`);
       if(mainInput) { mainInput.disabled = false; }
    });
  });

  if (!obj) { CAIXAS.forEach(cfg => { addAnotacao(cfg.id); calcularCaixa(cfg.id); }); return; }
  
  const setIfInactive = (id, val) => { const el = document.getElementById(id); if (el && el !== document.activeElement) el.value = val; };
  SISTEMAS.forEach(sys => { if (obj[`sys_input_${sys.id}`]) setIfInactive(`sys-input-${sys.id}`, obj[`sys_input_${sys.id}`]); });
  
  CAIXAS.forEach(cfg => {
    const c = cfg.id;
    if (!obj[c]) { addAnotacao(c); return; }
    NOTAS.forEach(n => setIfInactive(`${c}-nota-${n.val}`, obj[c][`n${n.val}`]||''));
    ['moeda','pix','credito','taxa','debito','deposito','abertura','bernadete','vale','imob','saldo-remanescente'].forEach(f => { setIfInactive(`${c}-${f}`, obj[c][f]||''); });
    
    ['pix','debito','credito','deposito'].forEach(f => {
      if(obj[c][`${f}_det`]){
        const list = document.getElementById(`${c}-${f}-det-list`);
        if(list) {
          obj[c][`${f}_det`].split('||').forEach(v => {
            const div = document.createElement('div'); div.className = 'detalhe-row';
            div.innerHTML = `<input type="text" autocomplete="off" class="field-input math-input detalhe-input" placeholder="0,00" value="${v}" oninput="sumDetalhes('${c}','${f}')"><button class="btn btn-ghost btn-ghost-danger" onclick="removeDetalhe(this,'${c}','${f}')"><i data-lucide="trash-2" style="width:12px;"></i></button>`;
            list.appendChild(div);
          });
          const mainInp = document.getElementById(`${c}-${f}`);
          if(mainInp) mainInp.disabled = true;
        }
      }
    });

    const anotsWrap = document.getElementById(`${c}-anots-wrap`);
    if(anotsWrap) {
      let i=1; while(obj[c][`a${i}`] !== undefined) {
        const div = document.createElement('div'); div.className = 'anot-row';
        div.innerHTML = `<span class="anot-num">${i}.</span><input type="text" class="anot-input" value="${obj[c][`a${i}`]}" placeholder="Observação..." oninput="atualizarNumAnots('${c}')"><button class="btn btn-ghost btn-ghost-danger" style="padding:4px 8px;font-size:12px;" onclick="removeAnotacao(this,'${c}')"><i data-lucide="x" style="width:12px;"></i></button>`;
        anotsWrap.appendChild(div); i++;
      }
      if(i === 1) addAnotacao(c);
    }
    calcularCaixa(c);
  });
  if (window.lucide) lucide.createIcons();
}

function switchTab(id, btn) {
  activeTabId = id;
  document.querySelectorAll('.page, .tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`page-${id}`).classList.add('active'); btn.classList.add('active'); 
  if(id === 'dashboard') loadDashboardData();
  updatePresenceTab(); 
}

function updatePresenceTab() {
  if(window._sessionPresenceRef && activeOperator) {
    window._sessionPresenceRef.update({ tab: activeTabId, ts: firebase.database.ServerValue.TIMESTAMP });
  }
}

function checkProfileSelection() {
  if(document.body.classList.contains('auth-mode')) return;
  showProfileSelector();
}

function showProfileSelector() {
  document.getElementById('profileModal').style.display = 'flex';
  const list = document.getElementById('profile-list');
  list.innerHTML = '';
  OPERADORES.forEach(op => {
    list.innerHTML += `<button style="width:120px; height:120px; border-radius:16px; background:var(--s1); border:2px solid var(--border); color:var(--text); font-size:14px; font-weight:600; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; transition:0.2s;" onclick="selectProfile('${op.id}')"><div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg, #3b82f6, #8b5cf6); display:flex; align-items:center; justify-content:center; font-size:20px; color:#fff;">${op.nome.charAt(0).toUpperCase()}</div><span style="max-width:100px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${op.nome}</span></button>`;
  });
}

function selectProfile(id) {
  const op = OPERADORES.find(x => x.id === id);
  if(!op) return;
  if(op.pin && op.pin.length === 64) {
    pendingProfile = op;
    document.getElementById('profileModal').style.display = 'none';
    document.getElementById('pinModal').classList.add('active');
    document.querySelectorAll('.pin-digit').forEach(i => i.value = '');
    setTimeout(() => document.getElementById('pin1').focus(), 100);
  } else {
    setActiveOperator(op);
  }
}

function setActiveOperator(op) {
  activeOperator = op;
  document.getElementById('profileModal').style.display = 'none';
  const display = document.getElementById('active-operator-display');
  if(display) display.textContent = `Operador: ${op.nome}`;
  const avatar = document.getElementById('profile-avatar');
  if(avatar) avatar.textContent = op.nome.charAt(0).toUpperCase();
  carregarDados();
}

function init() {
  initTheme(); initChart(); 
  const today = new Date().toLocaleDateString('en-CA'); 
  document.getElementById('mainDate').value = today;
  applyMathInputs(); 
  if(window.lucide) lucide.createIcons();
}
document.addEventListener('DOMContentLoaded', init);
