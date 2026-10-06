import { searchNotes } from "../../lib/db";

export default function handler(req, res) {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(200).json([]);
  res.status(200).json(searchNotes(q));
}
