// ==================== DATA LAYER (localStorage) ====================
const KEYS = { assignments: 'sh_assignments', tasks: 'sh_tasks', timetable: 'sh_timetable', notes: 'sh_notes', folders: 'sh_folders' };

function load(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

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
      { id: 1, name: 'Advanced Mathematics', room: 'Lecture Hall A2', start: '08:30', end: '09:45' },
      { id: 2, name: 'Data Structures & Algorithms', room: 'Lab Room 402', start: '10:00', end: '11:15' },
      { id: 3, name: 'Software Engineering', room: 'Seminar Room 12', start: '11:30', end: '12:45' },
      { id: 4, name: 'Technical Writing', room: 'Main Library', start: '14:00', end: '15:30' },
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
  save(KEYS.folders, [
    { id: Date.now()+20, name: 'Math', icon: 'functions', color: '#3b82f6' },
    { id: Date.now()+21, name: 'History', icon: 'history_edu', color: '#d97706' },
    { id: Date.now()+22, name: 'Physics', icon: 'science', color: '#4338ca' },
  ]);
  save(KEYS.notes, [
    { id: Date.now()+30, title: 'Calculus III: Vector Fields', content: 'Key concepts: Line integrals, Green\'s theorem, divergence and curl...', folder: 'Math', created: new Date(Date.now()-7200000).toISOString(), photo: null },
    { id: Date.now()+31, title: 'Industrial Revolution Summary', content: 'The Industrial Revolution began in Britain in the late 18th century...', folder: 'History', created: new Date(Date.now()-86400000).toISOString(), photo: null },
    { id: Date.now()+32, title: 'Thermodynamics Laws Pt 1', content: '1st Law: Energy cannot be created or destroyed\n2nd Law: Entropy of an isolated system always increases...', folder: 'Physics', created: new Date(Date.now()-259200000).toISOString(), photo: null },
  ]);
  localStorage.setItem('sh_seeded', 'true');
}

// ==================== TAB NAVIGATION ====================
function switchTab(tabId, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + tabId).classList.add('active');
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
}

