# 설치 및 실행 가이드

## 🚀 Rocky Linux 8에서 실행하기

### 1. 사전 준비

Docker와 Docker Compose 설치:

```bash
# Docker 설치
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install docker-ce docker-ce-cli containerd.io -y
sudo systemctl start docker
sudo systemctl enable docker

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 버전 확인
docker --version
docker-compose --version
```

### 2. 프로젝트 클론

```bash
git clone https://github.com/saehyen/PartTime-Management.git
cd PartTime-Management
```

### 3. 실행 권한 부여

```bash
chmod +x start.sh stop.sh
```

### 4. 실행

```bash
# 간단 실행
./start.sh

# 또는 수동 실행
docker-compose up -d
```

### 5. 접속

브라우저에서 다음 주소로 접속:
- **프론트엔드**: http://서버IP:3000
- **백엔드 API**: http://서버IP:15000

### 6. 중지

```bash
./stop.sh

# 또는
docker-compose down
```

---

## 💻 로컬 개발 환경 (Windows/Mac/Linux)

### 1. Node.js 설치

Node.js 18 이상 필요: https://nodejs.org/

### 2. 백엔드 실행

```bash
cd backend
npm install
npm run dev
```

백엔드가 http://localhost:15000 에서 실행됩니다.

### 3. 프론트엔드 실행 (새 터미널)

```bash
cd frontend
npm install
npm run dev
```

프론트엔드가 http://localhost:3000 에서 실행됩니다.

---

## 📝 주요 기능 사용법

### 알바생 추가
1. 오른쪽 사이드바의 "👤 알바생 관리"에서 "+ 추가" 클릭
2. 이름, 시급, 색상 선택 후 "추가" 클릭

### 스케줄 추가
1. 캘린더에서 근무 시간을 드래그하여 선택
2. 모달에서 알바생 선택 후 "저장" 클릭

### 스케줄 수정
- **드래그**: 스케줄을 다른 시간대로 이동
- **리사이즈**: 스케줄의 끝부분을 드래그하여 시간 조정
- **클릭**: 스케줄 클릭 후 상세 정보 수정 또는 삭제

### 월별 정산 확인
오른쪽 사이드바의 "💰 월별 정산"에서 현재 월의 급여 정보 확인

---

## 🔧 문제 해결

### 포트가 이미 사용 중
```bash
# 3000 포트 확인
sudo lsof -i :3000
sudo kill -9 [PID]

# 15000 포트 확인
sudo lsof -i :15000
sudo kill -9 [PID]
```

### Docker 컨테이너 재시작
```bash
docker-compose restart
```

### 데이터 초기화
```bash
docker-compose down -v
rm -rf data
docker-compose up -d
```

### 로그 확인
```bash
# 전체 로그
docker-compose logs -f

# 백엔드만
docker-compose logs -f backend

# 프론트엔드만
docker-compose logs -f frontend
```

---

## 🛠️ 커스터마이징

### 포트 변경

`docker-compose.yml` 파일 수정:
```yaml
services:
  backend:
    ports:
      - "포트번호:15000"
  frontend:
    ports:
      - "포트번호:80"
```

### 데이터베이스 백업

```bash
# 백업
cp data/parttime.db data/parttime_backup_$(date +%Y%m%d).db

# 복원
cp data/parttime_backup_날짜.db data/parttime.db
docker-compose restart
```

---

## 📦 프로덕션 배포

### 외부 접속 허용 (방화벽)

```bash
# Rocky Linux 8
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=15000/tcp
sudo firewall-cmd --reload
```

### HTTPS 설정 (nginx + Let's Encrypt)

추후 필요시 nginx 리버스 프록시 및 SSL 인증서 설정 가능

---

## 📞 지원

문제가 발생하면 GitHub Issues에 등록해주세요:
https://github.com/saehyen/PartTime-Management/issues
