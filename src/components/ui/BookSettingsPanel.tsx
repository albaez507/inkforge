import type { BookSettings } from '../../types'
import { TRIM_SIZES } from '../../types'
import { useProjectStore } from '../../store/projectStore'

const FONT_FAMILIES = [
  { value: 'Lora',           label: 'Lora (Serif)' },
  { value: 'Merriweather',   label: 'Merriweather (Serif)' },
  { value: 'Palatino Linotype', label: 'Palatino (Serif)' },
  { value: 'Georgia',        label: 'Georgia (Serif)' },
  { value: 'EB Garamond',    label: 'Garamond (Serif)' },
  { value: 'Inter',          label: 'Inter (Sans-serif)' },
  { value: 'Source Sans Pro', label: 'Source Sans (Sans-serif)' },
]

// ── Reusable field components ──────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-ink-600 mb-1.5">{children}</label>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-700 mb-3 pb-1.5 border-b border-parchment-300">
        {title}
      </h3>
      {children}
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  unit: string
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-20 px-2 py-1.5 text-sm border border-parchment-300 rounded-md focus:outline-none focus:ring-1 focus:ring-ink-400 bg-white text-ink-900"
      />
      <span className="text-xs text-ink-400">{unit}</span>
    </div>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────

type Props = {
  projectId: string
  settings: BookSettings
}

export default function BookSettingsPanel({ projectId, settings }: Props) {
  const updateSettings = useProjectStore((s) => s.updateSettings)

  function patch(data: Partial<BookSettings>) {
    updateSettings(projectId, data)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-parchment-100">
      <div className="max-w-[560px] mx-auto py-10 px-8 space-y-8">
        <div>
          <h2 className="text-lg font-serif font-semibold text-ink-900 mb-1">Ajustes del libro</h2>
          <p className="text-xs text-ink-400">Configura el formato de impresión y la tipografía del manuscrito.</p>
        </div>

        {/* Trim size */}
        <Section title="Tamaño de página">
          <FieldLabel>Formato (trim size)</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {TRIM_SIZES.map((size) => {
              const active = settings.trimSize.label === size.label
              return (
                <button
                  key={size.label}
                  onClick={() => patch({ trimSize: size })}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    active
                      ? 'border-ink-700 bg-ink-900 text-white'
                      : 'border-parchment-300 bg-white text-ink-700 hover:border-ink-400 hover:bg-parchment-50'
                  }`}
                >
                  <span className="block font-medium text-xs">
                    {size.width} × {size.height} in
                  </span>
                  <span className={`block text-2xs mt-0.5 ${active ? 'text-parchment-300' : 'text-ink-400'}`}>
                    {size.label.split('(')[1]?.replace(')', '') ?? ''}
                  </span>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Tipografía">
          <div className="space-y-4">
            <div>
              <FieldLabel>Fuente principal</FieldLabel>
              <select
                value={settings.fontFamily}
                onChange={(e) => patch({ fontFamily: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-parchment-300 rounded-md focus:outline-none focus:ring-1 focus:ring-ink-400 bg-white text-ink-900"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Tamaño de fuente</FieldLabel>
                <NumberInput
                  value={settings.fontSize}
                  onChange={(v) => patch({ fontSize: v })}
                  min={8}
                  max={14}
                  step={0.5}
                  unit="pt"
                />
              </div>
              <div>
                <FieldLabel>Interlineado</FieldLabel>
                <NumberInput
                  value={settings.lineHeight}
                  onChange={(v) => patch({ lineHeight: v })}
                  min={1}
                  max={2.5}
                  step={0.05}
                  unit="× fuente"
                />
              </div>
            </div>

            {/* Preview */}
            <div
              className="rounded-lg border border-parchment-300 bg-white px-5 py-4 text-ink-700"
              style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}pt`, lineHeight: settings.lineHeight }}
            >
              <p className="font-bold mb-1">Capítulo Uno</p>
              <p>
                Era una tarde de otoño cuando el detective llegó al pueblo. Las hojas caían lentas sobre los adoquines mojados, y el viento traía consigo el olor a tierra húmeda y misterio.
              </p>
            </div>
          </div>
        </Section>

        {/* Margins */}
        <Section title="Márgenes (en pulgadas)">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Superior</FieldLabel>
              <NumberInput
                value={settings.marginTop}
                onChange={(v) => patch({ marginTop: v })}
                min={0.25}
                max={2}
                step={0.0625}
                unit="in"
              />
            </div>
            <div>
              <FieldLabel>Inferior</FieldLabel>
              <NumberInput
                value={settings.marginBottom}
                onChange={(v) => patch({ marginBottom: v })}
                min={0.25}
                max={2}
                step={0.0625}
                unit="in"
              />
            </div>
            <div>
              <FieldLabel>Interior (lomo)</FieldLabel>
              <NumberInput
                value={settings.marginInner}
                onChange={(v) => patch({ marginInner: v })}
                min={0.25}
                max={2}
                step={0.0625}
                unit="in"
              />
            </div>
            <div>
              <FieldLabel>Exterior</FieldLabel>
              <NumberInput
                value={settings.marginOuter}
                onChange={(v) => patch({ marginOuter: v })}
                min={0.25}
                max={2}
                step={0.0625}
                unit="in"
              />
            </div>
          </div>

          {/* Margin diagram */}
          <div className="mt-4 flex justify-center">
            <div
              className="relative bg-white border border-parchment-300 rounded shadow-sm"
              style={{
                width: 120,
                height: 160,
                padding: `${settings.marginTop * 30}px ${settings.marginOuter * 30}px ${settings.marginBottom * 30}px ${settings.marginInner * 30}px`,
              }}
            >
              <div className="w-full h-full bg-parchment-100 rounded-sm" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xs text-ink-300 font-mono">
                  {settings.trimSize.width}×{settings.trimSize.height}
                </span>
              </div>
            </div>
          </div>
          <p className="text-center text-2xs text-ink-400 mt-1.5">Vista previa de márgenes</p>
        </Section>
      </div>
    </div>
  )
}
