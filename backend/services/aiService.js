const { GoogleGenerativeAI } = require('@google/generative-ai');
const ApiError = require('../utils/ApiError');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = () => genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Generic prompt → text response helper
 */
const generateText = async (prompt) => {
  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('[Gemini AI] Error:', err.message);
    throw new ApiError(503, 'AI service temporarily unavailable. Please try again.');
  }
};

/**
 * 1. Validate a project idea against a hackathon theme
 */
const validateIdea = async ({ idea, theme, problemStatement }) => {
  const prompt = `
You are an expert hackathon mentor. A participant has submitted a project idea.

Hackathon Theme: ${theme || 'Open Innovation'}
Problem Statement: ${problemStatement || 'Not specified'}
Project Idea: ${idea}

Provide a JSON response with:
1. feasibilityScore (0-10)
2. strengths (array of 3 bullet points)
3. weaknesses (array of 2-3 bullet points)
4. suggestedTechStack (array of technologies)
5. improvementTips (string, 2-3 sentences)
6. verdict ("Strong", "Promising", "Needs Work")

Respond ONLY with valid JSON, no markdown.`;

  const text = await generateText(prompt);
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    return { raw: text };
  }
};

/**
 * 2. Summarize a submission in 2-3 lines
 */
const summarizeSubmission = async ({ projectName, problemStatement, solution, techStack }) => {
  const prompt = `
Summarize this hackathon project in exactly 2-3 sentences for a leaderboard card. Be concise, enthusiastic, and highlight the core value proposition.

Project: ${projectName}
Problem: ${problemStatement}
Solution: ${solution}
Tech Stack: ${techStack?.join(', ') || 'Not specified'}

Respond ONLY with the summary text, no formatting.`;

  return generateText(prompt);
};

/**
 * 3. Generate structured tasks from a project idea
 */
const generateTasks = async ({ projectIdea, hackathonTheme, teamSize }) => {
  const prompt = `
You are a technical project manager for a hackathon team.

Project Idea: ${projectIdea}
Hackathon Theme: ${hackathonTheme || 'General'}
Team Size: ${teamSize || 4}

Generate a list of 8-12 concrete development tasks for this project. Each task should be completable within a hackathon timeframe (1-3 days).

Respond ONLY with a valid JSON array. Each item must have:
- title (string, max 60 chars)
- description (string, 1-2 sentences)
- suggestedPriority ("low" | "medium" | "high")
- effortEstimate (string, e.g. "2-3 hours")

No markdown, just raw JSON array.`;

  const text = await generateText(prompt);
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    throw new ApiError(500, 'AI returned an unexpected format. Please try again.');
  }
};

/**
 * 4. Generate a polished judge feedback paragraph from raw notes + scores
 */
const generateJudgeFeedback = async ({ projectName, scores, rawComments, criteria }) => {
  const scoresText = Object.entries(scores).map(([k, v]) => `${k}: ${v}/10`).join(', ');
  const prompt = `
You are a senior judge at a prestigious hackathon. Write a polished, constructive, professional feedback paragraph for the team.

Project: ${projectName}
Judging Criteria Scores: ${scoresText}
Judge's Raw Notes: ${rawComments}

The feedback should:
- Be encouraging but honest
- Reference specific scores
- Suggest 1-2 actionable improvements
- Be 3-4 sentences long

Respond ONLY with the feedback paragraph, no formatting.`;

  return generateText(prompt);
};

/**
 * 5. AI Chat Assistant — respond to @ai message in team chat context
 */
const chatAssistant = async ({ message, teamContext }) => {
  const { teamName, hackathonTitle, taskSummary, submissionStatus } = teamContext;
  const prompt = `
You are an AI assistant inside the HackForge team chat for team "${teamName}" participating in hackathon "${hackathonTitle}".

Team Context:
- Task Progress: ${taskSummary || 'No tasks yet'}
- Submission Status: ${submissionStatus || 'Not submitted yet'}

Team Member's Message: ${message}

Respond helpfully, concisely (max 150 words). You can help with: task planning, technical advice, hackathon strategy, motivation, and platform features. Be friendly and use emojis occasionally.`;

  return generateText(prompt);
};

/**
 * 6. AI Board Summary
 */
const boardSummary = async ({ teamName, taskStats, overdueTasks }) => {
  const prompt = `
Summarize the current Kanban board status for team "${teamName}" in 2-3 sentences.

Stats: ${JSON.stringify(taskStats)}
Overdue Tasks: ${JSON.stringify(overdueTasks)}

Be direct, highlight risks, and keep it under 80 words. No markdown.`;

  return generateText(prompt);
};

module.exports = { validateIdea, summarizeSubmission, generateTasks, generateJudgeFeedback, chatAssistant, boardSummary };
