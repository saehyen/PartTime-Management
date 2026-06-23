# 문제 해결 가이드

## "알바생 목록을 불러올 수 없습니다" 오류

### 1. 백엔드 서버가 실행 중인지 확인

```bash
# Docker 환경
docker-compose ps

# 로컬 개발 환경
curl http://localhost:15000/api/health
```

정상 응답: `{"status":"ok","timestamp":"..."}`

### 2. 포트 확인

백엔드가 **15000번 포트**에서 실행되고 있는지 확인:

```bash
# Windows
netstat -ano | findstr :15000

# Linux
netstat -tlnp | grep 15000
```

### 3. 브라우저 개발자 도구 확인

1. 브라우저에서 `F12` 키를 눌러 개발자 도구 열기
2. **Console** 탭에서 에러 메시지 확인
3. **Network** 탭에서 API 요청 상태 확인
   - `/api/employees` 요청이 실패하는지 확인
   - 상태 코드 확인 (404, 500, CORS 오류 등)

### 4. CORS 오류인 경우

**증상**: 브라우저 콘솔에 "CORS policy" 관련 에러

**해결방법**:

#### Docker 환경
`docker-compose.yml`에서 환경 변수 확인:
```yaml
backend:
  environment:
    - FRONTEND_URL=http://localhost:3000
```

#### 로컬 개발 환경
백엔드 `.env` 파일 생성:
```bash
cd backend
echo "FRONTEND_URL=http://localhost:3000" > .env
```

### 5. 데이터베이스 오류인 경우

**증상**: 백엔드 로그에 SQLite 관련 에러

**해결방법**:

```bash
# Docker 환경 - 컨테이너 재시작
docker-compose restart backend

# 데이터베이스 초기화 (데이터 삭제됨!)
docker-compose down -v
rm -rf data
docker-compose up -d

# 로컬 개발 환경
cd backend
rm -rf data
npm run dev
```

### 6. 포트 충돌 해결

**증상**: "Port already in use" 또는 "EADDRINUSE" 에러

**해결방법**:

```bash
# Windows
netstat -ano | findstr :15000
taskkill /PID [프로세스ID] /F

# Linux/Mac
lsof -ti:15000 | xargs kill -9

# Docker 환경
docker-compose down
docker-compose up -d
```

### 7. 네트워크 연결 테스트

#### 프론트엔드에서 백엔드 접근 테스트

```bash
# 브라우저 콘솔에서 실행
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

#### 직접 curl 테스트

```bash
# 헬스체크
curl http://localhost:15000/api/health

# 알바생 목록 조회
curl http://localhost:15000/api/employees

# Docker 컨테이너 내부에서
docker exec -it parttime-backend curl http://localhost:15000/api/health
```

### 8. 로그 확인

#### Docker 환경

```bash
# 실시간 로그
docker-compose logs -f

# 백엔드만
docker-compose logs -f backend

# 프론트엔드만
docker-compose logs -f frontend

# 최근 100줄
docker-compose logs --tail=100
```

#### 로컬 개발 환경

터미널에서 백엔드 실행 시 출력되는 로그 확인:
- `알바생 목록 조회 요청`
- `알바생 X명 조회 완료`

### 9. 방화벽 확인 (외부 서버 접근 시)

```bash
# Rocky Linux 8
sudo firewall-cmd --list-ports

# 포트가 없다면 추가
sudo firewall-cmd --permanent --add-port=15000/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 10. 재시작 순서

완전히 새로 시작하는 방법:

```bash
# Docker 환경
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 로컬 개발 환경
# 백엔드 터미널
cd backend
rm -rf node_modules data
npm install
npm run dev

# 프론트엔드 터미널 (새 창)
cd frontend
rm -rf node_modules
npm install
npm run dev
```

---

## 기타 문제

### 스케줄이 저장되지 않음

1. 알바생이 먼저 추가되어 있는지 확인
2. 브라우저 콘솔에서 에러 메시지 확인
3. 백엔드 로그 확인

### 월별 정산이 표시되지 않음

1. 스케줄이 등록되어 있는지 확인
2. 해당 월에 스케줄이 있는지 확인
3. 브라우저 콘솔에서 `/api/statistics/monthly` 요청 확인

### Docker 빌드 실패

```bash
# 캐시 없이 다시 빌드
docker-compose build --no-cache

# 특정 서비스만 빌드
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
```

---

## 여전히 해결되지 않는다면

1. GitHub Issues에 등록: https://github.com/saehyen/PartTime-Management/issues
2. 다음 정보 포함:
   - 운영체제 (Windows/Linux/Mac)
   - 실행 환경 (Docker/로컬 개발)
   - 에러 메시지 (브라우저 콘솔 + 백엔드 로그)
   - `docker-compose logs` 전체 출력 (Docker 환경)
