import React from 'react';
import { Toaster } from 'sonner';
import { ToastProvider } from './Components/Shared/hooks/ToastContext';
import AppRoutes from './Components/Routes/Routes';

function App() {
  return (
    <ToastProvider>
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3000}
      />

      <AppRoutes />
    </ToastProvider>
  );
}

export default App;