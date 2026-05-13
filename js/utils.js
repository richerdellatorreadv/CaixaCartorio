// ══════════════════════════════════════════════════════════
// UTILITIES & FORMATTING
// ══════════════════════════════════════════════════════════
function setEl(id, val, cls) { 
  const el = document.getElementById(id); 
  if (el) {
    el.textContent = val;
    if(cls) el.className = cls;
  }
}
function fmt(v) { return (parseFloat(v)||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtInput(v) { return (parseFloat(v)||0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

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
