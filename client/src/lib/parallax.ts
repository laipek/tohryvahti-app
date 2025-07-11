// Parallax background effect
export function initParallax() {
  let ticking = false;

  function updateParallax() {
    const scrolled = window.pageYOffset;
    const parallaxElement = document.querySelector('body::before') as HTMLElement;
    
    if (parallaxElement) {
      const speed = scrolled * 0.5; // Adjust speed as needed
      parallaxElement.style.transform = `translate3d(0, ${speed}px, 0)`;
    }
    
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  // Add scroll listener
  window.addEventListener('scroll', requestTick, { passive: true });
  
  // Initial call
  updateParallax();
}

// Alternative CSS-only parallax with better performance
export function initCSSParallax() {
  const style = document.createElement('style');
  style.textContent = `
    body::before {
      animation: none !important;
      transform: translateZ(-1px) scale(1.5) !important;
    }
    
    body {
      perspective: 1px;
      perspective-origin: center top;
      overflow-x: hidden;
      overflow-y: auto;
      height: 100vh;
    }
    
    #root {
      transform-style: preserve-3d;
      position: relative;
      z-index: 1;
    }
  `;
  document.head.appendChild(style);
}