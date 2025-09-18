import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const DashboardLayout = ({children,activeTab,setActiveTab}) => {
  // const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className=' h-screen flex bg-gradient-to-b from-blue-50 via-white to-gray-100 '>
              <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
  )
}

export default DashboardLayout