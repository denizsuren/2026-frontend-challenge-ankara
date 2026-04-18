import { useData } from "./hooks/useData";

function App() {
  const { data, loading, error } = useData();

  if (loading) return <h2>🔍 Veriler yükleniyor...</h2>;
  if (error) return <h2 style={{ color: "red" }}>❌ Hata: {error}</h2>;

  window.__data = data;

  return (
    <div style={{ padding: "40px", fontFamily: "monospace" }}>
      <h1>🐱 Missing Podo - Veri Test</h1>

      {Object.keys(data).map((source) => (
        <div key={source} style={{ marginBottom: "32px" }}>
          <h2>📂 {source} — {data[source].length} kayıt</h2>
          <pre style={{ background: "#f4f4f4", padding: "16px", overflow: "auto", fontSize: "12px" }}>
            {JSON.stringify(data[source][0], null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}

export default App;