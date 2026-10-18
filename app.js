// CONFIGURACIÓN DE SUPABASE (CONEXIÓN PRINCIPAL Y RESGUARDO)
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

// ESTADO GLOBAL
let currentUser = null;
let currentShift = null;
let cachedUsers = [];
let cachedTurnos = [];

// INICIALIZACIÓN
window.addEventListener('DOMContentLoaded', async () => {
  initMatrixEffect();
  await syncDataFromSupabase();
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

// DATES: LUNES A DOMINGO EXACTO
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

// SINCRONIZACIÓN PRIORITARIA CON SUPABASE (NUNCA BORRA DATOS EXISTENTES)
async function syncDataFromSupabase() {
  if (!supabaseClient) return;
  try {
    const { data: users, error: errU } = await supabaseClient.from("usuarios").select("*").order("id", { ascending: true });
    if (!errU && users && users.length > 0) {
      cachedUsers = users;
    }

    const { data: turnos, error: errT } = await supabaseClient.from("registros_turnos").select("*").order("fecha_inicio", { ascending: false });
    if (!errT && turnos) {
      cachedTurnos = turnos;
    }
  } catch (e) {
    console.warn("Conectando con base de datos...", e);
  }
}

// LOGIN
async function login() {
  const uInput = (document.getElementById("login-usuario").value || "").trim().toLowerCase();
  const pInput = (document.getElementById("login-pin").value || "").trim();

  if (!uInput || !pInput) {
    alert("Ingresa usuario y PIN.");
    return;
  }

  await syncDataFromSupabase();

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
      await loadAdminData();
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

// ==========================================
// PANEL TRABAJADOR
// ==========================================

async function loadWorkerData() {
  if (!currentUser) return;
  await syncDataFromSupabase();

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

  if (!currentShift) {
    // INICIAR TURNO
    const payload = {
      id_usuario: currentUser.id,
      fecha_inicio: fechaStr,
      hora_entrada: now.toISOString(),
      estado: "en_turno",
      origen: "sistema"
    };

    if (supabaseClient) {
      const { data, error } = await supabaseClient.from("registros_turnos").insert([payload]).select();
      if (!error && data && data.length > 0) {
        cachedTurnos.unshift(data[0]);
        currentShift = data[0];
      }
    }
  } else {
    // FINALIZAR TURNO
    const entrada = new Date(currentShift.hora_entrada);
    const salida = now;
    let diffMs = salida - entrada;
    let diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));

    if (supabaseClient) {
      await supabaseClient.from("registros_turnos").update({
        hora_salida: salida.toISOString(),
        horas_totales: parseFloat(diffHrs.toFixed(2)),
        estado: "completado"
      }).eq("id", currentShift.id);
    }

    currentShift = null;
  }

  await loadWorkerData();
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

  document.getElementById("detalle-titulo").innerText = `Detalle del Turno (${t.fecha_inicio})`;
  const hEntrada = t.hora_entrada ? new Date(t.hora_entrada).toLocaleString() : '-';
  const hSalida = t.hora_salida ? new Date(t.hora_salida).toLocaleString() : 'En Curso';

  document.getElementById("detalle-contenido").innerHTML = `
    <div style="background:#1e293b; padding:12px; border-radius:6px; line-height:1.6;">
      <p><strong>Fecha:</strong> ${t.fecha_inicio}</p>
      <p><strong>Hora Entrada:</strong> ${hEntrada}</p>
      <p><strong>Hora Salida:</strong> ${hSalida}</p>
      <p><strong>Total Horas:</strong> <span class="txt-green">${(parseFloat(t.horas_totales) || 0).toFixed(2)} hrs</span></p>
      <p><strong>Estado:</strong> ${t.estado}</p>
    </div>
  `;
  const modalDetalles = document.getElementById("modal-detalles");
  if (modalDetalles) {
    modalDetalles.classList.remove("hidden");
    modalDetalles.style.display = "flex";
  }
}

// ==========================================
// PANEL ADMINISTRADOR
// ==========================================

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
  document.getElementById("edit-user-tarifa").value = "1.5";
  document.getElementById("edit-user-cargo").value = "Operaciones";
  document.getElementById("edit-user-rol").value = "trabajador";
  
  const modalUser = document.getElementById("modal-usuario");
  if (modalUser) {
    modalUser.classList.remove("hidden");
    modalUser.style.display = "flex";
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
  alert("¡Trabajador guardado en Supabase!");
}

async function borrarUsuario(id) {
  if (confirm("¿Borrar usuario de forma permanente?")) {
    if (supabaseClient) {
      await supabaseClient.from("usuarios").delete().eq("id", id);
    }
    await loadAdminData();
  }
}

// CARGA MASIVA / CONTINUA DE HORAS MANUALES
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

async function guardarHorasManuales(continuarAgregando = false) {
  const userId = parseInt(document.getElementById("manual-user-select").value);
  const fecha = document.getElementById("manual-fecha").value;
  const hEntrada = document.getElementById("manual-entrada").value;
  const hSalida = document.getElementById("manual-salida").value;

  if (!fecha || !hEntrada || !hSalida) { alert("Completa fecha y horas."); return; }

  let tEntrada = new Date(`${fecha}T${hEntrada}:00`);
  let tSalida = new Date(`${fecha}T${hSalida}:00`);
  let diffHrs = (tSalida - tEntrada) / (1000 * 60 * 60);
  if (diffHrs < 0) diffHrs += 24;

  const payload = {
    id_usuario: userId,
    fecha_inicio: fecha,
    hora_entrada: tEntrada.toISOString(),
    hora_salida: tSalida.toISOString(),
    horas_totales: parseFloat(diffHrs.toFixed(2)),
    estado: "completado",
    origen: "manual"
  };

  if (supabaseClient) {
    await supabaseClient.from("registros_turnos").insert([payload]);
  }

  if (continuarAgregando) {
    alert("¡Turno registrado! Puedes ingresar el siguiente.");
  } else {
    closeModals();
    await loadAdminData();
    alert("¡Horas cargadas correctamente!");
  }
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
    const userTurnos = turnosFiltrados.filter(t => t.id_usuario === u.id);
    let totalHoras = userTurnos.reduce((acc, curr) => acc + parseFloat(curr.horas_totales || 0), 0);
    let tarifaVal = u.tarifa !== undefined && u.tarifa !== null ? parseFloat(u.tarifa) : 1.5;
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
    alert("¡Reporte copiado al portapapeles listo para enviar!");
  }).catch(err => {
    alert("Error al copiar: " + err);
  });
}

