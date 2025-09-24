'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#fff',
          color: '#333',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
        },
        success: {
          style: {
            border: '1px solid #10b981',
            borderLeft: '4px solid #10b981',
          },
        },
        error: {
          style: {
            border: '1px solid #ef4444',
            borderLeft: '4px solid #ef4444',
          },
        },
      }}
    />
  );
}