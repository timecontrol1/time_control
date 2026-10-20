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
    const d = new Date(val);
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
    const ahora = new Date();

    const fecha = new Intl.DateTimeFormat("es-VE", {
      timeZone: "America/Caracas",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(ahora);

    const hora = new Intl.DateTimeFormat("es-VE", {
      timeZone: "America/Caracas",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }).format(ahora);

    const horaTexto = `🇻🇪 Hora Actual: ${fecha} ${hora}`;

  document.querySelectorAll("#reloj-venezuela").forEach(el => {
  el.textContent = horaTexto;
});
};
  actualizarReloj();
  setInterval(actualizarReloj, 1000);
}

// ID visible: inicial del trabajador + ID de Supabase
function codigoTurno(nombre, id) {
  const inicial = (
    String(nombre || "T")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .match(/[A-Za-z]/)?.[0] || "T"
  ).toUpperCase();

  return id == null || id === ""
    ? "(pendiente)"
    : `#${inicial}${String(id).padStart(5, "0")}`;
}

function msTurno(valor) {
  if (valor == null || valor === "") return NaN;
  const n = Number(valor);
  return Number.isFinite(n) ? n : Date.parse(valor);
}

function mismoInstante(a, b) {
  return Number.isFinite(msTurno(a)) &&
    Number.isFinite(msTurno(b)) &&
    Math.abs(msTurno(a) - msTurno(b)) < 60000;
}

function htmlSeguro(valor) {
  return String(valor ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c])
  );
}

function copiarReportePortapapeles(
  nombreTrabajador,
  accion,
  fechaEntrada,
  horaEntrada,
  fechaSalida = "",
  horaSalida = "",
  totalHorasStr = "",
  esContinuacion = false,
  numeroReporte = null
) {
  let mensaje = "";
  let etiquetaContinuacion =
    esContinuacion ? " (Continuación de turno)" : "";
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
      fechaSalida && fechaSalida !== fechaEntrada
        ? ` (${fechaSalidaEsp})`
        : "";

    mensaje =
      `🔴 *FINALIZACIÓN DE TURNO${etiquetaContinuacion}*\n` +
      `👤 *Trabajador:* ${nombreTrabajador}\n` +
      `📅 *Fecha Inicio:* ${fechaEntradaEsp}\n` +
      `⏰ *Entrada:* ${horaEntradaLimpia}\n` +
      `⏰ *Salida:* ${horaSalidaLimpia}${detalleSalidaFecha}\n` +
      `⏱️ *Total Trabajado:* ${totalHorasStr}`;
  }

  if (numeroReporte !== null) {
    mensaje +=
      `\n🧾 *ID:* ${codigoTurno(nombreTrabajador, numeroReporte)}`;
  }

  if (!navigator.clipboard?.writeText) {
    window.prompt(
      "Copia este reporte y envíalo a WhatsApp:",
      mensaje
    );
    return;
  }

  navigator.clipboard.writeText(mensaje)
    .then(() => {
      alert(
        `¡Turno ${
          accion === "INICIO" ? "iniciado" : "finalizado"
        }!\n\n📋 Reporte copiado al portapapeles para WhatsApp.`
      );
    })
    .catch(() => {
      window.prompt(
        "El turno fue guardado, pero no se pudo copiar automáticamente:",
        mensaje
      );
    });
}

let currentUser = null;
let currentShift = null;
let pinSesionTurno = null;
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
let canalPresencia = null;
let conectados = new Set();

const identificadorSesion =
  globalThis.crypto?.randomUUID?.() ||
  String(Date.now()) + Math.random();

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

  if (el) {
    el.textContent =
      `🟢 Navegadores conectados: ${conectados.size} · Solo indicador informativo`;
  }

  if (currentUser?.rol === "admin") {
    renderTablaUsuariosAdmin();
  }
}

