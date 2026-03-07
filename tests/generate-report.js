const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join('tests', 'report', 'results.json');
const OUTPUT_FILE = path.join('tests', 'report', 'dashboard.html');

function parseResults() {
    if (!fs.existsSync(RESULTS_FILE)) {
        console.error('No results file found at ' + RESULTS_FILE);
        console.error('Run: npx playwright test first');
        process.exit(1);
    }

    const raw = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
    const results = [];

    function processSuite(suite, category, projectName) {
        if (suite.specs) {
            for (const spec of suite.specs) {
                for (const t of spec.tests || []) {
                    const result = t.results && t.results[0];
                    results.push({
                        title: spec.title,
                        status: result ? result.status : 'skipped',
                        duration: Math.round((result && result.duration) || 0),
                        error: result && result.error && result.error.message
                            ? result.error.message.split('\n')[0].substring(0, 200)
                            : undefined,
                        category: category,
                        projectName: t.projectName || projectName,
                    });
                }
            }
        }
        if (suite.suites) {
            for (const s of suite.suites) {
                processSuite(s, s.title || category, projectName);
            }
        }
    }

    for (const suite of raw.suites || []) {
        processSuite(suite, suite.title || 'General', '');
    }

    return results;
}

function generateHTML(results) {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const total = results.length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const totalTime = Math.round(results.reduce((a, r) => a + r.duration, 0) / 1000);

    const groups = {};
    results.forEach(r => {
        const key = r.category || 'General';
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
    });

    const icon = (s) => ({ passed: '✅', failed: '❌', skipped: '⏭️', flaky: '⚠️' }[s] || '❓');

    const rows = Object.entries(groups).map(([cat, tests]) => {
        const catPass = tests.filter(t => t.status === 'passed').length;
        const catFail = tests.filter(t => t.status === 'failed').length;
        const catSkip = tests.filter(t => t.status === 'skipped').length;

        return `
    <div class="group">
      <div class="group-header">
        <div class="group-title">${cat}</div>
        <div class="group-badges">
          ${catPass > 0 ? '<span class="badge green">✅ ' + catPass + ' passed</span>' : ''}
          ${catFail > 0 ? '<span class="badge red">❌ ' + catFail + ' failed</span>' : ''}
          ${catSkip > 0 ? '<span class="badge gray">⏭️ ' + catSkip + ' skipped</span>' : ''}
        </div>
      </div>
      ${tests.map(t => `
      <div class="test ${t.status}">
        <span class="test-icon">${icon(t.status)}</span>
        <div class="test-body">
          <div class="test-name">${t.title}</div>
          ${t.projectName ? '<div class="test-project">[' + t.projectName + ']</div>' : ''}
          ${t.error ? '<div class="test-error">' + t.error.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>' : ''}
        </div>
        <span class="test-time">${t.duration}ms</span>
      </div>`).join('')}
    </div>`;
    }).join('');

    const rateColor = passRate >= 80 ? '#34d399' : passRate >= 60 ? '#fbbf24' : '#f87171';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Creatorly Test Report</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
  .hero{background:linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899);padding:48px 40px;text-align:center}
  .hero h1{font-size:2.2rem;font-weight:900;color:white;letter-spacing:-0.5px}
  .hero p{color:rgba(255,255,255,0.85);margin-top:8px;font-size:1.1rem}
  .hero time{color:rgba(255,255,255,0.6);font-size:0.85rem;margin-top:6px;display:block}
  .stats{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;padding:28px 40px}
  .stat{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:20px;text-align:center}
  .stat-num{font-size:2.2rem;font-weight:800}
  .stat-lbl{font-size:0.8rem;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:.5px}
  .stat.p .stat-num{color:#34d399}
  .stat.f .stat-num{color:#f87171}
  .stat.s .stat-num{color:#94a3b8}
  .stat.t .stat-num{color:#60a5fa}
  .stat.r .stat-num{color:${rateColor}}
  .bar-wrap{margin:0 40px 28px;background:#1e293b;border-radius:99px;height:10px;border:1px solid #334155;overflow:hidden}
  .bar{height:100%;width:${passRate}%;background:linear-gradient(90deg,#34d399,#10b981);border-radius:99px;transition:width .6s}
  .content{padding:0 40px 48px}
  .group{background:#1e293b;border:1px solid #334155;border-radius:16px;margin-bottom:14px;overflow:hidden}
  .group-header{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid #334155}
  .group-title{font-weight:700;font-size:0.95rem}
  .group-badges{display:flex;gap:8px;flex-wrap:wrap}
  .badge{font-size:0.75rem;padding:3px 10px;border-radius:99px;font-weight:600}
  .badge.green{background:#064e3b;color:#34d399}
  .badge.red{background:#450a0a;color:#f87171}
  .badge.gray{background:#1e293b;color:#94a3b8;border:1px solid #334155}
  .test{display:flex;align-items:flex-start;gap:12px;padding:11px 20px;border-bottom:1px solid #0f172a}
  .test:last-child{border-bottom:none}
  .test:hover{background:#0f172a44}
  .test.failed{background:#450a0a22}
  .test.skipped{opacity:0.5}
  .test-icon{font-size:1rem;flex-shrink:0;margin-top:2px}
  .test-body{flex:1;min-width:0}
  .test-name{font-size:0.875rem;color:#e2e8f0;font-weight:500}
  .test-project{font-size:0.7rem;color:#6366f1;margin-top:2px}
  .test-error{font-size:0.75rem;color:#fca5a5;background:#450a0a;padding:8px 12px;border-radius:8px;margin-top:6px;font-family:monospace;white-space:pre-wrap;word-break:break-all;border-left:3px solid #f87171}
  .test-time{font-size:0.75rem;color:#475569;flex-shrink:0;margin-top:2px}
  .footer{text-align:center;padding:24px;color:#475569;font-size:0.85rem;border-top:1px solid #1e293b}
  @media(max-width:640px){.stats{grid-template-columns:repeat(2,1fr)}.content,.stats,.bar-wrap{padding-left:16px;padding-right:16px}}
</style>
</head>
<body>
  <div class="hero">
    <h1>🚀 Creatorly QA Report</h1>
    <p>${passed} passed · ${failed} failed · ${skipped} skipped · ${total} total</p>
    <time>Generated ${new Date().toLocaleString('en-IN')} · Total time: ${totalTime}s</time>
  </div>
  <div class="stats">
    <div class="stat t"><div class="stat-num">${total}</div><div class="stat-lbl">Total</div></div>
    <div class="stat p"><div class="stat-num">${passed}</div><div class="stat-lbl">Passed ✅</div></div>
    <div class="stat f"><div class="stat-num">${failed}</div><div class="stat-lbl">Failed ❌</div></div>
    <div class="stat s"><div class="stat-num">${skipped}</div><div class="stat-lbl">Skipped ⏭️</div></div>
    <div class="stat r"><div class="stat-num">${passRate}%</div><div class="stat-lbl">Pass Rate</div></div>
  </div>
  <div class="bar-wrap"><div class="bar"></div></div>
  <div class="content">${rows}</div>
  <div class="footer">Creatorly QA Bot · Playwright · ${new Date().getFullYear()}</div>
</body>
</html>`;
}

// Main:
const results = parseResults();
const html = generateHTML(results);
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, html);

const passed = results.filter(r => r.status === 'passed').length;
const failed = results.filter(r => r.status === 'failed').length;
const passRate = results.length > 0 ? Math.round((passed / results.length) * 100) : 0;

console.log('');
console.log('==================================================');
console.log('  CREATORLY TEST REPORT');
console.log('==================================================');
console.log('  Passed:    ' + passed);
console.log('  Failed:    ' + failed);
console.log('  Pass Rate: ' + passRate + '%');
console.log('  Report:    ' + OUTPUT_FILE);
console.log('==================================================');
console.log('');
console.log('Open report: explorer tests\\report\\dashboard.html');
console.log('');
