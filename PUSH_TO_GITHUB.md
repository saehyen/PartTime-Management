# GitHub에 푸시하기

## 방법 1: 명령어로 푸시

```bash
cd c:\kiro\parttime-management
git push -u origin main
```

GitHub 인증이 필요할 수 있습니다. Personal Access Token을 사용하세요.

## 방법 2: GitHub Desktop 사용

1. GitHub Desktop 열기
2. "Add" > "Add Existing Repository" 클릭
3. `c:\kiro\parttime-management` 경로 선택
4. "Publish repository" 클릭

## Personal Access Token 생성 (필요한 경우)

1. GitHub 로그인
2. Settings > Developer settings > Personal access tokens > Tokens (classic)
3. "Generate new token (classic)" 클릭
4. 권한 선택: `repo` (전체 선택)
5. 생성된 토큰 복사
6. Push 시 비밀번호 대신 토큰 입력

---

푸시 완료 후 https://github.com/saehyen/PartTime-Management 에서 확인하세요!