// ==================== MODAL HELPERS ====================
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// ==================== TOAST ====================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
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
    const next = getNextClass(todayClasses);
    document.getElementById('dash-live-badge').style.display = current ? 'inline-block' : 'none';
    let html = '<div style="display:grid;grid-template-columns:2fr 1fr;gap:1rem">';
    if (current) {
      const prog = getClassProgress(current);
      html += `<div style="background:var(--primary);color:white;padding:2rem;border-radius:0.75rem;position:relative;overflow:hidden;min-height:200px;display:flex;flex-direction:column;justify-content:space-between">
        <div><div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem"><span class="material-symbols-outlined filled" style="font-size:14px">sensors</span><span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.8">${current.room}</span></div>
        <h3 style="font-size:1.75rem;font-weight:700;line-height:1.2">${current.name}</h3>
        <p style="margin-top:0.5rem;opacity:0.8;font-size:0.875rem">${current.start} - ${current.end}</p></div>
        <div><p style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.6;margin-bottom:0.5rem">Progress</p>
        <div style="width:100%;height:6px;background:rgba(255,255,255,0.2);border-radius:4px;overflow:hidden"><div style="width:${prog}%;height:100%;background:white;border-radius:4px;transition:width 1s"></div></div></div>
        <div style="position:absolute;right:-2rem;top:-2rem;width:8rem;height:8rem;background:rgba(255,255,255,0.08);border-radius:50%;filter:blur(20px)"></div></div>`;
    } else {
      html += `<div class="card" style="display:flex;align-items:center;justify-content:center;min-height:200px;color:var(--on-surface-variant)"><div style="text-align:center"><span class="material-symbols-outlined" style="font-size:2rem;margin-bottom:0.5rem;display:block">free_cancellation</span>No class right now</div></div>`;
    }
    if (next) {
      html += `<div style="background:var(--surface-container-low);padding:1.5rem;border-radius:0.75rem;display:flex;flex-direction:column;justify-content:space-between">
        <div><p class="section-label">Next Class</p><h4 style="font-size:1.1rem;font-weight:600;margin-top:0.75rem;line-height:1.3">${next.name}</h4><p style="font-size:0.8125rem;color:var(--secondary);margin-top:0.25rem">${next.start} - ${next.end}</p></div>
        <div style="border-top:1px solid rgba(199,196,216,0.15);padding-top:0.75rem;margin-top:0.75rem;display:flex;align-items:center;gap:0.5rem;color:#64748b"><span class="material-symbols-outlined" style="font-size:16px">location_on</span><span style="font-size:0.75rem;font-weight:500">${next.room}</span></div></div>`;
    } else {
      html += `<div style="background:var(--surface-container-low);padding:1.5rem;border-radius:0.75rem;display:flex;align-items:center;justify-content:center;color:var(--on-surface-variant);font-size:0.875rem">Last class done!</div>`;
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
function renderTasks() {
  const tasks = load(KEYS.tasks);
  const el = document.getElementById('dash-tasks');
  if (tasks.length === 0) {
    el.innerHTML = '<p style="color:var(--on-surface-variant);font-size:0.8125rem;text-align:center;padding:1rem">No tasks yet. Add one!</p>';
    return;
  }
  el.innerHTML = tasks.map(t => `
    <div class="task-row ${t.done?'done':''}" onclick="toggleTaskDone(${t.id})">
      <div class="task-check ${t.done?'done':''}"><span class="material-symbols-outlined" style="${t.done?'':'display:none'}">check</span></div>
      <span class="task-label" style="flex:1;font-size:0.875rem;font-weight:500">${t.text}</span>
      <button class="delete-btn" onclick="event.stopPropagation();deleteTask(${t.id})"><span class="material-symbols-outlined" style="font-size:18px">close</span></button>
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
function openAddTask() { document.getElementById('inp-task-title').value = ''; openModal('modal-task'); }
function saveTask() {
  const text = document.getElementById('inp-task-title').value.trim();
  if (!text) return showToast('Enter a task name');
  const tasks = load(KEYS.tasks);
  tasks.push({ id: Date.now(), text, done: false });
  save(KEYS.tasks, tasks);
  closeModal('modal-task'); renderTasks(); showToast('Task added ✓');
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
let selectedDay = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
if (!['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(selectedDay)) selectedDay = 'Monday';

function renderTimetable() {
  // Day pills
  const dp = document.getElementById('day-pills');
  dp.innerHTML = ['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d =>
    `<button class="day-pill ${d===selectedDay?'active':''}" onclick="selectDay('${d}')">${d}</button>`
  ).join('');
  // Timeline
  const tt = load(KEYS.timetable);
  const classes = (tt[selectedDay] || []).sort((a,b) => a.start.localeCompare(b.start));
  const el = document.getElementById('tt-timeline');
  if (classes.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--on-surface-variant)"><span class="material-symbols-outlined" style="font-size:2.5rem;display:block;margin-bottom:0.5rem">event_busy</span>No classes on ' + selectedDay + '</div>';
  } else {
    const now = new Date();
    const isToday = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()] === selectedDay;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    el.innerHTML = '<div class="timeline-line"></div>' + classes.map(c => {
      const [sh, sm] = c.start.split(':').map(Number);
      const [eh, em] = c.end.split(':').map(Number);
      const startMins = sh * 60 + sm, endMins = eh * 60 + em;
      const isCurrent = isToday && nowMins >= startMins && nowMins <= endMins;
      const prog = isCurrent ? Math.round(((nowMins - startMins) / (endMins - startMins)) * 100) : 0;
      const remaining = isCurrent ? endMins - nowMins : 0;
      if (isCurrent) {
        return `<div style="position:relative;margin-bottom:1.5rem">
          <div class="timeline-dot current" style="top:50%;transform:translateY(-50%)"></div>
          <div class="card" style="border:1.5px solid rgba(79,70,229,0.15);box-shadow:0 4px 24px rgba(20,27,43,0.06);padding:1.25rem">
            <div style="display:flex;align-items:start;gap:1rem">
              <div style="width:5rem;flex-shrink:0"><span style="font-size:0.75rem;font-weight:700;color:var(--primary);display:block">${c.start}</span><span style="font-size:0.75rem;color:rgba(53,37,205,0.5)">${c.end}</span></div>
              <div style="flex:1"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="font-weight:700">${c.name}</h3><span class="badge badge-live">Current</span></div>
              <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.25rem;color:var(--primary)"><span class="material-symbols-outlined" style="font-size:14px">room</span><span style="font-size:0.75rem;font-weight:600">${c.room}</span></div>
              <div style="margin-top:1rem;height:6px;background:#f1f5f9;border-radius:4px;overflow:hidden"><div style="width:${prog}%;height:100%;background:var(--primary);border-radius:4px;transition:width 1s"></div></div>
              <p style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-top:0.5rem">${remaining} min remaining</p></div>
            </div>
            <button class="delete-btn" style="position:absolute;top:0.75rem;right:0.75rem;opacity:0" onclick="event.stopPropagation();deleteClass('${selectedDay}',${c.id})"><span class="material-symbols-outlined" style="font-size:18px">close</span></button>
          </div></div>`;
      }
      return `<div style="position:relative;margin-bottom:1.5rem">
        <div class="timeline-dot" style="top:1rem"></div>
        <div class="card" style="background:var(--surface-container-low);border:none;position:relative">
          <div style="display:flex;align-items:start;gap:1rem">
            <div style="width:5rem;flex-shrink:0"><span style="font-size:0.75rem;font-weight:700;color:#94a3b8;display:block">${c.start}</span><span style="font-size:0.75rem;color:#cbd5e1">${c.end}</span></div>
            <div><h3 style="font-weight:600">${c.name}</h3><div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.25rem;color:#94a3b8"><span class="material-symbols-outlined" style="font-size:14px">room</span><span style="font-size:0.75rem;font-weight:500">${c.room}</span></div></div>
          </div>
          <button class="delete-btn" style="position:absolute;top:0.75rem;right:0.75rem" onclick="event.stopPropagation();deleteClass('${selectedDay}',${c.id})"><span class="material-symbols-outlined" style="font-size:18px">close</span></button>
        </div></div>`;
    }).join('');
  }
  // Insights
  const allClasses = tt;
  let total = 0, mins = 0;
  ['Monday','Tuesday','Wednesday','Thursday','Friday'].forEach(d => {
    (allClasses[d]||[]).forEach(c => {
      total++;
      const [sh,sm] = c.start.split(':').map(Number);
      const [eh,em] = c.end.split(':').map(Number);
      mins += (eh*60+em) - (sh*60+sm);
    });
  });
  document.getElementById('tt-total').textContent = total + ' / week';
  document.getElementById('tt-hours').textContent = (mins/60).toFixed(1) + 'h';
}
function selectDay(d) { selectedDay = d; renderTimetable(); }
function openAddClass() {
  ['inp-class-name','inp-class-room'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('inp-class-start').value = ''; document.getElementById('inp-class-end').value = '';
  document.getElementById('inp-class-day').value = selectedDay;
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
  tt[day].push({ id: Date.now(), name, room: room || 'TBD', start, end });
  save(KEYS.timetable, tt);
  selectedDay = day; closeModal('modal-class'); renderTimetable(); showToast('Class added ✓');
}
function deleteClass(day, id) {
  const tt = load(KEYS.timetable);
  if (tt[day]) tt[day] = tt[day].filter(c => c.id !== id);
  save(KEYS.timetable, tt);
  renderTimetable(); showToast('Class removed');
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

// ==================== URL PARAMS (PWA shortcuts) ====================
const params = new URLSearchParams(window.location.search);
const startTab = params.get('tab');

// ==================== INIT ====================
seedDefaults();
if (startTab && ['dashboard','assignments','timetable','notes'].includes(startTab)) {
  const idx = ['dashboard','assignments','timetable','notes'].indexOf(startTab);
  switchTab(startTab, document.querySelectorAll('.nav-item')[idx]);
} else {
  renderDashboard();
}
