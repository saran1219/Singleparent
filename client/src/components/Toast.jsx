import React, { useEffect, useState } from 'react';

// Simple global toast system without external deps
// Usage: window.showToast('Message', 'success'|'error'|'info')
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    window.showToast = (message, type = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };
    return () => {
      if (window.showToast) delete window.showToast;
    };
  }, []);

  const bgFor = (type) => {
    if (type === 'success') return 'bg-green-600';
    if (type === 'error') return 'bg-red-600';
    return 'bg-amber-600';
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map((t) => (
        <div key={t.id} className={`text-white px-4 py-2 rounded shadow ${bgFor(t.type)}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}