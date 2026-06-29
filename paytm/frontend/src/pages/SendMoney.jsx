import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import InputBox from '../components/InputBox.jsx'
import Button from '../components/Button.jsx'
import client from '../api/client.js'

export default function SendMoney() {
  const [params] = useSearchParams()
  const to = params.get('to')
  const name = params.get('name')?.replace(/\+/g, ' ')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) {
      setError('Enter a valid amount greater than 0')
      return
    }
    setLoading(true)
    setError('')
    try {
      await client.post('/account/transfer', { to, amount: parsed, note })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-2xl font-bold mb-2">Transfer Successful</h2>
          <p className="text-gray-600 mb-6">
            ₹{Number(amount).toFixed(2)} sent to {name}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold mb-1">Send Money</h2>
          <p className="text-gray-500 text-sm mb-6">
            To: <span className="font-medium text-gray-800">{name}</span>
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <InputBox
              label="Amount (₹)"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <InputBox
              label="Note (optional)"
              placeholder="e.g. Dinner split"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <Button
              type="submit"
              label={`Send ₹${amount ? Number(amount).toFixed(2) : '0.00'} to ${name}`}
              loading={loading}
            />
          </form>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full mt-3 text-gray-500 text-sm hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
