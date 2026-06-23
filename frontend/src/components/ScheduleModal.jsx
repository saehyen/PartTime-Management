import { useState, useEffect } from 'react';

// 로컬 시간을 ISO 형식으로 변환 (타임존 오프셋 제거)
function toLocalISOString(date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, 16);
}

// ISO 문자열을 로컬 날짜로 변환
function fromISOString(isoString) {
  // 서버에서 받은 ISO 문자열을 로컬 시간으로 해석
  return isoString.slice(0, 16);
}

function ScheduleModal({ employees, schedule, selectInfo, onSave, onDelete, onClose, preSelectedEmployeeId }) {
  const [employeeId, setEmployeeId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (schedule) {
      // 수정 모드 - 서버 시간을 로컬 시간으로 표시
      setEmployeeId(schedule.employee_id);
      setStartTime(fromISOString(schedule.start_time));
      setEndTime(fromISOString(schedule.end_time));
    } else if (selectInfo) {
      // 추가 모드 - FullCalendar의 로컬 시간 사용
      // preSelectedEmployeeId가 있으면 사용, 없으면 첫 번째 직원
      setEmployeeId(preSelectedEmployeeId || employees[0]?.id || '');
      setStartTime(toLocalISOString(selectInfo.start));
      setEndTime(toLocalISOString(selectInfo.end));
    }
  }, [schedule, selectInfo, employees, preSelectedEmployeeId]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!employeeId || !startTime || !endTime) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      alert('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    // 로컬 시간을 그대로 ISO 형식으로 저장 (타임존 변환 없이)
    onSave({
      employee_id: parseInt(employeeId),
      start_time: startTime + ':00',
      end_time: endTime + ':00'
    });
  };

  const selectedEmployee = employees.find(e => e.id === parseInt(employeeId));
  const hours = startTime && endTime 
    ? ((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60)).toFixed(1)
    : 0;
  const estimatedPay = selectedEmployee 
    ? Math.round(hours * selectedEmployee.hourly_rate).toLocaleString()
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {schedule ? '스케줄 수정' : '스케줄 추가'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              알바생 선택
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">선택하세요</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} (시급: {emp.hourly_rate.toLocaleString()}원)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              시작 시간
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              종료 시간
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {selectedEmployee && hours > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <div className="text-sm space-y-1">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">근무 시간:</span> {hours}시간
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">시급:</span> {selectedEmployee.hourly_rate.toLocaleString()}원
                </p>
                <p className="text-blue-700 dark:text-blue-400 font-semibold">
                  <span className="font-medium">예상 급여:</span> {estimatedPay}원
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {schedule && (
              <button
                type="button"
                onClick={onDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ScheduleModal;
