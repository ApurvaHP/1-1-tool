import { createOrReuseSession } from "../../../lib/db";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const { engineerId } = req.body || {};
  if (!engineerId) return res.status(400).json({ error: "engineerId required" });
  const result = createOrReuseSession(engineerId);
  if (!result) return res.status(404).json({ error: "Engineer not found" });
  res.status(200).json(result);
}
