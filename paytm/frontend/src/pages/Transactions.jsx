import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import client from '../api/client.js'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/account/transactions')
      .then(r => setTransactions(r.data.transactions))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Transaction History</h2>
          <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-16">Loading...</p>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">No transactions yet.</p>
            <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">
              Send money to get started
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(txn => {
              const isSent = txn.type === 'sent'
              const counterparty = isSent ? txn.receiver : txn.sender
              return (
                <div key={txn.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isSent ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                      {isSent ? '↑' : '↓'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {counterparty.firstName} {counterparty.lastName}
                      </p>
                      {txn.note && <p className="text-xs text-gray-500">{txn.note}</p>}
                      <p className="text-xs text-gray-400">
                        {new Date(txn.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <p className={`font-semibold text-base ${isSent ? 'text-red-600' : 'text-green-600'}`}>
                    {isSent ? '-' : '+'}₹{Number(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
