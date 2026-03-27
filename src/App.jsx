import { useState, useEffect, useCallback, useRef } from "react"
import { guardarDoc, borrarDoc, escucharColeccion } from "./firebase.js"

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const ACTIVIDADES = [
  { id: "kyrios", nombre: "Kyrios en mi Ciudad", color: "#7C3AED", icon: "🏙️" },
  { id: "economia", nombre: "Economía de Reino", color: "#0369A1", icon: "💰" },
  { id: "entrenamiento", nombre: "Entrenamiento a Ministerios", color: "#065F46", icon: "📚" },
  { id: "botin", nombre: "Toma de Botín", color: "#92400E", icon: "⚔️" },
  { id: "imparticion", nombre: "Impartición al Liderazgo", color: "#831843", icon: "🎯" },
  { id: "gabinete", nombre: "Trabajo de Gabinete", color: "#1E40AF", icon: "🏛️" },
  { id: "culto", nombre: "Culto de Milagros", color: "#065F46", icon: "✨" },
]

const COORDINACIONES = [
  { id: "general", nombre: "Coordinación General", color: "#374151" },
  { id: "alabanza", nombre: "Alabanza", color: "#7C3AED" },
  { id: "cobertura", nombre: "Cobertura", color: "#DC2626" },
  { id: "cosecha", nombre: "Cosecha", color: "#047857" },
  { id: "danza", nombre: "Danza", color: "#DB2777" },
  { id: "evangelismo", nombre: "Evangelismo", color: "#D97706" },
  { id: "intercesion", nombre: "Intercesión", color: "#6D28D9" },
  { id: "multimedia", nombre: "Multimedia", color: "#0369A1" },
  { id: "sonido", nombre: "Sonido e Infraestructura", color: "#374151" },
  { id: "testimonios", nombre: "Testimonios", color: "#065F46" },
  { id: "ujier", nombre: "Ujier", color: "#92400E" },
]

const FASES = [
  { id: "planificacion", nombre: "Planificación", color: "#3B82F6" },
  { id: "ejecucion", nombre: "Ejecución", color: "#F59E0B" },
  { id: "reporte", nombre: "Reporte y Evaluación", color: "#10B981" },
]

const CIUDADES_DEFAULT = [
  "Buenos Aires","Córdoba","Rosario","Mendoza","La Plata",
  "San Miguel de Tucumán","Mar del Plata","Salta","Santa Fe","San Juan",
  "Resistencia","Santiago del Estero","Corrientes","Posadas","Neuquén",
  "Bahía Blanca","San Salvador de Jujuy","Paraná","Formosa","Río Cuarto",
  "Comodoro Rivadavia","Río Gallegos","Ushuaia","Rawson","Viedma",
  "Santa Rosa","San Luis","Catamarca","La Rioja","San Fernando del Valle",
  "General Roca","Trelew","Puerto Madryn","Bariloche","Tandil",
  "Azul","Olavarría","Junín","Pergamino","Zárate","Campana","Luján"
]

// ─── UTILS ────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)
const formatFecha = d => d ? new Date(d + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) : "—"
const diasHasta = fecha => {
  if (!fecha) return null
  return Math.ceil((new Date(fecha + "T12:00:00") - new Date()) / 86400000)
}
const getEstadoColor = d => d === null ? "#9CA3AF" : d < 0 ? "#EF4444" : d <= 7 ? "#F59E0B" : "#10B981"
const calcFechaTarea = (fechaEvento, diasAntes) => {
  if (!fechaEvento) return null
  const d = new Date(fechaEvento + "T12:00:00")
  d.setDate(d.getDate() - diasAntes)
  return d.toISOString().slice(0, 10)
}

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────
function Badge({ color, text, small }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: small ? "1px 7px" : "2px 10px",
      fontSize: small ? 10 : 11, fontWeight: 600, whiteSpace: "nowrap", lineHeight: 1.6
    }}>{text}</span>
  )
}

function Card({ children, style, onClick, hover }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: 12, padding: "1rem 1.25rem",
        cursor: onClick ? "pointer" : "default",
        transform: hov ? "translateY(-2px)" : "none",
        transition: "transform .15s", ...style
      }}>{children}</div>
  )
}

