// ENVÍO DE WHATSAPP DIRECTO A GREEN API
function enviarNotificacionWhatsApp(nombreTrabajador, accion, fecha, hora, totalHorasStr = "") {
  if (!WHATSAPP_GROUP_ID) return;

  let mensaje = "";
  if (accion === "INICIO") {
    mensaje = `🟢 *INICIO DE TURNO*\n` +
              `👤 *Trabajador:* ${nombreTrabajador}\n` +
              `📅 *Fecha:* ${fecha}\n` +
              `⏰ *Hora:* ${hora}`;
  } else {
    mensaje = `🔴 *FINALIZACIÓN DE TURNO*\n` +
              `👤 *Trabajador:* ${nombreTrabajador}\n` +
              `📅 *Fecha:* ${fecha}\n` +
              `⏰ *Hora de Salida:* ${hora}\n` +
              `⏱️ *Total Trabajado:* ${totalHorasStr}`;
  }

  // URL directa de Green API sin usar corsproxy
  const greenApiUrl = `https://api.greenapi.com/waInstance${GREEN_ID_INSTANCE}/sendMessage/${GREEN_API_TOKEN}`;

  fetch(greenApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      chatId: WHATSAPP_GROUP_ID, 
      message: mensaje 
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log("Respuesta WhatsApp Green API:", data);
  })
  .catch(e => {
    console.error("Error al enviar WhatsApp:", e);
  });
}