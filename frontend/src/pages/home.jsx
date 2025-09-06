import React, { useEffect, useState } from 'react';

// --- MAIN APP COMPONENT ---
export default function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const backgroundStyle = {
    '--x': mousePosition.x * 20 + 'px',
    '--y': mousePosition.y * 20 + 'px',
  };

  // Handles the redirection to the authentication page.
  const handleRedirectToAuth = () => {
    // In a full-fledged React application, you would use a router
    // for navigation. This approach provides a simple redirection.
    window.location.href = '/auth';
  };

  return (
    <div className="w-full min-h-screen relative overflow-hidden font-sans text-gray-900">
      {/* Background layer with subtle movement */}
      <div
        className="fixed inset-0 bg-white"
        style={backgroundStyle}
      >
        {/* Subtle radial gradient to create focus */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#f5f5f5_20%,_transparent_60%)] opacity-75"></div>
      </div>

      {/* Main content container */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Frosted glass card with a clean white background */}
        <div className="w-full max-w-lg p-8 space-y-6 rounded-2xl border border-gray-200 backdrop-blur-lg shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white/80 text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check text-black">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black">VIPchakra</h1>
          </div>
          <p className="mt-4 text-lg sm:text-xl max-w-lg font-light text-gray-800">
            Advanced VIP protection and monitoring. Safeguard your digital reputation with real-time intelligence.
          </p>
          <button
            onClick={handleRedirectToAuth}
            className="mt-8 px-8 py-4 bg-black text-white font-bold rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]"
          >
            Safeguard Me Now
          </button>
        </div>
      </div>
    </div>
  );
}
