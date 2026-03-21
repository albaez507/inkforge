import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const [mode, setMode]       = useState<Mode>('login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [info, setInfo]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        setInfo('Revisa tu correo para confirmar tu cuenta.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-parchment-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-ink-900 rounded-xl flex items-center justify-center mb-3">
            <BookOpen size={22} className="text-parchment-100" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-serif font-bold text-ink-900">Inkforge</h1>
          <p className="text-sm text-ink-400 mt-1">Tu espacio de escritura</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-parchment-300 shadow-card p-8">
          <h2 className="text-lg font-semibold text-ink-900 mb-6">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full px-3 py-2 text-sm border border-parchment-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-400 bg-white text-ink-900 placeholder:text-ink-300"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="w-full px-3 py-2 text-sm border border-parchment-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-400 bg-white text-ink-900 placeholder:text-ink-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-3 py-2 text-sm border border-parchment-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-400 bg-white text-ink-900 placeholder:text-ink-300"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {info && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading
                ? 'Cargando...'
                : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-xs text-ink-400 mt-6">
            {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setInfo(null) }}
              className="text-ink-700 font-medium hover:underline"
            >
              {mode === 'login' ? 'Registrarte' : 'Iniciar sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
