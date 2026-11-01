# Source in Google Cloud Shell Bash: source install-duyuru.sh COMMIT_SHA
# /Duyuru is a Bash function, not a file installed into the root directory.
_ks_install_duyuru() {
  local ref="${1:-}" directory="$HOME/.local/share/kelime-seyyahi" temporary
  if [[ ! "$ref" =~ ^[0-9a-f]{40}$ ]]; then
    printf '%s\n' 'Kurulum için geçerli sabit kaynak kimliği gerekli.' >&2
    return 1
  fi
  command -v python3 >/dev/null && command -v curl >/dev/null && command -v gcloud >/dev/null || {
    printf '%s\n' 'Bu kurulum Google Cloud Shell Bash içindir (python3, curl, gcloud gerekir).' >&2
    return 1
  }
  mkdir -p "$directory" || return 1
  temporary=$(mktemp "$directory/.duyuru.XXXXXX") || return 1
  if ! curl -fsSL "https://raw.githubusercontent.com/hamudenes9-debug/Blockgame/$ref/admin-tools/duyuru.py" -o "$temporary"; then
    rm -f "$temporary"
    return 1
  fi
  if ! python3 -c 'import ast,sys; ast.parse(open(sys.argv[1], encoding="utf-8").read())' "$temporary"; then
    rm -f "$temporary"
    return 1
  fi
  chmod 600 "$temporary" && mv "$temporary" "$directory/duyuru.py" || return 1
  if ! grep -Fq '# Kelime Seyyahi /Duyuru command v1' "$HOME/.bashrc" 2>/dev/null; then
    cat >> "$HOME/.bashrc" <<'BLOCK' || return 1

# Kelime Seyyahi /Duyuru command v1
function /Duyuru() {
  python3 "$HOME/.local/share/kelime-seyyahi/duyuru.py" "$@"
}
BLOCK
  fi
  function /Duyuru() {
    python3 "$HOME/.local/share/kelime-seyyahi/duyuru.py" "$@"
  }
  printf '%s\n' 'KURULDU. Örnek: /Duyuru "Merhaba seyyahlar!"' 'Yeni Cloud Shell Bash oturumlarında da kullanılabilir. Kurulum duyuru göndermez.'
}
if _ks_install_duyuru "$@"; then
  unset -f _ks_install_duyuru
else
  unset -f _ks_install_duyuru
  return 1 2>/dev/null || exit 1
fi
