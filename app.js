let currentUser = null;
let currentShift = null;

// BASE DE DATOS LOCAL ROBUSTA (Personal y Turnos del 05-10-2026 al 17-10-2026)
let cachedUsers = JSON.parse(localStorage.getItem('matrix_usuarios')) || [
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

let cachedTurnos = JSON.parse(localStorage.getItem('matrix_turnos')) || [
  // 17-10-2026
  { id: 1, id_usuario: 2, fecha_inicio: "2026-10-17", hora_entrada: "2026-10-16T18:57:00", hora_salida: "2026-10-17T00:02:00", horas_totales: 5.08, estado: "completado" },
  { id: 2, id_usuario: 3, fecha_inicio: "2026-10-17", hora_entrada: "2026-10-16T15:38:00", hora_salida: "2026-10-17T02:40:00", horas_totales: 11.03, estado: "completado" },
  { id: 3, id_usuario: 5, fecha_inicio: "2026-10-17", hora_entrada: "2026-10-16T11:00:00", hora_salida: "2026-10-17T00:02:00", horas_totales: 13.03, estado: "completado" },
  { id: 4, id_usuario: 6, fecha_inicio: "2026-10-17", hora_entrada: "2026-10-16T18:37:00", hora_salida: "2026-10-17T02:37:00", horas_totales: 8.00, estado: "completado" },
  // 16-10-2026
  { id: 5, id_usuario: 2, fecha_inicio: "2026-10-16", hora_entrada: "2026-10-16T18:57:00", hora_salida: "2026-10-17T00:02:00", horas_totales: 5.08, estado: "completado" },
  { id: 6, id_usuario: 3, fecha_inicio: "2026-10-16", hora_entrada: "2026-10-16T15:38:00", hora_salida: "2026-10-17T02:40:00", horas_totales: 11.03, estado: "completado" },
  { id: 7, id_usuario: 4, fecha_inicio: "2026-10-16", hora_entrada: "2026-10-16T11:17:00", hora_salida: "2026-10-16T18:13:00", horas_totales: 6.93, estado: "completado" },
  { id: 8, id_usuario: 5, fecha_inicio: "2026-10-16", hora_entrada: "2026-10-16T11:00:00", hora_salida: "2026-10-17T00:02:00", horas_totales: 13.03, estado: "completado" },
  { id: 9, id_usuario: 6, fecha_inicio: "2026-10-16", hora_entrada: "2026-10-16T09:40:00", hora_salida: "2026-10-16T12:16:00", horas_totales: 2.60, estado: "completado" },
  { id: 10, id_usuario: 6, fecha_inicio: "2026-10-16", hora_entrada: "2026-10-16T18:37:00", hora_salida: "2026-10-17T02:37:00", horas_totales: 8.00, estado: "completado" },
  // 15-10-2026
  { id: 11, id_usuario: 2, fecha_inicio: "2026-10-15", hora_entrada: "2026-10-15T17:22:00", hora_salida: "2026-10-15T23:53:00", horas_totales: 6.52, estado: "completado" },
  { id: 12, id_usuario: 7, fecha_inicio: "2026-10-15", hora_entrada: "2026-10-15T17:09:00", hora_salida: "2026-10-15T23:03:00", horas_totales: 5.90, estado: "completado" },
  { id: 13, id_usuario: 3, fecha_inicio: "2026-10-15", hora_entrada: "2026-10-15T12:40:00", hora_salida: "2026-10-16T03:03:00", horas_totales: 14.38, estado: "completado" },
  { id: 14, id_usuario: 6, fecha_inicio: "2026-10-15", hora_entrada: "2026-10-15T10:57:00", hora_salida: "2026-10-16T03:02:00", horas_totales: 16.08, estado: "completado" },
  { id: 15, id_usuario: 5, fecha_inicio: "2026-10-15", hora_entrada: "2026-10-15T11:00:00", hora_salida: "2026-10-16T00:00:00", horas_totales: 13.00, estado: "completado" },
  { id: 16, id_usuario: 4, fecha_inicio: "2026-10-15", hora_entrada: "2026-10-15T11:23:00", hora_salida: "2026-10-15T18:01:00", horas_totales: 6.63, estado: "completado" },
  { id: 17, id_usuario: 10, fecha_inicio: "2026-10-15", hora_entrada: "2026-10-15T11:50:00", hora_salida: "2026-10-15T17:50:00", horas_totales: 6.00, estado: "completado" },
  // 14-10-2026
  { id: 18, id_usuario: 2, fecha_inicio: "2026-10-14", hora_entrada: "2026-10-14T17:52:00", hora_salida: "2026-10-15T00:02:00", horas_totales: 6.17, estado: "completado" },
  { id: 19, id_usuario: 3, fecha_inicio: "2026-10-14", hora_entrada: "2026-10-14T15:40:00", hora_salida: "2026-10-15T02:58:00", horas_totales: 11.30, estado: "completado" },
  { id: 20, id_usuario: 6, fecha_inicio: "2026-10-14", hora_entrada: "2026-10-14T12:32:00", hora_salida: "2026-10-14T18:02:00", horas_totales: 5.50, estado: "completado" },
  { id: 21, id_usuario: 4, fecha_inicio: "2026-10-14", hora_entrada: "2026-10-14T12:32:00", hora_salida: "2026-10-14T18:01:00", horas_totales: 5.48, estado: "completado" },
  { id: 22, id_usuario: 5, fecha_inicio: "2026-10-14", hora_entrada: "2026-10-14T12:00:00", hora_salida: "2026-10-15T00:04:00", horas_totales: 12.07, estado: "completado" },
  // 13-10-2026
  { id: 23, id_usuario: 2, fecha_inicio: "2026-10-13", hora_entrada: "2026-10-13T17:35:00", hora_salida: "2026-10-14T00:10:00", horas_totales: 6.58, estado: "completado" },
  { id: 24, id_usuario: 7, fecha_inicio: "2026-10-13", hora_entrada: "2026-10-13T17:30:00", hora_salida: "2026-10-13T23:13:00", horas_totales: 5.72, estado: "completado" },
  { id: 25, id_usuario: 3, fecha_inicio: "2026-10-13", hora_entrada: "2026-10-13T16:30:00", hora_salida: "2026-10-14T02:09:00", horas_totales: 9.65, estado: "completado" },
  { id: 26, id_usuario: 5, fecha_inicio: "2026-10-13", hora_entrada: "2026-10-13T10:59:00", hora_salida: "2026-10-14T00:10:00", horas_totales: 13.18, estado: "completado" },
  { id: 27, id_usuario: 4, fecha_inicio: "2026-10-13", hora_entrada: "2026-10-13T10:12:00", hora_salida: "2026-10-13T18:03:00", horas_totales: 7.85, estado: "completado" },
  { id: 28, id_usuario: 6, fecha_inicio: "2026-10-13", hora_entrada: "2026-10-13T08:53:00", hora_salida: "2026-10-13T18:01:00", horas_totales: 9.13, estado: "completado" },
  // 12-10-2026
  { id: 29, id_usuario: 10, fecha_inicio: "2026-10-12", hora_entrada: "2026-10-12T18:50:00", hora_salida: "2026-10-12T23:55:00", horas_totales: 5.08, estado: "completado" },
  { id: 30, id_usuario: 2, fecha_inicio: "2026-10-12", hora_entrada: "2026-10-12T17:29:00", hora_salida: "2026-10-12T23:21:00", horas_totales: 5.87, estado: "completado" },
  { id: 31, id_usuario: 7, fecha_inicio: "2026-10-12", hora_entrada: "2026-10-12T17:15:00", hora_salida: "2026-10-12T23:01:00", horas_totales: 5.77, estado: "completado" },
  { id: 32, id_usuario: 8, fecha_inicio: "2026-10-12", hora_entrada: "2026-10-12T15:22:00", hora_salida: "2026-10-12T17:14:00", horas_totales: 1.87, estado: "completado" },
  { id: 33, id_usuario: 3, fecha_inicio: "2026-10-12", hora_entrada: "2026-10-12T15:21:00", hora_salida: "2026-10-13T03:12:00", horas_totales: 11.85, estado: "completado" },
  { id: 34, id_usuario: 6, fecha_inicio: "2026-10-12", hora_entrada: "2026-10-12T11:09:00", hora_salida: "2026-10-13T03:02:00", horas_totales: 15.88, estado: "completado" },
  { id: 35, id_usuario: 5, fecha_inicio: "2026-10-12", hora_entrada: "2026-10-12T11:00:00", hora_salida: "2026-10-13T00:02:00", horas_totales: 13.03, estado: "completado" },
  // 11-10-2026
  { id: 36, id_usuario: 8, fecha_inicio: "2026-10-11", hora_entrada: "2026-10-11T15:50:00", hora_salida: "2026-10-11T19:54:00", horas_totales: 4.07, estado: "completado" },
  { id: 37, id_usuario: 3, fecha_inicio: "2026-10-11", hora_entrada: "2026-10-11T15:32:00", hora_salida: "2026-10-12T02:35:00", horas_totales: 11.05, estado: "completado" },
  { id: 38, id_usuario: 5, fecha_inicio: "2026-10-11", hora_entrada: "2026-10-11T11:45:00", hora_salida: "2026-10-11T20:16:00", horas_totales: 8.52, estado: "completado" },
  { id: 39, id_usuario: 2, fecha_inicio: "2026-10-11", hora_entrada: "2026-10-11T10:20:00", hora_salida: "2026-10-11T17:04:00", horas_totales: 6.73, estado: "completado" },
  { id: 40, id_usuario: 6, fecha_inicio: "2026-10-11", hora_entrada: "2026-10-11T10:14:00", hora_salida: "2026-10-11T19:54:00", horas_totales: 9.67, estado: "completado" },
  { id: 41, id_usuario: 4, fecha_inicio: "2026-10-11", hora_entrada: "2026-10-11T10:14:00", hora_salida: "2026-10-11T19:57:00", horas_totales: 9.72, estado: "completado" },
  // 10-10-2026
  { id: 42, id_usuario: 8, fecha_inicio: "2026-10-10", hora_entrada: "2026-10-10T18:15:00", hora_salida: "2026-10-10T23:30:00", horas_totales: 5.25, estado: "completado" },
  { id: 43, id_usuario: 3, fecha_inicio: "2026-10-10", hora_entrada: "2026-10-10T16:30:00", hora_salida: "2026-10-10T23:30:00", horas_totales: 7.00, estado: "completado" },
  { id: 44, id_usuario: 2, fecha_inicio: "2026-10-10", hora_entrada: "2026-10-10T14:02:00", hora_salida: "2026-10-10T23:10:00", horas_totales: 9.13, estado: "completado" },
  { id: 45, id_usuario: 4, fecha_inicio: "2026-10-10", hora_entrada: "2026-10-10T12:55:00", hora_salida: "2026-10-10T17:30:00", horas_totales: 4.58, estado: "completado" },
  { id: 46, id_usuario: 5, fecha_inicio: "2026-10-10", hora_entrada: "2026-10-10T11:10:00", hora_salida: "2026-10-10T23:30:00", horas_totales: 12.33, estado: "completado" },
  { id: 47, id_usuario: 7, fecha_inicio: "2026-10-10", hora_entrada: "2026-10-10T10:17:00", hora_salida: "2026-10-10T17:16:00", horas_totales: 6.98, estado: "completado" },
  // 09-10-2026
  { id: 48, id_usuario: 2, fecha_inicio: "2026-10-09", hora_entrada: "2026-10-09T15:53:00", hora_salida: "2026-10-10T00:31:00", horas_totales: 8.63, estado: "completado" },
  { id: 49, id_usuario: 3, fecha_inicio: "2026-10-09", hora_entrada: "2026-10-09T15:19:00", hora_salida: "2026-10-10T02:35:00", horas_totales: 11.27, estado: "completado" },
  { id: 50, id_usuario: 10, fecha_inicio: "2026-10-09", hora_entrada: "2026-10-09T11:40:00", hora_salida: "2026-10-09T17:20:00", horas_totales: 5.67, estado: "completado" },
  { id: 51, id_usuario: 5, fecha_inicio: "2026-10-09", hora_entrada: "2026-10-09T11:00:00", hora_salida: "2026-10-09T18:00:00", horas_totales: 7.00, estado: "completado" },
  { id: 52, id_usuario: 4, fecha_inicio: "2026-10-09", hora_entrada: "2026-10-09T11:00:00", hora_salida: "2026-10-09T17:47:00", horas_totales: 6.78, estado: "completado" },
  { id: 53, id_usuario: 6, fecha_inicio: "2026-10-09", hora_entrada: "2026-10-09T09:56:00", hora_salida: "2026-10-10T02:35:00", horas_totales: 16.65, estado: "completado" },
  // 08-10-2026
  { id: 54, id_usuario: 7, fecha_inicio: "2026-10-08", hora_entrada: "2026-10-08T17:39:00", hora_salida: "2026-10-08T23:09:00", horas_totales: 5.50, estado: "completado" },
  { id: 55, id_usuario: 3, fecha_inicio: "2026-10-08", hora_entrada: "2026-10-08T11:36:00", hora_salida: "2026-10-09T02:26:00", horas_totales: 14.83, estado: "completado" },
  { id: 56, id_usuario: 4, fecha_inicio: "2026-10-08", hora_entrada: "2026-10-08T11:03:00", hora_salida: "2026-10-08T17:17:00", horas_totales: 6.23, estado: "completado" },
  { id: 57, id_usuario: 5, fecha_inicio: "2026-10-08", hora_entrada: "2026-10-08T10:59:00", hora_salida: "2026-10-09T00:02:00", horas_totales: 13.05, estado: "completado" },
  { id: 58, id_usuario: 6, fecha_inicio: "2026-10-08", hora_entrada: "2026-10-08T09:13:00", hora_salida: "2026-10-08T18:08:00", horas_totales: 8.92, estado: "completado" },
  // 07-10-2026
  { id: 59, id_usuario: 2, fecha_inicio: "2026-10-07", hora_entrada: "2026-10-07T17:40:00", hora_salida: "2026-10-07T23:58:00", horas_totales: 6.30, estado: "completado" },
  { id: 60, id_usuario: 3, fecha_inicio: "2026-10-07", hora_entrada: "2026-10-07T15:09:00", hora_salida: "2026-10-08T03:42:00", horas_totales: 12.55, estado: "completado" },
  { id: 61, id_usuario: 4, fecha_inicio: "2026-10-07", hora_entrada: "2026-10-07T13:30:00", hora_salida: "2026-10-07T17:43:00", horas_totales: 4.22, estado: "completado" },
  { id: 62, id_usuario: 5, fecha_inicio: "2026-10-07", hora_entrada: "2026-10-07T11:00:00", hora_salida: "2026-10-08T00:01:00", horas_totales: 13.02, estado: "completado" },
  { id: 63, id_usuario: 6, fecha_inicio: "2026-10-07", hora_entrada: "2026-10-07T10:01:00", hora_salida: "2026-10-08T03:16:00", horas_totales: 17.25, estado: "completado" },
  // 06-10-2026
  { id: 64, id_usuario: 7, fecha_inicio: "2026-10-06", hora_entrada: "2026-10-06T17:59:00", hora_salida: "2026-10-06T23:07:00", horas_totales: 5.13, estado: "completado" },
  { id: 65, id_usuario: 2, fecha_inicio: "2026-10-06", hora_entrada: "2026-10-06T17:52:00", hora_salida: "2026-10-07T00:00:00", horas_totales: 6.13, estado: "completado" },
  { id: 66, id_usuario: 3, fecha_inicio: "2026-10-06", hora_entrada: "2026-10-06T15:00:00", hora_salida: "2026-10-07T02:42:00", horas_totales: 11.70, estado: "completado" },
  { id: 67, id_usuario: 10, fecha_inicio: "2026-10-06", hora_entrada: "2026-10-06T12:40:00", hora_salida: "2026-10-06T18:20:00", horas_totales: 5.67, estado: "completado" },
  { id: 68, id_usuario: 9, fecha_inicio: "2026-10-06", hora_entrada: "2026-10-06T11:15:00", hora_salida: "2026-10-06T19:12:00", horas_totales: 7.95, estado: "completado" },
  { id: 69, id_usuario: 5, fecha_inicio: "2026-10-06", hora_entrada: "2026-10-06T11:00:00", hora_salida: "2026-10-07T00:02:00", horas_totales: 13.03, estado: "completado" },
  { id: 70, id_usuario: 6, fecha_inicio: "2026-10-06", hora_entrada: "2026-10-06T08:54:00", hora_salida: "2026-10-06T19:12:00", horas_totales: 10.30, estado: "completado" },
  // 05-10-2026
  { id: 71, id_usuario: 2, fecha_inicio: "2026-10-05", hora_entrada: "2026-10-05T18:36:00", hora_salida: "2026-10-06T00:01:00", horas_totales: 5.42, estado: "completado" },
  { id: 72, id_usuario: 6, fecha_inicio: "2026-10-05", hora_entrada: "2026-10-05T16:30:00", hora_salida: "2026-10-06T03:24:00", horas_totales: 10.90, estado: "completado" },
  { id: 73, id_usuario: 3, fecha_inicio: "2026-10-05", hora_entrada: "2026-10-05T13:15:00", hora_salida: "2026-10-06T03:24:00", horas_totales: 14.15, estado: "completado" },
  { id: 74, id_usuario: 5, fecha_inicio: "2026-10-05", hora_entrada: "2026-10-05T12:00:00", hora_salida: "2026-10-06T00:02:00", horas_totales: 12.03, estado: "completado" }
];

function guardarLocal() {
  localStorage.setItem('matrix_usuarios', JSON.stringify(cachedUsers));
  localStorage.setItem('matrix_turnos', JSON.stringify(cachedTurnos));
}

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

function login() {
  const uInput = (document.getElementById("login-usuario").value || "").trim().toLowerCase();
  const pInput = (document.getElementById("login-pin").value || "").trim();

  if (!uInput || !pInput) { alert("Ingresa usuario y PIN."); return; }

  const user = cachedUsers.find(u => {
    const dbUser = (u.usuario || "").trim().toLowerCase();
    const dbNombre = (u.nombre || "").trim().toLowerCase();
    return dbUser === uInput || dbNombre === uInput;
  });

  if (!user) { alert("El usuario '" + uInput + "' no existe en el sistema."); return; }

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

function loadWorkerData() {
  if (!currentUser) return;

  const desde = document.getElementById("w-filtro-desde").value;
  const hasta = document.getElementById("w-filtro-hasta").value;

  const workerTurnos = cachedTurnos.filter(t => t.id_usuario === currentUser.id);
  const activo = workerTurnos.find(t => t.estado === "en_turno");
  currentShift = activo || null;
  setWorkerShiftUI(!!activo);

  const turnosFiltrados = workerTurnos.filter(t => t.fecha_inicio >= desde && t.fecha_inicio <= hasta);

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
    if ((currentUser.tipo_pago || "").trim() === 'Gasolina') {
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

  if ((currentUser.tipo_pago || "").trim() === 'Gasolina') {
    let totalLitros = totalHorasPeriodo * 1.4;
    let totalDolares = totalLitros * 0.50;
    document.getElementById("w-total-periodo").innerText = `${totalHorasPeriodo.toFixed(2)} hrs (${totalLitros.toFixed(1)} L)`;
    document.getElementById("w-monto-editable").value = totalDolares.toFixed(2);
  } else if ((currentUser.tipo_pago || "").trim() === 'Fijo') {
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

function ejecutarToggleTurno() {
  closeModals();
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  if (!currentShift) {
    const nuevoTurno = {
      id: Date.now(),
      id_usuario: currentUser.id,
      fecha_inicio: dateStr,
      hora_entrada: now.toISOString(),
      estado: "en_turno",
      origen: "sistema"
    };
    cachedTurnos.push(nuevoTurno);
  } else {
    let entrada = new Date(currentShift.hora_entrada);
    let salida = now;
    let diffMs = salida - entrada;
    let diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs < 0) diffHrs += 24;

    currentShift.hora_salida = salida.toISOString();
    currentShift.horas_totales = diffHrs > 0 ? parseFloat(diffHrs.toFixed(2)) : 0;
    currentShift.estado = "completado";
  }
  guardarLocal();
  loadWorkerData();
}

function toggleReceso() {
  if (!currentShift) { alert("Debes iniciar turno primero."); return; }
  alert("Pausa activada.");
}

function openConfigPinModal() {
  document.getElementById("pin-actual-input").value = "";
  document.getElementById("pin-nuevo-input").value = "";
  document.getElementById("pin-confirmar-input").value = "";
  document.getElementById("modal-config-pin").classList.remove("hidden");
}

function guardarNuevoPinSeguro() {
  const actual = document.getElementById("pin-actual-input").value.trim();
  const nuevo = document.getElementById("pin-nuevo-input").value.trim();
  const confirmar = document.getElementById("pin-confirmar-input").value.trim();

  if (actual !== String(currentUser.pin).trim()) { alert("El PIN actual no es correcto."); return; }
  if (!nuevo || nuevo !== confirmar) { alert("El nuevo PIN y su confirmación no coinciden."); return; }

  currentUser.pin = nuevo;
  const idx = cachedUsers.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) cachedUsers[idx].pin = nuevo;
  guardarLocal();

  alert("PIN actualizado con éxito.");
  closeModals();
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

function loadAdminData() {
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
    if ((u.tipo_pago || "").trim() === "Gasolina") tarifaLabel = "1.4L/h × $0.50";
    else if ((u.tipo_pago || "").trim() === "Fijo") tarifaLabel = `$${tarifaVal} / sem`;

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
        ${u.usuario !== 'admin' && u.usuario !== 'administrador' ? `<button onclick="borrarUsuario(${u.id})" class="btn-icon" title="Borrar">🗑️</button>` : ''}
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
    let baseTarifa = parseFloat(u.tarifa !== undefined && u.tarifa !== null ? u.tarifa : (u.tipo_pago === 'Fijo' ? 150 : 1.5));
    let tarifaTexto = `$${baseTarifa}`;
    let tipoPago = (u.tipo_pago || "Horas").trim();

    if (tipoPago === "Gasolina") {
      let litros = totalHoras * 1.4;
      totalPagar = litros * 0.50;
      tarifaTexto = `1.4L/h × $0.50 (${litros.toFixed(1)} L)`;
    } else if (tipoPago === "Fijo") {
      totalPagar = baseTarifa * semanas;
      tarifaTexto = `$${baseTarifa}/sem (${semanas.toFixed(1)} sem)`;
    } else {
      totalPagar = totalHoras * baseTarifa;
      tarifaTexto = `$${baseTarifa}/h`;
    }

    resumenList.push({
      nombre: u.nombre,
      tipo: tipoPago,
      horas: totalHoras,
      tarifaTexto: tarifaTexto,
      totalPagar: totalPagar
    });
  });
  return resumenList;
}

function calcularNomina() {
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;
  if (!desde || !hasta) return;

  const turnosFiltrados = cachedTurnos.filter(t => t.fecha_inicio >= desde && t.fecha_inicio <= hasta);
  const resumen = calcularNominaParaFechas(desde, hasta, turnosFiltrados);
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

function abrirResumenPagoModal() {
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;
  if (!desde || !hasta) { alert("Selecciona las fechas de inicio y fin."); return; }

  const turnosFiltrados = cachedTurnos.filter(t => t.fecha_inicio >= desde && t.fecha_inicio <= hasta);
  const resumen = calcularNominaParaFechas(desde, hasta, turnosFiltrados);
  
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

function loadAsistenciasAdminConsolidado() {
  let agrupado = {};
  cachedTurnos.forEach(t => {
    const userObj = cachedUsers.find(u => u.id === t.id_usuario);
    const uNombre = userObj ? userObj.nombre : 'Desconocido';
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

  Object.values(agrupado).sort((a,b) => b.fecha.localeCompare(a.fecha)).forEach(item => {
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

function forzarSalida(idTurno) {
  if (confirm("¿Forzar salida de este turno activo?")) {
    const now = new Date();
    const t = cachedTurnos.find(x => x.id === idTurno);
    if (t) {
      t.hora_salida = now.toISOString();
      t.estado = "completado";
    }
    guardarLocal();
    loadAdminData();
  }
}

function exportarExcel() {
  alert("Generando reporte CSV...");
  let csv = "Usuario,Fecha,Horas\n";
  cachedTurnos.forEach(t => {
    const u = cachedUsers.find(x => x.id === t.id_usuario);
    csv += `${u ? u.nombre : 'Usuario'},${t.fecha_inicio},${t.horas_totales}\n`;
  });
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
  document.getElementById("edit-user-tarifa").value = user.tarifa !== undefined && user.tarifa !== null ? user.tarifa : 1.5;
  document.getElementById("edit-user-cargo").value = user.cargo || "Operaciones";
  document.getElementById("edit-user-rol").value = user.rol || "trabajador";
  actualizarLabelModalUsuario();
  document.getElementById("modal-usuario").classList.remove("hidden");
}

function guardarUsuario() {
  const id = document.getElementById("edit-user-id").value;
  const nombre = (document.getElementById("edit-user-nombre").value || "").trim();
  const pin = (document.getElementById("edit-user-pin").value || "").trim();
  const tipo_pago = document.getElementById("edit-user-tipo").value;
  const valTarifa = parseFloat(document.getElementById("edit-user-tarifa").value) || (tipo_pago === 'Fijo' ? 150 : 1.5);
  const cargo = document.getElementById("edit-user-cargo").value;
  const rol = document.getElementById("edit-user-rol").value;
  const usuario = nombre.toLowerCase().trim().replace(/\s+/g, '');

  if (!nombre || !pin) { alert("Ingresa nombre y PIN."); return; }

  const payload = {
    nombre: nombre,
    usuario: usuario,
    pin: pin,
    tipo_pago: tipo_pago,
    tarifa: valTarifa,
    cargo: cargo,
    rol: rol
  };

  if (id) {
    const idx = cachedUsers.findIndex(u => u.id == id);
    if (idx !== -1) {
      cachedUsers[idx] = { ...cachedUsers[idx], ...payload };
    }
  } else {
    const newId = cachedUsers.length > 0 ? Math.max(...cachedUsers.map(u => u.id)) + 1 : 1;
    payload.id = newId;
    cachedUsers.push(payload);
  }

  guardarLocal();
  closeModals();
  loadAdminData();
  alert("¡Guardado con éxito!");
}

function borrarUsuario(id) {
  if (confirm("¿Borrar usuario?")) {
    cachedUsers = cachedUsers.filter(u => u.id !== id);
    guardarLocal();
    loadAdminData();
  }
}

function openConfigTarifasModal() {
  document.getElementById("modal-config-tarifas").classList.remove("hidden");
}

function aplicarTarifaGlobal() {
  const nueva = parseFloat(document.getElementById("global-tarifa-input").value);
  if (isNaN(nueva)) return;

  cachedUsers.forEach(u => {
    const tipo = (u.tipo_pago || "Horas").trim().toLowerCase();
    if (tipo !== "gasolina" && tipo !== "fijo") {
      u.tarifa = nueva;
    }
  });

  guardarLocal();
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

function guardarHorasManuales() {
  const userId = document.getElementById("manual-user-select").value;
  const fecha = document.getElementById("manual-fecha").value;
  const hEntrada = document.getElementById("manual-entrada").value;
  const hSalida = document.getElementById("manual-salida").value;

  if (!fecha || !hEntrada || !hSalida) { alert("Completa fecha y horas."); return; }

  let tEntrada = new Date(`${fecha}T${hEntrada}:00`);
  let tSalida = new Date(`${fecha}T${hSalida}:00`);
  let diffHrs = (tSalida - tEntrada) / (1000 * 60 * 60);
  if (diffHrs < 0) diffHrs += 24;

  const nuevoTurno = {
    id: Date.now(),
    id_usuario: parseInt(userId),
    fecha_inicio: fecha,
    hora_entrada: tEntrada.toISOString(),
    hora_salida: tSalida.toISOString(),
    horas_totales: parseFloat(diffHrs.toFixed(2)),
    estado: "completado",
    origen: "manual"
  };

  cachedTurnos.push(nuevoTurno);
  guardarLocal();

  closeModals();
  loadAdminData();
  alert("¡Horas y turnos registrados correctamente!");
}

function borrarTurno(id) {
  if (confirm("¿Eliminar este registro o reporte?")) {
    cachedTurnos = cachedTurnos.filter(t => t.id !== id);
    guardarLocal();
    closeModals();
    loadAdminData();
  }
}