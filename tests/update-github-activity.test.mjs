import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const projectRoot = path.resolve(import.meta.dirname, '..');
const updaterSource = path.join(projectRoot, 'scripts/update-github-activity.mjs');

const harness = String.raw`
const totalContributions = Number(process.env.TEST_TOTAL_CONTRIBUTIONS);
const start = new Date('2025-08-30T00:00:00Z');
const baseCount = Math.floor(totalContributions / 365);
const remainder = totalContributions % 365;
const days = Array.from({ length: 365 }, (_, index) => {
  const date = new Date(start);
  date.setUTCDate(start.getUTCDate() + index);
  const contributionCount = baseCount + (index < remainder ? 1 : 0);
  return {
    date: date.toISOString().slice(0, 10),
    weekday: date.getUTCDay(),
    contributionCount,
    color: contributionCount > 0 ? '#39d353' : '#ebedf0'
  };
});
const weeks = [];
for (let index = 0; index < days.length; index += 7) {
  const contributionDays = days.slice(index, index + 7);
  weeks.push({ firstDay: contributionDays[0].date, contributionDays });
}
globalThis.fetch = async () => ({
  ok: true,
  json: async () => ({
    data: {
      viewer: { login: 'IAZARA' },
      user: {
        login: 'IAZARA',
        name: 'Ivan Agustin Zarate',
        url: 'https://github.com/IAZARA',
        avatarUrl: 'https://avatars.githubusercontent.com/u/119895371',
        repositories: { totalCount: 19 },
        contributionsCollection: {
          contributionCalendar: {
            totalContributions,
            colors: ['#39d353'],
            weeks
          }
        }
      }
    }
  })
});
await import(process.env.TEST_UPDATER_URL);
`;

function runUpdater(totalContributions) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zaratexp-github-activity-'));
  const scriptsDirectory = path.join(temporaryRoot, 'scripts');
  const dataDirectory = path.join(temporaryRoot, 'assets/data');
  const updaterPath = path.join(scriptsDirectory, 'update-github-activity.mjs');
  const snapshotPath = path.join(dataDirectory, 'github-activity.json');
  const sentinel = `${JSON.stringify({ sentinel: 'unchanged' }, null, 2)}\n`;

  fs.mkdirSync(scriptsDirectory, { recursive: true });
  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.copyFileSync(updaterSource, updaterPath);
  fs.writeFileSync(snapshotPath, sentinel);

  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', harness], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GH_ACTIVITY_TOKEN: 'test-token',
      GITHUB_ACTIVITY_USER: 'IAZARA',
      GITHUB_ACTIVITY_MIN_TOTAL: '750',
      TEST_TOTAL_CONTRIBUTIONS: String(totalContributions),
      TEST_UPDATER_URL: pathToFileURL(updaterPath).href
    }
  });

  return {
    cleanup: () => fs.rmSync(temporaryRoot, { recursive: true, force: true }),
    result,
    sentinel,
    snapshot: () => fs.readFileSync(snapshotPath, 'utf8'),
    temporarySnapshotExists: () => fs.existsSync(`${snapshotPath}.tmp`)
  };
}

test('keeps the public snapshot unchanged below the privacy floor', () => {
  const run = runUpdater(724);
  try {
    assert.equal(run.result.status, 0, run.result.stderr);
    assert.match(run.result.stderr, /::warning::.*724 < 750.*snapshot remains unchanged/);
    assert.equal(run.snapshot(), run.sentinel);
    assert.equal(run.temporarySnapshotExists(), false);
  } finally {
    run.cleanup();
  }
});

test('publishes a verified snapshot at the privacy floor', () => {
  const run = runUpdater(750);
  try {
    assert.equal(run.result.status, 0, run.result.stderr);
    assert.doesNotMatch(run.result.stderr, /::warning::/);
    assert.match(run.result.stdout, /GitHub activity updated: 750 contributions across 53 weeks/);
    const snapshot = JSON.parse(run.snapshot());
    assert.equal(snapshot.source.valid, true);
    assert.equal(snapshot.source.scope, 'authenticated-owner');
    assert.equal(snapshot.summary.totalContributions, 750);
    assert.equal(snapshot.weeks.length, 53);
    assert.equal(run.temporarySnapshotExists(), false);
  } finally {
    run.cleanup();
  }
});
