import { useMemo } from 'react';

function DailyTimeline({ date, schedules, employees, onClose }) {
  // 선택된 날짜의 스케줄만 필터링
  const daySchedules = useMemo(() => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules
      .filter(s => s.start_time.startsWith(dateStr))
      .map(s => {
        const employee = employees.find(e => e.id === s.employee_id);
        return {
          ...s,
          employee_name: employee?.name || s.employee_name,
          color: employee?.color || s.color
        };
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [date, schedules, employees]);

  // 시간을 파싱하는 함수
  const parseTime = (timeString) => {
    const parts = timeString.split(/[T-: ]/);
    const hours = parseInt(parts[3] || 0);
    const minutes = parseInt(parts[4] || 0);
    return hours + minutes / 60;
  };

  // 시간을 표시 형식으로 변환
  const formatTime = (timeString) => {
    const parts = timeString.split(/[T-: ]/);
    const hours = String(parts[3] || '00').padStart(2, '0');
    const minutes = String(parts[4] || '00').padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 시간대 생성 (06:00 ~ 24:00)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 6; i <= 24; i++) {
      slots.push(i);
    }
    return slots;
  }, []);

  // 겹치는 스케줄 그룹화
  const groupedSchedules = useMemo(() => {
    if (daySchedules.length === 0) return [];

    const groups = [];
    let currentGroup = [daySchedules[0]];

    for (let i = 1; i < daySchedules.length; i++) {
      const current = daySchedules[i];
      const prevEnd = parseTime(currentGroup[currentGroup.length - 1].end_time);
      const currentStart = parseTime(current.start_time);

      // 겹치면 같은 그룹에 추가
      if (currentStart < prevEnd) {
        currentGroup.push(current);
      } else {
        groups.push(currentGroup);
        currentGroup = [current];
      }
    }
    groups.push(currentGroup);

    return groups;
  }, [daySchedules]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            📅 Daily Timeline
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'short'
            })}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 타임라인 */}
      <div className="flex-1 overflow-y-auto">
        {daySchedules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No schedules for this day</p>
          </div>
        ) : (
          <div className="relative">
            {/* 시간 눈금 */}
            <div className="space-y-0">
              {timeSlots.map(hour => (
                <div key={hour} className="relative h-12 border-b border-gray-200 dark:border-gray-700">
                  <span className="absolute -left-2 -top-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1">
                    {String(hour).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* 스케줄 막대 */}
            <div className="absolute top-0 left-12 right-0 h-full">
              {groupedSchedules.map((group, groupIdx) => (
                <div key={groupIdx} className="flex gap-1">
                  {group.map((schedule, idx) => {
                    const startTime = parseTime(schedule.start_time);
                    const endTime = parseTime(schedule.end_time);
                    const top = ((startTime - 6) * 48); // 48px per hour
                    const height = ((endTime - startTime) * 48);
                    const width = `${100 / group.length}%`;
                    const left = `${(idx / group.length) * 100}%`;

                    return (
                      <div
                        key={schedule.id}
                        className="absolute rounded shadow-sm border-2 border-white dark:border-gray-800 p-2 overflow-hidden"
                        style={{
                          backgroundColor: schedule.color,
                          top: `${top}px`,
                          height: `${height}px`,
                          left: left,
                          width: width,
                          minHeight: '40px'
                        }}
                      >
                        <div className="text-white text-xs font-semibold truncate">
                          {schedule.employee_name}
                        </div>
                        <div className="text-white text-xs opacity-90">
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </div>
                        <div className="text-white text-xs opacity-75">
                          {((endTime - startTime)).toFixed(1)}h
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 통계 */}
      {daySchedules.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Shifts</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {daySchedules.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {daySchedules.reduce((sum, s) => {
                  return sum + (parseTime(s.end_time) - parseTime(s.start_time));
                }, 0).toFixed(1)}h
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyTimeline;
