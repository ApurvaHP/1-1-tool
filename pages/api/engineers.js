import { getEngineersWithStats } from "../../lib/db";

export default function handler(req, res) {
  res.status(200).json(getEngineersWithStats());
}
