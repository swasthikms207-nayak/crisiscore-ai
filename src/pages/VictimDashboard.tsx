import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import { db, rtdb } from "../firebase";

import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  push,
  set,
} from "firebase/database";

import { analyzeCrisis } from "../services/geminiService";

import TacticalGISMap, {
  DANGER_ZONES,
} from "../components/TacticalGISMap";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  LogOut,
  Map as MapIcon,
  Send,
  Siren,
  Users,
} from "lucide-react";

import { motion } from "motion/react";

export default function VictimDashboard() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<
    "home" | "alert" | "map"
  >("home");

  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [shelters, setShelters] = useState<any[]>(
    []
  );

  const [peopleCount, setPeopleCount] =
    useState(1);

  const [riskLevel, setRiskLevel] =
    useState("MEDIUM");

  const [durationMin, setDurationMin] =
    useState(0);

  const [description, setDescription] =
    useState("");

  const [sending, setSending] =
    useState(false);

  /* LOCATION */
  useEffect(() => {
    const zone =
      DANGER_ZONES[
      Math.floor(
        Math.random() *
        DANGER_ZONES.length
      )
      ];

    setLocation({
      lat:
        zone.lat +
        (Math.random() - 0.5) * 0.005,
      lng:
        zone.lng +
        (Math.random() - 0.5) * 0.005,
    });
  }, []);

  /* SHELTERS */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "shelters"),
      (snapshot) => {
        setShelters(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }
    );

    return () => unsub();
  }, []);

  /* MAP MARKERS */
  const mapMarkers = useMemo(() => {
    const fixedShelters = [
      {
        id: "s1",
        lat: 12.9696,
        lng: 77.592,
        type: "shelter" as const,
        label: "Kanteerava Stadium",
        capacity: 1200,
        occupancy: 847,
      },
      {
        id: "s2",
        lat: 12.9777,
        lng: 77.5913,
        type: "shelter" as const,
        label: "Cubbon Park Safe Zone",
        capacity: 950,
        occupancy: 522,
      },
      {
        id: "s3",
        lat: 12.9721,
        lng: 77.5855,
        type: "shelter" as const,
        label: "St. Martha Hospital",
        capacity: 700,
        occupancy: 481,
      },
    ];

    const firestoreShelters =
      shelters.map((s) => ({
        id: s.id,
        lat: Number(
          s.location?.lat || 12.9716
        ),
        lng: Number(
          s.location?.lng || 77.5946
        ),
        type: "shelter" as const,
        label: s.name || "Safe Zone",
      }));

    return [
      ...fixedShelters,
      ...firestoreShelters,
    ];
  }, [shelters]);

  /* GET AREA NAME */
  const getNearestAreaName = (
    lat: number,
    lng: number
  ) => {
    let nearest = DANGER_ZONES[0];
    let min = Infinity;

    for (const zone of DANGER_ZONES) {
      const d =
        Math.abs(zone.lat - lat) +
        Math.abs(zone.lng - lng);

      if (d < min) {
        min = d;
        nearest = zone;
      }
    }

    return nearest.name;
  };

  /* SEND SOS */
  const sendSOS = async () => {
    if (!session || sending) return;

    setSending(true);

    try {
      const loc = location || {
        lat: 12.9279,
        lng: 77.671,
      };

      const aiResponse =
        await analyzeCrisis(
          session.name,
          session.age || 0,
          "Flood",
          loc,
          session.contactNumber ||
          "CONTACT_LOCAL",
          {
            peopleCount,
            riskLevel,
            description,
          }
        );

      let severity = 3;

      if (riskLevel === "LOW")
        severity = 1;

      if (riskLevel === "HIGH")
        severity = 4;

      if (riskLevel === "CRITICAL")
        severity = 5;

      const alertRef = push(
        ref(rtdb, "alerts")
      );

      const alertId = alertRef.key;

      if (!alertId)
        throw new Error(
          "Could not create alert ID"
        );

      const payload = {
        id: alertId,

        victimName: session.name,

        age: session.age || 0,

        userId: session.userId,

        medicalCondition:
          !!session.medicalConditions &&
          session.medicalConditions !==
          "None",

        medicalConditionsList:
          session.medicalConditions ||
          "Not Provided",

        contactNumber:
          session.contactNumber ||
          "Not Provided",

        bloodGroup:
          session.bloodGroup || "UNK",

        disasterType: "Flood",

        peopleCount,

        riskLevel,

        severity,

        durationMin,

        description,

        location: loc,

        locationName:
          getNearestAreaName(
            loc.lat,
            loc.lng
          ),

        status: "active",

        status_msg:
          aiResponse.status_msg ||
          "SOS sent successfully.",

        guidance: Array.isArray(
          aiResponse.safety_protocol
        )
          ? aiResponse.safety_protocol.join(
            " "
          )
          : "Stay calm and wait for rescue.",

        createdAt:
          new Date().toISOString(),
      };

      /* RTDB */
      await set(alertRef, payload);

      /* FIRESTORE */
      await setDoc(
        doc(db, "alerts", alertId),
        {
          ...payload,
          createdAt:
            serverTimestamp(),
        }
      );

      localStorage.setItem(
        "current_sos_id",
        alertId
      );

      navigate("/rescue-session");
    } catch (err) {
      console.error(
        "SOS failed:",
        err
      );

      alert(
        "SOS sending failed. Check Firebase or Gemini setup."
      );
    } finally {
      setSending(false);
    }
  };

  if (!session) return null;

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0A0A0A]">
        <div className="flex items-center gap-2 text-red-500">
          <Activity size={24} />
          <span className="font-black uppercase italic">
            CrisisCore
          </span>
        </div>

        <button
          onClick={logout}
          className="p-2 bg-white/5 rounded-lg hover:text-red-500"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* HOME */}
      {view === "home" && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() =>
              setView("alert")
            }
            className="w-full max-w-md bg-red-600 hover:bg-red-500 rounded-3xl p-8 border border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.25)]"
          >
            <div className="flex flex-col items-center gap-4">
              <Siren size={64} />

              <h1 className="text-2xl font-black uppercase">
                Send Emergency Alert
              </h1>

              <p className="text-sm text-red-100 text-center">
                Use this if you are
                trapped, injured, or
                need urgent rescue.
              </p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() =>
              setView("map")
            }
            className="w-full max-w-md bg-blue-700 hover:bg-blue-600 rounded-3xl p-8 border border-blue-400/40"
          >
            <div className="flex flex-col items-center gap-4">
              <MapIcon size={56} />

              <h2 className="text-xl font-black uppercase">
                View Safe Zones
              </h2>
            </div>
          </motion.button>
        </main>
      )}

      {/* ALERT */}
      {view === "alert" && (
        <main className="flex-1 overflow-y-auto p-5">
          <div className="max-w-lg mx-auto space-y-5">
            <button
              onClick={() =>
                setView("home")
              }
              className="flex items-center gap-2 text-gray-400"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500" />

                <div>
                  <h2 className="font-black text-xl uppercase">
                    Emergency Details
                  </h2>

                  <p className="text-xs text-gray-400">
                    Sending as{" "}
                    {session.name}
                  </p>
                </div>
              </div>
            </div>

            {/* PEOPLE */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
                <label className="text-xs text-gray-400 uppercase flex gap-2 items-center mb-2">
                  <Users size={14} />
                  People
                </label>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() =>
                      setPeopleCount(
                        Math.max(
                          1,
                          peopleCount - 1
                        )
                      )
                    }
                    className="text-2xl px-3"
                  >
                    -
                  </button>

                  <span className="text-2xl font-black text-orange-500">
                    {peopleCount}
                  </span>

                  <button
                    onClick={() =>
                      setPeopleCount(
                        peopleCount + 1
                      )
                    }
                    className="text-2xl px-3"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* DURATION */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
                <label className="text-xs text-gray-400 uppercase mb-2 block">
                  Trapped Time
                </label>

                <input
                  type="number"
                  min="0"
                  value={durationMin}
                  onChange={(e) =>
                    setDurationMin(
                      Number(
                        e.target.value
                      ) || 0
                    )
                  }
                  className="w-full bg-black rounded-xl p-3 text-orange-500 outline-none"
                  placeholder="Minutes"
                />
              </div>
            </div>

            {/* RISK */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
              <label className="text-xs text-gray-400 uppercase mb-2 block">
                Situation Type
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  "LOW",
                  "MEDIUM",
                  "HIGH",
                  "CRITICAL",
                ].map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setRiskLevel(level)
                    }
                    className={`p-3 rounded-xl font-bold ${riskLevel === level
                      ? "bg-orange-500 text-black"
                      : "bg-black text-gray-300"
                      }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
              <label className="text-xs text-gray-400 uppercase mb-2 block">
                Describe Situation
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Example: Water is rising, trapped on first floor..."
                className="w-full h-32 bg-black rounded-xl p-4 outline-none resize-none"
              />
            </div>

            {/* SEND */}
            <button
              onClick={sendSOS}
              disabled={sending}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-60 rounded-2xl py-5 font-black uppercase flex items-center justify-center gap-3"
            >
              <Send size={20} />

              {sending
                ? "Sending Alert..."
                : "Send SOS Alert"}
            </button>
          </div>
        </main>
      )}

      {/* MAP */}
      {view === "map" && (
        <main className="flex-1 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <button
              onClick={() =>
                setView("home")
              }
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>

          <div className="flex-1 p-4">
            <TacticalGISMap
              markers={mapMarkers}
              currentRole="VICTIM"
              userLocation={
                location || {
                  lat: 12.9716,
                  lng: 77.5946,
                }
              }
            />
          </div>
        </main>
      )}
    </div>
  );
}