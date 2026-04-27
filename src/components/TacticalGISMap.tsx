import React, { useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface TacticalMarker {
  id: string;
  lat: number;
  lng: number;
  type: "victim" | "shelter" | "rescuer";
  label?: string;
  priorityScore?: number;
  occupancy?: number;
  capacity?: number;
}

interface TacticalGISMapProps {
  userLocation?: { lat: number; lng: number } | null;
  targetLocation?: { lat: number; lng: number } | null;
  markers?: TacticalMarker[];
  onMarkerClick?: (id: string) => void;
  selectedMarkerId?: string | null;
  currentRole?: "VICTIM" | "RESCUER";
}

const defaultCenter = { lat: 12.9716, lng: 77.5946 };

export const DANGER_ZONES = [
  { id: "bellandur", lat: 12.9279, lng: 77.671, radius: 1800, name: "Bellandur Lake Overflow" },
  { id: "varthur", lat: 12.9406, lng: 77.7289, radius: 1600, name: "Varthur Lake Basin" },
  { id: "ulsoor", lat: 12.9822, lng: 77.6186, radius: 1200, name: "Ulsoor Flood Zone" },
  { id: "hebbal", lat: 13.045, lng: 77.5857, radius: 1400, name: "Hebbal Lake Surge" },
  { id: "agara", lat: 12.9248, lng: 77.6441, radius: 1200, name: "Agara Flood Zone" },
  { id: "silkboard", lat: 12.915, lng: 77.624, radius: 900, name: "Silk Board Flash Flood" },
  { id: "marathahalli", lat: 12.9575, lng: 77.6974, radius: 900, name: "Marathahalli ORR Flood" },
  { id: "hsr", lat: 12.9099, lng: 77.6432, radius: 800, name: "HSR Sector Flood" },
  { id: "koramangala", lat: 12.9358, lng: 77.6247, radius: 700, name: "Koramangala Waterlogging" },
  { id: "mahadevapura", lat: 12.992, lng: 77.691, radius: 900, name: "Mahadevapura Flood Zone" },
];

export const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getIcon = (color: string, size = 24) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        background:${color};
        border:2px solid white;
        border-radius:50%;
        box-shadow:0 0 12px ${color};
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const victimIcon = getIcon("#ef4444", 24);
const shelterIcon = getIcon("#3b82f6", 26);
const rescuerIcon = getIcon("#f59e0b", 26);

export default function TacticalGISMap({
  userLocation,
  targetLocation,
  markers = [],
  onMarkerClick,
  currentRole = "VICTIM",
}: TacticalGISMapProps) {
  const center = userLocation || defaultCenter;

  const [routePath, setRoutePath] = useState<[number, number][] | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const safeMarkers = useMemo(() => {
    const clean = markers.filter(
      (m) =>
        typeof m.lat === "number" &&
        typeof m.lng === "number" &&
        !isNaN(m.lat) &&
        !isNaN(m.lng)
    );

    const hasSelf = clean.some((m) => m.id === "rescuer-self" || m.id === "self");

    if (!hasSelf && userLocation) {
      clean.push({
        id: "self",
        lat: userLocation.lat,
        lng: userLocation.lng,
        type: currentRole === "RESCUER" ? "rescuer" : "victim",
        label: "You",
      });
    }

    return clean;
  }, [markers, userLocation, currentRole]);

  const fetchRoute = async (lat: number, lng: number) => {
    try {
      setLoadingRoute(true);

      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${center.lng},${center.lat};${lng},${lat}?overview=full&geometries=geojson`
      );

      const data = await res.json();

      if (data?.routes?.[0]?.geometry?.coordinates) {
        const converted = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as [number, number]
        );

        setRoutePath(converted);
      }
    } catch (err) {
      console.error("Route error:", err);
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[500px] rounded-3xl overflow-hidden border border-white/10">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {DANGER_ZONES.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: "red",
              fillColor: "red",
              fillOpacity: 0.18,
              weight: 1,
            }}
          >
            <Tooltip>{zone.name}</Tooltip>
          </Circle>
        ))}

        {targetLocation && (
          <Polyline
            positions={[
              [center.lat, center.lng],
              [targetLocation.lat, targetLocation.lng],
            ]}
            pathOptions={{
              color: "#f97316",
              weight: 5,
            }}
          />
        )}

        {routePath && (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: "#3b82f6",
              weight: 5,
            }}
          />
        )}

        {safeMarkers.map((marker) => {
          let icon = victimIcon;
          if (marker.type === "shelter") icon = shelterIcon;
          if (marker.type === "rescuer") icon = rescuerIcon;

          return (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick?.(marker.id),
              }}
            >
              <Popup>
                <div className="space-y-2 text-sm min-w-[180px]">
                  <div className="font-bold">{marker.label || marker.id}</div>

                  <div>
                    {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                  </div>

                  {marker.priorityScore !== undefined && (
                    <div className="text-red-600 font-bold">
                      Priority: {marker.priorityScore}%
                    </div>
                  )}

                  {marker.type === "shelter" && (
                    <>
                      <div className="text-xs">
                        Capacity: {marker.occupancy || 0}/{marker.capacity || 1000}
                      </div>

                      <button
                        onClick={() => fetchRoute(marker.lat, marker.lng)}
                        className="w-full bg-blue-600 text-white px-3 py-2 rounded"
                      >
                        {loadingRoute ? "Loading..." : "Show Safe Route"}
                      </button>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}