function Btn({ children, onClick, variant = "default", small, disabled, style }) {
  const colors = {
    default: { bg: "transparent", color: "var(--color-text-primary)", border: "var(--color-border-secondary)" },
    primary: { bg: "#7C3AED", color: "#fff", border: "#7C3AED" },
    danger: { bg: "#DC2626", color: "#fff", border: "#DC2626" },
    ghost: { bg: "transparent", color: "var(--color-text-secondary)", border: "transparent" },
  }
  const c = colors[variant] || colors.default
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: c.bg, color: c.color, border: `0.5px solid ${c.border}`,
      borderRadius: 8, padding: small ? "4px 10px" : "7px 16px",
      fontSize: small ? 12 : 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, transition: "opacity .15s", ...style
    }}>{children}</button>
  )
}

function Input({ value, onChange, placeholder, type = "text", style }) {
  return (
    <input type={type} value={value || ""} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} style={{
        width: "100%", padding: "7px 10px", fontSize: 13, borderRadius: 8,
        border: "0.5px solid var(--color-border-secondary)",
        background: "var(--color-background-primary)",
        color: "var(--color-text-primary)", ...style
      }} />
  )
}

function Sel({ value, onChange, options, style }) {
  return (
    <select value={value || ""} onChange={e => onChange(e.target.value)} style={{
      width: "100%", padding: "7px 10px", fontSize: 13, borderRadius: 8,
      border: "0.5px solid var(--color-border-secondary)",
      background: "var(--color-background-primary)",
      color: "var(--color-text-primary)", ...style
    }}>
      <option value="">— Seleccionar —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Modal({ title, children, onClose, wide }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--color-background-primary)", borderRadius: 14,
        width: wide ? 720 : 520, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto",
        border: "0.5px solid var(--color-border-tertiary)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "1rem 1.25rem", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <span style={{ fontWeight: 500, fontSize: 15 }}>{title}</span>
          <Btn onClick={onClose} variant="ghost" small>✕</Btn>
        </div>
        <div style={{ padding: "1rem 1.25rem" }}>{children}</div>
      </div>
    </div>
  )
}

function ProgressBar({ value, color = "#7C3AED" }) {
  return (
    <div style={{ background: "var(--color-border-tertiary)", borderRadius: 4, height: 6, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color,
        height: "100%", borderRadius: 4, transition: "width .3s" }} />
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid var(--color-border-tertiary)",
        borderTopColor: "#7C3AED", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Cargando datos…</span>
    </div>
  )
}

// ─── VISTAS ───────────────────────────────────────────────────────────────────

function Dashboard({ ciudades, eventos }) {
  const eventosProximos = eventos.filter(e => {
    const d = diasHasta(e.fecha); return d !== null && d >= 0 && d <= 30
  }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

  const alertas = eventos.filter(e => {
    const d = diasHasta(e.fecha); return d !== null && d >= -7 && d <= 7
  })

  const tareasTotal = eventos.reduce((s, e) => s + (e.tareas?.length || 0), 0)
  const tareasComp = eventos.reduce((s, e) => s + (e.tareas?.filter(t => t.completada).length || 0), 0)
  const avance = tareasTotal > 0 ? Math.round(tareasComp / tareasTotal * 100) : 0
  const ciudadesActivas = new Set(eventos.map(e => e.ciudadId)).size

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 500, fontSize: 20, marginBottom: 4 }}>Panel de Control</h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Agenda 2026 — Visión macro</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Ciudades con eventos", value: ciudadesActivas, sub: `de ${ciudades.filter(c => c.activa).length} activas`, color: "#7C3AED" },
          { label: "Eventos programados", value: eventos.length, sub: `${eventosProximos.length} en 30 días`, color: "#0369A1" },
          { label: "Tareas totales", value: tareasTotal, sub: `${tareasComp} completadas`, color: "#065F46" },
          { label: "Avance general", value: avance + "%", sub: "completado", color: "#D97706" },
        ].map((k, i) => (
          <div key={i} style={{ background: "var(--color-background-secondary)", borderRadius: 10,
            padding: "1rem", borderLeft: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 500, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {alertas.length > 0 && (
        <Card style={{ marginBottom: 20, borderLeft: "3px solid #EF4444" }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 12, color: "#EF4444" }}>
            🚨 Alertas — Esta semana ({alertas.length})
          </div>
          {alertas.map(ev => {
            const ciudad = ciudades.find(c => c.id === ev.ciudadId)
            const act = ACTIVIDADES.find(a => a.id === ev.actividadId)
            const d = diasHasta(ev.fecha)
            return (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12,
                padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                <Badge color={d < 0 ? "#EF4444" : "#F59E0B"} text={d < 0 ? `Hace ${-d}d` : d === 0 ? "Hoy" : `En ${d}d`} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{ciudad?.nombre || "?"}</span>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{act?.icon} {act?.nombre}</span>
                <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginLeft: "auto" }}>{formatFecha(ev.fecha)}</span>
              </div>
            )
          })}
        </Card>
      )}

      <Card>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 12 }}>
          📅 Próximos 30 días ({eventosProximos.length} eventos)
        </div>
        {eventosProximos.length === 0
          ? <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>No hay eventos en los próximos 30 días.</p>
          : eventosProximos.map(ev => {
              const ciudad = ciudades.find(c => c.id === ev.ciudadId)
              const act = ACTIVIDADES.find(a => a.id === ev.actividadId)
              const d = diasHasta(ev.fecha)
              const tareas = ev.tareas || []
              const pct = tareas.length > 0 ? Math.round(tareas.filter(t => t.completada).length / tareas.length * 100) : 0
              return (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)",
                  marginBottom: 8 }}>
                  <div style={{ width: 50, textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: getEstadoColor(d) }}>{d}</div>
                    <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>días</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{ciudad?.nombre}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                      {act?.icon} {act?.nombre} · {formatFecha(ev.fecha)}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <ProgressBar value={pct} color={act?.color} />
                      <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2 }}>{pct}% completado</div>
                    </div>
                  </div>
                </div>
              )
            })
        }
      </Card>
    </div>
  )
}

