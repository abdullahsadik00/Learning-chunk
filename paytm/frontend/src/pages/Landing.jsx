import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <nav className="px-6 py-4 flex justify-between items-center">
        <span className="text-2xl font-bold text-blue-600">Paytm</span>
        <div className="flex gap-4 items-center">
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign In</Link>
          <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="text-6xl mb-6">💰</div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Fast, secure money transfers.
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-xl">
          Send money to friends and family instantly. No fees. No fuss.
        </p>
        <Link
          to="/signup"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Create Free Account
        </Link>

        <div className="flex gap-12 mt-16 text-center">
          {[
            { icon: '🔒', title: 'Secure', desc: 'Bank-grade encryption' },
            { icon: '⚡', title: 'Instant', desc: 'Real-time transfers' },
            { icon: '🆓', title: 'Free', desc: 'Zero fees forever' }
          ].map(f => (
            <div key={f.title}>
              <div className="text-3xl mb-2">{f.icon}</div>
              <p className="font-semibold text-gray-800">{f.title}</p>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
