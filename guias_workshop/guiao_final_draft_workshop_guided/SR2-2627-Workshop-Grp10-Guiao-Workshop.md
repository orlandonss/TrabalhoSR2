# Guião-Workshop SR2 - Windows Server (AD DS) e Linux Client (Kerberos, Samba, SSSD, PAM)

**Serviços de Redes II · 2026/2027 · Workshop do Grupo 10**

*Versão guiada para o workshop: passo a passo*

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

---

### Plano de endereçamento e nomes

**O que muda de aluno para aluno (substituir sempre):**

| Placeholder | Significado | Exemplo (VLAN 105) |
|---|---|---|
| `X` | Número da VLAN do aluno | `105` |
| `192.168.X.1` | Default gateway da VLAN (reservado) | `192.168.105.1` |
| `<IP_DC>` | IP do Windows Server, no formato `192.168.X.Y` (Y entre 2 e 254) | `192.168.105.2` |
| `<IP_CLIENTE>` | IP do cliente Ubuntu SSSD, no formato `192.168.X.Y` (Y entre 2 e 254, diferente do DC) | `192.168.105.3` |
| `<IP_CLIENTE_WB>` | IP do cliente Ubuntu Winbind (2.2), no formato `192.168.X.Y` (diferente dos outros dois) | `192.168.105.4` |
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
| Nome do cliente SSSD (máx. **15** caracteres) | `ubuclient` (no AD: `UBUCLIENT`) |
| Nome do cliente Winbind no AD (`netbios name`) | `UBU-WINBIND` |
| Placa de rede do Ubuntu | `ens18` (confirmar com `ip -br a`) |
| Perfil NetworkManager | `labX` (ex.: `lab105`) |
| Utilizadores de teste | `aluno.teste`, `professor.teste` |
| Grupos | `Grupo-Alunos`, `Grupo-Professores` |
| Partilha | `SRII` |
| Palavra-passe de laboratório (Administrator, DSRM, utilizadores de teste) | `<PASSWORD_LAB>` - a mesma para todo o grupo |

---

## Setup das Máquinas Virtuais (Proxmox)

**Passo 1 - Abrir a pool dos templates**

Abrir o Proxmox e selecionar a pool **`PoolStudentTemplates`**.

**Passo 2 - Localizar os templates do grupo**

Localizar os templates do grupo:
- **Windows Server** - o Domain Controller (Parte A);
- **UbuntuClient** - o cliente Ubuntu, com os pacotes do SSSD e do Winbind. O mesmo template dá origem aos dois clientes: o da integração com SSSD (2.1, clonado agora) e o da integração com Winbind (2.2, clonado em 2.2.1).

**Passo 3 - Clonar as duas VMs**

No template do Windows Server e no **UbuntuClient**: **Clone** →
- **Mode:** `Linked Clone`;
- **Pool:** `<POOL_GRUPO>` (a pool do teu grupo, ex.: `PoolTeamX`);
- **Nome:** `WindowsServerADDS-grp<N>` para o Windows e `UbuntuClient-SSSD-grp<N>` para o Ubuntu (o cliente da parte 2.1).

**Passo 4 - Escolher a placa de rede (Windows Server)**

Na VM do Windows: **Hardware → Network Device** → escolher a bridge **`<BRIDGE>`** que pertence à pool de endereços do teu grupo.

**Passo 5 - Escolher a placa de rede (Ubuntu)**

Repetir para a VM do Ubuntu, com a **mesma** bridge `<BRIDGE>` (aconselhado: uma bridge por aluno, para não haver conflitos). Em ambas as VMs confirmar:
- **Bridge = `<BRIDGE>`**;
- **Disconnect** desmarcado;
- **Firewall** desmarcado.

**Passo 6 - Iniciar as duas VMs**

**Verificação esperada:** as duas VMs aparecem dentro de `<POOL_GRUPO>`, ambas com a bridge `<BRIDGE>`, e arrancam.

---

## Parte A - Windows Server

### 1.1 Nome, rede e IP estático

**Passo 1 - Primeiro arranque**

Iniciar a VM e completar o assistente com os valores aconselhados:
- Região: **Portugal**; teclado: **Português**; idioma: **Inglês**;
- Palavra-passe do Administrator: **`<PASSWORD_LAB>`** (a mesma em todo o laboratório).

