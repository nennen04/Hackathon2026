import { chatJson, type ChatMessage } from './azure';
import { suggestPlaces, fetchJourneys } from '../api/transit';
import { deriveLegs } from '../domain/plan';
import { computeMetrics } from '../domain/metrics';
import { createEmissionModel } from '../co2/emissionModel';
import { haversineM } from '../utils/geo';
import type { TravelIntent, TravelPlan, ScheduleStep } from '../types';
import type { Stop, Place, Leg } from '../domain/types';

const co2Model = createEmissionModel();
const CAR_CO2_FACTOR_G_KM = 130; // g-CO2 / km for driving

interface LlmPlanDraft {
  name: string;
  icon: string;
  transport: 'car' | 'train' | 'bus' | 'walk';
  description: string;
  tags: string[];
  cost: number;
  fatigue: number;
  relaxScore: number;
  stops: {
    name: string;
    searchQuery: string;
    purposeTag?: string;
    dwellMins: number;
  }[];
}

interface LlmResponse {
  intent: {
    destination: string;
    purposes: string[];
    transportWish: string;
    travelStyle: string;
    stamina: string;
    budgetYen: number;
    fatigueScore: number;
    aiComment: string;
  };
  originalPlan: LlmPlanDraft;
  recommendedPlan: LlmPlanDraft;
  similarPlans: LlmPlanDraft[];
}

const SYSTEM_PROMPT = `
あなたは「Ecotrip」というWebアプリのAIエージェントです。
Ecotripのコンセプトは「遠くの有名観光地」から「近くのサステナブルな旅」へです。

【あなたの役割】
ユーザーが計画している旅行プランを受け取り、以下の2ステップで考えてください。

ステップ1: 「体験・目的」の本質を読み取る
ユーザーが書いた「どこに行きたい」という具体的な地名ではなく、「何をしたいか・どんな体験をしたいか」という本質的な意図を読み取ってください。
例）「伊豆に行きたい、温泉と海鮮」→ 本質: 「温泉でリラックスしたい」「新鮮な海の幸を食べたい」
例）「沖縄でリゾートしたい」→ 本質: 「海辺でのんびりしたい」「非日常的な自然を感じたい」

ステップ2: 「近くて同じ体験ができる場所」を積極的に探す
originalPlanはユーザーの元のプランをできるだけ忠実に再現してください。
recommendedPlanとsimilarPlansでは、ユーザーの「体験の本質」を満たしつつ、出発地（東京・首都圏想定）からできるだけ近い代替目的地を提案してください。
「有名だから遠くへ行く」のではなく、「同じ体験が近くでもできる」という視点で、あまり知られていないが魅力的な近場のスポットを発掘してください。

【近距離代替地の例】
- 「伊豆・温泉・海鮮」→ 三浦半島（横須賀・三崎口）、江の島・鎌倉、熱海（新幹線でアクセス）、東伊豆（電車圏内）
- 「山・ハイキング・自然」→ 高尾山、奥多摩、秩父、丹沢
- 「歴史・寺社・文化」→ 川越（小江戸）、鎌倉、佐原、日光（電車可）
- 「海・リゾート」→ 三浦海岸、葉山、逗子、江の島
- 「グルメ・食文化」→ 各地の地元市場・産地直送エリア（横浜中華街など）

【重要な制約事項】
1. recommendedPlan・similarPlansは、originalPlanよりCO2排出量が明らかに少なくなる目的地・移動手段を選んでください。
2. 移動手段は電車・バス・徒歩を優先してください。
3. 同じ「体験価値」（海鮮なら海鮮、温泉なら温泉）は必ず満たしてください。ユーザーが諦める必要はありません。
4. aiCommentでは、提案の理由を「なぜここが近くてサステナブルなのか」「どれだけCO2が減るか」を具体的に説明してください。
5. 出発地と最終帰着地（最初と最後のstop）は、東京・品川などの主要駅を含めてください。
6. 駅や観光施設は実在する正式な名称を使用してください（例: '三崎口駅', '熱海駅', '高尾山口駅'）。
7. JSON以外のテキストは一切含めないでください。

返却するJSONフォーマット:
{
  "intent": {
    "destination": "ユーザーが元々望んでいた目的地（例: 伊豆エリア）",
    "purposes": ["体験の本質キーワード1（例: 温泉）", "体験の本質キーワード2（例: 海鮮）"],
    "transportWish": "移動に関するユーザーの希望（例: レンタカーで移動）",
    "travelStyle": "旅行スタイルの要約（例: のんびりドライブ）",
    "stamina": "体力的要求（例: あまり歩き回らない）",
    "budgetYen": 予想予算（数値、例: 38000）,
    "fatigueScore": 疲労度（1から5の数値）,
    "aiComment": "なぜこの代替プランがよりエコでサステナブルなのか、CO2削減の観点から具体的に説明した2〜3文のコメント"
  },
  "originalPlan": {
    "name": "原案プラン名（例: 伊豆ドライブ旅）",
    "icon": "プランを代表する絵文字（例: 🚗）",
    "transport": "主な移動手段（'car', 'train', 'bus', 'walk' のいずれか）",
    "description": "プランの概要文",
    "tags": ["タグ1", "タグ2"],
    "cost": 予算目安（数値）,
    "fatigue": 疲労度（1から5の数値）,
    "relaxScore": リラックス度（1.0から5.0の数値）,
    "stops": [
      {
        "name": "立ち寄り先名（日本の実在する駅や観光施設）",
        "searchQuery": "駅名や観光地名（例: '伊東駅', '城ヶ崎海岸駅'。必ず実在する正式な名称）",
        "purposeTag": "この場所での行動や目的（例: 海鮮ランチ, 絶景散策, 日帰り温泉）",
        "dwellMins": 滞在時間（分）
      }
    ]
  },
  "recommendedPlan": {
    "name": "おすすめプラン名（例: 三浦半島 近場エコ旅）",
    "icon": "絵文字（例: 🚃）",
    "transport": "主な移動手段（'train', 'bus', 'walk' のいずれか）",
    "description": "なぜこのプランがエコでサステナブルか、どんな体験ができるかを説明した概要文",
    "tags": ["タグ1", "タグ2"],
    "cost": 予算目安（数値）,
    "fatigue": 疲労度（1から5の数値）,
    "relaxScore": リラックス度（1.0から5.0の数値）,
    "stops": [
      {
        "name": "立ち寄り先名",
        "searchQuery": "駅名や観光地名",
        "purposeTag": "目的や行動",
        "dwellMins": 滞在時間（分）
      }
    ]
  },
  "similarPlans": [
    {
      "name": "候補プラン名（別の近場エコ代替案）",
      "icon": "絵文字",
      "transport": "主な移動手段（'train', 'bus', 'walk' のいずれか）",
      "description": "プラン概要文",
      "tags": ["タグ1"],
      "cost": 予算目安（数値）,
      "fatigue": 疲労度（1から5の数値）,
      "relaxScore": リラックス度（1.0から5.0の数値）,
      "stops": [
        {
          "name": "立ち寄り先名",
          "searchQuery": "駅名や観光地名",
          "purposeTag": "目的や行動",
          "dwellMins": 滞在時間（分）
        }
      ]
    }
  ]
}
`;

