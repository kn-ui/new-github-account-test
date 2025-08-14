import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { I18nProvider } from '@/contexts/I18nContext'

<<<<<<< Current (Your changes)
createRoot(document.getElementById("root")!).render(<App />);
=======
createRoot(document.getElementById("root")!).render(<I18nProvider><App /></I18nProvider>);
>>>>>>> Incoming (Background Agent changes)
