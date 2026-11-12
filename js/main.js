/* Cortile di Perdonatti — seletor de serviços, status aberto/fechado e detalhes de interface.
   ============================================================================================
   DADOS EDITÁVEIS. Fonte: agendamento online da casa (evama97.gendo.app) e Google Maps, em 12/11/2026.
   TODO-CLIENTE: confirmar valores, durações e textos de descrição (as descrições são sugestão da Patron).
   ============================================================================================ */
const WHATSAPP = '5519999560927';
const AGENDA_ONLINE = 'https://evama97.gendo.app/v2/#/';

// preco em reais, min em minutos
const SERVICOS = [
  { id: 'corte',      cat: 'cabelo',   nome: 'Corte',                         desc: 'O corte masculino da casa.',                          min: 30, preco: 80 },
  { id: 'freestyle',  cat: 'cabelo',   nome: 'Corte + Freestyle',             desc: 'Corte com desenho feito na máquina.',                 min: 45, preco: 90 },
  { id: 'longo',      cat: 'cabelo',   nome: 'Corte médio / longo',           desc: 'Mais tempo de cadeira para fios médios e longos.',    min: 75, preco: 100 },
  { id: 'raspar',     cat: 'cabelo',   nome: 'Raspar cabeça',                 desc: 'Cabeça raspada na máquina.',                          min: 15, preco: 55 },
  { id: 'pezinho',    cat: 'cabelo',   nome: 'Pézinho com lavagem',           desc: 'Acabamento do contorno entre um corte e outro.',      min: 15, preco: 35 },
  { id: 'penteado',   cat: 'cabelo',   nome: 'Penteado',                      desc: 'Finalização para sair pronto.',                       min: 15, preco: 50 },
  { id: 'barba',      cat: 'barba',    nome: 'Barba completa',                desc: 'Desenho, alinhamento e acabamento.',                  min: 30, preco: 80 },
  { id: 'camuflagem', cat: 'barba',    nome: 'Camuflagem de barba',           desc: 'Disfarça os fios brancos.',                           min: 15, preco: 40 },
  { id: 'hidbarba',   cat: 'barba',    nome: 'Hidratação de barba',           desc: 'Cuidado rápido para a barba.',                        min: 5,  preco: 40 },
  { id: 'sobrancelha',cat: 'cuidados', nome: 'Sobrancelha',                   desc: 'Limpeza e alinhamento.',                              min: 15, preco: 35 },
  { id: 'esfoliacao', cat: 'cuidados', nome: 'Esfoliação e hidratação',       desc: 'Com produtos Paul Mitchell.',                         min: 15, preco: 50 },
  { id: 'wella',      cat: 'cuidados', nome: 'Hidratação Wella',              desc: 'Hidratação com produtos Wella.',                      min: 15, preco: 55 },
  { id: 'nariz',      cat: 'cuidados', nome: 'Depilação de nariz',            desc: 'Remoção dos pelos do nariz.',                         min: 15, preco: 30 },
  { id: 'orelha',     cat: 'cuidados', nome: 'Depilação de orelha',           desc: 'Remoção dos pelos da orelha.',                        min: 15, preco: 30 },
];

// Combos publicados no agendamento online: aplicados sozinhos quando as duas partes são escolhidas.
const COMBOS = [
  { partes: ['raspar', 'barba'],     nome: 'Raspar + Barba',                 min: 45, preco: 115 },
  { partes: ['corte', 'barba'],      nome: 'Corte + Barba',                  min: 60, preco: 145 },
  { partes: ['corte', 'sobrancelha'],nome: 'Corte + Sobrancelha',            min: 45, preco: 100 },
  { partes: ['barba', 'hidbarba'],   nome: 'Barba + Hidratação de barba',    min: 45, preco: 110 },
  { partes: ['nariz', 'orelha'],     nome: 'Depilação nariz + orelha',       min: 15, preco: 50 },
];

// Horário (Google Maps, 12/11/2026). Índice = dia da semana (0 = domingo). Minutos desde 00:00.
const HORARIO = { 2: [480, 1170], 3: [480, 1170], 4: [480, 1170], 5: [480, 1170], 6: [480, 930] };
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/* ============================================================================================ */

