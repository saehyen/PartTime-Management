import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function EmployeeHistory({ employee, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchHistory();
  }, [employee.id, selectedMonth]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      // 선택된 월의 첫날과 마지막 날 계산
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      console.log('근무 기록 조회:', {
        employee: employee.name,
        month: selectedMonth,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });

      const response = await axios.get(`${API_URL}/schedules`, {
        params: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      });

      console.log('전체 스케줄:', response.data.length);

      // 해당 알바생의 스케줄만 필터링
      const employeeSchedules = response.data
        .filter(s => s.employee_id === employee.id)
        .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

      console.log('해당 알바생 스케줄:', employeeSchedules.length);

      setHistory(employeeSchedules);
    } catch (error) {
      console.error('근무 기록 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    // 타임존 없는 로컬 시간으로 파싱
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (dateString) => {
    // 타임존 없는 로컬 시간으로 파싱
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const calculateHours = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate - startDate;
    return (diff / (1000 * 60 * 60)).toFixed(1);
  };

  const calculatePay = (start, end) => {
    const hours = calculateHours(start, end);
    return Math.round(hours * employee.hourly_rate);
  };

  const totalHours = history.reduce((sum, item) => 
    sum + parseFloat(calculateHours(item.start_time, item.end_time)), 0
  );

  const totalPay = history.reduce((sum, item) => 
    sum + calculatePay(item.start_time, item.end_time), 0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: employee.color }}
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {employee.name} 근무 기록
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  시급: {employee.hourly_rate.toLocaleString()}원
                </p>
              </div>
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
          
          {/* 월 선택 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">조회 월:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 근무 횟수</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{history.length}회</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 근무 시간</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalHours.toFixed(1)}시간</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 급여</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalPay.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        {/* 근무 기록 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">로딩 중...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">근무 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(item.start_time)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTime(item.start_time)} ~ {formatTime(item.end_time)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {calculateHours(item.start_time, item.end_time)}시간
                      </p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        {calculatePay(item.start_time, item.end_time).toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmployeeHistory;
