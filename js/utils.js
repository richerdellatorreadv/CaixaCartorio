// ═══ CONFIGURAÇÃO MODAL (EDITAR CAIXAS E OPERADORES) ═══
function openSettingsModal() { 
  editingCaixas = JSON.parse(JSON.stringify(CAIXAS)); 
  editingOperadores = JSON.parse(JSON.stringify(OPERADORES)); 
  editingLabels = JSON.parse(JSON.stringify(LABELS));
  editingDepartamentos = JSON.parse(JSON.stringify(DEPARTAMENTOS));
  editingSistemas = JSON.parse(JSON.stringify(SISTEMAS));
  
  document.getElementById('cfg-label-maq').value = editingLabels.maquininha || 'Operadora';
  document.getElementById('cfg-label-patrimonio').value = editingLabels.saida_patrimonial || 'Retirada/Sócio';
  document.getElementById('cfg-lock-permission').checked = configOperadoresPodemDestravar === true;

  renderDepartamentosEditList();
  renderSistemasEditList();
  renderCaixaEditList(); 
  renderOperadorEditList();
  document.getElementById('settingsModal').classList.add('active'); 
}
function renderCaixaEditList() {
  const container = document.getElementById('caixas-edit-list'); container.innerHTML = '';
  editingCaixas.forEach((cx, index) => {
    let selectOpts = editingDepartamentos.map(d => `<option value="${d.id}" ${cx.tipo === d.id ? 'selected' : ''}>${d.nome}</option>`).join('');
    container.innerHTML += `<div class="edit-cx-row"><button class="del-cx-btn" onclick="removeCaixaFromList(${index})" title="Excluir"><i data-lucide="trash-2" style="width:14px;"></i></button><div style="font-size:10px; color:var(--text3); margin-bottom:4px; text-transform:uppercase;">ID: ${cx.id}</div><input type="text" autocomplete="off" value="${cx.nome}" onchange="updateTempCaixa(${index}, 'nome', this.value)" placeholder="Nome do Caixa"><select onchange="updateTempCaixa(${index}, 'tipo', this.value)">${selectOpts}</select></div>`;
  }); lucide.createIcons();
}
function updateTempCaixa(index, key, val) { editingCaixas[index][key] = val; }
function removeCaixaFromList(index) { if(confirm("Remover este caixa da exibição?")) { editingCaixas.splice(index, 1); renderCaixaEditList(); } }
function addCaixaToList() { const newId = 'cx_' + Math.floor(Math.random() * 1000000); const defaultDep = editingDepartamentos.length > 0 ? editingDepartamentos[0].id : ''; editingCaixas.push({ id: newId, nome: 'Novo Caixa', tipo: defaultDep }); renderCaixaEditList(); }

function renderDepartamentosEditList() {
  const container = document.getElementById('departamentos-edit-list'); container.innerHTML = '';
  editingDepartamentos.forEach((d, index) => {
    container.innerHTML += `<div class="edit-cx-row"><button class="del-cx-btn" onclick="removeDepartamentoFromList(${index})" title="Excluir"><i data-lucide="trash-2" style="width:14px;"></i></button><div style="font-size:10px; color:var(--text3); margin-bottom:4px; text-transform:uppercase;">ID: ${d.id}</div><input type="text" autocomplete="off" value="${d.nome}" onchange="updateTempDep(${index}, 'nome', this.value)" placeholder="Nome do Departamento"><select onchange="updateTempDep(${index}, 'cor', this.value)"><option value="ri-color" ${d.cor === 'ri-color' ? 'selected' : ''}>Azul</option><option value="td-color" ${d.cor === 'td-color' ? 'selected' : ''}>Verde</option><option value="onr-color" ${d.cor === 'onr-color' ? 'selected' : ''}>Roxo</option></select></div>`;
  }); lucide.createIcons();
}
function updateTempDep(index, key, val) { editingDepartamentos[index][key] = val; renderCaixaEditList(); renderSistemasEditList(); }
function removeDepartamentoFromList(index) { if(confirm("Remover departamento? (Caixas atrelados podem dar erro)")) { editingDepartamentos.splice(index, 1); renderDepartamentosEditList(); renderCaixaEditList(); renderSistemasEditList(); } }
function addDepartamentoToList() { const newId = 'dep_' + Math.floor(Math.random() * 1000); editingDepartamentos.push({ id: newId, nome: 'Novo Dep', cor: 'ri-color' }); renderDepartamentosEditList(); renderCaixaEditList(); renderSistemasEditList(); }

