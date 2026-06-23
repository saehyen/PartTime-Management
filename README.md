# 알바생 스케줄 관리 시스템

알바생의 근무 시간을 캘린더로 관리하고, 시급 기반으로 월별 급여를 자동 계산하는 웹 애플리케이션입니다.

## 주요 기능

- 📅 **캘린더 기반 스케줄 관리**: 드래그로 근무 시간 선택
- 💰 **시급 관리**: 알바생별 시급 설정
- 📊 **월별 정산**: 알바생별 급여 및 총 지출 자동 계산
- 🐳 **Docker 지원**: 간단한 명령어로 실행

## 시스템 요구사항

- Docker & Docker Compose
- Rocky Linux 8 (또는 다른 Linux 배포판)

## 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/saehyen/PartTime-Management.git
cd PartTime-Management
```

### 2. 환경 설정

```bash
# .env 파일 생성 (필요시 수정)
cp .env.example .env
```

### 3. Docker로 실행

```bash
# 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 4. 접속

- 프론트엔드: `http://localhost:3000`
- 백엔드 API: `http://localhost:15000`

## 수동 실행 (개발 환경)

### 백엔드 실행

```bash
cd backend
npm install
npm run dev
```

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

## 주요 명령어

```bash
# 서비스 시작
docker-compose up -d

# 서비스 중지
docker-compose down

# 서비스 재시작
docker-compose restart

# 로그 확인
docker-compose logs -f

# 데이터 초기화 (주의!)
docker-compose down -v
```

## 프로젝트 구조

```
.
├── frontend/          # React + Vite 프론트엔드
├── backend/           # Node.js + Express 백엔드
├── docker-compose.yml # Docker 구성
└── README.md
```

## 기술 스택

- **Frontend**: React 18, Vite, FullCalendar, TailwindCSS
- **Backend**: Node.js, Express, SQLite
- **DevOps**: Docker, Docker Compose

## 문제 해결

문제가 발생하면 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 문서를 참고하세요.

특히 "알바생 목록을 불러올 수 없습니다" 오류가 발생하면:
1. 백엔드 서버가 실행 중인지 확인: `curl http://localhost:15000/api/health`
2. 브라우저 개발자 도구(F12)의 Console과 Network 탭 확인
3. Docker 로그 확인: `docker-compose logs -f`

## 라이센스

MIT License
