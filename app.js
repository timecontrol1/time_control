function ejecutarToggleTurno() {
  closeModals();
  const now = new Date();
  
  // Forzamos la hora local de Venezuela (America/Caracas)
  const optionsDate = { timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit' };
  const optionsTime = { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: true };
  
  const formatterDate = new Intl.DateTimeFormat('en-CA', optionsDate); // Formato YYYY-MM-DD
  const formatterTime = new Intl.DateTimeFormat('en-US', optionsTime); // Formato hh:mm AM/PM

  const fechaStr = formatterDate.format(now);
  const horaStr = formatterTime.format(now);

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
    let diffMs = salida - entrada;
    let diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));

    const turnoIdAActualizar = currentShift.id;
    currentShift.hora_salida = salida.toISOString();
    currentShift.horas_totales = parseFloat(diffHrs.toFixed(2));
    currentShift.estado = "completado";
    guardarTurnosLocales();

    currentShift = null;

    actualizarBotonesTurno(false);
    renderTablaTrabajador();

    if (supabaseClient) {
      supabaseClient.from("registros_turnos").update({
        hora_salida: salida.toISOString(),
        horas_totales: parseFloat(diffHrs.toFixed(2)),
        estado: "completado"
      }).eq("id", turnoIdAActualizar).then(() => {
        syncDataFromSupabase().then(() => renderTablaTrabajador());
      }).catch(e => console.log(e));
    }

    enviarNotificacionWhatsApp(currentUser.nombre, "FIN", fechaStr, horaStr);
  }
}