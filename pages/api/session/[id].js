import { getSessionDetail, addNote, toggleNoteDone, deleteNote, setSessionHealth, completeSession } from "../../../lib/db";

const VALID_SECTIONS = ["career_goals", "opportunities", "areas_improvement", "action_items"];
const VALID_HEALTH = ["green", "yellow", "red"];

export default function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const data = getSessionDetail(id);
    if (!data) return res.status(404).json({ error: "Session not found" });
    return res.status(200).json(data);
  }

  if (req.method === "PUT") {
    const { action } = req.body || {};
    const existing = getSessionDetail(id);
    if (!existing) return res.status(404).json({ error: "Session not found" });

    if (action === "add_note") {
      const { section, text, author } = req.body;
      if (!section || !text || !author) return res.status(400).json({ error: "section, text, author required" });
      if (!VALID_SECTIONS.includes(section)) return res.status(400).json({ error: `Invalid section. Must be one of: ${VALID_SECTIONS.join(", ")}` });
      if (!text.trim()) return res.status(400).json({ error: "text cannot be empty" });
      if (!["manager", "engineer"].includes(author)) return res.status(400).json({ error: "author must be 'manager' or 'engineer'" });
      return res.status(200).json(addNote(id, section, text.trim(), author));
    }
    if (action === "toggle_done") {
      if (!req.body.noteId) return res.status(400).json({ error: "noteId required" });
      return res.status(200).json(toggleNoteDone(id, req.body.noteId));
    }
    if (action === "delete_note") {
      if (!req.body.noteId) return res.status(400).json({ error: "noteId required" });
      return res.status(200).json(deleteNote(id, req.body.noteId));
    }
    if (action === "set_health") {
      if (!VALID_HEALTH.includes(req.body.health)) return res.status(400).json({ error: `health must be one of: ${VALID_HEALTH.join(", ")}` });
      return res.status(200).json(setSessionHealth(id, req.body.health));
    }
    if (action === "complete") {
      return res.status(200).json(completeSession(id));
    }
    return res.status(400).json({ error: "Unknown action" });
  }

  res.status(405).json({ error: "Use GET or PUT" });
}
