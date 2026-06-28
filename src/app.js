/* ===================================================
   FINANÇAS PME — app.js
   Gestão financeira para pequenas empresas locais
   Leitura de notas e PIX via Claude Vision API
   =================================================== */

// ── Estado da aplicação ──────────────────────────────
let transacoes = [];
let nextId = 1;
let scanTipo = null;
let manualTipo = null;
let manualCat = 'Outros';
let filtroAtivo = 'todos';
let fluxoChart = null;
let config = { nome: 'Minha Empresa', apiKey: '' };

// ── Inicialização ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  carregarDados();
  setHoje('man-data');
  setHoje('scan-data');
  renderDash();
  atualizarTopbar();
});

function setHoje(id) {
  const hoje = new Date().toISOString().slice(0, 10);
  document.getElementById(id).value = hoje;
}

function carregarDados() {
  try {
    const dados = localStorage.getItem('financas-pme-transacoes');
    if (dados) transacoes = JSON.parse(dados);
    const cfg = localStorage.getItem('financas-pme-config');
    if (cfg) config = { ...config, ...JSON.parse(cfg) };
    if (transacoes.length > 0) {
      nextId = Math.max(...transacoes.map(t => t.id)) + 1;
    }
  } catch (e) {
    transacoes = [];
  }

}

function salvarDados() {
  localStorage.setItem('financas-pme-transacoes', JSON.stringify(transacoes));
}

function salvarConfig() {
  config.nome = document.getElementById('config-nome').value.trim() || 'Minha Empresa';
  config.apiKey = document.getElementById('config-apikey').value.trim();
  localStorage.setItem('financas-pme-config', JSON.stringify(config));
  atualizarTopbar();
  fecharConfigDirect();
  showToast('Configurações salvas!');
}

function atualizarTopbar() {
  document.getElementById('biz-name-display').textContent = config.nome;
  const initials = config.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  document.getElementById('avatar-initials').textContent = initials;
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const agora = new Date();
  document.getElementById('mes-display').textContent = meses[agora.getMonth()] + ' ' + agora.getFullYear();
}

// ── Navegação ─────────────────────────────────────────
function showTab(tab) {
  ['dash', 'scan', 'manual', 'hist'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
    document.getElementById('screen-' + t).classList.toggle('active', t === tab);
  });
  if (tab === 'dash') renderDash();
  if (tab === 'hist') renderHist();
}

// ── Dashboard ─────────────────────────────────────────
function fmt(v) {
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderDash() {
  const ent = transacoes.filter(t => t.tipo === 'entrada').reduce((a, t) => a + t.valor, 0);
  const sai = transacoes.filter(t => t.tipo === 'saida').reduce((a, t) => a + t.valor, 0);
  document.getElementById('saldo-display').textContent = fmt(ent - sai);
  document.getElementById('total-entradas-display').textContent = fmt(ent);
  document.getElementById('total-saidas-display').textContent = fmt(sai);
  const ultimos = [...transacoes].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);
  document.getElementById('ultimos-lista').innerHTML =
    ultimos.length ? ultimos.map(txHTML).join('') :
    '<div class="empty-state"><i class="ti ti-receipt"></i>Nenhum lançamento ainda.<br>Escaneie um documento ou lance manualmente.</div>';
  renderChart();
}

function txHTML(tx) {
  const badge = tx.origem === 'pix' ? '<span class="badge badge-pix">PIX</span>'
    : tx.origem === 'nota' ? '<span class="badge badge-nota">NF</span>'
    : '<span class="badge badge-manual">Manual</span>';
  const dataFmt = tx.data.split('-').reverse().join('/');
  const sinal = tx.tipo === 'entrada' ? '+' : '-';
  return `<div class="tx-item">
    <div class="tx-icon ${tx.tipo}">
      <i class="ti ti-${tx.tipo === 'entrada' ? 'arrow-up' : 'arrow-down'}"></i>
    </div>
    <div class="tx-info">
      <div class="tx-desc">${tx.desc}</div>
      <div class="tx-meta">${badge}<span>${tx.cat}</span><span>·</span><span>${dataFmt}</span></div>
    </div>
    <div class="tx-valor ${tx.tipo}">${sinal}${fmt(tx.valor)}</div>
  </div>`;
}

