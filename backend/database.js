const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/parttime.db';
const dbDir = path.dirname(dbPath);

// 데이터베이스 디렉토리가 없으면 생성
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// 데이터베이스 초기화
function initializeDatabase() {
  // 알바생 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      hourly_rate INTEGER NOT NULL,
      color TEXT DEFAULT '#3b82f6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 근무 일정 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ 데이터베이스 초기화 완료');
}

initializeDatabase();

module.exports = db;
