// 学分认定配置规则
const CONFIG = {
    compulsory: [
        { id: 'theory', name: '理论学习', base: 1.5, unit: '次', target: 30, note: '要求完成30分' },
        { id: 'social', name: '社会实践(调研)', base: 0.5, unit: '天', target: 15, note: '暑假≥20天计10分；寒假≥10天计5分。每人需提交实践或调研报告一篇。' },
        { id: 'volunteer', name: '志愿服务', base: 0.5, unit: '小时', target: 10, note: '要求完成10分' },
        { id: 'salon', name: '读书沙龙/理论研讨', base: 1, unit: '本', target: 10, note: '推荐书目1500字心得计1分/篇；主题发言计1分/次。', addons: { summary: 1, speech: 1 } },
        { id: 'presentation', name: '理论宣讲', base: 0.5, unit: '场', target: 10, note: '要求完成10分' },
        { id: 'media', name: '新媒体成果', base: 5, unit: '个', target: 5, note: '要求完成5分' }
    ],
    elective: [
        { id: 'lectures', name: '各类讲座', base: 1, unit: '次', target: 3, note: '以开班以来二课记录为准。' },
        { id: 'self_reading', name: '自选书目阅读', base: 1, unit: '本', target: 2, note: '读书分享活动发言心得计1分/次。', addons: { activity: 1 } },
        { id: 'forum', name: '学员论坛', base: 1, unit: '次', target: 5, note: '主题发言计2分/次。', addons: { speech: 2 } },
        { id: 'expansion', name: '素质拓展', base: 1, unit: '次', target: 10, note: '演讲/研讨/大赛计1分/次；获等级奖计一等3分、二等2分、三等1分。', awards: { first: 3, second: 2, third: 1 } },
        { id: 'practice_edu', name: '实践育人', target: '2-4', note: '双创/实践/志愿获校级及以上等级奖项。校级2分，省级3分，国家级4分（不累加）。', awards: { school: 2, provincial: 3, national: 4 }, cumulative: false },
        { id: 'scientific', name: '科学研究', base: 3, unit: '个', target: '-', note: '培养期结题，发表文章（均排名前二）。' }
    ]
};

// 安全加固：不在此处列举管理员白名单，通过服务端 API 异步获取身份内容内容内容
const API_BASE = 'http://localhost:3000/api';

// 状态
let state = {
    currentUser: JSON.parse(localStorage.getItem('current_user')) || null,
    records: [],
    activities: [],
    activeView: 'dashboard',
    tempImage: null,
    tempActImage: null
};

async function init() {
    setupLoginLogic();
    setupEventListeners();
    populateSelects();
    await loadData();
    checkAuth();
}

async function loadData() {
    try {
        const res = await fetch(`${API_BASE}/data`);
        if (!res.ok) throw new Error('后端未响应');
        const data = await res.json();
        state.records = data.records;
        state.activities = data.activities;
    } catch (err) {
        console.error('无法连接到后端，将使用本地缓存备用', err);
        state.records = JSON.parse(localStorage.getItem('credit_records')) || [];
        state.activities = JSON.parse(localStorage.getItem('app_activities')) || [];
    }
}

function setupLoginLogic() {
    const loginBtn = document.getElementById('login-btn');
    const loginInput = document.getElementById('login-name');
    loginBtn.onclick = async () => {
        const nameInput = loginInput.value.trim();
        if (!nameInput) return alert('请输入姓名');
        
        // 调用服务端接口确认身份 (确保敏感名单物理隔离于代码仓内容内容)
        try {
            const authRes = await fetch(`${API_BASE}/auth?name=${encodeURIComponent(nameInput)}`);
            const authData = await authRes.json();
            state.currentUser = { name: nameInput, role: authData.role };
            localStorage.setItem('current_user', JSON.stringify(state.currentUser));
            checkAuth();
        } catch (err) {
            alert('登录验证失败，请确保后端服务正常启动内容内容。内容逻辑已同步。');
        }
    };
    document.getElementById('logout-btn').onclick = () => { localStorage.removeItem('current_user'); state.currentUser = null; checkAuth(); };
}

