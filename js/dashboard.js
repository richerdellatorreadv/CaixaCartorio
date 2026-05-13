// ═══ INITIALIZATION & UI GENERATION ═══
function loadConfigAndBuildUI() {
  const savedConfig = localStorage.getItem('caixa_config_v1');
  if (savedConfig) { try { CAIXAS = JSON.parse(savedConfig); } catch(e) { CAIXAS = [...DEFAULT_CAIXAS]; } } else { CAIXAS = [...DEFAULT_CAIXAS]; }
  
  const savedOps = localStorage.getItem('operadores_config_v1');
  if (savedOps) { try { OPERADORES = JSON.parse(savedOps); } catch(e) { OPERADORES = [...DEFAULT_OPERADORES]; } } else { OPERADORES = [...DEFAULT_OPERADORES]; }

  const savedLabels = localStorage.getItem('labels_config_v1');
  if (savedLabels) { try { LABELS = JSON.parse(savedLabels); } catch(e) { LABELS = {...DEFAULT_LABELS}; } } else { LABELS = {...DEFAULT_LABELS}; }

  // Fallback for Departamentos & Sistemas if completely missing
  const savedDeps = localStorage.getItem('departamentos_config_v1');
  const savedSys = localStorage.getItem('sistemas_config_v1');
  
  if (savedDeps) { try { DEPARTAMENTOS = JSON.parse(savedDeps); } catch(e) { DEPARTAMENTOS = []; } }
  if (savedSys) { try { SISTEMAS = JSON.parse(savedSys); } catch(e) { SISTEMAS = []; } }

  if (!savedDeps || DEPARTAMENTOS.length === 0) {
    if (DEPARTAMENTOS.length === 0) {
      DEPARTAMENTOS.push({ id: 'geral', nome: 'Departamento Geral', cor: 'ri-color' });
    }
  }

  setEl('lbl-infinity-geral', `Total do Relatório da ${LABELS.maquininha}`);

  // Generate Departamentos UI
  const depContainer = document.getElementById('geral-departamentos-container');
  if(depContainer) {
    depContainer.innerHTML = DEPARTAMENTOS.map(d => `<div class="stat"><div class="stat-lbl">${d.nome}</div><div class="stat-val ${d.cor}" id="g-dep-${d.id}-total">R$ 0,00</div><div class="stat-sub">Soma de caixas vinculados</div></div>`).join('');
  }

  // Generate Sistemas UI
  const sysContainer = document.getElementById('geral-sistemas-container');
  if(sysContainer) {
    sysContainer.innerHTML = SISTEMAS.map(s => {
      let depNames = s.departamentos.map(did => { const d = DEPARTAMENTOS.find(x => x.id === did); return d ? d.nome : did; }).join(', ');
      return `<div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar yellow"></div>Conferência com ${s.nome}</div></div><div class="field"><div class="field-label">Valor gerado pelo relatório de fechamento do sistema <span class="field-hint">Compara com o total dos caixas de: ${depNames || 'Nenhum'}</span></div><input type="text" autocomplete="off" class="field-input math-input" id="sys-input-${s.id}" placeholder="0,00"></div><div id="g-diff-block-${s.id}" class="diff-block"><div><div class="diff-info-label" id="g-diff-label-${s.id}">Aguardando lançamento</div><div class="diff-info-sub">Comparativo: Caixas × Sistema</div></div><div class="diff-val dim" id="g-diff-val-${s.id}">—</div></div></div>`;
    }).join('');
  }

  let tabsHtml = `<button class="tab-btn active" onclick="switchTab('geral',this)">Fechamento Geral<span class="tab-badge" id="tb-geral">R$ 0</span></button>`;
  CAIXAS.forEach(cfg => { const clr = getColorClass(cfg.tipo); tabsHtml += `<button class="tab-btn" draggable="true" data-caixa-id="${cfg.id}" onclick="switchTab('${cfg.id}',this)"><span class="${clr}">${cfg.nome}</span><span class="tab-badge" id="tb-${cfg.id}">R$ 0</span></button>`; });
  tabsHtml += `<button class="tab-btn" onclick="switchTab('dashboard',this)"><i data-lucide="bar-chart-3" style="width:14px; margin-right:4px;"></i> Histórico</button>`;
  document.getElementById('tab-nav-container').innerHTML = tabsHtml;
  initDragDropTabs();

  let tableHtml = '';
  CAIXAS.forEach(cfg => { const clr = getColorClass(cfg.tipo); tableHtml += `<tr><td class="${clr}">${cfg.nome}</td><td id="g-${cfg.id}-din">—</td><td id="g-${cfg.id}-pix">—</td><td id="g-${cfg.id}-cred">—</td><td id="g-${cfg.id}-taxa" style="color:var(--accent-r)">—</td><td id="g-${cfg.id}-deb">—</td><td id="g-${cfg.id}-dep">—</td><td id="g-${cfg.id}-tot" class="v-green">—</td></tr>`; });
  tableHtml += `<tr class="tot-row"><td>TOTAL GERAL</td><td id="g-sum-din">—</td><td id="g-sum-pix">—</td><td id="g-sum-cred">—</td><td id="g-sum-taxa" style="color:var(--accent-r)">—</td><td id="g-sum-deb">—</td><td id="g-sum-dep">—</td><td id="g-sum-tot" class="v-green">—</td></tr>`;
  document.getElementById('resumo-tbody').innerHTML = tableHtml;

  const container = document.getElementById('pages-container');
  CAIXAS.forEach(cfg => {
    const div = document.createElement('div'); div.id = `page-${cfg.id}`; div.className = 'page';
    div.innerHTML = `<div class="content"><div id="caixa-${cfg.id}">${renderCaixaHTML(cfg)}</div></div>`;
    container.appendChild(div);
  });
}


function renderFieldWithDetails(c, id, label, hint) {
  return `<div class="field"><div class="field-label" style="display:flex; justify-content:space-between; align-items:center;"><div>${label} <span class="field-hint">${hint}</span></div><button class="btn-toggle-detalhes" onclick="toggleDetalhes('${c}', '${id}')" id="btn-det-${c}-${id}" title="Lançamentos individuais"><i data-lucide="list-plus" style="width:14px; height:14px;"></i></button></div><input type="text" autocomplete="off" class="field-input math-input" id="${c}-${id}" placeholder="0,00"><div class="detalhes-wrap" id="${c}-${id}-det-wrap"><div id="${c}-${id}-det-list"></div><button class="btn btn-ghost btn-detalhe-add" onclick="addDetalhe('${c}', '${id}')"><i data-lucide="plus" style="width:12px; height:12px;"></i> Adicionar Recibo</button></div></div>`;
}

