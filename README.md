# Chapter 1: Teoria e objetivo da experiencia

O objetivo de todas estas tecnologias resume-se a um conceito: Gestão Centralizada de Identidades. Numa empresa com centenas de computadores (uns com Windows, outros com Linux), seria impossível aos técnicos de informática criarem utilizadores e passwords manualmente em cada máquina. O Active Directory Domain Services (AD DS) da Microsoft é o "catálogo" central que resolve este problema, permitindo que um utilizador use a mesma password em qualquer computador da rede.

O teu trabalho consiste em configurar este ecossistema Microsoft e, de seguida, provar como é que máquinas Linux se conseguem integrar nele. Por fim, deves explorar quais são as alternativas que existem no mercado.

A lista que o teu professor forneceu está dividida por tipologia de tecnologia e não por ordem de execução. Para fazeres o trabalho de forma lógica nas máquinas virtuais do Proxmox, deves estruturar a pesquisa e a configuração na seguinte ordem:

### 1. Criar a Base de Autenticação (AD DS):
**Laboratório Proxmox.** Antes de integrares o Linux, precisas de um sistema central a funcionar. Deves criar uma máquina virtual com Windows Server no Proxmox e configurá-la como Controlador de Domínio (Domain Controller). Ao mesmo tempo, deves ler os recursos sobre o PAM (CB1). O PAM é o mecanismo interno do Linux que gere passwords; precisas de entender a teoria de como ele trabalha antes de o ensinares a falar com o Windows.
* **Verificação de sucesso:** Tens o Windows Server a correr e consegues abrir o painel "Active Directory Users and Computers" para criar um novo utilizador de teste.

### 2. Integrar o Ubuntu ao Domínio Windows:
**SSSD e Winbind (CB2 e CB3).** Cria uma máquina virtual com Ubuntu Linux. O objetivo desta fase é instalares pacotes como o SSSD ou o Winbind. Estes serviços vão atuar como "tradutores", ligando o PAM do Linux ao Active Directory do Windows. Eles ensinam o Ubuntu a ir perguntar ao Windows Server se a password inserida está correta.
* **Verificação de sucesso:** No ecrã de login do Ubuntu, consegues iniciar sessão utilizando o nome e a password do utilizador de teste que criaste no Windows Server.

### 3. Avançar para Políticas e Partilha de Ficheiros:
**ADsys e Samba (CB4 e CB5).** Com o Linux a aceitar os logins do Windows, deves simular um ambiente de trabalho real. O ADsys vai permitir-te aplicar regras de segurança do Windows (GPOs) diretamente no Ubuntu. De seguida, usas as partilhas de pastas para garantir que os ficheiros do utilizador estão na rede e não apenas na máquina local.
* **Verificação de sucesso:** Consegues criar um documento na tua pasta a partir do Windows, mudar de computador para o Ubuntu, iniciar sessão com a mesma conta, e ver o mesmo documento lá disponível.

### 4. Explorar os Serviços Alternativos:
**FreeIPA, Entra ID e authd (CA1, CA2, CA3).** A última fase do trabalho é demonstrar que existem outros caminhos. O FreeIPA é a grande alternativa gratuita e open-source ao sistema da Microsoft (ideal para redes 100% Linux) e deves tentar instalar num novo servidor Ubuntu para testar. O Entra ID é o Active Directory moderno baseado na Cloud da Microsoft, e o Canonical authd é a nova aposta do Ubuntu. Nesta fase podes focar-te mais na pesquisa teórica sobre como estas tecnologias funcionam.
* **Verificação de sucesso:** Consegues aceder ao painel de administração web do servidor FreeIPA através do teu browser, provando que o serviço alternativo está ativo e pronto a gerir identidades.

---

# Chapter 2: Tutorial extendido

## 1. A Base de Autenticação (Windows Server AD DS)
O Windows Server será o "cérebro" da rede. Antes de tentares ligar o Linux a qualquer lado, precisas deste catálogo central a funcionar.

**Onde ir buscar as imagens (ISOs):**
* Vai ao Microsoft Evaluation Center e descarrega a ISO do Windows Server 2022 (a versão de avaliação de 180 dias é gratuita e suficiente).

**O que ler antes de ir para o laboratório:**
* Lê os links CB1 (a, b, c) sobre o PAM. Embora o PAM seja do Linux, precisas de ler isto primeiro para perceberes que o Linux gere as passwords localmente através de módulos. O objetivo final do trabalho é alterar estes módulos para que o Linux deixe de olhar para os ficheiros locais e passe a perguntar ao Windows Server.

