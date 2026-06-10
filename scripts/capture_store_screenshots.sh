#!/bin/bash
# Capture des screenshots Play Store via adb.
# Pre-requis :
#  - app Machii installee + lancee (com.machii.app)
#  - tel branche, debug USB autorise
#  - role utilisateur = 'both' (ou bascule manuelle des modes)
#  - adb dans PATH
#
# Usage :
#   bash scripts/capture_store_screenshots.sh
#
# Sortie : docs/play-store/screenshots/*.png (8 fichiers)

set -euo pipefail

ADB="${ADB:-/c/Users/Wachem/AppData/Roaming/mobai/bin/adb.exe}"
OUT_DIR="docs/play-store/screenshots"
mkdir -p "$OUT_DIR"

# Largeur ecran 720, hauteur 1600 (cf wm size)
TABBAR_Y=1450
HOME_X=90
SEARCH_X=216
TRIPS_X=360
CHAT_X=504
PROFILE_X=648

capture() {
  local name=$1
  sleep 2
  "$ADB" exec-out screencap -p > "$OUT_DIR/$name.png"
  echo "  -> $OUT_DIR/$name.png ($(stat -c%s "$OUT_DIR/$name.png") bytes)"
}

echo "=== 1. Accueil passager ==="
"$ADB" shell input tap $HOME_X $TABBAR_Y
sleep 1
# Si toggle visible, force passager
"$ADB" shell input tap 200 245
capture "01_home_passenger"

echo "=== 2. Recherche ==="
"$ADB" shell input tap $SEARCH_X $TABBAR_Y
capture "02_search"

echo "=== 3. Mes courses passager ==="
"$ADB" shell input tap $TRIPS_X $TABBAR_Y
capture "03_my_trips_passenger"

echo "=== 4. Accueil conducteur (bascule via toggle) ==="
"$ADB" shell input tap $HOME_X $TABBAR_Y
sleep 1
"$ADB" shell input tap 520 245
capture "04_home_driver"

echo "=== 5. Mes trajets conducteur ==="
"$ADB" shell input tap $TRIPS_X $TABBAR_Y
capture "05_my_trips_driver"

echo "=== 6. Chat ==="
"$ADB" shell input tap $CHAT_X $TABBAR_Y
capture "06_chat_list"

echo "=== 7. Profil ==="
"$ADB" shell input tap $PROFILE_X $TABBAR_Y
capture "07_profile"

echo "=== 8. SOS ==="
"$ADB" shell input swipe 360 1300 360 600 300
sleep 1
# Tap sur le 3eme bouton (SOS) sur l'ecran scroll vers le bas
"$ADB" shell input tap 360 950
capture "08_sos"

echo ""
echo "Termine. Screenshots dans $OUT_DIR/"
ls -la "$OUT_DIR"
