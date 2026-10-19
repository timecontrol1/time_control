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
  // Reloj de pared de Venezuela, independiente de la zona horaria del dispositivo.
  return new Date(d.getTime() - 4 * 3600000);
}
function getFormattedDate(d = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const campo = (t) => partes.find((x) => x.type === t).value;
  return `${campo("year")}-${campo("month")}-${campo("day")}`;
}
function fechaVenezuelaDesdeMs(ms) {
  return getFormattedDate(new Date(Number(ms)));
}
function fechaHoraVenezuelaMs(fecha, hora) {
  // Venezuela no utiliza horario de verano: UTC-04:00.
  return Date.parse(
    `${fecha}T${hora.length === 5 ? hora + ":00" : hora}-04:00`
  );
}
function formatFechaEsp(fechaISO) {
  if (!fechaISO) return "";
  const partes = fechaISO.split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fechaISO;
}

function getFormattedDateTime(val) {
  if (!val) return "--:-- --";
  return new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(val));
}
function getDateTimeLocalString(val) {
  if (!val) return "";
  try {
    const d = typeof val === "number" ? new Date(val) : new Date(val);
    const vzla = getVenezuelaDate(d);
    const yyyy = vzla.getFullYear();
    const mm = String(vzla.getMonth() + 1).padStart(2, "0");
    const dd = String(vzla.getDate()).padStart(2, "0");
    const hh = String(vzla.getHours()).padStart(2, "0");
    const min = String(vzla.getMinutes()).padStart(2, "0");
    const sec = String(vzla.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}`;
  } catch (e) {
    return "";
  }
}

function iniciarRelojEnVivo() {
  const actualizarReloj = () => {
    const now = new Date();
    const vzla = getVenezuelaDate(now);
    const yyyy = vzla.getFullYear();
    const mm = String(vzla.getMonth() + 1).padStart(2, "0");
    const dd = String(vzla.getDate()).padStart(2, "0");
    const horaTexto = `🇻🇪 Hora Actual: ${dd}-${mm}-${yyyy} ${getFormattedDateTime( now )}`;
    document.querySelectorAll("#reloj-venezuela").forEach((el) => {
      el.innerText = horaTexto;
    });
  };
  actualizarReloj();
  setInterval(actualizarReloj, 1000);
}

function copiarReportePortapapeles( nombreTrabajador, accion, fechaEntrada, horaEntrada, fechaSalida = "", horaSalida = "", totalHorasStr = "", esContinuacion = false, numeroReporte = null ) {
  let mensaje = "";
  let etiquetaContinuacion = esContinuacion ? " (Continuación de turno)" : "";
  let fechaEntradaEsp = formatFechaEsp(fechaEntrada);
  let horaEntradaLimpia = getFormattedDateTime(new Date(horaEntrada));

  if (accion === "INICIO") {
    mensaje =
      `🟢 *INICIO DE TURNO${etiquetaContinuacion}*\n` +
      `👤 *Trabajador:* ${nombreTrabajador}\n` +
      `📅 *Fecha:* ${fechaEntradaEsp}\n` +
      `⏰ *Hora Entrada:* ${horaEntradaLimpia}`;
  } else {
    let fechaSalidaEsp = formatFechaEsp(fechaSalida);
    let horaSalidaLimpia = getFormattedDateTime(new Date(horaSalida));
    let detalleSalidaFecha =
      fechaSalida && fechaSalida !== fechaEntrada ? ` (${fechaSalidaEsp})` : "";
    mensaje =
      `🔴 *FINALIZACIÓN DE TURNO${etiquetaContinuacion}*\n` +
      `👤 *Trabajador:* ${nombreTrabajador}\n` +
      `📅 *Fecha Inicio:* ${fechaEntradaEsp}\n` +
      `⏰ *Entrada:* ${horaEntradaLimpia}\n` +
      `⏰ *Salida:* ${horaSalidaLimpia}${detalleSalidaFecha}\n` +
      `⏱️ *Total Trabajado:* ${totalHorasStr}`;
  }

  if (numeroReporte !== null)
    mensaje += `\n🧾 *N.º de reporte:* REP-${String(numeroReporte).padStart( 6, "0" )}`;
  if (!navigator.clipboard?.writeText) {
    window.prompt("Copia este reporte y envíalo a WhatsApp:", mensaje);
    return;
  }
  navigator.clipboard
    .writeText(mensaje)
    .then(() => {
      alert(
        `¡Turno ${ accion === "INICIO" ? "iniciado" : "finalizado" }!\n\n📋 Reporte copiado al portapapeles para WhatsApp.`
      );
    })
    .catch((err) => {
      window.prompt(
        "El turno fue guardado, pero no se pudo copiar automáticamente. Copia este mensaje:",
        mensaje
      );
    });
}

let currentUser = null;
let currentShift = null;

let cachedUsers = [
  {
    id: 1,
    nombre: "Ángel",
    usuario: "administrador",
    pin: "1234",
    rol: "admin",
    tipo_pago: "Fijo",
    tarifa: 150.0,
    cargo: "Supervisor",
  },
  {
    id: 2,
    nombre: "Ronald",
    usuario: "ronald",
    pin: "1234",
    rol: "trabajador",
    tipo_pago: "Horas",
    tarifa: 1.0,
    cargo: "Operaciones",
  },
  {
    id: 3,
    nombre: "Ricardo",
    usuario: "ricardo",
    pin: "1234",
    rol: "trabajador",
    tipo_pago: "Horas",
    tarifa: 1.0,
    cargo: "Operaciones",
  },
  {
    id: 4,
    nombre: "Betzaida",
    usuario: "betzaida",
    pin: "1234",
    rol: "trabajador",
    tipo_pago: "Horas",
    tarifa: 1.0,
    cargo: "Operaciones",
  },
  {
    id: 5,
    nombre: "Lisander",
    usuario: "lisander",
    pin: "1234",
    rol: "trabajador",
    tipo_pago: "Horas",
    tarifa: 1.0,
    cargo: "Operaciones",
  },
  {
    id: 6,
    nombre: "Daniel",
    usuario: "daniel",
    pin: "1234",
    rol: "trabajador",
    tipo_pago: "Horas",
    tarifa: 1.0,
    cargo: "Operaciones",
  },
  {
    id: 7,
    nombre: "Gerson",
    usuario: "gerson",
    pin: "1234",
    rol: "trabajador",
    tipo_pago: "Horas",
    tarifa: 1.0,
    cargo: "Operaciones",
  },
  {
    id: 8,
    nombre: "Matias",
    usuario: "matias",
    pin: "1234",
    rol: "trabajador",
    tipo_pago: "Horas",
    tarifa: 1.0,
    cargo: "Operaciones",
  },
  {
    id: 9,
    nombre: "Brayan",
    usuario: "brayan",
    pin: "1234",
    rol: "trabajador",
    tipo_pago: "Horas",
    tarifa: 1.0,
    cargo: "Operaciones",
  },
  {
    id: 10,
    nombre: "Planta",
    usuario: "planta",
    pin: "1234",
    rol: "trabajador",
    tipo_pago: "Gasolina",
    tarifa: 0.5,
    cargo: "Generador",
  },
];

let cachedTurnos = [];
// Presencia: indica navegador conectado, NO demuestra identidad ni sustituye turno activo.
let canalPresencia = null;
let conectados = new Set();
const identificadorSesion =
  globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random();
function actualizarPresencia() {
  if (!canalPresencia) return;
  const estado = canalPresencia.presenceState();
  conectados = new Set(
    Object.values(estado)
      .flat()
      .filter((x) => x.usuario_id != null)
      .map((x) => String(x.usuario_id))
  );
  const el = document.getElementById("presence-status");
  if (el)
    el.textContent = `🟢 Navegadores conectados: ${conectados.size} · Solo indicador informativo`;
  if (currentUser?.rol === "admin") renderTablaUsuariosAdmin();
}
async function registrarPresencia() {
  if (!supabaseClient || !currentUser) return;
  if (!canalPresencia) {
    canalPresencia = supabaseClient.channel("presencia-trabajadores-v1", {
      config: { presence: { key: identificadorSesion } },
    });
    canalPresencia.on("presence", { event: "sync" }, actualizarPresencia);
    await new Promise((resolve, reject) =>
      canalPresencia.subscribe((status) => {
        if (status === "SUBSCRIBED") resolve();
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          reject(new Error(status));
      })
    );
  }
  await canalPresencia.track({
    usuario_id: String(currentUser.id),
    nombre: currentUser.nombre,
    desde: new Date().toISOString(),
  });
  actualizarPresencia();
}
async function desconectarPresencia() {
  if (!canalPresencia) return;
  try {
    await canalPresencia.untrack();
    await supabaseClient.removeChannel(canalPresencia);
  } catch (e) {
    console.warn(e);
  }
  canalPresencia = null;
  conectados.clear();
}

function cargarTurnosLocales() {
  try {
    const local = localStorage.getItem("app_turnos_locales");
    if (local) cachedTurnos = JSON.parse(local);
  } catch (e) {
    cachedTurnos = [];
  }
}

function guardarTurnosLocales() {
  try {
    localStorage.setItem("app_turnos_locales", JSON.stringify(cachedTurnos));
  } catch (e) {}
}

window.addEventListener("DOMContentLoaded", () => {
  try {
    initMatrixEffect();
  } catch (e) {}
  // Caché local nunca se considera un registro confirmado en Supabase.
  iniciarRelojEnVivo();

  syncDataFromSupabase();
  configurarRealtimeSupabase();
  setInterval(syncDataFromSupabase, 10000);

  try {
    const savedUserId = null; // No restaurar sesión privilegiada sin verificar el PIN.
    if (savedUserId) {
      let found = cachedUsers.find((u) => String(u.id) === String(savedUserId));
      if (found) {
        currentUser = found;
        document.getElementById("sec-login").classList.add("hidden");
        if (currentUser.rol === "admin") {
          document.getElementById("sec-admin").classList.remove("hidden");
          initSemanaEnCursoDates("filtro-desde", "filtro-hasta");
          loadAdminData();
        } else {
          document.getElementById("sec-trabajador").classList.remove("hidden");
          document.getElementById(
            "worker-title"
          ).innerText = `Trabajador: ${currentUser.nombre}`;
          document.getElementById("w-tarifa-input").value =
            currentUser.tarifa !== undefined ? currentUser.tarifa : 1.0;
          initSemanaEnCursoDates("w-filtro-desde", "w-filtro-hasta");
          loadWorkerData();
        }
      }
    }
  } catch (e) {
    localStorage.removeItem("active_user_id");
  }
});

function configurarRealtimeSupabase() {
  if (!supabaseClient) return;
  try {
    supabaseClient
      .channel("cambios-turnos-global-v3")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registros_turnos" },
        (payload) => {
          syncDataFromSupabase();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usuarios" },
        (payload) => {
          syncDataFromSupabase();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          syncDataFromSupabase();
        }
      });
  } catch (err) {}
}

function initMatrixEffect() {
  const canvas = document.getElementById("matrix-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const letters = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ$+-*#@%&";
  const fontSize = 14;
  let columns = Math.floor(canvas.width / fontSize);
  let drops = Array(columns).fill(1);

  function draw() {
    ctx.fillStyle = "rgba(3, 7, 18, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#10b981";
    ctx.font = fontSize + "px monospace";
    for (let i = 0; i < drops.length; i++) {
      const text = letters.charAt(Math.floor(Math.random() * letters.length));
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975)
        drops[i] = 0;
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
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(year, month, date + distanceToMonday);
  const sunday = new Date(year, month, date + distanceToMonday + 6);

  const formatDate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const elDesde = document.getElementById(inputDesdeId);
  const elHasta = document.getElementById(inputHastaId);
  if (elDesde && !elDesde.value) elDesde.value = formatDate(monday);
  if (elHasta && !elHasta.value) elHasta.value = formatDate(sunday);
}

let syncEnCurso = false;
async function syncDataFromSupabase() {
  if (!supabaseClient || syncEnCurso) return;
  syncEnCurso = true;
  try {
    const { data: users, error: errU } = await supabaseClient
      .from("usuarios")
      .select("*")
      .order("id");
    if (errU) throw errU;
    cachedUsers = users || [];
    if (currentUser)
      currentUser =
        cachedUsers.find((u) => String(u.id) === String(currentUser.id)) ||
        currentUser;
    let turnos = [],
      desde = 0,
      pagina = 500;
    while (true) {
      const { data, error } = await supabaseClient
        .from("registros_turnos")
        .select("*")
        .order("hora_entrada", { ascending: false })
        .range(desde, desde + pagina - 1);
      if (error) throw error;
      turnos.push(...(data || []));
      if (!data || data.length < pagina) break;
      desde += pagina;
    }
    cachedTurnos = turnos; // Supabase es la fuente de verdad; no fusionar datos fantasma.
    guardarTurnosLocales();
    if (currentUser)
      currentUser.rol === "admin" ? loadAdminData() : loadWorkerData();
    const estado = document.getElementById("sync-status");
    if (estado)
      estado.textContent = `🟢 Sincronizado · ${new Date().toLocaleTimeString( "es-VE" )}`;
  } catch (e) {
    console.error("Sincronización fallida:", e);
    const estado = document.getElementById("sync-status");
    if (estado)
      estado.textContent =
        "🔴 Sin conexión con Supabase. No se confirman registros.";
  } finally {
    syncEnCurso = false;
  }
}

async function login() {
  const uInput = (document.getElementById("login-usuario").value || "")
    .trim()
    .toLowerCase();
  const pInput = (document.getElementById("login-pin").value || "").trim();

  if (!uInput || !pInput) {
    alert("Ingresa usuario y PIN.");
    return;
  }

  if (!supabaseClient) {
    alert(
      "Supabase no está disponible. No se permite iniciar sesión sin verificar los datos."
    );
    return;
  }
  try {
    const { data: users, error } = await supabaseClient
      .from("usuarios")
      .select("*");
    if (error) throw error;
    cachedUsers = users || [];
  } catch (e) {
    alert("No se pudo verificar el usuario en Supabase: " + e.message);
    return;
  }

  let user = cachedUsers.find(
    (u) =>
      (u.usuario || "").toLowerCase() === uInput ||
      (u.nombre || "").toLowerCase() === uInput ||
      ((uInput === "admin" ||
        uInput === "administrador" ||
        uInput === "angel" ||
        uInput === "ángel") &&
        (u.usuario === "administrador" || u.rol === "admin"))
  );

  if (!user) {
    alert("El usuario '" + uInput + "' no existe en el sistema.");
    return;
  }

  if (pInput === String(user.pin).trim()) {
    currentUser = user;
    localStorage.setItem("active_user_id", user.id);
    document.getElementById("sec-login").classList.add("hidden");

    if (user.rol === "admin" || user.usuario === "administrador") {
      document.getElementById("sec-admin").classList.remove("hidden");
      initSemanaEnCursoDates("filtro-desde", "filtro-hasta");
      loadAdminData();
    } else {
      document.getElementById("sec-trabajador").classList.remove("hidden");
      document.getElementById(
        "worker-title"
      ).innerText = `Trabajador: ${currentUser.nombre}`;
      document.getElementById("w-tarifa-input").value =
        currentUser.tarifa !== undefined ? currentUser.tarifa : 1.0;
      initSemanaEnCursoDates("w-filtro-desde", "w-filtro-hasta");
      loadWorkerData();
    }
    registrarPresencia().catch((e) =>
      console.warn("Presencia no disponible:", e)
    );
    syncDataFromSupabase();
  } else {
    alert("PIN incorrecto.");
  }
}

function logout() {
  desconectarPresencia();
  currentUser = null;
  currentShift = null;
  localStorage.removeItem("active_user_id");
  document.getElementById("sec-admin").classList.add("hidden");
  document.getElementById("sec-trabajador").classList.add("hidden");
  document.getElementById("sec-login").classList.remove("hidden");
}

function loadWorkerData() {
  if (!currentUser) return;
  currentShift =
    cachedTurnos.find(
      (t) =>
        String(t.id_usuario) === String(currentUser.id) &&
        (t.estado === "en_turno" || !t.hora_salida)
    ) || null;
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
  document.getElementById("confirm-title").innerText = enTurno
    ? "¿Finalizar Turno?"
    : "¿Iniciar Turno?";
  document.getElementById("confirm-text").innerText = enTurno
    ? "¿Estás seguro que deseas finalizar tu turno?"
    : "¿Estás seguro que deseas iniciar un nuevo turno de trabajo?";

  const modalConfirm = document.getElementById("modal-confirm");
  if (modalConfirm) {
    modalConfirm.classList.remove("hidden");
    modalConfirm.style.display = "flex";
  }
}

let fichajeEnCurso = false;
async function ejecutarToggleTurno() {
  closeModals();
  if (fichajeEnCurso || !currentUser) return;
  if (!supabaseClient) {
    alert("No hay conexión con Supabase. No se ha registrado el turno.");
    return;
  }
  fichajeEnCurso = true;
  try {
    const ahora = Date.now(),
      fecha = getFormattedDate(new Date(ahora));
    const { data: abiertos, error: errA } = await supabaseClient
      .from("registros_turnos")
      .select("*")
      .eq("id_usuario", Number(currentUser.id))
      .is("hora_salida", null)
      .order("hora_entrada", { ascending: false })
      .limit(2);
    if (errA) throw errA;
    if (abiertos.length > 1)
      throw new Error("Hay varios turnos abiertos. Contacta al administrador.");
    const turno = abiertos[0] || null;
    if (!turno) {
      const { data: anteriores, error: errP } = await supabaseClient
        .from("registros_turnos")
        .select("id")
        .eq("id_usuario", Number(currentUser.id))
        .eq("fecha_inicio", fecha)
        .limit(1);
      if (errP) throw errP;
      const { data, error } = await supabaseClient
        .from("registros_turnos")
        .insert({
          id_usuario: Number(currentUser.id),
          fecha_inicio: fecha,
          hora_entrada: ahora,
          estado: "en_turno",
          origen: "sistema",
        })
        .select()
        .single();
      if (error) throw error;
      await syncDataFromSupabase();
      copiarReportePortapapeles(
        currentUser.nombre,
        "INICIO",
        fecha,
        ahora,
        "",
        "",
        "",
        anteriores.length > 0,
        data.id
      );
    } else {
      const hrs = Math.max(0, (ahora - Number(turno.hora_entrada)) / 3600000);
      const { data, error } = await supabaseClient
        .from("registros_turnos")
        .update({
          hora_salida: ahora,
          horas_totales: Number(hrs.toFixed(4)),
          estado: "completado",
        })
        .eq("id", turno.id)
        .is("hora_salida", null)
        .select()
        .single();
      if (error || !data) throw error || new Error("No se confirmó la salida.");
      await syncDataFromSupabase();
      const { data: previos, error: errP } = await supabaseClient
        .from("registros_turnos")
        .select("id")
        .eq("id_usuario", Number(currentUser.id))
        .eq("fecha_inicio", turno.fecha_inicio)
        .lt("hora_entrada", Number(turno.hora_entrada))
        .limit(1);
      if (errP) throw errP;
      copiarReportePortapapeles(
        currentUser.nombre,
        "FIN",
        turno.fecha_inicio,
        turno.hora_entrada,
        fecha,
        ahora,
        `${hrs.toFixed(2)} hrs`,
        previos.length > 0,
        turno.id
      );
    }
  } catch (e) {
    alert(
      "⚠️ No se pudo confirmar el turno en Supabase. NO se registró como guardado.\n" +
        e.message +
        "\nConserva la hora y avisa al administrador."
    );
    await syncDataFromSupabase();
  } finally {
    fichajeEnCurso = false;
  }
}

function renderTablaTrabajador() {
  if (!currentUser) return;
  const desde = document.getElementById("w-filtro-desde")
    ? document.getElementById("w-filtro-desde").value
    : "";
  const hasta = document.getElementById("w-filtro-hasta")
    ? document.getElementById("w-filtro-hasta").value
    : "";
  const tbody = document.getElementById("tabla-resumen-trabajador");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filtrados = cachedTurnos
    .filter((t) => {
      if (String(t.id_usuario) !== String(currentUser.id)) return false;
      if (t.estado === "en_turno" || !t.hora_salida) return true;
      if (desde && t.fecha_inicio < desde) return false;
      if (hasta && t.fecha_inicio > hasta) return false;
      return true;
    })
    .sort((a, b) => b.hora_entrada - a.hora_entrada);

  let totalMinutosPeriodo = 0;

  filtrados.forEach((t) => {
    let entMs =
      typeof t.hora_entrada === "number"
        ? t.hora_entrada
        : new Date(t.hora_entrada).getTime();
    let salMs = t.hora_salida
      ? typeof t.hora_salida === "number"
        ? t.hora_salida
        : new Date(t.hora_salida).getTime()
      : 0;

    let minsTurno = 0;
    if (entMs && salMs && salMs > entMs) {
      minsTurno = (salMs - entMs) / (1000 * 60);
    } else if (t.horas_totales) {
      minsTurno = parseFloat(t.horas_totales) * 60;
    }
    totalMinutosPeriodo += minsTurno;

    let horasTurno = minsTurno / 60;
    let horasDisplay =
      t.estado === "en_turno" || !t.hora_salida
        ? '<span class="txt-green">Activo</span>'
        : horasTurno >= 1
        ? `${horasTurno.toFixed(2)} hrs`
        : `${Math.round(minsTurno)} min`;

    const tr = document.createElement("tr");
    tr.innerHTML = ` <td>${formatFechaEsp(t.fecha_inicio)} ${getFormattedDateTime( t.hora_entrada )}</td> <td>${ t.hora_salida ? formatFechaEsp(getFormattedDate(new Date(t.hora_salida))) + " " + getFormattedDateTime(t.hora_salida) : '<span class="txt-green">Activo</span>' }</td> <td class="txt-green"><strong>${horasDisplay}</strong></td> `;
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

  let userInCache = cachedUsers.find(
    (u) => String(u.id) === String(currentUser.id)
  );
  if (userInCache) userInCache.tarifa = tarifaVal;

  if (supabaseClient) {
    try {
      await supabaseClient
        .from("usuarios")
        .update({ tarifa: tarifaVal })
        .eq("id", currentUser.id);
    } catch (e) {}
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
  let horas = match
    ? parseFloat(match[1])
    : parseFloat(labelPeriodo.innerText) || 0;

  labelTotal.innerText = `$${(horas * tarifa).toFixed(2)}`;
  if (labelDetalle) labelDetalle.innerText = `Suma de ${horas.toFixed(2)} hrs`;
}

function loadAdminData() {
  renderTablaUsuariosAdmin();
  renderHistorialAdmin();
}

function renderTablaUsuariosAdmin() {
  const desde = document.getElementById("filtro-desde")
    ? document.getElementById("filtro-desde").value
    : "";
  const hasta = document.getElementById("filtro-hasta")
    ? document.getElementById("filtro-hasta").value
    : "";
  let d1 = desde ? new Date(desde) : new Date();
  let d2 = hasta ? new Date(hasta) : new Date();
  let semanas = Math.max(
    1,
    (Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1) / 7
  );

  const turnosFiltrados = cachedTurnos.filter(
    (t) =>
      (!desde || t.fecha_inicio >= desde) && (!hasta || t.fecha_inicio <= hasta)
  );
  const tbody = document.getElementById("tabla-usuarios");
  if (!tbody) return;
  tbody.innerHTML = "";

  cachedUsers.forEach((u, index) => {
    let tarifaVal = u.tarifa !== undefined ? parseFloat(u.tarifa) : 1.0;
    let tipoPago = (u.tipo_pago || "Horas").trim();

    let totalMinsUser = 0;
    turnosFiltrados
      .filter((t) => String(t.id_usuario) === String(u.id))
      .forEach((t) => {
        let entMs =
          typeof t.hora_entrada === "number"
            ? t.hora_entrada
            : new Date(t.hora_entrada).getTime();
        let salMs = t.hora_salida
          ? typeof t.hora_salida === "number"
            ? t.hora_salida
            : new Date(t.hora_salida).getTime()
          : 0;
        if (entMs && salMs && salMs > entMs) {
          totalMinsUser += (salMs - entMs) / (1000 * 60);
        } else if (t.estado === "en_turno" || !t.hora_salida) {
          let nowMs = Date.now();
          if (nowMs > entMs) {
            totalMinsUser += (nowMs - entMs) / (1000 * 60);
          }
        } else if (t.horas_totales) {
          totalMinsUser += parseFloat(t.horas_totales) * 60;
        }
      });
    let totalHoras = totalMinsUser / 60;

    let totalPagar =
      tipoPago === "Gasolina"
        ? totalHoras * 1.4 * 0.5
        : tipoPago === "Fijo"
        ? tarifaVal * semanas
        : totalHoras * tarifaVal;

    const pinId = `pin-text-${index}`;
    const btnId = `pin-btn-${index}`;
    const inputTarifaId = `tarifa-input-${u.id}`;

    const tr = document.createElement("tr");
    tr.innerHTML = ` <td><strong>${u.nombre}</strong><div style="font-size:.72rem;color:${ conectados.has(String(u.id)) ? "#10b981" : "#94a3b8" }">${ conectados.has(String(u.id)) ? "● Conectado" : "○ Sin conexión detectada" }</div></td> <td><span id="${pinId}" data-pin="${ u.pin }">••••</span><button id="${btnId}" onclick="togglePinVisibility('${pinId}', '${btnId}')" class="btn-icon" style="margin-left:5px;">👁️</button></td> <td>${tipoPago}</td> <td><input type="number" id="${inputTarifaId}" value="${tarifaVal.toFixed( 2 )}" step="0.1" style="width: 80px; padding: 4px;" onchange="actualizarTarifaUsuarioAdmin(${ u.id }, this.value)"></td> <td>${u.cargo || "Operaciones"}</td> <td class="txt-green"><strong>${ tipoPago === "Fijo" ? "-" : totalHoras < 1 ? Math.round(totalMinsUser) + " min" : totalHoras.toFixed(2) + " hrs" }</strong></td> <td class="txt-green"><strong>$${totalPagar.toFixed(2)}</strong></td> <td> <button onclick="openEditarUsuarioModal(${ u.id })" class="btn-icon">✏️</button> ${ u.usuario !== "admin" && u.usuario !== "administrador" ? `<button onclick="borrarUsuario(${u.id})" class="btn-icon">🗑️</button>` : "" } </td> `;
    tbody.appendChild(tr);
  });
}

