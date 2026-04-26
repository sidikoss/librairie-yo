import { useEffect, memo } from "react";

const PerformanceMonitor = memo(function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === "undefined" || !("web vitals" in window)) return;

    const reportWebVitals = ({ name, value, id }) => {
      const threshold = {
        LCP: 2500,
        FID: 100,
        CLS: 0.1,
        FCP: 1800,
        TTFB: 600,
      };

      const status = value <= (threshold[name] || 1000) ? "good" : "needs-improvement";
      
      console.log(`[Web Vitals] ${name}: ${Math.round(value)}ms (${status})`, { value, id });
    };

    const loadVitals = async () => {
      try {
        const { onCLS, onFID, onLCP } = await import("web-vitals");
        onCLS(reportWebVitals);
        onFID(reportWebVitals);
        onLCP(reportWebVitals);
      } catch (error) {
        console.warn("[Performance] Web Vitals not available:", error);
      }
    };

    loadVitals();
  }, []);

  return null;
});

const PreloadCriticalRoutes = memo(function PreloadCriticalRoutes() {
  useEffect(() => {
    const routes = ["/catalogue", "/panier"];
    
    routes.forEach((route) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "document";
      link.href = route;
    });
  }, []);

  return null;
});

const PreconnectDomains = memo(function PreconnectDomains() {
  useEffect(() => {
    const domains = [
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
      "https://firebasestorage.googleapis.com",
    ];

    domains.forEach((domain) => {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = domain;
      document.head.appendChild(link);
    });
  }, []);

  return null;
});

const ResourceHints = memo(function ResourceHints() {
  useEffect(() => {
    const hints = [
      { rel: "dns-prefetch", href: "https://firebasestorage.googleapis.com" },
      { rel: "preconnect", href: "https://firebase.google.com" },
    ];

    hints.forEach((hint) => {
      const link = document.createElement("link");
      link.rel = hint.rel;
      link.href = hint.href;
      document.head.appendChild(link);
    });
  }, []);

  return null;
});

const PerformanceOptimizer = memo(function PerformanceOptimizer() {
  return (
    <>
      <PreconnectDomains />
      <ResourceHints />
      <PreloadCriticalRoutes />
      <PerformanceMonitor />
    </>
  );
});

export default PerformanceOptimizer;
export { PreconnectDomains, ResourceHints, PreloadCriticalRoutes, PerformanceMonitor };