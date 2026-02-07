const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run init-db in production');
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const url = new URL(databaseUrl);
  if (url.protocol !== 'mysql:') {
    throw new Error('DATABASE_URL must use mysql://');
  }

  const databaseName = url.pathname.replace(/^\//, '');
  if (!databaseName) {
    throw new Error('DATABASE_URL must include database name');
  }

  const connection = await mysql.createConnection({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  });

  try {
    // 删除并重新创建数据库（使用正确的字符集）
    await connection.execute(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    await connection.execute(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ 数据库创建成功');
  } catch (error) {
    console.error('❌ 数据库创建失败:', error.message);
  } finally {
    await connection.end();
  }
}

initDatabase();
