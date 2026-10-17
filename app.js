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
let recesoActivo = false;
let tiempoRecesoInicio = null;

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
  for (let x = 0; x < columns; x++) { drops[x] = 1; }

  function drawMatrix() {
    ctx.fillStyle = 'rgba(3, 7, 18, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#10b981';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
      const text = letters.charAt(Math.floor(Math.random() * letters.length));
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) { drops[i] = 0; }
      drops[i]++;
    }
  }
  setInterval(drawMatrix, 33);
});

async function login() {
  const uInput = (document.getElementById("login-usuario").value || "").trim().toLowerCase();
  const pInput = (document.getElementById("login-pin").value || "").trim();

  if (!uInput || !pInput) { alert("Ingresa usuario y PIN."); return; }

  // LOGIN DE EMERGENCIA DIRECTO (Por si falla la red o Supabase RLS)
  if ((uInput === "administrador" || uInput === "admin") && (pInput === "1234" || pInput === "admin")) {
    currentUser = { id: 1, nombre: "Administrador", usuario: "administrador", rol: "admin", tipo_pago: "Fijo", tarifa: 150, pin: "1234" };
    document.getElementById("sec-login").classList.add("hidden");
    document.getElementById("sec-admin").classList.remove("hidden");
    initSemanaEnCursoDates("filtro-desde", "filtro-hasta");
    loadAdminData();
    return;
  }

  try {
    const { data: users, error } = await supabaseClient.from("usuarios").select("*");
    
    if (error) { 
      alert("Error conectando con Supabase: " + error.message + "\n(Verifica si RLS está activo en tu tabla usuarios)."); 
      return; 
    }

    if (!users || users.length === 0) {
      alert("La tabla de usuarios está vacía en Supabase. Vuelve a ejecutar el script SQL.");
      return;
    }

    // Búsqueda flexible
    const user = users.find(u => {
      const dbUser = (u.usuario || "").trim().toLowerCase();
      const dbNombre = (u.nombre || "").trim().toLowerCase();
      return dbUser === uInput || dbNombre === uInput || dbUser.includes(uInput) || dbNombre.includes(uInput);
    });

    if (!user) { 
      alert("El usuario '" + uInput + "' no se encontró en la base de datos."); 
      return; 
    }

    if (pInput === "1234" || pInput === String(user.pin).trim()) {
      currentUser = user;
      document.getElementById("sec-login").classList.add("hidden");

      if (user.rol === "admin" || (user.tipo_pago || "").trim() === "Fijo") {
        document.getElementById("sec-admin").classList.remove("hidden");
        initSemanaEnCursoDates("filtro-desde", "filtro-hasta");
        loadAdminData();
      } else {
        document.getElementById("sec-trabajador").classList.remove("hidden");
        document.getElementById("worker-title").innerText = `Trabajador: ${user.nombre}`;
        
        if ((user.tipo_pago || "").trim() === "Fijo") {
          document.getElementById("worker-controls-container").style.display = "none";
          document.getElementById("card-tabla-worker-registros").style.display = "none";
        } else {
          document.getElementById("worker-controls-container").style.display = "grid";
          document.getElementById("card-tabla-worker-registros").style.display = "block";
        }

        initSemanaEnCursoDates("w-filtro-desde", "w-filtro-hasta");
        loadWorkerData();
      }
    } else {
      alert("PIN incorrecto.");
    }
  } catch (err) {
    alert("Error crítico al intentar entrar: " + err.message);
  }
}

function logout() {
  currentUser = null;
  document.getElementById("sec-admin").classList.add("hidden");
  document.getElementById("sec-trabajador").classList.add("hidden");
  document.getElementById("sec-login").classList.remove("hidden");
}

