import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedCourses from "@/components/FeaturedCourses";
import SiteFooter from "@/components/SiteFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <FeaturedCourses />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
