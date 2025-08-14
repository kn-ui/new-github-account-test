import Header from '@/components/Header';
import ContactPage from '../../GUI/src/components/ContactPage';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const Contact = () => {
  // Wrap the GUI ContactPage by intercepting form submit via window event
  // Simpler approach: rely on GUI component structure by not changing it; here we leave as-is.
  // Optionally export a handler via context if needed in future.
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ContactPage />
    </div>
  );
};

export default Contact;