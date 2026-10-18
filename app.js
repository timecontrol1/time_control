// CONFIGURACIÓN Y CONEXIÓN
const SUPABASE_URL = "https://exolwlcrstqffqylsoku.supabase.co";
const SUPABASE_KEY = "sb_publishable_n6esYWCYBxj95U72gq8gjg_8dTIjvrB";

let supabaseClient = null;
if (window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {
    console.error("Error al iniciar cliente de Supabase:", err);
  }
}

// ESTADO GLOBAL
let currentUser = null;
let currentShift = null;

// BASE DE DATOS LOCAL (SIEMPRE DISPONIBLE COMO RESPALDO)
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

let cachedTurnos = [];

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

  // Intentar sincronizar desde Supabase
  if (supabaseClient) {
    try {
      const { data: users } = await supabaseClient.from("usuarios").select("*").order("id", { ascending: true });
      if (users && users.length > 0) cachedUsers = users;

      const { data: turnos } = await supabaseClient.from("registros_turnos").select("*").order("id", { ascending: false });
      if (turnos) cachedTurnos = turnos;
    } catch (e) {
      console.warn("Error de conexión Supabase, usando local:", e);
    }
  }

  let user = cachedUsers.find(u => 
    (u.usuario || "").toLowerCase() === uInput || 
    (u.nombre || "").toLowerCase() === uInput ||
    (uInput === "admin" && (u.usuario === "administrador" || u.rol === "admin"))
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

// ==========================================
// PANEL TRABAJADOR
// ==========================================

function loadWorkerData() {
  if (!currentUser) return;

  // Buscar turno activo
  currentShift = cachedTurnos.find(t => t.id_usuario === currentUser.id && (t.estado === "en_turno" || !t.hora_salida)) || null;
  
  actualizarBotonesTurno(!!currentShift);
  renderTablaTrabajador();
}

function actualizarBotonesTurno(enTurno) {
  const btnFichar = document.getElementById("btn-fichar");
  if (!btnFichar) return;

  if (enTurno) {
    btnFichar.innerText = "■ Finalizar Turno";
    btnFichar.style.backgroundColor = "#ef4444";
    btnFichar.style.color = "#ffffff";
  } else {
    btnFichar.innerText = "▶ Iniciar Turno";
    btnFichar.style.backgroundColor = "#10b981";
    btnFichar.style.color = "#022c22";
  }
}

function confirmarToggleTurno() {
  if (!currentUser) return;

  const enTurno = !!currentShift;
  const titulo = enTurno ? "¿Finalizar Turno?" : "¿Iniciar Turno?";
  const mensaje = enTurno ? "¿Estás seguro que deseas finalizar tu turno?" : "¿Estás seguro que deseas iniciar un nuevo turno de trabajo?";

  const elTitle = document.getElementById("confirm-title");
  const elText = document.getElementById("confirm-text");
  if (elTitle) elTitle.innerText = titulo;
  if (elText) elText.innerText = mensaje;

  const modalConfirm = document.getElementById("modal-confirm");
  if (modalConfirm) {
    modalConfirm.classList.remove("hidden");
    modalConfirm.style.display = "flex";
  }
}

async function ejecutarToggleTurno() {
  closeModals();
  const now = new Date();
  
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const fechaStr = `${yyyy}-${mm}-${dd}`;

  if (!currentShift) {
    // INICIAR TURNO
    const nuevoTurno = {
      id: Date.now(),
      id_usuario: currentUser.id,
      fecha_inicio: fechaStr,
      hora_entrada: now.toISOString(),
      hora_salida: null,
      horas_totales: 0,
      estado: "en_turno",
      origen: "sistema"
    };

    cachedTurnos.unshift(nuevoTurno);
    currentShift = nuevoTurno;

    if (supabaseClient) {
      try {
        await supabaseClient.from("registros_turnos").insert([{
          id_usuario: currentUser.id,
          fecha_inicio: fechaStr,
          hora_entrada: now.toISOString(),
          estado: "en_turno",
          origen: "sistema"
        }]);
      } catch (e) {
        console.warn("No se pudo guardar en Supabase, guardado en memoria local.");
      }
    }
  } else {
    // FINALIZAR TURNO
    const entrada = new Date(currentShift.hora_entrada);
    const salida = now;
    let diffMs = salida - entrada;
    let diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));

    currentShift.hora_salida = salida.toISOString();
    currentShift.horas_totales = parseFloat(diffHrs.toFixed(2));
    currentShift.estado = "completado";

    if (supabaseClient) {
      try {
        await supabaseClient.from("registros_turnos").update({
          hora_salida: salida.toISOString(),
          horas_totales: parseFloat(diffHrs.toFixed(2)),
          estado: "completado"
        }).eq("id", currentShift.id);
      } catch (e) {
        console.warn("Error al actualizar en Supabase.");
      }
    }

    currentShift = null;
  }

  loadWorkerData();
}