**Passo 2 - Mudar o nome do computador para `SR2-SRV`**

Abrir o **Server Manager** → **Local Server** → clicar no nome atual do computador → **Change...** → escrever `SR2-SRV` → **OK** → **Restart Now**.

Em alternativa, pelo PowerShell (como Administrator):
```powershell
Rename-Computer -NewName "SR2-SRV" -Restart
```

*Verificação esperada:* após o reinício, barra de pesquisa do Windows → **About this computer** mostra o nome `SR2-SRV`.

**Passo 2 - Abrir as definições do adaptador de rede**

*Control Panel → Network and Internet → Network and Sharing Center → Change adapter settings* → botão direito no adaptador → **Properties** → **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**.

**Passo 3 - Atribuir o IP estático e testar a conectividade**

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

### 1.2 Instalação das roles AD DS e DNS

**Passo 1 - Add Roles and Features**

**Server Manager** → **Add roles and features** → avançar com as opções por defeito até ao separador **Server Roles**.

**Passo 2 - Selecionar as roles e instalar**

1. Selecionar **Active Directory Domain Services** e **DNS Server** (clicar em **Add Features** quando pedido).
2. **Next** até ao fim → **Install**. Aguardar a conclusão.

*Verificação esperada:* no Server Manager aparecem *AD DS* e *DNS* no painel lateral, e uma **bandeira amarela** de aviso (promoção pendente).

### 1.3 Promoção a Domain Controller (`isec.local`)

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

**Passo 7 - Forwarder DNS (acesso à internet a partir do cliente)**

```powershell
# [Windows Server - PowerShell]
Add-DnsServerForwarder -IPAddress 1.1.1.1
Get-DnsServerForwarder
```
*Verificação esperada:* `Get-DnsServerForwarder` lista `1.1.1.1`.

### 1.4 Grupos e utilizadores no Active Directory

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

**Passo 6 - Atribuir os grupos aos utilizadores**

1. Na pasta *Users*, localizar os utilizadores criados: **Professor Teste** e **Aluno Teste**.
2. Duplo clique em **Professor Teste** → separador **Member Of** → **Add...** → `Grupo-Professores` → OK.
3. Duplo clique em **Aluno Teste** → **Member Of** → **Add...** → `Grupo-Alunos` → OK.

*Verificação esperada:* em *Member Of*, cada utilizador mostra `Domain Users` e o seu grupo.

### 1.5 Partilha SRII: SMB e permissões NTFS

**Passo 1 - Criar a pasta e partilhá-la**

1. Criar uma pasta no **Ambiente de Trabalho (Desktop)** com o nome **`SRII`**.
2. Botão direito → **Properties** → separador **Sharing** → **Advanced Sharing...**
3. Marcar **Share this folder** → **Permissions**.

**Passo 2 - Permissões de partilha (grupos)**

1. **Remover** o grupo `Everyone` (por segurança).
2. **Add...** → `Grupo-Professores` → OK → coluna *Allow*: **Full Control**.
3. **Add...** → `Grupo-Alunos` → OK → coluna *Allow*: **apenas Read**.
4. **OK** duas vezes para voltar às propriedades.

**Passo 3 - Permissões de segurança (NTFS)**

1. Separador **Security** → **Edit...** → **Add...** → adicionar `Grupo-Alunos` e `Grupo-Professores`.
2. Selecionar `Grupo-Alunos` e verificar que estão marcadas **Read & execute**, **List folder contents** e **Read**.
3. Selecionar `Grupo-Professores` e marcar **Modify** na coluna *Allow*.
4. **OK** para aplicar e fechar as propriedades.

**Passo 4 - Ficheiro de teste**

Criar dentro da SRII um ficheiro de texto **`ficheiroteste.txt`** (com qualquer conteúdo), para os testes de leitura no Ubuntu.

*Verificação esperada:* a pasta mostra o ícone de partilha e contém `ficheiroteste.txt`.

### 1.6 Firewall do Windows: permitir ping do Ubuntu

**Passo 1 - Nova regra de entrada**

*Iniciar* → escrever **Windows Defender Firewall with Advanced Security** e abrir. Painel esquerdo: **Inbound Rules**; painel direito: **New Rule...**

