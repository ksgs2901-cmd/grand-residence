// Notifica a Utmify (rastreamento de UTM/anúncios) sobre pedidos e pagamentos.
// Isso é só analytics: se falhar, nunca deve derrubar o fluxo de pagamento real.

const API_BASE = "https://api.utmify.com.br/api-credentials";

function formatarDataUtc(data) {
  return data.toISOString().slice(0, 19).replace("T", " ");
}

async function notificarUtmify(payload) {
  const apiToken = process.env.UTMIFY_API_TOKEN;
  if (!apiToken) {
    // Sem token configurado: não é erro, só não notifica (funcionalidade opcional).
    return;
  }

  try {
    const resp = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": apiToken,
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const texto = await resp.text().catch(() => "");
      console.error("Utmify recusou o pedido", resp.status, texto);
    }
  } catch (err) {
    console.error("Erro ao notificar Utmify", err);
  }
}

module.exports = { notificarUtmify, formatarDataUtc };
