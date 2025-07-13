import { useEffect, useState } from 'react';

function SpinnerOrbit() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const mainElement = document.querySelector('.layout-container');
    if (mainElement) mainElement.style.display = 'none'; // Hide main content initially

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (mainElement) mainElement.style.display = 'flex'; // Show main content after 1 second
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (mainElement) mainElement.style.display = 'flex'; // Ensure main is visible on unmount
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ marginTop: '80px' }}
    >
      <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
    </div>
  );
}

export default SpinnerOrbit;