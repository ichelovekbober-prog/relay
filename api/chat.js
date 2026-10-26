// Прокси: часы -> этот сервер -> AnyModel (OpenAI-совместимый API)
module.exports = async (req, res) => {
  const secret = process.env.RELAY_SECRET || "";
  if (req.method !== "POST") { res.status(405).send("POST only"); return; }
  if (!secret || req.headers["x-relay-secret"] !== secret) { res.status(401).send("unauthorized"); return; }

  // ключ AnyModel: из заголовка (если ввёл на часах) или из переменной окружения
  const key = req.headers["x-anymodel-key"] || process.env.ANYMODEL_KEY || "";
  if (!key) { res.status(500).json({ error: { message: "Ключ AnyModel не задан на сервере" } }); return; }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { res.status(400).send("bad json"); return; }
  }
  if (!body || !Array.isArray(body.messages)) { res.status(400).send("messages required"); return; }

  let model = String(body.model || "ds/deepseek-v4-flash");
  if (model.indexOf("ds/") !== 0) { res.status(400).json({ error: { message: "Разрешены только модели ds/..." } }); return; }
  const maxTokens = Math.min(Number(body.max_tokens) || 2048, 4096);

  try {
    const upstream = await fetch("https://anymodel.org/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ model: model, messages: body.messages, max_tokens: maxTokens })
    });
    const text = await upstream.text();
    res.status(upstream.status).setHeader("Content-Type", "application/json; charset=utf-8").send(text);
  } catch (e) {
    res.status(502).json({ error: { message: "Сервер AnyModel недоступен" } });
  }
};
