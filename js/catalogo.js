(async function () {
  await inicializarComum("catalogo");
  const { mansoes } = await carregarDados();

  const selCidade = document.getElementById("f-cidade");
  const cidades = [...new Set(mansoes.map((m) => m.cidade))].sort();
  selCidade.innerHTML += cidades.map((c) => `<option value="${c}">${c}</option>`).join("");

  const els = {
    busca: document.getElementById("f-busca"),
    cidade: selCidade,
    hospedes: document.getElementById("f-hospedes"),
    preco: document.getElementById("f-preco"),
    ordenar: document.getElementById("f-ordenar"),
  };

  const grid = document.getElementById("grid-catalogo");
  const info = document.getElementById("resultado-info");

  function renderizar() {
    const termo = els.busca.value.trim().toLowerCase();
    const cidade = els.cidade.value;
    const hospedesMin = Number(els.hospedes.value) || 0;
    const precoMax = Number(els.preco.value) || Infinity;
    const ordenar = els.ordenar.value;

    let filtradas = mansoes.filter((m) => {
      const combinaBusca = !termo || m.nome.toLowerCase().includes(termo) || m.cidade.toLowerCase().includes(termo);
      const combinaCidade = !cidade || m.cidade === cidade;
      const combinaHospedes = m.hospedes >= hospedesMin;
      const combinaPreco = m.precoNoite <= precoMax;
      return combinaBusca && combinaCidade && combinaHospedes && combinaPreco;
    });

    filtradas.sort((a, b) => {
      if (ordenar === "preco-asc") return a.precoNoite - b.precoNoite;
      if (ordenar === "preco-desc") return b.precoNoite - a.precoNoite;
      if (ordenar === "hospedes-desc") return b.hospedes - a.hospedes;
      return (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0);
    });

    info.textContent = `${filtradas.length} mansõe${filtradas.length === 1 ? "" : "s"} encontrada${filtradas.length === 1 ? "" : "s"}`;

    if (filtradas.length === 0) {
      grid.innerHTML = `<div class="sem-resultado">Nenhuma mansão encontrada com esses filtros. Tente ajustar sua busca.</div>`;
      return;
    }

    grid.innerHTML = filtradas
      .map(
        (m) => `
      <a class="card-mansao" href="imovel.html?id=${m.id}">
        <div class="imagem">
          ${m.destaque ? '<span class="tag">Destaque</span>' : ""}
          <img src="${m.imagens[0]}" alt="${m.nome}" loading="lazy" />
        </div>
        <div class="corpo">
          <div class="cidade">${m.cidade}</div>
          <h3>${m.nome}</h3>
          <div class="specs">
            <span>${m.quartos} suítes</span>
            <span>${m.hospedes} hóspedes</span>
            <span>${m.banheiros} banheiros</span>
          </div>
          <div class="rodape">
            <div class="preco"><strong>${formatarPreco(m.precoNoite)}</strong><span> /noite</span></div>
            <span class="ver-mais">Ver detalhes</span>
          </div>
        </div>
      </a>
    `
      )
      .join("");
  }

  Object.values(els).forEach((el) => el.addEventListener("input", renderizar));
  renderizar();
})();
