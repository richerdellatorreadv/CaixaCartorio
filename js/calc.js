// ══════════════════════════════════════════════════════════
// CALCULATIONS
// ══════════════════════════════════════════════════════════
const pv = (id) => {
  const el = document.getElementById(id);
  if (!el) return 0;
  return parseFloat(el.value.replace(/\./g, '').replace(',', '.')) || 0;
};

function calcularCaixa(c) {
  let notas = 0; 
  NOTAS.forEach(n => { 
    const qty = parseInt(document.getElementById(`${c}-nota-${n.val}`)?.value || 0); 
    const sub = qty * n.val; 
    notas += sub; 
    setEl(`${c}-nota-${n.val}-val`, fmt(sub)); 
  });
  
  const moeda = pv(`${c}-moeda`); 
  const pix = pv(`${c}-pix`); 
  const deb = pv(`${c}-debito`); 
  const cred = pv(`${c}-credito`);
  const taxa = pv(`${c}-taxa`); 
  const dep = pv(`${c}-deposito`); 
  const aber = pv(`${c}-abertura`);
  
  const tot = (notas + moeda) + (pix + deb + cred - taxa) + dep - aber;
  setEl(`${c}-total-badge`, fmt(tot), tot < 0 ? 'total-display-val neg' : 'total-display-val');
  
  const imob = pv(`${c}-imob`);
  if (imob !== 0) {
    const diff = tot - imob;
    let st = Math.abs(diff) < 0.05 ? 'ok' : (diff > 0 ? 'warn' : 'err');
    setEl(`${c}-diff-val`, fmt(diff), `diff-val ${st}`);
    setEl(`${c}-diff-block`, '', `diff-block ${st}`);
  }
  calcularTudo();
}

function calcularTudo() {
  let geral = 0;
  CAIXAS.forEach(cfg => {
    const c = cfg.id;
    let nts = 0; NOTAS.forEach(n => nts += (parseInt(document.getElementById(`${c}-nota-${n.val}`)?.value || 0) * n.val));
    const tot = (nts + pv(`${c}-moeda`)) + (pv(`${c}-pix`) + pv(`${c}-debito`) + pv(`${c}-credito`) - pv(`${c}-taxa`)) + pv(`${c}-deposito`) - pv(`${c}-abertura`);
    geral += tot;
    setEl(`tb-${c}`, fmt(tot));
  });
  setEl('g-total-badge', fmt(geral));
  setEl('fb-total-val', fmt(geral));
  salvarDadosDebounced();
}
