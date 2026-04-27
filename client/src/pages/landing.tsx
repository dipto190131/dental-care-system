import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  Shield,
  CreditCard,
  Video,
  Star,
  ArrowRight,
  CheckCircle,
  Calendar,
  FileText,
  Bell,
  Users,
  Award,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Dentists",
    description: "Every dentist on our platform is background-checked and license-verified by our team.",
  },
  {
    icon: CreditCard,
    title: "Credit System",
    description: "Purchase credits and use them to book appointments — transparent, no hidden fees.",
  },
  {
    icon: Video,
    title: "Video Consultations",
    description: "Get dental advice from the comfort of your home through our secure video platform.",
  },
  {
    icon: FileText,
    title: "Digital Records",
    description: "All your dental records, prescriptions, and treatment history in one secure place.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Never miss an appointment with real-time reminders and updates.",
  },
  {
    icon: Calendar,
    title: "Easy Scheduling",
    description: "Browse availability in real-time and book the slot that works best for you.",
  },
];

const stats = [
  { value: "500+", label: "Verified Dentists" },
  { value: "50K+", label: "Happy Patients" },
  { value: "4.9", label: "Average Rating" },
  { value: "99%", label: "Satisfaction Rate" },
];

const specialties = [
  "Orthodontics",
  "Cosmetic Dentistry",
  "Pediatric Dentistry",
  "Oral Surgery",
  "Endodontics",
  "Periodontics",
  "Prosthodontics",
  "General Dentistry",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground">DentalCare</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" data-testid="button-login">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" data-testid="button-register">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10 py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 text-sm">
            Trusted by 50,000+ patients
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-6 leading-tight">
            Your Smile Deserves
            <br />
            <span className="text-primary">World-Class Care</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with verified dental specialists, book appointments instantly, manage your dental health records all in one place.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" data-testid="button-cta-patient" className="gap-2">
                Book Appointment
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" data-testid="button-cta-doctor">
                Join as a Dentist
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            {["No hidden fees", "Verified specialists", "Instant booking"].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">Everything You Need</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              A complete dental care platform built for patients and dentists alike.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">Browse by Specialty</h2>
            <p className="text-muted-foreground">Find the right dentist for your specific needs.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {specialties.map((specialty) => (
              <Link key={specialty} href="/register">
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-sm cursor-pointer hover-elevate"
                  data-testid={`badge-specialty-${specialty.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {specialty}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: "1", title: "Create an Account", desc: "Sign up as a patient or dentist in under a minute." },
              { step: "2", title: "Purchase Credits", desc: "Buy a credit package that fits your needs and budget." },
              { step: "3", title: "Book & Get Care", desc: "Find a verified dentist and book an available slot instantly." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-primary/5 border-y border-border">
        <div className="max-w-3xl mx-auto text-center">
          <Award className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of patients who have already improved their dental health with DentalCare.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2" data-testid="button-bottom-cta">
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Stethoscope className="h-3 w-3" />
            </div>
            <span className="text-sm font-medium text-foreground">DentalCare</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; 2026 DentalCare. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">50,000+ patients served</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
