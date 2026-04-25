import "./App.css";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import heroImage from "./hero-ui-v5.webp";

function App() {
  return (
    <div className="layout">
      <div className="layout-lines-container">
        <div className="left-line"></div>
        <div className="right-line"></div>
        <div className="container">
          <Navbar />
          <Hero />
          <div className="hero-img-container">
            <div className="horizontal-line"></div>
            <img src={heroImage} className="hero-img" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
