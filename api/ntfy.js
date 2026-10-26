// Прокси для заметок: часы -> этот сервер -> ntfy.sh (только твой топик)
const TOPIC = process.env.NTFY_TOPIC || "wnote-xdmiwebvnas638";
module.exports = async (req, res) => {
  const secret = process.env.RELAY_SECRET || "";
  if (!secret || req.headers["x-relay-secret"] !== secret) { res.status(401).send("unauthorized"); return; }
  const since = String(req.query.since || "all").replace(/[^A-Za-z0-9_-]/g, "") || "all";
  try {
    const r = await fetch("https://ntfy.sh/" + TOPIC + "/json?poll=1&since=" + since);
    const t = await r.text();
    res.status(r.status).setHeader("Content-Type", "text/plain; charset=utf-8").send(t);
  } catch (e) {
    res.status(502).send("ntfy unavailable");
  }
};
