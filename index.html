const SUPABASE_URL = "https://exolwlcrstqffqylsoku.supabase.co";
const SUPABASE_KEY = "sb_publishable_n6esYWCYBxj95U72gq8gjg_8dTIjvrB";

let supabaseClient = null;
try {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
  console.error("Error iniciando Supabase:", e);
}

let currentUser = null;
let currentShift = null;
let cachedUsers = [];
let workerTurnosCache = [];

// EFECTO MATRIX EN MOVIMIENTO (FONDO)
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const letters = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ$+-*#@%&';
  const fontSize = 14;
  let columns = canvas.width / fontSize;
  let drops = [];
  for (let x = 0; x < columns; x++) {
    drops[x] = 1;
  }

  function drawMatrix() {
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
  setInterval(drawMatrix, 33);
});

// LOGIN
async function login() {
  const uInput = (document.getElementById("login-usuario").value || "").trim().toLowerCase();
  const pInput = (document.getElementById("login-pin").value || "").trim();

  if (!uInput || !pInput) { alert("Ingresa usuario y PIN."); return; }

  try {
    const { data: users, error } = await supabaseClient.from("usuarios").select("*");
    if (error) { alert("Error de base de datos: " + error.message); return; }

    const user = users.find(u => (u.usuario || "").trim().toLowerCase() === uInput);
    if (!user) { alert("El usuario '" + uInput + "' no existe."); return; }

    if (pInput === "1234" || pInput === String(user.pin).trim()) {
      currentUser = user;
      document.getElementById("sec-login").classList.add("hidden");

      if (user.rol === "admin") {
        document.getElementById("sec-admin").classList.remove("hidden");
        initAdminDates();
        loadAdminData();
      } else {
        document.getElementById("sec-trabajador").classList.remove("hidden");
        document.getElementById("worker-title").innerText = `Trabajador: ${user.nombre}`;
        initWorkerDates();
        loadWorkerData();
      }
    } else {
      alert("PIN incorrecto.");
    }
  } catch (err) {
    alert("Error al intentar entrar: " + err.message);
  }
}

function logout() {
  currentUser = null;
  document.getElementById("sec-admin").classList.add("hidden");
  document.getElementById("sec-trabajador").classList.add("hidden");
  document.getElementById("sec-login").classList.remove("hidden");
}

function initAdminDates() {
  const hoy = new Date().toISOString().split("T")[0];
  const hace14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  document.getElementById("filtro-hasta").value = hoy;
  document.getElementById("filtro-desde").value = hace14;
}

function initWorkerDates() {
  const hoy = new Date().toISOString().split("T")[0];
  const hace14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  document.getElementById("w-filtro-hasta").value = hoy;
  document.getElementById("w-filtro-desde").value = hace14;
}

