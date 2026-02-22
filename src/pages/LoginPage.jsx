import { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: 'admin@idtech.local',
    password: 'Watasywa8531',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const redirectTo = location.state?.from ?? '/pages/home'
  const reasonMessage =
    location.state?.reason === 'password-updated'
      ? 'Password updated. Please sign in again.'
      : ''

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(formData)
      navigate(redirectTo, { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Backstage Login</h1>
      <p className="mt-2 text-sm text-slate-600">Sign in with your backstage account credentials.</p>
      {reasonMessage ? <p className="mt-2 text-sm text-emerald-700">{reasonMessage}</p> : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block space-y-1 text-sm text-slate-700">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            required
          />
        </label>

        <label className="block space-y-1 text-sm text-slate-700">
          <span>Password</span>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 outline-none focus:border-indigo-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-500">Default dev account: admin@idtech.local / 123456</p>
    </div>
  )
}

export default LoginPage
