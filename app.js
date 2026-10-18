function ejecutarToggleTurno() {
  closeModals();
  const now = new Date();
  
  // Fecha local limpia (YYYY-MM-DD)
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const fechaStr = `${yyyy}-${mm}-${dd}`;

  // Hora local del teléfono (ej: "11:58 a. m.")
  const horaStr = getVenezuelaTimeString(now);

  if (!currentShift) {
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

    actualizarBotonesTurno(true);
    renderTablaTrabajador();

    if (supabaseClient) {
      supabaseClient.from("registros_turnos").insert([{
        id_usuario: Number(currentUser.id),
        fecha_inicio: fechaStr,
        hora_entrada: now.toISOString(),
        estado: "en_turno",
        origen: "sistema"
      }]).then(() => {
        syncDataFromSupabase().then(() => renderTablaTrabajador());
      }).catch(e => console.log(e));
    }

    enviarNotificacionWhatsApp(currentUser.nombre, "INICIO", fechaStr, horaStr);

  } else {
    const entrada = new Date(currentShift.hora_entrada);
    const salida = now;
    let diffMs = salida.getTime() - entrada.getTime();
    let diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));
    let horasTotales = parseFloat(diffHrs.toFixed(2));

    const turnoIdAActualizar = currentShift.id;
    currentShift.hora_salida = salida.toISOString();
    currentShift.horas_totales = horasTotales;
    currentShift.estado = "completado";
    guardarTurnosLocales();

    currentShift = null;

    actualizarBotonesTurno(false);
    renderTablaTrabajador();

    if (supabaseClient) {
      supabaseClient.from("registros_turnos").update({
        hora_salida: salida.toISOString(),
        horas_totales: horasTotales,
        estado: "completado"
      }).eq("id", turnoIdAActualizar).then(() => {
        syncDataFromSupabase().then(() => renderTablaTrabajador());
      }).catch(e => console.log(e));
    }

    enviarNotificacionWhatsApp(currentUser.nombre, "FIN", fechaStr, horaStr);
  }
}