// ==================== DATA LAYER (localStorage) ====================
const KEYS = { assignments: 'sh_assignments', tasks: 'sh_tasks', timetable: 'sh_timetable', notes: 'sh_notes', folders: 'sh_folders', profile: 'sh_profile', notifications: 'sh_notifications' };
const FILE_DB = { name: 'studyhub_files', version: 1, store: 'files' };
const MAX_LIBRARY_FILE_SIZE = 15 * 1024 * 1024;

function load(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function createId(offset = 0) { return Date.now() + Math.floor(Math.random() * 100000) + offset; }
function getNotificationPrefs() {
  const defaults = { classes: true, assignments: true, sent: {} };
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.notifications)) || {};
    return {
      ...defaults,
      ...stored,
      sent: typeof stored.sent === 'object' && stored.sent ? stored.sent : {},
    };
  } catch {
    return defaults;
  }
}
function saveNotificationPrefs(data) {
  const current = getNotificationPrefs();
  save(KEYS.notifications, { ...current, ...data, sent: { ...(current.sent || {}), ...(data.sent || {}) } });
}
function parseNullableId(value) {
  if (value === '' || value === null || value === undefined || value === 'null') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// Seed default data if first launch
function seedDefaults() {
  if (localStorage.getItem('sh_seeded')) return;
  save(KEYS.assignments, [
    { id: Date.now(), title: 'Physics Lab Report', subject: 'Fluid Dynamics', due: new Date(Date.now() + 4*3600000).toISOString(), priority: 'high', done: false },
    { id: Date.now()+1, title: 'History of Architecture', subject: 'Humanities', due: new Date(Date.now() + 20*3600000).toISOString(), priority: 'medium', done: false },
    { id: Date.now()+2, title: 'Python Scripting Final', subject: 'Computer Science', due: new Date(Date.now() + 48*3600000).toISOString(), priority: 'low', done: false },
    { id: Date.now()+3, title: 'Macroeconomics Thesis', subject: 'Economics', due: new Date(Date.now() - 48*3600000).toISOString(), priority: 'high', done: false },
  ]);
  save(KEYS.tasks, [
    { id: Date.now()+10, text: 'Review Bio-Chemistry Notes', done: false },
    { id: Date.now()+11, text: 'Return Library Books', done: true },
    { id: Date.now()+12, text: 'Email Professor about Extension', done: false },
    { id: Date.now()+13, text: 'Buy Drafting Compasses', done: false },
  ]);
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const classes = {
    Monday: [
      { id: 1, name: 'Data Structures & Algorithms', room: 'Lab Room 402', start: '09:00', end: '10:30' },
      { id: 2, name: 'Software Engineering', room: 'Seminar Room 12', start: '11:00', end: '12:30' },
      { id: 3, name: 'Philosophy', room: 'Room 210', start: '14:00', end: '15:00' },
    ],
    Tuesday: [
      { id: 5, name: 'Physics II', room: 'Science Block 3', start: '09:00', end: '10:30' },
      { id: 6, name: 'Discrete Math', room: 'Lecture Hall B1', start: '11:00', end: '12:30' },
      { id: 7, name: 'English Literature', room: 'Arts Building', start: '14:00', end: '15:00' },
    ],
    Wednesday: [
      { id: 8, name: 'Advanced Mathematics', room: 'Lecture Hall A2', start: '08:30', end: '09:45' },
      { id: 9, name: 'Operating Systems', room: 'Lab 301', start: '10:00', end: '11:30' },
      { id: 10, name: 'Technical Writing', room: 'Main Library', start: '13:00', end: '14:30' },
    ],
    Thursday: [
      { id: 11, name: 'Data Structures & Algorithms', room: 'Lab Room 402', start: '09:00', end: '10:30' },
      { id: 12, name: 'Software Engineering', room: 'Seminar Room 12', start: '11:00', end: '12:30' },
      { id: 13, name: 'Philosophy', room: 'Room 210', start: '14:00', end: '15:00' },
    ],
    Friday: [
      { id: 14, name: 'Physics II Lab', room: 'Physics Lab', start: '09:00', end: '11:00' },
      { id: 15, name: 'Discrete Math', room: 'Lecture Hall B1', start: '11:30', end: '13:00' },
    ],
  };
  save(KEYS.timetable, classes);
  const mathFolderId = createId(20);
  const historyFolderId = createId(21);
  const physicsFolderId = createId(22);
  save(KEYS.folders, [
    { id: mathFolderId, name: 'Math', parentId: null, icon: 'functions', color: '#3b82f6' },
    { id: historyFolderId, name: 'History', parentId: null, icon: 'history_edu', color: '#d97706' },
    { id: physicsFolderId, name: 'Physics', parentId: null, icon: 'science', color: '#4338ca' },
  ]);
  save(KEYS.notes, [
    { id: createId(30), type: 'note', title: 'Calculus III: Vector Fields', content: 'Key concepts: Line integrals, Green\'s theorem, divergence and curl...', folderId: mathFolderId, created: new Date(Date.now()-7200000).toISOString(), photo: null },
    { id: createId(31), type: 'note', title: 'Industrial Revolution Summary', content: 'The Industrial Revolution began in Britain in the late 18th century...', folderId: historyFolderId, created: new Date(Date.now()-86400000).toISOString(), photo: null },
    { id: createId(32), type: 'note', title: 'Thermodynamics Laws Pt 1', content: '1st Law: Energy cannot be created or destroyed\n2nd Law: Entropy of an isolated system always increases...', folderId: physicsFolderId, created: new Date(Date.now()-259200000).toISOString(), photo: null },
  ]);
  localStorage.setItem('sh_seeded', 'true');
}

function normalizeLibraryData() {
  const fallbackColors = ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#d97706', '#06b6d4'];
  const rawFolders = load(KEYS.folders);
  let foldersChanged = false;
  const folders = rawFolders.map((folder, index) => {
    const normalized = {
      ...folder,
      id: parseNullableId(folder.id) ?? createId(index + 200),
      parentId: parseNullableId(folder.parentId),
      icon: folder.icon || 'folder',
      color: folder.color || fallbackColors[index % fallbackColors.length],
    };
    if (
      normalized.id !== folder.id ||
      normalized.parentId !== parseNullableId(folder.parentId) ||
      normalized.icon !== folder.icon ||
      normalized.color !== folder.color
    ) foldersChanged = true;
    return normalized;
  });

  const folderIds = new Set(folders.map(folder => folder.id));
  folders.forEach(folder => {
    if (folder.parentId !== null && (!folderIds.has(folder.parentId) || folder.parentId === folder.id)) {
      folder.parentId = null;
      foldersChanged = true;
    }
  });

  const folderNameMap = new Map(folders.map(folder => [folder.name, folder.id]));
  const rawItems = load(KEYS.notes);
  let itemsChanged = false;
  const items = rawItems.map((item, index) => {
    const { folder, ...restItem } = item;
    const id = parseNullableId(item.id) ?? createId(index + 500);
    const mappedFolderId = parseNullableId(item.folderId) ?? (typeof folder === 'string' ? (folderNameMap.get(folder) ?? null) : null);
    const folderId = folderIds.has(mappedFolderId) ? mappedFolderId : null;

    if ((item.type || 'note') === 'file') {
      const normalized = {
        ...restItem,
        id,
        type: 'file',
        title: item.title || item.fileName || 'Untitled file',
        folderId,
        created: item.created || new Date().toISOString(),
        mimeType: item.mimeType || (String(item.title || item.fileName || '').toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        size: Number(item.size) || 0,
        storageId: item.storageId || `file_${id}`,
      };
      if (
        normalized.id !== item.id ||
        normalized.type !== item.type ||
        normalized.folderId !== item.folderId ||
        normalized.mimeType !== item.mimeType ||
        normalized.size !== item.size ||
        normalized.storageId !== item.storageId ||
        item.folder !== undefined
      ) itemsChanged = true;
      return normalized;
    }

    const normalized = {
      ...restItem,
      id,
      type: 'note',
      title: item.title || 'Untitled',
      content: item.content || '',
      folderId,
      created: item.created || new Date().toISOString(),
      photo: item.photo || null,
    };
    if (
      normalized.id !== item.id ||
      normalized.type !== item.type ||
      normalized.folderId !== item.folderId ||
      normalized.content !== item.content ||
      item.folder !== undefined
    ) itemsChanged = true;
    return normalized;
  });

  if (foldersChanged) save(KEYS.folders, folders);
  if (itemsChanged) save(KEYS.notes, items);
}

// ==================== TAB NAVIGATION ====================
function updateScreenMode(tabId) {
  document.body.classList.toggle('timetable-mode', tabId === 'timetable');
}
function switchTab(tabId, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + tabId).classList.add('active');
  updateScreenMode(tabId);
  if (tabId === 'timetable') hideToast();
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
    n.querySelector('.material-symbols-outlined').classList.remove('filled');
  });
  if (btn) {
    btn.classList.add('active');
    btn.querySelector('.material-symbols-outlined').classList.add('filled');
  }
  // Re-render the view
  if (tabId === 'dashboard') renderDashboard();
  else if (tabId === 'assignments') renderAssignments();
  else if (tabId === 'timetable') renderTimetable();
  else if (tabId === 'notes') renderNotes();
  else if (tabId === 'profile') renderProfile();
}

// ==================== MODAL HELPERS ====================
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// ==================== TOAST ====================
let toastTimer = null;
function hideToast() {
  const t = document.getElementById('toast');
  if (!t) return;
  t.classList.remove('show');
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
}
function showToast(msg) {
  const t = document.getElementById('toast');
  if (toastTimer) clearTimeout(toastTimer);
  t.textContent = msg;
  t.classList.add('show');
  toastTimer = setTimeout(() => {
    t.classList.remove('show');
    toastTimer = null;
  }, 2200);
}

// ==================== TIMER ====================
let timerInterval = null, timeLeft = 25 * 60, timerRunning = false;

