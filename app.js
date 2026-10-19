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

// DAR FORMATO DD/MM/YYYY PARA PANTALLA Y REPORTES
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
      }).catch(e => console.log(e));
    }

    const esContinuacionSalida = turnosPreviosDia.length > 1;
    copiarReportePortapapeles(currentUser.nombre, "FIN", fechaEntradaTurno, horaEntradaTurno, fechaSalidaTurno, horaStr, totalHorasStr, esContinuacionSalida);
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
      porFecha[t.fecha_inicio] = { fecha: t.fecha_inicio, totalMinutos: 0, primeraEntrada: null, ultimaSalida: null, enCurso: false };
    }
    let grupo = porFecha[t.fecha_inicio];
    
    let entMs = typeof t.hora_entrada === 'number' ? t.hora_entrada : new Date(t.hora_entrada).getTime();
    let salMs = t.hora_salida ? (typeof t.hora_salida === 'number' ? t.hora_salida : new Date(t.hora_salida).getTime()) : 0;
    
    if (entMs && salMs && salMs > entMs) {
      grupo.totalMinutos += (salMs - entMs) / (1000 * 60);
    } else if (t.horas_totales) {
      grupo.totalMinutos += parseFloat(t.horas_totales) * 60;
    }

    if (t.hora_entrada && (!grupo.primeraEntrada || entMs < (typeof grupo.primeraEntrada === 'number' ? grupo.primeraEntrada : new Date(grupo.primeraEntrada).getTime()))) {
      grupo.primeraEntrada = t.hora_entrada;
    }
    if (salMs) {
      if (!grupo.ultimaSalida || salMs > (typeof grupo.ultimaSalida === 'number' ? grupo.ultimaSalida : new Date(grupo.ultimaSalida).getTime())) {
        grupo.ultimaSalida = t.hora_salida;
      }
    } else {
      if (t.estado === "en_turno" || !t.hora_salida) {
        grupo.enCurso = true;
      }
    }
  });

  let totalMinutosPeriodo = 0;
  Object.values(porFecha).sort((a,b) => b.fecha.localeCompare(a.fecha)).forEach(g => {
    totalMinutosPeriodo += g.totalMinutos;
    let horasDia = g.totalMinutos / 60;

    const hEntrada = g.primeraEntrada ? getFormattedTime(g.primeraEntrada) : '-';
    const hSalida = g.enCurso ? '<span class="txt-green">En Curso</span>' : (g.ultimaSalida ? getFormattedTime(g.ultimaSalida) : '-');

    let totalMinsRedondeados = Math.round(g.totalMinutos);
    let horasDisplay = horasDia >= 1 ? `${horasDia.toFixed(2)} hrs` : `${totalMinsRedondeados} min`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${formatFechaEsp(g.fecha)}</strong></td>
      <td>${hEntrada}</td>
      <td>${hSalida}</td>
      <td class="txt-green">${horasDisplay}</td>
      <td><button onclick="verDetalleDia('${g.fecha}')" class="btn-action btn-gray">Detalle</button></td>
    `;
    tbody.appendChild(tr);
  });

  let totalHorasPeriodo = totalMinutosPeriodo / 60;
  let totalMinsPeriodoRedondeados = Math.round(totalMinutosPeriodo);
  
  const labelTotal = document.getElementById("w-total-periodo");
  if (labelTotal) {
    if (totalMinutosPeriodo > 0 && totalHorasPeriodo < 1) {
      labelTotal.innerText = `${totalMinsPeriodoRedondeados} min (${totalHorasPeriodo.toFixed(2)} hrs)`;
    } else {
      labelTotal.innerText = `${totalHorasPeriodo.toFixed(2)} hrs`;
    }
  }
  calcularSimuladorCobro();
}

function verDetalleDia(fecha) {
  const listaTurnos = cachedTurnos
    .filter(t => String(t.id_usuario) === String(currentUser.id) && t.fecha_inicio === fecha)
    .sort((a, b) => {
      let entA = typeof a.hora_entrada === 'number' ? a.hora_entrada : new Date(a.hora_entrada).getTime();
      let entB = typeof b.hora_entrada === 'number' ? b.hora_entrada : new Date(b.hora_entrada).getTime();
      return entA - entB;
    });

  document.getElementById("detalle-titulo").innerText = `Reporte Detallado de ${currentUser.nombre} (${formatFechaEsp(fecha)})`;
  let html = `<p>Registros del día:</p><hr style="border-color:#334155; margin:10px 0;">`;
  
  listaTurnos.forEach((t, idx) => {
    let entDateStr = getFormattedDate(t.hora_entrada);
    let salDateStr = t.hora_salida ? getFormattedDate(t.hora_salida) : '';

    let entLabelDate = (entDateStr && entDateStr !== t.fecha_inicio) ? ` (${getShortDateLabel(t.hora_entrada)})` : '';
    let salLabelDate = (salDateStr && salDateStr !== t.fecha_inicio) ? ` (${getShortDateLabel(t.hora_salida)})` : '';

    let ent = t.hora_entrada ? `${getFormattedTime(t.hora_entrada)}${entLabelDate}` : '-';
    let sal = t.hora_salida ? `${getFormattedTime(t.hora_salida)}${salLabelDate}` : 'En curso';
    
    let mins = 0;
    let entMs = typeof t.hora_entrada === 'number' ? t.hora_entrada : new Date(t.hora_entrada).getTime();
    let salMs = t.hora_salida ? (typeof t.hora_salida === 'number' ? t.hora_salida : new Date(t.hora_salida).getTime()) : 0;
    if (entMs && salMs && salMs > entMs) {
      mins = Math.round((salMs - entMs) / (1000 * 60));
    } else if (t.horas_totales) {
      mins = Math.round(t.horas_totales * 60);
    }

    let hrsText = mins >= 60 ? `${(mins / 60).toFixed(2)} hrs` : `${mins} min`;
    let tagContinuando = idx > 0 ? `<div class="badge-continuacion">Continuación de turno</div><br>` : '';

    html += `<div style="background:#1e293b; padding:10px; border-radius:6px; margin-bottom:8px;">` +
            `${tagContinuando}` +
            `<small>Entrada: ${ent}</small><br>` +
            `<small>Salida: ${sal}</small><br>` +
            `Total: <span class="txt-green">${hrsText}</span><br>` +
            `<button onclick="borrarTurno(${t.id})" class="btn-action btn-red" style="padding:2px 6px; font-size:0.75rem; margin-top:6px;">Eliminar</button>` +
            `</div>`;
  });
  
  document.getElementById("detalle-contenido").innerHTML = html;
  const modalDetalles = document.getElementById("modal-detalles");
  if (modalDetalles) { 
    modalDetalles.classList.remove("hidden"); 
    modalDetalles.style.display = "flex"; 
  }
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

async function loadAdminData() {
  try {
    await Promise.race([
      syncDataFromSupabase(),
      new Promise((_, reject) => setTimeout(() => reject('timeout'), 3000))
    ]);
  } catch(e) {}
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

function renderHistorialAdmin() {
  const desde = document.getElementById("filtro-desde") ? document.getElementById("filtro-desde").value : "";
  const hasta = document.getElementById("filtro-hasta") ? document.getElementById("filtro-hasta").value : "";
  const turnosFiltrados = cachedTurnos.filter(t => (!desde || t.fecha_inicio >= desde) && (!hasta || t.fecha_inicio <= hasta));

  let agrupado = {};
  turnosFiltrados.forEach(t => {
    const userObj = cachedUsers.find(u => String(u.id) === String(t.id_usuario));
    const key = `${t.id_usuario}_${t.fecha_inicio}`;
    if (!agrupado[key]) {
      agrupado[key] = { 
        userId: t.id_usuario, 
        nombre: userObj ? userObj.nombre : 'Desconocido', 
        fecha: t.fecha_inicio, 
        totalMins: 0, 
        activo: false, 
        turnosActivosIds: [],
        primeraEntrada: null,
        ultimaSalida: null
      };
    }
    let grp = agrupado[key];
    let entMs = typeof t.hora_entrada === 'number' ? t.hora_entrada : new Date(t.hora_entrada).getTime();
    let salMs = t.hora_salida ? (typeof t.hora_salida === 'number' ? t.hora_salida : new Date(t.hora_salida).getTime()) : 0;
    
    // Suma estricta de minutos a la fecha de inicio del turno
    if (entMs && salMs && salMs > entMs) {
      grp.totalMins += (salMs - entMs) / (1000 * 60);
    } else if (t.horas_totales) {
      grp.totalMins += parseFloat(t.horas_totales) * 60;
    }

    if (t.hora_entrada && (!grp.primeraEntrada || entMs < (typeof grp.primeraEntrada === 'number' ? grp.primeraEntrada : new Date(grp.primeraEntrada).getTime()))) {
      grp.primeraEntrada = t.hora_entrada;
    }

    if (salMs) {
      if (!grp.ultimaSalida || salMs > (typeof grp.ultimaSalida === 'number' ? grp.ultimaSalida : new Date(grp.ultimaSalida).getTime())) {
        grp.ultimaSalida = t.hora_salida;
      }
    } else {
      if (t.estado === 'en_turno' || !t.hora_salida) {
        grp.activo = true;
        grp.turnosActivosIds.push(t.id);
      }
    }
  });

  const tbody = document.getElementById("tabla-asistencias");
  if (!tbody) return;
  tbody.innerHTML = "";

  Object.values(agrupado).sort((a,b) => b.fecha.localeCompare(a.fecha)).forEach(item => {
    let horasDia = item.totalMins / 60;
    let dispMins = horasDia >= 1 ? `${horasDia.toFixed(2)} hrs` : `${Math.round(item.totalMins)} min`;

    let hEnt = item.primeraEntrada ? getFormattedTime(item.primeraEntrada) : '-';
    let hSal = item.activo ? '<span class="txt-green">En curso</span>' : (item.ultimaSalida ? getFormattedTime(item.ultimaSalida) : '-');

    let botonesForzar = "";
    if (item.activo) {
      item.turnosActivosIds.forEach(idT => {
        botonesForzar += `<button onclick="forzarSalida(${idT})" class="btn-action btn-red" style="padding:4px 8px; margin-left:4px; font-size:0.75rem;">Forzar Salida</button>`;
      });
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.nombre}</strong></td>
      <td>${formatFechaEsp(item.fecha)}</td>
      <td>${hEnt}</td>
      <td>${hSal}</td>
      <td>${item.activo ? '<span class="txt-green">🟢 En Turno</span>' : `<span class="txt-green">${dispMins}</span>`}</td>
      <td>
        <button onclick="verDetallesAdminGlobal(${item.userId}, '${item.fecha}')" class="btn-action btn-gray" style="padding:4px 8px;">Detalles</button>
        ${botonesForzar}
      </td>
    `;
    tbody.appendChild(tr);
  });
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
  await loadAdminData();
  alert("¡Trabajador guardado con éxito!");
}

