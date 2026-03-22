require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, process.env.DB_FILE || 'database.json');
const ADMIN_LIST = (process.env.ADMIN_NAMES || '').split(',').map(n => n.trim().toLowerCase());

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// 初始化数据库
function initDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = { records: [], activities: [] };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
}

function readDB() {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// 身份校验接口 (安全加固：不在前端暴露白名单)
app.get('/api/auth', (req, res) => {
    const name = (req.query.name || '').toLowerCase();
    if (!name) return res.status(400).json({ error: 'Missing name' });
    const isAdmin = ADMIN_LIST.includes(name);
    res.json({ role: isAdmin ? 'admin' : 'user' });
});

// 路由
app.get('/api/data', (req, res) => {
    try {
        const data = readDB();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: '读取数据失败' });
    }
});

app.post('/api/records', (req, res) => {
    try {
        const data = readDB();
        const newRecord = req.body;
        data.records.push(newRecord);
        writeDB(data);
        res.status(201).json(newRecord);
    } catch (err) {
        res.status(500).json({ error: '保存记录失败' });
    }
});

app.put('/api/records/:id', (req, res) => {
    try {
        const data = readDB();
        const id = parseInt(req.params.id);
        const idx = data.records.findIndex(r => r.id === id);
        if (idx !== -1) {
            data.records[idx].status = req.body.status;
            writeDB(data);
            res.json(data.records[idx]);
        } else {
            res.status(404).json({ error: '找不到记录' });
        }
    } catch (err) {
        res.status(500).json({ error: '更新失败' });
    }
});

app.post('/api/activities', (req, res) => {
    try {
        const data = readDB();
        const newActivity = req.body;
        data.activities.push(newActivity);
        writeDB(data);
        res.status(201).json(newActivity);
    } catch (err) {
        res.status(500).json({ error: '发布失败' });
    }
});

app.post('/api/adjustments', (req, res) => {
    try {
        const data = readDB();
        const newRecords = Array.isArray(req.body) ? req.body : [req.body];
        data.records.push(...newRecords);
        writeDB(data);
        res.status(201).json({ success: true, count: newRecords.length });
    } catch (err) {
        res.status(500).json({ error: '调整进度失败' });
    }
});

initDB();
app.listen(PORT, () => {
    console.log(`服务端已启动：http://localhost:${PORT}`);
    console.log(`数据存储路径：${DB_FILE}`);
});