function renderSistemasEditList() {
  const container = document.getElementById('sistemas-edit-list'); container.innerHTML = '';
  editingSistemas.forEach((sys, index) => {
    let checkboxes = editingDepartamentos.map(d => {
      const checked = sys.departamentos.includes(d.id) ? 'checked' : '';
      return `<label style="font-size:11px; display:inline-flex; align-items:center; gap:4px; margin-right:8px;"><input type="checkbox" onchange="toggleSysDep(${index}, '${d.id}', this.checked)" ${checked}> ${d.nome}</label>`;
    }).join('');
    container.innerHTML += `<div class="edit-cx-row" style="flex-direction:column; align-items:flex-start;"><div style="display:flex; width:100%; gap:10px;"><button class="del-cx-btn" onclick="removeSistemaFromList(${index})" title="Excluir"><i data-lucide="trash-2" style="width:14px;"></i></button><input style="flex:1" type="text" autocomplete="off" value="${sys.nome}" onchange="updateTempSys(${index}, 'nome', this.value)" placeholder="Nome do Sistema"></div><div style="margin-top:8px;">${checkboxes}</div></div>`;
  }); lucide.createIcons();
}
function updateTempSys(index, key, val) { editingSistemas[index][key] = val; }
function toggleSysDep(index, depId, checked) { 
  if(checked) { if(!editingSistemas[index].departamentos.includes(depId)) editingSistemas[index].departamentos.push(depId); }
  else { editingSistemas[index].departamentos = editingSistemas[index].departamentos.filter(d => d !== depId); }
}
function removeSistemaFromList(index) { if(confirm("Remover este sistema?")) { editingSistemas.splice(index, 1); renderSistemasEditList(); } }
function addSistemaToList() { const newId = 'sys_' + Math.floor(Math.random() * 1000); editingSistemas.push({ id: newId, nome: 'Novo Sistema', departamentos: [] }); renderSistemasEditList(); }

function renderOperadorEditList() {
  const container = document.getElementById('operadores-edit-list'); container.innerHTML = '';
  editingOperadores.forEach((op, index) => {
    const hasPin = op.pin && op.pin.length === 64;
    const pinDisplay = hasPin ? '****' : (op.pin || '');
    const row = document.createElement('div');
    row.className = 'edit-cx-row';
    row.innerHTML = `<button class="del-cx-btn" onclick="removeOperadorFromList(${index})" title="Excluir"><i data-lucide="trash-2" style="width:14px;"></i></button><input type="text" onchange="updateTempOperador(${index}, 'nome', this.value)" placeholder="Nome do Operador"><input type="password" onchange="updateTempOperador(${index}, 'pin', this.value)" placeholder="PIN de 4 dígitos (opcional)" maxlength="4" style="margin-bottom:0; font-family:var(--mono);">`;
    row.querySelectorAll('input')[0].value = op.nome;
    row.querySelectorAll('input')[1].value = pinDisplay;
    container.appendChild(row);
  }); lucide.createIcons();
}
async function updateTempOperador(index, key, val) { 
  if (key === 'pin') {
    if (val === '****') return;
    if (val.length === 4) {
      editingOperadores[index][key] = await sha256(val);
    } else {
      editingOperadores[index][key] = '';
    }
  } else {
    editingOperadores[index][key] = val; 
  }
}
function removeOperadorFromList(index) { if(confirm("Remover este operador?")) { editingOperadores.splice(index, 1); renderOperadorEditList(); } }
function addOperadorToList() { 
  if (currentPlano === 'basico' && editingOperadores.length >= 3) {
    showToast("⚠️ O Plano Básico permite no máximo 3 operadores. Faça upgrade para ter operadores ilimitados.", 6000, true);
    return;
  }
  const newId = 'op_' + Math.floor(Math.random() * 1000000); editingOperadores.push({ id: newId, nome: 'Novo Operador', pin: '' }); renderOperadorEditList(); 
}

// ═══ ANOTAÇÕES & UTILS ═══
function addAnotacao(c, val = '') {
  const wrap = document.getElementById(`${c}-anots-wrap`); if(!wrap) return;
  const count = wrap.children.length + 1; if (count > 8) { showToast('Máximo de 8 anotações.'); return; }
  const div = document.createElement('div'); div.className = 'anot-row'; div.setAttribute('data-anot', '');
  div.innerHTML = `<span class="anot-num">${count}.</span><input type="text" class="anot-input" placeholder="Observação..." oninput="atualizarNumAnots('${c}')"><button class="btn btn-ghost btn-ghost-danger" style="padding:4px 8px;font-size:12px;" onclick="removeAnotacao(this,'${c}')"><i data-lucide="x" style="width:12px;"></i></button>`;
  div.querySelector('.anot-input').value = val;
  wrap.appendChild(div); lucide.createIcons(); atualizarNumAnots(c);
}
function removeAnotacao(btn, c) { btn.parentElement.remove(); atualizarNumAnots(c); }
function atualizarNumAnots(c) { const rows = document.getElementById(`${c}-anots-wrap`).children; for (let i = 0; i < rows.length; i++) rows[i].querySelector('.anot-num').textContent = (i + 1) + '.'; salvarDadosDebounced(); }
const getIfInactive = id => { const el = document.getElementById(id); return (el && el !== document.activeElement) ? el : null; };
const pv = id => { const v = document.getElementById(id)?.value; return v ? parseFloat(v.replace(/\./g,'').replace(',','.')) || 0 : 0; };
const setEl = (id, val, cls=null) => { const el = document.getElementById(id); if (el) { el.textContent = val; if (cls !== null) el.className = cls; } };

