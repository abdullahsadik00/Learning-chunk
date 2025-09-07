import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

function App({ children }) {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='bg-slate-100 h-screen flex'>
      <Sidebar />
      <div className="flex-1 flex flex-col">
<Navbar/>
<main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
</div>
      </div>
    </>
  )
}

export default App
