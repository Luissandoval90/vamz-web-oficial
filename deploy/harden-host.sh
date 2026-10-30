#!/bin/sh
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Ejecuta este script con sudo."
  exit 1
fi

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y fail2ban ufw
install -d -m 0755 /etc/fail2ban/jail.d
cat > /etc/fail2ban/jail.d/vamz-sshd.local <<'CONFIG'
[sshd]
enabled = true
backend = systemd
banaction = nftables-multiport
maxretry = 5
findtime = 10m
bantime = 1h
CONFIG
fail2ban-client -t
systemctl enable fail2ban
systemctl restart fail2ban

ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw default deny incoming
ufw default allow outgoing
ufw --force enable
ufw status
fail2ban-client status sshd
