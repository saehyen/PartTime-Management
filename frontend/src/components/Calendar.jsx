import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ScheduleModal from './ScheduleModal';

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
  onDateChange 
}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState(null);
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
  const events = schedules.map(schedule => ({
    id: schedule.id,
    title: `${schedule.employee_name}`,
    start: schedule.start_time,
    end: schedule.end_time,
    backgroundColor: schedule.color,
    borderColor: schedule.color,
    extendedProps: {
      employeeId: schedule.employee_id,
      employeeName: schedule.employee_name,
      hourlyRate: schedule.hourly_rate
    }
  }));

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
    setSelectedSchedule({
      id: event.id,
      employee_id: event.extendedProps.employeeId,
      start_time: event.start.toISOString(),
      end_time: event.end.toISOString()
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
  };

  return (
    <>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        locale="ko"
        timeZone="local"
        buttonText={{
          today: '오늘',
          month: '월',
          week: '주',
          day: '일'
        }}
        firstDay={1}
        height="auto"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
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

      {showModal && (
        <ScheduleModal
          employees={employees}
          schedule={selectedSchedule}
          selectInfo={selectedInfo}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteSchedule}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default Calendar;
