// Cloudflare Worker: 静的資産を配信しつつ、/api/weather でサーバー側取得＋エッジキャッシュを提供。
import { fetchWeather, buildAdvice } from './lib/weather';

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/weather') {
      return handleWeather();
    }

    // それ以外はビルド済み静的資産を配信
    return env.ASSETS.fetch(request);
  },
};

async function handleWeather(): Promise<Response> {
  const lat = 35.0561852;
  const lon = 139.0690894;
  const cache = caches.default;
  const cacheKey = new Request('https://cache.internal/nagahama-weather', { method: 'GET' });

  try {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  } catch {
    // キャッシュ不搭載環境では無視
  }

  try {
    const weather = await fetchWeather(lat, lon);
    const payload = { ...weather, advice: buildAdvice(weather) };
    const res = new Response(JSON.stringify(payload), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=600',
      },
    });
    try {
      await cache.put(cacheKey, res.clone());
    } catch {
      // キャッシュ書き込み失敗は無視
    }
    return res;
  } catch {
    return new Response(JSON.stringify({ error: 'weather_unavailable' }), {
      status: 503,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}
