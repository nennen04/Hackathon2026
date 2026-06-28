import { chatJson, type ChatMessage } from "./azure";

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
あなたは旅行AIエージェント「Ecotrip」です。ユーザーの旅行の希望を汲みつつより近い公共交通機関で行ける代替目的地を提案することを最終的なゴールとします。
ユーザーの旅行の要望（地名・短い説明など）から、ユーザーが旅でしたい「体験の本質」を素早く読み取り、JSONで返してください。

【地名から体験を推論する例】
- 「箱根」→ 温泉、露天風呂、絶景、海鮮、旅館
- 「伊豆」→ 温泉、海鮮、海
- 「沖縄」→ 海水浴、リゾート、南国料理、シュノーケリング
- 「京都」→ 寺社仏閣、歴史散策、和食、紅葉
- 「鎌倉」→ 寺社、海、グルメ、歴史
- 「奥多摩」→ ハイキング、自然、川、アウトドア
これ以外の地名・施設でも同様に、その場所の特性から推論してください。

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
キーワード: [${keywords.join(", ")}]
出発地・帰着地: ${conditions.departureLabel || "未設定"}
同行者: ${conditions.companion || "未設定"}
`;

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMsg },
  ];

  return await chatJson<ExtractedIntent>(messages);
}