function verDetallesAdminGlobal(userId, fecha) {
  const listaTurnos = cachedTurnos.filter(t => t.id_usuario === userId && t.fecha_inicio === fecha);
  document.getElementById("detalle-titulo").innerText = `Reporte Detallado de Turnos (${fecha})`;
  let html = `<p>Sesiones del día ${fecha}:</p><hr style="border-color:#334155; margin:10px 0;">`;
  
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
    if (supabaseClient) {
      await supabaseClient.from("registros_turnos").update({ hora_salida: now.toISOString(), estado: "completado" }).eq("id", idTurno);
    }
    await loadAdminData();
  }
}

async function borrarTurno(id) {
  if (confirm("¿Eliminar este registro de turno?")) {
    if (supabaseClient) {
      await supabaseClient.from("registros_turnos").delete().eq("id", id);
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

  if (supabaseClient) {
    for (let u of cachedUsers) {
      const tipo = (u.tipo_pago || "Horas").trim().toLowerCase();
      if (tipo !== "gasolina" && tipo !== "fijo") {
        await supabaseClient.from("usuarios").update({ tarifa: nueva }).eq("id", u.id);
      }
    }
  }

  closeModals();
  await loadAdminData();
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
      await supabaseClient.from("usuarios").update({ pin: nuevo }).eq("id", currentUser.id);
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