# Guião-Workshop SR2 - Windows Server (AD DS) e Linux Client (Kerberos, Samba, SSSD, PAM)

**Serviços de Redes II · 2026/2027 · Workshop do Grupo 10**

---

## Introdução

> [!WARNING]
> **Indicações obrigatórias - ler antes de começar**
>
> 1. **Pools do grupo:** cada grupo cria/atribui as suas máquinas à **pool do grupo** no Proxmox. Não trabalhes nas pools de templates nem nas de outros grupos.
> 2. **Divisão de trabalho:** os elementos do grupo dividem entre si a **pool** e a **VLAN** em que cada um vai trabalhar (aconselhado: uma VLAN/bridge por aluno, para não haver conflitos de endereços).
> 3. **Endereçamento IP:** todas as configurações seguem o formato **`192.168.X.Y`**, onde:
>    - **`X`** = número da VLAN em que a máquina está;
>    - **`Y`** = endereço da máquina, entre **2 e 254**;
>    - **`.1`** fica reservado para o **default gateway** da VLAN;
>    - **`.255`** fica reservado para **broadcast**.
> 4. **Nomes iguais para todos:** o domínio é **`isec.local`** (realm `ISEC.LOCAL`, NetBIOS `ISEC`) e o Windows Server chama-se **`SR2-SRV`**. São valores standard: **todos usam estes nomes**, para que os comandos sejam iguais e se possa acompanhar o workshop em conjunto.
> 5. **O que muda de aluno para aluno é só a VLAN e os IPs:** nos comandos aparecem os placeholders **`X`** (VLAN), **`<IP_DC>`** e **`<IP_CLIENTE>`** (ambos no formato `192.168.X.Y`). **Substitui-os sempre pelos teus valores antes de executar.** Copiar um comando com `<...>` ou com `X` lá dentro dá erro.

---

## Índice

