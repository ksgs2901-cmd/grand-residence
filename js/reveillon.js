(async function () {
  await inicializarComum("reveillon");
  const { mansoes } = await carregarDados();

  const disponiveis = mansoes
    .filter((m) => m.disponivelReveillon)
    .sort((a, b) => a.precoNoite - b.precoNoite);

  document.getElementById("hero-reveillon").style.backgroundImage = `url(${disponiveis[0].imagens[0]})`;
  document.getElementById("total-reveillon").textContent = disponiveis.length;
  document.getElementById("resultado-info").textContent =
    `${disponiveis.length} mansões com disponibilidade confirmada para o Réveillon`;

  const grid = document.getElementById("grid-reveillon");
  grid.innerHTML = disponiveis
    .map(
      (m) => `
    <a class="card-mansao" href="imovel.html?id=${m.id}">
      <div class="imagem">
        <span class="tag">🎉 Réveillon</span>
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
})();
