import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize parallax effect
function initParallax() {
  let ticking = false;

  function updateParallax() {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.3; // Negative for slower upward movement
    
    // Apply transform using CSS custom property
    document.documentElement.style.setProperty('--parallax-offset', `${rate}px`);
    
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  
  // Initial call
  updateParallax();
}

// Start parallax when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initParallax);
} else {
  initParallax();
}

createRoot(document.getElementById("root")!).render(<App />);