**Passo 2 - Tipo de regra e protocolo**

**Custom** → Next → **All programs** → Next → **Protocol type: ICMPv4** → Next.

**Passo 3 - IP de origem**

Em *Which remote IP addresses does this rule apply to?* → **These IP addresses** → **Add...** → `<IP_CLIENTE>` → OK. Repetir **Add...** com `<IP_CLIENTE_WB>` (o cliente Winbind de 2.2) → OK → Next.

**Passo 4 - Permitir e dar nome**

**Allow the connection** → Next → Next → Nome: **`SR2 Allow Ping Ubuntu`** → **Finish**.

*Verificação esperada:* a regra aparece ativa (visto verde) em *Inbound Rules*. O teste de ping faz-se a partir do Ubuntu (2.1.2, Passo 11).

---

## Parte B - Linux Client

## 2.1 Integração com SSSD

### 2.1.1 Preparar o cliente: confirmar que o Winbind está desativado

**Passo 1 - Confirmar que o serviço Winbind está desativado**

```bash
# [Linux Client]
systemctl is-enabled winbind
```
*Verificação esperada:* `disabled`. Se aparecer `enabled`: `sudo systemctl disable --now winbind`.

**Passo 2 - Confirmar que o Winbind não está no PAM**

```bash
# [Linux Client]
grep -c pam_winbind /etc/pam.d/common-auth
```
*Verificação esperada:* `0`. Se der outro número: `sudo pam-auth-update --disable winbind`.

**Passo 3 - Confirmar que o Winbind não está no NSS**

```bash
# [Linux Client]
grep -E '^(passwd|group):' /etc/nsswitch.conf
```
*Verificação esperada:* as linhas `passwd:` e `group:` não têm `winbind` (ex.: `passwd: files systemd sss`). Se tiverem: `sudo sed -i -E '/^(passwd|group):/ s/ winbind//' /etc/nsswitch.conf`.

### 2.1.2 Ubuntu: IP estático e DNS do Windows

**Passo 1 - Iniciar a VM e abrir o terminal**

Trabalhar **na consola da VM** (não por SSH).

**Passo 2 - Ver a configuração de rede existente**

```bash
# [Linux Client]
ls /etc/netplan
nmcli -f NAME,DEVICE,TYPE connection show
```
- `ls /etc/netplan` lista os ficheiros do Netplan.
- `nmcli ... connection show` lista as ligações geridas pelo NetworkManager.

**Passo 3 - Criar uma pasta de backup**

```bash
# [Linux Client]
sudo mkdir -p /root/netplan-bak
```

**Passo 4 - Remover os ficheiros em conflito**

```bash
# [Linux Client]
cd /etc/netplan
sudo mv 00-installer-config.yaml 01-netcfg.yaml 90-NM-*.yaml /root/netplan-bak/
ls /etc/netplan
cd ~
```
*Verificação esperada:* o `ls` mostra **só** `01-network-manager-all.yaml`.

**Passo 5 - Aplicar a limpeza**

```bash
# [Linux Client]
sudo netplan apply
```

**Passo 6 - Garantir que o NetworkManager está a correr**

```bash
# [Linux Client]
sudo systemctl start NetworkManager
systemctl is-active NetworkManager
```
*Verificação esperada:* `active`.

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

*Verificação esperada:* o comando termina sem erros.

**Passo 8 - Ativar a ligação e confirmar**

```bash
# [Linux Client]
sudo nmcli connection up labX
nmcli -f NAME,DEVICE,TYPE connection show
```
*Verificação esperada:* o perfil `labX` aparece associado à placa `ens18`.
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
- `ens18` aparece **UP** com `<IP_CLIENTE>/24` - e **não** com um endereço `169.254.x.x`;
- existe **uma única** linha `default via 192.168.X.1` (o conflito do início desapareceu).

**Passo 10 - Confirmar que o DNS é o do Windows**

```bash
# [Linux Client]
resolvectl status ens18
```
*Verificação esperada:* `Current DNS Server: <IP_DC>`, `DNS Servers: <IP_DC>` (sem `8.8.8.8` nem `1.1.1.1`), `DNS Domain: isec.local`.

**Passo 11 - Testar a ligação ao servidor**

