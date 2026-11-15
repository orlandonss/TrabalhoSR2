# Template `UbuntuClient` (SSSD + Winbind + componentes avançadas)

Um só template Ubuntu Desktop com os pacotes de todas as variantes e componentes avançadas. Para não haver conflitos, **só o SSSD fica ativo**: o Winbind e o authd ficam instalados mas **desativados** no PAM e no NSS.

| Clone do `UbuntuClient` | Secção do guião | O que se faz |
|---|---|---|
| `UbuntuClient-SSSD-grp<N>` | 2.1.1 | confirma que o Winbind está desativado |
| `UbuntuClient-Winbind-grp<N>` | 2.2.2 | desativa o SSSD e ativa o Winbind |

## 1. Script de preparação do template

Correr na VM Ubuntu Desktop que vai dar origem ao template, com internet. O mesmo script está em [`scripts/preparar-template-ubuntuclient.sh`](../../scripts/preparar-template-ubuntuclient.sh):

```bash
# 1) Pacotes do guião (SSSD + Winbind) + CB4 (ADsys) + CB5 (pam_mount) + MFA local (Google Authenticator) + CA3 (cliente FreeIPA)
sudo apt update && sudo DEBIAN_FRONTEND=noninteractive apt install -y \
  chrony krb5-user bind9-dnsutils smbclient cifs-utils libpam-mount dconf-cli \
  realmd adcli sssd sssd-tools libnss-sss libpam-sss samba-common-bin packagekit \
  winbind libnss-winbind libpam-winbind \
  adsys libpam-google-authenticator freeipa-client

# 2) CA1/CA2 - authd + broker do Entra ID (MFA na cloud)
sudo add-apt-repository -y ppa:ubuntu-enterprise/authd
sudo apt update && sudo DEBIAN_FRONTEND=noninteractive apt install -y authd gnome-shell yaru-theme-gnome-shell
sudo snap install authd-msentraid

# 3) Deixar o Winbind e o authd DESATIVADOS (fica ativo só o SSSD)
sudo systemctl disable --now winbind
sudo pam-auth-update --disable winbind
[ -f /usr/share/pam-configs/authd ] && sudo pam-auth-update --disable authd
sudo sed -i -E '/^(passwd|group|shadow):/ s/ (winbind|authd)//g' /etc/nsswitch.conf

# 4) Verificar
ls /usr/share/pam-configs/
grep -E 'pam_(winbind|authd)' /etc/pam.d/common-auth || echo "OK: winbind e authd fora do PAM"
grep -E '^(passwd|group|shadow):' /etc/nsswitch.conf
systemctl is-enabled winbind
```

**O que deve aparecer no fim:**
- o `grep` ao `common-auth` diz `OK: winbind e authd fora do PAM`;
- as linhas `passwd`, `group` e `shadow` do `nsswitch.conf` não têm `winbind` nem `authd`;
- `systemctl is-enabled winbind` responde `disabled`.

`DEBIAN_FRONTEND=noninteractive` só evita que o `krb5-user` pare a perguntar o realm: o `krb5.conf` é escrito no workshop.

> **[VERIFICAR]**
> - O passo 2 segue a documentação do authd (`ubuntu.com/docs/authd`). Confirmar na documentação os nomes do PPA, dos pacotes e do *broker* para a versão do Ubuntu usada.
> - Confirmar com `ls /usr/share/pam-configs/` qual é o nome do perfil PAM do authd. O passo 3 assume `authd`.
> - Confirmar que o `freeipa-client` existe nos repositórios da versão do Ubuntu usada.

## 2. Para que serve cada pacote

| Pacotes | Para quê |
|---|---|
| `chrony` | relógio sincronizado com o DC (2.1.3, 2.2.1) |
| `krb5-user` | `kinit`, `klist`, `krb5.conf` (2.1.4, 2.2.4) |
| `bind9-dnsutils` | `dig` (2.1.2) |
| `smbclient`, `cifs-utils` | acesso à SRII (2.1.5, 2.1.9, 2.2.10) e montagem (2.1.10) |
| `libpam-mount` | montagem automática da SRII no login (2.1.10, **CB5**) |
| `dconf-cli` | `dconf update` do login gráfico (2.2.11) |
| `realmd`, `adcli`, `packagekit`, `samba-common-bin` | entrada no domínio com `realm join` (2.1.6) |
| `sssd`, `sssd-tools`, `libnss-sss`, `libpam-sss` | variante SSSD (2.1.6 a 2.1.8) - **ativa** |
| `samba-common-bin` | `net ads join`, `testparm` (2.2.3 a 2.2.5) |
| `winbind`, `libnss-winbind`, `libpam-winbind` | variante Winbind (2.2) - **desativada** no template |
| `adsys` | **CB4** - GPO do AD aplicadas no Ubuntu |
| `libpam-google-authenticator` | **MFA** local com códigos TOTP no PAM (ex.: SSH) - não fica ativo até ser configurado |
| `authd`, `authd-msentraid` (snap) | **CA1** (authd) e **CA2** (Entra ID: SSO, MFA e grupos) - **desativado** no template |
| `freeipa-client` | **CA3** - cliente para um servidor FreeIPA (o servidor é uma VM à parte) |

Já vêm com o Ubuntu Desktop: `gdm3`, `network-manager`, `libpam-modules` (`pam_mkhomedir`) e `nano`.

As outras componentes avançadas do trabalho não precisam de pacotes:
- `sudo` por grupo do AD, no `/etc/sudoers`;
- auditoria com `/var/log/auth.log` e `journalctl -u sssd`.

## 3. Converter em template (Proxmox)

1. Não configurar mais nada no template (rede, `krb5.conf`, `smb.conf`, hostname): o guião começa por aí.
2. Limpar a identidade da máquina e desligar:
   ```bash
   sudo apt clean && sudo truncate -s 0 /etc/machine-id && sudo rm -f /var/lib/dbus/machine-id && sudo ln -s /etc/machine-id /var/lib/dbus/machine-id && sudo shutdown -h now
   ```
3. No Proxmox: botão direito na VM → **Convert to template** → pool `PoolStudentTemplates`.

> **[VERIFICAR]** Antes de usar no workshop, fazer o guião completo (2.1 e 2.2) num clone de teste. Assim confirma-se que os pacotes extra (ADsys, authd, FreeIPA, Google Authenticator) não afetam os logins (2.1.8, 2.2.9, 2.2.11). Se algum der problemas, tirá-lo do script e instalá-lo só na experiência correspondente.
