import React, { useState, useEffect } from "react";
import { MapPin, Radio, Shield, Navigation, Settings, Layers, Search, Compass, Loader2 } from "lucide-react";
import { CivicSignal, IoTSensor } from "../types";

interface MapProps {
  city: string;
  signals: CivicSignal[];
  sensors?: IoTSensor[];
  selectedSignalId?: string | null;
  onSelectSignal?: (id: string) => void;
  selectedSensorId?: string | null;
  onSelectSensor?: (sensor: IoTSensor | null) => void;
  mode: "report" | "sentinel" | "warroom" | "standard";
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  activeRouteToId?: string | null; // ID of incident being dispatched
  theme?: "light" | "dark";
  onCityChange?: (city: string) => void;
}

export default function Map({
  city,
  signals,
  sensors = [],
  selectedSignalId,
  onSelectSignal,
  selectedSensorId,
  onSelectSensor,
  mode,
  onLocationSelect,
  activeRouteToId,
  theme = "dark",
  onCityChange
}: MapProps) {
  const [mapType, setMapType] = useState<"dark" | "satellite">("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeSatellite, setActiveSatellite] = useState<"snt1" | "snt2" | "snt5p" | "carto3">("snt1");

  // Force satellite view by default in sentinel mode
  useEffect(() => {
    if (mode === "sentinel") {
      setMapType("satellite");
    }
  }, [mode]);

  // Center coordinates relative for SVG scaling
  // Delhi base: 28.6139, 77.2090
  const getCityBase = (cityName: string) => {
    switch (cityName.toUpperCase()) {
      case "MUMBAI":
        return { name: "Mumbai", lat: 19.0760, lng: 72.8777 };
      case "BANGALORE":
        return { name: "Bangalore", lat: 12.9716, lng: 77.5946 };
      case "CHENNAI":
        return { name: "Chennai", lat: 13.0827, lng: 80.2707 };
      case "KOLKATA":
        return { name: "Kolkata", lat: 22.5726, lng: 88.3639 };
      case "HYDERABAD":
        return { name: "Hyderabad", lat: 17.3850, lng: 78.4867 };
      case "JAIPUR":
        return { name: "Jaipur", lat: 26.9124, lng: 75.7873 };
      case "PUNE":
        return { name: "Pune", lat: 18.5204, lng: 73.8567 };
      case "AHMEDABAD":
        return { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 };
      case "LUCKNOW":
        return { name: "Lucknow", lat: 26.8467, lng: 80.9462 };
      case "KOCHI":
        return { name: "Kochi", lat: 9.9312, lng: 76.2673 };
      case "DELHI":
      default:
        return { name: "Delhi", lat: 28.6139, lng: 77.2090 };
    }
  };

  const cityBase = getCityBase(city);

  // Clear temp marker when city changes
  useEffect(() => {
    setTempMarker(null);
  }, [city]);

  // Convert real lat/lng to SVG coordinate (0 - 1000 range)
  const getSvgCoords = (lat: number, lng: number) => {
    // Relative scaling around the selected city
    const latDiff = lat - cityBase.lat;
    const lngDiff = lng - cityBase.lng;

    // Scale factors to fit within 1000x600 coordinate system
    const scaleX = 4000;
    const scaleY = 4000;

    const x = 500 + lngDiff * scaleX;
    const y = 300 - latDiff * scaleY; // Invert Y for screen space

    // Constrain inside bounds
    return {
      x: Math.max(50, Math.min(950, x)),
      y: Math.max(50, Math.min(550, y))
    };
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode === "sentinel") {
      if (onSelectSensor) onSelectSensor(null);
      return;
    }
    if (mode !== "report" && mode !== "standard") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert SVG coords back to relative lat/lng
    const svgX = (x / rect.width) * 1000;
    const svgY = (y / rect.height) * 600;

    const lngDiff = (svgX - 500) / 4000;
    const latDiff = (300 - svgY) / 4000;

    const lat = Number((cityBase.lat + latDiff).toFixed(4));
    const lng = Number((cityBase.lng + lngDiff).toFixed(4));

    let address = "";
    if (city.toUpperCase() === "DELHI") {
      if (svgX < 400 && svgY < 300) address = `Rajouri Garden Sector 3, New Delhi`;
      else if (svgX > 600 && svgY < 300) address = `Mayur Vihar Extension, New Delhi`;
      else if (svgX < 400 && svgY > 300) address = `Dwarka Sector 11 Avenue, New Delhi`;
      else address = `Sector 4 Main Road near Central Secretariat, New Delhi`;
    } else {
      address = `Main Road, Central ${cityBase.name} (${lat}, ${lng})`;
    }

    setTempMarker({ lat, lng, address });
    if (onLocationSelect) {
      onLocationSelect(lat, lng, address);
    }
  };

  const findClosestCity = (lat: number, lng: number): string => {
    const cities = [
      { name: "Delhi", lat: 28.6139, lng: 77.2090 },
      { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
      { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
      { name: "Chennai", lat: 13.0827, lng: 80.2707 },
      { name: "Kolkata", lat: 22.5726, lng: 88.3639 }
    ];

    let closest = cities[0];
    let minDistance = Infinity;

    for (const c of cities) {
      const d = Math.sqrt(Math.pow(lat - c.lat, 2) + Math.pow(lng - c.lng, 2));
      if (d < minDistance) {
        minDistance = d;
        closest = c;
      }
    }

    return closest.name;
  };

  const handleDetectLocation = () => {
    if (isDetecting) return;
    setIsDetecting(true);
    setStatusMessage("Acquiring GPS coordinates...");

    if (!navigator.geolocation) {
      setStatusMessage("Error: Geolocation not supported by your browser.");
      setTimeout(() => setStatusMessage(null), 3000);
      setIsDetecting(false);
      fallbackDetect();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const lat = Number(latitude.toFixed(4));
        const lng = Number(longitude.toFixed(4));
        setStatusMessage(`GPS locked! Resolving address for [${lat}, ${lng}]...`);

        // Check if closer to another city
        const closestCityName = findClosestCity(lat, lng);
        if (onCityChange && closestCityName.toLowerCase() !== city.toLowerCase()) {
          onCityChange(closestCityName);
        }

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            {
              headers: {
                "Accept-Language": "en"
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            const address = data.display_name || `GPS Location: ${lat}, ${lng}`;
            setTempMarker({ lat, lng, address });
            if (onLocationSelect) {
              onLocationSelect(lat, lng, address);
            }
            setStatusMessage(null);
          } else {
            throw new Error("Reverse geocoding failed");
          }
        } catch (err) {
          console.warn("Reverse geocoding error:", err);
          const address = `GPS Location (${lat}, ${lng})`;
          setTempMarker({ lat, lng, address });
          if (onLocationSelect) {
            onLocationSelect(lat, lng, address);
          }
          setStatusMessage(null);
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.warn("Geolocation error:", error);
        let errorMsg = "GPS access denied. Using proximity simulation.";
        if (error.code === error.TIMEOUT) {
          errorMsg = "GPS request timed out. Using proximity simulation.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "GPS signal unavailable. Using proximity simulation.";
        }
        setStatusMessage(errorMsg);
        setTimeout(() => setStatusMessage(null), 3000);
        fallbackDetect();
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const fallbackDetect = () => {
    const lat = Number((cityBase.lat + (Math.random() - 0.5) * 0.02).toFixed(4));
    const lng = Number((cityBase.lng + (Math.random() - 0.5) * 0.02).toFixed(4));
    const address = `GPS Proximity Location, Central ${cityBase.name}`;
    setTempMarker({ lat, lng, address });
    if (onLocationSelect) {
      onLocationSelect(lat, lng, address);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || isSearching) return;

    setIsSearching(true);
    setStatusMessage(`Searching for "${searchQuery}" on global grid...`);

    try {
      let query = searchQuery;
      const cleanSearch = searchQuery.toLowerCase();
      if (!cleanSearch.includes("delhi") &&
          !cleanSearch.includes("mumbai") &&
          !cleanSearch.includes("bangalore") &&
          !cleanSearch.includes("chennai") &&
          !cleanSearch.includes("kolkata")) {
        query = `${searchQuery}, ${cityBase.name}`;
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            "Accept-Language": "en"
          }
        }
      );

      if (response.ok) {
        const results = await response.json();
        if (results && results.length > 0) {
          const first = results[0];
          const lat = Number(Number(first.lat).toFixed(4));
          const lng = Number(Number(first.lon).toFixed(4));
          const address = first.display_name;

          // Check if closer to another city
          const closestCityName = findClosestCity(lat, lng);
          if (onCityChange && closestCityName.toLowerCase() !== city.toLowerCase()) {
            onCityChange(closestCityName);
          }
          
          setTempMarker({ lat, lng, address });
          if (onLocationSelect) {
            onLocationSelect(lat, lng, address);
          }
          setStatusMessage(null);
        } else {
          // If query had city contextualized, fallback to search query as-is
          if (query !== searchQuery) {
            const rawResponse = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
              {
                headers: {
                  "Accept-Language": "en"
                }
              }
            );
            if (rawResponse.ok) {
              const rawResults = await rawResponse.json();
              if (rawResults && rawResults.length > 0) {
                const first = rawResults[0];
                const lat = Number(Number(first.lat).toFixed(4));
                const lng = Number(Number(first.lon).toFixed(4));
                const address = first.display_name;

                // Check if closer to another city
                const closestCityName = findClosestCity(lat, lng);
                if (onCityChange && closestCityName.toLowerCase() !== city.toLowerCase()) {
                  onCityChange(closestCityName);
                }

                setTempMarker({ lat, lng, address });
                if (onLocationSelect) {
                  onLocationSelect(lat, lng, address);
                }
                setStatusMessage(null);
                setIsSearching(false);
                return;
              }
            }
          }
          
          setStatusMessage(`No match found. Plotting best approximation...`);
          setTimeout(() => setStatusMessage(null), 3000);
          fallbackSearch();
        }
      } else {
        throw new Error("Search geocoding failed");
      }
    } catch (err) {
      console.warn("Geocoding search error:", err);
      setStatusMessage("Connection error. Using simulated fallback.");
      setTimeout(() => setStatusMessage(null), 3000);
      fallbackSearch();
    } finally {
      setIsSearching(false);
    }
  };

  const fallbackSearch = () => {
    const lat = Number((cityBase.lat + (Math.random() - 0.5) * 0.03).toFixed(4));
    const lng = Number((cityBase.lng + (Math.random() - 0.5) * 0.03).toFixed(4));
    const address = `${searchQuery}, ${cityBase.name} (Simulated Coordinate)`;
    setTempMarker({ lat, lng, address });
    if (onLocationSelect) {
      onLocationSelect(lat, lng, address);
    }
  };

  // Find routing coordinates for active war room dispatch
  const activeSignal = signals.find(s => s.id === activeRouteToId);
  const dispatchCoords = activeSignal ? getSvgCoords(activeSignal.location.lat, activeSignal.location.lng) : null;
  // Headquarters is at relative center 500, 300
  const hqCoords = { x: 420, y: 380 };

  const getCityTelemetry = (cityName: string) => {
    switch (cityName.toUpperCase()) {
      case "MUMBAI":
        return [
          { name: "AIR QUALITY", value: "95.0", unit: "AQI", status: "ONLINE", color: "#06b6d4" },
          { name: "WATER LEVEL", value: "120.4", unit: "m³/s", status: "CRITICAL", color: "#3b82f6" },
          { name: "WASTE FILL", value: "30.0", unit: "% Fill", status: "ONLINE", color: "#10b981" },
          { name: "SMART GRID", value: "78.0", unit: "% Load", status: "ONLINE", color: "#eab308" },
          { name: "TRAFFIC FLOW", value: "94.0", unit: "Car/min", status: "ONLINE", color: "#ec4899" }
        ];
      case "BANGALORE":
        return [
          { name: "AIR QUALITY", value: "135.0", unit: "AQI", status: "ONLINE", color: "#06b6d4" },
          { name: "WATER LEVEL", value: "12.1", unit: "m³/s", status: "ONLINE", color: "#3b82f6" },
          { name: "WASTE FILL", value: "65.0", unit: "% Fill", status: "ONLINE", color: "#10b981" },
          { name: "SMART GRID", value: "84.0", unit: "% Load", status: "ONLINE", color: "#eab308" },
          { name: "TRAFFIC FLOW", value: "110.0", unit: "Car/min", status: "CRITICAL", color: "#ec4899" }
        ];
      case "CHENNAI":
        return [
          { name: "AIR QUALITY", value: "72.0", unit: "AQI", status: "ONLINE", color: "#06b6d4" },
          { name: "WATER LEVEL", value: "18.3", unit: "m³/s", status: "ONLINE", color: "#3b82f6" },
          { name: "WASTE FILL", value: "48.0", unit: "% Fill", status: "ONLINE", color: "#10b981" },
          { name: "SMART GRID", value: "80.0", unit: "% Load", status: "ONLINE", color: "#eab308" },
          { name: "TRAFFIC FLOW", value: "52.0", unit: "Car/min", status: "ONLINE", color: "#ec4899" }
        ];
      case "KOLKATA":
        return [
          { name: "AIR QUALITY", value: "204.0", unit: "AQI", status: "CRITICAL", color: "#06b6d4" },
          { name: "WATER LEVEL", value: "5.2", unit: "meters", status: "ONLINE", color: "#3b82f6" },
          { name: "WASTE FILL", value: "76.0", unit: "% Fill", status: "ONLINE", color: "#10b981" },
          { name: "SMART GRID", value: "62.0", unit: "% Load", status: "ONLINE", color: "#eab308" },
          { name: "TRAFFIC FLOW", value: "68.0", unit: "Car/min", status: "ONLINE", color: "#ec4899" }
        ];
      case "HYDERABAD":
        return [
          { name: "AIR QUALITY", value: "110.0", unit: "AQI", status: "ONLINE", color: "#06b6d4" },
          { name: "WATER LEVEL", value: "32.4", unit: "m³/s", status: "ONLINE", color: "#3b82f6" },
          { name: "WASTE FILL", value: "54.0", unit: "% Fill", status: "ONLINE", color: "#10b981" },
          { name: "SMART GRID", value: "88.0", unit: "% Load", status: "ONLINE", color: "#eab308" },
          { name: "TRAFFIC FLOW", value: "124.0", unit: "Car/min", status: "CRITICAL", color: "#ec4899" }
        ];
      case "JAIPUR":
        return [
          { name: "AIR QUALITY", value: "145.0", unit: "AQI", status: "ONLINE", color: "#06b6d4" },
          { name: "WATER LEVEL", value: "4.8", unit: "meters", status: "ONLINE", color: "#3b82f6" },
          { name: "WASTE FILL", value: "96.0", unit: "% Fill", status: "CRITICAL", color: "#10b981" },
          { name: "SMART GRID", value: "72.0", unit: "% Load", status: "ONLINE", color: "#eab308" },
          { name: "TRAFFIC FLOW", value: "58.0", unit: "Car/min", status: "ONLINE", color: "#ec4899" }
        ];
      case "PUNE":
        return [
          { name: "AIR QUALITY", value: "85.0", unit: "AQI", status: "ONLINE", color: "#06b6d4" },
          { name: "WATER LEVEL", value: "15.6", unit: "m³/s", status: "ONLINE", color: "#3b82f6" },
          { name: "WASTE FILL", value: "32.0", unit: "% Fill", status: "ONLINE", color: "#10b981" },
          { name: "SMART GRID", value: "98.0", unit: "% Load", status: "CRITICAL", color: "#eab308" },
          { name: "TRAFFIC FLOW", value: "82.0", unit: "Car/min", status: "ONLINE", color: "#ec4899" }
        ];
      case "AHMEDABAD":
        return [
          { name: "AIR QUALITY", value: "112.0", unit: "AQI", status: "ONLINE", color: "#06b6d4" },
          { name: "WATER LEVEL", value: "22.8", unit: "m³/s", status: "ONLINE", color: "#3b82f6" },
          { name: "WASTE FILL", value: "45.0", unit: "% Fill", status: "ONLINE", color: "#10b981" },
          { name: "SMART GRID", value: "85.0", unit: "% Load", status: "ONLINE", color: "#eab308" },
          { name: "TRAFFIC FLOW", value: "90.0", unit: "Car/min", status: "ONLINE", color: "#ec4899" }
        ];
      case "LUCKNOW":
        return [
          { name: "AIR QUALITY", value: "168.0", unit: "AQI", status: "ONLINE", color: "#06b6d4" },
          { name: "WATER LEVEL", value: "4.1", unit: "meters", status: "ONLINE", color: "#3b82f6" },
          { name: "WASTE FILL", value: "72.0", unit: "% Fill", status: "ONLINE", color: "#10b981" },
          { name: "SMART GRID", value: "65.0", unit: "% Load", status: "ONLINE", color: "#eab308" },
          { name: "TRAFFIC FLOW", value: "70.0", unit: "Car/min", status: "ONLINE", color: "#ec4899" }
        ];
      case "KOCHI":
        return [
          { name: "AIR QUALITY", value: "65.0", unit: "AQI", status: "ONLINE", color: "#06b6d4" },
          { name: "WATER LEVEL", value: "1.8", unit: "meters", status: "ONLINE", color: "#3b82f6" },
          { name: "WASTE FILL", value: "50.0", unit: "% Fill", status: "ONLINE", color: "#10b981" },
          { name: "SMART GRID", value: "75.0", unit: "% Load", status: "ONLINE", color: "#eab308" },
          { name: "TRAFFIC FLOW", value: "62.0", unit: "Car/min", status: "ONLINE", color: "#ec4899" }
        ];
      case "DELHI":
      default:
        return [
          { name: "AIR QUALITY", value: "342.0", unit: "AQI", status: "CRITICAL", color: "#06b6d4" },
          { name: "WATER LEVEL", value: "45.1", unit: "m³/s", status: "ONLINE", color: "#3b82f6" },
          { name: "WASTE FILL", value: "85.0", unit: "% Fill", status: "ONLINE", color: "#10b981" },
          { name: "SMART GRID", value: "92.0", unit: "% Load", status: "ONLINE", color: "#eab308" },
          { name: "TRAFFIC FLOW", value: "74.0", unit: "Car/min", status: "ONLINE", color: "#ec4899" }
        ];
    }
  };

  const isDark = theme === "dark";

  return (
    <div className={`flex flex-col gap-4 w-full h-full`}>
      {/* RESTURED TOP BAR: SEARCH AND DETECT LOCATION (MATCHES SCREENSHOT 4) */}
      {mode === "report" && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Enter landmark or use GPS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSearching}
                className={`w-full text-xs px-4 py-2.5 pl-10 rounded-xl border focus:outline-none focus:border-purple-500 transition ${
                  isDark 
                    ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500" 
                    : "bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400"
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md active:scale-95 flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              {isSearching ? "SEARCHING..." : "SEARCH"}
            </button>
          </form>

          <button
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold border transition shrink-0 active:scale-95 disabled:opacity-50 ${
              isDark
                ? "border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
            }`}
          >
            {isDetecting ? (
              <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
            ) : (
              <Compass className="w-4 h-4 text-purple-500" />
            )}
            {isDetecting ? "DETECTING..." : "DETECT LOCATION"}
          </button>
        </div>
      )}

      {/* Actual Map Canvas Frame */}
      <div className={`relative w-full ${
        mode === "sentinel" ? "h-[620px] lg:h-[680px]" : "h-[360px] md:h-[420px]"
      } rounded-2xl overflow-hidden border shadow-2xl transition-colors duration-300 ${
        isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"
      }`}>
        {/* SENTINEL-SPECIFIC OVERLAYS (Shown when mode === "sentinel") */}
        {mode === "sentinel" && (
          <>
            {/* 1. SATELLITE SELECTOR BAR (TOP CENTER OVERLAY) */}
            <div className="absolute top-4 left-4 right-4 z-20 flex flex-col md:flex-row gap-3 items-center justify-between pointer-events-none">
              <div className={`flex flex-wrap items-center gap-1.5 p-1 border rounded-xl backdrop-blur-md shadow-lg pointer-events-auto transition ${
                isDark ? "bg-slate-900/95 border-slate-800/80" : "bg-white/95 border-slate-200/90 shadow-slate-200/50"
              }`}>
                <span className="text-[9px] font-mono font-extrabold text-purple-600 dark:text-purple-400 px-2 uppercase tracking-wider">SATELLITE ORBITER:</span>
                {[
                  { id: "snt1", name: "SENTINEL-1", label: "RADAR" },
                  { id: "snt2", name: "SENTINEL-2", label: "OPTICAL" },
                  { id: "snt5p", name: "SENTINEL-5P", label: "POLLUTION" },
                  { id: "carto3", name: "CARTOSAT-3", label: "HIGH-RES" }
                ].map((sat) => (
                  <button
                    key={sat.id}
                    onClick={() => setActiveSatellite(sat.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold font-mono tracking-wider transition ${
                      activeSatellite === sat.id
                        ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                        : isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {sat.name} ({sat.label})
                  </button>
                ))}
              </div>

              <div className={`hidden lg:block border px-3 py-1.5 rounded-xl backdrop-blur-sm shadow-md text-[9px] font-mono transition ${
                isDark ? "bg-slate-900/95 border-slate-800 text-purple-300" : "bg-white/95 border-slate-200 text-purple-700 font-bold"
              }`}>
                {activeSatellite === "snt1" && "ORBIT: 693KM POLAR | FREQ: 5.405 GHz (C-BAND) | SWATH: 250KM"}
                {activeSatellite === "snt2" && "ORBIT: 786KM SUN-SYNCHRONOUS | SPECTRAL BANDS: 13 | NDVI ACTIVE"}
                {activeSatellite === "snt5p" && "ORBIT: 824KM NEAR-POLAR | SENSOR: TROPOMI SPECTROMETER"}
                {activeSatellite === "carto3" && "ORBIT: 509KM SSO | RESOLUTION: 0.28M PANCHROMATIC | LOCK: ACTIVE"}
              </div>
            </div>

            {/* 2. GRID HEALTH OVERLAY (FLOATING LEFT CARD) */}
            <div className={`absolute top-20 left-4 z-10 w-60 p-4 rounded-xl border backdrop-blur-md shadow-2xl hidden lg:flex flex-col transition ${
              isDark ? "bg-slate-950/90 border-slate-850/80" : "bg-white/95 border-slate-200 shadow-slate-200/50"
            }`}>
              <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 font-extrabold tracking-widest uppercase mb-1">● {city.toUpperCase()} COMMAND</span>
              <h3 className={`text-xs font-display font-black tracking-wider mb-3 uppercase ${
                isDark ? "text-white" : "text-slate-800"
              }`}>
                {city} GRID HEALTH
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div className={`border p-3 rounded-lg text-left ${
                  isDark ? "bg-slate-900/80 border-slate-850/60" : "bg-slate-50 border-slate-100"
                }`}>
                  <span className={`text-xl font-mono font-black block ${isDark ? "text-white" : "text-slate-800"}`}>
                    {sensors.filter(s => s.status === "ONLINE").length || 3}
                  </span>
                  <span className="text-[8px] font-mono text-emerald-500 font-bold tracking-wider uppercase block mt-0.5">ONLINE</span>
                </div>
                <div className={`border p-3 rounded-lg text-left ${
                  isDark ? "bg-slate-900/80 border-slate-850/60" : "bg-slate-50 border-slate-100"
                }`}>
                  <span className={`text-xl font-mono font-black block ${isDark ? "text-white" : "text-slate-800"}`}>
                    {sensors.filter(s => s.status === "CRITICAL").length || 1}
                  </span>
                  <span className="text-[8px] font-mono text-red-500 font-bold tracking-wider uppercase block mt-0.5">CRITICAL</span>
                </div>
              </div>

              <div className={`mt-3 pt-3 border-t flex flex-col gap-1 text-[8px] font-mono transition ${
                isDark ? "border-slate-800/50 text-slate-400" : "border-slate-150 text-slate-500"
              }`}>
                <div className="flex items-center justify-between">
                  <span>LAST SCAN PASS:</span>
                  <span className="text-purple-600 dark:text-purple-300 font-bold">04:12 MIN AGO</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>NEXT OVERPASS:</span>
                  <span className="text-emerald-500 font-bold">12:35 MIN</span>
                </div>
              </div>
            </div>

            {/* 3. LIVE TELEMETRY OVERLAY (FLOATING RIGHT CARD) */}
            <div className={`absolute top-20 right-4 bottom-4 z-10 w-72 p-4 rounded-xl border backdrop-blur-md shadow-2xl hidden lg:flex flex-col justify-between overflow-y-auto transition ${
              isDark ? "bg-slate-950/90 border-slate-850/80" : "bg-white/95 border-slate-200 shadow-slate-200/50"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-xs font-display font-black tracking-wider uppercase ${
                    isDark ? "text-white" : "text-slate-800"
                  }`}>
                    LIVE TELEMETRY
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className={`text-[8px] font-mono tracking-wider mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>REAL-TIME STREAMING ORBITAL FEED</p>

                {/* Smooth Glowing Line Graph */}
                <div className={`h-20 w-full mb-4 relative overflow-hidden rounded-lg p-1 border ${
                  isDark ? "bg-slate-900/50 border-slate-800/60" : "bg-slate-100 border-slate-250/60"
                }`}>
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="25" x2="300" y2="25" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeWidth="0.5" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeWidth="0.5" strokeDasharray="3 3" />
                    <line x1="0" y1="75" x2="300" y2="75" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeWidth="0.5" strokeDasharray="3 3" />
                    
                    <path
                      d="M 0,55 C 30,35 50,75 90,60 C 130,45 150,90 190,40 C 230,15 250,55 300,35"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2"
                      className="animate-pulse"
                      style={{ filter: "drop-shadow(0 0 4px #8b5cf6)" }}
                    />
                    <path
                      d="M 0,55 C 30,35 50,75 90,60 C 130,45 150,90 190,40 C 230,15 250,55 300,35 L 300,100 L 0,100 Z"
                      fill="url(#chartGlow)"
                    />
                  </svg>
                </div>

                {/* Selected Sensor / Default Telemetry List */}
                {(() => {
                  const selectedSensor = sensors.find(s => s.id === selectedSensorId);
                  if (selectedSensor) {
                    return (
                      <div className="space-y-3">
                        <div className={`p-2 rounded-lg border flex items-center justify-between ${
                          isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-150"
                        }`}>
                          <div className="text-left text-[9px]">
                            <span className="text-[8px] font-mono text-purple-600 dark:text-purple-400 font-bold block">{selectedSensor.id}</span>
                            <h4 className={`font-bold truncate max-w-[120px] ${isDark ? "text-white" : "text-slate-800"}`}>{selectedSensor.name}</h4>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-bold ${
                            selectedSensor.status === "ONLINE" ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400 animate-pulse"
                          }`}>
                            ● {selectedSensor.status}
                          </span>
                        </div>

                        <div className={`p-3 rounded-lg border text-center ${
                          isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-150"
                        }`}>
                          <span className={`text-[8px] font-mono uppercase block ${isDark ? "text-slate-400" : "text-slate-500"}`}>SENSOR READING</span>
                          <span className={`text-xl font-mono font-bold block my-0.5 ${isDark ? "text-white" : "text-slate-800"}`}>
                            {selectedSensor.reading}
                          </span>
                          <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 font-bold">{selectedSensor.unit}</span>
                        </div>

                        <div>
                          <span className={`text-[8px] font-mono block uppercase mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>FLUX VARIATION (4H WINDOW)</span>
                          <div className="h-10 flex items-end gap-1 pt-1">
                            {selectedSensor.history?.map((h: any, idx: number) => {
                              const maxVal = Math.max(...selectedSensor.history.map((x: any) => x.value)) || 1;
                              const barHeight = (h.value / maxVal) * 100;
                              return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                                  <div
                                    className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-sm"
                                    style={{ height: `${Math.max(5, barHeight * 0.25)}px` }}
                                  ></div>
                                  <span className={`text-[6px] font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>{h.time}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (onSelectSensor) onSelectSensor(null);
                          }}
                          className={`w-full text-center py-1.5 rounded-lg text-[8px] font-mono font-bold transition pointer-events-auto border ${
                            isDark
                              ? "bg-slate-900 hover:bg-slate-850 text-purple-400 border-purple-950/40 hover:border-purple-800"
                              : "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-300"
                          }`}
                        >
                          RESET SELECTION FEED
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {getCityTelemetry(city).map((metric, index) => (
                        <div key={index} className={`flex items-center justify-between p-2 rounded-lg border transition ${
                          isDark ? "bg-slate-900/60 border-slate-850/50 hover:bg-slate-900" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full block animate-pulse" style={{ backgroundColor: metric.color }}></span>
                            <span className={`text-[8px] font-mono font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-600"}`}>{metric.name}</span>
                          </div>
                          <div className="text-right flex items-center gap-1.5">
                            <span className={`text-xs font-mono font-black ${isDark ? "text-white" : "text-slate-800"}`}>{metric.value}</span>
                            <span className={`text-[7px] font-mono font-semibold ${isDark ? "text-slate-500" : "text-slate-450"}`}>{metric.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className={`text-[8px] font-mono text-center border-t pt-2 mt-3 transition ${
                isDark ? "text-slate-500 border-slate-850" : "text-slate-400 border-slate-200"
              }`}>
                *Calibration Compliant: ISO-9002 Sentinel-Grid Protocol
              </div>
            </div>
          </>
        )}

        {/* Vector Toggle/Legend Overlays (Shown when mode !== "sentinel") */}
        {mode !== "sentinel" && (
          <>
            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 max-w-[90%]">
              <div className={`flex items-center backdrop-blur rounded-xl p-1 shadow-lg text-xs border ${
                isDark ? "bg-slate-900/90 border-slate-700/50" : "bg-white/95 border-slate-200"
              }`}>
                <button
                  onClick={() => setMapType("dark")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    mapType === "dark" 
                      ? "bg-purple-600 text-white shadow" 
                      : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {isDark ? "Vector Dark" : "Vector Light"}
                </button>
                <button
                  onClick={() => setMapType("satellite")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    mapType === "satellite" 
                      ? "bg-purple-600 text-white shadow" 
                      : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Satellite
                </button>
              </div>
            </div>

            <div className={`absolute top-4 right-4 z-10 flex flex-col gap-1.5 backdrop-blur p-3 rounded-xl shadow-lg text-[10px] border ${
              isDark 
                ? "bg-slate-900/90 border-slate-800 text-slate-300" 
                : "bg-white/95 border-slate-200 text-slate-600"
            }`}>
              <span className={`font-semibold border-b pb-1 mb-1 flex items-center gap-1 ${
                isDark ? "text-white border-slate-850" : "text-slate-900 border-slate-100"
              }`}>
                <Layers className="w-3.5 h-3.5 text-purple-500" /> SYSTEM LEGEND
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse block"></span> High / Critical Alert
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span> Medium Status
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span> Resolved Incident
              </div>
            </div>
          </>
        )}

        {/* Base Map Canvas */}
        <svg
          onClick={handleMapClick}
          viewBox="0 0 1000 600"
          className="w-full h-full cursor-crosshair select-none"
        >
          {/* Background / Map Styles - Adapts to Light Mode beautifully */}
          {mapType === "dark" ? (
            isDark ? (
              // Vector Dark Map Style
              <>
                <rect width="1000" height="600" fill="#0b0f19" />
                <path d="M 0,150 Q 300,120 400,200 T 700,500 T 1000,450" fill="none" stroke="#131e33" strokeWidth="40" strokeLinecap="round" />
                <path d="M 100,0 L 400,600" fill="none" stroke="#131e33" strokeWidth="25" />
                <path d="M 800,0 L 420,600" fill="none" stroke="#131e33" strokeWidth="25" />
                <circle cx="450" cy="300" r="180" fill="none" stroke="#131e33" strokeWidth="15" />
                
                {/* Water Bodies (Yamuna/Mithi relative rendering) */}
                <path d="M 700,-50 C 650,200 850,350 780,650" fill="none" stroke="#1e2c4a" strokeWidth="38" opacity="0.4" />
              </>
            ) : (
              // Vector Light Map Style (Bright and elegant for light mode!)
              <>
                <rect width="1000" height="600" fill="#f8fafc" />
                <path d="M 0,150 Q 300,120 400,200 T 700,500 T 1000,450" fill="none" stroke="#e2e8f0" strokeWidth="40" strokeLinecap="round" />
                <path d="M 100,0 L 400,600" fill="none" stroke="#e2e8f0" strokeWidth="25" />
                <path d="M 800,0 L 420,600" fill="none" stroke="#e2e8f0" strokeWidth="25" />
                <circle cx="450" cy="300" r="180" fill="none" stroke="#e2e8f0" strokeWidth="15" />
                
                {/* Water Bodies (Yamuna/Mithi relative rendering) */}
                <path d="M 700,-50 C 650,200 850,350 780,650" fill="none" stroke="#bfdbfe" strokeWidth="38" opacity="0.6" />
              </>
            )
          ) : (
            // Satellite Grid View (Looks highly digital and command-like)
            <>
              <rect width="1000" height="600" fill="#121824" />
              <defs>
                <pattern id="satellite-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <rect width="40" height="40" fill="none" stroke="#1f293d" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="1000" height="600" fill="url(#satellite-grid)" />
              {/* Forest / Green Cover blocks */}
              <rect x="50" y="80" width="180" height="150" rx="10" fill="#0a2a1a" opacity="0.6" />
              <rect x="580" y="320" width="220" height="180" rx="15" fill="#0a2a1a" opacity="0.5" />
              {/* Water River */}
              <path d="M 700,-50 C 650,200 850,350 780,650" fill="none" stroke="#0e233b" strokeWidth="42" strokeLinecap="round" opacity="0.8" />
            </>
          )}

          {/* Major Roads and Highways (Grid Lines overlay) */}
          <g stroke={isDark ? "#1a243a" : "#cbd5e1"} strokeWidth="2" opacity="0.5" fill="none">
            <line x1="0" y1="100" x2="1000" y2="100" />
            <line x1="0" y1="280" x2="1000" y2="280" />
            <line x1="0" y1="480" x2="1000" y2="480" />
            <line x1="200" y1="0" x2="200" y2="600" />
            <line x1="500" y1="0" x2="500" y2="600" />
            <line x1="800" y1="0" x2="800" y2="600" />
          </g>

          {/* Central Landmarks Label */}
          <g fill={isDark ? "#475569" : "#64748b"} fontSize="12" fontFamily="Space Grotesk" fontWeight="500" opacity="0.8">
            <text x="450" y="270" textAnchor="middle">{cityBase.name} Central</text>
            <text x="750" y="150">Yamuna Zone</text>
            <text x="120" y="440">Green Fields</text>
          </g>

          {/* SATELLITE SPECIFIC SCAN OVERLAYS */}
          {mode === "sentinel" && (
            <>
              {/* Common: Satellite Scan Footprints (Grey Swath blocks matching screenshot) */}
              <g id="satellite-swaths">
                <rect x="345" y="145" width="168" height="168" rx="8" fill={isDark ? "rgba(226, 232, 240, 0.12)" : "rgba(226, 232, 240, 0.85)"} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.5" strokeDasharray="4 4" />
                <rect x="178" y="275" width="168" height="168" rx="8" fill={isDark ? "rgba(226, 232, 240, 0.12)" : "rgba(226, 232, 240, 0.85)"} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.5" strokeDasharray="4 4" />
                <rect x="15" y="475" width="168" height="168" rx="8" fill={isDark ? "rgba(226, 232, 240, 0.12)" : "rgba(226, 232, 240, 0.85)"} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.5" strokeDasharray="4 4" />
              </g>

              {/* Sentinel-1 Radar (Cyan Scan sweep) */}
              {activeSatellite === "snt1" && (
                <g id="sentinel-1-radar-scan">
                  <line x1="0" y1="220" x2="1000" y2="220" stroke="rgba(6, 182, 212, 0.6)" strokeWidth="3" className="animate-[bounce_8s_infinite]" style={{ filter: "drop-shadow(0 0 6px #06b6d4)" }} />
                  <circle cx="500" cy="300" r="280" fill="none" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1.5" strokeDasharray="5 5" className="animate-[spin_40s_linear_infinite]" />
                  <circle cx="500" cy="300" r="140" fill="none" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" />
                </g>
              )}

              {/* Sentinel-2 Multispectral (Green agricultural/vegetation blocks) */}
              {activeSatellite === "snt2" && (
                <g id="sentinel-2-vegetation-ndivi">
                  <circle cx="150" cy="180" r="60" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" className="animate-pulse" />
                  <circle cx="700" cy="400" r="90" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" className="animate-pulse" />
                  <circle cx="480" cy="310" r="45" fill="rgba(16, 185, 129, 0.22)" stroke="#10b981" strokeWidth="1" />
                  <text x="150" y="140" fill="#10b981" fontSize="9" fontFamily="monospace" fontWeight="bold">NDVI HIGH ZONE: 0.82</text>
                  <text x="700" y="330" fill="#10b981" fontSize="9" fontFamily="monospace" fontWeight="bold">NDVI ESTUARY: 0.76</text>
                </g>
              )}

              {/* Sentinel-5P Atmospheric (Air Pollution Heatmap) */}
              {activeSatellite === "snt5p" && (
                <g id="sentinel-5p-gaseous">
                  <circle cx="850" cy="200" r="110" fill="rgba(239, 68, 68, 0.25)" style={{ filter: "blur(8px)" }} className="animate-pulse" />
                  <circle cx="450" cy="150" r="70" fill="rgba(245, 158, 11, 0.3)" style={{ filter: "blur(6px)" }} />
                  <circle cx="320" cy="420" r="95" fill="rgba(239, 68, 68, 0.22)" style={{ filter: "blur(10px)" }} className="animate-pulse" />
                  
                  <text x="850" y="240" fill="#ef4444" fontSize="10" fontFamily="monospace" fontWeight="black" textAnchor="middle">NO2 PLUME CONCENTRATION</text>
                  <text x="320" y="450" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="black" textAnchor="middle">CO AEROSOL LOCK</text>
                </g>
              )}

              {/* Cartosat-3 High-Res (Target-locking laser crosshairs) */}
              {activeSatellite === "carto3" && (
                <g id="cartosat-3-target-lock">
                  <g stroke="rgba(236, 72, 153, 0.4)" strokeWidth="0.8">
                    <line x1="500" y1="0" x2="500" y2="600" strokeDasharray="3 3" />
                    <line x1="0" y1="300" x2="1000" y2="300" strokeDasharray="3 3" />
                  </g>
                  {sensors.map((sensor) => {
                    const { x, y } = getSvgCoords(sensor.lat, sensor.lng);
                    return (
                      <g key={`lock-${sensor.id}`}>
                        <circle cx={x} cy={y} r="18" fill="none" stroke="#ec4899" strokeWidth="1" strokeDasharray="4 2" className="animate-[spin_10s_linear_infinite]" />
                        <line x1={x - 22} y1={y} x2={x + 22} y2={y} stroke="#ec4899" strokeWidth="0.5" />
                        <line x1={x} y1={y - 22} x2={x} y2={y + 22} stroke="#ec4899" strokeWidth="0.5" />
                      </g>
                    );
                  })}
                </g>
              )}
            </>
          )}

        {/* Render Dispatch Route Neon Line if active */}
        {mode === "warroom" && dispatchCoords && (
          <g>
            {/* Glowing route line path */}
            <line
              x1={hqCoords.x}
              y1={hqCoords.y}
              x2={dispatchCoords.x}
              y2={dispatchCoords.y}
              stroke="#a855f7"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="8 6"
              className="animate-[dash_15s_linear_infinite]"
              style={{
                strokeDashoffset: 100,
                filter: "drop-shadow(0 0 6px rgba(168,85,247,0.8))"
              }}
            />
            {/* Rapid Response Force Unit Indicator */}
            <circle cx={hqCoords.x} cy={hqCoords.y} r="8" fill="#a855f7" />
            <polygon
              points={`${hqCoords.x},${hqCoords.y - 8} ${hqCoords.x - 6},${hqCoords.y + 6} ${hqCoords.x + 6},${hqCoords.y + 6}`}
              fill="#ffffff"
              transform={`rotate(45, ${hqCoords.x}, ${hqCoords.y})`}
            />
          </g>
        )}

        {/* Render Civic Incident Markers */}
        {mode !== "sentinel" && signals.map((signal) => {
          const { x, y } = getSvgCoords(signal.location.lat, signal.location.lng);
          const isSelected = selectedSignalId === signal.id;
          const isHigh = signal.priority === "HIGH" || signal.priority === "CRITICAL";
          const isResolved = signal.lifecycle === "RESOLVED";

          let markerColor = "rgb(245, 158, 11)"; // yellow/amber default
          if (isResolved) markerColor = "rgb(16, 185, 129)"; // emerald
          else if (isHigh) markerColor = "rgb(239, 68, 68)"; // red/rose

          return (
            <g
              key={signal.id}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectSignal) onSelectSignal(signal.id);
              }}
              className="cursor-pointer group"
            >
              {/* Pulse rings for active high priority issues */}
              {isHigh && !isResolved && (
                <circle
                  cx={x}
                  cy={y}
                  r="20"
                  fill="none"
                  stroke={markerColor}
                  strokeWidth="1.5"
                  className="animate-ping opacity-40"
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
              )}

              {/* Pin Base Shadow */}
              <ellipse cx={x} cy={y + 8} rx="6" ry="2" fill="black" opacity="0.4" />

              {/* Pin Marker */}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? "11" : "8"}
                fill={markerColor}
                stroke="#0f172a"
                strokeWidth="2"
                className="transition-all duration-200 group-hover:scale-125"
                style={{
                  transformOrigin: `${x}px ${y}px`,
                  filter: isSelected ? `drop-shadow(0 0 8px ${markerColor})` : "none"
                }}
              />

              {/* Highlight outer white ring if selected */}
              {isSelected && (
                <circle
                  cx={x}
                  cy={y}
                  r="15"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  opacity="0.9"
                />
              )}

              {/* Small Tag Text on hover */}
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <rect
                  x={x - 45}
                  y={y - 32}
                  width="90"
                  height="18"
                  rx="4"
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={y - 20}
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="600"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  {signal.id} ({signal.priority})
                </text>
              </g>
            </g>
          );
        })}

        {/* Render IoT Sensor Pins if sentinel mode */}
        {mode === "sentinel" && sensors.map((sensor) => {
          const { x, y } = getSvgCoords(sensor.lat, sensor.lng);
          const isSelected = selectedSensorId === sensor.id;
          const isCritical = sensor.status === "CRITICAL";

          let sensorColor = "#06b6d4"; // Cyan default for Air
          if (sensor.type === "water") sensorColor = "#3b82f6"; // Blue
          else if (sensor.type === "waste") sensorColor = "#10b981"; // Emerald
          else if (sensor.type === "smart") sensorColor = "#eab308"; // Yellow
          else if (sensor.type === "traffic") sensorColor = "#ec4899"; // Pink

          return (
            <g
              key={sensor.id}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectSensor) onSelectSensor(sensor);
              }}
              className="cursor-pointer group"
            >
              {/* Outer pulsing ring if critical */}
              {isCritical && (
                <circle
                  cx={x}
                  cy={y}
                  r="24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  className="animate-ping opacity-60"
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
              )}

              {/* Base Ring glow */}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? "14" : "10"}
                fill={sensorColor}
                fillOpacity="0.25"
                stroke={sensorColor}
                strokeWidth={isSelected ? "3" : "1.5"}
                className="transition-all duration-200 group-hover:scale-110"
                style={{
                  transformOrigin: `${x}px ${y}px`,
                  filter: `drop-shadow(0 0 6px ${sensorColor})`
                }}
              />

              {/* Inner core dot */}
              <circle
                cx={x}
                cy={y}
                r="4.5"
                fill={isCritical ? "#ef4444" : "#ffffff"}
                stroke="#0f172a"
                strokeWidth="1"
              />

              {/* Sensor Text Banner */}
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <rect
                  x={x - 60}
                  y={y - 32}
                  width="120"
                  height="18"
                  rx="4"
                  fill="#0f172a"
                  stroke={sensorColor}
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={y - 20}
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="600"
                  fontFamily="Inter"
                  textAnchor="middle"
                >
                  {sensor.name}: {sensor.reading} {sensor.unit}
                </text>
              </g>
            </g>
          );
        })}

        {/* Temporary Selected Marker for Reporting */}
        {tempMarker && (
          <g>
            {/* Pulsing ring */}
            <circle
              cx={getSvgCoords(tempMarker.lat, tempMarker.lng).x}
              cy={getSvgCoords(tempMarker.lat, tempMarker.lng).y}
              r="22"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              className="animate-pulse"
            />
            {/* Glowing pin */}
            <path
              d="M0 -15 C-5 -15 -8 -11 -8 -7 C-8 0 0 10 0 10 C0 10 8 0 8 -7 C8 -11 5 -15 0 -15 Z"
              fill="#c084fc"
              stroke="#0f172a"
              strokeWidth="1.5"
              transform={`translate(${getSvgCoords(tempMarker.lat, tempMarker.lng).x}, ${getSvgCoords(tempMarker.lat, tempMarker.lng).y}) scale(1.3)`}
              style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.5))" }}
            />
            <circle
              cx={getSvgCoords(tempMarker.lat, tempMarker.lng).x}
              cy={getSvgCoords(tempMarker.lat, tempMarker.lng).y - 9}
              r="3.5"
              fill="#0f172a"
            />
          </g>
        )}
      </svg>

      {/* Floating Instructions Banner (Bottom Right) */}
      <div className={`absolute bottom-4 right-4 z-10 backdrop-blur border px-3 py-1.5 rounded-lg text-[10px] font-mono shadow-md flex items-center gap-1.5 pointer-events-none transition-colors ${
        isDark ? "bg-slate-950/90 border-slate-800 text-slate-400" : "bg-white/95 border-slate-200 text-slate-600 shadow-slate-200/50"
      }`}>
        <Radio className="w-3 h-3 text-purple-500 animate-pulse" />
        {mode === "report" ? (
          <span>CLICK MAP TO PLOT INCIDENT SIGNAL</span>
        ) : mode === "sentinel" ? (
          <span>CLICK SENSORS TO INSPECT LIVE TELEMETRY</span>
        ) : (
          <span>INTELLIGENT URBAN MONITOR SYSTEM STATUS: LIVE</span>
        )}
      </div>

      {/* Geolocation/Search Status Message Banner (Bottom Left) */}
      {statusMessage && (
        <div className={`absolute bottom-4 left-4 z-10 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-mono shadow-md flex items-center gap-1.5 border animate-pulse ${
          isDark 
            ? "bg-purple-950/90 border-purple-800/40 text-purple-200" 
            : "bg-purple-50/95 border-purple-200 text-purple-800"
        }`}>
          <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Info display if temp marker plotted */}
      {tempMarker && mode === "report" && (
        <div className={`absolute top-20 left-4 z-10 border p-2.5 rounded-xl shadow-xl max-w-xs text-[10px] transition ${
          isDark ? "bg-slate-950/95 border-purple-500/50 text-slate-300" : "bg-white/95 border-purple-200 text-slate-800"
        }`}>
          <p className="font-semibold text-purple-600 dark:text-purple-300 mb-0.5">LOCATION SELECTED</p>
          <p className={`truncate font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{tempMarker.address}</p>
          <p className={`font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>Lat: {tempMarker.lat} | Lng: {tempMarker.lng}</p>
        </div>
      )}
      </div>

      {/* MOBILE-ONLY REPLACEMENT PANELS (Visible only on smaller screens) */}
      {mode === "sentinel" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:hidden mt-4">
          
          {/* GRID HEALTH */}
          <div className={`border p-5 rounded-2xl transition ${
            isDark ? "bg-slate-950/90 border-slate-800" : "bg-white border-slate-200 shadow-md"
          }`}>
            <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 font-extrabold tracking-widest uppercase block mb-1">● {city.toUpperCase()} COMMAND</span>
            <h3 className={`text-xs font-display font-black tracking-wider mb-3 uppercase ${
              isDark ? "text-white" : "text-slate-800"
            }`}>
              {city} GRID HEALTH
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`border p-3 rounded-xl text-left ${
                isDark ? "bg-slate-900/80 border-slate-800/60" : "bg-slate-50 border-slate-100"
              }`}>
                <span className={`text-2xl font-mono font-bold block ${isDark ? "text-white" : "text-slate-800"}`}>
                  {sensors.filter(s => s.status === "ONLINE").length || 3}
                </span>
                <span className="text-[9px] font-mono text-emerald-500 font-bold tracking-wider uppercase block mt-0.5">ONLINE</span>
              </div>
              <div className={`border p-3 rounded-xl text-left ${
                isDark ? "bg-slate-900/80 border-slate-800/60" : "bg-slate-50 border-slate-100"
              }`}>
                <span className={`text-2xl font-mono font-bold block ${isDark ? "text-white" : "text-slate-800"}`}>
                  {sensors.filter(s => s.status === "CRITICAL").length || 1}
                </span>
                <span className="text-[9px] font-mono text-red-500 font-bold tracking-wider uppercase block mt-0.5">CRITICAL</span>
              </div>
            </div>
          </div>

          {/* LIVE TELEMETRY */}
          <div className={`border p-5 rounded-2xl transition ${
            isDark ? "bg-slate-950/90 border-slate-800" : "bg-white border-slate-200 shadow-md"
          }`}>
            <h3 className={`text-xs font-display font-black tracking-wider uppercase mb-1 ${
              isDark ? "text-white" : "text-slate-800"
            }`}>
              LIVE TELEMETRY
            </h3>
            <p className={`text-[9px] font-mono tracking-wider mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>REAL-TIME STREAMING ORBITAL FEED</p>
            
            <div className="space-y-2">
              {getCityTelemetry(city).map((metric, index) => (
                <div key={index} className={`flex items-center justify-between p-2 rounded-xl border ${
                  isDark ? "bg-slate-900/60 border-slate-800/50" : "bg-slate-50 border-slate-100"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full block animate-pulse" style={{ backgroundColor: metric.color }}></span>
                    <span className={`text-[9px] font-mono font-bold uppercase ${isDark ? "text-slate-300" : "text-slate-600"}`}>{metric.name}</span>
                  </div>
                  <div className="text-right flex items-center gap-1.5">
                    <span className={`text-xs font-mono font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{metric.value}</span>
                    <span className={`text-[8px] font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>{metric.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
