// Apresentação de conceitos base do workshop (Grupo 10)
// Uso: node build_conceitos.js [saida.pptx]   (requer pptxgenjs)
const pptxgen = require("pptxgenjs");
const fs = require("fs"), path = require("path");
const OUT = process.argv[2] || "SR2-2627-Workshop-Grp10-Apresentacao-Conceitos.pptx";

// ---------- Paleta (igual aos decks anteriores do grupo) ----------
const NAVY = "1F2937", ORANGE = "D9480F", TITLE = "C2410C", AMBER = "FDBA74";
const TXT = "27272A", GREY = "71717A", WHITE = "FFFFFF", NOTE = "FFF7ED";
const ICE2 = "F4F4F5", PAPER = "F4F4F5", RULE = "A1A1AA", BORDER = "E4E4E7", ALT = "FAFAF9";
const BAD = "B42318", GOOD = "2E7D5B", LIGHT = "E4E4E7";
const LOGOS = path.join(__dirname, "logos");

const ANO = "2026/2027";
const FOOTER = `Grupo 10 | ISEC – IPC | Serviços de Rede II | ${ANO}`;
const A1 = "Orlando Santos", A2 = "Pedro Ferreira", A3 = "Renalto Baticã";

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.author = "Grupo 10";
pres.title = "Integração de clientes Linux num domínio Windows AD DS – Conceitos base";
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
function newSlide(title, sub) {
  const s = pres.addSlide({ masterName: "CONTEUDO" });
  s.addText(title, { placeholder: "title" });
  if (sub) s.addText(sub, { x: 0.7, y: 0.84, w: 8.8, h: 0.28, fontSize: 12, italic: true, color: GREY, margin: 0 });
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
    return runs.map((r, j) => ({ text: r.text, options: { ...(j === 0 ? { bullet: { indent: 12 } } : {}), ...(r.options || {}), breakLine: j === runs.length - 1 && i < items.length - 1, paraSpaceAfter: 4, ...o } }));
  }).flat();
}
function strip(s, label, text, y = 4.55, h = 0.55, mono = false) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 9.0, h, rectRadius: 0.06, fill: { color: NOTE }, line: { color: AMBER, width: 1 } });
  s.addText([{ text: label + "  ", options: { bold: true, color: TITLE } }, { text, options: { color: TXT, fontFace: mono ? "Courier New" : "Calibri" } }],
    { x: 0.65, y, w: 8.7, h, fontSize: mono ? 10.5 : 11.5, valign: "middle", margin: 0 });
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
// Caixa com cabeçalho a negrito e descrição
function box(s, x, y, w, h, head, sub, { fill = WHITE, hc = NAVY, sc = TXT, hs = 13, ss = 11, align = "left" } = {}) {
  card(s, x, y, w, h, fill);
  s.addText([{ text: head, options: { bold: true, color: hc, fontSize: hs, breakLine: !!sub } }, ...(sub ? [{ text: sub, options: { color: sc, fontSize: ss } }] : [])],
    { x: x + 0.15, y, w: w - 0.3, h, valign: "middle", align, margin: 0 });
}
// Cartão escuro "Papel no projeto"
function darkCard(s, x, y, w, h, title, items, fsz = 12) {
  card(s, x, y, w, h, NAVY);
  s.addText(title, { x: x + 0.2, y: y + 0.12, w: w - 0.35, h: 0.36, fontSize: 14, bold: true, color: AMBER, margin: 0 });
  s.addText(bullets(items), { x: x + 0.2, y: y + 0.55, w: w - 0.35, h: h - 0.65, fontSize: fsz, color: WHITE, valign: "top", margin: 0 });
}

// =====================================================================
// 1. CAPA
// =====================================================================
{
  const s = pres.addSlide({ masterName: "CAPA" });
  s.addShape(pres.shapes.OVAL, { x: 6.7, y: -1.4, w: 4.8, h: 4.8, fill: { color: ORANGE }, line: { color: ORANGE } });
  // as três "peças" do trabalho
  logo(s, 7.35, 0.55, 1.15, "windows-server");
  logo(s, 7.1, 3.3, 0.95, "ubuntu");
  logo(s, 8.35, 2.6, 0.95, "samba");
  s.addShape(pres.shapes.LINE, { x: 7.6, y: 1.72, w: 0, h: 1.56, line: { color: RULE, width: 1.25, dashType: "dash" } });
  s.addShape(pres.shapes.LINE, { x: 8.05, y: 3.25, w: 0.32, h: 0.25, flipV: true, line: { color: RULE, width: 1.25, dashType: "dash" } });

  s.addText("WORKSHOP · GRUPO 10", { x: 0.5, y: 0.55, w: 6, h: 0.35, fontSize: 13, bold: true, color: ORANGE, charSpacing: 2, margin: 0 });
  s.addText("Integração de clientes Linux num domínio Windows AD DS", { x: 0.5, y: 0.95, w: 6.2, h: 1.35, fontSize: 30, bold: true, color: NAVY, valign: "top", margin: 0 });
  s.addText("AD DS – Active Directory Domain Services  ·  Conceitos base para o trabalho prático", { x: 0.5, y: 2.35, w: 6.2, h: 0.5, fontSize: 13, italic: true, color: GREY, margin: 0 });
  s.addShape(pres.shapes.LINE, { x: 0.5, y: 3.0, w: 1.2, h: 0, line: { color: ORANGE, width: 3 } });
  s.addText([
    { text: "Orlando Santos", options: { bold: true } }, { text: "  –  a23134097@isec.pt", options: { color: GREY, breakLine: true } },
    { text: "Pedro Ferreira", options: { bold: true } }, { text: "  –  a2019141292@isec.pt", options: { color: GREY, breakLine: true } },
    { text: "Renalto Baticã", options: { bold: true } }, { text: "  –  a2022115534@isec.pt", options: { color: GREY } },
  ], { x: 0.5, y: 3.15, w: 6.2, h: 0.95, fontSize: 14, color: TXT, margin: 0, paraSpaceAfter: 3 });
  s.addText(`Serviços de Rede II  ·  Instituto Superior de Engenharia de Coimbra (ISEC)  ·  ${ANO}`, { x: 0.5, y: 4.4, w: 6.5, h: 0.3, fontSize: 11, color: GREY, margin: 0 });
  s.addNotes(`[Apresenta: ${A1}]
Bom dia a todos. Somos o Grupo 10: o Orlando Santos, o Pedro Ferreira e o Renalto Baticã.
O tema do nosso workshop é a integração de clientes Linux num domínio Windows gerido pelo Active Directory Domain Services, que a partir de agora vamos abreviar como AD DS.
Antes de passarmos à parte prática, queremos explicar os conceitos base: o que é o AD DS, porque existe, e que tecnologias permitem a um computador Linux usar as mesmas contas que um computador Windows.`);
}

