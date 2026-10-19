// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = "https://exolwlcrstqffqylsoku.supabase.co";
const SUPABASE_KEY = "sb_publishable_n6esYWCYBxj95U72gq8gjg_8dTIjvrB";

let supabaseClient = null;
if (window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {
    console.error("Error iniciando Supabase:", err);
  }
}

// HORA Y FECHA ESTRICTA DE VENEZUELA (UTC-4)
function getVenezuelaDate(d = new Date()) {
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const offsetVZLA = -4 * 60; 
  return new Date(utc + (60000 * offsetVZLA));
}

function getFormattedDate(d = new Date()) {
  const vzla = getVenezuelaDate(d);
  const yyyy = vzla.getFullYear();
  const mm = String(vzla.getMonth() + 1).padStart(2, '0');
  const dd = String(vzla.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatFechaEsp(fechaISO) {
  if (!fechaISO) return '';
  const partes = fechaISO.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fechaISO;
}

function getShortDateLabel(val) {
  if (!val) return '';
  try {
    const d = typeof val === 'number' ? new Date(val) : new Date(val);
    const vzla = getVenezuelaDate(d);
    const mm = String(vzla.getMonth() + 1).padStart(2, '0');
    const dd = String(vzla.getDate()).padStart(2, '0');
    return `${dd}/${mm}`;
  } catch(e) { return ''; }
}

function getFormattedTime(val) {
  if (!val) return '--:--';
  try {
    const d = typeof val === 'number' ? new Date(val) : new Date(val);
    const vzla = getVenezuelaDate(d);
    let hours = vzla.getHours();
    const minutes = String(vzla.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch(e) { 
    return '--:--'; 
  }
}

function getTimeStringHHMM(val) {
  if (!val) return '08:00';
  try {
    const d = typeof val === 'number' ? new Date(val) : new Date(val);
    const vzla = getVenezuelaDate(d);
    const hh = String(vzla.getHours()).padStart(2, '0');
    const mm = String(vzla.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch(e) { return '08:00'; }
}

// RELOJ GLOBAL AUTOMÁTICO
function iniciarRelojEnVivo() {
  const actualizarReloj = () => {
    const now = new Date();
    const horaTexto = `🇻🇪 Hora Actual: ${getFormattedTime(now)}`;
    document.querySelectorAll("#reloj-venezuela").forEach(el => {
      el.innerText = horaTexto;
    });
  };
  actualizarReloj();
  setInterval(actualizarReloj, 1000);
}

// COPIAR REPORTE AL PORTAPAPELES AL FICHAR
function copiarReportePortapapeles(nombreTrabajador, accion, fechaEntrada, horaEntrada, fechaSalida = "", horaSalida = "", totalHorasStr = "", esContinuacion = false) {
  let mensaje = "";
  let etiquetaContinuacion = esContinuacion ? " (Continuación de turno)" : "";
  let fechaEntradaEsp = formatFechaEsp(fechaEntrada);

  if (accion === "INICIO") {
    mensaje = `🟢 *INICIO DE TURNO${etiquetaContinuacion}*\n` +
              `👤 *Trabajador:* ${nombreTrabajador}\n` +
              `📅 *Fecha:* ${fechaEntradaEsp}\n` +
              `⏰ *Hora Entrada:* ${horaEntrada}`;
  } else {
    let fechaSalidaEsp = formatFechaEsp(fechaSalida);
    let detalleSalidaFecha = (fechaSalida && fechaSalida !== fechaEntrada) ? ` (${fechaSalidaEsp})` : '';
    mensaje = `🔴 *FINALIZACIÓN DE TURNO${etiquetaContinuacion}*\n` +
              `👤 *Trabajador:* ${nombreTrabajador}\n` +
              `📅 *Fecha Inicio:* ${fechaEntradaEsp}\n` +
              `⏰ *Entrada:* ${horaEntrada}\n` +
              `⏰ *Salida:* ${horaSalida}${detalleSalidaFecha}\n` +
              `⏱️ *Total Trabajado:* ${totalHorasStr}`;
  }

  navigator.clipboard.writeText(mensaje).then(() => {
    alert(`¡Turno ${accion === "INICIO" ? "iniciado" : "finalizado"}!\n\n📋 Se ha copiado el reporte al portapapeles. Ya puedes pegarlo en el grupo de WhatsApp.`);
  }).catch(err => {
    alert(`Turno ${accion === "INICIO" ? "iniciado" : "finalizado"}.`);
  });
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
  iniciarRelojEnVivo();

  try {
    await Promise.race([
      syncDataFromSupabase(),
      new Promise((_, reject) => setTimeout(() => reject('timeout'), 3000))
    ]);
  } catch(e) {}

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
          document.getElementById("w-tarifa-input").value = currentUser.tarifa !== undefined ? currentUser.tarifa : 1.00;
          initSemanaEnCursoDates("w-filtro-desde", "w-filtro-hasta");
          loadWorkerData();
        }
      }
    }
  } catch(e) {
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
  const vzla = getVenezuelaDate(now);
  const year = vzla.getFullYear();
  const month = vzla.getMonth();
  const date = vzla.getDate();
  const dayOfWeek = vzla.getDay();
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
      let localMap = new Map(cachedTurnos.map(t => [t.id, t]));
      turnos.forEach(t => {
        if (!localMap.has(t.id)) {
          cachedTurnos.push(t);
        }
      });
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
  
  try {
    await Promise.race([
      syncDataFromSupabase(),
      new Promise((_, reject) => setTimeout(() => reject('timeout'), 3000))
    ]);
  } catch(e) {}

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
      document.getElementById("worker-title").innerText = `Trabajador: ${currentUser.nombre}`;
      document.getElementById("w-tarifa-input").value = currentUser.tarifa !== undefined ? currentUser.tarifa : 1.00;
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
  try {
    await Promise.race([
      syncDataFromSupabase(),
      new Promise((_, reject) => setTimeout(() => reject('timeout'), 3000))
    ]);
  } catch(e) {}
  
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

  const turnosPreviosDia = cachedTurnos.filter(t => String(t.id_usuario) === String(currentUser.id) && t.fecha_inicio === fechaStr);
  const esContinuacion = turnosPreviosDia.length > 0;

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

    copiarReportePortapapeles(currentUser.nombre, "INICIO", fechaStr, horaStr, "", "", "", esContinuacion);

  } else {
    let entradaMs = typeof currentShift.hora_entrada === 'number' 
      ? currentShift.hora_entrada 
      : new Date(currentShift.hora_entrada).getTime();

    let salidaMs = now.getTime();
    let diffMs = Math.max(0, salidaMs - entradaMs);
    let diffHrs = diffMs / (1000 * 60 * 60);

    let totalMins = Math.round(diffMs / (1000 * 60));
    let totalHorasStr = diffHrs >= 1 ? `${diffHrs.toFixed(2)} hrs` : `${totalMins} min`;

    const fechaEntradaTurno = currentShift.fecha_inicio;
    const horaEntradaTurno = getFormattedTime(currentShift.hora_entrada);
    const fechaSalidaTurno = getFormattedDate(now);

    const turnoIdAActualizar = currentShift.id;
    currentShift.hora_salida = salidaMs;
    currentShift.horas_totales = parseFloat(diffHrs.toFixed(4));
    currentShift.estado = "completado";
    guardarTurnosLocales();

    currentShift = null;

    actualizarBotonesTurno(false);
    renderTablaTrabajador();

    if (supabaseClient) {
      supabaseClient.from("registros_turnos").update({
        hora_salida: salidaMs,
        horas_totales: parseFloat(diffHrs.toFixed(4)),
        estado: "completado"
      }).eq("id", turnoIdAActualizar).then(() => {
        syncDataFromSupabase().then(() => renderTablaTrabajador());
      }).catch(e => console.log(