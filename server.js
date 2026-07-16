const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

// Garante que process.cwd() aponte para esta pasta, independente de onde o
// processo node foi iniciado — as funções em api/*.js leem data/*.json a
// partir de process.cwd() (mesma convenção usada no deploy Vercel).
process.chdir(__dirname);

const root = __dirname;
const port = process.env.PORT || 4173;

// Carrega .env.local (se existir) sem depender de nenhum pacote externo.
function carregarEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const linhas = fs.readFileSync(envPath, "utf8").split("\n");
  linhas.forEach((linha) => {
    const l = linha.trim();
    if (!l || l.startsWith("#")) return;
    const idx = l.indexOf("=");
    if (idx === -1) return;
    const chave = l.slice(0, idx).trim();
    const valor = l.slice(idx + 1).trim();
    if (!(chave in process.env)) process.env[chave] = valor;
  });
}
carregarEnvLocal();

const tipos = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

const rotasApi = {
  "POST /api/create-pix": require("./api/create-pix"),
  "GET /api/pix-status": require("./api/pix-status"),
};

function criarRes(resNativo) {
  resNativo.status = function (codigo) {
    resNativo.statusCode = codigo;
    return resNativo;
  };
  resNativo.json = function (obj) {
    const texto = JSON.stringify(obj);
    resNativo.setHeader("Content-Type", "application/json; charset=utf-8");
    resNativo.end(texto);
  };
  return resNativo;
}

function tratarApi(req, res, handler) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  req.query = Object.fromEntries(url.searchParams);

  if (req.method === "GET") {
    req.body = {};
    return handler(req, criarRes(res));
  }

  let corpo = "";
  req.on("data", (pedaco) => (corpo += pedaco));
  req.on("end", () => {
    try {
      req.body = corpo ? JSON.parse(corpo) : {};
    } catch {
      req.body = {};
    }
    handler(req, criarRes(res));
  });
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const chaveRota = `${req.method} ${url.pathname}`;

    if (rotasApi[chaveRota]) {
      return tratarApi(req, res, rotasApi[chaveRota]);
    }

    let urlPath = decodeURIComponent(url.pathname);
    if (urlPath === "/") urlPath = "/index.html";
    const filePath = path.join(root, urlPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Não encontrado");
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, {
        "Content-Type": tipos[ext] || "application/octet-stream",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      });
      res.end(data);
    });
  })
  .listen(port, () => console.log(`Servindo em http://localhost:${port}`));