// 地名からPlaceオブジェクトに解決する。見つからない場合はデフォルトの東京駅を返す。
async function resolvePlaces(draftStops: LlmPlanDraft['stops']): Promise<Stop[]> {
  const stops: Stop[] = [];
  for (let i = 0; i < draftStops.length; i++) {
    const s = draftStops[i];
    let place: Place | null = null;
    try {
      const results = await suggestPlaces(s.searchQuery, 1);
      if (results && results.length > 0) {
        place = results[0];
      }
    } catch (e) {
      console.error(`Failed to resolve: ${s.searchQuery}`, e);
    }

    if (!place) {
      // フォールバック
      place = {
        id: `dummy-${i}`,
        name: s.name,
        lat: 35.6812, // 東京駅
        lon: 139.7671,
        kind: 'place',
      };
    }

    stops.push({
      id: `${place.id}-${i}`,
      place,
      purposeTag: s.purposeTag,
      dwellMins: s.dwellMins,
    });
  }
  return stops;
}

// タイムラインのスケジュールを構築する
function buildSchedule(stops: Stop[], legs: Leg[], isCar: boolean, startTimeStr = '08:30'): ScheduleStep[] {
  const schedule: ScheduleStep[] = [];
  let [hours, minutes] = startTimeStr.split(':').map(Number);

  const addMinutes = (m: number) => {
    minutes += m;
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
    hours = hours % 24;
  };

  const formatTime = () => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];

    // スポット訪問
    schedule.push({
      time: formatTime(),
      title: stop.place.name,
      description: stop.purposeTag ?? `${stop.dwellMins}分滞在`,
      icon: i === 0 ? '🛫' : i === stops.length - 1 ? '🏠' : '📍',
    });

    addMinutes(stop.dwellMins);

    // 次のスポットへの移動
    if (i < legs.length) {
      const leg = legs[i];
      const transportTime = Math.round(leg.durationSecs / 60);
      let transportDesc = '';

      if (isCar) {
        transportDesc = 'レンタカー移動';
      } else {
        const routeNames = leg.segments
          .map((s) => s.routeName || (s.mode === 'walk' ? '徒歩' : s.mode))
          .filter(Boolean);
        transportDesc = routeNames.length > 0 ? routeNames.join(' → ') : '公共交通機関移動';
      }

      schedule.push({
        time: formatTime(),
        title: `${transportDesc} (${(leg.distanceM / 1000).toFixed(1)}km)`,
        description: `所要時間: 約${transportTime}分`,
        icon: isCar ? '🚗' : '🚃',
      });

      addMinutes(transportTime);
    }
  }

  return schedule;
}

