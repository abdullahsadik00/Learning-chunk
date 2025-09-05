import { useState } from 'react'
import reactLogo from './assets/react.svg'
import heroImage from './assets/hero-ui-v5.webp'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './components/Navbar'
import Hero from './Hero'
// import Navbar from './'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <div className="layout ">
      <div className='layout-lines-container'>
        <div className='left-line'></div>
        <div className='right-line'></div>
      <div className="container">
        <Navbar />
        <Hero />
        <div className='hero-img-container'>
          <div className='horizontal-line'></div>
          <img src={heroImage} className='hero-img' />
        </div>
      </div>
      </div>
    </div>
    </>
  )
}

export default App
