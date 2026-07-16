// Função serverless (compatível com Vercel) — consulta o status de uma cobrança PIX na Blackcat.
// Usada pela página do imóvel para saber quando o pagamento foi confirmado.

const API_BASE = "https://api.blackcatoficial.com/api";

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Método não permitido" });
  }

  const apiKey = process.env.BLACKCAT_API_KEY;
  if (!apiKey) {
    console.error("BLACKCAT_API_KEY não configurada");
    return res.status(500).json({ success: false, error: "Gateway de pagamento não configurado" });
  }

  const transactionId = req.query.transactionId;
  if (!transactionId || typeof transactionId !== "string") {
    return res.status(400).json({ success: false, error: "transactionId é obrigatório" });
  }

  try {
    const resp = await fetch(`${API_BASE}/sales/${encodeURIComponent(transactionId)}/status`, {
      headers: { "X-API-Key": apiKey },
    });
    const data = await resp.json();

    if (!resp.ok || !data.success) {
      console.error("Blackcat status falhou", resp.status, data);
      return res.status(resp.status >= 400 ? resp.status : 502).json({
        success: false,
        error: (data && data.message) || "Erro ao consultar status",
      });
    }

    return res.status(200).json({
      success: true,
      status: data.data.status,
      paidAt: data.data.paidAt || null,
    });
  } catch (err) {
    console.error("Erro ao chamar API Blackcat", err);
    return res.status(502).json({ success: false, error: "Erro ao conectar com o provedor de pagamento" });
  }
};
