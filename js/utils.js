// ══════════════════════════════════════════════════════════
// UTILITIES & FORMATTING
// ══════════════════════════════════════════════════════════
function setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function fmt(v) { return (parseFloat(v)||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtInput(v) { return (parseFloat(v)||0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtShort(v) { return (parseFloat(v)||0).toLocaleString('pt-BR', { maximumFractionDigits: 0 }); }

function showToast(msg, duration = 3000, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' toast-error' : '');
  toast.innerHTML = `<i data-lucide="${isError ? 'alert-circle' : 'check-circle'}" style="width:16px;"></i> ${msg}`;
  document.body.appendChild(toast);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => toast.classList.add('active'), 100);
  setTimeout(() => { toast.classList.remove('active'); setTimeout(() => toast.remove(), 300); }, duration);
}

function dismissSplash() {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => splash.style.display = 'none', 500);
  }
}

// ══════════════════════════════════════════════════════════
// CAIXA SPECIFIC UTILS
// ══════════════════════════════════════════════════════════
function addAnotacao(c) {
  const wrap = document.getElementById(`${c}-anots-wrap`);
  if (!wrap) return;
  const num = wrap.children.length + 1;
  const div = document.createElement('div');
  div.className = 'anot-row';
  div.innerHTML = `<span class="anot-num">${num}.</span><input type="text" class="anot-input" placeholder="Observação..." oninput="atualizarNumAnots('${c}')"><button class="btn btn-ghost btn-ghost-danger" style="padding:4px 8px;font-size:12px;" onclick="removeAnotacao(this,'${c}')"><i data-lucide="x" style="width:12px;"></i></button>`;
  wrap.appendChild(div);
  if (window.lucide) lucide.createIcons();
}
function removeAnotacao(btn, c) { btn.parentElement.remove(); atualizarNumAnots(c); triggerCalc(`${c}-anot`); }
function atualizarNumAnots(c) {
  const wrap = document.getElementById(`${c}-anots-wrap`);
  if (!wrap) return;
  const rows = wrap.querySelectorAll('.anot-row');
  rows.forEach((row, idx) => { row.querySelector('.anot-num').textContent = (idx + 1) + '.'; });
}

function toggleDetalhes(c, id) {
  const wrap = document.getElementById(`${c}-${id}-det-wrap`);
  const btn = document.getElementById(`btn-det-${c}-${id}`);
  if(wrap) {
    const isVisible = wrap.classList.toggle('active');
    btn.classList.toggle('active', isVisible);
  }
}

function addDetalhe(c, id) {
  const list = document.getElementById(`${c}-${id}-det-list`);
  if (!list) return;
  const div = document.createElement('div');
  div.className = 'detalhe-row';
  div.innerHTML = `<input type="text" autocomplete="off" class="field-input math-input detalhe-input" placeholder="0,00" oninput="sumDetalhes('${c}','${id}')"><button class="btn btn-ghost btn-ghost-danger" onclick="removeDetalhe(this,'${c}','${id}')"><i data-lucide="trash-2" style="width:12px;"></i></button>`;
  list.appendChild(div);
  applyMathInputs();
  if (window.lucide) lucide.createIcons();
}

function removeDetalhe(btn, c, id) { btn.parentElement.remove(); sumDetalhes(c, id); }

function sumDetalhes(c, id) {
  const list = document.getElementById(`${c}-${id}-det-list`);
  const inputs = list.querySelectorAll('.detalhe-input');
  let total = 0;
  inputs.forEach(inp => {
    const val = parseFloat(inp.value.replace(/\./g,'').replace(',','.')) || 0;
    total += val;
  });
  const mainInput = document.getElementById(`${c}-${id}`);
  if (mainInput) {
    mainInput.value = fmtInput(total);
    mainInput.disabled = inputs.length > 0;
    mainInput.title = inputs.length > 0 ? "Desativado: soma dos recibos abaixo" : "";
    triggerCalc(`${c}-${id}`);
  }
}

function openMoedaModal(c) {
  activeCaixaForModal = c;
  document.getElementById('moedaModal').style.display = 'flex';
  const grid = document.getElementById('moeda-grid');
  grid.innerHTML = [50, 25, 10, 5, 1].map(v => `<div class="moeda-item"><img src="https://img.icons8.com/color/48/000000/coins.png" width="24"><span>R$ 0,${v.toString().padStart(2,'0')}</span><input type="number" class="moeda-qty-input" data-val="${v/100}" placeholder="0" oninput="calcMoedaModal()"></div>`).join('');
  document.getElementById('moeda-total-display').textContent = 'R$ 0,00';
}
function calcMoedaModal() {
  let tot = 0;
  document.querySelectorAll('.moeda-qty-input').forEach(i => tot += (parseInt(i.value)||0) * parseFloat(i.getAttribute('data-val')));
  document.getElementById('moeda-total-display').textContent = fmt(tot);
}
function confirmMoeda() {
  const tot = document.getElementById('moeda-total-display').textContent.replace('R$ ','');
  const input = document.getElementById(`${activeCaixaForModal}-moeda`);
  if (input) { input.value = tot; triggerCalc(`${activeCaixaForModal}-moeda`); }
  closeMoedaModal();
}
function closeMoedaModal() { document.getElementById('moedaModal').style.display = 'none'; }