**Ação no Laboratório (Proxmox):**
1. Cria a VM, instala o Windows Server escolhendo a opção "Desktop Experience" (com interface gráfica).
2. Define um IP estático nesta máquina (crucial para o DNS funcionar depois).
3. No Server Manager, adiciona a Role Active Directory Domain Services (AD DS) e DNS Server.
4. Promove o servidor a Domain Controller (cria um domínio novo, ex: projeto.local).
5. Abre o "Active Directory Users and Computers" e cria um utilizador de teste (ex: aluno.teste com uma password forte).

## 2. Integração do Linux ao Domínio (SSSD ou Winbind)
Com o Windows pronto, é altura de criar o cliente Linux. O SSSD (System Security Services Daemon) e o Winbind são as duas formas principais de fazer o Linux comunicar com o AD.

**Onde ir buscar as imagens (ISOs):**
* Vai a ubuntu.com/download/server e descarrega a ISO do Ubuntu Server 24.04 LTS ou 22.04 LTS. A versão Server (sem interface gráfica pesada) é ideal para configurar via terminal.

**O que ler antes de ir para o laboratório:**
* Lê o CB2b (How to set up SSSD with AD). O SSSD é a norma moderna e recomendada pela Canonical (Ubuntu) para esta integração.
* Lê o CB3a (Winbind preparation). O professor pede para conheceres as duas vias. O Winbind é mais antigo, muito ligado ao Samba, mas o SSSD é mais limpo de configurar hoje em dia. Escolham o SSSD para a demonstração principal.

**Ação no Laboratório (Proxmox):**
1. Cria a VM com o Ubuntu Server.
2. Passo Crítico: Configura a rede do Ubuntu para ter um IP estático e define o servidor de DNS para ser o IP do teu Windows Server. Se o Ubuntu não conseguir resolver o nome projeto.local, a integração vai falhar imediatamente.
3. Instala os pacotes necessários: `sudo apt install realmd sssd sssd-tools libnss-sss libpam-sss adcli samba-common-bin`.
4. Junta o Ubuntu ao domínio com o comando: `sudo realm join projeto.local -U Administrator`.
5. Testa a ligação tentando fazer login no Ubuntu com o utilizador aluno.teste que criaste no Windows.

## 3. Gestão Avançada: Políticas e Partilhas (ADsys e Samba)
Não basta fazer login; numa empresa, queremos controlar as máquinas Linux a partir do Windows e garantir que os utilizadores têm acesso aos seus ficheiros.

**O que ler antes de ir para o laboratório:**
* Lê o CB4a (New Active Directory integration features - ADsys). O ADsys é uma ferramenta revolucionária da Canonical que permite que as Group Policies (GPOs) do Windows afetem o Ubuntu (ex: proibir o uso de pens USB ou mudar o wallpaper).
* Lê o CB5 (Shared home folders). O Samba é o protocolo que permite que o Linux entenda as pastas partilhadas do Windows.

**Ação no Laboratório (Proxmox):**
1. Samba: No Windows Server, cria uma pasta partilhada. No Ubuntu, instala o `cifs-utils` e configura o ficheiro `/etc/fstab` (ou usa o PAM) para que, quando o aluno.teste fizer login no Linux, a pasta do Windows seja montada automaticamente na sua home directory.
2. ADsys: Instala o adsys no Ubuntu (`sudo apt install adsys`). No Windows Server, instala os templates administrativos (ADMX) do Ubuntu. Cria uma GPO no Windows, aplica-a e vê o resultado no Ubuntu.

## 4. Explorar Alternativas (Componentes Avançadas)
Como a alínea b) das regras indica, deves seguir a prioridade (CA1, depois CA2, etc.).

**O que ler antes de ir para o laboratório:**
* Prioridade 1: CA1 (Canonical authd). Lê a documentação oficial. É a alternativa mais recente ao SSSD desenhada para sistemas modernos e cloud.
* Prioridade 2: CA2 (Entra ID). Lê sobre isto de forma teórica. Sendo um serviço Cloud da Microsoft, poderá ser complexo ou pago simular um laboratório completo, mas podes explicar como mapearia privilégios.
* Prioridade 3: CA3 (FreeIPA). Apenas se tiverem muito tempo. É um servidor concorrente ao Windows Server, totalmente baseado em Linux.

**Ação no Laboratório (Proxmox):**
1. Se decidirem focar-se no CA1, cria uma terceira VM com Ubuntu. Em vez de usarem o SSSD (como fizeram no Passo 2), tentem fazer o join ao domínio utilizando o novo authd. Isto cria um excelente contraste prático para a vossa apresentação.