// LlmPlanDraftから完成したTravelPlanを計算して構築する
async function compilePlan(draft: LlmPlanDraft, id: string, category: 'original' | 'recommended' | 'similar', label?: string): Promise<TravelPlan> {
  const stops = await resolvePlaces(draft.stops);
  const isCar = draft.transport === 'car';

  // legsの導出
  // 車の場合は、直線距離 * 1.3をベースに、時速35km/h (= 9.7 m/s) としてシミュレートする
  let legs: Leg[] = [];
  if (isCar) {
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      const distanceM = haversineM(a.place.lat, a.place.lon, b.place.lat, b.place.lon) * 1.3;
      const durationSecs = Math.round(distanceM / 9.7);
      legs.push({
        fromStopId: a.id,
        toStopId: b.id,
        segments: [{ mode: 'bus', distanceM, durationSecs }], // ダミーモード
        durationSecs,
        transferCount: 0,
        distanceM,
        co2g: (distanceM / 1000) * CAR_CO2_FACTOR_G_KM,
      });
    }
  } else {
    // 公共交通機関
    legs = await deriveLegs(stops, fetchJourneys, co2Model);
  }

  const metrics = computeMetrics(legs);
  const totalCo2Kg = Math.round(metrics.totalCo2g / 100) / 10; // kg表記

  // 徒歩距離の概算
  let walkingDistanceKm = 0;
  for (const leg of legs) {
    for (const seg of leg.segments) {
      if (seg.mode === 'walk') {
        walkingDistanceKm += seg.distanceM / 1000;
      }
    }
  }
  // 電車や車旅でも、スポット内や前後で少しは歩くので、最低限の徒歩を加算
  if (walkingDistanceKm === 0) {
    walkingDistanceKm = isCar ? 1.2 : 2.5;
  }
  walkingDistanceKm = Math.round(walkingDistanceKm * 10) / 10;

  const schedule = buildSchedule(stops, legs, isCar);

  return {
    id,
    name: draft.name,
    label,
    category,
    icon: draft.icon,
    transport: isCar ? 'レンタカー' : draft.transport === 'bus' ? 'バス' : '電車・徒歩',
    description: draft.description,
    tags: draft.tags,
    co2: totalCo2Kg || 1, // 最低1kg
    fatigue: draft.fatigue,
    cost: draft.cost,
    spotCount: `${stops.length - 2 > 0 ? stops.length - 2 : stops.length}か所`,
    walkingDistance: walkingDistanceKm,
    relaxScore: draft.relaxScore,
    schedule,
  };
}

export async function generateTravelPlans(
  freeText: string,
  keywords: string[],
  conditions: Record<string, string>,
): Promise<{ intent: TravelIntent; plans: TravelPlan[] }> {
  const userPrompt = `
自由記述の要望: "${freeText}"
選択キーワード: [${keywords.join(', ')}]
条件設定:
- 滞在日数: ${conditions.duration || '未設定'}
- 移動手段の希望: ${conditions.transport || '未設定'}
- 同行者: ${conditions.companion || '未設定'}
- 旅行スタイル: ${conditions.style || '未設定'}
`;

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const llmRes = await chatJson<LlmResponse>(messages);

  // 1. 各プランのコンパイルを実行
  const original = await compilePlan(llmRes.originalPlan, 'original-plan', 'original', '原案プラン');
  const recommended = await compilePlan(llmRes.recommendedPlan, 'recommended-plan', 'recommended', 'おすすめプラン');
  
  const plans: TravelPlan[] = [original, recommended];

  if (llmRes.similarPlans && llmRes.similarPlans.length > 0) {
    for (let i = 0; i < llmRes.similarPlans.length; i++) {
      const sim = await compilePlan(llmRes.similarPlans[i], `similar-plan-${i}`, 'similar', '候補プラン');
      plans.push(sim);
    }
  }

  // 2. Extracted Intent を構成
  const intent: TravelIntent = {
    destination: llmRes.intent.destination,
    purposes: llmRes.intent.purposes,
    transportWish: llmRes.intent.transportWish,
    travelStyle: llmRes.intent.travelStyle,
    stamina: llmRes.intent.stamina,
    co2Kg: original.co2, // 元プランのCO2を基準にする
    budgetYen: llmRes.intent.budgetYen || original.cost,
    fatigueScore: llmRes.intent.fatigueScore || original.fatigue,
    aiComment: llmRes.intent.aiComment,
  };

  return { intent, plans };
}
