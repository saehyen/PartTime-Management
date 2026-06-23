#!/bin/bash

echo "========================================"
echo "502 에러 빠른 수정 스크립트"
echo "========================================"
echo ""

echo "1단계: 현재 상태 확인"
docker-compose ps
echo ""

read -p "백엔드 컨테이너가 'Up' 상태가 아니면 Enter를 눌러 계속하세요..."

echo ""
echo "2단계: 컨테이너 중지"
docker-compose down

echo ""
echo "3단계: data 디렉토리 권한 확인"
if [ -d "data" ]; then
    echo "data 디렉토리 존재 확인 ✓"
    chmod -R 777 data/
else
    echo "data 디렉토리 생성"
    mkdir -p data
    chmod -R 777 data/
fi

echo ""
echo "4단계: .env 파일 확인"
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다!"
    read -p "서버 IP를 입력하세요 (예: 27.96.149.150): " SERVER_IP
    
    if [ ! -z "$SERVER_IP" ]; then
        cat > .env << EOF
FRONTEND_URL=http://${SERVER_IP}:3000
EOF
        echo "✓ .env 파일 생성 완료"
    else
        echo "기본값으로 .env 생성"
        cat > .env << EOF
FRONTEND_URL=http://localhost:3000
EOF
    fi
else
    echo "✓ .env 파일 존재 확인"
    cat .env
fi

echo ""
echo "5단계: 컨테이너 재시작"
docker-compose up -d

echo ""
echo "6단계: 로그 확인 (10초간)"
sleep 3
docker-compose logs --tail=30 backend

echo ""
echo "7단계: 백엔드 연결 테스트"
sleep 3
echo "테스트 중..."
for i in {1..5}; do
    if curl -s http://localhost:15000/api/health > /dev/null 2>&1; then
        echo "✅ 백엔드 연결 성공!"
        curl -s http://localhost:15000/api/health
        echo ""
        break
    else
        echo "시도 $i/5 - 대기 중..."
        sleep 2
    fi
done

echo ""
echo "========================================"
echo "수정 완료!"
echo "브라우저에서 접속: http://YOUR_SERVER_IP:3000"
echo ""
echo "추가 확인:"
echo "  - 로그 보기: docker-compose logs -f"
echo "  - 상태 확인: docker-compose ps"
echo "========================================"
