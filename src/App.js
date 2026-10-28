import React from 'react';
import { Toaster } from 'sonner';
import { ToastProvider } from './Components/Shared/hooks/ToastContext';
import { UserProvider } from './Components/Shared/hooks/UserContext';
import AppRoutes from './Components/Routes/Routes';

function App() {
  return (
    <ToastProvider>
      <UserProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={3000}
        />

        <AppRoutes />
      </UserProvider>
    </ToastProvider>
  );
}

export default App;