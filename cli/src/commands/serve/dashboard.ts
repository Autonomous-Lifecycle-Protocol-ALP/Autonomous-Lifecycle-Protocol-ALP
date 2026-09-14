const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ALP Live Swarm &amp; State Server</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg-dark: #08090f;
    --bg-card: rgba(18, 21, 35, 0.75);
    --border: rgba(255, 255, 255, 0.08);
    --text-main: #f0f4fd;
    --text-muted: #7e89a3;
    --cyan: #00f0ff;
    --emerald: #10b981;
    --amber: #f59e0b;
    --rose: #f43f5e;
    --purple: #9d4edd;
    --blue: #3b82f6;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg-dark);
    color: var(--text-main);
    font-family: 'Inter', system-ui, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  header {
    padding: 16px 28px;
    background: rgba(12, 14, 24, 0.9);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo {
    width: 32px; height: 32px;
    background: linear-gradient(135deg, var(--cyan), var(--purple));
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-family: 'JetBrains Mono', monospace; color: #000;
    box-shadow: 0 0 16px rgba(0, 240, 255, 0.35);
  }
  .title { font-size: 1.1rem; font-weight: 700; background: linear-gradient(90deg, #fff, var(--text-muted)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .pulse-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--emerald);
    box-shadow: 0 0 10px var(--emerald);
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1); } }
  .status-tag { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; padding: 4px 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; color: var(--emerald); }
  
  main { flex: 1; padding: 28px; max-width: 1400px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 24px; }
  
  /* Progress Section */
  .progress-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .progress-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; font-weight: 600; }
  .progress-bar-bg { width: 100%; height: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 5px; overflow: hidden; position: relative; }
  .progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--cyan), var(--emerald)); width: 0%; transition: width 0.5s ease; box-shadow: 0 0 12px rgba(0, 240, 255, 0.5); }
  
  /* Grid Layout */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  .card h2 { font-size: 0.85rem; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.08em; color: var(--cyan); margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
  
  /* Stat Cards */
  .stat-card { display: flex; flex-direction: column; gap: 6px; }
  .stat-num { font-size: 1.8rem; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
  .stat-desc { font-size: 0.78rem; color: var(--text-muted); }

  .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.85rem; }
  .stat-row:last-child { border-bottom: none; }

  .badge { padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; font-weight: 700; }
  .b-done { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
  .b-progress { background: rgba(0, 240, 255, 0.15); color: #38bdf8; border: 1px solid rgba(0, 240, 255, 0.3); }
  .b-blocked { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }
  .b-review { background: rgba(157, 78, 221, 0.15); color: #c084fc; border: 1px solid rgba(157, 78, 221, 0.3); }
  .b-todo { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); border: 1px solid rgba(255, 255, 255, 0.1); }

  /* Event Stream Log */
  #log { height: 360px; overflow-y: auto; font-family: 'JetBrains Mono', monospace; display: flex; flex-direction: column; gap: 8px; }
  .evt-item { padding: 8px 12px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255,255,255,0.03); border-radius: 6px; font-size: 0.8rem; display: flex; flex-direction: column; gap: 4px; }
  .evt-header { display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.72rem; }
  .evt-type { color: var(--purple); font-weight: 700; }
  .evt-id { color: var(--cyan); }
  .evt-body { color: var(--text-main); }
</style>
</head>
<body>
<header>
  <div class="brand">
    <div class="logo">ALP</div>
    <div>
      <div class="title">ALP Live Swarm &amp; State Server</div>
      <div id="proj" style="font-size:0.75rem; color:var(--text-muted);"></div>
    </div>
  </div>
  <div class="status-tag">
    <span class="pulse-dot"></span> LIVE SSE STREAM
  </div>
</header>

<main>
  <!-- Task Completion Progress -->
  <div class="progress-card">
    <div class="progress-header">
      <span>WORKSPACE TASK COMPLETION</span>
      <span id="progressPct" style="color:var(--cyan); font-family:'JetBrains Mono';">0%</span>
    </div>
    <div class="progress-bar-bg">
      <div id="progressBar" class="progress-bar-fill"></div>
    </div>
  </div>

  <!-- Key Metrics 4-Grid -->
  <div class="grid-4">
    <div class="card stat-card">
      <div class="stat-desc">TOTAL TASKS</div>
      <div id="mTotal" class="stat-num" style="color:var(--text-main);">0</div>
    </div>
    <div class="card stat-card">
      <div class="stat-desc">COMPLETED [x]</div>
      <div id="mDone" class="stat-num" style="color:var(--emerald);">0</div>
    </div>
    <div class="card stat-card">
      <div class="stat-desc">IN PROGRESS [~]</div>
      <div id="mProgress" class="stat-num" style="color:var(--cyan);">0</div>
    </div>
    <div class="card stat-card">
      <div class="stat-desc">BLOCKED [!]</div>
      <div id="mBlocked" class="stat-num" style="color:var(--rose);">0</div>
    </div>
  </div>

  <!-- Main Status & Swarm Info -->
  <div class="grid-2">
    <div class="card">
      <h2>TASK BREAKDOWN BY STATUS</h2>
      <div id="statusList">loading...</div>
    </div>
    <div class="card">
      <h2>ACTIVE AGENTS &amp; LOCKS</h2>
      <div id="agentsList">loading...</div>
    </div>
  </div>

  <!-- Analytics -->
  <div class="card">
    <h2>RUNTIME ANALYTICS</h2>
    <div id="analyticsBody">loading telemetry...</div>
  </div>

  <!-- Live Log Stream -->
  <div class="card">
    <h2>LIVE EVENT STREAM</h2>
    <div id="log"></div>
  </div>
</main>

<script>
async function refresh() {
  const s = await (await fetch('/api/state')).json();
  document.getElementById('proj').textContent = s.project ? 'Workspace: ' + s.project : 'Workspace: default';
  
  const done = s.statusCount['[x]'] || 0;
  const progress = s.statusCount['[~]'] || 0;
  const blocked = s.statusCount['[!]'] || 0;
  const total = s.totalTasks || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById('mTotal').textContent = total;
  document.getElementById('mDone').textContent = done;
  document.getElementById('mProgress').textContent = progress;
  document.getElementById('mBlocked').textContent = blocked;

  document.getElementById('progressPct').textContent = pct + '% (' + done + '/' + total + ')';
  document.getElementById('progressBar').style.width = pct + '%';

  const cls = st => ({'[x]':'b-done','[!]':'b-blocked','[?]':'b-review','[~]':'b-progress','[ ]':'b-todo'}[st]||'b-todo');
  document.getElementById('statusList').innerHTML =
    Object.entries(s.statusCount).map(([k,v]) =>
      '<div class="stat-row"><span class="badge '+cls(k)+'">'+k+'</span><b>'+v+' tasks</b></div>').join('') || 'No tasks found';

  document.getElementById('agentsList').innerHTML =
    '<div class="stat-row"><span>Active Swarm Agents</span><b>' + (s.agents.join(', ') || 'none') + '</b></div>' +
    '<div class="stat-row"><span>Active File Locks</span><b>' + (s.activeLocks.join(', ') || 'none') + '</b></div>';

  await renderAnalytics();
}

async function renderAnalytics() {
  let a;
  try { a = await (await fetch('/api/analytics')).json(); } catch { return; }
  const fmt = ms => ms == null ? '—' : (ms/1000).toFixed(1) + 's';
  const sec = h => '<div class="stat-row"><span>Task: ' + h.task_id + '</span><span style="color:var(--rose);">failures: ' + h.failures + ' / handoffs: ' + h.handoffs + '</span></div>';
  document.getElementById('analyticsBody').innerHTML =
    '<div class="grid-4">' +
      '<div class="stat-row"><span>Total Runtime Events</span><b>' + a.total_events + '</b></div>' +
      '<div class="stat-row"><span>Execution Engine Runs</span><b>' + a.runs + '</b></div>' +
      '<div class="stat-row"><span>Avg Cycle Time</span><b>' + fmt(a.avg_cycle_time_ms) + '</b></div>' +
      '<div class="stat-row"><span>Agents Active</span><b>' + a.agents.length + '</b></div>' +
    '</div>' +
    '<br/>' +
    '<h2>FAILURE HOTSPOTS</h2>' +
    (a.failure_hotspots && a.failure_hotspots.length
      ? a.failure_hotspots.slice(0,5).map(sec).join('')
      : '<div class="stat-row" style="color:var(--emerald);">Zero failure hotspots detected [DONE]</div>');
}

function addEvent(e) {
  const box = document.getElementById('log');
  const div = document.createElement('div');
  div.className = 'evt-item';
  div.innerHTML =
    '<div class="evt-header">' +
      '<span class="evt-type">' + (e.type || 'event').toUpperCase() + '</span>' +
      '<span>' + (e.timestamp || '').replace('T',' ').replace('Z','') + '</span>' +
    '</div>' +
    '<div class="evt-body">' +
      (e.task_id ? '<span class="evt-id">[' + e.task_id + ']</span> ' : '') +
      (e.status ? '[' + e.status + '] ' : '') +
      (e.message || '') +
    '</div>';
  box.prepend(div);
  refresh();
}

fetch('/api/events').then(r=>r.json()).then(evts => evts.slice(-30).forEach(addEvent));
const es = new EventSource('/api/stream');
es.onmessage = ev => { try { addEvent(JSON.parse(ev.data)); } catch {} };
refresh();
setInterval(refresh, 4000);
</script>
</body>
</html>`;

export { DASHBOARD_HTML };

export interface DashboardState {
  project: string | null;
  totalTasks: number;
  statusCount: Record<string, number>;
  agents: string[];
  activeLocks: string[];
  recentEvents: any[];
  tasks: any[];
}

export function buildDashboardHtml(state: DashboardState): string {
  const project = state.project ?? 'default';
  return DASHBOARD_HTML.replace(
    '<div id="proj" style="font-size:0.75rem; color:var(--text-muted);"></div>',
    `<div id="proj" style="font-size:0.75rem; color:var(--text-muted);">Workspace: ${project}</div>`,
  );
}

