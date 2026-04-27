import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Activity,
  ShieldCheck,
  Users,
  Zap,
  ArrowLeft,
  Heart,
  Briefcase,
  User,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, rtdb } from "../firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useNavigate } from "react-router-dom";

type ViewState = "ROLE_SELECT" | "PROFILE_FORM";

export default function Auth() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>("ROLE_SELECT");
  const [role, setRole] = useState<"VICTIM" | "RESCUER" | null>(null);

  // Profile Form States
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    bloodGroup: "",
    medicalConditions: "",
    contactNumber: "",
    specialty: "Medic",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savedProfileData = localStorage.getItem("persistent_profile");
  const savedProfile = savedProfileData ? JSON.parse(savedProfileData) : null;

  const handleReturnUser = () => {
    if (savedProfile) {
      setSession(savedProfile);
      localStorage.setItem(
        "userRole",
        savedProfile.role === "RESCUER" ? "Rescuer" : "Victim",
      );
      localStorage.setItem("profileComplete", "true");
      window.dispatchEvent(new Event("storage"));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // After sign-in, stay on ROLE_SELECT or move to PROFILE_FORM if role is chosen
    } catch (error) {
      console.error("Google Sign-in Error:", error);
    }
  };

  const handleRoleChoice = (choice: "VICTIM" | "RESCUER") => {
    setRole(choice);
    if (choice === "RESCUER") {
      // Direct rescuers to the new Google Auth Gate flow (handled in App.tsx/RescuerAuthGate)
      localStorage.setItem("userRole", "Rescuer");
      localStorage.setItem("profileComplete", "true");
      window.dispatchEvent(new Event("storage"));
    } else {
      // For Victims, we don't force Google Auth anymore
      setView("PROFILE_FORM");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (role === "RESCUER") {
      // Ensure user is signed in (Google) for Rescuer
      if (!auth.currentUser) {
        try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
        } catch (error) {
          console.error("Auth required before profile save:", error);
          return;
        }
      }
    }

    if (!role || !formData.name || !formData.age) return;

    setIsSubmitting(true);
    try {
      // If we have currentUser, use it. Otherwise, create a temporary session
      const uid = auth.currentUser?.uid || `anon_${Date.now()}`;
      
      const userData = {
        userId: uid,
        name: formData.name,
        age: parseInt(formData.age),
        role,
        bloodGroup: formData.bloodGroup || "UNK",
        medicalConditions: formData.medicalConditions || "None",
        contactNumber: formData.contactNumber || "Not Provided",
        sessionActive: true,
      };

      if (auth.currentUser) {
        const dbRef = ref(rtdb, "users/" + uid);
        await set(dbRef, userData);
      }

      // Store in local storage for AuthContext recovery and root switcher
      localStorage.setItem("persistent_profile", JSON.stringify(userData));
      localStorage.setItem("userRole", role === "RESCUER" ? "Rescuer" : "Victim");
      localStorage.setItem("profileComplete", "true");
      setSession(userData);
      window.dispatchEvent(new Event("storage"));

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505]">
      <AnimatePresence mode="wait">
        {view === "ROLE_SELECT" ? (
          <motion.div
            key="role-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md w-full"
          >
            <div className="text-center mb-10">
              <Activity className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h1 className="text-4xl font-black text-white uppercase tracking-tight">
                CrisisCore AI
              </h1>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mt-2">
                Initialize Tactical Environment
              </p>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 space-y-6">
              <h2 className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                Identify Your Status
              </h2>

              {savedProfile && (
                <div className="mb-6 relative">
                  <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"></div>
                  <button
                    onClick={handleReturnUser}
                    className="relative w-full p-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all flex items-center justify-between group shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block text-xs font-mono text-blue-400 uppercase tracking-widest">
                          Welcome Back
                        </span>
                        <span className="block text-lg font-black uppercase text-white tracking-tight">
                          Continue as {savedProfile.name}?
                        </span>
                      </div>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-blue-500 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleRoleChoice("VICTIM")}
                  className="p-6 rounded-2xl border border-white/5 bg-black hover:border-red-500/50 transition-all group flex items-center gap-6"
                >
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500 group-hover:text-black transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="block text-lg font-black uppercase text-white">
                      Victim / Alert
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase">
                      Requesting Immediate SOS Uplink
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleChoice("RESCUER")}
                  className="p-6 rounded-2xl border border-white/5 bg-black hover:border-orange-500/50 transition-all group flex items-center gap-6"
                >
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-black transition-colors">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="block text-lg font-black uppercase text-white">
                      Rescuer
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase">
                      Emergency Service Operator
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="profile-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full"
          >
            <button
              onClick={() => setView("ROLE_SELECT")}
              className="mb-6 flex items-center gap-2 text-[10px] font-mono text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
            >
              <ArrowLeft size={14} /> Back to Role
            </button>

            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div
                  className={`p-3 rounded-2xl ${role === "VICTIM" ? "bg-red-500/10 text-red-500" : "bg-orange-500/10 text-orange-500"}`}
                >
                  {role === "VICTIM" ? (
                    <User size={24} />
                  ) : (
                    <ShieldCheck size={24} />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
                    {role} Profile
                  </h2>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    Tactical Registration
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold px-1">
                    Legal Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Full Identity"
                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold px-1">
                    Age
                  </label>
                  <input
                    required
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    placeholder="25"
                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                {role === "VICTIM" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold px-1">
                        Contact Number
                      </label>
                      <input
                        required
                        type="tel"
                        value={formData.contactNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactNumber: e.target.value,
                          })
                        }
                        placeholder="Emergency Contact Phone"
                        className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-red-500 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold px-1">
                        Blood Group
                      </label>
                      <select
                        required
                        value={formData.bloodGroup}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bloodGroup: e.target.value,
                          })
                        }
                        className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-red-500 transition-all text-sm"
                      >
                        <option value="">Select...</option>
                        {[
                          "A+",
                          "A-",
                          "B+",
                          "B-",
                          "AB+",
                          "AB-",
                          "O+",
                          "O-",
                          "UNK",
                        ].map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold px-1">
                        Medical Conditions
                      </label>
                      <textarea
                        value={formData.medicalConditions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            medicalConditions: e.target.value,
                          })
                        }
                        placeholder="Asthma, Diabetes, etc. (Optional)"
                        className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-red-500 transition-all text-sm h-20 resize-none"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold px-1">
                      Operational Specialty
                    </label>
                    <select
                      required
                      value={formData.specialty}
                      onChange={(e) =>
                        setFormData({ ...formData, specialty: e.target.value })
                      }
                      className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500 transition-all text-sm"
                    >
                      <option value="Medic">Medical / First Aid</option>
                      <option value="Diver">Underwater Rescue</option>
                      <option value="Firefighter">HAZMAT / Fire</option>
                      <option value="Navigator">Navigator / SAR</option>
                      <option value="Comms">Communication / Signal</option>
                      <option value="Coordinator">Logistics</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-orange-500 hover:text-white transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-4 shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500 group-hover:text-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      Complete Profile
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
