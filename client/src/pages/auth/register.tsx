import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope } from "lucide-react";
import { register } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const patientSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
  phone: z.string().optional(),
  role: z.literal("patient"),
});

const doctorSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
  phone: z.string().optional(),
  role: z.literal("doctor"),
  specialty: z.string().min(1, "Required"),
  licenseNumber: z.string().min(1, "Required"),
  yearsExperience: z.number().int().min(0).optional(),
  bio: z.string().optional(),
  clinicName: z.string().optional(),
  medicalCertificate: z.instanceof(File).optional(),
});

const schema = z.discriminatedUnion("role", [patientSchema, doctorSchema]);

type FormValues = z.infer<typeof schema>;

const specialties = [
  "General Dentistry", "Orthodontics", "Cosmetic Dentistry", "Pediatric Dentistry",
  "Oral Surgery", "Endodontics", "Periodontics", "Prosthodontics", "Implantology",
];

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"patient" | "doctor">("patient");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      role: "patient",
    } as any,
  });

  const handleRoleChange = (r: "patient" | "doctor") => {
    setRole(r);
    form.reset({ ...form.getValues(), role: r } as any);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("firstName", values.firstName);
      payload.append("lastName", values.lastName);
      payload.append("email", values.email);
      payload.append("password", values.password);
      payload.append("phone", values.phone || "");
      payload.append("role", values.role);
      
      if (role === "doctor") {
        payload.append("specialty", (values as any).specialty);
        payload.append("licenseNumber", (values as any).licenseNumber);
        payload.append("yearsExperience", (values as any).yearsExperience || "0");
        payload.append("bio", (values as any).bio || "");
        payload.append("clinicName", (values as any).clinicName || "");
        if ((values as any).medicalCertificate) {
          payload.append("medicalCertificate", (values as any).medicalCertificate);
        }
      }
      
      const data = await register(payload as any);
      if (data.error) throw new Error(data.error);
      await refresh();
      if (role === "doctor") navigate("/doctor/dashboard");
      else navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Registration failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-6">
      <div className="w-full max-w-lg space-y-6 py-8">
        <div className="text-center">
          <button
            onClick={() => {
              window.location.href = "http://localhost:5000";
            }}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mx-auto mb-4 hover:opacity-80 transition-opacity cursor-pointer"
            data-testid="button-logo-register"
          >
            <Stethoscope className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground mt-1">Join DentalCare today</p>
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${role === "patient" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
            onClick={() => handleRoleChange("patient")}
            data-testid="button-role-patient"
          >
            I'm a Patient
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${role === "doctor" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
            onClick={() => handleRoleChange("doctor")}
            data-testid="button-role-doctor"
          >
            I'm a Dentist
          </button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" data-testid="input-firstname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" data-testid="input-lastname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" data-testid="input-email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Min 6 characters" data-testid="input-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1-555-0000" data-testid="input-phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {role === "doctor" && (
                  <>
                    <FormField control={form.control} name={"specialty" as any} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialty</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-specialty">
                              <SelectValue placeholder="Select specialty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {specialties.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name={"licenseNumber" as any} render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                          <Input placeholder="DDS-12345" data-testid="input-license" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name={"medicalCertificate" as any} render={({ field: { onChange } }) => (
                      <FormItem>
                        <FormLabel>Medical Certificate (PDF)</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".pdf"
                            data-testid="input-certificate"
                            onChange={(e) => onChange(e.target.files?.[0])}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">Upload your medical certificate PDF for admin verification</p>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name={"yearsExperience" as any} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="5"
                            data-testid="input-experience"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name={"bio" as any} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell patients about yourself..."
                            data-testid="input-bio"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name={"clinicName" as any} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinic Name (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="My Dental Clinic" data-testid="input-clinic" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}

                <Button type="submit" className="w-full" disabled={loading} data-testid="button-submit-register">
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
