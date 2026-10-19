import React from 'react';
import { Toaster } from 'sonner';

import AppRoutes from './Components/Routes/Routes';
import { ToastProvider } from './Components/Shared/hooks/ToastContext';

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