function updateTimerUI() {
  const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
  document.getElementById('timer-display').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function toggleTimer() {
  const btn = document.getElementById('timer-btn');
  if (timerRunning) {
    clearInterval(timerInterval); btn.textContent = 'Resume'; btn.style.background = 'var(--primary)';
  } else {
    btn.textContent = 'Pause'; btn.style.background = 'var(--error)';
    timerInterval = setInterval(() => {
      if (timeLeft > 0) { timeLeft--; updateTimerUI(); }
      else { clearInterval(timerInterval); timerRunning = false; btn.textContent = 'Done!'; btn.style.background = 'var(--primary)'; showToast('🎉 Focus session complete!'); }
    }, 1000);
  }
  timerRunning = !timerRunning;
}
function resetTimer() {
  clearInterval(timerInterval); timerRunning = false; timeLeft = 25 * 60; updateTimerUI();
  const btn = document.getElementById('timer-btn'); btn.textContent = 'Start Focus'; btn.style.background = 'var(--primary)';
}

// ==================== DASHBOARD RENDER ====================
function renderDashboard() {
  // Date
  const now = new Date();
  document.getElementById('dash-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

  // Greeting with profile name
  const profile = getProfile();
  document.getElementById('dash-greeting').textContent = `Hello, ${profile.name}.`;

  // Summary
  const assigns = load(KEYS.assignments).filter(a => !a.done);
  const todayClasses = getTodayClasses();
  document.getElementById('dash-summary').textContent = `You have ${todayClasses.length} class${todayClasses.length!==1?'es':''} today and ${assigns.length} pending assignment${assigns.length!==1?'s':''}.`;

  // Schedule cards
  const sc = document.getElementById('dash-schedule');
  if (todayClasses.length === 0) {
    sc.innerHTML = '<div class="card" style="text-align:center;padding:2rem;color:var(--on-surface-variant)"><span class="material-symbols-outlined" style="font-size:2rem;margin-bottom:0.5rem;display:block">weekend</span>No classes today!</div>';
    document.getElementById('dash-live-badge').style.display = 'none';
  } else {
    const current = getCurrentClass(todayClasses);
    const upcoming = getUpcomingClasses(todayClasses, 2);
    document.getElementById('dash-live-badge').style.display = current ? 'inline-block' : 'none';
    let html = '<div class="dash-schedule-slider">';
    if (current) {
      const prog = getClassProgress(current);
      const remaining = Math.max(0, timeToMinutes(current.end) - (now.getHours() * 60 + now.getMinutes()));
      html += `<div class="dash-schedule-slide dash-schedule-slide-primary" style="background:var(--primary);color:white;padding:2rem;border-radius:0.75rem;position:relative;overflow:hidden;min-height:200px;display:flex;flex-direction:column;justify-content:space-between">
        <div><div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem"><span class="material-symbols-outlined filled" style="font-size:14px">sensors</span><span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.8">${current.room}</span></div>
        <h3 style="font-size:1.75rem;font-weight:700;line-height:1.2">${current.name}</h3>
        <p style="margin-top:0.5rem;opacity:0.8;font-size:0.875rem">${current.start} - ${current.end}</p></div>
        <div><p style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.6;margin-bottom:0.5rem">Progress</p>
        <div style="width:100%;height:6px;background:rgba(255,255,255,0.2);border-radius:4px;overflow:hidden"><div style="width:${prog}%;height:100%;background:white;border-radius:4px;transition:width 1s"></div></div><p style="font-size:0.75rem;opacity:0.82;margin-top:0.75rem">${remaining} min left in class</p></div>
        <div style="position:absolute;right:-2rem;top:-2rem;width:8rem;height:8rem;background:rgba(255,255,255,0.08);border-radius:50%;filter:blur(20px)"></div></div>`;
    } else {
      const next = upcoming[0];
      const leadText = next
        ? `Next starts in ${Math.max(0, timeToMinutes(next.start) - (now.getHours() * 60 + now.getMinutes()))} min`
        : 'You are done for today';
      html += `<div class="card dash-schedule-slide dash-schedule-slide-primary" style="display:flex;align-items:center;justify-content:center;min-height:200px;color:var(--on-surface-variant)">
        <div style="text-align:center">
          <span class="material-symbols-outlined" style="font-size:2rem;margin-bottom:0.5rem;display:block">free_cancellation</span>
          <p style="font-size:1.15rem;font-weight:600;color:var(--on-surface)">No class right now</p>
          <p style="font-size:0.8125rem;margin-top:0.35rem">${leadText}</p>
        </div>
      </div>`;
    }
    const visibleUpcoming = current ? upcoming : upcoming.slice(0, 2);
    if (visibleUpcoming.length) {
      html += visibleUpcoming.map((entry, index) => `
        <div class="dash-schedule-slide dash-schedule-slide-secondary" style="background:var(--surface-container-low);padding:1.5rem;border-radius:0.75rem;display:flex;flex-direction:column;justify-content:space-between;min-height:200px">
          <div>
            <p class="section-label">${current && index === 0 ? 'Up Next' : `Coming Up ${index + 1}`}</p>
            <h4 style="font-size:1.1rem;font-weight:600;margin-top:0.75rem;line-height:1.3">${entry.name}</h4>
            <p style="font-size:0.8125rem;color:var(--secondary);margin-top:0.25rem">${entry.start} - ${entry.end}</p>
          </div>
          <div>
            <div style="border-top:1px solid rgba(199,196,216,0.15);padding-top:0.75rem;margin-top:0.75rem;display:flex;align-items:center;gap:0.5rem;color:#64748b"><span class="material-symbols-outlined" style="font-size:16px">location_on</span><span style="font-size:0.75rem;font-weight:500">${entry.room || 'Room TBD'}</span></div>
            <p style="font-size:0.75rem;color:var(--on-surface-variant);margin-top:0.5rem">${Math.max(0, timeToMinutes(entry.start) - (now.getHours() * 60 + now.getMinutes()))} min until start</p>
          </div>
        </div>`).join('');
    } else {
      html += `<div class="dash-schedule-slide dash-schedule-slide-secondary" style="background:var(--surface-container-low);padding:1.5rem;border-radius:0.75rem;display:flex;align-items:center;justify-content:center;min-height:200px;color:var(--on-surface-variant);font-size:0.875rem">Last class done!</div>`;
    }
    html += '</div>';
    sc.innerHTML = html;
  }

  // Urgent assignments (top 3)
  const da = document.getElementById('dash-assignments');
  const urgent = assigns.sort((a,b) => new Date(a.due) - new Date(b.due)).slice(0, 3);
  if (urgent.length === 0) {
    da.innerHTML = '<p style="color:var(--on-surface-variant);font-size:0.875rem">No pending assignments 🎉</p>';
  } else {
    da.innerHTML = urgent.map(a => {
      const rel = getRelativeTime(a.due);
      const isOverdue = new Date(a.due) < new Date();
      const pClass = a.priority === 'high' ? 'badge-high' : a.priority === 'medium' ? 'badge-medium' : 'badge-low';
      const iconBg = a.priority === 'high' ? 'rgba(255,218,214,0.3)' : a.priority === 'medium' ? 'rgba(208,225,251,0.3)' : 'rgba(226,223,255,0.3)';
      const iconColor = a.priority === 'high' ? 'var(--error)' : a.priority === 'medium' ? 'var(--secondary)' : 'var(--primary)';
      const icon = isOverdue ? 'priority_high' : a.priority === 'high' ? 'priority_high' : 'schedule';
      return `<div class="card" style="display:flex;align-items:center;justify-content:space-between" onclick="switchTab('assignments',document.querySelectorAll('.nav-item')[1])">
        <div style="display:flex;align-items:center;gap:1rem">
          <div style="width:3rem;height:3rem;border-radius:50%;background:${iconBg};display:flex;align-items:center;justify-content:center;color:${iconColor}"><span class="material-symbols-outlined filled">${icon}</span></div>
          <div><h4 style="font-weight:600;font-size:0.9375rem">${a.title}</h4><p style="font-size:0.75rem;color:var(--secondary);margin-top:0.125rem">${rel} • ${a.subject}</p></div>
        </div>
        <span class="badge ${pClass}">${a.priority}</span>
      </div>`;
    }).join('');
  }

  // Tasks
  renderTasks();
}

// ==================== TASKS ====================
let editingTaskId = null;
function renderTasks() {
  const tasks = load(KEYS.tasks);
  const el = document.getElementById('dash-tasks');
  if (tasks.length === 0) {
    el.innerHTML = '<p style="color:var(--on-surface-variant);font-size:0.8125rem;text-align:center;padding:1rem">No tasks yet. Add one!</p>';
    return;
  }
  el.innerHTML = tasks.map(t => `
    <div class="task-row ${t.done?'done':''}">
      <button class="task-main" type="button" onclick="toggleTaskDone(${t.id})">
        <div class="task-check ${t.done?'done':''}"><span class="material-symbols-outlined" style="${t.done?'':'display:none'}">check</span></div>
        <span class="task-label">${t.text}</span>
      </button>
      <div class="task-actions">
        <button class="inline-action-btn" type="button" onclick="editTask(${t.id})" title="Edit task">
          <span class="material-symbols-outlined" style="font-size:18px">edit</span>
          <span class="delete-btn-text">Edit</span>
        </button>
      </div>
    </div>`).join('');
}
function toggleTaskDone(id) {
  const tasks = load(KEYS.tasks);
  const t = tasks.find(x => x.id === id);
  if (t) t.done = !t.done;
  save(KEYS.tasks, tasks);
  renderTasks();
}
function deleteTask(id) {
  save(KEYS.tasks, load(KEYS.tasks).filter(t => t.id !== id));
  renderTasks(); showToast('Task removed');
}
function updateTaskModal(mode = 'add') {
  document.getElementById('task-modal-title').textContent = mode === 'edit' ? 'Edit Task' : 'New Task';
  document.getElementById('task-modal-save-btn').textContent = mode === 'edit' ? 'Save Changes' : 'Add';
  document.getElementById('task-modal-delete-btn').style.display = mode === 'edit' ? 'block' : 'none';
}
function openAddTask() {
  editingTaskId = null;
  document.getElementById('inp-task-title').value = '';
  updateTaskModal('add');
  openModal('modal-task');
}
function editTask(id) {
  const task = load(KEYS.tasks).find(t => t.id === id);
  if (!task) return;
  editingTaskId = id;
  document.getElementById('inp-task-title').value = task.text || '';
  updateTaskModal('edit');
  openModal('modal-task');
}
function saveTask() {
  const text = document.getElementById('inp-task-title').value.trim();
  if (!text) return showToast('Enter a task name');
  const tasks = load(KEYS.tasks);
  if (editingTaskId) {
    const task = tasks.find(t => t.id === editingTaskId);
    if (task) task.text = text;
  } else {
    tasks.push({ id: Date.now(), text, done: false });
  }
  save(KEYS.tasks, tasks);
  editingTaskId = null;
  updateTaskModal('add');
  closeModal('modal-task'); renderTasks(); showToast('Task saved');
}
function deleteTaskFromModal() {
  if (!editingTaskId) return;
  deleteTask(editingTaskId);
  editingTaskId = null;
  updateTaskModal('add');
  closeModal('modal-task');
}

// ==================== ASSIGNMENTS ====================
let currentFilter = 'pending';
function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAssignments();
}
function renderAssignments() {
  const all = load(KEYS.assignments);
  const filtered = all.filter(a => currentFilter === 'pending' ? !a.done : a.done);
  const pending = all.filter(a => !a.done);
  document.getElementById('assign-summary').textContent = `You have ${pending.length} deadline${pending.length!==1?'s':''} remaining.`;
  const list = document.getElementById('assign-list');
  const empty = document.getElementById('assign-empty');
  if (filtered.length === 0) {
    list.style.display = 'none'; empty.style.display = 'block';
    return;
  }
  list.style.display = 'flex'; empty.style.display = 'none';
  filtered.sort((a,b) => new Date(a.due) - new Date(b.due));
  list.innerHTML = filtered.map(a => {
    const now = new Date(), due = new Date(a.due);
    const isOverdue = due < now && !a.done;
    const isToday = due.toDateString() === now.toDateString();
    const borderClass = isOverdue ? 'border-l-err' : isToday ? 'border-l-pri' : 'border-l-sec';
    const statusText = isOverdue ? 'Overdue' : isToday ? 'Due Today' : due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const statusColor = isOverdue ? 'var(--error)' : isToday ? 'var(--primary)' : 'var(--on-surface-variant)';
    const rel = getRelativeTime(a.due);
    const relIcon = isOverdue ? 'warning' : isToday ? 'schedule' : 'calendar_today';
    const pClass = a.priority === 'high' ? 'badge-high' : a.priority === 'medium' ? 'badge-medium' : 'badge-low';
    return `<div class="card ${borderClass}" style="position:relative">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.75rem">
        <span style="font-size:0.75rem;font-weight:500;text-transform:uppercase;letter-spacing:0.1em;color:${statusColor}">${statusText}</span>
        <div style="display:flex;gap:0.5rem;align-items:center">
          <span class="badge ${pClass}">${a.priority}</span>
        </div>
      </div>
      <h3 style="font-weight:600;margin-bottom:0.25rem">${a.title}</h3>
      <p style="font-size:0.875rem;color:var(--on-surface-variant);margin-bottom:1rem">${a.subject}</p>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:0.5rem;color:${statusColor}"><span class="material-symbols-outlined" style="font-size:18px">${relIcon}</span><span style="font-size:0.75rem;font-weight:600">${rel}</span></div>
        <div style="display:flex;gap:0.25rem">
          <button class="icon-btn" onclick="event.stopPropagation();toggleAssignDone(${a.id})" title="${a.done?'Undo':'Complete'}"><span class="material-symbols-outlined" style="font-size:20px;color:${a.done?'var(--error)':'var(--primary)'}">${a.done?'undo':'check_circle'}</span></button>
          <button class="icon-btn" onclick="event.stopPropagation();deleteAssignment(${a.id})" title="Delete"><span class="material-symbols-outlined" style="font-size:20px">delete</span></button>
        </div>
      </div>
    </div>`;
  }).join('');
}
function toggleAssignDone(id) {
  const all = load(KEYS.assignments);
  const a = all.find(x => x.id === id);
  if (a) a.done = !a.done;
  save(KEYS.assignments, all);
  renderAssignments(); showToast(a.done ? 'Marked complete ✓' : 'Moved to pending');
}
function deleteAssignment(id) {
  save(KEYS.assignments, load(KEYS.assignments).filter(a => a.id !== id));
  renderAssignments(); showToast('Assignment deleted');
}
function openAddAssignment() {
  ['inp-assign-title','inp-assign-subject'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('inp-assign-due').value = '';
  document.getElementById('inp-assign-priority').value = 'medium';
  openModal('modal-assignment');
}
function saveAssignment() {
  const title = document.getElementById('inp-assign-title').value.trim();
  const subject = document.getElementById('inp-assign-subject').value.trim();
  const due = document.getElementById('inp-assign-due').value;
  const priority = document.getElementById('inp-assign-priority').value;
  if (!title || !due) return showToast('Title and due date required');
  const all = load(KEYS.assignments);
  all.push({ id: Date.now(), title, subject: subject || 'General', due: new Date(due).toISOString(), priority, done: false });
  save(KEYS.assignments, all);
  closeModal('modal-assignment'); renderAssignments(); showToast('Assignment added ✓');
}

// ==================== TIMETABLE ====================
const TIMETABLE_DAYS = [
  { key: 'Monday', label: 'Mon' },
  { key: 'Tuesday', label: 'Tue' },
  { key: 'Wednesday', label: 'Wed' },
  { key: 'Thursday', label: 'Thu' },
  { key: 'Friday', label: 'Fri' },
  { key: 'Saturday', label: 'Sat' },
];
let selectedDay = 'Monday';

function updateTimetableStatusTime() {
  const statusTime = document.getElementById('tt-status-time');
  if (!statusTime) return;
  statusTime.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function timeToMinutes(value) {
  const [hours, mins] = String(value || '00:00').split(':').map(Number);
  return (hours || 0) * 60 + (mins || 0);
}
function formatMinutesLabel(totalMinutes) {
  return `${Math.max(0, totalMinutes)} min`;
}
function getSessionType(name, room) {
  const source = `${name || ''} ${room || ''}`.toLowerCase();
  if (source.includes('lab')) return 'Lab';
  if (source.includes('seminar')) return 'Seminar';
  if (source.includes('workshop')) return 'Workshop';
  return 'Lecture';
}
function getSubjectTheme(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('data structures') || lower.includes('dsa')) {
    return { accent: '#6C63FF', tagBg: 'rgba(108,99,255,0.15)', tagText: '#8B84FF', glow: 'rgba(108,99,255,0.12)' };
  }
  if (lower.includes('software engineering') || lower.includes('software eng') || lower === 'se') {
    return { accent: '#2ED8B6', tagBg: 'rgba(46,216,182,0.12)', tagText: '#2ED8B6', glow: 'rgba(46,216,182,0.12)' };
  }
  if (lower.includes('philosophy')) {
    return { accent: '#FF6B6B', tagBg: 'rgba(255,107,107,0.12)', tagText: '#FF6B6B', glow: 'rgba(255,107,107,0.12)' };
  }
  const fallbackThemes = [
    { accent: '#6C63FF', tagBg: 'rgba(108,99,255,0.15)', tagText: '#8B84FF', glow: 'rgba(108,99,255,0.12)' },
    { accent: '#2ED8B6', tagBg: 'rgba(46,216,182,0.12)', tagText: '#2ED8B6', glow: 'rgba(46,216,182,0.12)' },
    { accent: '#FF6B6B', tagBg: 'rgba(255,107,107,0.12)', tagText: '#FF6B6B', glow: 'rgba(255,107,107,0.12)' },
  ];
  const hash = Array.from(lower || 'studyhub').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return fallbackThemes[hash % fallbackThemes.length];
}
function getScheduleDisplayName(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('data structures')) return 'DSA';
  if (lower.includes('software engineering')) return 'Software Eng';
  return name;
}
function buildTimetableItems(classes) {
  const items = [];
  classes.forEach((entry, index) => {
    items.push({ type: 'class', value: entry });
    const next = classes[index + 1];
    if (!next) return;
    const gap = timeToMinutes(next.start) - timeToMinutes(entry.end);
    if (gap > 0) items.push({ type: 'free', minutes: gap });
  });
  return items;
}

function renderTimetable() {
  updateTimetableStatusTime();
  const dp = document.getElementById('day-pills');
  dp.innerHTML = TIMETABLE_DAYS.map(day =>
    `<button class="day-pill ${day.key === selectedDay ? 'active' : ''}" type="button" onclick="selectDay('${day.key}')" aria-label="${day.key} schedule">${day.label}</button>`
  ).join('');

  const tt = load(KEYS.timetable);
  const classes = (tt[selectedDay] || []).sort((a,b) => a.start.localeCompare(b.start));
  const el = document.getElementById('tt-timeline');

  if (classes.length === 0) {
    el.innerHTML = `<div class="tt-empty-day">
      <span class="material-symbols-outlined">event_available</span>
      <p>No sessions on ${escapeHtml(selectedDay)}</p>
      <p>Use this free day to review notes, prep assignments, or add a new class.</p>
    </div>`;
  } else {
    const now = new Date();
    const isToday = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()] === selectedDay;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    el.innerHTML = buildTimetableItems(classes).map(item => {
      if (item.type === 'free') {
        return `<div class="tt-free-slot">&mdash; Free slot &middot; ${formatMinutesLabel(item.minutes)} &mdash;</div>`;
      }

      const cls = item.value;
      const startMins = timeToMinutes(cls.start);
      const endMins = timeToMinutes(cls.end);
      const isCurrent = isToday && nowMins >= startMins && nowMins < endMins;
      const theme = getSubjectTheme(cls.name);
      const sessionType = getSessionType(cls.name, cls.room);
      const duration = formatMinutesLabel(endMins - startMins);
      return `<article class="tt-class-card ${isCurrent ? 'current' : ''}" style="--subject-accent:${theme.accent};--subject-glow:${theme.glow};--tag-bg:${theme.tagBg};--tag-text:${theme.tagText}">
        <div class="tt-card-grid">
          <div class="tt-time-col">
            <span class="tt-time-start">${escapeHtml(cls.start)}</span>
            <span class="tt-time-end">${escapeHtml(cls.end)}</span>
          </div>
          <div class="tt-divider" aria-hidden="true">
            <span class="tt-divider-dot"></span>
            <span class="tt-divider-line"></span>
            <span class="tt-divider-dot"></span>
          </div>
          <div class="tt-info-col">
            <h3 class="tt-subject">${escapeHtml(getScheduleDisplayName(cls.name))}</h3>
            <div class="tt-location-row">
              <span class="material-symbols-outlined">location_on</span>
              <span>${escapeHtml(cls.room || 'Room TBD')}</span>
            </div>
            <div class="tt-card-footer">
              <span class="tt-type-tag">${escapeHtml(sessionType)}</span>
              <div class="tt-card-actions">
                <button class="tt-edit-btn" type="button" onclick="editClass('${selectedDay}',${cls.id})" title="Edit lecture">
                  <span class="material-symbols-outlined">edit</span>
                  <span>Edit</span>
                </button>
                <span class="tt-duration">${escapeHtml(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      </article>`;
    }).join('');
  }
}
let editingClassState = null;
function selectDay(d) { selectedDay = d; renderTimetable(); }
function updateClassModal(mode = 'add') {
  document.getElementById('class-modal-title').textContent = mode === 'edit' ? 'Edit Lecture' : 'Add Class';
  document.getElementById('class-modal-save-btn').textContent = mode === 'edit' ? 'Save Changes' : 'Save';
  document.getElementById('class-modal-delete-btn').style.display = mode === 'edit' ? 'block' : 'none';
}
function openAddClass() {
  editingClassState = null;
  ['inp-class-name','inp-class-room'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('inp-class-start').value = ''; document.getElementById('inp-class-end').value = '';
  document.getElementById('inp-class-day').value = selectedDay;
  updateClassModal('add');
  openModal('modal-class');
}
function editClass(day, id) {
  const tt = load(KEYS.timetable);
  const cls = (tt[day] || []).find(c => c.id === id);
  if (!cls) return;
  editingClassState = { day, id };
  document.getElementById('inp-class-name').value = cls.name || '';
  document.getElementById('inp-class-room').value = cls.room || '';
  document.getElementById('inp-class-start').value = cls.start || '';
  document.getElementById('inp-class-end').value = cls.end || '';
  document.getElementById('inp-class-day').value = day;
  updateClassModal('edit');
  openModal('modal-class');
}
function saveClass() {
  const name = document.getElementById('inp-class-name').value.trim();
  const room = document.getElementById('inp-class-room').value.trim();
  const start = document.getElementById('inp-class-start').value;
  const end = document.getElementById('inp-class-end').value;
  const day = document.getElementById('inp-class-day').value;
  if (!name || !start || !end) return showToast('Fill in all fields');
  const tt = load(KEYS.timetable);
  if (!tt[day]) tt[day] = [];
  if (editingClassState) {
    const previousDay = editingClassState.day;
    const classId = editingClassState.id;
    if (tt[previousDay]) tt[previousDay] = tt[previousDay].filter(c => c.id !== classId);
    tt[day].push({ id: classId, name, room: room || 'TBD', start, end });
  } else {
    tt[day].push({ id: Date.now(), name, room: room || 'TBD', start, end });
  }
  save(KEYS.timetable, tt);
  editingClassState = null;
  updateClassModal('add');
  selectedDay = day; closeModal('modal-class'); renderTimetable(); showToast('Lecture saved');
}
function deleteClass(day, id) {
  const tt = load(KEYS.timetable);
  if (tt[day]) tt[day] = tt[day].filter(c => c.id !== id);
  save(KEYS.timetable, tt);
  renderTimetable(); showToast('Class removed');
}
function deleteClassFromModal() {
  if (!editingClassState) return;
  deleteClass(editingClassState.day, editingClassState.id);
  editingClassState = null;
  updateClassModal('add');
  closeModal('modal-class');
}

// ==================== NOTES ====================
let editingNoteId = null;

function renderNotes() {
  document.getElementById('notes-list-view').style.display = 'block';
  document.getElementById('note-editor').classList.remove('active');
  // Folders
  const folders = load(KEYS.folders);
  const notes = load(KEYS.notes);
  const fEl = document.getElementById('notes-folders');
  const colors = { blue: '#3b82f6', amber: '#d97706', indigo: '#4338ca', green: '#10b981', red: '#ef4444', purple: '#8b5cf6' };
  fEl.innerHTML = folders.map(f => {
    const count = notes.filter(n => n.folder === f.name).length;
    const bg = f.color + '15';
    return `<div class="folder-card" onclick="openFolderNotes('${f.name}')">
      <div class="folder-icon" style="background:${bg}"><span class="material-symbols-outlined filled" style="color:${f.color}">${f.icon || 'folder'}</span></div>
      <h4 style="font-weight:600;font-size:1.05rem">${f.name}</h4>
      <p style="font-size:0.75rem;color:var(--on-surface-variant)">${count} item${count!==1?'s':''}</p>
    </div>`;
  }).join('') + `<div class="folder-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed rgba(199,196,216,0.3);background:var(--surface-container-low)" onclick="openAddFolder()">
    <span class="material-symbols-outlined" style="color:#94a3b8;margin-bottom:0.25rem">create_new_folder</span>
    <span style="font-size:0.8125rem;font-weight:500;color:#64748b">New Folder</span></div>`;

  // Recent notes
  const rEl = document.getElementById('notes-recent');
  const recent = [...notes].sort((a,b) => new Date(b.created) - new Date(a.created)).slice(0, 5);
  if (recent.length === 0) {
    rEl.innerHTML = '<p style="color:var(--on-surface-variant);font-size:0.875rem;text-align:center;padding:2rem">No notes yet. Create one!</p>';
  } else {
    rEl.innerHTML = recent.map(n => `
      <div class="card" style="display:flex;align-items:center;gap:1rem" onclick="openNoteEditor(${n.id})">
        <div style="width:3.5rem;height:3.5rem;border-radius:0.5rem;background:rgba(79,70,229,0.06);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span class="material-symbols-outlined" style="color:var(--primary)">${n.photo ? 'image' : 'text_snippet'}</span>
        </div>
        <div style="flex:1;min-width:0">
          <h4 style="font-weight:600;font-size:0.9375rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.title || 'Untitled'}</h4>
          <p style="font-size:0.75rem;color:var(--on-surface-variant);margin-top:0.125rem">${timeAgo(n.created)} • ${n.folder || 'Unfiled'}</p>
        </div>
        <span class="material-symbols-outlined" style="color:#cbd5e1;font-size:20px">chevron_right</span>
      </div>`).join('');
  }
}
function openFolderNotes(folderName) {
  // Show only notes from this folder
  const notes = load(KEYS.notes).filter(n => n.folder === folderName);
  const rEl = document.getElementById('notes-recent');
  document.getElementById('notes-folders').innerHTML = `<button class="icon-btn" onclick="renderNotes()" style="margin-bottom:1rem"><span class="material-symbols-outlined">arrow_back</span></button><h2 style="font-weight:700;font-size:1.5rem;margin-bottom:1.5rem;display:inline;margin-left:0.75rem">${folderName}</h2>`;
  if (notes.length === 0) {
    rEl.innerHTML = '<div class="empty-state"><div class="icon-wrap"><span class="material-symbols-outlined" style="font-size:2rem;color:var(--primary)">note_add</span></div><p style="color:var(--on-surface-variant)">No notes in this folder</p></div>';
  } else {
    rEl.innerHTML = notes.map(n => `
      <div class="card" style="display:flex;align-items:center;gap:1rem" onclick="openNoteEditor(${n.id})">
        <div style="width:3.5rem;height:3.5rem;border-radius:0.5rem;background:rgba(79,70,229,0.06);display:flex;align-items:center;justify-content:center;flex-shrink:0"><span class="material-symbols-outlined" style="color:var(--primary)">${n.photo?'image':'text_snippet'}</span></div>
        <div style="flex:1;min-width:0"><h4 style="font-weight:600">${n.title||'Untitled'}</h4><p style="font-size:0.75rem;color:var(--on-surface-variant);margin-top:0.125rem">${timeAgo(n.created)}</p></div>
        <span class="material-symbols-outlined" style="color:#cbd5e1;font-size:20px">chevron_right</span>
      </div>`).join('');
  }
}
function openNewNote(photo) {
  editingNoteId = null;
  document.getElementById('note-title-input').value = '';
  document.getElementById('note-content-input').value = '';
  updateFolderSelect();
  document.getElementById('notes-list-view').style.display = 'none';
  document.getElementById('note-editor').classList.add('active');
  if (photo) {
    document.getElementById('note-photo-preview').style.display = 'block';
    document.getElementById('note-photo-img').src = photo;
  } else {
    document.getElementById('note-photo-preview').style.display = 'none';
  }
}
function openNoteEditor(id) {
  const notes = load(KEYS.notes);
  const n = notes.find(x => x.id === id);
  if (!n) return;
  editingNoteId = id;
  document.getElementById('note-title-input').value = n.title || '';
  document.getElementById('note-content-input').value = n.content || '';
  updateFolderSelect(n.folder);
  document.getElementById('notes-list-view').style.display = 'none';
  document.getElementById('note-editor').classList.add('active');
  if (n.photo) {
    document.getElementById('note-photo-preview').style.display = 'block';
    document.getElementById('note-photo-img').src = n.photo;
  } else {
    document.getElementById('note-photo-preview').style.display = 'none';
  }
}
function updateFolderSelect(selected) {
  const folders = load(KEYS.folders);
  const sel = document.getElementById('note-folder-select');
  sel.innerHTML = '<option value="">No folder</option>' + folders.map(f => `<option value="${f.name}" ${f.name===selected?'selected':''}>${f.name}</option>`).join('');
}
function saveCurrentNote() {
  const title = document.getElementById('note-title-input').value.trim();
  const content = document.getElementById('note-content-input').value.trim();
  const folder = document.getElementById('note-folder-select').value;
  const photoEl = document.getElementById('note-photo-img');
  const photo = document.getElementById('note-photo-preview').style.display !== 'none' ? photoEl.src : null;
  if (!title && !content) return showToast('Add a title or content');
  const notes = load(KEYS.notes);
  if (editingNoteId) {
    const n = notes.find(x => x.id === editingNoteId);
    if (n) { n.title = title || 'Untitled'; n.content = content; n.folder = folder; n.photo = photo; n.created = new Date().toISOString(); }
  } else {
    notes.push({ id: Date.now(), title: title || 'Untitled', content, folder, created: new Date().toISOString(), photo });
  }
  save(KEYS.notes, notes);
  closeNoteEditor(); showToast('Note saved ✓');
}
function deleteCurrentNote() {
  if (!editingNoteId) { closeNoteEditor(); return; }
  save(KEYS.notes, load(KEYS.notes).filter(n => n.id !== editingNoteId));
  closeNoteEditor(); showToast('Note deleted');
}
function closeNoteEditor() {
  editingNoteId = null;
  document.getElementById('note-editor').classList.remove('active');
  document.getElementById('notes-list-view').style.display = 'block';
  renderNotes();
}
function openAddFolder() {
  document.getElementById('inp-folder-name').value = '';
  openModal('modal-folder');
}
function saveFolder() {
  const name = document.getElementById('inp-folder-name').value.trim();
  if (!name) return showToast('Enter a folder name');
  const folders = load(KEYS.folders);
  if (folders.find(f => f.name === name)) return showToast('Folder already exists');
  const icons = ['folder','book','science','code','music_note','brush','calculate'];
  const clrs = ['#3b82f6','#10b981','#8b5cf6','#ef4444','#d97706','#06b6d4'];
  folders.push({ id: Date.now(), name, icon: icons[Math.floor(Math.random()*icons.length)], color: clrs[Math.floor(Math.random()*clrs.length)] });
  save(KEYS.folders, folders);
  closeModal('modal-folder'); renderNotes(); showToast('Folder created ✓');
}

// Camera
function capturePhoto() { document.getElementById('camera-input').click(); }
document.getElementById('camera-input').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => openNewNote(ev.target.result);
  reader.readAsDataURL(file);
  e.target.value = '';
});

