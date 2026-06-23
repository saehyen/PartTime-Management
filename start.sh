#!/bin/bash

echo "========================================"
echo "?Œë°”???¤ì?ì¤?ê´€ë¦??œìŠ¤???œì‘"
echo "========================================"

# ?˜ê²½ ?Œì¼???†ìœ¼ë©??ì„±
if [ ! -f .env ]; then
    echo "?“ .env ?Œì¼ ?ì„± ì¤?.."
    cp .env.example .env
fi

# ?°ì´???”ë ‰? ë¦¬ ?ì„±
if [ ! -d ./data ]; then
    echo "?“ ?°ì´???”ë ‰? ë¦¬ ?ì„± ì¤?.."
    mkdir -p ./data
fi

# Docker Compose ?¤í–‰
echo "?³ Docker ì»¨í…Œ?´ë„ˆ ?œì‘ ì¤?.."
docker compose up -d

echo ""
echo "???œìŠ¤?œì´ ?œì‘?˜ì—ˆ?µë‹ˆ??"
echo ""
echo "?Œ ?„ë¡ ?¸ì—”?? http://localhost:3000"
echo "?”Œ ë°±ì—”??API: http://localhost:15000"
echo ""
echo "?“‹ ë¡œê·¸ ?•ì¸: docker compose logs -f"
echo "?›‘ ì¤‘ì?: docker compose down"
echo "========================================"
