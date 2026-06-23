#!/bin/bash

echo "========================================"
echo "알바생 스케줄 관리 시스템 시작"
echo "========================================"

# 환경 파일이 없으면 생성
if [ ! -f .env ]; then
    echo "📝 .env 파일 생성 중..."
    cp .env.example .env
fi

# 데이터 디렉토리 생성
if [ ! -d ./data ]; then
    echo "📁 데이터 디렉토리 생성 중..."
    mkdir -p ./data
fi

# Docker Compose 실행
echo "🐳 Docker 컨테이너 시작 중..."
docker-compose up -d

echo ""
echo "✅ 시스템이 시작되었습니다!"
echo ""
echo "🌐 프론트엔드: http://localhost:3000"
echo "🔌 백엔드 API: http://localhost:5000"
echo ""
echo "📋 로그 확인: docker-compose logs -f"
echo "🛑 중지: docker-compose down"
echo "========================================"
