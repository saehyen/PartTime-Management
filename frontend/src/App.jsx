import { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import EmployeeManager from './components/EmployeeManager';
import MonthlySummary from './components/MonthlySummary';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // 알바생 목록 불러오기
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('알바생 목록 불러오기 실패:', error);
      alert('알바생 목록을 불러오는데 실패했습니다.');
    }
  };

  // 스케줄 불러오기
  const fetchSchedules = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const response = await axios.get(`${API_URL}/schedules`, {
        params: { start: startDate, end: endDate }
      });
      setSchedules(response.data);
    } catch (error) {
      console.error('스케줄 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchSchedules();
    }
  }, [currentDate, employees]);

  // 알바생 추가
  const handleAddEmployee = async (employee) => {
    try {
      const response = await axios.post(`${API_URL}/employees`, employee);
      setEmployees([...employees, response.data]);
      alert('알바생이 추가되었습니다.');
    } catch (error) {
      console.error('알바생 추가 실패:', error);
      alert('알바생 추가에 실패했습니다.');
    }
  };

  // 알바생 수정
  const handleUpdateEmployee = async (id, employee) => {
    try {
      const response = await axios.put(`${API_URL}/employees/${id}`, employee);
      setEmployees(employees.map(e => e.id === id ? response.data : e));
      fetchSchedules(); // 스케줄 새로고침 (시급 변경 반영)
      alert('알바생 정보가 수정되었습니다.');
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
      setEmployees(employees.filter(e => e.id !== id));
      fetchSchedules(); // 스케줄 새로고침
      alert('알바생이 삭제되었습니다.');
    } catch (error) {
      console.error('알바생 삭제 실패:', error);
      alert('알바생 삭제에 실패했습니다.');
    }
  };

  // 스케줄 추가
  const handleAddSchedule = async (schedule) => {
    try {
      const response = await axios.post(`${API_URL}/schedules`, schedule);
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
      setSchedules(schedules.filter(s => s.id !== id));
    } catch (error) {
      console.error('스케줄 삭제 실패:', error);
      alert('스케줄 삭제에 실패했습니다.');
    }
  };

  if (loading && employees.length === 0) {
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
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            📅 알바생 스케줄 관리
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 캘린더 영역 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <Calendar
                employees={employees}
                schedules={schedules}
                onAddSchedule={handleAddSchedule}
                onUpdateSchedule={handleUpdateSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onDateChange={setCurrentDate}
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
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