```bash
# [Linux Client]
ping -c 3 <IP_DC>
```
*Verificação esperada:* `0% packet loss`.

**Passo 12 - Testar o DNS do domínio**

```bash
# [Linux Client]
dig @<IP_DC> isec.local +short
dig @<IP_DC> _ldap._tcp.dc._msdcs.isec.local SRV +short
```
*Verificação esperada:*
- o 1.º devolve `<IP_DC>`;
- o 2.º devolve algo como `0 100 389 sr2-srv.isec.local.`

**Passo 13 - Corrigir o ping a `isec.local` (desativar o mDNS para `.local`)**

```bash
# [Linux Client]
sudo cp /etc/nsswitch.conf /etc/nsswitch.conf.bak
grep ^hosts /etc/nsswitch.conf
sudo sed -i 's/mdns4_minimal \[NOTFOUND=return\] //' /etc/nsswitch.conf
grep ^hosts /etc/nsswitch.conf
```
*Verificação esperada:* a linha passa de `hosts: files mdns4_minimal [NOTFOUND=return] dns` para `hosts: files dns`.

**Passo 14 - Testar o `isec.local`**

```bash
# [Linux Client]
getent hosts isec.local
ping -c 3 isec.local
```
*Verificação esperada:* `getent` devolve `<IP_DC> isec.local` e o ping responde com `0% packet loss`.

### 2.1.3 Sincronização do relógio (chrony)

**Passo 1 - Direcionar o chrony ao Windows Server**

```bash
# [Linux Client]
grep -q "^server <IP_DC>" /etc/chrony/chrony.conf || \
  echo "server <IP_DC> iburst" | sudo tee -a /etc/chrony/chrony.conf
grep "^server <IP_DC>" /etc/chrony/chrony.conf
```

**Passo 2 - Reiniciar o chrony e confirmar**

```bash
# [Linux Client]
sudo systemctl restart chrony
systemctl status chrony --no-pager
chronyc sources -v
```
*Verificação esperada:* `active (running)` (se o serviço não existir, tenta `chronyd`) e, no `chronyc sources -v`, a linha de `<IP_DC>` com `^*` ou `^+`. Se `<IP_DC>` aparecer com `^?`, espera uns segundos e repete o comando.

### 2.1.4 Kerberos: configurar o realm e obter o ticket

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

*Verificação esperada:* o `cat` mostra o ficheiro exatamente como acima.

**Passo 3 - Obter o ticket**

```bash
# [Linux Client]
kinit aluno.teste@ISEC.LOCAL
klist
kdestroy
```
*Verificação esperada:* o `kinit` pede a palavra-passe e não mostra mais nada; o `klist` mostra o utilizador e o ticket `krbtgt/ISEC.LOCAL@ISEC.LOCAL`.

### 2.1.5 Samba: acesso à partilha SRII com Kerberos

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
*Verificação esperada:* aparece a partilha **SRII**.

**Passo 3 - Preparar um ficheiro de testes**

```bash
# [Linux Client]
echo "Escrito a partir do Ubuntu" > /tmp/teste-escrita.txt
chmod 644 /tmp/teste-escrita.txt
kdestroy
klist
```

**Passo 4 - Testar o aluno**

```bash
# [Linux Client]
kinit aluno.teste@ISEC.LOCAL
smbclient //SR2-SRV.isec.local/SRII --use-kerberos=required -c 'ls'
smbclient //SR2-SRV.isec.local/SRII --use-kerberos=required -c 'put /tmp/teste-escrita.txt aluno-escrita.txt'
kdestroy
```
*Verificação esperada:* `ls` funciona; `put` falha com `NT_STATUS_ACCESS_DENIED`.

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

### 2.1.6 Entrada no domínio: realmd e adcli

**Passo 1 - Ajustar o nome do cliente**

```bash
# [Linux Client]
hostnamectl
sudo hostnamectl set-hostname ubuclient
hostnamectl
```
*Verificação esperada:* `Static hostname: ubuclient`.

**Passo 2 - Descobrir o domínio**

```bash
# [Linux Client]
realm discover isec.local
```
*Verificação esperada:* `type: kerberos`, `realm-name: ISEC.LOCAL`, `server-software: active-directory`.

**Passo 3 - Fazer o join ao domínio**

