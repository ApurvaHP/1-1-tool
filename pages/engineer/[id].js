import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const HEALTH_DOT = { green: "#16a34a", yellow: "#d97706", red: "#dc2626" };

const styles = {
  page: { maxWidth: 800, margin: "0 auto", padding: "32px 24px" },
  back: { fontSize: 13, color: "#6b7280", marginBottom: 16, cursor: "pointer" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  name: { fontSize: 22, fontWeight: 700, color: "#1e2761" },
  meta: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  btn: { background: "#1e2761", color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  sessionCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "14px 16px",
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  dot: (c) => ({ width: 9, height: 9, borderRadius: "50%", background: c || "#d1d5db", display: "inline-block", marginRight: 8 }),
  status: (draft) => ({
    fontSize: 11,
    fontWeight: 700,
    color: draft ? "#b45309" : "#16a34a",
    background: draft ? "#fff7ed" : "#f0fdf4",
    padding: "2px 8px",
    borderRadius: 999,
  }),
};

export default function EngineerPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/engineer/${id}`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  async function prepNext() {
    setCreating(true);
    const res = await fetch("/api/session/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engineerId: id }),
    });
    const d = await res.json();
    router.push(`/session/${d.sessionId}`);
  }

  if (!data) return <div style={styles.page}>Loading…</div>;
  const { engineer, sessions } = data;

  return (
    <div style={styles.page}>
      <div style={styles.back} onClick={() => router.push("/")}>
        ← All engineers
      </div>
      <div style={styles.header}>
        <div>
          <div style={styles.name}>{engineer.name}</div>
          <div style={styles.meta}>
            {engineer.role} · {engineer.team}
          </div>
        </div>
        <button style={styles.btn} disabled={creating} onClick={prepNext}>
          + Prep next 1:1
        </button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>
        Session history
      </div>
      {sessions.length === 0 && <div style={{ color: "#9ca3af", fontSize: 14 }}>No sessions logged yet.</div>}
      {sessions.map((s) => (
        <div key={s.id} style={styles.sessionCard} onClick={() => router.push(`/session/${s.id}`)}>
          <div>
            <span style={styles.dot(HEALTH_DOT[s.health])} />
            <strong>{s.date}</strong>
          </div>
          <span style={styles.status(s.status === "draft")}>{s.status}</span>
        </div>
      ))}
    </div>
  );
}
