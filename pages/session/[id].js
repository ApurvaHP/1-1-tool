import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const SECTIONS = [
  { key: "career_goals", label: "Career Goals", hint: "Where they want to grow — review every session, update rarely." },
  { key: "opportunities", label: "Opportunities / Projects", hint: "Stretch projects, visibility, what's next." },
  { key: "areas_improvement", label: "Areas of Improvement", hint: "Honest, specific, actionable — not vague." },
  { key: "action_items", label: "Action Items", hint: "Commitments. Carry forward until done." },
];

const HEALTH_OPTIONS = [
  { key: "green", emoji: "🟢", label: "On track" },
  { key: "yellow", emoji: "🟡", label: "Watch" },
  { key: "red", emoji: "🔴", label: "Needs attention" },
];

const styles = {
  page: { maxWidth: 820, margin: "0 auto", padding: "28px 24px 60px" },
  back: { fontSize: 13, color: "#6b7280", marginBottom: 14, cursor: "pointer" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  name: { fontSize: 22, fontWeight: 700, color: "#1e2761" },
  meta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  whoBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "10px 14px",
    margin: "16px 0 20px",
    fontSize: 13,
  },
  whoBtn: (active) => ({
    padding: "5px 12px",
    borderRadius: 6,
    border: active ? "1.5px solid #1e2761" : "1px solid #d7dae3",
    background: active ? "#eef0fb" : "#fff",
    color: active ? "#1e2761" : "#6b7280",
    fontWeight: active ? 700 : 500,
    fontSize: 12,
    cursor: "pointer",
  }),
  copyBtn: { marginLeft: "auto", fontSize: 12, color: "#1e2761", cursor: "pointer", fontWeight: 600 },
  healthRow: { display: "flex", gap: 8, marginBottom: 20 },
  healthBtn: (active, color) => ({
    padding: "6px 12px",
    borderRadius: 999,
    border: active ? `1.5px solid ${color}` : "1px solid #e5e7eb",
    background: active ? `${color}18` : "#fff",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  }),
  section: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 14 },
  sectionLabel: { fontSize: 14, fontWeight: 700, color: "#1e2761" },
  sectionHint: { fontSize: 12, color: "#9ca3af", marginBottom: 10 },
  note: { display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: "1px solid #f3f4f6", fontSize: 14 },
  authorTag: (author) => ({
    fontSize: 10,
    fontWeight: 700,
    padding: "1px 6px",
    borderRadius: 999,
    color: "#fff",
    background: author === "manager" ? "#1e2761" : "#0891b2",
    flexShrink: 0,
    marginTop: 2,
  }),
  noteText: (done) => ({ flex: 1, textDecoration: done ? "line-through" : "none", color: done ? "#9ca3af" : "#1a1a2e" }),
  addRow: { display: "flex", gap: 8, marginTop: 10 },
  input: (disabled) => ({
    flex: 1,
    border: "1px solid #d7dae3",
    borderRadius: 6,
    padding: "7px 10px",
    fontSize: 13,
    background: disabled ? "#f3f4f6" : "#fff",
    color: disabled ? "#9ca3af" : "#1a1a2e",
    cursor: disabled ? "not-allowed" : "text",
  }),
  addBtn: (disabled) => ({
    background: disabled ? "#c7cad1" : "#1e2761",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "7px 14px",
    fontSize: 12,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
  }),
  whoNudge: { color: "#b45309", fontWeight: 700 },
  completeBtn: { background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  del: { fontSize: 11, color: "#d1d5db", cursor: "pointer", marginLeft: 6 },
};

