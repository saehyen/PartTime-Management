# 외부 접속 설정 가이드

## 🔒 보안 참고사항

이 문서의 IP 주소(27.96.149.150)는 예시입니다. 실제 서버 IP는 코드에 포함되지 않으며 환경 변수로 관리됩니다.

## 현재 상황
- **서버 IP**: YOUR_SERVER_IP (예: 27.96.149.150)
- **프론트엔드 포트**: 3000
- **백엔드 포트**: 15000
- **접속 URL**: http://YOUR_SERVER_IP:3000

## 🔧 필수 설정

### 1. .env 파일 생성

프로젝트 루트에 `.env` 파일 생성:

```bash
cd /path/to/PartTime-Management

# .env 파일 생성
cat > .env << EOF
# 실제 서버 IP로 변경하세요
FRONTEND_URL=http://27.96.149.150:3000
EOF
```

또는 텍스트 에디터로:

```bash
nano .env
```

```env
# 외부 접속을 위한 서버 IP 설정
FRONTEND_URL=http://YOUR_SERVER_IP:3000
```

**⚠️ 주의**: `.env` 파일은 Git에 업로드되지 않습니다 (`.gitignore`에 포함됨)

### 2. 방화벽 설정 (Rocky Linux 8)

```bash
# 방화벽에 포트 열기
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=15000/tcp
sudo firewall-cmd --reload

# 확인
sudo firewall-cmd --list-ports
```

### 3. Docker 컨테이너 시작

`.env` 파일을 생성한 후:

```bash
cd /path/to/PartTime-Management

# Docker Compose가 .env 파일을 자동으로 읽습니다
docker-compose up -d

# 또는 재시작
docker-compose down
docker-compose up -d
```

## 🧪 접속 테스트

### 1. 서버에서 테스트

```bash
# 프론트엔드 접근 테스트
curl http://localhost:3000

# 백엔드 API 테스트
curl http://localhost:15000/api/health
# 예상 응답: {"status":"ok","timestamp":"..."}

# 알바생 목록 조회
curl http://localhost:15000/api/employees
# 예상 응답: [] 또는 알바생 배열
```

### 2. 외부에서 테스트

```bash
# 다른 컴퓨터에서
curl http://27.96.149.150:3000
curl http://27.96.149.150:15000/api/health
```

### 3. 브라우저에서 테스트

1. **프론트엔드 접속**: http://27.96.149.150:3000
2. **F12 키**로 개발자 도구 열기
3. **Console 탭**에서 다음 명령어 실행:

```javascript
// API 연결 테스트
fetch('/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ 백엔드 연결 성공:', data))
  .catch(err => console.error('❌ 백엔드 연결 실패:', err));
```

## 🚨 문제 해결

### 문제 1: "알바생 목록을 불러올 수 없습니다"

**원인**: 프론트엔드와 백엔드 간 통신 실패

**해결방법**:

```bash
# 1. 컨테이너 상태 확인
docker-compose ps

# 2. 백엔드 로그 확인
docker-compose logs -f backend

# 3. 프론트엔드 로그 확인
docker-compose logs -f frontend

# 4. 네트워크 연결 테스트
docker exec -it parttime-frontend curl http://backend:15000/api/health
```

### 문제 2: 외부에서 접속 불가

**체크리스트**:

1. ✅ 방화벽 포트 열림?
```bash
sudo firewall-cmd --list-ports
```

2. ✅ Docker 컨테이너 실행 중?
```bash
docker-compose ps
# parttime-frontend: Up
# parttime-backend: Up
```

3. ✅ 포트 리스닝 중?
```bash
sudo netstat -tlnp | grep 3000
sudo netstat -tlnp | grep 15000
```

4. ✅ SELinux 설정 (Rocky Linux)
```bash
# SELinux 상태 확인
sudo getenforce

# 필요시 임시 비활성화 (테스트용)
sudo setenforce 0

# 영구 비활성화 (프로덕션에서는 권장하지 않음)
sudo vi /etc/selinux/config
# SELINUX=disabled
```

### 문제 3: CORS 에러

**증상**: 브라우저 콘솔에 "CORS policy" 에러

**해결방법**:

1. `docker-compose.yml`의 FRONTEND_URL이 올바른지 확인
2. 컨테이너 재시작
```bash
docker-compose restart backend
```

### 문제 4: API 호출 시 404 에러

**원인**: nginx가 `/api` 요청을 백엔드로 프록시하지 못함

**해결방법**:

```bash
# nginx 설정 확인
docker exec -it parttime-frontend cat /etc/nginx/conf.d/default.conf

# 컨테이너 재빌드
docker-compose build --no-cache frontend
docker-compose up -d
```

## 📋 최종 체크리스트

실제 배포 전 확인사항:

- [ ] 방화벽에서 3000, 15000 포트 열림
- [ ] docker-compose.yml에 FRONTEND_URL 설정됨
- [ ] Docker 컨테이너 재시작 완료
- [ ] 서버에서 localhost 접속 테스트 성공
- [ ] 외부에서 IP 접속 테스트 성공
- [ ] 브라우저 콘솔에서 `/api/health` 테스트 성공
- [ ] 알바생 추가/조회 기능 테스트 성공

## 🌐 IP 주소 변경 시

서버 IP가 변경되면:

### 1. .env 파일 수정
```bash
nano .env
```

```env
FRONTEND_URL=http://새로운IP:3000
```

### 2. 재배포
```bash
docker-compose restart backend
```

**주의**: `.env` 파일은 Git에 커밋되지 않으므로 각 서버에서 개별적으로 관리해야 합니다.

## 💡 도메인 사용 (선택사항)

IP 대신 도메인을 사용하려면:

### 1. 도메인 DNS 설정
- A 레코드: `parttime.example.com` → `YOUR_SERVER_IP`

### 2. .env 파일 수정
```env
FRONTEND_URL=http://parttime.example.com
```

### 3. 재시작
```bash
docker-compose restart backend
```

### 4. SSL 인증서 (HTTPS) 추가

도메인이 있다면 Let's Encrypt로 무료 SSL 인증서 발급 가능:

```bash
# Certbot 설치 (Rocky Linux 8)
sudo dnf install certbot python3-certbot-nginx

# 인증서 발급
sudo certbot --nginx -d parttime.example.com

# .env 파일도 https로 변경
nano .env
```

```env
FRONTEND_URL=https://parttime.example.com
```

---

## 📞 지원

문제가 해결되지 않으면:
- GitHub Issues: https://github.com/saehyen/PartTime-Management/issues
- TROUBLESHOOTING.md 참고
