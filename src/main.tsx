import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { I18nProvider } from "@/contexts/I18nContext";
import { ClerkProvider } from "@clerk/clerk-react";
import { ClerkAuthProvider } from '@/contexts/ClerkAuthContext';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <ClerkAuthProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ClerkAuthProvider>
  </ClerkProvider>
);
