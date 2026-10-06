import { useState } from "react";
import { useRouter } from "next/router";

const styles = {
  page: { maxWidth: 800, margin: "0 auto", padding: "28px 24px" },
  back: { fontSize: 13, color: "#6b7280", marginBottom: 16, cursor: "pointer" },
  title: { fontSize: 22, fontWeight: 700, color: "#1e2761", marginBottom: 16 },
  inputRow: { display: "flex", gap: 8, marginBottom: 20 },
  input: { flex: 1, border: "1px solid #d7dae3", borderRadius: 8, padding: "10px 14px", fontSize: 14 },
  btn: { background: "#1e2761", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  result: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px", marginBottom: 10, cursor: "pointer" },
  resultTop: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 4 },
  resultText: { fontSize: 14 },
  section: { fontSize: 10, fontWeight: 700, color: "#1e2761", textTransform: "uppercase", background: "#eef0fb", padding: "1px 6px", borderRadius: 999 },
};

export default function Search() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  async function run() {
    if (!q.trim()) return;
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    setResults(await res.json());
    setSearched(true);
  }

  return (
    <div style={styles.page}>
      <div style={styles.back} onClick={() => router.push("/")}>
        ← Dashboard
      </div>
      <div style={styles.title}>Search across your team's 1:1s</div>
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          placeholder='e.g. "promotion", "estimation", "tech lead"'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          autoFocus
        />
        <button style={styles.btn} onClick={run}>
          Search
        </button>
      </div>

      {searched && results.length === 0 && <div style={{ color: "#9ca3af" }}>No matches.</div>}

      {results.map((r) => (
        <div key={r.id} style={styles.result} onClick={() => router.push(`/session/${r.session_id}`)}>
          <div style={styles.resultTop}>
            <span>
              <strong>{r.engineer_name}</strong> · {r.date}
            </span>
            <span style={styles.section}>{r.section.replace("_", " ")}</span>
          </div>
          <div style={styles.resultText}>{r.text}</div>
        </div>
      ))}
    </div>
  );
}
