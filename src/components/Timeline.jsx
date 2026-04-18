// Timeline component — shows Podo's time-based route flow

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

export default function Timeline({ records, personName }) {
  if (!records || records.length === 0) return null;

  // Parse "18-04-2026 20:41" or "2026-04-17 14:00:58" formats
  function parseTime(record) {
    const raw = record.timestamp || record.createdAt;
    if (!raw) return 0;
    // Format: "18-04-2026 20:41" → convert to "2026-04-18 20:41"
    if (raw.match(/^\d{2}-\d{2}-\d{4}/)) {
      const [datePart, timePart] = raw.split(" ");
      const [day, month, year] = datePart.split("-");
      return new Date(`${year}-${month}-${day} ${timePart}`).getTime();
    }
    return new Date(raw).getTime();
  }

  const sorted = [...records]
    .filter((r) => r.timestamp || r.createdAt)
    .sort((a, b) => parseTime(a) - parseTime(b));

  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{
        fontSize: "10px", color: "#3b82f6",
        letterSpacing: "0.1em", marginBottom: "16px", fontWeight: "600"
      }}>
        ZAMAN ÇİZELGESİ
      </div>

      <div style={{ position: "relative" }}>
        {/* Vertical line */}
        <div style={{
          position: "absolute", left: "7px", top: "8px",
          width: "2px",
          height: "calc(100% - 16px)",
          background: "linear-gradient(to bottom, #3b82f6, #1f2d45)",
          borderRadius: "999px",
        }} />

        {sorted.map((record, i) => {
          const color = SOURCE_COLORS[record.source] || "#4a5568";
          const isLast = i === sorted.length - 1;

          return (
            <div key={record.id} style={{
              display: "flex", gap: "16px",
              marginBottom: isLast ? "0" : "16px",
              position: "relative",
            }}>
              {/* Dot */}
              <div style={{
                width: "16px", height: "16px", minWidth: "16px",
                borderRadius: "50%",
                background: color,
                border: "2px solid #080b12",
                boxShadow: `0 0 8px ${color}`,
                marginTop: "2px",
                zIndex: 1,
              }} />

              {/* Content */}
              <div style={{
                flex: 1,
                background: "#111827",
                borderRadius: "8px",
                padding: "10px 12px",
                borderLeft: `3px solid ${color}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", color, fontWeight: "600" }}>
                    {SOURCE_LABELS[record.source] || record.source}
                  </span>
                  <span style={{
                    fontSize: "10px", color: "#4a5568",
                    fontFamily: "JetBrains Mono, monospace"
                  }}>
                    {record.timestamp || record.createdAt?.slice(11, 16)}
                  </span>
                </div>

                {record.location && (
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
                    📍 {record.location}
                  </div>
                )}

                {(record.note || record.message || record.tip || record.content || record.text) && (
               <div style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: "1.5" }}>
               {record.note || record.message || record.tip || record.content || record.text}
               </div>
                )}
                )
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}