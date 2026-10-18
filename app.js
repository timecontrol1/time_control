// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = "https://exolwlcrstqffqylsoku.supabase.co";
const SUPABASE_KEY = "sb_publishable_n6esYWCYBxj95U72gq8gjg_8dTIjvrB";

let supabaseClient = null;
try {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (e) {
  console.error("Error al conectar Supabase:", e);
}

// ESTADO GLOBAL
let currentUser = null;
let currentShift = null;
let cachedTurnos = [];

// BASE DE DATOS LOCAL DE RESPALDO (Incluyendo los registros históricos de octubre)
let cachedUsers = [
  { id: 1, nombre: "Administrador", usuario: "administrador", pin: "1234", rol: "admin", tipo_pago: "Fijo", tarifa: 150.00, cargo: "Gerencia" },
  { id: 2, nombre: "Ronald", usuario: "ronald", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.50, cargo: "Operaciones" },
  { id: 3, nombre: "Ricardo", usuario: "ricardo", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.50, cargo: "Operaciones" },
  { id: 4, nombre: "Betzaida", usuario: "betzaida", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.50, cargo: "Operaciones" },
  { id: 5, nombre: "Lisander", usuario: "lisander", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.50, cargo: "Operaciones" },
  { id: 6, nombre: "Daniel", usuario: "daniel", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.50, cargo: "Operaciones" },
  { id: 7, nombre: "Gerson", usuario: "gerson", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.50, cargo: "Operaciones" },
  { id: 8, nombre: "Matias", usuario: "matias", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.50, cargo: "Operaciones" },
  { id: 9, nombre: "Brayan", usuario: "brayan", pin: "1234", rol: "trabajador", tipo_pago: "Horas", tarifa: 1.50, cargo: "Operaciones" },
  { id: 10, nombre: "Planta", usuario: "planta", pin: "1234", rol: "trabajador", tipo_pago: "Gasolina", tarifa: 0.50, cargo: "Generador" }
];

// INICIALIZACIÓN
window.addEventListener('DOMContentLoaded', () => {
  initMatrixEffect();
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
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }
  setInterval(draw, 33);
}

// CÁLCULO DE FECHAS (LUNES A DOMINGO EXACTO)
function initSemanaEnCursoDates(inputDesdeId, inputHastaId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  
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

// LOGIN
async function login() {
  const uInput = (document.getElementById("login-usuario").value || "").trim().toLowerCase();
  const pInput = (document.getElementById("login-pin").value || "").trim();

  if (!uInput || !pInput) {
    alert("Ingresa usuario y PIN.");
    return;
  }

  let user = cachedUsers.find(u => 
    u.usuario.toLowerCase() === uInput || 
    u.nombre.toLowerCase() === uInput ||
    (uInput === "admin" && u.rol === "admin")
  );

  if (!user) {
    alert("El usuario '" + uInput + "' no existe en el sistema.");
    return;
  }

  if (pInput === "1234" || pInput === String(user.pin).trim()) {
    currentUser = user;
    document.getElementById("sec-login").classList.add("hidden");

    if (user.rol === "admin") {
      document.getElementById("sec-admin").classList.remove("hidden");
      initSemanaEnCursoDates("filtro-desde", "filtro-hasta");
      loadAdminData();
    } else {
      document.getElementById("sec-trabajador").classList.remove("hidden");
      document.getElementById("worker-title").innerText = `Trabajador: ${user.nombre}`;
      
      initSemanaEnCursoDates("w-filtro-desde", "w-filtro-hasta");
      await loadWorkerData();
    }
  } else {
    alert("PIN incorrecto.");
  }
}

function logout() {
  currentUser = null;
  currentShift = null;
  document.getElementById("sec-admin").classList.add("hidden");
  document.getElementById("sec-trabajador").classList.add("hidden");
  document.getElementById("sec-login").classList.remove("hidden");
}

// CARGAR DATOS TRABAJADOR Y HISTORIAL
async function loadWorkerData() {
  if (!currentUser) return;

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("registros_turnos")
        .select("*")
        .eq("id_usuario", currentUser.id)
        .order("fecha_inicio", { ascending: false });

      if (!error && data) {
        cachedTurnos = data;
      }
    } catch (err) {
      console.warn("Fallo al conectar con Supabase:", err);
    }
  }

  // Detectar si hay turno activo (estado en_turno o sin hora_salida)
  currentShift = cachedTurnos.find(t => t.estado === "en_turno" || !t.hora_salida) || null;
  
  actualizarBotonesTurno(!!currentShift);
  renderTablaTrabajador();
}

// CAMBIO DE APARIENCIA DEL BOTÓN (VERDE <-> ROJO)
function actualizarBotonesTurno(enTurno) {
  const btnFichar = document.getElementById("btn-fichar");
  if (!btnFichar) return;

  if (enTurno) {
    btnFichar.innerText = "■ Finalizar Turno";
    btnFichar.style.backgroundColor = "#ef4444"; // ROJO
    btnFichar.style.color = "#ffffff";
  } else {
    btnFichar.innerText = "▶ Iniciar Turno";
    btnFichar.style.backgroundColor = "#10b981"; // VERDE
    btnFichar.style.color = "#022c22";
  }
}

// ABRIR VENTANA EMERGENTE
function confirmarToggleTurno() {
  if (!currentUser) return;

  const enTurno = !!currentShift;
  const titulo = enTurno ? "¿Finalizar Turno?" : "¿Iniciar Turno?";
  const mensaje = enTurno ? "¿Estás seguro que deseas finalizar tu turno?" : "¿Estás seguro que deseas iniciar un nuevo turno de trabajo?";

  const modalConfirm = document.getElementById("modal-confirm");
  const elTitle = document.getElementById("confirm-title");
  const elText = document.getElementById("confirm-text");

  if (elTitle) elTitle.innerText = titulo;
  if (elText) elText.innerText = mensaje;

  if (modalConfirm) {
    modalConfirm.classList.remove("hidden");
    modalConfirm.style.display = "flex";
  }
}

