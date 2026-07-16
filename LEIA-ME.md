# Grand Residence — Site de Aluguel de Mansões de Luxo

Site completo com: página inicial, catálogo com filtros, aba de Réveillon, e página individual de cada mansão (16 no total, com fotos e dados reais migrados da Hansen Imóveis), com fluxo de reserva 100% no site (datas → dados do hóspede → confirmação → pagamento Pix), sem precisar de contato externo.

## Como rodar localmente

```
node dev-server.js
```

Depois acesse `http://localhost:4173`.

**Atenção:** `dev-server.js` é só pra testar localmente. Ele nunca deve ser usado em produção — no Vercel, os arquivos estáticos e as funções em `api/` são servidos diretamente pela plataforma, sem precisar desse arquivo. Não renomeie de volta pra `server.js` (ou qualquer nome que o Vercel reconheça como entrypoint automático), senão o deploy quebra de novo.

## Sobre os preços atuais

As 16 mansões vieram de dados reais do seu site antigo (hansenimoveis.com), mas **6 delas eram anúncios de venda** (sem diária cadastrada) e as outras 10 tinham diária real. A pedido, defini **preços de lançamento bem mais acessíveis para todas as 16** (entre R$ 950 e R$ 2.000/noite, variando pelo número de quartos), pra você testar os primeiros dias do site novo.

Quando quiser ajustar os valores (por mansão ou de forma geral), edite o campo `"precoNoite"` de cada uma em `data/mansoes.json`.

## O que editar antes de publicar

### 1. Nome da marca, WhatsApp, e-mail, cores
Arquivo: `data/config.json`
- `nomeMarca`, `whatsapp` (só dígitos, formato `55DDDNÚMERO`), `email`, `instagram`
- `corPrimaria` / `corDestaque`: cores do site
- `taxaReserva`: valor fixo do sinal (hoje R$ 700) — **não mudar sem querer**, o desconto de Pix é calculado em cima desse valor
- `descontoPix`: percentual de desconto no Pix (hoje 0.3 = 30%)

### 2. As 16 mansões (nome, cidade, endereço, preço, fotos, comodidades)
Arquivo: `data/mansoes.json` — cada mansão é um objeto com `nome`, `cidade`, `endereco`, `precoNoite`, `quartos`, `hospedes`, `banheiros`, `descricao`, `comodidades`, `imagens` (caminhos em `img/hansen/`), `destaque` e `disponivelReveillon`.

- **Fotos**: já são fotos reais das propriedades (baixadas do hansenimoveis.com, 6 por mansão — o site original tem até 48 fotos de algumas, se quiser trocar por mais é só adicionar arquivos em `img/hansen/` e referenciar no array `imagens`).
- **Endereço**: como o site de origem não expõe o endereço exato publicamente, está como "endereço completo sob consulta" — edite com o endereço real quando quiser exibi-lo.
- **descrição**: veio truncada da meta tag de SEO do site antigo (~150 caracteres) — vale reescrever com um texto mais completo por mansão quando tiver tempo.
- **destaque**: `true` faz a mansão aparecer na home (as 6 primeiras estão marcadas).
- **disponivelReveillon**: `true` faz a mansão aparecer na aba/página de Réveillon (todas as 16 estão marcadas — desmarque as que não estiverem realmente disponíveis nessa data).

### 3. Textos institucionais
- `index.html`: hero, diferenciais, depoimentos, faixa do Réveillon.
- Depoimentos ainda são fictícios — troque pelos reais assim que tiver.

## Sobre o fluxo de reserva

A página de cada mansão tem um fluxo em 4 etapas, tudo dentro do site:

1. **Datas** — hóspede escolhe check-in, check-out e número de hóspedes. Calcula automaticamente diária × noites.
2. **Dados do hóspede** — nome, e-mail, telefone, CPF.
3. **Confirmação** — mostra um resumo claro antes de qualquer cobrança: mansão, datas, hóspedes, nome, e uma caixa destacada explicando que só a taxa de reserva é paga agora e o restante vence no check-in.
4. **Pagamento (Pix)** — ao confirmar, gera a cobrança Pix de verdade e mostra QR Code + código copia-e-cola. O site consulta o status a cada poucos segundos e confirma a reserva automaticamente assim que o Pix é pago.

**Só existe Pix** (sem cartão) — decisão intencional, porque cartão permite cancelamento/estorno depois da reserva, e Pix não.

O valor cobrado é **sempre recalculado no servidor** (`api/create-pix.js`) a partir de `data/mansoes.json` e `data/config.json` — o navegador do hóspede nunca decide o preço. A taxa de reserva tem 30% de desconto automático no Pix.

**Para ativar o Pix**, crie um arquivo `.env.local` (não versionado) na raiz do projeto com:
```
BLACKCAT_API_KEY=sua_chave_aqui
```
**Nunca cole essa chave em arquivos versionados** — o `.gitignore` já protege `.env.local`.

## Rastreamento de UTM (Utmify)

O site captura `utm_source`, `utm_campaign`, `utm_medium`, `utm_content`, `utm_term` (e `src`/`sck` da própria Utmify) assim que alguém chega em qualquer página, e guarda isso no navegador até a reserva ser concluída — mesmo que a pessoa navegue por várias páginas antes de reservar.

Quando o Pix é **gerado**, o site avisa a Utmify que existe um pedido "aguardando pagamento" (com esses dados de UTM). Quando o Pix é **pago**, o site avisa que o pedido virou "pago". Isso é o que faz o pedido aparecer no painel da Utmify com a campanha/anúncio correto.

Para ativar, adicione no `.env.local`:
```
UTMIFY_API_TOKEN=seu_token_aqui
```
(Painel da Utmify → Integrações → Webhooks → Credenciais de API). **Sem esse token, o site funciona normalmente** — só não notifica a Utmify.

## ⚠️ Antes de divulgar o link para hóspedes reais

Ainda falta:
- **Preço real nas 10 mansões listadas acima** (item mais urgente).
- **Checagem de disponibilidade**: o site não sabe se uma data já está reservada por outro hóspede (sem banco de dados por trás). Duas pessoas podem pagar pela mesma data hoje.
- **Registro da reserva**: quando o Pix é confirmado, o hóspede vê a tela de sucesso, mas isso não é salvo em nenhum lugar (nem e-mail automático é enviado) — você só saberá que a venda aconteceu olhando o extrato/painel da Blackcat.

⚠️ **Compromisso assumido na página de oferta (`oferta.html`)**: o site promete ao hóspede "reembolso garantido se a data não for confirmada". Isso **não é automático** — hoje não existe nenhum sistema que verifica disponibilidade nem processa reembolso sozinho. Se um hóspede pagar por uma data que não pode ser honrada, **você precisa reembolsar manualmente pelo painel da Blackcat**. Como não há checagem de disponibilidade automática (ver item acima), fique de olho nas reservas recebidas para conseguir cumprir essa promessa.
- **Endereço exato**: hoje mostra "sob consulta" — decida se quer exibir o endereço completo no site ou só depois da reserva confirmada.

## Como publicar (deixar no ar)

Como agora o site tem funções de servidor (`api/create-pix.js`, `api/pix-status.js`), a hospedagem precisa suportar isso:
- **Vercel**: funciona direto (o `vercel.json` já está configurado) — é a opção mais simples.
- Netlify/GitHub Pages **não servem** as funções de API sem adaptação — evite por enquanto.

Configure a variável de ambiente `BLACKCAT_API_KEY` no painel da hospedagem escolhida (nunca no código).
