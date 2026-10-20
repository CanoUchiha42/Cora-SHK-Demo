const SYSTEM_PROMPT = `Du bist Cora, eine sachliche, freundliche digitale Erstkontakt-Assistentin für einen beispielhaften SHK-Betrieb in Deutschland. Du demonstrierst, wie ein Website-Chat Anfragen zu Heizung, Sanitär, Klima und Wartung aufnehmen könnte.
Antworte auf Deutsch, kurz und klar. Stelle bei Bedarf genau eine hilfreiche Rückfrage, etwa ob es um eine Störung, Wartung, Reparatur oder ein neues Projekt geht und in welcher Stadt der Betrieb tätig ist. Behaupte niemals, dass ein Termin gebucht, eine Anfrage an einen Betrieb geschickt oder ein Techniker alarmiert wurde. Es gibt in dieser Demo keinen echten Betrieb und keine Lead-Übermittlung. Erfinde keine konkreten Preise, Verfügbarkeiten, Garantien oder betriebsspezifischen Leistungen. Bei Gasgeruch, Rauch, Feuer oder möglicher Kohlenmonoxid-Gefahr: fordere die Person auf, den Gefahrenbereich zu verlassen, keine elektrischen Schalter zu betätigen, sofern dies sicher möglich die Gaszufuhr abzustellen und von draußen den örtlichen Notdienst bzw. bei unmittelbarer Gefahr 112 zu kontaktieren. Gib keine riskanten Reparaturanweisungen. Bitte nicht um sensible Daten.`;

export default async (req: Request) => {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  const origin = req.headers.get("origin");
  const allowedOrigin = Netlify.env.get("DEMO_ORIGIN");
  if (origin && allowedOrigin && new URL(origin).origin !== allowedOrigin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { message?: unknown; history?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (typeof body.message !== "string" || !body.message.trim() || body.message.length > 1200) {
    return Response.json({ error: "Message must be between 1 and 1200 characters" }, { status: 400 });
  }
  const apiKey = Netlify.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return Response.json({
      reply: "Der Beispiel-Chat ist eingerichtet, aber die Live-KI ist noch nicht verbunden. Sobald der Betreiber den Gemini-API-Key sicher in Netlify hinterlegt, kann Cora echte Antworten generieren. Bis dahin ist dies eine technische Vorschau."
    });
  }
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  const contents = history
    .filter((item: any) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
    .map((item: any) => ({ role: item.role === "assistant" ? "model" : "user", parts: [{ text: item.content.slice(0, 1200) }] }));
  if (!contents.length || contents[contents.length - 1]?.role !== "user") {
    contents.push({ role: "user", parts: [{ text: body.message.trim() }] });
  }
  try {
    const result = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 }
      })
    });
    if (!result.ok) {
      console.error("Gemini request failed with status", result.status);
      return Response.json({ reply: "Cora kann gerade keine KI-Antwort abrufen. Bitte versuchen Sie es später erneut." }, { status: 502 });
    }
    const data = await result.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("").trim();
    if (!reply) return Response.json({ reply: "Ich kann darauf gerade keine verlässliche Antwort geben. Können Sie Ihr Anliegen etwas anders formulieren?" });
    return Response.json({ reply });
  } catch (error) {
    console.error("Gemini connection error");
    return Response.json({ reply: "Die Verbindung zur KI ist gerade nicht verfügbar. Bitte versuchen Sie es später erneut." }, { status: 502 });
  }
};