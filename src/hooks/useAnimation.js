import { useState, useEffect, useCallback, createContext, useContext } from "react";

const AnimationContext = createContext(null);

export function AnimationProvider({ children }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const shouldAnimate = !prefersReducedMotion;

  const animations = {
    fadeIn: shouldAnimate ? "animate-fade-in" : "",
    slideUp: shouldAnimate ? "animate-slide-up" : "",
    slideDown: shouldAnimate ? "animate-slide-down" : "",
    slideLeft: shouldAnimate ? "animate-slide-left" : "",
    slideRight: shouldAnimate ? "animate-slide-right" : "",
    scale: shouldAnimate ? "animate-scale" : "",
    bounce: shouldAnimate ? "animate-bounce" : "",
    spin: shouldAnimate ? "animate-spin" : "",
    pulse: shouldAnimate ? "animate-pulse" : "",
  };

  return (
    <AnimationContext.Provider value={{ prefersReducedMotion, shouldAnimate, animations }}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error("useAnimation must be used within AnimationProvider");
  }
  return context;
}

export const animations = {
  "fade-in": `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
  `,
  "slide-up": `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
  `,
  "slide-down": `
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-down { animation: slideDown 0.3s ease-out forwards; }
  `,
  "slide-left": `
    @keyframes slideLeft {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .animate-slide-left { animation: slideLeft 0.3s ease-out forwards; }
  `,
  "slide-right": `
    @keyframes slideRight {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .animate-slide-right { animation: slideRight 0.3s ease-out forwards; }
  `,
  "scale": `
    @keyframes scale {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-scale { animation: scale 0.2s ease-out forwards; }
  `,
  "bounce": `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .animate-bounce { animation: bounce 0.5s ease-in-out; }
  `,
  "spin": `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin { animation: spin 1s linear infinite; }
  `,
  "pulse": `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .animate-pulse { animation: pulse 2s ease-in-out infinite; }
  `,
  "shimmer": `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .animate-shimmer {
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
  `,
  "shake": `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    .animate-shake { animation: shake 0.3s ease-in-out; }
  `,
  "wiggle": `
    @keyframes wiggle {
      0%, 100% { transform: rotate(-3deg); }
      50% { transform: rotate(3deg); }
    }
    .animate-wiggle { animation: wiggle 0.3s ease-in-out; }
  `,
};

export const transitions = {
  default: "all 0.2s ease",
  fast: "all 0.1s ease",
  slow: "all 0.3s ease",
  bounce: "all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
};

export const getStaggerDelay = (index, baseDelay = 50) => ({
  animationDelay: `${index * baseDelay}ms`,
});

export const MotionWrapper = ({ children, animation = "fade-in", delay = 0, className = "" }) => {
  const { shouldAnimate } = useAnimation();
  
  if (!shouldAnimate) return children;
  
  return (
    <div
      className={`animate-${animation} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimationProvider;