const pptxgen = require("pptxgenjs");
const OUT = process.argv[2] || "deck.pptx";

// ---------- Paleta ----------
// Laranja dominante (identidade ISEC/IPC); nomes antigos mantidos por compatibilidade
const NAVY = "1F2937";   // grafite: texto forte, cabeçalhos de tabela, cartão de destaque
const BLUE = "D9480F";   // laranja: destaques, setas, badges
const TITLE = "C2410C";  // laranja escuro: títulos dos slides
const COVER = "FFFFFF";  // fundos sempre brancos
const DCARD = "D9480F";
const ICE = "FFFFFF", ICE2 = "F4F4F5", AMBER = "FDBA74";
const TXT = "27272A", GREY = "71717A", WHITE = "FFFFFF", NOTE = "FFF7ED", LIGHT = "E4E4E7";
const INK = "27272A", PAPER = "F4F4F5", RULE = "A1A1AA";
const BORDER = "E4E4E7", ALT = "FAFAF9";
const ADV = "374151";    // componentes avançadas (grafite)
const GOOD = "2E7D5B", BAD = "B42318";
const fs = require("fs"), path = require("path");
const LOGOS = path.join(__dirname, "logos");
const LOGO_KEYS = { AD: "windows-server", KRB: "kerberos", NTP: "chrony", SMB: "samba", WB: "samba", SSSD: "sssd", PAM: "linux", GPO: "ubuntu", "2FA": "google-authenticator", "+": null };
// Usa o logótipo (logos/<key>.png, já quadrado) se existir; senão desenha o badge com a sigla
function logoOrBadge(s, x, y, d, key, label, fill, color, fsz) {
  const f = key && path.join(LOGOS, key + ".png");
  if (f && fs.existsSync(f)) {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: WHITE }, line: { color: BORDER, width: 1 } });
    const k = key === "samba" ? 0.92 : 0.7;  // logótipos largos ocupam mais largura do círculo
    s.addImage({ path: f, x: x + d * (1 - k) / 2, y: y + d * (1 - k) / 2, w: d * k, h: d * k, altText: `Logótipo ${key}` });
  } else badge(s, x, y, d, label, fill, color, fsz);
}

const ANO = "2026/2027";
const FOOTER = `Grupo 10 | ISEC – IPC | Ano letivo ${ANO}`;
const A1 = "Orlando Santos", A2 = "Pedro Ferreira", A3 = "Renalto Baticã";
const DC = "SR2-SRV", DOM = "isec.local", CLS = "ubuclient", CLW = "UBU-WINBIND";

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.author = "Grupo 10";
pres.title = "Integração de clientes Linux num domínio Windows AD DS – Parte A";
pres.theme = { headFontFace: "Calibri", bodyFontFace: "Calibri" };

const footerObjs = (color) => [{ text: { text: FOOTER, options: { x: 0.5, y: 5.22, w: 6, h: 0.28, fontSize: 10, color, fontFace: "Calibri", margin: 0 } } }];
const slideNum = (color) => ({ x: 8.9, y: 5.22, w: 0.6, h: 0.28, fontSize: 10, color, align: "right", fontFace: "Calibri" });
const titlePh = (color) => ({ placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.28, w: 8.0, h: 0.65, fontSize: 26, bold: true, color, fontFace: "Calibri", align: "left", valign: "middle", margin: 0 }, text: "" } });

// CAPA: sem número (capa e último slide). SECCAO: separadores, numerados.
pres.defineSlideMaster({ title: "CAPA", background: { color: WHITE }, objects: footerObjs(GREY) });
pres.defineSlideMaster({ title: "SECCAO", background: { color: WHITE }, objects: footerObjs(GREY), slideNumber: slideNum(GREY) });
pres.defineSlideMaster({ title: "CONTEUDO", background: { color: WHITE }, objects: [...footerObjs(GREY), titlePh(TITLE)], slideNumber: slideNum(GREY) });
pres.defineSlideMaster({ title: "ESCURO", background: { color: WHITE }, objects: [...footerObjs(GREY), titlePh(TITLE)], slideNumber: slideNum(GREY) });

// ---------- Helpers ----------
const shadow = () => ({ type: "outer", color: "000000", opacity: 0.12, blur: 6, offset: 2, angle: 90 });
const TBL_MARGIN = () => [0.04, 0.08, 0.04, 0.08];

// Cada slide de conteúdo regista o seu texto para gerar a linha de siglas no rodapé
const GLOSS_SLIDES = [];
const runText = (t) => (typeof t === "string" ? t : Array.isArray(t) ? t.map((r) => (typeof r === "string" ? r : r.text || "")).join(" ") : "");
function newSlide(section, title, master = "CONTEUDO") {
  const s = pres.addSlide({ masterName: master, sectionTitle: section });
  s._txt = [];
  const oT = s.addText.bind(s), oTb = s.addTable.bind(s);
  s.addText = (t, o) => { s._txt.push(runText(t)); return oT(t, o); };
  s.addTable = (rows, o) => { rows.forEach((r) => r.forEach((c) => s._txt.push(typeof c === "string" ? c : runText(c.text)))); return oTb(rows, o); };
  s._origText = oT;
  GLOSS_SLIDES.push(s);
  if (title) {
    // Junta ao título o significado das siglas que nele aparecem (letra menor), se couber numa linha
    const exps = [];
    for (const [k, v] of GLOSS) {
      const re = new RegExp("(^|[^A-Za-z0-9_\\-])" + k.replace(/ /g, "\\s") + "(?![A-Za-z0-9_])");
      if (re.test(title) && !title.includes(v) && !(k === "AD" && /AD DS/.test(title))) exps.push(`${k} = ${v}`);
    }
    let extra = "";
    s._titleExp = [];
    for (const e of exps.slice(0, 2)) {
      const cand = extra ? `${extra}  ·  ${e}` : e;
      if (title.length * 0.165 + (cand.length + 3) * 0.085 <= 7.9) extra = cand;
      else s._titleExp.push(e);
    }
    if (extra) s.addText([{ text: title }, { text: "   " + extra, options: { fontSize: 13, bold: false, color: GREY } }], { placeholder: "title" });
    else s.addText(title, { placeholder: "title" });
  }
  return s;
}
const GLOSS = [
  ["AD DS", "Active Directory Domain Services"], ["ADUC", "AD Users and Computers"], ["GPMC", "Group Policy Management Console"],
  ["DC", "Domain Controller"], ["DNS", "Domain Name System"], ["SRV", "registo DNS de serviço"], ["LDAP", "Lightweight Directory Access Protocol"],
  ["KDC", "Key Distribution Center"], ["TGT", "Ticket Granting Ticket"], ["TGS", "Ticket Granting Service"], ["AS", "Authentication Service"],
  ["SSO", "Single Sign-On"], ["NTP", "Network Time Protocol"], ["SMB", "Server Message Block"], ["CIFS", "Common Internet File System"],
  ["RPC", "Remote Procedure Call"], ["NTLM", "NT LAN Manager"], ["NetBIOS", "Network Basic Input/Output System"],
  ["SSSD", "System Security Services Daemon"], ["PAM", "Pluggable Authentication Modules"], ["NSS", "Name Service Switch"],
  ["SID", "Security Identifier"], ["RID", "Relative Identifier"], ["UID", "User ID"], ["GID", "Group ID"],
  ["GPO", "Group Policy Object"], ["OU", "Organizational Unit"], ["ADMX", "Administrative Template XML"], ["SYSVOL", "System Volume"],
  ["NTFS", "New Technology File System"], ["ACL", "Access Control List"], ["AGDLP", "Accounts-Global-Domain Local-Permissions"],
  ["2FA", "Two-Factor Authentication"], ["MFA", "Multi-Factor Authentication"], ["TOTP", "Time-based One-Time Password"],
  ["OIDC", "OpenID Connect"], ["HBAC", "Host-Based Access Control"], ["CA", "Certificate Authority"], ["SaaS", "Software as a Service"],
  ["VLAN", "Virtual LAN"], ["VM", "Virtual Machine"], ["FQDN", "Fully Qualified Domain Name"], ["UPN", "User Principal Name"],
  ["NTDS", "NT Directory Services"], ["SRII", "partilha de Serviços de Rede II"], ["AD", "Active Directory"], ["SSH", "Secure Shell"], ["GDM", "GNOME Display Manager"],
];
// Acrescenta, no rodapé, as siglas que aparecem no slide (por ordem de aparecimento), até caber em duas linhas
function addGlossLines() {
  for (const s of GLOSS_SLIDES) {
    // siglas do título que não couberam na linha do título: por baixo, se não houver subtítulo
    if (s._titleExp && s._titleExp.length && !s._hasTag)
      s._origText(s._titleExp.join("  ·  "), { x: 0.5, y: 0.9, w: 8.1, h: 0.3, fontSize: 13, color: GREY, margin: 0, isTextBox: true });
    if (s._noGloss) continue;
    const txt = s._txt.join("  ");
    const found = [];
    for (const [k, v] of GLOSS) {
      const re = new RegExp("(^|[^A-Za-z0-9_\-])" + k.replace(/ /g, "\\s") + "(?![A-Za-z0-9_])");
      const m = re.exec(txt);
      if (m && !(k === "AD" && /AD DS/.test(txt))) found.push([m.index, k, v]);
    }
    found.sort((a, b) => a[0] - b[0]);
    let line = "", n = 0;
    for (const [, k, v] of found) {
      const piece = `${k} – ${v}`;
      if ((line + piece).length > 175) break;
      line += (n++ ? "  ·  " : "") + piece;
    }
    if (line) s._origText(line, { x: 3.3, y: 5.15, w: 5.5, h: 0.4, fontSize: 8, color: GREY, align: "right", valign: "middle", margin: 0, isTextBox: true });
  }
}
function badge(s, x, y, d, label, fill = NAVY, color = WHITE, fs) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  s.addText(label, { x, y, w: d, h: d, align: "center", valign: "middle", bold: true, color, margin: 0, fontSize: fs || (label.length > 3 ? d * 18 : d * 26), isTextBox: true });
}
function tagline(s, text, color = GREY) {
  s._hasTag = true;
  s.addText(text, { x: 0.5, y: 0.92, w: 8.1, h: 0.35, fontSize: 14, italic: true, color, margin: 0, isTextBox: true });
}
function bullets(items, opts = {}) {
  return items.map((t, i) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: i < items.length - 1, paraSpaceAfter: 5, ...opts } }));
}
function card(s, x, y, w, h, fill = ICE) {
  const line = fill === WHITE ? { color: BORDER, width: 1 } : { color: fill };
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.05, fill: { color: fill }, line });
}
function strip(s, label, text, mono = false, y = 4.4, h = 0.6) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 9.0, h, rectRadius: 0.06, fill: { color: ICE2 }, line: { color: ICE2 } });
  s.addText([{ text: label + "  ", options: { bold: true, color: NAVY, fontFace: "Calibri" } }, { text, options: { color: TXT, fontFace: mono ? "Courier New" : "Calibri" } }],
    { x: 0.65, y, w: 8.7, h, fontSize: mono ? 11 : 12, valign: "middle", margin: 0, isTextBox: true });
}
function codeBox(s, x, y, w, h, lines, fs = 11, title) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06, fill: { color: "18181B" }, line: { color: "18181B" } });
  const runs = [];
  if (title) runs.push({ text: title, options: { color: AMBER, bold: true, breakLine: true } });
  lines.forEach((l, i) => runs.push({ text: l, options: { color: "E4E4E7", breakLine: i < lines.length - 1 } }));
  s.addText(runs, { x: x + 0.15, y: y + 0.1, w: w - 0.3, h: h - 0.2, fontFace: "Courier New", fontSize: fs, valign: "top", margin: 0, isTextBox: true });
}
const IMG_DIR = fs.existsSync(path.join(__dirname, "..", "..", "imagens")) ? path.join(__dirname, "..", "..", "imagens") : "D:/TrabalhoSR2/imagens";
const IMG_SIZES = { "03-ad-dominio.png": [1174, 738], "08-realm-join.png": [325, 384], "09-computador-ad.png": [783, 429], "10-user-ad.png": [572, 386], "11-getent.png": [912, 175], "16-smbclient.png": [718, 382] };
// Captura real, ajustada à caixa sem deformar, com contorno fino e legenda
function shot(s, file, x, y, w, h, caption) {
  const [iw, ih] = IMG_SIZES[file];
  const ch = caption ? 0.28 : 0;
  const k = Math.min(w / iw, (h - ch) / ih), dw = iw * k, dh = ih * k;
  const ix = x + (w - dw) / 2, iy = y + (h - ch - dh) / 2;
  s.addShape(pres.shapes.RECTANGLE, { x: ix - 0.02, y: iy - 0.02, w: dw + 0.04, h: dh + 0.04, fill: { color: WHITE }, line: { color: BORDER, width: 1 } });
  s.addImage({ path: path.join(IMG_DIR, file), x: ix, y: iy, w: dw, h: dh, altText: caption || file });
  if (caption) s.addText(caption, { x, y: y + h - ch + 0.04, w, h: ch - 0.04, fontSize: 10, italic: true, color: GREY, align: "center", margin: 0, isTextBox: true });
}
function placeholderImg(s, x, y, w, h, label) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: "FFFAF6" }, line: { color: "D97745", width: 1.25, dashType: "dash" } });
  s.addText([{ text: "INSERIR CAPTURA", options: { bold: true, color: BLUE, breakLine: true, fontSize: 12 } }, { text: label, options: { color: GREY, fontSize: 11 } }],
    { x: x + 0.1, y, w: w - 0.2, h, align: "center", valign: "middle", margin: 0, isTextBox: true });
}
function arrowRight(s, x, y, w, color = INK) {
  s.addShape(pres.shapes.LINE, { x, y, w, h: 0, line: { color, width: 2, endArrowType: "triangle" } });
}
function flowBox(s, x, y, w, h, head, sub, fill = ICE, headColor = NAVY, subColor = TXT, hs = 13) {
  if (headColor === AMBER || headColor === BLUE) headColor = fill === WHITE ? NAVY : WHITE;  // esquemas a preto e branco
  card(s, x, y, w, h, fill);
  s.addText([{ text: head, options: { bold: true, color: headColor, fontSize: hs, breakLine: !!sub } }, ...(sub ? [{ text: sub, options: { color: subColor, fontSize: 11 } }] : [])],
    { x: x + 0.08, y, w: w - 0.16, h, align: "center", valign: "middle", margin: 0, isTextBox: true });
}
function sideCard(s, x, y, w, h, title, items, dark = false, fsz = 12) {
  card(s, x, y, w, h, dark ? NAVY : ICE);
  s.addText(title, { x: x + 0.18, y: y + 0.12, w: w - 0.3, h: 0.35, fontSize: 14, bold: true, color: dark ? AMBER : NAVY, margin: 0, isTextBox: true });
  s.addText(bullets(items), { x: x + 0.18, y: y + 0.55, w: w - 0.3, h: h - 0.65, fontSize: fsz, color: dark ? WHITE : TXT, valign: "top", margin: 0, isTextBox: true });
}
function table(s, header, rows, { x = 0.5, y = 1.2, w = 9.0, colW, rowH = 0.36, fs = 12, headFill = NAVY, firstBold = true, mono = [] } = {}) {
  const H = header.map((t, j) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: Array.isArray(headFill) ? headFill[j] : headFill }, fontSize: fs + 1 } }));
  const data = [H, ...rows.map((r, i) => r.map((c, j) => ({ text: c, options: { fontSize: fs, bold: firstBold && j === 0, color: firstBold && j === 0 ? NAVY : TXT, fontFace: mono.includes(j) ? "Courier New" : "Calibri", fill: { color: i % 2 ? ALT : WHITE } } })))];
  s.addTable(data, { x, y, w, colW, rowH, border: { type: "solid", pt: 0.5, color: BORDER }, fontFace: "Calibri", valign: "middle", margin: TBL_MARGIN() });
}

// Diagrama de sequência (a partir dos esquemas Mermaid do guião)
function seq(s, { x = 0.5, y = 1.4, w = 6.4, h = 3.6, parts, msgs, foot }) {
  const n = parts.length, colW = w / n, cx = parts.map((_, i) => x + colW * (i + 0.5));
  const hh = 0.5, bw = Math.min(1.75, colW - 0.12);
  const bottom = y + h - (foot ? 0.38 : 0);
  parts.forEach((p, i) => {
    s.addShape(pres.shapes.LINE, { x: cx[i], y: y + hh, w: 0, h: bottom - y - hh, line: { color: RULE, width: 1, dashType: "dash" } });
    flowBox(s, cx[i] - bw / 2, y, bw, hh, p, null, i === 0 ? NAVY : ICE, i === 0 ? WHITE : NAVY, TXT, 11);
  });
  const rowH = (bottom - y - hh - 0.1) / msgs.length;
  msgs.forEach(([f, t, label, ret], i) => {
    const yy = y + hh + 0.1 + rowH * (i + 0.62);
    if (f === t) {
      const nw = Math.min(2.0, colW * 1.25);
      let nx = cx[f] - nw / 2; nx = Math.max(x, Math.min(nx, x + w - nw));
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: nx, y: yy - rowH * 0.42, w: nw, h: rowH * 0.78, rectRadius: 0.05, fill: { color: PAPER }, line: { color: RULE, width: 0.75 } });
      s.addText(label, { x: nx + 0.05, y: yy - rowH * 0.42, w: nw - 0.1, h: rowH * 0.78, fontSize: 10, color: TXT, align: "center", valign: "middle", margin: 0, isTextBox: true });
      return;
    }
    const x1 = Math.min(cx[f], cx[t]), x2 = Math.max(cx[f], cx[t]);
    const ln = { color: ret ? GREY : INK, width: 1.5 };
    if (ret) ln.dashType = "dash";
    if (cx[t] > cx[f]) ln.endArrowType = "triangle"; else ln.beginArrowType = "triangle";
    s.addShape(pres.shapes.LINE, { x: x1, y: yy, w: x2 - x1, h: 0, line: ln });
    s.addText(label, { x: x1 + 0.05, y: yy - 0.26, w: x2 - x1 - 0.1, h: 0.24, fontSize: 10, color: ret ? GREY : TXT, align: "center", valign: "bottom", margin: 0, isTextBox: true });
  });
  if (foot) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: bottom + 0.05, w, h: 0.3, rectRadius: 0.05, fill: { color: PAPER }, line: { color: RULE, width: 0.75 } });
    s.addText(foot, { x, y: bottom + 0.05, w, h: 0.3, fontSize: 10, color: TXT, align: "center", valign: "middle", margin: 0, isTextBox: true });
  }
}

// Analogias para quem não é técnico
const ANALOGIES = {
  AD: "O AD DS é a central: conhece todos os moradores e a senha de cada um.",
  KRB: "Dás a senha uma vez e recebes um passe temporário que abre as outras portas sem a repetir.",
  NTP: "O passe tem hora de validade: se o relógio da porta estiver errado, parece caducado.",
  SMB: "Um intérprete à porta: traduz o pedido do Linux para a língua do Windows.",
  WB: "Quem atende à porta do Linux e telefona ao Windows (via Samba) para confirmar a senha.",
  SSSD: "Quem atende à porta, confirma a senha com a central e toma nota: se o telefone falhar, ainda te reconhece.",
  PAM: "A própria porta: decide que perguntas faz (senha, código) antes de abrir.",
  GPO: "As regras afixadas na porta, enviadas pela central e iguais em todas as casas.",
  "2FA": "A porta pede a senha e, a seguir, um código que só o teu telemóvel conhece.",
};
function analogyBand(s, text, y, h = 0.5, x = 0.5, w = 9.0) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06, fill: { color: NOTE }, line: { color: "F59E0B", width: 1 } });
  s.addText([{ text: "Analogia:  ", options: { bold: true, color: "B45309" } }, { text, options: { color: TXT, italic: true } }],
    { x: x + 0.15, y, w: w - 0.3, h, fontSize: 12, valign: "middle", margin: 0, isTextBox: true });
}
// Cartão lateral dos diagramas de sequência: pontos-chave em cima, analogia em baixo
function seqSide(s, title, items, analogy) {
  sideCard(s, 7.1, 1.4, 2.4, 2.3, title, items);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.1, y: 3.85, w: 2.4, h: 1.15, rectRadius: 0.08, fill: { color: NOTE }, line: { color: "F59E0B", width: 1 } });
  s.addText([{ text: "Analogia", options: { bold: true, color: "B45309", breakLine: true } }, { text: analogy, options: { color: TXT, italic: true } }],
    { x: 7.22, y: 3.9, w: 2.16, h: 1.05, fontSize: 11, valign: "top", margin: 0, isTextBox: true });
}

