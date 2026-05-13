// ═══ CALCULATIONS ═══
function triggerFlash(elId, currentDiff, key) { const el = document.getElementById(elId); if(!el) return; const isZero = Math.abs(currentDiff) < 0.05; if(isZero && lastDiffs[key] !== true) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } lastDiffs[key] = isZero; }

function calcularCaixa(c) {
  let notas = 0; NOTAS.forEach(n => { const qty = parseInt(document.getElementById(`${c}-nota-${n.val}`)?.value || 0); const sub = qty * n.val; notas += sub; setEl(`${c}-nota-${n.val}-val`, fmt(sub), 'nota-sub' + (sub > 0 ? ' has-val' : '')); });
  const moeda = pv(`${c}-moeda`); setValAnim(`${c}-sub-din`, notas + moeda);
  const pix = pv(`${c}-pix`); const deb = pv(`${c}-debito`); const credB = pv(`${c}-credito`);
  const maqBruta = pix + deb + credB; setValAnim(`${c}-maq-bruta`, maqBruta);
  const taxa = pv(`${c}-taxa`); const maqLiq = maqBruta - taxa;
  setValAnim(`${c}-maq-liq`, maqLiq, maqLiq < -0.005 ? 'sub-row-val neg' : 'sub-row-val');
  const tot = (notas + moeda) + maqLiq + pv(`${c}-deposito`) - pv(`${c}-abertura`);
  
  setValAnim(`${c}-total-badge`, tot, tot < -0.005 ? 'total-display-val neg' : 'total-display-val');
  
  const imob = pv(`${c}-imob`);
  if (imob !== 0) {
    const diff = tot - imob;
    let st = diff > 0.01 ? 'warn' : (diff < -0.01 ? 'err' : 'ok');
    const compText = document.getElementById(`${c}-imob`).parentNode.parentNode.querySelector('.diff-info-sub').textContent;
    const dpOnly = compText.includes('Depósito');
    
    setEl(`${c}-diff-val`, (diff > 0.01 ? '+' : '') + fmt(diff), `diff-val ${st}`);
    setEl(`${c}-diff-label`, dpOnly ? (st==='ok'?'Depósito exato':st==='warn'?'Depósito MAIOR':'Depósito MENOR') : (st==='ok'?'Bateu':st==='warn'?'Sobrando (Caixa > Sist.)':'Faltando (Caixa < Sist.)'), `diff-info-label`);
    setEl(`${c}-diff-block`, '', `diff-block ${st}`);
  } else {
    setEl(`${c}-diff-val`, '—', 'diff-val dim');
    setEl(`${c}-diff-label`, 'Aguardando lançamento', 'diff-info-label');
    setEl(`${c}-diff-block`, '', 'diff-block');
  }
  calcularTudo();
}

