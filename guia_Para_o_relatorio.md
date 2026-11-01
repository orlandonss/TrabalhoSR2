# 🚀 Guia Estrutural para o Relatório Prático

E aí! Aqui está a estrutura completa e detalhada para o nosso relatório, agora atualizada com o **PAM**, **SSSD** e o todo-poderoso **Kerberos**. Organize tudo por capítulos para ficar fácil de escrever e para o professor perceber bem o fluxo do nosso trabalho. Se seguirmos esta base, o projeto fica blindado!

## 📌 Resumo

*O "Elevator Pitch" do nosso trabalho.*

* **O que colocar:** Uma visão geral de tudo o que é abordado no relatório.
* Falar sobre as ferramentas utilizadas, o objetivo principal e fazer um breve resumo dos resultados alcançados. Tem de ser curto e direto ao ponto.

## 📖 Capítulo 1: Introdução

*Aqui é para abordar as coisas de forma resumida e cativante. A introdução não precisa de ser demasiado técnica, é para "preparar o terreno".*

* **Objetivos e Motivação:** Explicar o que pretendemos com este trabalho prático e as experiências que vamos realizar. Falar sobre a importância desta experiência e o que nos motivou a escolher este tema.
* **Apoio da Inteligência Artificial:** Mencionar como usámos a IA (ChatGPT, etc.) como suporte para métodos de pesquisa, entendimento de conceitos complexos, procura de documentação e ajuda no *troubleshooting*.
* **Segurança e Workshop:** Abordar, de forma geral, as componentes de segurança do nosso tema. Mencionar brevemente o workshop que será realizado (explicando que este relatório é um complemento ao anexo do workshop, onde os conceitos são aprofundados).
* **Ambiente e Ferramentas:** Falar sobre o software utilizado (ex: servidor Proxmox, os sistemas operativos clientes) e dar um "cheirinho" da arquitetura do projeto.
* **Análise de Tráfego:** Referir a utilização do **Wireshark** para capturar e analisar pacotes. Explicar que isto é crucial para percebermos, na prática, a comunicação entre o cliente e o Servidor Windows AD DS.
* **Conceitos Chave (O Dicionário do Projeto):** Explicar resumidamente o que são as tecnologias principais e como se interligam:
  * **Windows AD DS:** O cérebro da rede (gestão de domínios e diretórios).
  * **Kerberos:** O protocolo de autenticação ("o segurança dos bilhetes"). Em vez de enviar passwords pela rede, o Kerberos emite e valida bilhetes criptográficos. O nosso Windows Server atua como o distribuidor de bilhetes (KDC).
  * **Samba / Winbind:** Ferramentas tradicionais de integração para partilha de ficheiros e comunicação com redes Windows.
  * **SSSD (System Security Services Daemon):** O serviço moderno no Linux que liga a máquina local ao Active Directory. Ele fala com o Kerberos para autenticar o utilizador e faz cache de credenciais para permitir logins mesmo quando o AD está offline.
  * **PAM (Pluggable Authentication Modules):** O sistema interno do Linux que dita as "regras" de quem pode entrar. O PAM é a porta de entrada que vai "perguntar" ao SSSD se o utilizador tem permissão.
* **Estrutura do Relatório:** Explicar brevemente o que os próximos capítulos vão abordar e o que significa cada anexo que está afixado no final do documento.

## 🏗️ Capítulo 2: Arquitetura e Implementação

*Aqui é onde entramos nos detalhes técnicos ("a carne do projeto").*

* **Contexto e Arquitetura:** Apresentar o contexto do problema e a arquitetura completa do trabalho prático. Como é que as máquinas virtuais vão comunicar entre si?
* **Componentes Avançadas e Fluxo de Autenticação:** Explicar detalhadamente como o ecossistema funciona de forma integrada.
  * O que cada máquina tem instalado e porquê.
* **Teoria e Diagramas:** Abordar a teoria por trás de cada componente.
  * **💡 Dica de Ouro:** Fazer um diagrama de fluxo (*flowchart*) da autenticação. Exemplo do percurso:
    1. Utilizador insere as credenciais no Linux.
    2. O **PAM** interceta o login e encaminha o pedido para o **SSSD**.
    3. O SSSD contacta o **Kerberos** no Windows AD para obter um "Ticket-Granting Ticket" (TGT).
    4. Com o bilhete válido, a sessão é autorizada e o utilizador entra!