```bash
# [Linux Client]
sudo realm join -U Administrator isec.local
```
Pede a palavra-passe do *Administrator* do domínio.

**Passo 4 - Confirmar o join ao domínio**

```bash
# [Linux Client]
realm list
sudo systemctl status sssd --no-pager
```
*Verificação esperada:* `realm list` mostra `configured: kerberos-member`; o `sssd` está `active (running)`.

### 2.1.7 Utilizadores do AD no Linux: SSSD

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

### 2.1.8 Login com contas do AD: PAM

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
*Verificação esperada:* `whoami` mostra `aluno.teste@isec.local`; a home é criada na primeira vez (`pwd` → `/home/aluno.teste@isec.local`).

**Passo 3 - Obter o ticket Kerberos na sessão**

```bash
# [Linux Client]  (dentro da sessão de aluno.teste@isec.local)
kinit aluno.teste@ISEC.LOCAL
klist
```
*Verificação esperada:* `klist` mostra `krbtgt/ISEC.LOCAL@ISEC.LOCAL`.

### 2.1.9 Acesso à SRII como utilizador do domínio

#### 2.1.9.1 Aluno

**Passo 1 - Obter o ticket na sessão do aluno**

Continuando na sessão do aluno (2.1.8):
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
*Verificação esperada:* o `put` falha com `NT_STATUS_ACCESS_DENIED`; o `klist` mostra dois tickets: `krbtgt/ISEC.LOCAL` e `cifs/SR2-SRV.isec.local`.

#### 2.1.9.2 Professor

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

### 2.1.10 Montagem automática da SRII no login: pam_mount

**Passo 1 - Confirmar que o pam_mount está ativo no PAM** (terminal do utilizador local)

```bash
# [Linux Client]
grep pam_mount /etc/pam.d/common-auth /etc/pam.d/common-session
```
*Verificação esperada:* `pam_mount.so` aparece nos dois ficheiros. Se não aparecer: `sudo pam-auth-update --enable libpam-mount`.

**Passo 2 - Cópia de segurança e abrir a configuração**

```bash
# [Linux Client]
sudo cp /etc/security/pam_mount.conf.xml /etc/security/pam_mount.conf.xml.bak
sudo nano /etc/security/pam_mount.conf.xml
```

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
*Verificação esperada:* a mesma linha `type cifs`, agora em `/home/aluno.teste@isec.local/SRII`.

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

---

## 2.2 Integração com Winbind

### 2.2.1 Configuração de um novo cliente (clone, IP estático, DNS)

**Passo 1 - Clonar o template UbuntuClient**

No Proxmox, tal como em *Setup das VMs* (Passos 3 a 6), clonar o template **UbuntuClient** com *Linked Clone* para a pool do grupo, com o nome `UbuntuClient-Winbind-grp<N>`, e ligá-lo à **mesma** bridge `<BRIDGE>`. Iniciar a VM.

**Passo 2 - Atribuir um IP estático disponível na rede**

Repetir 2.1.2, Passos 1 a 10, nesta VM, com o IP **`<IP_CLIENTE_WB>`** (formato `192.168.X.Y`, diferente do DC e do cliente SSSD):

```bash
# [Linux Client - Winbind]  - substitui X, <IP_CLIENTE_WB> e <IP_DC>
sudo nmcli connection add type ethernet ifname ens18 con-name labX \
     ipv4.method manual \
     ipv4.addresses <IP_CLIENTE_WB>/24 \
     ipv4.gateway 192.168.X.1 \
     ipv4.dns <IP_DC> \
     ipv4.dns-search isec.local \
     ipv4.ignore-auto-dns yes
sudo nmcli connection up labX
```
*Verificação esperada:* `ip -br a` mostra `ens18` com `<IP_CLIENTE_WB>/24` e `resolvectl status ens18` mostra só o DNS `<IP_DC>`.

No Windows Server, acrescentar `<IP_CLIENTE_WB>` à regra **SR2 Allow Ping Ubuntu** (1.6): *Properties* → *Scope* → *Remote IP address* → **Add...**

**Passo 3 - Configurar o DNS e confirmar o domínio**

Repetir 2.1.2, Passos 11 a 14: `ping` ao DC, `dig` aos registos SRV, correção do mDNS no `nsswitch.conf` e `ping isec.local`.

