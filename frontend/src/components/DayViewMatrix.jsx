import { useMemo } from 'react';
import { mergeConsecutiveSchedules, parseTime, formatTime } from '../utils/scheduleUtils';

function DayViewMatrix({ date, schedules, employees }) {
  // date가 없으면 오늘 날짜 사용
  const selectedDate = useMemo(() => {
    return date instanceof Date ? date : new Date();
  }, [date]);

  // 선택된 날짜의 스케줄 필터링 및 병합
  const daySchedules = useMemo(() => {
    if (!schedules || schedules.length === 0) return [];
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    const filtered = schedules.filter(s => s.start_time && s.start_time.startsWith(dateStr));
    return mergeConsecutiveSchedules(filtered);
  }, [selectedDate, schedules]);

  // 시간대 생성 (06:00 ~ 24:00, 1시간 단위)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 6; i <= 23; i++) {
      slots.push(i);
    }
    return slots;
  }, []);

  // 각 알바생별 스케줄 매핑
  const employeeSchedules = useMemo(() => {
    const map = {};
    if (!employees || employees.length === 0) return map;
    
    employees.forEach(emp => {
      map[emp.id] = daySchedules.filter(s => s.employee_id === emp.id);
    });
    return map;
  }, [employees, daySchedules]);

  // 특정 시간대에 근무 중인지 확인
  const isWorking = (employeeId, hour) => {
    const schedules = employeeSchedules[employeeId] || [];
    return schedules.some(s => {
      const start = parseTime(s.start_time);
      const end = parseTime(s.end_time);
      return start <= hour && hour < end;
    });
  };

  // 시간대의 스케줄 정보 가져오기
  const getScheduleInfo = (employeeId, hour) => {
    const schedules = employeeSchedules[employeeId] || [];
    return schedules.find(s => {
      const start = parseTime(s.start_time);
      const end = parseTime(s.end_time);
      return start <= hour && hour < end;
    });
  };

  // 연속된 셀인지 확인 (시작 셀인지)
  const isStartCell = (employeeId, hour) => {
    const schedule = getScheduleInfo(employeeId, hour);
    if (!schedule) return false;
    const start = parseTime(schedule.start_time);
    return Math.floor(start) === hour;
  };

  // 연속된 셀의 길이 계산
  const getColSpan = (employeeId, hour) => {
    const schedule = getScheduleInfo(employeeId, hour);
    if (!schedule) return 1;
    
    const start = parseTime(schedule.start_time);
    const end = parseTime(schedule.end_time);
    
    if (Math.floor(start) !== hour) return 0; // 시작 셀이 아니면 스킵
    
    return Math.ceil(end) - Math.floor(start);
  };

  return (
    <div className="overflow-x-auto">
      {!employees || employees.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No employees found</p>
        </div>
      ) : (
        <>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left sticky left-0 bg-gray-100 dark:bg-gray-700 z-10 min-w-[120px]">
                  Employee
                </th>
                {timeSlots.map(hour => (
                  <th key={hour} className="border border-gray-300 dark:border-gray-600 p-2 text-center min-w-[60px]">
                    {String(hour).padStart(2, '0')}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
          {employees.map(employee => (
            <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="border border-gray-300 dark:border-gray-600 p-2 sticky left-0 bg-white dark:bg-gray-800 z-10">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: employee.color }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {employee.name}
                  </span>
                </div>
              </td>
              {timeSlots.map(hour => {
                const working = isWorking(employee.id, hour);
                const schedule = getScheduleInfo(employee.id, hour);
                const isStart = isStartCell(employee.id, hour);
                const colSpan = getColSpan(employee.id, hour);

                if (working && !isStart) {
                  return null; // 연속된 셀은 colspan으로 처리
                }

                return (
                  <td
                    key={hour}
                    colSpan={isStart ? colSpan : 1}
                    className={`border border-gray-300 dark:border-gray-600 p-1 text-center transition-colors ${
                      working
                        ? 'font-semibold text-white'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}
                    style={{
                      backgroundColor: working ? employee.color : undefined,
                      opacity: working ? 0.9 : 1
                    }}
                  >
                    {working && schedule && (
                      <div className="flex flex-col items-center justify-center text-xs">
                        <div className="font-bold">
                          {formatTime(schedule.start_time)}
                        </div>
                        <div className="text-[10px] opacity-90">~</div>
                        <div className="font-bold">
                          {formatTime(schedule.end_time)}
                        </div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 요약 통계 */}
      {daySchedules.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Shifts</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {daySchedules.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Employees Working</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {new Set(daySchedules.map(s => s.employee_id)).size}
              </p>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default DayViewMatrix;
