// ══════════════════════════════════════════════════════════
// MATH INPUTS & GLOBAL HANDLERS
// ══════════════════════════════════════════════════════════
function applyMathInputs() {
  document.querySelectorAll('.math-input, .nota-qty').forEach(input => {
    if(input._bound) return; input._bound = true;
    input.addEventListener('blur', function() {
      if(this.classList.contains('nota-qty')) return;
      let val = this.value.replace(/\./g, '').replace(',', '.');
      try {
        if (/[+\-*/]/.test(val)) {
          let result = eval(val);
          if(!isNaN(result)) this.value = fmtInput(result);
        }
      } catch(e) {}
      const id = this.id.split('-')[0];
      if(CAIXAS.find(x => x.id === id)) calcularCaixa(id);
    });
  });
}

function triggerCalc(id) {
  const c = id.split('-')[0];
  if(CAIXAS.find(x => x.id === c)) calcularCaixa(c);
  else calcularTudo();
}

async function toggleLockDay() {
  const dateStr = document.getElementById('mainDate').value;
  const locked = document.getElementById('btn-lock-day').classList.toggle('locked');
  await db.ref(`cartorios/${currentCartorioId}/caixas/${dateStr}/_locked`).set(locked);
}
