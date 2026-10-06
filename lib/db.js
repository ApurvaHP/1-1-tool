// Plain JSON-file persistence for the 1:1 & Growth Agent.
//
// Why a flat file and not a real database: zero native dependencies (better-sqlite3 needs
// node-gyp/native compilation, which is a real source of setup friction across machines — not
// worth it for a 15-engineer personal tool). This writes to data.json on every mutation and reads
// it fresh on every request, so it's trivially correct for single-instance local use. It is NOT
// safe for concurrent writers or for Vercel's serverless filesystem (ephemeral — writes won't
// persist across cold starts in production). Swap in Supabase/Postgres with the same function
// signatures below when you're ready to deploy this for real shared use beyond localhost.
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_PATH = path.join(process.cwd(), "data.json");

const DUMMY_ENGINEERS = [
  { name: "Maya Chen", role: "Senior Software Engineer", team: "Platform" },
  { name: "Jordan Patel", role: "Software Engineer II", team: "Platform" },
  { name: "Sam Okonkwo", role: "Staff Engineer", team: "Platform" },
  { name: "Riya Sharma", role: "Software Engineer II", team: "Integrations" },
  { name: "Devon Brooks", role: "Senior Software Engineer", team: "Integrations" },
  { name: "Lena Kowalski", role: "Software Engineer I", team: "Integrations" },
  { name: "Marcus Webb", role: "Senior Software Engineer", team: "Risk" },
  { name: "Aisha Rahman", role: "Software Engineer II", team: "Risk" },
  { name: "Tyler Nguyen", role: "Software Engineer I", team: "Risk" },
  { name: "Priya Iyer", role: "Staff Engineer", team: "Native" },
  { name: "Carlos Mendez", role: "Senior Software Engineer", team: "Native" },
  { name: "Grace Kim", role: "Software Engineer II", team: "Native" },
  { name: "Owen Fletcher", role: "Software Engineer I", team: "QA & Tooling" },
  { name: "Nadia Hussein", role: "Senior Software Engineer", team: "QA & Tooling" },
  { name: "Ben Tanaka", role: "Software Engineer II", team: "QA & Tooling" },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function seedData() {
  const engineers = DUMMY_ENGINEERS.map((e) => ({ id: randomUUID(), ...e }));
  const sessions = [];
  const notes = [];

  const sampleHistory = [
    {
      engineerIdx: 0,
      sessions: [
        {
          date: daysAgo(28),
          health: "green",
          notes: [
            { section: "career_goals", text: "Interested in moving toward tech lead scope within 2-3 quarters.", author: "engineer" },
            { section: "opportunities", text: "Loop her into the onboarding service redesign as a stretch project.", author: "manager" },
            { section: "action_items", text: "Share the staff-eng rubric doc.", author: "manager", done: true },
          ],
        },
        {
          date: daysAgo(14),
          health: "green",
          notes: [
            { section: "opportunities", text: "Took initiative scoping the caching deep-merge fix — good sign for lead readiness.", author: "manager" },
            { section: "areas_improvement", text: "Could delegate more during code review crunch weeks instead of absorbing it all herself.", author: "manager" },
            { section: "action_items", text: "Pair her with Jordan on the next cross-team integration as a mini-lead rep.", author: "manager", done: false },
          ],
        },
      ],
    },
    {
      engineerIdx: 3,
      sessions: [
        {
          date: daysAgo(20),
          health: "yellow",
          notes: [
            { section: "areas_improvement", text: "Estimates have been consistently optimistic — two fast-follows slipped this sprint.", author: "manager" },
            { section: "career_goals", text: "Wants more exposure to system design before next review cycle.", author: "engineer" },
            { section: "action_items", text: "Walk through estimation approach together on the next ask before she scopes solo.", author: "manager", done: false },
          ],
        },
      ],
    },
    {
      engineerIdx: 6,
      sessions: [
        {
          date: daysAgo(45),
          health: "green",
          notes: [
            { section: "career_goals", text: "Long-term interest in platform architecture, not people management.", author: "engineer" },
            { section: "action_items", text: "Connect him with Priya for an architecture-track mentoring conversation.", author: "manager", done: true },
          ],
        },
      ],
    },
  ];

  for (const entry of sampleHistory) {
    const engineerId = engineers[entry.engineerIdx].id;
    for (const s of entry.sessions) {
      const sessionId = randomUUID();
      sessions.push({ id: sessionId, engineerId, date: s.date, status: "completed", health: s.health });
      for (const n of s.notes) {
        notes.push({
          id: randomUUID(),
          sessionId,
          section: n.section,
          text: n.text,
          author: n.author,
          done: n.done ?? null,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return { engineers, sessions, notes };
}

let cache = null;

function load() {
  if (cache) return cache;
  if (fs.existsSync(DATA_PATH)) {
    cache = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } else {
    cache = seedData();
    persist();
  }
  return cache;
}

function persist() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(cache, null, 2));
}

const SECTIONS = ["career_goals", "opportunities", "areas_improvement", "action_items"];

export function getEngineersWithStats() {
  const data = load();
  return data.engineers
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => {
      const engSessions = data.sessions.filter((s) => s.engineerId === e.id);
      const completed = engSessions.filter((s) => s.status === "completed").sort((a, b) => (a.date < b.date ? 1 : -1));
      const draft = engSessions.find((s) => s.status === "draft");
      const last = completed[0];
      let daysSince = null;
      if (last) daysSince = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
      // Open action items are counted from the MOST RECENT session only, not summed across every
      // session ever — carrying an item forward supersedes the older copy, so counting both would
      // double-count the same outstanding commitment once it's been rolled into the latest agenda.
      const mostRecent = engSessions.slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0];
      const openActionItems = mostRecent
        ? data.notes.filter((n) => n.sessionId === mostRecent.id && n.section === "action_items" && !n.done).length
        : 0;
      return {
        ...e,
        lastSessionDate: last ? last.date : null,
        daysSince,
        overdue: daysSince === null || daysSince >= 14,
        openActionItems,
        draftSessionId: draft ? draft.id : null,
      };
    });
}

export function getEngineer(id) {
  const data = load();
  const engineer = data.engineers.find((e) => e.id === id);
  if (!engineer) return null;
  const sessions = data.sessions
    .filter((s) => s.engineerId === id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((s) => ({ id: s.id, date: s.date, status: s.status, health: s.health }));
  return { engineer, sessions };
}

export function getSessionDetail(id) {
  const data = load();
  const session = data.sessions.find((s) => s.id === id);
  if (!session) return null;
  const engineer = data.engineers.find((e) => e.id === session.engineerId);
  const notes = {};
  for (const s of SECTIONS) notes[s] = [];
  for (const n of data.notes.filter((n) => n.sessionId === id).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))) {
    if (notes[n.section]) notes[n.section].push(n);
  }
  return { session: { id: session.id, date: session.date, status: session.status, health: session.health }, engineer, notes };
}

export function createOrReuseSession(engineerId) {
  const data = load();
  const engineer = data.engineers.find((e) => e.id === engineerId);
  if (!engineer) return null;

  const existingDraft = data.sessions.find((s) => s.engineerId === engineerId && s.status === "draft");
  if (existingDraft) return { sessionId: existingDraft.id, reused: true };

  const sessionId = randomUUID();
  const today = new Date().toISOString().slice(0, 10);
  data.sessions.push({ id: sessionId, engineerId, date: today, status: "draft", health: null });

  const lastSession = data.sessions
    .filter((s) => s.engineerId === engineerId && s.id !== sessionId)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];

  if (lastSession) {
    const openItems = data.notes.filter((n) => n.sessionId === lastSession.id && n.section === "action_items" && !n.done);
    for (const item of openItems) {
      // Only append the tag once — without this check, an item carried forward across 3+ cycles
      // would stack "(carried forward) (carried forward) (carried forward)" onto its own text.
      const text = item.text.endsWith("(carried forward)") ? item.text : `${item.text} (carried forward)`;
      data.notes.push({
        id: randomUUID(),
        sessionId,
        section: "action_items",
        text,
        author: item.author,
        done: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  persist();
  return { sessionId, reused: false };
}

export function addNote(sessionId, section, text, author) {
  const data = load();
  if (!SECTIONS.includes(section)) return null;
  data.notes.push({
    id: randomUUID(),
    sessionId,
    section,
    text,
    author,
    done: section === "action_items" ? false : null,
    createdAt: new Date().toISOString(),
  });
  persist();
  return getSessionDetail(sessionId);
}

export function toggleNoteDone(sessionId, noteId) {
  const data = load();
  const note = data.notes.find((n) => n.id === noteId);
  if (note) note.done = !note.done;
  persist();
  return getSessionDetail(sessionId);
}

export function deleteNote(sessionId, noteId) {
  const data = load();
  data.notes = data.notes.filter((n) => n.id !== noteId);
  persist();
  return getSessionDetail(sessionId);
}

export function setSessionHealth(sessionId, health) {
  const data = load();
  const session = data.sessions.find((s) => s.id === sessionId);
  if (session) session.health = health;
  persist();
  return getSessionDetail(sessionId);
}

export function completeSession(sessionId) {
  const data = load();
  const session = data.sessions.find((s) => s.id === sessionId);
  if (session) session.status = "completed";
  persist();
  return getSessionDetail(sessionId);
}

export function searchNotes(query) {
  const data = load();
  const q = query.toLowerCase();
  const results = [];
  for (const n of data.notes) {
    if (!n.text.toLowerCase().includes(q)) continue;
    const session = data.sessions.find((s) => s.id === n.sessionId);
    const engineer = data.engineers.find((e) => e.id === session?.engineerId);
    if (!session || !engineer) continue;
    results.push({
      id: n.id,
      text: n.text,
      section: n.section,
      author: n.author,
      session_id: session.id,
      date: session.date,
      engineer_id: engineer.id,
      engineer_name: engineer.name,
    });
  }
  return results.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 50);
}