function renderChart() {
  const dias = [];
  const hoje = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    dias.push(d.toISOString().slice(0, 10));
  }
  const ents = dias.map(d => transacoes.filter(t => t.data === d && t.tipo === 'entrada').reduce((a, t) => a + t.valor, 0));
  const sais = dias.map(d => transacoes.filter(t => t.data === d && t.tipo === 'saida').reduce((a, t) => a + t.valor, 0));
  const labels = dias.map(d => { const [, m, dia] = d.split('-'); return dia + '/' + m; });
  const ctx = document.getElementById('fluxoChart').getContext('2d');
  if (fluxoChart) fluxoChart.destroy();
  fluxoChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Entradas', data: ents, backgroundColor: '#1baf7a', borderRadius: 4, borderSkipped: 'bottom' },
        { label: 'Saídas',   data: sais, backgroundColor: '#e34948', borderRadius: 4, borderSkipped: 'bottom' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#898781', maxRotation: 0 } },
        y: {
          grid: { color: '#e1e0d9' },
          ticks: {
            font: { size: 10 }, color: '#898781',
            callback: v => 'R$' + Math.round(v)
          },
          beginAtZero: true
        }
      }
    }
  });
}

// ── Scanner ───────────────────────────────────────────
function triggerUpload() {
  document.getElementById('file-input').click();
}

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    const b64full = ev.target.result;
    document.getElementById('upload-area').style.display = 'none';
    document.getElementById('ia-processing').style.display = 'block';
    document.getElementById('ia-result-area').style.display = 'none';
    const thumb = document.getElementById('img-preview');
    thumb.src = b64full;
    document.getElementById('img-thumb-wrap').style.display = 'block';
    const b64 = b64full.split(',')[1];
    callClaudeVision(b64, file.type);
  };
  reader.readAsDataURL(file);
}

