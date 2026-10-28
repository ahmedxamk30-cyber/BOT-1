import db from '../config/database.js';

class CommandModel {
  static getAll() {
    return db.prepare('SELECT * FROM commands ORDER BY name').all();
  }

  static create(name, code, description, author) {
    return db.prepare(`
      INSERT OR REPLACE INTO commands (name, code, description, author, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, code, description, author, Date.now());
  }

  static delete(name) {
    return db.prepare('DELETE FROM commands WHERE name = ?').run(name);
  }

  static get(name) {
    return db.prepare('SELECT * FROM commands WHERE name = ?').get(name);
  }
}

export default CommandModel;