function limparCaixa(c) {
  if(!confirm(`Deseja limpar todos os lançamentos do caixa ${c}?`)) return;
  const page = document.getElementById(`page-${c}`);
  if(!page) return;
  page.querySelectorAll('input').forEach(i => i.value = '');
  const anots = document.getElementById(`${c}-anots-wrap`);
  if(anots) anots.innerHTML = '';
  const detLists = page.querySelectorAll('[id$="-det-list"]');
  detLists.forEach(l => l.innerHTML = '');
  addAnotacao(c);
  calcularCaixa(c);
  showToast("Caixa limpo!");
}

async function aplicarSaldoProximoDia(c) {
  if (!activeOperator) return;
  const currentValStr = document.getElementById(`${c}-saldo-remanescente`).value;
  if (!currentValStr || currentValStr === '0,00') {
    showToast("Informe um valor de saldo remanescente primeiro.", 3000, true);
    return;
  }

  const currentDate = document.getElementById('mainDate').value;
  const d = new Date(currentDate + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  const nextDate = d.toISOString().split('T')[0];
  const nextDateFormatted = d.toLocaleDateString('pt-BR');

  // No more localStorage. Update Firebase directly for the next day.
  if(!currentCartorioId) return;
  
  await db.ref(`cartorios/${currentCartorioId}/caixas/${nextDate}/${c}/abertura`).set(currentValStr);
  
  const statusEl = document.getElementById(`${c}-saldo-status`);
  if(statusEl) statusEl.textContent = `✓ Saldo enviado para ${nextDateFormatted}`;
  showToast(`✓ Fundo de ${nextDateFormatted} definido!`);
}

// ══════════════════════════════════════════════════════════
// PDF GENERATION
// ══════════════════════════════════════════════════════════
function gerarPDF() {
  if (currentPlano === 'basico') {
    showToast('⚠️ A Geração de PDF é um recurso exclusivo do Plano Profissional.', 5000, true);
    return;
  }
  const { jsPDF } = window.jspdf; const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' }); 
  const data = coletarDados(); const dateStr = document.getElementById('mainDate').value.split('-').reverse().join('/');
  const W = 210, M = 15; let y = 0;
  
  const bg = (r,g,b) => doc.setFillColor(r,g,b); const fc = (r,g,b) => doc.setTextColor(r,g,b); const fs = (sz,b=false) => { doc.setFontSize(sz); doc.setFont('helvetica', b?'bold':'normal'); };
  const txt = (t, x, yy, o) => doc.text(t, x, yy, o); const addY = (dy) => y += dy;
  const checkPage = (n=20) => { if (y+n > 280) { doc.addPage(); y = 15; } };
  
  // Header
  y = 15; bg(59, 130, 246); doc.rect(0, 0, W, 35, 'F');
  fc(255, 255, 255); fs(20, true); txt(cartorioGlobalName.toUpperCase(), M, 18);
  fs(10); txt(`FECHAMENTO DIÁRIO — DATA: ${dateStr}`, M, 26);
  txt(`Operador: ${activeOperator ? activeOperator.nome : 'N/A'}`, W-M, 26, {align:'right'});
  
  y = 45;
  // Totais Gerais
  fs(12, true); fc(40, 40, 40); txt("RESUMO GERAL DO DIA", M, y); addY(8);
  doc.setDrawColor(200); doc.line(M, y, W-M, y); addY(8);
  
  fs(10, true); txt("Descrição", M, y); txt("Valor Líquido", W-M, y, {align:'right'}); addY(6);
  fs(10); 
  const totalGeral = document.getElementById('g-sum-tot').textContent;
  txt("Total Geral Consolidado", M, y); txt(totalGeral, W-M, y, {align:'right'}); addY(6);
  
  checkPage(); addY(10);
  fs(12, true); txt("FECHAMENTO POR CAIXA", M, y); addY(8);
  
  CAIXAS.forEach(cfg => {
    checkPage(40);
    doc.setDrawColor(230); doc.line(M, y, W-M, y); addY(8);
    fs(11, true); fc(59, 130, 246); txt(cfg.nome, M, y);
    const cTot = document.getElementById(`tb-${cfg.id}`).textContent;
    txt(cTot, W-M, y, {align:'right'}); addY(6);
    
    fs(9); fc(80, 80, 80);
    const din = document.getElementById(`g-${cfg.id}-din`).textContent;
    const maq = document.getElementById(`g-${cfg.id}-tot`).textContent; // Placeholder logic
    txt("Dinheiro Físico:", M+5, y); txt(din, W-M-20, y, {align:'right'}); addY(5);
    txt("Total Líquido:", M+5, y); txt(cTot, W-M-20, y, {align:'right'}); addY(8);
  });
  
  doc.save(`Fechamento_${dateStr.replace(/\//g,'-')}.pdf`);
  showToast("PDF gerado com sucesso!");
}
