import db from '../config/database.js';

export const checkOwner = (number) => {
  const user = db.prepare('SELECT role FROM users WHERE phone = ?').get(number);
  return user?.role === 'owner';
};

export const checkDev = (number) => {
  const user = db.prepare('SELECT role FROM users WHERE phone = ?').get(number);
  return Boolean(user && ['owner', 'developer'].includes(user.role));
};

export const checkAdmin = (number) => {
  const user = db.prepare('SELECT role FROM users WHERE phone = ?').get(number);
  return Boolean(user && ['owner', 'developer', 'admin'].includes(user.role));
};
