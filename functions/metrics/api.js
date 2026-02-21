/**
 * Cloudflare Pages Function — Metrics API proxy
 * Route: /metrics/api?days=N
 *
 * Environment variables (set in Cloudflare Pages dashboard -> Settings -> Variables):
 *   CF_API_TOKEN — Cloudflare API token with Analytics Read
 *   CF_ZONE_ID   — Zone ID for stevechalmers.uk
 */

export async function onRequestGet(context) {
  const { request, env } = context;

  const TOKEN   = env.CF_API_TOKEN;
  const ZONE_ID = env.CF_ZONE_ID;

  if (!TOKEN || !ZONE_ID) {
    return jsonResponse({
      error: 'Not configured. Set CF_API_TOKEN and CF_ZONE_ID in Pages environment variables.'
    }, 500);
  }

  const url  = new URL(request.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '7'), 1), 30);

  try {
    const data = await fetchAnalytics(TOKEN, ZONE_ID, days);
    return jsonResponse(data);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

async function fetchAnalytics(token, zoneId, days) {
  const now       = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  const startStr  = startDate.toISOString().slice(0, 10);
  const endStr    = now.toISOString().slice(0, 10);

  const useHourly = days === 1;
  const query = useHourly
    ? buildHourlyQuery(zoneId, startStr)
    : buildDailyQuery(zoneId, startStr, endStr, days);

  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  if (!res.ok) throw new Error(`Cloudflare API error: ${res.status}`);

  const result = await res.json();
  if (result.errors) throw new Error(result.errors[0]?.message || 'GraphQL error');

  const zone = result.data?.viewer?.zones?.[0];
  if (!zone) throw new Error('No zone data returned');

  return useHourly ? parseHourly(zone) : parseDaily(zone);
}

function buildDailyQuery(zoneId, startStr, endStr, days) {
  return `{
    viewer {
      zones(filter: { zoneTag: "${zoneId}" }) {
        httpRequests1dGroups(
          limit: ${days}
          orderBy: [date_DESC]
          filter: { date_geq: "${startStr}", date_leq: "${endStr}" }
        ) {
          dimensions { date }
          sum {
            requests
            pageViews
            bytes
            countryMap { clientCountryName requests }
          }
          uniq { uniques }
        }
      }
    }
  }`;
}

function buildHourlyQuery(zoneId, startStr) {
  return `{
    viewer {
      zones(filter: { zoneTag: "${zoneId}" }) {
        httpRequests1hGroups(
          limit: 25
          orderBy: [datetime_DESC]
          filter: { datetime_geq: "${startStr}T00:00:00Z" }
        ) {
          dimensions { datetime }
          sum {
            requests
            pageViews
            bytes
            countryMap { clientCountryName requests }
          }
          uniq { uniques }
        }
      }
    }
  }`;
}

function parseDaily(zone) {
  const groups = zone.httpRequests1dGroups || [];
  let totalRequests = 0, totalPageViews = 0, totalBytes = 0, totalVisitors = 0;
  const daily = [];
  const countryTotals = {};

  groups.forEach(g => {
    totalRequests  += g.sum.requests  || 0;
    totalPageViews += g.sum.pageViews || 0;
    totalBytes     += g.sum.bytes     || 0;
    totalVisitors  += g.uniq.uniques  || 0;
    daily.push({ date: g.dimensions.date, requests: g.sum.requests || 0 });

    (g.sum.countryMap || []).forEach(c => {
      const name = c.clientCountryName || 'Unknown';
      countryTotals[name] = (countryTotals[name] || 0) + (c.requests || 0);
    });
  });

  daily.sort((a, b) => a.date.localeCompare(b.date));

  const topCountries = Object.entries(countryTotals)
    .map(([country, requests]) => ({ country, requests }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 8);

  return {
    totals: { requests: totalRequests, visitors: totalVisitors, pageViews: totalPageViews, bytes: totalBytes },
    daily,
    topCountries,
    topPages: []
  };
}

function parseHourly(zone) {
  const groups = zone.httpRequests1hGroups || [];
  let totalRequests = 0, totalPageViews = 0, totalBytes = 0, totalVisitors = 0;
  const daily = [];
  const countryTotals = {};

  groups.forEach(g => {
    totalRequests  += g.sum.requests  || 0;
    totalPageViews += g.sum.pageViews || 0;
    totalBytes     += g.sum.bytes     || 0;
    totalVisitors  += g.uniq.uniques  || 0;

    const hour = g.dimensions.datetime?.slice(11, 13) || '00';
    daily.push({ date: hour + ':00', requests: g.sum.requests || 0 });

    (g.sum.countryMap || []).forEach(c => {
      const name = c.clientCountryName || 'Unknown';
      countryTotals[name] = (countryTotals[name] || 0) + (c.requests || 0);
    });
  });

  daily.sort((a, b) => a.date.localeCompare(b.date));

  const topCountries = Object.entries(countryTotals)
    .map(([country, requests]) => ({ country, requests }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 8);

  return {
    totals: { requests: totalRequests, visitors: totalVisitors, pageViews: totalPageViews, bytes: totalBytes },
    daily,
    topCountries,
    topPages: []
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
