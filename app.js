// TIME CONTROL - AUDITORÍA LEGIBLE
// Sustituye SOLO la función tcFiltrarAuditoria() al final de app.js
// por este bloque completo. No borres las demás funciones.
function tcAuditAccion(r) {
  const a = r.datos_antes || {};
  const d = r.datos_despues || {};
  if (r.tabla === 'registros_turnos') {
    if (r.accion === 'INSERT') return d.estado === 'completado' ? 'Turno cargado manualmente' : 'Turno iniciado';
    if (r.accion === 'DELETE') return 'Reporte de turno eliminado';
    if (r.accion === 'UPDATE') {
      if (a.estado !== 'completado' && d.estado === 'completado') return 'Turno finalizado';
      if (a.estado === 'completado' && d.estado === 'en_turno') return 'Turno reabierto';
      return 'Reporte de turno editado';
    }
  }
  if (r.tabla === 'reportes_planta') {
    return {INSERT:'Reporte de planta agregado', UPDATE:'Reporte de planta editado', DELETE:'Reporte de planta eliminado'}[r.accion] || r.accion;
  }
  if (r.tabla === 'usuarios') {
    if (r.accion === 'INSERT') return 'Usuario agregado';
    if (r.accion === 'DELETE') return 'Usuario eliminado';
    if (r.accion === 'UPDATE') {
      if (d.pin_modificado) return 'PIN de usuario actualizado';
      if (a.tarifa !== d.tarifa) return 'Tarifa de usuario modificada';
      return 'Datos de usuario editados';
    }
  }
  return {INSERT:'Registro agregado', UPDATE:'Registro editado', DELETE:'Registro eliminado'}[r.accion] || r.accion;
}
function tcAuditValor(k, v) {
  if (v === null || v === undefined) return 'Sin valor';
  if ((k === 'hora_entrada' || k === 'hora_salida') && typeof v === 'number') {
    return new Intl.DateTimeFormat('es-VE', {timeZone:'America/Caracas', dateStyle:'short', timeStyle:'short'}).format(new Date(v));
  }
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
function tcFiltrarAuditoria() {
  const out = document.getElementById('tc-audit-resultado');
  out.replaceChildren();
  const filtro = (document.getElementById('tc-audit-filtro').value || '').toLowerCase().trim();
  const usuarios = Array.isArray(window.usuarios) ? window.usuarios : [];
  const rows = (window.tcAuditRows || []).filter(r => {
    const d = r.datos_despues || r.datos_antes || {};
    const trabajador = usuarios.find(u => Number(u.id) === Number(d.id_usuario));
    return (JSON.stringify(r) + ' ' + tcAuditAccion(r) + ' ' + (trabajador?.nombre || '')).toLowerCase().includes(filtro);
  });
  if (!rows.length) { out.textContent = 'No hay movimientos que coincidan con el filtro.'; return; }
  for (const r of rows) {
    const card = document.createElement('details');
    card.className = 'tc-audit-item';
    const sum = document.createElement('summary');
    const fecha = new Intl.DateTimeFormat('es-VE', {timeZone:'America/Caracas', dateStyle:'short', timeStyle:'short'}).format(new Date(r.registrado_en));
    const ref = r.numero_reporte != null ? '#' + String(r.numero_reporte).padStart(6,'0') : 'ID ' + r.registro_id;
    sum.textContent = fecha + ' · ' + tcAuditAccion(r) + ' · ' + ref;
    const info = document.createElement('div');
    info.style.cssText = 'padding:10px 4px;white-space:normal;overflow-wrap:anywhere;line-height:1.6;font-size:13px';
    const agregar = texto => { const p = document.createElement('div'); p.textContent = texto; info.append(p); };
    const a = r.datos_antes || {}, d = r.datos_despues || {};
    const dato = r.accion === 'DELETE' ? a : d;
    const trabajador = usuarios.find(u => Number(u.id) === Number(dato.id_usuario));
    if (r.tabla === 'registros_turnos') agregar('Trabajador: ' + (trabajador?.nombre || 'ID ' + dato.id_usuario));
    if (r.tabla === 'usuarios') agregar('Usuario: ' + (dato.nombre || dato.usuario || 'ID ' + r.registro_id));
    const actor = r.actor && r.actor !== 'sistema/no identificado' ? r.actor : 'No identificado (operación registrada por el sistema)';
    agregar('Responsable: ' + actor);
    const nombres = {estado:'Estado', fecha_inicio:'Fecha', hora_entrada:'Entrada', hora_salida:'Salida', horas_totales:'Horas trabajadas', tarifa:'Tarifa', nombre:'Nombre', usuario:'Usuario', cargo:'Cargo', tipo_pago:'Tipo de pago', origen:'Origen'};
    if (d.pin_modificado) agregar('PIN actualizado (valor oculto)');
    const ignorar = new Set(['pin','pin_modificado','created_at','id','numero_reporte']);
    const keys = [...new Set([...Object.keys(a), ...Object.keys(d)])].filter(k => !ignorar.has(k) && JSON.stringify(a[k]) !== JSON.stringify(d[k]));
    for (const k of keys) {
      const titulo = nombres[k] || k.replace(/_/g,' ');
      if (r.accion === 'INSERT') agregar(titulo + ': ' + tcAuditValor(k,d[k]));
      else if (r.accion === 'DELETE') agregar(titulo + ': ' + tcAuditValor(k,a[k]));
      else agregar(titulo + ': ' + tcAuditValor(k,a[k]) + ' → ' + tcAuditValor(k,d[k]));
    }
    card.append(sum,info);
    out.append(card);
  }
}
