// ═══ LANÇAMENTOS INDIVIDUAIS ═══
function toggleDetalhes(c, id) {
  const wrap = document.getElementById(`${c}-${id}-det-wrap`);
  const btn = document.getElementById(`btn-det-${c}-${id}`);
  if(!wrap) return;
  wrap.classList.toggle('active');
  btn.classList.toggle('active');
}

function addDetalhe(c, id, val = '') {
  const list = document.getElementById(`${c}-${id}-det-list`);
  const row = document.createElement('div');
  row.className = 'detalhe-row';
  row.innerHTML = `<input type="text" class="detalhe-input" placeholder="0,00" oninput="calcDetalhes('${c}','${id}')"><button class="btn-ghost-danger" style="padding:6px; border-radius:4px; cursor:pointer;" onclick="removeDetalhe(this, '${c}', '${id}')" title="Remover"><i data-lucide="x" style="width:14px;height:14px;"></i></button>`;
  row.querySelector('.detalhe-input').value = val;
  list.appendChild(row);
  lucide.createIcons();
  
  if(val === '') {
    setTimeout(() => {
      const inputs = list.querySelectorAll('.detalhe-input');
      if(inputs.length > 0) inputs[inputs.length - 1].focus();
    }, 50);
  }
  calcDetalhes(c, id);
}

function removeDetalhe(btnEl, c, id) {
  btnEl.parentElement.remove();
  calcDetalhes(c, id);
}

function calcDetalhes(c, id) {
  const list = document.getElementById(`${c}-${id}-det-list`);
  const mainInput = document.getElementById(`${c}-${id}`);
  const inputs = list.querySelectorAll('.detalhe-input');
  
  if (inputs.length === 0) {
    mainInput.disabled = false;
    mainInput.title = "";
  } else {
    mainInput.disabled = true;
    mainInput.title = "O valor está sendo somado automaticamente pela lista de recibos.";
    let sum = 0;
    inputs.forEach(inp => {
      const v = parseFloat(inp.value.replace(/\./g, '').replace(',', '.')) || 0;
      sum += v;
    });
    mainInput.value = sum.toLocaleString('pt-BR', {minimumFractionDigits:2});
  }
  calcularCaixa(c);
  salvarDadosDebounced();
}

// Removes multiple maquininha blocks code

function saveConfigCaixas() {
  if(!currentCartorioId) return;
  if(editingCaixas.length === 0) { alert("Você precisa ter pelo menos um caixa."); return; }
  if(editingOperadores.length === 0) { alert("Você precisa ter pelo menos um operador."); return; }
  
  editingLabels = {
    maquininha: document.getElementById('cfg-label-maq').value || 'Operadora',
    saida_patrimonial: document.getElementById('cfg-label-patrimonio').value || 'Retirada/Sócio'
  };

configOperadoresPodemDestravar = document.getElementById('cfg-lock-permission').checked;

  salvarDados(false); // Salva os dados financeiros pendentes antes de mudar a config

  
  Promise.all([
    db.ref('cartorios/' + currentCartorioId + '/config/caixas').set(editingCaixas),
    db.ref('cartorios/' + currentCartorioId + '/config/operadores').set(editingOperadores),
    db.ref('cartorios/' + currentCartorioId + '/config/labels').set(editingLabels),
    db.ref('cartorios/' + currentCartorioId + '/config/departamentos').set(editingDepartamentos),
    db.ref('cartorios/' + currentCartorioId + '/config/sistemas').set(editingSistemas),
    db.ref('cartorios/' + currentCartorioId + '/config/lockPermission').set(configOperadoresPodemDestravar)
  ]).then(() => {
    closeModal('settingsModal');
    softReloadUI();
    showToast('✓ Configurações salvas!');
  }).catch(e => {
    alert("Erro ao salvar configurações na nuvem: " + e.message);
    softReloadUI();
  });
}