*Verificação esperada:* `getent hosts isec.local` devolve `<IP_DC>` e `ping -c 3 isec.local` responde.

**Passo 4 - Sincronizar o relógio**

Repetir 2.1.3 (Passos 1 e 2) nesta VM.

*Verificação esperada:* `chronyc sources -v` mostra `<IP_DC>` com `^*` ou `^+`.

### 2.2.2 Preparar o cliente: desativar o SSSD e ativar o Winbind

**Passo 1 - Parar e desativar o serviço SSSD**

```bash
# [Linux Client - Winbind]
sudo systemctl disable --now sssd
systemctl is-enabled sssd
```
*Verificação esperada:* `disabled`.

**Passo 2 - Retirar o SSSD do PAM**

```bash
# [Linux Client - Winbind]
sudo pam-auth-update --disable sss
grep -c pam_sss /etc/pam.d/common-auth
```
*Verificação esperada:* `0`.

**Passo 3 - Retirar o SSSD do NSS**

```bash
# [Linux Client - Winbind]
sudo cp -a /etc/nsswitch.conf /etc/nsswitch.conf.orig
sudo sed -i -E '/^(passwd|group|shadow):/ s/ sss//' /etc/nsswitch.conf
grep -E '^(passwd|group|shadow):' /etc/nsswitch.conf
```
*Verificação esperada:* as linhas `passwd:`, `group:` e `shadow:` já não têm `sss`.

**Passo 4 - Ativar o serviço Winbind**

```bash
# [Linux Client - Winbind]
sudo systemctl enable winbind
systemctl is-enabled winbind
```
*Verificação esperada:* `enabled`.

### 2.2.3 Configuração do Samba (`smb.conf`)

**Passo 1 - Guardar a configuração original**

```bash
# [Linux Client - Winbind]
sudo cp -a /etc/samba/smb.conf /etc/samba/smb.conf.bak
```

**Passo 2 - Definir a secção `[global]`**

```bash
# [Linux Client - Winbind]
sudo nano /etc/samba/smb.conf
```
Substituir toda a secção `[global]` (até à linha `#======================= Share Definitions =======================`) por:
```ini
[global]
    # Identificação do domínio Active Directory
    workgroup = ISEC
    realm = ISEC.LOCAL
    security = ADS

    # Nome NetBIOS (máximo 15 caracteres) - nome da máquina no AD
    netbios name = UBU-WINBIND

    # Mapeamento de identificadores Windows para Linux
    idmap config * : backend = tdb
    idmap config * : range = 3000-7999
    idmap config ISEC : backend = rid
    idmap config ISEC : range = 10000-999999

    # Integração com Winbind
    winbind use default domain = yes
    winbind enum users = yes
    winbind enum groups = yes
    winbind refresh tickets = yes

    # Ambiente dos utilizadores do domínio
    template shell = /bin/bash
    template homedir = /home/%U

    # Integração com PAM
    obey pam restrictions = yes
```
Guardar com `Ctrl+O`, `Enter`; sair com `Ctrl+X`.

**Passo 3 - Verificar e validar a sintaxe**

```bash
# [Linux Client - Winbind]
sudo testparm -s
```
*Verificação esperada:* `Loaded services file OK.` e **`Server role: ROLE_DOMAIN_MEMBER`**, seguido dos parâmetros da `[global]`.

### 2.2.4 Configuração do Kerberos e adesão ao domínio

**Passo 1 - Guardar a configuração original**

```bash
# [Linux Client - Winbind]
sudo cp -a /etc/krb5.conf /etc/krb5.conf.bak
```

**Passo 2 - Escrever o `krb5.conf` (substituir todo o conteúdo)**

