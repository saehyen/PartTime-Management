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
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isQuickAdd, setIsQuickAdd] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState('');
  const [quickAddStartTime, setQuickAddStartTime] = useState('09:00');
  const [quickAddEndTime, setQuickAddEndTime] = useState('18:00');

  useEffect(() => {
    if (schedule) {
      // 수정 모드 - 단일 직원만 (기존 동작 유지)
      setSelectedEmployeeIds([schedule.employee_id]);
      setStartTime(fromISOString(schedule.start_time));
      setEndTime(fromISOString(schedule.end_time));
      setIsQuickAdd(false);
    } else if (selectInfo) {
      // 추가 모드 - preSelectedEmployeeId가 있으면 사용
      if (preSelectedEmployeeId) {
        setSelectedEmployeeIds([preSelectedEmployeeId]);
      } else {
        setSelectedEmployeeIds([]);
      }
      setStartTime(toLocalISOString(selectInfo.start));
      setEndTime(toLocalISOString(selectInfo.end));
      
      // 빠른 추가 모드 기본값 설정
      const startDate = new Date(selectInfo.start);
      setQuickAddDate(startDate.toISOString().split('T')[0]);
      setIsQuickAdd(false);
    }
  }, [schedule, selectInfo, employees, preSelectedEmployeeId]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const toggleEmployee = (empId) => {
    if (schedule) return; // 수정 모드에서는 직원 변경 불가
    
    setSelectedEmployeeIds(prev => {
      if (prev.includes(empId)) {
        return prev.filter(id => id !== empId);
      } else {
        return [...prev, empId];
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedEmployeeIds.length === 0) {
      alert('알바생을 선택해주세요.');
      return;
    }

    let finalStartTime, finalEndTime;

    if (isQuickAdd) {
      // 빠른 추가 모드: 날짜 + 시간
      if (!quickAddDate || !quickAddStartTime || !quickAddEndTime) {
        alert('날짜와 시간을 모두 입력해주세요.');
        return;
      }
      finalStartTime = `${quickAddDate}T${quickAddStartTime}:00`;
      finalEndTime = `${quickAddDate}T${quickAddEndTime}:00`;
    } else {
      // 일반 모드: datetime-local
      if (!startTime || !endTime) {
        alert('시작 시간과 종료 시간을 입력해주세요.');
        return;
      }
      finalStartTime = startTime + ':00';
      finalEndTime = endTime + ':00';
    }

    if (new Date(finalStartTime) >= new Date(finalEndTime)) {
      alert('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    const scheduleData = {
      start_time: finalStartTime,
      end_time: finalEndTime
    };

    if (schedule) {
      // 수정 모드 - 기존과 동일
      onSave({
        employee_id: selectedEmployeeIds[0],
        ...scheduleData
      });
    } else {
      // 추가 모드 - 여러 명 동시 추가
      selectedEmployeeIds.forEach(empId => {
        onSave({
          employee_id: empId,
          ...scheduleData
        });
      });
    }
  };

  const selectedEmployee = employees.find(e => e.id === parseInt(selectedEmployeeIds[0]));
  
  // 근무 시간 계산
  const hours = (() => {
    if (isQuickAdd && quickAddStartTime && quickAddEndTime) {
      const [startH, startM] = quickAddStartTime.split(':').map(Number);
      const [endH, endM] = quickAddEndTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return ((endMinutes - startMinutes) / 60).toFixed(1);
    } else if (startTime && endTime) {
      return ((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60)).toFixed(1);
    }
    return 0;
  })();
  
  // 여러 명 선택 시 총 비용 계산
  const totalPay = selectedEmployeeIds.reduce((sum, empId) => {
    const emp = employees.find(e => e.id === empId);
    return sum + (emp ? Math.round(hours * emp.hourly_rate) : 0);
  }, 0);

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
              {schedule ? '알바생' : '알바생 선택 (여러 명 가능)'}
            </label>
            {schedule ? (
              // 수정 모드 - 단일 선택
              <select
                value={selectedEmployeeIds[0] || ''}
                onChange={(e) => setSelectedEmployeeIds([parseInt(e.target.value)])}
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
            ) : (
              // 추가 모드 - 다중 선택
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                {employees.map(emp => (
                  <label
                    key={emp.id}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                      selectedEmployeeIds.includes(emp.id)
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployeeIds.includes(emp.id)}
                      onChange={() => toggleEmployee(emp.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: emp.color }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{emp.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {emp.hourly_rate.toLocaleString()}원/시간
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {!schedule && (
            <div className="flex items-center gap-2 py-2 border-t border-gray-200 dark:border-gray-600">
              <input
                type="checkbox"
                id="quickAdd"
                checked={isQuickAdd}
                onChange={(e) => setIsQuickAdd(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="quickAdd" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                🚀 빠른 추가 모드 (하루 단위)
              </label>
            </div>
          )}

          {isQuickAdd ? (
            // 빠른 추가 모드: 날짜 + 시간 범위
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  날짜
                </label>
                <input
                  type="date"
                  value={quickAddDate}
                  onChange={(e) => setQuickAddDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={quickAddStartTime}
                    onChange={(e) => setQuickAddStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={quickAddEndTime}
                    onChange={(e) => setQuickAddEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            // 일반 모드: datetime-local
            <>
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
            </>
          )}

          {selectedEmployeeIds.length > 0 && hours > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <div className="text-sm space-y-2">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">근무 시간:</span> {hours}시간
                </p>
                {selectedEmployeeIds.length === 1 ? (
                  // 단일 선택
                  <>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">시급:</span> {selectedEmployee?.hourly_rate.toLocaleString()}원
                    </p>
                    <p className="text-blue-700 dark:text-blue-400 font-semibold">
                      <span className="font-medium">예상 급여:</span> {totalPay.toLocaleString()}원
                    </p>
                  </>
                ) : (
                  // 다중 선택
                  <>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">선택된 알바생:</span> {selectedEmployeeIds.length}명
                    </p>
                    <div className="space-y-1 mt-2">
                      {selectedEmployeeIds.map(empId => {
                        const emp = employees.find(e => e.id === empId);
                        const pay = Math.round(hours * emp.hourly_rate);
                        return (
                          <div key={empId} className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                              {emp.name} ({emp.hourly_rate.toLocaleString()}원/h)
                            </span>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {pay.toLocaleString()}원
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-blue-300 dark:border-blue-700 pt-2 mt-2">
                      <p className="text-blue-700 dark:text-blue-400 font-semibold">
                        <span className="font-medium">총 급여:</span> {totalPay.toLocaleString()}원
                      </p>
                    </div>
                  </>
                )}
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
