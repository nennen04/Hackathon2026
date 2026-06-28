import type {
  ConditionGroup,
  EcoAction,
  RatingCategory,
  TravelIntent,
  TravelPlan,
  VisitHistoryItem,
} from './types';

export const DEFAULT_FREE_TEXT =
  'レンタカーで伊豆に行きたいです。海鮮を食べて、海も見て、温泉に入ってのんびりしたい。';

export const KEYWORD_CHIPS: string[] = ['レンタカー', '伊豆', '海鮮', '海', '温泉'];

export const CONDITION_GROUPS: ConditionGroup[] = [
  {
    id: 'duration',
    label: '滞在日数',
    options: [
      { id: 'day-trip', label: '日帰り' },
      { id: '1night', label: '1泊2日' },
      { id: '2nights', label: '2泊3日' },
      { id: '3nights-plus', label: '3泊以上' },
    ],
  },
  {
    id: 'departure',
    label: '出発地（自宅・主要駅）',
    options: [
      { id: 'home-shinjuku', label: '自宅（新宿駅）' },
      { id: 'home-yokohama', label: '自宅（横浜駅）' },
      { id: 'tokyo', label: '東京駅' },
      { id: 'custom', label: 'その他（駅名入力）' },
    ],
  },
  {
    id: 'companion',
    label: '同行者',
    options: [
      { id: 'solo', label: 'ひとり' },
      { id: 'couple', label: 'カップル' },
      { id: 'family', label: '家族' },
      { id: 'friends', label: '友人' },
    ],
  },
  {
    id: 'style',
    label: '旅行スタイル',
    options: [
      { id: 'relax', label: 'のんびり過ごしたい' },
      { id: 'active', label: 'アクティブに楽しみたい' },
      { id: 'gourmet', label: 'グルメ重視' },
      { id: 'culture', label: '歴史・文化にふれたい' },
    ],
  },
];

export const DEFAULT_SELECTED_CONDITIONS: Record<string, string> = {
  duration: '1night',
  departure: 'home-shinjuku',
  companion: 'couple',
  style: 'relax',
};

export const TRAVEL_INTENT: TravelIntent = {
  destination: '伊豆エリア',
  purposes: ['海鮮', '海', '温泉'],
  transportWish: 'レンタカーで移動',
  travelStyle: 'のんびりドライブ',
  stamina: 'あまり歩き回らない',
  co2Kg: 40,
  budgetYen: 38000,
  fatigueScore: 2,
  aiComment:
    '伊豆へのドライブ旅、素敵ですね。このプランの想定CO₂排出量は約40kgです。電車や公共交通を使うと、よりエコに旅を楽しめます。',
};

export const ORIGINAL_PLAN: TravelPlan = {
  id: 'izu-drive',
  name: '伊豆ドライブ旅',
  label: '原案プラン',
  category: 'original',
  icon: '🚗',
  transport: 'レンタカー',
  description: 'レンタカーで日帰り、海鮮・海・温泉を楽しむのんびりドライブ旅。',
  tags: ['海鮮', '海', '温泉'],
  co2: 40,
  fatigue: 3,
  cost: 38000,
  spotCount: '4〜5か所',
  walkingDistance: 4.8,
  relaxScore: 3.2,
  schedule: [
    { time: '07:30', title: '東京出発（レンタカー）', icon: '🚗' },
    { time: '10:30', title: '伊東エリア到着', icon: '📍' },
    { time: '11:00', title: '海沿いドライブ・写真スポット', icon: '📸' },
    { time: '12:00', title: '海鮮ランチ', icon: '🍽️' },
    { time: '13:30', title: '城ヶ崎海岸散策', icon: '🚶' },
    { time: '15:30', title: '日帰り温泉', icon: '♨️' },
    { time: '17:00', title: '伊豆出発', icon: '🚗' },
    { time: '20:30', title: '東京到着', icon: '🏠' },
  ],
};

export const RECOMMENDED_PLAN: TravelPlan = {
  id: 'miura-train',
  name: '三浦半島・電車旅',
  label: 'おすすめプラン',
  category: 'recommended',
  icon: '🚃',
  transport: '京急線',
  description: '電車移動で移動負担とCO₂を抑えながら、海鮮・絶景・温泉を楽しむプラン。',
  tags: ['海鮮', '海の絶景', '温泉'],
  co2: 8,
  fatigue: 2,
  cost: 28000,
  spotCount: '4〜5か所',
  walkingDistance: 3.1,
  relaxScore: 4.6,
  schedule: [
    { time: '08:30', title: '品川駅出発（京急線）', icon: '🚉' },
    { time: '10:00', title: '三崎口駅到着', icon: '🚃' },
    { time: '10:30', title: '海辺サイクリング', icon: '🚲' },
    { time: '12:00', title: '地元農家カフェランチ', icon: '🍽️' },
    { time: '14:00', title: '海鮮スポット / みさきまぐろきっぷ', icon: '🐟' },
    { time: '16:00', title: '温泉', icon: '♨️' },
    { time: '18:30', title: '帰宅', icon: '🏠' },
  ],
};

export const COMPARISON_NOTE =
  '目的を満たしつつ、移動負担と環境負荷を削減できます。';

