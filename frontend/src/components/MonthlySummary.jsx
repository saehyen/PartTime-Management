import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function MonthlySummary({ currentDate }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [currentDate]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const response = await axios.get(`${API_URL}/statistics/monthly`, {
        params: { year, month }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('통계 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 월별 정산</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!summary || summary.employees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 월별 정산</h2>
        <p className="text-sm text-gray-500 text-center py-4">
          데이터가 없습니다
        </p>
      </div>
    );
  }

  const { year, month } = summary.period;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">💰 월별 정산</h2>
      <p className="text-sm text-gray-600 mb-4">
        {year}년 {month}월
      </p>

      <div className="space-y-3 mb-4">
        {summary.employees.map(emp => (
          <div
            key={emp.id}
            className="p-3 bg-gray-50 rounded-md"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: emp.color }}
              />
              <span className="font-medium text-gray-900">{emp.name}</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>근무 횟수</span>
                <span className="font-medium">{emp.total_shifts || 0}회</span>
              </div>
              <div className="flex justify-between">
                <span>총 근무 시간</span>
                <span className="font-medium">
                  {(emp.total_hours || 0).toFixed(1)}시간
                </span>
              </div>
              <div className="flex justify-between">
                <span>시급</span>
                <span className="font-medium">
                  {emp.hourly_rate.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200">
                <span className="font-semibold">급여</span>
                <span className="font-semibold text-blue-600">
                  {(emp.total_pay || 0).toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t-2 border-gray-300">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">총 지출</span>
          <span className="text-xl font-bold text-red-600">
            {summary.total_pay.toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  );
}

export default MonthlySummary;
