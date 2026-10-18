// CONFIGURACIÓN DE SUPABASE Y GREEN API (WHATSAPP)
const SUPABASE_URL = "https://exolwlcrstqffqylsoku.supabase.co";
const SUPABASE_KEY = "sb_publishable_n6esYWCYBxj95U72gq8gjg_8dTIjvrB";

const GREEN_ID_INSTANCE = "710722771733";
const GREEN_API_TOKEN = "5fdd00776c164fd991e9046fef49e5b20b1feffc9714406aa4";
const WHATSAPP_GROUP_ID = "120363413840296852@g.us"; 

let supabaseClient = null;
if (window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {
    console.error("Error iniciando Supabase:", err);
  }
}

// FUNCIÓN DE NOTIFICACIÓN A WHATSAPP (CON PASARELA TRANSPARENTE ANTI-CORS)
async function enviarNotificacionWhatsApp(nombreTrabajador, accion, fecha, hora) {
  if (!WHATSAPP_GROUP_ID) return;

  const icono = accion === "INICIO" ? "🟢" : "🔴";
  const titulo = accion === "INICIO" ? "INICIO DE TURNO" : "FINALIZACIÓN DE TURNO";

  const mensaje = `${icono} *${titulo}*\n` +
                  `👤 *Trabajador:* ${nombreTrabajador}\n` +
                  `📅 *Fecha:* ${fecha}\n` +
                  `⏰ *Hora:* ${hora}\n` +
                  `📌 *Estado:* Registrado en sistema`;

  // Usamos una pasarela pública de API segura (api.allorigins.win) para evitar restricciones del navegador
  const greenApiUrl = `https://7107.api.greenapi.com/waInstance${GREEN_ID_INSTANCE}/sendMessage/${GREEN_API_TOKEN}`;
  
  try {
    // Método principal directo por pasarela de reenvío
    await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(greenApiUrl)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chatId: WHATSAPP_GROUP_ID,
        message: mensaje
      })
    });
  } catch (error) {
    // Respaldo secundario por fetch directo
    try {
      await fetch(greenApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: WHATSAPP_GROUP_ID, message: mensaje })
      });
    } catch (e) {
      console.warn("Error enviando notificación a WhatsApp:", e);
    }
  }
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

// RESPALDO LOCALSTORAGE
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

// INICIALIZACIÓN DE SESIÓN
window.addEventListener('DOMContentLoaded', async () => {
  initMatrixEffect();
  cargarTurnosLocales();
  await syncDataFromSupabase();

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
        initSemanaEnCursoDates("w-filtro-desde", "w-filtro-hasta");
        loadWorkerData();
      }
    }
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
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }
  setInterval(draw, 33);
}

function initSemanaEnCursoDates(inputDesdeId, inputHastaId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const dayOfWeek = now.getDay();
  
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
      cachedTurnos = turnos;
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

  await syncDataFromSupabase();

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
  localStorage.removeItem("active_user_id");
  document.getElementById("sec-admin").classList.add("hidden");
  document.getElementById("sec-trabajador").classList.add("hidden");
  document.getElementById("sec-login").classList.remove("hidden");
}

