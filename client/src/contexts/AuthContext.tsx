import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getMe } from "@/lib/auth";

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "patient" | "doctor" | "admin";
  creditBalance: number;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  doctorProfile: any | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setDoctorProfile: (profile: any | null) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await getMe();
      if (data) {
        setUser(data.user);
        setDoctorProfile(data.doctorProfile || null);
      } else {
        setUser(null);
        setDoctorProfile(null);
      }
    } catch {
      setUser(null);
      setDoctorProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, doctorProfile, loading, setUser, setDoctorProfile, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