function renderCaixaHTML(cfg) {
  const c = cfg.id; const cColor = getColorClass(cfg.tipo);
  const anotacoesHTML = `<div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar"></div>Anotações</div><button class="btn btn-ghost" style="padding:4px 10px;font-size:11px;" onclick="addAnotacao('${c}')"><i data-lucide="plus" style="width:12px;"></i> Adicionar</button></div><div id="${c}-anots-wrap"></div></div>`;

  if (cfg.nome.toUpperCase().includes('ONR') || cfg.tipo === 'dep_onr') {
    return `<div class="page-header"><div class="title-wrap"><div><div class="page-title ${cColor}">${cfg.nome}</div><div class="page-sub">ONR / Repasse Eletrônico ao Cartório Nacional</div></div><button class="btn btn-ghost" onclick="limparCaixa('${c}')" title="Limpar caixa"><i data-lucide="eraser"></i></button></div><div class="total-display"><div class="total-display-label">Total Líquido do Caixa</div><div class="total-display-val" id="${c}-total-badge">R$ 0,00</div></div></div><div class="g2"><div><div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar green"></div>Repasse Recebido (Depósito)</div></div>${renderFieldWithDetails(c, 'deposito', 'Depósito em Conta', 'Comprovante de repasse depositado na conta')}</div>${anotacoesHTML}</div><div><div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar yellow"></div>Conferência do Repasse ONR</div></div><div class="field"><div class="field-label">Valor total do relatório ONR <span class="field-hint">Compara com o valor efetivamente depositado</span></div><input type="text" autocomplete="off" class="field-input math-input" id="${c}-imob" placeholder="0,00"></div><div id="${c}-diff-block" class="diff-block"><div><div class="diff-info-label" id="${c}-diff-label">Aguardando lançamento</div><div class="diff-info-sub" style="font-size:10px;color:var(--text3);">Comparativo: Depósito × Relatório</div></div><div class="diff-val dim" id="${c}-diff-val">—</div></div></div></div></div>`;
  }
  
  const notasHTML = NOTAS.map(n => `<div class="nota-row"><span class="nota-lbl">${n.lbl}</span><input type="number" autocomplete="off" class="nota-qty" id="${c}-nota-${n.val}" placeholder="0" oninput="calcularCaixa('${c}')"><span class="nota-sub" id="${c}-nota-${n.val}-val">R$ 0,00</span></div>`).join('');
  
  const depObj = DEPARTAMENTOS.find(d => d.id === cfg.tipo);
  const subTitle = depObj ? depObj.nome : 'Departamento Geral';

  return `<div class="page-header"><div class="title-wrap"><div><div class="page-title ${cColor}">${cfg.nome}</div><div class="page-sub">${subTitle}</div></div><button class="btn btn-ghost" onclick="limparCaixa('${c}')" title="Limpar caixa"><i data-lucide="eraser"></i></button></div><div class="total-display"><div class="total-display-label">Total Líquido do Caixa</div><div class="total-display-val" id="${c}-total-badge">R$ 0,00</div></div></div><div class="g2"><div><div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar green"></div>Numerário Físico (Cédulas e Moedas)</div></div><div class="field"><div class="field-label">Fundo de Caixa Inicial <span class="field-hint">Troco recebido na abertura — deduzido do total</span></div><input type="text" autocomplete="off" class="field-input math-input neg" id="${c}-abertura" placeholder="0,00" title="Valor do troco/fundo que entrou no início do dia (não é receita)"></div><hr class="div"><div class="notas-wrap">${notasHTML}</div><hr class="div"><div class="field-label" style="margin-bottom:6px;">Moedas e Frações</div><div class="moeda-row"><span class="nota-lbl">Total em Moedas</span><input type="text" autocomplete="off" class="moeda-input math-input" id="${c}-moeda" placeholder="0,00"><button class="btn btn-ghost" style="padding:4px 8px;" onclick="openMoedaModal('${c}')"><i data-lucide="calculator"></i></button></div><div class="sub-row"><span class="sub-row-lbl">Subtotal Numerário Físico</span><span class="sub-row-val" id="${c}-sub-din">R$ 0,00</span></div></div>
  <div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar purple"></div>Saídas de Caixa (Patrimônio — Apenas Informativo)</div><span class="info-tag">Não deduz do total</span></div>
  <p style="font-size:11px;color:var(--text3);margin-bottom:12px;line-height:1.5;">Valores retirados em dinheiro que compõem o patrimônio do cartório. Não são abatidos do total do sistema — servem apenas como registro de controle interno.</p>
  <div class="field"><div class="field-label">Consolidação Patrimonial (Saída ${LABELS.saida_patrimonial}) <span class="field-hint">Lucro retirado para o patrimônio</span></div><input type="text" autocomplete="off" class="field-input math-input" id="${c}-bernadete" placeholder="0,00"></div>
  <div class="field"><div class="field-label">Adiantamento / Vale a Funcionário <span class="field-hint">Retirada para acerto posterior</span></div><input type="text" autocomplete="off" class="field-input math-input" id="${c}-vale" placeholder="0,00"></div>
  <div class="field"><div class="field-label">Saldo Remanescente p/ Abertura do Dia Seguinte <span class="field-hint">Permanece no caixa físico como fundo inicial de amanhã</span></div>
    <input type="text" autocomplete="off" class="field-input math-input" id="${c}-saldo-remanescente" placeholder="0,00" oninput="calcularCaixa('${c}')">
    <div style="display:flex;gap:8px;margin-top:8px;">
      <button class="btn btn-ghost" style="font-size:11px;padding:5px 12px;flex:1;" onclick="aplicarSaldoProximoDia('${c}')" title="Salva este valor como Fundo de Caixa Inicial do dia seguinte">
        <i data-lucide="arrow-right-circle" style="width:13px;"></i> Transferir para amanhã
      </button>
    </div>
    <div id="${c}-saldo-status" style="margin-top:6px;font-size:11px;color:var(--text3);"></div>
  </div>
  </div></div><div><div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar" style="background:var(--accent);"></div>Recebimentos Eletrônicos (Maquininha)</div></div>${renderFieldWithDetails(c, 'pix', 'PIX', 'Recebimentos via PIX na maquininha')}${renderFieldWithDetails(c, 'debito', 'Cartão de Débito', '')}${renderFieldWithDetails(c, 'credito', 'Cartão de Crédito', 'Valor bruto processado na máquina')}<div class="sub-row" style="background:rgba(59,130,246,0.05); border-color:rgba(59,130,246,0.2);"><span class="sub-row-lbl">Total Eletrônico (Bruto)</span><span class="sub-row-val text-blue" id="${c}-maq-bruta">R$ 0,00</span></div><hr class="div"><div class="field"><div class="field-label">Taxa Administrativa Bancária <span class="field-hint">Desconto cobrado pela operadora de cartão</span></div><input type="text" autocomplete="off" class="field-input math-input neg" id="${c}-taxa" placeholder="0,00"></div><div class="sub-row"><span class="sub-row-lbl">Saldo Líquido Eletrônico (após taxas)</span><span class="sub-row-val" id="${c}-maq-liq">R$ 0,00</span></div></div><div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar green"></div>Depósitos Bancários</div></div>${renderFieldWithDetails(c, 'deposito', 'Depósito em Conta', 'Comprovante de depósito bancário')}</div><div class="card"><div class="card-head"><div class="card-title"><div class="card-title-bar yellow"></div>Conferência de Relatório do Caixa</div></div><div class="field"><div class="field-label">Valor gerado no relatório deste caixa <span class="field-hint">Para fechamento individual deste guichê</span></div><input type="text" autocomplete="off" class="field-input math-input" id="${c}-imob" placeholder="0,00"></div><div id="${c}-diff-block" class="diff-block"><div><div class="diff-info-label" id="${c}-diff-label">Aguardando lançamento</div><div class="diff-info-sub" style="font-size:10px;color:var(--text3);">Comparativo: Total do caixa × Total do sistema</div></div><div class="diff-val dim" id="${c}-diff-val">—</div></div></div>${anotacoesHTML}</div></div>`;
}

// ═══ THEME & CHARTS ═══
function toggleTheme() {
  const isLight = document.body.getAttribute('data-theme') === 'light';
  document.body.setAttribute('data-theme', isLight ? 'dark' : 'light');
  document.getElementById('theme-icon').setAttribute('data-lucide', isLight ? 'sun' : 'moon'); lucide.createIcons();
  localStorage.setItem('caixa_theme', isLight ? 'dark' : 'light'); if(myChart) updateChartColors(); if(historyChart) updateHistoryChartColors();
}
function initTheme() { if (localStorage.getItem('caixa_theme') === 'light') { document.body.setAttribute('data-theme', 'light'); } }

