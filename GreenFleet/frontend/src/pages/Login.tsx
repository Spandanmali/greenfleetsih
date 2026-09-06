import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Anchor } from 'lucide-react'
import { authApi } from '../lib/api'
import { hasCompletedOnboarding, storeSession } from '../lib/auth'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const [isRegistering, setIsRegistering] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isRegistering) {
        await authApi.register({ email: email.trim(), name: name.trim(), password, role: 'partial_access' })
      }
      const res = await authApi.login(email.trim(), password)
      storeSession(res.data.access_token, res.data.user)
      navigate(hasCompletedOnboarding(res.data.user) ? '/' : '/what-we-do', { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1011] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(85,213,138,0.14),transparent_34rem)]" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#55d58a]/10 border border-[#55d58a]/20 rounded-2xl mb-4">
            <Anchor className="text-[#55d58a]" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">GreenFleet</h1>
          <p className="text-[#8d9b99] mt-1">AI-powered fleet intelligence</p>
        </div>

        <div className="bg-[#151c1d] border border-white/10 rounded-2xl shadow-2xl p-8 relative">
          <h2 className="text-xl font-semibold text-[#f4f7f6] mb-2">{isRegistering ? 'Create your account' : 'Sign in to your account'}</h2>
          <p className="text-sm text-[#71807e] mb-6">{isRegistering ? 'Start monitoring your fleet in minutes.' : 'Access your fleet intelligence workspace.'}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && <div>
              <label className="label">Full name</label>
              <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Fleet operator" />
            </div>}
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="fleet@operator.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? (isRegistering ? 'Creating account…' : 'Signing in…') : (isRegistering ? 'Create account' : 'Sign in')}
            </button>
          </form>
          <button type="button" className="w-full mt-5 text-sm text-[#55d58a] hover:text-[#70e5a0] transition-colors" onClick={() => setIsRegistering((value) => !value)}>
            {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Create one'}
          </button>
          <div className="text-center text-sm text-[#71807e] mt-5">
            <div>demo email: abc@gmail.com</div>
            <div>demo password: 123456789</div>
          </div>
        </div>
      </div>
    </div>
  )
}