function CiudadesView({ ciudades, onSave, onDelete }) {
  const [search, setSearch] = useState("")
  const [editando, setEditando] = useState(null)

  const lista = ciudades.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 500, fontSize: 20 }}>Ciudades ({ciudades.length})</h2>
        <Btn variant="primary" onClick={() => setEditando({ nombre: "", pastor: "", email: "", activa: true })}>
          + Nueva ciudad
        </Btn>
      </div>
      <Input value={search} onChange={setSearch} placeholder="Buscar…" style={{ marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 10 }}>
        {lista.map(c => (
          <Card key={c.id} hover onClick={() => setEditando({ ...c })}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{c.nombre}</div>
                {c.pastor && <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>Pbr. {c.pastor}</div>}
                {c.email && <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{c.email}</div>}
              </div>
              <Badge color={c.activa ? "#10B981" : "#9CA3AF"} text={c.activa ? "Activa" : "Inactiva"} small />
            </div>
          </Card>
        ))}
      </div>

      {editando && (
        <Modal title={editando.id ? "Editar Ciudad" : "Nueva Ciudad"} onClose={() => setEditando(null)}>
          <FormCiudad ciudad={editando}
            onSave={d => { onSave(d); setEditando(null) }}
            onDelete={editando.id ? () => { onDelete(editando.id); setEditando(null) } : null} />
        </Modal>
      )}
    </div>
  )
}

function FormCiudad({ ciudad, onSave, onDelete }) {
  const [f, setF] = useState({ ...ciudad })
  const s = k => v => setF(p => ({ ...p, [k]: v }))
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Nombre *</label>
      <Input value={f.nombre} onChange={s("nombre")} placeholder="Ej: Córdoba" />
      <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Pastor / Responsable</label>
      <Input value={f.pastor} onChange={s("pastor")} placeholder="Nombre completo" />
      <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Email</label>
      <Input value={f.email} onChange={s("email")} type="email" placeholder="pastor@iglesia.com" />
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
        <input type="checkbox" checked={!!f.activa} onChange={e => s("activa")(e.target.checked)} />
        Ciudad activa
      </label>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Btn variant="primary" onClick={() => onSave(f)} disabled={!f.nombre} style={{ flex: 1 }}>Guardar</Btn>
        {onDelete && <Btn variant="danger" onClick={onDelete}>Eliminar</Btn>}
      </div>
    </div>
  )
}

