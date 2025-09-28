"use client";

import { useEffect, useState } from "react";
import { isDemoMode, disableDemoMode } from "@/utils/demo-mode";

export default function DemoModeBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [demoInfo, setDemoInfo] = useState({ envEnabled: false, localStorageEnabled: false });

  useEffect(() => {
    // Check demo mode after component mounts
    const checkDemoMode = () => {
      const envEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
      const localStorageEnabled = typeof window !== 'undefined' ? 
        localStorage.getItem('demo_mode') === 'true' : false;
      
      setDemoInfo({ envEnabled, localStorageEnabled });
      setShowBanner(envEnabled || localStorageEnabled);
    };

    checkDemoMode();
  }, []);

  const handleDisableDemo = () => {
    disableDemoMode();
    // Reload page to exit demo mode
    window.location.reload();
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Demo Mode Active</span> - 
                Authentication is bypassed for testing purposes. 
                {demoInfo.envEnabled && " (Environment variable)"}
                {demoInfo.localStorageEnabled && " (Browser setting)"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBanner(false)}
              className="flex-shrink-0 text-amber-600 hover:text-amber-800 text-sm font-medium"
            >
              Hide
            </button>
            {demoInfo.localStorageEnabled && (
              <button
                onClick={handleDisableDemo}
                className="flex-shrink-0 bg-amber-200 text-amber-800 hover:bg-amber-300 px-3 py-1 rounded text-sm font-medium"
              >
                Exit Demo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}