document.documentElement.classList.add('js');
const $ = (s) => document.querySelector(s);
const reais = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const tempo = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`);
const porId = Object.fromEntries(SERVICOS.map((s) => [s.id, s]));

const escolhidos = new Set();
let categoria = 'cabelo';

/* ---------- lista de serviços ---------- */
const lista = $('#lista-servicos');
function desenhaLista() {
  lista.innerHTML = SERVICOS.filter((s) => s.cat === categoria).map((s) => {
    const on = escolhidos.has(s.id);
    return `<li class="item${on ? ' on' : ''}">
      <h3>${s.nome}</h3>
      <p>${s.desc}</p>
      <div class="item__meta"><span>${tempo(s.min)}</span><span>${reais(s.preco)}</span></div>
      <button type="button" data-id="${s.id}" aria-pressed="${on}" aria-label="${on ? 'Remover' : 'Agendar'} ${s.nome}">${on ? '✓ Escolhido' : 'Agendar'}</button>
    </li>`;
  }).join('');
}
lista.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-id]');
  if (!b) return;
  const id = b.dataset.id;
  escolhidos.has(id) ? escolhidos.delete(id) : escolhidos.add(id);
  desenhaLista();
  lista.querySelector(`[data-id="${id}"]`)?.focus();
  atualiza(true);
});

document.querySelectorAll('.abas button').forEach((aba) => {
  aba.addEventListener('click', () => {
    categoria = aba.dataset.cat;
    document.querySelectorAll('.abas button').forEach((a) => a.setAttribute('aria-selected', String(a === aba)));
    desenhaLista();
  });
});

/* ---------- resumo: aplica combos e monta a mensagem ---------- */
function calcula() {
  const resto = new Set(escolhidos);
  const linhas = [];
  let economia = 0;
  for (const c of COMBOS) {
    if (c.partes.every((p) => resto.has(p))) {
      const avulso = c.partes.reduce((t, p) => t + porId[p].preco, 0);
      economia += avulso - c.preco;
      c.partes.forEach((p) => resto.delete(p));
      linhas.push({ nome: c.nome, min: c.min, preco: c.preco, combo: true });
    }
  }
  SERVICOS.forEach((s) => { if (resto.has(s.id)) linhas.push({ nome: s.nome, min: s.min, preco: s.preco }); });
  return {
    linhas, economia,
    min: linhas.reduce((t, l) => t + l.min, 0),
    preco: linhas.reduce((t, l) => t + l.preco, 0),
  };
}

function atualiza(pulo) {
  const r = calcula();
  const tem = r.linhas.length > 0;
  $('#resumo-vazio').hidden = tem;
  $('#limpar').hidden = !tem;
  $('#resumo-totais').hidden = !tem;
  $('#resumo-itens').innerHTML = r.linhas.map((l) =>
    `<li><span>${l.nome}${l.combo ? '<small>Combo da casa</small>' : ''}</span><b>${reais(l.preco)}</b></li>`).join('');
  $('#total-tempo').textContent = tem ? tempo(r.min) : '—';
  $('#total-valor').textContent = tem ? reais(r.preco) : '—';
  const combo = $('#resumo-combo');
  combo.hidden = r.economia <= 0;
  combo.textContent = `Combo aplicado: você economiza ${reais(r.economia)}`;

  // sábado fecha 15h30: "fim do dia" não existe
  const dia = document.querySelector('input[name="dia"]:checked').value;
  const fim = document.querySelector('input[name="periodo"][value="no fim do dia"]');
  const sabado = dia === 'sábado';
  fim.disabled = sabado;
  if (sabado && fim.checked) document.querySelector('input[name="periodo"][value=""]').checked = true;
  $('#nota-sabado').hidden = !sabado;
  const periodo = document.querySelector('input[name="periodo"]:checked').value;

  // mensagem do WhatsApp
  let msg = 'Olá! Vim pelo site e quero agendar um horário na Cortile di Perdonatti.';
  if (tem) {
    msg += '\n\n' + r.linhas.map((l) => `• ${l.nome}`).join('\n');
    msg += `\n\nTempo estimado: ${tempo(r.min)}\nValor estimado: ${reais(r.preco)}`;
  }
  if (dia || periodo) msg += `\nPreferência: ${[dia, periodo].filter(Boolean).join(', ')}`;
  $('#btn-whats').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

  // botão flutuante acompanha a escolha
  const f = $('#flutuante');
  if (tem) {
    $('#flutuante-txt').textContent = `Continuar · ${escolhidos.size} ${escolhidos.size > 1 ? 'serviços' : 'serviço'} · ${reais(r.preco)}`;
    f.href = '#resumo'; f.removeAttribute('target');
  } else {
    $('#flutuante-txt').textContent = 'Agendar horário';
    f.href = AGENDA_ONLINE; f.target = '_blank';
  }
  if (pulo) { f.classList.remove('pulo'); void f.offsetWidth; f.classList.add('pulo'); }
}

$('#resumo').addEventListener('change', () => atualiza(false));
$('#limpar').addEventListener('click', () => { escolhidos.clear(); desenhaLista(); atualiza(false); });

/* ---------- aberto agora? (fuso de São Paulo, sem considerar feriados) ---------- */
function status() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  const hoje = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  const agora = Number(p.hour) * 60 + Number(p.minute);
  const hhmm = (m) => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
  const el = $('#status');
  const h = HORARIO[hoje];
  let texto;
  if (h && agora >= h[0] && agora < h[1]) {
    el.className = 'status aberto';
    texto = `Aberto · até ${hhmm(h[1])}`;
  } else {
    el.className = 'status fechado';
    if (h && agora < h[0]) texto = `Abre hoje às ${hhmm(h[0])}`;
    else {
      let d = hoje;
      do { d = (d + 1) % 7; } while (!HORARIO[d]);
      texto = `Abre ${d === (hoje + 1) % 7 ? 'amanhã' : DIAS[d]} às ${hhmm(HORARIO[d][0])}`;
    }
  }
  el.lastElementChild.textContent = texto;
  document.querySelector(`#horario tr[data-dia="${hoje}"]`)?.classList.add('hoje');
}

/* ---------- entrada suave das seções ---------- */
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  // o botão flutuante só aparece depois que o botão do topo sai da tela (evita dois botões iguais)
  // e também some quando os botões do resumo já estão na tela
  const aVista = new Set();
  const fab = new IntersectionObserver((es) => {
    es.forEach((e) => (e.isIntersecting ? aVista.add(e.target) : aVista.delete(e.target)));
    $('#flutuante').classList.toggle('oculto', aVista.size > 0);
  });
  document.querySelectorAll('.hero__acoes, .resumo__acoes').forEach((el) => fab.observe(el));
  document.querySelectorAll('.secao__cab,.resumo, .cartao, .sobre__texto, .sobre__pontos, .nota, .galeria, .local, .faq').forEach((el) => {
    el.classList.add('revela'); io.observe(el);
  });
}

desenhaLista();
atualiza(false);
status();
setInterval(status, 60000);
