import { isEnabled, chatReply, generateTest, studyFeedback } from '../services/ai.js';

// GET /api/ai/status — lets the UI show/hide AI panels
export const aiStatus = (req, res) => res.json({ enabled: isEnabled() });

// POST /api/ai/chat — student chats with the AI assistant
export const askAI = async (req, res) => {
  const { message, history } = req.body;
  if (!message || !String(message).trim()) return res.status(400).json({ message: 'Ask a question first' });
  const reply = await chatReply({ message, history: history || [] });
  res.json({ reply });
};

// POST /api/ai/generate-test — tutor generates draft MCQs from a topic
export const aiGenerateTest = async (req, res) => {
  const { topic, numQuestions, difficulty } = req.body;
  if (!topic || !String(topic).trim()) return res.status(400).json({ message: 'A topic is required' });
  const questions = await generateTest({ topic, numQuestions, difficulty });
  res.json({ questions });
};

// POST /api/ai/feedback — student gets study advice on a result
export const aiFeedback = async (req, res) => {
  const { testTitle, skill, percent, score, total } = req.body;
  const feedback = await studyFeedback({ testTitle: testTitle || 'a test', skill, percent, score, total });
  res.json({ feedback });
};
