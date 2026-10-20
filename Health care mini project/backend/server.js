const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "patients.json");

app.use(cors()); // For a production deployment, restrict this to your frontend domain.
app.use(express.json({ limit: "1mb" }));

function ensureData() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "[]", "utf8");
}
function readPatients() {
  ensureData();
  try { const value = JSON.parse(fs.readFileSync(dataFile, "utf8")); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function writePatients(items) {
  ensureData();
  fs.writeFileSync(dataFile, JSON.stringify(items, null, 2), "utf8");
}
function validate(body) {
  const name = String(body.name ?? "").trim().slice(0, 80);
  const age = Number(body.age);
  const condition = String(body.condition ?? "").trim().slice(0, 120);
  const heartRate = Number(body.heartRate);
  const temperature = Number(body.temperature);
  const status = String(body.status || "Stable");
  if (!name) return "Patient name is required.";
  if (!Number.isInteger(age) || age < 0 || age > 120) return "Age must be between 0 and 120.";
  if (!condition) return "Condition is required.";
  if (!Number.isFinite(heartRate) || heartRate < 0 || heartRate > 300) return "Invalid heart rate.";
  if (!Number.isFinite(temperature) || temperature < 25 || temperature > 45) return "Invalid temperature.";
  if (!["Stable", "Monitoring", "Needs attention"].includes(status)) return "Invalid status.";
  return { name, age, condition, heartRate, temperature, status };
}
app.get("/api/health", (_req, res) => res.json({ ok: true, message: "Healthcare IoT API running" }));
app.get("/api/patients", (_req, res) => res.json(readPatients()));
app.post("/api/patients", (req, res) => {
  const clean = validate(req.body || {});
  if (typeof clean === "string") return res.status(400).json({ error: clean });
  const items = readPatients();
  const patient = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), ...clean, updatedAt: new Date().toISOString() };
  items.unshift(patient); writePatients(items); res.status(201).json(patient);
});
app.put("/api/patients/:id", (req, res) => {
  const clean = validate(req.body || {});
  if (typeof clean === "string") return res.status(400).json({ error: clean });
  const items = readPatients(); const index = items.findIndex(p => p.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: "Patient not found." });
  items[index] = { ...items[index], ...clean, updatedAt: new Date().toISOString() };
  writePatients(items); res.json(items[index]);
});
app.delete("/api/patients/:id", (req, res) => {
  const items = readPatients(); const filtered = items.filter(p => p.id !== req.params.id);
  if (filtered.length === items.length) return res.status(404).json({ error: "Patient not found." });
  writePatients(filtered); res.json({ ok: true });
});
app.listen(PORT, () => { ensureData(); console.log(`Healthcare IoT backend running at http://localhost:${PORT}`); });