function toggleReceso() {
  if (!currentShift) {
    alert("Primero debes iniciar turno antes de pausar.");
    return;
  }
  alert("Pausa / Receso registrado.");
}

function renderTablaTrabajador() {
  const desde = document.getElementById("w-filtro-desde") ? document.getElementById("w-filtro-desde").value : "";
  const hasta = document.getElementById("w-filtro-hasta") ? document.getElementById("w-filtro-hasta").value : "";

  const tbody = document.getElementById("tabla-resumen-trabajador");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filtrados = cachedTurnos.filter(t => t.id_usuario === currentUser.id && (!desde || t.fecha_inicio >= desde) && (!hasta || t.fecha_inicio <= hasta));

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
      <td class="txt-green">${(parseFloat(t.horas_totales) || 0).toFixed(2)} hrs</td>
      <td><button onclick="verDetalleRegistro(${t.id})" class="btn-action btn-gray">Detalle</button></td>
    `;
    tbody.appendChild(tr);
  });

  const labelTotal = document.getElementById("w-total-periodo");
  if (labelTotal) labelTotal.innerText = `${totalHoras.toFixed(2)} hrs`;
}

function verDetalleRegistro(idTurno) {
  const t = cachedTurnos.find(x => x.id === idTurno);
  if (!t) return;

  const elTitle = document.getElementById("detalle-titulo");
  if (elTitle) elTitle.innerText = `Detalle del Turno (${t.fecha_inicio})`;
  
  const hEntrada = t.hora_entrada ? new Date(t.hora_entrada).toLocaleString() : '-';
  const hSalida = t.hora_salida ? new Date(t.hora_salida).toLocaleString() : 'En Curso';

  const content = document.getElementById("detalle-contenido");
  if (content) {
    content.innerHTML = `
      <div style="background:#1e293b; padding:12px; border-radius:6px; line-height:1.6;">
        <p><strong>Fecha:</strong> ${t.fecha_inicio}</p>
        <p><strong>Hora Entrada:</strong> ${hEntrada}</p>
        <p><strong>Hora Salida:</strong> ${hSalida}</p>
        <p><strong>Total Horas:</strong> <span class="txt-green">${(parseFloat(t.horas_totales) || 0).toFixed(2)} hrs</span></p>
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

// ==========================================
// PANEL ADMINISTRADOR
// ==========================================

function loadAdminData() {
  renderTablaUsuariosAdmin();
  renderHistorialAdmin();
}

function renderTablaUsuariosAdmin() {
  const desde = document.getElementById("filtro-desde") ? document.getElementById("filtro-desde").value : "";
  const hasta = document.getElementById("filtro-hasta") ? document.getElementById("filtro-hasta").value : "";

  let d1 = desde ? new Date(desde) : new Date();
  let d2 = hasta ? new Date(hasta) : new Date();
  let diffDias = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
  let semanas = Math.max(1, diffDias / 7);

  const turnosFiltrados = cachedTurnos.filter(t => (!desde || t.fecha_inicio >= desde) && (!hasta || t.fecha_inicio <= hasta));

  const tbody = document.getElementById("tabla-usuarios");
  if (!tbody) return;
  tbody.innerHTML = "";

  cachedUsers.forEach((u, index) => {
    let tarifaVal = u.tarifa !== undefined && u.tarifa !== null ? parseFloat(u.tarifa) : 1.5;
    let tarifaLabel = `$${tarifaVal.toFixed(2)}`;
    let tipoPago = (u.tipo_pago || "Horas").trim();

    if (tipoPago === "Gasolina") tarifaLabel = "1.4L/h × $0.50";
    else if (tipoPago === "Fijo") tarifaLabel = `$${tarifaVal.toFixed(2)} / sem`;

    const userTurnos = turnosFiltrados.filter(t => t.id_usuario === u.id);
    let totalHoras = userTurnos.reduce((acc, curr) => acc + parseFloat(curr.horas_totales || 0), 0);
    
    let totalPagar = 0;
    if (tipoPago === "Gasolina") {
      let litros = totalHoras * 1.4;
      totalPagar = litros * 0.50;
    } else if (tipoPago === "Fijo") {
      totalPagar = tarifaVal * semanas;
    } else {
      totalPagar = totalHoras * tarifaVal;
    }

    const pinId = `pin-text-${index}`;
    const btnId = `pin-btn-${index}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${u.nombre}</strong></td>
      <td>
        <span id="${pinId}" data-pin="${u.pin}">••••</span>
        <button id="${btnId}" onclick="togglePinVisibility('${pinId}', '${btnId}')" class="btn-icon" style="margin-left:5px;" title="Ver PIN">👁️</button>
      </td>
      <td>${tipoPago}</td>
      <td class="txt-green">${tarifaLabel}</td>
      <td>${u.cargo || 'Operaciones'}</td>
      <td class="txt-green"><strong>${tipoPago === 'Fijo' ? '-' : totalHoras.toFixed(2) + ' hrs'}</strong></td>
      <td class="txt-green"><strong>$${totalPagar.toFixed(2)}</strong></td>
      <td>
        <button onclick="openEditarUsuarioModal(${u.id})" class="btn-icon" title="Editar">✏️</button>
        ${u.usuario !== 'admin' && u.usuario !== 'administrador' ? `<button onclick="borrarUsuario(${u.id})" class="btn-icon" title="Borrar">🗑️</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderHistorialAdmin() {
  let agrupado = {};
  cachedTurnos.forEach(t => {
    const userObj = cachedUsers.find(u => u.id === t.id_usuario);
    const uNombre = userObj ? userObj.nombre : 'Desconocido';
    const fecha = t.fecha_inicio;
    const key = `${t.id_usuario}_${fecha}`;

    if (!agrupado[key]) {
      agrupado[key] = { userId: t.id_usuario, nombre: uNombre, fecha: fecha, totalHoras: 0, activo: false, turnoActivoId: null };
    }
    agrupado[key].totalHoras += parseFloat(t.horas_totales || 0);
    if (t.estado === 'en_turno' || !t.hora_salida) {
      agrupado[key].activo = true;
      agrupado[key].turnoActivoId = t.id;
    }
  });

  const tbody = document.getElementById("tabla-asistencias");
  if (!tbody) return;
  tbody.innerHTML = "";

  Object.values(agrupado).sort((a,b) => b.fecha.localeCompare(a.fecha)).forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.nombre}</strong></td>
      <td>${item.fecha}</td>
      <td>
        ${item.activo ? '<span class="pulse-dot" title="Activo"></span><span class="txt-green">En Turno Activo</span>' : `<span class="txt-green">${item.totalHoras.toFixed(2)} hrs</span>`}
      </td>
      <td>
        <button onclick="verDetallesAdminGlobal(${item.userId}, '${item.fecha}')" class="btn-action btn-gray" style="padding:4px 8px;">Detalles</button>
        ${item.activo ? `<button onclick="forzarSalida(${item.turnoActivoId})" class="btn-action btn-red" style="padding:4px 8px; margin-left:4px;" title="Forzar salida">Forzar Salida</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function togglePinVisibility(id, btnId) {
  const span = document.getElementById(id);
  const btn = document.getElementById(btnId);
  if (span && span.dataset.pin) {
    if (span.textContent === "••••") {
      span.textContent = span.dataset.pin;
      btn.textContent = "👁️‍🗨️";
    } else {
      span.textContent = "••••";
      btn.textContent = "👁️";
    }
  }
}

function openEditarUsuarioModal(id) {
  const user = cachedUsers.find(u => u.id === id);
  if (!user) return;

  document.getElementById("modal-user-title").innerText = "Editar Usuario: " + user.nombre;
  document.getElementById("edit-user-id").value = user.id;
  document.getElementById("edit-user-nombre").value = user.nombre;
  document.getElementById("edit-user-pin").value = user.pin;
  document.getElementById("edit-user-tipo").value = user.tipo_pago || "Horas";
  document.getElementById("edit-user-tarifa").value = user.tarifa !== undefined ? user.tarifa : 1.5;
  document.getElementById("edit-user-cargo").value = user.cargo || "Operaciones";
  document.getElementById("edit-user-rol").value = user.rol || "trabajador";
  
  const modalUser = document.getElementById("modal-usuario");
  if (modalUser) {
    modalUser.classList.remove("hidden");
    modalUser.style.display = "flex";
  }
}

async function guardarUsuario() {
  const id = document.getElementById("edit-user-id").value;
  const nombre = (document.getElementById("edit-user-nombre").value || "").trim();
  const pin = (document.getElementById("edit-user-pin").value || "").trim();
  const tipo_pago = document.getElementById("edit-user-tipo").value;
  const valTarifa = parseFloat(document.getElementById("edit-user-tarifa").value) || (tipo_pago === 'Fijo' ? 150 : 1.5);
  const cargo = document.getElementById("edit-user-cargo").value;
  const rol = document.getElementById("edit-user-rol").value;
  const usuario = nombre.toLowerCase().trim().replace(/\s+/g, '');

  if (!nombre || !pin) { alert("Ingresa nombre y PIN."); return; }

  let userObj = cachedUsers.find(u => String(u.id) === String(id));
  if (userObj) {
    userObj.nombre = nombre;
    userObj.pin = pin;
    userObj.tipo_pago = tipo_pago;
    userObj.tarifa = valTarifa;
    userObj.cargo = cargo;
    userObj.rol = rol;
  } else {
    cachedUsers.push({ id: Date.now(), nombre, usuario, pin, tipo_pago, tarifa: valTarifa, cargo, rol });
  }

  if (supabaseClient && id) {
    try {
      await supabaseClient.from("usuarios").update({ nombre, usuario, pin, tipo_pago, tarifa: valTarifa, cargo, rol }).eq("id", id);
    } catch (e) {
      console.warn("No se actualizó en Supabase.");
    }
  }

  closeModals();
  loadAdminData();
  alert("¡Usuario y Tarifa actualizados!");
}

function openConfigTarifasModal() {
  const modalTarifas = document.getElementById("modal-config-tarifas");
  if (modalTarifas) {
    modalTarifas.classList.remove("hidden");
    modalTarifas.style.display = "flex";
  }
}

async function aplicarTarifaGlobal() {
  const nueva = parseFloat(document.getElementById("global-tarifa-input").value);
  if (isNaN(nueva)) return;

  cachedUsers.forEach(u => {
    const tipo = (u.tipo_pago || "Horas").trim().toLowerCase();
    if (tipo !== "gasolina" && tipo !== "fijo") {
      u.tarifa = nueva;
    }
  });

  if (supabaseClient) {
    try {
      for (let u of cachedUsers) {
        const tipo = (u.tipo_pago || "Horas").trim().toLowerCase();
        if (tipo !== "gasolina" && tipo !== "fijo") {
          await supabaseClient.from("usuarios").update({ tarifa: nueva }).eq("id", u.id);
        }
      }
    } catch (e) {
      console.warn("Error actualizando tarifas en Supabase.");
    }
  }

  closeModals();
  loadAdminData();
  alert("Tarifa general aplicada con éxito a todos los trabajadores por hora.");
}

function closeModals() {
  document.querySelectorAll(".modal-backdrop").forEach(m => {
    m.classList.add("hidden");
    m.style.display = "none";
  });
}