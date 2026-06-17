/**
 * Dump ESPN live standings payloads for CourtVisual.
 *
 * Usage:
 *   node dump_espn_standings.mjs
 *
 * Optional:
 *   ESPN_LEVEL=3 node dump_espn_standings.mjs
 *   ESPN_LIMIT_TO=mlb,nfl,nba node dump_espn_standings.mjs
 *
 * Output:
 *   ./espn_standings_payloads/*.json
 *   ./espn_standings_payloads/_dump_index.json
 *   ./espn_standings_payloads/_errors.json
 *
 * Notes:
 * - Uses ESPN's community-discovered /apis/v2 standings endpoint.
 * - This is great for prototyping, but do not treat it as a licensed commercial sports data agreement.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('./espn_standings_payloads');
const BASE = 'https://site.api.espn.com/apis/v2/sports';
const level = process.env.ESPN_LEVEL || '';
const limitTo = (process.env.ESPN_LIMIT_TO || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const LEAGUES = [
  { key: 'mlb', label: 'MLB', sport: 'baseball', league: 'mlb', levelDefault: 3 },
  { key: 'nfl', label: 'NFL', sport: 'football', league: 'nfl', levelDefault: 3 },
  { key: 'nba', label: 'NBA', sport: 'basketball', league: 'nba', levelDefault: 2 },
  { key: 'wnba', label: 'WNBA', sport: 'basketball', league: 'wnba', levelDefault: 1 },
  { key: 'nhl', label: 'NHL', sport: 'hockey', league: 'nhl', levelDefault: 3 },
  { key: 'mls', label: 'MLS', sport: 'soccer', league: 'usa.1', levelDefault: 2 },
  { key: 'nwsl', label: 'NWSL', sport: 'soccer', league: 'usa.nwsl', levelDefault: 1 },
  { key: 'college-football', label: 'College Football', sport: 'football', league: 'college-football', levelDefault: 2 },
  { key: 'mens-college-basketball', label: "Men's College Basketball", sport: 'basketball', league: 'mens-college-basketball', levelDefault: 2 },
  { key: 'womens-college-basketball', label: "Women's College Basketball", sport: 'basketball', league: 'womens-college-basketball', levelDefault: 2 },
  { key: 'college-baseball', label: 'College Baseball', sport: 'baseball', league: 'college-baseball', levelDefault: 2 },
  { key: 'mens-college-hockey', label: "Men's College Hockey", sport: 'hockey', league: 'mens-college-hockey', levelDefault: 2 }
];

function buildUrl(item) {
  const activeLevel = level || item.levelDefault;
  const params = new URLSearchParams({
    region: 'us',
    lang: 'en',
    contentorigin: 'espn',
    level: String(activeLevel)
  });

  // Add reasonable sport-specific default sorting. ESPN may ignore unknown sort keys.
  if (item.sport === 'baseball') {
    params.set('sort', 'gamesbehind:asc,winpercent:desc');
  } else if (item.sport === 'hockey') {
    params.set('sort', 'playoffseed:asc,points:desc,gamesplayed:asc,rotwins:desc');
  } else if (item.sport === 'basketball' || item.sport === 'football') {
    params.set('sort', 'playoffseed:asc');
  } else if (item.sport === 'soccer') {
    params.set('sort', 'points:desc');
  }

  return `${BASE}/${item.sport}/${item.league}/standings?${params.toString()}`;
}

function getStatMap(entry) {
  const stats = entry?.stats || entry?.statistics || [];
  const out = {};
  for (const stat of stats) {
    const name = stat.name || stat.shortName || stat.abbreviation || stat.displayName;
    if (!name) continue;
    out[name] = {
      name,
      displayName: stat.displayName,
      shortDisplayName: stat.shortDisplayName,
      abbreviation: stat.abbreviation,
      value: stat.value,
      displayValue: stat.displayValue,
      description: stat.description
    };
  }
  return out;
}

function summarizePayload(payload) {
  const children = payload?.children || payload?.standings?.children || [];
  const groupSummaries = children.map((group, groupIndex) => {
    const entries = group?.standings?.entries || group?.entries || [];
    const groupName = group?.name || group?.abbreviation || group?.displayName || `group_${groupIndex + 1}`;
    return {
      groupName,
      entryCount: entries.length,
      sampleTeams: entries.slice(0, 5).map(entry => ({
        teamId: entry?.team?.id,
        teamName: entry?.team?.displayName || entry?.team?.name,
        stats: getStatMap(entry)
      }))
    };
  });

  return {
    rootKeys: Object.keys(payload || {}),
    season: payload?.season,
    requestedAt: new Date().toISOString(),
    groupCount: children.length,
    groupSummaries
  };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const index = [];
  const errors = [];
  const leagues = limitTo.length ? LEAGUES.filter(l => limitTo.includes(l.key)) : LEAGUES;

  for (const item of leagues) {
    const url = buildUrl(item);
    const fileName = `${item.key}.standings.json`;
    const summaryName = `${item.key}.summary.json`;
    const filePath = path.join(OUT_DIR, fileName);
    const summaryPath = path.join(OUT_DIR, summaryName);

    try {
      console.log(`Fetching ${item.label}: ${url}`);
      const res = await fetch(url, {
        headers: {
          'accept': 'application/json,text/plain,*/*',
          'user-agent': 'CourtVisualPrototype/0.1 (+local dev)'
        }
      });

      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { parseError: true, rawTextStart: text.slice(0, 1000) };
      }

      await fs.writeFile(filePath, JSON.stringify(parsed, null, 2));
      const summary = summarizePayload(parsed);
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

      index.push({
        key: item.key,
        label: item.label,
        sport: item.sport,
        league: item.league,
        url,
        httpStatus: res.status,
        ok: res.ok,
        payloadFile: fileName,
        summaryFile: summaryName,
        rootKeys: summary.rootKeys,
        groupCount: summary.groupCount
      });
    } catch (error) {
      errors.push({
        key: item.key,
        label: item.label,
        sport: item.sport,
        league: item.league,
        url,
        error: String(error?.message || error)
      });
      console.error(`Error fetching ${item.label}:`, error);
    }
  }

  await fs.writeFile(path.join(OUT_DIR, '_dump_index.json'), JSON.stringify(index, null, 2));
  await fs.writeFile(path.join(OUT_DIR, '_errors.json'), JSON.stringify(errors, null, 2));

  console.log(`Done. Wrote ${index.length} payloads to ${OUT_DIR}. Errors: ${errors.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