function checkAuth() {
    const overlay = document.getElementById('login-overlay');
    if (!state.currentUser) overlay.classList.remove('hidden');
    else { overlay.classList.add('hidden'); updateUserProfile(); toggleAdminControls(); renderAll(); }
}

function toggleAdminControls() {
    const isAdmin = state.currentUser?.role === 'admin';
    document.getElementById('export-excel-btn').classList.toggle('hidden', !isAdmin);
    document.getElementById('export-zip-btn').classList.toggle('hidden', !isAdmin);
    document.getElementById('post-activity-btn').classList.toggle('hidden', !isAdmin);
    document.getElementById('nav-admin-users').classList.toggle('hidden', !isAdmin);
}

function updateUserProfile() {
    const name = state.currentUser.name;
    document.getElementById('user-display-name').textContent = name;
    document.getElementById('user-role-badge').textContent = state.currentUser.role === 'admin' ? '系统管理员' : '正式学员';
    document.getElementById('user-avatar').textContent = name ? name[0].toUpperCase() : 'U';
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            state.activeView = item.dataset.view;
            document.getElementById('view-title').textContent = item.textContent;
            renderAll();
        });
    });

    const recordModal = document.getElementById('modal-overlay');
    document.getElementById('add-record-btn').onclick = () => { resetForm(); recordModal.classList.remove('hidden'); };
    document.getElementById('close-modal').onclick = () => recordModal.classList.add('hidden');

    const actModal = document.getElementById('activity-overlay');
    if (document.getElementById('post-activity-btn')) document.getElementById('post-activity-btn').onclick = () => { resetActForm(); actModal.classList.remove('hidden'); };
    if (document.getElementById('close-activity-modal')) document.getElementById('close-activity-modal').onclick = () => actModal.classList.add('hidden');

    const adjModal = document.getElementById('adjustment-overlay');
    if (document.getElementById('close-adjustment-modal')) document.getElementById('close-adjustment-modal').onclick = () => adjModal.classList.add('hidden');

    document.getElementById('export-excel-btn').onclick = exportToExcel;
    document.getElementById('export-zip-btn').onclick = exportAllZips;

    setupImageHandlers('proof-image', 'drop-zone', 'image-preview', (res) => state.tempImage = res, '.upload-placeholder span');
    setupImageHandlers('activity-image', 'activity-drop-zone', 'activity-preview', (res) => state.tempActImage = res, '#act-upload-icon');

    document.getElementById('item-select').onchange = (e) => updateDynamicInputs(e.target.value);
    document.getElementById('record-form').onsubmit = (e) => { e.preventDefault(); saveRecord(); };
    document.getElementById('activity-form').onsubmit = (e) => { e.preventDefault(); postActivity(); };
    document.getElementById('adjustment-form').onsubmit = (e) => { e.preventDefault(); saveAdjustment(); };

    document.getElementById('app-view').addEventListener('click', (e) => {
        if (e.target.classList.contains('admin-action-btn')) updateRecordStatus(parseInt(e.target.dataset.id), e.target.dataset.action);
        if (e.target.classList.contains('open-adj-btn')) openAdjustmentModal(e.target.dataset.user);
        if (e.target.id === 'batch-adj-btn') openBatchAdjustment();
        if (e.target.id === 'select-all-users') toggleSelectAll(e.target.checked);
    });
}

function setupImageHandlers(inputId, zoneId, previewId, setter, placeholderSelector) {
    const input = document.getElementById(inputId); const zone = document.getElementById(zoneId);
    if (!input || !zone) return; zone.onclick = () => input.click();
    input.onchange = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { setter(ev.target.result); const prev = document.getElementById(previewId); prev.src = ev.target.result; prev.classList.remove('hidden'); const placeholder = document.querySelector(placeholderSelector); if (placeholder) placeholder.classList.add('hidden'); };
        reader.readAsDataURL(file);
    };
}

function resetForm() { document.getElementById('record-form').reset(); state.tempImage = null; if (document.getElementById('image-preview')) document.getElementById('image-preview').classList.add('hidden'); document.querySelectorAll('.upload-placeholder span').forEach(s => s.classList.remove('hidden')); updateDynamicInputs('compulsory:theory'); }
function resetActForm() { if (document.getElementById('activity-form')) document.getElementById('activity-form').reset(); state.tempActImage = null; if (document.getElementById('activity-preview')) document.getElementById('activity-preview').classList.add('hidden'); if (document.getElementById('act-upload-icon')) document.getElementById('act-upload-icon').classList.remove('hidden'); }

