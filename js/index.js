(async function () {
  await inicializarComum("inicio");
  const { mansoes } = await carregarDados();

  document.getElementById("hero").style.backgroundImage = `url(${mansoes[0].imagens[0]})`;
  document.getElementById("stat-mansoes").textContent = mansoes.length;
  document.getElementById("stat-cidades").textContent = new Set(mansoes.map((m) => m.cidade)).size;

  const destaques = mansoes.filter((m) => m.destaque).slice(0, 6);
  const grid = document.getElementById("grid-destaques");

  grid.innerHTML = destaques
    .map(
      (m) => `
    <a class="card-mansao" href="imovel.html?id=${m.id}">
      <div class="imagem">
        <span class="tag">Destaque</span>
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