function initChart() {
  const ctx = document.getElementById('paymentChart').getContext('2d');
  myChart = new Chart(ctx, { type: 'doughnut', data: { labels: ['Dinheiro Fís.', 'Maquininha Líq.', 'Depósito'], datasets: [{ data: [0,0,0], backgroundColor: ['#3b82f6', '#22c55e', '#eab308'], borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text2'), font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } } } }, cutout: '70%' } });
}
function updateChartColors() { const tc = getComputedStyle(document.body).getPropertyValue('--text2'); if(myChart) { myChart.options.plugins.legend.labels.color = tc; myChart.update(); } }
function updateHistoryChartColors() {
  if(!historyChart) return;
  const tc = getComputedStyle(document.body).getPropertyValue('--text2'); const gc = getComputedStyle(document.body).getPropertyValue('--border');
  historyChart.options.scales.x.ticks.color = tc; historyChart.options.scales.y.ticks.color = tc; historyChart.options.scales.y.grid.color = gc; historyChart.update();
}


function switchTab(id, btn) {

  activeTabId = id;
  document.querySelectorAll('.page, .tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`page-${id}`).classList.add('active'); btn.classList.add('active'); updateFloatingActive();
  if(id === 'dashboard') loadDashboardData();
  
  // NOVO: Avisa o Firebase que eu mudei de aba
  updatePresenceTab(); 
}

// NOVO: Função que envia a aba atual para a nuvem
function updatePresenceTab() {
  if(window._sessionPresenceRef && activeOperator) {
    window._sessionPresenceRef.update({ 
      tab: activeTabId, 
      ts: firebase.database.ServerValue.TIMESTAMP 
    });
  }
}
function updateFloatingActive() {
  if(activeTabId === 'geral' || activeTabId === 'dashboard') { setEl('fb-active-name', activeTabId === 'geral' ? 'Geral' : 'Dashboard'); setEl('fb-active-val', document.getElementById('g-sum-tot').textContent); return; }
  const cfg = CAIXAS.find(x => x.id === activeTabId); setEl('fb-active-name', cfg ? cfg.nome.split('—')[0] : 'Caixa'); setEl('fb-active-val', document.getElementById(`tb-${activeTabId}`).textContent);
}

// ═══ DASHBOARD MENSAL ═══
function initDashboardMonth() { 
  const d = new Date(); 
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  document.getElementById('dashboard-start').value = start.toISOString().split('T')[0]; 
  document.getElementById('dashboard-end').value = d.toISOString().split('T')[0];
}
async function loadDashboardData() {
  const dStartInput = document.getElementById('dashboard-start');
  let dStart = dStartInput.value; 
  const dEnd = document.getElementById('dashboard-end').value; 
  if(!dStart || !dEnd) return;

  if (currentPlano === 'basico') {
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() - 3);
    const startObj = new Date(dStart + 'T00:00:00');
    if (startObj < minDate) {
      showToast("⚠️ O Plano Básico permite buscar até os últimos 3 meses.", 5000, true);
      dStart = minDate.toISOString().split('T')[0];
      dStartInput.value = dStart;
    }
  }

  setEl('dash-tot-geral', 'Buscando...');
  
  let monthlyTotals = { geral: 0, fisico: 0, eletronico: 0 }; let dailyData = [];
  
  try {
    if(!currentCartorioId) return;
    const snapshot = await db.ref('cartorios/' + currentCartorioId + '/caixas')
      .orderByKey()
      .startAt(dStart)
      .endAt(dEnd + '\uf8ff')
      .once('value');
      
    snapshot.forEach(child => {
      const dateStr = child.key;
      const rawData = child.val();
      let dayDin = 0, dayPix = 0, dayCredB = 0, dayTaxa = 0, dayDeb = 0, dayTot = 0;
      Object.keys(rawData).forEach(cxKey => {
        if(cxKey === 'ansata' || cxKey === 'imob' || cxKey === 'maquininha') return;
        const cx = rawData[cxKey]; let notas = 0; NOTAS.forEach(n => notas += (parseInt(cx[`n${n.val}`])||0)*n.val);
        const moeda = parseFloat((cx.moeda||'').replace(/\./g,'').replace(',','.'))||0;
        const pix = parseFloat((cx.pix||'').replace(/\./g,'').replace(',','.'))||0;
        const credB = parseFloat((cx.credito||'').replace(/\./g,'').replace(',','.'))||0;
        const taxa = parseFloat((cx.taxa||'').replace(/\./g,'').replace(',','.'))||0;
        const deb = parseFloat((cx.debito||'').replace(/\./g,'').replace(',','.'))||0;
        const dep = parseFloat((cx.deposito||'').replace(/\./g,'').replace(',','.'))||0;
        const ab = parseFloat((cx.abertura||'').replace(/\./g,'').replace(',','.'))||0;
        const cTot = (notas+moeda) + pix + (credB-taxa) + deb + dep - ab;
        dayDin += (notas+moeda); dayPix += pix; dayCredB += credB; dayTaxa += taxa; dayDeb += deb; dayTot += cTot;
      });
      dailyData.push({ date: dateStr, day: dateStr.split('-')[2], din: dayDin, pix: dayPix, cred: dayCredB, tax: dayTaxa, deb: dayDeb, tot: dayTot });
      monthlyTotals.geral += dayTot; monthlyTotals.fisico += dayDin; monthlyTotals.eletronico += (dayPix + dayCredB - dayTaxa + dayDeb);
    });
  } catch(e) { console.error('Erro ao buscar dashboard:', e); }

  dailyData.sort((a,b) => a.date.localeCompare(b.date));
  setEl('dash-tot-geral', fmt(monthlyTotals.geral)); setEl('dash-tot-fisico', fmt(monthlyTotals.fisico)); setEl('dash-tot-eletronico', fmt(monthlyTotals.eletronico));
  // Heatmap
  const hmContainer = document.getElementById('dash-heatmap'); 
  const histContainer = document.getElementById('historyChart')?.parentElement;
  
  if (currentPlano === 'basico') {
      const upsellHtml = `<div class="upsell-block" style="padding:40px 20px; text-align:center; background:rgba(59,130,246,0.05); border:1px dashed var(--border); border-radius:var(--r);"><i data-lucide="lock" style="width:32px;height:32px;color:var(--text3);margin-bottom:10px;"></i><div style="font-size:14px;font-weight:700;color:var(--text);">Recurso do Plano Profissional</div><div style="font-size:12px;color:var(--text3);margin:8px 0 16px;">Tenha acesso a gráficos avançados, heatmaps de faturamento e exportação em CSV e PDF.</div><a href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20fazer%20o%20upgrade%20para%20o%20Plano%20Profissional!" target="_blank" style="display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:#fff;padding:8px 16px;border-radius:4px;text-decoration:none;font-weight:600;font-size:12px;"><i data-lucide="zap" style="width:14px;height:14px;"></i> Fazer Upgrade</a></div>`;
      if(hmContainer) hmContainer.innerHTML = upsellHtml;
      
      if(histContainer) {
          histContainer.innerHTML = upsellHtml;
          historyChart = null;
      }
      lucide.createIcons();
  } else {
      if(hmContainer) {
          hmContainer.innerHTML = '';
          renderHeatmap(dailyData, hmContainer);
      }
      if(histContainer) {
          if(!document.getElementById('historyChart')) {
              histContainer.innerHTML = '<canvas id="historyChart" style="display: block; box-sizing: border-box; height: 300px; width: 1050px;"></canvas>';
          }
          renderHistoryChart(dailyData);
      }
  }
  // Table with weekly comparison
  let tbody = '';
  dailyData.forEach((d, idx) => {
    // Find same weekday previous entry (7 days back)
    const prev = dailyData.find(x => {
      const curDate = new Date(d.date + 'T12:00:00'); const prevDate = new Date(x.date + 'T12:00:00');
      return Math.abs(curDate - prevDate) >= 5*24*3600*1000 && Math.abs(curDate - prevDate) <= 9*24*3600*1000 && prevDate < curDate;
    });
    let trendHtml = '<span class="trend-flat">—</span>';
    if(prev) { const diff = d.tot - prev.tot; trendHtml = diff > 50 ? `<span class="trend-up">↑ ${fmtShort(diff)}</span>` : diff < -50 ? `<span class="trend-down">↓ ${fmtShort(Math.abs(diff))}</span>` : '<span class="trend-flat">≈</span>'; }
    tbody += `<tr><td>${d.date.split('-').reverse().join('/')}</td><td>${fmt(d.din)}</td><td>${fmt(d.pix)}</td><td>${fmt(d.cred)}</td><td style="color:var(--accent-r)">${fmt(d.tax)}</td><td>${fmt(d.deb)}</td><td class="v-green">${fmt(d.tot)}</td><td>${trendHtml}</td></tr>`;
  });
  if(dailyData.length === 0) tbody = `<tr><td colspan="8" style="text-align:center;">Nenhum dado salvo para este período no servidor.</td></tr>`;
  document.getElementById('dash-table-body').innerHTML = tbody; renderHistoryChart(dailyData);
  window.currentDashboardData = dailyData;
}

function exportDashboardCSV() {
  if (currentPlano === 'basico') {
    showToast('⚠️ Exportação em CSV/Excel disponível apenas no Plano Profissional.', 5000, true);
    return;
  }
  if (!window.currentDashboardData || window.currentDashboardData.length === 0) {
    showToast('Sem dados para exportar neste período', 3000, true);
    return;
  }
  
  let csv = "Data;Dinheiro Físico;PIX;Cartão de Crédito;Taxas;Cartão de Débito;Total Líquido\n";
  window.currentDashboardData.forEach(d => {
    const f = v => v.toFixed(2).replace('.', ',');
    csv += `${d.date.split('-').reverse().join('/')};${f(d.din)};${f(d.pix)};${f(d.cred)};${f(d.tax)};${f(d.deb)};${f(d.tot)}\n`;
  });
  
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Relatorio_Cartorio_${document.getElementById('dashboard-start').value}_a_${document.getElementById('dashboard-end').value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderHistoryChart(dailyData) {
  const ctx = document.getElementById('historyChart').getContext('2d');
  const labels = dailyData.map(d => d.date.split('-').reverse().join('/')); const totals = dailyData.map(d => d.tot);
  const tc = getComputedStyle(document.body).getPropertyValue('--text2'); const gc = getComputedStyle(document.body).getPropertyValue('--border');
  if(historyChart) historyChart.destroy();
  historyChart = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Faturamento Líquido (R$)', data: totals, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 3, pointBackgroundColor: '#3b82f6', pointBorderColor: '#fff', pointRadius: 5, fill: true, tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: gc }, ticks: { color: tc } }, x: { grid: { display: false }, ticks: { color: tc } } } } });
}

// ═══ STATE LISTENER ═══
auth.onAuthStateChanged(async (user) => {
  if(window.isRegistering) return;
  dismissSplash();
  if (user) {
    document.getElementById('auth-container').style.display = 'none';
    document.body.classList.remove('auth-mode');
    
    const snap = await db.ref('users/' + user.uid).once('value');
    if (snap.exists()) {
      currentCartorioId = snap.val().cartorioId;
      
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
      
      // Live listener for cartório info changes (syncs across all browsers)
      db.ref('cartorios/' + currentCartorioId + '/info').on('value', (infoSnap) => {
        if(infoSnap.exists()) {
          const inf = infoSnap.val();
          cartorioGlobalName = inf.nome || 'Cartório';
          _setPlanoSeguro(inf.plano || 'profissional');
          updateCartorioNameUI();
          enforcePlanLimits();
        }
      });

      db.ref('cartorios/' + currentCartorioId + '/config/caixas').on('value', (cfgSnap) => {
        if (cfgSnap.exists()) {
          const remoteConfig = cfgSnap.val();
          const localStr = JSON.stringify(remoteConfig);
          if (localStr !== localStorage.getItem('caixa_config_v1')) {
            localStorage.setItem('caixa_config_v1', localStr);
            CAIXAS = remoteConfig;
            
            let needsFullReload = false;
            CAIXAS.forEach(cfg => { if(!document.getElementById(`page-${cfg.id}`)) needsFullReload = true; });
            document.querySelectorAll('.page').forEach(p => {
              const pid = p.id;
              if (pid !== 'page-geral' && pid !== 'page-dashboard') {
                 const cid = pid.replace('page-', '');
                 if(!CAIXAS.find(c => c.id === cid)) needsFullReload = true;
              }
            });

            if (needsFullReload) {
              if (window._dataSessionActive) {
                salvarDados(false).then(() => {
                  softReloadUI();
                });
              } else if (!document.body.classList.contains('auth-mode')) {
                softReloadUI();
              }
            } else {
              let tabsHtml = `<button class="tab-btn ${activeTabId==='geral'?'active':''}" onclick="switchTab('geral',this)">Fechamento Geral<span class="tab-badge" id="tb-geral">R$ 0</span></button>`;
              CAIXAS.forEach(cfg => { const clr = getColorClass(cfg.tipo); tabsHtml += `<button class="tab-btn ${activeTabId===cfg.id?'active':''}" draggable="true" data-caixa-id="${cfg.id}" onclick="switchTab('${cfg.id}',this)"><span class="${clr}">${cfg.nome}</span><span class="tab-badge" id="tb-${cfg.id}">R$ 0</span></button>`; });
              tabsHtml += `<button class="tab-btn ${activeTabId==='dashboard'?'active':''}" onclick="switchTab('dashboard',this)"><i data-lucide="bar-chart-3" style="width:14px; margin-right:4px;"></i> Histórico</button>`;
              document.getElementById('tab-nav-container').innerHTML = tabsHtml;
              initDragDropTabs();
              lucide.createIcons();

              CAIXAS.forEach(cfg => {
                const page = document.getElementById(`page-${cfg.id}`);
                if(page) {
                  const titleEl = page.querySelector('.page-title');
                  if(titleEl) { titleEl.textContent = cfg.nome; titleEl.className = `page-title ${getColorClass(cfg.tipo)}`; }
                }
              });

              let tableHtml = '';
              CAIXAS.forEach(cfg => { const clr = getColorClass(cfg.tipo); tableHtml += `<tr><td class="${clr}">${cfg.nome}</td><td id="g-${cfg.id}-din">—</td><td id="g-${cfg.id}-pix">—</td><td id="g-${cfg.id}-cred">—</td><td id="g-${cfg.id}-taxa" style="color:var(--accent-r)">—</td><td id="g-${cfg.id}-deb">—</td><td id="g-${cfg.id}-dep">—</td><td id="g-${cfg.id}-tot" class="v-green">—</td></tr>`; });
              tableHtml += `<tr class="tot-row"><td>TOTAL GERAL</td><td id="g-sum-din">—</td><td id="g-sum-pix">—</td><td id="g-sum-cred">—</td><td id="g-sum-taxa" style="color:var(--accent-r)">—</td><td id="g-sum-deb">—</td><td id="g-sum-dep">—</td><td id="g-sum-tot" class="v-green">—</td></tr>`;
              const tbody = document.getElementById('resumo-tbody');
              if(tbody) { tbody.innerHTML = tableHtml; calcularTudo(); }
            }
          }
        }
      });
      
      // Load operators FIRST (once), then show profile selector with the full list
      db.ref('cartorios/' + currentCartorioId + '/config/operadores').once('value', (opSnap) => {
        if (opSnap.exists()) {
          OPERADORES = opSnap.val();
          localStorage.setItem('operadores_config_v1', JSON.stringify(OPERADORES));
        }
        checkProfileSelection(); // Show operator selector
        // carregarDados() is called by setActiveOperator() after operator is chosen
        // Keep a live listener for future operator changes (new operators added by admin)
        db.ref('cartorios/' + currentCartorioId + '/config/operadores').on('value', (opSnapLive) => {
          if (opSnapLive.exists()) {
            const remote = opSnapLive.val();
            if (JSON.stringify(remote) !== localStorage.getItem('operadores_config_v1')) {
              localStorage.setItem('operadores_config_v1', JSON.stringify(remote));
              OPERADORES = remote;
            }
          }
        });
      });

      db.ref('cartorios/' + currentCartorioId + '/config/labels').on('value', (lblSnap) => {
        if (lblSnap.exists()) {
          const remote = lblSnap.val();
          if (JSON.stringify(remote) !== localStorage.getItem('labels_config_v1')) {
            localStorage.setItem('labels_config_v1', JSON.stringify(remote));
            LABELS = remote;
            // Only update label text, never reload the whole UI
            if(document.getElementById('lbl-infinity-geral')) setEl('lbl-infinity-geral', `Total do Relatório da ${LABELS.maquininha}`);
          }
        }
      });

      db.ref('cartorios/' + currentCartorioId + '/config/departamentos').on('value', (depSnap) => {
        if (depSnap.exists()) {
          const remote = depSnap.val();
          if (JSON.stringify(remote) !== localStorage.getItem('departamentos_config_v1')) {
            localStorage.setItem('departamentos_config_v1', JSON.stringify(remote));
            DEPARTAMENTOS = remote;
          }
        }
      });

      db.ref('cartorios/' + currentCartorioId + '/config/sistemas').on('value', (sysSnap) => {
        if (sysSnap.exists()) {
          const remote = sysSnap.val();
          if (JSON.stringify(remote) !== localStorage.getItem('sistemas_config_v1')) {
            localStorage.setItem('sistemas_config_v1', JSON.stringify(remote));
            SISTEMAS = remote;
          }
        }
      });
      db.ref('cartorios/' + currentCartorioId + '/config/lockPermission').on('value', (lockSnap) => {
        if (lockSnap.exists()) configOperadoresPodemDestravar = lockSnap.val();
      });

      // checkProfileSelection() and carregarDados() are called inside operadores.once() above
    } else {
      alert("Erro: Perfil de usuário não encontrado.");
      auth.signOut();
    }
  } else {
    document.getElementById('auth-container').style.display = 'flex';
    document.body.classList.add('auth-mode');
    currentCartorioId = null;
    const disp = document.getElementById('cartorio-code-display');
    if(disp) disp.style.display = 'none';
  }
});

function checkProfileSelection() {
  if(document.body.classList.contains('auth-mode')) return;
  // Always show operator selector — never auto-login
  showProfileSelector();
}

function showProfileSelector() {
  document.getElementById('profileModal').style.display = 'flex';
  const list = document.getElementById('profile-list');
  list.innerHTML = '';
  OPERADORES.forEach(op => {
    list.innerHTML += `<button style="width:120px; height:120px; border-radius:16px; background:var(--s1); border:2px solid var(--border); color:var(--text); font-size:14px; font-weight:600; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; transition:0.2s;" onclick="selectProfile('${op.id}')" onmouseover="this.style.borderColor='var(--accent)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='var(--border)'; this.style.transform='translateY(0)'"><div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg, #3b82f6, #8b5cf6); display:flex; align-items:center; justify-content:center; font-size:20px; color:#fff; box-shadow: 0 4px 10px rgba(59,130,246,0.3);">${op.nome.charAt(0).toUpperCase()}</div><span style="max-width:100px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${op.nome}</span></button>`;
  });
}

function selectProfile(id) {
  const op = OPERADORES.find(x => x.id === id);
  if(!op) return;
  // O PIN agora é salvo em SHA-256 (64 caracteres)
  if(op.pin && op.pin.length === 64) {
    pendingProfile = op;
    document.getElementById('profileModal').style.display = 'none';
    document.getElementById('pin-profile-name').textContent = `Perfil: ${op.nome}`;
    document.getElementById('pinModal').classList.add('active');
    document.querySelectorAll('.pin-digit').forEach(i => i.value = '');
    setTimeout(() => document.getElementById('pin1').focus(), 100);
  } else {
    setActiveOperator(op);
  }
}

function moveToNextPin(current, nextId, prevId) {
  if(current.value.length >= 1 && nextId) document.getElementById(nextId).focus();
}
function handlePinKey(e, prevId) {
  if(e.key === 'Backspace' && e.target.value === '' && prevId) {
    document.getElementById(prevId).focus();
  }
}
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function validatePin() {
  const pin = ['pin1','pin2','pin3','pin4'].map(id => document.getElementById(id).value).join('');
  if(pin.length === 4) {
    const hashedPin = await sha256(pin);
    // Compara APENAS com hash SHA-256 — nunca com PIN em texto claro
    if(hashedPin === pendingProfile.pin) {
      closePinModal();
      setActiveOperator(pendingProfile);
    } else {
      showToast('PIN incorreto!', 3000, true);
      document.querySelectorAll('.pin-digit').forEach(i => i.value = '');
      document.getElementById('pin1').focus();
    }
  }
}
function closePinModal() {
  document.getElementById('pinModal').classList.remove('active');
  if(!activeOperator) document.getElementById('profileModal').style.display = 'flex';
}

function setActiveOperator(op) {
  activeOperator = op;
  localStorage.setItem('activeOperatorId', op.id);
  document.getElementById('profileModal').style.display = 'none';
  const display = document.getElementById('active-operator-display');
  if(display) display.textContent = `Operador: ${op.nome}`;
  // Update profile menu active operator
  const menuOp = document.getElementById('menu-active-operator');
  if(menuOp) menuOp.textContent = `Operador: ${op.nome}`;
  // Update avatar letter in profile button
  const avatar = document.getElementById('profile-avatar');
  if(avatar) avatar.textContent = op.nome.charAt(0).toUpperCase();
  initPresence(); // Registra presença no Firebase
  carregarDados(); // Load/sync data AFTER operator is selected (NOT before, to avoid overwriting Firebase)
}

function logoffOperator() {
  if (window._sessionPresenceRef) {
    window._sessionPresenceRef.remove();
    window._sessionPresenceRef = null;
  }
  localStorage.removeItem('activeOperatorId');
  activeOperator = null;
  const display = document.getElementById('active-operator-display');
  if(display) display.textContent = '';
  const menuOp = document.getElementById('menu-active-operator');
  if(menuOp) menuOp.textContent = 'Nenhum operador selecionado';
  showProfileSelector();
}

function getDeltaNested(current, previous) {
  if (!previous) return current;
  let delta = {}; let hasChanges = false;
  
  const allK1 = new Set([...Object.keys(current), ...Object.keys(previous)]);
  
  allK1.forEach(k1 => {
    if (k1 === '_modificadoPor' || k1 === '_modificadoAs') return; // Ignorar metadados na comparação
    if (typeof current[k1] === 'object' && current[k1] !== null) {
      const prevObj = (typeof previous[k1] === 'object' && previous[k1] !== null) ? previous[k1] : {};
      const allK2 = new Set([...Object.keys(current[k1]), ...Object.keys(prevObj)]);
      
      allK2.forEach(k2 => {
        if (current[k1][k2] !== prevObj[k2]) {
          delta[`${k1}/${k2}`] = current[k1][k2] === undefined ? null : current[k1][k2];
          hasChanges = true;
        }
      });
    } else {
      if (current[k1] !== previous[k1]) {
        delta[k1] = current[k1] === undefined ? null : current[k1];
        hasChanges = true;
      }
    }
  });
  
  if (hasChanges) {
    delta['_modificadoPor'] = current['_modificadoPor'];
    delta['_modificadoAs'] = current['_modificadoAs'];
    return delta;
  }
  return null;
}

function salvarDadosDebounced() {
  if (isRemoteUpdate) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  setEl('last-saved', '⏳ Aguardando p/ salvar...');
  saveTimeout = setTimeout(() => salvarDados(false), 1500);
}

function getStorageKey() { return `caixa_v3_${document.getElementById('mainDate').value}`; }

function coletarDados() {
  const now = new Date();
  const hhmm = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const obj = { 
    maquininha: document.getElementById('maquininha-input') ? document.getElementById('maquininha-input').value : '',
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
    
    // Coleta as listas de detalhes
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
  CAIXAS.forEach(cfg => { const wrap=document.getElementById(`${cfg.id}-anots-wrap`); if(wrap && !wrap.contains(document.activeElement)) wrap.innerHTML = ''; });
  
  // Limpar as listas de detalhes
  ['pix','debito','credito','deposito'].forEach(f => {
    CAIXAS.forEach(cfg => {
       const list = document.getElementById(`${cfg.id}-${f}-det-list`);
       if(list && !list.contains(document.activeElement)) list.innerHTML = '';
       const mainInput = document.getElementById(`${cfg.id}-${f}`);
       if(mainInput) { mainInput.disabled = false; mainInput.title = ""; }
    });
  });

  if (!obj) { CAIXAS.forEach(cfg => addAnotacao(cfg.id)); CAIXAS.forEach(cfg => calcularCaixa(cfg.id)); return; }
  
  const setIfInactive = (id, val) => { const el = document.getElementById(id); if (el && el !== document.activeElement) el.value = val; };
  if (obj.maquininha) setIfInactive('maquininha-input', obj.maquininha);
  SISTEMAS.forEach(sys => {
    if (obj[`sys_input_${sys.id}`]) setIfInactive(`sys-input-${sys.id}`, obj[`sys_input_${sys.id}`]);
  });
  
  CAIXAS.forEach(cfg => {
    const c = cfg.id;
    if (!obj[c]) { addAnotacao(c); return; }
    NOTAS.forEach(n => setIfInactive(`${c}-nota-${n.val}`, obj[c][`n${n.val}`]||''));
    ['moeda','pix','credito','taxa','debito','deposito','abertura','bernadete','vale','imob','saldo-remanescente'].forEach(f => { setIfInactive(`${c}-${f}`, obj[c][f]||''); });
    
    // Preencher as listas de detalhes
    ['pix','debito','credito','deposito'].forEach(f => {
       const list = document.getElementById(`${c}-${f}-det-list`);
       if(list && !list.contains(document.activeElement) && obj[c][`${f}_det`]) {
         list.innerHTML = '';
         const vals = obj[c][`${f}_det`].split('||');
         vals.forEach(val => {
            const row = document.createElement('div'); row.className = 'detalhe-row';
            row.innerHTML = `<input type="text" class="detalhe-input" placeholder="0,00" oninput="calcDetalhes('${c}','${f}')"><button class="btn-ghost-danger" style="padding:6px; border-radius:4px; cursor:pointer;" onclick="removeDetalhe(this, '${c}', '${f}')" title="Remover"><i data-lucide="x" style="width:14px;height:14px;"></i></button>`;
            row.querySelector('.detalhe-input').value = val;
            list.appendChild(row);
         });
         lucide.createIcons();
         const wrap = document.getElementById(`${c}-${f}-det-wrap`);
         const btn = document.getElementById(`btn-det-${c}-${f}`);
         if(!wrap.classList.contains('active')) { wrap.classList.add('active'); btn.classList.add('active'); }
         
         const mainInput = document.getElementById(`${c}-${f}`);
         if(mainInput) { mainInput.disabled = true; mainInput.title = "O valor está sendo somado automaticamente pela lista de recibos."; }
       }
    });
    if(obj[c]['abertura'] && parseFloat((obj[c]['abertura']||'').replace(/\./g,'').replace(',','.'))||0 > 0) {
      const statusEl = document.getElementById(`${c}-saldo-status`);
      if(statusEl && (!obj[c]['pix'] && !obj[c]['credito'] && !obj[c]['debito']))
        statusEl.innerHTML = `<span style="color:var(--accent-y)">⚡ Fundo Inicial: R$ ${(parseFloat((obj[c]['abertura']||'').replace(/\./g,'').replace(',','.'))||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>`;
    }
    const wrap = document.getElementById(`${c}-anots-wrap`);
    if(wrap && !wrap.contains(document.activeElement)) {
      let temAnotacao = false;
      for(let i=1; i<=8; i++) { if(obj[c][`a${i}`] !== undefined) { addAnotacao(c, obj[c][`a${i}`]); temAnotacao = true; } }
      if(!temAnotacao) addAnotacao(c);
    }
  });
  CAIXAS.forEach(cfg => calcularCaixa(cfg.id));
}

async function carregarDados() {
  if(!currentCartorioId) return;
  const dateStr = document.getElementById('mainDate').value;
  if(!dateStr) return;
  const localKey = `caixa_v3_${dateStr}`;
  // Reset data-load guard so saves are blocked until Firebase responds
  window._firebaseDataLoaded = false;
  setEl('last-saved', '🔄 Conectando...');

  if (unsubscribeSnapshot) {
    db.ref('cartorios/' + currentCartorioId + '/caixas/' + dateStr).off('value', unsubscribeSnapshot);
    unsubscribeSnapshot = null;
  }

  unsubscribeSnapshot = db.ref('cartorios/' + currentCartorioId + '/caixas/' + dateStr).on('value', (snapshot) => {
    window._dataSessionActive = true;
    window._firebaseDataLoaded = true; // Firebase responded — saves are now allowed
    if (snapshot.exists()) {
      const data = snapshot.val();
      localStorage.setItem(localKey, JSON.stringify(data));
      lastKnownState = JSON.parse(JSON.stringify(data));
      isRemoteUpdate = true;
      try { _preencherFormulario(data); } finally { isRemoteUpdate = false; }
      setEl('last-saved', '☁ Sincronizado');
      
      const tip = document.getElementById('last-saved-tooltip');
      if (tip) {
        const modPor = data._modificadoPor || 'desconhecido';
        const modAs = data._modificadoAs || '';
        tip.textContent = modAs ? `Última alteração às ${modAs} por ${modPor}` : `Última alteração por ${modPor}`;
      }
    } else {
      lastKnownState = null; // A nuvem está vazia, o próximo save precisa enviar tudo!
      const saved = localStorage.getItem(localKey);
      isRemoteUpdate = true;
      try {
        if (saved) {
          try { 
            const parsed = JSON.parse(saved);
            _preencherFormulario(parsed); 
          } catch(e) { _preencherFormulario(null); }
          setEl('last-saved', '💾 Dados locais (offline)');
        } else {
          _preencherFormulario(null);
          setEl('last-saved', '');
        }
      } finally {
        isRemoteUpdate = false;
      }
    }
  }, (error) => {
    console.error("Erro no on(value): ", error);
    setEl('last-saved', '⚠ Erro de conexão');
  });
}

async function salvarDados(manual = false) {
  const dateStr = document.getElementById('mainDate').value;
  if (!dateStr) { console.warn('salvarDados bloqueado: data não definida'); return; }
  if (!currentCartorioId) { setEl('last-saved', '⚠ Não logado'); return; }
  if (!activeOperator) { if (manual) showToast('Selecione um operador antes de salvar.', 3000, true); return; }

  // ══════════════════════════════════════════════════════════
  if (lastKnownState && !manual) {
    const verificaTemDados = (obj) => {
      if (!obj) return false;
      return Object.keys(obj).some(k => {
        if (k === '_modificadoPor' || k === '_modificadoAs') return false;
        if (typeof obj[k] === 'object' && obj[k] !== null) {
          return Object.values(obj[k]).some(v => v && v !== '' && v !== '0' && v !== '0,00');
        }
        return obj[k] && obj[k] !== '' && obj[k] !== '0' && obj[k] !== '0,00';
      });
    };

    const colectedHasData = verificaTemDados(dados);
    const firebaseHadData = verificaTemDados(lastKnownState);

    if (firebaseHadData && !colectedHasData) {
      console.warn('salvarDados BLOQUEADO: formulário aparentemente vazio mas Firebase tinha dados. Race condition evitada.');
      return;
    }
  }

  const delta = getDeltaNested(dados, lastKnownState);
  if (!delta && !manual) { setEl('last-saved', '☁ Sincronizado'); return; }

  localStorage.setItem(localKey, JSON.stringify(dados));
  
  const wasNull = !lastKnownState;
  lastKnownState = JSON.parse(JSON.stringify(dados));
  
  const now = new Date();
  const hhmm = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

  setEl('last-saved', '☁ Salvando...');
  try {
    if (wasNull) {
      await db.ref('cartorios/' + currentCartorioId + '/caixas/' + dateStr).set(dados);
    } else if (delta) {
      await db.ref('cartorios/' + currentCartorioId + '/caixas/' + dateStr).update(delta);
    }
    setEl('last-saved', `☁ Salvo às ${hhmm}`);
    const tip = document.getElementById('last-saved-tooltip');
    if(tip) tip.textContent = `Salvo às ${hhmm} por ${activeOperator ? activeOperator.nome : 'desconhecido'}`;
    if (manual) showToast('✓ Salvo no servidor com sucesso!');
  } catch(e) {
    console.error('Erro ao salvar no RTDB:', e);
    lastKnownState = null;
    setEl('last-saved', `💾 Local (erro servidor)`);
    if (manual) showToast('⚠ Salvo localmente. Erro no servidor: ' + e.message, 5000);
  }
}

function mudarData() {
  if (currentPlano === 'basico') {
    const selectedDate = new Date(document.getElementById('mainDate').value + 'T00:00:00');
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() - 3);
    if (selectedDate < minDate) {
      showToast("⚠️ O Plano Básico permite visualizar o histórico de apenas 3 meses.", 5000, true);
      document.getElementById('mainDate').value = minDate.toISOString().split('T')[0];
    }
  }
  window._firebaseDataLoaded = false; // Reset guard when date changes
  carregarDados();
  setEl('last-saved', '');
  if(activeTabId === 'dashboard') loadDashboardData();
}

// ═══ SOFT RELOAD (sem location.reload) ═══
function softReloadUI() {
  CAIXAS = JSON.parse(localStorage.getItem('caixa_config_v1') || JSON.stringify(DEFAULT_CAIXAS));
  OPERADORES = JSON.parse(localStorage.getItem('operadores_config_v1') || JSON.stringify(DEFAULT_OPERADORES));
  LABELS = JSON.parse(localStorage.getItem('labels_config_v1') || JSON.stringify(DEFAULT_LABELS));
  DEPARTAMENTOS = JSON.parse(localStorage.getItem('departamentos_config_v1') || '[]');
  SISTEMAS = JSON.parse(localStorage.getItem('sistemas_config_v1') || '[]');
  const pagesContainer = document.getElementById('pages-container');
  pagesContainer.querySelectorAll('.page:not(#page-geral):not(#page-dashboard)').forEach(p => p.remove());
  document.getElementById('tab-nav-container').innerHTML = '';
  loadConfigAndBuildUI();
  applyMathInputs(); lucide.createIcons();
  carregarDados();
}

// ═══ NEW FEATURES ═══
function gerarResumoNatural() {

  const strip = document.getElementById('summary-strip'); if(!strip) return;
  if(CAIXAS.length === 0) { strip.classList.remove('active'); return; }
  let best = null, bestVal = -Infinity, totalGeral = 0, hasData = false;
  CAIXAS.forEach(cfg => {
    const c = cfg.id; let nts = 0; NOTAS.forEach(n => nts += parseInt(document.getElementById(`${c}-nota-${n.val}`)?.value||0)*n.val);
    const moeda = pv(`${c}-moeda`); const pix = pv(`${c}-pix`); const deb = pv(`${c}-debito`); const cred = pv(`${c}-credito`); const taxa = pv(`${c}-taxa`); const dep = pv(`${c}-deposito`); const aber = pv(`${c}-abertura`);
    const tot = (nts+moeda)+(pix+deb+cred-taxa)+dep-aber;
    if(tot > 0) hasData = true;
    if(tot > bestVal) { bestVal = tot; best = cfg; }
    totalGeral += tot;
  });
  if(!hasData) { strip.classList.remove('active'); return; }
  let msgs = [];
  if(best && CAIXAS.length > 1) msgs.push(`Destaque do dia: <strong>${best.nome}</strong> com <strong>${fmt(bestVal)}</strong>.`);
  const allOk = CAIXAS.every(cfg => { const diff = pv(`${cfg.id}-imob`); return diff > 0 && Math.abs(pv(`${cfg.id}-imob`) - bestVal) < 100; });
  const maqFita = pv('maquininha-input');
  if(maqFita > 0) { const dmaq = Math.abs(totalGeral - maqFita); msgs.push(dmaq < 0.05 ? '✓ Relatório Z <strong>conferido</strong>.' : `⚠ Divergência no Relatório Z: <strong>${fmt(dmaq)}</strong>.`); }
  msgs.push(`Total geral: <strong>${fmt(totalGeral)}</strong>.`);
  // Sanitização: usar textContent para dados do usuário, innerHTML só para marcação segura interna
  // Os msgs contêm <strong> mas os valores internos (nomes de caixas) vêm da config — risco controlado
  // Sanitiza os nomes de caixas antes de inserir
  const sanitizedMsgs = msgs.join(' ').replace(/<strong>/g, '<strong>').replace(/<\/strong>/g, '</strong>');
  strip.innerHTML = sanitizedMsgs;
  strip.classList.add('active');
}

function initDragDropTabs() {
  const tabs = document.querySelectorAll('.tab-btn[draggable="true"]');
  const container = document.getElementById('tab-nav-container');
  let draggedTab = null;

  tabs.forEach(tab => {
    tab.addEventListener('dragstart', function(e) {
      draggedTab = this;
      setTimeout(() => this.style.opacity = '0.5', 0);
    });
    tab.addEventListener('dragend', function() {
      setTimeout(() => {
        this.style.opacity = '1';
        draggedTab = null;
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('tab-drag-over'));
      }, 0);
    });
    tab.addEventListener('dragover', function(e) {
      e.preventDefault();
      if (this !== draggedTab && this.getAttribute('draggable') === 'true') {
        this.classList.add('tab-drag-over');
      }
    });
    tab.addEventListener('dragleave', function() {
      this.classList.remove('tab-drag-over');
    });
    tab.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('tab-drag-over');
      if (this !== draggedTab && draggedTab) {
        const allTabs = Array.from(container.querySelectorAll('.tab-btn[draggable="true"]'));
        const draggedIdx = allTabs.indexOf(draggedTab);
        const dropIdx = allTabs.indexOf(this);
        
        if (draggedIdx < dropIdx) {
          this.parentNode.insertBefore(draggedTab, this.nextSibling);
        } else {
          this.parentNode.insertBefore(draggedTab, this);
        }
        
        const draggedId = draggedTab.getAttribute('data-caixa-id');
        const dropId = this.getAttribute('data-caixa-id');
        
        const oldIndex = CAIXAS.findIndex(c => c.id === draggedId);
        const newIndex = CAIXAS.findIndex(c => c.id === dropId);
        if(oldIndex === -1 || newIndex === -1) return;
        
        const movedItem = CAIXAS.splice(oldIndex, 1)[0];
        CAIXAS.splice(newIndex, 0, movedItem);
        
        if(currentCartorioId) {
          const configRef = db.ref('cartorios/' + currentCartorioId + '/config/caixas');
          configRef.set(CAIXAS).then(() => {
            showToast('Abas reordenadas e salvas!', 2000);
            localStorage.setItem('caixa_config_v1', JSON.stringify(CAIXAS));
          }).catch(err => console.error(err));
        }
      }
    });
  });
}

function toggleFocusMode(caixaId) {
  if(document.body.classList.contains('focus-mode')) { document.body.classList.remove('focus-mode'); lucide.createIcons(); return; }
  document.body.classList.add('focus-mode');
  if(caixaId) { document.querySelectorAll('.page,.tab-btn').forEach(e=>e.classList.remove('active')); document.getElementById(`page-${caixaId}`)?.classList.add('active'); }
  lucide.createIcons();
}

function toggleShortcutHint() { document.getElementById('shortcut-hint')?.classList.toggle('active'); }

function initKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    if(document.body.classList.contains('auth-mode')) return;
    if(e.altKey && e.key === 's') { e.preventDefault(); salvarDados(true); }
    if(e.altKey && e.key === 'f') { e.preventDefault(); toggleFocusMode(activeTabId !== 'geral' && activeTabId !== 'dashboard' ? activeTabId : null); }
    if(e.key === 'Escape') { document.querySelectorAll('.modal-overlay.active').forEach(m=>m.classList.remove('active')); document.getElementById('shortcut-hint')?.classList.remove('active'); }
    if(e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      if(document.body.classList.contains('focus-mode')) return;
      const tabs = Array.from(document.querySelectorAll('.tab-btn'));
      const cur = tabs.findIndex(t=>t.classList.contains('active'));
      const next = e.key === 'ArrowRight' ? Math.min(cur+1, tabs.length-1) : Math.max(cur-1,0);
      if(tabs[next]) tabs[next].click();
    }
  });
}

let _inactivityTimer = null;
function initInactivityWatcher() {
  const TIMEOUT = 10 * 60 * 1000;
  function reset() { clearTimeout(_inactivityTimer); if(!document.body.classList.contains('auth-mode')) _inactivityTimer = setTimeout(showInactivity, TIMEOUT); }
  ['input','click','keydown','mousemove'].forEach(ev => document.addEventListener(ev, reset, {passive:true}));
  reset();
}
function showInactivity() { const o = document.getElementById('inactivity-overlay'); if(o) { o.classList.add('active'); lucide.createIcons(); } }
function dismissInactivity() { const o = document.getElementById('inactivity-overlay'); if(o) o.classList.remove('active'); initInactivityWatcher(); }

function initPresence() {
  if(!currentCartorioId || !activeOperator) return;
  // Use a unique session key per tab so multiple browsers don't conflict
  if(!window._sessionId) window._sessionId = `${activeOperator.id}_${Date.now()}`;
  
  // Remove previous session if operator changed
  if(window._sessionPresenceRef) window._sessionPresenceRef.remove();
  
  const ref = db.ref(`cartorios/${currentCartorioId}/presence/${window._sessionId}`);
  window._sessionPresenceRef = ref;
  
  // Salva o nome e a aba inicial
  ref.set({ nome: activeOperator.nome, ts: firebase.database.ServerValue.TIMESTAMP, tab: activeTabId });
  ref.onDisconnect().remove();
  
  db.ref(`cartorios/${currentCartorioId}/presence`).on('value', snap => {
    const list = document.getElementById('presence-list'); if(!list) return;
    list.innerHTML = '';
    
    // Limpa as carinhas antigas das abas
    document.querySelectorAll('.tab-presence').forEach(el => el.remove());
    
    const tabOperators = {}; // Para agrupar quem está em cada aba

    if(snap.exists()) snap.forEach(child => {
      const d = child.val(); if(!d || !d.nome) return;
      // Ignora sessões inativas há mais de 10 minutos
      const age = Date.now() - (d.ts || 0);
      if(age > 10 * 60 * 1000) return;
      
      const isMe = child.key === window._sessionId;

      // Descobre o nome legível da aba que a pessoa está
      let locName = "Carregando...";
      if (d.tab === 'geral') locName = "Fechamento Geral";
      else if (d.tab === 'dashboard') locName = "Histórico";
      else { const cx = CAIXAS.find(c => c.id === d.tab); if (cx) locName = cx.nome; }

      // 1. Cria o avatar no TOPO da tela (Topbar)
      const av = document.createElement('div'); 
      av.className = 'presence-avatar'; 
      av.title = `${d.nome} (em ${locName})`; // Tooltip mostra onde ele está
      av.textContent = d.nome.charAt(0).toUpperCase();
      const dot = document.createElement('div'); dot.className = 'presence-dot';
      av.appendChild(dot); list.appendChild(av);

      // 2. Agrupa a pessoa para colocar na ABA correspondente
      if (d.tab && !isMe) { // Não coloco eu mesmo na aba pra não poluir, só os outros
        if (!tabOperators[d.tab]) tabOperators[d.tab] = [];
        tabOperators[d.tab].push(d.nome);
      }
    });

    // 3. Desenha as carinhas dentro das abas
    Object.keys(tabOperators).forEach(tabId => {
      let tabBtn = null;
      if (tabId === 'geral') tabBtn = document.querySelector('.tab-btn[onclick*="geral"]');
      else if (tabId === 'dashboard') tabBtn = document.querySelector('.tab-btn[onclick*="dashboard"]');
      else tabBtn = document.querySelector(`.tab-btn[data-caixa-id="${tabId}"]`);

      if (tabBtn) {
        const presWrap = document.createElement('div');
        presWrap.className = 'tab-presence';
        tabOperators[tabId].forEach(nome => {
          const av = document.createElement('div');
          av.className = 'tab-presence-avatar';
          av.title = `${nome} está editando esta aba`;
          av.textContent = nome.charAt(0).toUpperCase();
          presWrap.appendChild(av);
        });
        
        // Insere as carinhas antes do valor (R$) da aba
        const badge = tabBtn.querySelector('.tab-badge');
        if (badge) tabBtn.insertBefore(presWrap, badge);
        else tabBtn.appendChild(presWrap);
      }
    });
  });
}

function toggleProfileMenu() {
  const menu = document.getElementById('profile-menu');
  if(menu) menu.classList.toggle('open');
}
// Close profile menu when clicking outside
document.addEventListener('click', (e) => {
  const menu = document.getElementById('profile-menu');
  const btn = document.getElementById('profile-avatar');
  if(menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.remove('open');
  }
});

function renderHeatmap(dailyData, container) {
  if(!container) return;
  if(dailyData.length === 0) { container.innerHTML = ''; return; }
  
  const vals = dailyData.map(d => d.tot); 
  const max = Math.max(...vals);
  function level(v) { if(v<=0) return 0; const r=v/max; if(r<0.25)return 1; if(r<0.5)return 2; if(r<0.75)return 3; return 4; }
  
  const year = parseInt(dailyData[0].date.split('-')[0]);
  const month = parseInt(dailyData[0].date.split('-')[1]) - 1;
  const firstDay = new Date(year, month, 1).getDay(); 
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '<div style="font-size:10px;color:var(--text3);margin-bottom:6px;display:flex;justify-content:space-between;padding: 0 4px;"><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span></div>';
  html += '<div class="heatmap-grid" style="display:grid; grid-template-columns:repeat(7, 1fr); gap:4px; margin-top:0;">';

  for(let i=0; i<firstDay; i++) { html += `<div class="hm-cell" style="background:transparent; cursor:default;"></div>`; }

  for(let d=1; d<=daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dataForDay = dailyData.find(x => x.date === dateStr);
    
    if (dataForDay) {
      const lv = level(dataForDay.tot);
      html += `<div class="hm-cell hm-${lv}"><div class="hm-tip">${d}/${month+1}: ${fmt(dataForDay.tot)}</div></div>`;
    } else {
      html += `<div class="hm-cell hm-0"><div class="hm-tip">${d}/${month+1}: Sem lançamentos</div></div>`;
    }
  }
  html += '</div>';
  container.innerHTML = html;
}

// ─── FUNÇÃO DE TRADUÇÃO DE ERROS DO FIREBASE ───
function getFriendlyAuthError(code) {
  switch(code) {
    case 'auth/invalid-email': return 'O e-mail digitado não é válido.';
    case 'auth/user-disabled': return 'Esta conta foi desativada pelo administrador.';
    case 'auth/user-not-found': return 'Nenhum cartório encontrado com este e-mail.';
    case 'auth/wrong-password': 
    case 'auth/invalid-credential': return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use': return 'Este e-mail já está registrado em outro cartório.';
    case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.';
    default: return 'Ocorreu um erro. Verifique sua conexão e tente novamente.';
  }
}

// ═══ INIT ═══
function init() {
  initTheme(); loadConfigAndBuildUI(); initChart(); initDashboardMonth();
  const today = new Date().toLocaleDateString('en-CA'); document.getElementById('mainDate').value = today;
  applyMathInputs(); lucide.createIcons();
  initKeyboardShortcuts();
  initInactivityWatcher();
  const observer = new MutationObserver((mutations) => { mutations.forEach((mutation) => { if (mutation.attributeName === 'data-theme') { lucide.createIcons(); } }); }); observer.observe(document.body, { attributes: true });
  // Note: Firebase real-time initialization happens in auth.onAuthStateChanged
}
document.addEventListener('DOMContentLoaded', init);
