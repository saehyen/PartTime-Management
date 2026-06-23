import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ScheduleModal from './ScheduleModal';
import DayViewMatrix from './DayViewMatrix';
import { mergeConsecutiveSchedules } from '../utils/scheduleUtils';

// 한국 공휴일 데이터 (2024-2026)
const HOLIDAYS = {
  '2024-01-01': '신정',
  '2024-02-09': '설날 전날',
  '2024-02-10': '설날',
  '2024-02-11': '설날 다음날',
  '2024-02-12': '대체공휴일',
  '2024-03-01': '삼일절',
  '2024-04-10': '국회의원선거',
  '2024-05-05': '어린이날',
  '2024-05-06': '대체공휴일',
  '2024-05-15': '부처님오신날',
  '2024-06-06': '현충일',
  '2024-08-15': '광복절',
  '2024-09-16': '추석 전날',
  '2024-09-17': '추석',
  '2024-09-18': '추석 다음날',
  '2024-10-03': '개천절',
  '2024-10-09': '한글날',
  '2024-12-25': '크리스마스',
  '2025-01-01': '신정',
  '2025-01-28': '설날 전날',
  '2025-01-29': '설날',
  '2025-01-30': '설날 다음날',
  '2025-03-01': '삼일절',
  '2025-03-03': '대체공휴일',
  '2025-05-05': '어린이날',
  '2025-05-06': '부처님오신날',
  '2025-06-06': '현충일',
  '2025-08-15': '광복절',
  '2025-10-03': '개천절',
  '2025-10-05': '추석 전날',
  '2025-10-06': '추석',
  '2025-10-07': '추석 다음날',
  '2025-10-08': '대체공휴일',
  '2025-10-09': '한글날',
  '2025-12-25': '크리스마스',
  '2026-01-01': '신정',
  '2026-02-16': '설날 전날',
  '2026-02-17': '설날',
  '2026-02-18': '설날 다음날',
  '2026-03-01': '삼일절',
  '2026-03-02': '대체공휴일',
  '2026-05-05': '어린이날',
  '2026-05-25': '부처님오신날',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-09-24': '추석 전날',
  '2026-09-25': '추석',
  '2026-09-26': '추석 다음날',
  '2026-10-03': '개천절',
  '2026-10-05': '대체공휴일',
  '2026-10-09': '한글날',
  '2026-12-25': '크리스마스',
};

