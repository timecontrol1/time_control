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

function getFormattedDateTime(val) {
  if (!val) return '--/--/---- --:--';
  try {
    const d = typeof val === 'number' ? new Date(val) : new Date(val);
    const vzla = getVenezuelaDate(d);
    const yyyy = vzla.getFullYear();
    const mm = String(vzla.getMonth() + 1).padStart(2, '0');
    const dd = String(vzla.getDate()).padStart(2, '0');
    let hours = vzla.getHours();
    const minutes = String(vzla.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${dd}-${mm}-${yyyy} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch(e) { 
    return '--/--/---- --:--'; 
  }
}

function getDateTimeLocalString(val) {
  if (!val) return '';
  try {
    const d = typeof val === 'number' ? new Date(val) : new Date(val);
    const vzla = getVenezuelaDate(d);
    const yyyy = vzla.getFullYear();
    const mm = String(vzla.getMonth() + 1).padStart(2, '0');
    const dd = String(vzla.getDate()).padStart(2, '0');
    const hh = String(vzla.getHours()).padStart(2, '0');
    const min = String(vzla.getMinutes()).padStart(2, '0');
    const sec = String(vzla.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}`;
  } catch(e) { return ''; }
}

function iniciarRelojEnVivo() {
  const actualizarReloj = () => {
    const now = new Date();
    const horaTexto = `🇻🇪 Hora Actual: ${getFormattedDateTime(now)}`;
    document.querySelectorAll("#reloj-venezuela").forEach(el => {
      el.innerText = horaTexto;
    });
  };
  actualizarReloj();
  setInterval(actualizarReloj, 1000);
}

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

let currentUser = null;
let currentShift = null;

let cachedUsers = [
  { id: 1, nombre: "Ángel", usuario: "administrador", pin: "1234", rol: "admin", tipo_pago: "Fijo", tarifa: 150.00, cargo: "Supervisor" },
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

window.addEventListener('DOMContentLoaded', () => {
  try { initMatrixEffect(); } catch(e){}
  cargarTurnosLocales();
  iniciarRelojEnVivo();

  syncDataFromSupabase();
  configurarRealtimeSupabase();
  setInterval(syncDataFromSupabase, 2000);

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

// ESCUCHA EN TIEMPO REAL DIRECTA CON SUPABASE
function configurarRealtimeSupabase() {
  if (!supabaseClient) return;
  try {
    supabaseClient
      .channel('public:registros_turnos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros_turnos' }, payload => {
        syncDataFromSupabase();
      })
      .subscribe();
  } catch (err) {
    console.warn("Realtime no disponible:", err);
  }
}

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
  if (elDesde && !elDesde.value) elDesde.value = formatDate(monday);
  if (elHasta && !elHasta.value) elHasta.value = formatDate(sunday);
}

// SINCRONIZACIÓN CORREGIDA Y UNIFICADA
async function syncDataFromSupabase() {
  if (!supabaseClient) return;
  try {
    const { data: users, error: errU } = await supabaseClient.from("usuarios").select("*").order("id", { ascending: true });
    if (!errU && users && users.length > 0) {
      // Filtrar y asegurar usuario único para el administrador "Ángel"
      let arrUnicos = [];
      users.forEach(u => {
        if (u.usuario === 'administrador' || u.rol === 'admin') {
          u.nombre = "Ángel";
          if (!arrUnicos.some(x => x.usuario === 'administrador' || x.rol === 'admin')) {
            arrUnicos.push(u);
          }
        } else {
          arrUnicos.push(u);
        }
      });
      cachedUsers = arrUnicos;
    }

    const { data: turnosRemote, error: errT } = await supabaseClient.from("registros_turnos").select("*").order("hora_entrada", { ascending: false });
    if (!errT && turnosRemote) {
      let mapTurnos = new Map();
      
      cachedTurnos.forEach(t => mapTurnos.set(String(t.id), t));
      turnosRemote.forEach(t => mapTurnos.set(String(t.id), t));
      
      cachedTurnos = Array.from(mapTurnos.values()).sort((a,b) => b.hora_entrada - a.hora_entrada);
      guardarTurnosLocales();

      if (currentUser) {
        if (currentUser.rol === "admin") loadAdminData();
        else loadWorkerData();
      }
    }
  } catch (e) {
    console.warn("Sincronización Supabase:", e);
  }
}

function login() {
  const uInput = (document.getElementById("login-usuario").value || "").trim().toLowerCase();
  const pInput = (document.getElementById("login-pin").value || "").trim();

  if (!uInput || !pInput) { alert("Ingresa usuario y PIN."); return; }

  let user = cachedUsers.find(u => 
    (u.usuario || "").toLowerCase() === uInput || 
    (u.nombre || "").toLowerCase() === uInput ||
    ((uInput === "admin" || uInput === "administrador" || uInput === "angel" || uInput === "ángel") && (u.usuario === "administrador" || u.rol === "admin"))
  );

  if (!user && (uInput === "admin" || uInput === "administrador" || uInput === "angel" || uInput === "ángel") && pInput === "1234") {
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

function loadWorkerData() {
  if (!currentUser) return;
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

async function ejecutarToggleTurno() {
  closeModals();
  const now = new Date();
  const fechaStr = getFormattedDate(now);
  const horaStr = getFormattedDateTime(now);

  const turnosPreviosDia = cachedTurnos.filter(t => String(t.id_usuario) === String(currentUser.id) && t.fecha_inicio === fechaStr);
  const esContinuacion = turnosPreviosDia.length > 0;

  if (!currentShift) {
    const nuevoLocal = {
      id: Date.now(),
      id_usuario: Number(currentUser.id),
      fecha_inicio: fechaStr,
      hora_entrada: now.getTime(),
      estado: "en_turno",
      origen: "sistema"
    };

    cachedTurnos.unshift(nuevoLocal);
    currentShift = nuevoLocal;
    guardarTurnosLocales();

    actualizarBotonesTurno(true);
    renderTablaTrabajador();

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from("registros_turnos").insert([{
          id_usuario: Number(currentUser.id),
          fecha_inicio: fechaStr,
          hora_entrada: now.getTime(),
          estado: "en_turno",
          origen: "sistema"
        }]).select();
        if (!error && data && data.length > 0) {
          cachedTurnos = cachedTurnos.filter(x => x.id !== nuevoLocal.id);
          cachedTurnos.unshift(data[0]);
          currentShift = data[0];
          guardarTurnosLocales();
        }
      } catch(e){}
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
    const horaEntradaTurno = getFormattedDateTime(currentShift.hora_entrada);
    const fechaSalidaTurno = getFormattedDate(now);

    currentShift.hora_salida = salidaMs;
    currentShift.horas_totales = parseFloat(diffHrs.toFixed(4));
    currentShift.estado = "completado";
    guardarTurnosLocales();

    const turnoIdAActualizar = currentShift.id;
    currentShift = null;

    actualizarBotonesTurno(false);
    renderTablaTrabajador();

    if (supabaseClient) {
      try {
        await supabaseClient.from("registros_turnos").update({
          hora_salida: salidaMs,
          horas_totales: parseFloat(diffHrs.toFixed(4)),
          estado: "completado"
        }).eq("id", turnoIdAActualizar);
      } catch(e){}
    }

    const esContinuacionSalida = turnosPreviosDia.length > 1;
    copiarReportePortapapeles(currentUser.nombre, "FIN", fechaEntradaTurno, horaEntradaTurno, fechaSalidaTurno, horaStr, totalHorasStr, esContinuacionSalida);
  }
}

// MOSTRAR HISTORIAL COMPLETO Y MANTENER VISIBLE TURNOS EN VIVO O ANTERIORES
function renderTablaTrabajador() {
  const desde = document.getElementById("w-filtro-desde") ? document.getElementById("w-filtro-desde").value : "";
  const hasta = document.getElementById("w-filtro-hasta") ? document.getElementById("w-filtro-hasta").value : "";
  const tbody = document.getElementById("tabla-resumen-trabajador");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filtrados = cachedTurnos.filter(t => {
    if (String(t.id_usuario) !== String(currentUser.id)) return false;
    if (t.estado === 'en_turno' || !t.hora_salida) return true; // Mostrar siempre el activo en vivo
    if (desde && t.fecha_inicio < desde) return false;
    if (hasta && t.fecha_inicio > hasta) return false;
    return true;
  }).sort((a,b) => b.hora_entrada - a.hora_entrada);

  let totalMinutosPeriodo = 0;

  filtrados.forEach(t => {
    let entMs = typeof t.hora_entrada === 'number' ? t.hora_entrada : new Date(t.hora_entrada).getTime();
    let salMs = t.hora_salida ? (typeof t.hora_salida === 'number' ? t.hora_salida : new Date(t.hora_salida).getTime()) : 0;
    
    let minsTurno = 0;
    if (entMs && salMs && salMs > entMs) {
      minsTurno = (salMs - entMs) / (1000 * 60);
    } else if (t.horas_totales) {
      minsTurno = parseFloat(t.horas_totales) * 60;
    }
    totalMinutosPeriodo += minsTurno;

    let horasTurno = minsTurno / 60;
    let horasDisplay = t.estado === 'en_turno' || !t.hora_salida ? '<span class="txt-green">Activo</span>' : (horasTurno >= 1 ? `${horasTurno.toFixed(2)} hrs` : `${Math.round(minsTurno)} min`);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${getFormattedDateTime(t.hora_entrada)}</td>
      <td>${t.hora_salida ? getFormattedDateTime(t.hora_salida) : '<span class="txt-green">Activo</span>'}</td>
      <td class="txt-green"><strong>${horasDisplay}</strong></td>
    `;
    tbody.appendChild(tr);
  });

  let totalHorasPeriodo = totalMinutosPeriodo / 60;
  const labelTotal = document.getElementById("w-total-periodo");
  if (labelTotal) {
    labelTotal.innerText = `${totalHorasPeriodo.toFixed(2)} hrs`;
  }
  calcularSimuladorCobro();
}

async function actualizarTarifaIndividualTrabajador(nuevaTarifa) {
  if (!currentUser) return;
  let tarifaVal = parseFloat(nuevaTarifa) || 0;
  currentUser.tarifa = tarifaVal;
  
  let userInCache = cachedUsers.find(u => String(u.id) === String(currentUser.id));
  if (userInCache) userInCache.tarifa = tarifaVal;

  if (supabaseClient) {
    try {
      await supabaseClient.from("usuarios").update({ tarifa: tarifaVal }).eq("id", currentUser.id);
    } catch(e) {}
  }
  calcularSimuladorCobro();
}

function calcularSimuladorCobro() {
  const inputTarifa = document.getElementById("w-tarifa-input");
  const labelTotal = document.getElementById("w-total-estimado");
  const labelDetalle = document.getElementById("w-detalle-horas-estimadas");
  const labelPeriodo = document.getElementById("w-total-periodo");
  if (!inputTarifa || !labelTotal || !labelPeriodo) return;
  let tarifa = parseFloat(inputTarifa.value) || 0;
  
  let match = labelPeriodo.innerText.match(/([0-9.]+)\s*hrs/);
  let horas = match ? parseFloat(match[1]) : (parseFloat(labelPeriodo.innerText) || 0);

  labelTotal.innerText = `$${(horas * tarifa).toFixed(2)}`;
  if (labelDetalle) labelDetalle.innerText = `Suma de ${horas.toFixed(2)} hrs`;
}

function loadAdminData() {
  renderTablaUsuariosAdmin();
  renderHistorialAdmin();
}

function renderTablaUsuariosAdmin() {
  const desde = document.getElementById("filtro-desde") ? document.getElementById("filtro-desde").value : "";
  const hasta = document.getElementById("filtro-hasta") ? document.getElementById("filtro-hasta").value : "";
  let d1 = desde ? new Date(desde) : new Date();
  let d2 = hasta ? new Date(hasta) : new Date();
  let semanas = Math.max(1, (Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1) / 7);

  const turnosFiltrados = cachedTurnos.filter(t => (!desde || t.fecha_inicio >= desde) && (!hasta || t.fecha_inicio <= hasta));
  const tbody = document.getElementById("tabla-usuarios");
  if (!tbody) return;
  tbody.innerHTML = "";

  cachedUsers.forEach((u, index) => {
    let tarifaVal = u.tarifa !== undefined ? parseFloat(u.tarifa) : 1.0;
    let tipoPago = (u.tipo_pago || "Horas").trim();
    
    let totalMinsUser = 0;
    turnosFiltrados.filter(t => String(t.id_usuario) === String(u.id)).forEach(t => {
      let entMs = typeof t.hora_entrada === 'number' ? t.hora_entrada : new Date(t.hora_entrada).getTime();
      let salMs = t.hora_salida ? (typeof t.hora_salida === 'number' ? t.hora_salida : new Date(t.hora_salida).getTime()) : 0;
      if (entMs && salMs && salMs > entMs) {
        totalMinsUser += (salMs - entMs) / (1000 * 60);
      } else if (t.horas_totales) {
        totalMinsUser += parseFloat(t.horas_totales) * 60;
      }
    });
    let totalHoras = totalMinsUser / 60;
    
    let totalPagar = tipoPago === "Gasolina" ? (totalHoras * 1.4) * 0.50 : tipoPago === "Fijo" ? tarifaVal * semanas : totalHoras * tarifaVal;

    const pinId = `pin-text-${index}`;
    const btnId = `pin-btn-${index}`;
    const inputTarifaId = `tarifa-input-${u.id}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${u.nombre}</strong></td>
      <td><span id="${pinId}" data-pin="${u.pin}">••••</span><button id="${btnId}" onclick="togglePinVisibility('${pinId}', '${btnId}')" class="btn-icon" style="margin-left:5px;">👁️</button></td>
      <td>${tipoPago}</td>
      <td><input type="number" id="${inputTarifaId}" value="${tarifaVal.toFixed(2)}" step="0.1" style="width: 80px; padding: 4px;" onchange="actualizarTarifaUsuarioAdmin(${u.id}, this.value)"></td>
      <td>${u.cargo || 'Operaciones'}</td>
      <td class="txt-green"><strong>${tipoPago === 'Fijo' ? '-' : (totalHoras < 1 ? Math.round(totalMinsUser) + ' min' : totalHoras.toFixed(2) + ' hrs')}</strong></td>
      <td class="txt-green"><strong>$${totalPagar.toFixed(2)}</strong></td>
      <td>
        <button onclick="openEditarUsuarioModal(${u.id})" class="btn-icon">✏️</button>
        ${u.usuario !== 'admin' && u.usuario !== 'administrador' ? `<button onclick="borrarUsuario(${u.id})" class="btn-icon">🗑️</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function actualizarTarifaUsuarioAdmin(userId, nuevaTarifa) {
  let val = parseFloat(nuevaTarifa) || 0;
  let user = cachedUsers.find(u => String(u.id) === String(userId));
  if (user) {
    user.tarifa = val;
    if (supabaseClient) {
      try {
        await supabaseClient.from("usuarios").update({ tarifa: val }).eq("id", userId);
      } catch(e) {}
    }
    loadAdminData();
  }
}

// RENDEREAR HISTORIAL ADMIN INCLUYENDO SIEMPRE TURNOS EN VIVO ACTIVO
function renderHistorialAdmin() {
  const desde = document.getElementById("filtro-desde") ? document.getElementById("filtro-desde").value : "";
  const hasta = document.getElementById("filtro-hasta") ? document.getElementById("filtro-hasta").value : "";
  
  const turnosFiltrados = cachedTurnos.filter(t => {
    if (t.estado === 'en_turno' || !t.hora_salida) return true; // MOSTRAR SIEMPRE TURNOS EN VIVO
    if (desde && t.fecha_inicio < desde) return false;
    if (hasta && t.fecha_inicio > hasta) return false;
    return true;
  }).sort((a,b) => b.hora_entrada - a.hora_entrada);

  const tbody = document.getElementById("tabla-asistencias");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (turnosFiltrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No hay registros en este rango de fechas.</td></tr>`;
    return;
  }

  turnosFiltrados.forEach(t => {
    const userObj = cachedUsers.find(u => String(u.id) === String(t.id_usuario));
    const nombreUsuario = userObj ? userObj.nombre : 'Desconocido';

    let entMs = typeof t.hora_entrada === 'number' ? t.hora_entrada : new Date(t.hora_entrada).getTime();
    let salMs = t.hora_salida ? (typeof t.hora_salida === 'number' ? t.hora_salida : new Date(t.hora_salida).getTime()) : 0;

    let mins = 0;
    if (entMs && salMs && salMs > entMs) {
      mins = Math.round((salMs - entMs) / (1000 * 60));
    } else if (t.horas_totales) {
      mins = Math.round(t.horas_totales * 60);
    }

    let horasDisp = (t.estado === 'en_turno' || !t.hora_salida) 
      ? '<span class="txt-green">Activo</span>' 
      : (mins >= 60 ? `${(mins / 60).toFixed(2)} hrs` : `${mins} min`);

    let botonesForzar = (t.estado === 'en_turno' || !t.hora_salida) 
      ? `<button onclick="forzarSalida(${t.id})" class="btn-action btn-red" style="padding:4px 8px; font-size:0.75rem; margin-right:5px;">Forzar Salida</button>` 
      : '';

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${nombreUsuario}</strong></td>
      <td>${getFormattedDateTime(t.hora_entrada)}</td>
      <td>${t.hora_salida ? getFormattedDateTime(t.hora_salida) : '<span class="txt-green">Activo</span>'}</td>
      <td class="txt-green"><strong>${horasDisp}</strong></td>
      <td>
        <div class="actions-cell">
          ${botonesForzar}
          <button onclick="window.abrirModalEditarTurno(${t.id})" class="btn-action btn-blue" style="padding:6px 12px; font-size:0.85rem;">✏️ Editar</button>
          <button onclick="borrarTurnoUnico(${t.id})" class="btn-action btn-red" style="padding:6px 12px; font-size:0.85rem;">🗑️ Borrar</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.abrirModalEditarTurno = function(idTurno) {
  let t = cachedTurnos.find(x => String(x.id) === String(idTurno));
  if (!t) return;

  const userObj = cachedUsers.find(u => String(u.id) === String(t.id_usuario));
  const nombreTrabajador = userObj ? userObj.nombre : 'Trabajador';

  document.getElementById("edit-turno-id").value = t.id;
  document.getElementById("edit-turno-nombre-trabajador").value = nombreTrabajador;
  document.getElementById("edit-turno-entrada-datetime").value = getDateTimeLocalString(t.hora_entrada);
  document.getElementById("edit-turno-salida-datetime").value = t.hora_salida ? getDateTimeLocalString(t.hora_salida) : getDateTimeLocalString(t.hora_entrada);

  const modalEdit = document.getElementById("modal-editar-turno");
  if (modalEdit) {
    modalEdit.classList.remove("hidden");
    modalEdit.style.display = "flex";
  }
};

function cerrarModalEditarTurno() {
  const modalEdit = document.getElementById("modal-editar-turno");
  if (modalEdit) {
    modalEdit.classList.add("hidden");
    modalEdit.style.display = "none";
  }
}

async function guardarEdicionTurno() {
  const idTurno = document.getElementById("edit-turno-id").value;
  const valEntrada = document.getElementById("edit-turno-entrada-datetime").value;
  const valSalida = document.getElementById("edit-turno-salida-datetime").value;

  if (!valEntrada || !valSalida) {
    alert("Por favor completa las fechas y horas de entrada y salida.");
    return;
  }

  let tEntrada = new Date(valEntrada).getTime();
  let tSalida = new Date(valSalida).getTime();

  if (tSalida <= tEntrada) {
    alert("La fecha y hora de salida debe ser posterior a la de entrada.");
    return;
  }

  let diffHrs = Math.max(0, (tSalida - tEntrada) / (1000 * 60 * 60));
  let nuevaFechaInicio = valEntrada.split('T')[0];

  let t = cachedTurnos.find(x => String(x.id) === String(idTurno));
  if (t) {
    t.fecha_inicio = nuevaFechaInicio;
    t.hora_entrada = tEntrada;
    t.hora_salida = tSalida;
    t.horas_totales = parseFloat(diffHrs.toFixed(4));
    t.estado = "completado";
    guardarTurnosLocales();
  }

  if (supabaseClient) {
    try {
      await supabaseClient.from("registros_turnos").update({
        fecha_inicio: nuevaFechaInicio,
        hora_entrada: tEntrada,
        hora_salida: tSalida,
        horas_totales: parseFloat(diffHrs.toFixed(4)),
        estado: "completado"
      }).eq("id", idTurno);
    } catch (e) {}
  }

  cerrarModalEditarTurno();
  if (currentUser && currentUser.rol === "admin") {
    loadAdminData();
  } else {
    renderTablaTrabajador();
  }

  alert("¡Registro de turno actualizado correctamente!");
}

async function borrarTurnoUnico(idTurno) {
  if (confirm("¿Estás seguro de eliminar este registro de turno?")) {
    cachedTurnos = cachedTurnos.filter(x => String(x.id) !== String(idTurno));
    guardarTurnosLocales();

    if (supabaseClient) {
      try { 
        await supabaseClient.from("registros_turnos").delete().eq("id", idTurno); 
      } catch (e) {}
    }
    
    if (currentUser && currentUser.rol === "admin") {
      loadAdminData();
    } else {
      renderTablaTrabajador();
    }
  }
}

async function forzarSalida(idTurno) {
  if (confirm("¿Forzar salida de este turno activo?")) {
    const now = new Date();
    let t = cachedTurnos.find(x => String(x.id) === String(idTurno));
    if (t) {
      let entMs = typeof t.hora_entrada === 'number' ? t.hora_entrada : new Date(t.hora_entrada).getTime();
      let diffHrs = Math.max(0, (now.getTime() - entMs) / (1000 * 60 * 60));
      t.hora_salida = now.getTime();
      t.horas_totales = parseFloat(diffHrs.toFixed(4));
      t.estado = "completado";
      guardarTurnosLocales();
    }
    if (supabaseClient) {
      try { 
        await supabaseClient.from("registros_turnos").update({ 
          hora_salida: now.getTime(), 
          horas_totales: t ? t.horas_totales : 1, 
          estado: "completado" 
        }).eq("id", idTurno); 
      } catch (e) {}
    }
    loadAdminData();
    alert("¡Salida forzada con éxito!");
  }
}

function togglePinVisibility(id, btnId) {
  const span = document.getElementById(id);
  const btn = document.getElementById(btnId);
  if (span && span.dataset.pin) {
    span.textContent = span.textContent === "••••" ? span.dataset.pin : "••••";
    btn.textContent = span.textContent === "••••" ? "👁️" : "👁️‍🗨️";
  }
}

function openNuevoUsuarioModal() {
  document.getElementById("modal-user-title").innerText = "Nuevo Trabajador";
  document.getElementById("edit-user-id").value = "";
  document.getElementById("edit-user-nombre").value = "";
  document.getElementById("edit-user-pin").value = "1234";
  document.getElementById("edit-user-tipo").value = "Horas";
  document.getElementById("edit-user-tarifa").value = "1.0";
  document.getElementById("edit-user-cargo").value = "Operaciones";
  document.getElementById("edit-user-rol").value = "trabajador";
  document.getElementById("modal-usuario").classList.remove("hidden");
  document.getElementById("modal-usuario").style.display = "flex";
}

function openEditarUsuarioModal(id) {
  const user = cachedUsers.find(u => String(u.id) === String(id));
  if (!user) return;
  
  if (user.usuario === 'administrador' || user.rol === 'admin') {
    alert("El usuario administrador (Ángel) es fijo y no requiere edición.");
    return;
  }

  document.getElementById("modal-user-title").innerText = "Editar Usuario: " + user.nombre;
  document.getElementById("edit-user-id").value = user.id;
  document.getElementById("edit-user-nombre").value = user.nombre;
  document.getElementById("edit-user-pin").value = user.pin;
  document.getElementById("edit-user-tipo").value = user.tipo_pago || "Horas";
  document.getElementById("edit-user-tarifa").value = user.tarifa !== undefined ? user.tarifa : 1.0;
  document.getElementById("edit-user-cargo").value = user.cargo || "Operaciones";
  document.getElementById("edit-user-rol").value = user.rol || "trabajador";
  document.getElementById("modal-usuario").classList.remove("hidden");
  document.getElementById("modal-usuario").style.display = "flex";
}

async function guardarUsuario() {
  const id = document.getElementById("edit-user-id").value;
  const nombre = (document.getElementById("edit-user-nombre").value || "").trim();
  const pin = (document.getElementById("edit-user-pin").value || "").trim();
  const tipo_pago = document.getElementById("edit-user-tipo").value;
  const valTarifa = parseFloat(document.getElementById("edit-user-tarifa").value) || 1.0;
  const cargo = document.getElementById("edit-user-cargo").value;
  const rol = document.getElementById("edit-user-rol").value;
  const usuario = nombre.toLowerCase().trim().replace(/\s+/g, '');

  if (!nombre || !pin) { alert("Ingresa nombre y PIN."); return; }
  let payload = { nombre, usuario, pin, tipo_pago, tarifa: valTarifa, cargo, rol };

  if (supabaseClient) {
    if (id) await supabaseClient.from("usuarios").update(payload).eq("id", id);
    else await supabaseClient.from("usuarios").insert([payload]);
  }
  closeModals();
  loadAdminData();
  alert("¡Trabajador guardado con éxito!");
}

async function borrarUsuario(id) {
  let user = cachedUsers.find(u => String(u.id) === String(id));
  if (user && (user.usuario === 'administrador' || user.rol === 'admin')) {
    alert("No se puede eliminar al administrador principal.");
    return;
  }
  if (confirm("¿Borrar usuario de forma permanente?")) {
    if (supabaseClient) {
      await supabaseClient.from("usuarios").delete().eq("id", id);
    }
    loadAdminData();
  }
}

function openAgregarHorasModal() {
  const sel = document.getElementById("manual-user-select");
  if (sel) {
    sel.innerHTML = "";
    cachedUsers.forEach(u => sel.innerHTML += `<option value="${u.id}">${u.nombre} (${u.tipo_pago || 'Horas'})</option>`);
  }
  const hoyStr = getFormattedDate();
  document.getElementById("manual-fecha-inicio").value = hoyStr;
  document.getElementById("manual-fecha-fin").value = hoyStr;
  document.getElementById("modal-agregar-horas").classList.remove("hidden");
  document.getElementById("modal-agregar-horas").style.display = "flex";
}

// GUARDA HORAS MANUALES Y AJUSTA RANGO PARA GARANTIZAR VISIBILIDAD INMEDIATA
async function guardarHorasManuales() {
  const userId = parseInt(document.getElementById("manual-user-select").value);
  const fechaInicio = document.getElementById("manual-fecha-inicio").value;
  const fechaFin = document.getElementById("manual-fecha-fin").value || fechaInicio;
  const hEntrada = document.getElementById("manual-entrada").value;
  const hSalida = document.getElementById("manual-salida").value;

  if (!fechaInicio || !hEntrada || !hSalida) { 
    alert("Por favor completa la fecha de inicio y las horas."); 
    return; 
  }

  let tEntrada = new Date(`${fechaInicio}T${hEntrada}:00`).getTime();
  let tSalida = new Date(`${fechaFin}T${hSalida}:00`).getTime();

  if (tSalida <= tEntrada) {
    alert("La fecha y hora de salida debe ser posterior a la fecha y hora de entrada.");
    return;
  }

  let diffHrs = Math.max(0, (tSalida - tEntrada) / (1000 * 60 * 60));

  const payloadSupabase = {
    id_usuario: userId,
    fecha_inicio: fechaInicio,
    hora_entrada: tEntrada,
    hora_salida: tSalida,
    horas_totales: parseFloat(diffHrs.toFixed(4)),
    estado: "completado",
    origen: "manual"
  };

  const nuevoTurnoLocal = { id: Date.now(), ...payloadSupabase };
  cachedTurnos.unshift(nuevoTurnoLocal);
  guardarTurnosLocales();

  // Ajustar filtros de fecha si la fecha cargada es más antigua para que no quede oculta
  const inputDesdeAdmin = document.getElementById("filtro-desde");
  if (inputDesdeAdmin && inputDesdeAdmin.value > fechaInicio) {
    inputDesdeAdmin.value = fechaInicio;
  }

  const inputDesdeWorker = document.getElementById("w-filtro-desde");
  if (inputDesdeWorker && inputDesdeWorker.value > fechaInicio) {
    inputDesdeWorker.value = fechaInicio;
  }

  if (supabaseClient) {
    try { 
      const { data, error } = await supabaseClient.from("registros_turnos").insert([payloadSupabase]).select(); 
      if (!error && data && data.length > 0) {
        cachedTurnos = cachedTurnos.filter(x => x.id !== nuevoTurnoLocal.id);
        cachedTurnos.unshift(data[0]);
        guardarTurnosLocales();
      }
    } catch (e) {}
  }

  closeModals();
  loadAdminData();
  alert("¡Horas cargadas correctamente!");
}

function abrirResumenPagoModal() {
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;
  if (!desde || !hasta) { alert("Selecciona el rango de fechas."); return; }

  let d1 = new Date(desde);
  let d2 = new Date(hasta);
  let semanas = Math.max(1, (Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1) / 7);
  const turnosFiltrados = cachedTurnos.filter(t => t.fecha_inicio >= desde && t.fecha_inicio <= hasta);
  
  document.getElementById("resumen-rango-fechas").innerText = `Período del ${formatFechaEsp(desde)} al ${formatFechaEsp(hasta)}`;
  
  let html = `
    <table style="width: 100%; margin-top: 0; font-size: 0.85rem;">
      <thead>
        <tr style="border-bottom: 2px solid var(--border-color);">
          <th style="padding: 8px 4px;">Nombre</th>
          <th style="padding: 8px 4px;">Tipo</th>
          <th style="padding: 8px 4px;">Horas</th>
          <th style="padding: 8px 4px;">Tarifa ($)</th>
          <th style="padding: 8px 4px; text-align: right;">Monto ($)</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  let granTotal = 0;

  cachedUsers.forEach(u => {
    const userTurnos = turnosFiltrados.filter(t => String(t.id_usuario) === String(u.id));
    let totalMinsUser = 0;
    userTurnos.forEach(t => {
      let entMs = typeof t.hora_entrada === 'number' ? t.hora_entrada : new Date(t.hora_entrada).getTime();
      let salMs = t.hora_salida ? (typeof t.hora_salida === 'number' ? t.hora_salida : new Date(t.hora_salida).getTime()) : 0;
      if (entMs && salMs && salMs > entMs) {
        totalMinsUser += (salMs - entMs) / (1000 * 60);
      } else if (t.horas_totales) {
        totalMinsUser += parseFloat(t.horas_totales) * 60;
      }
    });
    let totalHoras = totalMinsUser / 60;

    let tarifaVal = u.tarifa !== undefined ? parseFloat(u.tarifa) : 1.0;
    let tipoPago = (u.tipo_pago || "Horas").trim();
    let totalPagar = tipoPago === "Gasolina" ? (totalHoras * 1.4) * 0.50 : tipoPago === "Fijo" ? tarifaVal * semanas : totalHoras * tarifaVal;

    let horasStr = tipoPago === "Fijo" ? "-" : `${totalHoras.toFixed(2)} hrs`;
    let tarifaStr = tipoPago === "Fijo" ? `$${tarifaVal.toFixed(2)}/sem` : `$${tarifaVal.toFixed(2)}`;

    html += `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 8px 4px;"><strong>${u.nombre}</strong></td>
        <td style="padding: 8px 4px; color: var(--text-muted);">${tipoPago}</td>
        <td style="padding: 8px 4px;" class="txt-green">${horasStr}</td>
        <td style="padding: 8px 4px;">${tarifaStr}</td>
        <td style="padding: 8px 4px; text-align: right;" class="txt-green"><strong>$${totalPagar.toFixed(2)}</strong></td>
      </tr>
    `;
    granTotal += totalPagar;
  });

  html += `
      </tbody>
    </table>
    <div style="margin-top:15px; padding-top:10px; border-top:2px solid #10b981; text-align:right; font-size:1.1rem; font-weight:bold;">
      Total a Pagar: <span class="txt-green">$${granTotal.toFixed(2)}</span>
    </div>
  `;

  document.getElementById("resumen-pago-contenido").innerHTML = html;
  document.getElementById("modal-resumen-pago").classList.remove("hidden");
  document.getElementById("modal-resumen-pago").style.display = "flex";
}

function copiarResumenPago() {
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;
  let d1 = new Date(desde);
  let d2 = new Date(hasta);
  let semanas = Math.max(1, (Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1) / 7);
  const turnosFiltrados = cachedTurnos.filter(t => t.fecha_inicio >= desde && t.fecha_inicio <= hasta);

  let textoCopy = `📊 *REPORTE DE NÓMINA*\n📅 Período: ${formatFechaEsp(desde)} al ${formatFechaEsp(hasta)}\n\n`;
  let granTotal = 0;

  cachedUsers.forEach(u => {
    const userTurnos = turnosFiltrados.filter(t => String(t.id_usuario) === String(u.id));
    let totalMinsUser = 0;
    userTurnos.forEach(t => {
      let entMs = typeof t.hora_entrada === 'number' ? t.hora_entrada : new Date(t.hora_entrada).getTime();
      let salMs = t.hora_salida ? (typeof t.hora_salida === 'number' ? t.hora_salida : new Date(t.hora_salida).getTime()) : 0;
      if (entMs && salMs && salMs > entMs) {
        totalMinsUser += (salMs - entMs) / (1000 * 60);
      } else if (t.horas_totales) {
        totalMinsUser += parseFloat(t.horas_totales) * 60;
      }
    });
    let totalHoras = totalMinsUser / 60;
    let tarifaVal = u.tarifa !== undefined ? parseFloat(u.tarifa) : 1.0;
    let tipoPago = (u.tipo_pago || "Horas").trim();
    let totalPagar = tipoPago === "Gasolina" ? (totalHoras * 1.4) * 0.50 : tipoPago === "Fijo" ? tarifaVal * semanas : totalHoras * tarifaVal;

    let detalle = tipoPago === "Fijo" ? `Sueldo Fijo` : `${totalHoras.toFixed(2)} hrs x $${tarifaVal.toFixed(2)}`;
    textoCopy += `• *${u.nombre}* (${detalle}): *$${totalPagar.toFixed(2)}*\n`;
    granTotal += totalPagar;
  });

  textoCopy += `\n💰 *Total a Pagar:* *$${granTotal.toFixed(2)}*`;

  navigator.clipboard.writeText(textoCopy).then(() => alert("¡Reporte de nómina copiado!")).catch(err => alert("Error al copiar: " + err));
}

function openConfigTarifasModal() {
  document.getElementById("modal-config-tarifas").classList.remove("hidden");
  document.getElementById("modal-config-tarifas").style.display = "flex";
}

async function aplicarTarifaGlobal() {
  const nueva = parseFloat(document.getElementById("global-tarifa-input").value);
  if (isNaN(nueva)) return;
  cachedUsers.forEach(u => {
    if ((u.tipo_pago || "").toLowerCase() !== "gasolina" && (u.tipo_pago || "").toLowerCase() !== "fijo") u.tarifa = nueva;
  });
  if (supabaseClient) {
    try {
      for (let u of cachedUsers) {
        if ((u.tipo_pago || "").toLowerCase() !== "gasolina" && (u.tipo_pago || "").toLowerCase() !== "fijo") {
          await supabaseClient.from("usuarios").update({ tarifa: nueva }).eq("id", u.id);
        }
      }
    } catch (e) {}
  }
  closeModals();
  loadAdminData();
  alert("¡Tarifa global aplicada con éxito a todos los trabajadores por hora!");
}

function openConfigPinModal() {
  document.getElementById("modal-config-pin").classList.remove("hidden");
  document.getElementById("modal-config-pin").style.display = "flex";
}

async function guardarNuevoPinSeguro() {
  const actual = document.getElementById("pin-actual-input").value.trim();
  const nuevo = document.getElementById("pin-nuevo-input").value.trim();
  const confirmar = document.getElementById("pin-confirmar-input").value.trim();

  if (actual && actual !== String(currentUser.pin).trim()) { alert("El PIN actual no es correcto."); return; }
  if (nuevo && nuevo !== confirmar) { alert("El nuevo PIN y su confirmación no coinciden."); return; }

  if (nuevo) {
    currentUser.pin = nuevo;
    if (supabaseClient) {
      try { 
        await supabaseClient.from("usuarios").update({ pin: nuevo }).eq("id", currentUser.id); 
      } catch (e) {}
    }
    alert("PIN actualizado con éxito.");
  }
  closeModals();
}

function closeModals() {
  document.querySelectorAll(".modal-backdrop").forEach(m => {
    m.classList.add("hidden");
    m.style.display = "none";
  });
}
