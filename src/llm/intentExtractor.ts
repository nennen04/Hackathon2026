import { chatJson, type ChatMessage } from './azure';

export interface ExtractedIntent {
  /** AIが推測したユーザーの目的地 */
  destination: string;
  /** AIが推測した体験タグ（例: ["温泉", "海鮮", "絶景"]）*/
  experienceTags: string[];
  /** AIからの一言メッセージ */
  shortMessage: string;
}

const SYSTEM_PROMPT = `
あなたは旅行AIエージェント「Ecotrip」です。
ユーザーの旅行の要望（地名・短い説明など）から、ユーザーが旅でしたい「体験の本質」を素早く読み取り、JSONで返してください。

【地名から体験を推論する例】
- 「箱根」→ 温泉、露天風呂、絶景、海鮮、旅館
- 「伊豆」→ 温泉、海鮮、海、ドライブ
- 「沖縄」→ 海水浴、リゾート、南国料理、シュノーケリング
- 「京都」→ 寺社仏閣、歴史散策、和食、紅葉
- 「鎌倉」→ 寺社、海、グルメ、歴史
- 「奥多摩」→ ハイキング、自然、川、アウトドア
これ以外の地名・施設でも同様に、その場所の特性から推論してください。

返却フォーマット（JSON のみ、他のテキスト不要）:
{
  "destination": "ユーザーが示した目的地や地域（例: 箱根エリア）",
  "experienceTags": ["体験タグ1（例: 温泉）", "体験タグ2（例: 海鮮）", "体験タグ3（例: 絶景）"],
  "shortMessage": "ユーザーへの1文の自然な語りかけ（例: 箱根で温泉と絶景を楽しむ旅ですね！近くで同じ体験ができる穴場もご提案します🌿）"
}

タグは3〜7個程度で、具体的で選びやすいものにしてください。
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
