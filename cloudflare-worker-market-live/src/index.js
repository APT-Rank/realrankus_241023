/**
 * Cloudflare Worker: Real-time Market Indices API for realrankus.com/moneyflow
 * - Caches response in Cloudflare Edge Cache for 60 seconds (100% Free Tier, max ~1440 reqs/day)
 * - Returns exact JSON matching moneyflow/market_hourly_info.json schema
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json; charset=utf-8'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. Check Cloudflare Edge Cache
    const cacheUrl = new URL(request.url);
    // Ignore query parameters for cache lookup so all users share the same 60s cache
    const cacheKey = new Request(cacheUrl.origin + cacheUrl.pathname, request);
    const cache = caches.default;
    let cachedResponse = await cache.match(cacheKey);

    // If cache hit and client didn't explicitly request bypass
    const urlObj = new URL(request.url);
    const isForceBypass = urlObj.searchParams.get('force') === 'true';

    if (cachedResponse && !isForceBypass) {
      return cachedResponse;
    }

    // 2. Fetch fresh live data in parallel
    try {
      const marketData = await fetchAllMarketData();
      
      const response = new Response(JSON.stringify(marketData, null, 4), {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=60, s-maxage=60',
          'X-Source': 'live-fetch'
        }
      });

      // Store in edge cache
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch (err) {
      // Fallback to existing R2 static file on any catastrophic error
      try {
        const fallbackUrl = 'https://pub-94f5de39bb1c41df96475dfd371c08b2.r2.dev/moneyflow/market_hourly_info.json';
        const fallbackRes = await fetch(fallbackUrl);
        const fallbackJson = await fallbackRes.json();
        return new Response(JSON.stringify(fallbackJson, null, 4), {
          headers: {
            ...corsHeaders,
            'Cache-Control': 'public, max-age=30',
            'X-Source': 'r2-fallback'
          }
        });
      } catch (fallbackErr) {
        return new Response(JSON.stringify({ error: 'Failed to fetch market data', details: String(err) }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }
  }
};

async function fetchAllMarketData() {
  const result = {};

  // 1. 국내 증시 (KOSPI, KOSDAQ, KOSPI200)
  const pKorStock = fetch('https://polling.finance.naver.com/api/realtime?query=SERVICE_INDEX:KOSPI,KOSDAQ,KPI200', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }).then(async (res) => {
    if (!res.ok) return;
    const json = await res.json();
    const datas = json?.result?.areas?.[0]?.datas || [];
    const mapping = { 0: 'KOSPI', 1: 'KOSDAQ', 2: 'KOSPI200' };
    for (const [idx, name] of Object.entries(mapping)) {
      if (datas[idx]) {
        const nv = Number(datas[idx].nv) / 100;
        const cv = Number(datas[idx].cv) / 100;
        const cr = Number(datas[idx].cr);
        result[name] = {
          value: Math.round(nv * 100) / 100,
          diff: Math.round(cv * 100) / 100,
          rate: Math.round(cr * 100) / 100
        };
      }
    }
  }).catch(() => {});

  // 2. 네이버 모바일 상세 API 헬퍼
  const fetchNaverDetail = (category, reutersCode, targetName) => {
    const url = `https://m.stock.naver.com/front-api/marketIndex/productDetail?category=${category}&reutersCode=${reutersCode}`;
    return fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      .then(async (res) => {
        if (!res.ok) return;
        const json = await res.json();
        if (json?.isSuccess && json.result) {
          const r = json.result;
          let num = parseFloat(String(r.closePrice || '0').replace(/,/g, ''));
          let diff = parseFloat(String(r.fluctuations || '0').replace(/,/g, ''));
          let rate = parseFloat(String(r.fluctuationsRatio || '0').replace(/,/g, ''));
          if (r.fluctuationsType?.name === 'FALLING') {
            diff = -Math.abs(diff);
            rate = -Math.abs(rate);
          }
          const isHighPrecision = targetName.includes('Bond') || targetName.includes('Copper');
          result[targetName] = {
            value: isHighPrecision ? Math.round(num * 10000) / 10000 : Math.round(num * 100) / 100,
            diff: isHighPrecision ? Math.round(diff * 10000) / 10000 : Math.round(diff * 100) / 100,
            rate: Math.round(rate * 100) / 100
          };
        }
      })
      .catch(() => {});
  };

  // 3. 미국 3대 지수
  const pUsStocks = Promise.all([
    fetchNaverDetail('worldIndex', '.DJI', 'DOW'),
    fetchNaverDetail('worldIndex', '.IXIC', 'NAS'),
    fetchNaverDetail('worldIndex', '.SPX', 'SNP')
  ]);

  // 4. 환율
  const pCurrencies = Promise.all([
    fetchNaverDetail('exchange', 'FX_USDKRW', 'USDKRW'),
    fetchNaverDetail('exchange', 'FX_JPYKRW', 'JPYKRW'),
    fetchNaverDetail('exchange', 'FX_EURKRW', 'EURKRW'),
    fetchNaverDetail('exchange', 'FX_CNYKRW', 'CNYKRW'),
    fetchNaverDetail('exchange', '.DXY', 'Dollar_Index')
  ]);

  // 5. 원자재 / 에너지 / 금속
  const pCommodities = Promise.all([
    fetchNaverDetail('energy', 'CLc1', 'WTI'),
    fetchNaverDetail('energy', 'CLc1', 'YF_WTI'),
    fetchNaverDetail('energy', 'DCBc1', 'Dubai'),
    fetchNaverDetail('energy', 'LCOc1', 'Brent'),
    fetchNaverDetail('energy', 'LCOc1', 'YF_Brent'),
    fetchNaverDetail('metals', 'GCcv1', 'YF_Gold'),
    fetchNaverDetail('metals', 'SIcv1', 'YF_Silver'),
    fetchNaverDetail('metals', 'HGcv1', 'YF_Copper')
  ]);

  // 6. 암호화폐 (업비트)
  const pCrypto = fetch('https://api.upbit.com/v1/ticker?markets=USDT-BTC,USDT-ETH,USDT-XRP', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }).then(async (res) => {
    if (!res.ok) return;
    const items = await res.json();
    for (const item of items) {
      const sym = item.market;
      const cur = parseFloat(item.trade_price);
      const open = parseFloat(item.opening_price);
      const diff = cur - open;
      const rate = open ? ((cur - open) / open) * 100 : 0;
      const isXRP = sym === 'USDT-XRP';
      result[sym] = {
        value: isXRP ? Math.round(cur * 10000) / 10000 : Math.round(cur * 100) / 100,
        diff: isXRP ? Math.round(diff * 10000) / 10000 : Math.round(diff * 100) / 100,
        rate: Math.round(rate * 100) / 100
      };
    }
  }).catch(() => {});

  // 7. 채권
  const pBonds = Promise.all([
    fetchNaverDetail('bond', 'KR3YT=RR', 'KR3YT_Bond'),
    fetchNaverDetail('bond', 'KR5YT=RR', 'KR5YT_Bond'),
    fetchNaverDetail('bond', 'KR10YT=RR', 'KR10YT_Bond'),
    fetchNaverDetail('bond', 'KR30YT=RR', 'KR30YT_Bond'),
    fetchNaverDetail('bond', 'US3YT=RR', 'US3YT_Bond'),
    fetchNaverDetail('bond', 'US5YT=RR', 'US5YT_Bond'),
    fetchNaverDetail('bond', 'US10YT=RR', 'US10YT_Bond'),
    fetchNaverDetail('bond', 'US30YT=RR', 'US30YT_Bond')
  ]);

  // 모든 외부 호출 병렬 완료 대기 (~200ms)
  await Promise.allSettled([
    pKorStock,
    pUsStocks,
    pCurrencies,
    pCommodities,
    pCrypto,
    pBonds
  ]);

  // 폴백 보충: 혹시라도 빠진 지표가 있으면 R2 캐시에서 채우기
  try {
    const fallbackRes = await fetch('https://pub-94f5de39bb1c41df96475dfd371c08b2.r2.dev/moneyflow/market_hourly_info.json');
    if (fallbackRes.ok) {
      const cached = await fallbackRes.json();
      for (const [k, v] of Object.entries(cached)) {
        if (!result[k] && k !== 'GENERATE') {
          result[k] = v;
        }
      }
    }
  } catch (_) {}

  // KST 현재 시간 생성
  const now = new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const nowStr = kstTime.toISOString().replace('T', ' ').substring(0, 19);

  result['GENERATE'] = {
    value: nowStr,
    diff: nowStr,
    rate: nowStr
  };

  return result;
}

