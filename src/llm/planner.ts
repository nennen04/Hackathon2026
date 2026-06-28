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
あなたは日本の旅行プランを作成し、そのCO2排出量を評価・最適化するAIアシスタントです。
ユーザーの自然言語による要望と条件（日数、移動手段、同行者、スタイル）を読み取り、以下のJSONフォーマットで回答してください。

返却するJSONフォーマット:
{
  "intent": {
    "destination": "主要な目的地（例: 伊豆エリア）",
    "purposes": ["目的のキーワード1", "目的のキーワード2"],
    "transportWish": "移動に関するユーザーの希望（例: レンタカーで移動）",
    "travelStyle": "旅行スタイルの要約（例: のんびりドライブ）",
    "stamina": "体力的要求（例: あまり歩き回らない）",
    "budgetYen": 予想予算（数値、例: 38000）,
    "fatigueScore": 疲労度（1から5の数値）,
    "aiComment": "ユーザーの計画に対するAIからの短いアドバイスやコメント"
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
        "searchQuery": "駅名や観光地名（transit APIで検索・座標解決しやすいもの、例: '伊東駅', '城ヶ崎海岸駅', '熱海駅'。必ず実在する正式な名称）",
        "purposeTag": "この場所での行動や目的（例: 海鮮ランチ, 絶景散策, 日帰り温泉）",
        "dwellMins": 滞在時間（分）
      }
    ]
  },
  "recommendedPlan": {
    "name": "おすすめプラン名（環境負荷を抑えたエコプラン。主な移動手段は電車やバスにすること）",
    "icon": "絵文字（例: 🚃）",
    "transport": "主な移動手段（'train', 'bus', 'walk' のいずれか）",
    "description": "エコでスマートな代替プランの概要文",
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
      "name": "候補プラン名（エコプランの別バリエーションや別の近い目的地）",
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

制約事項:
1. 駅や観光施設は、実在する正式な名称を使用してください（Transit APIで検索可能なもの）。
2. 出発地と最終帰着地（最初と最後のstop）は、東京や品川などの主要な駅またはユーザーの現在地を想定してプランに含めてください（例: 最初が「東京駅」、最後が「東京駅」）。
3. originalPlanはユーザーの入力（レンタカー希望ならレンタカー）に合わせ、recommendedPlanとsimilarPlansは必ず電車やバス、徒歩など公共交通機関を使ったエコプランにしてください。
4. JSON以外のテキストは一切含めないでください。
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
