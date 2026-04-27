import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Search, Stethoscope, MapPin, Clock, Award, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const { data: doctors = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/doctors?verified=true"],
  });

  const specialties = Array.from(new Set(doctors.map((d) => d.specialty)));

  const filtered = doctors.filter((d) => {
    const name = `${d.user.firstName} ${d.user.lastName}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase()) || (d.clinicName || "").toLowerCase().includes(search.toLowerCase());
    const matchSpecialty = !selectedSpecialty || d.specialty === selectedSpecialty;
    return matchSearch && matchSpecialty;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Find a Dentist</h1>
        <p className="text-muted-foreground mt-0.5">Browse our verified dental specialists.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, specialty, or clinic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-doctor-search"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedSpecialty(null)}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${!selectedSpecialty ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover-elevate"}`}
          data-testid="filter-all"
        >
          All
        </button>
        {specialties.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSpecialty(s === selectedSpecialty ? null : s)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${selectedSpecialty === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover-elevate"}`}
            data-testid={`filter-${s.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No dentists found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((doctor) => (
            <Card key={doctor.id} className="hover-elevate" data-testid={`card-doctor-${doctor.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0 text-lg font-bold text-primary">
                    {doctor.user.firstName[0]}{doctor.user.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">
                      Dr. {doctor.user.firstName} {doctor.user.lastName}
                    </h3>
                    <Badge variant="secondary" className="text-xs mt-0.5">
                      {doctor.specialty}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  {doctor.clinicName && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Stethoscope className="h-3 w-3 shrink-0" />
                      <span className="truncate">{doctor.clinicName}</span>
                    </div>
                  )}
                  {doctor.clinicAddress && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{doctor.clinicAddress}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{doctor.yearsExperience} years experience</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium text-foreground">
                      {parseFloat(doctor.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({doctor.totalReviews} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Award className="h-3 w-3" />
                    <span>{doctor.consultationFee} credits</span>
                  </div>
                </div>

                {doctor.bio && (
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{doctor.bio}</p>
                )}

                <Link href={`/doctors/${doctor.id}`}>
                  <Button size="sm" className="w-full gap-1.5" data-testid={`button-view-doctor-${doctor.id}`}>
                    View Profile & Book
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
