"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Search, MapPin } from "lucide-react";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface GeofenceMapProps {
  lat: number;
  lng: number;
  radius: number;
  onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ position, setPosition, radius }: { position: { lat: number, lng: number }, setPosition: (p: { lat: number, lng: number }) => void, radius: number }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return (
    <>
      <Marker position={[position.lat, position.lng]} icon={icon} />
      <Circle
        center={[position.lat, position.lng]}
        pathOptions={{ fillColor: '#A238FF', color: '#A238FF', weight: 2, fillOpacity: 0.25 }}
        radius={radius}
      />
    </>
  );
}

function MapController({ targetPos }: { targetPos: {lat: number, lng: number} | null }) {
  const map = useMap();
  useEffect(() => {
    if (targetPos) {
      map.flyTo([targetPos.lat, targetPos.lng], 16);
    }
  }, [targetPos, map]);
  return null;
}

export default function GeofenceMap({ lat, lng, radius, onChange }: GeofenceMapProps) {
  const [position, setPosition] = useState({ lat, lng });
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [flyToPos, setFlyToPos] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onChange(position.lat, position.lng);
  }, [position]);

  const searchLocation = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&viewbox=${position.lng - 0.5},${position.lat + 0.5},${position.lng + 0.5},${position.lat - 0.5}&bounded=1`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    }
    setIsSearching(false);
  };

  const selectResult = (result: any) => {
    const newPos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    setPosition(newPos);
    setSearchQuery("");
    setSearchResults([]);
    setFlyToPos(newPos);
  };

  const locateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(newPos);
          setFlyToPos(newPos);
        },
        () => alert("Location access denied.")
      );
    }
  };

  if (!mounted) return <div style={{ height: "400px", background: "#f6f4f1", borderRadius: "12px", border: "1px solid #ddd8d1" }} />;

  return (
    <div style={{ height: "400px", borderRadius: "12px", overflow: "hidden", border: "1px solid #ddd8d1", zIndex: 0, position: "relative" }}>
      
      {/* Custom Pro Search Box */}
      <div style={{ position: "absolute", top: "14px", left: "50%", transform: "translateX(-50%)", zIndex: 1000, width: "85%", maxWidth: "400px" }}>
        <div style={{ display: "flex", alignItems: "center", background: "#fff", padding: "0 14px", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", height: "46px", border: "1px solid #e7dcf1" }}>
          <Search size={18} color="#A238FF" style={{ marginRight: "10px" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => searchLocation(e.target.value)}
            placeholder="Search nearby places..."
            style={{ border: "none", outline: "none", width: "100%", fontSize: "14px", color: "#18151b", background: "transparent" }}
          />
        </div>
        {searchResults.length > 0 && (
          <div style={{ marginTop: "6px", background: "#fff", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: "1px solid #e7dcf1", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {searchResults.map((result, i) => (
              <button
                type="button"
                key={i}
                onClick={() => selectResult(result)}
                style={{ textAlign: "left", padding: "12px 14px", background: "transparent", border: "none", borderBottom: i === searchResults.length - 1 ? "none" : "1px solid #f6f4f1", cursor: "pointer", fontSize: "13px", color: "#35204a", display: "flex", alignItems: "center", gap: "10px" }}
              >
                <MapPin size={14} color="#888" />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Locate Me FAB */}
      <button
        onClick={(e) => { e.preventDefault(); locateMe(); }}
        style={{ position: "absolute", bottom: "24px", right: "24px", zIndex: 1000, background: "#fff", width: "46px", height: "46px", borderRadius: "50%", display: "grid", placeItems: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: "1px solid #e7dcf1", cursor: "pointer", color: "#A238FF" }}
        title="Find my location"
      >
        <LocateFixed size={20} />
      </button>

      <MapContainer 
        center={[position.lat, position.lng]} 
        zoom={15} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%", filter: "grayscale(100%) contrast(110%) sepia(5%) brightness(105%)" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} radius={radius} />
        <MapController targetPos={flyToPos} />
      </MapContainer>
    </div>
  );
}
