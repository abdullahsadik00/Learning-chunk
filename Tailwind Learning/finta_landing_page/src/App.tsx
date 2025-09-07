import { useState } from 'react'
import reactLogo from './assets/react.svg'
import heroImage from './assets/hero-ui-v5.webp'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './components/Navbar'
import Hero from './Hero'
import Container from './components/container'
// import Navbar from './'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Container className='flex items-center justify-center h-screen'>
      Hello World
    </Container>
    </>
  )
}

export default App