function TareasModeloView({ tareasModelo, onSave, onDelete }) {
  const [editando, setEditando] = useState(null)
  const [filtro, setFiltro] = useState("")

  const lista = tareasModelo.filter(t => !filtro || t.coordinacionId === filtro)

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontWeight: 500, fontSize: 20 }}>Tareas Modelo</h2>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
            Se replican en todas las ciudades al crear un evento
          </p>
        </div>
        <Btn variant="primary" onClick={() => setEditando({ nombre: "", coordinacionId: "", actividadId: "", fase: "planificacion", diasAntes: 30, descripcion: "" })}>
          + Nueva tarea
        </Btn>
      </div>

      <Sel value={filtro} onChange={setFiltro}
        options={COORDINACIONES.map(c => ({ value: c.id, label: c.nombre }))}
        style={{ marginBottom: 16, maxWidth: 300 }} />

      {COORDINACIONES.filter(c => !filtro || c.id === filtro).map(coord => {
        const tf = lista.filter(t => t.coordinacionId === coord.id)
        if (!tf.length) return null
        return (
          <div key={coord.id} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: coord.color }} />
              <span style={{ fontWeight: 500, fontSize: 14, color: coord.color }}>{coord.nombre}</span>
              <Badge color={coord.color} text={`${tf.length}`} small />
            </div>
            {tf.map(t => {
              const act = ACTIVIDADES.find(a => a.id === t.actividadId)
              const fase = FASES.find(f => f.id === t.fase)
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)",
                  background: "var(--color-background-primary)", marginBottom: 4 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{t.nombre}</div>
                    {t.descripcion && <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{t.descripcion}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    {act && <Badge color={act.color} text={act.icon} small />}
                    <Badge color={fase?.color || "#9CA3AF"} text={fase?.nombre || t.fase} small />
                    <Badge color="#6B7280" text={`${t.diasAntes}d`} small />
                  </div>
                  <Btn onClick={() => setEditando({ ...t })} small>Editar</Btn>
                </div>
              )
            })}
          </div>
        )
      })}

      {lista.length === 0 && (
        <Card><p style={{ color: "var(--color-text-secondary)", fontSize: 13, textAlign: "center", padding: "2rem" }}>
          No hay tareas modelo. Creá la primera.
        </p></Card>
      )}

      {editando && (
        <Modal title={editando.id ? "Editar Tarea" : "Nueva Tarea Modelo"} onClose={() => setEditando(null)}>
          <FormTareaModelo tarea={editando}
            onSave={d => { onSave(d); setEditando(null) }}
            onDelete={editando.id ? () => { onDelete(editando.id); setEditando(null) } : null} />
        </Modal>
      )}
    </div>
  )
}

function FormTareaModelo({ tarea, onSave, onDelete }) {
  const [f, setF] = useState({ ...tarea })
  const s = k => v => setF(p => ({ ...p, [k]: v }))
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Nombre *</label>
      <Input value={f.nombre} onChange={s("nombre")} placeholder="Ej: Confirmar equipo de sonido" />
      <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Descripción</label>
      <Input value={f.descripcion} onChange={s("descripcion")} placeholder="Detalle opcional" />
      <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Coordinación *</label>
      <Sel value={f.coordinacionId} onChange={s("coordinacionId")}
        options={COORDINACIONES.map(c => ({ value: c.id, label: c.nombre }))} />
      <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Actividad *</label>
      <Sel value={f.actividadId} onChange={s("actividadId")}
        options={ACTIVIDADES.map(a => ({ value: a.id, label: a.icon + " " + a.nombre }))} />
      <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Fase *</label>
      <Sel value={f.fase} onChange={s("fase")}
        options={FASES.map(f => ({ value: f.id, label: f.nombre }))} />
      <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Días antes del evento</label>
      <Input value={f.diasAntes} onChange={v => s("diasAntes")(parseInt(v) || 0)} type="number" />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Btn variant="primary" onClick={() => onSave(f)}
          disabled={!f.nombre || !f.coordinacionId || !f.actividadId} style={{ flex: 1 }}>Guardar</Btn>
        {onDelete && <Btn variant="danger" onClick={onDelete}>Eliminar</Btn>}
      </div>
    </div>
  )
}