async function registrarPresencia() {
  if (!supabaseClient || !currentUser) return;

  if (!canalPresencia) {
    canalPresencia = supabaseClient.channel(
      "presencia-trabajadores-v1",
      {
        config: {
          presence: {
            key: identificadorSesion
          }
        }
      }
    );

    canalPresencia.on(
      "presence",
      { event: "sync" },
      actualizarPresencia
    );

    await new Promise((resolve, reject) =>
      canalPresencia.subscribe((status) => {
        if (status === "SUBSCRIBED") resolve();

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          reject(new Error(status));
        }
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
    localStorage.setItem(
      "app_turnos_locales",
      JSON.stringify(cachedTurnos)
    );
  } catch (e) {}
}

window.addEventListener("DOMContentLoaded", () => {
  try {
    initMatrixEffect();
  } catch (e) {}

  iniciarRelojEnVivo();

  syncDataFromSupabase();
  configurarRealtimeSupabase();
  setInterval(syncDataFromSupabase, 10000);

  try {
    const savedUserId = null;

    if (savedUserId) {
      let found = cachedUsers.find(
        (u) => String(u.id) === String(savedUserId)
      );

      if (found) {
        currentUser = found;

        document
          .getElementById("sec-login")
          .classList.add("hidden");

        if (currentUser.rol === "admin") {
          document
            .getElementById("sec-admin")
            .classList.remove("hidden");

          initSemanaEnCursoDates(
            "filtro-desde",
            "filtro-hasta"
          );

          loadAdminData();
        } else {
          document
            .getElementById("sec-trabajador")
            .classList.remove("hidden");

          document.getElementById(
            "worker-title"
          ).innerText = `Trabajador: ${currentUser.nombre}`;

          document.getElementById(
            "w-tarifa-input"
          ).value =
            currentUser.tarifa !== undefined
              ? currentUser.tarifa
              : 1.0;

          initSemanaEnCursoDates(
            "w-filtro-desde",
            "w-filtro-hasta"
          );

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
        {
          event: "*",
          schema: "public",
          table: "registros_turnos"
        },
        () => {
          syncDataFromSupabase();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "usuarios"
        },
        () => {
          syncDataFromSupabase();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          syncDataFromSupabase();
        }
      });
  } catch (err) {
    console.warn("Realtime no disponible:", err);
  }
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
      const text = letters.charAt(
        Math.floor(Math.random() * letters.length)
      );

      ctx.fillText(
        text,
        i * fontSize,
        drops[i] * fontSize
      );

      if (
        drops[i] * fontSize > canvas.height &&
        Math.random() > 0.975
      ) {
        drops[i] = 0;
      }

      drops[i]++;
    }
  }

  setInterval(draw, 33);
}

function initSemanaEnCursoDates(
  inputDesdeId,
  inputHastaId
) {
  const now = new Date();
  const vzla = getVenezuelaDate(now);

  const year = vzla.getUTCFullYear();
  const month = vzla.getUTCMonth();
  const date = vzla.getUTCDate();
  const dayOfWeek = vzla.getUTCDay();

  const distanceToMonday =
    dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(
    Date.UTC(year, month, date + distanceToMonday)
  );

  const sunday = new Date(
    Date.UTC(year, month, date + distanceToMonday + 6)
  );

  const formatDate = (d) => {
    const yyyy = d.getUTCFullYear();
    const mm = String(
      d.getUTCMonth() + 1
    ).padStart(2, "0");

    const dd = String(
      d.getUTCDate()
    ).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  };

  const elDesde = document.getElementById(inputDesdeId);
  const elHasta = document.getElementById(inputHastaId);

  if (elDesde && !elDesde.value) {
    elDesde.value = formatDate(monday);
  }

  if (elHasta && !elHasta.value) {
    elHasta.value = formatDate(sunday);
  }
}

let syncEnCurso = false;

async function syncDataFromSupabase() {
  if (!supabaseClient || syncEnCurso) return;

  syncEnCurso = true;

  try {
    const { data: users, error: errU } =
      await supabaseClient
        .from("usuarios")
        .select("*")
        .order("id");

    if (errU) throw errU;

    cachedUsers = users || [];

    if (currentUser) {
      currentUser =
        cachedUsers.find(
          (u) =>
            String(u.id) === String(currentUser.id)
        ) || currentUser;
    }

    let turnos = [];
    let desde = 0;
    const pagina = 500;

    while (true) {
      const { data, error } = await supabaseClient
        .from("registros_turnos")
        .select("*")
        .order("hora_entrada", {
          ascending: false
        })
        .range(desde, desde + pagina - 1);

      if (error) throw error;

      turnos.push(...(data || []));

      if (!data || data.length < pagina) {
        break;
      }

      desde += pagina;
    }

    cachedTurnos = turnos;
    guardarTurnosLocales();

    if (currentUser) {
      if (currentUser.rol === "admin") {
        loadAdminData();
      } else {
        loadWorkerData();
      }
    }

    const estado = document.getElementById(
      "sync-status"
    );

    if (estado) {
      estado.textContent =
        `🟢 Sincronizado · ${new Date().toLocaleTimeString("es-VE")}`;
    }
  } catch (e) {
    console.error("Sincronización fallida:", e);

    const estado = document.getElementById(
      "sync-status"
    );

    if (estado) {
      estado.textContent =
        "🔴 Sin conexión con Supabase. No se confirman registros.";
    }
  } finally {
    syncEnCurso = false;
  }
}

async function login() {
  const uInput = (
    document.getElementById("login-usuario").value || ""
  )
    .trim()
    .toLowerCase();

  const pInput = (
    document.getElementById("login-pin").value || ""
  ).trim();

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
    const { data: users, error } =
      await supabaseClient
        .from("usuarios")
        .select("*");

    if (error) throw error;

    cachedUsers = users || [];
  } catch (e) {
    alert(
      "No se pudo verificar el usuario en Supabase: " +
      e.message
    );
    return;
  }

  let user = cachedUsers.find(
    (u) =>
      (u.usuario || "").toLowerCase() === uInput ||
      (u.nombre || "").toLowerCase() === uInput ||
      (
        (
          uInput === "admin" ||
          uInput === "administrador" ||
          uInput === "angel" ||
          uInput === "ángel"
        ) &&
        (
          u.usuario === "administrador" ||
          u.rol === "admin"
        )
      )
  );

  if (!user) {
    alert(
      "El usuario '" + uInput +
      "' no existe en el sistema."
    );
    return;
  }

  if (pInput === String(user.pin).trim()) {
    currentUser = user;
pinSesionTurno = pInput;
    localStorage.setItem(
      "active_user_id",
      user.id
    );

    document
      .getElementById("sec-login")
      .classList.add("hidden");

    if (
      user.rol === "admin" ||
      user.usuario === "administrador"
    ) {
      document
        .getElementById("sec-admin")
        .classList.remove("hidden");

      initSemanaEnCursoDates(
        "filtro-desde",
        "filtro-hasta"
      );

      loadAdminData();
    } else {
      document
        .getElementById("sec-trabajador")
        .classList.remove("hidden");

      document.getElementById(
        "worker-title"
      ).innerText =
        `Trabajador: ${currentUser.nombre}`;

      document.getElementById(
        "w-tarifa-input"
      ).value =
        currentUser.tarifa !== undefined
          ? currentUser.tarifa
          : 1.0;

      initSemanaEnCursoDates(
        "w-filtro-desde",
        "w-filtro-hasta"
      );

      loadWorkerData();
    }

    registrarPresencia().catch((e) =>
      console.warn(
        "Presencia no disponible:",
        e
      )
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
pinSesionTurno = null;
  localStorage.removeItem("active_user_id");

  document
    .getElementById("sec-admin")
    .classList.add("hidden");

  document
    .getElementById("sec-trabajador")
    .classList.add("hidden");

  document
    .getElementById("sec-login")
    .classList.remove("hidden");
}

function loadWorkerData() {
  if (!currentUser) return;

  currentShift =
    cachedTurnos.find(
      (t) =>
        String(t.id_usuario) ===
          String(currentUser.id) &&
        (
          t.estado === "en_turno" ||
          !t.hora_salida
        )
    ) || null;

  actualizarBotonesTurno(!!currentShift);

  renderTablaTrabajador();
  calcularSimuladorCobro();
}

function actualizarBotonesTurno(enTurno) {
  const btnFichar =
    document.getElementById("btn-fichar");

  if (!btnFichar) return;

  if (enTurno) {
    btnFichar.innerText = "■ Finalizar Turno";

    btnFichar.style.setProperty(
      "background-color",
      "#ef4444",
      "important"
    );

    btnFichar.style.setProperty(
      "color",
      "#ffffff",
      "important"
    );
  } else {
    btnFichar.innerText = "▶ Iniciar Turno";

    btnFichar.style.setProperty(
      "background-color",
      "#10b981",
      "important"
    );

    btnFichar.style.setProperty(
      "color",
      "#022c22",
      "important"
    );
  }
}

function confirmarToggleTurno() {
  if (!currentUser) return;

  const enTurno = !!currentShift;

  document.getElementById(
    "confirm-title"
  ).innerText = enTurno
    ? "¿Finalizar Turno?"
    : "¿Iniciar Turno?";

  document.getElementById(
    "confirm-text"
  ).innerText = enTurno
    ? "¿Estás seguro que deseas finalizar tu turno?"
    : "¿Estás seguro que deseas iniciar un nuevo turno de trabajo?";

  const modalConfirm =
    document.getElementById("modal-confirm");

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
    const ahora = Date.now();
    const fecha = getFormattedDate(new Date(ahora));

    const { data: abiertos, error: errA } = await supabaseClient
      .from("registros_turnos")
      .select("*")
      .eq("id_usuario", Number(currentUser.id))
      .is("hora_salida", null)
      .order("hora_entrada", { ascending: false })
      .limit(2);

    if (errA) throw errA;

    if (abiertos.length > 1) {
      throw new Error(
        "Hay varios turnos abiertos. Contacta al administrador."
      );
    }

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
          origen: "sistema"
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
      const hrs = Math.max(
        0,
        (ahora - Number(turno.hora_entrada)) / 3600000
      );

      const { data, error } = await supabaseClient.rpc(
  "finalizar_turno_con_pin",
  {
    p_usuario: currentUser.usuario,
    p_pin: pinSesionTurno,
    p_turno_id: Number(turno.id)
  }
);

      // Una actualización puede devolver cero filas si las políticas RLS
      // impiden verla, o si otro dispositivo cerró el turno antes.
      // Evitar .single() permite mostrar una causa útil sin error PGRST116.
      if (error) throw error;
      if (!data || (Array.isArray(data) && data.length !== 1)) {
        throw new Error(
          "La salida no devolvió exactamente un turno confirmado. " +
          "Comprueba los permisos RLS de registros_turnos y si el turno " +
          "ya fue cerrado desde otro dispositivo. No vuelvas a fichar " +
          "hasta revisar el historial."
        );
      }

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
      "⚠️ No se pudo confirmar el turno en Supabase.\n" +
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
      if (String(t.id_usuario) !== String(currentUser.id)) {
        return false;
      }

      if (t.estado === "en_turno" || !t.hora_salida) {
        return true;
      }

      if (desde && t.fecha_inicio < desde) return false;
      if (hasta && t.fecha_inicio > hasta) return false;

      return true;
    })
    .sort((a, b) => b.hora_entrada - a.hora_entrada);

  let totalMinutosPeriodo = 0;

  filtrados.forEach((t) => {
    const entMs = msTurno(t.hora_entrada);
    const salMs = t.hora_salida
      ? msTurno(t.hora_salida)
      : 0;

    let minsTurno = 0;

    if (entMs && salMs && salMs > entMs) {
      minsTurno = (salMs - entMs) / 60000;
    } else if (t.horas_totales) {
      minsTurno = parseFloat(t.horas_totales) * 60;
    }

    totalMinutosPeriodo += minsTurno;

    const horasTurno = minsTurno / 60;

    const horasDisplay =
      t.estado === "en_turno" || !t.hora_salida
        ? '<span class="txt-green">Activo</span>'
        : horasTurno >= 1
        ? `${horasTurno.toFixed(2)} hrs`
        : `${Math.round(minsTurno)} min`;

    const codigo = codigoTurno(currentUser.nombre, t.id);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <strong class="txt-green">${htmlSeguro(codigo)}</strong>
        <div>
          ${formatFechaEsp(t.fecha_inicio)}
          ${getFormattedDateTime(t.hora_entrada)}
        </div>
      </td>
      <td>
        ${
          t.hora_salida
            ? formatFechaEsp(
                getFormattedDate(new Date(msTurno(t.hora_salida)))
              ) +
              " " +
              getFormattedDateTime(t.hora_salida)
            : '<span class="txt-green">Activo</span>'
        }
      </td>
      <td class="txt-green">
        <strong>${horasDisplay}</strong>
      </td>
    `;

    tbody.appendChild(tr);
  });

  const totalHorasPeriodo = totalMinutosPeriodo / 60;
  const labelTotal = document.getElementById("w-total-periodo");

  if (labelTotal) {
    labelTotal.innerText = `${totalHorasPeriodo.toFixed(2)} hrs`;
  }

  calcularSimuladorCobro();
}

async function actualizarTarifaIndividualTrabajador(nuevaTarifa) {
  if (!currentUser) return;

  const tarifaVal = parseFloat(nuevaTarifa) || 0;

  currentUser.tarifa = tarifaVal;

  const userInCache = cachedUsers.find(
    (u) => String(u.id) === String(currentUser.id)
  );

  if (userInCache) userInCache.tarifa = tarifaVal;

  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from("usuarios")
        .update({ tarifa: tarifaVal })
        .eq("id", currentUser.id);

      if (error) throw error;
    } catch (e) {
      console.error("No se pudo actualizar la tarifa:", e);
    }
  }

  calcularSimuladorCobro();
}

function calcularSimuladorCobro() {
  const inputTarifa = document.getElementById("w-tarifa-input");
  const labelTotal = document.getElementById("w-total-estimado");
  const labelDetalle = document.getElementById(
    "w-detalle-horas-estimadas"
  );
  const labelPeriodo = document.getElementById("w-total-periodo");

  if (!inputTarifa || !labelTotal || !labelPeriodo) return;

  const tarifa = parseFloat(inputTarifa.value) || 0;

  const match = labelPeriodo.innerText.match(/([0-9.]+)\s*hrs/);

  const horas = match
    ? parseFloat(match[1])
    : parseFloat(labelPeriodo.innerText) || 0;

  labelTotal.innerText = `$${(horas * tarifa).toFixed(2)}`;

  if (labelDetalle) {
    labelDetalle.innerText = `Suma de ${horas.toFixed(2)} hrs`;
  }
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

  const d1 = desde ? new Date(desde) : new Date();
  const d2 = hasta ? new Date(hasta) : new Date();

  const semanas = Math.max(
    1,
    (Math.round((d2 - d1) / 86400000) + 1) / 7
  );

  const turnosFiltrados = cachedTurnos.filter(
    (t) =>
      (!desde || t.fecha_inicio >= desde) &&
      (!hasta || t.fecha_inicio <= hasta)
  );

  const tbody = document.getElementById("tabla-usuarios");
  if (!tbody) return;

  tbody.innerHTML = "";

  cachedUsers.forEach((u, index) => {
    const tarifaVal =
      u.tarifa !== undefined ? parseFloat(u.tarifa) : 1.0;

    const tipoPago = (u.tipo_pago || "Horas").trim();

    let totalMinsUser = 0;

    turnosFiltrados
      .filter((t) => String(t.id_usuario) === String(u.id))
      .forEach((t) => {
        const entMs = msTurno(t.hora_entrada);
        const salMs = t.hora_salida
          ? msTurno(t.hora_salida)
          : 0;

        if (entMs && salMs && salMs > entMs) {
          totalMinsUser += (salMs - entMs) / 60000;
        } else if (
          t.estado === "en_turno" ||
          !t.hora_salida
        ) {
          if (Date.now() > entMs) {
            totalMinsUser += (Date.now() - entMs) / 60000;
          }
        } else if (t.horas_totales) {
          totalMinsUser += parseFloat(t.horas_totales) * 60;
        }
      });

    const totalHoras = totalMinsUser / 60;

    const totalPagar =
      tipoPago === "Gasolina"
        ? totalHoras * 1.4 * 0.5
        : tipoPago === "Fijo"
        ? tarifaVal * semanas
        : totalHoras * tarifaVal;

    const pinId = `pin-text-${index}`;
    const btnId = `pin-btn-${index}`;
    const inputTarifaId = `tarifa-input-${u.id}`;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <strong>${htmlSeguro(u.nombre)}</strong>
        <div style="font-size:.72rem;color:${
          conectados.has(String(u.id))
            ? "#10b981"
            : "#94a3b8"
        }">
          ${
            conectados.has(String(u.id))
              ? "● Conectado"
              : "○ Sin conexión detectada"
          }
        </div>
      </td>

      <td>
        <span id="${pinId}" data-pin="${htmlSeguro(u.pin)}">••••</span>
        <button
          id="${btnId}"
          onclick="togglePinVisibility('${pinId}', '${btnId}')"
          class="btn-icon"
          style="margin-left:5px;"
        >👁️</button>
      </td>

      <td>${htmlSeguro(tipoPago)}</td>

      <td>
        <input
          type="number"
          id="${inputTarifaId}"
          value="${tarifaVal.toFixed(2)}"
          step="0.1"
          style="width:80px;padding:4px;"
          onchange="actualizarTarifaUsuarioAdmin(${u.id},this.value)"
        >
      </td>

      <td>${htmlSeguro(u.cargo || "Operaciones")}</td>

      <td class="txt-green">
        <strong>
          ${
            tipoPago === "Fijo"
              ? "-"
              : totalHoras < 1
              ? Math.round(totalMinsUser) + " min"
              : totalHoras.toFixed(2) + " hrs"
          }
        </strong>
      </td>

      <td class="txt-green">
        <strong>$${totalPagar.toFixed(2)}</strong>
      </td>

      <td>
        <button
          onclick="openEditarUsuarioModal(${u.id})"
          class="btn-icon"
        >✏️</button>

        ${
          u.usuario !== "admin" &&
          u.usuario !== "administrador"
            ? `<button onclick="borrarUsuario(${u.id})"
                class="btn-icon">🗑️</button>`
            : ""
        }
      </td>
    `;

    tbody.appendChild(tr);
  });
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
      if (t.estado === "en_turno" || !t.hora_salida) {
        return true;
      }

      if (desde && t.fecha_inicio < desde) return false;
      if (hasta && t.fecha_inicio > hasta) return false;

      return true;
    })
    .sort((a, b) => b.hora_entrada - a.hora_entrada);

  const tbody = document.getElementById("tabla-asistencias");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (turnosFiltrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">
          No hay registros en este rango de fechas.
        </td>
      </tr>
    `;
    return;
  }

  turnosFiltrados.forEach((t) => {
    const userObj = cachedUsers.find(
      (u) => String(u.id) === String(t.id_usuario)
    );

    const nombreUsuario = userObj
      ? userObj.nombre
      : "Desconocido";

    const codigo = codigoTurno(nombreUsuario, t.id);

    const entMs = msTurno(t.hora_entrada);
    const salMs = t.hora_salida
      ? msTurno(t.hora_salida)
      : 0;

    let mins = 0;

    if (entMs && salMs && salMs > entMs) {
      mins = Math.round((salMs - entMs) / 60000);
    } else if (
      t.estado === "en_turno" ||
      !t.hora_salida
    ) {
      mins = Math.max(
        0,
        Math.round((Date.now() - entMs) / 60000)
      );
    } else if (t.horas_totales) {
      mins = Math.round(t.horas_totales * 60);
    }

    const horasDisp =
      t.estado === "en_turno" || !t.hora_salida
        ? '<span class="txt-green">En Línea (Activo)</span>'
        : mins >= 60
        ? `${(mins / 60).toFixed(2)} hrs`
        : `${mins} min`;

    const botonesForzar =
      t.estado === "en_turno" || !t.hora_salida
        ? `<button
             onclick="forzarSalida(${t.id})"
             class="btn-action btn-red"
             style="padding:4px 8px;font-size:.75rem;margin-right:5px;"
           >Forzar Salida</button>`
        : "";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <strong>${htmlSeguro(nombreUsuario)}</strong>
        <div class="txt-green">
          <strong>${htmlSeguro(codigo)}</strong>
        </div>
      </td>

      <td>
        ${formatFechaEsp(t.fecha_inicio)}
        ${getFormattedDateTime(t.hora_entrada)}
      </td>

      <td>
        ${
          t.hora_salida
            ? formatFechaEsp(
                getFormattedDate(new Date(msTurno(t.hora_salida)))
              ) +
              " " +
              getFormattedDateTime(t.hora_salida)
            : '<span class="txt-green">Activo</span>'
        }
      </td>

      <td class="txt-green">
        <strong>${horasDisp}</strong>
      </td>

      <td>
        <div class="actions-cell">
          ${botonesForzar}

          <button
            onclick="window.abrirModalEditarTurno(${t.id})"
            class="btn-action btn-blue"
            style="padding:6px 12px;font-size:.85rem;"
          >✏️ Editar</button>

          <button
            onclick="borrarTurnoUnico(${t.id})"
            class="btn-action btn-red"
            style="padding:6px 12px;font-size:.85rem;"
          >🗑️ Borrar</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

window.abrirModalEditarTurno = function (idTurno) {
  let t = cachedTurnos.find(
    (x) => String(x.id) === String(idTurno)
  );
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
  document.getElementById("edit-turno-salida-datetime").value =
    t.hora_salida
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
  const valSalida =
    document.getElementById("edit-turno-salida-datetime").value;

  if (!valEntrada || !valSalida) {
    alert("Por favor completa las fechas y horas de entrada y salida.");
    return;
  }

  const fechaEntrada = valEntrada.split("T")[0];
  const horaEntrada = valEntrada.split("T")[1];
  const fechaSalida = valSalida.split("T")[0];
  const horaSalida = valSalida.split("T")[1];

  const tEntrada = fechaHoraVenezuelaMs(fechaEntrada, horaEntrada);
  const tSalida = fechaHoraVenezuelaMs(fechaSalida, horaSalida);

  if (!Number.isFinite(tEntrada) ||
      !Number.isFinite(tSalida) ||
      tSalida <= tEntrada) {
    alert("La salida debe ser posterior a la entrada.");
    return;
  }

  const diffHrs = (tSalida - tEntrada) / 3600000;

  if (!supabaseClient) {
    alert("Sin conexión con Supabase.");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("registros_turnos")
      .update({
        fecha_inicio: fechaEntrada,
        hora_entrada: tEntrada,
        hora_salida: tSalida,
        horas_totales: Number(diffHrs.toFixed(4)),
        estado: "completado"
      })
      .eq("id", idTurno);

    if (error) throw error;

    cerrarModalEditarTurno();
    await syncDataFromSupabase();
    alert("¡Registro actualizado correctamente!");
  } catch (e) {
    alert("No se pudo guardar la edición: " + e.message);
  }
}

async function borrarTurnoUnico(idTurno) {
  if (!confirm("¿Eliminar este registro de turno?")) return;

  if (!supabaseClient) {
    alert("Sin conexión con Supabase.");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("registros_turnos")
      .delete()
      .eq("id", idTurno);

    if (error) throw error;

    await syncDataFromSupabase();
    alert("Registro eliminado.");
  } catch (e) {
    alert("No se pudo eliminar: " + e.message);
  }
}

async function forzarSalida(idTurno) {
  if (!confirm("¿Forzar salida de este turno activo?")) return;

  const t = cachedTurnos.find(
    (x) => String(x.id) === String(idTurno)
  );

  if (!t || t.hora_salida) {
    alert("El turno ya está cerrado o no existe.");
    return;
  }

  if (!supabaseClient) {
    alert("Sin conexión con Supabase.");
    return;
  }

  const ahora = Date.now();
  const entrada = msTurno(t.hora_entrada);
  const horas = Math.max(0, (ahora - entrada) / 3600000);

  try {
    const { data, error } = await supabaseClient
      .from("registros_turnos")
      .update({
        hora_salida: ahora,
        horas_totales: Number(horas.toFixed(4)),
        estado: "completado"
      })
      .eq("id", idTurno)
      .is("hora_salida", null)
      .select();

    if (error) throw error;
    if (!data || data.length !== 1) {
      throw new Error(
        "Supabase no confirmó la actualización (" + (data?.length || 0) +
        " filas). Revisa las políticas RLS UPDATE/SELECT de registros_turnos " +
        "y que el turno siga abierto. No se ha confirmado el cierre."
      );
    }

    await syncDataFromSupabase();
    alert("¡Salida forzada con éxito!");
  } catch (e) {
    alert("Error al cerrar el turno: " + e.message);
  }
}

function togglePinVisibility(id, btnId) {
  const span = document.getElementById(id);
  const btn = document.getElementById(btnId);

  if (span && span.dataset.pin) {
    span.textContent =
      span.textContent === "••••" ? span.dataset.pin : "••••";

    btn.textContent =
      span.textContent === "••••" ? "👁️" : "👁️🗨️";
  }
}

function openNuevoUsuarioModal() {
  document.getElementById("modal-user-title").innerText =
    "Nuevo Trabajador";

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
  const user = cachedUsers.find(
    (u) => String(u.id) === String(id)
  );
  if (!user) return;

  if (user.usuario === "administrador" || user.rol === "admin") {
    alert("El administrador principal no se edita desde aquí.");
    return;
  }

  document.getElementById("modal-user-title").innerText =
    "Editar Usuario: " + user.nombre;

  document.getElementById("edit-user-id").value = user.id;
  document.getElementById("edit-user-nombre").value = user.nombre;
  document.getElementById("edit-user-pin").value = user.pin;
  document.getElementById("edit-user-tipo").value =
    user.tipo_pago || "Horas";
  document.getElementById("edit-user-tarifa").value =
    user.tarifa !== undefined ? user.tarifa : 1.0;
  document.getElementById("edit-user-cargo").value =
    user.cargo || "Operaciones";
  document.getElementById("edit-user-rol").value =
    user.rol || "trabajador";

  document.getElementById("modal-usuario").classList.remove("hidden");
  document.getElementById("modal-usuario").style.display = "flex";
}

async function guardarUsuario() {
  const id = document.getElementById("edit-user-id").value;
  const nombre = (
    document.getElementById("edit-user-nombre").value || ""
  ).trim();

  const pin = (
    document.getElementById("edit-user-pin").value || ""
  ).trim();

  const tipo_pago = document.getElementById("edit-user-tipo").value;
  const tarifa = parseFloat(
    document.getElementById("edit-user-tarifa").value
  ) || 1.0;

  const cargo = document.getElementById("edit-user-cargo").value;
  const rol = document.getElementById("edit-user-rol").value;
  const usuario = nombre.toLowerCase().replace(/\s+/g, "");

  if (!nombre || !pin) {
    alert("Ingresa nombre y PIN.");
    return;
  }

  if (!supabaseClient) {
    alert("Sin conexión con Supabase.");
    return;
  }

  const payload = {
    nombre,
    usuario,
    pin,
    tipo_pago,
    tarifa,
    cargo,
    rol
  };

  try {
    let resultado;

    if (id) {
      resultado = await supabaseClient
        .from("usuarios")
        .update(payload)
        .eq("id", id);
    } else {
      resultado = await supabaseClient
        .from("usuarios")
        .insert([payload]);
    }

    if (resultado.error) throw resultado.error;

    closeModals();
    await syncDataFromSupabase();
    alert("¡Trabajador guardado con éxito!");
  } catch (e) {
    alert("No se pudo guardar el trabajador: " + e.message);
  }
}

async function borrarUsuario(id) {
  const user = cachedUsers.find(
    (u) => String(u.id) === String(id)
  );

  if (user && (
    user.usuario === "administrador" ||
    user.rol === "admin"
  )) {
    alert("No se puede eliminar al administrador principal.");
    return;
  }

  if (!confirm("¿Borrar usuario de forma permanente?")) return;

  if (!supabaseClient) {
    alert("Sin conexión con Supabase.");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("usuarios")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await syncDataFromSupabase();
    alert("Usuario eliminado.");
  } catch (e) {
    alert("No se pudo eliminar el usuario: " + e.message);
  }
}

function openAgregarHorasModal() {
  const sel = document.getElementById("manual-user-select");

  if (sel) {
    sel.innerHTML = "";

    cachedUsers.forEach((u) => {
      const option = document.createElement("option");
      option.value = u.id;
      option.textContent =
        `${u.nombre} (${u.tipo_pago || "Horas"})`;
      sel.appendChild(option);
    });
  }

  const hoyStr = getFormattedDate();

  document.getElementById("manual-fecha-inicio").value = hoyStr;
  document.getElementById("manual-fecha-fin").value = hoyStr;

  document
    .getElementById("modal-agregar-horas")
    .classList.remove("hidden");

  document.getElementById(
    "modal-agregar-horas"
  ).style.display = "flex";
}

async function guardarHorasManuales() {
  const userId = parseInt(
    document.getElementById("manual-user-select").value
  );

  const fechaInicio =
    document.getElementById("manual-fecha-inicio").value;

  const fechaFin =
    document.getElementById("manual-fecha-fin").value ||
    fechaInicio;

  const hEntrada =
    document.getElementById("manual-entrada").value;

  const hSalida =
    document.getElementById("manual-salida").value;

  if (!fechaInicio || !hEntrada || !hSalida) {
    alert("Completa la fecha y las horas.");
    return;
  }

  const tEntrada = fechaHoraVenezuelaMs(fechaInicio, hEntrada);
  const tSalida = fechaHoraVenezuelaMs(fechaFin, hSalida);

  if (!Number.isFinite(tEntrada) ||
      !Number.isFinite(tSalida) ||
      tSalida <= tEntrada) {
    alert("La salida debe ser posterior a la entrada.");
    return;
  }

  const diffHrs = (tSalida - tEntrada) / 3600000;

  if (!supabaseClient) {
    alert("Sin conexión a Supabase. No se guardaron horas.");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("registros_turnos")
      .insert([{
        id_usuario: userId,
        fecha_inicio: fechaInicio,
        hora_entrada: tEntrada,
        hora_salida: tSalida,
        horas_totales: Number(diffHrs.toFixed(4)),
        estado: "completado",
        origen: "manual"
      }]);

    if (error) throw error;

    closeModals();
    await syncDataFromSupabase();

    alert("¡Horas cargadas correctamente!");
  } catch (e) {
    alert("No se guardaron horas: " + e.message);
  }
}

async function actualizarTarifaUsuarioAdmin(userId, nuevaTarifa) {
  const val = parseFloat(nuevaTarifa);

  if (!Number.isFinite(val) || val < 0) {
    alert("Ingresa una tarifa válida.");
    return;
  }

  if (!supabaseClient) {
    alert("Sin conexión con Supabase.");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("usuarios")
      .update({ tarifa: val })
      .eq("id", userId);

    if (error) throw error;

    const user = cachedUsers.find(
      (u) => String(u.id) === String(userId)
    );

    if (user) user.tarifa = val;

    await syncDataFromSupabase();
  } catch (e) {
    alert("No se pudo actualizar la tarifa: " + e.message);
  }
}

function calcularNominaPeriodo(desde, hasta) {
  const d1 = new Date(desde);
  const d2 = new Date(hasta);

  const semanas = Math.max(
    1,
    (Math.round((d2 - d1) / 86400000) + 1) / 7
  );

  const turnos = cachedTurnos.filter(
    (t) =>
      t.fecha_inicio >= desde &&
      t.fecha_inicio <= hasta
  );

  let granTotal = 0;

  const filas = cachedUsers.map((u) => {
    const propios = turnos.filter(
      (t) => String(t.id_usuario) === String(u.id)
    );

    let minutos = 0;

    propios.forEach((t) => {
      const entrada = msTurno(t.hora_entrada);
      const salida = t.hora_salida
        ? msTurno(t.hora_salida)
        : NaN;

      if (
        Number.isFinite(entrada) &&
        Number.isFinite(salida) &&
        salida > entrada
      ) {
        minutos += (salida - entrada) / 60000;
      } else if (
        !t.hora_salida &&
        Number.isFinite(entrada) &&
        t.origen !== "whatsapp"
      ) {
        minutos += Math.max(
          0,
          (Date.now() - entrada) / 60000
        );
      } else if (t.hora_salida && t.horas_totales) {
        minutos += Number(t.horas_totales) * 60;
      }
    });

    const horas = minutos / 60;
    const tarifa = Number(u.tarifa) || 0;
    const tipo = (u.tipo_pago || "Horas").trim();

    const monto =
      tipo === "Gasolina"
        ? horas * 1.4 * 0.5
        : tipo === "Fijo"
        ? tarifa * semanas
        : horas * tarifa;

    granTotal += monto;

    return {
      nombre: u.nombre,
      tipo,
      horas,
      tarifa,
      monto
    };
  });

  return { filas, granTotal };
}

function abrirResumenPagoModal() {
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;

  if (!desde || !hasta || hasta < desde) {
    alert("Selecciona un rango de fechas válido.");
    return;
  }

  const { filas, granTotal } =
    calcularNominaPeriodo(desde, hasta);

  document.getElementById(
    "resumen-rango-fechas"
  ).innerText =
    `Período del ${formatFechaEsp(desde)} al ${formatFechaEsp(hasta)}`;

  let html = `
    <table style="width:100%;font-size:.85rem;">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Tipo</th>
          <th>Horas</th>
          <th>Tarifa</th>
          <th>Monto</th>
        </tr>
      </thead>
      <tbody>
  `;

  filas.forEach((f) => {
    html += `
      <tr>
        <td>${htmlSeguro(f.nombre)}</td>
        <td>${htmlSeguro(f.tipo)}</td>
        <td>${f.tipo === "Fijo" ? "-" : f.horas.toFixed(2)}</td>
        <td>$${f.tarifa.toFixed(2)}</td>
        <td><strong>$${f.monto.toFixed(2)}</strong></td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    <div style="margin-top:15px;text-align:right;">
      <strong>
        Total a pagar:
        <span class="txt-green">
          $${granTotal.toFixed(2)}
        </span>
      </strong>
    </div>
  `;

  document.getElementById(
    "resumen-pago-contenido"
  ).innerHTML = html;

  const modal = document.getElementById("modal-resumen-pago");

  modal.classList.remove("hidden");
  modal.style.display = "flex";
}

function copiarResumenPago() {
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;

  if (!desde || !hasta || hasta < desde) {
    alert("Selecciona un rango válido.");
    return;
  }

  const { filas, granTotal } =
    calcularNominaPeriodo(desde, hasta);

  let texto =
    `📊 *REPORTE DE NÓMINA*\n` +
    `📅 Período: ${formatFechaEsp(desde)} al ` +
    `${formatFechaEsp(hasta)}\n\n`;

  filas.forEach((f) => {
    const detalle =
      f.tipo === "Fijo"
        ? "Sueldo fijo"
        : `${f.horas.toFixed(2)} hrs`;

    texto +=
      `• *${f.nombre}* (${detalle}): ` +
      `*$${f.monto.toFixed(2)}*\n`;
  });

  texto +=
    `\n💰 *Total a pagar:* ` +
    `*$${granTotal.toFixed(2)}*`;

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(texto)
      .then(() => alert("Reporte de nómina copiado."))
      .catch(() => window.prompt("Copia el reporte:", texto));
  } else {
    window.prompt("Copia el reporte:", texto);
  }
}

function openConfigTarifasModal() {
  const modal = document.getElementById(
    "modal-config-tarifas"
  );

  modal.classList.remove("hidden");
  modal.style.display = "flex";
}

async function aplicarTarifaGlobal() {
  const nueva = parseFloat(
    document.getElementById("global-tarifa-input").value
  );

  if (!Number.isFinite(nueva) || nueva < 0) {
    alert("Ingresa una tarifa válida.");
    return;
  }

  if (!supabaseClient) {
    alert("Sin conexión con Supabase.");
    return;
  }

  try {
    for (const u of cachedUsers) {
      const tipo = (u.tipo_pago || "").toLowerCase();

      if (tipo === "gasolina" || tipo === "fijo") {
        continue;
      }

      const { error } = await supabaseClient
        .from("usuarios")
        .update({ tarifa: nueva })
        .eq("id", u.id);

      if (error) throw error;
    }

    closeModals();
    await syncDataFromSupabase();

    alert("Tarifa global actualizada.");
  } catch (e) {
    alert("Error al aplicar tarifa: " + e.message);
  }
}

function openConfigPinModal() {
  const modal = document.getElementById("modal-config-pin");

  modal.classList.remove("hidden");
  modal.style.display = "flex";
}

async function guardarNuevoPinSeguro() {
  if (!currentUser || !supabaseClient) return;

  const actual = document.getElementById(
    "pin-actual-input"
  ).value.trim();

  const nuevo = document.getElementById(
    "pin-nuevo-input"
  ).value.trim();

  const confirmar = document.getElementById(
    "pin-confirmar-input"
  ).value.trim();

  if (actual !== String(currentUser.pin).trim()) {
    alert("El PIN actual es incorrecto.");
    return;
  }

  if (!nuevo || nuevo !== confirmar) {
    alert("El PIN nuevo y su confirmación deben coincidir.");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("usuarios")
      .update({ pin: nuevo })
      .eq("id", currentUser.id);

    if (error) throw error;

    currentUser.pin = nuevo;

    closeModals();
    alert("PIN actualizado correctamente.");
  } catch (e) {
    alert("No se pudo actualizar el PIN: " + e.message);
  }
}

function closeModals() {
  document.querySelectorAll(".modal-backdrop").forEach((m) => {
    m.classList.add("hidden");
    m.style.display = "none";
  });
}

// IMPORTACIÓN DE WHATSAPP

let importacionPendiente = [];
let importandoWhatsApp = false;

function abrirImportacionWhatsApp() {
  if (!currentUser || currentUser.rol !== "admin") {
    alert("Solo el administrador puede importar reportes.");
    return;
  }

  const modal = document.getElementById(
    "modal-importar-whatsapp"
  );

  if (!modal) {
    alert("Falta el formulario de importación en el HTML.");
    return;
  }

  modal.classList.remove("hidden");
  modal.style.display = "flex";
}

function horaWhatsApp(valor) {
  const texto = String(valor || "").trim();

  const m = texto.match(
    /(\d{1,2}):(\d{2})(?:\s*([ap])\.?\s*m\.?)?/i
  );

  if (!m) return null;

  let hora = Number(m[1]);
  const minuto = Number(m[2]);

  if (hora > 23 || minuto > 59) return null;

  if (m[3]) {
    if (hora < 1 || hora > 12) return null;

    hora =
      (hora % 12) +
      (m[3].toLowerCase() === "p" ? 12 : 0);
  }

  return (
    String(hora).padStart(2, "0") +
    ":" +
    String(minuto).padStart(2, "0")
  );
}

function extraerCampo(txt, nombres) {
  const re = new RegExp(
    "(?:^|\\n)\\s*(?:[^\\w\\n]*\\s*)?" +
    "(?:" + nombres + ")" +
    "\\s*:\\s*\\*?\\s*([^\\n\\r]+)",
    "im"
  );

  return (
    String(txt).match(re)?.[1] || ""
  ).replace(/\*/g, "").trim();
}

function normalizarNombre(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function analizarTextoWhatsApp(texto) {
  const partes = String(texto || "")
    .split(
      /(?=🟢\s*\*?(?:INICIO|CONTINUACI[ÓO]N) DE TURNO|🔴\s*\*?FINALIZACI[ÓO]N DE TURNO|(?:^|\n)\s*\*?(?:INICIO|CONTINUACI[ÓO]N|FINALIZACI[ÓO]N) DE TURNO)/i
    )
    .map((x) => x.trim())
    .filter(
      (x) =>
        /(?:INICIO|CONTINUACI[ÓO]N|FINALIZACI[ÓO]N) DE TURNO/i.test(x)
    );

  return partes.map((raw, i) => {
    const nombre = extraerCampo(raw, "Trabajador");

    const fechaTexto = extraerCampo(
      raw,
      "Fecha Inicio|Fecha"
    );

    const fm = fechaTexto.match(
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/
    );

    const fecha = fm
      ? `${fm[3]}-${fm[2].padStart(2, "0")}-${fm[1].padStart(2, "0")}`
      : null;

    const fin =
      /FINALIZACI[ÓO]N DE TURNO/i.test(raw);

    const continuacion =
      /CONTINUACI[ÓO]N DE TURNO/i.test(raw);

    const entrada = horaWhatsApp(
      extraerCampo(
        raw,
        fin ? "Entrada" : "Hora Entrada|Entrada"
      )
    );

    const salidaCampo = extraerCampo(raw, "Salida");

    const salida = fin
      ? horaWhatsApp(salidaCampo)
      : null;

    const fechaSalidaTexto = salidaCampo.match(
      /\((\d{1,2}\/\d{1,2}\/\d{4})\)/
    );

    const fechaSalida = fechaSalidaTexto
      ? fechaSalidaTexto[1].split("/").reverse().join("-")
      : null;

    const usuario = cachedUsers.find(
      (u) =>
        normalizarNombre(u.nombre) ===
        normalizarNombre(nombre)
    );

    const entradaMs =
      fecha && entrada
        ? fechaHoraVenezuelaMs(fecha, entrada)
        : NaN;

    let salidaMs =
      fecha && salida
        ? fechaHoraVenezuelaMs(
            fechaSalida || fecha,
            salida
          )
        : null;

    if (
      salidaMs != null &&
      !fechaSalida &&
      salidaMs < entradaMs
    ) {
      salidaMs += 86400000;
    }

    const idTexto =
      raw.match(
        /(?:#\s*[A-Za-z]\d{1,}|REP-\d+|(?:N[.º°o\s]*\s*de reporte|ID)\s*:\s*\*?\s*(?:#\s*[A-Za-z])?\d+)/i
      )?.[0] || "";

    const idNumero =
      idTexto.match(/\d+/)?.[0] || null;

    const error =
      !usuario
        ? "Trabajador no encontrado"
        : !fecha || !Number.isFinite(entradaMs)
        ? "Fecha o entrada inválida"
        : fin && !salida
        ? "Salida no reconocida"
        : entradaMs > Date.now() + 60000
        ? "Entrada futura"
        : salidaMs != null &&
          (
            salidaMs <= entradaMs ||
            salidaMs - entradaMs > 36 * 3600000
          )
        ? "Duración sospechosa"
        : "";

    return {
      i,
      raw,
      nombre,
      usuario,
      fecha,
      entradaMs,
      salidaMs,
      fin,
      continuacion,
      error,
      numero: idTexto,
      idNumero
    };
  });
}

function previsualizarWhatsApp() {
  const campo = document.getElementById(
    "texto-whatsapp"
  );

  importacionPendiente = analizarTextoWhatsApp(
    campo?.value || ""
  );

  const box = document.getElementById(
    "vista-importacion"
  );

  if (!box) return;

  box.replaceChildren();

  if (!importacionPendiente.length) {
    box.textContent =
      "No se detectaron mensajes de turno. " +
      "Pega los mensajes completos.";
    return;
  }

  for (const r of importacionPendiente) {
    const div = document.createElement("div");

    div.style =
      "padding:9px;border-bottom:1px solid #475569";

    const tipo = r.fin
      ? "FINALIZACIÓN"
      : r.continuacion
      ? "CONTINUACIÓN (inicio)"
      : "INICIO";

    div.textContent =
      `${r.numero || "Sin ID anterior"} · ` +
      `${r.nombre || "Sin nombre"} · ` +
      `${r.fecha || "Sin fecha"} · ` +
      `${tipo} · ` +
      `${r.error || "Listo para revisar"}`;

    box.append(div);
  }

  const nota = document.createElement("p");

  nota.textContent =
    "Los inicios y continuaciones sin salida " +
    "quedarán abiertos. Las finalizaciones " +
    "cerrarán los turnos correspondientes. " +
    "Revisa los datos antes de guardar.";

  box.append(nota);
}

async function confirmarImportacionWhatsApp() {
  if (
    !currentUser ||
    currentUser.rol !== "admin" ||
    !supabaseClient ||
    importandoWhatsApp
  ) {
    return;
  }

  if (!importacionPendiente.length) {
    alert("Primero analiza los mensajes.");
    return;
  }

  if (importacionPendiente.some((r) => r.error)) {
    alert(
      "Corrige los mensajes no reconocidos antes de importar."
    );
    return;
  }

  const abiertos = importacionPendiente.filter(
    (r) => !r.fin
  ).length;

  const aceptado = confirm(
    `Se procesarán ${importacionPendiente.length} mensajes.\n` +
    `Inicios/continuaciones: ${abiertos}\n` +
    `Finalizaciones: ${
      importacionPendiente.length - abiertos
    }\n\n` +
    "Los turnos sin salida quedarán abiertos.\n" +
    "¿Confirmas la importación?"
  );

  if (!aceptado) return;

  importandoWhatsApp = true;

  let creados = 0;
  let actualizados = 0;
  let omitidos = 0;
  const errores = [];

  try {
    const ids = [
      ...new Set(
        importacionPendiente.map(
          (r) => Number(r.usuario.id)
        )
      )
    ];

    const todos = [];

    for (const id of ids) {
      let offset = 0;

      while (true) {
        const { data, error } = await supabaseClient
          .from("registros_turnos")
          .select("*")
          .eq("id_usuario", id)
          .order("hora_entrada", {
            ascending: false
          })
          .range(offset, offset + 499);

        if (error) throw error;

        todos.push(...(data || []));

        if (!data || data.length < 500) break;

        offset += 500;
      }
    }

    const ordenados = [...importacionPendiente].sort(
      (a, b) =>
        a.entradaMs - b.entradaMs ||
        Number(a.fin) - Number(b.fin)
    );

    for (const r of ordenados) {
      try {
        const propios = todos.filter(
          (t) =>
            String(t.id_usuario) ===
            String(r.usuario.id)
        );

        const mismo = propios.find(
          (t) =>
            mismoInstante(
              t.hora_entrada,
              r.entradaMs
            )
        );

        const porId = r.idNumero
          ? propios.find(
              (t) =>
                String(t.id) ===
                String(Number(r.idNumero))
            )
          : null;

        if (
          porId &&
          !mismoInstante(
            porId.hora_entrada,
            r.entradaMs
          )
        ) {
          throw new Error(
            "El ID corresponde a otro turno."
          );
        }

        if (
          porId &&
          mismo &&
          String(porId.id) !== String(mismo.id)
        ) {
          throw new Error(
            "El ID y la hora corresponden a registros distintos."
          );
        }

        if (mismo) {
          if (!r.fin) {
            omitidos++;
            continue;
          }

          if (mismo.hora_salida != null) {
            if (
              mismoInstante(
                mismo.hora_salida,
                r.salidaMs
              )
            ) {
              omitidos++;
              continue;
            }

            throw new Error(
              "El turno ya tiene una salida diferente."
            );
          }

          const hrs =
            (r.salidaMs - r.entradaMs) / 3600000;

          const { data, error } = await supabaseClient
            .from("registros_turnos")
            .update({
              hora_salida: r.salidaMs,
              horas_totales: Number(
                hrs.toFixed(4)
              ),
              estado: "completado"
            })
            .eq("id", mismo.id)
            .is("hora_salida", null)
            .select();

          if (error) throw error;
          if (!data || data.length !== 1) {
            throw new Error(
              "No se confirmó el cierre del turno en Supabase (" +
              (data?.length || 0) + " filas). Comprueba permisos RLS y estado."
            );
          }

          Object.assign(mismo, data[0]);
          actualizados++;
          continue;
        }

        const abiertosExistentes = propios.filter(
          (t) => t.hora_salida == null
        );

        if (abiertosExistentes.length) {
          throw new Error(
            "El trabajador tiene otro turno abierto. " +
            "Revisar antes de importar."
          );
        }

        const hrs = r.fin
          ? (r.salidaMs - r.entradaMs) / 3600000
          : null;

        const payload = {
          id_usuario: Number(r.usuario.id),
          fecha_inicio: r.fecha,
          hora_entrada: r.entradaMs,
          hora_salida: r.salidaMs,
          horas_totales:
            hrs == null
              ? null
              : Number(hrs.toFixed(4)),
          estado: r.fin
            ? "completado"
            : "en_turno",
          origen: "whatsapp"
        };

        const { data, error } = await supabaseClient
          .from("registros_turnos")
          .insert(payload)
          .select()
          .single();

        if (error || !data) {
          throw error ||
            new Error("No se pudo crear el turno.");
        }

        todos.push(data);
        creados++;
      } catch (e) {
        errores.push(
          `${r.nombre} ${r.fecha}: ${e.message}`
        );
      }
    }

    await syncDataFromSupabase();

    alert(
      `Importación terminada.\n\n` +
      `Creados: ${creados}\n` +
      `Finalizaciones aplicadas: ${actualizados}\n` +
      `Duplicados omitidos: ${omitidos}\n` +
      `Errores: ${errores.length}` +
      (
        errores.length
          ? "\n\n" + errores.join("\n")
          : ""
      )
    );

    if (!errores.length) {
      importacionPendiente = [];
      closeModals();
    }
  } catch (e) {
    alert(
      "No se completó la importación: " +
      e.message
    );
  } finally {
    importandoWhatsApp = false;
  }
}
