// Apresentação final do workshop (Grupo 10) – versão 3: v2 + Samba também com o SSSD e adsys testado
// Uso: node build_final_v3.js [saida.pptx]   (requer pptxgenjs)
const pptxgen = require("pptxgenjs");
const fs = require("fs"), path = require("path");
const OUT = process.argv[2] || "SR2-2627-Workshop-Grp10-Apresentacao-Final-v3.pptx";

// ---------- Paleta (igual aos decks anteriores do grupo) ----------
const NAVY = "1F2937", ORANGE = "0284C7", TITLE = "0369A1", AMBER = "7DD3FC"; // ORANGE: cor de destaque (agora azul)
const ACCENT = ORANGE, ACCENT2 = "7DD3FC", SKY = "BAE6FD";
const TXT = "27272A", GREY = "71717A", WHITE = "FFFFFF", NOTE = "F0F9FF";
const ICE2 = "F4F4F5", RULE = "A1A1AA", BORDER = "E4E4E7", ALT = "FAFAF9";
const BAD = "B42318", GOOD = "2E7D5B", LIGHT = "E4E4E7";
const LOGOS = path.join(__dirname, "logos");
const IMG_DIR = fs.existsSync(path.join(__dirname, "..", "..", "imagens")) ? path.join(__dirname, "..", "..", "imagens") : "D:/TrabalhoSR2/imagens";
const IMG_SIZES = { "03-ad-dominio.png": [1174, 738], "09-computador-ad.png": [783, 429], "10-user-ad.png": [572, 386], "11-getent.png": [912, 175], "16-smbclient.png": [718, 382] };

const ANO = "2026/2027";
const FOOTER = `Grupo 10 | ISEC – IPC | Serviços de Rede II | ${ANO}`;
const A1 = "Orlando Santos", A2 = "Pedro Ferreira", A3 = "Renalto Baticã";

const pres = new pptxgen();
// As notas do orador ficam no código, mas não vão para o ficheiro (SPEAKER_NOTES=1 para as incluir)
const SPEAKER_NOTES = !!process.env.SPEAKER_NOTES;
const _addSlide = pres.addSlide.bind(pres);
pres.addSlide = (o) => { const sl = _addSlide(o); if (!SPEAKER_NOTES) sl.addNotes = () => sl; return sl; };
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.author = "Grupo 10";
pres.title = "Integração de clientes Linux num domínio Windows AD DS";
pres.theme = { headFontFace: "Calibri", bodyFontFace: "Calibri" };

const footer = [{ text: { text: FOOTER, options: { x: 0.5, y: 5.24, w: 6, h: 0.26, fontSize: 9, color: GREY, fontFace: "Calibri", margin: 0 } } }];
const slideNumber = { x: 8.9, y: 5.24, w: 0.6, h: 0.26, fontSize: 9, color: GREY, align: "right", fontFace: "Calibri" };
pres.defineSlideMaster({ title: "CAPA", background: { color: WHITE }, objects: footer });
pres.defineSlideMaster({
  title: "CONTEUDO", background: { color: WHITE }, slideNumber,
  objects: [...footer,
    { rect: { x: 0.5, y: 0.3, w: 0.08, h: 0.5, fill: { color: ORANGE } } },
    { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 0.22, w: 7.9, h: 0.66, fontSize: 24, bold: true, color: TITLE, fontFace: "Calibri", align: "left", valign: "middle", margin: 0 }, text: "" } }],
});

// ---------- Helpers ----------
function newSlide(title) {
  const s = pres.addSlide({ masterName: "CONTEUDO" });
  s.addText(title, { placeholder: "title" });
  return s;
}
function card(s, x, y, w, h, fill = WHITE, line) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06, fill: { color: fill }, line: line || (fill === WHITE ? { color: BORDER, width: 1 } : { color: fill }) });
}
function badge(s, x, y, d, label, fill = ORANGE, color = WHITE, fsz) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  s.addText(label, { x, y, w: d, h: d, align: "center", valign: "middle", bold: true, color, margin: 0, fontSize: fsz || d * 24 });
}
function logo(s, x, y, d, key) {
  const f = path.join(LOGOS, key + ".png");
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: WHITE }, line: { color: BORDER, width: 1 } });
  const k = key === "samba" ? 0.9 : 0.66;
  if (fs.existsSync(f)) s.addImage({ path: f, x: x + d * (1 - k) / 2, y: y + d * (1 - k) / 2, w: d * k, h: d * k, altText: `Logótipo ${key}` });
}
function bullets(items, o = {}) {
  return items.map((t, i) => {
    const runs = Array.isArray(t) ? t : [{ text: t }];
    return runs.map((r, j) => ({ text: r.text, options: { ...(j === 0 ? { bullet: { indent: 14 } } : {}), ...(r.options || {}), breakLine: j === runs.length - 1 && i < items.length - 1, paraSpaceAfter: 8, ...o } }));
  }).flat();
}
// Frase-chave minimalista: barra de cor + uma linha
function strip(s, label, text, y = 4.55, h = 0.55, mono = false) {
  const t = mono ? text : text.charAt(0).toUpperCase() + text.slice(1);
  const yy = y + h / 2 - 0.2;
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yy, w: 0.05, h: 0.4, fill: { color: ORANGE }, line: { color: ORANGE } });
  s.addText(t, { x: 0.7, y: yy - 0.05, w: 8.8, h: 0.5, fontSize: mono ? 11 : 14, color: mono ? GREY : NAVY, fontFace: mono ? "Courier New" : "Calibri", bold: !mono, valign: "middle", margin: 0 });
}
function hline(s, x1, x2, y, { color = NAVY, width = 1.5, dash, start, end } = {}) {
  const line = { color, width };
  if (dash) line.dashType = "dash";
  if (end) line.endArrowType = "triangle";
  if (start) line.beginArrowType = "triangle";
  s.addShape(pres.shapes.LINE, { x: x1, y, w: x2 - x1, h: 0, line });
}
function vline(s, x, y1, y2, { color = RULE, width = 1, dash } = {}) {
  s.addShape(pres.shapes.LINE, { x, y: y1, w: 0, h: y2 - y1, line: { color, width, ...(dash ? { dashType: "dash" } : {}) } });
}
function table(s, header, rows, { x = 0.5, y = 1.3, w = 9.0, colW, rowH = 0.4, fs = 12, headFill = NAVY, firstBold = true } = {}) {
  const H = header.map((t, j) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: Array.isArray(headFill) ? headFill[j] : headFill }, fontSize: fs + 0.5 } }));
  const data = [H, ...rows.map((r, i) => r.map((c, j) => ({ text: c, options: { fontSize: fs, bold: firstBold && j === 0, color: firstBold && j === 0 ? NAVY : TXT, fill: { color: i % 2 ? ALT : WHITE } } })))];
  s.addTable(data, { x, y, w, colW, rowH, border: { type: "solid", pt: 0.5, color: BORDER }, fontFace: "Calibri", valign: "middle", margin: [0.05, 0.1, 0.05, 0.1] });
}
// Fila de caixas ligadas por setas
function flowRow(s, x, y, w, h, items, { gap = 0.3, fs = 12 } = {}) {
  const n = items.length, bw = (w - gap * (n - 1)) / n;
  items.forEach((t, i) => {
    const bx = x + i * (bw + gap), dark = i % 2 === 0;
    card(s, bx, y, bw, h, dark ? NAVY : ICE2);
    const runs = Array.isArray(t) ? t : [t];
    s.addText(runs.map((r, j) => ({ text: r, options: { bold: j === 0, fontSize: j === 0 ? fs : fs - 2, color: dark ? (j === 0 ? WHITE : LIGHT) : (j === 0 ? NAVY : GREY), breakLine: j < runs.length - 1 } })),
      { x: bx + 0.08, y, w: bw - 0.16, h, align: "center", valign: "middle", margin: 0 });
    if (i < n - 1) hline(s, bx + bw + 0.04, bx + bw + gap - 0.04, y + h / 2, { color: ORANGE, width: 2, end: true });
  });
  return bw;
}
// Diapositivo "o que é": ícone grande à esquerda, 3 pontos à direita
function whatSlide({ title, logoKey, badgeTxt, name, full, items, foot, notes }) {
  const s = newSlide(title);
  if (logoKey) logo(s, 0.9, 1.55, 1.9, logoKey); else badge(s, 0.9, 1.55, 1.9, badgeTxt, ORANGE, WHITE, badgeTxt.length > 3 ? 26 : 34);
  s.addText([{ text: name, options: { bold: true, fontSize: 20, color: NAVY, breakLine: true } }, { text: full, options: { fontSize: 12, color: GREY } }],
    { x: 0.5, y: 3.6, w: 2.7, h: 0.8, align: "center", valign: "top", margin: 0 });
  s.addText(bullets(items, { paraSpaceAfter: 14 }), { x: 3.7, y: 1.5, w: 5.8, h: 2.9, fontSize: 15, color: TXT, valign: "middle", margin: 0 });
  if (foot) strip(s, "", foot, 4.55, 0.5, true);
  s.addNotes(notes);
  return s;
}
// Ponto com rótulo a negrito (ex.: "O que é: ...")
const lab = (l, t) => [{ text: l + ": ", options: { bold: true, color: ACCENT } }, { text: t }];
// Diapositivo de vantagens e desvantagens de uma tecnologia
function prosConsSlide({ title, pros, cons, foot, notes }) {
  const s = newSlide(title);
  [[0.5, "Vantagens", "✔", GOOD, pros], [5.1, "Desvantagens", "✖", BAD, cons]].forEach(([x, h, ic, col, items]) => {
    s.addText([{ text: ic + "  ", options: { color: col } }, { text: h, options: { color: NAVY } }], { x, y: 1.3, w: 4.4, h: 0.45, fontSize: 18, bold: true, margin: 0 });
    s.addShape(pres.shapes.LINE, { x, y: 1.8, w: 4.4, h: 0, line: { color: col, width: 2 } });
    s.addText(bullets(items, { paraSpaceAfter: 12 }), { x, y: 2.0, w: 4.4, h: 2.4, fontSize: 14, color: TXT, valign: "top", margin: 0 });
  });
  if (foot) strip(s, "", foot);
  s.addNotes(notes);
  return s;
}
// Captura real, ajustada à caixa sem deformar, com legenda
function shot(s, file, x, y, w, h, caption) {
  const [iw, ih] = IMG_SIZES[file];
  const ch = caption ? 0.28 : 0;
  const k = Math.min(w / iw, (h - ch) / ih), dw = iw * k, dh = ih * k;
  const ix = x + (w - dw) / 2, iy = y + (h - ch - dh) / 2;
  s.addShape(pres.shapes.RECTANGLE, { x: ix - 0.02, y: iy - 0.02, w: dw + 0.04, h: dh + 0.04, fill: { color: WHITE }, line: { color: BORDER, width: 1 } });
  s.addImage({ path: path.join(IMG_DIR, file), x: ix, y: iy, w: dw, h: dh, altText: caption || file });
  if (caption) s.addText(caption, { x, y: y + h - ch + 0.04, w, h: ch - 0.04, fontSize: 10, italic: true, color: GREY, align: "center", margin: 0 });
}
// Diagrama de sequência do login (todos os participantes; só as mensagens indicadas)
function loginSeq(s, msgs) {
  const parts = ["Utilizador", "PAM", "SSSD / Winbind", "DNS", "KDC (Kerberos)", "LDAP", "SMB · SRII"];
  const x0 = 0.5, W = 9.0, n = parts.length, colW = W / n, cx = parts.map((_, i) => x0 + colW * (i + 0.5));
  const gy = 1.0, py = 1.26, ph = 0.42, bottom = 5.05, bw = colW - 0.1;
  const grp = (a, b, label, fill, color) => {
    const xa = cx[a] - bw / 2 - 0.02, xb = cx[b] + bw / 2 + 0.02;
    s.addShape(pres.shapes.RECTANGLE, { x: xa, y: gy, w: xb - xa, h: 0.22, fill: { color: fill }, line: { color: fill } });
    s.addText(label, { x: xa, y: gy, w: xb - xa, h: 0.22, fontSize: 9.5, bold: true, color, align: "center", valign: "middle", margin: 0 });
  };
  grp(1, 2, "Cliente Ubuntu (ubuclient)", ICE2, NAVY);
  grp(3, 6, "Windows Server SR2-SRV – isec.local", NAVY, WHITE);
  parts.forEach((p, i) => {
    vline(s, cx[i], py + ph, bottom, { dash: true });
    card(s, cx[i] - bw / 2, py, bw, ph, i === 0 ? ORANGE : i <= 2 ? WHITE : ICE2);
    s.addText(p, { x: cx[i] - bw / 2, y: py, w: bw, h: ph, fontSize: 10, bold: true, color: i === 0 ? WHITE : NAVY, align: "center", valign: "middle", margin: 0 });
  });
  const y1 = py + ph + 0.15, rowH = (bottom - y1) / msgs.length;
  msgs.forEach(([f, t, label, ret], i) => {
    const y = y1 + rowH * (i + 0.65);
    if (f === t) {
      const nw = colW * 2.4, nx = cx[f] - 0.1, nh = 0.36;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: nx, y: y - nh + 0.08, w: nw, h: nh, rectRadius: 0.04, fill: { color: NOTE }, line: { color: AMBER, width: 0.75 } });
      s.addText(label, { x: nx + 0.05, y: y - nh + 0.08, w: nw - 0.1, h: nh, fontSize: 11, color: TXT, align: "center", valign: "middle", margin: 0 });
      return;
    }
    const x1 = Math.min(cx[f], cx[t]), x2 = Math.max(cx[f], cx[t]);
    const krb = t === 4 || f === 4;
    hline(s, x1, x2, y, { color: ret ? GREY : krb ? ORANGE : NAVY, width: 1.5, dash: !!ret, end: cx[t] > cx[f], start: cx[t] < cx[f] });
    const lw = label.length * 0.075 + 0.16, lx = Math.min(Math.max((x1 + x2) / 2 - lw / 2, x0), x0 + W - lw);
    s.addText(label, { x: lx, y: y - 0.27, w: lw, h: 0.23, fontSize: 11, color: ret ? GREY : TXT, fill: { color: WHITE }, align: "center", valign: "middle", margin: 0 });
  });
}


