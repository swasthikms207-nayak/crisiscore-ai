import React, { useState, useEffect } from 'react';
import { useAuth, UserSession } from '../contexts/AuthContext';
import { ShieldCheck, User, Zap, Save, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function Profile() {
  const { session, setSession } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    bloodGroup: '',
    medicalConditions: '',
    contactNumber: '',
    specialty: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (session) {
      setFormData({
        name: session.name,
        age: session.age.toString(),
        bloodGroup: session.bloodGroup || '',
        medicalConditions: session.medicalConditions || '',
        contactNumber: session.contactNumber || '',
        specialty: session.specialty || 'Boat Operator'
      });
    }
  }, [session]);

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData: any = {
        name: formData.name,
      };

      if (session.role === 'VICTIM') {
        updateData.bloodGroup = formData.bloodGroup;
        updateData.medicalConditions = formData.medicalConditions;
        updateData.contactNumber = formData.contactNumber;
      } else {
        updateData.contactNumber = formData.contactNumber;
        updateData.specialty = formData.specialty;
      }

      await updateDoc(doc(db, 'users', session.userId), updateData);

      // Update session locally
      const updatedSession: UserSession = {
        ...session,
        name: formData.name,
        age: session.age,
        bloodGroup: session.role === 'VICTIM' ? formData.bloodGroup : undefined,
        medicalConditions: session.role === 'VICTIM' ? formData.medicalConditions : undefined,
        contactNumber: formData.contactNumber,
        specialty: session.role === 'RESCUER' ? formData.specialty : undefined,
      };

      setSession(updatedSession);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-start p-6 pt-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <div className={`p-4 rounded-2xl ${session.role === 'VICTIM' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
              {session.role === 'VICTIM' ? <User size={28} /> : <ShieldCheck size={28} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tight underline decoration-orange-500/50">Edit Profile</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${session.role === 'VICTIM' ? 'border-red-500/30 text-red-500' : 'border-orange-500/30 text-orange-500'}`}>
                  {session.role}
                </span>
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">ID: {session.userId.slice(0, 8)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold px-1">Display Identity</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold px-1">Current Age</label>
              <input
                required
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500 transition-all text-sm"
              />
            </div>

            {session.role === 'VICTIM' ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold px-1">Contact Number</label>
                  <input required type="tel" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-red-500 transition-all text-sm" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold px-1">Phone Number</label>
                  <input required type="tel" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500 transition-all text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold px-1">Flood Rescue Role</label>
                  <select required value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500 transition-all text-sm">
                    <option value="Boat Operator">Boat Operator</option>
                    <option value="Swimmer Rescue">Swimmer Rescue</option>
                    <option value="Medical Support">Medical Support</option>
                    <option value="Evacuation Lead">Evacuation Lead</option>
                    <option value="Supply Coordinator">Supply Coordinator</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-orange-500 hover:text-white transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-20 mt-6 shadow-xl relative z-10"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  Update Tactical Profile
                </>
              )}
            </button>
          </form>

          {/* Success Overlay */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-sm z-20 flex items-center justify-center text-green-500"
              >
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <CheckCircle size={64} className="animate-pulse" />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Profile Updated</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tactical Note */}
        <div className="mt-8 p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-start gap-4">
          <Zap className="text-orange-500 shrink-0 mt-1" size={16} />
          <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-mono">
            Notice: Identity changes are synced instantly to the Mesh-Network. Mission-critical data must remain accurate to ensure rescue efficiency.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
