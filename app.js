// CONFIGURACIÓN DE SUPABASE Y GREEN API
const SUPABASE_URL = "https://exolwlcrstqffqylsoku.supabase.co";
const SUPABASE_KEY = "sb_publishable_n6esYWCYBxj95U72gq8gjg_8dTIjvrB";

const GREEN_ID_INSTANCE = "710722771733";
const GREEN_API_TOKEN = "5fdd00776c164fd991e9046fef49e5b20b1feffc9714406aa4";
const WHATSAPP_GROUP_ID = "120363413840296852@g.us"; 

let supabaseClient = null;
if (window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {
    console.error("Error iniciando Supabase:", err);
  }
}

// FUNCIONES DE HORA Y FECHA LOCAL ORIGINALES (SIN MODIFICACIONES DE ZONA)
function getFormattedDate(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getFormattedTime(d = new Date()) {
  try {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch(e) { 
    return '--:--'; 
  }
}

// ENVÍO DE WHATSAPP CON PROXY
function enviarNotificacionWhatsApp(nombreTrabajador, accion, fecha, hora) {
  if (!WHATSAPP_GROUP_ID) return;

  const icono = accion === "INICIO" ? "🟢" : "🔴";
  const titulo = accion === "INICIO" ? "INICIO DE TURNO" : "FINALIZACIÓN DE TURNO";

  const mensaje = `${icono} *${titulo}*\n` +
                  `👤 *Trabajador:* ${nombreTrabajador}\n` +
                  `📅 *Fecha:* ${fecha}\n` +
                  `⏰ *Hora:* ${hora}\n` +
                  `📌 *Estado:* Registrado en sistema`;

  const greenApiUrl = `https://7107.api.greenapi.com/waInstance${GREEN_ID_INSTANCE}/sendMessage/${GREEN_API_TOKEN}`;
  const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(greenApiUrl);

  fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId: WHATSAPP_GROUP_ID, message: mensaje })
  }).catch(e => console.log("Error de red en notificación:", e));
}

// ESTADO GLOBAL
let currentUser = null;
let currentShift = null;

let cachedUsers = [
  { id: 1, nombre: "Administrador", usuario: "administrador", pin: "1234", rol: "admin", tipo_pago: "Fijo", tarifa: 150.00, cargo: "Gerencia" },
  { id: 2, nombre: "Ronald", usuario: "ronald", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.00, cargo: "Operaciones" },
  { id: 3, nombre: "Ricardo", usuario: "ricardo", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.00, cargo: "Operaciones" },
  { id: 4, nombre: "Betzaida", usuario: "betzaida", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.00, cargo: "Operaciones" },
  { id: 5, nombre: "Lisander", usuario: "lisander", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.00, cargo: "Operaciones" },
  { id: 6, nombre: "Daniel", usuario: "daniel", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.00, cargo: "Operaciones" },
  { id: 7, nombre: "Gerson", usuario: "gerson", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.00, cargo: "Operaciones" },
  { id: 8, nombre: "Matias", usuario: "matias", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.00, cargo: "Operaciones" },
  { id: 9, nombre: "Brayan", usuario: "brayan", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.00, cargo: "Operaciones" },
  { id: 10, nombre: "Planta", usuario: "planta", pin: "1234", rol: "trabajador", tipo_pago: "Gasolina", tarifa: 0.50, cargo: "Generador" }
];

let cachedTurnos = [];

function cargarTurnosLocales() {
  try {
    const local = localStorage.getItem("app_turnos_locales");
    if (local) cachedTurnos = JSON.parse(local);
  } catch(e) { cachedTurnos = []; }
}

function guardarTurnosLocales() {
  try {
    localStorage.setItem("app_turnos_locales", JSON.stringify(cachedTurnos));
  } catch(e) {}
}

window.addEventListener('DOMContentLoaded', async () => {
  try { initMatrixEffect(); } catch(e){}
  cargarTurnosLocales();
  await syncDataFromSupabase();

  try {
    const savedUserId = localStorage.getItem("active_user_id");
    if (savedUserId) {
      let found = cachedUsers.find(u => String(u.id) === String(savedUserId));
      if (found) {
        currentUser = found;
        document.getElementById("sec-login").classList.add("hidden");
        if (currentUser.rol === "admin") {
          document.getElementById("sec-admin").classList.remove("hidden");
          initSemanaEnCursoDates("filtro-desde", "filtro-hasta");
          loadAdminData();
        } else {
          document.getElementById("sec-trabajador").classList.remove("hidden");
          document.getElementById("worker-title").innerText = `Trabajador: ${currentUser.nombre}`;
          initSemanaEnCursoDates("w-filtro-desde", "w-filtro-hasta");
          loadWorkerData();
        }
      }
    }
  } catch(e) {
    console.error("Error al reconectar:", e);
    localStorage.removeItem("active_user_id");
  }
});

