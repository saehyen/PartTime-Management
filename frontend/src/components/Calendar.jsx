import { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ScheduleModal from './ScheduleModal';

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
    onUpdateSchedule(event.id, {
      employee_id: event.extendedProps.employeeId,
      start_time: event.start.toISOString(),
      end_time: event.end.toISOString()
    });
  };

  // 이벤트 리사이즈
  const handleEventResize = (resizeInfo) => {
    const event = resizeInfo.event;
    onUpdateSchedule(event.id, {
      employee_id: event.extendedProps.employeeId,
      start_time: event.start.toISOString(),
      end_time: event.end.toISOString()
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
        buttonText={{
          today: '오늘',
          month: '월',
          week: '주',
          day: '일'
        }}
        height="auto"
        slotMinTime="06:00:00"
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
