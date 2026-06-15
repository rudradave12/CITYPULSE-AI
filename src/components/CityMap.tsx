import React, { useState } from "react";
import { IssueTicket, IssueStatus } from "../types";
import { MapPin, Info, Crosshair, HelpCircle, Navigation, Ruler } from "lucide-react";
import { CITY_CENTER } from "../lib/seeds";

// Static Public Hubs data with high-fidelity coordinate mappings matching visual designs
const PUBLIC_HUBS = [
  {
    id: "hub_dolores",
    name: "Dolores Park Reserve",
    lat: 37.7894,
    lng: -122.4474,
    type: "Recreational Park"
  },
  {
    id: "hub_jefferson",
    name: "Jefferson Botanical Park",
    lat: 37.7619,
    lng: -122.3949,
    type: "Botanical Garden"
  },
  {
    id: "hub_civic_center",
    name: "City Hall Transit Hub",
    lat: 37.7799,
    lng: -122.4254,
    type: "Transit Exchange"
  }
];

interface CityMapProps {
  issues: IssueTicket[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
  onCoordinateSelected?: (lat: number, lng: number) => void;
  interactive?: boolean;
}

export default function CityMap({
  issues,
  selectedIssueId,
  onSelectIssue,
  onCoordinateSelected,
  interactive = true,
}: CityMapProps) {
  // Center of city in local canvas pixels: width 800, height 500
  const width = 800;
  const height = 500;

  // Track cursor coordinates inside the SVG to place custom reports
  const [clickPin, setClickPin] = useState<{ x: number; y: number; lat: number; lng: number } | null>(null);

  // Track map visual theme mode (roadmap vs satellite imagery twin)
  const [viewMode, setViewMode] = useState<"roadmap" | "satellite">("roadmap");
  const isSatellite = viewMode === "satellite";

  // Distance Measurement Tool States
  const [isMeasurementMode, setIsMeasurementMode] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 37.7725,
    lng: -122.4350,
  });
  const [clickAction, setClickAction] = useState<"ticket" | "user">("user");

  // Helper: Haversine distance in kilometers
  const getDistanceInKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (km: number) => {
    if (km < 0.1) {
      const meters = Math.round(km * 1000);
      return `${meters}m (${Math.round(meters * 3.28084)}ft)`;
    }
    const miles = km * 0.621371;
    return `${km.toFixed(2)} km (${miles.toFixed(2)} mi)`;
  };

  // Helper: map coordinate latitude/longitude to SVG viewport dimensions
  // Latitude center: 37.7749 (top-bottom range: 37.7999 to 37.7499)
  // Longitude center: -122.4194 (left-right range: -122.4594 to -122.3794)
  const mapCoordsToSvg = (lat: number, lng: number) => {
    const latSpan = 0.05; // 37.7999 - 37.7499
    const lngSpan = 0.08; // -122.3794 - -122.4594

    const latMin = 37.7499;
    const lngMin = -122.4594;

    // SVG y=0 is top, latitude is north-up, so we invert the fraction
    const x = ((lng - lngMin) / lngSpan) * width;
    const y = (1 - (lat - latMin) / latSpan) * height;

    return { x, y };
  };

  // Helper: map SVG viewport back to real-world latitude/longitude
  const svgToMapCoords = (x: number, y: number) => {
    const latSpan = 0.05;
    const lngSpan = 0.08;
    const latMin = 37.7499;
    const lngMin = -122.4594;

    const lng = (x / width) * lngSpan + lngMin;
    const lat = (1 - y / height) * latSpan + latMin;

    return { lat, lng };
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;

    const { lat, lng } = svgToMapCoords(x, y);

    if (isMeasurementMode && clickAction === "user") {
      setUserLocation({ lat, lng });
    } else {
      if (!interactive || !onCoordinateSelected) return;
      setClickPin({ x, y, lat, lng });
      onCoordinateSelected(lat, lng);
    }
  };

  // Helper to color code statuses
  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case "Critical":
        return { fill: "#EF4444", bg: "bg-red-100", border: "border-red-400", text: "text-red-700" };
      case "Pending":
        return { fill: "#3B82F6", bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700" };
      case "In Progress":
        return { fill: "#F59E0B", bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-700" };
      case "Resolved":
        return { fill: "#10B981", bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-700" };
      default:
        return { fill: "#64748B", bg: "bg-slate-100", border: "border-slate-400", text: "text-slate-700" };
    }
  };

  const activeIssue = issues.find((issue) => issue.id === selectedIssueId);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4" id="city-map-container">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-50 pb-4">
        <div>
          <h3 className="font-sans font-bold text-slate-800 text-lg flex items-center space-x-2">
            <span className="p-1 px-2 rounded-lg bg-blue-50 text-blue-600 font-mono text-sm uppercase font-extrabold">GIS</span>
            <span>Live Digital Twin Map</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time urban report locations. Click any pin to review or click any location grid to set direct ticket coordinates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold">
          <span className="flex items-center space-x-1 bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            <span>Critical</span>
          </span>
          <span className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span>Pending</span>
          </span>
          <span className="flex items-center space-x-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-full border border-amber-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>In Progress</span>
          </span>
          <span className="flex items-center space-x-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full border border-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Resolved</span>
          </span>
        </div>
      </div>

      {/* Map SVG Canvas wrapper */}
      <div className="relative overflow-hidden border border-slate-100/80 rounded-2xl bg-slate-50/70" id="map-visualizer-canvas">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none"
          onClick={handleSvgClick}
          id="vector-map-svg"
        >
          {/* DEFINITIONS for gradient filters and satellite mode patterns */}
          <defs>
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dbeafe" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
            <linearGradient id="riverGradSatellite" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0b3b5c" />
              <stop offset="100%" stopColor="#082f49" />
            </linearGradient>
            <linearGradient id="landGradSatellite" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0e1b12" />
              <stop offset="50%" stopColor="#122417" />
              <stop offset="100%" stopColor="#1a2d1f" />
            </linearGradient>
            <radialGradient id="highlightGrad">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* BACKGROUND AND WATER GRID */}
          <rect width={width} height={height} fill={isSatellite ? "url(#landGradSatellite)" : "#fafaf9"} />

          {/* Interactive Satellite Urban Grid Blocks / Canopy Trees Layer */}
          {isSatellite && (
            <g opacity="0.45">
              {/* Forest reserve canopy textures */}
              <circle cx="100" cy="80" r="45" fill="#09140b" />
              <circle cx="150" cy="110" r="40" fill="#09140b" />
              <circle cx="600" cy="350" r="55" fill="#071109" />
              <circle cx="680" cy="380" r="45" fill="#050a06" />
              
              {/* Built urban facility grids */}
              <rect x="250" y="70" width="40" height="30" rx="2" fill="#1e293b" opacity="0.6" />
              <rect x="300" y="80" width="30" height="25" rx="2" fill="#334155" opacity="0.6" />
              <rect x="260" y="140" width="50" height="35" rx="2" fill="#1e293b" opacity="0.6" />
              <rect x="480" y="80" width="40" height="35" rx="2" fill="#1e293b" opacity="0.6" />
              <rect x="500" y="140" width="45" height="30" rx="2" fill="#334155" opacity="0.6" />
              <rect x="80" y="220" width="45" height="30" rx="3" fill="#0f172a" opacity="0.7" />
              <rect x="140" y="235" width="40" height="25" rx="3" fill="#1e293b" opacity="0.7" />
              <rect x="80" y="290" width="60" height="40" rx="3" fill="#0f172a" opacity="0.7" />
              <rect x="250" y="290" width="50" height="40" rx="3" fill="#1e293b" opacity="0.7" />
              <rect x="620" y="80" width="50" height="60" rx="4" fill="#1e293b" opacity="0.7" />
              <rect x="690" y="90" width="65" height="50" rx="4" fill="#0f172a" opacity="0.7" />
            </g>
          )}

          {/* Civic Parks (Elegantly positioned) */}
          <rect
            x="50"
            y="60"
            width="140"
            height="90"
            rx="14"
            fill={isSatellite ? "#0a1e0f" : "#f0fdf4"}
            stroke={isSatellite ? "#143b1c" : "#dcfce7"}
            strokeWidth="1"
          />
          <text
            x="120"
            y="110"
            fill={isSatellite ? "#a7f3d0" : "#166534"}
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
            opacity="0.7"
          >
            Dolores Park Reserve
          </text>

          <rect
            x="560"
            y="320"
            width="170"
            height="120"
            rx="16"
            fill={isSatellite ? "#0a1e0f" : "#f0fdf4"}
            stroke={isSatellite ? "#143b1c" : "#dcfce7"}
            strokeWidth="1"
          />
          <text
            x="645"
            y="380"
            fill={isSatellite ? "#a7f3d0" : "#166534"}
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
            opacity="0.7"
          >
            Jefferson Botanical Park
          </text>

          {/* Diagonally flowing Blue River (Deep navy in satellite; soft sky in roadmap) */}
          <path
            d="M -50 450 Q 250 430 400 250 T 850 50"
            fill="none"
            stroke={isSatellite ? "url(#riverGradSatellite)" : "url(#riverGrad)"}
            strokeWidth="38"
            strokeLinecap="round"
            opacity={isSatellite ? "0.95" : "0.85"}
          />
          <text
            x="260"
            y="390"
            fill={isSatellite ? "#38bdf8" : "#2563eb"}
            fontSize="9"
            fontWeight="extrabold"
            fontFamily="sans-serif"
            letterSpacing="2"
            opacity={isSatellite ? "0.6" : "0.45"}
            transform="rotate(-7 260 395)"
          >
            ~~ METRO WATER CHANNEL ~~
          </text>

          {/* GENERAL STREET NETWORK GRIDS */}
          {/* Avenue Horizontal Roads */}
          <line x1="0" y1="50" x2={width} y2="50" stroke={isSatellite ? "rgba(255, 255, 255, 0.2)" : "#f1f5f9"} strokeWidth="6" />
          <line x1="0" y1="120" x2={width} y2="120" stroke={isSatellite ? "rgba(255, 255, 255, 0.2)" : "#f1f5f9"} strokeWidth="6" />
          <line x1="0" y1="200" x2={width} y2="200" stroke={isSatellite ? "rgba(255, 255, 255, 0.2)" : "#f1f5f9"} strokeWidth="6" />
          <line x1="0" y1="280" x2={width} y2="280" stroke={isSatellite ? "rgba(255, 255, 255, 0.25)" : "#f1f5f9"} strokeWidth="6" style={{ strokeDasharray: "4 4" }} />
          <line x1="0" y1="360" x2={width} y2="360" stroke={isSatellite ? "rgba(245, 158, 11, 0.6)" : "#e2e8f0"} strokeWidth="8" /> {/* Main Boulevard */}
          <line x1="0" y1="440" x2={width} y2="440" stroke={isSatellite ? "rgba(255, 255, 255, 0.2)" : "#f1f5f9"} strokeWidth="6" />

          {/* Street Vertical Roads */}
          <line x1="100" y1="0" x2="100" y2={height} stroke={isSatellite ? "rgba(255, 255, 255, 0.2)" : "#f1f5f9"} strokeWidth="6" />
          <line x1="220" y1="0" x2="220" y2={height} stroke={isSatellite ? "rgba(245, 158, 11, 0.6)" : "#e2e8f0"} strokeWidth="8" /> {/* 2nd Avenue Express */}
          <line x1="340" y1="0" x2="340" y2={height} stroke={isSatellite ? "rgba(255, 255, 255, 0.2)" : "#f1f5f9"} strokeWidth="6" />
          <line x1="460" y1="0" x2="460" y2={height} stroke={isSatellite ? "rgba(255, 255, 255, 0.2)" : "#f1f5f9"} strokeWidth="6" />
          <line x1="580" y1="0" x2="580" y2={height} stroke={isSatellite ? "rgba(245, 158, 11, 0.6)" : "#e2e8f0"} strokeWidth="8" /> {/* Gateway Boulevard */}
          <line x1="700" y1="0" x2="700" y2={height} stroke={isSatellite ? "rgba(255, 255, 255, 0.2)" : "#f1f5f9"} strokeWidth="6" />

          {/* Road Identifier labels */}
          <text x="60" y="354" fill={isSatellite ? "#cbd5e1" : "#94a3b8"} fontSize="8" fontWeight="bold" fontFamily="monospace" opacity="0.85">Market Boulevard</text>
          <text x="228" y="22" fill={isSatellite ? "#cbd5e1" : "#94a3b8"} fontSize="8" fontWeight="bold" fontFamily="monospace" opacity="0.85" transform="rotate(90 228 22)">Dolores Expressway</text>
          <text x="588" y="240" fill={isSatellite ? "#cbd5e1" : "#94a3b8"} fontSize="8" fontWeight="bold" fontFamily="monospace" opacity="0.85" transform="rotate(90 588 240)">Embarcadero Way</text>

          {/* Highlight circles on issue selection */}
          {activeIssue && (
            <circle
              cx={mapCoordsToSvg(activeIssue.latitude, activeIssue.longitude).x}
              cy={mapCoordsToSvg(activeIssue.latitude, activeIssue.longitude).y}
              r="40"
              fill="url(#highlightGrad)"
              className="animate-pulse"
            />
          )}

          {/* ISSUE PIN MARKERS */}
          {issues.map((issue) => {
            const { x, y } = mapCoordsToSvg(issue.latitude, issue.longitude);
            const active = issue.id === selectedIssueId;
            const styleProps = getStatusColor(issue.status);

            return (
              <g
                key={issue.id}
                className="cursor-pointer group select-none transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectIssue(issue.id);
                }}
              >
                {/* Visual click bounding area */}
                <circle cx={x} cy={y} r="16" fill="transparent" />

                {/* Pulser effect for critical tickets */}
                {issue.status === "Critical" && (
                  <circle cx={x} cy={y} r="12" fill="none" stroke={styleProps.fill} strokeWidth="1" className="animate-ping" opacity="0.6" />
                )}

                {/* Main pin background */}
                <circle
                  cx={x}
                  cy={y}
                  r={active ? "8" : "6.5"}
                  fill={styleProps.fill}
                  className="transition-all duration-300 group-hover:scale-125"
                  stroke={isSatellite ? "#0a140b" : "#fafaf9"}
                  strokeWidth="2.5"
                  style={{
                    filter: "drop-shadow(0px 4px 6px rgba(100, 116, 139, 0.4))",
                  }}
                />

                {/* Micro-tooltip tag for selected active issue */}
                {active && (
                  <g className="transition-all duration-200" transform={`translate(${x}, ${y - 14})`}>
                    <rect x="-50" y="-18" width="100" height="18" rx="6" fill="#1e293b" />
                    <polygon points="0,3 -4,0 4,0" fill="#1e293b" transform="translate(0, -1)" />
                    <text x="0" y="-6" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                      {issue.category}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* DISTANCE MEASUREMENT OVERLAYS */}
          {isMeasurementMode && (
            <g id="interactive-gis-measurements">
              {/* Visual Hub Markers */}
              {PUBLIC_HUBS.map((hub) => {
                const hubSvg = mapCoordsToSvg(hub.lat, hub.lng);
                return (
                  <g key={`marker-${hub.id}`} transform={`translate(${hubSvg.x}, ${hubSvg.y})`}>
                    <circle cx="0" cy="0" r="14" fill="#059669" opacity="0.15" className="animate-pulse" />
                    <circle cx="0" cy="0" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                    <g transform="translate(0, 16)">
                      {/* Anchor background pill */}
                      <rect x="-45" y="-10" width="90" height="13" rx="4" fill="#042f1a" stroke="#059669" strokeWidth="0.5" opacity="0.9" />
                      <text x="0" y="-1" fill="#34d399" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        {hub.name}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Connector lines to Public Hubs from direct ticket */}
              {activeIssue && (
                <g id="hub-connector-lines">
                  {PUBLIC_HUBS.map((hub) => {
                    const ticketSvg = mapCoordsToSvg(activeIssue.latitude, activeIssue.longitude);
                    const hubSvg = mapCoordsToSvg(hub.lat, hub.lng);
                    const hubDist = getDistanceInKm(activeIssue.latitude, activeIssue.longitude, hub.lat, hub.lng);

                    return (
                      <g key={`line-to-${hub.id}`}>
                        <line
                          x1={ticketSvg.x}
                          y1={ticketSvg.y}
                          x2={hubSvg.x}
                          y2={hubSvg.y}
                          stroke="#10b981"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          opacity="0.8"
                        />
                        {/* Floating distance pill exactly halfway */}
                        <g transform={`translate(${(ticketSvg.x + hubSvg.x) / 2}, ${(ticketSvg.y + hubSvg.y) / 2})`}>
                          <rect x="-26" y="-7" width="52" height="13" rx="6" fill="#064e3b" stroke="#10b981" strokeWidth="0.5" />
                          <text x="0" y="2" fill="#a7f3d0" fontSize="7" fontWeight="extrabold" textAnchor="middle" fontFamily="monospace">
                            {hubDist.toFixed(2)} km
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Direct connector line between User location and selected incident */}
              {activeIssue && (
                <g id="user-to-incident-line">
                  {(() => {
                    const userSvg = mapCoordsToSvg(userLocation.lat, userLocation.lng);
                    const ticketSvg = mapCoordsToSvg(activeIssue.latitude, activeIssue.longitude);
                    const userToIncidentDist = getDistanceInKm(userLocation.lat, userLocation.lng, activeIssue.latitude, activeIssue.longitude);

                    return (
                      <>
                        <line
                          x1={userSvg.x}
                          y1={userSvg.y}
                          x2={ticketSvg.x}
                          y2={ticketSvg.y}
                          stroke="#2563eb"
                          strokeWidth="3.5"
                          opacity="0.2"
                          strokeLinecap="round"
                        />
                        <line
                          x1={userSvg.x}
                          y1={userSvg.y}
                          x2={ticketSvg.x}
                          y2={ticketSvg.y}
                          stroke="#3b82f6"
                          strokeWidth="2.1"
                          strokeDasharray="5 3"
                          strokeLinecap="round"
                        />
                        {/* Centered distance pill */}
                        <g transform={`translate(${(userSvg.x + ticketSvg.x) / 2}, ${(userSvg.y + ticketSvg.y) / 2})`}>
                          <rect x="-42" y="-9" width="84" height="17" rx="8" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" />
                          <text x="0" y="3" fill="#60a5fa" fontSize="7.5" fontWeight="black" textAnchor="middle" fontFamily="monospace">
                            {formatDistance(userToIncidentDist)}
                          </text>
                        </g>
                      </>
                    );
                  })()}
                </g>
              )}

              {/* Pulsing My Location pin */}
              {(() => {
                const userSvg = mapCoordsToSvg(userLocation.lat, userLocation.lng);
                return (
                  <g transform={`translate(${userSvg.x}, ${userSvg.y})`} id="interactive-user-pin">
                    <circle cx="0" cy="0" r="15" fill="#3b82f6" opacity="0.3" className="animate-ping" />
                    <circle cx="0" cy="0" r="8" fill="#2563eb" stroke="#ffffff" strokeWidth="2" style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))" }} />
                    <circle cx="0" cy="0" r="3" fill="#ffffff" />
                    <g transform="translate(0, -17)">
                      <rect x="-32" y="-12" width="64" height="13" rx="4" fill="#2563eb" />
                      <polygon points="0,3 -3,0 3,0" fill="#2563eb" transform="translate(0, -1)" />
                      <text x="0" y="-3" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        MY LOCATION
                      </text>
                    </g>
                  </g>
                );
              })()}
            </g>
          )}

          {/* USER CLICK PLACED REPORT TICKET MARKER */}
          {clickPin && (
            <g transform={`translate(${clickPin.x}, ${clickPin.y})`}>
              <circle cx="0" cy="0" r="14" fill="none" stroke="#2563eb" strokeWidth="2.5" className="animate-ping" />
              <polygon points="0,0 -5,-15 5,-15" fill="#2563eb" />
              <circle cx="0" cy="-14" r="7" fill="#2563eb" />
              <circle cx="0" cy="-14" r="2.5" fill="#ffffff" />
            </g>
          )}
        </svg>

        {/* Floating GIS Tools Trigger Block (Top Left) */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/40 shadow-xl flex items-center space-x-1.5 z-11" id="map-gis-tools">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newMode = !isMeasurementMode;
              setIsMeasurementMode(newMode);
              if (newMode) {
                setClickAction("user");
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all uppercase flex items-center space-x-1.5 ${
              isMeasurementMode
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            id="btn-toggle-measurement"
            title="Toggle Distance Measuring Ruler"
          >
            <Ruler className="h-3.5 w-3.5" />
            <span>{isMeasurementMode ? "Ruler: ON" : "Ruler"}</span>
          </button>

          {isMeasurementMode && (
            <div className="flex items-center space-x-1 pl-1 border-l border-slate-700/60" id="measurement-sub-click-modes">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setClickAction("user");
                }}
                className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${
                  clickAction === "user" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Click map to position Your simulated Location Node"
              >
                Set My Location
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setClickAction("ticket");
                }}
                className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${
                  clickAction === "ticket" ? "bg-amber-600 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Click map to define traditional incident tickets"
              >
                Set Ticket
              </button>
            </div>
          )}
        </div>

        {/* Floating View Mode Switcher */}
        <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/40 shadow-xl flex items-center space-x-1 z-11" id="map-viewmode-switcher">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewMode("roadmap");
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all uppercase flex items-center space-x-1.5 ${
              viewMode === "roadmap"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            id="btn-viewmode-roadmap"
            title="Roadmap View"
          >
            <span>🗺️</span>
            <span>Roadmap</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewMode("satellite");
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all uppercase flex items-center space-x-1.5 ${
              viewMode === "satellite"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            id="btn-viewmode-satellite"
            title="Satellite View"
          >
            <span>🛰️</span>
            <span>Satellite</span>
          </button>
        </div>

        {/* Floating coordinate helper */}
        <div className="absolute bottom-3 left-3 bg-slate-900/95 backdrop-blur-md text-[#f8fafc] text-[10px] font-mono px-3 py-2 rounded-xl flex items-center space-x-2 border border-slate-700/50 shadow-lg" id="coords-status-helper">
          <Navigation className="h-3 w-3 text-blue-400 rotate-45" />
          <span>City Grid: {[CITY_CENTER.lat.toFixed(4), CITY_CENTER.lng.toFixed(4)].join(", ")}</span>
          {clickPin && (
            <span className="text-emerald-400 font-bold ml-1.5 border-l border-slate-700 pl-1.5 flex items-center space-x-1">
              <Crosshair className="h-3 w-3" />
              <span>Placing Ticket at: {clickPin.lat.toFixed(4)}, {clickPin.lng.toFixed(4)}</span>
            </span>
          )}
          {isMeasurementMode && (
            <span className="text-blue-400 font-bold ml-1.5 border-l border-slate-700 pl-1.5 flex items-center space-x-1">
              <Ruler className="h-3 w-3" />
              <span>My Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
            </span>
          )}
        </div>
      </div>

      {/* 📏 Distance Measurement Calculator Panel */}
      {isMeasurementMode && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 animate-fade-in" id="proximity-ledger-panel">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Ruler className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-sans font-bold text-sm tracking-wide text-slate-100">
                  GIS Proximity & Distance Ledger
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  Active calculation relative to simulated coordinate anchors
                </p>
              </div>
            </div>
            
            {/* Quick Helper reset button */}
            <button
              onClick={() => {
                setUserLocation({ lat: 37.7725, lng: -122.4350 });
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-mono transition-all border border-slate-700/50 animate-pulse"
              title="Reset My Location to standard baseline center"
            >
              Reset My Location
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Locations & Interactive Coordinates details */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5 flex items-center justify-between">
                <span>📍 Measured Anchors</span>
                <span className="text-[9px] font-normal lowercase text-slate-500">(click map to move 🔵 pin)</span>
              </h5>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="font-sans font-bold text-slate-300">My Location:</span>
                  </div>
                  <span className="font-mono font-bold text-slate-400">
                     {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                  </span>
                </div>

                <div className="flex items-start justify-between border-t border-slate-900 pt-2">
                  <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="font-sans font-bold text-slate-300">Target Incident:</span>
                  </div>
                  <div className="text-right">
                    {activeIssue ? (
                      <div>
                        <p className="font-sans font-bold text-amber-400">{activeIssue.category}</p>
                        <p className="font-mono text-[10px] text-slate-400 leading-none mt-0.5">
                          {activeIssue.latitude.toFixed(5)}, {activeIssue.longitude.toFixed(5)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-500 font-sans italic">None selected. Click a pin on map!</span>
                    )}
                  </div>
                </div>

                {activeIssue && (
                  <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-lg text-blue-400 mt-2">
                    <span className="font-sans text-[11px] font-bold tracking-wide">📐 Direct Line Distance:</span>
                    <span className="font-mono text-sm font-extrabold text-blue-300">
                      {formatDistance(
                        getDistanceInKm(userLocation.lat, userLocation.lng, activeIssue.latitude, activeIssue.longitude)
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Proximity to Public Hubs */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5 flex items-center justify-between">
                <span>🏢 Proximity to Public Hubs</span>
                <span className="text-[9px] font-normal lowercase text-slate-500">(from target incident)</span>
              </h5>

              {activeIssue ? (
                <div className="space-y-2 text-xs">
                  {PUBLIC_HUBS.map((hub) => {
                    const distToHub = getDistanceInKm(activeIssue.latitude, activeIssue.longitude, hub.lat, hub.lng);
                    return (
                      <div key={hub.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800/40 transition-all">
                        <div className="space-y-0.5">
                          <p className="font-sans font-bold text-slate-200">{hub.name}</p>
                          <p className="text-[10px] font-mono text-slate-500 uppercase">{hub.type}</p>
                        </div>
                        <div className="text-right font-mono text-emerald-400 font-extrabold text-xs">
                          {formatDistance(distToHub)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-28 flex flex-col items-center justify-center text-center p-4">
                  <HelpCircle className="h-6 w-6 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs">
                    Please select an active incident pin on the map to see how far the issue lies from parks, gardens, and municipal transit hubs.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected pin overview detail drawer (apple style simplicity overlay) */}
      {activeIssue && (
        <div className="bg-slate-50 border border-slate-100/85 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in" id="map-issue-drawer">
          <div className="flex items-start space-x-4 w-full md:w-auto">
            <img
              src={activeIssue.photoUrl}
              alt={activeIssue.category}
              className="h-16 w-16 md:h-20 md:w-20 rounded-xl object-cover border border-slate-200/80 shadow-sm flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-slate-800 text-sm">
                  {activeIssue.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(activeIssue.status).bg} ${getStatusColor(activeIssue.status).text} border ${getStatusColor(activeIssue.status).border}`}>
                  {activeIssue.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-sans max-w-md">
                {activeIssue.description || "No citizen description provided."}
              </p>
              <div className="flex items-center space-x-3 text-[10.5px] font-mono font-bold text-slate-500 mt-1">
                <span>📍 {activeIssue.locationName}</span>
                <span>• Dept: {activeIssue.assignedDepartment}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onSelectIssue(activeIssue.id)}
            className="w-full md:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-blue-100 flex items-center justify-center space-x-1.5"
            id="view-ticket-map-btn"
          >
            <Info className="h-3.5 w-3.5" />
            <span>Open Report Case</span>
          </button>
        </div>
      )}
    </div>
  );
}
