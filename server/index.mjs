import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { INTENT_SYSTEM_PROMPT, buildPlanSystemPrompt } from './prompts.mjs';

const {
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_DEPLOYMENT,
  AZURE_OPENAI_DEPLOYMENT_MINI,
  AZURE_OPENAI_API_VERSION,
  PORT = 8787,
} = process.env;

if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
  console.error('AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY が .env に設定されていません');
}

// This deployment occasionally emits the U+FFFD replacement character when a
// CJK token is repeated many times in one completion (a sampling glitch, not
// a network/encoding bug — confirmed by inspecting the raw bytes). Retry once
// on a fresh sample rather than surfacing garbled Japanese to the user.
async function callAzureOpenAIOnce(deployment, messages) {
  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${deployment}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_API_KEY,
    },
    body: JSON.stringify({
      messages,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Azure OpenAI ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Azure OpenAI からの応答が空です');
  }
  if (content.includes('�')) {
    throw new Error('CORRUPTED_OUTPUT');
  }
  return JSON.parse(content);
}

async function callAzureOpenAI(deployment, messages, retries = 1) {
  try {
    return await callAzureOpenAIOnce(deployment, messages);
  } catch (err) {
    if (retries > 0 && (err.message === 'CORRUPTED_OUTPUT' || err instanceof SyntaxError)) {
      console.warn('[callAzureOpenAI] retrying after corrupted/invalid output');
      return callAzureOpenAI(deployment, messages, retries - 1);
    }
    throw err;
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/extract-intent', async (req, res) => {
  try {
    const { freeText, keywords, conditions } = req.body ?? {};
    const userMessage = [
      `自由入力テキスト: ${freeText ?? ''}`,
      `選択キーワード: ${(keywords ?? []).join('、')}`,
      `選択条件: ${JSON.stringify(conditions ?? {})}`,
    ].join('\n');

    const intent = await callAzureOpenAI(AZURE_OPENAI_DEPLOYMENT_MINI || AZURE_OPENAI_DEPLOYMENT, [
      { role: 'system', content: INTENT_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ]);

    res.json(intent);
  } catch (err) {
    console.error('[extract-intent]', err);
    res.status(500).json({ error: String(err?.message ?? err) });
  }
});

app.post('/api/generate-plans', async (req, res) => {
  try {
    const { intent } = req.body ?? {};
    const destination = intent?.destination ?? '指定エリア';
    const userMessage = `旅行者の意図:\n${JSON.stringify(intent ?? {}, null, 2)}\n\n行き先は必ず「${destination}」にしてください。`;

    const raw = await callAzureOpenAI(AZURE_OPENAI_DEPLOYMENT, [
      { role: 'system', content: buildPlanSystemPrompt(destination) },
      { role: 'user', content: userMessage },
    ]);

    // The model can still drift off the requested destination. Detect it so
    // the caller can fall back to mock data instead of showing a wrong area.
    const driftedOff =
      !raw.originalPlan?.name?.includes(destination) ||
      !raw.recommendedPlan?.name?.includes(destination);

    // id / label / category are deterministic — assign them ourselves so a
    // model slip (wrong category, duplicate id, etc.) can't corrupt them.
    const plans = {
      originalPlan: {
        ...raw.originalPlan,
        id: 'ai-original',
        label: '原案プラン',
        category: 'original',
      },
      recommendedPlan: {
        ...raw.recommendedPlan,
        id: 'ai-recommended',
        label: 'おすすめプラン',
        category: 'recommended',
      },
      destinationDrifted: driftedOff,
    };

    res.json(plans);
  } catch (err) {
    console.error('[generate-plans]', err);
    res.status(500).json({ error: String(err?.message ?? err) });
  }
});

app.listen(PORT, () => {
  console.log(`AI backend listening on http://localhost:${PORT}`);
});
