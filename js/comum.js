// Funções e injeções compartilhadas por todas as páginas.

let CONFIG = null;
let MANSOES = null;

async function carregarDados() {
  if (!CONFIG) {
    CONFIG = await fetch("data/config.json").then((r) => r.json());
  }
  if (!MANSOES) {
    MANSOES = await fetch("data/mansoes.json").then((r) => r.json());
  }
  return { config: CONFIG, mansoes: MANSOES };
}

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function linkWhatsapp(config, mensagem) {
  const texto = encodeURIComponent(mensagem);
  return `https://wa.me/${config.whatsapp}?text=${texto}`;
}

// Captura utm_source/utm_campaign/etc. (e src/sck da Utmify) da URL e guarda
// no navegador, pra sobreviver à navegação entre páginas até o pagamento.
const CHAVES_UTM = ["utm_source", "utm_campaign", "utm_medium", "utm_content", "utm_term", "src", "sck"];

function capturarUtms() {
  const params = new URLSearchParams(window.location.search);
  const encontrados = {};
  let temAlgum = false;
  CHAVES_UTM.forEach((chave) => {
    const valor = params.get(chave);
    if (valor) {
      encontrados[chave] = valor;
      temAlgum = true;
    }
  });
  if (temAlgum) {
    localStorage.setItem("utm_params", JSON.stringify(encontrados));
  }
}

function obterUtms() {
  try {
    return JSON.parse(localStorage.getItem("utm_params") || "{}");
  } catch {
    return {};
  }
}

function montarHeader(config, paginaAtiva) {
  const header = document.getElementById("header");
  if (!header) return;

  const nomeMarcaHtml = `${config.nomeMarca.split(" ")[0]} <span>${config.nomeMarca.split(" ").slice(1).join(" ")}</span>`;

  // Página de oferta (landing de anúncio): sem menu, sem link de saída no logo —
  // foco total na oferta, sem oferecer caminho de volta pro site genérico.
  if (paginaAtiva === "oferta") {
    header.innerHTML = `
      <div class="container">
        <span class="marca">${nomeMarcaHtml}</span>
      </div>
    `;
    window.addEventListener("scroll", () => {
      header.classList.toggle("scrolled", window.scrollY > 40);
    });
    return;
  }

  const links = [
    { href: "index.html", label: "Início", chave: "inicio" },
    { href: "catalogo.html", label: "Mansões", chave: "catalogo" },
    { href: "reveillon.html", label: "🎉 Réveillon", chave: "reveillon" },
    { href: "index.html#diferenciais", label: "Experiência", chave: "experiencia" },
  ];

  header.innerHTML = `
    <div class="container">
      <a href="index.html" class="marca">${nomeMarcaHtml}</a>
      <nav class="nav">
        <ul class="nav-links" id="nav-links">
          ${links
            .map(
              (l) =>
                `<li><a href="${l.href}" class="${l.chave === paginaAtiva ? "ativo" : ""}">${l.label}</a></li>`
            )
            .join("")}
          <li class="nav-links-cta">
            <a class="btn btn-primario btn-bloco" href="catalogo.html">Reservar Agora</a>
          </li>
        </ul>
        <a class="btn btn-primario nav-cta-desktop" href="catalogo.html">Reservar Agora</a>
        <button class="nav-toggle" id="nav-toggle" aria-label="Abrir menu">&#9776;</button>
      </nav>
    </div>
  `;

  const toggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  function alternarMenu(aberto) {
    navLinks.classList.toggle("aberto", aberto);
    toggle.innerHTML = aberto ? "&times;" : "&#9776;";
    toggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  }

  toggle.addEventListener("click", () => alternarMenu(!navLinks.classList.contains("aberto")));
  navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => alternarMenu(false)));

  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
  });
}