let currentFolderId = null;
let pendingUploadFolderId = null;
let filesDbPromise = null;
let editingFolderId = null;
let editingLibraryItemId = null;
let notificationCheckInterval = null;

function isNoteItem(item) {
  return (item.type || 'note') === 'note';
}
function getFolderById(id, folders = load(KEYS.folders)) {
  const folderId = parseNullableId(id);
  return folders.find(folder => folder.id === folderId) || null;
}
function getChildFolders(parentId = null, folders = load(KEYS.folders)) {
  const normalizedParentId = parseNullableId(parentId);
  return folders
    .filter(folder => parseNullableId(folder.parentId) === normalizedParentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}
function getFolderTrail(folderId, folders = load(KEYS.folders)) {
  const trail = [];
  const seen = new Set();
  let current = getFolderById(folderId, folders);
  while (current && !seen.has(current.id)) {
    trail.unshift(current);
    seen.add(current.id);
    current = getFolderById(current.parentId, folders);
  }
  return trail;
}
function getFolderPathLabel(folderId, folders = load(KEYS.folders)) {
  const trail = getFolderTrail(folderId, folders);
  return trail.length ? trail.map(folder => folder.name).join(' / ') : 'Unfiled';
}
function flattenFolders(parentId = null, folders = load(KEYS.folders), depth = 0, seen = new Set()) {
  return getChildFolders(parentId, folders).flatMap(folder => {
    if (seen.has(folder.id)) return [];
    const nextSeen = new Set(seen);
    nextSeen.add(folder.id);
    return [{ folder, depth }, ...flattenFolders(folder.id, folders, depth + 1, nextSeen)];
  });
}
function getFolderSummary(folderId, folders, items) {
  const subfolders = folders.filter(folder => parseNullableId(folder.parentId) === folderId).length;
  const directItems = items.filter(item => parseNullableId(item.folderId) === folderId).length;
  const parts = [];
  if (subfolders) parts.push(`${subfolders} subfolder${subfolders !== 1 ? 's' : ''}`);
  if (directItems || !subfolders) parts.push(`${directItems} item${directItems !== 1 ? 's' : ''}`);
  return parts.join(' / ');
}
function getItemTypeLabel(item) {
  if (!isNoteItem(item)) {
    if (String(item.mimeType).startsWith('image/')) return 'Photo';
    if (String(item.mimeType).includes('pdf')) return 'PDF';
    return 'File';
  }
  return item.photo ? 'Photo note' : 'Note';
}
function getItemIcon(item) {
  if (!isNoteItem(item)) {
    if (String(item.mimeType).startsWith('image/')) return 'image';
    if (String(item.mimeType).includes('pdf')) return 'picture_as_pdf';
    return 'draft';
  }
  return item.photo ? 'image' : 'text_snippet';
}
function getItemIconColor(item) {
  if (!isNoteItem(item) && String(item.mimeType).includes('pdf')) return '#dc2626';
  if (!isNoteItem(item) && String(item.mimeType).startsWith('image/')) return '#0f766e';
  return 'var(--primary)';
}
function getItemAccent(item) {
  if (!isNoteItem(item) && String(item.mimeType).startsWith('image/')) return 'rgba(15,118,110,0.12)';
  if (!isNoteItem(item) && String(item.mimeType).includes('pdf')) return 'rgba(220,38,38,0.08)';
  return 'rgba(79,70,229,0.06)';
}
function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function sortByNewest(items) {
  return [...items].sort((a, b) => new Date(b.created) - new Date(a.created));
}
function renderBreadcrumb(currentFolder, folders) {
  const breadcrumb = document.getElementById('notes-breadcrumb');
  const backButton = document.getElementById('notes-back-btn');
  if (!currentFolder) {
    breadcrumb.style.display = 'none';
    breadcrumb.innerHTML = '';
    backButton.style.display = 'none';
    return;
  }
  const trail = [{ id: null, name: 'Vault' }, ...getFolderTrail(currentFolder.id, folders)];
  breadcrumb.innerHTML = trail.map((folder, index) => `
    <button class="notes-crumb ${index === trail.length - 1 ? 'active' : ''}" type="button" onclick="${folder.id === null ? 'openRootFolder()' : `openFolder(${folder.id})`}">${escapeHtml(folder.name)}</button>
  `).join('<span class="material-symbols-outlined" style="font-size:16px;color:#94a3b8">chevron_right</span>');
  breadcrumb.style.display = 'flex';
  backButton.style.display = 'inline-flex';
}
function renderFolderCards(folders, items) {
  const el = document.getElementById('notes-folders');
  const visibleFolders = getChildFolders(currentFolderId, folders);
  el.innerHTML = visibleFolders.map(folder => {
    const bg = `${folder.color || '#3b82f6'}15`;
    const parentPath = currentFolderId !== null ? getFolderPathLabel(folder.parentId, folders) : '';
    return `<div class="folder-card" onclick="openFolder(${folder.id})">
      <div class="folder-card-top">
        <div class="folder-icon" style="background:${bg}"><span class="material-symbols-outlined filled" style="color:${folder.color}">${folder.icon || 'folder'}</span></div>
        <div class="folder-card-actions">
          <button class="folder-card-action" type="button" onclick="event.stopPropagation();openEditFolder(${folder.id})" title="Rename or move folder">
            <span class="material-symbols-outlined" style="font-size:18px">drive_file_rename_outline</span>
          </button>
          <button class="folder-card-action folder-card-delete" type="button" onclick="event.stopPropagation();confirmDeleteFolder(${folder.id})" title="Delete folder">
            <span class="material-symbols-outlined" style="font-size:18px">delete</span>
          </button>
        </div>
      </div>
      <h4 style="font-weight:600;font-size:1.05rem">${escapeHtml(folder.name)}</h4>
      <p class="folder-card-meta">${escapeHtml(getFolderSummary(folder.id, folders, items))}</p>
      ${parentPath ? `<p class="folder-card-path">${escapeHtml(parentPath)}</p>` : ''}
    </div>`;
  }).join('') + `<div class="folder-card folder-card-add" onclick="openAddFolder()">
    <span class="material-symbols-outlined" style="color:#94a3b8;margin-bottom:0.25rem">create_new_folder</span>
    <span style="font-size:0.8125rem;font-weight:600;color:#64748b">${currentFolderId === null ? 'New Folder' : 'New Subfolder'}</span>
  </div>`;
}
function renderItemCards(items, folders, options = {}) {
  const el = document.getElementById('notes-recent');
  if (items.length === 0) {
    el.innerHTML = `<div class="empty-state">
      <div class="icon-wrap"><span class="material-symbols-outlined" style="font-size:2rem;color:var(--primary)">${options.emptyIcon || 'note_add'}</span></div>
      <p style="font-weight:600">${escapeHtml(options.emptyTitle || 'Nothing here yet')}</p>
      <p style="color:var(--on-surface-variant);margin-top:0.35rem">${escapeHtml(options.emptyText || 'Create a note or upload a file to begin.')}</p>
    </div>`;
    return;
  }
  el.innerHTML = items.map(item => {
    const metaParts = [timeAgo(item.created), getItemTypeLabel(item)];
    if (!isNoteItem(item)) metaParts.push(formatBytes(item.size));
    if (options.showFolderPath) metaParts.push(getFolderPathLabel(item.folderId, folders));
    return `<div class="card library-card" onclick="openLibraryItem(${item.id})">
      <div class="library-icon" style="background:${getItemAccent(item)}">
        <span class="material-symbols-outlined" style="color:${getItemIconColor(item)}">${getItemIcon(item)}</span>
      </div>
      <div class="library-body">
        <div class="library-title-row">
          <h4 class="library-title">${escapeHtml(item.title || 'Untitled')}</h4>
          <div class="library-actions">
            <span class="library-label">${escapeHtml(getItemTypeLabel(item))}</span>
            <button class="library-manage-btn" type="button" onclick="event.stopPropagation();openLibraryItemManager(${item.id})" title="Rename or move">
              <span class="material-symbols-outlined" style="font-size:18px">drive_file_rename_outline</span>
            </button>
          </div>
        </div>
        <p class="library-meta">${escapeHtml(metaParts.join(' / '))}</p>
      </div>
      <span class="material-symbols-outlined" style="color:#cbd5e1;font-size:20px">chevron_right</span>
    </div>`;
  }).join('');
}
async function openFilesDb() {
  if (!('indexedDB' in window)) throw new Error('IndexedDB unavailable');
  if (!filesDbPromise) {
    filesDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(FILE_DB.name, FILE_DB.version);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(FILE_DB.store)) {
          db.createObjectStore(FILE_DB.store, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open file storage'));
    });
  }
  return filesDbPromise;
}
async function saveStoredFile(id, blob) {
  const db = await openFilesDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_DB.store, 'readwrite');
    tx.objectStore(FILE_DB.store).put({ id, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Could not save file'));
  });
}
async function getStoredFile(id) {
  const db = await openFilesDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_DB.store, 'readonly');
    const request = tx.objectStore(FILE_DB.store).get(id);
    request.onsuccess = () => resolve(request.result ? request.result.blob : null);
    request.onerror = () => reject(request.error || new Error('Could not load file'));
  });
}
async function deleteStoredFile(id) {
  if (!id) return;
  try {
    const db = await openFilesDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_DB.store, 'readwrite');
      tx.objectStore(FILE_DB.store).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Could not delete file'));
    });
  } catch {
    return null;
  }
}
async function clearStoredFiles() {
  try {
    const db = await openFilesDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_DB.store, 'readwrite');
      tx.objectStore(FILE_DB.store).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Could not clear files'));
    });
  } catch {
    return null;
  }
}
async function saveUploadedFiles(files, folderId) {
  const items = load(KEYS.notes);
  let savedCount = 0;
  let skippedCount = 0;
  for (const file of files) {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isImage && !isPdf) {
      skippedCount++;
      continue;
    }
    if (file.size > MAX_LIBRARY_FILE_SIZE) {
      skippedCount++;
      continue;
    }
    const itemId = createId(savedCount + 900);
    const storageId = `file_${itemId}`;
    await saveStoredFile(storageId, file);
    items.push({
      id: itemId,
      type: 'file',
      title: file.name,
      folderId: parseNullableId(folderId),
      created: new Date().toISOString(),
      mimeType: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
      size: file.size,
      storageId,
    });
    savedCount++;
  }
  if (savedCount) save(KEYS.notes, items);
  return { savedCount, skippedCount };
}
function renderNotes() {
  const folders = load(KEYS.folders);
  const items = load(KEYS.notes);
  if (currentFolderId !== null && !getFolderById(currentFolderId, folders)) currentFolderId = null;
  const currentFolder = getFolderById(currentFolderId, folders);
  const editFolderBtn = document.getElementById('notes-edit-folder-btn');
  const deleteFolderBtn = document.getElementById('notes-delete-folder-btn');
  document.getElementById('notes-list-view').style.display = 'block';
  document.getElementById('note-editor').classList.remove('active');
  document.getElementById('notes-page-title').textContent = currentFolder ? currentFolder.name : 'Notes Vault';
  document.getElementById('notes-page-subtitle').textContent = currentFolder
    ? 'Keep notes, PDFs, photos, and subfolders together.'
    : 'Capture, store, and revisit your learning.';
  document.getElementById('folders-section-title').textContent = currentFolder ? 'Subfolders' : 'Folders';
  document.getElementById('items-section-title').textContent = currentFolder ? 'Items in this folder' : 'Recent Items';
  editFolderBtn.style.display = currentFolder ? 'inline-flex' : 'none';
  deleteFolderBtn.style.display = currentFolder ? 'inline-flex' : 'none';
  renderBreadcrumb(currentFolder, folders);
  renderFolderCards(folders, items);
  const visibleItems = currentFolder
    ? sortByNewest(items.filter(item => parseNullableId(item.folderId) === currentFolder.id))
    : sortByNewest(items).slice(0, 8);
  renderItemCards(visibleItems, folders, {
    emptyIcon: currentFolder ? 'folder_open' : 'note_add',
    emptyTitle: currentFolder ? 'Folder is empty' : 'Nothing here yet',
    emptyText: currentFolder
      ? 'Add a note, upload a PDF/photo, or create a subfolder.'
      : 'Create a note or upload a PDF/photo to get started.',
    showFolderPath: !currentFolder,
  });
}
function openRootFolder() {
  currentFolderId = null;
  renderNotes();
}
function openFolder(folderId) {
  currentFolderId = parseNullableId(folderId);
  renderNotes();
}
function goToParentFolder() {
  const currentFolder = getFolderById(currentFolderId);
  currentFolderId = currentFolder ? parseNullableId(currentFolder.parentId) : null;
  renderNotes();
}
function openFileUpload() {
  pendingUploadFolderId = currentFolderId;
  document.getElementById('library-file-input').click();
}
async function openLibraryItem(id) {
  const items = load(KEYS.notes);
  const item = items.find(entry => entry.id === id);
  if (!item) return;
  if (isNoteItem(item)) return openNoteEditor(id);
  try {
    const blob = await getStoredFile(item.storageId);
    if (!blob) return showToast('This file is missing');
    const url = URL.createObjectURL(blob);
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    showToast('Could not open file');
  }
}
function openNewNote(photo) {
  editingNoteId = null;
  document.getElementById('note-title-input').value = '';
  document.getElementById('note-content-input').value = '';
  updateFolderSelect(currentFolderId);
  document.getElementById('notes-list-view').style.display = 'none';
  document.getElementById('note-editor').classList.add('active');
  if (photo) {
    document.getElementById('note-photo-preview').style.display = 'block';
    document.getElementById('note-photo-img').src = photo;
  } else {
    document.getElementById('note-photo-preview').style.display = 'none';
    document.getElementById('note-photo-img').src = '';
  }
}
function openNoteEditor(id) {
  const items = load(KEYS.notes);
  const note = items.find(entry => entry.id === id && isNoteItem(entry));
  if (!note) return;
  editingNoteId = id;
  document.getElementById('note-title-input').value = note.title || '';
  document.getElementById('note-content-input').value = note.content || '';
  updateFolderSelect(note.folderId);
  document.getElementById('notes-list-view').style.display = 'none';
  document.getElementById('note-editor').classList.add('active');
  if (note.photo) {
    document.getElementById('note-photo-preview').style.display = 'block';
    document.getElementById('note-photo-img').src = note.photo;
  } else {
    document.getElementById('note-photo-preview').style.display = 'none';
    document.getElementById('note-photo-img').src = '';
  }
}
function updateFolderSelect(selected) {
  const folders = load(KEYS.folders);
  const selectedId = parseNullableId(selected);
  const sel = document.getElementById('note-folder-select');
  sel.innerHTML = '<option value="">No folder</option>' + flattenFolders(null, folders).map(({ folder, depth }) => {
    const prefix = '&nbsp;'.repeat(depth * 4);
    return `<option value="${folder.id}" ${folder.id === selectedId ? 'selected' : ''}>${prefix}${escapeHtml(folder.name)}</option>`;
  }).join('');
}
function saveCurrentNote() {
  const title = document.getElementById('note-title-input').value.trim();
  const content = document.getElementById('note-content-input').value.trim();
  const folderId = parseNullableId(document.getElementById('note-folder-select').value);
  const photoEl = document.getElementById('note-photo-img');
  const photo = document.getElementById('note-photo-preview').style.display !== 'none' ? photoEl.src : null;
  if (!title && !content && !photo) return showToast('Add a title, content, or photo');
  const items = load(KEYS.notes);
  if (editingNoteId) {
    const note = items.find(entry => entry.id === editingNoteId && isNoteItem(entry));
    if (note) {
      note.title = title || 'Untitled';
      note.content = content;
      note.folderId = folderId;
      note.photo = photo;
      note.created = new Date().toISOString();
    }
  } else {
    items.push({ id: createId(1200), type: 'note', title: title || 'Untitled', content, folderId, created: new Date().toISOString(), photo });
  }
  save(KEYS.notes, items);
  closeNoteEditor();
  showToast('Note saved');
}
function deleteCurrentNote() {
  if (!editingNoteId) { closeNoteEditor(); return; }
  save(KEYS.notes, load(KEYS.notes).filter(entry => entry.id !== editingNoteId));
  closeNoteEditor();
  showToast('Note deleted');
}
function closeNoteEditor() {
  editingNoteId = null;
  document.getElementById('note-editor').classList.remove('active');
  document.getElementById('notes-list-view').style.display = 'block';
  renderNotes();
}
function updateFolderModal(mode = 'add') {
  document.getElementById('folder-modal-title').textContent = mode === 'edit' ? 'Rename & Move Folder' : 'New Folder';
  document.getElementById('folder-modal-save-btn').textContent = mode === 'edit' ? 'Save Changes' : 'Create';
  document.getElementById('folder-modal-delete-btn').style.display = mode === 'edit' ? 'block' : 'none';
}
function populateFolderParentOptions(selectedParentId = currentFolderId, excludeFolderId = null) {
  const folders = load(KEYS.folders);
  const selectedId = parseNullableId(selectedParentId);
  const excludedIds = excludeFolderId === null ? new Set() : new Set(getFolderDescendantIds(excludeFolderId, folders));
  const parentSelect = document.getElementById('inp-folder-parent');
  parentSelect.innerHTML = '<option value="">Top level</option>' + flattenFolders(null, folders)
    .filter(({ folder }) => !excludedIds.has(folder.id))
    .map(({ folder, depth }) => {
    const prefix = '&nbsp;'.repeat(depth * 4);
    return `<option value="${folder.id}" ${folder.id === selectedId ? 'selected' : ''}>${prefix}${escapeHtml(folder.name)}</option>`;
  }).join('');
}
function openAddFolder(parentId = currentFolderId) {
  editingFolderId = null;
  document.getElementById('inp-folder-name').value = '';
  populateFolderParentOptions(parentId, null);
  updateFolderModal('add');
  openModal('modal-folder');
}
function openEditFolder(folderId = currentFolderId) {
  const folder = getFolderById(folderId);
  if (!folder) return;
  editingFolderId = folder.id;
  document.getElementById('inp-folder-name').value = folder.name || '';
  populateFolderParentOptions(folder.parentId, folder.id);
  updateFolderModal('edit');
  openModal('modal-folder');
}
function getFolderDescendantIds(folderId, folders = load(KEYS.folders), seen = new Set()) {
  const normalizedId = parseNullableId(folderId);
  if (normalizedId === null || seen.has(normalizedId)) return [];
  seen.add(normalizedId);
  const childIds = folders
    .filter(folder => parseNullableId(folder.parentId) === normalizedId)
    .map(folder => folder.id);
  return [normalizedId, ...childIds.flatMap(childId => getFolderDescendantIds(childId, folders, seen))];
}
function getFolderDeleteSummary(folderId, folders = load(KEYS.folders), items = load(KEYS.notes)) {
  const folder = getFolderById(folderId, folders);
  if (!folder) return null;
  const allFolderIds = getFolderDescendantIds(folder.id, folders);
  const folderIdSet = new Set(allFolderIds);
  const subfolderCount = Math.max(0, allFolderIds.length - 1);
  const itemCount = items.filter(item => folderIdSet.has(parseNullableId(item.folderId))).length;
  return { folder, allFolderIds, folderIdSet, subfolderCount, itemCount };
}
async function deleteFolder(folderId) {
  const folders = load(KEYS.folders);
  const items = load(KEYS.notes);
  const summary = getFolderDeleteSummary(folderId, folders, items);
  if (!summary) return;
  const removedItems = items.filter(item => summary.folderIdSet.has(parseNullableId(item.folderId)));
  await Promise.all(removedItems
    .filter(item => !isNoteItem(item) && item.storageId)
    .map(item => deleteStoredFile(item.storageId)));
  save(KEYS.folders, folders.filter(folder => !summary.folderIdSet.has(folder.id)));
  save(KEYS.notes, items.filter(item => !summary.folderIdSet.has(parseNullableId(item.folderId))));
  if (currentFolderId !== null && summary.folderIdSet.has(currentFolderId)) {
    currentFolderId = parseNullableId(summary.folder.parentId);
  }
  renderNotes();
  renderProfile();
  const folderLabel = summary.allFolderIds.length === 1 ? 'folder' : 'folders';
  const itemLabel = removedItems.length === 1 ? 'item' : 'items';
  showToast(`Deleted ${summary.allFolderIds.length} ${folderLabel} and ${removedItems.length} ${itemLabel}`);
}
async function confirmDeleteFolder(folderId = currentFolderId) {
  const summary = getFolderDeleteSummary(folderId);
  if (!summary) return;
  const details = [];
  if (summary.subfolderCount) details.push(`${summary.subfolderCount} subfolder${summary.subfolderCount !== 1 ? 's' : ''}`);
  if (summary.itemCount) details.push(`${summary.itemCount} item${summary.itemCount !== 1 ? 's' : ''}`);
  const extra = details.length ? ` This will also delete ${details.join(' and ')} inside it.` : '';
  if (!confirm(`Delete "${summary.folder.name}"?${extra}`)) return;
  await deleteFolder(summary.folder.id);
}
async function deleteFolderFromModal() {
  if (!editingFolderId) return;
  const folderId = editingFolderId;
  editingFolderId = null;
  updateFolderModal('add');
  closeModal('modal-folder');
  await confirmDeleteFolder(folderId);
}
function saveFolder() {
  const name = document.getElementById('inp-folder-name').value.trim();
  const parentId = parseNullableId(document.getElementById('inp-folder-parent').value);
  if (!name) return showToast('Enter a folder name');
  const folders = load(KEYS.folders);
  const isEditingFolder = editingFolderId !== null;
  if (folders.find(folder => folder.id !== editingFolderId && folder.name.toLowerCase() === name.toLowerCase() && parseNullableId(folder.parentId) === parentId)) {
    return showToast('Folder already exists here');
  }
  if (isEditingFolder) {
    const folder = folders.find(entry => entry.id === editingFolderId);
    if (!folder) return;
    folder.name = name;
    folder.parentId = parentId;
  } else {
    const icons = ['folder','book','science','code','music_note','brush','calculate'];
    const clrs = ['#3b82f6','#10b981','#8b5cf6','#ef4444','#d97706','#06b6d4'];
    folders.push({
      id: createId(1500),
      name,
      parentId,
      icon: icons[Math.floor(Math.random() * icons.length)],
      color: clrs[Math.floor(Math.random() * clrs.length)],
    });
    currentFolderId = parentId;
  }
  save(KEYS.folders, folders);
  editingFolderId = null;
  updateFolderModal('add');
  closeModal('modal-folder');
  renderNotes();
  showToast(isEditingFolder ? 'Folder updated' : parentId === null ? 'Folder created' : 'Subfolder created');
}
function populateItemFolderOptions(selectedFolderId = null) {
  const folders = load(KEYS.folders);
  const selectedId = parseNullableId(selectedFolderId);
  const select = document.getElementById('inp-item-folder');
  select.innerHTML = '<option value="">No folder</option>' + flattenFolders(null, folders).map(({ folder, depth }) => {
    const prefix = '&nbsp;'.repeat(depth * 4);
    return `<option value="${folder.id}" ${folder.id === selectedId ? 'selected' : ''}>${prefix}${escapeHtml(folder.name)}</option>`;
  }).join('');
}
function openLibraryItemManager(itemId) {
  const items = load(KEYS.notes);
  const item = items.find(entry => entry.id === itemId);
  if (!item) return;
  editingLibraryItemId = item.id;
  document.getElementById('item-modal-title').textContent = isNoteItem(item) ? 'Rename & Move Note' : 'Rename & Move File';
  document.getElementById('inp-item-title').value = item.title || '';
  populateItemFolderOptions(item.folderId);
  openModal('modal-item');
}
function saveLibraryItemChanges() {
  if (!editingLibraryItemId) return;
  const title = document.getElementById('inp-item-title').value.trim();
  const folderId = parseNullableId(document.getElementById('inp-item-folder').value);
  if (!title) return showToast('Enter a title');
  const items = load(KEYS.notes);
  const item = items.find(entry => entry.id === editingLibraryItemId);
  if (!item) return;
  item.title = title;
  item.folderId = folderId;
  if (!isNoteItem(item) && !item.mimeType && /\.pdf$/i.test(title)) item.mimeType = 'application/pdf';
  save(KEYS.notes, items);
  editingLibraryItemId = null;
  closeModal('modal-item');
  renderNotes();
  showToast('Item updated');
}
document.getElementById('library-file-input').addEventListener('change', async function(e) {
  const files = Array.from(e.target.files || []);
  const targetFolderId = pendingUploadFolderId;
  pendingUploadFolderId = null;
  if (!files.length) return;
  try {
    const { savedCount, skippedCount } = await saveUploadedFiles(files, targetFolderId);
    if (savedCount) {
      renderNotes();
      showToast(skippedCount ? `${savedCount} saved, ${skippedCount} skipped` : `${savedCount} file${savedCount !== 1 ? 's' : ''} saved`);
    } else {
      showToast('Only PDFs and photos up to 15MB are supported');
    }
  } catch (error) {
    showToast(error && error.name === 'QuotaExceededError' ? 'Storage full. Try a smaller file.' : 'Could not save file');
  } finally {
    e.target.value = '';
  }
});