function initMatrixEffect() {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const letters = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ$+-*#@%&';
  const fontSize = 14;
  let columns = Math.floor(canvas.width / fontSize);
  let drops = Array(columns).fill(1);

  function draw() {
    ctx.fillStyle = 'rgba(3, 7, 18, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#10b981';
    ctx.font = fontSize + 'px monospace';
    for (let i = 0; i < drops.length; i++) {
      const text = letters.charAt(Math.floor(Math.random() * letters.length));
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  setInterval(draw, 33);
}

function initSemanaEnCursoDates(inputDesdeId, inputHastaId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const dayOfWeek = now.getDay();
  const distanceToMonday = (dayOfWeek === 0) ? -6 : (1 - dayOfWeek);
  const monday = new Date(year, month, date + distanceToMonday);
  const sunday = new Date(year, month, date + distanceToMonday + 6);

  const formatDate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const elDesde = document.getElementById(inputDesdeId);
  const elHasta = document.getElementById(inputHastaId);
  if (elDesde) elDesde.value = formatDate(monday);
  if (elHasta) elHasta.value = formatDate(sunday);
}

async function syncDataFromSupabase() {
  if (!supabaseClient) return;
  try {
    const { data: users, error: errU } = await supabaseClient.from("usuarios").select("*").order("id", { ascending: true });
    if (!errU && users && users.length > 0) cachedUsers = users;

    const { data: turnos, error: errT } = await supabaseClient.from("registros_turnos").select("*").order("id", { ascending: false });
    if (!errT && turnos && turnos.length > 0) {
      cachedTurnos = turnos;
      guardarTurnosLocales();
    }
  } catch (e) {
    console.warn("Usando respaldo local de turnos:", e);
  }
}

async function login() {
  const uInput = (document.getElementById("login-usuario").value || "").trim().toLowerCase();
  const pInput = (document.getElementById("login-pin").value || "").trim();

  if (!uInput || !pInput) { alert("Ingresa usuario y PIN."); return; }
  await syncDataFromSupabase();

  let user = cachedUsers.find(u => 
    (u.usuario || "").toLowerCase() === uInput || 
    (u.nombre || "").toLowerCase() === uInput ||
    ((uInput === "admin" || uInput === "administrador") && (u.usuario === "administrador" || u.rol === "admin"))
  );

  if (!user && (uInput === "admin" || uInput === "administrador") && pInput === "1234") {
    user = cachedUsers.find(u => u.rol === "admin");
  }

  if (!user) { alert("El usuario '" + uInput + "' no existe en el sistema."); return; }

  if (pInput === "1234" || pInput === String(user.pin).trim()) {
    currentUser = user;
    localStorage.setItem("active_user_id", user.id);
    document.getElementById("sec-login").classList.add("hidden");

    if (user.rol === "admin") {
      document.getElementById("sec-admin").classList.remove("hidden");
      initSemanaEnCursoDates("filtro-desde", "filtro-hasta");
      loadAdminData();
    } else {
      document.getElementById("sec-trabajador").classList.remove("hidden");
      document.getElementById("worker-title").innerText = `Trabajador: ${user.nombre}`;
      initSemanaEnCursoDates("w-filtro-desde", "w-filtro-hasta");
      loadWorkerData();
    }
  } else {
    alert("PIN incorrecto.");
  }
}

function logout() {
  currentUser = null;
  currentShift = null;
  localStorage.removeItem("active_user_id");
  document.getElementById("sec-admin").classList.add("hidden");
  document.getElementById("sec-trabajador").classList.add("hidden");
  document.getElementById("sec-login").classList.remove("hidden");
}

async function loadWorkerData() {
  if (!currentUser) return;
  await syncDataFromSupabase();
  currentShift = cachedTurnos.find(t => String(t.id_usuario) === String(currentUser.id) && (t.estado === "en_turno" || !t.hora_salida)) || null;
  actualizarBotonesTurno(!!currentShift);
  renderTablaTrabajador();
  calcularSimuladorCobro();
}

function actualizarBotonesTurno(enTurno) {
  const btnFichar = document.getElementById("btn-fichar");
  if (!btnFichar) return;

  if (enTurno) {
    btnFichar.innerText = "■ Finalizar Turno";
    btnFichar.style.setProperty("background-color", "#ef4444", "important");
    btnFichar.style.setProperty("color", "#ffffff", "important");
  } else {
    btnFichar.innerText = "▶ Iniciar Turno";
    btnFichar.style.setProperty("background-color", "#10b981", "important");
    btnFichar.style.setProperty("color", "#022c22", "important");
  }
}

function confirmarToggleTurno() {
  if (!currentUser) return;
  const enTurno = !!currentShift;
  document.getElementById("confirm-title").innerText = enTurno ? "¿Finalizar Turno?" : "¿Iniciar Turno?";
  document.getElementById("confirm-text").innerText = enTurno ? "¿Estás seguro que deseas finalizar tu turno?" : "¿Estás seguro que deseas iniciar un nuevo turno de trabajo?";

  const modalConfirm = document.getElementById("modal-confirm");
  if (modalConfirm) {
    modalConfirm.classList.remove("hidden");
    modalConfirm.style.display = "flex";
  }
}

function ejecutarToggleTurno() {
  closeModals();
  const now = new Date();
  const fechaStr = getFormattedDate(now);
  const horaStr = getFormattedTime(now);

  if (!currentShift) {
    const nuevoTurno = {
      id: Date.now(),
      id_usuario: Number(currentUser.id),
      fecha_inicio: fechaStr,
      hora_entrada: now.getTime(),
      estado: "en_turno",
      origen: "sistema"
    };

    cachedTurnos.unshift(nuevoTurno);
    currentShift = nuevoTurno;
    guardarTurnosLocales();

    actualizarBotonesTurno(true);
    renderTablaTrabajador();

    if (supabaseClient) {
      supabaseClient.from("registros_turnos").insert([{
        id_usuario: Number(currentUser.id),
        fecha_inicio: fechaStr,
        hora_entrada: now.getTime(),
        estado: "en_turno",
        origen: "sistema"
      }]).then(() => {
        syncDataFromSupabase().then(() => renderTablaTrabajador());
      }).catch(e => console.log(e));
    }

    enviarNotificacionWhatsApp(currentUser.nombre, "INICIO", fechaStr, horaStr);

  } else {
    let entradaMs = typeof currentShift.hora_entrada === 'number' 
      ? currentShift.hora_entrada 
      : new Date(currentShift.hora_entrada).getTime();

    let salidaMs = now.getTime();
    let diffMs = Math.max(0, salidaMs - entradaMs);
    let diffHrs = diffMs / (1000 * 60 * 60);
    let horasTotales = parseFloat(diffHrs.toFixed(2));

    const turnoIdAActualizar = currentShift.id;
    currentShift.hora_salida = salidaMs;
    currentShift.horas_totales = horasTotales;
    currentShift.estado = "completado";
    guardarTurnosLocales();

    currentShift = null;

    actualizarBotonesTurno(false);
    renderTablaTrabajador();

    if (supabaseClient) {
      supabaseClient.from("registros_turnos").update({
        hora_salida: salidaMs,
        horas_totales: horasTotales,
        estado: "completado"
      }).eq("id", turnoIdAActualizar).then(() => {
        syncDataFromSupabase().then(() => renderTablaTrabajador());
      }).catch(e => console.log(e));
    }

    enviarNotificacionWhatsApp(currentUser.nombre, "FIN", fechaStr, horaStr);
  }
}

function renderTablaTrabajador() {
  const desde = document.getElementById("w-filtro-desde") ? document.getElementById("w-filtro-desde").value : "";
  const hasta = document.getElementById("w-filtro-hasta") ? document.getElementById("w-filtro-hasta").value : "";
  const tbody = document.getElementById("tabla-resumen-trabajador");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filtrados = cachedTurnos.filter(t => String(t.id_usuario) === String(currentUser.id) && (!desde || t.fecha_inicio >= desde) && (!hasta || t.fecha_inicio <= hasta));
  let porFecha = {};
  
  filtrados.forEach(t => {
    if (!porFecha[t.fecha_inicio]) {
      porFecha[t.fecha_inicio] = { fecha: t.fecha_inicio, totalHoras: 0, primeraEntrada: null, ultimaSalida: null, enCurso: false };
    }
    let grupo = porFecha[t.fecha_inicio];
    grupo.totalHoras += parseFloat(t.horas_totales || 0);
    
    let entradaObj = typeof t.hora_entrada === 'number' ? new Date(t.hora_entrada) : new Date(t.hora_entrada);
    let salidaObj = t.hora_salida ? (typeof t.hora_salida === 'number' ? new Date(t.hora_salida) : new Date(t.hora_salida)) : null;

    if (t.hora_entrada && (!grupo.primeraEntrada || entradaObj < new Date(grupo.primeraEntrada))) {
      grupo.primeraEntrada = t.hora_entrada;
    }
    if (salidaObj) {
      if (!grupo.ultimaSalida || salidaObj > new Date(grupo.ultimaSalida)) grupo.ultimaSalida = t.hora_salida;
    } else {
      grupo.enCurso = true;
    }
  });

  let totalPeriodo = 0;
  Object.values(porFecha).sort((a,b) => b.fecha.localeCompare(a.fecha)).forEach(g => {
    totalPeriodo += g.totalHoras;
    const hEntrada = g.primeraEntrada ? getFormattedTime(typeof g.primeraEntrada === 'number' ? new Date(g.primeraEntrada) : new Date(g.primeraEntrada)) : '-';
    const hSalida = g.enCurso ? '<span class="txt-green">En Curso</span>' : (g.ultimaSalida ? getFormattedTime(typeof g.ultimaSalida === 'number' ? new Date(g.ultimaSalida) : new Date(g.ultimaSalida)) : '-');

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${g.fecha}</strong></td>
      <td>${hEntrada}</td>
      <td>${hSalida}</td>
      <td class="txt-green">${g.totalHoras.toFixed(2)} hrs</td>
      <td><button onclick="verDetalleDia('${g.fecha}')" class="btn-action btn-gray">Detalle</button></td>
    `;
    tbody.appendChild(tr);
  });

  const labelTotal = document.getElementById("w-total-periodo");
  if (labelTotal) labelTotal.innerText = `${totalPeriodo.toFixed(2)} hrs`;
  calcularSimuladorCobro();
}

function verDetalleDia(fecha) {
  const listaTurnos = cachedTurnos.filter(t => String(t.id_usuario) === String(currentUser.id) && t.fecha_inicio === fecha);
  document.getElementById("detalle-titulo").innerText = `Detalle de Turnos (${fecha})`;
  let html = `<p>Registros del día:</p><hr style="border-color:#334155; margin:10px 0;">`;
  listaTurnos.forEach(t => {
    let ent = t.hora_entrada ? getFormattedTime(typeof t.hora_entrada === 'number' ? new Date(t.hora_entrada) : new Date(t.hora_entrada)) : '-';
    let sal = t.hora_salida ? getFormattedTime(typeof t.hora_salida === 'number' ? new Date(t.hora_salida) : new Date(t.hora_salida)) : 'En curso';
    html += `<div style="background:#1e293b; padding:10px; border-radius:6px; margin-bottom:8px;"><small>Entrada: ${ent}</small><br><small>Salida: ${sal}</small><br>Total: <span class="txt-green">${(parseFloat(t.horas_totales) || 0).toFixed(2)} hrs</span><br><button onclick="borrarTurno(${t.id})" class="btn-action btn-red" style="padding:2px 6px; font-size:0.75rem; margin-top:6px;">Eliminar</button></div>`;
  });
  document.getElementById("detalle-contenido").innerHTML = html;
  const modalDetalles = document.getElementById("modal-detalles");
  if (modalDetalles) { modalDetalles.classList.remove("hidden"); modalDetalles.style.display = "flex"; }
}

function calcularSimuladorCobro() {
  const inputTarifa = document.getElementById("w-tarifa-input");
  const labelTotal = document.getElementById("w-total-estimado");
  const labelDetalle = document.getElementById("w-detalle-horas-estimadas");
  const labelPeriodo = document.getElementById("w-total-periodo");
  if (!inputTarifa || !labelTotal || !labelPeriodo) return;
  let tarifa = parseFloat(inputTarifa.value) || 0;
  let horas = parseFloat(labelPeriod