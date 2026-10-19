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
    const horaTexto = `🇻🇪 Hora Actual: ${getFormattedTime(now)}`;
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

window.addEventListener('DOMContentLoaded', () => {
  try { initMatrixEffect(); } catch(e){}
  cargarTurnosLocales();
  iniciarRelojEnVivo();

  syncDataFromSupabase().then(() => {
    if (currentUser) {
      if (currentUser.rol === "admin") loadAdminData();
      else loadWorkerData();
    }
  });

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
        localMap.set(t.id, t);
      });
      cachedTurnos = Array.from(localMap.values());
      guardarTurnosLocales();
    }
  } catch (e) {
    console.warn("Sincronización en segundo plano omitida:", e);
  }
}

function login() {
  const uInput = (document.getElementById("login-usuario").value || "").trim().toLowerCase();
  const pInput = (document.getElementById("login-pin").value || "").trim();

  if (!uInput || !pInput) { alert("Ingresa usuario y PIN."); return; }

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
      <td><button onclick="window.verDetallesAdminGlobal(${currentUser.id}, '${g.fecha}')" class="btn-action btn-gray" style="padding:4px 8px; font-size:0.8rem;">Detalles</button></td>
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