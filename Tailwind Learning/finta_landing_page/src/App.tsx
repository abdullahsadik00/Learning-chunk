import Container from "./components/container"
import Hero from "./components/Hero"
import Navbar from "./components/Navbar"

function App() {

  return (
    <div className="flex flex-col items-center h-screen relative bg-gradient-to-b from-white via-blue-100 to-white">
      <div className="max-w-7xl absolute inset-0 h-full w-full mx-auto ">
        <div className="absolute inset-y-0 left-0 h-full w-px bg-gradient-to-b from-neutral-300/50 via-neutral-200 to-transparent z-0"></div>
        <div className="absolute inset-y-0 right-0 h-full w-px bg-gradient-to-b from-neutral-300/50 via-neutral-200 to-transparent z-0"></div>
      </div>
      <Container className=''>
        <Navbar />
        <Hero />
      </Container>

    </div>
  )
}

export default App