// =====================================================================
// 1. CAPA
// =====================================================================
{
  const s = pres.addSlide({ masterName: "CAPA" });
  s.addShape(pres.shapes.OVAL, { x: 6.7, y: -1.4, w: 4.8, h: 4.8, fill: { color: SKY }, line: { color: SKY } });
  logo(s, 7.35, 0.55, 1.15, "windows-server");
  logo(s, 7.1, 3.3, 0.95, "ubuntu");
  logo(s, 8.35, 2.6, 0.95, "samba");
  s.addShape(pres.shapes.LINE, { x: 7.6, y: 1.72, w: 0, h: 1.56, line: { color: RULE, width: 1.25, dashType: "dash" } });
  s.addShape(pres.shapes.LINE, { x: 8.05, y: 3.25, w: 0.32, h: 0.25, flipV: true, line: { color: RULE, width: 1.25, dashType: "dash" } });
  s.addText("WORKSHOP · GRUPO 10", { x: 0.5, y: 0.45, w: 6, h: 0.35, fontSize: 13, bold: true, color: ORANGE, charSpacing: 2, margin: 0 });
  s.addText("Integração de clientes Linux num domínio Windows AD DS", { x: 0.5, y: 0.85, w: 6.2, h: 1.3, fontSize: 30, bold: true, color: NAVY, valign: "top", margin: 0 });
  s.addText("AD DS – Active Directory Domain Services", { x: 0.5, y: 2.2, w: 6.2, h: 0.3, fontSize: 13, italic: true, color: GREY, margin: 0 });
  s.addShape(pres.shapes.LINE, { x: 0.5, y: 2.7, w: 1.2, h: 0, line: { color: ORANGE, width: 3 } });
  s.addText([
    { text: "Orlando Santos", options: { bold: true } }, { text: "  –  a23134097@isec.pt", options: { color: GREY, breakLine: true } },
    { text: "Pedro Ferreira", options: { bold: true } }, { text: "  –  a2019141292@isec.pt", options: { color: GREY, breakLine: true } },
    { text: "Renalto Baticã", options: { bold: true } }, { text: "  –  a2022115534@isec.pt", options: { color: GREY } },
  ], { x: 0.5, y: 2.85, w: 6.2, h: 0.95, fontSize: 14, color: TXT, margin: 0, paraSpaceAfter: 3 });
  s.addText([
    { text: "Unidade curricular: ", options: { bold: true, color: NAVY } }, { text: "Serviços de Rede II (SR2)", options: { breakLine: true } },
    { text: "Docente: ", options: { bold: true, color: NAVY } }, { text: "[Nome do docente]", options: { breakLine: true } },
    { text: `Instituto Superior de Engenharia de Coimbra (ISEC) · Ano letivo ${ANO}` },
  ], { x: 0.5, y: 3.95, w: 6.5, h: 0.85, fontSize: 11.5, color: GREY, margin: 0, paraSpaceAfter: 2 });
  s.addNotes(`[Apresenta: ${A1}]
Bom dia a todos. Somos o Grupo 10: o Orlando Santos, o Pedro Ferreira e o Renalto Baticã, da unidade curricular de Serviços de Rede II.
O tema do nosso workshop é a integração de clientes Linux num domínio Windows gerido pelo Active Directory Domain Services, que a partir de agora abreviamos como AD DS.
Antes de passarmos à parte prática, vamos explicar os conceitos base: porque é que o AD DS existe, como se organiza e que tecnologias permitem a um computador Linux usar as mesmas contas que um computador Windows.
[Nota: preencher o nome do docente.]`);
}

// =====================================================================
// 2. SUMÁRIO
// =====================================================================
{
  const s = newSlide("Sumário");
  const items = [
    ["01", "Antes e depois do AD DS", "Gestão servidor a servidor, fragilidades e benefícios"],
    ["02", "O AD DS por dentro", "Arquitetura, níveis de privilégio e o exemplo do ISEC"],
    ["03", "Ligar o Linux ao servidor", "Normas, cenários, System Security Services Daemon (SSSD) e Winbind"],
    ["04", "Os mecanismos", "Pluggable Authentication Modules (PAM), Kerberos, Chrony, Samba e adsys"],
    ["05", "Do conceito ao laboratório", "Arquitetura, login passo a passo, permissões e testes"],
    ["06", "Melhorias futuras", "Autenticação multifator (MFA), authd, Entra ID e FreeIPA"],
    ["07", "Conclusão e hands-on", "Síntese e passagem à prática"],
  ];
  const w = 4.35, h = 0.9, gx = 0.3, gy = 0.13, y0 = 1.15;
  items.forEach(([n, t, d], i) => {
    const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4;
    const x = 0.5 + col * (w + gx), y = y0 + row * (h + gy);
    const last = i === items.length - 1;
    card(s, x, y, w, h, last ? NAVY : WHITE);
    s.addText(n, { x: x + 0.15, y, w: 0.65, h, fontSize: 24, bold: true, color: last ? AMBER : ORANGE, valign: "middle", margin: 0 });
    s.addText([{ text: t, options: { bold: true, fontSize: 14, color: last ? WHITE : NAVY, breakLine: true } }, { text: d, options: { fontSize: 10.5, color: last ? LIGHT : GREY } }],
      { x: x + 0.85, y, w: w - 1.0, h, valign: "middle", margin: 0 });
  });
  s.addNotes(`[Apresenta: ${A1}]
Este é o percurso da apresentação. Eu começo pelo problema da gestão máquina a máquina e pelo que o AD DS mudou, e mostro como o AD DS se organiza por dentro, com um exemplo do próprio ISEC.
O Pedro mostra como o Linux se liga ao servidor: as normas, os cenários e os dois "tradutores", o SSSD, System Security Services Daemon, e o Winbind. Depois apresenta os mecanismos do lado Linux: o PAM, Pluggable Authentication Modules, o Kerberos, que é a peça central da autenticação, e o Chrony.
O Renalto apresenta o Samba, o adsys e a autenticação de dois fatores, leva tudo para o laboratório com um login passo a passo, e faz a conclusão antes de passarmos à prática.`);
}