function populateSelects() {
    const groups = [ { c: 'opt-compulsory', a: 'adj-opt-compulsory', items: CONFIG.compulsory, cat: 'compulsory' }, { c: 'opt-elective', a: 'adj-opt-elective', items: CONFIG.elective, cat: 'elective' } ];
    groups.forEach(g => {
        const el = document.getElementById(g.c); const aEl = document.getElementById(g.a);
        if (el) { el.innerHTML = ''; g.items.forEach(i => el.appendChild(new Option(i.name, `${g.cat}:${i.id}`))); }
        if (aEl) { aEl.innerHTML = ''; g.items.forEach(i => aEl.appendChild(new Option(i.name, `${g.cat}:${i.id}`))); }
    });
}

function updateDynamicInputs(value) {
    const [category, id] = value.split(':'); const item = CONFIG[category].find(i => i.id === id); if (!item) return;
    const container = document.getElementById('dynamic-inputs'); container.innerHTML = '';
    if (item.base !== undefined || item.unit) container.innerHTML += `<div class="form-group"><label>数量 (${item.unit || '个'})</label><input type="number" id="input-value" step="0.5" required min="0"></div>`;
    if (item.addons) Object.entries(item.addons).forEach(([key, val]) => { const label = key === 'summary' ? '含有心得' : key === 'speech' ? '含有发言' : key === 'activity' ? '参加分享活动' : '附加项'; container.innerHTML += `<div class="form-group" style="display:flex;gap:8px;"><input type="checkbox" id="addon-${key}" style="width:auto"><label style="margin:0">${label}</label></div>`; });
    if (item.awards) {
        if (item.cumulative) container.innerHTML += `<label>等级 (多选)</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">${Object.keys(item.awards).map(lvl => `<div style="display:flex;gap:4px;"><input type="checkbox" class="award-check" value="${lvl}"> ${lvl==='school'?'校级':lvl==='provincial'?'省级':lvl==='national'?'国家级':lvl}</div>`).join('')}</div>`;
        else container.innerHTML += `<div class="form-group"><label>奖项级别</label><select id="input-award"><option value="">参与/普通</option>${Object.keys(item.awards).map(lvl => `<option value="${lvl}">${lvl==='first'?'一等奖':lvl==='second'?'二等奖':lvl==='third'?'三等奖':lvl}</option>`).join('')}</div>`;
    }
}

