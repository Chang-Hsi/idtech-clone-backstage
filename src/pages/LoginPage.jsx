import { useEffect, useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import logo from '/logo.jpg'

const REMEMBER_LOGIN_KEY = 'idtech_backstage_remembered_login_v1'
const DEMO_LOGIN = {
  email: 'admin@idtech.local',
  password: 'Watasywa8531',
}
const EMPTY_FORM = {
  email: '',
  password: '',
}

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberLogin, setRememberLogin] = useState(false)

  const redirectTo = location.state?.from ?? '/dashboard'
  const reasonMessage =
    location.state?.reason === 'password-updated'
      ? 'Password updated. Please sign in again.'
      : ''

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(REMEMBER_LOGIN_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      const email = String(parsed?.email ?? '').trim()
      const password = String(parsed?.password ?? '')
      if (!email || !password) return
      setFormData({ email, password })
      setRememberLogin(true)
    } catch {
      window.localStorage.removeItem(REMEMBER_LOGIN_KEY)
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUseDemoAccount = () => {
    setFormData(DEMO_LOGIN)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(formData)
      if (rememberLogin) {
        window.localStorage.setItem(REMEMBER_LOGIN_KEY, JSON.stringify(formData))
      } else {
        window.localStorage.removeItem(REMEMBER_LOGIN_KEY)
      }
      navigate(redirectTo, { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-100 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Sign In</h1>
          <p className="mt-3 text-base text-slate-600">Enter your email and password to sign in.</p>
          {reasonMessage ? <p className="mt-3 text-sm text-emerald-700">{reasonMessage}</p> : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block space-y-2 text-sm text-slate-700">
              <span className="font-medium">
                Email <span className="text-rose-500">*</span>
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Enter your email"
                autoComplete="username"
                required
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
              <span className="font-medium">
                Password <span className="text-rose-500">*</span>
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Enter your password"
                  autoComplete={rememberLogin ? 'current-password' : 'off'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </label>

            <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={rememberLogin}
                onChange={(event) => setRememberLogin(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
              />
              <span>Remember my email and password on this device</span>
            </label>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>

            <p className="text-sm text-slate-700">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={handleUseDemoAccount}
                className="font-semibold text-indigo-600 transition hover:text-indigo-700"
              >
                Use Demo Account
              </button>
            </p>
          </form>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-[#111a5f] lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.28),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.2),transparent_45%)]" />
        <div className="relative z-10 flex h-full items-center justify-center px-10">
          <div className="text-center">
            <img
              src={logo}
              alt="Backstage logo"
              className="mx-auto w-48 rounded-xl border border-white/20 bg-white/10 p-3 shadow-lg shadow-indigo-950/30"
            />
            <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white">NEXA Backstage</h2>
            <p className="mt-3 text-base text-indigo-100/80">Content operations and governance console</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default LoginPage