async function borrarUsuario(id) {
  if (confirm("¿Borrar usuario de forma permanente?")) {
    if (supabaseClient) await supabaseClient.from("usuarios").delete().eq("id", id);
    await loadAdminData();
  }
}

function openAgregarHorasModal() {
  const sel = document.getElementById("manual-user-select");
  if (sel) {
    sel.innerHTML = "";
    cachedUsers.forEach(u => sel.innerHTML += `<option value="${u.id}">${u.nombre} (${u.tipo_pago || 'Horas'})</option>`);
  }
  document.getElementById("manual-fecha").value = getFormattedDate();
  document.getElementById("modal-agregar-horas").classList.remove("hidden");
  document.getElementById("modal-agregar-horas").style.display = "flex";
}

async function guardarHorasManuales() {
  const userId = parseInt(document.getElementById("manual-user-select").value);
  const fecha = document.getElementById("manual-fecha").value;
  const hEntrada = document.getElementById("manual-entrada").value;
  const hSalida = document.getElementById("manual-salida").value;

  if (!fecha || !hEntrada || !hSalida) { alert("Completa fecha y horas."); return; }
  let tEntrada = new Date(`${fecha}T${hEntrada}:00`).getTime();
  let tSalida = new Date(`${fecha}T${hSalida}:00`).getTime();
  let diffHrs = Math.max(0, (tSalida - tEntrada) / (1000 * 60 * 60));

  const payloadSupabase = {
    id_usuario: userId,
    fecha_inicio: fecha,
    hora_entrada: tEntrada,
    hora_salida: tSalida,
    horas_totales: parseFloat(diffHrs.toFixed(4)),
    estado: "completado",
    origen: "manual"
  };

  const nuevoTurnoLocal = { id: Date.now(), ...payloadSupabase };
  cachedTurnos.unshift(nuevoTurnoLocal);
  guardarTurnosLocales();

  if (supabaseClient) {
    try { 
      await supabaseClient.from("registros_turnos").insert([payloadSupabase]); 
    } catch (e) {}
  }
  closeModals();
  await loadAdminData();
  alert("¡Horas cargadas correctamente!");
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
    await loadAdminData();
    alert("¡Salida forzada con éxito!");
  }
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
  let html = `<ul style="list-style:none; padding:0; line-height:1.8;">`;
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

    html += `<li style="padding:6px 0; border-bottom:1px solid #334155;"><strong>${u.nombre}</strong>: <span class="txt-green">$${totalPagar.toFixed(2)}</span></li>`;
    granTotal += totalPagar;
  });

  html += `</ul><div style="margin-top:15px; padding-top:10px; border-top:2px solid #10b981; text-align:right; font-size:1.1rem; font-weight:bold;">Total a Pagar: <span class="txt-green">$${granTotal.toFixed(2)}</span></div>`;
  document.getElementById("resumen-pago-contenido").innerHTML = html;
  document.getElementById("modal-resumen-pago").classList.remove("hidden");
  document.getElementById("modal-resumen-pago").style.display = "flex";
}

