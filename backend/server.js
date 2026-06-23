require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');

// 한국 시간(KST) 타임존 설정
process.env.TZ = 'Asia/Seoul';

const app = express();
const PORT = process.env.PORT || 15000;

// 미들웨어
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== 알바생 관리 API ==========

// 모든 알바생 조회
app.get('/api/employees', (req, res) => {
  try {
    console.log('알바생 목록 조회 요청');
    const employees = db.prepare('SELECT * FROM employees ORDER BY name').all();
    console.log(`알바생 ${employees.length}명 조회 완료`);
    res.json(employees);
  } catch (error) {
    console.error('알바생 조회 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 알바생 추가
app.post('/api/employees', (req, res) => {
  try {
    const { name, hourly_rate, color } = req.body;
    
    if (!name || !hourly_rate) {
      return res.status(400).json({ error: '이름과 시급은 필수입니다.' });
    }

    const stmt = db.prepare('INSERT INTO employees (name, hourly_rate, color) VALUES (?, ?, ?)');
    const result = stmt.run(name, hourly_rate, color || '#3b82f6');
    
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 알바생 수정
app.put('/api/employees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, hourly_rate, color } = req.body;

    const stmt = db.prepare('UPDATE employees SET name = ?, hourly_rate = ?, color = ? WHERE id = ?');
    stmt.run(name, hourly_rate, color, id);

    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 알바생 삭제
app.delete('/api/employees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
    stmt.run(id);
    res.json({ message: '삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 스케줄 관리 API ==========

// 스케줄 조회 (특정 기간)
app.get('/api/schedules', (req, res) => {
  try {
    const { start, end } = req.query;
    
    let query = `
      SELECT 
        s.id,
        s.employee_id,
        s.start_time,
        s.end_time,
        e.name as employee_name,
        e.hourly_rate,
        e.color
      FROM schedules s
      JOIN employees e ON s.employee_id = e.id
    `;

    const params = [];
    if (start && end) {
      // 시작 시간이 범위 내에 있거나, 종료 시간이 범위 내에 있거나, 범위를 완전히 포함하는 경우
      query += ' WHERE (s.start_time <= ? AND s.end_time >= ?)';
      params.push(end, start);
    }

    query += ' ORDER BY s.start_time';

    const schedules = db.prepare(query).all(...params);
    console.log(`스케줄 조회: ${start} ~ ${end}, ${schedules.length}개 발견`);
    res.json(schedules);
  } catch (error) {
    console.error('스케줄 조회 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 스케줄 추가
app.post('/api/schedules', (req, res) => {
  try {
    const { employee_id, start_time, end_time } = req.body;

    if (!employee_id || !start_time || !end_time) {
      return res.status(400).json({ error: '모든 필드는 필수입니다.' });
    }

    const stmt = db.prepare('INSERT INTO schedules (employee_id, start_time, end_time) VALUES (?, ?, ?)');
    const result = stmt.run(employee_id, start_time, end_time);

    const schedule = db.prepare(`
      SELECT 
        s.id,
        s.employee_id,
        s.start_time,
        s.end_time,
        e.name as employee_name,
        e.hourly_rate,
        e.color
      FROM schedules s
      JOIN employees e ON s.employee_id = e.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 스케줄 수정
app.put('/api/schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, start_time, end_time } = req.body;

    const stmt = db.prepare('UPDATE schedules SET employee_id = ?, start_time = ?, end_time = ? WHERE id = ?');
    stmt.run(employee_id, start_time, end_time, id);

    const schedule = db.prepare(`
      SELECT 
        s.id,
        s.employee_id,
        s.start_time,
        s.end_time,
        e.name as employee_name,
        e.hourly_rate,
        e.color
      FROM schedules s
      JOIN employees e ON s.employee_id = e.id
      WHERE s.id = ?
    `).get(id);

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 스케줄 삭제
app.delete('/api/schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM schedules WHERE id = ?');
    stmt.run(id);
    res.json({ message: '삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 통계 API ==========

// 월별 급여 계산
app.get('/api/statistics/monthly', (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: '년도와 월은 필수입니다.' });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const stats = db.prepare(`
      SELECT 
        e.id,
        e.name,
        e.hourly_rate,
        e.color,
        COUNT(s.id) as total_shifts,
        COALESCE(ROUND(SUM(
          (julianday(s.end_time) - julianday(s.start_time)) * 24
        ), 2), 0) as total_hours,
        COALESCE(ROUND(
          SUM(
            (julianday(s.end_time) - julianday(s.start_time)) * 24
          ) * e.hourly_rate
        ), 0) as total_pay
      FROM employees e
      LEFT JOIN schedules s ON e.id = s.employee_id 
        AND date(s.start_time) >= ? 
        AND date(s.start_time) <= ?
      GROUP BY e.id, e.name, e.hourly_rate, e.color
      ORDER BY e.name
    `).all(startDate, endDate);

    const totalPay = stats.reduce((sum, stat) => sum + (stat.total_pay || 0), 0);

    res.json({
      employees: stats,
      total_pay: totalPay,
      period: { year: parseInt(year), month: parseInt(month) }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 설정 API ==========

// 모든 설정 조회
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT key, value FROM settings').all();
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  } catch (error) {
    console.error('설정 조회 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 설정 업데이트
app.put('/api/settings', (req, res) => {
  try {
    const settings = req.body;

    Object.keys(settings).forEach(key => {
      db.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET 
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `).run(key, settings[key]);
    });

    res.json({ message: '설정이 저장되었습니다.' });
  } catch (error) {
    console.error('설정 저장 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
  console.log(`🌍 외부 접속: http://0.0.0.0:${PORT}/api`);
  console.log(`✅ 헬스체크: http://localhost:${PORT}/api/health`);
});

// 종료 시 데이터베이스 정리
process.on('SIGINT', () => {
  db.close();
  console.log('\n👋 서버를 종료합니다.');
  process.exit(0);
});