async function saveRecord() {
    const btn = document.querySelector('#record-form .btn-primary');
    btn.disabled = true; btn.textContent = '保存中...';
    
    const valInput = document.getElementById('input-value'); const select = document.getElementById('item-select').value; const [category, id] = select.split(':');
    const record = { id: Date.now(), userName: state.currentUser.name || '未知', category, itemId: id, value: valInput ? parseFloat(valInput.value) : 1, addons: [], awards: [], proofText: document.getElementById('proof-text').value, proofImage: state.tempImage, status: 'pending', timestamp: new Date().toLocaleDateString() };
    document.querySelectorAll('#dynamic-inputs input[type="checkbox"]:checked').forEach(cb => { if (cb.classList.contains('award-check')) record.awards.push(cb.value); else record.addons.push(cb.id.replace('addon-', '')); });
    if (document.getElementById('input-award')?.value) record.awards.push(document.getElementById('input-award').value);
    
    try {
        const res = await fetch(`${API_BASE}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) });
        if (res.ok) { state.records.push(await res.json()); }
    } catch (err) {
        state.records.push(record); // Fallback to local push
        localStorage.setItem('credit_records', JSON.stringify(state.records));
    }
    
    document.getElementById('modal-overlay').classList.add('hidden');
    btn.disabled = false; btn.textContent = '确认提交';
    renderAll();
}

function openAdjustmentModal(user) { document.getElementById('adj-user-name').textContent = user; document.getElementById('adj-target-user').value = user; document.getElementById('adjustment-overlay').classList.remove('hidden'); }
function openBatchAdjustment() {
    const selected = Array.from(document.querySelectorAll('.user-select-check:checked')).map(cb => cb.value); if (selected.length === 0) return alert('请先勾选学员');
    document.getElementById('adj-user-name').textContent = `已选 ${selected.length} 名学员`; document.getElementById('adj-target-user').value = 'BATCH'; document.getElementById('adjustment-overlay').classList.remove('hidden');
}
function toggleSelectAll(checked) { document.querySelectorAll('.user-select-check').forEach(cb => cb.checked = checked); }

async function saveAdjustment() {
    const target = document.getElementById('adj-target-user').value; const itemSelect = document.getElementById('adj-item-select').value; const [category, itemId] = itemSelect.split(':');
    const baseRecord = { id: Date.now(), category, itemId, value: parseFloat(document.getElementById('adj-value').value), proofText: `[管理员调整进度] 理由: ${document.getElementById('adj-reason').value}`, status: 'approved', timestamp: new Date().toLocaleDateString(), adminAction: true };
    
    let toSave = [];
    if (target === 'BATCH') { 
        const selected = Array.from(document.querySelectorAll('.user-select-check:checked')).map(cb => cb.value); 
        toSave = selected.map((u, i) => ({ ...baseRecord, id: Date.now() + i, userName: u }));
    }
    else { toSave = [{ ...baseRecord, userName: target }]; }

    try {
        const res = await fetch(`${API_BASE}/adjustments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toSave) });
        if (res.ok) { state.records.push(...toSave); }
    } catch (err) {
        state.records.push(...toSave);
        localStorage.setItem('credit_records', JSON.stringify(state.records));
    }
    
    document.getElementById('adjustment-overlay').classList.add('hidden');
    renderAll();
}

async function updateRecordStatus(id, newStatus) {
    try {
        const res = await fetch(`${API_BASE}/records/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
        if (res.ok) {
            const idx = state.records.findIndex(r => r.id === id);
            if (idx !== -1) state.records[idx].status = newStatus;
            renderAll();
        }
    } catch (err) {
        const idx = state.records.findIndex(r => r.id === id);
        if (idx !== -1) { state.records[idx].status = newStatus; renderAll(); }
    }
}

async function postActivity() {
    const activity = { id: Date.now(), text: document.getElementById('activity-text').value, image: state.tempActImage, timestamp: new Date().toLocaleDateString(), author: state.currentUser.name };
    try {
        const res = await fetch(`${API_BASE}/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(activity) });
        if (res.ok) { state.activities.push(await res.json()); }
    } catch (err) {
        state.activities.push(activity);
        localStorage.setItem('app_activities', JSON.stringify(state.activities));
    }
    document.getElementById('activity-overlay').classList.add('hidden');
    state.activeView = 'activities';
    renderAll();
}