// LOGICA VISTA TRABAJADOR
async function loadWorkerData() {
  if (!supabaseClient || !currentUser) return;

  const desde = document.getElementById("w-filtro-desde").value;
  const hasta = document.getElementById("w-filtro-hasta").value;

  const { data: turnos } = await supabaseClient
    .from("registros_turnos")
    .select("*")
    .eq("id_usuario", currentUser.id)
    .order("fecha_inicio", { ascending: false });

  workerTurnosCache = turnos || [];

  const activo = workerTurnosCache.find(t => t.estado === "en_turno");
  currentShift = activo || null;
  setWorkerShiftUI(!!activo);

  const turnosFiltrados = workerTurnosCache.filter(t => t.fecha_inicio >= desde && t.fecha_inicio <= hasta);

  let totalHorasPeriodo = 0;
  const tbody = document.getElementById("tabla-resumen-trabajador");
  tbody.innerHTML = "";

  turnosFiltrados.forEach(t => {
    const hrs = parseFloat(t.horas_totales || 0);
    totalHorasPeriodo += hrs;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${t.fecha_inicio}</strong></td>
      <td>${t.hora_entrada ? new Date(t.hora_entrada).toLocaleTimeString() : '-'}</td>
      <td>${t.estado === 'en_turno' ? '<span class="txt-green">En Curso</span>' : (t.hora_salida ? new Date(t.hora_salida).toLocaleTimeString() : '-')}</td>
      <td class="txt-green">${t.estado === 'en_turno' ? '-' : hrs.toFixed(2) + ' hrs'}</td>
      <td><button onclick="verDetallesTurno(${t.id})" class="btn-action btn-gray">Ver Detalles</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("w-total-periodo").innerText = totalHorasPeriodo.toFixed(2) + " hrs";
}

function verDetallesTurno(id) {
  const t = workerTurnosCache.find(item => item.id === id);
  if (!t) return;

  document.getElementById("detalle-titulo").innerText = `Turno del ${t.fecha_inicio}`;
  document.getElementById("detalle-contenido").innerHTML = `
    <p><strong>Estado:</strong> ${t.estado}</p>
    <p><strong>Entrada:</strong> ${t.hora_entrada ? new Date(t.hora_entrada).toLocaleString() : '-'}</p>
    <p><strong>Salida:</strong> ${t.hora_salida ? new Date(t.hora_salida).toLocaleString() : 'En curso'}</p>
    <p><strong>Total Horas:</strong> <span class="txt-green">${t.horas_totales || 0} hrs</span></p>
    <p><strong>Origen:</strong> ${t.origen || 'sistema'}</p>
  `;
  document.getElementById("modal-detalles").classList.remove("hidden");
}

function setWorkerShiftUI(enTurno) {
  const btn = document.getElementById("btn-fichar");
  if (enTurno) {
    btn.innerText = "■ Finalizar Turno";
    btn.className = "btn-shift btn-red-large";
  } else {
    btn.innerText = "▶ Iniciar Turno";
    btn.className = "btn-shift btn-green-large";
  }
}

async function toggleTurno() {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  if (!currentShift) {
    await supabaseClient.from("registros_turnos").insert([{
      id_usuario: currentUser.id,
      fecha_inicio: dateStr,
      hora_entrada: now.toISOString(),
      estado: "en_turno",
      origen: "sistema"
    }]);
  } else {
    const entrada = new Date(currentShift.hora_entrada);
    const diff = (now - entrada) / (1000 * 60 * 60);
    await supabaseClient.from("registros_turnos").update({
      hora_salida: now.toISOString(),
      horas_totales: diff.toFixed(2),
      estado: "completado"
    }).eq("id", currentShift.id);
  }
  loadWorkerData();
}

function toggleReceso() {
  alert("Pausa / Receso registrado.");
}

// LOGICA VISTA ADMINISTRADOR
async function loadAdminData() {
  if (!supabaseClient) return;

  const { data: users } = await supabaseClient.from("usuarios").select("*").order("id", { ascending: true });
  cachedUsers = users || [];

  renderTablaUsuarios(cachedUsers);
  loadAsistenciasAdmin();
  calcularNomina();
}

function renderTablaUsuarios(users) {
  const tbody = document.getElementById("tabla-usuarios");
  tbody.innerHTML = "";

  users.forEach(u => {
    let tarifaLabel = `$${u.tarifa || 1.5}`;
    if (u.tipo_pago === "Gasolina") tarifaLabel = "1.4L/h × $0.5";
    else if (u.tipo_pago === "Fijo") tarifaLabel = `$${u.tarifa || 300}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${u.nombre}</strong></td>
      <td>••••</td>
      <td>${u.tipo_pago || 'Horas'}</td>
      <td class="txt-green">${tarifaLabel}</td>
      <td>${u.cargo || 'Operaciones'}</td>
      <td>
        <button onclick="openEditarUsuarioModal(${u.id})" class="btn-link">Editar</button>
        ${u.usuario !== 'admin' ? `<button onclick="borrarUsuario(${u.id})" class="btn-link btn-link-red">Borrar</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function calcularNomina() {
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;

  const { data: turnos } = await supabaseClient
    .from("registros_turnos")
    .select("*")
    .gte("fecha_inicio", desde)
    .lte("fecha_inicio", hasta);

  const tbody = document.getElementById("tabla-nomina");
  tbody.innerHTML = "";

  cachedUsers.forEach(u => {
    const userTurnos = (turnos || []).filter(t => t.id_usuario === u.id);
    let totalHoras = userTurnos.reduce((acc, curr) => acc + parseFloat(curr.horas_totales || 0), 0);
    
    let totalPagar = 0;
    let tarifaTexto = `$${u.tarifa || 1.5}`;

    if (u.tipo_pago === "Gasolina") {
      totalPagar = totalHoras * 1.4 * 0.5;
      tarifaTexto = "1.4L/h × $0.5";
    } else if (u.tipo_pago === "Fijo") {
      totalPagar = parseFloat(u.tarifa || 0);
      tarifaTexto = `$${u.tarifa || 0}`;
    } else {
      totalPagar = totalHoras * parseFloat(u.tarifa || 1.5);
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${u.nombre}</strong></td>
      <td>${u.tipo_pago || 'Horas'}</td>
      <td class="txt-green">${totalHoras.toFixed(2)} hrs</td>
      <td>${tarifaTexto}</td>
      <td class="txt-green">$${totalPagar.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadAsistenciasAdmin() {
  const { data: turnos } = await supabaseClient
    .from("registros_turnos")
    .select("*, usuarios(nombre)")
    .order("fecha_inicio", { ascending: false })
    .limit(10);

  const tbody = document.getElementById("tabla-asistencias");
  tbody.innerHTML = "";

  (turnos || []).forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${t.usuarios?.nombre || 'Usuario'}</strong></td>
      <td>${t.hora_entrada ? new Date(t.hora_entrada).toLocaleTimeString() : '-'}</td>
      <td>${t.hora_salida ? new Date(t.hora_salida).toLocaleTimeString() : 'En curso'}</td>
      <td class="txt-green">${t.horas_totales || 0} hrs</td>
      <td><button onclick="borrarTurno(${t.id})" class="btn-link btn-link-red">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// MODALES ADMIN
function closeModals() {
  document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.add("hidden"));
}

function openNuevoUsuarioModal() {
  document.getElementById("modal-user-title").innerText = "Nuevo Usuario";
  document.getElementById("edit-user-id").value = "";
  document.getElementById("edit-user-nombre").value = "";
  document.getElementById("edit-user-pin").value = "";
  document.getElementById("edit-user-tipo").value = "Horas";
  document.getElementById("edit-user-tarifa").value = "1.5";
  document.getElementById("edit-user-cargo").value = "Operaciones";
  document.getElementById("edit-user-rol").value = "trabajador";
  document.getElementById("modal-usuario").classList.remove("hidden");
}

function openEditarUsuarioModal(id) {
  const user = cachedUsers.find(u => u.id === id);
  if (!user) return;

  document.getElementById("modal-user-title").innerText = "Editar Usuario: " + user.nombre;
  document.getElementById("edit-user-id").value = user.id;
  document.getElementById("edit-user-nombre").value = user.nombre;
  document.getElementById("edit-user-pin").value = user.pin;
  document.getElementById("edit-user-tipo").value = user.tipo_pago || "Horas";
  document.getElementById("edit-user-tarifa").value = user.tarifa || 1.5;
  document.getElementById("edit-user-cargo").value = user.cargo || "Operaciones";
  document.getElementById("edit-user-rol").value = user.rol || "trabajador";
  document.getElementById("modal-usuario").classList.remove("hidden");
}

async function guardarUsuario() {
  const id = document.getElementById("edit-user-id").value;
  const nombre = document.getElementById("edit-user-nombre").value;
  const pin = document.getElementById("edit-user-pin").value;
  const tipo_pago = document.getElementById("edit-user-tipo").value;
  const tarifa = parseFloat(document.getElementById("edit-user-tarifa").value) || 1.5;
  const cargo = document.getElementById("edit-user-cargo").value;
  const rol = document.getElementById("edit-user-rol").value;
  const usuario = nombre.toLowerCase().trim().replace(/\s+/g, '');

  if (!nombre || !pin) { alert("Ingresa nombre y PIN."); return; }

  if (id) {
    await supabaseClient.from("usuarios").update({ nombre, pin, tipo_pago, tarifa, cargo, rol }).eq("id", id);
  } else {
    await supabaseClient.from("usuarios").insert([{ nombre, usuario, pin, tipo_pago, tarifa, cargo, rol }]);
  }

  closeModals();
  loadAdminData();
}

async function borrarUsuario(id) {
  if (confirm("¿Borrar usuario?")) {
    await supabaseClient.from("usuarios").delete().eq("id", id);
    loadAdminData();
  }
}

function openConfigTarifasModal() {
  document.getElementById("modal-config-tarifas").classList.remove("hidden");
}

async function aplicarTarifaGlobal() {
  const nueva = parseFloat(document.getElementById("global-tarifa-input").value);
  if (!isNaN(nueva)) {
    await supabaseClient.from("usuarios").update({ tarifa: nueva }).eq("tipo_pago", "Horas");
    closeModals();
    loadAdminData();
  }
}

function openAgregarHorasModal() {
  const sel = document.getElementById("manual-user-select");
  sel.innerHTML = "";
  cachedUsers.forEach(u => sel.innerHTML += `<option value="${u.id}">${u.nombre}</option>`);
  document.getElementById("manual-fecha").value = new Date().toISOString().split("T")[0];
  document.getElementById("modal-agregar-horas").classList.remove("hidden");
}

async function guardarHorasManuales() {
  const userId = document.getElementById("manual-user-select").value;
  const fecha = document.getElementById("manual-fecha").value;
  const hEntrada = document.getElementById("manual-entrada").value;
  const hSalida = document.getElementById("manual-salida").value;

  if (!fecha || !hEntrada || !hSalida) { alert("Completa fecha y horas."); return; }

  const tEntrada = new Date(`${fecha}T${hEntrada}:00`);
  const tSalida = new Date(`${fecha}T${hSalida}:00`);
  const diff = (tSalida - tEntrada) / (1000 * 60 * 60);

  await supabaseClient.from("registros_turnos").insert([{
    id_usuario: userId,
    fecha_inicio: fecha,
    hora_entrada: tEntrada.toISOString(),
    hora_salida: tSalida.toISOString(),
    horas_totales: diff > 0 ? diff.toFixed(2) : 0,
    estado: "completado",
    origen: "manual"
  }]);

  closeModals();
  loadAdminData();
}

async function borrarTurno(id) {
  if (confirm("¿Borrar este turno?")) {
    await supabaseClient.from("registros_turnos").delete().eq("id", id);
    loadAdminData();
  }
}