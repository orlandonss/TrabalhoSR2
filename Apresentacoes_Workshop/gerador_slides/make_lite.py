"""Deriva build_lite.js (versão resumida) a partir de build.js (versão completa)."""
import io, re, sys

src = io.open(sys.argv[1], encoding="utf-8").read()
out_path = sys.argv[2]

def rep(old, new, count=1):
    global src
    n = src.count(old)
    if n != count:
        raise SystemExit(f"esperava {count}, encontrei {n}: {old[:90]!r}")
    src = src.replace(old, new)

def match_brace(s, i):
    """i aponta para '{'; devolve o índice a seguir ao '}' correspondente."""
    depth = 0
    for j in range(i, len(s)):
        if s[j] == "{": depth += 1
        elif s[j] == "}":
            depth -= 1
            if depth == 0:
                return j + 1
    raise SystemExit("chavetas desequilibradas")

def remove_calls(fn):
    global src
    while True:
        # só chamadas de topo (início de linha), não a definição da função
        i = src.find("\n" + fn + "({")
        if i < 0: return
        i += 1
        j = match_brace(src, i + len(fn) + 1)
        assert src[j:j + 2] == ");", src[j:j + 10]
        src = src[:i] + src[j + 3:]

def slide_block(title):
    """Encontra o bloco { const s = newSlide(..., "title"...) ... } e devolve (início, fim)."""
    m = re.search(r'newSlide\([^,]+, "' + re.escape(title) + '"', src)
    if not m: raise SystemExit("slide não encontrado: " + title)
    i = src.rfind("\n{\n", 0, m.start()) + 1
    return i, match_brace(src, i) + 1  # inclui a quebra de linha

def remove_slide(title):
    global src
    i, j = slide_block(title)
    src = src[:i] + src[j:]

# ---------- 1. Retirar detalhe ----------
for fn in ("howWhySlide", "filesSlide", "fileMap"):
    remove_calls(fn)
for t in ["Glossário de siglas", "Conceitos-chave (1/2): domínio e diretório", "Conceitos-chave (2/2): identidade e autenticação",
          "Alternativas: porque não as usámos", "Como o Samba se integra", "Identidades no Linux: NSS, SSSD e Winbind",
          "Qual escolher? A nossa recomendação", "Criar utilizadores e grupos no servidor", "Limitar quem pode entrar em cada cliente",
          "GPO e mapeamento para o Linux", "adsys: o que se pode gerir a partir do AD",
          # simplificação extra: menos esquemas e tabelas
          "Quem faz o quê no projeto", "Outras componentes avançadas", "Fluxo de informação entre as VMs",
          "Kerberos: obter o ticket (TGT)", "Join ao domínio: realm join (SSSD)", "Autenticação de utilizadores com Winbind",
          "Montagem automática da SRII (pam_mount)", "Limitar o acesso a pastas: exemplo da SRII", "adsys: como uma GPO chega ao Ubuntu",
          "Como o PAM se integra", "Winbind vs SSSD: comparação"]:
    remove_slide(t)

# ---------- 2. O login passo a passo passa para o bloco do Pedro ----------
i, j = slide_block("Autenticação de utilizadores com SSSD")
moved = src[i:j].replace("${A3}", "${A2}").replace("newSlide(S3,", "newSlide(S2,")
moved = moved.replace("\n[Captura sugerida: imagens/14-login.png.]`);",
                      "\nPasso agora a palavra ao Renalto, que vai mostrar o lado do servidor.\n[Captura sugerida: imagens/14-login.png.]`);")
assert "Passo agora a palavra ao Renalto" in moved
src = src[:i] + src[j:]
k = src.index("const S3 = ")
src = src[:k] + moved + "\n" + src[k:]

# Separadores com novos tópicos e notas
i = src.index('divider(S3, "03",')
j = src.index("`);", i) + 3
src = src[:i] + '''divider(S3, "03", "Comparação, servidor e permissões", ["Winbind vs SSSD", "Servidor como gestor", "Utilizadores e grupos", "Permissões"], A3,
  `[Apresenta: ${A3}]
Obrigado, Pedro. No último bloco começo por comparar o Winbind com o SSSD. Depois vemos o lado do servidor: porque é que é o gestor central, como se organizam os utilizadores e os grupos e como se controla o acesso à partilha SRII. Terminamos com a conclusão.`)''' + src[j:]
rep('divider(S2, "02", "Integração do Linux e componentes avançadas", ["Winbind", "SSSD", "PAM", "adsys", "2FA", "Alternativas", "Arquitetura", "Fluxo de informação"], A2,',
    'divider(S2, "02", "Integração do Linux", ["Winbind", "SSSD", "PAM", "adsys", "2FA", "Arquitetura", "Um login passo a passo"], A2,')
