import Header from '@/components/Header';
import CourseCatalog from '../../GUI/src/components/CourseCatalog';

const Catalog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CourseCatalog />
    </div>
  );
};

export default Catalog;