function EventosView({ ciudades, eventos, tareasModelo, onAddEvento, onUpdateEvento, onDeleteEvento }) {
  const [showNuevo, setShowNuevo] = useState(false)
  const [filtroAct, setFiltroAct] = useState("")
  const [filtroCiudad, setFiltroCiudad] = useState("")
  const [detalleId, setDetalleId] = useState(null)

  const lista = eventos
    .filter(e => (!filtroAct || e.actividadId === filtroAct) && (!filtroCiudad || e.ciudadId === filtroCiudad))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

  const crearEventos = datos => {
    datos.actividadesSeleccionadas.forEach(({ actividadId, fecha }) => {
      const tareas = tareasModelo
        .filter(t => t.actividadId === actividadId)
        .map(t => ({ ...t, id: uid(), modeloId: t.id, completada: false, responsableCustom: "", notas: "", fechaProgramada: calcFechaTarea(fecha, t.diasAntes) }))
      onAddEvento({ id: uid(), ciudadId: datos.ciudadId, actividadId, fecha, tareas })
    })
    setShowNuevo(false)
  }

  const detalleEvento = eventos.find(e => e.id === detalleId)

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 500, fontSize: 20 }}>Eventos por Ciudad</h2>
        <Btn variant="primary" onClick={() => setShowNuevo(true)}>+ Programar evento</Btn>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Sel value={filtroAct} onChange={setFiltroAct}
          options={ACTIVIDADES.map(a => ({ value: a.id, label: a.icon + " " + a.nombre }))}
          style={{ flex: 1, minWidth: 180 }} />
        <Sel value={filtroCiudad} onChange={setFiltroCiudad}
          options={ciudades.map(c => ({ value: c.id, label: c.nombre }))}
          style={{ flex: 1, minWidth: 180 }} />
      </div>

      {lista.length === 0
        ? <Card><p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13, padding: "2rem" }}>
            No hay eventos. Programá el primero.
          </p></Card>
        : lista.map(ev => {
            const ciudad = ciudades.find(c => c.id === ev.ciudadId)
            const act = ACTIVIDADES.find(a => a.id === ev.actividadId)
            const d = diasHasta(ev.fecha)
            const tareas = ev.tareas || []
            const pct = tareas.length > 0 ? Math.round(tareas.filter(t => t.completada).length / tareas.length * 100) : 0
            return (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 10, border: "0.5px solid var(--color-border-tertiary)",
                background: "var(--color-background-primary)", cursor: "pointer", marginBottom: 8 }}
                onClick={() => setDetalleId(ev.id)}>
                <div style={{ width: 4, height: 40, borderRadius: 2, background: act?.color || "#9CA3AF" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{ciudad?.nombre}</span>
                    <Badge color={act?.color || "#9CA3AF"} text={(act?.icon || "") + " " + (act?.nombre || "?")} small />
                    {d !== null && <Badge color={getEstadoColor(d)} text={d < 0 ? `Hace ${-d}d` : d === 0 ? "Hoy" : `En ${d}d`} small />}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 3 }}>
                    {formatFecha(ev.fecha)} · {tareas.length} tareas
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <ProgressBar value={pct} color={act?.color} />
                    <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{pct}%</span>
                  </div>
                </div>
              </div>
            )
          })
      }

      {showNuevo && (
        <Modal title="Programar Evento" onClose={() => setShowNuevo(false)} wide>
          <NuevoEventoForm ciudades={ciudades} tareasModelo={tareasModelo} onCrear={crearEventos} />
        </Modal>
      )}

      {detalleEvento && (
        <Modal title="Detalle del Evento" onClose={() => setDetalleId(null)} wide>
          <EventoDetalle evento={detalleEvento} ciudades={ciudades}
            onUpdate={onUpdateEvento}
            onDelete={() => { onDeleteEvento(detalleEvento.id); setDetalleId(null) }} />
        </Modal>
      )}
    </div>
  )
}