// =====================================================================
// 2. SUMÁRIO
// =====================================================================
{
  const s = newSlide("Sumário");
  const items = [
    ["01", "O dia a dia antes e depois do AD DS", "Porque é que a gestão centralizada de identidades é necessária"],
    ["02", "O que é o AD DS e o que gere", "Utilizadores, diretório, autenticação e comunicação entre sistemas"],
    ["03", "Ligar o Windows Server ao mundo Linux", "As normas abertas que tornam a integração possível"],
    ["04", "SSSD e Winbind", "System Security Services Daemon e Winbind: os \"tradutores\" do Linux"],
    ["05", "Samba, PAM e Kerberos", "Pluggable Authentication Modules (PAM), partilhas e bilhetes de autenticação"],
    ["06", "Como tudo comunica", "Diagrama de sequência de um login: pedidos e respostas"],
    ["07", "Hands-on", "Passagem para o trabalho prático"],
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
Este é o percurso da apresentação. Começamos pelo problema do dia a dia e pela forma como o AD DS o resolveu. Depois vemos como é possível ligar o Windows Server a sistemas que não são da Microsoft, através do SSSD, o System Security Services Daemon, e do Winbind.
A seguir apresentamos as peças que trabalham por trás: o Samba, o PAM, que significa Pluggable Authentication Modules, e o Kerberos. No fim juntamos tudo num diagrama de sequência que mostra cada pedido e cada resposta durante um login, e passamos à parte prática.`);
}

// =====================================================================
// 3. ANTES E DEPOIS
// =====================================================================
{
  const s = newSlide("O dia a dia: antes e depois do AD DS", "Active Directory Domain Services (AD DS) – lançado com o Windows 2000 Server; nome atual desde o Windows Server 2008");
  // ANTES
  card(s, 0.5, 1.3, 4.05, 3.1, ICE2);
  s.addText("ANTES  ·  cada máquina por si", { x: 0.7, y: 1.4, w: 3.7, h: 0.4, fontSize: 15, bold: true, color: BAD, margin: 0 });
  s.addText(bullets([
    "Contas e passwords criadas à mão em cada computador (grupo de trabalho, ou workgroup)",
    "O mesmo utilizador com uma password diferente em cada máquina",
    "Alguém sai da organização? É preciso percorrer todas as máquinas",
    "Permissões e regras de segurança inconsistentes",
    "Windows NT 4.0: domínios planos, difíceis de escalar",
  ]), { x: 0.7, y: 1.85, w: 3.7, h: 2.5, fontSize: 12, color: TXT, valign: "top", margin: 0 });
  // seta
  hline(s, 4.68, 5.32, 2.85, { color: ORANGE, width: 3, end: true });
  s.addText("2000", { x: 4.55, y: 2.45, w: 0.9, h: 0.3, fontSize: 12, bold: true, color: ORANGE, align: "center", margin: 0 });
  // DEPOIS
  card(s, 5.45, 1.3, 4.05, 3.1, NAVY);
  s.addText("DEPOIS  ·  um domínio, uma identidade", { x: 5.65, y: 1.4, w: 3.7, h: 0.4, fontSize: 15, bold: true, color: AMBER, margin: 0 });
  s.addText(bullets([
    "Uma conta e uma password servem em qualquer máquina do domínio",
    "Criar, bloquear ou apagar contas num único ponto",
    "Base de dados hierárquica, replicada entre controladores de domínio",
    "Regras aplicadas a todos os computadores através de Group Policy Objects (GPO)",
    "Single Sign-On (SSO): autenticar uma vez, aceder a vários serviços",
  ]), { x: 5.65, y: 1.85, w: 3.7, h: 2.5, fontSize: 12, color: WHITE, valign: "top", margin: 0 });
  strip(s, "Hoje:", "a maioria das organizações tem o AD DS no centro da rede – e os computadores Linux têm de saber integrar-se nele.");
  s.addNotes(`[Apresenta: ${A1}]
Comecemos pelo dia a dia. Imaginem uma empresa com cem computadores. Sem um serviço central, cada computador tem as suas próprias contas: é o modelo de grupo de trabalho, ou workgroup. O mesmo funcionário tem passwords diferentes em cada máquina e, quando sai da empresa, alguém tem de percorrer todos os computadores para o desativar. As permissões acabam inconsistentes. O Windows NT 4.0 já tinha domínios, mas eram planos e difíceis de gerir em organizações grandes.
Em 2000, com o Windows 2000 Server, a Microsoft lançou o Active Directory. Desde o Windows Server 2008 o serviço chama-se Active Directory Domain Services, ou AD DS. A ideia é simples: uma conta e uma password servem em qualquer máquina do domínio, as contas geram-se num único ponto e as regras de segurança, as Group Policy Objects ou GPO, aplicam-se a todos os computadores. Ganha-se também Single Sign-On: autenticamo-nos uma vez e acedemos a vários serviços.
O problema que o nosso trabalho resolve é este: o AD DS nasceu para Windows, mas as organizações também têm Linux.`);
}

// =====================================================================
// 4. O QUE É O AD DS E O QUE GERE
// =====================================================================
{
  const s = newSlide("AD DS: finalidade e capacidades", "Um serviço de diretório: a base de dados central de quem é quem, o que pode fazer e onde");
  // centro
  card(s, 3.65, 1.25, 2.7, 3.02, NAVY);
  logo(s, 4.5, 1.55, 1.0, "windows-server");
  s.addText([{ text: "Domain Controller (DC)", options: { bold: true, fontSize: 14, color: WHITE, breakLine: true } },
    { text: "SR2-SRV · isec.local", options: { fontSize: 11, color: AMBER, breakLine: true } },
    { text: "base de dados NTDS.dit", options: { fontSize: 10.5, color: LIGHT } }],
    { x: 3.75, y: 2.75, w: 2.5, h: 1.1, align: "center", valign: "middle", margin: 0 });
  const L = [
    ["Utilizadores e grupos", "Contas, grupos e Unidades Organizacionais (OU) geridos num só sítio"],
    ["Diretório", "Base de dados hierárquica consultada por Lightweight Directory Access Protocol (LDAP)"],
    ["Autenticação", "Kerberos por omissão; NT LAN Manager (NTLM) só por compatibilidade"],
  ];
  const R = [
    ["Nomes e localização", "Domain Name System (DNS) integrado: registos SRV indicam onde estão os serviços"],
    ["Políticas", "GPO aplicadas a utilizadores e computadores de todo o domínio"],
    ["Comunicação entre sistemas", "Normas abertas: quem as fala – Linux incluído – pode juntar-se ao domínio"],
  ];
  const ys = [1.25, 2.3, 3.35], bw = 3.0, bh = 0.92;
  L.forEach(([h, d], i) => {
    box(s, 0.5, ys[i], bw, bh, h, d, { ss: 10.5 });
    hline(s, 0.5 + bw, 3.65, ys[i] + bh / 2, { color: RULE, width: 1 });
  });
  R.forEach(([h, d], i) => {
    box(s, 6.5, ys[i], bw, bh, h, d, { ss: 10.5 });
    hline(s, 6.35, 6.5, ys[i] + bh / 2, { color: RULE, width: 1 });
  });
  strip(s, "Finalidade:", "gestão centralizada de identidades – autenticar (quem és?), autorizar (o que podes?) e localizar recursos.", 4.5);
  s.addNotes(`[Apresenta: ${A1}]
O AD DS é um serviço de diretório. Um diretório é uma base de dados otimizada para ser lida muitas vezes: guarda quem é quem, a que grupos pertence e que recursos existem. No servidor, essa base de dados é o ficheiro NTDS.dit, e a máquina que a mantém chama-se Domain Controller, ou DC. No nosso laboratório o DC é o SR2-SRV e o domínio é isec.local.
À volta do DC estão as capacidades que nos interessam. Gere utilizadores e grupos, organizados em Unidades Organizacionais, ou OU. Disponibiliza o diretório através do Lightweight Directory Access Protocol, o LDAP. Autentica com Kerberos, ficando o NT LAN Manager, NTLM, apenas para compatibilidade com sistemas antigos. Tem um Domain Name System, DNS, integrado, cujos registos SRV dizem aos clientes onde está o DC. Aplica políticas, as GPO.
E o ponto mais importante para nós: tudo isto assenta em protocolos normalizados. Qualquer sistema que os saiba falar, incluindo o Linux, pode participar no domínio.`);
}

// =====================================================================
// 5. LIGAR O WINDOWS SERVER A TECNOLOGIAS EXTERIORES
// =====================================================================
{
  const s = newSlide("Ligar o Windows Server a tecnologias exteriores", "O AD DS não é uma caixa fechada: expõe protocolos normalizados que outros sistemas podem usar");
  // Windows
  card(s, 0.5, 1.3, 2.35, 3.05, NAVY);
  logo(s, 1.27, 1.45, 0.8, "windows-server");
  s.addText([{ text: "Windows Server", options: { bold: true, color: WHITE, fontSize: 14, breakLine: true } }, { text: "DC com AD DS e DNS", options: { color: AMBER, fontSize: 11, breakLine: true } },
    { text: "conhece todos os utilizadores e as suas passwords", options: { color: LIGHT, fontSize: 10.5 } }],
    { x: 0.6, y: 2.35, w: 2.15, h: 1.85, align: "center", valign: "top", margin: 0 });
  // Linux
  card(s, 7.15, 1.3, 2.35, 3.05, ICE2);
  logo(s, 7.92, 1.45, 0.8, "ubuntu");
  s.addText([{ text: "Cliente Ubuntu", options: { bold: true, color: NAVY, fontSize: 14, breakLine: true } }, { text: "sozinho só conhece", options: { color: GREY, fontSize: 10.5, breakLine: true } },
    { text: "/etc/passwd e /etc/shadow", options: { color: TXT, fontSize: 10.5, fontFace: "Courier New", breakLine: true } },
    { text: "precisa de um intermediário", options: { color: ORANGE, bold: true, fontSize: 11 } }],
    { x: 7.25, y: 2.35, w: 2.15, h: 1.85, align: "center", valign: "top", margin: 0 });
  const P = [
    ["DNS · porta 53", "encontrar o DC (registos SRV)"],
    ["Kerberos · porta 88", "provar a identidade com bilhetes"],
    ["LDAP · porta 389", "ler utilizadores, grupos e atributos"],
    ["SMB · porta 445", "Server Message Block: partilhas e domínio"],
    ["NTP · porta 123", "Network Time Protocol: acertar os relógios"],
  ];
  P.forEach(([p, d], i) => {
    const y = 1.42 + i * 0.6;
    hline(s, 2.95, 7.05, y + 0.42, { color: i === 1 ? ORANGE : NAVY, width: 1.5, start: true, end: true });
    s.addText([{ text: p, options: { bold: true, color: i === 1 ? ORANGE : NAVY, fontSize: 12 } }, { text: "   " + d, options: { color: TXT, fontSize: 10.5 } }],
      { x: 3.0, y, w: 4.0, h: 0.38, align: "center", valign: "bottom", margin: 0 });
  });
  strip(s, "Ideia-chave:", "o intermediário do lado Linux fala estes protocolos em nome do sistema – é esse o papel do SSSD e do Winbind.", 4.55);
  s.addNotes(`[Apresenta: ${A2}]
Como é que um sistema que não é da Microsoft consegue usar o AD DS? A resposta é que o AD DS não é uma caixa fechada. Por baixo usa protocolos normalizados, cada um numa porta conhecida.
O DNS, na porta 53, permite ao cliente descobrir onde está o DC. O Kerberos, na porta 88, permite provar a identidade sem enviar a password pela rede. O LDAP, na porta 389, permite ler os utilizadores e os grupos. O SMB, Server Message Block, na porta 445, serve para partilhar ficheiros e para juntar a máquina ao domínio. E o NTP, Network Time Protocol, na porta 123, mantém os relógios acertados, o que o Kerberos exige.
Do lado direito está o Ubuntu. Por omissão só conhece as contas locais, guardadas em /etc/passwd e /etc/shadow. Precisa de um intermediário que fale estes protocolos em seu nome. É aí que entram o SSSD e o Winbind.`);
}

// =====================================================================
// 6. SSSD E WINBIND
// =====================================================================
{
  const s = newSlide("SSSD e Winbind: os \"tradutores\" do Linux", "Dois serviços que ensinam o Linux a perguntar ao AD DS quem são os utilizadores e se a password está correta");
  const cols = [
    { x: 0.5, logoKey: null, abbr: "SSSD", head: "SSSD", full: "System Security Services Daemon", rows: [
      ["O que é", "Serviço (daemon) moderno de identidade, nascido no projeto FreeIPA (Red Hat)"],
      ["Para que serve", "Liga o Linux a diretórios remotos: AD DS, LDAP ou FreeIPA"],
      ["Como fala com o AD", "Diretamente por LDAP e Kerberos; junção ao domínio com realm join"],
      ["Ponto forte", "Cache de credenciais: o login funciona mesmo sem rede (offline)"],
    ] },
    { x: 5.1, logoKey: "samba", head: "Winbind", full: "componente winbindd do Samba", rows: [
      ["O que é", "Serviço do pacote Samba que trata das identidades do domínio Windows"],
      ["Para que serve", "Traduz o Security Identifier (SID) do Windows em User ID / Group ID (UID/GID)"],
      ["Como fala com o AD", "Remote Procedure Call (RPC) da Microsoft, LDAP e Kerberos; junção com net ads join"],
      ["Ponto forte", "Ideal quando o Linux também partilha ficheiros com Samba"],
    ] },
  ];
  cols.forEach((c) => {
    card(s, c.x, 1.25, 4.4, 3.15, WHITE);
    if (c.logoKey) logo(s, c.x + 0.15, 1.35, 0.6, c.logoKey); else badge(s, c.x + 0.15, 1.35, 0.6, c.abbr, ORANGE, WHITE, 11);
    s.addText([{ text: c.head, options: { bold: true, color: NAVY, fontSize: 16, breakLine: true } }, { text: c.full, options: { color: GREY, fontSize: 11 } }],
      { x: c.x + 0.9, y: 1.33, w: 3.4, h: 0.62, valign: "middle", margin: 0 });
    c.rows.forEach(([k, v], i) => {
      const y = 2.05 + i * 0.58;
      s.addShape(pres.shapes.LINE, { x: c.x + 0.15, y: y - 0.04, w: 4.1, h: 0, line: { color: BORDER, width: 0.75 } });
      s.addText(k, { x: c.x + 0.15, y, w: 1.4, h: 0.5, fontSize: 10, bold: true, color: ORANGE, valign: "middle", margin: 0 });
      s.addText(v, { x: c.x + 1.6, y, w: 2.7, h: 0.5, fontSize: 10.5, color: TXT, valign: "middle", margin: 0 });
    });
  });
  strip(s, "Em comum:", "ambos expõem as contas do AD através do Name Service Switch (NSS) e autenticam através do PAM. No laboratório: ubuclient → SSSD · UBU-WINBIND → Winbind.", 4.5, 0.6);
  s.addNotes(`[Apresenta: ${A2}]
Os dois intermediários mais usados são o SSSD e o Winbind. Funcionam como tradutores: recebem os pedidos do Linux e transformam-nos em perguntas ao AD DS.
O SSSD, System Security Services Daemon, é um serviço moderno que nasceu no projeto FreeIPA da Red Hat e hoje é a opção recomendada pela Canonical para o Ubuntu. Fala diretamente LDAP e Kerberos com o DC, junta-se ao domínio com o comando realm join e, como guarda uma cache de credenciais, permite fazer login mesmo sem ligação ao servidor.
O Winbind é o componente winbindd do pacote Samba. A sua tarefa principal é traduzir identidades: no Windows cada utilizador tem um Security Identifier, ou SID, enquanto o Linux usa números, o User ID e o Group ID. O Winbind fala com o DC por Remote Procedure Call da Microsoft, LDAP e Kerberos, e junta-se ao domínio com net ads join. É a escolha natural quando o Linux também partilha ficheiros com Samba.
O que têm em comum: ambos disponibilizam as contas do AD ao sistema através do Name Service Switch, o NSS, e autenticam através do PAM. No laboratório vamos testar os dois: o cliente ubuclient com SSSD e o cliente UBU-WINBIND com Winbind.`);
}

// =====================================================================
// 7. INTRODUÇÃO: O PAPEL DE CADA PEÇA
// =====================================================================
{
  const s = newSlide("As peças por trás da integração: o papel de cada uma", "Antes de as estudar em detalhe: o que cada uma faz quando um utilizador do domínio entra no Linux");
  const cols = [
    { key: "samba", name: "Samba", role: "O intérprete", what: "Fala a língua do Windows (SMB e RPC): junta a máquina ao domínio e dá acesso às partilhas", ana: "Traduz o pedido do Linux para a língua do Windows." },
    { badge: "PAM", name: "PAM", role: "A porta", what: "Decide como se valida quem entra: password local, domínio, cria a pasta pessoal…", ana: "Escolhe que perguntas faz antes de abrir." },
    { badge: "K", name: "Kerberos", role: "O bilhete", what: "Prova a identidade junto do DC sem enviar a password pela rede", ana: "Mostra-se a senha uma vez e recebe-se um passe temporário." },
  ];
  const w = 2.85, g = 0.225, y = 1.3, h = 2.65;
  cols.forEach((c, i) => {
    const x = 0.5 + i * (w + g);
    card(s, x, y, w, h, WHITE);
    if (c.key) logo(s, x + 0.2, y + 0.18, 0.7, c.key); else badge(s, x + 0.2, y + 0.18, 0.7, c.badge, i === 1 ? NAVY : ORANGE, WHITE, c.badge.length > 1 ? 14 : 22);
    s.addText([{ text: c.name, options: { bold: true, fontSize: 16, color: NAVY, breakLine: true } }, { text: c.role, options: { fontSize: 13, color: ORANGE, bold: true } }],
      { x: x + 1.05, y: y + 0.15, w: w - 1.15, h: 0.75, valign: "middle", margin: 0 });
    s.addText(c.what, { x: x + 0.2, y: y + 1.0, w: w - 0.4, h: 0.85, fontSize: 11.5, color: TXT, valign: "top", margin: 0 });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.15, y: y + 1.98, w: w - 0.3, h: 0.52, rectRadius: 0.05, fill: { color: NOTE }, line: { color: NOTE } });
    s.addText(c.ana, { x: x + 0.25, y: y + 1.98, w: w - 0.5, h: 0.52, fontSize: 10, italic: true, color: TXT, valign: "middle", margin: 0 });
  });
  // cadeia
  const chain = ["PAM pede a validação", "SSSD / Winbind pergunta ao DC", "Kerberos confirma a identidade", "Samba abre as partilhas"];
  const cw = 2.0, cg = 0.33;
  chain.forEach((t, i) => {
    const x = 0.5 + i * (cw + cg);
    card(s, x, 4.3, cw, 0.6, i % 2 ? ICE2 : NAVY);
    s.addText(t, { x: x + 0.05, y: 4.3, w: cw - 0.1, h: 0.6, fontSize: 11, bold: true, color: i % 2 ? NAVY : WHITE, align: "center", valign: "middle", margin: 0 });
    if (i < chain.length - 1) hline(s, x + cw + 0.04, x + cw + cg - 0.04, 4.6, { color: ORANGE, width: 2, end: true });
  });
  s.addNotes(`[Apresenta: ${A2}]
O SSSD e o Winbind não trabalham sozinhos. Antes de vermos cada peça em detalhe, vale a pena perceber o papel de cada uma com uma imagem simples.
O Samba é o intérprete: fala a língua do Windows, o SMB e o RPC, e é com ele que a máquina se junta ao domínio e acede às pastas partilhadas.
O PAM, Pluggable Authentication Modules, é a porta: é ele que decide que verificações se fazem antes de deixar alguém entrar.
O Kerberos é o bilhete: a password é usada uma vez para obter um passe temporário, e é esse passe que circula na rede.
Em baixo está a ordem em que atuam: o PAM pede a validação, o SSSD ou o Winbind perguntam ao DC, o Kerberos confirma a identidade e o Samba abre as partilhas.`);
}

// =====================================================================
// 8. SAMBA
// =====================================================================
{
  const s = newSlide("Samba: a ponte entre Linux e Windows", "Software livre (desde 1992) que implementa em Linux/Unix os protocolos de rede da Microsoft");
  logo(s, 8.75, 0.2, 0.75, "samba");
  card(s, 0.5, 1.3, 5.5, 3.1, WHITE);
  s.addText("O que é e para que serve", { x: 0.7, y: 1.4, w: 5.1, h: 0.35, fontSize: 14, bold: true, color: NAVY, margin: 0 });
  s.addText(bullets([
    "Implementa o Server Message Block / Common Internet File System (SMB/CIFS) e o RPC da Microsoft",
    "Partilha ficheiros e impressoras entre Linux e Windows",
    "Junta o Linux ao domínio como membro (net ads join) – pode até ser um DC (Samba 4)",
  ]), { x: 0.7, y: 1.8, w: 5.1, h: 1.25, fontSize: 11.5, color: TXT, valign: "top", margin: 0 });
  const comps = [["smbd", "partilhas"], ["winbindd", "identidades"], ["nmbd", "nomes NetBIOS"], ["smbclient", "e net: ferramentas"]];
  comps.forEach(([n, d], i) => {
    const x = 0.7 + i * 1.29;
    card(s, x, 3.2, 1.2, 0.95, ICE2);
    s.addText([{ text: n, options: { fontFace: "Courier New", bold: true, fontSize: 10, color: NAVY, breakLine: true } }, { text: d, options: { fontSize: 9.5, color: GREY } }],
      { x: x + 0.04, y: 3.2, w: 1.12, h: 0.95, align: "center", valign: "middle", margin: 0 });
  });
  darkCard(s, 6.2, 1.3, 3.3, 3.1, "Papel fulcral no projeto", [
    "Sem Samba o Linux não fala SMB nem RPC com o DC",
    "É a base do Winbind e das ferramentas de junção ao domínio",
    "Permite aceder à partilha SRII do servidor (smbclient, cifs-utils)",
  ], 11.5);
  strip(s, "Ficheiros e comandos:", "/etc/samba/smb.conf · net ads join -U Administrator · smbclient //SR2-SRV/SRII -k", 4.55, 0.5, true);
  s.addNotes(`[Apresenta: ${A2}]
O Samba é software livre, criado em 1992, que implementa em Linux e Unix os protocolos de rede da Microsoft: o Server Message Block, também conhecido por Common Internet File System, e o RPC da Microsoft.
Serve para partilhar ficheiros e impressoras entre os dois mundos e para juntar um Linux a um domínio Windows como membro. Desde a versão 4 consegue até ser ele próprio um controlador de domínio compatível com o AD.
É composto por vários serviços: o smbd trata das partilhas, o winbindd das identidades, o nmbd dos nomes NetBIOS, e há ferramentas como o smbclient e o net.
O seu papel é fulcral porque, sem ele, o Linux não fala SMB nem RPC com o DC. É a base do Winbind, é usado nas ferramentas de junção ao domínio e é o que nos dá acesso à partilha SRII do servidor. A configuração principal está no ficheiro smb.conf.`);
}

// =====================================================================
// 9. PAM
// =====================================================================
{
  const s = newSlide("PAM: Pluggable Authentication Modules", "Uma camada modular que separa as aplicações do método de autenticação");
  badge(s, 8.75, 0.2, 0.75, "PAM", NAVY, WHITE, 14);
  // aplicações
  const apps = ["login", "gdm", "sshd", "sudo"];
  apps.forEach((a, i) => {
    card(s, 0.5 + i * 0.95, 1.3, 0.85, 0.42, ICE2);
    s.addText(a, { x: 0.5 + i * 0.95, y: 1.3, w: 0.85, h: 0.42, fontFace: "Courier New", fontSize: 10.5, bold: true, color: NAVY, align: "center", valign: "middle", margin: 0 });
  });
  s.addText("aplicações que pedem autenticação", { x: 4.35, y: 1.3, w: 1.75, h: 0.42, fontSize: 9.5, italic: true, color: GREY, valign: "middle", margin: 0 });
  s.addShape(pres.shapes.LINE, { x: 2.3, y: 1.74, w: 0, h: 0.22, line: { color: ORANGE, width: 2, endArrowType: "triangle" } });
  // pilha
  const rows = [
    ["auth", "quem és? valida a password", "pam_sss, pam_winbind, pam_unix"],
    ["account", "a conta pode entrar agora?", "pam_sss, pam_unix"],
    ["password", "mudar a password", "pam_sss, pam_winbind"],
    ["session", "preparar a sessão", "pam_mkhomedir, pam_mount"],
  ];
  card(s, 0.5, 2.0, 5.6, 2.4, WHITE);
  s.addText("/etc/pam.d/common-*", { x: 0.65, y: 2.05, w: 5.3, h: 0.3, fontFace: "Courier New", fontSize: 10.5, bold: true, color: ORANGE, margin: 0 });
  rows.forEach(([t, d, m], i) => {
    const y = 2.4 + i * 0.49;
    card(s, 0.65, y, 1.05, 0.42, NAVY);
    s.addText(t, { x: 0.65, y, w: 1.05, h: 0.42, fontSize: 11, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    s.addText(d, { x: 1.8, y, w: 1.75, h: 0.42, fontSize: 10, color: TXT, valign: "middle", margin: 0 });
    s.addText(m, { x: 3.55, y, w: 2.5, h: 0.42, fontSize: 9, fontFace: "Courier New", color: NAVY, valign: "middle", margin: 0 });
  });
  darkCard(s, 6.3, 1.3, 3.2, 3.1, "Papel no projeto", [
    "Troca a pergunta \"está nos ficheiros locais?\" por \"o AD aceita?\"",
    "pam_sss ou pam_winbind autenticam no domínio",
    "pam_mkhomedir cria a pasta pessoal no 1.º login",
    "pam_mount monta a partilha SRII",
  ], 11);
  strip(s, "PAM e NSS:", "o PAM responde a \"provas quem és?\"; o Name Service Switch (NSS) a \"este utilizador existe?\" (getent passwd).", 4.55, 0.5);
  s.addNotes(`[Apresenta: ${A3}]
O PAM, Pluggable Authentication Modules, é o mecanismo do Linux que decide como se autentica um utilizador. Programas como o login, o ecrã de entrada gdm, o sshd ou o sudo não verificam passwords sozinhos: pedem ao PAM.
O PAM organiza-se numa pilha de módulos, configurada nos ficheiros common da pasta /etc/pam.d, em quatro tipos. O auth valida a identidade. O account verifica se a conta pode entrar naquele momento. O password trata da mudança de password. E o session prepara a sessão.
A vantagem é ser modular: para passar a autenticar no AD não mudamos nenhuma aplicação, apenas acrescentamos módulos. O pam_sss ou o pam_winbind fazem a autenticação no domínio, o pam_mkhomedir cria a pasta pessoal no primeiro login e o pam_mount monta automaticamente a partilha SRII.
Uma nota importante: o PAM responde à pergunta "provas quem és?", enquanto o NSS, Name Service Switch, responde a "este utilizador existe?". É por isso que o comando getent passwd mostra os utilizadores do domínio.`);
}

// =====================================================================
// 10. KERBEROS
// =====================================================================
{
  const s = newSlide("Kerberos: autenticação por bilhetes", "Protocolo de autenticação em rede (MIT, versão 5) baseado num terceiro de confiança");
  badge(s, 8.75, 0.2, 0.75, "KRB", ORANGE, WHITE, 14);
  // mini-sequência
  card(s, 0.5, 1.3, 5.6, 3.1, WHITE);
  const P = ["Cliente", "Key Distribution Center (KDC)", "Serviço (ex.: SRII)"];
  const xs = [1.25, 3.3, 5.3], top = 1.42, bh = 0.5;
  P.forEach((p, i) => {
    card(s, xs[i] - 0.68, top, 1.36, bh, i === 1 ? NAVY : ICE2);
    s.addText(p, { x: xs[i] - 0.66, y: top, w: 1.32, h: bh, fontSize: 9.5, bold: true, color: i === 1 ? WHITE : NAVY, align: "center", valign: "middle", margin: 0 });
    vline(s, xs[i], top + bh, 4.3, { dash: true });
  });
  const M = [
    [0, 1, "1. AS-REQ: sou o aluno (prova com a password)", false],
    [1, 0, "2. AS-REP: Ticket Granting Ticket (TGT)", true],
    [0, 1, "3. TGS-REQ: TGT + quero aceder à SRII", false],
    [1, 0, "4. TGS-REP: bilhete de serviço", true],
    [0, 2, "5. AP-REQ: apresenta o bilhete de serviço", false],
    [2, 0, "6. acesso concedido – a password nunca viajou", true],
  ];
  M.forEach(([f, t, l, ret], i) => {
    const y = 2.25 + i * 0.35;
    const x1 = Math.min(xs[f], xs[t]), x2 = Math.max(xs[f], xs[t]);
    hline(s, x1, x2, y, { color: ret ? GREY : NAVY, width: 1.25, dash: ret, end: xs[t] > xs[f], start: xs[t] < xs[f] });
    const lw = l.length * 0.058 + 0.12;
    s.addText(l, { x: (x1 + x2) / 2 - lw / 2, y: y - 0.23, w: lw, h: 0.2, fontSize: 8.5, color: ret ? GREY : TXT, fill: { color: WHITE }, align: "center", valign: "middle", margin: 0 });
  });
  darkCard(s, 6.3, 1.3, 3.2, 3.1, "Papel no projeto", [
    "No AD DS, todo o DC é um KDC",
    "SSSD e Winbind usam-no para validar o login",
    "Single Sign-On: o mesmo bilhete abre a partilha SRII",
    "Exige relógios acertados (máx. 5 min) – Chrony/NTP",
  ], 11);
  strip(s, "Ficheiros e comandos:", "/etc/krb5.conf (realm ISEC.LOCAL) · kinit aluno · klist", 4.55, 0.5, true);
  s.addNotes(`[Apresenta: ${A3}]
O Kerberos é o protocolo de autenticação usado pelo AD DS. Foi criado no MIT e a versão atual é a 5. Baseia-se num terceiro de confiança, o Key Distribution Center, ou KDC. No AD DS, todos os controladores de domínio são KDC.
O funcionamento resume-se a bilhetes. Primeiro, o cliente faz um pedido ao serviço de autenticação, o AS-REQ, protegido com uma chave derivada da password. Se estiver correta, recebe um Ticket Granting Ticket, o TGT, que é o passe geral. Depois, sempre que quer usar um serviço, por exemplo a partilha SRII, apresenta o TGT e recebe um bilhete específico para esse serviço. Por fim, mostra esse bilhete ao serviço e entra.
O ponto importante é que a password nunca atravessa a rede e, com o mesmo TGT, o utilizador acede a vários serviços sem voltar a escrevê-la: é o Single Sign-On.
Há um requisito que causa muitos erros: os relógios do cliente e do servidor não podem diferir mais de cinco minutos. Por isso configuramos o Chrony com NTP. A configuração do cliente está no ficheiro krb5.conf, e os comandos kinit e klist permitem pedir e ver os bilhetes.`);
}

// =====================================================================
// 11. DIAGRAMA DE SEQUÊNCIA COMPLETO
// =====================================================================
{
  const s = newSlide("Como tudo comunica: login de um utilizador do domínio", null);
  const parts = ["Utilizador", "PAM", "SSSD / Winbind", "DNS", "KDC (Kerberos)", "LDAP", "SMB · SRII"];
  const x0 = 0.5, W = 9.0, n = parts.length, colW = W / n, cx = parts.map((_, i) => x0 + colW * (i + 0.5));
  const gy = 0.98, py = 1.24, ph = 0.4, bottom = 5.1, bw = colW - 0.1;
  // grupos
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
  const msgs = [
    [0, 1, "1. nome + password (ecrã gdm)"],
    [1, 2, "2. pam_sss / pam_winbind"],
    [2, 3, "3. onde está o KDC? (SRV)"],
    [3, 2, "4. SR2-SRV.isec.local", 1],
    [2, 4, "5. AS-REQ (chave da password)"],
    [4, 2, "6. AS-REP: TGT → password correta", 1],
    [2, 5, "7. procura utilizador e grupos (via Kerberos)"],
    [5, 2, "8. atributos, SID → UID/GID", 1],
    [2, 1, "9. sucesso (credenciais em cache)", 1],
    [1, 1, "10. pam_mkhomedir cria /home/aluno"],
    [1, 6, "11. pam_mount: montar SRII com o bilhete Kerberos"],
    [6, 1, "12. partilha montada", 1],
    [1, 0, "13. sessão iniciada", 1],
  ];
  const y1 = py + ph + 0.08, rowH = (bottom - y1) / msgs.length;
  msgs.forEach(([f, t, label, ret], i) => {
    const y = y1 + rowH * (i + 0.72);
    if (f === t) {
      const nw = colW * 1.7, nx = cx[f] - 0.1;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: nx, y: y - rowH * 0.62, w: nw, h: rowH * 0.7, rectRadius: 0.04, fill: { color: NOTE }, line: { color: AMBER, width: 0.75 } });
      s.addText(label, { x: nx + 0.05, y: y - rowH * 0.62, w: nw - 0.1, h: rowH * 0.7, fontSize: 9, color: TXT, align: "center", valign: "middle", margin: 0 });
      return;
    }
    const x1 = Math.min(cx[f], cx[t]), x2 = Math.max(cx[f], cx[t]);
    const krb = t === 4 || f === 4;
    hline(s, x1, x2, y, { color: ret ? GREY : krb ? ORANGE : NAVY, width: 1.25, dash: !!ret, end: cx[t] > cx[f], start: cx[t] < cx[f] });
    const lw = label.length * 0.062 + 0.14, lx = Math.min(Math.max((x1 + x2) / 2 - lw / 2, x0), x0 + W - lw);
    s.addText(label, { x: lx, y: y - 0.21, w: lw, h: 0.18, fontSize: 9, color: ret ? GREY : TXT, fill: { color: WHITE }, align: "center", valign: "middle", margin: 0 });
  });
  s.addNotes(`[Apresenta: ${A3}]
Este diagrama de sequência junta todas as peças. Cada seta é um pedido ou uma resposta; as setas a tracejado são as respostas.
1 e 2. O utilizador escreve o nome e a password no ecrã de entrada. O gdm pede ao PAM, e o PAM, através do módulo pam_sss ou pam_winbind, passa o pedido ao SSSD ou ao Winbind.
3 e 4. O SSSD pergunta ao DNS onde está o KDC, usando os registos SRV, e recebe o nome do servidor SR2-SRV.isec.local. Se o DNS estiver mal configurado, tudo falha aqui.
5 e 6. O SSSD faz o pedido de autenticação Kerberos. Se o KDC devolver um TGT, a password está correta.
7 e 8. Com a ligação autenticada por Kerberos, o SSSD procura no LDAP os dados e os grupos do utilizador, e traduz o SID do Windows em UID e GID do Linux.
9 e 10. O SSSD devolve sucesso ao PAM e guarda as credenciais em cache. O PAM cria a pasta pessoal com o pam_mkhomedir.
11 e 12. O pam_mount monta a partilha SRII por SMB, usando o bilhete Kerberos, sem voltar a pedir a password.
13. A sessão é iniciada. O utilizador está no Linux com a conta do Windows e já tem os seus ficheiros da rede.
É exatamente este fluxo que vamos montar, passo a passo, na parte prática.`);
}

// =====================================================================
// 12. AGRADECIMENTO + HANDS-ON
// =====================================================================
{
  const s = pres.addSlide({ masterName: "CAPA" });
  s.addShape(pres.shapes.OVAL, { x: 6.5, y: 0.75, w: 4.4, h: 4.4, fill: { color: ORANGE }, line: { color: ORANGE } });
  s.addText(">_", { x: 6.5, y: 0.75, w: 4.4, h: 4.4, fontSize: 110, bold: true, color: WHITE, fontFace: "Courier New", align: "center", valign: "middle", margin: 0 });
  s.addText("Obrigado pela atenção!", { x: 0.5, y: 0.9, w: 6.0, h: 1.0, fontSize: 36, bold: true, color: NAVY, valign: "bottom", margin: 0 });
  s.addText("Hands-on: mãos ao projeto", { x: 0.5, y: 1.95, w: 6.0, h: 0.6, fontSize: 26, bold: true, color: ORANGE, margin: 0 });
  s.addShape(pres.shapes.LINE, { x: 0.5, y: 2.75, w: 1.2, h: 0, line: { color: ORANGE, width: 3 } });
  s.addText(bullets([
    [{ text: "Parte A  ", options: { bold: true, color: NAVY } }, { text: "– Windows Server: AD DS, DNS, utilizadores e partilha SRII" }],
    [{ text: "Parte B  ", options: { bold: true, color: NAVY } }, { text: "– clientes Ubuntu no domínio com SSSD e com Winbind" }],
  ]), { x: 0.5, y: 2.95, w: 5.8, h: 0.8, fontSize: 13, color: TXT, margin: 0 });
  s.addText("Sigam o guião do workshop. Dúvidas? Estamos por aqui.", { x: 0.5, y: 3.95, w: 5.8, h: 0.4, fontSize: 13, italic: true, color: GREY, margin: 0 });
  s.addNotes(`[Apresentam: ${A1}, ${A2} e ${A3}]
Obrigado pela atenção. Se houver perguntas sobre os conceitos, respondemos agora.
A seguir começa a parte prática, o hands-on. Na Parte A configuramos o Windows Server com o AD DS, o DNS, os utilizadores e a partilha SRII. Na Parte B juntamos os clientes Ubuntu ao domínio, um com SSSD e outro com Winbind. Sigam o guião do workshop; nós vamos circulando para ajudar.`);
}

pres.writeFile({ fileName: OUT }).then((f) => console.log("written", f));
