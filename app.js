function abrirResumenPagoModal() {
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;
  if (!desde || !hasta) { alert("Selecciona el rango de fechas."); return; }

  let d1 = new Date(desde);
  let d2 = new Date(hasta);
  let diffDias = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
  let semanas = Math.max(1, diffDias / 7);

  const turnosFiltrados = cachedTurnos.filter(t => t.fecha_inicio >= desde && t.fecha_inicio <= hasta);
  
  document.getElementById("resumen-rango-fechas").innerText = `Período del ${desde} al ${hasta}`;
  
  let html = `<ul style="list-style:none; padding:0; line-height:1.8;">`;
  let granTotal = 0;

  cachedUsers.forEach(u => {
    const userTurnos = turnosFiltrados.filter(t => t.id_usuario === u.id);
    let totalHoras = userTurnos.reduce((acc, curr) => acc + parseFloat(curr.horas_totales || 0), 0);
    let tarifaVal = u.tarifa !== undefined && u.tarifa !== null ? parseFloat(u.tarifa) : 1.5;
    let totalPagar = 0;
    let tipoPago = (u.tipo_pago || "Horas").trim();

    if (tipoPago === "Gasolina") {
      let litros = totalHoras * 1.4;
      totalPagar = litros * 0.50;
      html += `<li style="padding:6px 0; border-bottom:1px solid #334155;"><strong>${u.nombre}</strong> (Planta - Gasolina): ${totalHoras.toFixed(2)} hrs (${litros.toFixed(1)} L) = <span class="txt-green">$${totalPagar.toFixed(2)}</span></li>`;
    } else if (tipoPago === "Fijo") {
      totalPagar = tarifaVal * semanas;
      html += `<li style="padding:6px 0; border-bottom:1px solid #334155;"><strong>${u.nombre}</strong> (Administrador - Fijo): ${semanas.toFixed(1)} sem = <span class="txt-green">$${totalPagar.toFixed(2)}</span></li>`;
    } else {
      totalPagar = totalHoras * tarifaVal;
      html += `<li style="padding:6px 0; border-bottom:1px solid #334155;"><strong>${u.nombre}</strong>: ${totalHoras.toFixed(2)} hrs = <span class="txt-green">$${totalPagar.toFixed(2)}</span></li>`;
    }
    granTotal += totalPagar;
  });

  html += `</ul>`;
  html += `<div style="margin-top:15px; padding-top:10px; border-top:2px solid #10b981; text-align:right; font-size:1.1rem; font-weight:bold;">Total a Pagar: <span class="txt-green">$${granTotal.toFixed(2)}</span></div>`;

  document.getElementById("resumen-pago-contenido").innerHTML = html;
  const modalResumen = document.getElementById("modal-resumen-pago");
  if (modalResumen) {
    modalResumen.classList.remove("hidden");
    modalResumen.style.display = "flex";
  }
}