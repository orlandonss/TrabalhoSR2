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
    for (const e of []) {
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
const SEEN = new Set();
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
    const fresh = found.filter(([, k, v]) => !SEEN.has(k) && !txt.includes(v));
    found.forEach(([, k]) => SEEN.add(k));
    found.length = 0;
    fresh.forEach((f) => found.push(f));
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
  return;
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
const WHY = {
  AD: "é a norma nas empresas e junta DNS, LDAP e Kerberos num só servidor.",
  KRB: "é o protocolo nativo do AD e a password nunca circula na rede.",
  NTP: "o Kerberos rejeita pedidos com mais de 5 minutos de diferença na hora.",
  SMB: "é a implementação livre e madura do SMB e a base do Winbind.",
  WB: "o enunciado pede as duas vias e o Winbind integra-se com as partilhas Samba.",
  SSSD: "é a opção recomendada pela Canonical, com cache e entrada no domínio automática.",
  PAM: "é o único ponto onde o login do Linux pode ser estendido sem mexer nas aplicações.",
  GPO: "sem ele o Ubuntu autentica no AD mas não recebe políticas.",
  "2FA": "uma password sozinha é um ponto único de falha.",
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
    { h: "No nosso projeto", items: role, fill: NAVY, hc: AMBER, tc: WHITE, n: "03" },
  ];
  const w = 2.83, g = 0.25, y = 1.4, h = 2.3;
  cols.forEach((c, i) => {
    const x = 0.5 + i * (w + g);
    card(s, x, y, w, h, c.fill);
    s.addText([{ text: c.h, options: { color: c.fill === NAVY ? WHITE : NAVY } }],
      { x: x + 0.2, y: y + 0.15, w: w - 0.3, h: 0.4, fontSize: 15, bold: true, valign: "middle", margin: 0, isTextBox: true });
    s.addText(bullets(c.items.slice(0, 2)), { x: x + 0.2, y: y + 0.68, w: w - 0.35, h: h - 0.8, fontSize: 14, color: c.tc, valign: "top", margin: 0, isTextBox: true });
  });
  if (ANALOGIES[abbr]) analogyBand(s, ANALOGIES[abbr], 3.83);
  strip(s, "Porquê esta escolha:", WHY[abbr] || "", false, 4.45, 0.55);
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
    ["01", "Contexto e visão geral", "Porquê este trabalho e o mapa das tecnologias"],
    ["02", "Tecnologias de base", "AD DS, Kerberos, Chrony e Samba"],
    ["03", "Integração do Linux", "Winbind, SSSD, PAM, adsys e 2FA"],
    ["04", "Arquitetura e login", "O laboratório e um login passo a passo"],
    ["05", "Winbind vs SSSD", "Vantagens e desvantagens"],
    ["06", "Servidor e permissões", "Utilizadores, grupos e acesso à SRII"],
    ["07", "Conclusão", "Síntese e o que se segue"],
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
Este é o roteiro. Começamos pelo contexto e por uma visão geral das tecnologias, com uma analogia simples. Depois apresentamos as tecnologias de base e as que integram o Linux no domínio, a arquitetura do laboratório e um login passo a passo. Por fim, comparamos o Winbind com o SSSD, vemos o lado do servidor e terminamos com a conclusão.`);
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


// =====================================================================
// BLOCO 1 – TECNOLOGIAS DE BASE (Aluno 1)// =====================================================================
// BLOCO 1 – TECNOLOGIAS DE BASE (Aluno 1)
// =====================================================================
const S1 = "Tecnologias de base";
pres.addSection({ title: S1 });
divider(S1, "01", "Tecnologias de base do domínio", ["AD DS", "Kerberos", "Chrony (NTP)", "Samba (SMB)"], A1,
  `[Apresenta: ${A1}]
Entramos no primeiro bloco: as tecnologias de base do domínio, ou seja, o que tem de existir e funcionar antes de qualquer cliente Linux se poder juntar. São quatro: o AD DS, o Kerberos, o Chrony e o Samba. Para cada uma vemos o que é, para que serve, o papel que tem no projeto e porque a escolhemos.`);

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
techSlide({
  section: S1, title: "Chrony", abbr: "NTP",
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

// =====================================================================
// BLOCO 2 – INTEGRAÇÃO DO LINUX + AVANÇADAS + ARQUITETURA (Aluno 2)
// =====================================================================
const S2 = "Integração do Linux";
pres.addSection({ title: S2 });
divider(S2, "02", "Integração do Linux", ["Winbind", "SSSD", "PAM", "adsys", "2FA", "Arquitetura", "Um login passo a passo"], A2,
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
techSlide({
  section: S2, title: "PAM", abbr: "PAM",
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
techSlide({
  section: S2, title: "adsys", abbr: "GPO",
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
techSlide({
  section: S2, title: "Autenticação de dois fatores", abbr: "2FA",
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

// =====================================================================
// BLOCO 3 – FLUXOS, COMPARAÇÃO, WINDOWS E CONCLUSÃO (Aluno 3)
// =====================================================================
{
  const s = newSlide(S2, "Autenticação de utilizadores com SSSD");
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
  s.addNotes(`[Apresenta: ${A2}]
Este é o login no cliente SSSD, o esquema 2.1.8 do guião.
O utilizador faz su - aluno.teste@isec.local e introduz a password. O PAM, através do pam_sss, pede ao SSSD que autentique. O SSSD valida a password junto do KDC por Kerberos e, se estiver correta, responde ao PAM que o utilizador está autenticado e tem acesso.
Na fase de sessão, o pam_mkhomedir cria a pasta pessoal no primeiro login e a sessão é aberta. Dentro da sessão podemos ainda fazer kinit e obter o TGT do utilizador do domínio.
No SSSD, o nome do utilizador inclui o domínio, de acordo com o login-format %U@isec.local que vimos no realm list.
Passo agora a palavra ao Renalto, que vai mostrar o lado do servidor.
[Captura sugerida: imagens/14-login.png.]`);
}

const S3 = "Fluxos e autenticação";
pres.addSection({ title: S3 });
divider(S3, "03", "Comparação, servidor e permissões", ["Winbind vs SSSD", "Servidor como gestor", "Utilizadores e grupos", "Permissões"], A3,
  `[Apresenta: ${A3}]
Obrigado, Pedro. No último bloco começo por comparar o Winbind com o SSSD. Depois vemos o lado do servidor: porque é que é o gestor central, como se organizam os utilizadores e os grupos e como se controla o acesso à partilha SRII. Terminamos com a conclusão.`)

const S4 = "Winbind vs SSSD";
pres.addSection({ title: S4 });
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
