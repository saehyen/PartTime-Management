import { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import EmployeeManager from './components/EmployeeManager';
import MonthlySummary from './components/MonthlySummary';
import Settings from './components/Settings';
import { useTheme } from './contexts/ThemeContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
  const { isDark, toggleTheme } = useTheme();
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [storeHours, setStoreHours] = useState({
    open: '07:00',
    close: '21:00'
  });

  // 알바생 목록 불러오기
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`);
      setEmployees(response.data);
      setLoading(false);
    } catch (error) {
      console.error('알바생 목록 불러오기 실패:', error);
      console.error('에러 상세:', error.response?.data || error.message);
      setLoading(false);
      alert(`알바생 목록을 불러오는데 실패했습니다.\n에러: ${error.response?.data?.error || error.message}`);
    }
  };

  // 스케줄 불러오기
  const fetchSchedules = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // 전달 마지막 주부터 다음달 첫 주까지 포함 (캘린더 뷰에 보이는 모든 날짜)
      const startDate = new Date(year, month - 1, 15); // 전달 중순
      const endDate = new Date(year, month + 2, 15); // 다다음달 중순

      const response = await axios.get(`${API_URL}/schedules`, {
        params: { 
          start: startDate.toISOString(), 
          end: endDate.toISOString() 
        }
      });
      setSchedules(response.data);
    } catch (error) {
      console.error('스케줄 불러오기 실패:', error);
      console.error('에러 상세:', error.response?.data || error.message);
    }
  };

  // 설정 불러오기
  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      setStoreHours({
        open: response.data.store_open_time || '07:00',
        close: response.data.store_close_time || '21:00'
      });
    } catch (error) {
      console.error('설정 불러오기 실패:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [currentDate]);

  // 알바생 추가
  const handleAddEmployee = async (employee) => {
    try {
      const response = await axios.post(`${API_URL}/employees`, employee);
      // UI에 즉시 추가
      setEmployees([...employees, response.data]);
      // alert 제거 - 자동으로 목록에 추가됨
    } catch (error) {
      console.error('알바생 추가 실패:', error);
      alert('알바생 추가에 실패했습니다.');
    }
  };

  // 알바생 수정
  const handleUpdateEmployee = async (id, employee) => {
    try {
      const response = await axios.put(`${API_URL}/employees/${id}`, employee);
      // UI에서 즉시 업데이트
      setEmployees(employees.map(e => e.id === id ? response.data : e));
      // 스케줄도 업데이트 (시급 변경 반영)
      fetchSchedules();
      // alert 제거
    } catch (error) {
      console.error('알바생 수정 실패:', error);
      alert('알바생 수정에 실패했습니다.');
    }
  };

  // 알바생 삭제
  const handleDeleteEmployee = async (id) => {
    if (!confirm('정말 삭제하시겠습니까? 관련된 모든 스케줄도 삭제됩니다.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/employees/${id}`);
      // UI에서 즉시 제거
      setEmployees(employees.filter(e => e.id !== id));
      // 스케줄도 새로고침
      fetchSchedules();
      // alert 제거
    } catch (error) {
      console.error('알바생 삭제 실패:', error);
      alert('알바생 삭제에 실패했습니다.');
    }
  };

  // 스케줄 추가
  const handleAddSchedule = async (schedule) => {
    try {
      const response = await axios.post(`${API_URL}/schedules`, schedule);
      // UI에 즉시 추가
      setSchedules([...schedules, response.data]);
    } catch (error) {
      console.error('스케줄 추가 실패:', error);
      alert('스케줄 추가에 실패했습니다.');
    }
  };

  // 스케줄 수정
  const handleUpdateSchedule = async (id, schedule) => {
    try {
      const response = await axios.put(`${API_URL}/schedules/${id}`, schedule);
      // UI에서 즉시 업데이트
      setSchedules(schedules.map(s => s.id === id ? response.data : s));
    } catch (error) {
      console.error('스케줄 수정 실패:', error);
      alert('스케줄 수정에 실패했습니다.');
    }
  };

  // 스케줄 삭제
  const handleDeleteSchedule = async (id) => {
    if (!confirm('이 스케줄을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/schedules/${id}`);
      // UI에서 즉시 제거
      setSchedules(schedules.filter(s => s.id !== id));
    } catch (error) {
      console.error('스케줄 삭제 실패:', error);
      alert('스케줄 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📅 알바생 스케줄 관리
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="설정"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="다크모드 토글"
            >
              {isDark ? (
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 캘린더 영역 */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <Calendar
                employees={employees}
                schedules={schedules}
                onAddSchedule={handleAddSchedule}
                onUpdateSchedule={handleUpdateSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onDateChange={setCurrentDate}
                storeHours={storeHours}
              />
            </div>
          </div>

          {/* 사이드바 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 알바생 관리 */}
            <EmployeeManager
              employees={employees}
              onAdd={handleAddEmployee}
              onUpdate={handleUpdateEmployee}
              onDelete={handleDeleteEmployee}
            />

            {/* 월별 정산 */}
            <MonthlySummary
              currentDate={currentDate}
              schedules={schedules}
            />
          </div>
        </div>
      </main>

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onSave={(settings) => {
            setStoreHours({
              open: settings.store_open_time,
              close: settings.store_close_time
            });
          }}
        />
      )}
    </div>
  );
}

export default App;
