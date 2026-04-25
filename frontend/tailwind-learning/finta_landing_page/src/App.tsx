import Container from "./components/Container";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import heroImg from "./assets/hero-ui-v5.webp";

function App() {
  return (
    <div className="relative flex h-screen flex-col items-center bg-gradient-to-b from-white via-blue-100 to-white">
      <div className="absolute inset-0 mx-auto h-full w-full max-w-7xl">
        <div className="absolute inset-y-0 left-0 z-0 h-full w-px bg-gradient-to-b from-neutral-300/50 via-neutral-200 to-transparent"></div>
        <div className="absolute inset-y-0 right-0 z-0 h-full w-px bg-gradient-to-b from-neutral-300/50 via-neutral-200 to-transparent"></div>
      </div>
      <Container className="p-2">
        <Navbar />
        <Hero />
      </Container>
      <div className="relative w-full">
        <div className="absolute inset-x-0 z-0 h-px w-full bg-gradient-to-b from-neutral-300/50 via-neutral-200 to-transparent"></div>
        <div className="mx-auto max-w-7xl p-4">
          <div className="w-full border-neutral-400">
            <img
              src={heroImg}
              alt=""
              className="h-full w-full rounded-2xl border border-neutral-200 to-80% mask-b-from-0% object-cover shadow-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
