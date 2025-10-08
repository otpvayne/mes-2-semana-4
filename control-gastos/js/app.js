// ===== Utilidades =====
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const STORAGE_KEY = 'financeTransactions';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

function showToast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('toast--show');
  setTimeout(() => el.classList.remove('toast--show'), 1600);
}

// Errores por campo / global y loading en botones
function setFieldError(input, msg){
  const id = input.id;
  const errEl = document.getElementById(`err-${id}`);
  if(errEl){ errEl.textContent = msg || ""; }
  input.classList.toggle('input--invalid', Boolean(msg));
  if(msg){ input.classList.add('shake'); setTimeout(()=>input.classList.remove('shake'), 350); }
}
function clearFieldErrors(suffix){
  ['desc','amount','date','descD','amountD','dateD'].forEach(k=>{
    const el = document.getElementById(k);
    if(!el) return;
    if(suffix && !k.endsWith(suffix)) return;
    setFieldError(el, "");
  });
}
function setGlobalError(scope, msg){
  const id = scope === 'desktop' ? 'err-global-d' : 'err-global-m';
  const el = document.getElementById(id);
  if(el) el.textContent = msg || '';
}
function setButtonLoading(btn, isLoading){
  if(!btn) return;
  btn.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  btn.disabled = !!isLoading;
}

// ===== Estado =====
let transactions = [];

// Cargar/guardar estado
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    transactions = raw ? JSON.parse(raw) : [];
  } catch {
    transactions = [];
  }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// ===== Render =====
function renderBalance() {
  const income = transactions.filter(t => t.type === 'income').reduce((s,t)=>s+t.amount,0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s,t)=>s+t.amount,0);
  const balance = income - expenses;

  const valEl = $('#balanceValue');
  const noteEl = $('#balanceNote');
  valEl.textContent = formatCurrency(balance);
  valEl.classList.toggle('green', balance >= 0);
  valEl.classList.toggle('red', balance < 0);
  noteEl.textContent = balance >= 0 ? 'Tienes un balance positivo' : 'Tienes un balance negativo';

  // Totales (mobile + desktop)
  $('#totalIncomeMobile').textContent   = formatCurrency(income);
  $('#totalExpensesMobile').textContent = formatCurrency(expenses);
  $('#totalIncomeDesktop').textContent  = formatCurrency(income);
  $('#totalExpensesDesktop').textContent= formatCurrency(expenses);
}