- [Introdução](#introdução)
  - [Setup das Máquinas Virtuais (Proxmox)](#setup-das-máquinas-virtuais-proxmox)
- [Capítulo 1 - Parte A - Windows Server](#parte-a---windows-server)
- [Capítulo 2 - Parte B - Linux Client](#parte-b---linux-client)
  - [2.1 Integração com SSSD](#21-integração-com-sssd)
  - [2.2 Integração com Winbind](#22-integração-com-winbind)
- [Erros Comuns e Resolução](#erros-comuns-e-resolução)
- [Lista de pontos \[VERIFICAR\]](#lista-de-pontos-verificar)

---


### Objetivos do trabalho

No fim do workshop, cada aluno terá:

1. Um **Windows Server** promovido a **Domain Controller** (AD DS + DNS), com grupos, utilizadores e uma partilha SMB (**SRII**) com permissões por grupo (RBAC: alunos só leem, professores leem e escrevem).
2. Um **cliente Ubuntu** com IP estático, a usar o DC como DNS e com o relógio sincronizado com ele.
3. Autenticação **Kerberos** a funcionar (`kinit` / `klist`) e acesso à SRII com o ticket (`smbclient`).
4. O Ubuntu **membro do domínio** (`realm join`), com os utilizadores do AD visíveis pelo **SSSD** e login com contas do AD via **PAM** (home criada automaticamente).
5. **Montagem automática da SRII no login** (`pam_mount`).
6. A variante de integração com **Winbind** (em preparação).

### Topologia

<!-- esquema: 00-topologia | Topologia geral do laboratório (VLAN X) -->


Cada aluno trabalha na sua VLAN `X`, com o seu DC e o seu cliente. O DC é ao mesmo tempo **controlador de domínio**, **servidor DNS**, **KDC Kerberos** e **servidor da partilha SMB**.

### Plano de endereçamento e nomes

**O que muda de aluno para aluno (substituir sempre):**

| Placeholder | Significado | Exemplo (VLAN 105) |
|---|---|---|
| `X` | Número da VLAN do aluno | `105` |
| `192.168.X.1` | Default gateway da VLAN (reservado) | `192.168.105.1` |
| `<IP_DC>` | IP do Windows Server, no formato `192.168.X.Y` (Y entre 2 e 254) | `192.168.105.2` |
| `<IP_CLIENTE>` | IP do Ubuntu, no formato `192.168.X.Y` (Y entre 2 e 254, diferente do DC) | `192.168.105.3` |
| `/24` · `255.255.255.0` | Máscara da VLAN | - |
| `<BRIDGE>` | Placa/bridge do Proxmox associada à VLAN `X` | `vmbr105` |
| `<POOL_GRUPO>` | Pool do grupo no Proxmox | `PoolTeamX` |

**Igual para todos (não alterar):**

| Item | Valor standard |
|---|---|
| Domínio DNS do AD | `isec.local` |
| Realm Kerberos (domínio em **MAIÚSCULAS**) | `ISEC.LOCAL` |
| Nome NetBIOS do domínio | `ISEC` |
| Nome do Windows Server | `SR2-SRV` → FQDN `SR2-SRV.isec.local` |
| Nome do cliente Ubuntu (máx. **15** caracteres) | `ubuclient` |
| Placa de rede do Ubuntu | `ens18` (confirmar com `ip -br a`) |
| Perfil NetworkManager | `labX` (ex.: `lab105`) |
| Utilizadores de teste | `aluno.teste`, `professor.teste` |
| Grupos | `Grupo-Alunos`, `Grupo-Professores` |
| Partilha | `SRII` |
| Palavra-passe de laboratório (Administrator, DSRM, utilizadores de teste) | `<PASSWORD_LAB>` - a mesma para todo o grupo |

---

## Setup das Máquinas Virtuais (Proxmox)

<!-- esquema: 01-setup-vms | Clonagem das VMs a partir dos templates e ligação à VLAN -->

**Objetivo:** ter o Windows Server e o Ubuntu clonados dos templates, na pool do grupo e ligados à bridge/VLAN do aluno.

**Passo 1 - Abrir a pool dos templates**

Abrir o Proxmox e selecionar a pool **`PoolStudentTemplates`**.

**Passo 2 - Localizar os templates do grupo**

Localizar os templates do **Windows Server** e do **Ubuntu Client** do grupo.

**Passo 3 - Clonar as duas VMs**

Em cada template: **Clone** →
- **Mode:** `Linked Clone` (é importante selecionar *Linked Clone* para não haver problemas);
- **Pool:** `<POOL_GRUPO>` (a pool do teu grupo, ex.: `PoolTeamX`);
- **Nome:** `WindowsServerADDS-grp<N>` para o Windows e `UbuntuClient-grp<N>` para o Ubuntu.

**Passo 4 - Escolher a placa de rede (Windows Server)**

Na VM do Windows: **Hardware → Network Device** → escolher a bridge **`<BRIDGE>`** que pertence à pool de endereços do teu grupo.

**Passo 5 - Escolher a placa de rede (Ubuntu)**

Repetir para a VM do Ubuntu, com a **mesma** bridge `<BRIDGE>` (aconselhado: uma bridge por aluno, para não haver conflitos). Em ambas as VMs confirmar:
- **Bridge = `<BRIDGE>`**;
- **Disconnect** desmarcado;
- **Firewall** desmarcado.

**Passo 6 - Iniciar as duas VMs**

**Verificação esperada:** as duas VMs aparecem dentro de `<POOL_GRUPO>`, ambas com a bridge `<BRIDGE>`, e arrancam.

> [!NOTE]
> - Os templates já trazem os recursos (CPU/RAM/disco) e, no Ubuntu, as dependências instaladas (Kerberos, SSSD, Samba). **[VERIFICAR]** recursos mínimos, caso seja preciso criar uma VM de raiz.
> - **[VERIFICAR]** O número da bridge corresponde à VLAN (ex.: `vmbr105` ↔ `192.168.105.0/24`). Confirmar com o docente a bridge/VLAN atribuída a cada aluno.

> Problemas? Ver [Erros Comuns - Setup das VMs](#ec-setup).

---

## Parte A - Windows Server

**Cenário:** configurar um Windows Server com gestão centralizada de identidades (Active Directory) e controlo de acessos por grupos (RBAC).

### 1.1 Nome, rede e IP estático

<!-- esquema: 1-1-nome-rede-ip | Windows Server: IP estático, gateway e DNS -->

**Passo 1 - Primeiro arranque e nome do computador**

*Objetivo:* concluir o assistente inicial e dar ao servidor o nome standard.

1. Iniciar a VM e completar o assistente com os valores aconselhados:
   - Região: **Portugal**; teclado: **Português**; idioma: **Inglês**;
   - Palavra-passe do Administrator: **`<PASSWORD_LAB>`** (a mesma em todo o laboratório).
2. Mudar o nome do computador para **`SR2-SRV`**: barra de pesquisa do Windows → **About this computer** → **Rename this PC**.
3. Reiniciar o servidor.

*Verificação esperada:* após o reinício, *About this computer* mostra o nome `SR2-SRV`.

**Passo 2 - Abrir as definições do adaptador de rede**

*Control Panel → Network and Internet → Network and Sharing Center → Change adapter settings* → botão direito no adaptador → **Properties** → **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**.

**Passo 3 - Atribuir o IP estático e testar a conectividade**

*Objetivo:* dar ao DC um IP fixo e apontar o DNS para ele próprio.

| Campo | Valor |
|---|---|
| IP address | `<IP_DC>` (192.168.X.Y) |
| Subnet mask | `255.255.255.0` |
| Default gateway | `192.168.X.1` |
| Preferred DNS | `<IP_DC>` (o próprio servidor) |

**OK** para aplicar.

```powershell
# [Windows Server - PowerShell]
ipconfig /all
ping 192.168.X.1
```
*Verificação esperada:* `ipconfig` mostra `<IP_DC>`, gateway `192.168.X.1` e DNS `<IP_DC>`; o gateway responde ao ping.

**Passo 4 - Aguardar o arranque dos serviços**

Aguardar que os serviços do servidor iniciem (o Server Manager abre sozinho) antes de começar a configuração.

> Problemas? Ver [Erros Comuns - Parte A](#ec-a).

### 1.2 Instalação das roles AD DS e DNS

<!-- esquema: 1-2-roles-adds-dns | Roles AD DS e DNS instaladas no Windows Server -->

**Passo 1 - Add Roles and Features**

*Objetivo:* abrir o assistente de instalação de funções.

**Server Manager** → **Add roles and features** → avançar com as opções por defeito até ao separador **Server Roles**.

**Passo 2 - Selecionar as roles e instalar**

1. Selecionar **Active Directory Domain Services** e **DNS Server** (clicar em **Add Features** quando pedido).
2. **Next** até ao fim → **Install**. Aguardar a conclusão.

*Verificação esperada:* no Server Manager aparecem *AD DS* e *DNS* no painel lateral, e uma **bandeira amarela** de aviso (promoção pendente).

> Problemas? Ver [Erros Comuns - Parte A](#ec-a).

### 1.3 Promoção a Domain Controller (`isec.local`)

<!-- esquema: 1-3-promocao-dc | Domain Controller: AD, KDC Kerberos e DNS do domínio isec.local -->

**Passo 1 - Promover o servidor**

No Server Manager, clicar na **bandeira amarela** → **Promote this server to a domain controller**.

**Passo 2 - Nova floresta**

**Add a new forest** → *Root domain name:* **`isec.local`** → Next.

**Passo 3 - Palavra-passe de restauro (DSRM)**

Definir a palavra-passe **DSRM** (`<PASSWORD_LAB>`) e memorizá-la → Next.

**Passo 4 - Aviso de DNS Delegation**

Ignorar o aviso de **DNS Delegation** e prosseguir com **Next**.

**Passo 5 - Nome NetBIOS e instalação**

Verificar que o nome **NetBIOS** é **`ISEC`** → **Next** em todos os ecrãs seguintes → **Install**.

**Passo 6 - Reinício e login no domínio**

O servidor reinicia sozinho para concluir o processo.

*Verificação esperada:* no arranque seguinte, o login passa a ser feito como **`ISEC\Administrator`** (Domain Administrator). Iniciar sessão e aguardar que o sistema arranque por completo.

> A promoção cria automaticamente a zona DNS `isec.local` e os registos SRV (`_ldap._tcp.dc._msdcs.isec.local`, `_kerberos._tcp.isec.local`) que o Kerberos e o SSSD usam para descobrir o DC.

**Passo 7 - Forwarder DNS (acesso à internet a partir do cliente)**

*Objetivo:* como o Ubuntu vai usar **só** o DNS do Windows, o DC tem de reencaminhar para fora os nomes que não conhece.

```powershell
# [Windows Server - PowerShell]
Add-DnsServerForwarder -IPAddress 1.1.1.1
Get-DnsServerForwarder
```
*Verificação esperada:* `Get-DnsServerForwarder` lista `1.1.1.1`.

> Problemas? Ver [Erros Comuns - Parte A](#ec-a).

### 1.4 Grupos e utilizadores no Active Directory

<!-- esquema: 1-4-grupos-utilizadores | Utilizadores e grupos no Active Directory -->

**Passo 1 - Abrir o Active Directory Users and Computers**

**Server Manager** → menu **Tools** (canto superior direito) → **Active Directory Users and Computers**.

**Passo 2 - Pasta Users**

Expandir o domínio **`isec.local`** e clicar na pasta **Users**.

**Passo 3 - Criar os grupos**

Ícone **Create a new group**:
1. **Grupo-Alunos** - *Group scope:* **Global**, *Group type:* **Security** → OK.
2. **Grupo-Professores** - mesmas opções → OK.

**Passo 4 - Criar os utilizadores**

Ícone **Create a new user**:

| First name | Last name | User logon name | Grupo |
|---|---|---|---|
| Professor | Teste | `professor.teste` | Grupo-Professores |
| Aluno | Teste | `aluno.teste` | Grupo-Alunos |

**Passo 5 - Palavra-passe dos utilizadores**

Atribuir a palavra-passe `<PASSWORD_LAB>`, **desmarcar** *"User must change password at next logon"* e manter *"Password never expires"* **desmarcada**.

> Por norma o utilizador mudaria a palavra-passe no primeiro login; aqui desmarca-se a opção porque, caso contrário, o `kinit` no Linux falha.

**Passo 6 - Atribuir os grupos aos utilizadores**

1. Na pasta *Users*, localizar os utilizadores criados: **Professor Teste** e **Aluno Teste**.
2. Duplo clique em **Professor Teste** → separador **Member Of** → **Add...** → `Grupo-Professores` → OK.
3. Duplo clique em **Aluno Teste** → **Member Of** → **Add...** → `Grupo-Alunos` → OK.

*Verificação esperada:* em *Member Of*, cada utilizador mostra `Domain Users` e o seu grupo.

> Problemas? Ver [Erros Comuns - Parte A](#ec-a).

### 1.5 Partilha SRII: SMB e permissões NTFS

<!-- esquema: 1-5-partilha-srii | Partilha SRII e permissões por grupo -->

**Objetivo:** criar a pasta partilhada **SRII** onde o Grupo-Alunos só lê e o Grupo-Professores lê e escreve.

**Passo 1 - Criar a pasta e partilhá-la**

1. Criar uma pasta no **Ambiente de Trabalho (Desktop)** com o nome **`SRII`**.
2. Botão direito → **Properties** → separador **Sharing** → **Advanced Sharing...**
3. Marcar **Share this folder** → **Permissions**.

**Passo 2 - Permissões de partilha (grupos)**

1. **Remover** o grupo `Everyone` (por segurança).
2. **Add...** → `Grupo-Professores` → OK → coluna *Allow*: **Full Control**.
3. **Add...** → `Grupo-Alunos` → OK → coluna *Allow*: **apenas Read**.
4. **OK** duas vezes para voltar às propriedades.

> **[VERIFICAR]** Para o Grupo-Professores, *Change* também seria suficiente (com NTFS *Modify* o professor já lê e escreve). Decidir qual das duas usar.

**Passo 3 - Permissões de segurança (NTFS)**

1. Separador **Security** → **Edit...** → **Add...** → adicionar `Grupo-Alunos` e `Grupo-Professores`.
2. Selecionar `Grupo-Alunos` e verificar que estão marcadas **Read & execute**, **List folder contents** e **Read**.
3. Selecionar `Grupo-Professores` e marcar **Modify** na coluna *Allow*.
4. **OK** para aplicar e fechar as propriedades.

**Passo 4 - Ficheiro de teste**

Criar dentro da SRII um ficheiro de texto **`ficheiroteste.txt`** (com qualquer conteúdo), para os testes de leitura no Ubuntu.

> **[VERIFICAR]** Nome do ficheiro de teste: `ficheiroteste.txt` ou `notas.txt` - usar o mesmo em todo o workshop.

*Verificação esperada:* a pasta mostra o ícone de partilha e contém `ficheiroteste.txt`.

> Problemas? Ver [Erros Comuns - Parte A](#ec-a).

### 1.6 Firewall do Windows: permitir ping do Ubuntu

<!-- esquema: 1-6-firewall | Regra de firewall para o ping do Ubuntu -->

**Objetivo:** permitir que o Ubuntu faça ping ao DC (por defeito o Windows bloqueia).

**Passo 1 - Nova regra de entrada**

*Iniciar* → escrever **Windows Defender Firewall with Advanced Security** e abrir. Painel esquerdo: **Inbound Rules**; painel direito: **New Rule...**

**Passo 2 - Tipo de regra e protocolo**

**Custom** → Next → **All programs** → Next → **Protocol type: ICMPv4** → Next.

**Passo 3 - IP de origem**

Em *Which remote IP addresses does this rule apply to?* → **These IP addresses** → **Add...** → `<IP_CLIENTE>` → OK → Next.

**Passo 4 - Permitir e dar nome**

**Allow the connection** → Next → Next → Nome: **`SR2 Allow Ping Ubuntu`** → **Finish**.

*Verificação esperada:* a regra aparece ativa (visto verde) em *Inbound Rules*. O teste de ping faz-se a partir do Ubuntu (2.1.1, Passo 11).

> Problemas? Ver [Erros Comuns - Parte A](#ec-a).

---

## Parte B - Linux Client

## 2.1 Integração com SSSD

> [!NOTE]
> Nesta variante usa-se o **cliente** SMB (`smbclient`) e a adesão ao domínio faz-se com `realm join` (realmd + adcli), que gera automaticamente o `sssd.conf`. **Não é preciso configurar o `smb.conf`** nem um servidor Samba: o `smb.conf` e o `net ads join` pertencem à variante **Winbind** (2.2). **[VERIFICAR]** se o enunciado exige `smb.conf` também na variante SSSD.

### 2.1.1 Ubuntu: IP estático e DNS do Windows

<!-- esquema: 2-1-1-rede-dns | Rede e DNS do Ubuntu apontados para o Windows Server -->

**Objetivo:** no fim, o Ubuntu tem IP estático, um único perfil de rede, usa **apenas** o DC como DNS e resolve `isec.local` pelo nome. Sem o DNS apontado ao Windows, o Kerberos e o SSSD não conseguem descobrir o domínio.

**Passo 1 - Iniciar a VM e abrir o terminal**

Trabalha **na consola da VM** (não por SSH): a rede vai ser reconfigurada e uma sessão SSH cairia.

> Confirma o nome da placa com `ip -br a`. Se não for `ens18`, troca `ens18` pelo nome real nos comandos desta secção.

**Passo 2 - Ver a configuração de rede existente**

*Objetivo:* perceber que ficheiros e ligações já configuram a placa, para evitar conflitos.

```bash
# [Linux Client]
ls /etc/netplan
nmcli -f NAME,DEVICE,TYPE connection show
```
- `ls /etc/netplan` lista os ficheiros do Netplan (o sistema que define a rede no Ubuntu).
- `nmcli ... connection show` lista as ligações geridas pelo NetworkManager.

*Porquê:* o erro `Conflicting default route` aparece quando mais de um ficheiro ou perfil configura a mesma placa com uma rota por defeito.

**Passo 3 - Criar uma pasta de backup**

*Objetivo:* guardar a configuração antiga em vez de a apagar, para poder repor se algo correr mal.

```bash
# [Linux Client]
sudo mkdir -p /root/netplan-bak
```
`-p` não dá erro se a pasta já existir; fica em `/root`, só acessível ao administrador.
*Se saltares este passo, o Passo 4 falha com `Ficheiro ou pasta inexistente`.*

**Passo 4 - Remover os ficheiros em conflito**

*Objetivo:* deixar um único método de configuração de rede: o NetworkManager por linha de comandos.

```bash
# [Linux Client]
cd /etc/netplan
sudo mv 00-installer-config.yaml 01-netcfg.yaml 90-NM-*.yaml /root/netplan-bak/
ls /etc/netplan
cd ~
```
*Verificação esperada:* o `ls` mostra **só** `01-network-manager-all.yaml` (que apenas diz que o NetworkManager gere a rede e não configura nenhuma placa).
*Nota:* os nomes dos ficheiros podem variar - a regra é mover **todos exceto** `01-network-manager-all.yaml`.

**Passo 5 - Aplicar a limpeza**

```bash
# [Linux Client]
sudo netplan apply
```
Como já não há ficheiro a configurar a `ens18`, o perfil antigo desaparece.
*Nota:* podem aparecer avisos amarelos sobre o `systemd-networkd` - são inofensivos, porque não o usamos.

**Passo 6 - Garantir que o NetworkManager está a correr**

```bash
# [Linux Client]
sudo systemctl start NetworkManager
systemctl is-active NetworkManager
```
*Verificação esperada:* `active`.
*Porquê:* sem o serviço ativo, o `nmcli` falha com `O NetworkManager não está em execução` e a ligação do Passo 7 nunca é criada.

**Passo 7 - Criar a ligação com IP estático e DNS do Windows Server**

```bash
# [Linux Client]  - substitui X (em labX e no gateway), <IP_CLIENTE> e <IP_DC>
sudo nmcli connection add type ethernet ifname ens18 con-name labX \
     ipv4.method manual \
     ipv4.addresses <IP_CLIENTE>/24 \
     ipv4.gateway 192.168.X.1 \
     ipv4.dns <IP_DC> \
     ipv4.dns-search isec.local \
     ipv4.ignore-auto-dns yes
```

| Parâmetro | Valor | O que faz |
|---|---|---|
| `ifname` | `ens18` | Placa de rede a configurar |
| `con-name` | `labX` | Nome do perfil |
| `ipv4.method` | `manual` | IP fixo, sem DHCP |
| `ipv4.addresses` | `<IP_CLIENTE>/24` | IP do Ubuntu e máscara |
| `ipv4.gateway` | `192.168.X.1` | Saída da rede |
| `ipv4.dns` | `<IP_DC>` | DNS = Windows Server |
| `ipv4.dns-search` | `isec.local` | Domínio de pesquisa (escreves `SR2-SRV` em vez de `SR2-SRV.isec.local`) |
| `ipv4.ignore-auto-dns` | `yes` | Impede que outro DNS entre automaticamente |

> [!IMPORTANT]
> **Só o DNS do Windows:** não ponhas `8.8.8.8` como alternativo. O Ubuntu pode perguntar-lhe e não encontrar os registos internos do AD. A internet continua a funcionar através do **forwarder** do DNS do Windows (1.3, Passo 7).

*Verificação esperada:* o comando termina sem erros.

**Passo 8 - Ativar a ligação e confirmar**

```bash
# [Linux Client]
sudo nmcli connection up labX
nmcli -f NAME,DEVICE,TYPE connection show
```
*Verificação esperada:* o perfil `labX` aparece associado à placa `ens18`.
*Nota:* se aparecer outro perfil antigo sem placa (ex.: `Ligação com fios 1`), apaga-o para não confundir:
```bash
sudo nmcli connection delete 'NOME'
```

**Passo 9 - Confirmar o IP e a rota**

```bash
# [Linux Client]
ip -br a
ip route
```
*Verificação esperada:*
- `ens18` aparece **UP** com `<IP_CLIENTE>/24` - e **não** com um endereço `169.254.x.x` (que significa que o IP estático não foi aplicado);
- existe **uma única** linha `default via 192.168.X.1` (o conflito do início desapareceu).

**Passo 10 - Confirmar que o DNS é o do Windows**

```bash
# [Linux Client]
resolvectl status ens18
```
*Verificação esperada:* `Current DNS Server: <IP_DC>`, `DNS Servers: <IP_DC>` (sem `8.8.8.8` nem `1.1.1.1`), `DNS Domain: isec.local`.
*Porquê:* se ainda aparecerem DNS públicos, o Ubuntu pode perguntar a um deles e falhar a descoberta do domínio. Volta ao Passo 7 e confirma `ipv4.ignore-auto-dns yes`.

**Passo 11 - Testar a ligação ao servidor**

```bash
# [Linux Client]
ping -c 3 <IP_DC>
```
*Verificação esperada:* `0% packet loss`.
*Porquê:* prova que há rede, mas ainda não que o DNS funciona (o ping por IP não precisa de DNS).

**Passo 12 - Testar o DNS do domínio**

*Objetivo:* provar que o DNS do Windows responde sobre o domínio e anuncia os serviços de autenticação.

```bash
# [Linux Client]
dig @<IP_DC> isec.local +short
dig @<IP_DC> _ldap._tcp.dc._msdcs.isec.local SRV +short
```
*Verificação esperada:*
- o 1.º devolve `<IP_DC>`;
- o 2.º devolve algo como `0 100 389 sr2-srv.isec.local.`

*Porquê:* os registos SRV são a peça mais importante - é com eles que o Kerberos e o SSSD descobrem o controlador de domínio. **Se falhar, é DNS: não avances.**

**Passo 13 - Corrigir o ping a `isec.local` (desativar o mDNS para `.local`)**

*Objetivo:* fazer o Ubuntu perguntar ao DNS do Windows quando o nome acaba em `.local`.

```bash
# [Linux Client]
sudo cp /etc/nsswitch.conf /etc/nsswitch.conf.bak
grep ^hosts /etc/nsswitch.conf
sudo sed -i 's/mdns4_minimal \[NOTFOUND=return\] //' /etc/nsswitch.conf
grep ^hosts /etc/nsswitch.conf
```
*Porquê:* por defeito, o Ubuntu trata nomes `.local` como **mDNS** (descoberta na rede local) e responde logo "nome desconhecido", sem perguntar ao DNS do Windows. Por isso o `dig` funciona e o `ping isec.local` falha. **Este passo é obrigatório:** sem ele, o Kerberos, o `smbclient` e o `realm` também não conseguem resolver `SR2-SRV.isec.local`.
*Verificação esperada:* a linha passa de `hosts: files mdns4_minimal [NOTFOUND=return] dns` para `hosts: files dns`.

**Passo 14 - Testar o `isec.local`**

```bash
# [Linux Client]
getent hosts isec.local
ping -c 3 isec.local
```
*Verificação esperada:* `getent` devolve `<IP_DC> isec.local` e o ping responde com `0% packet loss`.

> Problemas? Ver [Erros Comuns - 2.1 Rede e DNS do cliente](#ec-b1-rede).

### 2.1.2 Sincronização do relógio (chrony)

<!-- esquema: 2-1-2-chrony | Sincronização do relógio por NTP -->

**Objetivo:** acertar a hora do Ubuntu pela do DC. O Kerberos rejeita pedidos com mais de **5 minutos** de diferença entre o cliente e o servidor.

**Passo 1 - Direcionar o chrony ao Windows Server**

```bash
# [Linux Client]
grep -q "^server <IP_DC>" /etc/chrony/chrony.conf || \
  echo "server <IP_DC> iburst" | sudo tee -a /etc/chrony/chrony.conf
grep "^server <IP_DC>" /etc/chrony/chrony.conf
```
Só acrescenta se ainda não existir, por isso não duplica. `server` = fonte de tempo; `iburst` = sincroniza mais depressa no arranque.

**Passo 2 - Reiniciar o chrony e confirmar**

```bash
# [Linux Client]
sudo systemctl restart chrony
systemctl status chrony --no-pager
chronyc sources -v
```
*Verificação esperada:* `active (running)` (se o serviço não existir, tenta `chronyd`) e, no `chronyc sources -v`, a linha de `<IP_DC>` com `^*` ou `^+` - prova de que o relógio está mesmo a ser acertado pelo DC. Se `<IP_DC>` aparecer com `^?`, espera uns segundos e repete o comando.

> Problemas? Ver [Erros Comuns - 2.1 Relógio e Kerberos](#ec-b1-kerberos).

### 2.1.3 Kerberos: configurar o realm e obter o ticket

<!-- esquema: 2-1-3-kerberos | Pedido do TGT Kerberos (kinit) -->

**Passo 1 - Guardar uma cópia do ficheiro original**

```bash
# [Linux Client]
sudo cp /etc/krb5.conf /etc/krb5.conf.original 2>/dev/null
```

**Passo 2 - Escrever o novo `krb5.conf`**

```bash
# [Linux Client]  - ficheiro igual para todos
sudo tee /etc/krb5.conf > /dev/null << 'EOF'
[libdefaults]
    default_realm = ISEC.LOCAL
    dns_lookup_realm = false
    dns_lookup_kdc = true
    rdns = false

[realms]
    ISEC.LOCAL = {
        kdc = SR2-SRV.isec.local
        admin_server = SR2-SRV.isec.local
    }

[domain_realm]
    .isec.local = ISEC.LOCAL
    isec.local = ISEC.LOCAL
EOF
cat /etc/krb5.conf
```

| Parâmetro | O que faz |
|---|---|
| `default_realm` | Realm usado quando escreves só `kinit aluno.teste`. Em **MAIÚSCULAS**. |
| `dns_lookup_realm = false` | Não descobre o realm por DNS (já está definido). |
| `dns_lookup_kdc = true` | Descobre o KDC pelos registos DNS `_kerberos._tcp`. |
| `rdns = false` | Desativa o DNS inverso, que costuma falhar em laboratório. |
| `kdc` | Servidor que emite os tickets (porta 88). No AD é o DC. |
| `admin_server` | Servidor de contas e palavras-passe. No AD é o mesmo. |
| `.isec.local = ISEC.LOCAL` / `isec.local = ISEC.LOCAL` | Máquinas dentro do domínio / o próprio domínio. São precisas as duas. |

*Verificação esperada:* o `cat` mostra o ficheiro exatamente como acima.

**Passo 3 - Obter o ticket**

```bash
# [Linux Client]
kinit aluno.teste@ISEC.LOCAL
klist
kdestroy
```
*Verificação esperada:* o `kinit` pede a palavra-passe e não mostra mais nada (**silêncio = sucesso**); o `klist` mostra o utilizador e o ticket `krbtgt/ISEC.LOCAL@ISEC.LOCAL`. O `kdestroy` apaga o ticket para começar limpo na secção seguinte.

> Problemas? Ver [Erros Comuns - 2.1 Relógio e Kerberos](#ec-b1-kerberos).

### 2.1.4 Samba: acesso à partilha SRII com Kerberos

<!-- esquema: 2-1-4-samba | Acesso à SRII com ticket Kerberos (smbclient) -->

**Objetivo:** provar que o professor lê e escreve na SRII e o aluno só lê, usando o cliente Samba (`smbclient`) com o ticket Kerberos, **sem** juntar a máquina ao domínio.

> [!IMPORTANT]
> **Kerberos no `smbclient`:** a opção antiga `-k` está obsoleta (*deprecated*) no Samba 4.15+. Usa-se `--use-kerberos=required`, que usa o ticket do `kinit` e **falha** (em vez de pedir palavra-passe) se não houver ticket válido.

**Passo 1 - Limpar a cache do Kerberos**

```bash
# [Linux Client]
kdestroy
klist
```

**Passo 2 - Listar as pastas partilhadas do servidor**

```bash
# [Linux Client]
kinit aluno.teste@ISEC.LOCAL
smbclient -L //SR2-SRV.isec.local --use-kerberos=required
```
*Verificação esperada:* aparece a partilha **SRII**. A linha `SMB1 disabled -- no workgroup available` é normal.

**Passo 3 - Preparar um ficheiro de testes**

```bash
# [Linux Client]
echo "Escrito a partir do Ubuntu" > /tmp/teste-escrita.txt
chmod 644 /tmp/teste-escrita.txt
kdestroy
klist
```
O `chmod 644` deixa os utilizadores do domínio ler o ficheiro mais tarde (2.1.8).

**Passo 4 - Testar o aluno**

```bash
# [Linux Client]
kinit aluno.teste@ISEC.LOCAL
smbclient //SR2-SRV.isec.local/SRII --use-kerberos=required -c 'ls'
smbclient //SR2-SRV.isec.local/SRII --use-kerberos=required -c 'put /tmp/teste-escrita.txt aluno-escrita.txt'
kdestroy
```
*Verificação esperada:* `ls` funciona; `put` falha com `NT_STATUS_ACCESS_DENIED`.

> [!TIP]
> Cada comando `smbclient` ocupa **uma só linha**. Se ao colar o terminal ficar em `>`, a aspa ficou aberta: `Ctrl+C` e cola a linha inteira outra vez.

**Passo 5 - Testar o professor**

```bash
# [Linux Client]
kinit professor.teste@ISEC.LOCAL
smbclient //SR2-SRV.isec.local/SRII --use-kerberos=required -c 'ls'
smbclient //SR2-SRV.isec.local/SRII --use-kerberos=required -c 'put /tmp/teste-escrita.txt professor-escrita.txt'
smbclient //SR2-SRV.isec.local/SRII --use-kerberos=required -c 'ls'
kdestroy
klist
```
*Verificação esperada:* o professor lista e escreve; `professor-escrita.txt` aparece no segundo `ls`.

**Passo 6 - Analisar resultados e discutir**

| Utilizador | Listar (`ls`) | Escrever (`put`) |
|---|---|---|
| `aluno.teste` | Permitido | `NT_STATUS_ACCESS_DENIED` |
| `professor.teste` | Permitido | Permitido |

Confirmar também no Windows Server:
```powershell
# [Windows Server - PowerShell]
Get-ChildItem "$env:USERPROFILE\Desktop\SRII"
```
*Verificação esperada:* existe `professor-escrita.txt` e **não** existe `aluno-escrita.txt`.

- Se o aluno conseguir escrever, as permissões NTFS estão demasiado abertas (ou o aluno também está no grupo de professores) - rever 1.4 e 1.5.
- Se algum for negado logo no `ls`, confirmar o grupo e as permissões de leitura (1.4 e 1.5).

> Problemas? Ver [Erros Comuns - 2.1 Samba](#ec-b1-samba).

### 2.1.5 Entrada no domínio: realmd e adcli

<!-- esquema: 2-1-5-realm-join | Adesão ao domínio com realmd e adcli -->

**Objetivo:** o Ubuntu passar a ser **membro do domínio**. Até aqui só usava tickets pedidos à mão (`kinit`); o computador não existia no AD e não conhecia os utilizadores. O `realm join` cria a conta da máquina no AD (através do `adcli`) e configura o SSSD.

**Passo 1 - Ajustar o nome do cliente**

```bash
# [Linux Client]
hostnamectl
sudo hostnamectl set-hostname ubuclient
hostnamectl
```
*Verificação esperada:* `Static hostname: ubuclient`.
*Porquê:* o nome original do template (`user-ClientUbuntu`) tem 17 caracteres e o limite do nome NetBIOS no AD é **15**. Todos usam `ubuclient`: como cada aluno tem o seu DC na sua VLAN, o nome não colide entre colegas.

**Passo 2 - Descobrir o domínio**

```bash
# [Linux Client]
realm discover isec.local
```
*Verificação esperada:* `type: kerberos`, `realm-name: ISEC.LOCAL`, `server-software: active-directory`. Se falhar, repete 2.1.1 (Passo 12, DNS) e 2.1.3 (Passo 2, `krb5.conf`).

**Passo 3 - Fazer o join ao domínio**

```bash
# [Linux Client]
sudo realm join -U Administrator isec.local
```
Pede a palavra-passe do *Administrator* do domínio. **Silêncio = sucesso.** Cria o objeto da máquina no AD e gera `/etc/sssd/sssd.conf`.

**Passo 4 - Confirmar o join ao domínio**

```bash
# [Linux Client]
realm list
sudo systemctl status sssd --no-pager
```
*Verificação esperada:* `realm list` mostra `configured: kerberos-member`; o `sssd` está `active (running)`.

> Problemas? Ver [Erros Comuns - 2.1 Domínio e SSSD](#ec-b1-sssd).

### 2.1.6 Utilizadores do AD no Linux: SSSD

<!-- esquema: 2-1-6-sssd | Resolução de utilizadores do AD pelo SSSD -->

**Passo 1 - Confirmar que o Linux localiza os utilizadores do AD e ver a configuração do SSSD**

```bash
# [Linux Client]
id aluno.teste@isec.local
id professor.teste@isec.local
sudo cat /etc/sssd/sssd.conf
```
*Verificação esperada:*
- `id` mostra o UID e os grupos, ex.: `groups=...(domain users@isec.local),...(grupo-alunos@isec.local)` - os grupos aparecem em **minúsculas**;
- o `sssd.conf` (gerado pelo `realm join`) contém:

| Parâmetro | Significado |
|---|---|
| `domains = isec.local` | Domínio que o SSSD serve |
| `id_provider = ad` | Vai buscar utilizadores e grupos ao Active Directory |
| `access_provider = ad` | O AD decide quem pode entrar |
| `use_fully_qualified_names = True` | Utilizadores escrevem-se `utilizador@isec.local` |
| `fallback_homedir = /home/%u@%d` | Homes em `/home/utilizador@isec.local` |

Se o `id` der `no such user`, espera um minuto ou limpa a cache: `sudo sss_cache -E` e tenta outra vez.

> Problemas? Ver [Erros Comuns - 2.1 Domínio e SSSD](#ec-b1-sssd).

### 2.1.7 Login com contas do AD: PAM

<!-- esquema: 2-1-7-pam | Login de um utilizador do AD com PAM e SSSD -->

**Passo 1 - Ativar a criação automática da home no primeiro login**

```bash
# [Linux Client]
sudo pam-auth-update --enable mkhomedir
grep mkhomedir /etc/pam.d/common-session
```
*Verificação esperada:* o `grep` mostra `pam_mkhomedir.so`. Não há MFA configurado: o login pede só utilizador e palavra-passe.

**Passo 2 - Login com uma conta do AD**

```bash
# [Linux Client]
su - aluno.teste@isec.local
whoami
id
pwd
```
*Verificação esperada:* o `su -` autentica o aluno no AD através do **PAM + SSSD**; `whoami` mostra `aluno.teste@isec.local`; a home é criada na primeira vez (`pwd` → `/home/aluno.teste@isec.local`).

> [!IMPORTANT]
> **Se o `su -` der `su: System error`**, o SSSD está a aplicar as GPO do AD ao login e bloqueia-o. Volta ao terminal do utilizador local e corrige o `sssd.conf`:
> ```bash
> # [Linux Client]  (terminal do utilizador local)
> sudo nano /etc/sssd/sssd.conf
> ```
> Na secção `[domain/isec.local]`, acrescenta a linha `ad_gpo_access_control = permissive` (e apaga `config_file_version = 2`, se existir). Guarda (`Ctrl+O`, `Enter`, `Ctrl+X`) e reinicia o SSSD:
> ```bash
> sudo chmod 600 /etc/sssd/sssd.conf
> sudo sssctl config-check
> sudo systemctl restart sssd
> ```
> Depois repete este passo. O modo `permissive` regista as GPO mas não as impõe (solução de laboratório).

**Passo 3 - Obter o ticket Kerberos na sessão**

```bash
# [Linux Client]  (dentro da sessão de aluno.teste@isec.local)
kinit aluno.teste@ISEC.LOCAL
klist
```
*Verificação esperada:* `klist` mostra `krbtgt/ISEC.LOCAL@ISEC.LOCAL`.
*Porquê:* o ticket pertence a quem o pede - um `kinit` feito como utilizador local não serve ao aluno. Por isso faz-se **dentro** da sessão do aluno. **Não saias da sessão:** continua em 2.1.8.

> Problemas? Ver [Erros Comuns - 2.1 PAM e pam_mount](#ec-b1-pam).

### 2.1.8 Acesso à SRII como utilizador do domínio

<!-- esquema: 2-1-8-srii-dominio | Acesso à SRII a partir da sessão do utilizador do domínio -->

#### 2.1.8.1 Aluno

**Passo 1 - Obter o ticket na sessão do aluno**

Continuando na sessão do aluno (2.1.7):
```bash
# [Linux Client]  (sessão de aluno.teste@isec.local)
kinit aluno.teste@ISEC.LOCAL
klist
```
*Verificação esperada:* `klist` mostra `krbtgt/ISEC.LOCAL@ISEC.LOCAL`.

**Passo 2 - Listar a SRII com o ticket**

```bash
# [Linux Client]  (sessão de aluno.teste@isec.local)
smbclient //SR2-SRV.isec.local/SRII --use-kerberos=required -c 'ls'
```
*Verificação esperada:* a listagem da SRII aparece.

**Passo 3 - Testar a escrita**

```bash
# [Linux Client]  (sessão de aluno.teste@isec.local)
smbclient //SR2-SRV.isec.local/SRII --use-kerberos=required -c 'put /tmp/teste-escrita.txt aluno-escrita2.txt'
klist
exit
```
*Verificação esperada:* o `put` falha com `NT_STATUS_ACCESS_DENIED`; o `klist` mostra dois tickets: `krbtgt/ISEC.LOCAL` e `cifs/SR2-SRV.isec.local` (o ticket da partilha).

#### 2.1.8.2 Professor

**Passo 1 - Entrar como professor**

```bash
# [Linux Client]
su - professor.teste@isec.local
```

**Passo 2 - Obter o ticket na sessão**

```bash
# [Linux Client]  (sessão de professor.teste@isec.local)
kinit professor.teste@ISEC.LOCAL
```

**Passo 3 - Ler e escrever na SRII**

```bash
# [Linux Client]  (sessão de professor.teste@isec.local)
smbclient //SR2-SRV.isec.local/SRII --use-kerberos=required -c 'ls'
smbclient //SR2-SRV.isec.local/SRII --use-kerberos=required -c 'put /tmp/teste-escrita.txt professor-escrita2.txt'
smbclient //SR2-SRV.isec.local/SRII --use-kerberos=required -c 'ls'
klist
exit
```
*Verificação esperada:* o professor lista e escreve; `professor-escrita2.txt` aparece na segunda listagem.

> Se aparecer `NT_STATUS_NO_LOGON_SERVERS` com `creating NEG_TOKEN_INIT ... failed`, falta o `kinit` dentro da sessão do utilizador.

> Problemas? Ver [Erros Comuns - 2.1 Samba](#ec-b1-samba).

### 2.1.9 Montagem automática da SRII no login: pam_mount

<!-- esquema: 2-1-9-pam-mount | Montagem automática da SRII no login (pam_mount) -->

**Objetivo:** quando um utilizador do AD faz login, a SRII aparece sozinha em `~/SRII`, sem `kinit` nem `smbclient`, e com as permissões do AD (aluno só lê, professor lê e escreve).

> **Como funciona:** o `pam_mount` é um módulo PAM. No login recebe a palavra-passe escrita pelo utilizador e monta a partilha com `mount.cifs` (pacote `cifs-utils`); no logout desmonta-a. A partilha, os grupos e as permissões NTFS são os da SRII (1.5) - não é preciso mudar nada no Windows.

**Passo 1 - Instalar o pam_mount e o cifs-utils** (terminal do utilizador local)

```bash
# [Linux Client]
sudo apt install -y libpam-mount cifs-utils
grep pam_mount /etc/pam.d/common-auth /etc/pam.d/common-session
```
*Verificação esperada:* `pam_mount.so` aparece nos dois ficheiros. Se não aparecer: `sudo pam-auth-update --enable libpam-mount`.

**Passo 2 - Cópia de segurança e abrir a configuração**

```bash
# [Linux Client]
sudo cp /etc/security/pam_mount.conf.xml /etc/security/pam_mount.conf.xml.bak
sudo nano /etc/security/pam_mount.conf.xml
```
Se o `cp` der `Ficheiro ou pasta inexistente`, o pam_mount não está instalado: repete o Passo 1.

**Passo 3 - Colar as linhas `<volume>` (uma por utilizador)**

Logo abaixo da linha `<!-- Volume definitions -->`, colar:
```xml
<!-- [Linux Client] /etc/security/pam_mount.conf.xml - igual para todos -->
<volume user="aluno.teste@isec.local" fstype="cifs"
        server="SR2-SRV.isec.local" path="SRII" mountpoint="~/SRII"
        options="sec=ntlmssp,vers=3.0,domain=ISEC,username=aluno.teste,uid=%(USERUID),gid=%(USERGID)" />

<volume user="professor.teste@isec.local" fstype="cifs"
        server="SR2-SRV.isec.local" path="SRII" mountpoint="~/SRII"
        options="sec=ntlmssp,vers=3.0,domain=ISEC,username=professor.teste,uid=%(USERUID),gid=%(USERGID)" />
```

| Atributo | Significado |
|---|---|
| `user=` | A linha só se aplica a esse utilizador |
| `path="SRII"` / `mountpoint="~/SRII"` | Nome da partilha / pasta na home (criada automaticamente) |
| `sec=ntlmssp` | A montagem usa a palavra-passe do login. O ticket criado pelo SSSD no login não funciona com o SMB neste laboratório, por isso não se usa `sec=krb5`. |
| `uid=%(USERUID),gid=%(USERGID)` | Os ficheiros aparecem como sendo do utilizador. Quem decide se pode escrever é o Windows (NTFS). |

> Cada `<volume>` pode ficar numa ou em várias linhas: o XML aceita quebras entre atributos, mas **não dentro das aspas**.

**Passo 4 - Guardar e confirmar as duas linhas**

Guardar com `Ctrl+O`, `Enter`; sair com `Ctrl+X`. Depois:
```bash
# [Linux Client]
grep -n -A2 "<volume user" /etc/security/pam_mount.conf.xml
```
*Verificação esperada:* aparecem as duas entradas (aluno e professor), logo abaixo de *Volume definitions*.

**Passo 5 - Entrar como professor: a SRII é montada sozinha**

```bash
# [Linux Client]
su - professor.teste@isec.local
mount | grep SRII
exit
```
*Verificação esperada:* `//SR2-SRV.isec.local/SRII on /home/professor.teste@isec.local/SRII type cifs (rw,...,sec=ntlmssp,...)`.

**Passo 6 - Entrar como aluno: a SRII também é montada**

```bash
# [Linux Client]
su - aluno.teste@isec.local
mount | grep SRII
exit
```
*Verificação esperada:* a mesma linha `type cifs`, agora em `/home/aluno.teste@isec.local/SRII` - montada só com o login, sem `kinit` nem `smbclient`.

**Passo 7 - Aluno lê, mas não escreve**

```bash
# [Linux Client]
su - aluno.teste@isec.local
cat ~/SRII/ficheiroteste.txt
echo "teste" > ~/SRII/aluno-tenta.txt
exit
```
*Verificação esperada:* o aluno lê o ficheiro, mas o `echo` dá `Permissão recusada` (só tem leitura).

**Passo 8 - Professor lê e escreve**

```bash
# [Linux Client]
su - professor.teste@isec.local
cat ~/SRII/ficheiroteste.txt
echo "Criado no Ubuntu pelo professor" > ~/SRII/criado-no-ubuntu.txt
ls -l ~/SRII
exit
```
*Verificação esperada:* `criado-no-ubuntu.txt` aparece no `ls -l`. No Windows Server, na pasta SRII, está `criado-no-ubuntu.txt` e **não** `aluno-tenta.txt`.

> Problemas? Ver [Erros Comuns - 2.1 PAM e pam_mount](#ec-b1-pam).

---

## 2.2 Integração com Winbind

> [!NOTE]
> **[A AGUARDAR CONTEÚDO]** - o conteúdo desta parte está em preparação. Usar um **novo clone** do Ubuntu (não usar SSSD e Winbind na mesma máquina).

### 2.2.1 Configuração de um novo cliente (clone, IP estático, DNS) `[A AGUARDAR CONTEÚDO]`
### 2.2.2 Configuração do Samba (`smb.conf`) `[A AGUARDAR CONTEÚDO]`
### 2.2.3 Configuração do Kerberos e adesão ao domínio `[A AGUARDAR CONTEÚDO]`
### 2.2.4 Validar a associação ao domínio `[A AGUARDAR CONTEÚDO]`
### 2.2.5 Diagnosticar o Winbind `[A AGUARDAR CONTEÚDO]`
### 2.2.6 Integração do Winbind com NSS `[A AGUARDAR CONTEÚDO]`
### 2.2.7 Configurar a autenticação PAM `[A AGUARDAR CONTEÚDO]`
### 2.2.8 Testar o início de sessão com um utilizador AD `[A AGUARDAR CONTEÚDO]`
### 2.2.9 Testar a partilha SMB do Windows Server `[A AGUARDAR CONTEÚDO]`
### 2.2.10 Início de sessão gráfico com AD (GDM3) `[A AGUARDAR CONTEÚDO]`

---

## Erros Comuns e Resolução

Formato: **Sintoma → Causa provável → Solução**.

<a id="ec-setup"></a>
### Setup das VMs

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Destination Host Unreachable`; `ip neigh show` com `INCOMPLETE` ou `FAILED` | As VMs não estão ambas na `<BRIDGE>`, ou a placa tem *Disconnect*/*Firewall* marcados | Proxmox → *Hardware → Network Device* das duas VMs (Setup das VMs, Passos 4 e 5) |

<a id="ec-a"></a>
### Parte A - Windows Server

| Sintoma | Causa provável | Solução |
|---|---|---|
| O ping a `<IP_DC>` falha, mas o MAC aparece no `ip neigh` | Firewall do Windows a bloquear o ping | Regra ICMPv4 para `<IP_CLIENTE>` (1.6) |
| Sem internet no Ubuntu com o DNS só no Windows | O DNS do Windows não tem forwarder | No Windows: `Add-DnsServerForwarder -IPAddress 1.1.1.1` (1.3, Passo 7) |
| `kinit` dá `Preauthentication failed` com a palavra-passe certa | Conta com *"User must change password at next logon"* marcado, ou conta desativada | Desmarcar a opção (1.4, Passo 5) / ativar a conta |
| `Client not found in Kerberos database` | O logon name não existe no AD ou foi escrito de outra forma | `Get-ADUser -Filter * \| Select SamAccountName` e usar o nome exato |
| Aluno consegue escrever na SRII | Aluno também no Grupo-Professores, ou *Modify* para `Everyone`/`Authenticated Users` | Rever 1.4 (Passo 6) e 1.5 |
| `NT_STATUS_ACCESS_DENIED` no `ls` de ambos | Grupos ou permissões NTFS mal definidos | Rever 1.5 (Passos 2 e 3) |

<a id="ec-b1-rede"></a>
### Parte B - SSSD: Rede e DNS do cliente (2.1.1)

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Conflicting default route` no `netplan apply` | Mais de um ficheiro ou método a configurar a mesma placa | Ficar com um único método: repetir 2.1.1, Passos 2 a 5 |
| `mv: destino '/root/netplan-bak/': Ficheiro ou pasta inexistente` | Faltou criar a pasta de backup | 2.1.1, Passo 3 e repetir o Passo 4 |
| `O NetworkManager não está em execução` | Serviço parado | 2.1.1, Passo 6 e repetir o Passo 7 |
| IP `169.254.x.x` na `ens18` | O IP estático não foi aplicado | 2.1.1, Passos 7 e 8 |
| DNS público (`8.8.8.8`, `1.1.1.1`) em `resolvectl status` | Falta `ipv4.ignore-auto-dns yes` | 2.1.1, Passo 7 |
| Perfil antigo (ex.: `Ligação com fios 1`) sem placa | Restos da configuração anterior | `sudo nmcli connection delete 'NOME'` |
| `Destination Host Unreachable` | VMs em bridges diferentes | Ver [Setup das VMs](#ec-setup) |
| Ping ao DC falha, mas o MAC aparece no `ip neigh` | Firewall do Windows | Ver [Parte A](#ec-a) (1.6) |
| `dig` funciona mas `ping isec.local` falha | `mdns4_minimal` no `nsswitch.conf` | 2.1.1, Passo 13 |

<a id="ec-b1-kerberos"></a>
### Parte B - SSSD: Relógio e Kerberos (2.1.2 - 2.1.3)

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Clock skew too great` | Diferença de hora > 5 min entre cliente e DC | Repetir 2.1.2 (chrony) |
| `chrony` não existe como serviço | Nome do serviço diferente | Usar `chronyd` |
| `Cannot find KDC for realm` | DNS não devolve os registos SRV do domínio | Repetir 2.1.1, Passo 12 (DNS) |
| `Cannot resolve network address for KDC` | Nome do DC errado no `krb5.conf` ou não resolve no DNS | Repetir 2.1.1, Passo 12 e 2.1.3, Passo 2; confirmar `SR2-SRV.isec.local` no `krb5.conf` |
| `Client not found in Kerberos database` | O login não existe | No Windows: `Get-ADUser -Filter * \| Select SamAccountName` |
| `Preauthentication failed` | Palavra-passe errada, conta desativada, ou "mudar palavra-passe no próximo logon" ativo | Confirmar a palavra-passe; rever 1.4, Passo 5 |

<a id="ec-b1-samba"></a>
### Parte B - SSSD: Samba e SRII (2.1.4, 2.1.8)

| Sintoma | Causa provável | Solução |
|---|---|---|
| `smbclient` avisa que `-k` está *deprecated* | Opção antiga (Samba 4.15+) | Usar `--use-kerberos=required` |
| Terminal fica em `>` depois de colar `smbclient ... -c 'put ...'` | A aspa ficou aberta (comando colado em duas linhas) | `Ctrl+C` e colar a linha inteira |
| `NT_STATUS_NO_LOGON_SERVERS` / `NT_STATUS_LOGON_FAILURE` com `--use-kerberos=required` | Ticket em falta ou expirado | `klist`; se vazio: `kinit utilizador@ISEC.LOCAL` e repetir |
| `NT_STATUS_NO_LOGON_SERVERS` com `creating NEG_TOKEN_INIT ... failed` | Falta o `kinit` dentro da sessão do utilizador do domínio (depois de `su -`) | 2.1.7, Passo 3 |
| `NT_STATUS_ACCESS_DENIED` no `ls` de ambos | Grupos ou permissões NTFS mal definidos | Rever 1.5 (Passos 2 e 3) |
| `NT_STATUS_BAD_NETWORK_NAME` | Nome da partilha errado | Confirmar com `smbclient -L` (2.1.4, Passo 2) |
| Aluno consegue escrever | Aluno também no grupo de professores, ou *Modify* para `Everyone`/`Authenticated Users` | Rever 1.4 (Passo 6) e 1.5 |

<a id="ec-b1-sssd"></a>
### Parte B - SSSD: Domínio e SSSD (2.1.5 - 2.1.6)

| Sintoma | Causa provável | Solução |
|---|---|---|
| `realm discover` falha | DNS ou `krb5.conf` | Repetir 2.1.1 (Passo 12) e 2.1.3 (Passo 2) |
| `realm join` falha com nome de máquina | Hostname com mais de 15 caracteres (ainda com o nome do template) | Repetir 2.1.5, Passo 1 |
| `no such user` no `id` | Cache do SSSD desatualizada ou SSSD ainda a sincronizar | Esperar 1 min; `sudo sss_cache -E` e `sudo systemctl restart sssd` |
| SSSD não arranca depois de editar o `sssd.conf` | Permissões do ficheiro ou erro de sintaxe | `sudo chmod 600 /etc/sssd/sssd.conf`; `sudo sssctl config-check` (2.1.7, Passo 2) |

<a id="ec-b1-pam"></a>
### Parte B - SSSD: PAM e pam_mount (2.1.7, 2.1.9)

| Sintoma | Causa provável | Solução |
|---|---|---|
| `su: System error` no login do utilizador do AD (nos registos: `pam_sss ... Access denied ... System error`) | GPO do AD a bloquear o login | `ad_gpo_access_control = permissive` no `sssd.conf` (caixa em 2.1.7, Passo 2) |
| Home não é criada no primeiro login | `pam_mkhomedir` não ativo | `sudo pam-auth-update --enable mkhomedir` (2.1.7, Passo 1) |
| `cp` do `pam_mount.conf.xml`: `Ficheiro ou pasta inexistente` | O pam_mount não está instalado | 2.1.9, Passo 1 |
| `mount \| grep SRII` não mostra nada depois do login | `pam_mount.so` ausente no PAM ou linhas `<volume>` erradas | Confirmar `pam_mount.so` (2.1.9, Passo 1) e as linhas `<volume>` (Passo 4) |

<a id="ec-b2"></a>
### Parte B - Winbind

`[A AGUARDAR CONTEÚDO]`

---

## Lista de pontos [VERIFICAR]

| # | Secção | Ponto a rever |
|---|---|---|
| 1 | 1 | Recursos mínimos das VMs (CPU/RAM/disco), caso seja preciso criar uma VM de raiz. |
| 2 | 1 | Correspondência bridge `vmbrNNN` ↔ VLAN `X` a confirmar com o docente. |
| 3 | 1.5, Passo 2 | Permissão de partilha do Grupo-Professores: *Full Control* ou *Change*. |
| 4 | 1.5, Passo 4 | Nome do ficheiro de teste: `ficheiroteste.txt` ou `notas.txt`. |
| 5 | 2.1 (nota inicial) | Se o enunciado exige `smb.conf` também na variante SSSD. |
| 6 | 2.1.7, Passo 2 | Correção `ad_gpo_access_control = permissive`: se todos os alunos apanharem `su: System error`, passar a passo normal e acrescentá-la aos diapositivos. |
