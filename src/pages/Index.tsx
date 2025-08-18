import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedCourses from "@/components/FeaturedCourses";
import SiteFooter from "@/components/SiteFooter";
import SchoolMessage from "@/components/SchoolMessage";
import UpcomingEvents from "@/components/UpcomingEvents";
import Departments from "@/components/Departments";
import StatsHighlights from "@/components/StatsHighlights";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <SchoolMessage />
        <UpcomingEvents />
        <Departments />
        <FeaturedCourses />
        <StatsHighlights />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
