// TODO: Página Tabla de pozos - Player 2 (Frontend)
// Paso 1: Tabla con columnas: nombre, producción, estado, última lectura
// Paso 2: Ordenar por producción descendente
// Paso 3: Filter por estado (dropdown)
// Prompt de implementación rápida:
// "Crear TablaPage con React Table, columnas pozos, ordenamiento, filter por estado"
// Entregable:
// - Tabla con 5 columnas
// - Orden clickable en columnas
// - Filter por estado
import React, { useState, useMemo } from 'react'
import { useWells } from '../hooks/useWells'

export default function TablaPage() {
  const { wells } = useWells()
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const pozosFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') return wells
    return wells.filter(w => w.estado === filtroEstado)
  }, [wells, filtroEstado])

  return (
    <div>
      <h1>Tabla de Pozos</h1>
      <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
        <option value="todos">Todos</option>
        <option value="PENDIENTE_SUPERVISOR">Pendientes</option>
        <option value="APROBADA_SUPERVISOR">Aprobados</option>
      </select>
      
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Producción</th>
            <th>Estado</th>
            <th>Última lectura</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pozosFiltrados.map(pozo => (
            <tr key={pozo.id}>
              <td>{pozo.nombre}</td>
              <td>{pozo.produccion} Bls/día</td>
              <td>{pozo.estado}</td>
              <td>{new Date(pozo.ultimaLectura).toLocaleDateString()}</td>
              <td><button>Ver detalle</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
