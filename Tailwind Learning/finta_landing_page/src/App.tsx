import Container from "./components/Container"
import Hero from "./components/Hero"
import Navbar from "./components/Navbar"
import heroImg from './assets/hero-ui-v5.webp'

function App() {

  return (
    <div className="flex flex-col items-center h-screen relative bg-gradient-to-b from-white via-blue-100 to-white">
      <div className="max-w-7xl absolute inset-0 h-full w-full mx-auto ">
        <div className="absolute inset-y-0 left-0 h-full w-px bg-gradient-to-b from-neutral-300/50 via-neutral-200 to-transparent z-0"></div>
        <div className="absolute inset-y-0 right-0 h-full w-px bg-gradient-to-b from-neutral-300/50 via-neutral-200 to-transparent z-0"></div>
      </div>
      <Container className='p-2'>
        <Navbar />
        <Hero />
      </Container>
<div className="relative w-full">
<div className="absolute inset-x-0 h-px w-full bg-gradient-to-b from-neutral-300/50 via-neutral-200 to-transparent z-0"></div>
<div className="max-w-7xl mx-auto p-4">
<div className=" w-full border-neutral-400">
  <img src={heroImg} alt="" className="rounded-2xl w-full h-full object-cover shadow-md border border-neutral-200 mask-b-from-0% to-80%"/></div>
</div>
</div>
    </div>
  )
}

export default App