// Slide-tipo 1 de cada tecnologia: O que é | Para que serve | Papel no projeto
function techSlide({ section, title, abbr, tag, what, why, role, key, notes }) {
  const s = newSlide(section, title);
  logoOrBadge(s, 8.75, 0.28, 0.75, LOGO_KEYS[abbr], abbr, BLUE, WHITE);
  tagline(s, tag);
  const cols = [
    { h: "O que é", items: what, fill: ICE, hc: BLUE, tc: TXT, n: "01" },
    { h: "Para que serve", items: why, fill: ICE, hc: BLUE, tc: TXT, n: "02" },
    { h: "Papel no nosso projeto", items: role, fill: NAVY, hc: AMBER, tc: WHITE, n: "03" },
  ];
  const w = 2.83, g = 0.25, y = 1.4, h = 2.3;
  cols.forEach((c, i) => {
    const x = 0.5 + i * (w + g);
    card(s, x, y, w, h, c.fill);
    s.addText([{ text: c.n + "  ", options: { color: c.hc } }, { text: c.h, options: { color: c.fill === NAVY ? WHITE : NAVY } }],
      { x: x + 0.2, y: y + 0.15, w: w - 0.3, h: 0.4, fontSize: 15, bold: true, valign: "middle", margin: 0, isTextBox: true });
    s.addText(bullets(c.items), { x: x + 0.2, y: y + 0.68, w: w - 0.35, h: h - 0.8, fontSize: 13, color: c.tc, valign: "top", margin: 0, isTextBox: true });
  });
  if (ANALOGIES[abbr]) analogyBand(s, ANALOGIES[abbr], 3.83);
  strip(s, "Chave:", key, true, 4.45, 0.55);
  s.addNotes(notes + (ANALOGIES[abbr] ? `\nAnalogia para explicar a quem não é técnico: ${ANALOGIES[abbr]}` : ""));
  return s;
}

// Slide-tipo 2 de cada tecnologia: Como funciona | Porquê no projeto | Alternativa
function howWhySlide({ section, title, abbr, tag, howTitle = "Como funciona", how, why, alt, notes }) {
  const s = newSlide(section, title);
  logoOrBadge(s, 8.75, 0.28, 0.75, LOGO_KEYS[abbr], abbr, NAVY, WHITE);
  tagline(s, tag);
  card(s, 0.5, 1.4, 5.4, 3.0, ICE);
  s.addText(howTitle, { x: 0.7, y: 1.5, w: 5.0, h: 0.35, fontSize: 15, bold: true, color: NAVY, margin: 0, isTextBox: true });
  how.forEach(([hd, d], i) => {
    const y = 1.95 + i * 0.6;
    badge(s, 0.7, y + 0.06, 0.38, String(i + 1), BLUE, WHITE, 12);
    s.addText([{ text: hd, options: { bold: true, color: NAVY, fontSize: 13, breakLine: true } }, { text: d, options: { color: TXT, fontSize: 11 } }],
      { x: 1.22, y, w: 4.55, h: 0.55, valign: "middle", margin: 0, isTextBox: true });
  });
  sideCard(s, 6.1, 1.4, 3.4, 3.0, "Porquê no nosso projeto?", why, true, 14);
  strip(s, "Alternativa considerada:", alt, false, 4.55, 0.5);
  s.addNotes(notes);
  return s;
}

// Seta entre dois pontos (x1 < x2); a ponta fica sempre no ponto da direita
function connector(s, x1, y1, x2, y2, color = BLUE) {
  const up = y2 < y1;
  s.addShape(pres.shapes.LINE, { x: x1, y: Math.min(y1, y2), w: x2 - x1, h: Math.max(Math.abs(y2 - y1), 0.001), flipV: up, line: { color, width: 1.5, endArrowType: "triangle" } });
}
// Caixa de ficheiro: nome em letra de código + pasta/função por baixo
function fileNode(s, x, y, w, h, name, sub, fill = WHITE) {
  card(s, x, y, w, h, fill);
  s.addText([{ text: name, options: { fontFace: "Courier New", bold: true, fontSize: 10.5, color: fill === WHITE ? NAVY : WHITE, breakLine: !!sub } },
             ...(sub ? [{ text: sub, options: { fontSize: 9.5, color: fill === WHITE ? GREY : LIGHT } }] : [])],
    { x: x + 0.1, y, w: w - 0.2, h, valign: "middle", margin: 0, isTextBox: true });
}
// Mapa de ficheiros, lido da esquerda para a direita:
// (1) configuração lida → (2) serviço → (3) o que fica guardado; em cima o servidor, em baixo quem o usa
function fileMap({ section, title, abbr, tag, center, top, left, right, bottom, notes }) {
  const s = newSlide(section, title);
  if (abbr) logoOrBadge(s, 8.75, 0.28, 0.75, LOGO_KEYS[abbr], abbr, NAVY, WHITE);
  tagline(s, tag);
  const group = (x, num, head, rows) => {
    card(s, x, 1.35, 3.0, 3.65, WHITE);
    badge(s, x + 0.15, 1.47, 0.36, num, INK, WHITE, 12);
    s.addText(head, { x: x + 0.6, y: 1.45, w: 2.3, h: 0.4, fontSize: 13, bold: true, color: NAVY, valign: "middle", margin: 0, isTextBox: true });
    const rh = Math.min(0.72, 3.0 / rows.length);
    rows.forEach(([n, d], i) => {
      const y = 1.95 + i * rh;
      if (i) s.addShape(pres.shapes.LINE, { x: x + 0.15, y, w: 2.7, h: 0, line: { color: BORDER, width: 0.75 } });
      s.addText([{ text: n, options: { fontFace: "Courier New", bold: true, fontSize: 11, color: INK, breakLine: !!d } }, ...(d ? [{ text: d, options: { fontSize: 10.5, color: TXT } }] : [])],
        { x: x + 0.15, y, w: 2.7, h: rh, valign: "middle", margin: 0, isTextBox: true });
    });
  };
  group(0.5, "1", "Configuração que o serviço lê", left);
  group(6.5, "3", "O que o serviço guarda", right);
  // setas principais do fluxo
  [3.6, 5.95].forEach((x) => s.addShape(pres.shapes.RIGHT_ARROW, { x, y: 2.95, w: 0.45, h: 0.4, fill: { color: INK }, line: { color: INK } }));
  // (2) serviço
  card(s, 4.1, 2.5, 1.8, 1.3, NAVY);
  s.addText([{ text: "2", options: { bold: true, fontSize: 11, color: LIGHT, breakLine: true } }, { text: center[0], options: { bold: true, fontSize: 15, color: WHITE, breakLine: true } }, { text: center[1], options: { fontSize: 10, color: LIGHT } }],
    { x: 4.15, y: 2.5, w: 1.7, h: 1.3, align: "center", valign: "middle", margin: 0, isTextBox: true });
  // em cima: com quem fala
  card(s, 3.7, 1.35, 2.6, 0.75, PAPER);
  s.addText([{ text: "FALA COM", options: { bold: true, fontSize: 9, color: INK, charSpacing: 2, breakLine: true } }, { text: top[0], options: { bold: true, fontSize: 12, color: NAVY, breakLine: true } }, { text: top[1], options: { fontSize: 10, color: TXT } }],
    { x: 3.75, y: 1.35, w: 2.5, h: 0.75, align: "center", valign: "middle", margin: 0, isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: 5.0, y: 2.1, w: 0, h: 0.4, line: { color: INK, width: 1.75, beginArrowType: "triangle", endArrowType: "triangle" } });
  // em baixo: quem o usa
  card(s, 3.7, 4.25, 2.6, 0.75, WHITE);
  s.addText([{ text: "QUEM O USA", options: { bold: true, fontSize: 9, color: INK, charSpacing: 2, breakLine: true } }, { text: bottom.map(([n, d]) => (d ? `${n} (${d})` : n)).join(" · "), options: { fontSize: 10.5, color: TXT } }],
    { x: 3.75, y: 4.25, w: 2.5, h: 0.75, align: "center", valign: "middle", margin: 0, isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: 5.0, y: 3.8, w: 0, h: 0.45, line: { color: GREY, width: 1.5, beginArrowType: "triangle" } });
  s.addNotes(notes);
  return s;
}

// Slide-tipo de ficheiros de um componente
function filesSlide({ section, title, abbr, tag, rows, code, codeTitle, notes, colW, fs }) {
  fs = fs || (code ? 10 : 11);
  const s = newSlide(section, title);
  if (abbr) logoOrBadge(s, 8.75, 0.28, 0.75, LOGO_KEYS[abbr], abbr, NAVY, WHITE);
  tagline(s, tag);
  const w = code ? 5.75 : 9.0;
  table(s, ["Ficheiro / ferramenta", "Responsabilidade"], rows, { x: 0.5, y: 1.4, w, colW: colW || (code ? [3.0, 2.75] : [4.2, 4.8]), rowH: 0.36, fs, mono: [0] });
  if (code) codeBox(s, 6.45, 1.4, 3.05, 3.6, code, 9.5, codeTitle);
  s.addNotes(notes);
  return s;
}

