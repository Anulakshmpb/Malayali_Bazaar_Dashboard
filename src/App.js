import React from "react";
import { UserProvider } from "./Components/Shared/hooks/UserContext";
import { ToastProvider } from "./Components/Shared/hooks/ToastContext";
import { ConfirmProvider } from "./Components/Shared/ui/ConfirmDialog";
import AppRoutes from "./Components/Routes/Routes";

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <UserProvider>
          <AppRoutes />
        </UserProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
