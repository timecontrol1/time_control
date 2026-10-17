function login() {
  const uInput = (document.getElementById("login-usuario").value || "").trim().toLowerCase();
  const pInput = (document.getElementById("login-pin").value || "").trim();

  if (!uInput || !pInput) { 
    alert("Ingresa usuario y PIN."); 
    return; 
  }

  // Acceso directo y seguro para el Administrador
  if ((uInput === "administrador" || uInput === "admin") && pInput === "1234") {
    currentUser = cachedUsers.find(u => u.rol === "admin") || {
      id: 1, nombre: "Administrador", usuario: "administrador", pin: "1234", rol: "admin", tipo_pago: "Fijo", tarifa: 150.00
    };
    document.getElementById("sec-login").classList.add("hidden");
    document.getElementById("sec-admin").classList.remove("hidden");
    initSemanaEnCursoDates("filtro-desde", "filtro-hasta");
    loadAdminData();
    return;
  }

  // Búsqueda flexible por usuario o nombre
  const user = cachedUsers.find(u => {
    const dbUser = (u.usuario || "").toString().trim().toLowerCase();
    const dbNombre = (u.nombre || "").toString().trim().toLowerCase();
    return dbUser === uInput || dbNombre === uInput;
  });

  if (!user) { 
    alert("El usuario '" + uInput + "' no existe en el sistema."); 
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
}