export const SIMILAR_PLANS: TravelPlan[] = [
  {
    id: 'okutama',
    name: '奥多摩 森林保全エコウォーク',
    label: '候補プラン',
    category: 'similar',
    icon: '🌲',
    transport: '電車',
    description: '森林保全活動に参加しながら、自然の中でリフレッシュできるプラン。',
    tags: ['自然・ハイキング'],
    co2: 9.6,
    fatigue: 3,
    cost: 13500,
    spotCount: '3〜4か所',
    walkingDistance: 5.2,
    relaxScore: 4.3,
    schedule: [
      { time: '08:00', title: '新宿駅出発（JR・青梅線）', icon: '🚉' },
      { time: '09:45', title: '奥多摩駅到着', icon: '🚃' },
      { time: '10:15', title: '森林保全エコウォーク', icon: '🌲' },
      { time: '12:30', title: '地元食材ランチ', icon: '🍽️' },
      { time: '14:00', title: '渓谷散策', icon: '🚶' },
      { time: '16:00', title: 'カフェ休憩', icon: '☕' },
      { time: '18:00', title: '新宿駅到着', icon: '🏠' },
    ],
  },
  {
    id: 'sawara',
    name: '佐原 小江戸舟めぐり',
    label: '候補プラン',
    category: 'similar',
    icon: '⛵',
    transport: '電車',
    description: '歴史ある町並みと水郷の風景をゆったり楽しめるプラン。',
    tags: ['歴史・水辺'],
    co2: 9.8,
    fatigue: 2,
    cost: 12000,
    spotCount: '4か所',
    walkingDistance: 3.0,
    relaxScore: 4.4,
    schedule: [
      { time: '08:30', title: '東京駅出発（電車）', icon: '🚉' },
      { time: '10:10', title: '佐原駅到着', icon: '🚃' },
      { time: '10:30', title: '小江戸町並み散策', icon: '🚶' },
      { time: '12:00', title: '地元食材ランチ', icon: '🍽️' },
      { time: '13:30', title: 'サッパ舟めぐり', icon: '⛵' },
      { time: '15:00', title: '歴史的建造物カフェ', icon: '☕' },
      { time: '17:30', title: '東京駅到着', icon: '🏠' },
    ],
  },
  {
    id: 'atami',
    name: '熱海 レトロ温泉街と海鮮グルメ旅',
    label: '候補プラン',
    category: 'similar',
    icon: '♨️',
    transport: '電車',
    description: '温泉と海鮮を楽しみながら、移動負担を抑えたプラン。',
    tags: ['グルメ・温泉'],
    co2: 18,
    fatigue: 2,
    cost: 22000,
    spotCount: '4〜5か所',
    walkingDistance: 3.8,
    relaxScore: 4.5,
    schedule: [
      { time: '08:30', title: '東京駅出発（東海道線）', icon: '🚉' },
      { time: '10:10', title: '熱海駅到着', icon: '🚃' },
      { time: '10:30', title: 'レトロ温泉街散策', icon: '🚶' },
      { time: '12:00', title: '海鮮ランチ', icon: '🍽️' },
      { time: '13:30', title: '海辺カフェ', icon: '☕' },
      { time: '15:00', title: '日帰り温泉', icon: '♨️' },
      { time: '18:00', title: '東京駅到着', icon: '🏠' },
    ],
  },
];

export const ECO_ACTIONS: EcoAction[] = [
  {
    id: 'e-bike',
    title: '電動シェアサイクルを利用',
    description: '観光スポット間の移動に',
    points: 20,
    defaultOn: true,
  },
  {
    id: 'local-cafe',
    title: '地元農家カフェで休憩',
    description: '地域の生産者を応援',
    points: 15,
    defaultOn: true,
  },
  {
    id: 'my-bottle',
    title: 'マイボトルを持参',
    description: 'ペットボトルごみを削減',
    points: 10,
    defaultOn: false,
  },
  {
    id: 'eco-inn',
    title: 'エコ宿に宿泊',
    description: '省エネ・地域共生の宿を選択',
    points: 30,
    defaultOn: true,
  },
];

export const RATING_CATEGORIES: RatingCategory[] = [
  { id: 'overall', label: '総合満足度' },
  { id: 'nature', label: '景色・自然' },
  { id: 'gourmet', label: 'グルメ' },
  { id: 'onsen', label: '温泉・リラックス' },
  { id: 'transport', label: '交通の便利さ' },
  { id: 'fatigue', label: '疲労度' },
  { id: 'break', label: '休憩時間の適切さ' },
];

export const DEFAULT_RATINGS: Record<string, number> = {
  overall: 5,
  nature: 5,
  gourmet: 4,
  onsen: 5,
  transport: 4,
  fatigue: 4,
  break: 4,
};

export const DEFAULT_FEEDBACK_COMMENT =
  '海もごはんも温泉も最高でした！電車移動でのんびりできてよかったです。';

export const VISIT_HISTORY: VisitHistoryItem[] = [
  {
    id: 'current',
    label: '今回の旅',
    planName: '三浦半島・電車旅',
    date: '2024/05/18',
    isCurrentTrip: true,
  },
  {
    id: 'past-1',
    label: '過去の旅',
    planName: '伊豆ドライブ旅',
    date: '2024/02/11',
  },
];

export const FEEDBACK_HISTORY_NOTE =
  '訪問済みルートは記録され、次回以降に同じルートが繰り返し推薦されないようにします。';

export const FEEDBACK_TOAST_MESSAGE =
  'フィードバックを保存しました。次回の提案に反映します。';
