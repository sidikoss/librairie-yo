import { useEffect, useState } from "react";

export function useLockBodyScroll(lock = true) {
  useEffect(() => {
    if (!lock) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [lock]);
}

export function useKeyPress(targetKey, handler) {
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === targetKey) {
        handler(event);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [targetKey, handler]);
}

export function useMediaDevices() {
  const [devices, setDevices] = useState({ audio: false, video: false });

  useEffect(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then((stream) => {
          setDevices({ audio: true, video: true });
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch(() => {
          setDevices({ audio: false, video: false });
        });
    }
  }, []);

  return devices;
}