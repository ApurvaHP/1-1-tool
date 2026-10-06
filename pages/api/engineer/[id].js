import { getEngineer } from "../../../lib/db";

export default function handler(req, res) {
  const { id } = req.query;
  const data = getEngineer(id);
  if (!data) return res.status(404).json({ error: "Engineer not found" });
  res.status(200).json(data);
}
