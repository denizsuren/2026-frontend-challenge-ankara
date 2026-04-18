import { useData } from "./hooks/useData";
import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { groupPeopleByFuzzyMatch } from "./utils/fuzzyMatch";
import Timeline from "./components/Timeline";

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

// Marker with count for overlapping records
function coloredIcon(color, count = 1) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${count > 1 ? '20px' : '12px'};
      height:${count > 1 ? '20px' : '12px'};
      border-radius:50%;
      background:${color};
      border:2px solid white;
      box-shadow:0 0 8px ${color};
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:10px;
      font-weight:700;
      color:white;
      font-family:sans-serif;
    ">${count > 1 ? count : ''}</div>`,
    iconSize: count > 1 ? [20, 20] : [12, 12],
    iconAnchor: count > 1 ? [10, 10] : [6, 6],
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
  const [darkMode, setDarkMode] = useState(true); //dark-light mode

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

// Collect all raw names from all records
  const rawPeopleMap = {};
  allRecords.forEach((r) => {
    const names = [r.personName, r.suspectName, r.sender, r.receiver, r.witnessName, r.author, r.senderName, r.recipientName]
      .filter(Boolean);
    names.forEach((name) => {
      if (!rawPeopleMap[name]) rawPeopleMap[name] = [];
      rawPeopleMap[name].push(r);
    });
  });

  // Fuzzy match: merge similar names into one canonical name
  const aliasMap = groupPeopleByFuzzyMatch(Object.keys(rawPeopleMap));
  const peopleMap = {};
  Object.keys(rawPeopleMap).forEach((name) => {
    const canonical = aliasMap[name];
    if (!peopleMap[canonical]) peopleMap[canonical] = [];
    peopleMap[canonical].push(...rawPeopleMap[name]);
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
  document.body.className = darkMode ? "" : "light"; 
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
  <button
    onClick={() => setDarkMode(!darkMode)}
    style={{
      marginLeft: "auto",
      background: "none",
      fontSize: "20px",
      padding: "4px",
      cursor: "pointer",
    }}
  >
    {darkMode ? "☀️" : "🌙"}
  </button>
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
                 {/* Suspicion color dot */}
                 {(() => {
                 const records = peopleMap[person];
                 const highCount = records.filter((r) => r.confidence === "high").length;
                 const medCount = records.filter((r) => r.confidence === "medium").length;
                 const lowCount = records.filter((r) => r.confidence === "low").length;
                 const total = highCount + medCount + lowCount;
                 if (total === 0) return null;

                const color = highCount > 0 ? "#ef4444" : medCount > 0 ? "#f59e0b" : "#3b82f6";
                const count = highCount > 0 ? highCount : medCount > 0 ? medCount : lowCount;
              return (
             <span style={{
             fontSize: "10px", padding: "2px 6px",
             borderRadius: "999px",
             background: color,
             color: "#fff",
             fontWeight: "700",
             marginLeft: "4px",
             boxShadow: `0 0 6px ${color}`,
              }}>
      ⚠️ {count}
    </span>
  );
})()}
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

  {/* SUMMARY PANELS */}
  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>

    {/* Last seen */}
    {(() => {
      const withCoords = peopleMap[selectedPerson]
        .filter((r) => r.location)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const last = withCoords[0];
      return last ? (
        <div style={{
          background: "#0f172a", borderRadius: "8px", padding: "10px 12px",
          border: "1px solid #1f2d45",
        }}>
          <div style={{ fontSize: "10px", color: "#3b82f6", letterSpacing: "0.1em", marginBottom: "4px" }}>
            SON GÖRÜLME
          </div>
          <div style={{ fontSize: "13px", color: "#e8f0fe", fontWeight: "600" }}>
            📍 {last.location}
          </div>
          <div style={{ fontSize: "11px", color: "#4a5568", marginTop: "2px", fontFamily: "JetBrains Mono, monospace" }}>
            {last.timestamp || last.createdAt?.slice(0, 16)}
          </div>
        </div>
      ) : null;
    })()}

    {/* Last seen with */}
    {(() => {
      const sightings = peopleMap[selectedPerson]
        .filter((r) => r.source === "sightings" && r.personName && r.personName !== selectedPerson)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const last = sightings[0];
      return last ? (
        <div style={{
          background: "#0f172a", borderRadius: "8px", padding: "10px 12px",
          border: "1px solid #1f2d45",
        }}>
          <div style={{ fontSize: "10px", color: "#8b5cf6", letterSpacing: "0.1em", marginBottom: "4px" }}>
            SON GÖRÜLDÜĞÜ KİŞİ
          </div>
          <div style={{ fontSize: "13px", color: "#e8f0fe", fontWeight: "600" }}>
            👤 {last.personName}
          </div>
          <div style={{ fontSize: "11px", color: "#4a5568", marginTop: "2px" }}>
            {last.location}
          </div>
        </div>
      ) : null;
    })()}

    {/* Suspicion score */}
    {(() => {
      const score = suspicionScore(selectedPerson);
      const total = peopleMap[selectedPerson].length;
      const pct = Math.round((score / total) * 100);
      return score > 0 ? (
        <div style={{
          background: "#0f172a", borderRadius: "8px", padding: "10px 12px",
          border: "1px solid #7f1d1d",
        }}>
          <div style={{ fontSize: "10px", color: "#ef4444", letterSpacing: "0.1em", marginBottom: "6px" }}>
            ŞÜPHELİLİK SKORU
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              flex: 1, height: "6px", background: "#1f2d45", borderRadius: "999px", overflow: "hidden"
            }}>
              <div style={{
                width: `${pct}%`, height: "100%",
                background: pct > 60 ? "#ef4444" : pct > 30 ? "#f59e0b" : "#10b981",
                borderRadius: "999px", transition: "width 0.5s ease",
              }} />
            </div>
            <span style={{ fontSize: "12px", color: "#fca5a5", fontWeight: "700", minWidth: "32px" }}>
              {pct}%
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#4a5568", marginTop: "4px" }}>
            {score} yüksek güvenilirlikli ihbar
          </div>
        </div>
      ) : null;
    })()}

  </div>
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


            
            {/* TIMELINE */}
           <div style={{ flex: 1, overflowY: "auto" }}>
          <Timeline records={personRecords} personName={selectedPerson} />
          </div>
            {/* RECORDS - hidden, timeline shows instead */}
             <div style={{ display: "none" }}>
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

                    {(record.note || record.message || record.tip || record.content || record.sightingNote || record.text) &&(
                      <div style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: "1.5" }}>
                        {record.note || record.message || record.tip || record.content || record.sightingNote|| record.text}
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

  {/* Group records by location and show count */}
{(() => {
  const locationGroups = {};
  mapRecords.forEach((record) => {
    const coords = parseCoords(record.coordinates);
    if (!coords) return;
    const key = coords.join(",");
    if (!locationGroups[key]) locationGroups[key] = { coords, records: [] };
    locationGroups[key].records.push(record);
  });

  return Object.entries(locationGroups).map(([key, group]) => {
    const { coords, records } = group;
    const dominantSource = records[0].source;
    const count = records.length;

    return (
  <Marker
    key={key}
    position={coords}
    icon={coloredIcon(SOURCE_COLORS[dominantSource] || "#fff", count)}
    eventHandlers={{
      click: () => {
        // Find the person from this record and select them
        const person = records[0].personName || 
                       records[0].suspectName || 
                       records[0].sender ||
                       records[0].witnessName ||
                       records[0].author;
        if (person) {
          const canonical = aliasMap[person];
          if (canonical) {
            setSelectedPerson(canonical);
            setActiveSource("all");
          }
        }
      }
    }}
  >
        <Popup>
            <div 
           onClick={() => {
           const name = records[0].personName || records[0].suspectName || records[0].sender || records[0].witnessName || records[0].author;
           if (name) {
           const canonical = aliasMap[name];
           if (canonical) setSelectedPerson(canonical);
           }
           }}
         style={{ 
         fontFamily: "Syne, sans-serif", minWidth: "180px", maxWidth: "220px",
         cursor: "pointer"
         }}>
         </div>
          <div style={{ fontFamily: "Syne, sans-serif", minWidth: "180px", maxWidth: "220px" }}>
            <div style={{ fontWeight: "700", marginBottom: "8px", fontSize: "13px" }}>
              📍 {records[0].location}
            </div>
            {records.map((record, i) => (
              <div key={record.id} style={{
                borderTop: i > 0 ? "1px solid #eee" : "none",
                paddingTop: i > 0 ? "8px" : "0",
                marginTop: i > 0 ? "8px" : "0",
              }}>
                <div style={{
                  fontSize: "10px", fontWeight: "600", marginBottom: "3px",
                  color: SOURCE_COLORS[record.source] || "#666"
                }}>
                  {SOURCE_LABELS[record.source] || record.source}
                </div>
                <div style={{ fontSize: "11px", color: "#888", marginBottom: "3px", fontFamily: "monospace" }}>
                  {record.timestamp || record.createdAt?.slice(0, 16)}
                </div>
                {(record.note || record.tip || record.message) && (
                  <div style={{ fontSize: "12px", color: "#333", lineHeight: "1.4" }}>
                    {record.note || record.tip || record.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Popup>
      </Marker>
    );
  });
})()
} </MapContainer>
      </div>
    </div>
  );
}
