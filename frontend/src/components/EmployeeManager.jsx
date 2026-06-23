import { useState } from 'react';

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

function EmployeeManager({ employees, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    hourly_rate: '',
    color: COLORS[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.hourly_rate) {
      alert('이름과 시급을 입력해주세요.');
      return;
    }

    const data = {
      name: formData.name.trim(),
      hourly_rate: parseInt(formData.hourly_rate),
      color: formData.color
    };

    if (editingId) {
      onUpdate(editingId, data);
      setEditingId(null);
    } else {
      onAdd(data);
    }

    setFormData({ name: '', hourly_rate: '', color: COLORS[0] });
    setShowForm(false);
  };

  const handleEdit = (employee) => {
    setFormData({
      name: employee.name,
      hourly_rate: employee.hourly_rate.toString(),
      color: employee.color
    });
    setEditingId(employee.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ name: '', hourly_rate: '', color: COLORS[0] });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">👤 알바생 관리</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            + 추가
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-md space-y-3">
          <div>
            <input
              type="text"
              placeholder="이름"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="시급 (원)"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">색상</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingId ? '수정' : '추가'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {employees.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            알바생을 추가해주세요
          </p>
        ) : (
          employees.map(employee => (
            <div
              key={employee.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: employee.color }}
                />
                <div>
                  <p className="font-medium text-gray-900">{employee.name}</p>
                  <p className="text-sm text-gray-600">
                    {employee.hourly_rate.toLocaleString()}원/시간
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(employee)}
                  className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => onDelete(employee.id)}
                  className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EmployeeManager;
