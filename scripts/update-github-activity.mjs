import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outputPath = path.join(root, 'assets/data/github-activity.json');
const username = process.env.GITHUB_ACTIVITY_USER || 'IAZARA';
const token = process.env.GH_ACTIVITY_TOKEN;
const minimumBootstrapTotal = Number(process.env.GITHUB_ACTIVITY_MIN_TOTAL || 750);

if (!token) {
  console.error('GH_ACTIVITY_TOKEN is required to refresh verified GitHub activity.');
  process.exit(1);
}

const toDate = new Date();
const fromDate = new Date(toDate);
fromDate.setUTCFullYear(fromDate.getUTCFullYear() - 1);
const toIso = `${toDate.toISOString().slice(0, 10)}T23:59:59Z`;
const fromIso = `${fromDate.toISOString().slice(0, 10)}T00:00:00Z`;

const query = `
  query GitHubActivity($login: String!, $from: DateTime!, $to: DateTime!) {
    viewer { login }
    user(login: $login) {
      login
      name
      url
      avatarUrl
      repositories(privacy: PUBLIC) { totalCount }
      contributionsCollection(from: $from, to: $to) {
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          colors
          weeks {
            firstDay
            contributionDays {
              date
              weekday
              contributionCount
              color
            }
          }
        }
      }
    }
  }
`;

const response = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'ZarateXP-GitHub-Activity'
  },
  body: JSON.stringify({ query, variables: { login: username, from: fromIso, to: toIso } })
});

if (!response.ok) {
  throw new Error(`GitHub GraphQL request failed with HTTP ${response.status}`);
}

const payload = await response.json();
if (payload.errors?.length) {
  throw new Error(payload.errors.map((error) => error.message).join('; '));
}

const user = payload.data?.user;
const viewerLogin = payload.data?.viewer?.login;
const calendar = user?.contributionsCollection?.contributionCalendar;
if (!user || !calendar || !Array.isArray(calendar.weeks)) {
  throw new Error(`GitHub activity was not available for ${username}`);
}
if (String(viewerLogin).toLowerCase() !== username.toLowerCase()) {
  throw new Error(`GH_ACTIVITY_TOKEN belongs to ${viewerLogin || 'an unknown account'}, expected ${username}`);
}
if (String(user.login).toLowerCase() !== username.toLowerCase()) {
  throw new Error(`GitHub returned ${user.login}, expected ${username}`);
}

const colors = calendar.colors || [];
const levelByColor = new Map(colors.map((color, index) => [color.toLowerCase(), index + 1]));
const days = calendar.weeks
  .flatMap((week) => week.contributionDays)
  .map((day) => ({
    date: day.date,
    weekday: day.weekday,
    count: day.contributionCount,
    level: day.contributionCount === 0 ? 0 : levelByColor.get(String(day.color).toLowerCase()) || 1
  }))
  .sort((left, right) => left.date.localeCompare(right.date));

if (days.length < 365) {
  throw new Error(`Expected a full contribution year, received ${days.length} days`);
}

const summedContributions = days.reduce((total, day) => total + day.count, 0);
if (summedContributions !== calendar.totalContributions) {
  throw new Error(`Contribution total mismatch: calendar=${calendar.totalContributions}, days=${summedContributions}`);
}

let previousSnapshot = null;
try {
  previousSnapshot = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
} catch (error) {
  previousSnapshot = null;
}
const previousIsVerified = previousSnapshot?.schemaVersion === 2
  && previousSnapshot?.source?.valid === true
  && previousSnapshot?.source?.scope === 'authenticated-owner'
  && String(previousSnapshot?.source?.viewerLogin).toLowerCase() === username.toLowerCase()
  && Number(previousSnapshot?.summary?.totalContributions) > 0;

if (!previousIsVerified && calendar.totalContributions < minimumBootstrapTotal) {
  throw new Error(`Initial verified snapshot is unexpectedly low: ${calendar.totalContributions} < ${minimumBootstrapTotal}`);
}
if (previousIsVerified) {
  const previousTotal = Number(previousSnapshot.summary.totalContributions);
  const minimumExpected = Math.floor(previousTotal * 0.8);
  if (calendar.totalContributions < minimumExpected) {
    throw new Error(`Verified contribution total dropped unexpectedly: ${calendar.totalContributions} < ${minimumExpected}`);
  }
}

let longestStreak = 0;
let runningStreak = 0;
for (const day of days) {
  runningStreak = day.count > 0 ? runningStreak + 1 : 0;
  longestStreak = Math.max(longestStreak, runningStreak);
}

let currentIndex = days.length - 1;
if (days[currentIndex]?.count === 0) currentIndex -= 1;
let currentStreak = 0;
while (currentIndex >= 0 && days[currentIndex].count > 0) {
  currentStreak += 1;
  currentIndex -= 1;
}

const activeDays = days.filter((day) => day.count > 0);
const busiestDay = activeDays.reduce((best, day) => !best || day.count > best.count ? day : best, null);
const latestActiveDay = activeDays.at(-1) || null;
const weeks = calendar.weeks.map((week) => ({
  firstDay: week.firstDay,
  days: week.contributionDays.map((day) => ({
    date: day.date,
    weekday: day.weekday,
    count: day.contributionCount,
    level: day.contributionCount === 0 ? 0 : levelByColor.get(String(day.color).toLowerCase()) || 1
  }))
}));

const activity = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  source: {
    provider: 'GitHub GraphQL API',
    scope: 'authenticated-owner',
    viewerLogin,
    privateCountsAnonymized: true,
    valid: true
  },
  profile: {
    username: user.login,
    name: user.name || user.login,
    url: user.url,
    avatarUrl: user.avatarUrl,
    publicRepositories: user.repositories.totalCount
  },
  period: {
    from: days[0].date,
    to: days.at(-1).date
  },
  summary: {
    totalContributions: calendar.totalContributions,
    activeDays: activeDays.length,
    longestStreak,
    currentStreak,
    restrictedContributions: user.contributionsCollection.restrictedContributionsCount,
    busiestDay,
    latestActiveDay
  },
  weeks
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const temporaryPath = `${outputPath}.tmp`;
fs.writeFileSync(temporaryPath, `${JSON.stringify(activity, null, 2)}\n`);
fs.renameSync(temporaryPath, outputPath);
console.log(`GitHub activity updated: ${activity.summary.totalContributions} contributions across ${weeks.length} weeks.`);
