"use client";

import { useState, useCallback, createContext, useContext, useEffect, type ReactNode } from "react";
import { IconCheck } from "@tabler/icons-react";

interface ToastContextType {
  showToast: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// Module level function for imperative calls (used by ModeGrid etc.)
let _globalShowToast: ((msg: string) => void) | null = null;

export function showToast(msg: string) {
  if (_globalShowToast) {
    _globalShowToast(msg);
  }
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({
    msg: "",
    visible: false,
  });
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const showToastFn = useCallback(
    (msg: string) => {
      if (timer) clearTimeout(timer);
      setToast({ msg, visible: true });
      const t = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 2200);
      setTimer(t);
    },
    [timer]
  );

  // Register global handler and clean up on unmount
  useEffect(() => {
    _globalShowToast = showToastFn;
    return () => {
      _globalShowToast = null;
    };
  }, [showToastFn]);

  return (
    <ToastContext.Provider value={{ showToast: showToastFn }}>
      {children}
      <div
        className="home-toast"
        style={{
          position: "fixed",
          bottom: 30,
          left: "50%",
          transform: toast.visible
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(100px)",
          padding: "14px 22px",
          borderRadius: 12,
          background: "linear-gradient(135deg, var(--ts-orange, #ff6b1a), var(--ts-red, #ff3d3d))",
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
          boxShadow: "0 10px 30px rgba(255,107,26,0.5)",
          zIndex: 1000,
          opacity: toast.visible ? 1 : 0,
          transition: "all 0.3s",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <IconCheck size={18} />
        <span>{toast.msg}</span>
      </div>
    </ToastContext.Provider>
  );
}