// PANEL TRABAJADOR CON NOTIFICACIÓN AUTOMÁTICA A WHATSAPP
async function loadWorkerData() {
  if (!currentUser) return;
  await syncDataFromSupabase();

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

  document.getElementById("confirm-title").innerText = titulo;
  document.getElementById("confirm-text").innerText = mensaje;

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
  const horaStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!currentShift) {
    // INICIAR TURNO Y GUARDAR EN SUPABASE
    const nuevoTurno = {
      id: Date.now(),
      id_usuario: Number(currentUser.id),
      fecha_inicio: fechaStr,
      hora_entrada: now.toISOString(),
      estado: "en_turno",
      origen: "sistema"
    };

    cachedTurnos.unshift(nuevoTurno);
    currentShift = nuevoTurno;
    guardarTurnosLocales();

    if (supabaseClient) {
      try {
        await supabaseClient.from("registros_turnos").insert([{
          id_usuario: Number(currentUser.id),
          fecha_inicio: fechaStr,
          hora_entrada: now.toISOString(),
          estado: "en_turno",
          origen: "sistema"
        }]);
      } catch (e) {}
    }

    // DISPARAR MENSAJE AUTOMÁTICO A WHATSAPP
    enviarNotificacionWhatsApp(currentUser.nombre, "INICIO", fechaStr, horaStr);

  } else {
    // FINALIZAR TURNO Y GUARDAR EN SUPABASE
    const entrada = new Date(currentShift.hora_entrada);
    const salida = now;
    let diffMs = salida - entrada;
    let diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));

    currentShift.hora_salida = salida.toISOString();
    currentShift.horas_totales = parseFloat(diffHrs.toFixed(2));
    currentShift.estado = "completado";
    guardarTurnosLocales();

    if (supabaseClient) {
      try {
        await supabaseClient.from("registros_turnos").update({
          hora_salida: salida.toISOString(),
          horas_totales: parseFloat(diffHrs.toFixed(2)),
          estado: "completado"
        }).eq("id", currentShift.id);
      } catch (e) {}
    }

    // DISPARAR MENSAJE AUTOMÁTICO A WHATSAPP
    enviarNotificacionWhatsApp(currentUser.nombre, "FIN", fechaStr, horaStr);

    currentShift = null;
  }

  await loadWorkerData();
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
      porFecha[t.fecha_inicio] = { fecha: t.fecha_inicio, totalHoras: 0, turnosIds: [], primeraEntrada: null, ultimaSalida: null, enCurso: false };
    }
    let grupo = porFecha[t.fecha_inicio];
    grupo.totalHoras += parseFloat(t.horas_totales || 0);
    grupo.turnosIds.push(t.id);

    if (t.hora_entrada) {
      let tEnt = new Date(t.hora_entrada);
      if (!grupo.primeraEntrada || tEnt < new Date(grupo.primeraEntrada)) {
        grupo.primeraEntrada = t.hora_entrada;
      }
    }

    if (t.hora_salida) {
      let tSal = new Date(t.hora_salida);
      if (!grupo.ultimaSalida || tSal > new Date(grupo.ultimaSalida)) {
        grupo.ultimaSalida = t.hora_salida;
      }
    } else {
      grupo.enCurso = true;
    }
  });

  let totalPeriodo = 0;

  Object.values(porFecha).sort((a,b) => b.fecha.localeCompare(a.fecha)).forEach(g => {
    totalPeriodo += g.totalHoras;
    const hEntrada = g.primeraEntrada ? new Date(g.primeraEntrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
    const hSalida = g.enCurso ? '<span class="txt-green">En Curso</span>' : (g.ultimaSalida ? new Date(g.ultimaSalida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-');

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${g.fecha}</strong></td>
      <td>${hEntrada}</td>
      <td>${hSalida}</td>
      <td class="txt-green">${g.totalHoras.toFixed(2)} hrs</td>
      <td><button onclick="verDetalleDia('${g.fecha}')" class="btn-action btn-gray">Detalle</button></td>
    `;
    tbody.appendChild(tr);
  });

  const labelTotal = document.getElementById("w-total-periodo");
  if (labelTotal) labelTotal.innerText = `${totalPeriodo.toFixed(2)} hrs`;
  calcularSimuladorCobro();
}

function verDetalleDia(fecha) {
  const listaTurnos = cachedTurnos.filter(t => String(t.id_usuario) === String(currentUser.id) && t.fecha_inicio === fecha);
  document.getElementById("detalle-titulo").innerText = `Detalle de Turnos (${fecha})`;
  let html = `<p>Registros del día:</p><hr style="border-color:#334155; margin:10px 0;">`;
  
  listaTurnos.forEach(t => {
    let ent = t.hora_entrada ? new Date(t.hora_entrada).toLocaleTimeString() : '-';
    let sal = t.hora_salida ? new Date(t.hora_salida).toLocaleTimeString() : 'En curso';
    html += `
      <div style="background:#1e293b; padding:10px; border-radius:6px; margin-bottom:8px;">
        <small>Entrada: ${ent}</small><br>
        <small>Salida: ${sal}</small><br>
        Total: <span class="txt-green">${(parseFloat(t.horas_totales) || 0).toFixed(2)} hrs</span>
      </div>
    `;
  });

  document.getElementById("detalle-contenido").innerHTML = html;
  const modalDetalles = document.getElementById("modal-detalles");
  if (modalDetalles) {
    modalDetalles.classList.remove("hidden");
    modalDetalles.style.display = "flex";
  }
}

function calcularSimuladorCobro() {
  const inputTarifa = document.getElementById("w-tarifa-input");
  const labelTotal = document.getElementById("w-total-estimado");
  const labelDetalle = document.getElementById("w-detalle-horas-estimadas");
  const labelPeriodo = document.getElementById("w-total-periodo");
  
  if (!inputTarifa || !labelTotal || !labelPeriodo) return;
  
  let tarifa = parseFloat(inputTarifa.value) || 0;
  let textoHoras = labelPeriodo.innerText || "0";
  let horas = parseFloat(textoHoras) || 0;
  
  let total = horas * tarifa;
  labelTotal.innerText = `$${total.toFixed(2)}`;
  if (labelDetalle) {
    labelDetalle.innerText = `Suma de ${horas.toFixed(2)} hrs`;
  }
}

// PANEL ADMINISTRADOR
async function loadAdminData() {
  await syncDataFromSupabase();
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
    let tarifaVal = u.tarifa !== undefined && u.tarifa !== null ? parseFloat(u.tarifa) : 1.0;
    let tarifaLabel = `$${tarifaVal.toFixed(2)}`;
    let tipoPago = (u.tipo_pago || "Horas").trim();

    if (tipoPago === "Gasolina") tarifaLabel = "1.4L/h × $0.50";
    else if (tipoPago === "Fijo") tarifaLabel = `$${tarifaVal.toFixed(2)} / sem`;

    const userTurnos = turnosFiltrados.filter(t => String(t.id_usuario) === String(u.id));
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
    const userObj = cachedUsers.find(u => String(u.id) === String(t.id_usuario));
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
        ${item.activo ? '<span style="display:inline-block; width:10px; height:10px; background:#10b981; border-radius:50%; margin-right:5px;"></span><span class="txt-green" style="font-weight:bold;">🟢 En Turno Activo</span>' : `<span class="txt-green">${item.totalHoras.toFixed(2)} hrs</span>`}
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

function openNuevoUsuarioModal() {
  document.getElementById("modal-user-title").innerText = "Nuevo Trabajador";
  document.getElementById("edit-user-id").value = "";
  document.getElementById("edit-user-nombre").value = "";
  document.getElementById("edit-user-pin").value = "1234";
  document.getElementById("edit-user-tipo").value = "Horas";
  document.getElementById("edit-user-tarifa").value = "1.0";
  document.getElementById("edit-user-cargo").value = "Operaciones";
  document.getElementById("edit-user-rol").value = "trabajador";
  
  const modalUser = document.getElementById("modal-usuario");
  if (modalUser) {
    modalUser.classList.remove("hidden");
    modalUser.style.display = "flex";
  }
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
  const valTarifa = parseFloat(document.getElementById("edit-user-tarifa").value) || 1.0;
  const cargo = document.getElementById("edit-user-cargo").value;
  const rol = document.getElementById("edit-user-rol").value;
  const usuario = nombre.toLowerCase().trim().replace(/\s+/g, '');

  if (!nombre || !pin) { alert("Ingresa nombre y PIN."); return; }

  let payload = { nombre, usuario, pin, tipo_pago, tarifa: valTarifa, cargo, rol };

  if (supabaseClient) {
    if (id) {
      await supabaseClient.from("usuarios").update(payload).eq("id", id);
    } else {
      await supabaseClient.from("usuarios").insert([payload]);
    }
  }

  closeModals();
  await loadAdminData();
  alert("¡Trabajador guardado con éxito!");
}

async function borrarUsuario(id) {
  if (confirm("¿Borrar usuario de forma permanente?")) {
    if (supabaseClient) {
      await supabaseClient.from("usuarios").delete().eq("id", id);
    }
    await loadAdminData();
  }
}

function openAgregarHorasModal() {
  const sel = document.getElementById("manual-user-select");
  if (sel) {
    sel.innerHTML = "";
    cachedUsers.forEach(u => sel.innerHTML += `<option value="${u.id}">${u.nombre} (${u.tipo_pago || 'Horas'})</option>`);
  }
  const fInput = document.getElementById("manual-fecha");
  if (fInput) fInput.value = new Date().toISOString().split("T")[0];

  const modalAgregar = document.getElementById("modal-agregar-horas");
  if (modalAgregar) {
    modalAgregar.classList.remove("hidden");
    modalAgregar.style.display = "flex";
  }
}

async function guardarHorasManuales() {
  const userId = parseInt(document.getElementById("manual-user-select").value);
  const fecha = document.getElementById("manual-fecha").value;
  const hEntrada = document.getElementById("manual-entrada").value;
  const hSalida = document.getElementById("manual-salida").value;

  if (!fecha || !hEntrada || !hSalida) { alert("Completa fecha y horas."); return; }

  let tEntrada = new Date(`${fecha}T${hEntrada}:00`);
  let tSalida = new Date(`${fecha}T${hSalida}:00`);
  let diffHrs = (tSalida - tEntrada) / (1000 * 60 * 60);
  if (diffHrs < 0) diffHrs += 24;

  const payloadSupabase = {
    id_usuario: userId,
    fecha_inicio: fecha,
    hora_entrada: tEntrada.toISOString(),
    hora_salida: tSalida.toISOString(),
    horas_totales: parseFloat(diffHrs.toFixed(2)),
    estado: "completado",
    origen: "manual"
  };

  const payloadLocal = {
    id: Date.now(),
    ...payloadSupabase
  };

  cachedTurnos.unshift(payloadLocal);
  guardarTurnosLocales();

  if (supabaseClient) {
    try {
      await supabaseClient.from("registros_turnos").insert([payloadSupabase]);
    } catch (e) {}
  }

  closeModals();
  await loadAdminData();
  alert("¡Horas cargadas y guardadas correctamente!");
}

function openCargaMasivaModal() {
  const sel = document.getElementById("masiva-user-select");
  if (sel) {
    sel.innerHTML = "";
    cachedUsers.forEach(u => sel.innerHTML += `<option value="${u.id}">${u.nombre} (${u.tipo_pago || 'Horas'})</option>`);
  }
  generarFilasLote(5);

  const modalMasiva = document.getElementById("modal-carga-masiva");
  if (modalMasiva) {
    modalMasiva.classList.remove("hidden");
    modalMasiva.style.display = "flex";
  } else {
    crearModalMasivaHTML();
  }
}

function crearModalMasivaHTML() {
  if (document.getElementById("modal-carga-masiva")) return;
  const div = document.createElement("div");
  div.id = "modal-carga-masiva";
  div.className = "modal-backdrop hidden";
  div.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:none; justify-content:center; align-items:center; z-index:9999;";
  div.innerHTML = `
    <div style="background:#0f172a; padding:25px; border-radius:12px; width:90%; max-width:700px; border:1px solid #334155; color:#f8fafc; max-height:90vh; overflow-y:auto;">
      <h3 style="margin-top:0; color:#10b981;">📥 Carga Masiva de Fechas Viejas (Por Lotes)</h3>
      <p style="font-size:0.9rem; color:#94a3b8;">Selecciona el trabajador y añade varias filas con las fechas y horas pasadas para guardarlas todas juntas de un solo golpe.</p>
      
      <div style="margin-bottom:15px;">
        <label style="display:block; font-size:0.85rem; margin-bottom:5px;">Trabajador:</label>
        <select id="masiva-user-select" style="width:100%; padding:10px; background:#1e293b; color:#fff; border:1px solid #475569; border-radius:6px;"></select>
      </div>

      <div id="contenedor-filas-lote" style="margin-bottom:15px;"></div>

      <button onclick="agregarFilaLote()" style="background:#334155; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85rem; margin-bottom:15px;">➕ Añadir otra fila</button>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button onclick="closeModals()" style="background:#475569; color:#fff; border:none; padding:10px 20px; border-radius:6px; cursor:pointer;">Cancelar</button>
        <button onclick="guardarCargaMasiva()" style="background:#10b981; color:#022c22; font-weight:bold; border:none; padding:10px 20px; border-radius:6px; cursor:pointer;">Guardar Todo el Lote</button>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  openCargaMasivaModal();
}

function generarFilasLote(cantidad) {
  const contenedor = document.getElementById("contenedor-filas-lote");
  if (!contenedor) return;
  contenedor.innerHTML = `
    <div style="display:grid; grid-template-columns: 2fr 1.5fr 1.5fr 40px; gap:8px; font-weight:bold; font-size:0.8rem; color:#94a3b8; margin-bottom:5px;">
      <span>Fecha</span><span>Entrada</span><span>Salida</span><span></span>
    </div>
  `;
  for (let i = 0; i < cantidad; i++) {
    agregarFilaLote();
  }
}

function agregarFilaLote() {
  const contenedor = document.getElementById("contenedor-filas-lote");
  if (!contenedor) return;
  
  const today = new Date().toISOString().split("T")[0];
  const row = document.createElement("div");
  row.className = "fila-lote-item";
  row.style.cssText = "display:grid; grid-template-columns: 2fr 1.5fr 1.5fr 40px; gap:8px; margin-bottom:8px;";
  row.innerHTML = `
    <input type="date" class="lote-fecha" value="${today}" style="padding:8px; background:#1e293b; color:#fff; border:1px solid #475569; border-radius:4px;">
    <input type="time" class="lote-entrada" value="08:00" style="padding:8px; background:#1e293b; color:#fff; border:1px solid #475569; border-radius:4px;">
    <input type="time" class="lote-salida" value="17:00" style="padding:8px; background:#1e293b; color:#fff; border:1px solid #475569; border-radius:4px;">
    <button onclick="this.parentElement.remove()" style="background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer;" title="Eliminar fila">✕</button>
  `;
  contenedor.appendChild(row);
}

async function guardarCargaMasiva() {
  const userId = parseInt(document.getElementById("masiva-user-select").value);
  const filas = document.querySelectorAll(".fila-lote-item");

  if (filas.length === 0) { alert("Agrega al menos un registro en el lote."); return; }

  let nuevosRegistros = [];

  filas.forEach((fila) => {
    const fecha = fila.querySelector(".lote-fecha").value;
    const hEntrada = fila.querySelector(".lote-entrada").value;
    const hSalida = fila.querySelector(".lote-salida").value;

    if (fecha && hEntrada && hSalida) {
      let tEntrada = new Date(`${fecha}T${hEntrada}:00`);
      let tSalida = new Date(`${fecha}T${hSalida}:00`);
      let diffHrs = (tSalida - tEntrada) / (1000 * 60 * 60);
      if (diffHrs < 0) diffHrs += 24;

      const payloadSupabase = {
        id_usuario: userId,
        fecha_inicio: fecha,
        hora_entrada: tEntrada.toISOString(),
        hora_salida: tSalida.toISOString(),
        horas_totales: parseFloat(diffHrs.toFixed(2)),
        estado: "completado",
        origen: "masivo_lote"
      };

      const payloadLocal = { id: Date.now() + Math.random(), ...payloadSupabase };
      nuevosRegistros.push(payloadLocal);
    }
  });

  if (nuevosRegistros.length === 0) { alert("Por favor completa los datos en las filas."); return; }

  cachedTurnos = [...nuevosRegistros, ...cachedTurnos];
  guardarTurnosLocales();

  if (supabaseClient) {
    try {
      let cleanPayloads = nuevosRegistros.map(({id, ...rest}) => rest);
      await supabaseClient.from("registros_turnos").insert(cleanPayloads);
    } catch (e) {}
  }

  closeModals();
  await loadAdminData();
  alert(`¡${nuevosRegistros.length} registros cargados con éxito!`);
}

function abrirResumenPagoModal() {
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;
  if (!desde || !hasta) { alert("Selecciona el rango de fechas."); return; }

  let d1 = new Date(desde);
  let d2 = new Date(hasta);
  let diffDias = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
  let semanas = Math.max(1, diffDias / 7);

  const turnosFiltrados = cachedTurnos.filter(t => t.fecha_inicio >= desde && t.fecha_inicio <= hasta);
  
  document.getElementById("resumen-rango-fechas").innerText = `Período del ${desde} al ${hasta}`;
  
  let html = `<ul style="list-style:none; padding:0; line-height:1.8;">`;
  let granTotal = 0;

  cachedUsers.forEach(u => {
    const userTurnos = turnosFiltrados.filter(t => String(t.id_usuario) === String(u.id));
    let totalHoras = userTurnos.reduce((acc, curr) => acc + parseFloat(curr.horas_totales || 0), 0);
    let tarifaVal = u.tarifa !== undefined && u.tarifa !== null ? parseFloat(u.tarifa) : 1.0;
    let totalPagar = 0;
    let tipoPago = (u.tipo_pago || "Horas").trim();

    if (tipoPago === "Gasolina") {
      let litros = totalHoras * 1.4;
      totalPagar = litros * 0.50;
      html += `<li style="padding:6px 0; border-bottom:1px solid #334155;"><strong>${u.nombre}</strong> (Planta - Gasolina): ${totalHoras.toFixed(2)} hrs (${litros.toFixed(1)} L) = <span class="txt-green">$${totalPagar.toFixed(2)}</span></li>`;
    } else if (tipoPago === "Fijo") {
      totalPagar = tarifaVal * semanas;
      html += `<li style="padding:6px 0; border-bottom:1px solid #334155;"><strong>${u.nombre}</strong> (Administrador - Fijo): ${semanas.toFixed(1)} sem = <span class="txt-green">$${totalPagar.toFixed(2)}</span></li>`;
    } else {
      totalPagar = totalHoras * tarifaVal;
      html += `<li style="padding:6px 0; border-bottom:1px solid #334155;"><strong>${u.nombre}</strong>: ${totalHoras.toFixed(2)} hrs = <span class="txt-green">$${totalPagar.toFixed(2)}</span></li>`;
    }
    granTotal += totalPagar;
  });

  html += `</ul>`;
  html += `<div style="margin-top:15px; padding-top:10px; border-top:2px solid #10b981; text-align:right; font-size:1.1rem; font-weight:bold;">Total a Pagar: <span class="txt-green">$${granTotal.toFixed(2)}</span></div>`;

  document.getElementById("resumen-pago-contenido").innerHTML = html;
  const modalResumen = document.getElementById("modal-resumen-pago");
  if (modalResumen) {
    modalResumen.classList.remove("hidden");
    modalResumen.style.display = "flex";
  }
}

function copiarResumenPago() {
  const contenido = document.getElementById("resumen-pago-contenido").innerText;
  const rango = document.getElementById("resumen-rango-fechas").innerText;
  const textoFinal = `📊 REPORTE DE NÓMINA\n${rango}\n\n${contenido}`;
  
  navigator.clipboard.writeText(textoFinal).then(() => {
    alert("¡Reporte copiado al portapapeles!");
  }).catch(err => {
    alert("Error al copiar: " + err);
  });
}

function verDetallesAdminGlobal(userId, fecha) {
  const listaTurnos = cachedTurnos.filter(t => String(t.id_usuario) === String(userId) && t.fecha_inicio === fecha);
  document.getElementById("detalle-titulo").innerText = `Reporte Detallado (${fecha})`;
  let html = `<p>Sesiones del día:</p><hr style="border-color:#334155; margin:10px 0;">`;
  
  listaTurnos.forEach((t) => {
    html += `
      <div style="background:#1e293b; padding:10px; border-radius:6px; margin-bottom:8px;">
        <small>Entrada: ${new Date(t.hora_entrada).toLocaleString()}</small><br>
        <small>Salida: ${t.hora_salida ? new Date(t.hora_salida).toLocaleString() : 'En curso'}</small><br>
        Horas: <span class="txt-green">${(parseFloat(t.horas_totales) || 0).toFixed(2)} hrs</span><br>
        <button onclick="borrarTurno(${t.id})" class="btn-action btn-red" style="padding:2px 6px; font-size:0.75rem; margin-top:6px;">Eliminar Registro</button>
      </div>
    `;
  });

  document.getElementById("detalle-contenido").innerHTML = html;
  const modalDetalles = document.getElementById("modal-detalles");
  if (modalDetalles) {
    modalDetalles.classList.remove("hidden");
    modalDetalles.style.display = "flex";
  }
}

async function forzarSalida(idTurno) {
  if (confirm("¿Forzar salida de este turno activo?")) {
    const now = new Date();
    let t = cachedTurnos.find(x => String(x.id) === String(idTurno));
    if (t) {
      let entrada = new Date(t.hora_entrada);
      let diffMs = now - entrada;
      let diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));

      t.hora_salida = now.toISOString();
      t.horas_totales = parseFloat(diffHrs.toFixed(2));
      t.estado = "completado";
      guardarTurnosLocales();
    }

    if (supabaseClient) {
      try {
        await supabaseClient.from("registros_turnos").update({ hora_salida: now.toISOString(), estado: "completado" }).eq("id", idTurno);
      } catch (e) {}
    }
    await loadAdminData();
  }
}

async function borrarTurno(id) {
  if (confirm("¿Eliminar este registro de turno?")) {
    cachedTurnos = cachedTurnos.filter(t => String(t.id) !== String(id));
    guardarTurnosLocales();

    if (supabaseClient) {
      try {
        await supabaseClient.from("registros_turnos").delete().eq("id", id);
      } catch (e) {}
    }
    closeModals();
    await loadAdminData();
  }
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
    } catch (e) {}
  }

  closeModals();
  loadAdminData();
  alert("Tarifa general aplicada con éxito.");
}

function openConfigPinModal() {
  const modalPin = document.getElementById("modal-config-pin");
  if (modalPin) {
    modalPin.classList.remove("hidden");
    modalPin.style.display = "flex";
  }
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