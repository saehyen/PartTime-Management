#!/bin/bash

echo "========================================"
echo "알바생 스케줄 관리 시스템 진단"
echo "========================================"
echo ""

echo "1. Docker 컨테이너 상태 확인"
echo "----------------------------"
docker-compose ps
echo ""

echo "2. 백엔드 컨테이너 로그 (최근 20줄)"
echo "----------------------------"
docker-compose logs --tail=20 backend
echo ""

echo "3. 프론트엔드 컨테이너 로그 (최근 20줄)"
echo "----------------------------"
docker-compose logs --tail=20 frontend
echo ""

echo "4. 네트워크 연결 테스트"
echo "----------------------------"
echo "프론트엔드 -> 백엔드 연결 테스트:"
docker exec parttime-frontend wget -qO- http://backend:15000/api/health 2>&1 || echo "❌ 연결 실패"
echo ""

echo "로컬 -> 백엔드 연결 테스트:"
curl -s http://localhost:15000/api/health || echo "❌ 연결 실패"
echo ""

echo "5. 포트 리스닝 확인"
echo "----------------------------"
netstat -tlnp 2>/dev/null | grep -E ':(3000|15000)' || ss -tlnp 2>/dev/null | grep -E ':(3000|15000)'
echo ""

echo "========================================"
echo "진단 완료"
echo "========================================"
