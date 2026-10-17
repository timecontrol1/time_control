async function loadAdminData() {
  if (!supabaseClient) return;

  try {
    const { data: users, error } = await supabaseClient.from("usuarios").select("*").order("id", { ascending: true });
    
    if (error || !users || users.length === 0) {
      console.warn("Usando respaldo local de usuarios por seguridad.");
      cachedUsers = [
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
    } else {
      cachedUsers = users;
    }

    renderTablaUsuarios(cachedUsers);
    loadAsistenciasAdminConsolidado();
    calcularNomina();
  } catch (err) {
    console.error("Error crítico en loadAdminData:", err);
  }
}