// ==================== HELPERS ====================
function getTodayClasses() {
  const day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  const tt = load(KEYS.timetable);
  return (tt[day] || []).sort((a,b) => a.start.localeCompare(b.start));
}
function getCurrentClass(classes) {
  const now = new Date(), mins = now.getHours()*60 + now.getMinutes();
  return classes.find(c => {
    const [sh,sm] = c.start.split(':').map(Number);
    const [eh,em] = c.end.split(':').map(Number);
    return mins >= sh*60+sm && mins <= eh*60+em;
  });
}
function getNextClass(classes) {
  const now = new Date(), mins = now.getHours()*60 + now.getMinutes();
  return classes.find(c => {
    const [sh,sm] = c.start.split(':').map(Number);
    return sh*60+sm > mins;
  });
}
function getUpcomingClasses(classes, limit = 2) {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return classes.filter(c => timeToMinutes(c.start) > mins).slice(0, limit);
}
function getClassProgress(c) {
  const now = new Date(), mins = now.getHours()*60 + now.getMinutes();
  const [sh,sm] = c.start.split(':').map(Number);
  const [eh,em] = c.end.split(':').map(Number);
  return Math.round(((mins - (sh*60+sm)) / ((eh*60+em) - (sh*60+sm))) * 100);
}
function getRelativeTime(dateStr) {
  const now = new Date(), d = new Date(dateStr), diff = d - now;
  const absDiff = Math.abs(diff), mins = Math.floor(absDiff/60000), hrs = Math.floor(mins/60), days = Math.floor(hrs/24);
  if (diff < 0) { return days > 0 ? `${days}d late` : hrs > 0 ? `${hrs}h late` : `${mins}m late`; }
  if (days > 0) return `in ${days} day${days>1?'s':''}`;
  if (hrs > 0) return `in ${hrs}h`;
  return `in ${mins}m`;
}
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff/60000), hrs = Math.floor(mins/60), days = Math.floor(hrs/24);
  if (days > 0) return days === 1 ? 'Yesterday' : `${days} days ago`;
  if (hrs > 0) return `${hrs}h ago`;
  return `${mins}m ago`;
}

