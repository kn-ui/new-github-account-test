import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedCourses from "@/components/FeaturedCourses";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <FeaturedCourses />
      </main>
    </div>
  );
};

export default Index;