async function actualizarTarifaUsuarioAdmin(userId, nuevaTarifa) {
  let val = parseFloat(nuevaTarifa) || 0;
  let user = cachedUsers.find((u) => String(u.id) === String(userId));
  if (user) {
    user.tarifa = val;
    if (supabaseClient) {
      try {
        await supabaseClient
          .from("usuarios")
          .update({ tarifa: val })
          .eq("id", userId);
      } catch (e) {}
    }
    loadAdminData();
  }
}

function renderHistorialAdmin() {
  const desde = document.getElementById("filtro-desde")
    ? document.getElementById("filtro-desde").value
    : "";
  const hasta = document.getElementById("filtro-hasta")
    ? document.getElementById("filtro-hasta").value
    : "";

  const turnosFiltrados = cachedTurnos
    .filter((t) => {
      if (t.estado === "en_turno" || !t.hora_salida) return true;
      if (desde && t.fecha_inicio < desde) return false;
      if (hasta && t.fecha_inicio > hasta) return false;
      return true;
    })
    .sort((a, b) => b.hora_entrada - a.hora_entrada);

  const tbody = document.getElementById("tabla-asistencias");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (turnosFiltrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No hay registros en este rango de fechas.</td></tr>`;
    return;
  }

  turnosFiltrados.forEach((t) => {
    const userObj = cachedUsers.find(
      (u) => String(u.id) === String(t.id_usuario)
    );
    const nombreUsuario = userObj ? userObj.nombre : "Desconocido";

    let entMs =
      typeof t.hora_entrada === "number"
        ? t.hora_entrada
        : new Date(t.hora_entrada).getTime();
    let salMs = t.hora_salida
      ? typeof t.hora_salida === "number"
        ? t.hora_salida
        : new Date(t.hora_salida).getTime()
      : 0;

    let mins = 0;
    if (entMs && salMs && salMs > entMs) {
      mins = Math.round((salMs - entMs) / (1000 * 60));
    } else if (t.estado === "en_turno" || !t.hora_salida) {
      mins = Math.round((Date.now() - entMs) / (1000 * 60));
    } else if (t.horas_totales) {
      mins = Math.round(t.horas_totales * 60);
    }

    let horasDisp =
      t.estado === "en_turno" || !t.hora_salida
        ? '<span class="txt-green">En Línea (Activo)</span>'
        : mins >= 60
        ? `${(mins / 60).toFixed(2)} hrs`
        : `${mins} min`;

    let botonesForzar =
      t.estado === "en_turno" || !t.hora_salida
        ? `<button onclick="forzarSalida(${t.id})" class="btn-action btn-red" style="padding:4px 8px; font-size:0.75rem; margin-right:5px;">Forzar Salida</button>`
        : "";

    const tr = document.createElement("tr");
    tr.innerHTML = ` <td><strong>${nombreUsuario}</strong></td> <td>${formatFechaEsp(t.fecha_inicio)} ${getFormattedDateTime( t.hora_entrada )}</td> <td>${ t.hora_salida ? formatFechaEsp(getFormattedDate(new Date(t.hora_salida))) + " " + getFormattedDateTime(t.hora_salida) : '<span class="txt-green">Activo</span>' }</td> <td class="txt-green"><strong>${horasDisp}</strong></td> <td> <div class="actions-cell"> ${botonesForzar} <button onclick="window.abrirModalEditarTurno(${ t.id })" class="btn-action btn-blue" style="padding:6px 12px; font-size:0.85rem;">✏️ Editar</button> <button onclick="borrarTurnoUnico(${ t.id })" class="btn-action btn-red" style="padding:6px 12px; font-size:0.85rem;">🗑️ Borrar</button> </div> </td> `;
    tbody.appendChild(tr);
  });
}

window.abrirModalEditarTurno = function (idTurno) {
  let t = cachedTurnos.find((x) => String(x.id) === String(idTurno));
  if (!t) return;

  const userObj = cachedUsers.find(
    (u) => String(u.id) === String(t.id_usuario)
  );
  const nombreTrabajador = userObj ? userObj.nombre : "Trabajador";

  document.getElementById("edit-turno-id").value = t.id;
  document.getElementById("edit-turno-nombre-trabajador").value =
    nombreTrabajador;
  document.getElementById("edit-turno-entrada-datetime").value =
    getDateTimeLocalString(t.hora_entrada);
  document.getElementById("edit-turno-salida-datetime").value = t.hora_salida
    ? getDateTimeLocalString(t.hora_salida)
    : getDateTimeLocalString(t.hora_entrada);

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
  const valEntrada = document.getElementById(
    "edit-turno-entrada-datetime"
  ).value;
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
  let nuevaFechaInicio = valEntrada.split("T")[0];

  let t = cachedTurnos.find((x) => String(x.id) === String(idTurno));
  if (t) {
    t.fecha_inicio = nuevaFechaInicio;
    t.hora_entrada = Number(tEntrada);
    t.hora_salida = Number(tSalida);
    t.horas_totales = parseFloat(diffHrs.toFixed(4));
    t.estado = "completado";
    guardarTurnosLocales();
  }

  if (supabaseClient) {
    try {
      await supabaseClient
        .from("registros_turnos")
        .update({
          fecha_inicio: nuevaFechaInicio,
          hora_entrada: Number(tEntrada),
          hora_salida: Number(tSalida),
          horas_totales: parseFloat(diffHrs.toFixed(4)),
          estado: "completado",
        })
        .eq("id", idTurno);
    } catch (e) {}
  }

  cerrarModalEditarTurno();
  syncDataFromSupabase();
  alert("¡Registro de turno actualizado correctamente!");
}

async function borrarTurnoUnico(idTurno) {
  if (confirm("¿Estás seguro de eliminar este registro de turno?")) {
    cachedTurnos = cachedTurnos.filter((x) => String(x.id) !== String(idTurno));
    guardarTurnosLocales();

    if (supabaseClient) {
      try {
        await supabaseClient
          .from("registros_turnos")
          .delete()
          .eq("id", idTurno);
      } catch (e) {}
    }

    syncDataFromSupabase();
  }
}

async function forzarSalida(idTurno) {
  if (confirm("¿Forzar salida de este turno activo?")) {
    const now = new Date();
    let t = cachedTurnos.find((x) => String(x.id) === String(idTurno));
    if (t) {
      let entMs =
        typeof t.hora_entrada === "number"
          ? t.hora_entrada
          : new Date(t.hora_entrada).getTime();
      let diffHrs = Math.max(0, (now.getTime() - entMs) / (1000 * 60 * 60));
      t.hora_salida = Number(now.getTime());
      t.horas_totales = parseFloat(diffHrs.toFixed(4));
      t.estado = "completado";
      guardarTurnosLocales();
    }
    if (supabaseClient) {
      try {
        await supabaseClient
          .from("registros_turnos")
          .update({
            hora_salida: Number(now.getTime()),
            horas_totales: t ? t.horas_totales : 1,
            estado: "completado",
          })
          .eq("id", idTurno);
      } catch (e) {}
    }
    syncDataFromSupabase();
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
  const user = cachedUsers.find((u) => String(u.id) === String(id));
  if (!user) return;

  if (user.usuario === "administrador" || user.rol === "admin") {
    alert("El usuario administrador (Ángel) es fijo y no requiere edición.");
    return;
  }

  document.getElementById("modal-user-title").innerText =
    "Editar Usuario: " + user.nombre;
  document.getElementById("edit-user-id").value = user.id;
  document.getElementById("edit-user-nombre").value = user.nombre;
  document.getElementById("edit-user-pin").value = user.pin;
  document.getElementById("edit-user-tipo").value = user.tipo_pago || "Horas";
  document.getElementById("edit-user-tarifa").value =
    user.tarifa !== undefined ? user.tarifa : 1.0;
  document.getElementById("edit-user-cargo").value =
    user.cargo || "Operaciones";
  document.getElementById("edit-user-rol").value = user.rol || "trabajador";
  document.getElementById("modal-usuario").classList.remove("hidden");
  document.getElementById("modal-usuario").style.display = "flex";
}

async function guardarUsuario() {
  const id = document.getElementById("edit-user-id").value;
  const nombre = (
    document.getElementById("edit-user-nombre").value || ""
  ).trim();
  const pin = (document.getElementById("edit-user-pin").value || "").trim();
  const tipo_pago = document.getElementById("edit-user-tipo").value;
  const valTarifa =
    parseFloat(document.getElementById("edit-user-tarifa").value) || 1.0;
  const cargo = document.getElementById("edit-user-cargo").value;
  const rol = document.getElementById("edit-user-rol").value;
  const usuario = nombre.toLowerCase().trim().replace(/\s+/g, "");

  if (!nombre || !pin) {
    alert("Ingresa nombre y PIN.");
    return;
  }
  let payload = {
    nombre,
    usuario,
    pin,
    tipo_pago,
    tarifa: valTarifa,
    cargo,
    rol,
  };

  if (supabaseClient) {
    if (id) await supabaseClient.from("usuarios").update(payload).eq("id", id);
    else await supabaseClient.from("usuarios").insert([payload]);
  }
  closeModals();
  syncDataFromSupabase();
  alert("¡Trabajador guardado con éxito!");
}

async function borrarUsuario(id) {
  let user = cachedUsers.find((u) => String(u.id) === String(id));
  if (user && (user.usuario === "administrador" || user.rol === "admin")) {
    alert("No se puede eliminar al administrador principal.");
    return;
  }
  if (confirm("¿Borrar usuario de forma permanente?")) {
    if (supabaseClient) {
      await supabaseClient.from("usuarios").delete().eq("id", id);
    }
    syncDataFromSupabase();
  }
}

function openAgregarHorasModal() {
  const sel = document.getElementById("manual-user-select");
  if (sel) {
    sel.innerHTML = "";
    cachedUsers.forEach(
      (u) =>
        (sel.innerHTML += `<option value="${u.id}">${u.nombre} (${ u.tipo_pago || "Horas" })</option>`)
    );
  }
  const hoyStr = getFormattedDate();
  document.getElementById("manual-fecha-inicio").value = hoyStr;
  document.getElementById("manual-fecha-fin").value = hoyStr;
  document.getElementById("modal-agregar-horas").classList.remove("hidden");
  document.getElementById("modal-agregar-horas").style.display = "flex";
}

async function guardarHorasManuales() {
  const userId = parseInt(document.getElementById("manual-user-select").value);
  const fechaInicio = document.getElementById("manual-fecha-inicio").value;
  const fechaFin =
    document.getElementById("manual-fecha-fin").value || fechaInicio;
  const hEntrada = document.getElementById("manual-entrada").value;
  const hSalida = document.getElementById("manual-salida").value;

  if (!fechaInicio || !hEntrada || !hSalida) {
    alert("Por favor completa la fecha de inicio y las horas.");
    return;
  }

  let tEntrada = fechaHoraVenezuelaMs(fechaInicio, hEntrada);
  let tSalida = fechaHoraVenezuelaMs(fechaFin, hSalida);

  if (tSalida <= tEntrada) {
    alert(
      "La fecha y hora de salida debe ser posterior a la fecha y hora de entrada."
    );
    return;
  }

  let diffHrs = Math.max(0, (tSalida - tEntrada) / (1000 * 60 * 60));

  const payloadSupabase = {
    id_usuario: Number(userId),
    fecha_inicio: fechaInicio,
    hora_entrada: Number(tEntrada),
    hora_salida: Number(tSalida),
    horas_totales: parseFloat(diffHrs.toFixed(4)),
    estado: "completado",
    origen: "manual",
  };

  if (!supabaseClient) {
    alert("Sin conexión a Supabase. No se guardaron horas.");
    return;
  }
  try {
    const { error } = await supabaseClient
      .from("registros_turnos")
      .insert([payloadSupabase]);
    if (error) throw error;
  } catch (e) {
    alert("No se guardaron horas: " + e.message);
    return;
  }
  closeModals();
  syncDataFromSupabase();
  alert("¡Horas cargadas correctamente y sincronizadas!");
}

function abrirResumenPagoModal() {
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;
  if (!desde || !hasta) {
    alert("Selecciona el rango de fechas.");
    return;
  }

  let d1 = new Date(desde);
  let d2 = new Date(hasta);
  let semanas = Math.max(
    1,
    (Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1) / 7
  );
  const turnosFiltrados = cachedTurnos.filter(
    (t) => t.fecha_inicio >= desde && t.fecha_inicio <= hasta
  );

  document.getElementById(
    "resumen-rango-fechas"
  ).innerText = `Período del ${formatFechaEsp(desde)} al ${formatFechaEsp( hasta )}`;

  let html = ` <table style="width: 100%; margin-top: 0; font-size: 0.85rem;"> <thead> <tr style="border-bottom: 2px solid var(--border-color);"> <th style="padding: 8px 4px;">Nombre</th> <th style="padding: 8px 4px;">Tipo</th> <th style="padding: 8px 4px;">Horas</th> <th style="padding: 8px 4px;">Tarifa ($)</th> <th style="padding: 8px 4px; text-align: right;">Monto ($)</th> </tr> </thead> <tbody> `;

  let granTotal = 0;

  cachedUsers.forEach((u) => {
    const userTurnos = turnosFiltrados.filter(
      (t) => String(t.id_usuario) === String(u.id)
    );
    let totalMinsUser = 0;
    userTurnos.forEach((t) => {
      let entMs =
        typeof t.hora_entrada === "number"
          ? t.hora_entrada
          : new Date(t.hora_entrada).getTime();
      let salMs = t.hora_salida
        ? typeof t.hora_salida === "number"
          ? t.hora_salida
          : new Date(t.hora_salida).getTime()
        : 0;
      if (entMs && salMs && salMs > entMs) {
        totalMinsUser += (salMs - entMs) / (1000 * 60);
      } else if (t.estado === "en_turno" || !t.hora_salida) {
        let nowMs = Date.now();
        if (nowMs > entMs) totalMinsUser += (nowMs - entMs) / (1000 * 60);
      } else if (t.horas_totales) {
        totalMinsUser += parseFloat(t.horas_totales) * 60;
      }
    });
    let totalHoras = totalMinsUser / 60;

    let tarifaVal = u.tarifa !== undefined ? parseFloat(u.tarifa) : 1.0;
    let tipoPago = (u.tipo_pago || "Horas").trim();
    let totalPagar =
      tipoPago === "Gasolina"
        ? totalHoras * 1.4 * 0.5
        : tipoPago === "Fijo"
        ? tarifaVal * semanas
        : totalHoras * tarifaVal;

    let horasStr = tipoPago === "Fijo" ? "-" : `${totalHoras.toFixed(2)} hrs`;
    let tarifaStr =
      tipoPago === "Fijo"
        ? `$${tarifaVal.toFixed(2)}/sem`
        : `$${tarifaVal.toFixed(2)}`;

    html += ` <tr style="border-bottom: 1px solid var(--border-color);"> <td style="padding: 8px 4px;"><strong>${u.nombre}</strong></td> <td style="padding: 8px 4px; color: var(--text-muted);">${tipoPago}</td> <td style="padding: 8px 4px;" class="txt-green">${horasStr}</td> <td style="padding: 8px 4px;">${tarifaStr}</td> <td style="padding: 8px 4px; text-align: right;" class="txt-green"><strong>$${totalPagar.toFixed( 2 )}</strong></td> </tr> `;
    granTotal += totalPagar;
  });

  html += ` </tbody> </table> <div style="margin-top:15px; padding-top:10px; border-top:2px solid #10b981; text-align:right; font-size:1.1rem; font-weight:bold;"> Total a Pagar: <span class="txt-green">$${granTotal.toFixed(2)}</span> </div> `;

  document.getElementById("resumen-pago-contenido").innerHTML = html;
  document.getElementById("modal-resumen-pago").classList.remove("hidden");
  document.getElementById("modal-resumen-pago").style.display = "flex";
}

function copiarResumenPago() {
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;
  let d1 = new Date(desde);
  let d2 = new Date(hasta);
  let semanas = Math.max(
    1,
    (Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1) / 7
  );
  const turnosFiltrados = cachedTurnos.filter(
    (t) => t.fecha_inicio >= desde && t.fecha_inicio <= hasta
  );

  let textoCopy = `📊 *REPORTE DE NÓMINA*\n📅 Período: ${formatFechaEsp( desde )} al ${formatFechaEsp(hasta)}\n\n`;
  let granTotal = 0;

  cachedUsers.forEach((u) => {
    const userTurnos = turnosFiltrados.filter(
      (t) => String(t.id_usuario) === String(u.id)
    );
    let totalMinsUser = 0;
    userTurnos.forEach((t) => {
      let entMs =
        typeof t.hora_entrada === "number"
          ? t.hora_entrada
          : new Date(t.hora_entrada).getTime();
      let salMs = t.hora_salida
        ? typeof t.hora_salida === "number"
          ? t.hora_salida
          : new Date(t.hora_salida).getTime()
        : 0;
      if (entMs && salMs && salMs > entMs) {
        totalMinsUser += (salMs - entMs) / (1000 * 60);
      } else if (t.estado === "en_turno" || !t.hora_salida) {
        let nowMs = Date.now();
        if (nowMs > entMs) totalMinsUser += (nowMs - entMs) / (1000 * 60);
      } else if (t.horas_totales) {
        totalMinsUser += parseFloat(t.horas_totales) * 60;
      }
    });
    let totalHoras = totalMinsUser / 60;
    let tarifaVal = u.tarifa !== undefined ? parseFloat(u.tarifa) : 1.0;
    let tipoPago = (u.tipo_pago || "Horas").trim();
    let totalPagar =
      tipoPago === "Gasolina"
        ? totalHoras * 1.4 * 0.5
        : tipoPago === "Fijo"
        ? tarifaVal * semanas
        : totalHoras * tarifaVal;

    let detalle =
      tipoPago === "Fijo"
        ? `Sueldo Fijo`
        : `${totalHoras.toFixed(2)} hrs x $${tarifaVal.toFixed(2)}`;
    textoCopy += `• *${u.nombre}* (${detalle}): *$${totalPagar.toFixed(2)}*\n`;
    granTotal += totalPagar;
  });

  textoCopy += `\n💰 *Total a Pagar:* *$${granTotal.toFixed(2)}*`;

  navigator.clipboard
    .writeText(textoCopy)
    .then(() => alert("¡Reporte de nómina copiado!"))
    .catch((err) => alert("Error al copiar: " + err));
}

function openConfigTarifasModal() {
  document.getElementById("modal-config-tarifas").classList.remove("hidden");
  document.getElementById("modal-config-tarifas").style.display = "flex";
}

async function aplicarTarifaGlobal() {
  const nueva = parseFloat(
    document.getElementById("global-tarifa-input").value
  );
  if (isNaN(nueva)) return;
  cachedUsers.forEach((u) => {
    if (
      (u.tipo_pago || "").toLowerCase() !== "gasolina" &&
      (u.tipo_pago || "").toLowerCase() !== "fijo"
    )
      u.tarifa = nueva;
  });
  if (supabaseClient) {
    try {
      for (let u of cachedUsers) {
        if (
          (u.tipo_pago || "").toLowerCase() !== "gasolina" &&
          (u.tipo_pago || "").toLowerCase() !== "fijo"
        ) {
          await supabaseClient
            .from("usuarios")
            .update({ tarifa: nueva })
            .eq("id", u.id);
        }
      }
    } catch (e) {}
  }
  closeModals();
  syncDataFromSupabase();
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

  if (actual && actual !== String(currentUser.pin).trim()) {
    alert("El PIN actual no es correcto.");
    return;
  }
  if (nuevo && nuevo !== confirmar) {
    alert("El nuevo PIN y su confirmación no coinciden.");
    return;
  }

  if (nuevo) {
    currentUser.pin = nuevo;
    if (supabaseClient) {
      try {
        await supabaseClient
          .from("usuarios")
          .update({ pin: nuevo })
          .eq("id", currentUser.id);
      } catch (e) {}
    }
    alert("PIN actualizado con éxito.");
  }
  closeModals();
}

function closeModals() {
  document.querySelectorAll(".modal-backdrop").forEach((m) => {
    m.classList.add("hidden");
    m.style.display = "none";
  });
}

// IMPORTACIÓN DE CONSTANCIAS DE WHATSAPP (solo administrador).
function abrirImportacionWhatsApp() {
  if (!currentUser || currentUser.rol !== "admin") return;
  document.getElementById("modal-importar-whatsapp").classList.remove("hidden");
  document.getElementById("modal-importar-whatsapp").style.display = "flex";
}
function horaWhatsApp(h) {
  const m = String(h)
    .trim()
    .match(/(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?/i);
  if (!m) return null;
  let n = (Number(m[1]) % 12) + (m[3].toLowerCase() === "p" ? 12 : 0);
  return `${String(n).padStart(2, "0")}:${m[2]}`;
}
function extraerCampo(txt, nombres) {
  const re = new RegExp("(?:" + nombres + ")\\s*:\\*?\\s*([^\\n\\r]+)", "i");
  return (txt.match(re)?.[1] || "").replace(/\*/g, "").trim();
}
function analizarTextoWhatsApp(txt) {
  const partes = txt
    .split(/(?=🟢\s*\*?INICIO DE TURNO|🔴\s*\*?FINALIZACI[ÓO]N DE TURNO)/i)
    .map((x) => x.trim())
    .filter(Boolean);
  return partes.map((raw, i) => {
    const nombre = extraerCampo(raw, "Trabajador");
    const fechaTexto = extraerCampo(raw, "Fecha Inicio|Fecha");
    const fm = fechaTexto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const fecha = fm
      ? `${fm[3]}-${fm[2].padStart(2, "0")}-${fm[1].padStart(2, "0")}`
      : null;
    const fin = /FINALIZACI[ÓO]N/i.test(raw);
    const entrada = horaWhatsApp(
      extraerCampo(raw, fin ? "Entrada" : "Hora Entrada")
    );
    const salidaCampo = extraerCampo(raw, "Salida");
    const salida = fin ? horaWhatsApp(salidaCampo) : null;
    const fechaSalidaTexto = salidaCampo.match(/\((\d{1,2}\/\d{1,2}\/\d{4})\)/);
    const fechaSalida = fechaSalidaTexto
      ? fechaSalidaTexto[1].split("/").reverse().join("-")
      : null;
    const usuario = cachedUsers.find(
      (u) => u.nombre?.trim().toLowerCase() === nombre.toLowerCase()
    );
    const entradaMs =
      fecha && entrada ? fechaHoraVenezuelaMs(fecha, entrada) : NaN;
    let salidaMs =
      fecha && salida
        ? fechaHoraVenezuelaMs(fechaSalida || fecha, salida)
        : null;
    if (salidaMs !== null && !fechaSalida && salidaMs < entradaMs)
      salidaMs += 86400000;
    const error = !usuario
      ? "Trabajador no encontrado"
      : !fecha || !entrada
      ? "Fecha o entrada inválida"
      : fin && !salida
      ? "Salida no reconocida"
      : salidaMs !== null &&
        (salidaMs <= entradaMs || salidaMs - entradaMs > 36 * 3600000)
      ? "Duración sospechosa"
      : " ";
    return {
      i,
      raw,
      nombre,
      usuario,
      fecha,
      entradaMs,
      salidaMs,
      fin,
      error: error.trim(),
      numero: extraerCampo(raw, "N[.º°o\\s]*\\s*de reporte"),
    };
  });
}
let importacionPendiente = [];
function previsualizarWhatsApp() {
  importacionPendiente = analizarTextoWhatsApp(
    document.getElementById("texto-whatsapp").value
  );
  const box = document.getElementById("vista-importacion");
  box.replaceChildren();
  if (!importacionPendiente.length) {
    box.textContent = "No se detectaron reportes. Pega los mensajes completos.";
    return;
  }
  for (const r of importacionPendiente) {
    const div = document.createElement("div");
    div.style = "padding:8px;border-bottom:1px solid #475569";
    div.textContent = `${r.nombre || "Sin nombre"} · ${ r.fecha || "Sin fecha" } · ${r.fin ? "FINALIZACIÓN" : "INICIO"} · ${ r.error || "Listo para revisar" }`;
    box.append(div);
  }
  box.append(
    document.createTextNode(
      "Solo se recuperan turnos FINALIZADOS. Los inicios/continuaciones se reconocen, pero no se guardan como turnos abiertos para evitar horas fantasma."
    )
  );
}
async function confirmarImportacionWhatsApp() {
  if (!currentUser || currentUser.rol !== "admin" || !supabaseClient) return;
  if (!importacionPendiente.length) {
    alert("Primero analiza los mensajes.");
    return;
  }
  if (importacionPendiente.some((r) => r.error)) {
    alert("Corrige los reportes no reconocidos antes de importar.");
    return;
  }
  const finales = importacionPendiente.filter((r) => r.fin);
  if (!finales.length) {
    alert(
      "Para recuperar horas antiguas necesitas el mensaje de FINALIZACIÓN. Los mensajes de inicio se usan como referencia y no se importan como turnos abiertos."
    );
    return;
  }
  if (
    !confirm(
      `Se recuperarán ${finales.length} reportes de FINALIZACIÓN. Los ${ importacionPendiente.length - finales.length } mensajes de inicio solo sirven de referencia. ¿Continuar?`
    )
  )
    return;
  let creados = 0,
    omitidos = 0,
    errores = [];
  await syncDataFromSupabase();
  for (const r of importacionPendiente.filter((x) => x.fin)) {
    const mismo = cachedTurnos.find(
      (t) =>
        String(t.id_usuario) === String(r.usuario.id) &&
        Number(t.hora_entrada) === r.entradaMs
    );
    if (mismo) {
      if (r.fin && !mismo.hora_salida) {
        const hrs = (r.salidaMs - r.entradaMs) / 3600000;
        const { data, error } = await supabaseClient
          .from("registros_turnos")
          .update({
            hora_salida: r.salidaMs,
            horas_totales: Number(hrs.toFixed(4)),
            estado: "completado",
          })
          .eq("id", mismo.id)
          .is("hora_salida", null)
          .select()
          .single();
        if (error || !data)
          errores.push(`${r.nombre}: ${error?.message || "No se actualizó"}`);
        else creados++;
      } else if (r.fin && Number(mismo.hora_salida) !== r.salidaMs) {
        errores.push(
          `${r.nombre}: existe entrada con salida diferente; revisar manualmente`
        );
      } else omitidos++;
      continue;
    }
    const hrs = r.fin ? (r.salidaMs - r.entradaMs) / 3600000 : null;
    const payload = {
      id_usuario: Number(r.usuario.id),
      fecha_inicio: r.fecha,
      hora_entrada: r.entradaMs,
      hora_salida: r.salidaMs,
      horas_totales: hrs === null ? null : Number(hrs.toFixed(4)),
      estado: r.fin ? "completado" : "en_turno",
      origen: "whatsapp",
    };
    const { error } = await supabaseClient
      .from("registros_turnos")
      .insert(payload);
    if (error) errores.push(`${r.nombre}: ${error.message}`);
    else {
      creados++;
      cachedTurnos.push(payload);
    }
  }
  await syncDataFromSupabase();
  alert(
    `Importados/actualizados: ${creados}. Duplicados omitidos: ${omitidos}. Errores: ${ errores.length }\n${errores.join("\n")}`
  );
}