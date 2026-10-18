// ==========================================
// DATOS DE EJEMPLO / ESTADO DE LA APLICACIÓN
// ==========================================
let trabajadoresData = [
    { id: 1, nombre: "Ronald", pin: "••••", tipo: "Horas", tarifa: 1.00, cargo: "Operaciones" },
    { id: 2, nombre: "Ricardo", pin: "••••", tipo: "Horas", tarifa: 1.00, cargo: "Operaciones" },
    { id: 3, nombre: "Betzaida", pin: "••••", tipo: "Horas", tarifa: 1.00, cargo: "Operaciones" },
    { id: 4, nombre: "Daniel", pin: "••••", tipo: "Horas", tarifa: 1.00, cargo: "Operaciones" }
];

let asistenciasData = [
    { id: 101, trabajador_id: 4, trabajador: "Daniel", fecha: "2026-10-18", entrada: "04:58 p. m.", salida: "02:25 p. m.", minutos: 20 },
    { id: 102, trabajador_id: 4, trabajador: "Daniel", fecha: "2026-10-18", entrada: "04:24 p. m.", salida: "04:30 p. m.", minutos: 6 },
    { id: 103, trabajador_id: 1, trabajador: "Ronald", fecha: "2026-10-18", entrada: "08:00 a. m.", salida: "04:22 p. m.", minutos: 502 }
];

// ==========================================
// FUNCIONES DE RENDERIZADO PRINCIPAL
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    inicializarFechas();
    renderizarTablaTrabajadores();
    renderizarHistorialGlobal();
});

function inicializarFechas() {
    const hoy = "2026-10-18"; // Fecha actual de referencia del sistema
    const inputDesde = document.getElementById("filtro-desde");
    const inputHasta = document.getElementById("filtro-hasta");
    if(inputDesde) inputDesde.value = hoy;
    if(inputHasta) inputHasta.value = hoy;
}

// 1. Renderizar Listado de Trabajadores & Nómina con cálculos automáticos
function renderizarTablaTrabajadores() {
    const tbody = document.getElementById("tabla-trabajadores-cuerpo");
    if (!tbody) return;
    tbody.innerHTML = "";

    trabajadoresData.forEach(t => {
        // Calcular minutos totales del trabajador en el período
        const totalMinutos = asistenciasData
            .filter(a => a.trabajador_id === t.id)
            .reduce((acc, curr) => acc + curr.minutos, 0);

        const horasDecimal = totalMinutos / 60;
        const totalPagar = (horasDecimal * t.tarifa).toFixed(2);
        
        // Formato legible de horas (ej: "8.37 hrs" o "20 min")
        let textoHoras = totalMinutos < 60 ? `${totalMinutos} min` : `${horasDecimal.toFixed(2)} hrs`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${t.nombre}</strong></td>
            <td>${t.pin} 👁️</td>
            <td>${t.tipo}</td>
            <td>$${t.tarifa.toFixed(2)} / h</td>
            <td>${t.cargo}</td>
            <td>${textoHoras}</td>
            <td style="color: #3fb950; font-weight: bold;">$${totalPagar}</td>
            <td>
                <button class="btn" style="padding: 4px 8px; background: var(--bg-element); border:1px solid var(--border-color); color:var(--text-main);" onclick="editarTrabajador(${t.id})">✏️</button>
                <button class="btn" style="padding: 4px 8px; background: var(--bg-element); border:1px solid var(--border-color); color:var(--accent-red);" onclick="eliminarTrabajador(${t.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 2. Renderizar Historial Global Agrupado (UNA SOLA LÍNEA por día por persona)
function renderizarHistorialGlobal() {
    const tbody = document.getElementById("tabla-historial-cuerpo");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Agrupar asistencias por trabajador y fecha
    const agrupadoMap = {};
    asistenciasData.forEach(a => {
        const clave = `${a.trabajador_id}_${a.fecha}`;
        if (!agrupadoMap[clave]) {
            agrupadoMap[clave] = {
                trabajador_id: a.trabajador_id,
                trabajador: a.trabajador,
                fecha: a.fecha,
                totalMinutos: 0,
                sesiones: []
            };
        }
        agrupadoMap[clave].totalMinutos += a.minutos;
        agrupadoMap[clave].sesiones.push(a);
    });

    const listaAgrupada = Object.values(agrupadoMap);

    if (listaAgrupada.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No hay registros en este período.</td></tr>`;
        return;
    }

    listaAgrupada.forEach(item => {
        let textoHoras = item.totalMinutos < 60 ? `${item.totalMinutos} min` : `${(item.totalMinutos / 60).toFixed(2)} hrs`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.trabajador}</strong></td>
            <td>${item.fecha}</td>
            <td><span style="color: #3fb950;">${textoHoras}</span></td>
            <td>
                <button class="btn btn-primary" style="padding: 4px 10px; font-size: 12px;" onclick='abrirModalDetalles(${JSON.stringify(item.sesiones)}, "${item.fecha}", "${item.trabajador}")'>
                    Detalles
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// CONTROL DE MODALES Y ACCIONES
// ==========================================
function abrirModalDetalles(sesiones, fecha, trabajadorNombre) {
    const modal = document.getElementById("modal-detalles");
    const titulo = document.getElementById("modal-titulo");
    const contenedor = document.getElementById("modal-lista-sesiones");

    titulo.innerText = `Reporte Detallado (${fecha}) - ${trabajadorNombre}`;
    contenedor.innerHTML = "";

    sesiones.forEach(s => {
        const div = document.createElement("div");
        div.className = "sesion-row";
        div.innerHTML = `
            <div>
                <div style="font-size: 13px;"><strong>Entrada:</strong> ${s.entrada}</div>
                <div style="font-size: 13px; color: var(--text-muted);"><strong>Salida:</strong> ${s.salida}</div>
            </div>
            <button class="btn btn-danger" style="padding: 2px 8px; font-size: 11px;" onclick="eliminarSesionIndividual(${s.id})">Eliminar</button>
        `;
        contenedor.appendChild(div);
    });

    modal.style.display = "flex";
}

function cerrarModalDetalles() {
    document.getElementById("modal-detalles").style.display = "none";
}

function eliminarSesionIndividual(idSesion) {
    asistenciasData = asistenciasData.filter(s => s.id !== idSesion);
    cerrarModalDetalles();
    renderizarTablaTrabajadores();
    renderizarHistorialGlobal();
    alert("Sesión eliminada y horas recalculadas con éxito.");
}

function abrirModalTrabajador() {
    alert("Función para agregar nuevo trabajador.");
}

function abrirModalHorasManual() {
    alert("Función para cargar horas manuales.");
}

function generarResumenPago() {
    alert("Generando resumen general de pago...");
}

function editarTrabajador(id) {
    alert(`Editando trabajador ID: ${id}`);
}

function eliminarTrabajador(id) {
    trabajadoresData = trabajadoresData.filter(t => t.id !== id);
    renderizarTablaTrabajadores();
    renderizarHistorialGlobal();
}