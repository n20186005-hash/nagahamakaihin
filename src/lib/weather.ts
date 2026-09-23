// 天気データ取得・変換・アドバイス生成（サーバー側で実行）
// データソース: Open-Meteo の予報 API。フロントエンドには「無料/キー不要」といった
// 取得手段は表示しません。訪問者が知りたいのは「天気の目安」と「傘が要るか」だけです。

export interface WeatherData {
  current: {
    temp: number;
    feels: number;
    humidity: number;
    precip: number;
    code: number;
    windKmh: number;
    windDir: number;
    time: string;
  };
  daily: Array<{
    date: string;
    code: number;
    tmax: number;
    tmin: number;
    pop: number;
    windKmh: number;
    uv: number;
  }>;
  updatedAt: string;
}

export interface Advice {
  alert: string[];
  risk: string[];
  outfit: string[];
  plan: string[];
  items: string[];
}

export function buildWeatherUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max',
    timezone: 'Asia/Tokyo',
    forecast_days: '7',
    wind_speed_unit: 'kmh',
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export function wmoToJa(code: number): { label: string; kind: 'sun' | 'cloud' | 'rain' | 'snow' | 'wind' | 'fog' } {
  if (code === 0) return { label: '晴れ', kind: 'sun' };
  if (code === 1) return { label: '大体晴れ', kind: 'sun' };
  if (code === 2) return { label: '一部曇り', kind: 'cloud' };
  if (code === 3) return { label: '曇り', kind: 'cloud' };
  if (code >= 45 && code <= 48) return { label: '霧', kind: 'fog' };
  if (code >= 51 && code <= 57) return { label: '霧雨', kind: 'rain' };
  if (code >= 61 && code <= 67) return { label: '雨', kind: 'rain' };
  if (code >= 71 && code <= 77) return { label: '雪', kind: 'snow' };
  if (code >= 80 && code <= 82) return { label: 'にわか雨', kind: 'rain' };
  if (code >= 85 && code <= 86) return { label: '雪', kind: 'snow' };
  if (code >= 95 && code <= 99) return { label: '雷雨', kind: 'rain' };
  return { label: 'その他', kind: 'cloud' };
}

export function kmhToBeaufort(kmh: number): number {
  const thresholds = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
  let b = 0;
  for (const t of thresholds) {
    if (kmh >= t) b += 1;
    else break;
  }
  return b;
}

