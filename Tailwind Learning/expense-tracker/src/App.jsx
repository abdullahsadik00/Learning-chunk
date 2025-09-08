import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import Dashboard from './pages/Dashboard'

function App({ children }) {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <>
      <Router>
        <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Routes>
        <Route path='/' element={<Dashboard/>}/>
      </Routes>
        </DashboardLayout>
      </Router>
    </>
  )
}

export default App
