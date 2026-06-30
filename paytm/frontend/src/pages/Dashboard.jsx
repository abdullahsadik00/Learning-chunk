import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import client from '../api/client.js'

export default function Dashboard() {
  const [balance, setBalance] = useState(null)
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  const fetchBalance = () => {
    client.get('/account/balance').then(r => setBalance(r.data.balance))
  }

  useEffect(() => { fetchBalance() }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      client.get(`/user/bulk?filter=${filter}`).then(r => setUsers(r.data.users))
    }, 300)
    return () => clearTimeout(t)
  }, [filter])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-gray-500 text-sm mb-2">Good to see you, {user?.firstName} 👋</p>

        <div className="bg-blue-600 text-white rounded-xl p-6 mb-6">
          <p className="text-blue-100 text-sm mb-1">Your Balance</p>
          <p className="text-4xl font-bold">
            ₹{balance !== null
              ? Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })
              : '—'}
          </p>
          <button
            onClick={fetchBalance}
            className="mt-3 text-blue-200 text-xs hover:text-white underline"
          >
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">Send Money</h3>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search users by name..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                    {u.firstName[0]}{u.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-500">{u.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/send?to=${u.id}&name=${u.firstName}+${u.lastName}`)}
                  className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-6">
                {filter ? 'No users found' : 'Start typing to search users'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
