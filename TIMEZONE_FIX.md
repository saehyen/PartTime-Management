# 타임존 문제 해결

## 문제 설명

### 발생했던 문제
- 오후 2시에 스케줄을 등록하면 새벽 5시(또는 11시)로 저장됨
- 주간 뷰에서 06:00~23:00만 표시되어 일부 스케줄이 안 보임
- 시간대 불일치로 인한 데이터 오류

### 원인
```javascript
// 문제가 있던 코드
new Date(startTime).toISOString()
// 브라우저 로컬 시간 → UTC로 변환 (9시간 차이)
// 예: 2024-01-01 14:00 (KST) → 2024-01-01T05:00:00.000Z (UTC)
```

한국은 UTC+9 시간대이므로:
- 오후 2시 (14:00 KST) → 오전 5시 (05:00 UTC)
- `.toISOString()`이 자동으로 UTC로 변환
- 캘린더는 06:00부터 표시하므로 05:00 스케줄은 안 보임

---

## 해결 방법

### 1. 시간 저장 방식 변경

**이전:**
```javascript
start_time: new Date(startTime).toISOString()
// "2024-01-01T05:00:00.000Z" (UTC)
```

**수정 후:**
```javascript
start_time: startTime + ':00'
// "2024-01-01T14:00:00" (로컬 시간, 타임존 없음)
```

### 2. 시간 표시 범위 확장

**이전:**
```javascript
slotMinTime="06:00:00"
slotMaxTime="24:00:00"
```

**수정 후:**
```javascript
slotMinTime="00:00:00"  // 자정부터
slotMaxTime="24:00:00"  // 자정까지
```

### 3. FullCalendar 타임존 설정

```javascript
timeZone="local"  // 로컬 타임존 사용
```

### 4. 드래그 & 드롭 시간 처리

```javascript
const formatLocalTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
};
```

---

## 테스트 방법

### 1. 스케줄 등록 테스트

```
1. 오후 2시 (14:00)에 스케줄 등록
2. ✅ 캘린더에 오후 2시에 표시되어야 함
3. ✅ 데이터베이스에도 14:00으로 저장되어야 함
```

### 2. 주간 뷰 테스트

```
1. 새벽 1시 (01:00)에 스케줄 등록
2. ✅ 주간 뷰에서 새벽 1시에 보여야 함
3. 자정 (00:00)에 스케줄 등록
4. ✅ 주간 뷰에서 자정에 보여야 함
```

### 3. 시간대 확인

```javascript
// 브라우저 콘솔에서 확인
console.log(new Date().getTimezoneOffset()); // -540 (한국, UTC+9)

// 저장된 스케줄 확인
fetch('/api/schedules')
  .then(r => r.json())
  .then(data => console.log(data[0].start_time));
// "2024-01-01T14:00:00" (타임존 없는 로컬 시간)
```

---

## 데이터 마이그레이션

기존 UTC 데이터를 로컬 시간으로 변환:

```sql
-- SQLite에서 UTC → KST 변환 (UTC+9)
UPDATE schedules 
SET 
  start_time = datetime(start_time, '+9 hours'),
  end_time = datetime(end_time, '+9 hours');
```

또는 백엔드에서:

```javascript
// 마이그레이션 스크립트
const schedules = db.prepare('SELECT * FROM schedules').all();

schedules.forEach(schedule => {
  const start = new Date(schedule.start_time);
  const end = new Date(schedule.end_time);
  
  // UTC에서 KST로 변환
  const kstStart = new Date(start.getTime() + (9 * 60 * 60 * 1000));
  const kstEnd = new Date(end.getTime() + (9 * 60 * 60 * 1000));
  
  const formatLocal = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };
  
  db.prepare('UPDATE schedules SET start_time = ?, end_time = ? WHERE id = ?')
    .run(formatLocal(kstStart), formatLocal(kstEnd), schedule.id);
});
```

---

## 주의사항

### 1. 시간 포맷

✅ 올바른 포맷:
```
"2024-01-01T14:00:00"
"2024-01-01 14:00:00"
```

❌ 피해야 할 포맷:
```
"2024-01-01T14:00:00.000Z"  // UTC 타임존
"2024-01-01T14:00:00+09:00" // 명시적 타임존
```

### 2. 서버 시간대

서버가 다른 시간대에 있어도 괜찮습니다:
- 클라이언트가 입력한 시간을 그대로 저장
- 타임존 변환 없이 문자열로 처리
- 표시할 때도 그대로 표시

### 3. 다국적 서비스로 확장 시

나중에 다국적 서비스로 확장한다면:
1. 데이터베이스에 타임존 정보 추가
2. 사용자별 타임존 설정 저장
3. 표시 시에만 타임존 변환

---

## 디버깅 팁

### 시간이 여전히 안 맞는다면

```javascript
// 1. 브라우저 콘솔에서 확인
const testDate = new Date('2024-01-01T14:00:00');
console.log('ISO:', testDate.toISOString());
console.log('Local:', testDate.toLocaleString('ko-KR'));

// 2. API 응답 확인
fetch('/api/schedules')
  .then(r => r.json())
  .then(data => {
    console.log('Raw data:', data[0]);
    console.log('Start time:', data[0].start_time);
  });

// 3. FullCalendar 이벤트 확인
const calendarApi = calendarRef.current.getApi();
const events = calendarApi.getEvents();
console.log('Events:', events[0]);
```

---

## 관련 파일

수정된 파일:
- `frontend/src/components/ScheduleModal.jsx`
- `frontend/src/components/Calendar.jsx`
- `frontend/src/components/EmployeeHistory.jsx`

---

## 참고 자료

- [FullCalendar timeZone 문서](https://fullcalendar.io/docs/timeZone)
- [JavaScript Date and Time](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [ISO 8601 표준](https://en.wikipedia.org/wiki/ISO_8601)