export default function SessionPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [who, setWho] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" && window.localStorage.getItem("oneonone_who");
    if (saved) setWho(saved);
  }, []);

  function pickWho(w) {
    setWho(w);
    window.localStorage.setItem("oneonone_who", w);
  }

  async function load() {
    if (!id) return;
    const res = await fetch(`/api/session/${id}`);
    const d = await res.json();
    setData(d);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function addNote(section) {
    const text = (drafts[section] || "").trim();
    if (!text || !who) return;
    const res = await fetch(`/api/session/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_note", section, text, author: who }),
    });
    const d = await res.json();
    setData(d);
    setDrafts((prev) => ({ ...prev, [section]: "" }));
  }

  async function toggleDone(noteId) {
    const res = await fetch(`/api/session/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_done", noteId }),
    });
    setData(await res.json());
  }

  async function deleteNote(noteId) {
    const res = await fetch(`/api/session/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_note", noteId }),
    });
    setData(await res.json());
  }

  async function setHealth(health) {
    const res = await fetch(`/api/session/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_health", health }),
    });
    setData(await res.json());
  }

  async function complete() {
    const res = await fetch(`/api/session/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });
    setData(await res.json());
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!data) return <div style={styles.page}>Loading…</div>;
  const { session, engineer, notes } = data;

  return (
    <div style={styles.page}>
      <div style={styles.back} onClick={() => router.push(`/engineer/${engineer.id}`)}>
        ← {engineer.name}'s sessions
      </div>
      <div style={styles.header}>
        <div>
          <div style={styles.name}>
            {engineer.name} — {session.date}
          </div>
          <div style={styles.meta}>
            {engineer.role} · {engineer.team} · {session.status === "draft" ? "Draft — add notes before the meeting" : "Completed"}
          </div>
        </div>
        {session.status === "draft" && (
          <button style={styles.completeBtn} onClick={complete}>
            ✓ Mark complete
          </button>
        )}
      </div>

      <div style={styles.whoBar}>
        <span style={who ? { color: "#6b7280" } : styles.whoNudge}>{who ? "I am the:" : "👉 Pick who you are to add notes:"}</span>
        <span style={styles.whoBtn(who === "manager")} onClick={() => pickWho("manager")}>
          Manager
        </span>
        <span style={styles.whoBtn(who === "engineer")} onClick={() => pickWho("engineer")}>
          Engineer
        </span>
        <span style={styles.copyBtn} onClick={copyLink}>
          {copied ? "Copied!" : "🔗 Copy shareable link"}
        </span>
      </div>

      <div style={styles.healthRow}>
        {HEALTH_OPTIONS.map((h) => (
          <span key={h.key} style={styles.healthBtn(session.health === h.key, HEALTH_DOT(h.key))} onClick={() => setHealth(h.key)}>
            {h.emoji} {h.label}
          </span>
        ))}
      </div>

      {SECTIONS.map((sec) => (
        <div key={sec.key} style={styles.section}>
          <div style={styles.sectionLabel}>{sec.label}</div>
          <div style={styles.sectionHint}>{sec.hint}</div>
          {notes[sec.key].length === 0 && <div style={{ fontSize: 13, color: "#c7cad1" }}>Nothing yet.</div>}
          {notes[sec.key].map((n) => (
            <div key={n.id} style={styles.note}>
              {sec.key === "action_items" && (
                <input type="checkbox" checked={!!n.done} onChange={() => toggleDone(n.id)} style={{ marginTop: 3 }} />
              )}
              <span style={styles.authorTag(n.author)}>{n.author === "manager" ? "MGR" : "ENG"}</span>
              <span style={styles.noteText(n.done)}>{n.text}</span>
              <span style={styles.del} onClick={() => deleteNote(n.id)}>
                ✕
              </span>
            </div>
          ))}
          <div style={styles.addRow}>
            <input
              style={styles.input(!who)}
              placeholder={who ? `Add a note as ${who}…` : "Pick who you are above first ↑"}
              disabled={!who}
              value={drafts[sec.key] || ""}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [sec.key]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addNote(sec.key)}
            />
            <button style={styles.addBtn(!who)} disabled={!who} onClick={() => addNote(sec.key)}>
              Add
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function HEALTH_DOT(key) {
  return { green: "#16a34a", yellow: "#d97706", red: "#dc2626" }[key];
}
