function ejecutarToggleTurno() {
  closeModals();
  const now = new Date();
  
  // 1. Formateadores limpios para la zona horaria de Venezuela
  const optionsDate = { timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit' };
  const optionsTime = { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: true };
  
  const formatterDate = new Intl.DateTimeFormat('en-CA', optionsDate); // YYYY-MM-DD
  const formatterTime = new Intl.DateTimeFormat('en-US', optionsTime); // hh:mm AM/PM

  const fechaStr = formatterDate.format(now);
  const horaStr = formatterTime.format(now);

  if (!currentShift) {
    // INICIAR TURNO
    const nuevoTurno = {
      id: Date.now(),
      id_usuario: Number(currentUser.id),
      fecha_inicio: fechaStr,
      hora_entrada: now.getTime(), // Guardamos el timestamp exacto en ms
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
        hora_entrada: new Date(now.getTime()).toISOString(),
        estado: "en_turno",
        origen: "sistema"
      }]).then(() => {
        syncDataFromSupabase().then(() => renderTablaTrabajador());
      }).catch(e => console.log(e));
    }

    // Enviar WhatsApp al instante
    enviarNotificacionWhatsApp(currentUser.nombre, "INICIO", fechaStr, horaStr);

  } else {
    // FINALIZAR TURNO
    // Convertir hora_entrada a timestamp numérico si venía como texto ISO
    let entradaMs = typeof currentShift.hora_entrada === 'number' 
      ? currentShift.hora_entrada 
      : new Date(currentShift.hora_entrada).getTime();

    let salidaMs = now.getTime();
    let diffMs = salidaMs - entradaMs;
    
    // Si la diferencia es positiva, calculamos las horas exactas (ej: 0.15 hrs si pasaron unos minutos)
    let diffHrs = diffMs > 0 ? (diffMs / (1000 * 60 * 60)) : 0;
    
    // Asegurar mínimo 2 decimales
    let horasCalculadas = parseFloat(diffHrs.toFixed(2));

    const turnoIdAActualizar = currentShift.id;
    currentShift.hora_salida = salidaMs;
    currentShift.horas_totales = horasCalculadas;
    currentShift.estado = "completado";
    guardarTurnosLocales();

    currentShift = null;

    actualizarBotonesTurno(false);
    renderTablaTrabajador();

    if (supabaseClient) {
      supabaseClient.from("registros_turnos").update({
        hora_salida: new Date(salidaMs).toISOString(),
        horas_totales: horasCalculadas,
        estado: "completado"
      }).eq("id", turnoIdAActualizar).then(() => {
        syncDataFromSupabase().then(() => renderTablaTrabajador());
      }).catch(e => console.log(e));
    }

    // Enviar WhatsApp al instante
    enviarNotificacionWhatsApp(currentUser.nombre, "FIN", fechaStr, horaStr);
  }
}