function calcularTudo() {
  let sd=0, sp=0, scb=0, sde=0, stx=0, sdp=0, bt=0, vt=0, smaqB=0, smaqL=0, srem=0;
  let depsTotais = {};
  DEPARTAMENTOS.forEach(d => depsTotais[d.id] = 0);

  CAIXAS.forEach(cfg => {
    const c = cfg.id; let nts = 0; NOTAS.forEach(n => nts += parseInt(document.getElementById(`${c}-nota-${n.val}`)?.value || 0) * n.val);
    const din = nts + pv(`${c}-moeda`); 
    const pix = pv(`${c}-pix`); const deb = pv(`${c}-debito`); const credB = pv(`${c}-credito`); const taxa = pv(`${c}-taxa`);
    const maqB = pix + deb + credB; const maqL = maqB - taxa;
    const dep = pv(`${c}-deposito`); const aber = pv(`${c}-abertura`);
    
    const tot = din + maqL + dep - aber;
    bt += pv(`${c}-bernadete`); vt += pv(`${c}-vale`); srem += pv(`${c}-saldo-remanescente`);
    sd+=din; sp+=pix; scb+=credB; stx+=taxa; sde+=deb; sdp+=dep; smaqB+=maqB; smaqL+=maqL;
    
    if(depsTotais[cfg.tipo] !== undefined) depsTotais[cfg.tipo] += tot;
    setValAnim(`tb-${c}`, tot);
    
    setEl(`g-${c}-din`, fmt(din)); setEl(`g-${c}-pix`, fmt(pix)); setEl(`g-${c}-cred`, fmt(credB)); setEl(`g-${c}-taxa`, fmt(taxa)); setEl(`g-${c}-deb`, fmt(deb)); setEl(`g-${c}-dep`, fmt(dep)); 
    const totEl2 = document.getElementById(`g-${c}-tot`); if(totEl2) { totEl2.textContent = fmt(tot); totEl2.style.color = tot < -0.005 ? 'var(--accent-r)' : 'var(--accent-g)'; }
  });

  setEl('g-sum-din', fmt(sd)); setEl('g-sum-pix', fmt(sp)); setEl('g-sum-cred', fmt(scb)); setEl('g-sum-taxa', fmt(stx)); setEl('g-sum-deb', fmt(sde)); setEl('g-sum-dep', fmt(sdp));
  
  let geral = 0;
  const applyNegColor = (id, val) => { const el = document.getElementById(id); if(el) el.style.color = val < -0.005 ? 'var(--accent-r)' : ''; };

  DEPARTAMENTOS.forEach(d => {
    const t = depsTotais[d.id] || 0;
    geral += t;
    setValAnim(`g-dep-${d.id}-total`, t);
    applyNegColor(`g-dep-${d.id}-total`, t);
  });

  const sumTotEl = document.getElementById('g-sum-tot'); if(sumTotEl) { sumTotEl.textContent = fmt(geral); sumTotEl.style.color = geral < -0.005 ? 'var(--accent-r)' : 'var(--accent-g)'; }
  setValAnim('g-total-badge', geral); setValAnim('tb-geral', geral);
  setValAnim('g-bern-total', bt); setValAnim('g-vale-total', vt); 
  const fbEl = document.getElementById('fb-total-val'); if(fbEl) { fbEl.textContent = fmt(geral); fbEl.style.color = geral < -0.005 ? 'var(--accent-r)' : 'var(--accent-g)'; }
  updateFloatingActive();

  applyNegColor('g-total-badge', geral);
  applyNegColor('g-sum-tot', geral); applyNegColor('fb-total-val', geral);

  setValAnim('g-taxa-total', stx);
  setValAnim('g-maq-bruto-total', smaqB);
  setValAnim('g-maq-liq-total', smaqL);
  setValAnim('g-fisico-total', sd);
  setValAnim('g-dep-total-extra', sdp);
  setValAnim('g-remanescente-total', srem);

  setValAnim('g-maq-soma', smaqB);
  const maqFita = pv('maquininha-input'); const dbMaq = document.getElementById('g-maq-diff-block');
  if(maqFita > 0) {
    const dMaq = smaqB - maqFita;
    if(Math.abs(dMaq)<0.05){ if(dbMaq) dbMaq.className='diff-block ok'; setEl('g-maq-diff-label','Relatório Z conferido'); setEl('g-maq-diff-val','OK','diff-val ok'); triggerFlash('g-maq-diff-block',dMaq,'maq'); }
    else { if(dbMaq) dbMaq.className=dMaq>0?'diff-block warn':'diff-block err'; setEl('g-maq-diff-label',dMaq>0?'Sistema registrou mais que o Relatório Z':'Relatório Z maior que os caixas'); setEl('g-maq-diff-val',fmtSigned(dMaq),dMaq>0?'diff-val warn':'diff-val err'); lastDiffs['maq']=false; }
  } else { if(dbMaq) dbMaq.className='diff-block'; setEl('g-maq-diff-label','Aguardando Relatório de Redução Z'); setEl('g-maq-diff-val','—','diff-val dim'); lastDiffs['maq']=false; }

  if(myChart) { myChart.data.datasets[0].data = [sd, smaqL, sdp]; myChart.update(); }

  SISTEMAS.forEach(sys => {
    const sysVal = pv(`sys-input-${sys.id}`);
    const dbSys = document.getElementById(`g-diff-block-${sys.id}`);
    if (sysVal > 0) {
      let sumDeps = 0;
      sys.departamentos.forEach(d => sumDeps += depsTotais[d] || 0);
      const diffSys = sumDeps - sysVal;
      if (Math.abs(diffSys) < 0.05) { if(dbSys) dbSys.className = 'diff-block ok'; setEl(`g-diff-label-${sys.id}`, 'Conferido — Fechamento correto'); setEl(`g-diff-val-${sys.id}`, 'OK', 'diff-val ok'); triggerFlash(`g-diff-block-${sys.id}`, diffSys, `sys_${sys.id}`); }
      else { if(dbSys) dbSys.className = diffSys > 0 ? 'diff-block warn' : 'diff-block err'; setEl(`g-diff-label-${sys.id}`, diffSys > 0 ? 'Excedente nos caixas' : 'Diferença a menor'); setEl(`g-diff-val-${sys.id}`, fmtSigned(diffSys), diffSys > 0 ? 'diff-val warn' : 'diff-val err'); lastDiffs[`sys_${sys.id}`] = false; }
    } else {
      if(dbSys) dbSys.className = 'diff-block'; setEl(`g-diff-label-${sys.id}`, `Aguardando lançamento`); setEl(`g-diff-val-${sys.id}`, '—', 'diff-val dim'); lastDiffs[`sys_${sys.id}`] = false;
    }
  });
  
  salvarDadosDebounced();
  gerarResumoNatural();
}