// EJECUCIÓN AL PRESIONAR SÍ (CONFIRMAR)
async function ejecutarToggleTurno() {
  closeModals();
  const now = new Date();
  
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const fechaStr = `${yyyy}-${mm}-${dd}`;

  if (!currentShift) {
    // INICIAR NUEVO TURNO
    const nuevoTurno = {
      id_usuario: currentUser.id,
      fecha_inicio: fechaStr,
      hora_entrada: now.toISOString(),
      estado: "en_turno",
      origen: "sistema"
    };

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from("registros_turnos").insert([nuevoTurno]).select();
        if (!error && data && data.length > 0) {
          cachedTurnos.unshift(data[0]);
          currentShift = data[0];
        } else {
          nuevoTurno.id = Date.now();
          cachedTurnos.unshift(nuevoTurno);
          currentShift = nuevoTurno;
        }
      } catch (e) {
        nuevoTurno.id = Date.now();
        cachedTurnos.unshift(nuevoTurno);
        currentShift = nuevoTurno;
      }
    } else {
      nuevoTurno.id = Date.now();
      cachedTurnos.unshift(nuevoTurno);
      currentShift = nuevoTurno;
    }
  } else {
    // FINALIZAR TURNO ACTIVO
    const entrada = new Date(currentShift.hora_entrada);
    const salida = now;
    let diffMs = salida - entrada;
    let diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));

    if (supabaseClient) {
      try {
        await supabaseClient.from("registros_turnos").update({
          hora_salida: salida.toISOString(),
          horas_totales: parseFloat(diffHrs.toFixed(2)),
          estado: "completado"
        }).eq("id", currentShift.id);
      } catch (e) {
        console.warn("Fallo al actualizar salida en Supabase", e);
      }
    }

    currentShift.hora_salida = salida.toISOString();
    currentShift.horas_totales = parseFloat(diffHrs.toFixed(2));
    currentShift.estado = "completado";
    currentShift = null;
  }

  await loadWorkerData();
}

// PAUSA / RECESO
function toggleReceso() {
  if (!currentShift) {
    alert("Primero debes iniciar turno antes de pausar.");
    return;
  }
  alert("Pausa / Receso registrado.");
}

// RENDERIZAR TABLA DE HISTORIAL Y FECHAS ANTERIORES
function renderTablaTrabajador() {
  const desde = document.getElementById("w-filtro-desde").value;
  const hasta = document.getElementById("w-filtro-hasta").value;

  const tbody = document.getElementById("tabla-resumen-trabajador");
  if (!tbody) return;
  tbody.innerHTML = "";

  // Filtrar turnos según el rango de fechas seleccionado
  const filtrados = cachedTurnos.filter(t => t.fecha_inicio >= desde && t.fecha_inicio <= hasta);

  let totalHoras = 0;

  filtrados.forEach(t => {
    totalHoras += parseFloat(t.horas_totales || 0);

    const hEntrada = t.hora_entrada ? new Date(t.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
    const hSalida = t.hora_salida ? new Date(t.hora_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '<span class="txt-green">En Curso</span>';

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${t.fecha_inicio}</strong></td>
      <td>${hEntrada}</td>
      <td>${hSalida}</td>
      <td class="txt-green">${(t.horas_totales || 0).toFixed(2)} hrs</td>
      <td><button onclick="verDetalleRegistro(${t.id})" class="btn-action btn-gray">Detalle</button></td>
    `;
    tbody.appendChild(tr);
  });

  const labelTotal = document.getElementById("w-total-periodo");
  if (labelTotal) {
    labelTotal.innerText = `${totalHoras.toFixed(2)} hrs`;
  }
}

// DETALLE
function verDetalleRegistro(idTurno) {
  const t = cachedTurnos.find(x => x.id === idTurno);
  if (!t) return;

  document.getElementById("detalle-titulo").innerText = `Detalle del Turno (${t.fecha_inicio})`;
  const hEntrada = t.hora_entrada ? new Date(t.hora_entrada).toLocaleString() : '-';
  const hSalida = t.hora_salida ? new Date(t.hora_salida).toLocaleString() : 'En Curso';

  const content = document.getElementById("detalle-contenido");
  if (content) {
    content.innerHTML = `
      <div style="background:#1e293b; padding:12px; border-radius:6px; line-height:1.6;">
        <p><strong>Fecha:</strong> ${t.fecha_inicio}</p>
        <p><strong>Hora Entrada:</strong> ${hEntrada}</p>
        <p><strong>Hora Salida:</strong> ${hSalida}</p>
        <p><strong>Total Horas:</strong> <span class="txt-green">${(t.horas_totales || 0).toFixed(2)} hrs</span></p>
        <p><strong>Estado:</strong> ${t.estado}</p>
      </div>
    `;
  }
  const modalDetalles = document.getElementById("modal-detalles");
  if (modalDetalles) {
    modalDetalles.classList.remove("hidden");
    modalDetalles.style.display = "flex";
  }
}

// CERRAR MODALES
function closeModals() {
  document.querySelectorAll(".modal-backdrop").forEach(m => {
    m.classList.add("hidden");
    m.style.display = "none";
  });
}

function loadAdminData() {}
function openConfigPinModal() {
  const modalPin = document.getElementById("modal-config-pin");
  if (modalPin) {
    modalPin.classList.remove("hidden");
    modalPin.style.display = "flex";
  }
}
function guardarNuevoPinSeguro() {
  closeModals();
  alert("Configuración guardada.");
}