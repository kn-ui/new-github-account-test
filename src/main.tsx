import { createRoot } from 'react-dom/client'
import App from './App';
import './index.css'
import { I18nProvider } from '@/contexts/I18nContext'
import { ClerkProvider } from '@clerk/clerk-react'


const clerkPublishableKey = (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY as string;

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
    <I18nProvider>
      <App />
    </I18nProvider>
  </ClerkProvider>
);
