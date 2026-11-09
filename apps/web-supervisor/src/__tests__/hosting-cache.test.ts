// Caché del hosting. Con el valor por defecto de Firebase (max-age=3600) el navegador seguía usando el
// index.html ANTERIOR hasta una hora después de cada despliegue y se veían pantallas viejas ya corregidas.
// Las páginas deben revalidarse siempre; solo los archivos con huella en el nombre (/assets/*) pueden
// guardarse un año.

declare const require: (modulo: string) => any
declare const __dirname: string
const fs = require('fs')
const path = require('path')

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../firebase.json'), 'utf8'))
const reglas: { source: string; headers: { key: string; value: string }[] }[] = config.hosting.headers ?? []
const valor = (source: string) => reglas.find((r) => r.source === source)?.headers.find((h) => h.key === 'Cache-Control')?.value

describe('hosting — firebase.json', () => {
  it('todas las páginas (incluidas las rutas internas que reescriben a index.html) se revalidan siempre', () => {
    expect(valor('**')).toBe('no-cache')
  })

  it('los archivos con huella (/assets/**) se cachean un año, inmutables', () => {
    expect(valor('/assets/**')).toMatch(/max-age=31536000.*immutable/)
  })

  it('la regla de /assets/** va DESPUÉS de la general (la última que coincide gana)', () => {
    const i = reglas.findIndex((r) => r.source === '**')
    const j = reglas.findIndex((r) => r.source === '/assets/**')
    expect(j).toBeGreaterThan(i)
  })
})