function NuevoEventoForm({ ciudades, tareasModelo, onCrear }) {
  const [ciudadId, setCiudadId] = useState("")
  const [sel, setSel] = useState(ACTIVIDADES.map(a => ({ actividadId: a.id, seleccionada: false, fecha: "" })))
  const toggle = id => setSel(s => s.map(a => a.actividadId === id ? { ...a, seleccionada: !a.seleccionada } : a))
  const setFecha = (id, f) => setSel(s => s.map(a => a.actividadId === id ? { ...a, fecha: f } : a))
  const validas = sel.filter(a => a.seleccionada && a.fecha)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Ciudad *</label>
        <Sel value={ciudadId} onChange={setCiudadId}
          options={ciudades.filter(c => c.activa).map(c => ({ value: c.id, label: c.nombre + (c.pastor ? ` — Pbr. ${c.pastor}` : "") }))} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 10 }}>Actividades y fechas *</div>
        {ACTIVIDADES.map(act => {
          const s = sel.find(a => a.actividadId === act.id)
          const n = tareasModelo.filter(t => t.actividadId === act.id).length
          return (
            <div key={act.id} style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <input type="checkbox" checked={s?.seleccionada || false} onChange={() => toggle(act.id)} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{act.icon} {act.nombre}</span>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: 6 }}>{n} tareas</span>
              </div>
              {s?.seleccionada && (
                <input type="date" value={s.fecha || ""} onChange={e => setFecha(act.id, e.target.value)}
                  style={{ padding: "4px 8px", fontSize: 12, borderRadius: 6,
                    border: "0.5px solid var(--color-border-secondary)",
                    background: "var(--color-background-primary)", color: "var(--color-text-primary)" }} />
              )}
            </div>
          )
        })}
      </div>
      <Btn variant="primary" disabled={!ciudadId || validas.length === 0}
        onClick={() => onCrear({ ciudadId, actividadesSeleccionadas: validas })}>
        Crear {validas.length} evento(s)
      </Btn>
    </div>
  )
}

