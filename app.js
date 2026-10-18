// INICIO DE SESIÓN DIRECTO Y FLEXIBLE
async function login() {
  const uInput = (document.getElementById("login-usuario").value || "").trim().toLowerCase();
  const pInput = (document.getElementById("login-pin").value || "").trim();

  if (!uInput || !pInput) {
    alert("Ingresa usuario y PIN.");
    return;
  }

  // 1. Acceso directo de emergencia/admin general
  if ((uInput === "admin" || uInput === "administrador") && pInput === "1234") {
    currentUser = { id: 1, nombre: "Administrador", usuario: "administrador", pin: "1234", rol: "admin", tipo_pago: "Fijo", tarifa: 150.00, cargo: "Gerencia" };
    document.getElementById("sec-login").classList.add("hidden");
    document.getElementById("sec-admin").classList.remove("hidden");
    initSemanaEnCursoDates("filtro-desde", "filtro-hasta");
    await loadAdminData();
    return;
  }

  // 2. Sincronizar por si es un trabajador nuevo o actualizado
  await syncDataFromSupabase();

  // 3. Búsqueda flexible en la lista de usuarios
  let user = cachedUsers.find(u => {
    const dbUser = (u.usuario || "").toString().trim().toLowerCase();
    const dbNombre = (u.nombre || "").toString().trim().toLowerCase();
    return dbUser === uInput || dbNombre === uInput || (uInput === "admin" && (dbUser === "administrador" || u.rol === "admin"));
  });

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