```bash
# [Linux Client - Winbind]  - ficheiro igual para todos
sudo tee /etc/krb5.conf > /dev/null << 'EOF'
[libdefaults]
    default_realm = ISEC.LOCAL
    dns_lookup_realm = false
    dns_lookup_kdc = true
    rdns = false
    ticket_lifetime = 24h
    forwardable = true

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

**Passo 3 - Testar a autenticação Kerberos**

```bash
# [Linux Client - Winbind]
kinit professor.teste@ISEC.LOCAL
klist
```
*Verificação esperada:* o `kinit` pede a palavra-passe e não mostra mais nada; o `klist` mostra `Default principal: professor.teste@ISEC.LOCAL` e o ticket `krbtgt/ISEC.LOCAL@ISEC.LOCAL`.

**Passo 4 - Juntar a máquina ao domínio (cria a conta de computador no AD)**

```bash
# [Linux Client - Winbind]
sudo net ads join -U Administrator
```
Pede a palavra-passe do *Administrator* do domínio.

*Verificação esperada:*
```
Using short domain name -- ISEC
Joined 'UBU-WINBIND' to dns domain 'isec.local'
```

### 2.2.5 Validar a associação ao domínio

**Passo 1 - Verificar se o Ubuntu está associado ao domínio**

```bash
# [Linux Client - Winbind]
sudo systemctl restart winbind
sudo systemctl status winbind --no-pager
sudo net ads testjoin
```
*Verificação esperada:* `winbind.service` com `active (running)` e `Status: "winbindd: ready to serve connections..."`; o `testjoin` responde **`Join is OK`**.

**Passo 2 - Verificar a relação de confiança**

```bash
# [Linux Client - Winbind]
sudo wbinfo -t
```
*Verificação esperada:* `checking the trust secret for domain ISEC via RPC calls succeeded`.

**Passo 3 - Verificar se o Winbind identifica os utilizadores e grupos do AD**

```bash
# [Linux Client - Winbind]
sudo wbinfo -u
sudo wbinfo -g
```
*Verificação esperada:* o `-u` lista, entre outros, `professor.teste` e `aluno.teste`; o `-g` lista, entre outros, `grupo-professores` e `grupo-alunos` (em minúsculas).

### 2.2.6 Diagnosticar o Winbind

**Passo 1 - Verificar se o Winbind contacta o controlador de domínio**

```bash
# [Linux Client - Winbind]
wbinfo --ping-dc
```
*Verificação esperada:* `checking the NETLOGON for domain[ISEC] dc connection to "SR2-SRV.isec.local" succeeded`.

**Passo 2 - Verificar se o domínio está online para o Winbind**

```bash
# [Linux Client - Winbind]
wbinfo --online-status
```
*Verificação esperada:* `BUILTIN`, `UBU-WINBIND` e `ISEC` com `active connection`.

**Passo 3 - Verificar a resolução de identidades**

```bash
# [Linux Client - Winbind]
wbinfo -i professor.teste
wbinfo -i aluno.teste
```
*Verificação esperada:* uma linha por utilizador no formato do `/etc/passwd`, por exemplo `professor.teste:*:11103:10513:Professor Teste:/home/professor.teste:/bin/bash`.

### 2.2.7 Integração do Winbind com NSS

**Passo 1 - Editar a configuração NSS**

```bash
# [Linux Client - Winbind]
sudo cp -a /etc/nsswitch.conf /etc/nsswitch.conf.bak
sudo nano /etc/nsswitch.conf
```
Deixar as linhas `passwd` e `group` assim (a linha `shadow` fica como está):
```
passwd:         files systemd winbind
group:          files systemd winbind
shadow:         files systemd
```
Se aparecer `sss` nestas linhas, retirar.

**Passo 2 - Validar a integração**

```bash
# [Linux Client - Winbind]
getent passwd professor.teste
getent passwd aluno.teste
id professor.teste
id aluno.teste
getent group grupo-professores
getent group grupo-alunos
```
*Verificação esperada:*
- `getent passwd` devolve a mesma linha do `wbinfo -i` (2.2.6, Passo 3);
- `id professor.teste` inclui `grupo-professores` e `id aluno.teste` inclui `grupo-alunos`, além de `domain users`;
- `getent group` devolve cada grupo com o seu GID (ex.: `grupo-professores:x:11101:`).

### 2.2.8 Configurar a autenticação PAM

**Passo 1 - Ativar os perfis PAM do Winbind**

```bash
# [Linux Client - Winbind]
sudo pam-auth-update
```
No menu (espaço para marcar, `Tab` para ir ao **OK**):
- **marcar:** *Unix authentication*, *Winbind NT/Active Directory authentication* e *Create home directory on login*;
- **desmarcar**, se aparecerem: *SSS authentication*, as opções *SSS ... smart card* e qualquer perfil do *ADsys*;
- as restantes opções ficam como estão.

*Verificação esperada:*
```bash
# [Linux Client - Winbind]
grep -E "pam_winbind|pam_mkhomedir" /etc/pam.d/common-auth /etc/pam.d/common-session
```
mostra `pam_winbind.so` no `common-auth` e `pam_mkhomedir.so` no `common-session`.

### 2.2.9 Testar o início de sessão com um utilizador AD

**Passo 1 - Verificar se a pasta pessoal já existe**

```bash
# [Linux Client - Winbind]
ls -ld /home/professor.teste
```
*Verificação esperada:* na primeira vez, `No such file or directory` (a pasta ainda não existe; é criada no login).

**Passo 2 - Autenticar o utilizador**

```bash
# [Linux Client - Winbind]
su - professor.teste
```
Pede a palavra-passe do utilizador no AD (escrever só `professor.teste`, sem `@isec.local`).

**Passo 3 - Validar a sessão**

```bash
# [Linux Client - Winbind]  (sessão de professor.teste)
whoami
id
pwd
echo "$HOME"
touch teste-winbind.txt
ls -l teste-winbind.txt
```
*Verificação esperada:* `whoami` → `professor.teste`; o `id` inclui `grupo-professores`; `pwd` e `$HOME` → `/home/professor.teste`; o ficheiro criado pertence a `professor.teste` e ao grupo `domain users`.

**Passo 4 - Regressar à conta local**

```bash
# [Linux Client - Winbind]  (sessão de professor.teste)
exit
```
*Verificação esperada:* `logout` e o prompt volta a ser o do utilizador local.

### 2.2.10 Testar a partilha SMB do Windows Server

**Passo 1 - Listar as partilhas e entrar na SRII como professor**

```bash
# [Linux Client - Winbind]
smbclient -L //SR2-SRV.isec.local -U 'ISEC\professor.teste'
smbclient //SR2-SRV.isec.local/SRII -U 'ISEC\professor.teste'
```
*Verificação esperada:* a lista mostra a partilha **SRII**; o segundo comando abre o prompt `smb: \>`.

**Passo 2 - Testar a escrita (professor)**

No prompt `smb: \>`:
```
ls
mkdir teste-professor-winbind
ls
exit
```
*Verificação esperada:* a pasta `teste-professor-winbind` aparece no segundo `ls`.

**Passo 3 - Entrar como aluno e testar a escrita**

```bash
# [Linux Client - Winbind]
smbclient //SR2-SRV.isec.local/SRII -U 'ISEC\aluno.teste'
```
No prompt `smb: \>`:
```
ls
mkdir teste-aluno-winbind
ls
exit
```
*Verificação esperada:* o aluno vê `teste-professor-winbind`, mas o `mkdir` dá `NT_STATUS_ACCESS_DENIED making remote directory \teste-aluno-winbind`.

### 2.2.11 Início de sessão gráfico com AD (GDM3)

**Passo 1 - Configurar o GDM3 para permitir escrever o nome do utilizador**

```bash
# [Linux Client - Winbind]
sudo mkdir -p /etc/dconf/db/gdm.d
sudo tee /etc/dconf/db/gdm.d/00-login-ad > /dev/null << 'EOF'
[org/gnome/login-screen]
disable-user-list=true
EOF
sudo cat /etc/dconf/db/gdm.d/00-login-ad
sudo dconf update
sudo systemctl restart gdm3
```

*Verificação esperada:* o ecrã de login mostra a opção **"Não está listado?"**.

**Passo 2 - Testar o início de sessão gráfico com `professor.teste` e `aluno.teste`**

No ecrã de login: **Não está listado?** → escrever `professor.teste` → palavra-passe do AD. Repetir depois com `aluno.teste`.

*Verificação esperada:* entra no ambiente de trabalho do utilizador do domínio (no primeiro login, a pasta pessoal é criada).

**Passo 3 - Confirmar a autenticação e os grupos do domínio**

Abrir um terminal na sessão gráfica:
```bash
# [Linux Client - Winbind]  (sessão gráfica de aluno.teste)
whoami
id
```
*Verificação esperada:* `whoami` → `aluno.teste`; o `id` inclui `domain users` e `grupo-alunos`.