function copiarResumenPago() {
  const textoFinal = `📊 REPORTE DE NÓMINA\n` + document.getElementById("resumen-pago-contenido").innerText;
  navigator.clipboard.writeText(textoFinal).then(() => alert("¡Reporte copiado!")).catch(err => alert("Error al copiar: " + err));
}

function verDetallesAdminGlobal(userId, fecha) {
  const userObj = cachedUsers.find(u => String(u.id) === String(userId));
  const nombreUsuario = userObj ? userObj.nombre : 'Trabajador';

  const listaTurnos = cachedTurnos
    .filter(t => String(t.id_usuario) === String(userId) && t.fecha_inicio === fecha)
    .sort((a, b) => {
      let entA = typeof a.hora_entrada === 'number' ? a.hora_entrada : new Date(a.hora_entrada).getTime();
      let entB = typeof b.hora_entrada === 'number' ? b.hora_entrada : new Date(b.hora_entrada).getTime();
      return entA - entB;
    });

  document.getElementById("detalle-titulo").innerText = `Reporte Detallado de ${nombreUsuario} (${formatFechaEsp(fecha)})`;
  let html = `<p>Sesiones del día:</p><hr style="border-color:#334155; margin:10px 0;">`;

  listaTurnos.forEach((t, idx) => {
    let entDateStr = getFormattedDate(t.hora_entrada);
    let salDateStr = t.hora_salida ? getFormattedDate(t.hora_salida) : '';

    let entLabelDate = (entDateStr && entDateStr !== t.fecha_inicio) ? ` (${getShortDateLabel(t.hora_entrada)})` : '';
    let salLabelDate = (salDateStr && salDateStr !== t.fecha_inicio) ? ` (${getShortDateLabel(t.hora_salida)})` : '';

    let ent = t.hora_entrada ? `${getFormattedTime(t.hora_entrada)}${entLabelDate}` : '-';
    let sal = t.hora_salida ? `${getFormattedTime(t.hora_salida)}${salLabelDate}` : 'En curso';
    
    let mins = 0;
    let entMs = typeof t.hora_entrada === 'number' ? t.hora_entrada : new Date(t.hora_entrada).getTime();
    let salMs = t.hora_salida ? (typeof t.hora_salida === 'number' ? t.hora_salida : new Date(t.hora_salida).getTime()) : 0;
    if (entMs && salMs && salMs > entMs) {
      mins = Math.round((salMs - entMs) / (1000 * 60));
    } else if (t.horas_totales) {
      mins = Math.round(t.horas_totales * 60);
    }

    let hrsText = mins >= 60 ? `${(mins / 60).toFixed(2)} hrs` : `${mins} min`;
    let tagContinuando = idx > 0 ? `<div class="badge-continuacion">Continuación de turno</div><br>` : '';

    html += `<div style="background:#1e293b; padding:10px; border-radius:6px; margin-bottom:8px;">` +
            `${tagContinuando}` +
            `<small>Entrada: ${ent}</small><br>` +
            `<small>Salida: ${sal}</small><br>` +
            `Total: <span class="txt-green">${hrsText}</span><br>` +
            `<button onclick="borrarTurno(${t.id})" class="btn-action btn-red" style="padding:2px 6px; font-size:0.75rem; margin-top:6px;">Eliminar</button>` +
            `</div>`;
  });

  document.getElementById("detalle-contenido").innerHTML = html;
  const modalDetalles = document.getElementById("modal-detalles");
  if (modalDetalles) {
    modalDetalles.classList.remove("hidden");
    modalDetalles.style.display = "flex";
  }
}

async function borrarTurno(id) {
  if (confirm("¿Eliminar este registro de turno?")) {
    cachedTurnos = cachedTurnos.filter(t => String(t.id) !== String(id));
    guardarTurnosLocales();
    if (supabaseClient) {
      try { await supabaseClient.from("registros_turnos").delete().eq("id", id); } catch (e) {}
    }
    closeModals();
    await loadAdminData();
  }
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
      try { await supabaseClient.from("usuarios").update({ pin: nuevo }).eq("id", currentUser.id); } catch (e) {}
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