/**
 * 동일 알바생의 연속된 스케줄을 병합하는 함수
 * 예: 12:00-13:00, 13:00-14:00 → 12:00-14:00 (1개)
 */
export function mergeConsecutiveSchedules(schedules) {
  if (!schedules || schedules.length === 0) return [];

  // 알바생별, 날짜별로 그룹화
  const grouped = {};
  
  schedules.forEach(schedule => {
    const date = schedule.start_time.split('T')[0];
    const key = `${schedule.employee_id}_${date}`;
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(schedule);
  });

  // 각 그룹별로 시작 시간 순 정렬 후 병합
  const merged = [];
  
  Object.values(grouped).forEach(group => {
    // 시작 시간 순으로 정렬
    group.sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    let current = { ...group[0] };
    
    for (let i = 1; i < group.length; i++) {
      const next = group[i];
      
      // 현재 종료 시간과 다음 시작 시간이 같으면 병합
      if (current.end_time === next.start_time) {
        current.end_time = next.end_time;
        // ID는 배열로 저장 (나중에 삭제할 때 필요)
        if (!current.merged_ids) {
          current.merged_ids = [current.id];
        }
        current.merged_ids.push(next.id);
      } else {
        // 연속되지 않으면 현재를 저장하고 새로 시작
        merged.push(current);
        current = { ...next };
      }
    }
    
    merged.push(current);
  });

  return merged;
}

/**
 * 시간 문자열 파싱
 */
export function parseTime(timeString) {
  const parts = timeString.split(/[T\-: ]/);
  const hours = parseInt(parts[3] || 0);
  const minutes = parseInt(parts[4] || 0);
  return hours + minutes / 60;
}

/**
 * 시간 문자열 포맷팅
 */
export function formatTime(timeString) {
  const parts = timeString.split(/[T\-: ]/);
  const hours = String(parts[3] || '00').padStart(2, '0');
  const minutes = String(parts[4] || '00').padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 근무 시간 계산 (시간 단위)
 */
export function calculateHours(start, end) {
  const startParts = start.split(/[T\-: ]/);
  const endParts = end.split(/[T\-: ]/);
  
  const startDate = new Date(
    parseInt(startParts[0]),
    parseInt(startParts[1]) - 1,
    parseInt(startParts[2]),
    parseInt(startParts[3] || 0),
    parseInt(startParts[4] || 0),
    parseInt(startParts[5] || 0)
  );
  
  const endDate = new Date(
    parseInt(endParts[0]),
    parseInt(endParts[1]) - 1,
    parseInt(endParts[2]),
    parseInt(endParts[3] || 0),
    parseInt(endParts[4] || 0),
    parseInt(endParts[5] || 0)
  );
  
  const diff = endDate - startDate;
  return diff / (1000 * 60 * 60);
}
