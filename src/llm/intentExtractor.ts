import { chatJson, type ChatMessage } from './azure';

export interface DestinationCandidate {
  id: string;
  name: string;
  isAlternative: boolean;
  co2SavingPercent: number;
  reason: string;
}

export interface ExtractedIntent {
  /** AIが推測したユーザーの目的地 */
  destination: string;
  /** 近場の候補地リスト（元の目的地も含む） */
  candidates: DestinationCandidate[];
  /** AIが推測した体験タグ（例: ["温泉", "海鮮", "絶景"]）*/
  experienceTags: string[];
  /** AIからの一言メッセージ */
  shortMessage: string;
}

const SYSTEM_PROMPT = `
あなたは旅行AIエージェント「Ecotrip」です。
ユーザーの旅行の要望から、体験の本質を読み取り、より近場で行きやすいサステナブルな代替目的地候補を2つ提案し、JSONで返してください。

【近場エコ代替地のアイデア例（出発地：東京・首都圏の場合）】
- 元が「伊豆・熱海」→ 代替案: 「三浦半島（三崎港・葉山）」（電車1.5時間、マグロと海）、「小田原・早川」（電車1時間弱、海の幸）
- 元が「日光・鬼怒川」→ 代替案: 「川越（小江戸）」（電車45分、歴史情緒）、「高尾山・奥多摩」（電車1時間強、温泉と自然）
- 元が「軽井沢」→ 代替案: 「奥多摩」（山・自然散策）、「鎌倉・葉山」（高原の代わりに爽やかな海辺の散策）
- 元が「京都」→ 代替案: 「鎌倉」（古都・寺社・歴史散策）、「川越」（蔵造りの街並み・和風文化）
- 元が「沖縄・石垣島」→ 代替案: 「三浦半島・城ヶ崎」（美しい海と磯歩き）、「江の島」（手軽な海リゾート気分）
※上記は一例です。ユーザーが指定する出発地（conditions）から物理的距離が近い場所を適切に推論してください。

返却フォーマット（JSON のみ、他のテキスト不要）:
{
  "destination": "ユーザーが元々考えている目的地（例: 伊豆エリア）",
  "candidates": [
    {
      "id": "original",
      "name": "元の目的地名（例: 伊豆エリア）",
      "isAlternative": false,
      "co2SavingPercent": 0,
      "reason": "ユーザーが元々希望されたエリアです。"
    },
    {
      "id": "alt-1",
      "name": "近場代替地名1（例: 三浦半島エリア）",
      "isAlternative": true,
      "co2SavingPercent": 60,
      "reason": "新宿から快速で約90分。地産地消の新鮮な三崎まぐろを楽しめ、移動CO2を60%削減できます。"
    },
    {
      "id": "alt-2",
      "name": "近場代替地名2（例: 小田原・早川エリア）",
      "isAlternative": true,
      "co2SavingPercent": 40,
      "reason": "電車で約1時間。相模湾の新鮮な海鮮ランチと小田原城の歴史散策を近場で満喫できます。"
    }
  ],
  "experienceTags": ["体験タグ1（例: 温泉）", "体験タグ2（例: 海鮮）", "体験タグ3（例: 絶景）"],
  "shortMessage": "ユーザーへの1文の語りかけ（例: 伊豆でのんびり温泉と海鮮を味わう旅ですね！実はもっと近くでも同じような体験ができるおすすめのエコな目的地があります🌿）"
}

「experienceTags」は3〜7個程度で、具体的で選びやすいものにしてください。
「co2SavingPercent」は、移動距離の短縮によって削減されるCO2排出量の目安（20%〜80%程度）を数値で入れてください。
`;

export async function extractTravelIntent(
  freeText: string,
  keywords: string[],
  conditions: Record<string, string>,
): Promise<ExtractedIntent> {
  const userMsg = `
旅行の要望: "${freeText}"
キーワード: [${keywords.join(', ')}]
出発地・帰着地: ${conditions.departureLabel || '未設定'}
同行者: ${conditions.companion || '未設定'}
`;

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMsg },
  ];

  return await chatJson<ExtractedIntent>(messages);
}