export function windDirJa(deg: number): string {
  const dirs = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export async function fetchWeather(lat: number, lon: number, signal?: AbortSignal): Promise<WeatherData> {
  const res = await fetch(buildWeatherUrl(lat, lon), signal ? { signal } : undefined);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const j = await res.json();
  const c = j.current;
  const daily = (j.daily?.time ?? []).map((date: string, i: number) => ({
    date,
    code: j.daily.weather_code?.[i] ?? 0,
    tmax: j.daily.temperature_2m_max?.[i] ?? 0,
    tmin: j.daily.temperature_2m_min?.[i] ?? 0,
    pop: j.daily.precipitation_probability_max?.[i] ?? 0,
    windKmh: j.daily.wind_speed_10m_max?.[i] ?? 0,
    uv: j.daily.uv_index_max?.[i] ?? 0,
  }));
  return {
    current: {
      temp: c.temperature_2m,
      feels: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      precip: c.precipitation,
      code: c.weather_code,
      windKmh: c.wind_speed_10m,
      windDir: c.wind_direction_10m,
      time: c.time,
    },
    daily,
    updatedAt: new Date().toISOString(),
  };
}

export function buildAdvice(w: WeatherData): Advice {
  const cur = w.current;
  const today = w.daily[0] ?? { pop: 0, uv: 0, tmax: cur.temp, tmin: cur.temp, code: 0, windKmh: 0 };
  const pop = today.pop;
  const uv = today.uv;
  const tmax = today.tmax;
  const tmin = today.tmin;
  const b = kmhToBeaufort(cur.windKmh);

  const isThunder = cur.code >= 95;
  const isRain =
    (cur.code >= 51 && cur.code <= 67) || (cur.code >= 80 && cur.code <= 82) || cur.code >= 95;
  const isLightRain = (cur.code >= 51 && cur.code <= 57) || cur.code === 80 || cur.code === 81;
  const isHeavyRain = (cur.code >= 61 && cur.code <= 67) || cur.code === 82 || (pop >= 80 && isRain);
  const isFog = cur.code >= 45 && cur.code <= 48;
  const isSnow = (cur.code >= 71 && cur.code <= 77) || (cur.code >= 85 && cur.code <= 86);
  const isSunny = cur.code === 0 || cur.code === 1;
  const isCloudy = cur.code === 2 || cur.code === 3;

  const alert: string[] = [];
  const risk: string[] = [];
  const outfit: string[] = [];
  const plan: string[] = [];
  const items: string[] = [];

  // 気象リスク（赤・最上位） — 現在の予報から派生。公式の警報・注意報が出た場合は現地の案内を優先。
  if (isThunder) alert.push('雷のおそれがあります。登山・海辺での遊泳・木の下での待機は避け、建物内で待機してください。');
  if (b >= 8) alert.push('強風に注意。海辺の磯や岩場、看板から離れ、飛ばされやすい荷物を確実に持ちましょう。');
  else if (b >= 7) alert.push('強風の目立つ天候です。遊覧船や海上アクティビティは運休の可能性が高く、海辺の岩場には近づかないでください。');
  if (isHeavyRain) alert.push('雨が強く、谷や低い土地への立ち入りは避けてください。遊泳や磯遊びは中止、遊覧船も運休の可能性があります。');
  if (cur.feels >= 35 || tmax >= 35) alert.push('気温が非常に高いです。こまめな水分補給と日陰での休憩を心がけ、熱中症にご注意ください。');

  // その他のリスク（黄）
  if (b >= 5 && b < 7) risk.push('風がやや強く、海辺の遊船や露天施設が運休することがあります。帽子は飛ばされやすいので注意してください。');
  if (isLightRain) risk.push('小雨です。岸壁や磯は滑りやすいので足元に気をつけてください。');
  else if (!isHeavyRain && isRain && pop >= 50) risk.push('雨の可能性があります。滑りやすい岸壁や磯にご注意ください。');
  else if (!isRain && pop >= 60) risk.push('降水確率が高めです。傘があると安心ですが、必ずしも降るとは限りません。');
  if (isFog) risk.push('視界が悪くなることがあります。海辺での見通しにご注意ください。');
  if (uv >= 8) risk.push('紫外線が非常に強いです。日焼け止めと帽子を欠かさずに。');

  // 服装（出行穿搭）
  if (tmax - tmin > 8) outfit.push('昼夜の寒暖差が大きいので、調節しやすい上着があると安心です。');
  if (tmax <= 10) outfit.push('気温が低いので、厚手のコートやマフラーで防寒を。');
  else if (cur.feels < 10) outfit.push('体感が冷えるので、防寒着や厚手の上着があると安心です。');
  else if (cur.feels < 18) outfit.push('羽織るものがあると快適に過ごせます。');
  if (b >= 7) outfit.push('風を通しにくいウインドブレーカーなどがあると、強風時に便利です。');
  if (uv >= 5) outfit.push('紫外線対策の帽子や日傘があると快適です。');
  if (isRain) outfit.push('雨天でも動ける服装や靴がおすすめです。');
  if (isSnow) outfit.push('雪やぬかるみに対応できる靴があると安心です。');

  // 過ごし方（游玩安排）— 海辺の文脈に合わせる
  if (isThunder || b >= 7 || isHeavyRain) {
    plan.push('屋外での海辺遊びは控え、建物内や車内で休憩を挟みましょう。');
  } else if (isLightRain || (isRain && pop >= 50)) {
    plan.push('露天の遊びは体験が落ちるので、屋内や車内で休憩を挟み、潮のタイミングを見て散歩を。');
  } else if (b >= 5) {
    plan.push('風を避けられる芝生側でのんびり過ごすのがおすすめです。');
  } else if (isSunny) {
    plan.push('天気がよく、海辺の散歩や潮だまり観察、日の出・日の入りにも適しています。');
  } else if (isCloudy) {
    plan.push('日差しが柔らかく、長時間の屋外散策や写真撮影に向いています。');
  } else {
    plan.push('砂浜や磯、芝生でのびのび過ごせます。');
  }
  if (isRain || b >= 5) plan.push('海の遊泳や磯遊びは、監視旗と係員の案内を必ず確認してください。');

  // 持ち物（随身物品）
  items.push('タオルと着替え');
  if (pop >= 40 || isRain) items.push('折りたたみ傘やレインウェア');
  if (uv >= 5) items.push('日焼け止めと帽子');
  if (cur.feels < 15) items.push('飲み物（温）');
  else items.push('飲み物（冷）');
  if (b >= 5) items.push('風よけの上着');
  if (isSnow) items.push('替えの靴下');

  return { alert, risk, outfit, plan, items };
}
