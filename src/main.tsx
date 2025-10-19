import { createRoot } from 'react-dom/client'
import App from './App';
import './index.css'
import { I18nProvider } from '@/contexts/I18nContext'
import { initDeploymentChecks } from '@/lib/env-validation'

// Initialize deployment and security checks
initDeploymentChecks();

createRoot(document.getElementById("root")!).render(<I18nProvider><App /></I18nProvider>);