## 🔬 Capítulo 3: Experiências e Resultados

*A prova de que o que fizemos realmente funciona.*

* Mostrar as experiências realizadas e analisar os resultados de cada uma.
* **Screenshots:** Encher este capítulo de *screenshots* bem explicados.
  * Mostrar logins com sucesso de utilizadores do AD nas máquinas Linux.
  * **Essencial:** Mostrar o comando `klist` no terminal do Linux para provar que o utilizador recebeu um bilhete Kerberos válido a partir do Windows Server!

## 🎯 Capítulo 4: Conclusão

*O fecho de ouro.*

* Resumir as conclusões que tirámos do trabalho prático.
* Explicar **porque é que a nossa solução é eficaz** e **porque é que é segura** (mencionar a eliminação de passwords em texto limpo graças ao Kerberos).
* O que é que estas experiências nos ensinaram?

## ⚙️ Notas para as Componentes Práticas

### 🧱 Componentes Básicas

*Aqui estão os requisitos fundamentais do trabalho prático que não podem faltar:*

* **Serviços Core (Windows):** Instalação e promoção do Windows Server a Controlador de Domínio (AD DS) com a respetiva configuração da resolução DNS.
* **Integração (Linux):** Configuração da resolução de nomes no Ubuntu e associação da máquina ao domínio do Active Directory.
* **Autenticação Centralizada:** Garantir que o cliente Linux reconhece e autentica os utilizadores criados no Windows Server (utilizando pacotes como SSSD ou Winbind).
* **Gestão de Sessão (PAM):** Configuração do módulo PAM para a criação automática da diretoria local (ativando o `mkhomedir`) quando o utilizador do domínio faz o primeiro login no Ubuntu.
* **Partilha de Recursos:** Acesso validado a uma pasta partilhada na rede (SMB/CIFS) através do terminal Linux usando as credenciais do domínio AD.

### 🚀 Componentes Avançadas (Para a nota máxima 🏆)

*Se o professor perguntar, é aqui que mostramos que dominamos o assunto.*

1. **Implementação de Autenticação Multifator (MFA / 2FA) via PAM:**
   * Mostrar a camada extra de segurança. Explicar como configurámos o *Google Authenticator PAM module* no ficheiro do PAM do Ubuntu (ex: `/etc/pam.d/sshd`). Isto mostra que compreendemos como o PAM é modular!
2. **Controlo de Acessos por Grupos do AD (Sudoers):**
   * Configurar o `/etc/sudoers` para mapear um grupo específico do Active Directory (ex: `%Domain\ Admins ALL=(ALL) ALL`). O SSSD traz a informação de grupos do AD, e o Linux aplica os privilégios de sudo.
3. **Auditoria e Logs de Autenticação (Troubleshooting):**
   * Mostrar onde o Linux regista os logins: `/var/log/auth.log` para a atividade do PAM.
   * Mostrar como diagnosticar problemas: verificar serviços (`journalctl -u sssd`) ou validar erros de bilhetes Kerberos se os relógios (NTP) das máquinas não estiverem sincronizados (um erro super comum que os professores adoram testar!).
4. **Políticas de Grupo (GPOs) aplicadas ao Linux:**
   * Mostrar que criámos uma Unidade Organizacional (OU) no Active Directory para agrupar os clientes Linux e que conseguimos aplicar políticas centralizadas.

## 📚 Bibliografia e Links de Pesquisa (Referências para o Relatório)

* **Integração do Linux no Domínio e Autenticação:**
  * [SSSD com Active Directory (Ubuntu)](https://ubuntu.com/server/docs/how-to/sssd/with-active-directory/)
  * [Kerberos V5 System Admin's Guide](https://web.mit.edu/kerberos/krb5-latest/doc/admin/realm_config.html) - Para justificar a configuração do Realm (como `ISEC.LOCAL`) e a extrema importância da sincronização de tempo.
  * [Google Authenticator PAM module (GitHub)](https://github.com/google/google-authenticator-libpam)

* **Arquitetura Windows AD DS:**
  * [Deploy Active Directory Domain Services](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/deploy/ad-ds-deployment)
  * [Install Active Directory Domain Services (Level 100)](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/deploy/install-active-directory-domain-services--level-100-)

* **Rede:**
  * [Network Configuration - Netplan (Ubuntu)](https://ubuntu.com/server/docs/network-configuration)