import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db, rtdb } from "../firebase";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { ref, update as updateRTDB } from "firebase/database";
import TacticalGISMap, {
  DANGER_ZONES,
  getDistanceKm,
  TacticalMarker,
} from "../components/TacticalGISMap";
import {
  Shield,
  LogOut,
  CheckCircle,
  Zap,
  MapPin,
  Phone,
  Users,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { motion } from "motion/react";

const RESCUER_LOCATION = {
  lat: 12.9172,
  lng: 77.6228,
};

const fixedShelters: TacticalMarker[] = [
  {
    id: "s1",
    lat: 12.9696,
    lng: 77.592,
    type: "shelter",
    label: "Kanteerava Stadium",
    capacity: 1000,
    occupancy: 420,
  },
  {
    id: "s2",
    lat: 12.9777,
    lng: 77.5913,
    type: "shelter",
    label: "Cubbon Park Relief Camp",
    capacity: 800,
    occupancy: 310,
  },
  {
    id: "s3",
    lat: 12.925,
    lng: 77.675,
    type: "shelter",
    label: "Bellandur Community Hall",
    capacity: 1200,
    occupancy: 950,
  },
  {
    id: "s4",
    lat: 12.91,
    lng: 77.645,
    type: "shelter",
    label: "HSR Relief Centre",
    capacity: 900,
    occupancy: 550,
  },
  {
    id: "s5",
    lat: 12.985,
    lng: 77.695,
    type: "shelter",
    label: "Mahadevapura Shelter",
    capacity: 750,
    occupancy: 420,
  },
];

const calculatePriority = (alert: any) => {
  let score = 0;

  const lat = Number(alert?.location?.lat);
  const lng = Number(alert?.location?.lng);

  if (!isNaN(lat) && !isNaN(lng)) {
    for (const dz of DANGER_ZONES) {
      const distance = getDistanceKm(lat, lng, dz.lat, dz.lng) * 1000;
      if (distance <= dz.radius) {
        score += 40;
        break;
      }
    }
  }

  if (alert?.medicalCondition) score += 15;

  const age = Number(alert?.age || 0);
  if (age > 0 && (age < 12 || age > 65)) score += 15;

  const severity = Number(alert?.severity || 0);
  score += severity * 6;

  if (
    typeof alert?.description === "string" &&
    /(trapped|drowning|injured|bleeding|stuck|rising)/i.test(alert.description)
  ) {
    score += 15;
  }

  return Math.min(score, 100);
};

export default function RescuerDashboard({
  externalLogout,
}: {
  externalLogout?: () => void;
}) {
  const { session, logout } = useAuth();

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const rescuerName =
    localStorage.getItem("rescuer_profile_name") || session?.name || "Rescuer";

  const handleLogout = () => {
    if (externalLogout) externalLogout();
    else logout();
  };

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "alerts"),
      (snapshot) => {
        const alertData = snapshot.docs
          .map((docSnap) => {
            const data: any = docSnap.data();

            const lat = Number(data?.location?.lat);
            const lng = Number(data?.location?.lng);

            const safeData = {
              id: docSnap.id,
              ...data,
              victimName: data?.victimName || "Unknown Victim",
              locationName: data?.locationName || "Unknown Location",
              location: !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null,
            };

            return {
              ...safeData,
              priorityScore: calculatePriority(safeData),
            };
          })
          .filter(
            (a) =>
              a.status === "active" ||
              a.status === "claimed" ||
              a.status === "accepted"
          );

        setAlerts(alertData);
        setLoading(false);
      },
      (err) => {
        console.error("Rescuer alert fetch failed:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const claimedMission = alerts.find(
    (a) =>
      (a.status === "claimed" || a.status === "accepted") &&
      (a.rescuerId === session?.userId || a.rescuerName === rescuerName)
  );

  const sortedAlerts = useMemo(() => {
    return [...alerts].sort(
      (a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)
    );
  }, [alerts]);

  const mapMarkers: TacticalMarker[] = useMemo(() => {
    const victims: TacticalMarker[] = alerts
      .map((a) => {
        const lat = Number(a?.location?.lat);
        const lng = Number(a?.location?.lng);

        if (isNaN(lat) || isNaN(lng)) return null;

        return {
          id: a.id,
          lat,
          lng,
          type: "victim" as const,
          label: a.victimName || "Victim",
          priorityScore: a.priorityScore || 0,
        };
      })
      .filter(Boolean) as TacticalMarker[];

    return [
      ...victims,
      ...fixedShelters,
      {
        id: "rescuer-self",
        lat: RESCUER_LOCATION.lat,
        lng: RESCUER_LOCATION.lng,
        type: "rescuer" as const,
        label: rescuerName,
      },
    ];
  }, [alerts, rescuerName]);

  const acceptAlert = async (id: string) => {
    try {
      if (!session?.userId) return;

      const selected = alerts.find((a) => a.id === id);

      if (!selected?.location) {
        window.alert("Victim location is missing.");
        return;
      }

      const distance = getDistanceKm(
        RESCUER_LOCATION.lat,
        RESCUER_LOCATION.lng,
        selected.location.lat,
        selected.location.lng
      );

      const eta = Math.max(1, Math.ceil((distance / 25) * 60));

      const updateData = {
        status: "accepted",
        rescuerId: session.userId,
        rescuerName,
        currentETA: eta,
        acceptedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "alerts", id), updateData);
      await updateRTDB(ref(rtdb, `alerts/${id}`), updateData);
    } catch (err) {
      console.error("Accept rescue failed:", err);
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      const updateData = {
        status: "RESOLVED",
        resolvedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "alerts", id), updateData);
      await updateRTDB(ref(rtdb, `alerts/${id}`), updateData);
    } catch (err) {
      console.error("Resolve rescue failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        Loading Rescue Dashboard...
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] flex flex-col overflow-hidden text-white">
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0A0A0A]">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-orange-500" />
          <div>
            <h1 className="text-xl font-black uppercase italic leading-none">
              Mission Control
            </h1>
            <span className="text-[10px] font-mono text-gray-500 uppercase">
              Operator: {rescuerName}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-red-500"
        >
          <LogOut size={20} />
        </button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <main className="w-full h-[50vh] md:h-auto md:flex-1 bg-[#050505]">
          <TacticalGISMap
            markers={mapMarkers}
            selectedMarkerId={selectedAlertId}
            onMarkerClick={setSelectedAlertId}
            currentRole="RESCUER"
            userLocation={RESCUER_LOCATION}
            targetLocation={claimedMission?.location || null}
          />
        </main>

        <aside className="w-full md:w-[410px] border-l border-white/10 overflow-y-auto p-4 space-y-4 bg-[#080808]">
          {claimedMission ? (
            <div className="bg-cyan-500/10 border border-cyan-500 p-4 rounded-xl space-y-4">
              <h2 className="font-black text-lg uppercase text-cyan-300">
                Active Mission
              </h2>

              <div className="bg-black/40 rounded-xl p-4 space-y-3">
                <p>
                  <b>Victim:</b> {claimedMission.victimName}
                </p>
                <p>
                  <b>Location:</b> {claimedMission.locationName || "Unknown"}
                </p>
                <p className="text-orange-400">
                  <b>ETA:</b> {claimedMission.currentETA} mins
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 rounded-xl p-3">
                  <Users size={16} className="text-orange-400 mb-1" />
                  <p className="text-[10px] text-gray-500 uppercase">People</p>
                  <p className="font-bold">{claimedMission.peopleCount || 1}</p>
                </div>

                <div className="bg-black/40 rounded-xl p-3">
                  <Clock size={16} className="text-orange-400 mb-1" />
                  <p className="text-[10px] text-gray-500 uppercase">Trapped</p>
                  <p className="font-bold">{claimedMission.durationMin || 0} mins</p>
                </div>

                <div className="bg-black/40 rounded-xl p-3">
                  <AlertTriangle size={16} className="text-red-400 mb-1" />
                  <p className="text-[10px] text-gray-500 uppercase">Risk</p>
                  <p className="font-bold">{claimedMission.riskLevel || "MEDIUM"}</p>
                </div>

                <div className="bg-black/40 rounded-xl p-3">
                  <MapPin size={16} className="text-blue-400 mb-1" />
                  <p className="text-[10px] text-gray-500 uppercase">Score</p>
                  <p className="font-bold">{claimedMission.priorityScore || 0}%</p>
                </div>
              </div>

              {claimedMission.contactNumber &&
                claimedMission.contactNumber !== "Not Provided" && (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase text-blue-300">
                        Contact Number
                      </p>
                      <p className="font-mono">{claimedMission.contactNumber}</p>
                    </div>

                    <a
                      href={`tel:${claimedMission.contactNumber}`}
                      className="bg-blue-600 px-3 py-2 rounded-lg text-sm font-bold"
                    >
                      <Phone size={16} />
                    </a>
                  </div>
                )}

              {claimedMission.description && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-[10px] uppercase text-gray-400 mb-1">
                    Situation Briefing
                  </p>
                  <p className="text-sm text-gray-200">
                    {claimedMission.description}
                  </p>
                </div>
              )}

              <button
                onClick={() => resolveAlert(claimedMission.id)}
                className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold"
              >
                <CheckCircle className="inline mr-2" size={18} />
                Complete Rescue
              </button>
            </div>
          ) : sortedAlerts.length > 0 ? (
            sortedAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                whileHover={{ scale: 1.02 }}
                className="bg-zinc-900 p-4 rounded-xl border border-white/10"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{alert.victimName}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {alert.locationName}
                    </p>
                  </div>

                  <span className="text-orange-500 font-bold">
                    {alert.priorityScore}%
                  </span>
                </div>

                {alert.status === "active" ? (
                  <button
                    onClick={() => acceptAlert(alert.id)}
                    className="mt-3 w-full bg-orange-500 hover:bg-orange-600 py-2 rounded text-sm font-bold"
                  >
                    <Zap className="inline mr-2" size={14} />
                    Accept Rescue
                  </button>
                ) : (
                  <p className="mt-3 text-xs text-cyan-400">
                    Accepted by {alert.rescuerName || "rescuer"}
                  </p>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center text-gray-500 mt-10">
              No active alerts found.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}