// Separador de secção
function divider(section, num, title, topics, presenter, notes) {
  const s = pres.addSlide({ masterName: "SECCAO", sectionTitle: section });
  s.addShape(pres.shapes.OVAL, { x: 6.7, y: 0.75, w: 3.9, h: 3.9, fill: { color: BLUE }, line: { color: BLUE } });
  s.addText(num, { x: 6.7, y: 0.75, w: 3.9, h: 3.9, fontSize: 96, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
  s.addText("SECÇÃO " + num, { x: 0.5, y: 1.0, w: 3.0, h: 0.35, fontSize: 13, bold: true, color: BLUE, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText(title, { x: 0.5, y: 1.4, w: 5.9, h: 1.05, fontSize: 30, bold: true, color: NAVY, valign: "top", margin: 0, isTextBox: true });
  s.addText(topics.join("  ·  "), { x: 0.5, y: 2.6, w: 5.9, h: 0.9, fontSize: 14, color: GREY, valign: "top", margin: 0, isTextBox: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 4.15, w: 3.6, h: 0.5, rectRadius: 0.25, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText([{ text: "Apresenta:  ", options: { color: AMBER, bold: true } }, { text: presenter, options: { color: WHITE } }],
    { x: 0.65, y: 4.15, w: 3.4, h: 0.5, fontSize: 14, valign: "middle", margin: 0, isTextBox: true });
  s.addNotes(notes);
  return s;
}

// =====================================================================
// ABERTURA (Aluno 1)
// =====================================================================
pres.addSection({ title: "Abertura" });
{
  const s = pres.addSlide({ masterName: "CAPA", sectionTitle: "Abertura" });
  s.addShape(pres.shapes.OVAL, { x: 6.9, y: -1.3, w: 4.6, h: 4.6, fill: { color: BLUE }, line: { color: BLUE } });
  s.addShape(pres.shapes.OVAL, { x: 8.3, y: 3.45, w: 1.5, h: 1.5, fill: { color: WHITE }, line: { color: BLUE, width: 4 } });
  [["Logótipo ISEC", 0.5], ["Logótipo IPC", 2.5]].forEach(([t, x]) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y: 0.35, w: 1.8, h: 0.7, fill: { color: WHITE }, line: { color: "A1A1AA", width: 1, dashType: "dash" } });
    s.addText(t, { x, y: 0.35, w: 1.8, h: 0.7, align: "center", valign: "middle", fontSize: 11, color: GREY, margin: 0, isTextBox: true });
  });
  s.addText("Integração de clientes Linux num domínio Windows AD DS", { x: 0.5, y: 1.25, w: 6.2, h: 1.25, fontSize: 30, bold: true, color: NAVY, valign: "bottom", margin: 0, isTextBox: true });
  s.addText("AD DS – Active Directory Domain Services", { x: 0.5, y: 2.5, w: 6.2, h: 0.3, fontSize: 13, italic: true, color: GREY, margin: 0, isTextBox: true });
  s.addText("Parte A – Workshop  |  Grupo 10", { x: 0.5, y: 2.85, w: 6.2, h: 0.4, fontSize: 18, color: BLUE, bold: true, margin: 0, isTextBox: true });
  s.addText([{ text: "Orlando Santos – a23134097@isec.pt", options: { breakLine: true } }, { text: "Pedro Ferreira – a2019141292@isec.pt", options: { breakLine: true } }, { text: "Renalto Baticã – a2022115534@isec.pt" }],
    { x: 0.5, y: 3.35, w: 6.2, h: 0.95, fontSize: 14, color: TXT, margin: 0, paraSpaceAfter: 3, isTextBox: true });
  s.addText(`Serviços de Rede II  ·  Docente: [Nome do docente]  ·  Ano letivo ${ANO}`, { x: 0.5, y: 4.5, w: 6.8, h: 0.35, fontSize: 12, color: GREY, margin: 0, isTextBox: true });
  s.addNotes(`[Apresenta: ${A1}]
Bom dia a todos. Somos o Grupo 10 e vamos apresentar a componente teórica da Parte A do nosso workshop: a integração de clientes Linux num domínio Windows gerido pelo Active Directory Domain Services, que abreviamos como AD DS.
Dividimos a apresentação em três blocos, um por cada elemento. Eu apresento o contexto e as tecnologias de base do domínio: AD DS, Kerberos, Chrony e Samba. O Pedro apresenta a integração do Linux (Winbind, SSSD, PAM e adsys), as componentes avançadas e a arquitetura. O Renalto explica os fluxos de autenticação, a comparação entre Winbind e SSSD, o lado Windows e a conclusão.
[Nota: substituir os retângulos tracejados pelos logótipos oficiais do ISEC e do IPC.]`);
}
{
  const s = newSlide("Abertura", "Índice");
  const items = [
    ["01", "Contexto, siglas e conceitos", "Porquê este trabalho, conceitos-chave e responsabilidades"],
    ["02", "Tecnologias de base do domínio", "AD DS, Kerberos, Chrony e Samba"],
    ["03", "Integração do Linux", "Winbind, SSSD, PAM, adsys e os seus ficheiros"],
    ["04", "Componentes avançadas e arquitetura", "2FA, alternativas, topologia e fluxo de informação"],
    ["05", "Fluxos de autenticação", "Kerberos, join, PAM, login SSSD/Winbind, pam_mount, NSS"],
    ["06", "Winbind vs SSSD e serviço Windows", "Comparação, utilizadores, acessos, permissões e GPO"],
    ["07", "Conclusão e referências", "Síntese, vantagens e bibliografia"],
  ];
  const w = 4.3, h = 0.78, gx = 0.4, gy = 0.18;
  items.forEach(([n, t, d], i) => {
    const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4;
    const x = 0.5 + col * (w + gx), y = 1.2 + row * (h + gy);
    card(s, x, y, w, h);
    s.addText(n, { x: x + 0.2, y, w: 0.7, h, fontSize: 24, bold: true, color: BLUE, valign: "middle", margin: 0, isTextBox: true });
    s.addText([{ text: t, options: { bold: true, color: NAVY, fontSize: 15, breakLine: true } }, { text: d, options: { color: GREY, fontSize: 11 } }],
      { x: x + 0.9, y, w: w - 1.05, h, valign: "middle", margin: 0, isTextBox: true });
  });
  s.addNotes(`[Apresenta: ${A1}]
Este é o roteiro. Começamos pelo contexto do trabalho e por um glossário das siglas, porque esta área usa muitas. Depois vêm as tecnologias de base do domínio e as de integração do Linux. Cada tecnologia tem dois slides: o primeiro diz o que é, para que serve e o seu papel no projeto; o segundo explica como funciona e porque a escolhemos.
Seguem-se as componentes avançadas, a arquitetura e o fluxo de informação. A seguir mostramos os fluxos de autenticação com os esquemas do nosso guião, a comparação entre Winbind e SSSD e o lado Windows. Terminamos com a conclusão e as referências.`);
}
{
  const s = newSlide("Abertura", "Glossário de siglas");
  s._noGloss = true;
  const left = [
    ["AD DS", "Active Directory Domain Services"], ["DC", "Domain Controller (controlador de domínio)"],
    ["DNS", "Domain Name System"], ["LDAP", "Lightweight Directory Access Protocol"],
    ["KDC", "Key Distribution Center (Kerberos)"], ["TGT / TGS", "Ticket Granting Ticket / Service"],
    ["SSO", "Single Sign-On"], ["NTP", "Network Time Protocol"],
    ["SMB / CIFS", "Server Message Block / Common Internet File System"], ["RPC", "Remote Procedure Call"],
    ["NetBIOS", "Network Basic Input/Output System"], ["SSSD", "System Security Services Daemon"],
  ];
  const right = [
    ["PAM", "Pluggable Authentication Modules"], ["NSS", "Name Service Switch"],
    ["SID / RID", "Security Identifier / Relative Identifier"], ["UID / GID", "User ID / Group ID (Linux)"],
    ["idmap", "Identity mapping: SID ↔ UID/GID"], ["GPO", "Group Policy Object"],
    ["OU", "Organizational Unit"], ["ADMX", "Administrative Template (XML) de GPO"],
    ["SYSVOL", "System Volume: pasta partilhada do DC"], ["NTFS", "New Technology File System"],
    ["2FA / MFA", "Two- / Multi-Factor Authentication"], ["TOTP", "Time-based One-Time Password"],
  ];
  table(s, ["Sigla", "Significado"], left, { x: 0.5, y: 1.15, w: 4.4, colW: [1.15, 3.25], rowH: 0.29, fs: 11 });
  table(s, ["Sigla", "Significado"], right, { x: 5.1, y: 1.15, w: 4.4, colW: [1.15, 3.25], rowH: 0.29, fs: 11 });
  s.addNotes(`[Apresenta: ${A1}]
Antes de avançar, um glossário com as siglas que vão aparecer ao longo da apresentação. Não vou ler todas, mas destaco as mais importantes.
O AD DS, Active Directory Domain Services, é o serviço de diretório da Microsoft, e o DC, Domain Controller, é o servidor que o aloja. O DNS resolve nomes, o LDAP é o protocolo de acesso ao diretório e o KDC, Key Distribution Center, é o servidor Kerberos que emite os tickets TGT e TGS.
Do lado Linux, o PAM, Pluggable Authentication Modules, trata da autenticação; o NSS, Name Service Switch, da identidade; e o SSSD, System Security Services Daemon, é um dos serviços de integração.
Os SID e RID são os identificadores do Windows, que o idmap converte nos UID e GID do Linux. As GPO, Group Policy Objects, são as políticas do domínio. Sempre que uma sigla aparecer pela primeira vez, apresentamo-la também por extenso.`);
}
{
  const s = newSlide("Abertura", "Contexto: porquê integrar o Linux no AD?");
  tagline(s, "Gestão centralizada de identidades numa rede mista Windows + Linux");
  card(s, 0.5, 1.4, 4.1, 2.85, ICE);
  s.addText("Sem integração", { x: 0.7, y: 1.5, w: 3.7, h: 0.4, fontSize: 16, bold: true, color: BAD, margin: 0, isTextBox: true });
  s.addText(bullets(["Contas locais criadas máquina a máquina", "Uma password diferente por computador", "Desativar um utilizador exige ir a todas as máquinas", "Permissões e políticas inconsistentes"]),
    { x: 0.7, y: 2.0, w: 3.75, h: 2.15, fontSize: 13, color: TXT, valign: "top", margin: 0, isTextBox: true });
  arrowRight(s, 4.7, 2.82, 0.5);
  card(s, 5.3, 1.4, 4.2, 2.85, NAVY);
  s.addText("Com o AD DS como fonte única", { x: 5.5, y: 1.5, w: 3.85, h: 0.4, fontSize: 16, bold: true, color: AMBER, margin: 0, isTextBox: true });
  s.addText(bullets(["Uma conta e uma password em toda a rede", "Grupos e permissões definidos num só sítio", "Login no Linux validado pelo Windows Server", "Políticas (GPO) também para o Ubuntu"]),
    { x: 5.5, y: 2.0, w: 3.85, h: 2.15, fontSize: 13, color: WHITE, valign: "top", margin: 0, isTextBox: true });
  strip(s, "Objetivo do trabalho:", "integrar dois clientes Ubuntu no domínio isec.local, um com SSSD e outro com Winbind, e comparar as duas vias.", false, 4.45, 0.55);
  s.addNotes(`[Apresenta: ${A1}]
Para justificar o tema, comecemos pelo problema. Numa organização com dezenas ou centenas de computadores, uns com Windows e outros com Linux, não é viável criar contas locais em cada máquina: cada utilizador acabaria com passwords diferentes e desativar alguém que sai da organização obrigaria a passar por todos os computadores. As permissões e as políticas ficariam inconsistentes.
A solução é ter uma fonte única de identidades, que nas empresas é quase sempre o Active Directory da Microsoft. Com o Linux integrado, o utilizador tem uma só conta e password, os grupos e as permissões são definidos num só sítio, o login no Linux é validado pelo Windows Server e até as políticas de grupo podem chegar ao Ubuntu.
O objetivo do nosso trabalho é exatamente este: integrar dois clientes Ubuntu no domínio isec.local, um com SSSD e outro com Winbind, e comparar as duas abordagens.`);
}
{
  const s = newSlide("Abertura", "Visão geral das tecnologias");
  tagline(s, "Do diretório central ao login no Linux: cada peça tem uma função");
  const techs = [
    ["AD", "Windows AD DS", "Active Directory Domain Services"], ["KRB", "Kerberos", "Autenticação por tickets (SSO)"],
    ["NTP", "Chrony", "Network Time Protocol"], ["SMB", "Samba", "Server Message Block"],
    ["WB", "Winbind", "Identidades AD via Samba"], ["SSSD", "SSSD", "System Security Services Daemon"],
    ["PAM", "PAM", "Pluggable Authentication Modules"], ["GPO", "adsys", "Group Policy Object no Ubuntu"],
    ["2FA", "2FA com PAM", "TOTP: Time-based One-Time Password"], ["+", "Alternativas", "authd · Entra ID · FreeIPA"],
  ];
  const w = 1.68, h = 1.6, g = 0.15;
  techs.forEach(([ab, n, d], i) => {
    const col = i % 5, row = Math.floor(i / 5);
    const x = 0.5 + col * (w + g), y = 1.4 + row * (h + 0.2);
    const adv = i >= 8;
    card(s, x, y, w, h, adv ? "F3F4F6" : ICE);
    logoOrBadge(s, x + (w - 0.62) / 2, y + 0.15, 0.62, LOGO_KEYS[ab], ab, adv ? ADV : NAVY, WHITE, ab.length > 3 ? 11 : 14);
    s.addText([{ text: n, options: { bold: true, color: NAVY, fontSize: 13, breakLine: true } }, { text: d, options: { color: GREY, fontSize: 11 } }],
      { x: x + 0.08, y: y + 0.82, w: w - 0.16, h: 0.72, align: "center", valign: "top", margin: 0, isTextBox: true });
  });
  s.addText([{ text: "■ ", options: { color: NAVY } }, { text: "Base do projeto      " }, { text: "■ ", options: { color: ADV } }, { text: "Componentes avançadas" }],
    { x: 0.5, y: 4.88, w: 6, h: 0.28, fontSize: 10, color: GREY, margin: 0, isTextBox: true });
  s.addNotes(`[Apresenta: ${A1}]
Este é o mapa geral. O Windows Server com o Active Directory Domain Services é o diretório central: guarda utilizadores, grupos e computadores. O Kerberos é o protocolo de autenticação do AD e depende do Chrony, que sincroniza os relógios pelo NTP, o Network Time Protocol.
Do lado Linux há duas formas de integração: o Winbind, que faz parte do Samba (a implementação livre do protocolo SMB, Server Message Block), e o SSSD, System Security Services Daemon. Ambos se ligam ao PAM, Pluggable Authentication Modules. O adsys aplica as GPO do AD ao Ubuntu.
A laranja estão as componentes avançadas: autenticação de dois fatores com códigos TOTP e as alternativas authd, Entra ID e FreeIPA.`);
}

{
  const s = newSlide("Abertura", "O domínio explicado: bater à porta");
  tagline(s, "Uma analogia para quem não é da área técnica");
  const items = [
    ["LOG", "Pedido de login", "Bater à porta: «sou o aluno.teste, deixa-me entrar»"],
    ["PAM", "PAM", "A porta: decide que senha pede antes de abrir"],
    ["WB", "SSSD / Winbind", "Quem atende o pedido e vai confirmar a senha"],
    ["AD", "AD DS", "A central: conhece os moradores e as senhas"],
    ["DNS", "DNS", "A morada: diz onde fica a central"],
    ["KRB", "Kerberos", "Passe temporário: dás a senha uma vez só"],
    ["NTP", "Chrony", "Relógio certo: um passe fora de horas não abre"],
    ["SMB", "Samba", "Intérprete entre a porta Linux e a central Windows"],
    ["GPO", "GPO / adsys", "Regras da central afixadas em todas as portas"],
    ["2FA", "2FA", "Senha + código do telemóvel nas portas importantes"],
  ];
  items.forEach(([ab, n, d], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.5 + col * 4.6, y = 1.4 + row * 0.72;
    card(s, x, y, 4.4, 0.6, i === 0 ? NAVY : ICE);
    badge(s, x + 0.1, y + 0.08, 0.44, ab, i === 0 ? AMBER : BLUE, i === 0 ? NAVY : WHITE, ab.length > 3 ? 9 : 11);
    s.addText([{ text: n + "  ", options: { bold: true, color: i === 0 ? AMBER : NAVY } }, { text: d, options: { color: i === 0 ? WHITE : TXT } }],
      { x: x + 0.65, y, w: 3.65, h: 0.6, fontSize: 12, valign: "middle", margin: 0, isTextBox: true });
  });
  s.addNotes(`[Apresenta: ${A1}]
Antes de entrar no detalhe técnico, uma analogia para quem não é da área: fazer login é como bater a uma porta.
Quando escrevemos o nome e a password, estamos a bater à porta e a dizer quem somos. A porta é o PAM: é ele que decide que perguntas faz antes de abrir, por exemplo a senha, ou a senha e um código. Quem atende o pedido é o SSSD ou o Winbind: não sabe as senhas de cor, por isso vai confirmar à central.
A central é o AD DS, que conhece todos os moradores e as respetivas senhas. Para lá chegar é preciso saber a morada, e é isso que o DNS dá. Quando a senha está certa, a central entrega um passe temporário, o ticket Kerberos, que abre as outras portas sem voltar a pedir a senha. Esse passe tem hora de validade, por isso os relógios têm de estar acertados, que é o trabalho do Chrony.
O Samba é o intérprete entre a porta Linux e a central Windows. As GPO e o adsys são as regras que a central afixa em todas as portas. E o 2FA é a porta mais importante, que pede a senha e ainda um código do telemóvel.
Vamos voltar a esta porta ao longo da apresentação.`);
}

{
  const s = newSlide("Abertura", "Quem faz o quê no projeto");
  tagline(s, "A responsabilidade de cada componente, e a pergunta a que responde");
  table(s, ["Componente", "Responsabilidade", "Pergunta a que responde"], [
    ["AD DS (Active Directory Domain Services)", "Guardar utilizadores, grupos e políticas", "«Quem existe?»"],
    ["DNS (Domain Name System)", "Localizar o DC e os seus serviços", "«Onde está o servidor?»"],
    ["Kerberos – KDC (Key Distribution Center)", "Provar a identidade com tickets", "«És mesmo quem dizes?»"],
    ["Chrony – NTP (Network Time Protocol)", "Manter a hora certa em todas as máquinas", "«Que horas são?»"],
    ["NSS + SSSD / Winbind", "Mostrar ao Linux os utilizadores e grupos do AD", "«Que UID e grupos tem?»"],
    ["PAM (Pluggable Authentication Modules)", "Decidir e preparar o login", "«Pode entrar agora?»"],
    ["pam_mount + SMB (Server Message Block)", "Ligar a partilha SRII ao utilizador", "«A que pastas acede?»"],
    ["adsys + GPO (Group Policy Object)", "Aplicar as políticas do AD ao Ubuntu", "«Que regras se aplicam?»"],
  ], { y: 1.4, colW: [3.5, 3.4, 2.1], rowH: 0.4, fs: 12 });
  s.addNotes(`[Apresenta: ${A1}]
Antes do detalhe, uma visão das responsabilidades: cada componente responde a uma pergunta diferente.
O AD DS, Active Directory Domain Services, responde a «quem existe?»: guarda os utilizadores, os grupos e as políticas. O DNS, Domain Name System, responde a «onde está o servidor?». O Kerberos, através do KDC (Key Distribution Center), responde a «és mesmo quem dizes?», emitindo tickets. O Chrony, que usa o NTP (Network Time Protocol), garante que todos concordam sobre a hora.
Do lado Linux, o NSS (Name Service Switch), com o SSSD ou o Winbind, responde a «que número de utilizador e que grupos tem esta pessoa?». O PAM (Pluggable Authentication Modules) responde a «pode entrar agora?». O pam_mount, com o protocolo SMB, responde a «a que pastas acede?». E o adsys aplica as GPO (Group Policy Objects), respondendo a «que regras se aplicam?».
Se o professor perguntar por que razão algo falhou, esta tabela ajuda a localizar o componente responsável.`);
}
{
  const s = newSlide("Abertura", "Conceitos-chave (1/2): domínio e diretório");
  table(s, ["Conceito", "O que significa", "No nosso projeto"], [
    ["Domínio", "Conjunto de máquinas e contas geridas em conjunto", "isec.local"],
    ["Floresta", "Topo da hierarquia do AD; agrupa um ou mais domínios", "Floresta isec.local (1 domínio)"],
    ["DC (Domain Controller)", "Servidor que guarda o AD e autentica os utilizadores", "SR2-SRV"],
    ["OU (Organizational Unit)", "«Pasta» do AD para organizar objetos e ligar GPO", "Proposta: OU Linux para os clientes"],
    ["Conta de computador", "Identidade da própria máquina no AD, criada no join", "UBUCLIENT$ e UBU-WINBIND$"],
    ["Registo SRV (DNS)", "Registo que indica onde está um serviço", "_kerberos._tcp.isec.local → SR2-SRV"],
    ["SYSVOL (System Volume)", "Pasta partilhada do DC com GPO e scripts", "\\\\isec.local\\SYSVOL"],
  ], { y: 1.2, colW: [2.4, 3.9, 2.7], rowH: 0.45, fs: 12 });
  s.addNotes(`[Apresenta: ${A1}]
Alguns conceitos que vão aparecer muitas vezes. Um domínio é um conjunto de máquinas e contas geridas em conjunto: o nosso é isec.local. A floresta é o topo da hierarquia do Active Directory e pode conter vários domínios; no nosso caso tem apenas um.
O DC, Domain Controller, é o servidor que guarda o AD e autentica os utilizadores: o SR2-SRV. Uma OU, Organizational Unit, é como uma pasta dentro do AD que serve para organizar objetos e, sobretudo, para lhes ligar políticas.
Quando um Linux entra no domínio, é criada uma conta de computador, com um cifrão no fim do nome, como UBUCLIENT$: é a identidade da própria máquina.
Um registo SRV do DNS diz onde está um serviço, por exemplo onde está o Kerberos de isec.local. E o SYSVOL, System Volume, é a pasta partilhada do DC onde ficam as GPO e os scripts.`);
}
{
  const s = newSlide("Abertura", "Conceitos-chave (2/2): identidade e autenticação");
  table(s, ["Conceito", "O que significa", "No nosso projeto"], [
    ["Realm (Kerberos)", "Nome do domínio Kerberos, em maiúsculas", "ISEC.LOCAL"],
    ["Ticket TGT / TGS", "«Bilhetes» temporários que provam a identidade", "TGT obtido no login ou com kinit"],
    ["Keytab", "Ficheiro com as chaves secretas da conta de computador", "/etc/krb5.keytab"],
    ["SID / RID", "Identificador único no Windows / a sua parte final", "S-1-5-21-…-1105 / 1105"],
    ["UID / GID", "Número do utilizador / grupo no Linux", "11105 (rid) ou gerado pelo SSSD"],
    ["idmap (identity mapping)", "Regra que converte SID em UID/GID", "Backend rid: 10000 + RID"],
    ["NSS (Name Service Switch)", "Indica onde o Linux procura utilizadores e grupos", "passwd: files sss | winbind"],
    ["Stack PAM", "Sequência de módulos que decide o login", "pam_unix → pam_sss | pam_winbind"],
  ], { y: 1.2, colW: [2.4, 3.9, 2.7], rowH: 0.42, fs: 12 });
  s.addNotes(`[Apresenta: ${A1}]
A segunda parte dos conceitos trata da identidade e da autenticação. O realm é o nome do domínio do ponto de vista do Kerberos, escrito em maiúsculas: ISEC.LOCAL. Os tickets TGT (Ticket Granting Ticket) e TGS (Ticket Granting Service) são bilhetes temporários que provam a identidade sem reenviar a password.
A keytab é um ficheiro que guarda as chaves secretas da conta de computador; é com ela que a máquina se autentica no DC sem intervenção humana.
O SID (Security Identifier) identifica cada objeto no Windows e a sua parte final é o RID (Relative Identifier). No Linux, utilizadores e grupos são números: UID e GID. O idmap é a regra que converte um no outro.
Por fim, o NSS (Name Service Switch) diz ao Linux onde procurar utilizadores e grupos, e a stack PAM é a sequência de módulos que decide se o login é aceite.`);
}

// =====================================================================
// BLOCO 1 – TECNOLOGIAS DE BASE (Aluno 1)// =====================================================================
// BLOCO 1 – TECNOLOGIAS DE BASE (Aluno 1)
// =====================================================================
const S1 = "Tecnologias de base";
pres.addSection({ title: S1 });
divider(S1, "01", "Tecnologias de base do domínio", ["AD DS", "Kerberos", "Chrony (NTP)", "Samba (SMB)"], A1,
  `[Apresenta: ${A1}]
Entramos no primeiro bloco: as tecnologias de base do domínio, ou seja, o que tem de existir e funcionar antes de qualquer cliente Linux se poder juntar. São quatro: o AD DS, o Kerberos, o Chrony e o Samba. Para cada uma vemos primeiro o que é, para que serve e o seu papel no projeto, e depois como funciona e porque a escolhemos.`);

techSlide({
  section: S1, title: "Windows Server AD DS", abbr: "AD",
  tag: "AD DS – Active Directory Domain Services: o diretório central da Microsoft",
  what: ["Serviço de diretório do Windows Server", "Base LDAP (Lightweight Directory Access Protocol)", "Integra DNS (Domain Name System) e Kerberos"],
  why: ["Gerir utilizadores e computadores centralmente", "Uma só conta em toda a rede", "Aplicar políticas através de GPO"],
  role: [`DC (Domain Controller) ${DC} de ${DOM}`, "Fornece DNS, KDC e LDAP", "Aloja a partilha SRII"],
  key: `Server Manager · dsa.msc (ADUC) · gpmc.msc · Install-ADDSForest -DomainName ${DOM}`,
  notes: `[Apresenta: ${A1}]
O Active Directory Domain Services é o serviço de diretório da Microsoft: uma base de dados hierárquica, acessível pelo protocolo LDAP (Lightweight Directory Access Protocol), que guarda os objetos da organização, ou seja, utilizadores, grupos, computadores e políticas. Integra o DNS (Domain Name System), essencial para os clientes encontrarem o controlador através de registos SRV, e o Kerberos como protocolo de autenticação.
Serve para centralizar a gestão de identidades: cada utilizador tem uma única conta e password, válidas em qualquer máquina do domínio.
No nosso projeto, o Windows Server ${DC} é promovido a Domain Controller do domínio ${DOM}. Fornece DNS, o KDC do Kerberos e LDAP, e aloja a partilha SRII.
[Captura sugerida: imagens/03-ad-dominio.png ou 04-ad-servicos.png.]`,
});
howWhySlide({
  section: S1, title: "AD DS: como funciona e porquê", abbr: "AD",
  tag: "Quatro serviços num só servidor",
  how: [
    ["Promoção a DC", `Cria a floresta e o domínio ${DOM}`],
    ["Base de dados NTDS (LDAP)", "Guarda utilizadores, grupos e computadores"],
    ["DNS integrado", "Publica registos SRV: _ldap e _kerberos"],
    ["KDC Kerberos", "Emite os tickets de autenticação"],
  ],
  why: ["Norma de facto nas empresas", "É o requisito central do tema", "DNS, LDAP e Kerberos num só servidor", "Consolas gráficas fáceis de demonstrar"],
  alt: "Samba AD DC ou FreeIPA – descartados: o objetivo é integrar o Linux num AD da Microsoft.",
  notes: `[Apresenta: ${A1}]
Como funciona o AD DS? Quando promovemos o servidor a Domain Controller, é criada a floresta e o domínio ${DOM}. Os objetos ficam guardados na base de dados NTDS, acessível por LDAP. O DNS integrado publica os registos SRV, como _ldap e _kerberos, que dizem aos clientes onde estão os serviços. E o KDC emite os tickets Kerberos.
Porquê o AD DS? Primeiro, porque é a norma de facto nas empresas: a maioria das organizações já tem um AD e é nele que o Linux tem de entrar. Segundo, porque é o requisito central do tema. Terceiro, porque junta DNS, LDAP e Kerberos num único servidor, o que simplifica o laboratório. E as consolas gráficas tornam a demonstração clara.
Considerámos o Samba como controlador de domínio e o FreeIPA, mas foram descartados porque o objetivo é integrar Linux num AD da Microsoft.`,
});
filesSlide({
  section: S1, title: "AD DS: ferramentas e ficheiros do servidor", abbr: "AD",
  tag: "Onde se gere o domínio no SR2-SRV",
  rows: [
    ["Server Manager", "Instalar as funções AD DS e DNS e promover a DC"],
    ["dsa.msc – ADUC (AD Users and Computers)", "Criar utilizadores, grupos e OU"],
    ["gpmc.msc – GPMC (Group Policy Management Console)", "Criar GPO e ligá-las a OU"],
    ["dnsmgmt.msc – Gestor de DNS", "Ver a zona isec.local e os registos SRV"],
    ["C:\\Windows\\NTDS\\ntds.dit", "Base de dados do AD (NTDS – NT Directory Services)"],
    ["C:\\Windows\\SYSVOL", "GPO e scripts partilhados com os clientes"],
    ["Pasta SRII (NTFS) + partilha \\\\SR2-SRV\\SRII", "Dados partilhados com permissões por grupo"],
    ["PowerShell (módulo ActiveDirectory)", "New-ADUser, New-ADGroup, New-SmbShare…"],
  ],
  colW: [4.4, 4.6], fs: 11,
  notes: `[Apresenta: ${A1}]
Do lado do servidor, estas são as ferramentas e os ficheiros que usamos. O Server Manager instala as funções AD DS e DNS e promove o servidor a controlador de domínio. A consola ADUC, Active Directory Users and Computers, cria utilizadores, grupos e OU. A GPMC, Group Policy Management Console, cria as políticas e liga-as às OU. O gestor de DNS permite confirmar a zona isec.local e os registos SRV.
Nos ficheiros, o ntds.dit é a base de dados do AD (NTDS significa NT Directory Services) e o SYSVOL guarda as GPO e os scripts partilhados com os clientes. A pasta SRII, com permissões NTFS, é exposta como a partilha \\\\SR2-SRV\\SRII.
Tudo isto pode ser automatizado em PowerShell, com comandos como New-ADUser, New-ADGroup e New-SmbShare.`,
});
techSlide({
  section: S1, title: "Kerberos", abbr: "KRB",
  tag: "Autenticação por tickets: TGT (Ticket Granting Ticket) e TGS (Ticket Granting Service)",
  what: ["Protocolo de autenticação em rede (RFC 4120)", "KDC (Key Distribution Center): AS + TGS", "A password nunca circula na rede"],
  why: ["SSO (Single Sign-On) com tickets", "Autenticação mútua cliente–servidor", "Base da autenticação no AD"],
  role: [`${DC} é o KDC do realm ISEC.LOCAL`, "Join, login e kinit usam Kerberos", "Validado com klist e Wireshark"],
  key: "/etc/krb5.conf · kinit aluno.teste@ISEC.LOCAL · klist · /etc/krb5.keytab",
  notes: `[Apresenta: ${A1}]
O Kerberos é o protocolo de autenticação usado pelo Active Directory, definido na RFC 4120. Funciona com um terceiro de confiança, o KDC (Key Distribution Center), que tem dois serviços: o AS (Authentication Service), que emite o TGT (Ticket Granting Ticket), e o TGS (Ticket Granting Service), que emite tickets para serviços concretos.
A password nunca é enviada pela rede: o cliente prova que a conhece usando-a como chave criptográfica. Com o TGT obtém depois tickets para outros serviços sem voltar a escrever a password, o que dá Single Sign-On (SSO).
No projeto, o ${DC} é o KDC do realm ISEC.LOCAL. O join ao domínio, o login e o kinit usam Kerberos, e capturámos estas trocas no Wireshark.`,
});
howWhySlide({
  section: S1, title: "Kerberos: como funciona e porquê", abbr: "KRB",
  tag: "Três trocas de mensagens até chegar ao serviço",
  how: [
    ["AS-REQ / AS-REP", "Login: o AS do KDC entrega o TGT"],
    ["TGS-REQ / TGS-REP", "Com o TGT pede-se um ticket de serviço"],
    ["AP-REQ", "O ticket é apresentado ao serviço (ex.: SMB)"],
    ["Validade limitada", "Tickets expiram (~10 h) e renovam-se"],
  ],
  why: ["É o protocolo nativo do AD", "A password não circula na rede", "SSO para SMB, SSH e LDAP", "Mais seguro do que o NTLM"],
  alt: "NTLM (NT LAN Manager) – legado e vulnerável a pass-the-hash; só usado na montagem CIFS.",
  notes: `[Apresenta: ${A1}]
O Kerberos funciona em três trocas. No login, o cliente envia um AS-REQ e o Authentication Service responde com o TGT. Depois, sempre que precisa de um serviço, apresenta o TGT ao Ticket Granting Service e recebe um ticket de serviço. Por fim apresenta esse ticket ao serviço, por exemplo ao servidor SMB, na mensagem AP-REQ. Os tickets têm validade limitada, tipicamente dez horas, e podem ser renovados.
Porquê o Kerberos? Porque é o protocolo nativo do AD: integrar no domínio significa falar Kerberos. A password não circula na rede, temos Single Sign-On para vários serviços e é muito mais seguro do que o NTLM.
A alternativa seria o NTLM (NT LAN Manager), um protocolo antigo vulnerável a ataques como o pass-the-hash. No nosso trabalho só aparece na montagem CIFS com a opção ntlmssp.`,
});
techSlide({
  section: S1, title: "Chrony – sincronização de tempo", abbr: "NTP",
  tag: "NTP (Network Time Protocol): relógios alinhados, requisito do Kerberos",
  what: ["Implementação moderna do protocolo NTP", "Daemon chronyd e cliente chronyc", "Converge rápido, ideal para VMs"],
  why: ["Manter os relógios das máquinas alinhados", "Evitar falhas Kerberos por desvio horário", "Registos com horas coerentes"],
  role: [`Clientes sincronizam com o ${DC}`, "W32Time: serviço de tempo do Windows", "Evita o erro «Clock skew too great»"],
  key: "chrony.conf → server <IP_DC> iburst · chronyc sources (^*) · chronyc tracking",
  notes: `[Apresenta: ${A1}]
O Chrony é uma implementação do NTP, o Network Time Protocol. É mais leve e converge mais depressa do que o ntpd clássico, o que o torna adequado para máquinas virtuais, cujo relógio tende a desviar-se. Tem o daemon chronyd e a ferramenta de consulta chronyc.
É um requisito crítico: os tickets Kerberos têm marcas temporais e o AD rejeita pedidos com mais de cinco minutos de diferença. Com o relógio desfasado, o join e os logins falham com o erro "Clock skew too great".
No projeto, os clientes apontam o Chrony para o IP do ${DC}, que responde através do W32Time, o serviço de tempo do Windows. A captura Kerberos-01-Relogios mostra este passo.`,
});
howWhySlide({
  section: S1, title: "Chrony: como funciona e porquê", abbr: "NTP",
  tag: "Do pedido NTP ao relógio corrigido",
  how: [
    ["Pedido NTP (UDP 123)", "O chronyd consulta o DC como fonte de tempo"],
    ["Medição", "Calcula o desvio (offset) e o atraso da rede"],
    ["Correção", "Ajusta gradualmente (slew) ou salta (makestep)"],
    ["Verificação", "chronyc sources marca a fonte ativa com ^*"],
  ],
  why: ["O Kerberos tolera no máximo 5 min", "Disponível nos repositórios Ubuntu", "Converge rápido em VMs", "O DC é a referência de tempo do domínio"],
  alt: "systemd-timesyncd – mais simples, mas com pouco diagnóstico; ntpd – solução legada.",
  notes: `[Apresenta: ${A1}]
O funcionamento é simples. O chronyd envia pedidos NTP ao DC, pela porta UDP 123. Com as respostas calcula o desvio do relógio local, o offset, e o atraso da rede. Depois corrige o relógio: gradualmente, com a técnica de slew, ou com um salto imediato, o makestep, quando o desvio é grande, como no arranque de uma VM. Com chronyc sources vemos a fonte ativa marcada com ^*.
Porquê o Chrony? Porque o Kerberos tolera no máximo cinco minutos, está disponível nos repositórios do Ubuntu, converge rapidamente em máquinas virtuais e permite usar o próprio DC como referência, que é a prática recomendada num domínio.
Considerámos o systemd-timesyncd, que já vem no Ubuntu, mas tem pouca capacidade de diagnóstico; o ntpd é uma solução legada.`,
});
fileMap({
  section: S1, title: "Mapa dos ficheiros: rede, tempo e Kerberos", abbr: "KRB",
  tag: "Como os ficheiros base do cliente se ligam ao DC (Domain Controller)",
  top: ["SR2-SRV (DC)", "DNS 53 · NTP 123 · KDC 88"],
  center: ["Cliente Linux", "resolved · chronyd · Kerberos"],
  left: [["NetworkManager", "perfil labX: IP e DNS = DC"], ["chrony.conf", "/etc/chrony · fonte de tempo"], ["krb5.conf", "/etc · realm e KDC"]],
  right: [["krb5.keytab", "/etc · chaves da máquina"], ["krb5cc_<UID>", "/tmp · tickets do utilizador"]],
  bottom: [["kinit", "klist"], ["SSSD", ""], ["winbindd", ""]],
  notes: `[Apresenta: ${A1}]
Este mapa mostra como os ficheiros base do cliente se relacionam. No centro está o cliente Linux, com o resolvedor de DNS, o chronyd e as bibliotecas Kerberos. À esquerda, o que é lido: o perfil do NetworkManager, que define o IP e o DNS; o chrony.conf, que define a fonte de tempo; e o krb5.conf, que define o realm e o KDC.
Em cima está o DC, com quem o cliente fala: DNS na porta 53, NTP na 123 e Kerberos na 88.
À direita, o que é guardado: a keytab, com as chaves da conta de computador, criada no join; e a cache de tickets do utilizador, em /tmp.
Em baixo, quem usa estes ficheiros: os comandos kinit e klist, e os serviços SSSD e winbindd. É por isso que estes ficheiros têm de estar certos antes de qualquer integração.`,
});
filesSlide({
  section: S1, title: "Ficheiros base do cliente: rede, tempo e Kerberos", abbr: "KRB",
  tag: "O que tem de estar certo antes de qualquer join (comum aos dois clientes)",
  rows: [
    ["NetworkManager (perfil labX)", "IP estático e DNS = IP do DC"],
    ["resolvectl status", "Confirma o servidor DNS em uso"],
    ["/etc/hosts e hostname", "Nome da máquina (FQDN – Fully Qualified Domain Name)"],
    ["/etc/chrony/chrony.conf", "Fonte de tempo: server <IP_DC> iburst"],
    ["/etc/krb5.conf", "Realm ISEC.LOCAL e localização do KDC"],
    ["/etc/krb5.keytab", "Chaves da conta de computador (criadas no join)"],
    ["/tmp/krb5cc_<UID>", "Cache de tickets do utilizador (klist)"],
  ],
  code: ["[libdefaults]", "  default_realm = ISEC.LOCAL", "  dns_lookup_kdc = true", "  rdns = false", "", "[realms]", "  ISEC.LOCAL = {", "    kdc = sr2-srv.isec.local", "  }"],
  codeTitle: "# /etc/krb5.conf",
  notes: `[Apresenta: ${A1}]
Estes ficheiros são comuns aos dois clientes e têm de estar corretos antes de qualquer join. No NetworkManager definimos o IP estático e, muito importante, o DNS a apontar para o DC; confirmamos com resolvectl status. O hostname e o /etc/hosts definem o nome completo da máquina, o FQDN (Fully Qualified Domain Name).
O chrony.conf aponta a fonte de tempo para o DC. O krb5.conf define o realm ISEC.LOCAL e diz como encontrar o KDC, que pode ser descoberto pelo DNS. A keytab, criada no join, guarda as chaves da conta de computador. E os tickets do utilizador ficam numa cache, tipicamente /tmp/krb5cc seguido do UID, que é o que vemos com klist.`,
});
techSlide({
  section: S1, title: "Samba", abbr: "SMB",
  tag: "SMB (Server Message Block) / CIFS (Common Internet File System) no Linux",
  what: ["Suite open-source do protocolo SMB/CIFS", "Inclui smbd, nmbd, winbindd e net", "Pode ser membro ou DC de domínio"],
  why: ["Partilhar ficheiros e impressoras com Windows", "Juntar máquinas Linux a um domínio AD", "Aceder a partilhas com smbclient ou CIFS"],
  role: [`Join do ${CLW} com net ads join`, "Acesso à partilha SRII do servidor", "Base sobre a qual o Winbind funciona"],
  key: `smb.conf · testparm -s · net ads join -U Administrator · smbclient -L //${DC}`,
  notes: `[Apresenta: ${A1}]
O Samba é uma reimplementação open-source do protocolo SMB (Server Message Block), também conhecido na sua versão antiga como CIFS (Common Internet File System). É o protocolo de partilha de ficheiros e impressoras do Windows.
Permite que Linux e Windows partilhem recursos e que um Linux se torne membro de um domínio Active Directory. O Samba pode até ser controlador de domínio, mas no nosso caso o DC é um Windows Server.
No projeto, o Samba é usado no cliente ${CLW} para fazer o join com net ads join e para aceder à partilha SRII. É também a base do Winbind, que o Pedro vai apresentar.`,
});
howWhySlide({
  section: S1, title: "Samba: componentes e porquê", abbr: "SMB", howTitle: "Componentes do Samba",
  tag: "Cada daemon do Samba tem uma função própria",
  how: [
    ["smbd", "Serve partilhas de ficheiros e impressoras SMB"],
    ["nmbd", "Nomes NetBIOS (Network Basic Input/Output System)"],
    ["winbindd", "Traduz utilizadores e grupos do AD para o Linux"],
    ["net / testparm", "Join ao domínio e validação do smb.conf"],
  ],
  why: ["Única implementação livre e madura de SMB", "Necessário para o Winbind", "Faz o join «clássico» com net ads", "Mostra a via tradicional de integração"],
  alt: "Só cifs-utils (cliente SMB) – monta partilhas, mas não faz join nem resolve identidades.",
  notes: `[Apresenta: ${A1}]
O Samba é composto por vários daemons. O smbd serve as partilhas de ficheiros e impressoras. O nmbd trata dos nomes NetBIOS (Network Basic Input/Output System), um sistema de nomes antigo que ainda limita os nomes de computador a 15 caracteres. O winbindd traduz os utilizadores e grupos do AD para o Linux. As ferramentas net e testparm fazem o join ao domínio e validam a configuração.
Porquê o Samba? Porque é a única implementação livre e madura do SMB, é indispensável para o Winbind e permite o join clássico com net ads join. Usá-lo no segundo cliente mostra a via tradicional de integração, que depois comparamos com o SSSD.
A alternativa seria usar apenas o cifs-utils, o cliente SMB do kernel. Monta partilhas, mas não faz join nem resolve identidades; no cliente SSSD é precisamente o que usamos para a SRII.`,
});

// =====================================================================
// BLOCO 2 – INTEGRAÇÃO DO LINUX + AVANÇADAS + ARQUITETURA (Aluno 2)
// =====================================================================
const S2 = "Integração do Linux";
pres.addSection({ title: S2 });
divider(S2, "02", "Integração do Linux e componentes avançadas", ["Winbind", "SSSD", "PAM", "adsys", "2FA", "Alternativas", "Arquitetura", "Fluxo de informação"], A2,
  `[Apresenta: ${A2}]
Obrigado, Orlando. Eu fico com o segundo bloco: as tecnologias que integram o Linux no domínio. Começo pelas duas vias de integração, o Winbind e o SSSD, passo pelo PAM e pelo adsys, depois pelas componentes avançadas e alternativas, e termino com a arquitetura do nosso laboratório e o fluxo de informação entre as máquinas.`);

techSlide({
  section: S2, title: "Winbind", abbr: "WB",
  tag: "A ponte entre identidades Windows e Linux, via Samba",
  what: ["Daemon winbindd do pacote Samba", "Usa RPC (Remote Procedure Call), LDAP e Kerberos", "Integra-se com o NSS e o PAM"],
  why: ["Mostrar utilizadores AD como contas Linux", "Converter SID (Security Identifier) em UID/GID", "Autenticar logins contra o AD"],
  role: [`Método do cliente ${CLW} (2.2)`, "Login com professor.teste", "idmap rid: UID = 10000 + RID"],
  key: "wbinfo -u · wbinfo -g · wbinfo -t · getent passwd professor.teste · id professor.teste",
  notes: `[Apresenta: ${A2}]
O Winbind é o daemon winbindd, que faz parte do Samba. É a ponte entre as identidades do Windows e as do Linux e comunica com o Domain Controller por RPC (Remote Procedure Call), LDAP e Kerberos.
O problema que resolve: o Windows identifica utilizadores e grupos por SID (Security Identifier), enquanto o Linux usa UID e GID numéricos. O Winbind faz esse mapeamento através do idmap e disponibiliza os utilizadores ao sistema pelo NSS (Name Service Switch) e pelo PAM. Para o Linux, um utilizador do AD passa a parecer uma conta local.
No projeto é o método do cliente ${CLW}. Usamos o backend rid, em que o UID é 10000 mais o RID do utilizador.`,
});
howWhySlide({
  section: S2, title: "Winbind: como funciona e porquê", abbr: "WB",
  tag: "Do pedido do sistema à conta Linux",
  how: [
    ["NSS → winbindd", "getent ou id perguntam pelo utilizador"],
    ["winbindd → DC", "Consulta o AD por RPC/LDAP e guarda em cache"],
    ["idmap rid", "SID → RID → UID = 10000 + RID"],
    ["pam_winbind", "Valida a password no domínio por Kerberos"],
  ],
  why: ["O tema pede as duas vias (CB3)", "Integração nativa com partilhas Samba", "UIDs determinísticos com rid", "Permite comparar com o SSSD"],
  alt: "nss-pam-ldapd (nslcd) – só LDAP, sem Kerberos integrado nem cache robusta.",
  notes: `[Apresenta: ${A2}]
O funcionamento do Winbind tem quatro passos. Quando um comando como getent ou id pergunta por um utilizador, o NSS encaminha o pedido para o winbindd. Este consulta o AD por RPC ou LDAP e guarda o resultado em cache. O idmap converte o SID em UID: com o backend rid, extrai o RID, a última parte do SID, e soma-lhe 10000. Na autenticação, o pam_winbind valida a password no domínio por Kerberos.
Porquê o Winbind? Porque o enunciado pede que conheçamos as duas vias de integração; porque se integra nativamente com as partilhas Samba; porque o rid dá UIDs determinísticos, iguais em todas as máquinas; e porque nos permite uma comparação real com o SSSD.
A alternativa seria o nss-pam-ldapd, que só fala LDAP, sem Kerberos integrado nem cache robusta.`,
});
fileMap({
  section: S2, title: "Winbind: mapa dos ficheiros", abbr: "WB",
  tag: "Cliente UBU-WINBIND: o que o winbindd lê, o que guarda e quem o usa",
  top: ["SR2-SRV (DC)", "RPC/SMB 445 · LDAP · Kerberos 88"],
  center: ["winbindd", "Samba · idmap rid"],
  left: [["smb.conf", "/etc/samba · domínio e idmap"], ["krb5.conf", "/etc · realm ISEC.LOCAL"], ["pam_winbind.conf", "/etc/security · regras de login"]],
  right: [["secrets.tdb", "…/samba/private · password da máquina"], ["winbindd_idmap.tdb", "/var/lib/samba · SID ↔ UID"], ["/var/cache/samba/", "cache de utilizadores e grupos"], ["log.winbindd", "/var/log/samba · diagnóstico"]],
  bottom: [["NSS", "winbind"], ["PAM", "pam_winbind"], ["wbinfo", "testes"]],
  notes: `[Apresenta: ${A2}]
Este é o mapa dos ficheiros do Winbind. No centro está o daemon winbindd. À esquerda, o que ele lê: o smb.conf, com o domínio e o mapeamento de IDs; o krb5.conf, com o realm; e o pam_winbind.conf, com as regras de login, como os grupos autorizados.
Em cima, o DC, com quem fala por RPC sobre SMB, LDAP e Kerberos.
À direita, o que guarda: o secrets.tdb, com a password da conta de computador; o winbindd_idmap.tdb, com os mapeamentos entre SID e UID; a cache em /var/cache/samba; e o log, para diagnóstico.
Em baixo, quem o usa: o NSS, para responder a getent e id; o PAM, através do pam_winbind, no login; e o comando wbinfo, para testes.
No slide seguinte está a tabela detalhada de cada ficheiro.`,
});
filesSlide({
  section: S2, title: "Winbind: ficheiros e responsabilidades", abbr: "WB",
  tag: "Cliente UBU-WINBIND: onde está cada peça da configuração",
  rows: [
    ["/etc/samba/smb.conf", "Domínio, realm, idmap e opções do winbind"],
    ["/var/lib/samba/private/secrets.tdb", "Password da conta de computador"],
    ["/var/lib/samba/winbindd_idmap.tdb", "Mapeamentos SID ↔ UID/GID (backend tdb)"],
    ["/var/cache/samba/", "Cache de utilizadores e grupos"],
    ["/etc/nsswitch.conf", "passwd / group: … winbind"],
    ["/etc/pam.d/common-*", "pam_winbind no login"],
    ["/etc/security/pam_winbind.conf", "Opções do login (ex.: grupos permitidos)"],
    ["/var/log/samba/log.winbindd", "Diagnóstico de erros"],
  ],
  code: ["testparm -s", "net ads testjoin", "wbinfo -t   # confiança", "wbinfo -u   # utilizadores", "wbinfo -g   # grupos", "getent passwd professor.teste", "systemctl status winbind"],
  codeTitle: "# Validar",
  notes: `[Apresenta: ${A2}]
Estes são os ficheiros do cliente Winbind. O smb.conf é o centro de tudo: define o domínio, o realm, o mapeamento de IDs e as opções do winbind. O secrets.tdb guarda a password da conta de computador criada pelo net ads join. O winbindd_idmap.tdb guarda os mapeamentos entre SID e UID ou GID gerados pelo backend tdb, e a pasta /var/cache/samba tem a cache de utilizadores e grupos.
A ligação ao sistema faz-se no nsswitch.conf, com a palavra winbind, e nas stacks common do PAM, com o pam_winbind. O pam_winbind.conf permite, por exemplo, restringir o login a um grupo do AD. Em caso de erro, o log.winbindd é o primeiro sítio a consultar.
À direita estão os comandos de validação que usamos no guião.`,
});
techSlide({
  section: S2, title: "SSSD", abbr: "SSSD",
  tag: "SSSD – System Security Services Daemon: identidade e autenticação modernas",
  what: ["Daemon de identidade criado pela Red Hat", "Fornecedores: ad, ldap, krb5 e ipa", "Configurado via realmd e adcli no Ubuntu"],
  why: ["Resolver identidades e autenticar no AD", "Cache de credenciais para login offline", "Mapeia IDs automaticamente a partir do SID"],
  role: [`Método do cliente ${CLS} (2.1)`, `Join com realm join ${DOM}`, "Base para pam_mount e adsys"],
  key: `sssd.conf · realm discover|join|list ${DOM} · sssctl domain-status`,
  notes: `[Apresenta: ${A2}]
O SSSD, System Security Services Daemon, foi desenvolvido pela Red Hat e é hoje a abordagem recomendada pela Canonical para integrar o Ubuntu no Active Directory. Tem fornecedores, chamados providers, para AD, LDAP, Kerberos e FreeIPA.
Tal como o Winbind, resolve identidades e autentica utilizadores, mas acrescenta uma cache de credenciais, que permite o login sem ligação ao DC, e um mapeamento de IDs automático a partir do SID.
No projeto é o método do cliente ${CLS}. O join é feito com realm join ${DOM}, que configura automaticamente o SSSD, o Kerberos e o PAM. Sobre esta base montamos a partilha SRII com o pam_mount.
[Captura sugerida: imagens/08-realm-join.png, saída do realm list.]`,
});
howWhySlide({
  section: S2, title: "SSSD: como funciona e porquê", abbr: "SSSD", howTitle: "Arquitetura interna",
  tag: "Um monitor e vários processos especializados",
  how: [
    ["sssd (monitor)", "Arranca e vigia os restantes processos"],
    ["sssd_be (backend AD)", "Fala com o DC por LDAP e Kerberos"],
    ["sssd_nss / sssd_pam", "Respondem ao NSS e ao PAM"],
    ["Cache LDB", "/var/lib/sss/db: login mesmo sem DC"],
  ],
  why: ["Recomendado pela Canonical e Red Hat", "realm join automatiza a configuração", "Cache e login offline", "Necessário para o adsys"],
  alt: "Winbind (comparado mais à frente) ou authd, quando a identidade está na cloud.",
  notes: `[Apresenta: ${A2}]
Por dentro, o SSSD é um conjunto de processos. O processo sssd é o monitor: arranca e vigia os restantes. O sssd_be é o backend do domínio AD e fala com o DC por LDAP e Kerberos. Os processos sssd_nss e sssd_pam respondem aos pedidos do NSS e do PAM. Tudo é guardado numa cache LDB em /var/lib/sss/db, que permite o login mesmo quando o DC não está acessível.
Porquê o SSSD como via principal? Porque é a solução recomendada pela Canonical e pela Red Hat; porque o realm join configura quase tudo automaticamente, reduzindo erros; pela cache e pelo login offline; e porque é obrigatório para o adsys.
As alternativas são o Winbind, que comparamos mais à frente, ou o authd, quando a identidade está na cloud.`,
});
fileMap({
  section: S2, title: "SSSD: mapa dos ficheiros", abbr: "SSSD",
  tag: "Cliente ubuclient: o que o sssd lê, o que guarda e quem o usa",
  top: ["SR2-SRV (DC)", "LDAP 389 · Kerberos 88"],
  center: ["sssd", "sssd_be · sssd_nss · sssd_pam"],
  left: [["sssd.conf", "/etc/sssd · chmod 600"], ["krb5.keytab", "/etc · identidade da máquina"], ["krb5.conf", "/etc · realm ISEC.LOCAL"]],
  right: [["/var/lib/sss/db/", "cache LDB · login offline"], ["/var/log/sssd/", "logs por domínio"]],
  bottom: [["NSS", "sss"], ["PAM", "pam_sss"], ["adsys", "identidade"]],
  notes: `[Apresenta: ${A2}]
O mapa do SSSD tem a mesma estrutura. No centro, o serviço sssd e os seus processos: o backend do domínio, o responder do NSS e o do PAM. À esquerda, o que lê: o sssd.conf, que tem de ter permissões 600; a keytab, que é a identidade da máquina perante o DC; e o krb5.conf.
Em cima, o DC, com quem fala por LDAP e Kerberos.
À direita, o que guarda: a cache em /var/lib/sss/db, que permite o login offline, e os logs em /var/log/sssd.
Em baixo, quem o usa: o NSS, o PAM através do pam_sss, e o adsys, que depende do SSSD para a identidade.
Comparando com o mapa do Winbind, repare-se que o SSSD tem menos ficheiros a gerir: grande parte é gerada pelo realm join.`,
});
filesSlide({
  section: S2, title: "SSSD: ficheiros e responsabilidades", abbr: "SSSD",
  tag: "Cliente ubuclient: o realm join gera quase tudo automaticamente",
  rows: [
    ["/etc/sssd/sssd.conf (chmod 600)", "Domínio, providers e controlo de acesso"],
    ["/etc/krb5.keytab", "Autentica a máquina no DC"],
    ["/var/lib/sss/db/", "Cache LDB: login offline"],
    ["/var/log/sssd/", "Logs por domínio (sssd_isec.local.log)"],
    ["/etc/nsswitch.conf", "passwd / group: … sss"],
    ["/etc/pam.d/common-*", "pam_sss no login"],
    ["realm list", "Mostra o domínio, o software e a política de login"],
  ],
  code: ["[sssd]", "domains = isec.local", "services = nss, pam", "", "[domain/isec.local]", "id_provider = ad", "access_provider = ad", "krb5_realm = ISEC.LOCAL", "cache_credentials = True", "use_fully_qualified_names = True", "fallback_homedir = /home/%u@%d"],
  codeTitle: "# /etc/sssd/sssd.conf",
  notes: `[Apresenta: ${A2}]
No cliente SSSD, o realm join gera quase tudo automaticamente. O ficheiro principal é o sssd.conf, que tem de ter permissões 600, ou o SSSD recusa-se a arrancar. Define o domínio, os providers (ad para identidade e acesso) e opções como cache_credentials, que ativa o login offline, use_fully_qualified_names, que obriga ao sufixo @isec.local, e fallback_homedir, que define a pasta pessoal.
A keytab autentica a máquina no DC. A cache fica em /var/lib/sss/db e os logs em /var/log/sssd, um ficheiro por domínio. A ligação ao sistema faz-se no nsswitch.conf, com a palavra sss, e nas stacks common do PAM, com o pam_sss. O comando realm list resume a configuração.`,
});
techSlide({
  section: S2, title: "PAM – Pluggable Authentication Modules", abbr: "PAM",
  tag: "O mecanismo modular que decide quem entra no Linux",
  what: ["Framework modular de autenticação do Linux", "Uma stack por serviço em /etc/pam.d", "Quatro tipos: auth, account, password, session"],
  why: ["Separar aplicações do método de autenticação", "Combinar password, Kerberos e OTP", "Preparar a sessão e a home do utilizador"],
  role: ["Liga o login ao SSSD ou ao Winbind", "pam_mkhomedir cria a home", "pam_mount monta a SRII no login"],
  key: "/etc/pam.d/common-auth · common-session · pam-auth-update --enable mkhomedir",
  notes: `[Apresenta: ${A2}]
O PAM, Pluggable Authentication Modules, é a camada do Linux que decide se um utilizador pode entrar. Aplicações como o login, o su, o sshd ou o GDM não verificam passwords diretamente: delegam no PAM.
Cada serviço tem uma stack de módulos em /etc/pam.d, organizada em quatro tipos: auth (quem és), account (podes entrar?), password (alteração da password) e session (preparar a sessão).
É esta modularidade que torna a integração possível: acrescentando o pam_sss ou o pam_winbind à stack, o Linux passa a autenticar no AD. No projeto usamos também o pam_mkhomedir, que cria a pasta pessoal no primeiro login, e o pam_mount, que monta a partilha SRII.
[Captura sugerida: imagens/12-pam-erro.png e 13-pam-resolvido.png.]`,
});
howWhySlide({
  section: S2, title: "PAM: flags de controlo e porquê", abbr: "PAM", howTitle: "Flags de controlo da stack",
  tag: "A ordem e as flags decidem o resultado do login",
  how: [
    ["required", "Tem de passar; se falhar, a stack continua mas o resultado é falha"],
    ["requisite", "Tem de passar; se falhar, termina logo"],
    ["sufficient", "Se passar, termina com sucesso (ex.: pam_unix)"],
    ["optional", "Só conta se for o único módulo daquele tipo"],
  ],
  why: ["Único ponto onde o login se estende", "Não é preciso alterar as aplicações", "Permite 2FA e pam_mount", "pam-auth-update evita erros manuais"],
  alt: "Nenhuma no Linux: todas as aplicações de login usam PAM; a escolha é que módulos ativar.",
  notes: `[Apresenta: ${A2}]
O comportamento da stack depende das flags de controlo. Pensem numa porta com vários trincos: um required é um trinco que tem de abrir, mas só se descobre no fim qual falhou; o requisite fecha a porta logo à primeira falha; o sufficient é a chave mestra que dispensa os restantes; e o optional é um trinco que só conta se for o único. Um módulo required tem de ter sucesso, mas, se falhar, a stack continua até ao fim para não revelar onde falhou. O requisite também é obrigatório, mas termina imediatamente. O sufficient termina com sucesso se passar: é assim que o pam_unix deixa entrar os utilizadores locais sem consultar o AD. O optional só conta se for o único módulo daquele tipo.
Porquê o PAM? Não há alternativa: é o único ponto onde o processo de login do Linux pode ser estendido sem alterar as aplicações. É também o que nos permite acrescentar o 2FA e o pam_mount. No Ubuntu usamos o pam-auth-update, que gera as stacks common-* de forma segura e evita bloquear o sistema com um erro de edição.`,
});
fileMap({
  section: S2, title: "PAM: mapa dos ficheiros", abbr: "PAM",
  tag: "Do pedido de login até à sessão aberta com a home e a SRII",
  top: ["SSSD ou winbindd", "valida a password no AD"],
  center: ["libpam", "auth · account · password · session"],
  left: [["common-*", "/etc/pam.d · stacks partilhadas"], ["sshd, login, gdm-password", "/etc/pam.d · stack por serviço"], ["pam_mount.conf.xml", "/etc/security · volumes"]],
  right: [["/home/<utilizador>", "criada pelo pam_mkhomedir"], ["~/SRII", "montada pelo pam_mount"], ["Sessão aberta", "ou acesso negado"]],
  bottom: [["login / su", ""], ["sshd", ""], ["gdm3", ""]],
  notes: `[Apresenta: ${A2}]
O mapa do PAM é um pouco diferente, porque o PAM é uma biblioteca e não um daemon. Em baixo estão as aplicações que pedem autenticação: login, su, sshd e o gestor gráfico gdm3. Todas chamam a libpam, no centro.
À esquerda, o que a libpam lê: as stacks partilhadas common, a stack de cada serviço e o pam_mount.conf.xml com os volumes a montar.
Em cima, a quem pergunta: ao SSSD ou ao winbindd, que validam a password no AD.
À direita, o resultado: a pasta pessoal criada pelo pam_mkhomedir, a partilha SRII montada pelo pam_mount, e, claro, a sessão aberta ou o acesso negado.`,
});
filesSlide({
  section: S2, title: "PAM e pam_mount: ficheiros e responsabilidades", abbr: "PAM",
  tag: "Os mesmos ficheiros nos dois clientes; muda apenas o módulo do domínio",
  rows: [
    ["/etc/pam.d/common-auth", "Autenticação: pam_unix + pam_sss | pam_winbind"],
    ["/etc/pam.d/common-account", "Autorização: a conta pode entrar?"],
    ["/etc/pam.d/common-password", "Alteração da password"],
    ["/etc/pam.d/common-session", "Sessão: pam_mkhomedir, pam_mount"],
    ["/etc/pam.d/sshd, login, gdm-password", "Stack de cada serviço (inclui as common-*)"],
    ["/usr/share/pam-configs/", "Perfis usados pelo pam-auth-update"],
    ["/etc/security/pam_mount.conf.xml", "Volumes a montar no login (SRII)"],
  ],
  code: ["session required pam_unix.so", "session optional pam_sss.so", "session optional pam_mkhomedir.so", "        skel=/etc/skel umask=0077", "session optional pam_mount.so"],
  codeTitle: "# /etc/pam.d/common-session",
  notes: `[Apresenta: ${A2}]
Os ficheiros do PAM são os mesmos nos dois clientes; só muda o módulo do domínio, pam_sss ou pam_winbind. Há quatro ficheiros common, um por tipo: auth para a autenticação, account para a autorização, password para a alteração da password e session para preparar a sessão, onde entram o pam_mkhomedir e o pam_mount.
Cada serviço, como o sshd, o login ou o GDM (GNOME Display Manager), tem a sua stack, que inclui estas common. Não as editamos à mão: o pam-auth-update usa os perfis em /usr/share/pam-configs para gerar as stacks de forma segura.
O pam_mount.conf.xml indica que volumes montar no login, no nosso caso a partilha SRII, com uma linha por utilizador.`,
});
techSlide({
  section: S2, title: "adsys – GPO no Ubuntu", abbr: "GPO",
  tag: "GPO (Group Policy Object): políticas do Active Directory aplicadas ao Ubuntu",
  what: ["Cliente de GPO da Canonical para Ubuntu", "Lê as GPO do SYSVOL (pasta partilhada do DC)", "Usa templates ADMX/ADML próprios"],
  why: ["Gerir Ubuntu como um cliente Windows", "Aplicar dconf, sudo e scripts", "Políticas por máquina e por utilizador"],
  role: [`Aplicaria GPO do ${DOM} ao ${CLS}`, "Requer SSSD como backend de identidade", "Fecha o ciclo da gestão centralizada"],
  key: "apt install adsys · adsysctl update --all · adsysctl policy applied",
  notes: `[Apresenta: ${A2}]
O adsys é o cliente de Group Policy da Canonical. Até aqui, o Linux autentica no AD mas continua a ser gerido localmente; o adsys muda isso. Lê as GPO (Group Policy Objects) publicadas no SYSVOL, a pasta partilhada do controlador, e aplica-as ao Ubuntu, como acontece num cliente Windows.
Para isso instalam-se no Windows Server os modelos administrativos ADMX e ADML do Ubuntu, que passam a aparecer na consola de gestão de políticas. É possível configurar o ambiente gráfico através do dconf, privilégios de sudo e scripts.
No projeto, o adsys aplica-se ao cliente com SSSD, o ${CLS}, porque depende do SSSD como backend.`,
});
howWhySlide({
  section: S2, title: "adsys: como funciona e porquê", abbr: "GPO",
  tag: "Da consola GPMC ao ambiente do Ubuntu",
  how: [
    ["Templates ADMX no DC", "Ubuntu aparece no editor de políticas"],
    ["GPO na GPMC", "Criada e ligada à OU (Organizational Unit)"],
    ["Download do SYSVOL", "adsys usa o ticket Kerberos da máquina"],
    ["Aplicação", "dconf, sudo e scripts no arranque e no login"],
  ],
  why: ["Sem ele o Ubuntu não recebe políticas", "Completa a gestão centralizada", "Ferramenta oficial da Canonical", "Paridade com os clientes Windows"],
  alt: "Ansible, Puppet ou scripts – funcionam, mas ficam fora do AD; parte do adsys exige Ubuntu Pro.",
  notes: `[Apresenta: ${A2}]
O adsys funciona em quatro passos. Primeiro instalam-se os modelos ADMX no DC, para o Ubuntu aparecer no editor de políticas. Depois cria-se a GPO na consola GPMC e liga-se à OU, a Organizational Unit, onde estão os computadores Linux. O adsys descarrega a GPO do SYSVOL, autenticando-se com o ticket Kerberos da máquina, e aplica as definições no arranque e no login: dconf, sudo e scripts.
Porquê o adsys? Porque, sem ele, o Ubuntu autentica no AD mas não recebe políticas. Completa a gestão centralizada, é a ferramenta oficial da Canonical e dá paridade com os clientes Windows.
Alternativas como o Ansible ou o Puppet funcionam, mas ficam fora do AD e exigem outra infraestrutura. Uma nota honesta: algumas funcionalidades do adsys, como os scripts e a gestão de privilégios, exigem a subscrição Ubuntu Pro.`,
});
{
  const s = newSlide(S2, "adsys: o que se pode gerir a partir do AD");
  logoOrBadge(s, 8.75, 0.28, 0.75, LOGO_KEYS.GPO, "GPO", NAVY, WHITE);
  tagline(s, "Políticas definidas na GPMC e aplicadas no Ubuntu pelo adsys");
  [["Ambiente gráfico", "dconf: fundo, bloqueio de ecrã, favoritos", "Livre"],
   ["Privilégios", "Administradores locais / sudo por grupo do AD", "Ubuntu Pro"],
   ["Scripts", "Arranque, login, logout e encerramento", "Ubuntu Pro"],
   ["Montagens de rede", "Partilhas SMB montadas por política", "Ubuntu Pro"],
   ["AppArmor", "Perfis de segurança das aplicações", "Ubuntu Pro"],
   ["Proxy e certificados", "Proxy do sistema e certificados da CA (Certificate Authority)", "Ubuntu Pro"]].forEach(([t, d, lic], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.5 + col * 3.05, y = 1.4 + row * 1.75;
    card(s, x, y, 2.85, 1.55, i === 0 ? NAVY : WHITE);
    s.addText([{ text: t, options: { bold: true, fontSize: 15, color: i === 0 ? WHITE : NAVY, breakLine: true } }, { text: d, options: { fontSize: 12, color: i === 0 ? LIGHT : TXT } }],
      { x: x + 0.18, y: y + 0.12, w: 2.5, h: 1.0, valign: "top", margin: 0, isTextBox: true });
    s.addText(lic, { x: x + 0.18, y: y + 1.12, w: 2.5, h: 0.3, fontSize: 10, bold: true, color: lic === "Livre" ? AMBER : BLUE, margin: 0, isTextBox: true });
  });
  s.addNotes(`[Apresenta: ${A2}]
O que é que o adsys permite gerir a partir do Active Directory? Seis áreas. O ambiente gráfico, através do dconf: o fundo do ecrã, o bloqueio automático e as aplicações favoritas. Os privilégios: quem é administrador local, ou seja, quem pode usar sudo, definido por grupo do AD. Os scripts de arranque, login, logout e encerramento. As montagens de partilhas de rede. Os perfis de segurança AppArmor. E as configurações de proxy e de certificados emitidos por uma CA (Certificate Authority).
Uma nota importante: na versão gratuita só o dconf está disponível; as restantes áreas exigem a subscrição Ubuntu Pro, que é gratuita para uso pessoal num número limitado de máquinas.`);
}
{
  const s = newSlide(S2, "adsys: como uma GPO chega ao Ubuntu");
  seq(s, {
    parts: ["Administrador (GPMC)", "DC: SYSVOL", "adsysd (ubuclient)", "Sistema Ubuntu"],
    msgs: [
      [0, 1, "Cria a GPO e liga-a à OU"], [2, 1, "Pede as GPO (SMB)"],
      [1, 2, "Registry.pol", true], [2, 2, "Guarda em /var/cache/adsys"],
      [2, 3, "Aplica dconf/sudo/scripts"], [3, 3, "Política ativa na sessão"],
    ],
    foot: "Forçar: adsysctl update --all  ·  Ver: adsysctl policy applied",
  });
  seqSide(s, "Atenção", ["Mover a máquina para uma OU (Computers não aceita GPO)", "Requer SSSD", "Parte exige Ubuntu Pro"], "A central afixa as regras (SYSVOL) e quem atende a porta (adsys) aplica-as em casa.");
  s.addNotes(`[Apresenta: ${A2}]
Este diagrama mostra o percurso de uma política até ao Ubuntu. O administrador cria a GPO na GPMC e liga-a a uma OU onde está a conta de computador do cliente. A GPO fica guardada no SYSVOL do controlador.
No arranque da máquina, ou no login de um utilizador, o daemon adsysd pede as GPO ao DC por SMB, autenticando-se com o ticket Kerberos da máquina ou do utilizador. Recebe os ficheiros Registry.pol das GPO aplicáveis e guarda-os em /var/cache/adsys. Depois converte-os em configurações do Ubuntu, como chaves dconf, regras de sudoers e scripts, e aplica-os.
Três cuidados. O contentor Computers, onde as contas ficam por omissão, não aceita GPO; é preciso mover a máquina para uma OU. O adsys exige o SSSD. E parte das políticas exige Ubuntu Pro.
Para forçar a atualização usamos adsysctl update --all, e para ver o que está aplicado, adsysctl policy applied.`);
}
fileMap({
  section: S2, title: "adsys: mapa dos ficheiros", abbr: "GPO",
  tag: "Da GPO no SYSVOL à configuração aplicada no Ubuntu",
  top: ["SR2-SRV: SYSVOL", "GPO (Registry.pol) · modelos ADMX"],
  center: ["adsysd", "aplica as GPO"],
  left: [["adsys.yaml", "/etc · configuração opcional"], ["Ticket Kerberos", "máquina / utilizador"], ["SSSD", "identidade e grupos"]],
  right: [["/var/cache/adsys/", "GPO descarregadas"], ["/etc/dconf/db/", "ambiente gráfico"], ["99-adsys-privilege…", "/etc/sudoers.d · privilégios"], ["Scripts", "arranque e login"]],
  bottom: [["adsysctl", "update · policy"], ["Arranque", "máquina"], ["Login", "utilizador"]],
  notes: `[Apresenta: ${A2}]
Por fim, o mapa do adsys. No centro, o daemon adsysd. À esquerda, o que precisa: a configuração opcional adsys.yaml, um ticket Kerberos da máquina ou do utilizador para aceder ao SYSVOL, e o SSSD para saber a identidade e os grupos.
Em cima, a origem das políticas: o SYSVOL do DC, com os ficheiros Registry.pol de cada GPO e os modelos ADMX.
À direita, o que escreve: a cache das GPO descarregadas, as definições dconf do ambiente gráfico, o ficheiro de privilégios em /etc/sudoers.d e os scripts.
Em baixo, o que o aciona: o comando adsysctl, o arranque da máquina e o login de cada utilizador.`,
});
filesSlide({
  section: S2, title: "adsys: ficheiros e responsabilidades", abbr: "GPO",
  tag: "Do SYSVOL no servidor à configuração no cliente",
  rows: [
    ["PolicyDefinitions (SYSVOL)", "Central store: Ubuntu.admx e .adml no servidor"],
    ["Policies\\{GUID}\\…\\Registry.pol", "Conteúdo de cada GPO no SYSVOL"],
    ["adsysd / adsysctl", "Serviço que aplica / comando de controlo"],
    ["/etc/adsys.yaml", "Configuração opcional do adsys"],
    ["/var/cache/adsys/", "GPO descarregadas (funciona offline)"],
    ["/etc/dconf/db/", "Definições do ambiente gráfico aplicadas"],
    ["/etc/sudoers.d/99-adsys-privilege-enforcement", "Privilégios definidos por GPO"],
  ],
  code: ["sudo apt install adsys", "sudo adsysctl update --all", "adsysctl policy applied", "adsysctl policy admx all", "journalctl -u adsysd"],
  codeTitle: "# Comandos úteis",
  colW: [3.1, 2.65], fs: 10.5,
  notes: `[Apresenta: ${A2}]
Os ficheiros do adsys dividem-se entre servidor e cliente. No servidor, os modelos Ubuntu.admx e .adml são copiados para o PolicyDefinitions do SYSVOL, o chamado central store, para aparecerem no editor de políticas. Cada GPO é uma pasta identificada por um GUID dentro de Policies, com o ficheiro Registry.pol.
No cliente, o adsysd é o serviço que aplica e o adsysctl é o comando de controlo. O adsys.yaml é uma configuração opcional. As GPO descarregadas ficam em /var/cache/adsys, o que permite aplicá-las mesmo sem rede. O resultado vai para o dconf e, no caso dos privilégios, para um ficheiro em /etc/sudoers.d.
O comando adsysctl policy admx all gera os modelos ADMX que depois copiamos para o servidor.`,
});
techSlide({
  section: S2, title: "Componente avançada: 2FA com PAM", abbr: "2FA",
  tag: "2FA (Two-Factor Authentication) com TOTP (Time-based One-Time Password)",
  what: ["Módulo pam_google_authenticator.so", "Códigos TOTP de 6 dígitos (RFC 6238)", "Segredo partilhado guardado por utilizador"],
  why: ["Exigir algo que se sabe e algo que se tem", "Mitigar roubo e reutilização de passwords", "Proteger acessos SSH críticos"],
  role: ["SSH pede password AD e código TOTP", "Configurado na stack PAM do sshd", "App móvel gera um código a cada 30 s"],
  key: "google-authenticator · /etc/pam.d/sshd → auth required pam_google_authenticator.so",
  notes: `[Apresenta: ${A2}]
Como componente avançada, a autenticação de dois fatores, 2FA (Two-Factor Authentication), através do PAM. Usamos o módulo pam_google_authenticator, que implementa o algoritmo TOTP (Time-based One-Time Password) da RFC 6238.
O utilizador passa a precisar de algo que sabe, a password do AD, e de algo que tem, o telemóvel com a aplicação que gera os códigos. Isto mitiga o roubo e a reutilização de passwords, sobretudo em acessos SSH.
No projeto, o SSH pede a password do AD e depois o código TOTP. Basta uma linha na stack PAM do sshd e ativar KbdInteractiveAuthentication no sshd_config.`,
});
howWhySlide({
  section: S2, title: "2FA: como funciona e porquê", abbr: "2FA",
  tag: "O código muda a cada 30 segundos e não viaja pela rede antes do login",
  how: [
    ["Registo", "google-authenticator gera segredo e código QR"],
    ["App móvel", "Guarda o segredo partilhado"],
    ["Cálculo", "Código = HMAC(segredo, hora / 30 s)"],
    ["Validação no PAM", "O servidor calcula o mesmo e compara"],
  ],
  why: ["Password sozinha é ponto único de falha", "Não exige servidor adicional", "Reutiliza a stack PAM já estudada", "Boa prática para SSH exposto"],
  alt: "Duo, RADIUS ou MFA do Entra ID – mais completos, mas exigem um serviço externo.",
  notes: `[Apresenta: ${A2}]
O TOTP funciona assim. No registo, o comando google-authenticator gera um segredo aleatório e mostra-o como código QR. A aplicação móvel guarda esse segredo. O código é calculado como um HMAC do segredo com a hora atual dividida em janelas de 30 segundos. No login, o módulo PAM faz o mesmo cálculo no servidor e compara: se coincidir, o segundo fator está validado. É por isso que o relógio sincronizado volta a ser importante.
Porquê? Uma password sozinha é um ponto único de falha. Esta solução não exige nenhum servidor adicional, reutiliza a stack PAM que já estudámos e é uma boa prática para acessos SSH expostos.
Soluções como o Duo, o RADIUS ou o MFA do Entra ID são mais completas, mas exigem um serviço externo.`,
});
{
  const s = newSlide(S2, "Outras componentes avançadas");
  badge(s, 8.75, 0.28, 0.75, "+", ADV, WHITE, 26);
  tagline(s, "Alternativas e evoluções da gestão de identidades");
  const cols = [
    ["authd", "Canonical", ["Login no Ubuntu com fornecedores cloud", "OIDC (OpenID Connect): Entra ID, Google", "MFA nativo via device code"], "Alternativa moderna ao SSSD para cenários cloud"],
    ["Entra ID", "Microsoft", ["AD da Microsoft na cloud (ex-Azure AD)", "Identidade híbrida com Entra Connect", "SSO e MFA para aplicações SaaS"], "Evolução natural do AD DS on-premises"],
    ["FreeIPA", "Red Hat / comunidade", ["Alternativa open-source ao AD DS", "389-DS, MIT Kerberos, DNS e CA", "HBAC (Host-Based Access Control) e sudo"], "Domínio 100 % Linux, com trust ao AD"],
  ];
  const w = 2.83, g = 0.25, y = 1.45, h = 3.55;
  cols.forEach(([n, v, it, rel], i) => {
    const x = 0.5 + i * (w + g);
    card(s, x, y, w, h);
    s.addText([{ text: n, options: { bold: true, fontSize: 18, color: NAVY, breakLine: true } }, { text: v, options: { fontSize: 11, color: GREY } }],
      { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: 0.65, margin: 0, valign: "top", isTextBox: true });
    s.addText(bullets(it), { x: x + 0.2, y: y + 0.9, w: w - 0.35, h: 1.6, fontSize: 13, color: TXT, valign: "top", margin: 0, isTextBox: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.15, y: y + h - 0.95, w: w - 0.3, h: 0.8, rectRadius: 0.06, fill: { color: NAVY }, line: { color: NAVY } });
    s.addText(rel, { x: x + 0.25, y: y + h - 0.95, w: w - 0.5, h: 0.8, fontSize: 12, color: WHITE, valign: "middle", margin: 0, isTextBox: true });
  });
  s.addNotes(`[Apresenta: ${A2}]
Para completar o panorama, três alternativas que estudámos do ponto de vista teórico.
O Canonical authd permite fazer login no Ubuntu com fornecedores de identidade na cloud, como o Microsoft Entra ID ou o Google, através de OIDC (OpenID Connect), com MFA integrado. É a alternativa moderna ao SSSD quando não há um AD local.
O Microsoft Entra ID, antigo Azure AD, é o serviço de identidade da Microsoft na cloud. Pode funcionar em modo híbrido, sincronizado com o AD DS local através do Entra Connect, e oferece SSO e MFA para aplicações SaaS (Software as a Service).
O FreeIPA é a alternativa open-source ao AD DS para ambientes Linux: junta o servidor LDAP 389-DS, o MIT Kerberos, DNS e uma CA (Certificate Authority), com políticas HBAC (Host-Based Access Control) e sudo centralizadas.`);
}
{
  const s = newSlide(S2, "Alternativas: porque não as usámos");
  table(s, ["Tecnologia", "Quando faz sentido", "Porque não no nosso projeto"], [
    ["Canonical authd", "Identidades na cloud (Entra ID, Google)", "Exige tenant cloud; o laboratório usa AD local"],
    ["Microsoft Entra ID", "Organizações cloud ou híbridas", "Serviço pago e externo ao Proxmox"],
    ["FreeIPA", "Rede 100 % Linux", "O tema é integrar Linux num AD Windows"],
    ["Samba AD DC", "AD sem licenças Windows", "Queremos o AD DS real da Microsoft"],
    ["nss-pam-ldapd", "Diretórios LDAP simples", "Sem Kerberos integrado nem cache"],
  ], { colW: [2.1, 3.3, 3.6], rowH: 0.48, fs: 12 });
  strip(s, "Decisão:", "AD DS + SSSD como via principal e Winbind como via comparativa; as restantes ficam como estudo teórico.", false, 4.45, 0.55);
  s.addNotes(`[Apresenta: ${A2}]
Este slide justifica as escolhas que não fizemos. O authd faz sentido quando as identidades estão na cloud, mas exige um tenant cloud e o nosso laboratório usa um AD local. O Entra ID serve organizações cloud ou híbridas, mas é um serviço pago e externo ao Proxmox. O FreeIPA é excelente para redes só com Linux, mas o tema é precisamente integrar Linux num AD Windows. O Samba como controlador de domínio evita licenças Windows, mas queríamos o AD DS real da Microsoft. O nss-pam-ldapd serve diretórios LDAP simples, mas não tem Kerberos integrado nem cache.
A decisão foi usar o AD DS com o SSSD como via principal e o Winbind como via comparativa. As restantes tecnologias ficam como estudo teórico.`);
}
{
  const s = newSlide(S2, "Arquitetura do trabalho prático");
  tagline(s, `VLAN X · 192.168.X.0/24 (bridge no Proxmox) · domínio ${DOM}`);
  card(s, 1.75, 1.35, 3.0, 1.05, NAVY);
  s.addText([{ text: `Windows Server – ${DC}.${DOM}`, options: { bold: true, fontSize: 13, color: WHITE, breakLine: true } },
             { text: "<IP_DC>", options: { fontSize: 11, color: LIGHT, fontFace: "Courier New", breakLine: true } },
             { text: "AD DS · DNS · KDC · Partilha SRII", options: { fontSize: 11, color: LIGHT } }],
    { x: 1.85, y: 1.35, w: 2.8, h: 1.05, align: "center", valign: "middle", margin: 0, isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: 0.6, y: 2.85, w: 5.4, h: 0, line: { color: GREY, width: 3 } });
  s.addShape(pres.shapes.LINE, { x: 3.25, y: 2.4, w: 0, h: 0.45, line: { color: GREY, width: 2 } });
  s.addText("Gateway 192.168.X.1 → Internet", { x: 3.6, y: 2.55, w: 2.45, h: 0.25, fontSize: 10, color: GREY, align: "right", margin: 0, isTextBox: true });
  [[0.6, "Cliente SSSD (2.1)", `${CLS} · <IP_CLIENTE>`, "Kerberos · SSSD · PAM · pam_mount"],
   [3.4, "Cliente Winbind (2.2)", `${CLW} · <IP_CLIENTE_WB>`, "Kerberos · Samba · Winbind · PAM"]].forEach(([x, t, h1, h2]) => {
    s.addShape(pres.shapes.LINE, { x: x + 1.3, y: 2.85, w: 0, h: 0.45, line: { color: GREY, width: 2 } });
    card(s, x, 3.3, 2.6, 1.1, ICE);
    s.addText([{ text: t, options: { bold: true, fontSize: 13, color: NAVY, breakLine: true } }, { text: h1, options: { fontSize: 11, color: TXT, breakLine: true } }, { text: h2, options: { fontSize: 11, color: NAVY, bold: true } }],
      { x: x + 0.08, y: 3.3, w: 2.44, h: 1.1, align: "center", valign: "middle", margin: 0, isTextBox: true });
  });
  s.addText("Os dois clientes nascem do mesmo template UbuntuClient", { x: 0.6, y: 4.55, w: 5.4, h: 0.3, fontSize: 11, italic: true, color: GREY, align: "center", margin: 0, isTextBox: true });
  sideCard(s, 6.35, 1.35, 3.15, 3.65, "Regras do laboratório", [
    "Só uma variante ativa por cliente: SSSD ou Winbind",
    "DNS dos clientes = <IP_DC>",
    "Templates já trazem todas as dependências",
    "Nome NetBIOS ≤ 15 caracteres (ubuclient)",
    "Firewall do DC só aceita os IPs dos clientes",
  ]);
  s.addNotes(`[Apresenta: ${A2}]
Esta é a arquitetura do laboratório, o mesmo esquema do guião. Cada aluno trabalha numa VLAN própria do Proxmox, 192.168.X.0/24, com o gateway 192.168.X.1.
No centro está o Windows Server ${DC}, Domain Controller do domínio ${DOM}, que acumula o AD DS, o DNS, o KDC Kerberos e a partilha SRII.
Temos dois clientes Ubuntu, clonados do mesmo template, para comparar as duas abordagens: o ${CLS}, integrado com SSSD (secção 2.1 do guião), e o ${CLW}, integrado com Samba e Winbind (secção 2.2).
À direita, as regras que fazem a integração funcionar. A mais importante: SSSD e Winbind nunca ficam ativos ao mesmo tempo na mesma máquina. Além disso, o DNS dos clientes tem de ser o DC e o nome NetBIOS não pode ter mais de 15 caracteres.
[Os IPs são placeholders do guião (ex.: DC 192.168.105.2, SSSD .3, Winbind .4). Alternativa: imagens/01-topologia.png.]`);
}
{
  const s = newSlide(S2, "Fluxo de informação entre as VMs");
  tagline(s, "Que protocolos circulam entre os clientes Linux e o DC, e para quê");
  card(s, 0.5, 1.4, 1.75, 3.6, ICE);
  s.addText([{ text: "Clientes Linux", options: { bold: true, fontSize: 14, color: NAVY, breakLine: true } }, { text: CLS, options: { fontSize: 11, color: TXT, breakLine: true } }, { text: CLW, options: { fontSize: 11, color: TXT } }],
    { x: 0.55, y: 1.4, w: 1.65, h: 3.6, align: "center", valign: "middle", margin: 0, isTextBox: true });
  card(s, 7.75, 1.4, 1.75, 3.6, NAVY);
  s.addText([{ text: DC, options: { bold: true, fontSize: 14, color: WHITE, breakLine: true } }, { text: "Domain Controller", options: { fontSize: 11, color: LIGHT, breakLine: true } }, { text: DOM, options: { fontSize: 11, color: LIGHT } }],
    { x: 7.8, y: 1.4, w: 1.65, h: 3.6, align: "center", valign: "middle", margin: 0, isTextBox: true });
  [["DNS · 53", "Localizar o DC (registos SRV)", "1"], ["NTP · 123", "Acertar a hora (Kerberos ≤ 5 min)", "2"],
   ["Kerberos · 88", "Tickets: join, login e kinit", "3"], ["LDAP · 389", "Utilizadores e grupos (SSSD)", "4"],
   ["RPC/SMB · 445", "Winbind e partilha SRII (pam_mount)", "5"]].forEach(([p, d, n], i) => {
    const y = 1.48 + i * 0.7;
    s.addShape(pres.shapes.LINE, { x: 2.27, y: y + 0.27, w: 0.28, h: 0, line: { color: INK, width: 1.75, beginArrowType: "triangle", endArrowType: "triangle" } });
    s.addShape(pres.shapes.LINE, { x: 7.45, y: y + 0.27, w: 0.28, h: 0, line: { color: INK, width: 1.75, beginArrowType: "triangle", endArrowType: "triangle" } });
    card(s, 2.6, y, 4.8, 0.54, ICE);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 2.7, y: y + 0.09, w: 1.45, h: 0.36, rectRadius: 0.06, fill: { color: NAVY }, line: { color: NAVY } });
    s.addText(`${n}  ${p}`, { x: 2.7, y: y + 0.09, w: 1.45, h: 0.36, fontSize: 11, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(d, { x: 4.3, y, w: 3.0, h: 0.54, fontSize: 12, color: TXT, valign: "middle", margin: 0, isTextBox: true });
  });
  s.addNotes(`[Apresenta: ${A2}]
Este slide resume o fluxo de informação entre as máquinas, pela ordem em que acontece numa integração. Na analogia da porta: primeiro procuramos a morada da central (DNS), acertamos o relógio (NTP), damos a senha e recebemos o passe (Kerberos), consultamos a lista de moradores (LDAP) e, por fim, abrimos o armário partilhado (SMB).
Primeiro o DNS, na porta 53: os clientes perguntam ao DC onde estão os serviços LDAP e Kerberos do domínio, através dos registos SRV. Segundo, o NTP, na porta 123, para acertar a hora. Terceiro, o Kerberos, na porta 88, usado no join, em cada login e no kinit.
Depois, as identidades. O SSSD pesquisa utilizadores e grupos por LDAP, na porta 389. O Winbind fala com o DC por RPC sobre SMB, na porta 445, que é também a porta usada para montar a partilha SRII.
É por isso que a firewall do DC tem de permitir estas portas a partir dos IPs dos clientes. Passo agora a palavra ao Renalto, que vai detalhar cada um destes fluxos.`);
}

// =====================================================================
// BLOCO 3 – FLUXOS, COMPARAÇÃO, WINDOWS E CONCLUSÃO (Aluno 3)
// =====================================================================
const S3 = "Fluxos e autenticação";
pres.addSection({ title: S3 });
divider(S3, "03", "Fluxos de autenticação, comparação e serviço Windows", ["Kerberos", "Join ao domínio", "PAM", "Login SSSD e Winbind", "pam_mount", "NSS", "Winbind vs SSSD", "AD, permissões e GPO"], A3,
  `[Apresenta: ${A3}]
Obrigado, Pedro. No terceiro bloco vou mostrar, com os esquemas do nosso guião, o que acontece passo a passo: como se obtém um ticket Kerberos, como se faz o join ao domínio, como o PAM se integra e como um utilizador do AD faz login nos dois clientes. Depois comparo o Winbind e o SSSD, mostro o lado Windows e termino com a conclusão.`);
{
  const s = newSlide(S3, "Kerberos: obter o ticket (TGT)");
  seq(s, {
    parts: ["Ubuntu (kinit)", `DNS ${DC}:53`, `KDC ${DC}:88`],
    msgs: [
      [0, 1, "SRV _kerberos._tcp.isec.local?"], [1, 0, `${DC}.${DOM}`, true],
      [0, 2, "AS-REQ aluno.teste@ISEC.LOCAL"], [2, 0, "Pré-autenticação necessária", true],
      [0, 2, "AS-REQ com prova da password"], [2, 0, "AS-REP com TGT (krbtgt/ISEC.LOCAL)", true],
      [0, 0, "Guarda o TGT na cache (klist)"],
    ],
  });
  seqSide(s, "Pontos-chave", ["A password nunca viaja na rede", "Pré-autenticação trava ataques offline", "Captura: Kerberos-02-Login"], "Dás a senha à porta da central uma vez e recebes um passe (TGT) para as outras portas.");
  s.addNotes(`[Apresenta: ${A3}]
Este é o esquema do guião para a obtenção de um ticket Kerberos com o comando kinit.
O Ubuntu começa por perguntar ao DNS onde está o KDC do realm ISEC.LOCAL, através do registo SRV _kerberos._tcp. O DNS responde com ${DC}.${DOM}.
Segue-se o pedido AS-REQ para o utilizador aluno.teste. O KDC responde que é necessária pré-autenticação, uma proteção contra ataques offline à password. O cliente envia então um novo AS-REQ com um carimbo temporal cifrado com a chave derivada da password, o que prova que a conhece sem a enviar.
O KDC devolve o AS-REP com o TGT, que o cliente guarda na cache e que podemos ver com klist. É exatamente o tráfego que capturámos no Wireshark.`);
}
{
  const s = newSlide(S3, "Join ao domínio: realm join (SSSD)");
  seq(s, {
    parts: ["Ubuntu (realm/adcli)", "DNS :53", "KDC :88", "LDAP :389"],
    msgs: [
      [0, 1, "realm discover (SRV)"], [1, 0, `${DC} (active-directory)`, true],
      [0, 2, "Autentica Administrator"], [2, 0, "Ticket do Administrator", true],
      [0, 3, "Cria conta de computador UBUCLIENT"], [3, 0, "Conta criada", true],
      [0, 0, "Keytab + sssd.conf; arranca o SSSD"],
    ],
  });
  seqSide(s, "No Winbind (2.2)", ["net ads join autentica o Administrator", "Cria a conta UBU-WINBIND", "Password em secrets.tdb"], "Antes de atender pedidos, a casa nova regista-se na central e recebe a sua própria chave (keytab).");
  s.addNotes(`[Apresenta: ${A3}]
Agora o join ao domínio no cliente SSSD, o esquema 2.1.6 do guião.
O realm discover consulta o DNS pelos registos SRV de LDAP e Kerberos e descobre que ${DOM} é um domínio Active Directory servido pelo ${DC}. No realm join, o adcli autentica-se como Administrator por Kerberos e recebe um ticket. Com esse ticket cria, por LDAP, a conta de computador UBUCLIENT no AD.
No fim, o realm gera a keytab da máquina, o ficheiro que guarda as suas chaves Kerberos, e o sssd.conf, e arranca o SSSD.
No cliente Winbind o processo é equivalente: testamos o Kerberos com kinit, o net ads join autentica o Administrator e cria a conta UBU-WINBIND, e a password da máquina fica em secrets.tdb.
[Captura: SR2-2627-Workshop-Grp10-Kerberos-04-Join-Dominio.pcapng.]`);
}
{
  const s = newSlide(S3, "Como o Samba se integra");
  tagline(s, `Do DNS à conta de computador no AD: o cliente ${CLW}`);
  const st = [["1", "DNS", "aponta para o DC"], ["2", "Tempo + Kerberos", "chrony e krb5.conf"], ["3", "smb.conf", "security = ADS"], ["4", "net ads join", `conta ${CLW}`]];
  st.forEach(([n, h, d], i) => {
    const x = 0.5 + i * 2.33;
    flowBox(s, x, 1.45, 2.0, 1.0, `${n}. ${h}`, d, i === 3 ? NAVY : ICE, i === 3 ? AMBER : NAVY, i === 3 ? WHITE : TXT);
    if (i < 3) arrowRight(s, x + 2.04, 1.95, 0.25);
  });
  codeBox(s, 0.5, 2.75, 5.0, 2.25, ["[global]", "   workgroup = ISEC", "   realm = ISEC.LOCAL", "   security = ADS", "   idmap config * : backend = tdb", "   idmap config ISEC : backend = rid", "   template shell = /bin/bash", "   template homedir = /home/%U"], 11, `# /etc/samba/smb.conf (${CLW})`);
  sideCard(s, 5.75, 2.75, 3.75, 2.25, "Validação", ["testparm -s → ROLE_DOMAIN_MEMBER", "net ads testjoin → Join is OK", "wbinfo -t → RPC calls succeeded", "Objeto visível no ADUC → Computers"]);
  s.addNotes(`[Apresenta: ${A3}]
No cliente Winbind, o Samba integra-se em quatro passos. Primeiro, o DNS do Linux aponta para o DC. Segundo, a hora é sincronizada e o krb5.conf configurado com o realm. Terceiro, o smb.conf define o grupo de trabalho ISEC, o realm ISEC.LOCAL, o modo security = ADS, que indica que a máquina é membro de um domínio Active Directory, e o mapeamento de IDs: tdb para o domínio por omissão e rid para o domínio ISEC. O quarto passo é o net ads join.
À direita estão as validações do guião: o testparm deve mostrar ROLE_DOMAIN_MEMBER, o net ads testjoin deve responder "Join is OK" e o wbinfo -t confirma a relação de confiança com o DC.
[Captura sugerida: imagens/09-computador-ad.png.]`);
}
{
  const s = newSlide(S3, "Como o PAM se integra");
  tagline(s, "pam-auth-update ativa os perfis certos em /etc/pam.d/common-*");
  ["login / su", "sshd", "gdm3"].forEach((a, i) => flowBox(s, 0.5, 1.45 + i * 0.7, 1.4, 0.55, a, null));
  arrowRight(s, 1.98, 2.27, 0.4);
  flowBox(s, 2.45, 1.75, 1.2, 1.05, "libpam", "/etc/pam.d", NAVY, AMBER, WHITE);
  arrowRight(s, 3.73, 2.27, 0.4);
  [["auth", "pam_unix → pam_sss | pam_winbind", "valida a password no AD (Kerberos)"],
   ["account", "pam_unix + pam_sss | pam_winbind", "a conta está ativa e autorizada?"],
   ["password", "pam_sss | pam_winbind", "alteração da password no AD"],
   ["session", "pam_mkhomedir + pam_mount", "cria a home e monta ~/SRII (SSSD)"]].forEach(([t, m, d], i) => {
    const y = 1.4 + i * 0.75;
    card(s, 4.2, y, 5.3, 0.65, ICE);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.2, y, w: 1.2, h: 0.65, rectRadius: 0.08, fill: { color: NAVY }, line: { color: NAVY } });
    s.addText(t, { x: 4.2, y, w: 1.2, h: 0.65, fontSize: 13, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText([{ text: m, options: { fontFace: "Courier New", fontSize: 11, color: NAVY, bold: true, breakLine: true } }, { text: d, options: { fontSize: 11, color: GREY } }],
      { x: 5.55, y, w: 3.85, h: 0.65, valign: "middle", margin: 0, isTextBox: true });
  });
  strip(s, "Perfis:", "SSSD → «SSS authentication» · Winbind → «Winbind NT/AD authentication» (SSS desmarcado) · ambos com «Create home directory on login»");
  s.addNotes(`[Apresenta: ${A3}]
Agora, como o PAM se integra. À esquerda, as aplicações que pedem autenticação: login, su, sshd e o GDM. Nenhuma sabe nada sobre o Active Directory; todas chamam a biblioteca libpam, que lê a configuração em /etc/pam.d.
À direita está a stack. No auth, depois do pam_unix para as contas locais, entra o pam_sss no cliente SSSD ou o pam_winbind no cliente Winbind. No account verifica-se se a conta está ativa. O password permite alterar a password no AD. No session, o pam_mkhomedir cria a home no primeiro login e, no cliente SSSD, o pam_mount monta a SRII.
No Ubuntu não editamos estes ficheiros à mão: usamos o pam-auth-update e marcamos os perfis certos. No cliente Winbind, o perfil SSS fica desmarcado.`);
}
{
  const s = newSlide(S3, "Autenticação de utilizadores com SSSD");
  seq(s, {
    parts: ["Utilizador (su -)", "PAM (pam_sss)", "SSSD", "KDC :88"],
    msgs: [
      [0, 1, "aluno.teste@isec.local"], [1, 2, "Autenticar"],
      [2, 3, "Valida (Kerberos)"], [3, 2, "OK", true],
      [2, 1, "Autenticado e com acesso", true], [1, 1, "pam_mkhomedir cria a home"],
      [1, 0, "Sessão aberta", true], [0, 3, "kinit na sessão → TGT do utilizador"],
    ],
  });
  seqSide(s, `Cliente ${CLS}`, ["Login: aluno.teste@isec.local", "Home leva o sufixo do domínio", "Cache permite login offline"], "Bates à porta (su -), quem atende (SSSD) confirma a senha com a central e só depois abre.");
  s.addNotes(`[Apresenta: ${A3}]
Este é o login no cliente SSSD, o esquema 2.1.8 do guião.
O utilizador faz su - aluno.teste@isec.local e introduz a password. O PAM, através do pam_sss, pede ao SSSD que autentique. O SSSD valida a password junto do KDC por Kerberos e, se estiver correta, responde ao PAM que o utilizador está autenticado e tem acesso.
Na fase de sessão, o pam_mkhomedir cria a pasta pessoal no primeiro login e a sessão é aberta. Dentro da sessão podemos ainda fazer kinit e obter o TGT do utilizador do domínio.
No SSSD, o nome do utilizador inclui o domínio, de acordo com o login-format %U@isec.local que vimos no realm list.
[Captura sugerida: imagens/14-login.png.]`);
}
{
  const s = newSlide(S3, "Autenticação de utilizadores com Winbind");
  seq(s, {
    parts: ["Utilizador (su -)", "PAM (pam_winbind)", "winbindd", `DC ${DC}`],
    msgs: [
      [0, 1, "professor.teste"], [1, 2, "Autenticar"],
      [2, 3, "Valida no domínio"], [3, 2, "OK + grupos", true],
      [2, 1, "Autenticado", true], [1, 1, "pam_mkhomedir cria a home"],
      [1, 0, "Sessão aberta", true],
    ],
  });
  seqSide(s, `Cliente ${CLW}`, ["Login: professor.teste", "Home: /home/professor.teste", "Grupos do AD chegam no login"], "Mesma porta, outro atendedor (winbindd): confirma a senha e diz em que salas podes entrar.");
  s.addNotes(`[Apresenta: ${A3}]
O mesmo processo no cliente Winbind, o esquema 2.2.9 do guião.
O utilizador faz su - professor.teste. O PAM, agora através do pam_winbind, pede ao winbindd que autentique. O winbindd valida a password junto do DC e recebe, na mesma resposta, a lista de grupos do utilizador. Com a autenticação confirmada, o pam_mkhomedir cria /home/professor.teste e a sessão é aberta.
Há duas diferenças face ao SSSD. O utilizador entra sem o sufixo do domínio, porque configurámos "winbind use default domain = yes". E os grupos vêm diretamente do DC no momento do login, convertidos em GID pelo idmap rid.`);
}
{
  const s = newSlide(S3, "Montagem automática da SRII (pam_mount)");
  seq(s, {
    parts: ["Utilizador", "PAM (pam_sss + pam_mount)", "mount.cifs", `${DC}:445`],
    msgs: [
      [0, 1, "Login com conta do AD"], [1, 1, "pam_sss autentica (SSSD + Kerberos)"],
      [1, 2, "Passa a password do login"], [2, 3, "Sessão SMB (ntlmssp, ISEC)"],
      [3, 2, "Partilha SRII montada", true], [2, 0, "~/SRII com as permissões do AD", true],
    ],
    foot: "No logout o pam_mount desmonta ~/SRII",
  });
  seqSide(s, "Configuração", ["pam_mount.conf.xml", "Uma linha <volume> por utilizador", "Nada muda no Windows"], "Ao abrires a porta com a tua senha, o armário partilhado (SRII) abre-se sozinho.");
  s.addNotes(`[Apresenta: ${A3}]
O último passo do cliente SSSD é a montagem automática da partilha SRII no login, o esquema 2.1.10.
O pam_mount é um módulo PAM. Quando o utilizador faz login com a conta do AD, o pam_sss autentica-o primeiro. Depois, o pam_mount reaproveita a password escrita no login e chama o mount.cifs, que abre uma sessão SMB com o ${DC} na porta 445.
A partilha fica montada em ~/SRII com as permissões do Active Directory: o aluno só lê e o professor lê e escreve. No logout, o pam_mount desmonta-a.
A configuração está em /etc/security/pam_mount.conf.xml, com uma linha volume por utilizador. Do lado Windows não é preciso mudar nada.
[Captura: SR2-2627-Workshop-Grp10-Kerberos-03-Acesso-SRII.pcapng.]`);
}
{
  const s = newSlide(S3, "Identidades no Linux: NSS, SSSD e Winbind");
  tagline(s, "NSS (Name Service Switch): como «id» e «getent» conhecem os utilizadores do AD");
  [["SSSD", CLS, [["id / getent", null], ["NSS", "files sss"], ["SSSD", "cache local"], ["LDAP do AD", "389 · keytab"]]],
   ["Winbind", CLW, [["id / getent", null], ["NSS", "files systemd winbind"], ["winbindd", "idmap rid"], ["AD", "RPC / LDAP"]]]].forEach(([lab, host, boxes], r) => {
    const y = 1.4 + r * 0.85;
    s.addText([{ text: lab, options: { bold: true, color: NAVY, fontSize: 14, breakLine: true } }, { text: host, options: { color: GREY, fontSize: 10 } }],
      { x: 0.5, y, w: 1.3, h: 0.7, valign: "middle", margin: 0, isTextBox: true });
    boxes.forEach(([h, d], i) => {
      const x = 1.9 + i * 1.92, dark = i === 2;
      flowBox(s, x, y, 1.65, 0.7, h, d, dark ? NAVY : ICE, dark ? AMBER : NAVY, dark ? WHITE : TXT, 12);
      if (i < 3) arrowRight(s, x + 1.67, y + 0.35, 0.23);
    });
  });
  card(s, 0.5, 3.2, 4.3, 1.8, ICE);
  s.addText("idmap rid: de SID para UID", { x: 0.7, y: 3.28, w: 3.9, h: 0.35, fontSize: 14, bold: true, color: NAVY, margin: 0, isTextBox: true });
  [["SID", "S-1-5-21-…-1105"], ["RID", "1105"], ["UID", "10000 + 1105 = 11105"]].forEach(([k, v], i) => {
    const y = 3.7 + i * 0.43;
    badge(s, 0.7, y, 0.37, k, BLUE, WHITE, 9);
    s.addText(v, { x: 1.2, y, w: 3.4, h: 0.37, fontFace: "Courier New", fontSize: 12, color: TXT, valign: "middle", margin: 0, isTextBox: true });
  });
  codeBox(s, 5.05, 3.2, 4.45, 1.8, ["# /etc/nsswitch.conf", `passwd: files systemd sss      # ${CLS}`, "group:  files systemd sss", "", `passwd: files systemd winbind  # ${CLW}`, "group:  files systemd winbind"], 10);
  s.addNotes(`[Apresenta: ${A3}]
Além de autenticar, o Linux precisa de saber quem é o utilizador: o UID, os grupos e a home. Isso é feito pelo NSS, o Name Service Switch. Estes são os esquemas 2.1.7 e 2.2.7 do guião.
No cliente SSSD, o nsswitch.conf tem "sss" nas linhas passwd e group. Um id ou getent passa pelo NSS e chega ao SSSD, que responde a partir da cache ou pesquisa o LDAP do AD, autenticando-se com a keytab da máquina.
No cliente Winbind, a linha tem "winbind" e o pedido vai para o winbindd, que fala com o AD por RPC ou LDAP.
No Winbind, a peça central é o idmap. Na analogia da porta: quem atende traduz o nome que o Windows usa para o número que a porta do Linux conhece, sempre com a mesma regra, para que cada pessoa tenha o mesmo número em todas as casas. Cada objeto do AD tem um SID, cuja última parte é o RID. Com o backend rid, o UID é 10000 mais o RID: um utilizador com RID 1105 fica com o UID 11105.
[Captura sugerida: imagens/11-getent.png.]`);
}

const S4 = "Winbind vs SSSD";
pres.addSection({ title: S4 });
{
  const s = newSlide(S4, "Winbind vs SSSD: comparação");
  table(s, ["Critério", `Winbind (${CLW})`, `SSSD (${CLS})`], [
    ["Origem", "Projeto Samba", "Red Hat / FreeIPA"],
    ["Join ao domínio", "net ads join", "realm join (adcli)"],
    ["Ficheiro principal", "smb.conf", "sssd.conf (gerado pelo realm)"],
    ["Mapeamento de IDs", "idmap manual (tdb + rid)", "Automático a partir do SID"],
    ["Nome de login", "professor.teste", "aluno.teste@isec.local"],
    ["Login offline", "Limitado", "Cache nativa e robusta"],
    ["Partilhas SMB", "Integração nativa", "Via cifs-utils / pam_mount"],
    ["Suporte adsys (GPO)", "Não", "Sim"],
  ], { colW: [2.4, 3.3, 3.3], rowH: 0.38 });
  s.addText([{ text: "Regra do laboratório: ", options: { bold: true, color: NAVY } }, { text: "as duas variantes nunca ficam ativas na mesma máquina.", options: { color: TXT } }],
    { x: 0.5, y: 4.65, w: 9.0, h: 0.35, fontSize: 13, margin: 0, isTextBox: true });
  s.addNotes(`[Apresenta: ${A3}]
Esta tabela resume a comparação que fizemos com os dois clientes. Ambos resolvem o mesmo problema, mas com filosofias diferentes.
O Winbind vem do Samba, configura-se no smb.conf, faz o join com net ads join e exige que definamos o mapeamento de IDs: no nosso caso, tdb para o domínio por omissão e rid para o ISEC. O SSSD é configurado quase todo pelo realm join e calcula os UID automaticamente a partir do SID.
Repare também na diferença no nome de login: no Winbind entra-se como professor.teste e no SSSD como aluno.teste@isec.local.
E a regra que repetimos no guião: as duas variantes nunca ficam ativas na mesma máquina, porque disputariam o NSS e o PAM.`);
}
{
  const s = newSlide(S4, "Vantagens e desvantagens");
  [["Winbind", 1.15, [
      ["Integração nativa com Samba e partilhas SMB", "Configuração manual: smb.conf, NSS e PAM"],
      ["idmap rid determinístico e controlável", "Login offline e cache limitados"],
      ["Suporta NTLM, RPC e trusts entre domínios", "Sem suporte do adsys (GPO)"],
      ["Ideal se o Linux servir ficheiros SMB", "Erros de idmap são difíceis de corrigir"]]],
   ["SSSD", 3.1, [
      ["Join automático com realm join", "Não serve partilhas SMB sozinho"],
      ["Cache robusta e login offline", "Menos controlo sobre o mapeamento de IDs"],
      ["UID automáticos a partir do SID", "Login com sufixo @isec.local por omissão"],
      ["Recomendado pela Canonical; suporta adsys", "Diagnóstico exige sssctl e logs detalhados"]]]].forEach(([name, y, rows]) => {
    s.addText(name, { x: 0.5, y, w: 1.2, h: 1.75, fontSize: 18, bold: true, color: NAVY, valign: "middle", margin: 0, isTextBox: true });
    table(s, ["✔ Vantagens", "✖ Desvantagens"], rows, { x: 1.7, y, w: 7.8, colW: [3.9, 3.9], rowH: 0.34, fs: 12, headFill: [GOOD, BAD], firstBold: false });
  });
  s.addNotes(`[Apresenta: ${A3}]
Aqui estão as vantagens e desvantagens de cada abordagem.
O Winbind tem como grande vantagem a integração nativa com o Samba: se o próprio Linux vai servir partilhas SMB a clientes Windows, é a escolha natural. O idmap rid é determinístico e controlável, e suporta NTLM, RPC e trusts. Em contrapartida, a configuração é mais manual, a cache e o login offline são limitados, não é suportado pelo adsys e os erros de idmap são difíceis de corrigir depois de haver ficheiros criados.
O SSSD faz o join quase sozinho com o realm join, tem uma cache robusta com login offline e calcula os UID automaticamente. É o recomendado pela Canonical e o único suportado pelo adsys. As desvantagens: não serve partilhas SMB sozinho, dá menos controlo sobre o mapeamento de IDs e o diagnóstico exige conhecer o sssctl e os seus logs.`);
}
{
  const s = newSlide(S4, "Qual escolher? A nossa recomendação");
  tagline(s, "A escolha depende do papel da máquina Linux na rede");
  [[0.5, "SSSD", "Desktops e servidores Ubuntu", ["Postos de trabalho com login AD", "Portáteis que saem da rede (cache)", "Quando se quer GPO com adsys", "Configuração rápida com realm join"], NAVY, WHITE, AMBER],
   [5.1, "Winbind", "Servidores de ficheiros Samba", ["Linux a servir partilhas SMB", "Necessidade de idmap controlado", "Trusts entre vários domínios", "Ambientes Samba já existentes"], ICE, TXT, NAVY]].forEach(([x, n, sub, it, fill, tc, hc]) => {
    card(s, x, 1.45, 4.4, 2.95, fill);
    s.addText([{ text: n, options: { bold: true, fontSize: 22, color: hc, breakLine: true } }, { text: sub, options: { fontSize: 13, color: fill === NAVY ? LIGHT : GREY } }],
      { x: x + 0.25, y: 1.6, w: 3.9, h: 0.85, margin: 0, valign: "top", isTextBox: true });
    s.addText(bullets(it), { x: x + 0.25, y: 2.55, w: 3.9, h: 1.8, fontSize: 14, color: tc, valign: "top", margin: 0, isTextBox: true });
  });
  analogyBand(s, "Ambos atendem a porta: o SSSD toma nota e funciona sem telefone; o Winbind fala sempre através do Samba.", 4.55);
  s.addNotes(`[Apresenta: ${A3}]
Na analogia da porta: ambos atendem o pedido, mas o SSSD toma nota das senhas confirmadas e consegue abrir mesmo sem telefone para a central; o Winbind fala sempre através do Samba, o que é ideal quando a casa também empresta ficheiros.
Então, qual escolher? A resposta depende do papel da máquina Linux na rede.
O SSSD é a escolha para desktops e servidores Ubuntu: postos de trabalho onde os utilizadores fazem login com a conta do AD, portáteis que saem da rede e beneficiam da cache, máquinas que devem receber GPO através do adsys e situações em que queremos uma configuração rápida e com poucos erros.
O Winbind continua a ser a escolha certa para servidores de ficheiros Samba: quando o Linux serve partilhas SMB, quando precisamos de controlar o mapeamento de IDs, em cenários com trusts entre vários domínios ou em ambientes Samba já existentes.
No nosso trabalho usamos o SSSD como via principal e o Winbind para mostrar a diferença.`);
}

const S5 = "Serviço Windows";
pres.addSection({ title: S5 });
{
  const s = newSlide(S5, "O servidor como gestor central");
  tagline(s, "Gerir uma vez no SR2-SRV, aplicar em todos os clientes Linux");
  card(s, 0.5, 1.4, 4.2, 3.0, NAVY);
  s.addText("Decidido no DC (SR2-SRV)", { x: 0.7, y: 1.5, w: 3.8, h: 0.4, fontSize: 16, bold: true, color: AMBER, margin: 0, isTextBox: true });
  s.addText(bullets(["Quem existe: utilizadores e grupos", "Quem pode entrar em cada cliente", "A que pastas acede (partilha + NTFS)", "Que políticas recebe (GPO)", "Regras de password e bloqueio de conta"]),
    { x: 0.7, y: 2.0, w: 3.85, h: 2.3, fontSize: 13, color: WHITE, valign: "top", margin: 0, isTextBox: true });
  arrowRight(s, 4.8, 2.9, 0.5);
  card(s, 5.4, 1.4, 4.1, 3.0, WHITE);
  s.addText("Aplicado no cliente Linux", { x: 5.6, y: 1.5, w: 3.8, h: 0.4, fontSize: 16, bold: true, color: BLUE, margin: 0, isTextBox: true });
  s.addText(bullets(["SSSD / Winbind consultam e guardam em cache", "PAM aplica a decisão no login", "pam_mount monta com as credenciais do utilizador", "adsys aplica as GPO", "Nenhuma conta é criada à mão no cliente"]),
    { x: 5.6, y: 2.0, w: 3.75, h: 2.3, fontSize: 13, color: TXT, valign: "top", margin: 0, isTextBox: true });
  analogyBand(s, "Todas as portas ligam para a mesma central: é lá que se decide quem entra, em que salas e com que regras.", 4.5);
  s.addNotes(`[Apresenta: ${A3}]
Uma ideia central do trabalho: o servidor é o gestor. Tudo o que importa é decidido no DC, o SR2-SRV: quem existe, ou seja, os utilizadores e os grupos; quem pode entrar em cada cliente; a que pastas cada um acede, através das permissões da partilha e do NTFS; que políticas cada máquina recebe, através das GPO; e as regras de password e de bloqueio de conta.
Os clientes Linux limitam-se a aplicar essas decisões. O SSSD ou o Winbind consultam o AD e guardam o resultado em cache; o PAM aplica a decisão no momento do login; o pam_mount monta a partilha com as credenciais do próprio utilizador; e o adsys aplica as GPO. Nenhuma conta de utilizador é criada à mão no cliente.
Na analogia da porta: todas as portas dos clientes ligam para a mesma central, e é lá que se decide quem entra, em que salas e com que regras; quem atende a porta limita-se a cumprir.`);
}
{
  const s = newSlide(S5, "AD: utilizadores e grupos");
  tagline(s, `Os objetos criados no ${DC} para o workshop`);
  card(s, 0.5, 1.4, 4.7, 3.6, ICE);
  s.addText(`Active Directory – ${DOM} – pasta Users`, { x: 0.7, y: 1.5, w: 4.3, h: 0.35, fontSize: 13, bold: true, color: NAVY, margin: 0, isTextBox: true });
  [["aluno.teste", "Grupo-Alunos"], ["professor.teste", "Grupo-Professores"]].forEach(([u, g], i) => {
    const y = 2.1 + i * 1.0;
    flowBox(s, 0.75, y, 1.6, 0.6, u, null, WHITE, NAVY, TXT, 12);
    s.addShape(pres.shapes.LINE, { x: 2.4, y: y + 0.3, w: 0.7, h: 0, line: { color: INK, width: 1.75, endArrowType: "triangle" } });
    s.addText("Member Of", { x: 2.35, y: y + 0.02, w: 0.8, h: 0.25, fontSize: 9, color: GREY, align: "center", margin: 0, isTextBox: true });
    flowBox(s, 3.15, y, 1.85, 0.6, g, "Global · Security", NAVY, WHITE, LIGHT, 12);
  });
  s.addText(`Computers: ${CLS.toUpperCase()} · ${CLW}`, { x: 0.75, y: 4.25, w: 4.3, h: 0.5, fontSize: 12, color: TXT, valign: "middle", margin: 0, isTextBox: true });
  card(s, 5.5, 1.4, 4.0, 1.55, ICE);
  s.addText("Boa prática: AGDLP", { x: 5.7, y: 1.48, w: 3.6, h: 0.32, fontSize: 14, bold: true, color: NAVY, margin: 0, isTextBox: true });
  ["Contas", "Global", "Dom. Local", "Permissão"].forEach((t, i) => {
    const x = 5.65 + i * 0.97;
    flowBox(s, x, 1.9, 0.82, 0.5, t, null, i === 3 ? NAVY : WHITE, i === 3 ? WHITE : NAVY, TXT, 11);
    if (i < 3) arrowRight(s, x + 0.83, 2.15, 0.12);
  });
  s.addText("Accounts → Global → Domain Local → Permissions", { x: 5.7, y: 2.5, w: 3.65, h: 0.35, fontSize: 11, color: GREY, margin: 0, isTextBox: true });
  shot(s, "09-computador-ad.png", 5.5, 3.1, 4.0, 1.9, "Contas de computador no AD após o join (laboratório)");
  s.addNotes(`[Apresenta: ${A3}]
Passamos ao lado Windows, com o esquema 1.4 do guião. No ${DC} criámos, na pasta Users do domínio ${DOM}, dois grupos de segurança de âmbito global, o Grupo-Alunos e o Grupo-Professores, e dois utilizadores de teste: o aluno.teste, membro do Grupo-Alunos, e o professor.teste, membro do Grupo-Professores. Na pasta Computers aparecem as contas dos dois clientes Linux depois do join.
Os grupos podem ser de segurança, usados para permissões, ou de distribuição, apenas para e-mail. O âmbito pode ser global, de domínio local ou universal.
A boa prática é a estratégia AGDLP (Accounts, Global, Domain Local, Permissions): as contas entram em grupos globais, estes em grupos de domínio local, e as permissões atribuem-se a estes últimos. Num ambiente real organizaríamos também os objetos em OU, para lhes ligar GPO.
[Inserir a captura da consola ADUC no espaço indicado.]`);
}
{
  const s = newSlide(S5, "Criar utilizadores e grupos no servidor");
  tagline(s, "Pela consola ADUC (Active Directory Users and Computers) ou por PowerShell");
  card(s, 0.5, 1.4, 4.3, 3.6, WHITE);
  s.addText("Na consola ADUC", { x: 0.7, y: 1.5, w: 3.9, h: 0.35, fontSize: 15, bold: true, color: NAVY, margin: 0, isTextBox: true });
  [["Criar os grupos", "Grupo-Alunos e Grupo-Professores: Global, Security"], ["Criar os utilizadores", "aluno.teste e professor.teste, com password"], ["Associar aos grupos", "Separador Member Of → Add…"], ["Verificar no cliente", "id e getent mostram os grupos do AD"]].forEach(([h, d], i) => {
    const y = 1.95 + i * 0.75;
    badge(s, 0.7, y + 0.06, 0.38, String(i + 1), BLUE, WHITE, 12);
    s.addText([{ text: h, options: { bold: true, color: NAVY, fontSize: 13, breakLine: true } }, { text: d, options: { color: TXT, fontSize: 11 } }],
      { x: 1.2, y, w: 3.5, h: 0.6, valign: "middle", margin: 0, isTextBox: true });
  });
  codeBox(s, 5.0, 1.4, 4.5, 3.6, [
    "New-ADGroup -Name Grupo-Alunos `", "  -GroupScope Global `", "  -GroupCategory Security", "",
    "New-ADUser -Name \"Aluno Teste\" `", "  -SamAccountName aluno.teste `", "  -UserPrincipalName aluno.teste@isec.local `", "  -AccountPassword (Read-Host -AsSecureString) `", "  -Enabled $true", "",
    "Add-ADGroupMember Grupo-Alunos aluno.teste", "",
    "# no cliente Linux", "id aluno.teste@isec.local", "getent group grupo-alunos@isec.local",
  ], 9.5, "# PowerShell no SR2-SRV");
  s.addNotes(`[Apresenta: ${A3}]
Como se criam os utilizadores e os grupos? Pela consola ADUC, Active Directory Users and Computers, em quatro passos: criamos os grupos Grupo-Alunos e Grupo-Professores, de âmbito global e do tipo segurança; criamos os utilizadores aluno.teste e professor.teste, com password; associamos cada utilizador ao seu grupo no separador Member Of; e verificamos no cliente Linux, com id e getent, que os grupos do AD aparecem.
À direita está o mesmo processo em PowerShell, útil para automatizar quando há muitos utilizadores: New-ADGroup, New-ADUser e Add-ADGroupMember. Reparem no UPN, User Principal Name, aluno.teste@isec.local, que é o nome usado no login do cliente SSSD.
Repare-se que não criamos nada no Linux: o utilizador passa a existir em todos os clientes assim que é criado no AD.`);
}
{
  const s = newSlide(S5, "Permissões: NTFS vs partilha SMB");
  table(s, ["Permissão", "NTFS (New Technology File System)", "Partilha SMB", "Equivalente Linux"], [
    ["Leitura", "Read / List", "Read", "r  (r--)"],
    ["Escrita", "Write / Modify", "Change", "w  (rw-)"],
    ["Execução", "Read & Execute", "— (decide o NTFS)", "x  (r-x)"],
    ["Controlo total", "Full Control", "Full Control", "dono + ACL (setfacl)"],
    ["Âmbito", "Local e rede", "Só acesso pela rede", "~/SRII via mount.cifs"],
  ], { colW: [1.6, 2.8, 2.1, 2.5], rowH: 0.38, mono: [3] });
  card(s, 0.5, 3.75, 3.6, 1.25, NAVY);
  s.addText([{ text: "Permissão efetiva = duas portas", options: { bold: true, color: AMBER, fontSize: 14, breakLine: true } }, { text: "A porta da partilha e a da pasta (NTFS), cada uma com a sua senha: só entras se ambas abrirem.", options: { color: WHITE, fontSize: 12 } }],
    { x: 0.7, y: 3.75, w: 3.25, h: 1.25, valign: "middle", margin: 0, isTextBox: true });
  card(s, 4.35, 3.75, 5.15, 1.25, ICE);
  s.addText([{ text: `Partilha \\\\${DC}\\SRII no projeto`, options: { bold: true, color: NAVY, fontSize: 13, breakLine: true } },
             { text: "Grupo-Alunos: Read + Read & execute → só lê", options: { color: TXT, fontSize: 12, breakLine: true } },
             { text: "Grupo-Professores: Full Control + Modify → lê e escreve", options: { color: TXT, fontSize: 12 } }],
    { x: 4.55, y: 3.75, w: 4.85, h: 1.25, valign: "middle", margin: 0, isTextBox: true });
  s.addNotes(`[Apresenta: ${A3}]
No Windows há duas camadas de permissões que importa distinguir. As permissões NTFS (New Technology File System) aplicam-se ao sistema de ficheiros e valem sempre, quer o acesso seja local quer pela rede. As permissões de partilha SMB só se aplicam a quem acede pela rede e são mais simples: Read, Change e Full Control.
Quando um utilizador acede a uma partilha, a permissão efetiva é a mais restritiva das duas. Na coluna da direita está a correspondência aproximada com o modelo Linux; para permissões finas usam-se as ACL (Access Control Lists) com setfacl.
No projeto, o esquema 1.5 do guião: na partilha SRII, o Grupo-Alunos tem Read na partilha e Read & execute em NTFS, por isso só lê. O Grupo-Professores tem Full Control na partilha e Modify em NTFS, o que dá Modify efetivo: lê e escreve. São estas as permissões que encontram em ~/SRII no Linux.
[Captura sugerida: imagens/15-share-windows.png e 16-smbclient.png.]`);
}
{
  const s = newSlide(S5, "Limitar o acesso a pastas: exemplo da SRII");
  seq(s, {
    parts: ["aluno.teste", "mount.cifs (~/SRII)", "SR2-SRV: partilha", "SR2-SRV: NTFS"],
    msgs: [
      [0, 1, "touch ~/SRII/notas.txt"], [1, 2, "SMB CREATE como ISEC\\aluno.teste"],
      [2, 2, "Partilha: só Read"], [2, 3, "Verifica a ACL NTFS"],
      [3, 2, "Read & execute: sem escrita", true], [2, 1, "STATUS_ACCESS_DENIED", true],
      [1, 0, "Permission denied", true],
    ],
    foot: "Com professor.teste (Full Control + Modify) o ficheiro é criado",
  });
  seqSide(s, "Também no cliente", ["chown / chmod com grupos do AD", "setfacl para regras finas", "<volume> só para quem precisa"], "Passaste a porta da casa, mas a sala SRII tem a sua senha: quem decide é o servidor.");
  s.addNotes(`[Apresenta: ${A3}]
Como se limita o acesso de um utilizador a uma pasta? Vejamos o exemplo da SRII. O aluno.teste tenta criar um ficheiro em ~/SRII. O mount.cifs envia o pedido SMB ao servidor, em nome de ISEC\\aluno.teste. O servidor verifica primeiro a permissão da partilha, que para os alunos é só Read, e depois a ACL (Access Control List) do NTFS, que dá Read & execute, sem escrita. A resposta é STATUS_ACCESS_DENIED e o Linux mostra «Permission denied». Com o professor.teste, que tem Full Control na partilha e Modify em NTFS, o ficheiro é criado.
O ponto importante: quem decide é o servidor, não o cliente. Mesmo que alguém altere o cliente, não consegue escrever.
No próprio cliente também se pode limitar o acesso a pastas locais, com chown e chmod usando grupos do AD, com setfacl para regras finas, ou montando a partilha apenas para quem precisa.`);
}
{
  const s = newSlide(S5, "Limitar quem pode entrar em cada cliente");
  tagline(s, "Por omissão qualquer utilizador do domínio entra; restringimos por grupo do AD");
  s.addText(`SSSD (${CLS})`, { x: 0.5, y: 1.35, w: 4.4, h: 0.35, fontSize: 15, bold: true, color: NAVY, margin: 0, isTextBox: true });
  codeBox(s, 0.5, 1.75, 4.4, 2.45, ["sudo realm deny --all", "sudo realm permit -g \\", "  Grupo-Professores@isec.local", "", "# resultado no sssd.conf:", "access_provider = simple", "simple_allow_groups = \\", "  grupo-professores@isec.local"], 10);
  s.addText(`Winbind (${CLW})`, { x: 5.1, y: 1.35, w: 4.4, h: 0.35, fontSize: 15, bold: true, color: NAVY, margin: 0, isTextBox: true });
  codeBox(s, 5.1, 1.75, 4.4, 2.45, ["# /etc/security/pam_winbind.conf", "[global]", "require_membership_of = \\", "  ISEC\\Grupo-Professores", "", "# sudo só para professores", "# /etc/sudoers.d/professores", "%grupo-professores ALL=(ALL) ALL"], 10);
  strip(s, "Gestão centralizada:", "com o adsys, os privilégios (quem é administrador) também podem ser definidos por GPO no servidor.", false, 4.4, 0.6);
  s.addNotes(`[Apresenta: ${A3}]
Por omissão, depois do join, qualquer utilizador do domínio pode iniciar sessão no cliente. Numa organização real queremos restringir isto por grupo do AD.
No cliente SSSD usamos o realm: primeiro realm deny --all, para negar todos, e depois realm permit -g com o grupo autorizado, por exemplo os professores. O realm escreve no sssd.conf o access_provider simple e a lista de grupos permitidos.
No cliente Winbind, a mesma restrição faz-se no pam_winbind.conf, com a opção require_membership_of e o grupo do AD.
Podemos ainda dar privilégios de administração, ou seja, sudo, apenas a um grupo, com um ficheiro em /etc/sudoers.d. E, com o adsys, até isso pode ser definido de forma centralizada por GPO, no servidor.
Repare-se que, em todos os casos, a decisão usa grupos que são geridos no AD: para dar ou retirar acesso basta mudar a pertença ao grupo no servidor.`);
}
{
  const s = newSlide(S5, "GPO e mapeamento para o Linux");
  tagline(s, "Uma política criada no Windows, aplicada no Ubuntu");
  [["GPMC", "cria a GPO"], ["OU", "ligação à OU"], ["SYSVOL", "\\\\isec.local\\SYSVOL"], ["adsys", "lê e aplica"], ["Ubuntu", "dconf · sudo · scripts"]].forEach(([h, d], i) => {
    const x = 0.5 + i * 1.85;
    flowBox(s, x, 1.45, 1.6, 0.9, h, d, i === 4 ? NAVY : ICE, i === 4 ? AMBER : NAVY, i === 4 ? WHITE : TXT);
    if (i < 4) arrowRight(s, x + 1.63, 1.9, 0.19);
  });
  table(s, ["No Active Directory", "No Linux"], [
    ["Grupo-Alunos / Grupo-Professores", "Grupos Linux (getent group, id)"],
    ["SID do utilizador", "UID/GID: idmap rid (Winbind) ou SSSD"],
    ["Permissões NTFS da SRII", "Respeitadas em ~/SRII (pam_mount + mount.cifs)"],
    ["GPO de privilégios (adsys)", "Administradores locais e sudo definidos no AD"],
  ], { y: 2.65, colW: [3.3, 5.7], rowH: 0.42 });
  s.addNotes(`[Apresenta: ${A3}]
As GPO são o mecanismo do Windows para aplicar configurações de forma centralizada. O fluxo: criamos a GPO na consola GPMC (Group Policy Management Console), ligamo-la a uma OU e ela fica publicada no SYSVOL do controlador. No Ubuntu, o adsys lê o SYSVOL e aplica as definições.
Na tabela está a correspondência entre os conceitos do AD e o Linux. O Grupo-Alunos e o Grupo-Professores aparecem como grupos Linux no id e no getent group. O SID é convertido em UID e GID pelo idmap rid ou pelo SSSD. As permissões NTFS da SRII são respeitadas na pasta montada pelo pam_mount. E, com o adsys, também os administradores locais e o sudo podem ser definidos a partir do AD.
[Captura sugerida: consola GPMC e saída do adsysctl policy applied.]`);
}

// =====================================================================
// ENCERRAMENTO
// =====================================================================
{
  const s = newSlide(S5, "Do laboratório: primeiros testes");
  tagline(s, "Capturas reais dos testes preliminares que suportam o guião");
  shot(s, "03-ad-dominio.png", 0.5, 1.3, 4.4, 1.9, "Get-ADDomain: o domínio isec.local criado");
  shot(s, "10-user-ad.png", 5.1, 1.3, 4.4, 1.9, "New-ADUser: utilizador de teste no AD");
  shot(s, "11-getent.png", 0.5, 3.25, 4.4, 1.85, "id / getent: o utilizador do AD visto no Ubuntu");
  shot(s, "16-smbclient.png", 5.1, 3.25, 4.4, 1.85, "smbclient: acesso à partilha com a conta do AD");
  s.addNotes(`[Apresenta: ${A3}]
Antes de concluir, quatro capturas reais dos testes preliminares que fizemos no laboratório e que suportam o guião.
Em cima à esquerda, o Get-ADDomain confirma o domínio isec.local criado no Windows Server. Ao lado, a criação de um utilizador de teste com New-ADUser; reparem no SID, cuja última parte é o RID de que falámos. Em baixo, o id e o getent mostram esse utilizador do AD visto no Ubuntu, com UID e grupos atribuídos automaticamente pelo SSSD. Por fim, o smbclient acede à partilha do servidor com a conta do domínio e cria uma pasta.
Ou seja, a teoria que apresentámos funciona na prática, e é isto que vamos repetir passo a passo na Parte B.
[Nota: estas capturas foram feitas num teste anterior, com nomes ligeiramente diferentes (sr2-dc01, aluno.sr2).]`);
}

const S6 = "Encerramento";
pres.addSection({ title: S6 });
{
  const s = newSlide(S6, "Conclusão", "ESCURO");
  s.addText("Linux e Windows partilham uma identidade única, gerida a partir do AD DS", { x: 0.5, y: 0.95, w: 9.0, h: 0.45, fontSize: 16, italic: true, color: GREY, margin: 0, isTextBox: true });
  [["ID", "Identidade única", "Uma conta e uma password em Windows e Linux"],
   ["SSO", "Single Sign-On", "Tickets Kerberos evitam repetir credenciais"],
   ["GPO", "Gestão centralizada", "Grupos, permissões e políticas definidos no AD"],
   ["2FA", "Segurança reforçada", "TOTP no SSH e tempo sincronizado"]].forEach(([ab, t, d], i) => {
    const x = 0.5 + i * 2.3;
    card(s, x, 1.65, 2.1, 2.4, i === 0 ? NAVY : WHITE);
    badge(s, x + 0.7, 1.85, 0.7, ab, BLUE, WHITE, 14);
    s.addText([{ text: t, options: { bold: true, fontSize: 15, color: i === 0 ? WHITE : NAVY, breakLine: true } }, { text: d, options: { fontSize: 12, color: i === 0 ? LIGHT : TXT } }],
      { x: x + 0.12, y: 2.7, w: 1.86, h: 1.25, align: "center", valign: "top", margin: 0, isTextBox: true });
  });
  s.addText("Winbind e SSSD resolvem o mesmo problema; o SSSD é a escolha para clientes Ubuntu.", { x: 0.5, y: 4.35, w: 9.0, h: 0.5, fontSize: 15, bold: true, color: NAVY, margin: 0, isTextBox: true });
  s.addNotes(`[Apresenta: ${A3}]
Para concluir: mostrámos que é possível integrar clientes Linux num domínio Windows de forma a que ambos partilhem uma identidade única, gerida a partir do Active Directory.
As vantagens são quatro. Cada utilizador tem uma só conta e password em qualquer máquina. O Kerberos dá Single Sign-On sem enviar passwords pela rede. Os grupos, as permissões (como as da partilha SRII) e as políticas são geridos centralmente no AD e, com o adsys, chegam também ao Ubuntu. E a segurança é reforçada com o segundo fator TOTP e com a sincronização de tempo.
Ambas as vias funcionam, mas o SSSD é a escolha recomendada para clientes Ubuntu; o Winbind faz sentido quando o Linux também serve partilhas SMB.
Na Parte B vamos demonstrar tudo isto na prática, seguindo o guião do workshop.`);
}
{
  const s = newSlide(S6, "Referências");
  const refs = [
    ["Samba Team", "Setting up Samba as an AD Domain Member – wiki.samba.org"],
    ["Microsoft Learn", "Active Directory Domain Services Overview – learn.microsoft.com"],
    ["Canonical", "Ubuntu Server docs: SSSD e Active Directory – documentation.ubuntu.com/server"],
    ["Canonical", "adsys: Active Directory GPO support – documentation.ubuntu.com/adsys"],
    ["MIT", "Kerberos Documentation – web.mit.edu/kerberos"],
    ["chrony project", "chrony documentation – chrony-project.org"],
    ["Linux-PAM", "The Linux-PAM System Administrators' Guide – github.com/linux-pam"],
    ["pam_mount", "pam_mount.conf(5) – manpages.ubuntu.com"],
    ["SSSD project", "SSSD documentation – sssd.io"],
    ["Grupo 10", `Guião do Workshop SR2 ${ANO} (Guiao-2627-Workshop-Grp10)`],
  ];
  [0, 1].forEach((c) => {
    const runs = [];
    refs.slice(c * 5, c * 5 + 5).forEach(([a, t], i, arr) => {
      runs.push({ text: `[${c * 5 + i + 1}] ${a}. `, options: { bold: true, color: NAVY } });
      runs.push({ text: t, options: { color: TXT, breakLine: i < arr.length - 1 } });
    });
    s.addText(runs, { x: 0.5 + c * 4.6, y: 1.25, w: 4.4, h: 3.75, fontSize: 12, valign: "top", paraSpaceAfter: 10, margin: 0, isTextBox: true });
  });
  s.addNotes(`[Apresenta: ${A3}]
Estas são as principais referências: a documentação oficial do Samba, da Microsoft, da Canonical (SSSD e adsys), do MIT Kerberos, do Chrony, do Linux-PAM, do pam_mount e do SSSD, além do nosso guião do workshop, de onde vêm os esquemas apresentados.
[Nota: rever as URLs e acrescentar as datas de consulta, conforme as normas de referenciação da UC.]`);
}
{
  const s = pres.addSlide({ masterName: "CAPA", sectionTitle: S6 });
  s.addShape(pres.shapes.OVAL, { x: 6.6, y: 1.0, w: 4.4, h: 4.4, fill: { color: BLUE }, line: { color: BLUE } });
  s.addText(">_", { x: 6.6, y: 1.0, w: 4.4, h: 4.4, fontSize: 110, bold: true, color: WHITE, fontFace: "Courier New", align: "center", valign: "middle", margin: 0, isTextBox: true });
  s.addText("Início do workshop prático", { x: 0.5, y: 1.1, w: 6.0, h: 1.4, fontSize: 40, bold: true, color: NAVY, valign: "bottom", margin: 0, isTextBox: true });
  s.addText("Hands-on", { x: 0.5, y: 2.55, w: 6.0, h: 0.7, fontSize: 30, bold: true, color: BLUE, margin: 0, isTextBox: true });
  s.addText("Parte B: integração dos clientes Linux no domínio, seguindo o guião do workshop", { x: 0.5, y: 3.4, w: 5.8, h: 0.6, fontSize: 14, color: GREY, margin: 0, isTextBox: true });
  s.addNotes(`[Apresenta: ${A3} – os três respondem às perguntas]
Obrigado pela atenção. Se houver perguntas sobre a parte teórica, respondemos agora. A seguir começa o workshop prático, a parte hands-on: cada um vai integrar os clientes Linux no domínio, seguindo o guião que preparámos.`);
}

addGlossLines();
pres.writeFile({ fileName: OUT }).then((f) => console.log("written", f));
