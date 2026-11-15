#!/usr/bin/env bash
# =====================================================================
#  Preparar o template "UbuntuClient" (Workshop SR2 - Grupo 10)
#
#  Correr na VM Ubuntu Desktop que vai dar origem ao template, com internet:
#     chmod +x preparar-template-ubuntuclient.sh
#     ./preparar-template-ubuntuclient.sh
#
#  Instala os pacotes do guião (SSSD + Winbind) e das componentes avançadas
#  (CB4 ADsys, CB5 pam_mount, MFA, CA1/CA2 authd + Entra ID, CA3 FreeIPA).
#  No fim fica ativo só o SSSD: o Winbind e o authd ficam desativados.
#
#  Explicação de cada pacote: guias_workshop/templates_vm/README.md
# =====================================================================

# 1) Pacotes do guião (SSSD + Winbind) + CB4 (ADsys) + CB5 (pam_mount) + MFA local (Google Authenticator) + CA3 (cliente FreeIPA)
sudo apt update && sudo DEBIAN_FRONTEND=noninteractive apt install -y \
  chrony krb5-user bind9-dnsutils smbclient cifs-utils libpam-mount dconf-cli \
  realmd adcli sssd sssd-tools libnss-sss libpam-sss samba-common-bin packagekit \
  winbind libnss-winbind libpam-winbind \
  adsys libpam-google-authenticator freeipa-client

# 2) CA1/CA2 - authd + broker do Entra ID (MFA na cloud)
#    [VERIFICAR] nomes do PPA, pacotes e broker em ubuntu.com/docs/authd
sudo add-apt-repository -y ppa:ubuntu-enterprise/authd
sudo apt update && sudo DEBIAN_FRONTEND=noninteractive apt install -y authd gnome-shell yaru-theme-gnome-shell
sudo snap install authd-msentraid

# 3) Deixar o Winbind e o authd DESATIVADOS (fica ativo só o SSSD)
sudo systemctl disable --now winbind
sudo pam-auth-update --disable winbind
[ -f /usr/share/pam-configs/authd ] && sudo pam-auth-update --disable authd
sudo sed -i -E '/^(passwd|group|shadow):/ s/ (winbind|authd)//g' /etc/nsswitch.conf

# 4) Verificar
echo "== Perfis PAM disponíveis:"
ls /usr/share/pam-configs/
echo "== PAM (não deve ter winbind nem authd):"
grep -E 'pam_(winbind|authd)' /etc/pam.d/common-auth || echo "OK: winbind e authd fora do PAM"
echo "== NSS (passwd/group/shadow sem winbind nem authd):"
grep -E '^(passwd|group|shadow):' /etc/nsswitch.conf
echo "== Serviço winbind (deve dizer disabled):"
systemctl is-enabled winbind

# 5) Antes de converter em template (Proxmox), limpar a identidade e desligar:
#    sudo apt clean && sudo truncate -s 0 /etc/machine-id && sudo rm -f /var/lib/dbus/machine-id \
#      && sudo ln -s /etc/machine-id /var/lib/dbus/machine-id && sudo shutdown -h now
