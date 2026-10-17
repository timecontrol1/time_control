// Credenciales de Supabase
const SUPABASE_URL = "https://exolwlcrstqffqylsoku.supabase.co";
const SUPABASE_KEY = "sb_publishable_n6esYWCYBxj95U72gq8gjg_8dTIjvrB";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentShift = null;

// LOGIN
async function login() {
  const username = document.getElementById("login-usuario").value;
  const pin = document.getElementById("login-pin").value;

  const { data: users, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("usuario", username);

  if (error || !users || users.length === 0) {
    alert("Usuario no encontrado.");
    return;
  }

  const user = users[0];

  if (pin === "1234") {
    currentUser = user;
    document.getElementById("sec-login").classList.add("hidden");

    if (user.rol === "admin") {
      document.getElementById("sec-admin").classList.remove("hidden");
      loadAdminData();
    } else {
      document.getElementById("sec-trabajador").classList.remove("hidden");
      document.getElementById("worker-title").innerText = `Hola, ${user.nombre}`;
      loadWorkerData();
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

// TRABAJADOR
async function loadWorkerData() {
  const { data: shifts } = await supabase
    .from("registros_turnos")
    .select("*")
    .eq("id_usuario", currentUser.id)
    .eq("estado", "en_turno");

  if (shifts && shifts.length > 0) {
    currentShift = shifts[0];
    setShiftUI(true);
  } else {
    currentShift = null;
    setShiftUI(false);
  }

  const { data: history } = await supabase
    .from("registros_turnos")
    .select("*")
    .eq("id_usuario", currentUser.id)
    .order("fecha_inicio", { ascending: false })
    .limit(5);

  const historyContainer = document.getElementById("worker-history");
  historyContainer.innerHTML = "";

  (history || []).forEach(shift => {
    const item = document.createElement("div");
    item.className = "item-row";
    item.innerHTML = `
      <div>
        <strong>${shift.fecha_inicio}</strong><br>
        <small>${shift.horas_totales || 0} hrs (${shift.origen})</small>
      </div>
      <span class="status-badge ${shift.estado === 'en_turno' ? 'badge-active' : 'badge-off'}">
        ${shift.estado}
      </span>
    `;
    historyContainer.appendChild(item);
  });
}

function setShiftUI(active) {
  const btn = document.getElementById("btn-fichar");
  const badge = document.getElementById("worker-status");

  if (active) {
    btn.innerText = "Finalizar Turno";
    btn.className = "btn-danger";
    badge.innerText = "En Turno";
    badge.className = "status-badge badge-active";
  } else {
    btn.innerText = "Iniciar Turno";
    btn.className = "";
    badge.innerText = "Fuera de Turno";
    badge.className = "status-badge badge-off";
  }
}

async function toggleTurno() {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  if (!currentShift) {
    const { data, error } = await supabase.from("registros_turnos").insert([{
      id_usuario: currentUser.id,
      fecha_inicio: dateStr,
      hora_entrada: now.toISOString(),
      estado: "en_turno",
      origen: "sistema"
    }]).select();

    if (!error) {
      currentShift = data[0];
      setShiftUI(true);
    }
  } else {
    const entrada = new Date(currentShift.hora_entrada);
    const diffMs = now - entrada;
    const horas = (diffMs / (1000 * 60 * 60)).toFixed(2);

    await supabase.from("registros_turnos").update({
      hora_salida: now.toISOString(),
      horas_totales: horas,
      estado: "completado"
    }).eq("id", currentShift.id);

    currentShift = null;
    setShiftUI(false);
  }
  loadWorkerData();
}

// ADMINISTRADOR
async function loadAdminData() {
  const { data: users } = await supabase.from("usuarios").select("*");
  
  const userList = document.getElementById("admin-user-list");
  const importSelect = document.getElementById("import-usuario");
  userList.innerHTML = "";
  importSelect.innerHTML = "";

  (users || []).forEach(u => {
    const div = document.createElement("div");
    div.className = "item-row";
    div.innerHTML = `
      <div>
        <strong>${u.nombre}</strong> (${u.usuario})<br>
        <small>Rol: ${u.rol} | Tarifa: $${u.tarifa}/h</small>
      </div>
      ${u.usuario !== 'admin' ? `<button onclick="eliminarUsuario(${u.id})" class="btn-danger" style="width:auto; padding:4px 8px; margin:0;">Eliminar</button>` : ''}
    `;
    userList.appendChild(div);

    if (u.rol !== 'admin') {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.innerText = u.nombre;
      importSelect.appendChild(opt);
    }
  });

  loadReports();
}

async function crearUsuario() {
  const nombre = document.getElementById("new-user-nombre").value;
  const username = document.getElementById("new-user-username").value.toLowerCase();
  const pin = document.getElementById("new-user-pin").value;

  if (!nombre || !username || !pin) {
    alert("Completa todos los campos");
    return;
  }

  const { error } = await supabase.from("usuarios").insert([{
    nombre: nombre,
    usuario: username,
    pin: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQOEg6Lruj3vjPGga31lW",
    rol: "trabajador",
    tipo_pago: "por_hora",
    tarifa: 1.50
  }]);

  if (!error) {
    alert("Usuario creado exitosamente.");
    loadAdminData();
  } else {
    alert("Error al crear usuario: " + error.message);
  }
}

async function eliminarUsuario(id) {
  if (confirm("¿Seguro que deseas eliminar este usuario?")) {
    await supabase.from("usuarios").delete().eq("id", id);
    loadAdminData();
  }
}

async function registrarHorasManuales() {
  const userId = document.getElementById("import-usuario").value;
  const fecha = document.getElementById("import-fecha").value;
  const hEntrada = document.getElementById("import-hora-entrada").value;
  const hSalida = document.getElementById("import-hora-salida").value;

  if (!fecha || !hEntrada || !hSalida) {
    alert("Completa la fecha y horas.");
    return;
  }

  const tEntrada = new Date(`${fecha}T${hEntrada}:00`);
  const tSalida = new Date(`${fecha}T${hSalida}:00`);
  const diff = (tSalida - tEntrada) / (1000 * 60 * 60);

  const { error } = await supabase.from("registros_turnos").insert([{
    id_usuario: userId,
    fecha_inicio: fecha,
    hora_entrada: tEntrada.toISOString(),
    hora_salida: tSalida.toISOString(),
    horas_totales: diff > 0 ? diff.toFixed(2) : 0,
    estado: "completado",
    origen: "manual_import"
  }]);

  if (!error) {
    alert("Horas registradas correctamente.");
    loadReports();
  }
}

async function loadReports() {
  const { data: records } = await supabase
    .from("registros_turnos")
    .select("*, usuarios(nombre)")
    .order("fecha_inicio", { ascending: false });

  const reportsContainer = document.getElementById("admin-reports-list");
  reportsContainer.innerHTML = "";

  (records || []).forEach(r => {
    const item = document.createElement("div");
    item.className = "item-row";
    item.innerHTML = `
      <div>
        <strong>${r.usuarios?.nombre || 'Usuario'}</strong> - ${r.fecha_inicio}<br>
        <small>${r.horas_totales || 0} hrs (${r.origen})</small>
      </div>
      <span class="status-badge badge-active">$${((r.horas_totales || 0) * 1.5).toFixed(2)}</span>
    `;
    reportsContainer.appendChild(item);
  });
}

function switchTab(tabId) {
  document.getElementById("tab-usuarios").classList.add("hidden");
  document.getElementById("tab-horas").classList.add("hidden");
  document.getElementById("tab-reportes").classList.add("hidden");
  
  document.getElementById(tabId).classList.remove("hidden");
}
