# Source in Google Cloud Shell Bash: source install-duyuru.sh COMMIT_SHA
# /Duyuru is a Bash function, not a file installed into the root directory.
_ks_install_duyuru() {
  local ref="${1:-}" directory="$HOME/.local/share/kelime-seyyahi" temporary name
  if [[ ! "$ref" =~ ^[0-9a-f]{40}$ ]]; then
    printf '%s\n' 'Kurulum için geçerli sabit kaynak kimliği gerekli.' >&2
    return 1
  fi
  command -v python3 >/dev/null && command -v curl >/dev/null && command -v gcloud >/dev/null || {
    printf '%s\n' 'Bu kurulum Google Cloud Shell Bash içindir (python3, curl, gcloud gerekir).' >&2
    return 1
  }
  mkdir -p "$directory" || return 1
  temporary=$(mktemp -d "$directory/.commands.XXXXXX") || return 1
  for name in duyuru.py bildirim.py bakim.py yonetim.py event.py; do
    if ! curl -fsSL "https://raw.githubusercontent.com/hamudenes9-debug/Blockgame/$ref/admin-tools/$name" -o "$temporary/$name"; then
      rm -rf "$temporary"
      return 1
    fi
    if ! python3 -c 'import ast,sys; ast.parse(open(sys.argv[1], encoding="utf-8").read())' "$temporary/$name"; then
      rm -rf "$temporary"
      return 1
    fi
    chmod 600 "$temporary/$name" || return 1
  done
  for name in duyuru.py bildirim.py bakim.py yonetim.py event.py; do
    mv "$temporary/$name" "$directory/$name" || return 1
  done
  rmdir "$temporary" || return 1
  if ! grep -Fq '# Kelime Seyyahi /Duyuru command v1' "$HOME/.bashrc" 2>/dev/null; then
    cat >> "$HOME/.bashrc" <<'BLOCK' || return 1

# Kelime Seyyahi /Duyuru command v1
function /Duyuru() {
  python3 "$HOME/.local/share/kelime-seyyahi/duyuru.py" "$@"
}
BLOCK
  fi
  if ! grep -Fq '# Kelime Seyyahi /bildirim command v1' "$HOME/.bashrc" 2>/dev/null; then
    cat >> "$HOME/.bashrc" <<'BLOCK' || return 1

# Kelime Seyyahi /bildirim command v1
function /bildirim() {
  python3 "$HOME/.local/share/kelime-seyyahi/bildirim.py" "$@"
}
function /Bildirim() {
  /bildirim "$@"
}
BLOCK
  fi
  if ! grep -Fq '# Kelime Seyyahi /bakim command v1' "$HOME/.bashrc" 2>/dev/null; then
    cat >> "$HOME/.bashrc" <<'BLOCK' || return 1

# Kelime Seyyahi /bakim command v1
function /bakım() {
  python3 "$HOME/.local/share/kelime-seyyahi/bakim.py" "$@"
}
function /bakim() { /bakım "$@"; }
function /Bakım() { /bakım "$@"; }
BLOCK
  fi
  if ! grep -Fq '# Kelime Seyyahi yonetim commands v1' "$HOME/.bashrc" 2>/dev/null; then
    cat >> "$HOME/.bashrc" <<'BLOCK' || return 1

# Kelime Seyyahi yonetim commands v1
function /premium() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" premium "$@"; }
function /oyuncu() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" oyuncu "$@"; }
function /duyurular() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" duyurular "$@"; }
function /duyuru-sil() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" duyuru-sil "$@"; }
function /durum() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" durum "$@"; }
function /yardım() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" yardım "$@"; }
function /yardim() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" yardim "$@"; }
BLOCK
  fi
function /premium() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" premium "$@"; }
function /oyuncu() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" oyuncu "$@"; }
function /duyurular() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" duyurular "$@"; }
function /duyuru-sil() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" duyuru-sil "$@"; }
function /durum() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" durum "$@"; }
function /yardım() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" yardım "$@"; }
function /yardim() { python3 "$HOME/.local/share/kelime-seyyahi/yonetim.py" yardim "$@"; }
  if ! grep -Fq '# Kelime Seyyahi event command v1' "$HOME/.bashrc" 2>/dev/null; then
    cat >> "$HOME/.bashrc" <<'BLOCK' || return 1

# Kelime Seyyahi event command v1
function /event() { python3 "$HOME/.local/share/kelime-seyyahi/event.py" "$@"; }
BLOCK
  fi
  function /event() { python3 "$HOME/.local/share/kelime-seyyahi/event.py" "$@"; }
  function /bakım() {
    python3 "$HOME/.local/share/kelime-seyyahi/bakim.py" "$@"
  }
  function /bakim() { /bakım "$@"; }
  function /Bakım() { /bakım "$@"; }
  function /bildirim() {
    python3 "$HOME/.local/share/kelime-seyyahi/bildirim.py" "$@"
  }
  function /Bildirim() { /bildirim "$@"; }
  function /Duyuru() {
    python3 "$HOME/.local/share/kelime-seyyahi/duyuru.py" "$@"
  }
  printf '%s\n' 'KURULDU: Tüm Seyyah yönetim komutları hazır. Liste: /yardım' 'Yeni Cloud Shell Bash oturumlarında da kullanılabilir. Kurulum duyuru/bildirim göndermez ve bakımı açmaz.'
}
if _ks_install_duyuru "$@"; then
  unset -f _ks_install_duyuru
else
  unset -f _ks_install_duyuru
  return 1 2>/dev/null || exit 1
fi