function Calendar({ 
  employees, 
  schedules, 
  onAddSchedule, 
  onUpdateSchedule, 
  onDeleteSchedule,
  onDateChange,
  storeHours,
  selectedEmployeeId,
  onDateClick
}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [currentView, setCurrentView] = useState('timeGridWeek');
  const [currentDate, setCurrentDate] = useState(new Date());
  const calendarRef = useRef(null);

  // 공휴일을 캘린더에 표시
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      // 공휴일 CSS 클래스 적용
      Object.keys(HOLIDAYS).forEach(date => {
        const dayEl = calendarApi.el.querySelector(`[data-date="${date}"]`);
        if (dayEl) {
          dayEl.classList.add('holiday');
          // 공휴일 제목 툴팁 추가
          dayEl.setAttribute('title', HOLIDAYS[date]);
        }
      });
    }
  }, [schedules]);

  // 스케줄 데이터를 FullCalendar 이벤트 형식으로 변환
  const events = (() => {
    // 연속된 스케줄 병합
    const mergedSchedules = mergeConsecutiveSchedules(schedules);
    
    return mergedSchedules.map(schedule => {
      // 로컬 시간 문자열을 Date 객체로 변환 (타임존 변환 방지)
      const parseLocalTime = (timeString) => {
        // "2024-06-23T10:00:00" 형식을 파싱
        const parts = timeString.split(/[T\-: ]/);
        return new Date(
          parseInt(parts[0]), // year
          parseInt(parts[1]) - 1, // month (0-indexed)
          parseInt(parts[2]), // day
          parseInt(parts[3] || 0), // hour
          parseInt(parts[4] || 0), // minute
          parseInt(parts[5] || 0)  // second
        );
      };

      return {
        id: schedule.id,
        title: `${schedule.employee_name}`,
        start: parseLocalTime(schedule.start_time),
        end: parseLocalTime(schedule.end_time),
        backgroundColor: schedule.color,
        borderColor: schedule.color,
        extendedProps: {
          employeeId: schedule.employee_id,
          employeeName: schedule.employee_name,
          hourlyRate: schedule.hourly_rate,
          mergedIds: schedule.merged_ids // 병합된 ID들
        }
      };
    });
  })();

  // 날짜 범위 선택 (드래그)
  const handleDateSelect = (selectInfo) => {
    if (employees.length === 0) {
      alert('먼저 알바생을 추가해주세요.');
      return;
    }

    setSelectedInfo(selectInfo);
    setSelectedSchedule(null);
    setShowModal(true);
  };

  // 이벤트 클릭
  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    
    // Date 객체를 로컬 시간 문자열로 변환
    const formatLocalDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };
    
    setSelectedSchedule({
      id: event.id,
      employee_id: event.extendedProps.employeeId,
      start_time: formatLocalDateTime(event.start),
      end_time: formatLocalDateTime(event.end)
    });
    setSelectedInfo(null);
    setShowModal(true);
  };

  // 이벤트 드래그 & 드롭
  const handleEventDrop = (dropInfo) => {
    const event = dropInfo.event;
    
    // 로컬 시간을 ISO 형식으로 저장
    const formatLocalTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:00`;
    };

    onUpdateSchedule(event.id, {
      employee_id: event.extendedProps.employeeId,
      start_time: formatLocalTime(event.start),
      end_time: formatLocalTime(event.end)
    });
  };

  // 이벤트 리사이즈
  const handleEventResize = (resizeInfo) => {
    const event = resizeInfo.event;
    
    // 로컬 시간을 ISO 형식으로 저장
    const formatLocalTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:00`;
    };

    onUpdateSchedule(event.id, {
      employee_id: event.extendedProps.employeeId,
      start_time: formatLocalTime(event.start),
      end_time: formatLocalTime(event.end)
    });
  };

  // 모달에서 저장
  const handleSaveSchedule = (scheduleData) => {
    if (selectedSchedule) {
      // 수정
      onUpdateSchedule(selectedSchedule.id, scheduleData);
    } else {
      // 추가
      onAddSchedule(scheduleData);
    }
    setShowModal(false);
  };

  // 모달에서 삭제
  const handleDeleteSchedule = () => {
    if (selectedSchedule) {
      onDeleteSchedule(selectedSchedule.id);
      setShowModal(false);
    }
  };

  // 날짜 변경 감지
  const handleDatesSet = (dateInfo) => {
    onDateChange(dateInfo.start);
    setCurrentDate(dateInfo.start);
    // 현재 뷰 타입 저장
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      setCurrentView(calendarApi.view.type);
    }
  };

  // 날짜 셀 클릭 핸들러
  const handleDateClick = (info) => {
    // 월별 뷰에서만 날짜 클릭 시 타임라인 표시
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && calendarApi.view.type === 'dayGridMonth') {
      if (onDateClick) {
        onDateClick(info.date);
      }
    }
  };

  // 월별 뷰에서 이벤트 내용 커스터마이즈
  const renderEventContent = (eventInfo) => {
    const { event, view } = eventInfo;
    
    // 월별 뷰에서만 커스터마이즈
    if (view.type === 'dayGridMonth') {
      const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      return (
        <div className="text-xs truncate px-1">
          <span className="font-semibold">
            {formatTime(event.start)}-{formatTime(event.end)}
          </span>
          {' '}
          <span>{event.title}</span>
        </div>
      );
    }

    // 주간/일별 뷰는 기본 렌더링
    return null;
  };

  return (
    <>
      {selectedEmployeeId && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 border-blue-600"
              style={{ backgroundColor: employees.find(e => e.id === selectedEmployeeId)?.color }}
            />
            <div>
              <p className="font-semibold text-blue-700 dark:text-blue-300">
                선택된 알바생: {employees.find(e => e.id === selectedEmployeeId)?.name}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                캘린더에서 드래그하여 스케줄을 추가하세요
              </p>
            </div>
          </div>
        </div>
      )}
      
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        locale="en"
        timeZone="local"
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day'
        }}
        firstDay={1}
        height="auto"
        slotMinTime={storeHours?.open || '00:00:00'}
        slotMaxTime={storeHours?.close || '24:00:00'}
        allDaySlot={false}
        selectable={true}
        selectMirror={true}
        editable={true}
        eventResizableFromStart={true}
        events={events}
        select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          eventContent={renderEventContent}
          eventOrder="start,-duration,title"
          slotDuration="00:30:00"
          snapDuration="00:15:00"
          dayHeaderFormat={{
            weekday: 'short',
            day: 'numeric'
          }}
          dayCellDidMount={(info) => {
            const dateStr = info.date.toISOString().split('T')[0];
            if (HOLIDAYS[dateStr]) {
              info.el.classList.add('holiday');
              info.el.setAttribute('title', HOLIDAYS[dateStr]);
            }
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        datesSet={handleDatesSet}
        dateClick={handleDateClick}
        eventContent={renderEventContent}
        eventOrder="start,-duration,title"
        slotDuration="00:30:00"
        snapDuration="00:15:00"
        dayHeaderFormat={{
          weekday: 'short',
          day: 'numeric'
        }}
        dayCellDidMount={(info) => {
          const dateStr = info.date.toISOString().split('T')[0];
          if (HOLIDAYS[dateStr]) {
            info.el.classList.add('holiday');
            info.el.setAttribute('title', HOLIDAYS[dateStr]);
          }
        }}
      />

      {/* Day 뷰일 때 매트릭스를 추가로 표시 */}
      {currentView === 'timeGridDay' && (
        <div className="mt-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              📊 Daily Schedule Matrix View
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Overview of all employees working today
            </p>
          </div>
          <DayViewMatrix
            date={currentDate}
            schedules={schedules}
            employees={employees}
          />
        </div>
      )}

      {showModal && (
        <ScheduleModal
          employees={employees}
          schedule={selectedSchedule}
          selectInfo={selectedInfo}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteSchedule}
          onClose={() => setShowModal(false)}
          preSelectedEmployeeId={selectedEmployeeId}
        />
      )}
    </>
  );
}

export default Calendar;
