function ejecutarToggleTurno() {
  closeModals();
  
  // Obtener fecha/hora exacta fijada en zona horaria de Venezuela (UTC-4)
  const now = new Date();
  const venezuelaOffset = -4 * 60; // -240 minutos
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const vzlaDate = new Date(utc + (60000 * venezuelaOffset));

  // Formato de fecha YYYY-MM-DD
  const yyyy = vzlaDate.getFullYear();
  const mm = String(vzlaDate.getMonth() + 1).padStart(2, '0');
  const dd = String(vzlaDate.getDate()).padStart(2, '0');
  const fechaStr = `${yyyy}-${mm}-${dd}`;

  // Formato de hora 12h AM/PM
  let hours = vzlaDate.getHours();
  const minutes = String(vzlaDate.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
  hours = hours % 12;
  hours = hours ? hours : 12; // Hora '0' pasa a '12'
  const horaStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

  if (!currentShift) {
    // INICIAR TURNO
    const nuevoTurno = {
      id: Date.now(),
      id_usuario: Number(currentUser.id),
      fecha_inicio: fechaStr,
      hora_entrada: vzlaDate.toISOString(),
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
        hora_entrada: vzlaDate.toISOString(),
        estado: "en_turno",
        origen: "sistema"
      }]).then(() => {
        syncDataFromSupabase().then(() => renderTablaTrabajador());
      }).catch(e => console.log(e));
    }

    // Notificación de WhatsApp
    enviarNotificacionWhatsApp(currentUser.nombre, "INICIO", fechaStr, horaStr);

  } else {
    // FINALIZAR TURNO
    const entrada = new Date(currentShift.hora_entrada);
    const salida = vzlaDate;
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

    // Notificación de WhatsApp
    enviarNotificacionWhatsApp(currentUser.nombre, "FIN", fechaStr, horaStr);
  }
}