import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Users, Award, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-school.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="St. Raguel Church School Campus" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Main Hero Text */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Welcome to
            <span className="block text-gradient-hero bg-clip-text text-transparent">
              St. Raguel Church School
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto leading-relaxed">
            Nurturing minds, building character, and fostering spiritual growth through 
            exceptional education and Christian values.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button variant="glass" size="lg" className="group">
              <BookOpen className="h-5 w-5" />
              Explore Courses
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Users className="h-5 w-5" />
              Join Our Community
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card className="card-academic p-6 text-center bg-white/95 backdrop-blur-sm">
              <div className="p-3 bg-gradient-success rounded-full w-fit mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-success-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">50+</h3>
              <p className="text-muted-foreground">Quality Courses</p>
            </Card>

            <Card className="card-academic p-6 text-center bg-white/95 backdrop-blur-sm">
              <div className="p-3 bg-gradient-accent rounded-full w-fit mx-auto mb-4">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">1,200+</h3>
              <p className="text-muted-foreground">Active Students</p>
            </Card>

            <Card className="card-academic p-6 text-center bg-white/95 backdrop-blur-sm">
              <div className="p-3 bg-gradient-primary rounded-full w-fit mx-auto mb-4">
                <Award className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">25+</h3>
              <p className="text-muted-foreground">Years Excellence</p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;