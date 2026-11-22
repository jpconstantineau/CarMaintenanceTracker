import { execFileSync } from 'node:child_process';

// Read credentials through the configured Git helper; never print or write them.
// Requests with authorization go only to the fixed GitHub API origin.
const repository = 'jpconstantineau/CarMaintenanceTracker';
const site = 'https://jpconstantineau.github.io/CarMaintenanceTracker/';
const commit = process.argv[2] ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Provide a full commit SHA.');
const credentials = execFileSync('git', ['credential', 'fill'], {
  input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8',
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
}).split(/\r?\n/);
const password = credentials.find(line => line.startsWith('password='))?.slice('password='.length);
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'CarMaintenanceTracker-release' };
if (password) headers.Authorization = `Bearer ${password}`;
async function api(path) {
  const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub ${path}: HTTP ${response.status}`);
  return response.json();
}
const [pages, build, actions] = await Promise.all([api('pages'), api('pages/builds/latest'), api(`actions/runs?head_sha=${commit}`)]);
const runs = actions.workflow_runs.map(run => ({ name: run.name, status: run.status, conclusion: run.conclusion, url: run.html_url }));
const result = { expectedCommit: commit, source: pages.source, buildCommit: build.commit, buildStatus: build.status, site, runs };
if (pages.source.branch !== 'main' || pages.source.path !== '/docs') throw new Error('Pages publishing source changed. Review the release configuration.');
if (build.commit !== commit || build.status !== 'built') {
  console.log(JSON.stringify({ ...result, verified: false }, null, 2));
  process.exitCode = 2;
} else {
  const files = ['index.html', 'app.js', 'history.js', 'calculations.js', 'interface.js', 'storage.js', 'styles.css'];
  result.assets = await Promise.all(files.map(async file => {
    const response = await fetch(`${site}${file}?release=${commit}`, { cache: 'no-store' });
    const expected = execFileSync('git', ['show', `${commit}:docs/${file}`], { encoding: 'utf8' });
    const normalize = text => text.replaceAll('\r\n', '\n').trimEnd();
    return { file, matches: response.ok && normalize(await response.text()) === normalize(expected) };
  }));
  result.verified = result.assets.every(asset => asset.matches);
  console.log(JSON.stringify(result, null, 2));
  if (!result.verified) process.exitCode = 2;
}