async function callClaudeVision(b64, mimeType) {
  const apiKey = config.apiKey;
  if (!apiKey) {
    document.getElementById('ia-processing').style.display = 'none';
    document.getElementById('ia-result-area').style.display = 'block';
    document.getElementById('ia-obs').textContent =
      'Configure sua chave da API Claude nas configurações (ícone no topo) para usar a leitura automática por IA.';
    setTipo('saida');
    return;
  }

  const prompt = `Você é um assistente de gestão financeira para pequenas empresas brasileiras.
Analise esta imagem de documento financeiro (comprovante PIX, nota fiscal, recibo ou boleto).
Extraia as informações e responda SOMENTE em JSON válido, sem markdown, sem explicações extras, com este formato:
{
  "tipo_doc": "PIX" ou "Nota Fiscal" ou "Recibo" ou "Boleto" ou "Outro",
  "tipo_lancamento": "entrada" ou "saida",
  "valor": número em reais (ex: 150.00),
  "data": "YYYY-MM-DD",
  "descricao": "descrição curta (pagador/recebedor e motivo)",
  "observacao": "observação extra sobre o documento"
}
Se não conseguir ler algum campo, use null.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: b64 } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.content.map(c => c.text || '').join('');
    let parsed = null;
    try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); } catch (_) {}

    document.getElementById('ia-processing').style.display = 'none';
    document.getElementById('ia-result-area').style.display = 'block';

    if (parsed) {
      const hoje = new Date().toISOString().slice(0, 10);
      document.getElementById('scan-valor').value = parsed.valor || '';
      document.getElementById('scan-data').value = parsed.data || hoje;
      document.getElementById('scan-desc').value = parsed.descricao || '';
      document.getElementById('ia-obs').textContent = parsed.observacao || 'Documento processado com sucesso.';
      const badge = document.getElementById('doc-type-badge');
      const tipo = parsed.tipo_doc || 'Documento';
      badge.textContent = tipo;
      badge.className = 'badge ' + (tipo === 'PIX' ? 'badge-pix' : tipo === 'Nota Fiscal' ? 'badge-nota' : 'badge-manual');
      setTipo(parsed.tipo_lancamento === 'entrada' ? 'entrada' : 'saida');
    } else {
      document.getElementById('ia-obs').textContent = 'Não foi possível extrair todos os dados. Preencha manualmente.';
    }
  } catch (err) {
    document.getElementById('ia-processing').style.display = 'none';
    document.getElementById('ia-result-area').style.display = 'block';
    document.getElementById('ia-obs').textContent = 'Erro ao processar: ' + err.message;
  }
}

function setTipo(t) {
  scanTipo = t;
  document.getElementById('btn-entrada').className = 'tipo-btn' + (t === 'entrada' ? ' active-entrada' : '');
  document.getElementById('btn-saida').className = 'tipo-btn' + (t === 'saida' ? ' active-saida' : '');
}

function salvarScan() {
  const valor = parseFloat(document.getElementById('scan-valor').value);
  const data  = document.getElementById('scan-data').value;
  const desc  = document.getElementById('scan-desc').value.trim();
  if (!valor || valor <= 0) { showToast('Informe um valor válido'); return; }
  if (!data)  { showToast('Informe a data'); return; }
  if (!desc)  { showToast('Informe a descrição'); return; }
  if (!scanTipo) { showToast('Selecione Entrada ou Saída'); return; }
  const badge = document.getElementById('doc-type-badge');
  const orig = badge.textContent === 'PIX' ? 'pix'
    : badge.textContent === 'Nota Fiscal' ? 'nota' : 'manual';
  transacoes.push({ id: nextId++, tipo: scanTipo, valor, desc, data, cat: 'Outros', origem: orig });
  salvarDados();
  showToast('Lançamento salvo!');
  cancelarScan();
}

function cancelarScan() {
  document.getElementById('upload-area').style.display = 'block';
  document.getElementById('ia-result-area').style.display = 'none';
  document.getElementById('ia-processing').style.display = 'none';
  document.getElementById('img-thumb-wrap').style.display = 'none';
  document.getElementById('file-input').value = '';
  scanTipo = null;
  document.getElementById('btn-entrada').className = 'tipo-btn';
  document.getElementById('btn-saida').className = 'tipo-btn';
  document.getElementById('scan-valor').value = '';
  document.getElementById('scan-desc').value = '';
  setHoje('scan-data');
}

// ── Lançamento Manual ─────────────────────────────────
function setManualTipo(t) {
  manualTipo = t;
  document.getElementById('man-btn-entrada').className = 'tipo-btn' + (t === 'entrada' ? ' active-entrada' : '');
  document.getElementById('man-btn-saida').className = 'tipo-btn' + (t === 'saida' ? ' active-saida' : '');
}

function selectCat(el, cat) {
  manualCat = cat;
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

function salvarManual() {
  const valor = parseFloat(document.getElementById('man-valor').value);
  const data  = document.getElementById('man-data').value;
  const desc  = document.getElementById('man-desc').value.trim();
  if (!valor || valor <= 0) { showToast('Informe um valor válido'); return; }
  if (!data)  { showToast('Informe a data'); return; }
  if (!desc)  { showToast('Informe a descrição'); return; }
  if (!manualTipo) { showToast('Selecione Entrada ou Saída'); return; }
  transacoes.push({ id: nextId++, tipo: manualTipo, valor, desc, data, cat: manualCat, origem: 'manual' });
  salvarDados();
  document.getElementById('man-valor').value = '';
  document.getElementById('man-desc').value = '';
  setHoje('man-data');
  manualTipo = null;
  document.getElementById('man-btn-entrada').className = 'tipo-btn';
  document.getElementById('man-btn-saida').className = 'tipo-btn';
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('selected'));
  manualCat = 'Outros';
  showToast('Lançamento salvo!');
  showTab('dash');
}

// ── Histórico ─────────────────────────────────────────
function filtrar(el, tipo) {
  document.querySelectorAll('.filt-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  filtroAtivo = tipo;
  renderHist();
}

function renderHist() {
  let lista = [...transacoes].sort((a, b) => b.data.localeCompare(a.data));
  if (filtroAtivo !== 'todos') {
    if (filtroAtivo === 'entrada' || filtroAtivo === 'saida') {
      lista = lista.filter(t => t.tipo === filtroAtivo);
    } else {
      lista = lista.filter(t => t.origem === filtroAtivo);
    }
  }
  const totalEnt = lista.filter(t => t.tipo === 'entrada').reduce((a, t) => a + t.valor, 0);
  const totalSai = lista.filter(t => t.tipo === 'saida').reduce((a, t) => a + t.valor, 0);
  document.getElementById('resumo-hist').innerHTML = `
    <div style="display:flex;gap:8px;font-size:12px">
      <span style="color:#1baf7a;font-weight:500">↑ ${fmt(totalEnt)}</span>
      <span style="color:#898781">·</span>
      <span style="color:#e34948;font-weight:500">↓ ${fmt(totalSai)}</span>
      <span style="color:#898781">·</span>
      <span style="color:#52514e">${lista.length} lançamento${lista.length !== 1 ? 's' : ''}</span>
    </div>`;
  document.getElementById('hist-lista').innerHTML = lista.length
    ? lista.map(txHTML).join('')
    : '<div class="empty-state"><i class="ti ti-inbox"></i>Nenhum lançamento encontrado.</div>';
}

// ── Configurações ─────────────────────────────────────
function abrirConfig() {
  document.getElementById('config-nome').value = config.nome;
  document.getElementById('config-apikey').value = config.apiKey;
  document.getElementById('modal-config').style.display = 'flex';
}

function fecharConfigDirect() {
  document.getElementById('modal-config').style.display = 'none';
}

function fecharConfig(e) {
  if (e.target.id === 'modal-config') fecharConfigDirect();
}

// ── Toast ─────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