function EventoDetalle({ evento, ciudades, onUpdate, onDelete }) {
  const ciudad = ciudades.find(c => c.id === evento.ciudadId)
  const act = ACTIVIDADES.find(a => a.id === evento.actividadId)
  const [filtroFase, setFiltroFase] = useState("")
  const [filtroCoord, setFiltroCoord] = useState("")

  const updateTarea = (tareaId, cambios) => {
    const tareas = (evento.tareas || []).map(t => t.id === tareaId ? { ...t, ...cambios } : t)
    onUpdate({ ...evento, tareas })
  }

  const addTareaLocal = () => {
    const nombre = prompt("Nombre de la tarea local:")
    if (!nombre) return
    const tareas = [...(evento.tareas || []), {
      id: uid(), nombre, coordinacionId: "general", actividadId: evento.actividadId,
      fase: "planificacion", completada: false, responsableCustom: "", notas: "",
      diasAntes: 0, fechaProgramada: evento.fecha, esLocal: true
    }]
    onUpdate({ ...evento, tareas })
  }

  const imprimirChecklist = () => {
    const win = window.open("", "_blank")
    if (!win) return
    const tareas = evento.tareas || []
    const rows = tareas.map(t => {
      const coord = COORDINACIONES.find(c => c.id === t.coordinacionId)
      const fase = FASES.find(f => f.id === t.fase)
      return `<tr>
        <td style="padding:6px;border:1px solid #ccc;font-size:12px;text-align:center">☐</td>
        <td style="padding:6px;border:1px solid #ccc;font-size:12px">${t.nombre}</td>
        <td style="padding:6px;border:1px solid #ccc;font-size:12px">${fase?.nombre || ""}</td>
        <td style="padding:6px;border:1px solid #ccc;font-size:12px">${coord?.nombre || ""}</td>
        <td style="padding:6px;border:1px solid #ccc;font-size:12px">${t.responsableCustom || "Coordinador"}</td>
        <td style="padding:6px;border:1px solid #ccc;font-size:12px">${t.fechaProgramada ? new Date(t.fechaProgramada + "T12:00:00").toLocaleDateString("es-AR") : ""}</td>
      </tr>`
    }).join("")
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Checklist</title></head><body>
      <h2>Checklist — ${ciudad?.nombre} | ${act?.nombre}</h2>
      <p><strong>Fecha:</strong> ${new Date(evento.fecha + "T12:00:00").toLocaleDateString("es-AR")}</p>
      ${ciudad?.pastor ? `<p><strong>Pastor:</strong> ${ciudad.pastor}</p>` : ""}
      <table style="width:100%;border-collapse:collapse;margin-top:12px">
        <thead><tr style="background:#f3f4f6">
          <th style="padding:6px;border:1px solid #ccc;font-size:12px">✓</th>
          <th style="padding:6px;border:1px solid #ccc;font-size:12px;text-align:left">Tarea</th>
          <th style="padding:6px;border:1px solid #ccc;font-size:12px;text-align:left">Fase</th>
          <th style="padding:6px;border:1px solid #ccc;font-size:12px;text-align:left">Coordinación</th>
          <th style="padding:6px;border:1px solid #ccc;font-size:12px;text-align:left">Responsable</th>
          <th style="padding:6px;border:1px solid #ccc;font-size:12px;text-align:left">Fecha prog.</th>
        </tr></thead><tbody>${rows}</tbody>
      </table>
    </body></html>`)
    win.document.close()
    win.print()
  }

  const tareasFiltradas = (evento.tareas || []).filter(t =>
    (!filtroFase || t.fase === filtroFase) && (!filtroCoord || t.coordinacionId === filtroCoord))

  const gcUrl = t => {
    if (!evento.fecha) return "#"
    const ymd = evento.fecha.replace(/-/g, "")
    const text = encodeURIComponent(`[${act?.nombre}] ${t.nombre} — ${ciudad?.nombre}`)
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${ymd}/${ymd}`
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16,
        padding: "10px 12px", background: "var(--color-background-secondary)", borderRadius: 8 }}>
        <div style={{ width: 5, height: 40, borderRadius: 2, background: act?.color }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }}>{ciudad?.nombre} — {act?.icon} {act?.nombre}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{formatFecha(evento.fecha)}</div>
        </div>
        <Btn variant="danger" small onClick={() => window.confirm("¿Eliminar este evento?") && onDelete()}>Eliminar</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Sel value={filtroFase} onChange={setFiltroFase}
          options={FASES.map(f => ({ value: f.id, label: f.nombre }))} style={{ flex: 1, minWidth: 160 }} />
        <Sel value={filtroCoord} onChange={setFiltroCoord}
          options={COORDINACIONES.map(c => ({ value: c.id, label: c.nombre }))} style={{ flex: 1, minWidth: 160 }} />
      </div>

      {FASES.filter(f => !filtroFase || f.id === filtroFase).map(fase => {
        const tf = tareasFiltradas.filter(t => t.fase === fase.id)
        if (!tf.length) return null
        return (
          <div key={fase.id} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: fase.color, marginBottom: 8,
              padding: "4px 10px", background: fase.color + "15", borderRadius: 6, display: "inline-block" }}>
              {fase.nombre}
            </div>
            {tf.map(t => {
              const coord = COORDINACIONES.find(c => c.id === t.coordinacionId)
              return (
                <div key={t.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px",
                  borderRadius: 8, marginBottom: 4, border: "0.5px solid var(--color-border-tertiary)",
                  background: t.completada ? "var(--color-background-secondary)" : "var(--color-background-primary)",
                  opacity: t.completada ? 0.75 : 1 }}>
                  <input type="checkbox" checked={t.completada} onChange={() => updateTarea(t.id, { completada: !t.completada })}
                    style={{ marginTop: 3 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, textDecoration: t.completada ? "line-through" : "none" }}>{t.nombre}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                      {coord && <Badge color={coord.color} text={coord.nombre} small />}
                      {t.esLocal && <Badge color="#9CA3AF" text="Local" small />}
                      {t.fechaProgramada && <Badge color="#6B7280" text={formatFecha(t.fechaProgramada)} small />}
                    </div>
                    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                      <input value={t.responsableCustom || ""} placeholder="Responsable personalizado (ej: Pastor Local)"
                        onChange={e => updateTarea(t.id, { responsableCustom: e.target.value })}
                        style={{ width: "100%", padding: "4px 8px", fontSize: 11, borderRadius: 6,
                          border: "0.5px solid var(--color-border-tertiary)",
                          background: "var(--color-background-primary)", color: "var(--color-text-primary)" }} />
                      <input value={t.notas || ""} placeholder="Notas…"
                        onChange={e => updateTarea(t.id, { notas: e.target.value })}
                        style={{ width: "100%", padding: "4px 8px", fontSize: 11, borderRadius: 6,
                          border: "0.5px solid var(--color-border-tertiary)",
                          background: "var(--color-background-primary)", color: "var(--color-text-primary)" }} />
                    </div>
                  </div>
                  <a href={gcUrl(t)} target="_blank" rel="noopener noreferrer"
                    title="Google Calendar" style={{ fontSize: 16, textDecoration: "none", opacity: 0.6 }}>📅</a>
                </div>
              )
            })}
          </div>
        )
      })}

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <Btn onClick={addTareaLocal} small>+ Tarea local</Btn>
        <Btn onClick={imprimirChecklist} small>🖨️ Imprimir checklist</Btn>
      </div>
    </div>
  )
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true)
  const [ciudades, setCiudades] = useState([])
  const [tareasModelo, setTareasModelo] = useState([])
  const [eventos, setEventos] = useState([])
  const [vista, setVista] = useState("dashboard")
  const inicializado = useRef(false)

  // Escuchar cambios en tiempo real desde Firebase
  useEffect(() => {
    let unsubs = []
    Promise.all([
      new Promise(res => unsubs.push(escucharColeccion("ciudades", data => { setCiudades(data); res() }))),
      new Promise(res => unsubs.push(escucharColeccion("tareasModelo", data => { setTareasModelo(data); res() }))),
      new Promise(res => unsubs.push(escucharColeccion("eventos", data => { setEventos(data); res() }))),
    ]).then(async () => {
      if (!inicializado.current) {
        inicializado.current = true
        // Si no hay ciudades, cargar las predeterminadas
        const snap = await import("firebase/firestore").then(m =>
          m.getDocs(m.collection(import("./firebase.js").then(f => f.db), "ciudades"))
        ).catch(() => ({ empty: false }))
        setLoading(false)
      }
    })
    return () => unsubs.forEach(u => u())
  }, [])

  // Carga inicial de ciudades si la base está vacía
  useEffect(() => {
    if (!loading && ciudades.length === 0) {
      const defaults = CIUDADES_DEFAULT.map((nombre, i) => ({
        id: `ciudad_${i}`, nombre, pastor: "", email: "", activa: true
      }))
      Promise.all(defaults.map(c => guardarDoc("ciudades", c.id, c)))
    }
  }, [loading, ciudades.length])

  useEffect(() => { if (loading) { const t = setTimeout(() => setLoading(false), 3000); return () => clearTimeout(t) } }, [loading])

  // Handlers para ciudades
  const saveCiudad = async c => {
    const doc = c.id ? c : { ...c, id: uid(), activa: true }
    await guardarDoc("ciudades", doc.id, doc)
  }
  const deleteCiudad = async id => await import("firebase/firestore").then(m =>
    m.deleteDoc(m.doc(import("./firebase.js").then(f => f.db), "ciudades", id))
  ).catch(() => borrarDoc("ciudades", id))

  // Handlers para tareas modelo
  const saveTarea = async t => {
    const doc = t.id ? t : { ...t, id: uid() }
    await guardarDoc("tareasModelo", doc.id, doc)
  }
  const deleteTarea = async id => { try { await borrarDoc("tareasModelo", id) } catch {} }

  // Handlers para eventos
  const addEvento = async ev => { await guardarDoc("eventos", ev.id, ev) }
  const updateEvento = async ev => { await guardarDoc("eventos", ev.id, ev) }
  const deleteEvento = async id => { try { await borrarDoc("eventos", id) } catch {} }

  const nav = [
    { id: "dashboard", label: "Panel", icon: "📊" },
    { id: "eventos", label: "Eventos", icon: "📅" },
    { id: "ciudades", label: "Ciudades", icon: "🏙️" },
    { id: "tareas", label: "Tareas Modelo", icon: "📋" },
  ]

  if (loading) return <Spinner />

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 12, background: "var(--color-background-primary)",
        position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#7C3AED",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#fff" }}>✝</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Agenda 2026</div>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>Seguimiento</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setVista(n.id)} style={{
              padding: "6px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 500,
              cursor: "pointer", background: vista === n.id ? "#7C3AED" : "transparent",
              color: vista === n.id ? "#fff" : "var(--color-text-secondary)", transition: "all .15s"
            }}>{n.icon} {n.label}</button>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-text-tertiary)" }}>
          🔴 en vivo · {ciudades.filter(c => c.activa).length} ciudades
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, padding: "20px 16px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        {vista === "dashboard" && <Dashboard ciudades={ciudades} eventos={eventos} />}
        {vista === "ciudades" && <CiudadesView ciudades={ciudades} onSave={saveCiudad} onDelete={deleteCiudad} />}
        {vista === "tareas" && <TareasModeloView tareasModelo={tareasModelo} onSave={saveTarea} onDelete={deleteTarea} />}
        {vista === "eventos" && <EventosView ciudades={ciudades} eventos={eventos} tareasModelo={tareasModelo}
          onAddEvento={addEvento} onUpdateEvento={updateEvento} onDeleteEvento={deleteEvento} />}
      </div>
    </div>
  )
}