// ==================== NOTIFICATIONS ====================
function hasNotificationSupport() {
  return typeof Notification !== 'undefined';
}
function getNotificationPermissionLabel() {
  if (!hasNotificationSupport()) return 'Notifications not supported on this device';
  if (Notification.permission === 'granted') return 'Enabled for this browser';
  if (Notification.permission === 'denied') return 'Blocked in browser settings';
  return 'Not enabled';
}
function getNotificationDayName(date) {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
}
function getUpcomingClassEntries(limit = 4) {
  const timetable = load(KEYS.timetable);
  const now = new Date();
  const entries = [];
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() + dayOffset);
    const dayName = getNotificationDayName(date);
    (timetable[dayName] || []).forEach(cls => {
      const eventDate = new Date(date);
      const [hours, minutes] = String(cls.start || '00:00').split(':').map(Number);
      eventDate.setHours(hours || 0, minutes || 0, 0, 0);
      if (eventDate < now) return;
      entries.push({
        type: 'class',
        id: cls.id,
        className: cls.name,
        room: cls.room || 'Room TBD',
        startsAt: eventDate,
        minutesUntil: Math.round((eventDate - now) / 60000),
        tag: `class-${cls.id}-${eventDate.toISOString().slice(0, 16)}`,
      });
    });
  }
  return entries.sort((a, b) => a.startsAt - b.startsAt).slice(0, limit);
}
function getUpcomingAssignmentEntries(limit = 4) {
  const now = new Date();
  return load(KEYS.assignments)
    .filter(entry => !entry.done && entry.due)
    .map(entry => {
      const dueAt = new Date(entry.due);
      return {
        type: 'assignment',
        id: entry.id,
        title: entry.title,
        subject: entry.subject || 'General',
        dueAt,
        minutesUntil: Math.round((dueAt - now) / 60000),
        tag: `assignment-${entry.id}-${dueAt.toISOString().slice(0, 16)}`,
      };
    })
    .sort((a, b) => a.dueAt - b.dueAt)
    .slice(0, limit);
}
function getNotificationPreviewEntries(limit = 6) {
  return [
    ...getUpcomingClassEntries(limit),
    ...getUpcomingAssignmentEntries(limit),
  ]
    .sort((a, b) => (a.startsAt || a.dueAt) - (b.startsAt || b.dueAt))
    .slice(0, limit);
}
async function showSystemNotification(title, options = {}) {
  if (!hasNotificationSupport() || Notification.permission !== 'granted') return false;
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
    return true;
  } catch {
    try {
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
}
function pruneSentNotifications(sent = {}) {
  const cutoff = Date.now() - (14 * 24 * 60 * 60 * 1000);
  return Object.fromEntries(Object.entries(sent).filter(([, timestamp]) => Number(timestamp) >= cutoff));
}
function markNotificationSent(key) {
  const prefs = getNotificationPrefs();
  const sent = pruneSentNotifications({ ...(prefs.sent || {}), [key]: Date.now() });
  save(KEYS.notifications, { ...prefs, sent });
}
function wasNotificationSent(key) {
  const prefs = getNotificationPrefs();
  return Boolean(prefs.sent && prefs.sent[key]);
}
function renderNotificationsModal() {
  const prefs = getNotificationPrefs();
  const permissionStatus = document.getElementById('notif-permission-status');
  const enableBtn = document.getElementById('notif-enable-btn');
  const previewList = document.getElementById('notif-preview-list');
  const permission = hasNotificationSupport() ? Notification.permission : 'unsupported';
  permissionStatus.textContent = getNotificationPermissionLabel();
  enableBtn.textContent = permission === 'granted' ? 'Enabled' : 'Enable';
  enableBtn.disabled = permission === 'granted' || permission === 'unsupported';
  enableBtn.style.opacity = permission === 'granted' || permission === 'unsupported' ? '0.7' : '1';
  document.getElementById('notif-classes-toggle').classList.toggle('active', prefs.classes);
  document.getElementById('notif-assignments-toggle').classList.toggle('active', prefs.assignments);
  const entries = getNotificationPreviewEntries();
  if (!entries.length) {
    previewList.innerHTML = '<div class="notif-preview-card"><p style="font-weight:600">No upcoming alerts</p><p style="font-size:0.75rem;color:var(--on-surface-variant);margin-top:0.25rem">You are all caught up right now.</p></div>';
    return;
  }
  previewList.innerHTML = entries.map(entry => {
    if (entry.type === 'class') {
      return `<div class="notif-preview-card">
        <p style="font-weight:600">${escapeHtml(entry.className)}</p>
        <p style="font-size:0.75rem;color:var(--on-surface-variant);margin-top:0.2rem">${entry.room} • starts in ${Math.max(0, entry.minutesUntil)} min</p>
      </div>`;
    }
    const dueLabel = entry.minutesUntil >= 0 ? `due in ${entry.minutesUntil} min` : `${Math.abs(entry.minutesUntil)} min overdue`;
    return `<div class="notif-preview-card">
      <p style="font-weight:600">${escapeHtml(entry.title)}</p>
      <p style="font-size:0.75rem;color:var(--on-surface-variant);margin-top:0.2rem">${escapeHtml(entry.subject)} • ${escapeHtml(dueLabel)}</p>
    </div>`;
  }).join('');
}
function openNotificationsModal() {
  renderNotificationsModal();
  openModal('modal-notifications');
}
async function requestNotificationPermission() {
  if (!hasNotificationSupport()) return showToast('Notifications are not supported here');
  const permission = await Notification.requestPermission();
  renderNotificationsModal();
  if (permission === 'granted') {
    showToast('Notifications enabled');
    await showSystemNotification('StudyHub notifications are on', { body: 'You will now get class and deadline reminders.' });
  } else if (permission === 'denied') {
    showToast('Notifications blocked by browser');
  } else {
    showToast('Notification permission not granted');
  }
}
function toggleNotificationSetting(type) {
  const prefs = getNotificationPrefs();
  if (!(type in prefs)) return;
  save(KEYS.notifications, { ...prefs, [type]: !prefs[type], sent: pruneSentNotifications(prefs.sent || {}) });
  renderNotificationsModal();
  showToast(`${type === 'classes' ? 'Class' : 'Assignment'} reminders ${prefs[type] ? 'off' : 'on'}`);
}
async function sendTestNotification() {
  if (!hasNotificationSupport()) return showToast('Notifications are not supported here');
  if (Notification.permission !== 'granted') return requestNotificationPermission();
  const sent = await showSystemNotification('StudyHub test notification', {
    body: 'Your reminders are working.',
    tag: 'studyhub-test',
  });
  if (sent) showToast('Test notification sent');
}
async function checkScheduledNotifications() {
  if (!hasNotificationSupport() || Notification.permission !== 'granted') return;
  const prefs = getNotificationPrefs();
  const classEntries = prefs.classes ? getUpcomingClassEntries(8).filter(entry => entry.minutesUntil >= 0 && entry.minutesUntil <= 15) : [];
  for (const entry of classEntries) {
    const key = `${entry.tag}-reminder`;
    if (wasNotificationSent(key)) continue;
    const sent = await showSystemNotification(`${entry.className} starts soon`, {
      body: `${entry.room} • starts in ${entry.minutesUntil} min`,
      tag: key,
    });
    if (sent) markNotificationSent(key);
  }
  const assignmentEntries = prefs.assignments ? getUpcomingAssignmentEntries(12) : [];
  for (const entry of assignmentEntries) {
    const soonKey = `${entry.tag}-soon`;
    const overdueKey = `${entry.tag}-overdue`;
    if (entry.minutesUntil >= 0 && entry.minutesUntil <= 60 && !wasNotificationSent(soonKey)) {
      const sent = await showSystemNotification(`${entry.title} is due soon`, {
        body: `${entry.subject} • due in ${entry.minutesUntil} min`,
        tag: soonKey,
      });
      if (sent) markNotificationSent(soonKey);
    }
    if (entry.minutesUntil < 0 && !wasNotificationSent(overdueKey)) {
      const sent = await showSystemNotification(`${entry.title} is overdue`, {
        body: `${entry.subject} • ${Math.abs(entry.minutesUntil)} min late`,
        tag: overdueKey,
      });
      if (sent) markNotificationSent(overdueKey);
    }
  }
}
function startNotificationChecks() {
  if (notificationCheckInterval) clearInterval(notificationCheckInterval);
  notificationCheckInterval = setInterval(() => { checkScheduledNotifications(); }, 60000);
  checkScheduledNotifications();
}

// ==================== PROFILE & THEME ====================
function getProfile() {
  const def = { name: 'Student', email: 'student@studyhub.app' };
  try { return JSON.parse(localStorage.getItem(KEYS.profile)) || def; } catch { return def; }
}
function saveProfile(data) { localStorage.setItem(KEYS.profile, JSON.stringify(data)); }

function renderProfile() {
  const p = getProfile();
  document.getElementById('profile-display-name').textContent = p.name;
  document.getElementById('profile-display-email').textContent = p.email;
  document.getElementById('profile-name-preview').textContent = p.name;
  document.getElementById('profile-email-preview').textContent = p.email;
  // Stats
  document.getElementById('stat-notes').textContent = load(KEYS.notes).filter(isNoteItem).length;
  document.getElementById('stat-assigns').textContent = load(KEYS.assignments).length;
  document.getElementById('stat-folders').textContent = load(KEYS.folders).length;
  // Theme toggle state
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.getElementById('theme-toggle').classList.toggle('active', isDark);
  document.getElementById('theme-icon').textContent = isDark ? 'dark_mode' : 'light_mode';
  document.getElementById('theme-label').textContent = isDark ? 'Dark theme active' : 'Light theme active';
}

function saveProfileName() {
  const name = document.getElementById('inp-profile-name').value.trim();
  if (!name) return showToast('Enter your name');
  const p = getProfile();
  p.name = name;
  saveProfile(p);
  closeModal('modal-edit-name');
  renderProfile();
  document.getElementById('dash-greeting').textContent = `Hello, ${name}.`;
  showToast('Name updated ✓');
}

function saveProfileEmail() {
  const email = document.getElementById('inp-profile-email').value.trim();
  if (!email) return showToast('Enter your email');
  const p = getProfile();
  p.email = email;
  saveProfile(p);
  closeModal('modal-edit-email');
  renderProfile();
  showToast('Email updated ✓');
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  if (isDark) {
    html.removeAttribute('data-theme');
    localStorage.setItem('sh_theme', 'light');
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('sh_theme', 'dark');
  }
  // Update meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = isDark ? '#3525cd' : '#111318';
  renderProfile();
  hideToast();
}

function loadTheme() {
  const saved = localStorage.getItem('sh_theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = '#111318';
  }
}

function confirmResetData() {
  if (confirm('⚠️ This will delete ALL your data (assignments, notes, timetable, tasks). Are you sure?')) {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('sh_seeded');
    localStorage.removeItem('sh_theme');
    document.documentElement.removeAttribute('data-theme');
    showToast('All data reset');
    setTimeout(() => location.reload(), 800);
  }
}

async function confirmResetData() {
  if (confirm('This will delete ALL your data (assignments, notes, timetable, tasks). Are you sure?')) {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('sh_seeded');
    localStorage.removeItem('sh_theme');
    document.documentElement.removeAttribute('data-theme');
    await clearStoredFiles();
    showToast('All data reset');
    setTimeout(() => location.reload(), 800);
  }
}

// ==================== URL PARAMS (PWA shortcuts) ====================
const params = new URLSearchParams(window.location.search);
const startTab = params.get('tab');

// ==================== INIT ====================
loadTheme();
seedDefaults();
normalizeLibraryData();
updateScreenMode(startTab === 'timetable' ? 'timetable' : 'dashboard');
updateTimetableStatusTime();
setInterval(updateTimetableStatusTime, 30000);
startNotificationChecks();
if (startTab && ['dashboard','assignments','timetable','notes','profile'].includes(startTab)) {
  const idx = ['dashboard','assignments','timetable','notes','profile'].indexOf(startTab);
  switchTab(startTab, document.querySelectorAll('.nav-item')[idx]);
} else {
  renderDashboard();
}
