// Função serverless (compatível com Vercel) — cria uma cobrança PIX via API da Blackcat.
// O preço é sempre recalculado aqui a partir de data/mansoes.json e data/config.json;
// nunca confiamos no valor calculado no navegador do cliente.

const fs = require("fs");
const path = require("path");

const API_BASE = "https://api.blackcatoficial.com/api";

function carregarJson(nomeArquivo) {
  const filePath = path.join(process.cwd(), "data", nomeArquivo);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function apenasDigitos(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function emailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || ""));
}

function diffDias(iso1, iso2) {
  const d1 = new Date(iso1 + "T00:00:00");
  const d2 = new Date(iso2 + "T00:00:00");
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Método não permitido" });
  }

  const apiKey = process.env.BLACKCAT_API_KEY;
  if (!apiKey) {
    console.error("BLACKCAT_API_KEY não configurada");
    return res.status(500).json({ success: false, error: "Gateway de pagamento não configurado" });
  }

  const body = req.body || {};
  const { mansaoId, checkin, checkout, hospedes } = body;
  const customer = body.customer || {};

  let mansoes, config;
  try {
    mansoes = carregarJson("mansoes.json");
    config = carregarJson("config.json");
  } catch (err) {
    console.error("Falha ao carregar dados", err);
    return res.status(500).json({ success: false, error: "Erro interno" });
  }

  const mansao = mansoes.find((m) => m.id === Number(mansaoId));
  if (!mansao) {
    return res.status(400).json({ success: false, error: "Mansão inválida" });
  }
  if (!checkin || !checkout) {
    return res.status(400).json({ success: false, error: "Datas inválidas" });
  }
  const noites = diffDias(checkin, checkout);
  if (noites <= 0) {
    return res.status(400).json({ success: false, error: "Check-out precisa ser depois do check-in" });
  }
  if (Number(hospedes) > mansao.hospedes) {
    return res.status(400).json({ success: false, error: "Número de hóspedes acima do limite da mansão" });
  }

  const documento = apenasDigitos(customer.document);
  if (!customer.name || !emailValido(customer.email) || apenasDigitos(customer.phone).length < 10 ||
    (documento.length !== 11 && documento.length !== 14)) {
    return res.status(400).json({ success: false, error: "Dados do hóspede inválidos" });
  }

  const subtotal = noites * mansao.precoNoite;
  const taxaReserva = Math.min(config.taxaReserva, subtotal);
  // Desconto de Pix aplicado direto na taxa de reserva (nunca no valor total da estadia).
  const taxaComDesconto = Math.round(taxaReserva * (1 - config.descontoPix) * 100) / 100;
  const valorEmCentavos = Math.round(taxaComDesconto * 100);

  const externalRef = `MANSAO-${mansao.id}-${Date.now()}`;

  const payload = {
    amount: valorEmCentavos,
    paymentMethod: "pix",
    currency: "BRL",
    items: [
      {
        title: `Taxa de reserva com ${Math.round(config.descontoPix * 100)}% OFF Pix - ${mansao.nome} (${checkin} a ${checkout})`,
        quantity: 1,
        unitPrice: valorEmCentavos,
        tangible: false,
      },
    ],
    customer: {
      name: String(customer.name).slice(0, 120),
      email: String(customer.email).slice(0, 160),
      phone: apenasDigitos(customer.phone),
      document: {
        number: documento,
        type: documento.length === 14 ? "cnpj" : "cpf",
      },
    },
    externalRef,
    pix: { expiresInDays: 1 },
  };

  try {
    const resp = await fetch(`${API_BASE}/sales/create-sale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok || !data.success) {
      console.error("Blackcat create-sale falhou", resp.status, data);
      return res.status(resp.status >= 400 ? resp.status : 502).json({
        success: false,
        error: (data && data.message) || "Erro ao gerar cobrança Pix",
      });
    }

    return res.status(200).json({
      success: true,
      transactionId: data.data.transactionId,
      amount: data.data.amount,
      taxaOriginal: taxaReserva,
      taxaComDesconto,
      restante: subtotal - taxaComDesconto,
      checkin,
      pix: {
        qrCodeBase64: data.data.paymentData.qrCodeBase64,
        copyPaste: data.data.paymentData.copyPaste,
        expiresAt: data.data.paymentData.expiresAt,
      },
    });
  } catch (err) {
    console.error("Erro ao chamar API Blackcat", err);
    return res.status(502).json({ success: false, error: "Erro ao conectar com o provedor de pagamento" });
  }
};
