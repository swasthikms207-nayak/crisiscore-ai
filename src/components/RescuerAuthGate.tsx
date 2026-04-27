import React, { useState, useEffect } from "react";
import { auth, app } from "../firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { getDatabase, ref, set, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  LogIn,
  Loader2,
  Phone,
  User as UserIcon,
  ArrowLeft,
} from "lucide-react";
import RescuerDashboard from "../pages/RescuerDashboard";
import { useAuth } from "../contexts/AuthContext";

export default function RescuerAuthGate() {
  const navigate = useNavigate();
  const { session, setSession, logout } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rescueField, setRescueField] = useState("Boat Rescue");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const rtdb = getDatabase(app);
        const userRef = ref(rtdb, `users/${currentUser.uid}`);
        const snap = await get(userRef);

        if (snap.exists()) {
          const data = snap.val();

          setSession({
            userId: currentUser.uid,
            name: data.name || currentUser.displayName || "Rescuer",
            role: "RESCUER",
            age: 0,
            specialty: data.rescueField || data.specialty || "Flood Rescue",
            contactNumber: data.phone || "",
            sessionActive: true,
          });

          localStorage.setItem("userRole", "Rescuer");
          localStorage.setItem("profileComplete", "true");
          setShowProfileForm(false);
          navigate("/rescuer-dashboard", { replace: true });
        } else {
          setName(currentUser.displayName || "");
          setShowProfileForm(true);
        }
      } catch (err) {
        console.error("Profile check failed:", err);
        setName(currentUser.displayName || "");
        setShowProfileForm(true);
      }

      setLoading(false);
    });

    return () => unsub();
  }, [setSession, navigate]);

  const handleSignIn = async () => {
    if (isSigningIn) return;

    try {
      setIsSigningIn(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error?.code !== "auth/cancelled-popup-request") {
        console.error("Authentication Error:", error);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      localStorage.removeItem("userRole");
      localStorage.removeItem("profileComplete");
      window.location.reload();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleGoBack = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("profileComplete");
    window.location.reload();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.currentUser) return;

    setIsSubmitting(true);

    try {
      const rtdb = getDatabase(app);

      const profileData = {
        name,
        phone,
        rescueField,
        specialty: rescueField,
        role: "RESCUER",
        updatedAt: new Date().toISOString(),
      };

      await set(ref(rtdb, `users/${auth.currentUser.uid}`), profileData);

      setSession({
        userId: auth.currentUser.uid,
        name,
        role: "RESCUER",
        age: 0,
        specialty: rescueField,
        contactNumber: phone,
        sessionActive: true,
      });

      localStorage.setItem("userRole", "Rescuer");
      localStorage.setItem("profileComplete", "true");

      setShowProfileForm(false);
      navigate("/rescuer-dashboard", { replace: true });
    } catch (err) {
      console.error("Save rescuer profile failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-6 relative">
        <button
          onClick={handleGoBack}
          className="absolute top-5 left-5 flex gap-2 text-gray-400"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <ShieldAlert size={70} className="text-blue-500" />
        <h1 className="text-3xl font-bold">Rescuer Portal</h1>

        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-4 rounded-xl flex gap-3"
        >
          <LogIn size={20} />
          {isSigningIn ? "Opening..." : "Sign In With Google"}
        </button>
      </div>
    );
  }

  if (showProfileForm) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center p-6">
        <form
          onSubmit={handleSaveProfile}
          className="w-full max-w-md bg-zinc-900 p-6 rounded-2xl space-y-4"
        >
          <h2 className="text-2xl font-bold mb-4">
            Complete Rescuer Profile
          </h2>

          <label className="text-xs text-gray-400 flex items-center gap-2">
            <UserIcon size={14} />
            Name
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="w-full p-3 bg-zinc-800 rounded"
          />

          <label className="text-xs text-gray-400 flex items-center gap-2">
            <Phone size={14} />
            Phone Number
          </label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone Number"
            className="w-full p-3 bg-zinc-800 rounded"
          />

          <label className="text-xs text-gray-400">
            Flood Rescue Field
          </label>
          <select
            value={rescueField}
            onChange={(e) => setRescueField(e.target.value)}
            className="w-full p-3 bg-zinc-800 rounded"
          >
            <option value="Boat Rescue">Boat Rescue</option>
            <option value="Flood Evacuation">Flood Evacuation</option>
            <option value="Medical Support">Medical Support</option>
            <option value="Supply Delivery">Supply Delivery</option>
            <option value="Search And Rescue">Search And Rescue</option>
          </select>

          <button
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-xl font-bold"
          >
            {isSubmitting ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    );
  }

  if (!session) {
    setSession({
      userId: user.uid,
      name: user.displayName || "Rescuer",
      role: "RESCUER",
      age: 0,
      specialty: "Flood Rescue",
      sessionActive: true,
    });

    localStorage.setItem("userRole", "Rescuer");
    localStorage.setItem("profileComplete", "true");

    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        Loading rescuer dashboard...
      </div>
    );
  }

  return <RescuerDashboard externalLogout={handleLogout} />;
}