const $ = (id) => document.getElementById(id);
let token = sessionStorage.getItem("token") || "",
  me = null,
  users = [],
  shifts = [],
  payData = null,
  active = null,
  busy = false;
const tz = "America/Caracas";
const fmt = (s, opts) =>
  s
    ? new Intl.DateTimeFormat("es-VE", { timeZone: tz, ...opts }).format(
        new Date(s)
      )
    : "—";
const time = (s) => fmt(s, { hour: "2-digit", minute: "2-digit" });
const date = (s) =>
  fmt(s, { day: "2-digit", month: "2-digit", year: "numeric" });
const usd = (n) => "$" + Number(n || 0).toFixed(2);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
function notice(s) {
  $("notice").textContent = s;
}
async function api(path, method = "GET", body) {
  const r = await fetch("/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data;
  try {
    data = await r.json();
  } catch {
    throw Error("El servidor no devolvió JSON");
  }
  if (!r.ok) throw Error(data.error || "Error de servidor");
  return data;
}
async function run(fn) {
  if (busy) return;
  busy = true;
  document.querySelectorAll("button").forEach((b) => (b.disabled = true));
  try {
    await fn();
  } catch (e) {
    notice("⚠️ " + e.message);
  } finally {
    busy = false;
    document.querySelectorAll("button").forEach((b) => (b.disabled = false));
  }
}
function show() {
  const logged = !!me;
  $("loginPanel").hidden = logged;
  $("appPanel").hidden = !logged;
  if (!logged) return;
  $("welcome").textContent = "Hola, " + me.nombre;
  $("adminPanel").hidden = me.rol !== "admin";
}
async function login(e) {
  e.preventDefault();
  await run(async () => {
    const d = await api("/login", "POST", {
      usuario: $("username").value,
      pin: $("pin").value,
    });
    token = d.token;
    sessionStorage.setItem("token", token);
    me = d.user;
    $("pin").value = "";
    show();
    await refreshAll();
    notice("Sesión iniciada correctamente");
  });
}
async function restore() {
  if (!token) return;
  try {
    me = (await api("/me")).user;
    show();
    await refreshAll();
  } catch {
    token = "";
    sessionStorage.removeItem("token");
    me = null;
    show();
  }
}
function logout() {
  token = "";
  me = null;
  active = null;
  sessionStorage.removeItem("token");
  show();
  notice("Sesión cerrada");
}
async function refreshAll() {
  active = (await api("/active")).shift;
  renderActive();
  await loadWorker();
  if (me.rol === "admin") await loadAdmin();
}
function renderActive() {
  $("shiftStatus").textContent = active
    ? `🟢 Turno iniciado: ${date(active.hora_entrada)} ${time( active.hora_entrada )}`
    : "Sin turno activo";
  $("shiftButton").textContent = active
    ? "🔴 Finalizar turno"
    : "🟢 Iniciar turno";
  $("shiftButton").className = active ? "danger" : "";
}
async function toggleShift() {
  if (!confirm(active ? "¿Finalizar tu turno?" : "¿Iniciar turno ahora?"))
    return;
  await run(async () => {
    const result = await api(
      active ? "/shifts/finish" : "/shifts/start",
      "POST",
      {}
    );
    await refreshAll();
    notice(
      "Turno guardado en Supabase. " +
        (result.whatsapp?.sent
          ? "WhatsApp enviado."
          : "⚠️ WhatsApp no enviado: " +
            (result.whatsapp?.error || "sin confirmar"))
    );
  });
}
function filters(prefix) {
  return { desde: $(prefix + "From").value, hasta: $(prefix + "To").value };
}
async function loadWorker() {
  const { desde, hasta } = filters("worker");
  const d = await api(`/shifts?desde=${desde}&hasta=${hasta}`);
  const rows = d.shifts;
  $("workerRows").innerHTML =
    rows
      .map(
        (t) =>
          `<tr><td>${esc(t.fecha_inicio)}</td><td>${time( t.hora_entrada )}</td><td>${time(t.hora_salida)}</td><td>${Number( t.horas_totales || 0 ).toFixed(2)}</td></tr>`
      )
      .join("") || '<tr><td colspan="4">Sin registros</td></tr>';
  $("workerTotal").textContent =
    "Horas completadas: " +
    rows.reduce((a, t) => a + Number(t.horas_totales || 0), 0).toFixed(2);
}
async function loadAdmin() {
  const desde = $("from").value,
    hasta = $("to").value;
  const params = `?desde=${desde}&hasta=${hasta}`;
  const [u, s, p, r] = await Promise.all([
    api("/users"),
    api("/shifts" + params),
    api("/payroll" + params),
    api("/reports"),
  ]);
  users = u;
  shifts = s.shifts;
  payData = p;
  renderUsers();
  renderHistory();
  $("reports").innerHTML =
    r.reports
      .map(
        (x) =>
          `<p>Reporte #${x.id} · ${esc(x.fecha_desde)} a ${esc( x.fecha_hasta )} · ${usd(x.total_pagar)}</p>`
      )
      .join("") || '<p class="muted">Sin reportes guardados</p>';
}
function renderUsers() {
  $("userRows").innerHTML = users
    .map((u) => {
      const p = payData.details.find((d) => d.id_usuario === u.id);
      return `<tr><td>${esc(u.nombre)} ${ u.activo ? "" : "(inactivo)" }</td><td>${esc(u.tipo_pago)}</td><td>${usd(u.tarifa)}</td><td>${esc( u.cargo )}</td><td>${Number(p?.horas_totales || 0).toFixed(2)}</td><td>${usd( p?.total_pagar )}</td><td><button data-action="edit" data-id="${u.id}">Editar</button>${ u.activo && u.id !== me.id ? `<button class="danger" data-action="disable" data-id="${u.id}">Desactivar</button>` : "" }</td></tr>`;
    })
    .join("");
}
function renderHistory() {
  const map = new Map();
  for (const t of shifts) {
    const u = users.find((u) => u.id === t.id_usuario),
      key = t.id_usuario + "_" + t.fecha_inicio;
    if (!map.has(key))
      map.set(key, {
        nombre: u?.nombre || "Usuario eliminado",
        fecha: t.fecha_inicio,
        horas: 0,
        open: false,
        turnos: [],
      });
    const a = map.get(key);
    a.horas += Number(t.horas_totales || 0);
    a.open ||= !t.hora_salida;
    a.turnos.push(t);
  }
  $("historyRows").innerHTML =
    [...map.values()]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map(
        (g, i) =>
          `<tr><td>${esc(g.nombre)}</td><td>${esc(g.fecha)}</td><td>${ g.open ? "🟢 En turno · " : "" }${g.horas.toFixed( 2 )} h</td><td><button data-action="detail" data-key="${i}">Detalles</button></td></tr>`
      )
      .join("") || '<tr><td colspan="4">Sin registros</td></tr>';
  window.historyGroups = [...map.values()].sort((a, b) =>
    b.fecha.localeCompare(a.fecha)
  );
}
function modal(title, fields, submit) {
  $("modalTitle").textContent = title;
  $("modalFields").innerHTML = fields;
  $("modalForm").onsubmit = (e) => {
    e.preventDefault();
    run(async () => {
      await submit(new FormData(e.target));
      $("modal").close();
      await refreshAll();
      notice("Cambios guardados en Supabase");
    });
  };
  $("modal").showModal();
}
const field = (label, name, value = "", type = "text", extra = "") =>
  `<label>${label}<input name="${name}" type="${type}" value="${esc( value )}" ${extra}></label>`;
const select = (label, name, options, value) =>
  `<label>${label}<select name="${name}">${options .map( (x) => `<option value="${esc(x)}" ${x === value ? "selected" : ""}>${esc( x )}</option>` ) .join("")}</select></label>`;
function userModal(u) {
  modal(
    u ? "Editar trabajador" : "Nuevo trabajador",
    field("Nombre", "nombre", u?.nombre, "text", "required") +
      field("Usuario", "usuario", u?.usuario, "text", "required") +
      field(
        u ? "Nuevo PIN (vacío = conservar)" : "PIN",
        "pin",
        "",
        "password",
        u ? "" : 'required minlength="4"'
      ) +
      select("Rol", "rol", ["trabajador", "admin"], u?.rol || "trabajador") +
      select(
        "Tipo de pago",
        "tipo_pago",
        ["Horas", "Fijo", "Gasolina"],
        u?.tipo_pago || "Horas"
      ) +
      field(
        "Tarifa",
        "tarifa",
        u?.tarifa ?? 1,
        "number",
        'step="0.01" min="0" required'
      ) +
      field("Cargo", "cargo", u?.cargo || "Operaciones"),
    async (f) => {
      const data = Object.fromEntries(f);
      if (!data.pin) delete data.pin;
      data.tarifa = Number(data.tarifa);
      await api(u ? "/users/" + u.id : "/users", u ? "PATCH" : "POST", data);
    }
  );
}
function manualModal() {
  const options = users
    .filter((u) => u.activo)
    .map((u) => `<option value="${u.id}">${esc(u.nombre)}</option>`)
    .join("");
  modal(
    "Agregar horas manuales",
    `<label>Trabajador<select name="id_usuario">${options}</select></label>` +
      field("Fecha", "fecha", today(), "date", "required") +
      field("Entrada", "entrada", "08:00", "time", "required") +
      field("Salida", "salida", "17:00", "time", "required"),
    async (f) => await api("/shifts/manual", "POST", Object.fromEntries(f))
  );
}
function batchModal() {
  const options = users
    .filter((u) => u.activo)
    .map((u) => `<option value="${u.id}">${esc(u.nombre)}</option>`)
    .join("");
  modal(
    "Carga masiva (una fila por línea)",
    `<label>Trabajador<select name="id_usuario">${options}</select></label><label>Fecha,entrada,salida (ejemplo: 2026-10-18,08:00,17:00)<textarea name="lines" rows="8" required placeholder="2026-10-18,08:00,17:00"></textarea></label>`,
    async (f) => {
      const id = Number(f.get("id_usuario"));
      const rows = String(f.get("lines"))
        .trim()
        .split("\n")
        .map((line) => {
          const [fecha, entrada, salida] = line
            .trim()
            .split(",")
            .map((x) => x.trim());
          return { id_usuario: id, fecha, entrada, salida };
        });
      await api("/shifts/batch", "POST", { rows });
    }
  );
}
function details(i) {
  const g = window.historyGroups[i];
  $("modalTitle").textContent = g.nombre + " · " + g.fecha;
  $("modalFields").innerHTML = g.turnos
    .map(
      (t) =>
        `<p>Entrada: ${time(t.hora_entrada)} · Salida: ${time( t.hora_salida )} · ${Number(t.horas_totales || 0).toFixed(2)} h<br>${ !t.hora_salida ? `<button type="button" data-shift="force" data-id="${t.id}">Forzar salida</button>` : "" }<button type="button" class="danger" data-shift="delete" data-id="${ t.id }">Eliminar registro</button></p>`
    )
    .join("");
  $("modalForm").onsubmit = (e) => {
    e.preventDefault();
    $("modal").close();
  };
  $("modal").showModal();
}
function payrollModal() {
  if (!payData) return;
  const p = payData;
  $("modalTitle").textContent = `Nómina ${p.desde} a ${p.hasta}`;
  $("modalFields").innerHTML =
    p.details
      .map(
        (d) =>
          `<p>${esc(d.nombre)} · ${Number(d.horas_totales).toFixed( 2 )} h · ${usd(d.total_pagar)}</p>`
      )
      .join("") + `<h3>Total: ${usd(p.total)}</h3>`;
  $("modalForm").onsubmit = (e) => {
    e.preventDefault();
    $("modal").close();
  };
  $("modal").showModal();
}
$("loginForm").addEventListener("submit", login);
$("logout").onclick = logout;
$("shiftButton").onclick = toggleShift;
$("workerRefresh").onclick = () => run(loadWorker);
$("refresh").onclick = () => run(loadAdmin);
$("addUser").onclick = () => userModal();
$("addManual").onclick = manualModal;
$("addBatch").onclick = batchModal;
$("payroll").onclick = payrollModal;
$("cancel").onclick = () => $("modal").close();
$("globalRate").onclick = () =>
  modal(
    "Tarifa global por hora",
    field(
      "Nueva tarifa",
      "tarifa",
      "1",
      "number",
      'min="0" step="0.01" required'
    ),
    async (f) =>
      await api("/tarifa-global", "POST", { tarifa: Number(f.get("tarifa")) })
  );
$("savePayroll").onclick = () => {
  if (!confirm("¿Guardar una copia de la nómina calculada?")) return;
  run(async () => {
    await api("/payroll/save", "POST", {
      desde: $("from").value,
      hasta: $("to").value,
    });
    await loadAdmin();
    notice("Reporte de pago guardado");
  });
};
$("userRows").onclick = (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const u = users.find((u) => u.id === Number(b.dataset.id));
  if (b.dataset.action === "edit") userModal(u);
  if (
    b.dataset.action === "disable" &&
    confirm("¿Desactivar trabajador? Se conservará su historial.")
  )
    run(async () => {
      await api("/users/" + u.id, "DELETE");
      await loadAdmin();
      notice("Trabajador desactivado");
    });
};
$("historyRows").onclick = (e) => {
  const b = e.target.closest("button");
  if (b?.dataset.action === "detail") details(Number(b.dataset.key));
};
$("modalFields").onclick = (e) => {
  const b = e.target.closest("[data-shift]");
  if (!b) return;
  const action = b.dataset.shift;
  if (
    !confirm(
      action === "delete"
        ? "¿Eliminar definitivamente este turno?"
        : "¿Forzar salida ahora?"
    )
  )
    return;
  run(async () => {
    const result = await api(
      "/shifts/" + b.dataset.id + (action === "delete" ? "" : "/force-finish"),
      action === "delete" ? "DELETE" : "POST"
    );
    $("modal").close();
    await refreshAll();
    notice(
      action === "delete"
        ? "Turno eliminado"
        : `Turno cerrado. WhatsApp: ${ result.whatsapp?.sent ? "enviado" : "no enviado" }`
    );
  });
};
const now = today();
for (const id of ["workerFrom", "from"]) $(id).value = now;
for (const id of ["workerTo", "to"]) $(id).value = now;
setInterval(
  () =>
    ($("clock").textContent = fmt(new Date(), {
      dateStyle: "short",
      timeStyle: "medium",
    })),
  1000
);
restore();