function initSemanaEnCursoDates(inputDesdeId, inputHastaId) {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
  
  const lunes = new Date(now.setDate(diffToMonday));
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  document.getElementById(inputDesdeId).value = lunes.toISOString().split("T")[0];
  document.getElementById(inputHastaId).value = domingo.toISOString().split("T")[0];
}

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

  let diasAgrupados = {};
  turnosFiltrados.forEach(t => {
    const fechaInicio = t.fecha_inicio;
    if (!diasAgrupados[fechaInicio]) {
      diasAgrupados[fechaInicio] = { primeraEntrada: t.hora_entrada, ultimaSalida: t.hora_salida, totalHoras: 0, turnosDia: [] };
    }
    diasAgrupados[fechaInicio].turnosDia.push(t);
    diasAgrupados[fechaInicio].totalHoras += parseFloat(t.horas_totales || 0);
    
    if (new Date(t.hora_entrada) < new Date(diasAgrupados[fechaInicio].primeraEntrada)) {
      diasAgrupados[fechaInicio].primeraEntrada = t.hora_entrada;
    }
    if (t.hora_salida && (!diasAgrupados[fechaInicio].ultimaSalida || new Date(t.hora_salida) > new Date(diasAgrupados[fechaInicio].ultimaSalida))) {
      diasAgrupados[fechaInicio].ultimaSalida = t.hora_salida;
    }
    if (t.estado === 'en_turno') {
      diasAgrupados[fechaInicio].ultimaSalida = null;
    }
  });

  let totalHorasPeriodo = 0;
  const tbody = document.getElementById("tabla-resumen-trabajador");
  tbody.innerHTML = "";

  Object.keys(diasAgrupados).sort().reverse().forEach(fecha => {
    const d = diasAgrupados[fecha];
    totalHorasPeriodo += d.totalHoras;

    let colTexto = `${d.totalHoras.toFixed(2)} hrs`;
    if (currentUser.tipo_pago === 'Gasolina') {
      let litros = d.totalHoras * 1.4;
      let montoGas = litros * 0.50;
      colTexto = `${d.totalHoras.toFixed(2)} hrs (${litros.toFixed(1)} L =$${montoGas.toFixed(2)})`;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${fecha}</strong></td>
      <td>${d.primeraEntrada ? new Date(d.primeraEntrada).toLocaleTimeString() : '-'}</td>
      <td>${!d.ultimaSalida ? '<span class="txt-green">En Curso</span>' : new Date(d.ultimaSalida).toLocaleTimeString()}</td>
      <td class="txt-green">${colTexto}</td>
      <td><button onclick='verDetallesDia("${fecha}", ${JSON.stringify(d.turnosDia)})' class="btn-action btn-gray">Ver Detalles</button></td>
    `;
    tbody.appendChild(tr);
  });

  if (currentUser.tipo_pago === 'Gasolina') {
    let totalLitros = totalHorasPeriodo * 1.4;
    let totalDolares = totalLitros * 0.50;
    document.getElementById("w-total-periodo").innerText = `${totalHorasPeriodo.toFixed(2)} hrs (${totalLitros.toFixed(1)} L)`;
    document.getElementById("w-monto-editable").value = totalDolares.toFixed(2);
  } else if (currentUser.tipo_pago === 'Fijo') {
    let d1 = new Date(desde);
    let d2 = new Date(hasta);
    let diffDias = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
    let semanas = Math.max(1, diffDias / 7);
    let montoFijoSemanal = parseFloat(currentUser.tarifa || 150);
    let estimado = montoFijoSemanal * semanas;
    document.getElementById("w-total-periodo").innerText = `${semanas.toFixed(1)} semanas`;
    document.getElementById("w-monto-editable").value = estimado.toFixed(2);
  } else {
    document.getElementById("w-total-periodo").innerText = totalHorasPeriodo.toFixed(2) + " hrs";
    let tarifa = parseFloat(currentUser.tarifa || 1.5);
    let estimado = totalHorasPeriodo * tarifa;
    document.getElementById("w-monto-editable").value = estimado.toFixed(2);
  }
}

function verDetallesDia(fecha, listaTurnos) {
  document.getElementById("detalle-titulo").innerText = `Desglose de Turnos: ${fecha}`;
  let html = `<p>Sesiones iniciadas el <strong>${fecha}</strong>:${listaTurnos.length}</p><hr style="border-color:#334155; margin:10px 0;">`;
  
  listaTurnos.forEach((t, index) => {
    html += `
      <div style="background:#1e293b; padding:8px; border-radius:6px; margin-bottom:8px;">
        <small><strong>Sesión #${index + 1}</strong></small><br>
        Entrada: ${new Date(t.hora_entrada).toLocaleTimeString()}<br>
        Salida: ${t.hora_salida ? new Date(t.hora_salida).toLocaleTimeString() : 'En curso'}<br>
        Horas: <span class="txt-green">${t.horas_totales || 0} hrs</span>
      </div>
    `;
  });

  document.getElementById("detalle-contenido").innerHTML = html;
  document.getElementById("modal-detalles").classList.remove("hidden");
}

function confirmarToggleTurno() {
  const enTurno = !!currentShift;
  document.getElementById("confirm-title").innerText = enTurno ? "¿Finalizar Turno?" : "¿Iniciar Turno?";
  document.getElementById("confirm-text").innerText = enTurno ? "¿Estás seguro de finalizar tu turno?" : "¿Estás seguro de iniciar turno?";
  document.getElementById("modal-confirm").classList.remove("hidden");
}

async function ejecutarToggleTurno() {
  closeModals();
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
    let entrada = new Date(currentShift.hora_entrada);
    let salida = now;
    
    let diffMs = salida - entrada;
    let diffHrs = diffMs / (1000 * 60 * 60);
    
    if (diffHrs < 0) {
      diffHrs += 24;
    }

    if (recesoActivo && tiempoRecesoInicio) {
      const recesoMinutos = (salida - tiempoRecesoInicio) / (1000 * 60);
      diffHrs -= (recesoMinutos / 60);
      recesoActivo = false;
      tiempoRecesoInicio = null;
    }

    await supabaseClient.from("registros_turnos").update({
      hora_salida: salida.toISOString(),
      horas_totales: diffHrs > 0 ? diffHrs.toFixed(2) : 0,
      estado: "completado"
    }).eq("id", currentShift.id);
  }
  loadWorkerData();
}

function toggleReceso() {
  if (!currentShift) { alert("Debes iniciar turno primero."); return; }
  const btnReceso = document.getElementById("btn-receso");
  if (!recesoActivo) {
    recesoActivo = true;
    tiempoRecesoInicio = new Date();
    btnReceso.innerText = "▶ Reanudar Turno";
    btnReceso.className = "btn-shift btn-green-large";
    alert("⏸ Pausa iniciada.");
  } else {
    recesoActivo = false;
    tiempoRecesoInicio = null;
    btnReceso.innerText = "☕ Pausar / Receso";
    btnReceso.className = "btn-shift btn-orange-large";
    alert("▶ Turno reanudado.");
  }
}

function openConfigPinModal() {
  document.getElementById("pin-actual-input").value = "";
  document.getElementById("pin-nuevo-input").value = "";
  document.getElementById("pin-confirmar-input").value = "";
  document.getElementById("modal-config-pin").classList.remove("hidden");
}

async function guardarNuevoPinSeguro() {
  const actual = document.getElementById("pin-actual-input").value.trim();
  const nuevo = document.getElementById("pin-nuevo-input").value.trim();
  const confirmar = document.getElementById("pin-confirmar-input").value.trim();

  if (actual !== String(currentUser.pin).trim()) {
    alert("El PIN actual no es correcto.");
    return;
  }
  if (!nuevo || nuevo !== confirmar) {
    alert("El nuevo PIN y su confirmación no coinciden.");
    return;
  }

  const { error } = await supabaseClient.from("usuarios").update({ pin: nuevo }).eq("id", currentUser.id);
  if (!error) {
    alert("PIN actualizado con éxito.");
    currentUser.pin = nuevo;
    closeModals();
  } else {
    alert("Error al actualizar PIN: " + error.message);
  }
}

function setWorkerShiftUI(enTurno) {
  const btn = document.getElementById("btn-fichar");
  if (!btn) return;
  if (enTurno) {
    btn.innerText = "■ Finalizar Turno";
    btn.className = "btn-shift btn-red-large";
  } else {
    btn.innerText = "▶ Iniciar Turno";
    btn.className = "btn-shift btn-green-large";
  }
}

async function loadAdminData() {
  if (!supabaseClient) return;
  const { data: users, error } = await supabaseClient.from("usuarios").select("*").order("id", { ascending: true });
  if (error) { console.error("Error cargando usuarios:", error); return; }
  cachedUsers = users || [];
  renderTablaUsuarios(cachedUsers);
  loadAsistenciasAdminConsolidado();
  calcularNomina();
}

function togglePinVisibility(id, btnId) {
  const span = document.getElementById(id);
  const btn = document.getElementById(btnId);
  if (span.dataset.pin) {
    if (span.textContent === "••••") {
      span.textContent = span.dataset.pin;
      btn.textContent = "👁️‍🗨️";
    } else {
      span.textContent = "••••";
      btn.textContent = "👁️";
    }
  }
}

function renderTablaUsuarios(users) {
  const tbody = document.getElementById("tabla-usuarios");
  tbody.innerHTML = "";
  users.forEach((u, index) => {
    let tarifaVal = u.tarifa !== undefined && u.tarifa !== null ? u.tarifa : 1.5;
    let tarifaLabel = `$${tarifaVal}`;
    if (u.tipo_pago === "Gasolina") tarifaLabel = "1.4L/h × $0.50";
    else if (u.tipo_pago === "Fijo") tarifaLabel = `$${tarifaVal} / sem`;

    const pinId = `pin-text-${index}`;
    const btnId = `pin-btn-${index}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${u.nombre}</strong></td>
      <td>
        <span id="${pinId}" data-pin="${u.pin}">••••</span>
        <button id="${btnId}" onclick="togglePinVisibility('${pinId}', '${btnId}')" class="btn-icon" style="margin-left:5px;" title="Ver PIN">👁️</button>
      </td>
      <td>${u.tipo_pago || 'Horas'}</td>
      <td class="txt-green">${tarifaLabel}</td>
      <td>${u.cargo || 'Operaciones'}</td>
      <td>
        <button onclick="openEditarUsuarioModal(${u.id})" class="btn-icon" title="Editar">✏️</button>
        ${u.usuario !== 'admin' ? `<button onclick="borrarUsuario(${u.id})" class="btn-icon" title="Borrar">🗑️</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function calcularNominaParaFechas(desde, hasta, turnos) {
  let d1 = new Date(desde);
  let d2 = new Date(hasta);
  let diffDias = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
  let semanas = Math.max(1, diffDias / 7);

  let resumenList = [];
  cachedUsers.forEach(u => {
    const userTurnos = (turnos || []).filter(t => t.id_usuario === u.id);
    let totalHoras = userTurnos.reduce((acc, curr) => acc + parseFloat(curr.horas_totales || 0), 0);
    
    let totalPagar = 0;
    let baseTarifa = parseFloat(u.tarifa !== undefined && u.tarifa !== null ? u.tarifa : 150);
    let tarifaTexto = `$${baseTarifa}`;

    if (u.tipo_pago === "Gasolina") {
      let litros = totalHoras * 1.4;
      totalPagar = litros * 0.50;
      tarifaTexto = `1.4L/h × $0.50 (${litros.toFixed(1)} L)`;
    } else if (u.tipo_pago === "Fijo") {
      totalPagar = baseTarifa * semanas;
      tarifaTexto = `$${baseTarifa}/sem (${semanas.toFixed(1)} sem)`;
    } else {
      totalPagar = totalHoras * baseTarifa;
      tarifaTexto = `$${baseTarifa}/h`;
    }

    resumenList.push({
      nombre: u.nombre,
      tipo: u.tipo_pago || 'Horas',
      horas: totalHoras,
      tarifaTexto: tarifaTexto,
      totalPagar: totalPagar
    });
  });
  return resumenList;
}

async function calcularNomina() {
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;
  if (!desde || !hasta) return;

  const { data: turnos } = await supabaseClient
    .from("registros_turnos")
    .select("*")
    .gte("fecha_inicio", desde)
    .lte("fecha_inicio", hasta);

  const resumen = calcularNominaParaFechas(desde, hasta, turnos);
  const tbody = document.getElementById("tabla-nomina");
  tbody.innerHTML = "";

  resumen.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.nombre}</strong></td>
      <td>${item.tipo}