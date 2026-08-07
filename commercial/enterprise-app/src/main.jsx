import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth.jsx";
import App from "./App.jsx";
import InteractiveBackground from "./components/InteractiveBackground.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <AuthProvider>
      <InteractiveBackground />
      <App />
    </AuthProvider>
  </BrowserRouter>,
);
