// Azure OpenAI クライアント。鍵の扱いはこのモジュールに隔離する。
// 現状はブラウザ直接呼び出し（VITE_ 環境変数 = バンドルに露出、ローカル検証専用）。
// 配信時はこのファイルの fetch 先を dev プロキシ/バックエンドに差し替えるだけでよい。

const ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT as string | undefined
const API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY as string | undefined
const DEPLOYMENT_MINI = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_MINI as string | undefined
const API_VERSION =
  (import.meta.env.VITE_AZURE_OPENAI_API_VERSION as string | undefined) ?? '2024-10-21'

export function isLlmConfigured(): boolean {
  return Boolean(ENDPOINT && API_KEY && DEPLOYMENT_MINI)
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Chat Completions を JSON モードで呼び、本文を JSON.parse して返す。
 * 設定不足・HTTP エラー・パース失敗時は例外を投げる（呼び出し側が握りつぶす）。
 */
export async function chatJson<T>(messages: ChatMessage[]): Promise<T> {
  if (!isLlmConfigured()) throw new Error('Azure OpenAI is not configured')
  const url = `${ENDPOINT}/openai/deployments/${DEPLOYMENT_MINI}/chat/completions?api-version=${API_VERSION}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': API_KEY as string },
    body: JSON.stringify({
      messages,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error(`Azure OpenAI failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('Azure OpenAI returned no content')
  return JSON.parse(content) as T
}