function montarFooter(config) {
  const footer = document.getElementById("footer");
  if (!footer) return;

  const anoAtual = new Date().getFullYear();

  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-marca">
          <span class="marca">${config.nomeMarca.split(" ")[0]} <span>${config.nomeMarca.split(" ").slice(1).join(" ")}</span></span>
          <p>${config.slogan}. Curadoria de mansões exclusivas para temporadas inesquecíveis.</p>
        </div>
        <div>
          <h4>Navegação</h4>
          <ul>
            <li><a href="index.html">Início</a></li>
            <li><a href="catalogo.html">Catálogo de mansões</a></li>
            <li><a href="reveillon.html">Mansões para o Réveillon</a></li>
            <li><a href="index.html#diferenciais">Experiência</a></li>
          </ul>
        </div>
        <div>
          <h4>Contato</h4>
          <ul>
            <li><a href="${linkWhatsapp(config, "Olá! Gostaria de mais informações.")}" target="_blank" rel="noopener">WhatsApp</a></li>
            <li><a href="mailto:${config.email}">${config.email}</a></li>
            <li><a href="${config.instagram}" target="_blank" rel="noopener">Instagram</a></li>
          </ul>
        </div>
        <div>
          <h4>Atendimento</h4>
          <ul>
            <li>Concierge 24 horas</li>
            <li>Reservas com curadoria pessoal</li>
            <li>Endereço-sede: a definir</li>
          </ul>
        </div>
      </div>
      <div class="footer-base">
        <span>&copy; ${anoAtual} ${config.nomeMarca}. Todos os direitos reservados.</span>
        <span>Dados e endereços deste site são provisórios (demonstração).</span>
      </div>
    </div>
  `;
}

function montarWhatsappFlutuante(config) {
  const el = document.getElementById("whatsapp-flutuante");
  if (!el) return;
  el.href = linkWhatsapp(config, "Olá! Vim pelo site e gostaria de falar sobre uma reserva.");
  el.target = "_blank";
  el.rel = "noopener";
  el.innerHTML = "&#9743;";
}

function montarPromoAnoNovo(mansoes) {
  if (document.getElementById("promo-badge")) return;

  const disponiveisReveillon = mansoes.filter((m) => m.disponivelReveillon);
  const maisBaratas = [...disponiveisReveillon].sort((a, b) => a.precoNoite - b.precoNoite).slice(0, 5);

  const badge = document.createElement("button");
  badge.id = "promo-badge";
  badge.className = "promo-badge";
  badge.type = "button";
  badge.innerHTML = `<span class="promo-badge-icone">🎉</span><span class="promo-badge-texto">Datas de Réveillon<br />disponíveis</span>`;

  const overlay = document.createElement("div");
  overlay.id = "promo-overlay";
  overlay.className = "promo-overlay";
  overlay.innerHTML = `
    <div class="promo-modal">
      <button type="button" class="promo-fechar" id="promo-fechar" aria-label="Fechar">&times;</button>
      <span class="eyebrow">Vagas limitadas para o Réveillon</span>
      <h3>${disponiveisReveillon.length} mansões disponíveis para fechar o ano</h3>
      <div class="promo-lista">
        ${maisBaratas
          .map(
            (m) => `
          <a class="promo-item" href="imovel.html?id=${m.id}">
            <img src="${m.imagens[0]}" alt="${m.nome}" loading="lazy" />
            <div class="promo-item-info">
              <div class="promo-item-cidade">${m.cidade}</div>
              <div class="promo-item-nome">${m.nome}</div>
              <div class="promo-item-preco">${formatarPreco(m.precoNoite)}<span> /noite</span></div>
            </div>
          </a>
        `
          )
          .join("")}
      </div>
      <a class="btn btn-primario btn-bloco" href="reveillon.html" style="margin-top: 18px;">Ver todas as ${disponiveisReveillon.length} mansões</a>
    </div>
  `;

  document.body.appendChild(badge);
  document.body.appendChild(overlay);

  function abrir() {
    overlay.classList.add("aberto");
    document.body.classList.add("travar-scroll");
  }
  function fechar() {
    overlay.classList.remove("aberto");
    document.body.classList.remove("travar-scroll");
  }

  badge.addEventListener("click", abrir);
  overlay.querySelector("#promo-fechar").addEventListener("click", fechar);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fechar();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fechar();
  });
}

function mostrarToast(mensagem) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.classList.add("visivel");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("visivel"), 4200);
}

async function inicializarComum(paginaAtiva) {
  capturarUtms();
  const { config, mansoes } = await carregarDados();
  document.title = document.title.replace("Grand Residence", config.nomeMarca);
  montarHeader(config, paginaAtiva);
  montarFooter(config);
  montarWhatsappFlutuante(config);
  montarPromoAnoNovo(mansoes);
  return config;
}
