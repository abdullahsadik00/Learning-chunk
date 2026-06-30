import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InputBox from '../components/InputBox.jsx'
import Button from '../components/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import client from '../api/client.js'

export default function Signup() {
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await client.post('/user/signup', form)
      login(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-1">Create Account</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Sign up to start sending money</p>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <InputBox label="First Name" placeholder="John" value={form.firstName} onChange={set('firstName')} />
            <InputBox label="Last Name" placeholder="Doe" value={form.lastName} onChange={set('lastName')} />
          </div>
          <InputBox label="Email" type="email" placeholder="john@example.com" value={form.username} onChange={set('username')} />
          <InputBox label="Password" type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} />
          <Button type="submit" label="Create Account" loading={loading} />
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
