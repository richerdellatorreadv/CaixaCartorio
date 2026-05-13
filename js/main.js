// ══════════════════════════════════════════════════════════
// MATH INPUTS
// ══════════════════════════════════════════════════════════
function formatCurrencyInput(val) {
  let v = val.replace(/\D/g, ''); 
  if(v === '') return '';
  v = (parseInt(v) / 100).toFixed(2); 
  return v.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, "."); 
}

function applyMathInputs() {
  const sel = '.math-input, .detalhe-input, .nota-qty, .moeda-input';
  document.querySelectorAll(sel).forEach(input => {
    if(input._mathBound) return; input._mathBound = true;
    
    input.addEventListener('input', function() { 
      if (/[+\-*/]/.test(this.value)) {
        this.value = this.value.replace(/[^0-9+\-*/.,\s]/g, ''); 
      } else {
        if (!this.classList.contains('nota-qty')) {
          this.value = formatCurrencyInput(this.value);
        }
      }
      triggerCalc(this.id);
    });
    
    input.addEventListener('blur', function(e) {
      const prev = this.value;
      evaluateMath.call(this, e);
      if(this.value !== prev) { this.classList.remove('math-flashed'); void this.offsetWidth; this.classList.add('math-flashed'); }
    });
    
    input.addEventListener('keydown', function(e) {
      if(e.key === 'Enter') { evaluateMath.call(this, e); const inputs = Array.from(document.querySelectorAll('input:not([type="date"]):not([type="month"]):not([type="hidden"]):not([type="file"])')).filter(i => i.offsetParent !== null && !i.disabled); const idx = inputs.indexOf(document.activeElement); if(idx > -1 && idx < inputs.length - 1) inputs[idx + 1].focus(); }
    });
  });
}

function safeMathEval(expr) {
  const tokens = expr.match(/(\d+\.?\d*|[+\-*/])/g);
  if (!tokens || tokens.length === 0) return NaN;
  for (const t of tokens) { if (!/^(\d+\.?\d*|[+\-*/])$/.test(t)) return NaN; }
  let nums = [parseFloat(tokens[0])]; let ops = [];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]; const num = parseFloat(tokens[i + 1]);
    if (isNaN(num)) return NaN;
    if (op === '*') { nums[nums.length - 1] *= num; }
    else if (op === '/') { if (num === 0) return NaN; nums[nums.length - 1] /= num; }
    else { ops.push(op); nums.push(num); }
  }
  let result = nums[0];
  for (let i = 0; i < ops.length; i++) {
    if (ops[i] === '+') result += nums[i + 1];
    else if (ops[i] === '-') result -= nums[i + 1];
  }
  return result;
}

function evaluateMath(e) { let val = this.value.trim(); if(val === '') { triggerCalc(this.id); return; } let mathStr = val.replace(/\./g, '').replace(/,/g, '.'); try { if (/^[0-9+\-*/.\s]+$/.test(mathStr)) { let result = safeMathEval(mathStr); if (!isNaN(result) && isFinite(result)) this.value = fmtInput(result); } } catch(err) {} triggerCalc(this.id); }
function triggerCalc(id) { const c = id.split('-')[0]; if(CAIXAS.find(x => x.id === c)) calcularCaixa(c); else calcularTudo(); }

// ══════════════════════════════════════════════════════════
// LÓGICA DO CADEADO (FECHAMENTO DE DIA)
// ══════════════════════════════════════════════════════════
let isDayLocked = false;
let configOperadoresPodemDestravar = false;

function updateLockUI(locked) {
  isDayLocked = locked;
  const btn = document.getElementById('btn-lock-day');
  if(btn) {
    btn.innerHTML = locked 
      ? '<i data-lucide="lock" style="color:var(--accent-r)"></i> <span style="color:var(--accent-r)">Dia Fechado</span>' 
      : '<i data-lucide="unlock"></i> <span style="color:var(--text2)">Dia Aberto</span>';
    if(window.lucide) lucide.createIcons();
  }
  document.querySelectorAll('#pages-container input, #pages-container button:not(.tab-btn), .btn-detalhe-add').forEach(el => {
    if (el.classList.contains('btn-pdf') || el.id === 'btn-lock-day') return;
    el.disabled = locked;
    if(locked) el.style.opacity = '0.6'; else el.style.opacity = '1';
  });
}

async function toggleLockDay() {
  if(!activeOperator || !currentCartorioId) return;
  const dateStr = document.getElementById('mainDate').value;
  if (isDayLocked && activeOperator.id !== 'op_admin' && !configOperadoresPodemDestravar) {
    showToast("Apenas o Administrador pode destrancar dias fechados.", 4000, true);
    return;
  }
  const newState = !isDayLocked;
  try {
    await db.ref(`cartorios/${currentCartorioId}/caixas/${dateStr}/_locked`).set(newState);
    showToast(newState ? "🔒 Dia encerrado e trancado!" : "🔓 Dia reaberto para edições.");
  } catch(e) {
    showToast("Erro ao trancar/destrancar: " + e.message, 3000, true);
  }
}
