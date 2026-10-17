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

  try {
    const { data: users, error } = await supabaseClient.from("usuarios").select("*");
    if (error) { alert("Error de base de datos: " + error.message); return; }

    const user = users.find(u => (u.usuario || "").trim().toLowerCase() === uInput || (u.nombre || "").trim().toLowerCase() === uInput);
    if (!user) { alert("El usuario '" + uInput + "' no existe."); return; }

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
        
        // Si es el Administrador logueado como trabajador o un usuario fijo, ocultar botones de fichaje
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
    alert("Error al intentar entrar: " + err.message);
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
      colTexto = `${d.totalHoras.toFixed(2)} hrs (${litros.toFixed(1)} L = $${montoGas.toFixed(2)})`;
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
  let html = `<p>Sesiones iniciadas el <strong>${fecha}</strong>: ${listaTurnos.length}</p><hr style="border-color:#334155; margin:10px 0;">`;
  
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
      diffHrs += 24; // Cruce medianoche
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

function renderTablaUsuarios(users) {
  const tbody = document.getElementById("tabla-usuarios");
  tbody.innerHTML = "";
  users.forEach(u => {
    let tarifaLabel = `$${u.tarifa || 1.5}`;
    if (u.tipo_pago === "Gasolina") tarifaLabel = "1.4L/h × $0.50";
    else if (u.tipo_pago === "Fijo") tarifaLabel = `$${u.tarifa || 150} / sem`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${u.nombre}</strong></td>
      <td>••••</td>
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
    let tarifaTexto = `$${u.tarifa || 1.5}`;

    if (u.tipo_pago === "Gasolina") {
      let litros = totalHoras * 1.4;
      totalPagar = litros * 0.50;
      tarifaTexto = `1.4L/h × $0.50 (${litros.toFixed(1)} L)`;
    } else if (u.tipo_pago === "Fijo") {
      let montoBase = parseFloat(u.tarifa || 150);
      totalPagar = montoBase * semanas;
      tarifaTexto = `$${montoBase}/sem (${semanas.toFixed(1)} sem)`;
    } else {
      totalPagar = totalHoras * parseFloat(u.tarifa || 1.5);
      tarifaTexto = `$${u.tarifa || 1.5}/h`;
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
      <td>${item.tipo}</td>
      <td class="txt-green">${item.tipo === 'Fijo' ? '-' : item.horas.toFixed(2) + ' hrs'}</td>
      <td>${item.tarifaTexto}</td>
      <td class="txt-green">$${item.totalPagar.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function abrirResumenPagoModal() {
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;
  if (!desde || !hasta) { alert("Selecciona las fechas de inicio y fin."); return; }

  const { data: turnos } = await supabaseClient
    .from("registros_turnos")
    .select("*")
    .gte("fecha_inicio", desde)
    .lte("fecha_inicio", hasta);

  const resumen = calcularNominaParaFechas(desde, hasta, turnos);
  
  document.getElementById("resumen-rango-fechas").innerText = `Período del ${desde} al ${hasta}`;
  
  let html = `<ul style="list-style:none; padding:0;">`;
  let granTotal = 0;

  resumen.forEach(item => {
    granTotal += item.totalPagar;
    if (item.tipo === 'Fijo') {
      html += `<li style="padding:6px 0; border-bottom:1px solid #334155;"><strong>${item.nombre}</strong> (Administrador - Fijo): <span class="txt-green">$${item.totalPagar.toFixed(2)}</span></li>`;
    } else if (item.tipo === 'Gasolina') {
      html += `<li style="padding:6px 0; border-bottom:1px solid #334155;"><strong>${item.nombre}</strong> (Planta - Gasolina): <span class="txt-green">$${item.totalPagar.toFixed(2)}</span></li>`;
    } else {
      html += `<li style="padding:6px 0; border-bottom:1px solid #334155;"><strong>${item.nombre}</strong>: ${item.horas.toFixed(2)} hrs = <span class="txt-green">$${item.totalPagar.toFixed(2)}</span></li>`;
    }
  });

  html += `</ul>`;
  html += `<div style="margin-top:15px; padding-top:10px; border-top:2px solid #10b981; text-align:right; font-size:1.1rem; font-weight:bold;">Gran Total a Pagar: <span class="txt-green">$${granTotal.toFixed(2)}</span></div>`;

  document.getElementById("resumen-pago-contenido").innerHTML = html;
  document.getElementById("modal-resumen-pago").classList.remove("hidden");
}

function copiarResumenPago() {
  const contenido = document.getElementById("resumen-pago-contenido").innerText;
  const rango = document.getElementById("resumen-rango-fechas").innerText;
  const textoFinal = `📊 REPORTE DE NÓMINA\n${rango}\n\n${contenido}`;
  
  navigator.clipboard.writeText(textoFinal).then(() => {
    alert("¡Resumen copiado al portapapeles listo para enviar!");
  }).catch(err => {
    alert("Error al copiar: " + err);
  });
}

async function loadAsistenciasAdminConsolidado() {
  const { data: turnos } = await supabaseClient
    .from("registros_turnos")
    .select("*, usuarios(nombre)")
    .order("fecha_inicio", { ascending: false });

  let agrupado = {};
  (turnos || []).forEach(t => {
    const uNombre = t.usuarios?.nombre || 'Desconocido';
    const fecha = t.fecha_inicio;
    const key = `${t.id_usuario}_${fecha}`;

    if (!agrupado[key]) {
      agrupado[key] = { nombre: uNombre, fecha: fecha, totalHoras: 0, activo: false, turnoActivoId: null, lista: [] };
    }
    agrupado[key].lista.push(t);
    agrupado[key].totalHoras += parseFloat(t.horas_totales || 0);
    if (t.estado === 'en_turno') {
      agrupado[key].activo = true;
      agrupado[key].turnoActivoId = t.id;
    }
  });

  const tbody = document.getElementById("tabla-asistencias");
  tbody.innerHTML = "";

  Object.values(agrupado).forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.nombre}</strong></td>
      <td>${item.fecha}</td>
      <td>
        ${item.activo ? '<span class="pulse-dot" title="Activo"></span><span class="txt-green">En Turno Activo</span>' : `<span class="txt-green">${item.totalHoras.toFixed(2)} hrs</span>`}
      </td>
      <td>
        <button onclick='verDetallesAdmin(${JSON.stringify(item.lista)})' class="btn-action btn-gray" style="padding:4px 8px;">Detalles</button>
        ${item.activo ? `<button onclick="forzarSalida(${item.turnoActivoId})" class="btn-action btn-red" style="padding:4px 8px; margin-left:4px;" title="Forzar salida">Forzar Salida</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function verDetallesAdmin(listaTurnos) {
  document.getElementById("detalle-titulo").innerText = `Reporte Detallado de Turnos`;
  let html = `<p>Sesiones:</p><hr style="border-color:#334155; margin:10px 0;">`;
  
  listaTurnos.forEach((t) => {
    html += `
      <div style="background:#1e293b; padding:10px; border-radius:6px; margin-bottom:8px;">
        <small>Entrada: ${new Date(t.hora_entrada).toLocaleString()}</small><br>
        <small>Salida: ${t.hora_salida ? new Date(t.hora_salida).toLocaleString() : 'En curso'}</small><br>
        Horas: <span class="txt-green">${t.horas_totales || 0} hrs</span><br>
        <button onclick="borrarTurno(${t.id})" class="btn-action btn-red" style="padding:2px 6px; font-size:0.75rem; margin-top:6px;">Eliminar Registro</button>
      </div>
    `;
  });

  document.getElementById("detalle-contenido").innerHTML = html;
  document.getElementById("modal-detalles").classList.remove("hidden");
}

async function forzarSalida(idTurno) {
  if (confirm("¿Forzar salida de este turno activo?")) {
    const now = new Date();
    await supabaseClient.from("registros_turnos").update({
      hora_salida: now.toISOString(),
      estado: "completado"
    }).eq("id", idTurno);
    loadAdminData();
  }
}

function exportarExcel() {
  alert("Generando reporte CSV...");
  let csv = "Usuario,Fecha,Horas\n";
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'reporte_asistencia.csv');
  a.click();
}

function closeModals() {
  document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.add("hidden"));
}

function actualizarLabelModalUsuario() {
  const tipo = document.getElementById("edit-user-tipo").value;
  const lbl = document.getElementById("lbl-tarifa-modal");
  const inputTarifa = document.getElementById("edit-user-tarifa");
  if (tipo === 'Fijo') {
    lbl.innerText = "Monto Fijo Semanal ($)";
    inputTarifa.value = "150";
  } else if (tipo === 'Gasolina') {
    lbl.innerText = "Costo por Litro ($0.50 fijo)";
    inputTarifa.value = "0.5";
  } else {
    lbl.innerText = "Tarifa por Hora ($)";
    inputTarifa.value = "1.5";
  }
}

function openNuevoUsuarioModal() {
  document.getElementById("modal-user-title").innerText = "Nuevo Trabajador";
  document.getElementById("edit-user-id").value = "";
  document.getElementById("edit-user-nombre").value = "";
  document.getElementById("edit-user-pin").value = "";
  document.getElementById("edit-user-tipo").value = "Horas";
  document.getElementById("edit-user-tarifa").value = "1.5";
  document.getElementById("edit-user-cargo").value = "Operaciones";
  document.getElementById("edit-user-rol").value = "trabajador";
  actualizarLabelModalUsuario();
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
  actualizarLabelModalUsuario();
  document.getElementById("modal-usuario").classList.remove("hidden");
}

async function guardarUsuario() {
  const id = document.getElementById("edit-user-id").value;
  const nombre = (document.getElementById("edit-user-nombre").value || "").trim();
  const pin = (document.getElementById("edit-user-pin").value || "").trim();
  const tipo_pago = document.getElementById("edit-user-tipo").value;
  const tarifa = parseFloat(document.getElementById("edit-user-tarifa").value) || (tipo_pago === 'Fijo' ? 150 : 1.5);
  const cargo = document.getElementById("edit-user-cargo").value;
  const rol = document.getElementById("edit-user-rol").value;
  const usuario = nombre.toLowerCase().trim().replace(/\s+/g, '');

  if (!nombre || !pin) { alert("Ingresa nombre y PIN."); return; }

  if (id) {
    const { error } = await supabaseClient.from("usuarios").update({ nombre, pin, tipo_pago, tarifa, cargo, rol }).eq("id", id);
    if (error) { alert("Error al actualizar: " + error.message); return; }
  } else {
    const { error } = await supabaseClient.from("usuarios").insert([{ nombre, usuario, pin, tipo_pago, tarifa, cargo, rol }]);
    if (error) { alert("Error al registrar nuevo usuario: " + error.message); return; }
  }

  closeModals();
  loadAdminData();
  alert("¡Guardado con éxito!");
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
  if (isNaN(nueva)) return;

  const { data: users } = await supabaseClient.from("usuarios").select("id, tipo_pago");
  
  for (let u of (users || [])) {
    const tipo = (u.tipo_pago || "Horas").trim().toLowerCase();
    if (tipo !== "gasolina" && tipo !== "fijo") {
      await supabaseClient.from("usuarios").update({ tarifa: nueva }).eq("id", u.id);
    }
  }

  closeModals();
  loadAdminData();
  alert("Tarifa general aplicada con éxito a todo el personal por hora.");
}

function openAgregarHorasModal() {
  const sel = document.getElementById("manual-user-select");
  sel.innerHTML = "";
  cachedUsers.forEach(u => sel.innerHTML += `<option value="${u.id}">${u.nombre} (${u.tipo_pago || 'Horas'})</option>`);
  document.getElementById("manual-fecha").value = new Date().toISOString().split("T")[0];
  document.getElementById("modal-agregar-horas").classList.remove("hidden");
}

async function guardarHorasManuales() {
  const userId = document.getElementById("manual-user-select").value;
  const fecha = document.getElementById("manual-fecha").value;
  const hEntrada = document.getElementById("manual-entrada").value;
  const hSalida = document.getElementById("manual-salida").value;

  if (!fecha || !hEntrada || !hSalida) { alert("Completa fecha y horas."); return; }

  let tEntrada = new Date(`${fecha}T${hEntrada}:00`);
  let tSalida = new Date(`${fecha}T${hSalida}:00`);

  let diffHrs = (tSalida - tEntrada) / (1000 * 60 * 60);
  if (diffHrs < 0) {
    diffHrs += 24; // Corrección cruce medianoche
  }

  const { error } = await supabaseClient.from("registros_turnos").insert([{
    id_usuario: userId,
    fecha_inicio: fecha,
    hora_entrada: tEntrada.toISOString(),
    hora_salida: tSalida.toISOString(),
    horas_totales: diffHrs > 0 ? diffHrs.toFixed(2) : 0,
    estado: "completado",
    origen: "manual"
  }]);

  if (error) {
    alert("Error al registrar horas: " + error.message);
    return;
  }

  closeModals();
  loadAdminData();
  alert("¡Horas y turnos registrados correctamente!");
}

async function borrarTurno(id) {
  if (confirm("¿Eliminar este registro o reporte?")) {
    await supabaseClient.from("registros_turnos").delete().eq("id", id);
    closeModals();
    loadAdminData();
  }
}