let _animStates = {};
let _animFrames = {}; // NOVO: Rastreador de animações ativas

function setValAnim(id, endValue, cls=null) {
  const obj = document.getElementById(id);
  if (!obj) return;
  if (cls !== null) obj.className = cls;
  
  const start = _animStates[id] || 0;
  
  // Se o valor já é o destino, cancela animações anteriores e seta direto
  if (Math.abs(endValue - start) < 0.01) {
    obj.innerText = fmt(endValue);
    _animStates[id] = endValue;
    if (_animFrames[id]) cancelAnimationFrame(_animFrames[id]);
    return;
  }
  
  // Cancela qualquer animação que estivesse rodando neste ID
  if (_animFrames[id]) cancelAnimationFrame(_animFrames[id]);
  
  const duration = 400;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 4);
    const current = start + (endValue - start) * easeProgress;
    
    // NOVO: Busca o elemento novamente a cada quadro da animação.
    // Como as abas são recriadas no DOM durante sincronizações, 
    // o elemento original pode ter se tornado "fantasma".
    const currentObj = document.getElementById(id);
    if (!currentObj) return; 
    
    currentObj.innerText = fmt(current);
    
    if (progress < 1) {
      _animFrames[id] = window.requestAnimationFrame(step);
    } else {
      currentObj.innerText = fmt(endValue);
      _animStates[id] = endValue;
    }
  };
  _animFrames[id] = window.requestAnimationFrame(step);
}
function fmt(n) { 
  if(n < -0.005) return '- R$ ' + Math.abs(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  return 'R$ ' + Math.abs(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); 
}
function fmtInput(n) { return n === 0 ? '' : n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtShort(n) { 
  if(n < -0.005) return '- R$ ' + (Math.abs(n)/1000 >= 1 ? (Math.abs(n)/1000).toFixed(1) + 'k' : Math.abs(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}));
  return Math.abs(n) >= 1000 ? 'R$ ' + (Math.abs(n)/1000).toFixed(1) + 'k' : fmt(n); 
}
function fmtSigned(n) { if (Math.abs(n) < 0.005) return 'R$ 0,00'; return (n > 0 ? '+ ' : '- ') + fmt(n); }
function showToast(msg, duration = 3000, isError = false, undoFn = null) {
  const t = document.getElementById('toast');
  if(!t) return;
  const icon = isError ? '⚠️' : (undoFn ? '🗑️' : '✓');
  const bg = isError ? 'var(--accent-r)' : (undoFn ? 'var(--accent-y)' : 'var(--accent-g)');
  t.style.background = bg;
  // Construção segura do toast sem innerHTML com dados de usuário
  t.innerHTML = '';
  const body = document.createElement('div'); body.className = 'toast-body';
  const iconSpan = document.createElement('span'); iconSpan.className = 'toast-icon'; iconSpan.textContent = icon;
  const textSpan = document.createElement('span'); textSpan.className = 'toast-text'; textSpan.textContent = msg;
  body.appendChild(iconSpan); body.appendChild(textSpan);
  if (undoFn) {
    const undoBtn = document.createElement('button'); undoBtn.className = 'toast-undo-btn'; undoBtn.textContent = 'Desfazer';
    undoBtn.addEventListener('click', () => { undoFn(); t.classList.remove('show'); });
    body.appendChild(undoBtn);
  }
  t.appendChild(body);
  const progWrap = document.createElement('div'); progWrap.className = 'toast-prog-wrap';
  const progFill = document.createElement('div'); progFill.className = 'toast-prog-fill'; progFill.id = 'toast-prog';
  progWrap.appendChild(progFill); t.appendChild(progWrap);
  t.classList.add('show');
  const prog = document.getElementById('toast-prog');
  if(prog) { prog.style.transition = 'none'; prog.style.width = '100%'; requestAnimationFrame(() => { prog.style.transition = `width ${duration}ms linear`; prog.style.width = '0%'; }); }
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.classList.remove('show'); }, duration);
}

function animateCounter(el, toVal) {
  if(!el) return;
  const from = parseFloat((el.textContent||'0').replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.')) || 0;
  const duration = 600; const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = p < 0.5 ? 2*p*p : -1+(4-2*p)*p;
    const cur = from + (toVal - from) * ease;
    el.textContent = fmt(cur);
    if(p < 1) requestAnimationFrame(step);
    else el.textContent = fmt(toVal);
  }
  requestAnimationFrame(step);
}