function exportToExcel() {
    const users = [...new Set(state.records.map(r => r.userName))]; let csv = "\ufeff姓名,必修学分,选修学分,总得分\n";
    users.forEach(u => { const uRecs = state.records.filter(r => r.userName === u && r.status === 'approved'); let comp = 0, elec = 0; uRecs.forEach(r => { const s = calculateScore(r); if (r.category === 'compulsory') comp += s; else elec += s; }); csv += `${u},${comp.toFixed(1)},${elec.toFixed(1)},${(comp+elec).toFixed(1)}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `统计.csv`; link.click();
}

async function exportAllZips() {
    if (typeof JSZip === 'undefined') return alert('库未加载'); const zip = new JSZip(); const users = [...new Set(state.records.map(r => r.userName))]; const root = zip.folder(`档案_${new Date().toLocaleDateString()}`);
    for (const user of users) {
        const userFolder = root.folder(`学员_${user}`); const userRecords = state.records.filter(r => r.userName === user);
        userRecords.forEach((r, i) => { const item = (CONFIG[r.category]?.find(it => it.id === r.itemId) || { name: '调整项' }); const fileName = `${i+1}.${item.name}_${r.timestamp.replace(/\//g, '-')}`; userFolder.file(`${fileName}.txt`, `分值: ${calculateScore(r)}\n备注: ${r.proofText}`); if (r.proofImage) userFolder.file(`${fileName}.png`, r.proofImage.split(',')[1], { base64: true }); });
    }
    const content = await zip.generateAsync({ type: "blob" }); const link = document.createElement("a"); link.href = URL.createObjectURL(content); link.download = `学分档案.zip`; link.click();
}

function calculateScore(r) {
    if (r.adminAction) return r.value; const item = CONFIG[r.category]?.find(i => i.id === r.itemId); if (!item) return 0;
    let s = (r.value || 0) * (item.base || 0);
    if (item.addons && r.addons) r.addons.forEach(k => s += item.addons[k]);
    if (item.awards && r.awards) { if (item.cumulative) r.awards.forEach(l => s += item.awards[l]); else if (r.awards[0]) s += item.awards[r.awards[0]]; }
    if (item.maxPerUnit && s > item.maxPerUnit) s = item.maxPerUnit; return s;
}

function renderAll() {
    if (!state.currentUser) return; const view = state.activeView; const displayRecords = state.currentUser.role === 'admin' ? state.records : state.records.filter(r => r.userName === state.currentUser.name);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
    const totals = { compulsory: 0, elective: 0 }; const details = {};
    displayRecords.forEach(r => { const s = calculateScore(r); if (r.status === 'approved') { totals[r.category] += s; details[r.itemId] = (details[r.itemId] || 0) + s; } });
    if (view === 'dashboard') renderDashboard(totals, details); else if (view === 'records') renderRecordsList(displayRecords); else if (view === 'activities') renderActivities(); else if (view === 'users') renderUsersList(); else if (view === 'rules') renderRules();
}

function renderDashboard(totals, details) {
    document.getElementById('app-view').innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card glass-panel"><h3>必修进度</h3><div class="progress-section"><div class="progress-ring-container"><svg class="progress-ring" width="120" height="120"><circle class="progress-ring-bg" cx="60" cy="60" r="54"></circle><circle class="progress-ring-bar" cx="60" cy="60" r="54" style="stroke-dashoffset: ${339.29 - (339.29 * Math.min(totals.compulsory / 80, 1))}"></circle></svg><div class="progress-text">${Math.round((totals.compulsory / 80) * 100)}%</div></div><div class="stats-detail"><p><strong>${totals.compulsory.toFixed(1)}</strong> / 80分</p></div></div></div>
            <div class="stat-card glass-panel"><h3>选修累计</h3><div class="elective-stats"><div class="big-number">${totals.elective.toFixed(1)}</div><p>分</p></div></div>
        </div>
        <div class="section-container"><h2>进度明细</h2><div class="credits-list">${[...CONFIG.compulsory, ...CONFIG.elective].map(item => { const earned = details[item.id] || 0; return `<div class="credit-item glass-panel"><span>${item.name}</span><span>${earned.toFixed(1)}${item.target ? ' / '+item.target : ''}</span><span class="item-status ${earned >= (parseFloat(item.target) || 0) ? 'text-accent' : ''}">${earned >= (parseFloat(item.target) || 0) ? '已达标' : '认证中'}</span></div>`; }).join('')}</div></div>
    `;
}

function renderRecordsList(records) {
    document.getElementById('app-view').innerHTML = `<div class="section-container"><h2>申请记录</h2>${records.length ? records.slice().reverse().map(r => {
        const item = CONFIG[r.category]?.find(it => it.id === r.itemId) || { name: '调整项' }; const score = calculateScore(r);
        return `<div class="record-entry glass-panel" style="padding:20px; margin-bottom:12px;"><div style="display:flex; justify-content:space-between;"><div><h4>${item.name} <span class="badge">${r.userName}</span></h4><small>${r.timestamp}</small></div><div class="${r.status==='approved'?'text-accent':r.status==='rejected'?'text-danger':''}" style="font-weight:700; text-align:right;">${score > 0 ? '+' : ''}${score.toFixed(1)}<div style="font-size:12px;">${r.status==='approved'?'通过':r.status==='rejected'?'驳回':'待审'}</div></div></div><p style="font-size:13px; color:var(--text-dim); margin-top:10px;">${r.proofText || '无备注'}</p>${state.currentUser.role==='admin'&&r.status==='pending'?`<div style="margin-top:12px;"><button class="btn-primary admin-action-btn" data-id="${r.id}" data-action="approved">准予</button><button class="btn-primary admin-action-btn" data-id="${r.id}" data-action="rejected">驳回</button></div>`:''}</div>`;
    }).join('') : '<p>暂无数据</p>'}</div>`;
}

function renderUsersList() {
    const users = [...new Set(state.records.map(r => r.userName))];
    const userStats = users.map(u => { const uRecs = state.records.filter(r => r.userName === u && r.status === 'approved'); let comp = 0, elec = 0; uRecs.forEach(r => { const s = calculateScore(r); if (r.category === 'compulsory') comp += s; else elec += s; }); return { name: u, comp, elec }; });
    document.getElementById('app-view').innerHTML = `
        <div class="section-container">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;"><h2>学员管理</h2><button class="btn-primary" id="batch-adj-btn" style="background:var(--secondary);">批量调整进度</button></div>
            <div class="credits-list">
                <div class="credit-item glass-panel" style="grid-template-columns: 40px 1fr 1fr 1fr 100px; background:rgba(255,255,255,0.05);"><input type="checkbox" id="select-all-users" style="width:20px; height:20px;"><div style="font-weight:700;">姓名</div><div>必修</div><div>选修</div><div>操作</div></div>
                ${userStats.map(u => `
                    <div class="credit-item glass-panel" style="grid-template-columns: 40px 1fr 1fr 1fr 100px;">
                        <input type="checkbox" class="user-select-check" value="${u.name}" style="width:20px; height:20px;"><div style="font-weight:600;">${u.name}</div><div class="text-accent">${u.comp.toFixed(1)}</div><div class="text-accent">${u.elec.toFixed(1)}</div><button class="btn-primary open-adj-btn" data-user="${u.name}" style="padding:4px 0; background:var(--secondary); font-size:12px;">调整</button>
                    </div>`).join('')}
            </div>
        </div>
    `;
}

function renderActivities() {
    document.getElementById('app-view').innerHTML = `<div class="section-container"><h2>通知公告</h2><div class="activities-list">${state.activities.length ? state.activities.slice().reverse().map(a => `<div class="activity-card glass-panel" style="padding:24px; margin-bottom:20px;"><div style="display:flex; justify-content:space-between;"><span class="badge">通知</span><small>${a.timestamp} | ${a.author}</small></div><p style="margin:16px 0;">${a.text}</p>${a.image ? `<img src="${a.image}" style="width:100%; max-height:400px; object-fit:contain; border-radius:12px;">` : ''}</div>`).join('') : '<p>暂无通知</p>'}</div></div>`;
}

function renderRules() {
    document.getElementById('app-view').innerHTML = `
        <div class="section-container">
            <h2>认定细则</h2>
            <div class="rules-table-container">
                <div class="rule-group">
                    <h3>必修项</h3>
                    ${CONFIG.compulsory.map(item => renderRuleRow(item)).join('')}
                </div>
                <div class="rule-group" style="margin-top:24px;">
                    <h3>选修项</h3>
                    ${CONFIG.elective.map(item => renderRuleRow(item)).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderRuleRow(item) {
    let std = '';
    if (item.id === 'practice_edu') std = '校级2分, 省级3分, 国家级4分';
    else if (item.awards) std = Object.entries(item.awards).map(([k,v]) => `${k==='first'?'一等':k==='second'?'二等':k==='third'?'三等':k==='school'?'校':k==='provincial'?'省':k==='national'?'国':k}${v}分`).join(', ');
    else std = `${item.base}分/${item.unit||'项'}`;
    
    return `
        <div class="rule-row glass-panel" style="padding:20px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong style="color:var(--text-bright); font-size:16px;">${item.name}</strong>
                <span class="badge" style="background:var(--accent); color:var(--bg-dark);">目标: ${item.target}分</span>
            </div>
            <div style="color:var(--text-accent); font-size:14px; margin-bottom:8px;">
                <strong>标准：</strong>${std}
            </div>
            ${item.note ? `<div style="font-size:13px; color:var(--text-dim); background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:8px; border-left:4px solid var(--accent);">
                <strong>备注：</strong>${item.note}
            </div>` : ''}
        </div>
    `;
}

init();
