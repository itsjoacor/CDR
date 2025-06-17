"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ScreenSpinner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="relative h-16 w-16">
            {/* Spinner with gradient */}
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-indigo-200 border-b-indigo-300 border-l-indigo-400 animate-spin" />
            
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
            </div>
          </div>
          
        </div>
      )}
      {children}
    </>
  );
}