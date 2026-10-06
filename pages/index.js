import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const styles = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: "#1e2761" },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  searchLink: {
    background: "#fff",
    border: "1px solid #d7dae3",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: "#1e2761",
    cursor: "pointer",
  },
  statsRow: { display: "flex", gap: 16, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 10, padding: "14px 18px", flex: 1, border: "1px solid #e5e7eb" },
  statNum: { fontSize: 22, fontWeight: 700, color: "#1e2761" },
  statLabel: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" },
  th: { textAlign: "left", fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, padding: "10px 16px", borderBottom: "1px solid #e5e7eb", background: "#fafbfc" },
  td: { padding: "12px 16px", borderBottom: "1px solid #f0f1f4", fontSize: 14 },
  rowOverdue: { background: "#fff7f0" },
  badge: (color) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    background: color,
  }),
  btn: {
    background: "#1e2761",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default function Dashboard() {
  const router = useRouter();
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState(null);

  async function load() {
    const res = await fetch("/api/engineers");
    const data = await res.json();
    setEngineers(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function startSession(engineerId, draftSessionId) {
    if (draftSessionId) {
      router.push(`/session/${draftSessionId}`);
      return;
    }
    setCreatingId(engineerId);
    const res = await fetch("/api/session/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engineerId }),
    });
    const data = await res.json();
    router.push(`/session/${data.sessionId}`);
  }

  const overdueCount = engineers.filter((e) => e.overdue).length;
  const openItemsTotal = engineers.reduce((s, e) => s + e.openActionItems, 0);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>1/1 Agent</div>
          <div style={styles.subtitle}>Your team, one place — {engineers.length} engineers</div>
        </div>
        <div style={styles.searchLink} onClick={() => router.push("/search")}>
          🔍 Search all notes
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNum}>{engineers.length}</div>
          <div style={styles.statLabel}>Team size</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statNum, color: overdueCount > 0 ? "#c2410c" : "#1e2761" }}>{overdueCount}</div>
          <div style={styles.statLabel}>Overdue for a 1:1 (14+ days)</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNum}>{openItemsTotal}</div>
          <div style={styles.statLabel}>Open action items, team-wide</div>
        </div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Engineer</th>
              <th style={styles.th}>Role / Team</th>
              <th style={styles.th}>Last 1:1</th>
              <th style={styles.th}>Open items</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {engineers.map((e) => (
              <tr key={e.id} style={e.overdue ? styles.rowOverdue : undefined}>
                <td style={styles.td}>
                  <a href={`/engineer/${e.id}`} style={{ fontWeight: 600, color: "#1e2761" }}>
                    {e.name}
                  </a>
                </td>
                <td style={styles.td}>
                  {e.role}
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{e.team}</div>
                </td>
                <td style={styles.td}>
                  {e.lastSessionDate ? (
                    <>
                      {e.lastSessionDate}
                      {e.overdue && <span style={{ ...styles.badge("#c2410c"), marginLeft: 8 }}>overdue</span>}
                    </>
                  ) : (
                    <span style={styles.badge("#9ca3af")}>never</span>
                  )}
                </td>
                <td style={styles.td}>
                  {e.openActionItems > 0 ? (
                    <span style={styles.badge("#b45309")}>{e.openActionItems} open</span>
                  ) : (
                    <span style={{ color: "#9ca3af" }}>—</span>
                  )}
                </td>
                <td style={{ ...styles.td, textAlign: "right" }}>
                  <button
                    style={styles.btn}
                    disabled={creatingId === e.id}
                    onClick={() => startSession(e.id, e.draftSessionId)}
                  >
                    {e.draftSessionId ? "Open draft" : "+ New 1:1"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