function renderHistory() {
  const sorted = [...transactions].sort((a,b)=> new Date(b.date) - new Date(a.date));

  const containers = [
    {list: $('#historyMobile'), empty: $('#emptyMobile')},
    {list: $('#historyDesktop'), empty: $('#emptyDesktop')}
  ];

  containers.forEach(({list, empty})=>{
    list.innerHTML = '';
    if(sorted.length === 0){
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    sorted.forEach(t=>{
      const row = document.createElement('div');
      row.className = 'item';

      const icon = document.createElement('div');
      icon.innerHTML = t.type === 'income'
        ? '<svg class="icon green" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg class="icon red" viewBox="0 0 24 24"><path d="M21 7l-6 6-4-4-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      const body = document.createElement('div');
      body.style.flex = '1';

      const top = document.createElement('div');
      top.style.display = 'flex';
      top.style.gap = '.5rem';
      top.style.alignItems = 'center';
      const title = document.createElement('span');
      title.textContent = t.description;
      const badge = document.createElement('span');
      badge.className = 'badge ' + (t.type === 'income' ? 'badge--income' : 'badge--expense');
      badge.textContent = t.type === 'income' ? 'Ingreso' : 'Gasto';
      top.append(title, badge);

      const meta = document.createElement('div');
      meta.className = 'item__meta';
      meta.innerHTML = `
        ${formatDate(t.date)} &nbsp; • &nbsp;
        <span class="${t.type === 'income' ? 'green' : 'red'}"><strong>${t.type==='income' ? '+' : '-'}${formatCurrency(t.amount)}</strong></span>
      `;

      body.append(top, meta);

      const actions = document.createElement('div');
      const del = document.createElement('button');
      del.className = 'icon-btn icon-btn--danger';
      del.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M3 6h18M8 6l1-2h6l1 2M6 6l1 14h10l1-14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      del.title = 'Eliminar';
      del.addEventListener('click', ()=> {
        transactions = transactions.filter(x=>x.id !== t.id);
        save(); renderAll(); showToast('Transacción eliminada');
      });
      actions.appendChild(del);

      row.append(icon, body, actions);
      list.appendChild(row);
    });
  });
}

function renderAll(){
  renderBalance();
  renderHistory();
}

// ===== Validaciones =====
function validateTx({description, amount, date}){
  const errors = {};
  const descMin = 3, descMax = 80;

  // Descripción
  if(!description || !description.trim()){
    errors.desc = "La descripción es obligatoria.";
  } else if(description.trim().length < descMin){
    errors.desc = `Mínimo ${descMin} caracteres.`;
  } else if(description.trim().length > descMax){
    errors.desc = `Máximo ${descMax} caracteres.`;
  }

  // Monto
  if(amount === "" || amount === null || amount === undefined){
    errors.amount = "El monto es obligatorio.";
  } else {
    const num = Number(amount);
    if(!Number.isFinite(num)){
      errors.amount = "Monto inválido.";
    } else if(num === 0){
      errors.amount = "El monto no puede ser 0.";
    } else {
      // Máx 2 decimales
      const parts = String(amount).split('.');
      if(parts[1] && parts[1].length > 2){
        errors.amount = "Máximo 2 decimales.";
      }
      // Límite razonable
      if(Math.abs(num) > 1_000_000_000){
        errors.amount = "Monto excesivo.";
      }
    }
  }

  // Fecha (opcional) no futura
  if(date){
    const d = new Date(date + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    if(isNaN(d.getTime())) errors.date = "Fecha inválida.";
    else if(d > today) errors.date = "La fecha no puede ser futura.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ===== Acciones =====
function addTransaction({description, amount, date}) {
  const numeric = parseFloat(amount);
  if (Number.isNaN(numeric)) return;

  const tx = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,9),
    description: description.trim(),
    amount: Math.abs(numeric),
    date: date || new Date().toISOString().split('T')[0],
    type: numeric >= 0 ? 'income' : 'expense'
  };
  transactions.push(tx);
  save();
  renderAll();
  showToast(`${tx.type === 'income' ? 'Ingreso' : 'Gasto'} agregado correctamente`);
}

function clearAll(){
  transactions = [];
  localStorage.removeItem(STORAGE_KEY);
  renderAll();
  showToast('Todos los datos han sido eliminados');
}

function addTransactionValidated({description, amount, date}, scope, submitBtn){
  const {valid, errors} = validateTx({description, amount, date});
  // pinta errores por scope
  const suffix = scope === 'desktop' ? 'D' : '';
  setGlobalError(scope, "");
  clearFieldErrors(suffix);

  // Asigna errores por campo
  const descInput = document.getElementById('desc'+suffix);
  const amountInput = document.getElementById('amount'+suffix);
  const dateInput = document.getElementById('date'+suffix);
  if(errors.desc)   setFieldError(descInput, errors.desc);
  if(errors.amount) setFieldError(amountInput, errors.amount);
  if(errors.date)   setFieldError(dateInput, errors.date);

  if(!valid){
    setGlobalError(scope, "Revisa los campos marcados en rojo.");
    (errors.desc ? descInput : (errors.amount ? amountInput : dateInput)).focus();
    return;
  }

  // Loading breve para feedback visual
  setButtonLoading(submitBtn, true);
  setTimeout(()=>{
    addTransaction({description, amount, date});
    setButtonLoading(submitBtn, false);
  }, 350);
}

function clearAllWithFeedback(btn){
  setButtonLoading(btn, true);
  setTimeout(()=>{
    clearAll();
    setButtonLoading(btn, false);
  }, 300);
}

// ===== Formularios (mobile y desktop) =====
function wireForm(formEl, ids){
  const desc = $('#'+ids.desc);
  const amount = $('#'+ids.amount);
  const date = $('#'+ids.date);
  const btn = formEl.querySelector('button[type="submit"], .btn');

  // fecha default hoy + limitar futuro
  const todayStr = new Date().toISOString().split('T')[0];
  date.value = todayStr;
  date.max = todayStr;

  // Limpia error al tipear y al salir
  [desc, amount, date].forEach(inp=>{
    inp.addEventListener('input', ()=> setFieldError(inp, ""));
    inp.addEventListener('blur', ()=> setFieldError(inp, ""));
  });

  // Evita Enter que dispara submit desde inputs
  formEl.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault();
  });

  formEl.addEventListener('submit', (e)=>{
    e.preventDefault();
    addTransactionValidated({
      description: desc.value,
      amount: amount.value,
      date: date.value
    }, ids.desc.endsWith('D') ? 'desktop' : 'mobile', btn);

    // Reset básico tras intento
    desc.value = '';
    amount.value = '';
    date.value = todayStr;
    desc.focus();
  });
}

// Botones limpiar con feedback
function wireClearButtons(){
  const m = $('#clearBtnMobile');
  const d = $('#clearBtnDesktop');
  m.addEventListener('click', ()=> clearAllWithFeedback(m));
  d.addEventListener('click', ()=> clearAllWithFeedback(d));
}

// ===== Tema oscuro =====
function initTheme(){
  const key='fin-theme';
  const saved = localStorage.getItem(key);
  if(saved){ document.body.classList.toggle('dark', saved === 'dark'); }
  const btn = $('#themeToggle');
  const label = $('#themeLabel');
  const setIcon = ()=> label.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  setIcon();
  btn.addEventListener('click', ()=>{
    document.body.classList.toggle('dark');
    localStorage.setItem(key, document.body.classList.contains('dark') ? 'dark':'light');
    setIcon();
  });
}

// ===== Inicio =====
load();
document.addEventListener('DOMContentLoaded', ()=>{
  wireForm($('#txForm'),        {desc:'desc',  amount:'amount',  date:'date'});
  wireForm($('#txFormDesktop'), {desc:'descD', amount:'amountD', date:'dateD'});
  wireClearButtons();
  initTheme();
  renderAll();
});
