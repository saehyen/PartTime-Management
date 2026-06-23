# 502 에러 해결 체크리스트

## ✅ 빠른 진단 (1분)

터미널에서 순서대로 실행:

```bash
# 1. 컨테이너 상태 확인
docker-compose ps
```
- ✅ backend와 frontend 둘 다 "Up" 상태여야 함
- ❌ backend가 "Exit" 또는 "Restarting"이면 문제!

```bash
# 2. 백엔드 연결 테스트
curl http://localhost:15000/api/health
```
- ✅ `{"status":"ok",...}` 응답이면 정상
- ❌ 연결 거부 또는 응답 없으면 문제!

```bash
# 3. 백엔드 로그 확인
docker-compose logs --tail=20 backend
```
- ✅ `🚀 서버가 포트 15000에서 실행 중입니다.` 메시지 있어야 함
- ❌ 에러 메시지가 있으면 해당 에러 해결 필요

---

## 🔧 해결 방법 (난이도별)

### Level 1: 간단한 재시작 (30초)

```bash
docker-compose restart backend
sleep 5
curl http://localhost:15000/api/health
```

성공하면 브라우저 새로고침!

---

### Level 2: 전체 재시작 (1분)

```bash
docker-compose down
docker-compose up -d
docker-compose logs -f
```

"🚀 서버가 포트 15000에서 실행 중" 메시지 확인 후 Ctrl+C

---

### Level 3: 권한 및 환경 설정 (2분)

```bash
# .env 파일 확인/생성
if [ ! -f .env ]; then
  echo "FRONTEND_URL=http://YOUR_SERVER_IP:3000" > .env
fi

# data 디렉토리 권한
mkdir -p data
chmod -R 777 data

# 재시작
docker-compose down
docker-compose up -d
```

---

### Level 4: 완전 재빌드 (5분)

```bash
# 완전 정리
docker-compose down -v
docker rmi parttime-management-backend parttime-management-frontend 2>/dev/null

# 재빌드
docker-compose build --no-cache
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

---

### Level 5: 자동 수정 스크립트 (2분)

```bash
chmod +x quick-fix.sh
./quick-fix.sh
```

---

## 🔍 문제별 해결

### 문제 1: "backend" 컨테이너가 계속 재시작

```bash
# 로그에서 에러 확인
docker-compose logs backend | tail -50

# 일반적인 원인:
# - 포트 15000 충돌: sudo lsof -ti:15000 | xargs kill -9
# - 권한 문제: chmod -R 777 data/
# - 의존성 문제: docker-compose build --no-cache backend
```

### 문제 2: "502 Bad Gateway" 계속 발생

```bash
# 프론트엔드에서 백엔드 연결 테스트
docker exec parttime-frontend wget -qO- http://backend:15000/api/health

# 실패하면 네트워크 재생성
docker-compose down
docker network prune -f
docker-compose up -d
```

### 문제 3: 포트 충돌

```bash
# 15000번 포트 사용 프로세스 찾기
sudo netstat -tlnp | grep 15000

# 또는
sudo ss -tlnp | grep 15000

# 해당 프로세스 종료
sudo kill -9 [PID]

# Docker 재시작
docker-compose up -d
```

### 문제 4: 데이터베이스 초기화 실패

```bash
# data 디렉토리 삭제 및 재생성
docker-compose down
rm -rf data
mkdir -p data
chmod 777 data
docker-compose up -d
```

---

## 📱 브라우저에서 확인

### 개발자 도구 (F12) 체크

1. **Console 탭**에서 에러 메시지 확인
   - `Failed to fetch` → 백엔드 연결 안 됨
   - `502 Bad Gateway` → nginx가 백엔드 찾지 못함
   - `CORS error` → CORS 설정 문제

2. **Network 탭**에서 API 요청 확인
   - `/api/employees` 요청 선택
   - Status: 502 → 백엔드 문제
   - Status: 404 → 엔드포인트 오류
   - Status: 500 → 백엔드 내부 오류

---

## ✨ 최종 확인

모든 것이 정상이면:

```bash
# 1. 컨테이너 상태
docker-compose ps
# NAME                  STATUS
# parttime-backend      Up
# parttime-frontend     Up

# 2. 백엔드 응답
curl http://localhost:15000/api/health
# {"status":"ok","timestamp":"..."}

# 3. 알바생 목록 (빈 배열이라도 정상)
curl http://localhost:15000/api/employees
# []

# 4. 브라우저 접속
# http://YOUR_SERVER_IP:3000
# → 에러 없이 화면 표시
```

---

## 🆘 여전히 안 되면

```bash
# 전체 로그 저장
docker-compose logs > logs.txt

# GitHub Issues에 업로드:
# https://github.com/saehyen/PartTime-Management/issues
```

포함할 정보:
- `docker-compose ps` 출력
- `logs.txt` 파일
- 브라우저 Console의 에러 메시지 스크린샷
- 운영체제 (Rocky Linux 8 등)