function checkPwStrength(pw) {
  const fill = document.getElementById('pw-fill'); const lbl = document.getElementById('pw-label');
  if(!fill || !lbl) return;
  let score = 0;
  if(pw.length >= 8) score++; if(pw.length >= 12) score++;
  if(/[A-Z]/.test(pw)) score++; if(/[0-9]/.test(pw)) score++; if(/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [{w:'20%',c:'#ef4444',t:'Muito fraca'},{w:'40%',c:'#f97316',t:'Fraca'},{w:'60%',c:'#eab308',t:'Razoável'},{w:'80%',c:'#22c55e',t:'Boa'},{w:'100%',c:'#16a34a',t:'Excelente'}];
  const l = levels[Math.min(score, 4)];
  fill.style.width = pw.length === 0 ? '0%' : l.w; fill.style.background = l.c;
  lbl.textContent = pw.length === 0 ? '' : l.t; lbl.style.color = l.c;
}

// ═══ MODALS & ACTIONS ═══
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function limparCaixa(c) {
  // Salva snapshot para undo
  const snapshot = {};
  document.querySelectorAll(`#page-${c} input`).forEach(i => { if(i.id) snapshot[i.id] = i.value; });
  const wrap = document.getElementById(`${c}-anots-wrap`);
  if(wrap) snapshot['_anots'] = wrap.innerHTML;
  // Limpa
  document.querySelectorAll(`#page-${c} input`).forEach(i => i.value = '');
  if(wrap) { wrap.innerHTML = ''; addAnotacao(c); }
  calcularCaixa(c); salvarDados();
  showToast('Caixa limpo', 6000, false, function undoLimpar() {
    Object.entries(snapshot).forEach(([id, val]) => { if(id !== '_anots') { const el = document.getElementById(id); if(el) el.value = val; } });
    if(wrap && snapshot['_anots']) wrap.innerHTML = snapshot['_anots'];
    calcularCaixa(c); salvarDados();
    showToast('✓ Restaurado com sucesso!');
  });
}
function openMoedaModal(caixaId) { activeCaixaForModal = caixaId; document.querySelectorAll('#moeda-inputs input').forEach(i => { i.value = ''; i.oninput = calcMoedaModal; }); calcMoedaModal(); document.getElementById('moedaModal').classList.add('active'); setTimeout(() => document.querySelector('#moeda-inputs input').focus(), 100); }
function calcMoedaModal() { let tot = 0; document.querySelectorAll('#moeda-inputs input').forEach(i => { tot += (parseInt(i.value||0) * parseFloat(i.getAttribute('data-val'))); }); setEl('moeda-modal-total', fmt(tot)); return tot; }
function applyMoedaModal() { if(activeCaixaForModal) { const input = document.getElementById(`${activeCaixaForModal}-moeda`); if(input) { input.value = fmtInput(calcMoedaModal()); evaluateMath.call(input); } } closeModal('moedaModal'); }
function openMaloteModal() {
  const cont = document.getElementById('malote-content'); let gNotas = {}; let gMoeda = 0; NOTAS.forEach(n => gNotas[n.val] = 0);
  CAIXAS.forEach(cfg => { if(cfg.nome.toUpperCase().includes('ONR') || cfg.tipo === 'dep_onr') return; NOTAS.forEach(n => { gNotas[n.val] += parseInt(document.getElementById(`${cfg.id}-nota-${n.val}`)?.value || 0); }); gMoeda += pv(`${cfg.id}-moeda`); });
  let html = `<table class="resumo-table" style="margin-bottom:10px;"><thead><tr><th style="text-align:left">Cédula</th><th>Quantidade</th><th>Subtotal</th></tr></thead><tbody>`;
  let totNotas = 0; NOTAS.forEach(n => { const sub = gNotas[n.val] * n.val; totNotas += sub; html += `<tr><td>${n.lbl}</td><td>${gNotas[n.val]} und.</td><td style="color:var(--text)">${fmt(sub)}</td></tr>`; });
  html += `<tr><td>Moedas</td><td>—</td><td style="color:var(--text)">${fmt(gMoeda)}</td></tr></tbody></table>`;
  cont.innerHTML = html; setEl('malote-total', fmt(totNotas + gMoeda)); document.getElementById('maloteModal').classList.add('active');
}
async function exportarJSON() {
  if(!currentCartorioId) return;
  try {
    showToast('⏳ Preparando backup da nuvem...', 3000);
    const backup = {};
    const snapCaixas = await db.ref('cartorios/' + currentCartorioId + '/caixas').once('value');
    if (snapCaixas.exists()) {
      snapCaixas.forEach(child => { backup[`caixa_v3_${child.key}`] = child.val(); });
    }
    const snapConfig = await db.ref('cartorios/' + currentCartorioId + '/config/caixas').once('value');
    if (snapConfig.exists()) { backup['caixa_config_v1'] = snapConfig.val(); }
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], {type: "application/json"});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `backup-cartorio-nuvem-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    showToast('✓ Backup completo exportado!'); closeModal('settingsModal');
  } catch(e) {
    alert("Erro ao exportar backup da nuvem: " + e.message);
  }
}
function importarJSON(e) {
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = async function(event) {
    try {
      const raw = event.target.result;
      if(!raw || raw.trim() === '') throw new Error('Arquivo vazio');
      const data = JSON.parse(raw);
      if(typeof data !== 'object' || data === null) throw new Error('Formato inválido');
      
      let count = 0; let updates = {}; let configUpdate = null;
      for(let key in data) {
        if(key.startsWith('caixa_v3_')) {
          const date = key.replace('caixa_v3_', '');
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
          updates[date] = data[key];
          count++;
        } else if(key === 'caixa_config_v1') {
          if (Array.isArray(data[key])) {
            configUpdate = data[key];
            count++;
          }
        }
      }
      if(count === 0) { alert('Nenhum dado reconhecido no arquivo. Verifique se é um backup válido.'); return; }
      
      showToast('⏳ Restaurando backup na nuvem...');
      if(!currentCartorioId) throw new Error("Usuário não autenticado");
      if (Object.keys(updates).length > 0) await db.ref('cartorios/' + currentCartorioId + '/caixas').update(updates);
      if (configUpdate) await db.ref('cartorios/' + currentCartorioId + '/config/caixas').set(configUpdate);
      
      showToast(`✓ ${count} registro(s) restaurados na nuvem!`);
      setTimeout(() => location.reload(), 1500);
    } catch(err) {
      alert('Erro ao ler arquivo: ' + err.message);
    }
  };
  reader.onerror = function() { alert('Não foi possível ler o arquivo. Tente novamente.'); };
  reader.readAsText(file, 'UTF-8');
  e.target.value = '';
}

function aplicarSaldoProximoDia(c) {
  const val = pv(`${c}-saldo-remanescente`);
  if(val <= 0) { showToast('⚠ Informe um valor de saldo remanescente antes.'); return; }
  
  // Calcula a data do próximo dia útil (próximo dia corrido para simplificar)
  const dateInput = document.getElementById('mainDate');
  const currentDate = new Date(dateInput.value + 'T00:00:00');
  currentDate.setDate(currentDate.getDate() + 1);
  const nextDateStr = currentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD

  // Tenta persistir no Firebase

  (async () => {
    if(!currentCartorioId) return;
    try {
      await db.ref('cartorios/' + currentCartorioId + '/caixas/' + nextDateStr + '/' + c).update({ abertura: val.toLocaleString('pt-BR', {minimumFractionDigits:2}) });
    } catch(e) { console.error('Erro na transferência:', e); }

  })();

  const nextDateFormatted = currentDate.toLocaleDateString('pt-BR');
  const statusEl = document.getElementById(`${c}-saldo-status`);
  if(statusEl) statusEl.innerHTML = `<span style="color:var(--accent-g)">✓ R$ ${val.toLocaleString('pt-BR',{minimumFractionDigits:2})} registrado como Fundo de Caixa Inicial para ${nextDateFormatted}</span>`;
  showToast(`✓ Fundo de ${nextDateFormatted} definido!`);
}

// ══════════════════════════════════════════════════════════
  // PROTEÇÃO DE DADOS — CAMADA 1:
  // Nunca salvar antes do Firebase ter retornado os dados do dia.
  // window._firebaseDataLoaded é definido como true apenas quando
  // o listener .on('value') da data ativa recebe uma resposta.
  // ══════════════════════════════════════════════════════════
  if (!window._firebaseDataLoaded && !manual) {
    console.warn('salvarDados bloqueado: dados do Firebase ainda não foram carregados para ' + dateStr);
    return;
  }

  const dados = coletarDados();
  const localKey = `caixa_v3_${dateStr}`;

  // ══════════════════════════════════════════════════════════
  // PROTEÇÃO DE DADOS — CAMADA 2:
  // Nunca sobrescrever dados reais com um formulário vazio.
  // Se o Firebase tinha dados (lastKnownState) e o formulário
  // coletado está todo zerado, bloquear o save.
  // ═══ PDF DIDÁTICO ═══
function gerarPDF() {
  if (currentPlano === 'basico') {
    showToast('⚠️ A Geração de PDF é um recurso exclusivo do Plano Profissional.', 5000, true);
    return;
  }
  const { jsPDF } = window.jspdf; const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' }); 
  const data = coletarDados(); const dateStr = document.getElementById('mainDate').value.split('-').reverse().join('/');
  const W = 210, M = 15; let y = 0; // A4 Portrait width is 210
  
  const bg = (r,g,b) => doc.setFillColor(r,g,b); const fc = (r,g,b) => doc.setTextColor(r,g,b); const fs = (sz,b=false) => { doc.setFontSize(sz); doc.setFont('helvetica', b?'bold':'normal'); };
  const txt = (t, x, yy, o) => doc.text(t, x, yy, o); const addY = (dy) => y += dy;
  const checkPage = (n=20) => { if (y+n > 280) { doc.addPage(); y = 15; } }; // 297 is A4 height

  // HEADER GERAL
  bg(30,40,60); doc.rect(0,0,W,25,'F'); fs(14,true); fc(255,255,255); txt('RELATÓRIO DE CAIXA', W/2, 12, {align:'center'}); fs(10,false); fc(180,200,240); txt(`Data: ${dateStr}`, W/2, 18, {align:'center'}); y = 32;

  // MATH GLOBALS
  const totals={}; let gTotLiq=0, gTotMaqB=0, gTotTaxa=0, gTotFis=0, gTotRem=0;
  let depsTotals = {}; DEPARTAMENTOS.forEach(d => depsTotals[d.id] = 0);
  CAIXAS.forEach(cfg => {
    const c=cfg.id, cd=data[c]||{}; let nts=0; NOTAS.forEach(n => nts += (parseInt(cd[`n${n.val}`])||0)*n.val);
    const m = parseFloat((cd.moeda||'').replace(/\./g,'').replace(',','.'))||0;
    const px = parseFloat((cd.pix||'').replace(/\./g,'').replace(',','.'))||0;
    const db = parseFloat((cd.debito||'').replace(/\./g,'').replace(',','.'))||0;
    const crB = parseFloat((cd.credito||'').replace(/\./g,'').replace(',','.'))||0;
    const tx = parseFloat((cd.taxa||'').replace(/\./g,'').replace(',','.'))||0;
    const dp = parseFloat((cd.deposito||'').replace(/\./g,'').replace(',','.'))||0;
    const ab = parseFloat((cd.abertura||'').replace(/\./g,'').replace(',','.'))||0;
    const val = parseFloat((cd.vale||'').replace(/\./g,'').replace(',','.'))||0;
    const bern = parseFloat((cd.bernadete||'').replace(/\./g,'').replace(',','.'))||0;
    const rem = parseFloat((cd['saldo-remanescente']||'').replace(/\./g,'').replace(',','.'))||0;
    
    const maqB = px + db + crB; const maqL = maqB - tx; const fis = nts + m;
    const totLiq = fis + maqL + dp - ab;
    
    totals[c] = {fis, px, db, crB, tx, maqB, maqL, dp, ab, val, bern, rem, totLiq}; 
    gTotLiq+=totLiq; gTotMaqB+=maqB; gTotTaxa+=tx; gTotFis+=fis; gTotRem+=rem;
    if(depsTotals[cfg.tipo] !== undefined) depsTotals[cfg.tipo] += totLiq;
  });

  // GERAL RESUMO
  fs(12,true); fc(20,40,100); txt('1. RESUMO GERAL DO FECHAMENTO', M, y); addY(6);
  bg(240,248,255); doc.roundedRect(M, y, W-M*2, 14, 2, 2, 'F'); fs(10,false); fc(80,100,140); txt('Total Líquido do Cartório (todos os caixas)', M+4, y+9); fs(12,true); fc(20,140,80); txt(`R$ ${gTotLiq.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M-4, y+9, {align:'right'}); addY(18);

  const maqFita = parseFloat((data.maquininha||'').replace(/\./g,'').replace(',','.'))||0;
  fs(9,false); fc(80,90,110); txt('Soma PIX, cartão de débito e crédito (todos os caixas):', M, y); fc(40,50,80); txt(`R$ ${gTotMaqB.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(5);
  txt(`Total do Relatório da ${LABELS.maquininha}:`, M, y); fc(40,50,80); txt(`R$ ${maqFita.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(5);
  const diffM = gTotMaqB - maqFita; txt('Divergência Relatório Z × Caixas:', M, y); if(Math.abs(diffM)<0.05){fc(20,160,80); txt('Conferido — R$ 0,00', W-M, y, {align:'right'});} else {fc(200,60,40); txt(fmtSigned(diffM), W-M, y, {align:'right'});} addY(5);
  txt('Total de Taxas Bancárias (desconto de operadoras):', M, y); fc(200,60,40); txt(`- R$ ${gTotTaxa.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(5);
  fc(80,90,110); txt('Total em Numerário Físico (cédulas + moedas):', M, y); fc(40,50,80); txt(`R$ ${gTotFis.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(5);
  addY(4);

  SISTEMAS.forEach(sys => {
    const sysV = parseFloat((data[`sys_input_${sys.id}`]||'').replace(/\./g,'').replace(',','.'))||0;
    fs(9,false); fc(80,90,110); txt(`Conferência com Sistema ${sys.nome} (global):`, M, y); fc(40,50,80); txt(`R$ ${sysV.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(5);
    let sumDeps = 0; sys.departamentos.forEach(d => sumDeps += depsTotals[d]);
    const diffS = sumDeps - sysV; txt(`Divergência ${sys.nome} × Caixas (Líquido):`, M, y); if(Math.abs(diffS)<0.05){fc(20,160,80); txt('Conferido — R$ 0,00', W-M, y, {align:'right'});} else {fc(200,60,40); txt(fmtSigned(diffS), W-M, y, {align:'right'});} addY(8);
  });
  addY(4);

  // INDIVIDUAL PAGES (DIDACTIC)
  CAIXAS.forEach(cfg => {
    const c=cfg.id, cd=data[c]||{}, d=totals[c]; doc.addPage(); y = 15;
    
    bg(235,242,255); doc.rect(M, y, W-M*2, 10, 'F'); fs(12,true); fc(20,40,100); txt(cfg.nome.toUpperCase(), M+3, y+7); addY(16);
    
    const isONR = cfg.nome.toUpperCase().includes('ONR') || cfg.tipo === 'dep_onr';

    if(!isONR) {
      // BLOCO 1: MAQUININHA (BRUTO)
      bg(240,245,255); doc.rect(M, y, W-M*2, 6, 'F'); fs(9,true); fc(40,80,180); txt('A. RECEBIMENTOS ELETRÔNICOS (VALORES BRUTOS — MAQUININHA)', M+2, y+4.5); addY(8);
      fs(9,false); fc(80,90,110);
      if(d.px > 0) { txt('   PIX', M, y); txt(`R$ ${d.px.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(5); }
      if(d.db > 0) { txt('   Cartão de Débito', M, y); txt(`R$ ${d.db.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(5); }
      if(d.crB > 0){ txt('   Cartão de Crédito (Bruto)', M, y); txt(`R$ ${d.crB.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(5); }
      fs(9,true); fc(40,80,180); txt('   SUBTOTAL (Valor bruto)', M, y); txt(`R$ ${d.maqB.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(10);

      // BLOCO 2: TAXAS
      bg(255,240,240); doc.rect(M, y, W-M*2, 6, 'F'); fs(9,true); fc(180,40,40); txt('B. DEDUÇÕES — TAXAS ADMINISTRATIVAS BANCÁRIAS', M+2, y+4.5); addY(8);
      fs(9,false); fc(80,90,110); txt('   Taxa cobrada pela operadora de cartão de crédito', M, y); fc(180,40,40); txt(`- R$ ${d.tx.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(6);
      fs(9,true); fc(20,140,80); txt('   SALDO LÍQUIDO ELETRÔNICO (após deduções)', M, y); txt(`R$ ${d.maqL.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(10);

      // BLOCO 3: NUMERÁRIO FÍSICO
      bg(240,255,245); doc.rect(M, y, W-M*2, 6, 'F'); fs(9,true); fc(30,120,60); txt('C. NUMERÁRIO FÍSICO (CÉDULAS E MOEDAS)', M+2, y+4.5); addY(8);
      fs(9,false); fc(80,90,110);
      if(d.ab > 0) { txt('   Abertura de caixa (valor de abertura do caixa)', M, y); fc(180,40,40); txt(`- R$ ${d.ab.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); fc(80,90,110); addY(5); }
      if(d.fis > 0) { txt('   Soma de Cédulas e Moedas', M, y); txt(`R$ ${d.fis.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(5); }
      if(d.rem > 0) { fc(100,60,160); txt('   Saldo Remanescente p/ Fundo do Dia Seguinte (informativo)', M, y); txt(`R$ ${d.rem.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); fc(80,90,110); addY(5); }
      const subFis = d.fis - d.ab;
      fs(9,true); fc(30,120,60); txt('   SUBTOTAL NUMERÁRIO', M, y); txt(`R$ ${subFis.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(10);
    }

    // BLOCO 3B: DEPÓSITOS BANCÁRIOS
    if(d.dp > 0 || isONR) {
      bg(235,250,240); doc.rect(M, y, W-M*2, 6, 'F'); fs(9,true); fc(20,100,60); txt(isONR ? 'A. REPASSE RECEBIDO (DEPÓSITOS BANCÁRIOS)' : 'D. DEPÓSITOS BANCÁRIOS', M+2, y+4.5); addY(8);
      fs(9,false); fc(80,90,110);
      txt('   Depósitos Bancários Efetuados', M, y); txt(`R$ ${d.dp.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(6);
      fs(9,true); fc(20,100,60); txt('   SUBTOTAL DEPÓSITOS', M, y); txt(`R$ ${d.dp.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(10);
    }

    // BLOCO E: SAIDAS INFORMATIVAS
    if(d.bern > 0 || d.val > 0) {
      const blocoLbl = d.dp > 0 ? 'E.' : 'D.';
      bg(245,240,255); doc.rect(M, y, W-M*2, 6, 'F'); fs(9,true); fc(120,60,180); txt(`${blocoLbl} SAÍDA (vale) E RETENÇÕES (dinheiro ${LABELS.saida_patrimonial})`, M+2, y+4.5); addY(8);
      fs(8,false); fc(140,150,170); txt(`   Estes valores são registros de controle patrimonial.`, M, y); addY(5);
      fs(9,false); fc(80,90,110);
      if(d.bern > 0) { txt(`   Saída ${LABELS.saida_patrimonial}`, M, y); txt(`R$ ${d.bern.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(5); }
      if(d.val > 0)  { txt('   Adiantamento / Vale', M, y); txt(`R$ ${d.val.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M, y, {align:'right'}); addY(5); }
      addY(5);
    }

    // BLOCO 5: CONFERENCIA FINAL
    bg(250,250,250); doc.rect(M, y, W-M*2, 22, 'F'); doc.setDrawColor(220,220,220); doc.rect(M, y, W-M*2, 22, 'S');
    fs(10,false); fc(60,70,80); txt('TOTAL LÍQUIDO DO CAIXA', M+4, y+7); fs(12,true); fc(20,140,80); txt(`R$ ${d.totLiq.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M-4, y+7, {align:'right'});
    
    const imI = parseFloat((cd.imob||'').replace(/\./g,'').replace(',','.'))||0;
    fs(9,false); fc(100,110,120); txt(`Total gerado no relatório deste caixa:`, M+4, y+13); txt(`R$ ${imI.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, W-M-4, y+13, {align:'right'});
    const dI = d.totLiq - imI; 
    fs(9,true); txt('Divergência:', M+4, y+18);
    if(imI===0) { fc(150,150,150); txt(`Aguardando lançamento do relatório do caixa`, W-M-4, y+18, {align:'right'}); }
    else if(Math.abs(dI)<0.05) { fc(20,160,80); txt('CONFERIDO — FECHAMENTO CORRETO — R$ 0,00', W-M-4, y+18, {align:'right'}); }
    else { fc(200,60,40); txt(dI>0?`EXCEDENTE DE R$ ${dI.toFixed(2)}`:`DIFERENÇA A MENOR DE R$ ${Math.abs(dI).toFixed(2)}`, W-M-4, y+18, {align:'right'}); }
    addY(28);

    // ANOTAÇÕES
    const anots = []; for(let i=1; i<=8; i++) if(cd[`a${i}`] && cd[`a${i}`].trim() !== '') anots.push(`${i}. ${cd[`a${i}`]}`);
    if(anots.length) { fs(9, true); fc(100,110,130); txt('ANOTAÇÕES DA OPERADORA:', M, y); addY(6); anots.forEach(a => { fs(9,false); fc(80,90,110); txt(a, M+2, y); addY(5); }); }
  });
  doc.save(`caixa-${dateStr.replace(/\//g,'-')}.pdf`); showToast('✓ PDF gerado!');
}

// ═══ SPLASH SCREEN ═══
function dismissSplash() {
  const splash = document.getElementById('splash-overlay');
  if(!splash) return;
  splash.classList.add('fade-out');
  setTimeout(() => splash.remove(), 450);
}

// ═══ ONBOARDING ═══
let _selectedServentias = new Set();

function goToOnboarding() {
  const form = document.getElementById('reg-form');
  if(form && !form.checkValidity()) { form.reportValidity(); return; }
  renderServentiaGrid();
  document.getElementById('reg-form').style.display = 'none';
  document.getElementById('onboarding-step2').classList.add('active');
  lucide.createIcons();
}

function backToStep1() {
  document.getElementById('reg-form').style.display = 'block';
  document.getElementById('onboarding-step2').classList.remove('active');
}

function renderServentiaGrid() {
  const grid = document.getElementById('serventia-grid');
  if(!grid) return;
  grid.innerHTML = SERVENTIA_PRESETS.map(s => `
    <button type="button" class="serventia-card${_selectedServentias.has(s.id) ? ' selected' : ''}" onclick="toggleServentia('${s.id}')" id="sv-card-${s.id}">
      <div class="sv-header">
        <div class="sv-icon"><i data-lucide="${s.icon}" style="width:18px;height:18px;"></i></div>
        <div class="sv-check">✓</div>
      </div>
      <div class="sv-nome">${s.nome}</div>
      <div class="sv-desc">${s.desc}</div>
    </button>`).join('');
  lucide.createIcons();
}

function toggleServentia(id) {
  if(_selectedServentias.has(id)) _selectedServentias.delete(id);
  else _selectedServentias.add(id);
  document.getElementById(`sv-card-${id}`)?.classList.toggle('selected', _selectedServentias.has(id));
  const checkEl = document.querySelector(`#sv-card-${id} .sv-check`);
  if(checkEl) checkEl.style.opacity = _selectedServentias.has(id) ? '1' : '0';
}

function buildConfigFromServentias(selectedIds) {
  if(selectedIds.length === 0) {
    return {
      caixas: [{ id:'caixa1', nome:'Caixa Principal', tipo:'geral' }],
      departamentos: [{ id:'geral', nome:'Departamento Geral', cor:'ri-color' }],
      sistemas: []
    };
  }
  const presets = SERVENTIA_PRESETS.filter(s => selectedIds.includes(s.id));
  const caixas = []; const departamentos = []; const sistemas = [];
  let cxIndex = 1;
  presets.forEach(p => {
    if (p.dep && !departamentos.some(d => d.id === p.dep.id)) {
      departamentos.push({ ...p.dep });
    }
    p.caixas.forEach(cx => {
      caixas.push({ ...cx, id: `cx${cxIndex++}` });
    });
    if (p.sistema && !sistemas.some(s => s.id === p.sistema.id)) {
      sistemas.push({ ...p.sistema, id: `sys${sistemas.length + 1}` });
    }
  });
  return { caixas, departamentos, sistemas };
}

// ═══ DETECÇÃO DE CONEXÃO ═══
db.ref('.info/connected').on('value', snap => {
  const banner = document.getElementById('offline-banner');
  if (snap.val() === false && !document.body.classList.contains('auth-mode')) {
    if(banner) banner.style.display = 'block';
    setEl('last-saved', '⚠ Offline');
  } else {
    if(banner) banner.style.display = 'none';
  }
});
