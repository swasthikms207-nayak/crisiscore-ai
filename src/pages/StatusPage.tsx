import React, { useState, useEffect, useMemo } from "react";
import { Activity, Wifi, Zap, Shield, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { db, rtdb } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot as onFirestoreSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, onValue, update as updateRTDB } from "firebase/database";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function StatusPage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [alertData, setAlertData] = useState<any>(null);
  const [glitch, setGlitch] = useState(false);
  const [terminating, setTerminating] = useState(false);

  const displayName = session?.name || "Victim";

  useEffect(() => {
    const currentSosId = localStorage.getItem("current_sos_id");

    if (currentSosId) {
      const alertRef = ref(rtdb, `alerts/${currentSosId}`);

      const unsubscribe = onValue(alertRef, (snapshot) => {
        if (snapshot.exists()) {
          setAlertData(snapshot.val());
        }
      });

      return () => unsubscribe();
    }

    if (!session?.name) return;

    const q = query(
      collection(db, "alerts"),
      where("victimName", "==", session.name),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onFirestoreSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setAlertData({ id: snapshot.docs[0].id, ...data });
      }
    });

    return unsubscribe;
  }, [session?.name]);

  useEffect(() => {
    const timer = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const terminateAlert = async () => {
    const alertId = alertData?.id || localStorage.getItem("current_sos_id");
    if (!alertId || terminating) return;

    const ok = window.confirm("Terminate this rescue alert?");
    if (!ok) return;

    setTerminating(true);

    try {
      const updateData = {
        status: "CANCELLED",
        status_msg: "Alert terminated by victim",
        cancelledAt: new Date().toISOString(),
      };

      await updateRTDB(ref(rtdb, `alerts/${alertId}`), updateData);
      await updateDoc(doc(db, "alerts", alertId), updateData);

      localStorage.removeItem("current_sos_id");
      navigate("/dashboard");
    } catch (err) {
      console.error("Terminate failed:", err);
      alert("Could not terminate alert.");
    } finally {
      setTerminating(false);
    }
  };

  const currentStage = useMemo(() => {
    if (!alertData) return 1;
    if (alertData.status === "RESOLVED") return 4;
    if (alertData.status === "CANCELLED") return 4;
    if (alertData.status === "claimed" || alertData.status === "accepted") return 3;
    return 2;
  }, [alertData]);

  const accepted = alertData?.status === "claimed" || alertData?.status === "accepted";
  const resolved = alertData?.status === "RESOLVED";
  const cancelled = alertData?.status === "CANCELLED";

  const stages = [
    { id: 1, label: "Signal Sent" },
    { id: 2, label: "Alert Active" },
    { id: 3, label: "Rescue Assigned" },
    { id: 4, label: cancelled ? "Cancelled" : "Complete" },
  ];

  const protocols: any = {
    Flood: ["CLIMB TO HIGH GROUND.", "AVOID BASEMENTS.", "KEEP PHONE CHARGED."],
    Other: ["STAY CALM.", "KEEP PHONE ACTIVE.", "WAIT FOR RESCUER UNIT."],
  };

  const steps = protocols[alertData?.disasterType] || protocols.Other;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col overflow-hidden relative text-white font-sans">
      <div className="p-4 flex justify-between items-center bg-black/60 border-b border-white/10 z-20">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/70">
            Uplink: [ {displayName} ]
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Wifi className="w-3 h-3 text-green-500" />
          <span className="text-[8px] font-mono uppercase text-gray-500">Network Active</span>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-start p-6 overflow-y-auto z-10 pb-20">
        <div className="w-full max-w-xl flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mt-12 mb-10 relative"
          >
            <div
              className={`transition-all flex flex-col items-center justify-center ${glitch ? "blur-sm grayscale" : ""
                }`}
            >
              {!accepted && !resolved && !cancelled && (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 animate-pulse" />
                  </div>

                  <h2 className="text-2xl font-black text-orange-500 uppercase tracking-widest animate-pulse">
                    Waiting for Rescuer
                  </h2>

                  <p className="text-sm text-gray-400">Rescue teams have been alerted.</p>
                </div>
              )}

              {accepted && !resolved && !cancelled && (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping" />
                    <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center relative z-10">
                      <Shield className="w-8 h-8 text-cyan-400 animate-pulse" />
                    </div>
                  </div>

                  <h2 className="text-3xl font-black text-cyan-400 uppercase tracking-tight">
                    Rescue On Its Way
                  </h2>

                  <p className="text-xl font-black text-white uppercase italic tracking-tight">
                    {alertData?.rescuerName ? `Operator ${alertData.rescuerName}` : "Rescue Unit"}
                  </p>

                  {alertData?.currentETA !== undefined && alertData?.currentETA !== null && (
                    <p className="text-orange-400 font-mono text-xl">
                      ETA: {alertData.currentETA} mins
                    </p>
                  )}
                </div>
              )}

              {resolved && (
                <div className="flex flex-col items-center gap-4">
                  <CheckCircle2 className="w-20 h-20 text-green-500" />
                  <h2 className="text-3xl font-black text-green-500 uppercase">
                    Rescue Complete
                  </h2>
                </div>
              )}

              {cancelled && (
                <div className="flex flex-col items-center gap-4">
                  <XCircle className="w-20 h-20 text-red-500" />
                  <h2 className="text-3xl font-black text-red-500 uppercase">
                    Alert Cancelled
                  </h2>
                </div>
              )}
            </div>
          </motion.div>

          <div className="w-full bg-[#111] p-8 rounded-3xl border border-white/5 mb-6">
            <div className="grid grid-cols-4 gap-4">
              {stages.map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${s.id <= currentStage ? "bg-red-500" : "bg-gray-800"
                      }`}
                  />
                  <span
                    className={`text-[8px] text-center font-bold uppercase ${s.id === currentStage ? "text-white" : "text-gray-600"
                      }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!resolved && !cancelled && alertData && (
            <button
              onClick={terminateAlert}
              disabled={terminating}
              className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl py-4 font-black uppercase mb-8"
            >
              {terminating ? "Terminating..." : "Terminate Alert"}
            </button>
          )}

          <div className="w-full space-y-4">
            <div className="flex items-center gap-2 mb-2 px-2">
              <Zap size={14} className="text-orange-500" />
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                Vital Instructions
              </span>
            </div>

            {steps.map((step: string, i: number) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="p-6 bg-white/5 border border-white/5 rounded-3xl"
              >
                <p className="text-xl font-bold text-white uppercase">{step}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}