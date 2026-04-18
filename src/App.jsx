import { useData } from "./hooks/useData";
import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

//Color arrangements
const SOURCE_COLORS = {
  checkins: "#3b82f6",
  messages: "#8b5cf6",
  sightings: "#f59e0b",
  personalNotes: "#10b981",
  anonymousTips: "#ef4444",
};

const SOURCE_LABELS = {
  checkins: "📍 Checkin",
  messages: "💬 Mesaj",
  sightings: "👁 Görüntüleme",
  personalNotes: "📝 Not",
  anonymousTips: "🕵️ İhbar",
};

//Coordinate parse
function parseCoords(str) {
  if (!str) return null;
  const parts = str.split(",").map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  return null;
}

// Special Marker Colour
function coloredIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:12px;height:12px;
      border-radius:50%;
      background:${color};
      border:2px solid white;
      box-shadow:0 0 6px ${color};
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

//Show the selected person in the map
function FlyTo({ coords }) {
  const map = useMap();
  if (coords) map.flyTo(coords, 15, { duration: 1.2 });
  return null;
}

export default function App() {
  const { data, loading, error } = useData();
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [activeSource, setActiveSource] = useState("all");

  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", flexDirection: "column", gap: "16px", background: "#080b12"
    }}>
      <div style={{ fontSize: "48px", animation: "pulse 1.5s infinite" }}>🐱</div>
      <p style={{ color: "#4a5568", fontFamily: "Syne, sans-serif", letterSpacing: "0.1em" }}>
        İZLER ARANIYORR...
      </p>
    </div>
  );

  if (error) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", flexDirection: "column", gap: "16px", background: "#080b12"
    }}>
      <div style={{ fontSize: "48px" }}>❌</div>
      <p style={{ color: "#ef4444", fontFamily: "Syne, sans-serif" }}>{error}</p>
    </div>
  );

  //Unite all records
  const allRecords = [
    ...data.checkins,
    ...data.messages,
    ...data.sightings,
    ...data.personalNotes,
    ...data.anonymousTips,
  ];

  // Unique people
  const peopleMap = {};
  allRecords.forEach((r) => {
    const names = [r.personName, r.suspectName, r.sender, r.receiver, r.witnessName, r.author]
      .filter(Boolean);
    names.forEach((name) => {
      if (!peopleMap[name]) peopleMap[name] = [];
      peopleMap[name].push(r);
    });
  });

  const people = Object.keys(peopleMap).filter((p) =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  const personRecords = selectedPerson
    ? (activeSource === "all"
        ? peopleMap[selectedPerson]
        : peopleMap[selectedPerson].filter((r) => r.source === activeSource))
    : [];

  // Records that will be show on maps (records with coordinates)
  const mapRecords = (selectedPerson ? personRecords : allRecords)
    .filter((r) => parseCoords(r.coordinates));

  // Map center — Ankara Kızılay
  const ANKARA_CENTER = [39.9208, 32.8541];

  // First coordinate of chosen person 
  const firstCoord = personRecords?.find((r) => parseCoords(r.coordinates));
  const flyCoord = firstCoord ? parseCoords(firstCoord.coordinates) : null;

  // Suspisicion score (high confidence number of notices)
  const suspicionScore = (name) => {
    const records = peopleMap[name] || [];
    return records.filter((r) => r.confidence === "high").length;
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#080b12" }}>

      {/* LEFT PANEL */}
      <div style={{
        width: "260px", minWidth: "260px",
        borderRight: "1px solid #1f2d45",
        display: "flex", flexDirection: "column",
        background: "#0d1320",
      }}>
       {/* Logo */}
<div style={{ padding: "18px 16px", borderBottom: "1px solid #1f2d45", display: "flex", alignItems: "center", gap: "12px" }}>
  <img
    src="/n_podo_2.png"
    alt="Podo"
    style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid #f59e0b" }}
  />
  <div>
    <div style={{ fontSize: "11px", color: "#3b82f6", letterSpacing: "0.15em", marginBottom: "4px" }}>
      JOTFORM × ANKARA
    </div>
    <h1 style={{ fontSize: "18px", fontWeight: "800", color: "#e8f0fe", lineHeight: 1.2 }}>
      Missing Podo
    </h1>
    <div style={{ fontSize: "11px", color: "#4a5568", marginTop: "2px" }}>
      {allRecords.length} kayıt · {people.length} kişi
    </div>
  </div>
</div>

        {/* SEARCH */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #1f2d45" }}>
          <input
            type="text"
            placeholder="🔍 Kişi ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px",
              background: "#111827", borderRadius: "8px",
              color: "#e8f0fe", fontSize: "13px",
              border: "1px solid #1f2d45",
            }}
          />
        </div>

        {/* PEOPLE LIST */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {people
            .sort((a, b) => suspicionScore(b) - suspicionScore(a))
            .map((person) => {
              const records = peopleMap[person];
              const score = suspicionScore(person);
              const isSelected = selectedPerson === person;
              const isPodo = person === "Podo";
              return (
                <div
                  key={person}
                  onClick={() => { setSelectedPerson(person); setActiveSource("all"); }}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    background: isSelected ? "#111827" : "transparent",
                    borderLeft: isSelected ? "3px solid #3b82f6" : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontSize: "14px",
                      color: isPodo ? "#f59e0b" : "#e8f0fe",
                      fontWeight: isSelected ? "700" : "400",
                    }}>
                      {isPodo ? "⭐ " : ""}{person}
                    </span>
                    {score > 0 && (
                      <span style={{
                        fontSize: "10px", padding: "2px 6px",
                        borderRadius: "999px", background: "#7f1d1d",
                        color: "#fca5a5", fontWeight: "600",
                      }}>
                        ⚠️ {score}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "11px", color: "#4a5568", marginTop: "2px" }}>
                    {records.length} kayıt
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* MID - RECORD DETAILS */}
      <div style={{
        width: "320px", minWidth: "320px",
        borderRight: "1px solid #1f2d45",
        display: "flex", flexDirection: "column",
        background: "#0d1320",
      }}>
        {!selectedPerson ? (
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", flexDirection: "column", gap: "12px", color: "#4a5568"
          }}>
            <div style={{ fontSize: "48px" }}>🔍</div>
            <p style={{ fontSize: "13px", textAlign: "center", maxWidth: "180px", lineHeight: 1.5 }}>
              Sol taraftan bir şüpheli seç
            </p>
          </div>
        ) : (
          <>
            {/* PERSON HEADER */}
            <div style={{ padding: "16px", borderBottom: "1px solid #1f2d45" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#e8f0fe" }}>
                {selectedPerson}
              </h2>
              <p style={{ fontSize: "12px", color: "#4a5568", marginTop: "2px" }}>
                {peopleMap[selectedPerson].length} kayıt
              </p>

              {/* FILTER BUTTONS*/}
              <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                {["all", ...new Set(peopleMap[selectedPerson].map((r) => r.source))].map((src) => (
                  <button
                    key={src}
                    onClick={() => setActiveSource(src)}
                    style={{
                      padding: "3px 10px", borderRadius: "999px", fontSize: "11px",
                      background: activeSource === src ? "#1d4ed8" : "#111827",
                      color: activeSource === src ? "#fff" : "#64748b",
                      border: "1px solid",
                      borderColor: activeSource === src ? "#3b82f6" : "#1f2d45",
                    }}
                  >
                    {src === "all" ? "Tümü" : SOURCE_LABELS[src] || src}
                  </button>
                ))}
              </div>
            </div>

            {/* RECORDS */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {personRecords
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                .map((record) => (
                  <div
                    key={record.id}
                    className="fade-in"
                    style={{
                      background: "#111827",
                      borderRadius: "10px",
                      padding: "12px",
                      marginBottom: "10px",
                      borderLeft: `3px solid ${SOURCE_COLORS[record.source] || "#4a5568"}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: "600",
                        color: SOURCE_COLORS[record.source] || "#4a5568",
                      }}>
                        {SOURCE_LABELS[record.source] || record.source}
                      </span>
                      <span style={{ fontSize: "11px", color: "#4a5568", fontFamily: "JetBrains Mono, monospace" }}>
                        {record.timestamp || record.createdAt?.slice(0, 16)}
                      </span>
                    </div>

                    {record.location && (
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                        📍 {record.location}
                      </div>
                    )}

                    {(record.note || record.message || record.tip || record.content || record.sightingNote) && (
                      <div style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: "1.5" }}>
                        {record.note || record.message || record.tip || record.content || record.sightingNote}
                      </div>
                    )}

                    {record.confidence && (
                      <div style={{ marginTop: "8px" }}>
                        <span style={{
                          fontSize: "10px", padding: "2px 8px", borderRadius: "999px",
                          background: record.confidence === "high" ? "#065f46" : record.confidence === "medium" ? "#78350f" : "#1e1b4b",
                          color: record.confidence === "high" ? "#6ee7b7" : record.confidence === "medium" ? "#fcd34d" : "#a5b4fc",
                        }}>
                          {record.confidence === "high" ? "🔴 Yüksek" : record.confidence === "medium" ? "🟡 Orta" : "🔵 Düşük"}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      {/* RIGHT - MAP */}
      <div style={{ flex: 1, position: "relative" }}>
        {/* MAP-HEADER-OVERLAY */}
        <div style={{
          position: "absolute", top: "16px", left: "16px", zIndex: 1000,
          background: "rgba(13,19,32,0.9)", backdropFilter: "blur(8px)",
          padding: "8px 14px", borderRadius: "8px", border: "1px solid #1f2d45",
        }}>
          <div style={{ fontSize: "11px", color: "#3b82f6", letterSpacing: "0.1em" }}>
            ANKARA · CANLI HARİTA
          </div>
          {selectedPerson && (
            <div style={{ fontSize: "13px", color: "#e8f0fe", marginTop: "2px", fontWeight: "600" }}>
              {selectedPerson} — {mapRecords.length} konum
            </div>
          )}
        </div>

        <MapContainer
          center={ANKARA_CENTER}
          zoom={13}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {flyCoord && <FlyTo coords={flyCoord} />}

          {mapRecords.map((record) => {
            const coords = parseCoords(record.coordinates);
            if (!coords) return null;
            return (
              <Marker
                key={record.id}
                position={coords}
                icon={coloredIcon(SOURCE_COLORS[record.source] || "#fff")}
              >
                <Popup>
                  <div style={{ fontFamily: "Syne, sans-serif", minWidth: "160px" }}>
                    <div style={{ fontWeight: "700", marginBottom: "4px" }}>
                      {record.personName || record.suspectName || selectedPerson}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                      📍 {record.location}
                    </div>
                    <div style={{ fontSize: "11px", color: "#888" }}>
                      {record.timestamp || record.createdAt?.slice(0, 16)}
                    </div>
                    {(record.note || record.tip || record.message) && (
                      <div style={{ fontSize: "12px", marginTop: "6px", borderTop: "1px solid #eee", paddingTop: "6px" }}>
                        {record.note || record.tip || record.message}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}