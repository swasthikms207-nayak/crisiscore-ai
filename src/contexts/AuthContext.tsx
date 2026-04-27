import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

export interface UserSession {
  userId: string;
  name: string;
  role: "VICTIM" | "RESCUER";
  age: number;
  contactNumber?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  specialty?: string;
  sessionActive: boolean;
}

interface AuthContextType {
  session: UserSession | null;
  loading: boolean;
  setSession: (session: UserSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial check for persistent profile (anonymous or saved)
    const saved = localStorage.getItem("persistent_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSession(parsed);
      } catch (e) {
        console.error("Failed to parse saved session", e);
      }
    }

    // 2. Implement onAuthStateChanged combined with real-time onSnapshot listener
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Real-time listener for the user's profile
        const unsubscribeSnapshot = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const newSession = {
              userId: user.uid,
              name: data.name,
              role: data.role,
              age: data.age,
              bloodGroup: data.bloodGroup,
              medicalConditions: data.medicalConditions,
              contactNumber: data.contactNumber || data.phone,
              specialty: data.specialty || data.vehicleType,
              sessionActive: true,
            } as UserSession;
            
            // Automatically update React state / triggers redirect
            setSession(newSession);
            localStorage.setItem("userRole", data.role === "RESCUER" ? "Rescuer" : "Victim");
            localStorage.setItem("profileComplete", "true");
            window.dispatchEvent(new Event('storage'));
          } else {
            // Document doesn't exist yet, might be mid-creation
          }
          setLoading(false);
        });

        // Cleanup the snapshot listener when auth state changes or unmounts
        return () => unsubscribeSnapshot();
      } else {
        setSession(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const updateSession = useCallback((newSession: UserSession) => {
    setSession(newSession);
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    ["crisis_tactical_session", "userRole", "profileComplete", "persistent_profile", "current_sos_id"].forEach((key) =>
      localStorage.removeItem(key),
    );
    setSession(null);
    window.location.reload();
  }, []);

  const value = React.useMemo(
    () => ({
      session,
      loading,
      setSession: updateSession,
      logout,
    }),
    [session, loading, updateSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
