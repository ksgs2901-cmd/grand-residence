(async function () {
  const MANSAO_ID_OFERTA = 6; // Mansão de alto luxo frente mar na Praia do Forte — 8 suítes, R$2.000/noite

  const config = await inicializarComum("oferta");
  const { mansoes } = await carregarDados();

  const mansao = mansoes.find((m) => m.id === MANSAO_ID_OFERTA) || mansoes[0];

  document.title = `Mansão à Beira-Mar — Sinal a partir de R$500 — ${config.nomeMarca}`;

  document.getElementById("hero-oferta").style.backgroundImage = `url(${mansao.imagens[0]})`;
  document.getElementById("oferta-hospedes").textContent = mansao.hospedes;

  document.getElementById("detalhe-cidade").textContent = mansao.cidade;
  document.getElementById("detalhe-nome").textContent = mansao.nome;
  document.getElementById("detalhe-quartos").textContent = mansao.quartos;
  document.getElementById("detalhe-hospedes").textContent = mansao.hospedes;
  document.getElementById("detalhe-banheiros").textContent = mansao.banheiros;
  document.getElementById("detalhe-descricao").textContent = mansao.descricao;
  document.getElementById("detalhe-endereco").textContent = `Endereço: ${mansao.endereco}`;
  document.getElementById("detalhe-preco").innerHTML = `${formatarPreco(mansao.precoNoite)}<span> /noite</span>`;

  document.getElementById("sticky-cta-valor").textContent = formatarPreco(mansao.precoNoite);
  document.getElementById("sticky-cta-btn").addEventListener("click", () => {
    document.querySelector(".card-reserva").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("detalhe-comodidades").innerHTML = mansao.comodidades
    .map((c) => `<li>${c}</li>`)
    .join("");

  // Galeria
  const galeria = document.getElementById("galeria");
  galeria.innerHTML = mansao.imagens
    .map(
      (img, i) =>
        `<img src="${img}" alt="${mansao.nome} - foto ${i + 1}" data-idx="${i}" class="${i === 0 ? "principal" : ""}" loading="lazy" />`
    )
    .join("");

  // Lightbox
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  let idxAtual = 0;

  function abrirLightbox(idx) {
    idxAtual = idx;
    lightboxImg.src = mansao.imagens[idxAtual];
    lightbox.classList.add("aberto");
  }
  function fecharLightbox() {
    lightbox.classList.remove("aberto");
  }
  function navegar(delta) {
    idxAtual = (idxAtual + delta + mansao.imagens.length) % mansao.imagens.length;
    lightboxImg.src = mansao.imagens[idxAtual];
  }

  galeria.querySelectorAll("img").forEach((img) => {
    img.addEventListener("click", () => abrirLightbox(Number(img.dataset.idx)));
  });
  document.getElementById("lightbox-fechar").addEventListener("click", fecharLightbox);
  document.getElementById("lightbox-anterior").addEventListener("click", () => navegar(-1));
  document.getElementById("lightbox-proxima").addEventListener("click", () => navegar(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) fecharLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("aberto")) return;
    if (e.key === "Escape") fecharLightbox();
    if (e.key === "ArrowLeft") navegar(-1);
    if (e.key === "ArrowRight") navegar(1);
  });

  // ---------- Fluxo de reserva em etapas (datas -> dados -> pagamento -> confirmação) ----------

  const campo = {
    checkin: document.getElementById("r-checkin"),
    checkout: document.getElementById("r-checkout"),
    hospedes: document.getElementById("r-hospedes"),
    erroDatas: document.getElementById("erro-datas"),
    nome: document.getElementById("r-nome"),
    email: document.getElementById("r-email"),
    telefone: document.getElementById("r-telefone"),
    cpf: document.getElementById("r-cpf"),
  };

  const hoje = new Date();
  const hojeISO = hoje.toISOString().slice(0, 10);
  campo.checkin.min = hojeISO;

  let reserva = null;

  function formatarData(iso) {
    const [ano, mes, dia] = iso.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function diffDias(iso1, iso2) {
    const d1 = new Date(iso1 + "T00:00:00");
    const d2 = new Date(iso2 + "T00:00:00");
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  campo.checkin.addEventListener("change", () => {
    if (campo.checkin.value) {
      const proximo = new Date(campo.checkin.value + "T00:00:00");
      proximo.setDate(proximo.getDate() + 1);
      campo.checkout.min = proximo.toISOString().slice(0, 10);
    }
  });

  function calcularReserva() {
    const checkin = campo.checkin.value;
    const checkout = campo.checkout.value;
    const hospedes = Number(campo.hospedes.value) || 1;

    if (!checkin || !checkout) {
      return { erro: "Selecione as datas de check-in e check-out." };
    }
    const noites = diffDias(checkin, checkout);
    if (noites <= 0) {
      return { erro: "A data de check-out precisa ser depois do check-in." };
    }
    if (hospedes > mansao.hospedes) {
      return { erro: `Esta mansão acomoda no máximo ${mansao.hospedes} hóspedes.` };
    }

    const subtotal = noites * mansao.precoNoite;
    const taxa = Math.min(config.taxaReserva, subtotal);
    const taxaPix = Math.round(taxa * (1 - config.descontoPix) * 100) / 100;
    const restante = subtotal - taxa;
    const restantePix = subtotal - taxaPix;

    return { checkin, checkout, hospedes, noites, subtotal, taxa, taxaPix, restante, restantePix };
  }

  function montarResumoHtml(r) {
    return `
      <div class="linha-resumo"><span>${formatarPreco(mansao.precoNoite)} x ${r.noites} noite${r.noites > 1 ? "s" : ""}</span><span>${formatarPreco(r.subtotal)}</span></div>
      <div class="linha-resumo destaque-linha">
        <span>Taxa de reserva <span class="chip-off">30% OFF Pix</span></span>
        <span><s class="preco-riscado">${formatarPreco(r.taxa)}</s> ${formatarPreco(r.taxaPix)}</span>
      </div>
      <div class="linha-resumo"><span>Restante (até o check-in, ${formatarData(r.checkin)})</span><span>${formatarPreco(r.restantePix)}</span></div>
    `;
  }

  const passos = document.querySelectorAll(".reserva-passos .passo");
  const progressoMobile = document.querySelectorAll(".progresso-mobile span");
  const passoMobileTexto = document.getElementById("passo-mobile-texto");
  const rotulosPassos = { 1: "Datas", 2: "Seus dados", 3: "Confirmação", 4: "Pagamento" };

  function irParaEtapa(numero) {
    ["etapa-1", "etapa-2", "etapa-3", "etapa-4", "etapa-confirmacao"].forEach((idEl) => {
      document.getElementById(idEl).hidden = true;
    });
    const mapa = { 1: "etapa-1", 2: "etapa-2", 3: "etapa-3", 4: "etapa-4" };
    if (mapa[numero]) document.getElementById(mapa[numero]).hidden = false;

    passos.forEach((p) => {
      const n = Number(p.dataset.passo);
      p.classList.remove("ativo", "concluido");
      if (n === numero) p.classList.add("ativo");
      else if (n < numero) p.classList.add("concluido");
    });

    progressoMobile.forEach((p) => {
      const n = Number(p.dataset.passo);
      p.classList.remove("ativo", "concluido");
      if (n === numero) p.classList.add("ativo");
      else if (n < numero) p.classList.add("concluido");
    });
    if (passoMobileTexto) passoMobileTexto.textContent = `Etapa ${numero} de 4 · ${rotulosPassos[numero]}`;
  }

  // Etapa 1: datas
  document.getElementById("btn-ir-etapa-2").addEventListener("click", () => {
    const resultado = calcularReserva();
    if (resultado.erro) {
      campo.erroDatas.textContent = resultado.erro;
      document.getElementById("resumo-preco").hidden = true;
      return;
    }
    campo.erroDatas.textContent = "";
    reserva = resultado;
    document.getElementById("resumo-preco").innerHTML = montarResumoHtml(reserva);
    document.getElementById("resumo-preco").hidden = false;

    document.getElementById("resumo-preco-2").innerHTML = montarResumoHtml(reserva);
    irParaEtapa(2);
  });

  // Etapa 2: dados do hóspede
  document.getElementById("btn-voltar-etapa-1").addEventListener("click", () => irParaEtapa(1));

  document.getElementById("btn-ir-etapa-3").addEventListener("click", () => {
    const cpfLimpo = campo.cpf.value.replace(/\D/g, "");
    if (!campo.nome.value.trim() || !campo.email.value.trim() || !campo.telefone.value.trim() || cpfLimpo.length !== 11) {
      mostrarToast("Preencha nome, e-mail, telefone e um CPF válido para continuar.");
      return;
    }

    document.getElementById("revisao-mansao").textContent = `${mansao.nome} — ${mansao.cidade}`;
    document.getElementById("revisao-checkin").textContent = formatarData(reserva.checkin);
    document.getElementById("revisao-checkout").textContent = formatarData(reserva.checkout);
    document.getElementById("revisao-hospedes").textContent = `${reserva.hospedes} hóspede${reserva.hospedes > 1 ? "s" : ""}`;
    document.getElementById("revisao-nome").textContent = campo.nome.value.trim();
    document.getElementById("resumo-preco-3").innerHTML = montarResumoHtml(reserva);
    document.getElementById("aviso-restante").innerHTML =
      `Você paga agora só a taxa de reserva: <strong>${formatarPreco(reserva.taxaPix)}</strong>. ` +
      `O restante de <strong>${formatarPreco(reserva.restantePix)}</strong> deve ser pago até o check-in, em <strong>${formatarData(reserva.checkin)}</strong>.`;

    irParaEtapa(3);
  });

  // Etapa 3: confirmação (revisão antes de gerar o Pix)
  document.getElementById("btn-voltar-etapa-2").addEventListener("click", () => irParaEtapa(2));

  document.getElementById("btn-ir-etapa-4").addEventListener("click", () => {
    document.getElementById("resumo-preco-4").innerHTML = montarResumoHtml(reserva);
    irParaEtapa(4);
    gerarCobrancaPix();
  });

  // Etapa 4: pagamento (somente Pix)
  document.getElementById("btn-voltar-etapa-3").addEventListener("click", () => {
    pararPolling();
    irParaEtapa(3);
  });

  let pixTransactionId = null;
  let pixPollingId = null;
  const pixCarregando = document.getElementById("pix-carregando");
  const pixQrImg = document.getElementById("pix-qr-img");
  const pixInstrucao = document.getElementById("pix-instrucao");
  const pixCodigoCaixa = document.getElementById("pix-codigo-caixa");
  const pixCodigoTexto = document.getElementById("pix-codigo-texto");
  const pixStatusTexto = document.getElementById("pix-status-texto");

  function pararPolling() {
    if (pixPollingId) {
      clearInterval(pixPollingId);
      pixPollingId = null;
    }
  }

  function resetarPix() {
    pararPolling();
    pixTransactionId = null;
    pixCarregando.hidden = true;
    pixQrImg.hidden = true;
    pixInstrucao.hidden = true;
    pixCodigoCaixa.hidden = true;
    pixStatusTexto.textContent = "";
    pixStatusTexto.classList.remove("erro");
  }

  async function gerarCobrancaPix() {
    pixCarregando.hidden = false;
    pixCarregando.textContent = "Gerando cobrança Pix...";
    pixQrImg.hidden = true;
    pixInstrucao.hidden = true;
    pixCodigoCaixa.hidden = true;
    pixStatusTexto.textContent = "";
    pixStatusTexto.classList.remove("erro");

    try {
      const resp = await fetch("/api/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mansaoId: mansao.id,
          checkin: reserva.checkin,
          checkout: reserva.checkout,
          hospedes: reserva.hospedes,
          customer: {
            name: campo.nome.value.trim(),
            email: campo.email.value.trim(),
            phone: campo.telefone.value.trim(),
            document: campo.cpf.value.trim(),
          },
          utms: obterUtms(),
        }),
      });
      const data = await resp.json();

      if (!resp.ok || !data.success) {
        pixCarregando.hidden = true;
        pixStatusTexto.textContent = data.error || "Não foi possível gerar a cobrança Pix. Tente novamente.";
        pixStatusTexto.classList.add("erro");
        return;
      }

      pixTransactionId = data.transactionId;
      const qrRecebido = data.pix.qrCodeBase64;
      if (qrRecebido && qrRecebido.startsWith("data:image")) {
        pixQrImg.src = qrRecebido;
      } else {
        const urlQr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(data.pix.copyPaste)}`;
        try {
          const respQr = await fetch(urlQr);
          const blobQr = await respQr.blob();
          pixQrImg.src = URL.createObjectURL(blobQr);
        } catch {
          pixQrImg.src = urlQr;
        }
      }
      pixQrImg.hidden = false;
      pixCodigoTexto.textContent = data.pix.copyPaste;
      pixInstrucao.hidden = false;
      pixCodigoCaixa.hidden = false;
      pixCarregando.hidden = true;
      pixStatusTexto.textContent = "Aguardando pagamento...";

      iniciarPolling();
    } catch (err) {
      pixCarregando.hidden = true;
      pixStatusTexto.textContent = "Erro ao conectar com o provedor de pagamento. Tente novamente.";
      pixStatusTexto.classList.add("erro");
    }
  }

  function iniciarPolling() {
    pararPolling();
    pixPollingId = setInterval(verificarStatusPix, 4000);
  }

  async function verificarStatusPix() {
    if (!pixTransactionId) return;
    try {
      const resp = await fetch(`/api/pix-status?transactionId=${encodeURIComponent(pixTransactionId)}`);
      const data = await resp.json();
      if (!resp.ok || !data.success) return;

      if (data.status === "PAID") {
        pararPolling();
        mostrarConfirmacao({ transactionId: pixTransactionId });
      } else if (data.status === "CANCELLED") {
        pararPolling();
        pixStatusTexto.textContent = "Essa cobrança expirou. Clique em Pix novamente para gerar uma nova.";
        pixStatusTexto.classList.add("erro");
        pixQrImg.hidden = true;
        pixInstrucao.hidden = true;
        pixCodigoCaixa.hidden = true;
      }
    } catch {
      // Falha de rede pontual: mantém aguardando e tenta de novo no próximo ciclo.
    }
  }

  document.getElementById("form-reserva").addEventListener("submit", (e) => e.preventDefault());

  document.getElementById("btn-copiar-pix").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pixCodigoTexto.textContent);
      mostrarToast("Código Pix copiado.");
    } catch {
      mostrarToast("Não foi possível copiar automaticamente. Selecione o código manualmente.");
    }
  });

  function mostrarConfirmacao({ transactionId }) {
    pararPolling();
    ["etapa-1", "etapa-2", "etapa-3", "etapa-4"].forEach((idEl) => (document.getElementById(idEl).hidden = true));
    document.getElementById("resumo-preco").hidden = true;

    const codigo = `GR-${mansao.id.toString().padStart(2, "0")}${Math.floor(1000 + Math.random() * 9000)}`;
    document.getElementById("confirmacao-codigo").textContent = transactionId
      ? `Código da reserva: ${codigo} · Transação Pix: ${transactionId}`
      : `Código da reserva: ${codigo}`;
    document.getElementById("resumo-preco-final").innerHTML = montarResumoHtml(reserva);
    document.getElementById("confirmacao-metodo").textContent = "Pagamento confirmado via Pix (30% OFF aplicado na taxa de reserva).";
    document.getElementById("confirmacao-restante-info").textContent =
      `O restante de ${formatarPreco(reserva.restantePix)} deve ser pago até o check-in, em ${formatarData(reserva.checkin)}.`;
    document.getElementById("confirmacao-email").textContent = campo.email.value.trim();

    document.getElementById("etapa-confirmacao").hidden = false;
    passos.forEach((p) => p.classList.add("concluido"));
    progressoMobile.forEach((p) => p.classList.add("concluido"));
    if (passoMobileTexto) passoMobileTexto.textContent = "Reserva confirmada";
  }

  document.getElementById("btn-nova-reserva").addEventListener("click", () => {
    document.getElementById("form-reserva").reset();
    reserva = null;
    resetarPix();
    document.getElementById("resumo-preco").hidden = true;
    campo.erroDatas.textContent = "";
    irParaEtapa(1);
  });
})();
