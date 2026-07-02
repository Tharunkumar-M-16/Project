/**
 * AI features powered by OpenAI.
 *
 * - General AI chat assistant for students ("Ask AI")
 * - AI test generation for tutors (topic -> auto-graded MCQs)
 * - AI study feedback on a result
 *
 * Degrades gracefully: if OPENAI_API_KEY is not set, isEnabled() is false and
 * the routes return 503 so the UI can hide the AI panels instead of erroring.
 */
import OpenAI from 'openai';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let client = null;
export function isEnabled() {
  return !!process.env.OPENAI_API_KEY;
}
function getClient() {
  if (!isEnabled()) {
    const err = new Error('AI is not configured (set OPENAI_API_KEY in server/.env).');
    err.status = 503;
    throw err;
  }
  if (!client) client = new OpenAI(); // reads OPENAI_API_KEY from env
  return client;
}

// ---- General AI chat (student) ----
export async function chatReply({ message, history = [] }) {
  const openai = getClient();
  const messages = [
    {
      role: 'system',
      content:
        'You are the 5Rings Class assistant — a friendly, encouraging study helper for students. ' +
        'Explain clearly and concisely with small examples, and give step-by-step help for problems.',
    },
    ...history
      .filter((m) => m && m.content && (m.role === 'user' || m.role === 'assistant'))
      .slice(-10)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) })),
    { role: 'user', content: String(message).slice(0, 4000) },
  ];
  const res = await openai.chat.completions.create({ model: MODEL, max_tokens: 800, messages });
  return res.choices?.[0]?.message?.content?.trim() || '';
}

// ---- AI study feedback on a result (student) ----
export async function studyFeedback({ testTitle, skill, percent, score, total }) {
  const openai = getClient();
  const res = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 500,
    messages: [
      { role: 'system', content: 'You are a supportive tutor giving short, actionable study feedback. 3-5 bullet points max.' },
      {
        role: 'user',
        content:
          `A student scored ${score}/${total} (${percent}%) on "${testTitle}"` +
          `${skill ? ` (skill: ${skill})` : ''}. Give brief, specific advice on what to study next.`,
      },
    ],
  });
  return res.choices?.[0]?.message?.content?.trim() || '';
}

// ---- AI test generation (tutor) ----
export async function generateTest({ topic, numQuestions = 5, difficulty = 'medium' }) {
  const openai = getClient();
  const n = Math.max(1, Math.min(15, Number(numQuestions) || 5));
  const res = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You write multiple-choice quiz questions. Reply with ONLY JSON of the form ' +
          '{"questions":[{"text":string,"options":[4 strings],"correctIndex":0-3}]}. ' +
          'Exactly 4 options per question and exactly one correct answer. Make distractors plausible.',
      },
      { role: 'user', content: `Create ${n} ${difficulty}-difficulty questions about: ${String(topic).slice(0, 300)}.` },
    ],
  });
  let parsed;
  try {
    parsed = JSON.parse(res.choices?.[0]?.message?.content || '{}');
  } catch {
    const err = new Error('AI returned an unexpected format. Please try again.');
    err.status = 502;
    throw err;
  }
  const questions = (parsed.questions || [])
    .filter((q) => q && q.text && Array.isArray(q.options) && q.options.length >= 2)
    .map((q) => {
      const options = q.options.slice(0, 4).map((o) => String(o));
      while (options.length < 4) options.push('');
      const correctIndex =
        Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < options.length ? q.correctIndex : 0;
      return { text: String(q.text), options, correctIndex };
    });
  if (questions.length === 0) {
    const err = new Error('AI could not generate questions for that topic. Try something more specific.');
    err.status = 502;
    throw err;
  }
  return questions;
}
