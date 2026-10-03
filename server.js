// 1. 引入必要的工具包
const express = require('express'); // Web 服务器框架
const cors = require('cors');       // 解决跨域请求问题
const Database = require('better-sqlite3'); // 本地数据库，存离线消息
const mqtt = require('mqtt');       // 用来连接 EMQX
const path = require('path');       // 路径处理工具

// 2. 配置基本信息
const PORT = 3100;                  // 离线服务运行的端口号
const DB_PATH = path.join(__dirname, 'offline.db'); // 数据库文件位置
const MQTT_URL = 'mqtt://127.0.0.1:1883'; // EMQX 的本地连接地址

// 3. 卡密白名单（只有这三个卡密可以通过校验）
const KAMI_WHITELIST = ['电报卡密-2025-甲一甲一-壹壹壹壹', '电报卡密-2025-乙二乙二-贰贰贰贰', '电报卡密-2025-丙三丙三-叁叁叁叁'];

// 4. 初始化数据库和消息表
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // 优化读写性能
// 创建表：如果不存在就创建，用来存消息
db.exec(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, msg_id TEXT UNIQUE, from_user TEXT, to_user TEXT, topic TEXT, payload TEXT, ts INTEGER, delivered INTEGER DEFAULT 0, created_at INTEGER);`);

// 5. 准备数据库的增删改查语句（避免注入风险）
// 插入消息
const insertStmt = db.prepare(`INSERT OR IGNORE I