rep("Para cada uma vemos primeiro o que é, para que serve e o seu papel no projeto, e depois como funciona e porque a escolhemos.",
    "Para cada uma vemos o que é, para que serve, o papel que tem no projeto e porque a escolhemos.")

# ---------- 3. Índice ----------
i = src.index('    ["01", "Contexto, siglas e conceitos"')
j = src.index("  ];", i)
src = src[:i] + '''    ["01", "Contexto e visão geral", "Porquê este trabalho e o mapa das tecnologias"],
    ["02", "Tecnologias de base", "AD DS, Kerberos, Chrony e Samba"],
    ["03", "Integração do Linux", "Winbind, SSSD, PAM, adsys e 2FA"],
    ["04", "Arquitetura e login", "O laboratório e um login passo a passo"],
    ["05", "Winbind vs SSSD", "Vantagens e desvantagens"],
    ["06", "Servidor e permissões", "Utilizadores, grupos e acesso à SRII"],
    ["07", "Conclusão", "Síntese e o que se segue"],
''' + src[j:]
i = src.index("Este é o roteiro.")
j = src.index("`);", i)
src = src[:i] + "Este é o roteiro. Começamos pelo contexto e por uma visão geral das tecnologias, com uma analogia simples. Depois apresentamos as tecnologias de base e as que integram o Linux no domínio, a arquitetura do laboratório e um login passo a passo. Por fim, comparamos o Winbind com o SSSD, vemos o lado do servidor e terminamos com a conclusão." + src[j:]

# ---------- 3b. Cartões das tecnologias com 2 pontos, letra maior ----------
rep("s.addText(bullets(c.items), { x: x + 0.2, y: y + 0.68, w: w - 0.35, h: h - 0.8, fontSize: 13,",
    "s.addText(bullets(c.items.slice(0, 2)), { x: x + 0.2, y: y + 0.68, w: w - 0.35, h: h - 0.8, fontSize: 14,")

# ---------- 4. Menos «cara de IA» ----------
# sem subtítulos em itálico
rep('''function tagline(s, text, color = GREY) {
  s._hasTag = true;''', '''function tagline(s, text, color = GREY) {
  return;''')
# títulos sem travessões
rep('title: "Chrony – sincronização de tempo"', 'title: "Chrony"')
rep('title: "PAM – Pluggable Authentication Modules"', 'title: "PAM"')
rep('title: "adsys – GPO no Ubuntu"', 'title: "adsys"')
rep('title: "Componente avançada: 2FA com PAM"', 'title: "Autenticação de dois fatores"')
# cartões sem numeração 01/02/03; «Porquê» em vez dos comandos
rep('{ h: "Papel no nosso projeto"', '{ h: "No nosso projeto"')
rep('[{ text: c.n + "  ", options: { color: c.hc } }, { text: c.h,', '[{ text: c.h,')
rep('strip(s, "Chave:", key, true, 4.45, 0.55);', 'strip(s, "Porquê esta escolha:", WHY[abbr] || "", false, 4.45, 0.55);')
rep("function analogyBand(", '''const WHY = {
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
function analogyBand(''')
# siglas: sem expansão nos títulos; no rodapé só as que aparecem pela primeira vez
rep("    for (const e of exps.slice(0, 2)) {", "    for (const e of []) {")
rep("function addGlossLines() {", "const SEEN = new Set();\nfunction addGlossLines() {")
rep("    found.sort((a, b) => a[0] - b[0]);", '''    found.sort((a, b) => a[0] - b[0]);
    const fresh = found.filter(([, k, v]) => !SEEN.has(k) && !txt.includes(v));
    found.forEach(([, k]) => SEEN.add(k));
    found.length = 0;
    fresh.forEach((f) => found.push(f));''')

io.open(out_path, "w", encoding="utf-8").write(src)
print("ok")