// =====================================================================
// 3. ANTES: CADA SERVIDOR POR SI (EXEMPLO DE DATACENTER)
// =====================================================================
{
  const s = newSlide("Antes: cada servidor por si");
  const LV = { total: [NAVY, WHITE, "total"], medio: [ACCENT, WHITE, "médio"], ping: [ICE2, NAVY, "só ping"] };
  const srv = [
    ["SRV-WEB", [["admin", "total"], ["tecnico", "medio"], ["monitor", "ping"]]],
    ["SRV-BD", [["admin", "total"], ["tecnico", "total", 1], ["monitor", "ping"]]],
    ["SRV-FICH", [["admin", "total"], ["ex-admin", "total", 1], ["monitor", "medio", 1]]],
    ["SRV-BACKUP", [["admin2", "total"], ["tecnico", "medio"], ["monitor", "?", 1]]],
  ];
  srv.forEach(([n, users], i) => {
    const x = 0.5 + i * 2.32, y = 1.3, w = 2.12, h = 2.75;
    card(s, x, y, w, h, WHITE);
    s.addShape(pres.shapes.RECTANGLE, { x: x + 0.15, y: y + 0.15, w: w - 0.3, h: 0.45, fill: { color: NAVY }, line: { color: NAVY } });
    s.addText(n, { x: x + 0.15, y: y + 0.15, w: w - 0.3, h: 0.45, fontSize: 13, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    s.addText("contas locais", { x, y: y + 0.68, w, h: 0.25, fontSize: 10, italic: true, color: GREY, align: "center", margin: 0 });
    users.forEach(([u, lv, bad], j) => {
      const yy = y + 1.05 + j * 0.53;
      s.addText(u, { x: x + 0.15, y: yy, w: 0.95, h: 0.4, fontSize: 11, fontFace: "Courier New", color: bad ? BAD : TXT, bold: !!bad, valign: "middle", margin: 0 });
      const [f, c, t] = LV[lv] || [WHITE, BAD, "???"];
      card(s, x + 1.1, yy + 0.04, 0.87, 0.32, f, lv in LV ? undefined : { color: BAD, width: 1 });
      s.addText(t, { x: x + 1.1, y: yy + 0.04, w: 0.87, h: 0.32, fontSize: 9.5, bold: true, color: c, align: "center", valign: "middle", margin: 0 });
    });
  });
  s.addText([{ text: "total", options: { bold: true, color: NAVY } }, { text: " administrador     " }, { text: "médio", options: { bold: true, color: ACCENT } }, { text: " técnico: reinicia serviços, lê logs     " }, { text: "só ping", options: { bold: true, color: GREY } }, { text: " monitorização: só consulta" }],
    { x: 0.5, y: 4.2, w: 9.0, h: 0.3, fontSize: 11, color: TXT, align: "center", margin: 0 });
  strip(s, "", "em vermelho: privilégios errados e contas que já deviam ter sido apagadas.", 4.55, 0.5);
}
// =====================================================================
// 4. AS FRAGILIDADES
// =====================================================================
{
  const s = newSlide("As fragilidades deste modelo");
  const fr = [
    ["Passwords repetidas", "diferentes em cada servidor, fracas ou escritas em papel"],
    ["Contas esquecidas", "quem saiu continua a conseguir entrar"],
    ["Privilégios inconsistentes", "o mesmo técnico com acessos diferentes em cada servidor"],
    ["Sem controlo central", "sem registo de acessos nem cópias de segurança"],
  ];
  fr.forEach(([h, d], i) => {
    const x = 0.5 + (i % 2) * 4.6, y = 1.35 + Math.floor(i / 2) * 1.55;
    card(s, x, y, 4.4, 1.38, WHITE);
    badge(s, x + 0.25, y + 0.42, 0.55, "!", BAD, WHITE, 20);
    s.addText([{ text: h, options: { bold: true, color: NAVY, fontSize: 16, breakLine: true } }, { text: d, options: { color: TXT, fontSize: 12.5 } }],
      { x: x + 1.0, y, w: 3.25, h: 1.38, valign: "middle", margin: 0 });
  });
  strip(s, "", "mais servidores = mais trabalho, mais erros e mais risco.");
  s.addNotes(`[Apresenta: ${A1}]
Este modelo tem quatro fragilidades principais. As passwords acabam diferentes em cada computador, fracas ou escritas em papel. As contas de quem sai ficam esquecidas e ativas. As permissões são diferentes de máquina para máquina. E não há controlo central: não se sabe quem acedeu a quê e os ficheiros ficam nos discos locais, sem cópias de segurança.
Com dez computadores isto já é difícil; com as centenas de computadores de uma instituição como o ISEC, é impossível.`);
}

// =====================================================================
// 5. O QUE É O AD DS
// =====================================================================
whatSlide({
  title: "O que é o AD DS",
  logoKey: "windows-server", name: "AD DS", full: "Active Directory Domain Services",
  items: [
    "Serviço de diretório do Windows Server: guarda num só sítio utilizadores, grupos, computadores e regras",
    "Autentica quem entra na rede; o servidor que o executa é o Domain Controller (DC)",
    "Lançado com o Windows 2000 Server; chama-se AD DS desde o Windows Server 2008",
  ],
  notes: `[Apresenta: ${A1}]
A resposta a este problema é o Active Directory Domain Services, o AD DS. É o serviço de diretório do Windows Server: uma base de dados central que guarda os utilizadores, os grupos, os computadores e as regras, e que autentica quem entra na rede. O servidor que o executa chama-se Domain Controller, ou DC.
Foi lançado com o Windows 2000 Server e, desde o Windows Server 2008, chama-se AD DS.`,
});

// =====================================================================
// 6. ANTES VS COM AD DS
// =====================================================================
{
  const s = newSlide("Porque gere melhor: antes e depois");
  table(s, ["", "Antes (servidor a servidor)", "Com AD DS"], [
    ["Contas", "uma por servidor", "uma por pessoa, válida em todos"],
    ["Passwords", "diferentes e sem regras", "uma só, com política de segurança"],
    ["Saída de alguém", "percorrer todos os servidores", "desativar uma vez, no DC"],
    ["Políticas", "configuração manual", "Group Policy Objects (GPO) automáticas"],
  ], { x: 0.5, y: 1.35, w: 9.0, colW: [2.0, 3.2, 3.8], rowH: 0.58, fs: 13, headFill: [NAVY, BAD, GOOD] });
  strip(s, "", "menos trabalho, menos erros, mais segurança e Single Sign-On (SSO).");
  s.addNotes(`[Apresenta: ${A1}]
Porque é que gere melhor? Antes havia uma conta por máquina; com o AD DS há uma conta por pessoa, válida em todas. As passwords passam a ter uma política única. Quando alguém sai, desativa-se uma vez no DC. E as políticas, as Group Policy Objects ou GPO, aplicam-se automaticamente a todos os computadores.
Os benefícios resumem-se a menos trabalho, menos erros, mais segurança e Single Sign-On: autenticamo-nos uma vez e acedemos a vários serviços.`);
}

// =====================================================================
// 7. ARQUITETURA DO AD DS
// =====================================================================
{
  const s = newSlide("Arquitetura do AD DS");
  const nodeBox = (x, y, w, t, sub, dark) => {
    card(s, x, y, w, 0.62, dark ? NAVY : ICE2);
    s.addText([{ text: t, options: { bold: true, fontSize: 13, color: dark ? WHITE : NAVY, breakLine: !!sub } }, ...(sub ? [{ text: sub, options: { fontSize: 10, color: dark ? AMBER : GREY } }] : [])],
      { x, y, w, h: 0.62, align: "center", valign: "middle", margin: 0 });
  };
  nodeBox(1.6, 1.3, 2.2, "Domínio", "isec.local", true);
  vline(s, 2.7, 1.92, 2.15, { color: RULE, width: 1.5 });
  nodeBox(1.2, 2.15, 3.0, "Unidade Organizacional (OU)", "ex.: ISEC / Alunos", false);
  vline(s, 2.7, 2.77, 3.0, { color: RULE, width: 1.5 });
  hline(s, 1.0, 4.4, 3.0, { color: RULE, width: 1.5 });
  [["Utilizadores", 0.5], ["Grupos", 1.95], ["Computadores", 3.4]].forEach(([t, x]) => {
    vline(s, x + 0.65 + (x === 0.5 ? -0.15 : x === 3.4 ? 0.35 : 0.1), 3.0, 3.2, { color: RULE, width: 1.5 });
    nodeBox(x, 3.2, 1.4 + (x === 3.4 ? 0.1 : 0), t, null, false);
  });
  s.addText("O que se pode controlar", { x: 5.4, y: 1.3, w: 4.1, h: 0.4, fontSize: 16, bold: true, color: ORANGE, margin: 0 });
  s.addText(bullets([
    [{ text: "Quem entra ", options: { bold: true, color: NAVY } }, { text: "e em que máquinas" }],
    [{ text: "Ficheiros: ", options: { bold: true, color: NAVY } }, { text: "ler, escrever ou nada, com permissões de partilha e New Technology File System (NTFS)" }],
    [{ text: "Políticas ", options: { bold: true, color: NAVY } }, { text: "aplicadas por GPO" }],
  ], { paraSpaceAfter: 12 }), { x: 5.4, y: 1.85, w: 4.1, h: 2.5, fontSize: 14, color: TXT, valign: "top", margin: 0 });
  s.addNotes(`[Apresenta: ${A1}]
Como se organiza o AD DS por dentro? É uma estrutura em árvore. No topo está o domínio, no nosso caso isec.local. Dentro do domínio criam-se Unidades Organizacionais, ou OU, que são pastas lógicas para arrumar os objetos, por exemplo por departamento. E os objetos são de três tipos principais: utilizadores, grupos e computadores.
Com esta estrutura controla-se quem pode entrar e em que máquinas, a que ficheiros cada um acede e com que direitos, através das permissões da partilha e do sistema de ficheiros NTFS, New Technology File System, e que políticas se aplicam, através das GPO.`);
}

// =====================================================================
// 8. REGRA DE OURO: ACESSO POR GRUPOS
// =====================================================================
{
  const s = newSlide("Regra de ouro: o acesso dá-se a grupos");
  const chain = [["Utilizador", "aluno.teste"], ["Grupo", "Grupo-Alunos"], ["Permissão", "Read"], ["Recurso", "pasta SRII"]];
  const labels = ["é membro de", "recebe", "sobre"];
  const cw = 1.85, cg = 0.53, cy = 2.1;
  chain.forEach(([t, d], i) => {
    const x = 0.5 + i * (cw + cg);
    card(s, x, cy, cw, 1.0, i === 3 ? ORANGE : i === 0 ? WHITE : ICE2);
    s.addText([{ text: t, options: { bold: true, fontSize: 15, color: i === 3 ? WHITE : NAVY, breakLine: true } }, { text: d, options: { fontSize: 11, fontFace: "Courier New", color: i === 3 ? WHITE : GREY } }],
      { x, y: cy, w: cw, h: 1.0, align: "center", valign: "middle", margin: 0 });
    if (i < 3) {
      hline(s, x + cw + 0.04, x + cw + cg - 0.04, cy + 0.5, { color: ORANGE, width: 2, end: true });
      s.addText(labels[i], { x: x + cw - 0.1, y: cy - 0.32, w: cg + 0.2, h: 0.28, fontSize: 10, italic: true, color: GREY, align: "center", margin: 0 });
    }
  });
  strip(s, "", "nunca a pessoas uma a uma: muda-se o grupo, muda o acesso.", 4.0);
  s.addNotes(`[Apresenta: ${A1}]
Daqui sai a regra mais importante do AD DS: o utilizador é membro de um grupo, o grupo recebe uma permissão e essa permissão aplica-se a um recurso, por exemplo uma pasta.
Nunca se dão permissões a pessoas uma a uma. Se o aluno.teste mudar de grupo, muda automaticamente aquilo a que tem acesso, sem tocar em nenhum computador.`);
}

// =====================================================================
// 8b. EXEMPLO: NÍVEIS DE PRIVILÉGIO NO DATACENTER
// =====================================================================
{
  const s = newSlide("Com AD DS: três níveis, definidos uma vez");
  const g = [
    ["DC-Administradores", "total", "instalar, configurar e gerir tudo", NAVY, WHITE, ACCENT2],
    ["DC-Tecnicos", "médio", "reiniciar serviços e ler logs", ACCENT, WHITE, WHITE],
    ["DC-Monitorizacao", "mínimo", "só consulta: ping e estado dos serviços", ICE2, NAVY, GREY],
  ];
  g.forEach(([n, lv, d, f, tc, sc], i) => {
    const x = 0.5 + i * 3.075, w = 2.85;
    card(s, x, 1.35, w, 2.6, f);
    s.addText([{ text: lv.toUpperCase(), options: { fontSize: 11, bold: true, color: sc, charSpacing: 2, breakLine: true } }, { text: n, options: { fontSize: 16, bold: true, color: tc, breakLine: true } }, { text: d, options: { fontSize: 12.5, color: tc } }],
      { x: x + 0.25, y: 1.35, w: w - 0.5, h: 2.6, valign: "middle", margin: 0, paraSpaceAfter: 6 });
  });
  strip(s, "", "um técnico novo entra no grupo e fica com o mesmo acesso em todos os servidores.");
}
// =====================================================================
// 9. EXEMPLO: O ISEC
// =====================================================================
{
  const s = newSlide("Exemplo: o ISEC como um domínio");
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.2, w: 9.0, h: 0.36, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText("isec.local  ·  um utilizador, uma password, em qualquer computador do ISEC", { x: 0.5, y: 1.2, w: 9.0, h: 0.36, fontSize: 12, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
  const disc = [["Serviços de Rede II", "SR2"], ["Sistemas Operativos", "SO"], ["Bases de Dados", "BD"]];
  disc.forEach(([n, ab], i) => {
    const x = 0.5 + i * 3.075, y = 1.75, w = 2.85;
    card(s, x, y, w, 2.45, WHITE);
    s.addText(n, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.4, fontSize: 15, bold: true, color: NAVY, margin: 0 });
    [[`${ab}-Regentes`, "lê e escreve", ORANGE], [`${ab}-Alunos`, "só lê", GREY]].forEach(([g, p, col], j) => {
      const yy = y + 0.75 + j * 0.8;
      card(s, x + 0.2, yy, 1.45, 0.5, j === 0 ? NAVY : ICE2);
      s.addText(g, { x: x + 0.2, y: yy, w: 1.45, h: 0.5, fontSize: 11, bold: true, color: j === 0 ? WHITE : NAVY, align: "center", valign: "middle", margin: 0 });
      s.addText(p, { x: x + 1.75, y: yy, w: 1.0, h: 0.5, fontSize: 12, bold: true, color: col, valign: "middle", margin: 0 });
    });
  });
  strip(s, "", "a Ana, inscrita em SR2 e BD, entra em dois grupos: duas pastas, a mesma password.");
  s.addNotes(`[Apresenta: ${A1}]
Para tornar isto concreto, imaginemos o próprio ISEC como um domínio, isec.local. Cada aluno e cada docente tem uma única conta, que funciona em qualquer computador da escola.
Cada disciplina tem uma pasta partilhada no servidor. Para cada disciplina criam-se dois grupos: o dos regentes, que pode ler e escrever, para publicar enunciados e notas, e o dos alunos, que só pode ler. Todos autenticam com a mesma conta institucional.
Se a Ana estiver inscrita em Serviços de Rede II e em Bases de Dados, basta pô-la nos grupos SR2-Alunos e BD-Alunos: passa a ler as duas pastas, com a mesma password. No fim do semestre, retira-se dos grupos e perde o acesso.
É o que fazemos no laboratório, numa escala menor: o Grupo-Alunos só lê a partilha SRII e o Grupo-Professores lê e escreve.`);
}

// =====================================================================
// 7. VISÃO GERAL DAS TECNOLOGIAS
// =====================================================================
{
  const s = newSlide("Visão geral das tecnologias");
  const techs = [
    ["windows-server", null, "AD DS", "diretório central"], [null, "DNS", "DNS", "encontrar o servidor"], [null, "KRB", "Kerberos", "autenticação"],
    [null, "NTP", "Chrony", "relógios certos"], ["samba", null, "Samba", "falar com o Windows"],
    [null, "SSSD", "SSSD", "tradutor moderno"], [null, "WB", "Winbind", "tradutor clássico"], ["linux", null, "PAM", "a porta do login"],
    ["ubuntu", null, "adsys", "políticas no Ubuntu"], [null, "MFA", "MFA", "melhoria futura"],
  ];
  const w = 1.68, h = 1.5, g = 0.15;
  techs.forEach(([k, ab, n, d], i) => {
    const col = i % 5, row = Math.floor(i / 5);
    const x = 0.5 + col * (w + g), y = 1.35 + row * (h + 0.25);
    card(s, x, y, w, h, WHITE);
    if (k) logo(s, x + (w - 0.6) / 2, y + 0.15, 0.6, k); else badge(s, x + (w - 0.6) / 2, y + 0.15, 0.6, ab, i < 3 ? NAVY : ORANGE, WHITE, ab.length > 3 ? 11 : 13);
    s.addText([{ text: n, options: { bold: true, color: NAVY, fontSize: 13, breakLine: true } }, { text: d, options: { color: GREY, fontSize: 10.5 } }],
      { x: x + 0.08, y: y + 0.85, w: w - 0.16, h: 0.6, align: "center", valign: "top", margin: 0 });
  });
  s.addNotes(`[Apresenta: ${A1}]
Este é o mapa geral das tecnologias. O Windows Server com o AD DS é o diretório central. O DNS permite encontrar o servidor. O Kerberos é o protocolo de autenticação do AD e depende do Chrony, que sincroniza os relógios pelo NTP, o Network Time Protocol. O Samba permite ao Linux falar a linguagem do Windows.
Do lado Linux há dois tradutores: o SSSD, System Security Services Daemon, e o Winbind, que faz parte do Samba. Ambos se ligam ao PAM, Pluggable Authentication Modules, a porta do login. O adsys aplica as políticas do AD ao Ubuntu e o 2FA, autenticação de dois fatores, acrescenta um segundo fator ao login.`);
}

// =====================================================================
// 8. O DOMÍNIO EXPLICADO: BATER À PORTA
// =====================================================================
{
  const s = newSlide("O domínio explicado: bater à porta");
  const items = [
    ["LOG", "Login", "bater à porta: «sou o aluno.teste, deixa-me entrar»"],
    ["PAM", "PAM", "a porta: decide o que pergunta antes de abrir"],
    ["WB", "SSSD / Winbind", "quem atende e vai confirmar a senha"],
    ["AD", "AD DS", "a central: conhece todos e as suas senhas"],
    ["DNS", "DNS", "a morada: diz onde fica a central"],
    ["KRB", "Kerberos", "o passe: dás a senha uma vez só"],
    ["NTP", "Chrony", "o relógio: um passe fora de horas não abre"],
    ["SMB", "Samba", "o intérprete entre o Linux e o Windows"],
    ["GPO", "adsys", "as regras afixadas em todas as portas"],
    ["MFA", "MFA", "no futuro: senha + código do telemóvel"],
  ];
  items.forEach(([ab, n, d], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.5 + col * 4.6, y = 1.3 + row * 0.7;
    badge(s, x, y + 0.04, 0.48, ab, i === 0 ? ORANGE : NAVY, WHITE, ab.length > 3 ? 9 : 11);
    s.addText([{ text: n + "  ", options: { bold: true, color: NAVY } }, { text: d, options: { color: TXT } }],
      { x: x + 0.62, y, w: 3.8, h: 0.56, fontSize: 12.5, valign: "middle", margin: 0 });
    if (row < 4) s.addShape(pres.shapes.LINE, { x: x + 0.62, y: y + 0.63, w: 3.75, h: 0, line: { color: BORDER, width: 0.75 } });
  });
  s.addNotes(`[Apresenta: ${A1}]
Antes de entrar no detalhe técnico, uma analogia para quem não é da área: fazer login é como bater a uma porta.
Quando escrevemos o nome e a password, estamos a bater à porta e a dizer quem somos. A porta é o PAM: decide que perguntas faz antes de abrir. Quem atende é o SSSD ou o Winbind: não sabe as senhas de cor, por isso vai confirmar à central.
A central é o AD DS, que conhece todos os utilizadores e as suas senhas. Para lá chegar é preciso saber a morada, e é isso que o DNS dá. Quando a senha está certa, a central entrega um passe temporário, o bilhete Kerberos, que abre as outras portas sem voltar a pedir a senha. Esse passe tem hora de validade, por isso os relógios têm de estar acertados, que é o trabalho do Chrony.
O Samba é o intérprete entre o Linux e o Windows. O adsys afixa as regras da central em todas as portas. E o 2FA pede a senha e ainda um código do telemóvel.
Vamos voltar a esta porta ao longo da apresentação.`);
}


// =====================================================================
// 12. AS NORMAS QUE O SERVIDOR FALA
// =====================================================================
{
  const s = newSlide("Como o Linux fala com o servidor");
  card(s, 0.5, 1.35, 2.3, 3.0, NAVY);
  logo(s, 1.15, 1.55, 1.0, "windows-server");
  s.addText([{ text: "SR2-SRV", options: { bold: true, fontSize: 15, color: WHITE, breakLine: true } }, { text: "AD DS", options: { fontSize: 12, color: AMBER } }],
    { x: 0.5, y: 2.8, w: 2.3, h: 0.8, align: "center", valign: "middle", margin: 0 });
  card(s, 7.2, 1.35, 2.3, 3.0, ICE2);
  logo(s, 7.85, 1.55, 1.0, "ubuntu");
  s.addText([{ text: "Cliente Linux", options: { bold: true, fontSize: 15, color: NAVY, breakLine: true } }, { text: "precisa de um tradutor", options: { fontSize: 12, color: ORANGE } }],
    { x: 7.2, y: 2.8, w: 2.3, h: 0.8, align: "center", valign: "middle", margin: 0 });
  const P = [["DNS · 53", "Domain Name System: encontrar o servidor"], ["Kerberos · 88", "provar a identidade"], ["LDAP · 389", "Lightweight Directory Access Protocol: ler contas"], ["SMB · 445", "Server Message Block: ficheiros"], ["NTP · 123", "Network Time Protocol: acertar a hora"]];
  P.forEach(([p, d], i) => {
    const y = 1.38 + i * 0.6;
    hline(s, 2.9, 7.1, y + 0.45, { color: i === 1 ? ORANGE : NAVY, width: 1.5, start: true, end: true });
    s.addText([{ text: p, options: { bold: true, color: i === 1 ? ORANGE : NAVY, fontSize: 12.5, breakLine: true } }, { text: d, options: { color: GREY, fontSize: 9.5 } }],
      { x: 2.9, y, w: 4.2, h: 0.42, align: "center", valign: "bottom", margin: 0 });
  });
  strip(s, "", "normas abertas: qualquer sistema que as fale pode juntar-se ao domínio.");
  s.addNotes(`[Apresenta: ${A1}]
Como é que uma máquina que não é Windows consegue usar este domínio? O AD DS não é uma caixa fechada: comunica através de normas abertas, cada uma numa porta conhecida.
O DNS, Domain Name System, na porta 53, permite encontrar o servidor. O Kerberos, na porta 88, trata da autenticação. O LDAP, Lightweight Directory Access Protocol, na porta 389, permite ler os utilizadores e os grupos. O SMB, Server Message Block, na porta 445, serve para os ficheiros e para juntar a máquina ao domínio. E o NTP, Network Time Protocol, na porta 123, mantém os relógios acertados.
O Linux sozinho só conhece as contas locais; precisa de um tradutor que fale estas normas em seu nome.`);
}

// =====================================================================
// 13. CENÁRIOS
// =====================================================================
{
  const s = newSlide("Cenários: cada máquina, o seu tradutor");
  const sc = [
    ["ubuntu", "Ubuntu / Debian", "posto de trabalho", "SSSD + Samba"],
    ["linux", "Fedora / Red Hat", "posto ou servidor", "SSSD nativo"],
    ["samba", "Servidor de ficheiros", "Linux que partilha pastas", "Samba + Winbind"],
    ["ubuntu", "Ubuntu com políticas", "gerido a partir do AD", "SSSD + adsys"],
  ];
  sc.forEach(([k, t, d, tr], i) => {
    const x = 0.5 + i * 2.3, w = 2.1;
    card(s, x, 1.35, w, 2.9, WHITE);
    logo(s, x + (w - 0.9) / 2, 1.55, 0.9, k);
    s.addText([{ text: t, options: { bold: true, fontSize: 14, color: NAVY, breakLine: true } }, { text: d, options: { fontSize: 11, color: GREY } }],
      { x: x + 0.1, y: 2.6, w: w - 0.2, h: 0.75, align: "center", valign: "top", margin: 0 });
    card(s, x + 0.15, 3.5, w - 0.3, 0.5, i === 2 ? NAVY : ORANGE);
    s.addText(tr, { x: x + 0.15, y: 3.5, w: w - 0.3, h: 0.5, fontSize: 11.5, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
  });
  strip(s, "", "o servidor fala sempre as mesmas normas; no Linux muda só o tradutor.");
  s.addNotes(`[Apresenta: ${A1}]
Imaginemos diferentes cenários. Um posto de trabalho Ubuntu ou Debian usa o SSSD, ou o Winbind, para fazer login com a conta do AD. Um Fedora ou um Red Hat Enterprise Linux usa o SSSD, que já vem de origem. Um Linux que serve ficheiros usa o Samba com o Winbind. E um Ubuntu que deve receber políticas usa o SSSD com o adsys.
A ideia principal: o servidor fala sempre as mesmas normas; o que muda é o tradutor que instalamos no Linux. Os dois principais são o SSSD e o Winbind.
Passo agora a palavra ao Pedro, que vai explicar cada um deles.`);
}

// =====================================================================
// 14–16. SSSD
// =====================================================================
{
  const s = newSlide("Antes de mais: o que é um daemon?");
  card(s, 0.5, 1.35, 4.2, 2.9, NAVY);
  s.addText([
    { text: "daemon", options: { bold: true, fontSize: 30, color: ACCENT2, fontFace: "Courier New", breakLine: true } },
    { text: "Programa que corre sempre em segundo plano, sem janela, à espera de pedidos.", options: { fontSize: 15, color: WHITE, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "É o equivalente Linux a um serviço do Windows.", options: { fontSize: 13, color: LIGHT } },
  ], { x: 0.8, y: 1.35, w: 3.6, h: 2.9, valign: "middle", margin: 0 });
  const ex = [["sshd", "aceita ligações SSH"], ["chronyd", "acerta a hora"], ["sssd", "contas do AD (SSSD)"], ["winbindd", "contas do AD (Winbind)"], ["smbd", "partilhas de ficheiros (Samba)"]];
  ex.forEach(([n, d], i) => {
    const y = 1.4 + i * 0.57;
    s.addText(n, { x: 5.1, y, w: 1.5, h: 0.45, fontSize: 15, bold: true, fontFace: "Courier New", color: ACCENT, valign: "middle", margin: 0 });
    s.addText(d, { x: 6.65, y, w: 2.85, h: 0.45, fontSize: 14, color: TXT, valign: "middle", margin: 0 });
    if (i < ex.length - 1) s.addShape(pres.shapes.LINE, { x: 5.1, y: y + 0.51, w: 4.4, h: 0, line: { color: BORDER, width: 0.75 } });
  });
  strip(s, "", "o «d» no fim do nome vem de daemon: sssd, winbindd, smbd, chronyd…");
  s.addNotes(`[Apresenta: ${A2}]
Obrigado, Orlando. Antes de falar do SSSD, um termo que vai aparecer muitas vezes: daemon. Um daemon é um programa que corre sempre em segundo plano, sem janela, à espera de pedidos. É o equivalente Linux a um serviço do Windows.
Por convenção, o nome acaba em "d": o sshd aceita ligações SSH, o chronyd acerta a hora, o sssd e o winbindd tratam das contas do AD e o smbd das partilhas do Samba.`);
}
{
  const s = newSlide("Duas peças do Linux: NSS e PAM");
  [["NSS", "Name Service Switch", "«Este utilizador existe?»", "Diz ao Linux onde procurar utilizadores e grupos: ficheiros locais ou o AD", "getent passwd aluno.teste", NAVY],
   ["PAM", "Pluggable Authentication Modules", "«A password está certa? Pode entrar?»", "Decide como se valida quem faz login (detalhe mais à frente)", "/etc/pam.d/", ACCENT]].forEach(([ab, full, q, d, cmd, col], i) => {
    const x = 0.5 + i * 4.6, w = 4.4;
    card(s, x, 1.3, w, 3.0, WHITE);
    badge(s, x + 0.25, 1.5, 0.85, ab, col, WHITE, 16);
    s.addText([{ text: ab, options: { bold: true, fontSize: 18, color: NAVY, breakLine: true } }, { text: full, options: { fontSize: 12, color: GREY } }],
      { x: x + 1.3, y: 1.5, w: w - 1.45, h: 0.85, valign: "middle", margin: 0 });
    s.addText(q, { x: x + 0.25, y: 2.55, w: w - 0.5, h: 0.45, fontSize: 15, bold: true, color: col, margin: 0 });
    s.addText(d, { x: x + 0.25, y: 3.0, w: w - 0.5, h: 0.75, fontSize: 13, color: TXT, valign: "top", margin: 0 });
    s.addText(cmd, { x: x + 0.25, y: 3.8, w: w - 0.5, h: 0.35, fontSize: 11, fontFace: "Courier New", color: GREY, margin: 0 });
  });
  strip(s, "", "o SSSD e o Winbind ligam-se a estas duas peças para trazer o AD para o Linux.", 4.5, 0.5);
  s.addNotes(`[Apresenta: ${A2}]
Antes do SSSD, duas peças do Linux que ele usa. O NSS, Name Service Switch, responde à pergunta "este utilizador existe?": diz ao Linux onde procurar utilizadores e grupos, nos ficheiros locais ou no AD. É o que o comando getent consulta.
O PAM, Pluggable Authentication Modules, responde a "a password está certa? pode entrar?": decide como se valida quem faz login. Vamos vê-lo em detalhe mais à frente.
O SSSD e o Winbind ligam-se a estas duas peças para trazer as contas do AD para o Linux.`);
}
whatSlide({
  title: "SSSD: o que é",
  badgeTxt: "SSSD", name: "SSSD", full: "System Security Services Daemon",
  items: [
    lab("O que é", "um daemon (serviço) de segurança do Linux, sempre ativo em segundo plano"),
    lab("Função", "responde a «quem é este utilizador?» e «a password está certa?» perguntando ao AD DS"),
    lab("Objetivo", "entrar no Linux com a conta do domínio, sem criar contas locais"),
  ],
  foot: "/etc/sssd/sssd.conf · realm join isec.local · cliente ubuclient",
  notes: `[Apresenta: ${A2}]
SSSD significa System Security Services Daemon, ou seja, o daemon dos serviços de segurança do sistema.
O que é: um daemon do Linux, sempre ativo em segundo plano. Função: sempre que o Linux precisa de saber quem é um utilizador ou se a password está certa, o SSSD pergunta ao AD DS e devolve a resposta. Objetivo: permitir entrar no Linux com a conta do domínio, sem criar contas locais.
Junta-se ao domínio com o comando realm join, a configuração fica no ficheiro sssd.conf e guarda as credenciais em cache, por isso o login funciona mesmo sem rede. No laboratório usamos o SSSD no cliente ubuclient.`,
});
{
  const s = newSlide("SSSD: como funciona");
  flowRow(s, 0.5, 1.6, 9.0, 1.15, [["login / getent", "pedido do sistema"], ["NSS e PAM", "libnss_sss · pam_sss"], ["sssd", "fornecedor \"ad\""], ["DC", "LDAP + Kerberos"]], { gap: 0.4, fs: 14 });
  const bw = (9.0 - 0.4 * 3) / 4, cx = 0.5 + 2 * (bw + 0.4) + bw / 2;
  s.addShape(pres.shapes.LINE, { x: cx, y: 2.75, w: 0, h: 0.35, line: { color: ORANGE, width: 2, beginArrowType: "triangle", endArrowType: "triangle" } });
  card(s, cx - 1.2, 3.1, 2.4, 0.6, NOTE, { color: AMBER, width: 1 });
  s.addText("cache: contas e credenciais", { x: cx - 1.2, y: 3.1, w: 2.4, h: 0.6, fontSize: 12, color: TXT, align: "center", valign: "middle", margin: 0 });
  strip(s, "", "responde da cache ou pergunta ao DC; converte o SID do Windows em UID/GID.");
  s.addNotes(`[Apresenta: ${A2}]
Como funciona? Quando alguém faz login, ou quando corremos getent, o sistema faz duas perguntas: quem é este utilizador, tratada pelo NSS, o Name Service Switch, e se a password está certa, tratada pelo PAM. Ambas chegam ao sssd através das bibliotecas libnss_sss e pam_sss.
O sssd responde a partir da cache ou, se não tiver a resposta, pergunta ao DC por LDAP e Kerberos. Converte o identificador do Windows, o SID, Security Identifier, num número de utilizador e de grupo do Linux, o UID e o GID, e guarda tudo em cache.`);
}
prosConsSlide({
  title: "SSSD: vantagens e desvantagens",
  pros: ["Junção automática com realm join", "Cache robusta e login sem rede", "Recomendado pela Canonical; suporta o adsys"],
  cons: ["Precisa do Samba para aceder às partilhas", "Menos controlo sobre o mapeamento de IDs", "Diagnóstico exige sssctl e logs"],
  notes: `[Apresenta: ${A2}]
O SSSD faz a junção ao domínio quase sozinho, com o realm join, tem uma cache robusta que permite login sem rede e é o recomendado pela Canonical, sendo o único suportado pelo adsys.
Em contrapartida, não partilha pastas SMB sozinho, dá menos controlo sobre o mapeamento de identificadores e o diagnóstico exige conhecer o sssctl e os seus logs.`,
});

// =====================================================================
// 17–19. WINBIND
// =====================================================================
whatSlide({
  title: "Winbind: o que é",
  badgeTxt: "WB", name: "Winbind", full: "daemon winbindd, parte do Samba",
  items: [
    lab("O que é", "o daemon winbindd, uma peça do Samba"),
    lab("Função", "traz os utilizadores e grupos do AD para o Linux e valida as passwords, por Remote Procedure Call (RPC), LDAP e Kerberos"),
    lab("Objetivo", "o mesmo do SSSD, mas integrado com o Samba – ideal quando o Linux também partilha ficheiros"),
  ],
  foot: "/etc/samba/smb.conf · net ads join -U Administrator · cliente UBU-WINBIND",
  notes: `[Apresenta: ${A2}]
O segundo tradutor é o Winbind. O que é: o daemon winbindd, que é uma peça do Samba, por isso a configuração fica no ficheiro do Samba, o smb.conf.
Função: traz os utilizadores e os grupos do AD para o Linux, como se fossem contas locais, e valida as passwords. Fala com o DC por Remote Procedure Call, a forma nativa de comunicação entre máquinas Windows, além de LDAP e Kerberos.
Objetivo: o mesmo do SSSD, mas integrado com o Samba, o que o torna ideal quando o Linux também partilha ficheiros. Junta-se ao domínio com net ads join. No laboratório usamos o Winbind no cliente UBU-WINBIND.`,
});
{
  const s = newSlide("Winbind: como funciona");
  flowRow(s, 0.5, 1.6, 9.0, 1.15, [["login / getent", "pedido do sistema"], ["NSS e PAM", "libnss_winbind · pam_winbind"], ["winbindd", "Samba"], ["DC", "RPC, LDAP, Kerberos"]], { gap: 0.4, fs: 14 });
  const bw = (9.0 - 0.4 * 3) / 4, cx = 0.5 + 2 * (bw + 0.4) + bw / 2;
  s.addShape(pres.shapes.LINE, { x: cx, y: 2.75, w: 0, h: 0.35, line: { color: ORANGE, width: 2, beginArrowType: "triangle", endArrowType: "triangle" } });
  card(s, cx - 1.2, 3.1, 2.4, 0.6, NOTE, { color: AMBER, width: 1 });
  s.addText("idmap: SID ↔ UID/GID", { x: cx - 1.2, y: 3.1, w: 2.4, h: 0.6, fontSize: 12, color: TXT, align: "center", valign: "middle", margin: 0 });
  strip(s, "", "o idmap dá a cada utilizador o mesmo UID em todas as máquinas.");
  s.addNotes(`[Apresenta: ${A2}]
O caminho é parecido com o do SSSD: o sistema pergunta pelo utilizador ou pela password através do NSS e do PAM, desta vez com as bibliotecas libnss_winbind e pam_winbind, e o winbindd fala com o DC.
A peça característica do Winbind é o idmap: traduz o SID do Windows num UID e GID do Linux de forma fixa, por exemplo com o backend rid. Assim, o mesmo utilizador tem o mesmo número em todas as máquinas, o que é importante quando o Linux partilha ficheiros.`);
}
prosConsSlide({
  title: "Winbind: vantagens e desvantagens",
  pros: ["Integração nativa com Samba e partilhas SMB", "idmap rid determinístico e controlável", "Suporta NT LAN Manager (NTLM) e confianças entre domínios"],
  cons: ["Configuração manual: smb.conf, NSS e PAM", "Cache e login sem rede limitados", "Não funciona com o adsys"],
  notes: `[Apresenta: ${A2}]
O Winbind integra-se de forma nativa com o Samba, o que o torna a escolha natural quando o Linux também vai servir ficheiros. O idmap rid é determinístico e controlável, e suporta protocolos antigos como o NTLM, NT LAN Manager, e as relações de confiança entre domínios.
As desvantagens: a configuração é mais manual, a cache e o login sem rede são limitados e não funciona com o adsys.`,
});

// =====================================================================
// 20. QUAL ESCOLHER
// =====================================================================
{
  const s = newSlide("Qual escolher?");
  [["SSSD", null, "Postos de trabalho Ubuntu", "com Samba para as partilhas e adsys para as políticas", ORANGE], ["Winbind", null, "Linux que também partilha ficheiros", "integrado de raiz com o Samba", NAVY]].forEach(([n, k, t, d, col], i) => {
    const x = 0.5 + i * 4.6;
    card(s, x, 1.45, 4.4, 2.6, WHITE);
    if (k) logo(s, x + 0.3, 1.75, 1.0, k); else badge(s, x + 0.3, 1.75, 1.0, n === "Winbind" ? "WB" : n, col, WHITE, 16);
    s.addText(n, { x: x + 1.5, y: 1.75, w: 2.7, h: 1.0, fontSize: 24, bold: true, color: col, valign: "middle", margin: 0 });
    s.addText([{ text: t, options: { bold: true, color: NAVY, fontSize: 16, breakLine: true } }, { text: d, options: { color: GREY, fontSize: 13 } }],
      { x: x + 0.3, y: 2.95, w: 3.9, h: 0.9, valign: "top", margin: 0 });
  });
  strip(s, "", "resolvem o mesmo problema: a escolha depende do papel da máquina.");
  s.addNotes(`[Apresenta: ${A2}]
Em resumo: os dois resolvem o mesmo problema. O SSSD é a escolha para postos de trabalho Ubuntu e para máquinas geridas com o adsys. O Winbind faz sentido quando o Linux também partilha ficheiros com o Samba.`);
}

// =====================================================================
// 13. OS MECANISMOS: O PAPEL DE CADA PEÇA
// =====================================================================
{
  const s = newSlide("Os mecanismos por trás da integração");
  const cols = [
    { badge: "PAM", name: "PAM", role: "A porta", what: "Decide como se valida quem entra no Linux", fill: NAVY },
    { badge: "KRB", name: "Kerberos", role: "O bilhete", what: "Prova a identidade sem enviar a password pela rede", fill: ORANGE },
    { key: "samba", name: "Samba", role: "O intérprete", what: "Traduz os pedidos para a língua do Windows" },
  ];
  const w = 2.85, g = 0.225, y = 1.35, h = 2.2;
  cols.forEach((c, i) => {
    const x = 0.5 + i * (w + g);
    card(s, x, y, w, h, WHITE);
    if (c.key) logo(s, x + 0.2, y + 0.2, 0.7, c.key); else badge(s, x + 0.2, y + 0.2, 0.7, c.badge, c.fill, WHITE, 13);
    s.addText([{ text: c.name, options: { bold: true, fontSize: 16, color: NAVY, breakLine: true } }, { text: c.role, options: { fontSize: 13, color: ORANGE, bold: true } }],
      { x: x + 1.05, y: y + 0.17, w: w - 1.15, h: 0.75, valign: "middle", margin: 0 });
    s.addText(c.what, { x: x + 0.2, y: y + 1.1, w: w - 0.4, h: 0.9, fontSize: 12.5, color: TXT, valign: "top", margin: 0 });
  });
  const chain = ["PAM pede a validação", "SSSD / Winbind pergunta ao DC", "Kerberos confirma a identidade", "Samba abre as partilhas"];
  const cw = 2.0, cg = 0.33;
  chain.forEach((t, i) => {
    const x = 0.5 + i * (cw + cg);
    card(s, x, 3.95, cw, 0.6, i % 2 ? ICE2 : NAVY);
    s.addText(t, { x: x + 0.05, y: 3.95, w: cw - 0.1, h: 0.6, fontSize: 11, bold: true, color: i % 2 ? NAVY : WHITE, align: "center", valign: "middle", margin: 0 });
    if (i < chain.length - 1) hline(s, x + cw + 0.04, x + cw + cg - 0.04, 4.25, { color: ORANGE, width: 2, end: true });
  });
  s.addNotes(`[Apresenta: ${A2}]
Para pôr o SSSD ou o Winbind a funcionar são precisos mecanismos do lado Linux. Antes de os ver em detalhe, o papel de cada um.
O PAM, Pluggable Authentication Modules, é a porta: decide como se valida quem entra. O Kerberos é o bilhete: prova a identidade junto do servidor sem enviar a password pela rede. O Samba é o intérprete: traduz os pedidos do Linux para a língua do Windows.
Em baixo está a ordem em que atuam: o PAM pede a validação, o SSSD ou o Winbind perguntam ao DC, o Kerberos confirma a identidade e o Samba abre as partilhas.`);
}


// =====================================================================
// 22–23. PAM
// =====================================================================
whatSlide({
  title: "PAM: o que é",
  badgeTxt: "PAM", name: "PAM", full: "Pluggable Authentication Modules",
  items: [
    "Camada do Linux que decide como se autentica quem entra (login, gdm, sshd, sudo)",
    "Modular: para autenticar no AD basta acrescentar módulos, sem mudar as aplicações",
    "Trabalha com o Name Service Switch (NSS): o PAM valida, o NSS diz quem existe",
  ],
  foot: "/etc/pam.d/common-auth · common-account · common-password · common-session",
  notes: `[Apresenta: ${A2}]
Para pôr tudo isto a funcionar, o primeiro mecanismo do lado Linux é o PAM, Pluggable Authentication Modules. É a camada que decide como se autentica um utilizador. Programas como o login, o ecrã de entrada gdm, o sshd ou o sudo não verificam passwords sozinhos: pedem ao PAM.
A grande vantagem é ser modular: para passar a autenticar no AD não mudamos nenhuma aplicação, apenas acrescentamos módulos.
O PAM trabalha com o NSS, Name Service Switch: o PAM responde a "provas quem és?" e o NSS responde a "este utilizador existe?". É por isso que o comando getent passwd mostra os utilizadores do domínio.`,
});
{
  const s = newSlide("PAM: a pilha de módulos");
  const rows = [
    ["auth", "quem és? valida a password", "pam_sss · pam_winbind"],
    ["account", "a conta pode entrar agora?", "pam_sss · pam_winbind"],
    ["password", "mudar a password", "pam_sss · pam_winbind"],
    ["session", "preparar a sessão", "pam_mkhomedir · pam_mount"],
  ];
  rows.forEach(([t, d, m], i) => {
    const y = 1.35 + i * 0.75;
    card(s, 0.5, y, 1.7, 0.6, NAVY);
    s.addText(t, { x: 0.5, y, w: 1.7, h: 0.6, fontSize: 15, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    s.addText(d, { x: 2.45, y, w: 3.3, h: 0.6, fontSize: 14, color: TXT, valign: "middle", margin: 0 });
    s.addText(m, { x: 5.8, y, w: 3.7, h: 0.6, fontSize: 12.5, fontFace: "Courier New", color: ORANGE, bold: true, valign: "middle", margin: 0 });
  });
  strip(s, "", "o pam_mkhomedir cria a pasta pessoal e o pam_mount monta a partilha SRII.");
  s.addNotes(`[Apresenta: ${A2}]
O PAM organiza-se numa pilha de módulos, em quatro tipos. O auth valida a identidade. O account verifica se a conta pode entrar naquele momento. O password trata da mudança de password. E o session prepara a sessão.
Para o AD, os módulos pam_sss ou pam_winbind fazem a autenticação no domínio. Na sessão, o pam_mkhomedir cria a pasta pessoal no primeiro login e o pam_mount monta automaticamente a partilha SRII.`);
}

// =====================================================================
// 24–27. KERBEROS
// =====================================================================
whatSlide({
  title: "Kerberos: o que é",
  badgeTxt: "KRB", name: "Kerberos", full: "versão 5 (MIT)",
  items: [
    "Protocolo de autenticação em rede baseado em bilhetes (tickets) e num terceiro de confiança",
    "Terceiro de confiança: o Key Distribution Center (KDC) – no AD DS, todo o DC é um KDC",
    "No projeto: KDC do AD DS no SR2-SRV; nos clientes, o MIT Kerberos (krb5-user), realm ISEC.LOCAL",
  ],
  foot: "/etc/krb5.conf → default_realm = ISEC.LOCAL · kdc = SR2-SRV.isec.local",
  notes: `[Apresenta: ${A2}]
Chegamos à peça mais importante de toda a integração: o Kerberos. É o protocolo de autenticação usado pelo AD DS. Foi criado no MIT, o Massachusetts Institute of Technology, e a versão atual é a 5.
Funciona com bilhetes, os tickets, e com um terceiro de confiança, o Key Distribution Center, ou KDC. No AD DS, todos os controladores de domínio são KDC.
No nosso projeto, o KDC é o próprio SR2-SRV, através do AD DS. Nos clientes Ubuntu usamos o cliente MIT Kerberos, instalado com o pacote krb5-user, e configuramos o realm ISEC.LOCAL no ficheiro krb5.conf, apontando o KDC para o SR2-SRV. Repare-se que o realm Kerberos se escreve em maiúsculas.`,
});
{
  const s = newSlide("Kerberos: para que serve");
  const it = [
    ["A password não viaja", "na rede só circulam bilhetes cifrados"],
    ["Single Sign-On", "autenticar uma vez, aceder a vários serviços"],
    ["Autenticação mútua", "o cliente também confirma que fala com o servidor certo"],
    ["Base de tudo", "SSSD, Winbind, Samba, pam_mount e adsys dependem dele"],
  ];
  it.forEach(([h, d], i) => {
    const x = 0.5 + (i % 2) * 4.6, y = 1.35 + Math.floor(i / 2) * 1.55;
    card(s, x, y, 4.4, 1.38, i === 3 ? NAVY : WHITE);
    s.addText([{ text: h, options: { bold: true, color: i === 3 ? AMBER : NAVY, fontSize: 17, breakLine: true } }, { text: d, options: { color: i === 3 ? WHITE : TXT, fontSize: 13 } }],
      { x: x + 0.3, y, w: 3.9, h: 1.38, valign: "middle", margin: 0 });
  });
  strip(s, "", "sem Kerberos não há login no domínio nem acesso às partilhas.");
  s.addNotes(`[Apresenta: ${A2}]
Para que serve o Kerberos? Primeiro, a password nunca viaja pela rede: só circulam bilhetes cifrados, que expiram ao fim de algumas horas. Segundo, dá Single Sign-On: autenticamo-nos uma vez e o mesmo bilhete abre vários serviços. Terceiro, a autenticação é mútua: o cliente também confirma que está a falar com o servidor verdadeiro.
E, no nosso projeto, é a base de tudo: o SSSD e o Winbind usam-no para validar o login, o Samba e o pam_mount usam-no para aceder à partilha SRII e o adsys usa-o para descarregar as políticas. Sem Kerberos não há login no domínio nem acesso às partilhas.`);
}
{
  const s = newSlide("Kerberos: os bilhetes passo a passo");
  const P = ["Cliente", "KDC (no SR2-SRV)", "Serviço (ex.: SRII)"];
  const xs = [1.6, 5.0, 8.4], top = 1.2, bh = 0.5;
  P.forEach((p, i) => {
    card(s, xs[i] - 0.9, top, 1.8, bh, i === 1 ? NAVY : ICE2);
    s.addText(p, { x: xs[i] - 0.9, y: top, w: 1.8, h: bh, fontSize: 12, bold: true, color: i === 1 ? WHITE : NAVY, align: "center", valign: "middle", margin: 0 });
    vline(s, xs[i], top + bh, 5.0, { dash: true });
  });
  const M = [
    [0, 1, "1. AS-REQ: sou o aluno.teste (prova com a password)", false],
    [1, 0, "2. AS-REP: Ticket Granting Ticket (TGT)", true],
    [0, 1, "3. TGS-REQ: TGT + quero aceder à SRII", false],
    [1, 0, "4. TGS-REP: bilhete de serviço", true],
    [0, 2, "5. AP-REQ: apresenta o bilhete de serviço", false],
    [2, 0, "6. acesso concedido", true],
  ];
  M.forEach(([f, t, l, ret], i) => {
    const y = 2.15 + i * 0.47;
    const x1 = Math.min(xs[f], xs[t]), x2 = Math.max(xs[f], xs[t]);
    hline(s, x1, x2, y, { color: ret ? GREY : ORANGE, width: 1.75, dash: ret, end: xs[t] > xs[f], start: xs[t] < xs[f] });
    const lw = l.length * 0.075 + 0.16;
    s.addText(l, { x: (x1 + x2) / 2 - lw / 2, y: y - 0.29, w: lw, h: 0.25, fontSize: 11.5, color: ret ? GREY : TXT, fill: { color: WHITE }, align: "center", valign: "middle", margin: 0 });
  });
  s.addNotes(`[Apresenta: ${A2}]
Vejamos os bilhetes passo a passo.
Primeiro, o cliente faz um pedido ao serviço de autenticação do KDC, o AS-REQ, protegido com uma chave derivada da password. Se estiver correta, recebe o Ticket Granting Ticket, o TGT, que é o passe geral, válido por algumas horas.
Depois, sempre que quer usar um serviço, por exemplo a partilha SRII, apresenta o TGT ao KDC e recebe um bilhete específico para esse serviço: são o TGS-REQ e o TGS-REP.
Por fim, mostra esse bilhete ao serviço, com o AP-REQ, e entra. A password só foi usada no primeiro passo e nunca atravessou a rede.`);
}
{
  const s = newSlide("Kerberos no projeto");
  s.addText("Requisitos", { x: 0.5, y: 1.3, w: 4.2, h: 0.4, fontSize: 16, bold: true, color: ORANGE, margin: 0 });
  s.addText(bullets([
    [{ text: "DNS: ", options: { bold: true, color: NAVY } }, { text: "o cliente tem de encontrar o KDC (registos SRV)" }],
    [{ text: "Relógios: ", options: { bold: true, color: NAVY } }, { text: "diferença máxima de 5 minutos" }],
    [{ text: "Realm: ", options: { bold: true, color: NAVY } }, { text: "ISEC.LOCAL, sempre em maiúsculas" }],
  ], { paraSpaceAfter: 12 }), { x: 0.5, y: 1.8, w: 4.3, h: 2.5, fontSize: 14, color: TXT, valign: "top", margin: 0 });
  card(s, 5.1, 1.3, 4.4, 3.0, "18181B");
  s.addText([
    { text: "$ kinit aluno.teste@ISEC.LOCAL", options: { color: AMBER, breakLine: true } },
    { text: "Password for aluno.teste@ISEC.LOCAL:", options: { color: LIGHT, breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "$ klist", options: { color: AMBER, breakLine: true } },
    { text: "Default principal: aluno.teste@ISEC.LOCAL", options: { color: LIGHT, breakLine: true } },
    { text: "krbtgt/ISEC.LOCAL@ISEC.LOCAL", options: { color: LIGHT } },
  ], { x: 5.3, y: 1.45, w: 4.1, h: 2.7, fontFace: "Courier New", fontSize: 11, valign: "top", margin: 0 });
  strip(s, "", "capturas Wireshark Kerberos-01 a 06: relógios, login, acesso à SRII, junção e PAM", 4.55, 0.5, true);
  s.addNotes(`[Apresenta: ${A2}]
Para o Kerberos funcionar no projeto há três requisitos. O cliente tem de encontrar o KDC pelo DNS, através dos registos SRV, por isso o DNS dos clientes é o próprio DC. Os relógios não podem diferir mais de cinco minutos. E o realm, ISEC.LOCAL, escreve-se sempre em maiúsculas.
Para testar, usamos o kinit para pedir o bilhete e o klist para o ver: aparece o principal aluno.teste e o bilhete krbtgt do realm ISEC.LOCAL, que é o TGT.
Gravámos também capturas no Wireshark de cada fase: a sincronização dos relógios, o login, o acesso à partilha SRII, a junção ao domínio e o início de sessão pelo PAM. Estão na pasta capturas_wireshark do projeto.`);
}

// =====================================================================
// 16. CHRONY
// =====================================================================
{
  const s = newSlide("Chrony: relógios sincronizados");
  badge(s, 8.75, 0.2, 0.75, "NTP", ORANGE, WHITE, 14);
  card(s, 0.5, 1.35, 3.6, 2.9, NAVY);
  s.addText("5 min", { x: 0.5, y: 1.6, w: 3.6, h: 1.3, fontSize: 66, bold: true, color: AMBER, align: "center", valign: "middle", margin: 0 });
  s.addText("diferença máxima de relógio que o Kerberos aceita", { x: 0.8, y: 2.95, w: 3.0, h: 0.8, fontSize: 13, color: WHITE, align: "center", valign: "top", margin: 0 });
  s.addText(bullets([
    [{ text: "O que é: ", options: { bold: true, color: NAVY } }, { text: "implementação leve do Network Time Protocol (NTP), ideal para máquinas virtuais" }],
    [{ text: "No projeto: ", options: { bold: true, color: NAVY } }, { text: "os clientes acertam a hora pelo SR2-SRV (serviço W32Time do Windows)" }],
    [{ text: "Sem ele: ", options: { bold: true, color: NAVY } }, { text: "o login e a junção ao domínio falham com «Clock skew too great»" }],
  ], { paraSpaceAfter: 12 }), { x: 4.4, y: 1.45, w: 5.1, h: 2.8, fontSize: 13, color: TXT, valign: "top", margin: 0 });
  strip(s, "", "server <IP_DC> iburst · chronyc sources · chronyc tracking", 4.55, 0.5, true);
  s.addNotes(`[Apresenta: ${A2}]
O Kerberos tem um requisito que causa muitos erros: os relógios. Os bilhetes têm marcas temporais e o AD rejeita pedidos com mais de cinco minutos de diferença.
O Chrony é uma implementação do NTP, o Network Time Protocol. É mais leve e converge mais depressa do que o ntpd clássico, o que o torna adequado para máquinas virtuais, cujo relógio tende a desviar-se.
No projeto, os clientes apontam o Chrony para o SR2-SRV, que responde através do W32Time, o serviço de tempo do Windows. Sem isto, a junção ao domínio e os logins falham com o erro "Clock skew too great". A captura Kerberos-01-Relogios mostra este passo.
Passo agora a palavra ao Renalto, que continua com o Samba e o adsys.`);
}


// =====================================================================
// SAMBA
// =====================================================================
whatSlide({
  title: "Samba: o que é",
  logoKey: "samba", name: "Samba", full: "software livre, desde 1992\n(o nome vem de SMB)",
  items: [
    lab("O que é", "um conjunto de programas livres que põe o Linux a falar a «língua» de rede do Windows: Server Message Block / Common Internet File System (SMB/CIFS) e RPC"),
    lab("Função", "partilhar e aceder a ficheiros e impressoras, e juntar o Linux ao domínio"),
    lab("Objetivo", "o Linux comportar-se na rede como um computador Windows"),
  ],
  foot: "kinit aluno.teste · smbclient //SR2-SRV.isec.local/SRII --use-kerberos=required",
  notes: `[Apresenta: ${A3}]
Obrigado, Pedro. O Samba é software livre, criado em 1992, e o nome vem precisamente de SMB.
O que é: um conjunto de programas que põe o Linux a falar a língua de rede do Windows, ou seja, o Server Message Block, também chamado Common Internet File System, e o RPC. Função: partilhar e aceder a ficheiros e impressoras e juntar o Linux ao domínio. Objetivo: que o Linux se comporte na rede como se fosse um computador Windows.
No nosso projeto é usado nos dois clientes: com o SSSD, para aceder à partilha SRII, e com o Winbind, que é uma peça do próprio Samba.`,
});
{
  const s = newSlide("Samba: de que é feito");
  const c = [
    ["smbd", "partilha ficheiros e impressoras"],
    ["nmbd", "anuncia e resolve nomes NetBIOS na rede"],
    ["winbindd", "o Winbind: traz as contas do AD para o Linux"],
    ["net", "e smbclient: juntar ao domínio e aceder a partilhas"],
  ];
  c.forEach(([n, d], i) => {
    const x = 0.5 + i * 2.3, w = 2.1, hl = n === "winbindd";
    card(s, x, 1.45, w, 2.4, hl ? ACCENT : WHITE);
    s.addText(n, { x: x + 0.1, y: 1.65, w: w - 0.2, h: 0.6, fontSize: 16, bold: true, fontFace: "Courier New", color: hl ? WHITE : NAVY, align: "center", valign: "middle", margin: 0 });
    s.addText(d, { x: x + 0.15, y: 2.4, w: w - 0.3, h: 1.2, fontSize: 13, color: hl ? WHITE : TXT, align: "center", valign: "top", margin: 0 });
  });
  strip(s, "", "o Winbind não é um programa à parte: é uma peça do Samba.", 4.2);
  s.addNotes(`[Apresenta: ${A3}]
O Samba não é um único programa, é um conjunto de daemons e ferramentas. O smbd partilha ficheiros e impressoras. O nmbd anuncia e resolve nomes NetBIOS na rede. O winbindd é o Winbind que vimos antes, que traz as contas do AD para o Linux. E há ferramentas como o smbclient, para aceder a partilhas, e o net, para juntar a máquina ao domínio.
Fica claro porque é que o Winbind e o Samba andam sempre juntos: o Winbind é uma peça do Samba.`);
}
{
  const s = newSlide("Samba: a tradução passo a passo");
  flowRow(s, 0.5, 1.7, 9.0, 1.5, [
    ["1. Pedido no Linux", "abrir ~/SRII/notas.txt"],
    ["2. Samba traduz", "para um pedido SMB"],
    ["3. Envia ao SR2-SRV", "com o bilhete Kerberos"],
    ["4. Servidor responde", "depois de verificar as permissões"],
  ], { gap: 0.4, fs: 15 });
  strip(s, "", "a password não volta a ser pedida: o bilhete Kerberos chega.", 3.8);
  s.addNotes(`[Apresenta: ${A3}]
O papel do Samba é de tradutor. Vejamos o pedido passo a passo. Um utilizador no Linux abre um ficheiro na pasta SRII. O Linux não sabe falar com o Windows, por isso o Samba traduz esse pedido para SMB, a linguagem de partilha de ficheiros do Windows.
Envia-o ao SR2-SRV juntando o bilhete Kerberos que obtivemos antes, por isso não é preciso voltar a escrever a password. O servidor verifica as permissões da partilha e do NTFS, as mesmas do exemplo do ISEC, e responde: se o utilizador for do Grupo-Alunos, pode ler mas não escrever.`);
}
{
  const s = newSlide("Samba com o SSSD: teste na partilha SRII");
  card(s, 0.5, 1.3, 4.1, 1.8, "18181B");
  s.addText([
    { text: "$ kinit aluno.teste@ISEC.LOCAL", options: { color: ACCENT2, breakLine: true } },
    { text: "$ smbclient //SR2-SRV.isec.local/SRII \\", options: { color: ACCENT2, breakLine: true } },
    { text: "    --use-kerberos=required -c 'ls'", options: { color: ACCENT2, breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "Sem password: o Samba usa o bilhete Kerberos obtido pelo kinit", options: { color: LIGHT, fontFace: "Calibri", fontSize: 11 } },
  ], { x: 0.7, y: 1.45, w: 3.75, h: 1.55, fontFace: "Courier New", fontSize: 10.5, valign: "top", margin: 0 });
  table(s, ["Utilizador", "Listar (ls)", "Escrever (put)"], [
    ["aluno.teste", "permitido", "ACCESS_DENIED"],
    ["professor.teste", "permitido", "permitido"],
  ], { x: 4.85, y: 1.3, w: 4.65, colW: [1.65, 1.35, 1.65], rowH: 0.6, fs: 12.5 });
  strip(s, "", "o cliente SSSD usa o Samba para as partilhas; as permissões vêm do AD.", 4.5, 0.5);
  s.addNotes(`[Apresenta: ${A3}]
No nosso trabalho, o Samba não serve só o Winbind: o cliente com SSSD também o usa para aceder às partilhas. Depois de obter o bilhete com o kinit, o smbclient acede à partilha SRII com --use-kerberos=required, sem pedir a password.
O resultado confirma as permissões definidas no AD: o aluno.teste consegue listar mas não escrever, recebendo NT_STATUS_ACCESS_DENIED, e o professor.teste lista e escreve.`);
}

// =====================================================================
// ADSYS
// =====================================================================
whatSlide({
  title: "adsys: o que é",
  logoKey: "ubuntu", name: "adsys", full: "cliente de Group Policy da Canonical",
  items: [
    "Lê as GPO do domínio e aplica-as ao Ubuntu, como num cliente Windows",
    "Configura o ambiente de trabalho (dconf), privilégios sudo e scripts",
    "Testado no projeto, no cliente ubuclient (requer o SSSD)",
  ],
  foot: "apt install adsys · adsysctl update --all · adsysctl policy applied",
  notes: `[Apresenta: ${A3}]
Falta uma peça importante: o adsys. Até aqui o Linux já autentica no AD, mas continua a ser configurado à mão em cada máquina. O adsys é o cliente de Group Policy da Canonical: lê as GPO do domínio e aplica-as ao Ubuntu, tal como acontece num cliente Windows.
Permite configurar o ambiente de trabalho através do dconf, dar privilégios de sudo e correr scripts de arranque ou de login, por máquina ou por utilizador. Uma nota: o adsys requer o SSSD, não funciona com o Winbind.`,
});
{
  const s = newSlide("adsys: como uma GPO chega ao Ubuntu");
  flowRow(s, 0.5, 1.7, 9.0, 1.5, [
    ["1. GPO criada", "no DC, com os modelos ADMX do Ubuntu"],
    ["2. Guardada", "no SYSVOL do DC"],
    ["3. adsys descarrega", "com Kerberos + SMB"],
    ["4. Aplicada", "no arranque ou no login"],
  ], { gap: 0.4, fs: 15 });
  strip(s, "", "o Ubuntu passa a ser gerido a partir do servidor, como o Windows.", 3.8);
  s.addNotes(`[Apresenta: ${A3}]
Como é que uma política chega ao Ubuntu? Primeiro, o administrador cria a GPO no DC usando os modelos administrativos ADMX, Administrative Template XML, do Ubuntu, que se instalam no Windows Server. A GPO fica guardada no SYSVOL, System Volume, a pasta partilhada do controlador. O adsys descarrega-a usando Kerberos e SMB, as mesmas peças que acabámos de ver, e aplica-a no arranque ou no login.
É isto que fecha o ciclo da gestão centralizada: o Ubuntu passa a ser gerido a partir do servidor, como os computadores Windows.`);
}

// =====================================================================
// 20. ARQUITETURA DO LABORATÓRIO
// =====================================================================
{
  const s = newSlide("Arquitetura do laboratório");
  card(s, 1.75, 1.35, 3.0, 1.0, NAVY);
  s.addText([{ text: "SR2-SRV.isec.local", options: { bold: true, fontSize: 14, color: WHITE, breakLine: true } },
             { text: "AD DS · DNS · KDC · partilha SRII", options: { fontSize: 11, color: AMBER } }],
    { x: 1.85, y: 1.35, w: 2.8, h: 1.0, align: "center", valign: "middle", margin: 0 });
  s.addShape(pres.shapes.LINE, { x: 0.6, y: 2.85, w: 5.4, h: 0, line: { color: GREY, width: 3 } });
  s.addShape(pres.shapes.LINE, { x: 3.25, y: 2.35, w: 0, h: 0.5, line: { color: GREY, width: 2 } });
  s.addText("VLAN 192.168.X.0/24", { x: 3.6, y: 2.55, w: 2.4, h: 0.25, fontSize: 10, color: GREY, align: "right", margin: 0 });
  [[0.6, "ubuclient", "SSSD + Samba + adsys"], [3.4, "UBU-WINBIND", "Winbind + Samba"]].forEach(([x, t, d]) => {
    s.addShape(pres.shapes.LINE, { x: x + 1.3, y: 2.85, w: 0, h: 0.5, line: { color: GREY, width: 2 } });
    card(s, x, 3.35, 2.6, 0.95, WHITE);
    s.addText([{ text: t, options: { bold: true, fontSize: 14, color: NAVY, breakLine: true } }, { text: d, options: { fontSize: 11.5, color: ORANGE, bold: true } }],
      { x, y: 3.35, w: 2.6, h: 0.95, align: "center", valign: "middle", margin: 0 });
  });
  s.addText("Regras", { x: 6.5, y: 1.35, w: 3.0, h: 0.35, fontSize: 14, bold: true, color: NAVY, margin: 0 });
  s.addText(bullets(["Uma só variante ativa por cliente", "O DNS dos clientes é o DC", "Nome NetBIOS com 15 caracteres no máximo"], { paraSpaceAfter: 10 }),
    { x: 6.5, y: 1.8, w: 3.0, h: 2.5, fontSize: 12.5, color: TXT, valign: "top", margin: 0 });
  s.addNotes(`[Apresenta: ${A3}]
Esta é a arquitetura do laboratório, o mesmo esquema do guião. Cada aluno trabalha numa VLAN própria do Proxmox, 192.168.X.0/24.
No centro está o Windows Server SR2-SRV, Domain Controller do domínio isec.local, que acumula o AD DS, o DNS, o KDC Kerberos e a partilha SRII.
Temos dois clientes Ubuntu, clonados do mesmo template, para comparar as duas abordagens: o ubuclient, integrado com SSSD, e o UBU-WINBIND, integrado com Samba e Winbind.
À direita, as regras que fazem a integração funcionar: SSSD e Winbind nunca ficam ativos ao mesmo tempo na mesma máquina, o DNS dos clientes tem de ser o DC e o nome NetBIOS, Network Basic Input/Output System, não pode ter mais de 15 caracteres.`);
}


// =====================================================================
// LOGIN PASSO A PASSO (DIAGRAMA DE SEQUÊNCIA EM DUAS PARTES)
// =====================================================================
{
  const s = newSlide("Login passo a passo (1/2): autenticar");
  loginSeq(s, [
    [0, 1, "1. nome + password (gdm)"],
    [1, 2, "2. pam_sss / pam_winbind"],
    [2, 3, "3. onde está o KDC? (SRV)"],
    [3, 2, "4. SR2-SRV.isec.local", 1],
    [2, 4, "5. AS-REQ (chave da password)"],
    [4, 2, "6. AS-REP: TGT → password correta", 1],
  ]);
  s.addNotes(`[Apresenta: ${A3}]
Agora juntamos todas as peças num diagrama de sequência de um login, dividido em duas partes. Cada seta é um pedido ou uma resposta; as setas a tracejado são as respostas.
Na primeira parte, a autenticação. O utilizador escreve o nome e a password no ecrã de entrada. O gdm pede ao PAM, e o PAM, através do pam_sss ou do pam_winbind, passa o pedido ao SSSD ou ao Winbind.
O SSSD pergunta ao DNS onde está o KDC, usando os registos SRV, e recebe o nome do servidor SR2-SRV.isec.local. Se o DNS estiver mal configurado, tudo falha aqui.
Depois faz o pedido de autenticação Kerberos. Se o KDC devolver um TGT, a password está correta.`);
}
{
  const s = newSlide("Login passo a passo (2/2): abrir a sessão");
  loginSeq(s, [
    [2, 5, "7. procura utilizador e grupos"],
    [5, 2, "8. atributos, SID → UID/GID", 1],
    [2, 1, "9. sucesso (guarda em cache)", 1],
    [1, 1, "10. pam_mkhomedir cria /home/aluno"],
    [1, 6, "11. pam_mount: montar SRII com o bilhete"],
    [6, 1, "12. partilha montada", 1],
    [1, 0, "13. sessão iniciada", 1],
  ]);
  s.addNotes(`[Apresenta: ${A3}]
Na segunda parte, a abertura da sessão. Com a ligação autenticada por Kerberos, o SSSD procura no LDAP os dados e os grupos do utilizador e traduz o SID do Windows em UID e GID do Linux.
O SSSD devolve sucesso ao PAM e guarda as credenciais em cache. O PAM cria a pasta pessoal com o pam_mkhomedir. Depois, o pam_mount monta a partilha SRII por SMB, usando o bilhete Kerberos, sem voltar a pedir a password.
A sessão é iniciada: o utilizador está no Linux com a conta do Windows e já tem os seus ficheiros da rede. É exatamente este fluxo que vamos montar na parte prática.`);
}

// =====================================================================
// 22. O SERVIDOR COMO GESTOR CENTRAL
// =====================================================================
{
  const s = newSlide("O servidor como gestor central");
  card(s, 0.5, 1.35, 4.2, 2.9, NAVY);
  s.addText("Decidido no DC", { x: 0.75, y: 1.5, w: 3.8, h: 0.4, fontSize: 16, bold: true, color: AMBER, margin: 0 });
  s.addText(bullets(["Quem existe e a que grupos pertence", "A que pastas acede e com que direitos", "Que políticas recebe"], { paraSpaceAfter: 10 }),
    { x: 0.75, y: 2.05, w: 3.8, h: 2.1, fontSize: 13.5, color: WHITE, valign: "top", margin: 0 });
  hline(s, 4.82, 5.28, 2.8, { color: ORANGE, width: 2.5, end: true });
  card(s, 5.4, 1.35, 4.1, 2.9, WHITE);
  s.addText("Aplicado no Linux", { x: 5.65, y: 1.5, w: 3.7, h: 0.4, fontSize: 16, bold: true, color: ORANGE, margin: 0 });
  s.addText(bullets(["SSSD / Winbind consultam e guardam em cache", "PAM aplica a decisão no login", "adsys aplica as GPO"], { paraSpaceAfter: 10 }),
    { x: 5.65, y: 2.05, w: 3.7, h: 2.1, fontSize: 13.5, color: TXT, valign: "top", margin: 0 });
  strip(s, "", "nenhuma conta é criada à mão no cliente Linux.");
  s.addNotes(`[Apresenta: ${A3}]
Uma ideia central do trabalho: o servidor é o gestor. Tudo o que importa é decidido no DC, o SR2-SRV: quem existe e a que grupos pertence, a que pastas cada um acede e com que direitos, e que políticas cada máquina recebe.
Os clientes Linux limitam-se a aplicar essas decisões. O SSSD ou o Winbind consultam o AD e guardam o resultado em cache; o PAM aplica a decisão no momento do login; e o adsys aplica as GPO. Nenhuma conta de utilizador é criada à mão no cliente.
Na analogia da porta: todas as portas ligam para a mesma central, e é lá que se decide quem entra, em que salas e com que regras.`);
}

// =====================================================================
// 23. AD: UTILIZADORES E GRUPOS (LABORATÓRIO)
// =====================================================================
{
  const s = newSlide("No laboratório: utilizadores e grupos");
  [["aluno.teste", "Grupo-Alunos"], ["professor.teste", "Grupo-Professores"]].forEach(([u, g], i) => {
    const y = 1.55 + i * 1.15;
    card(s, 0.5, y, 1.75, 0.7, WHITE);
    s.addText(u, { x: 0.5, y, w: 1.75, h: 0.7, fontSize: 12.5, bold: true, color: NAVY, align: "center", valign: "middle", margin: 0 });
    hline(s, 2.3, 3.0, y + 0.35, { color: ORANGE, width: 1.75, end: true });
    s.addText("membro de", { x: 2.25, y: y + 0.05, w: 0.8, h: 0.22, fontSize: 8.5, italic: true, color: GREY, align: "center", margin: 0 });
    card(s, 3.05, y, 1.95, 0.7, NAVY);
    s.addText([{ text: g, options: { bold: true, fontSize: 12.5, color: WHITE, breakLine: true } }, { text: "grupo global de segurança", options: { fontSize: 9, color: LIGHT } }],
      { x: 3.05, y, w: 1.95, h: 0.7, align: "center", valign: "middle", margin: 0 });
  });
  s.addText("Computadores: UBUCLIENT · UBU-WINBIND", { x: 0.5, y: 3.95, w: 4.5, h: 0.35, fontSize: 12, color: GREY, margin: 0 });
  shot(s, "09-computador-ad.png", 5.3, 1.35, 4.2, 3.0, "Contas de computador no AD após a junção");
  s.addNotes(`[Apresenta: ${A3}]
Passamos ao lado Windows do laboratório. No SR2-SRV criámos, no domínio isec.local, dois grupos de segurança de âmbito global, o Grupo-Alunos e o Grupo-Professores, e dois utilizadores de teste: o aluno.teste, membro do Grupo-Alunos, e o professor.teste, membro do Grupo-Professores. Depois da junção ao domínio, aparecem também as contas de computador dos dois clientes Linux, como se vê na captura.
A boa prática é a estratégia AGDLP, Accounts, Global, Domain Local, Permissions: as contas entram em grupos globais, estes em grupos de domínio local, e as permissões atribuem-se a estes últimos. É a versão "oficial" da regra de ouro que vimos no início: dar acesso a grupos e não a pessoas.`);
}

// =====================================================================
// 24. PERMISSÕES: NTFS VS PARTILHA SMB
// =====================================================================
{
  const s = newSlide("Permissões: NTFS vs partilha SMB");
  table(s, ["", "NTFS", "Partilha SMB", "Linux"], [
    ["Leitura", "Read", "Read", "r--"],
    ["Escrita", "Modify", "Change", "rw-"],
    ["Controlo total", "Full Control", "Full Control", "dono + ACL"],
    ["Âmbito", "local e rede", "só pela rede", "~/SRII (mount.cifs)"],
  ], { x: 0.5, y: 1.35, w: 9.0, colW: [1.9, 2.3, 2.3, 2.5], rowH: 0.48, fs: 12.5 });
  s.addText([{ text: "Grupo-Alunos", options: { bold: true, color: NAVY } }, { text: " → só lê     ", options: { color: TXT } },
             { text: "Grupo-Professores", options: { bold: true, color: NAVY } }, { text: " → lê e escreve", options: { color: TXT } }],
    { x: 0.5, y: 3.95, w: 9.0, h: 0.4, fontSize: 13.5, align: "center", margin: 0 });
  strip(s, "", "a permissão efetiva é a mais restritiva das duas.");
  s.addNotes(`[Apresenta: ${A3}]
No Windows há duas camadas de permissões. As permissões NTFS aplicam-se ao sistema de ficheiros e valem sempre, quer o acesso seja local quer pela rede. As permissões de partilha SMB só se aplicam a quem acede pela rede e são mais simples: Read, Change e Full Control. Na coluna da direita está a correspondência aproximada no Linux; para permissões finas usam-se as ACL, Access Control Lists, com setfacl.
Quando um utilizador acede a uma partilha, a permissão efetiva é a mais restritiva das duas.
Na partilha SRII, o Grupo-Alunos tem Read, por isso só lê, e o Grupo-Professores tem Modify efetivo, por isso lê e escreve. É exatamente o exemplo das disciplinas do ISEC, aplicado ao laboratório.`);
}

// =====================================================================
// 25. PRIMEIROS TESTES
// =====================================================================
{
  const s = newSlide("Do laboratório: primeiros testes");
  shot(s, "03-ad-dominio.png", 0.5, 1.2, 4.4, 1.95, "Get-ADDomain: o domínio isec.local");
  shot(s, "10-user-ad.png", 5.1, 1.2, 4.4, 1.95, "New-ADUser: utilizador de teste");
  shot(s, "11-getent.png", 0.5, 3.2, 4.4, 1.85, "getent: o utilizador do AD visto no Ubuntu");
  shot(s, "16-smbclient.png", 5.1, 3.2, 4.4, 1.85, "smbclient: acesso à partilha com a conta do AD");
  s.addNotes(`[Apresenta: ${A3}]
Antes de concluir, quatro capturas reais dos testes preliminares que fizemos no laboratório.
Em cima à esquerda, o Get-ADDomain confirma o domínio isec.local criado no Windows Server. Ao lado, a criação de um utilizador de teste com New-ADUser. Em baixo, o getent mostra esse utilizador do AD visto no Ubuntu, com UID e grupos atribuídos automaticamente pelo SSSD. Por fim, o smbclient acede à partilha do servidor com a conta do domínio.
A teoria que apresentámos funciona na prática, e é isto que vamos repetir passo a passo na parte prática.
[Nota: estas capturas foram feitas num teste anterior, com nomes ligeiramente diferentes (sr2-dc01, aluno.sr2).]`);
}


// =====================================================================
// MELHORIAS FUTURAS: AUTENTICAÇÃO MULTIFATOR
// =====================================================================
{
  const s = newSlide("Melhoria futura: autenticação multifator (MFA)");
  const f = [
    ["Algo que se sabe", "password do AD", NAVY, WHITE, ACCENT2],
    ["Algo que se tem", "código temporário no telemóvel", WHITE, NAVY, ACCENT],
    ["Acesso mais seguro", "uma password roubada já não chega", ACCENT, WHITE, WHITE],
  ];
  const w = 2.55, y = 1.4, h = 1.9;
  f.forEach(([t, d, fill, tc, sc], i) => {
    const x = 0.5 + i * (w + 0.67);
    card(s, x, y, w, h, fill);
    s.addText([{ text: t, options: { bold: true, fontSize: 16, color: tc, breakLine: true } }, { text: d, options: { fontSize: 12.5, color: sc } }],
      { x: x + 0.15, y, w: w - 0.3, h, align: "center", valign: "middle", margin: 0 });
    if (i < 2) s.addText(i === 0 ? "+" : "=", { x: x + w, y, w: 0.67, h, fontSize: 36, bold: true, color: GREY, align: "center", valign: "middle", margin: 0 });
  });
  s.addText("Pode ser acrescentada ao PAM (ex.: códigos Time-based One-Time Password, TOTP) sem mudar o resto da infraestrutura", { x: 0.5, y: 3.55, w: 9.0, h: 0.5, fontSize: 13, color: TXT, align: "center", valign: "middle", margin: 0 });
  strip(s, "", "começar pelos acessos mais sensíveis: administradores e SSH aos servidores.", 4.5, 0.5);
}
// =====================================================================
// MELHORIAS FUTURAS: OUTRAS COMPONENTES
// =====================================================================
{
  const s = newSlide("Outras melhorias a explorar");
  const it = [
    ["ubuntu", null, "authd", "Login no Ubuntu com fornecedores de identidade na cloud, da Canonical"],
    [null, "ID", "Microsoft Entra ID", "O \"AD na cloud\": identidades híbridas e acesso a serviços online"],
    ["linux", null, "FreeIPA", "Alternativa livre ao AD DS para redes só com Linux"],
  ];
  it.forEach(([k, ab, n, d], i) => {
    const x = 0.5 + i * 3.075, w = 2.85;
    card(s, x, 1.35, w, 2.75, WHITE);
    if (k) logo(s, x + (w - 0.85) / 2, 1.55, 0.85, k); else badge(s, x + (w - 0.85) / 2, 1.55, 0.85, ab, ACCENT, WHITE, 18);
    s.addText([{ text: n, options: { bold: true, fontSize: 16, color: NAVY, breakLine: true } }, { text: d, options: { fontSize: 12, color: TXT } }],
      { x: x + 0.2, y: 2.55, w: w - 0.4, h: 1.4, align: "center", valign: "top", margin: 0 });
  });
  strip(s, "", "componentes avançadas: abordadas em teoria, para evoluir a infraestrutura.", 4.5, 0.5);
}
// =====================================================================
// CONCLUSÃO
// =====================================================================
{
  const s = newSlide("Conclusão");
  [["ID", "Identidade única", "uma conta em Windows e Linux"],
   ["SSO", "Single Sign-On", "bilhetes Kerberos, sem repetir a password"],
   ["GRP", "Gestão por grupos", "como no exemplo do ISEC"],
   ["GPO", "Políticas no Linux", "testadas com o adsys"]].forEach(([ab, t, d], i) => {
    const x = 0.5 + i * 2.3;
    card(s, x, 1.35, 2.1, 2.6, i === 0 ? NAVY : WHITE);
    badge(s, x + 0.65, 1.6, 0.8, ab, ORANGE, WHITE, 14);
    s.addText([{ text: t, options: { bold: true, fontSize: 15, color: i === 0 ? WHITE : NAVY, breakLine: true } }, { text: d, options: { fontSize: 12, color: i === 0 ? LIGHT : TXT } }],
      { x: x + 0.12, y: 2.6, w: 1.86, h: 1.25, align: "center", valign: "top", margin: 0 });
  });
  strip(s, "", "Linux e Windows partilham uma identidade única, gerida a partir do AD DS.", 4.3);
  s.addNotes(`[Apresenta: ${A3}]
Para concluir: mostrámos que é possível integrar clientes Linux num domínio Windows de forma a que ambos partilhem uma identidade única, gerida a partir do AD DS.
Ficam quatro ideias. Cada pessoa tem uma só conta, em qualquer máquina. O Kerberos dá Single Sign-On sem enviar passwords pela rede. As permissões dão-se a grupos, como no exemplo das disciplinas do ISEC. E, com o adsys, as políticas do domínio chegam também ao Ubuntu.
Quanto aos tradutores: o SSSD é a escolha para postos de trabalho Ubuntu e o Winbind faz sentido quando o Linux também partilha ficheiros.`);
}

// =====================================================================
// AGRADECIMENTO + HANDS-ON
// =====================================================================
{
  const s = pres.addSlide({ masterName: "CAPA" });
  s.addShape(pres.shapes.OVAL, { x: 6.5, y: 0.75, w: 4.4, h: 4.4, fill: { color: "0EA5E9" }, line: { color: "0EA5E9" } });
  s.addText(">_", { x: 6.5, y: 0.75, w: 4.4, h: 4.4, fontSize: 110, bold: true, color: WHITE, fontFace: "Courier New", align: "center", valign: "middle", margin: 0 });
  s.addText("Obrigado pela atenção!", { x: 0.5, y: 1.2, w: 6.0, h: 1.0, fontSize: 36, bold: true, color: NAVY, valign: "bottom", margin: 0 });
  s.addText("Hands-on: mãos ao projeto", { x: 0.5, y: 2.25, w: 6.0, h: 0.6, fontSize: 26, bold: true, color: ORANGE, margin: 0 });
  s.addShape(pres.shapes.LINE, { x: 0.5, y: 3.05, w: 1.2, h: 0, line: { color: ORANGE, width: 3 } });
  s.addText("Sigam o guião do workshop. Dúvidas? Estamos por aqui.", { x: 0.5, y: 3.3, w: 5.8, h: 0.4, fontSize: 14, color: GREY, margin: 0 });
  s.addNotes(`[Apresentam: ${A1}, ${A2} e ${A3}]
Obrigado pela atenção. Se houver perguntas sobre os conceitos, respondemos agora.
A seguir começa a parte prática, o hands-on. Na Parte A configuramos o Windows Server com o AD DS, o DNS, os utilizadores e a partilha SRII. Na Parte B juntamos os clientes Ubuntu ao domínio, um com SSSD e outro com Winbind. Sigam o guião do workshop; nós vamos circulando para ajudar.`);
}

pres.writeFile({ fileName: OUT }).then((f) => console.log("written", f));
