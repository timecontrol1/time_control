// Ejemplo de datos simulados que recibes de tu backend o API
const datosAsistenciasCrudos = [
    { id: 1, trabajador: "Daniel", fecha: "2026-10-18", entrada: "04:58 p. m.", salida: "02:25 p. m.", minutos: 20 },
    { id: 2, trabajador: "Daniel", fecha: "2026-10-18", entrada: "04:24 p. m.", salida: "04:30 p. m.", minutos: 6 }
    // ... más registros
];

// Función para agrupar por Trabajador y Fecha
function agruparAsistenciasPorDia(registros) {
    const agrupado = {};

    registros.forEach(reg => {
        const clave = `${reg.trabajador}_${reg.fecha}`;
        if (!agrupado[clave]) {
            agrupado[clave] = {
                trabajador: reg.trabajador,
                fecha: reg.fecha,
                totalMinutos: 0,
                sesiones: []
            };
        }
        agrupado[clave].totalMinutos += reg.minutos;
        agrupado[clave].sesiones.push({
            id: reg.id,
            entrada: reg.entrada,
            salida: reg.salida
        });
    });

    return Object.values(agrupado);
}

// Renderizar la tabla principal
function renderizarHistorialGlobal() {
    const tbody = document.getElementById("tabla-historial-cuerpo");
    tbody.innerHTML = "";

    const datosAgrupados = agruparAsistenciasPorDia(datosAsistenciasCrudos);

    datosAgrupados.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.trabajador}</td>
            <td>${item.fecha}</td>
            <td>${item.totalMinutos} min</td>
            <td>
                <button class="btn-detalles" onclick='abrirModalDetalles(${JSON.stringify(item.sesiones)}, "${item.fecha}", "${item.trabajador}")'>
                    Detalles
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Funciones para abrir y cerrar el modal de detalles
function abrirModalDetalles(sesiones, fecha, trabajador) {
    const modal = document.getElementById("modal-detalles");
    const titulo = document.getElementById("titulo-modal-fecha");
    const contenedor = document.getElementById("contenido-sesiones-dia");

    titulo.innerText = `Reporte Detallado (${fecha}) - ${trabajador}`;
    
    let htmlSesiones = "<p>Sesiones del día:</p>";
    sesiones.forEach(s => {
        htmlSesiones += `
            <div class="sesion-card-item">
                <p>Entrada: ${s.entrada}</p>
                <p>Salida: ${s.salida}</p>
                <button class="btn-eliminar-sesion" onclick="eliminarSesion(${s.id})">Eliminar</button>
            </div>
            <hr>
        `;
    });

    contenedor.innerHTML = htmlSesiones;
    modal.style.display = "flex";
}

function cerrarModalDetalles() {
    document.getElementById("modal-detalles").style.display = "none";
}

function eliminarSesion(idSesion) {
    // Lógica para eliminar la sesión específica mediante fetch/axios a tu backend
    console.log("Eliminando sesión con ID:", idSesion);
    alert("Sesión eliminada. Actualiza la vista.");
    cerrarModalDetalles();
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    renderizarHistorialGlobal();
});