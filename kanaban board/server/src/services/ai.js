import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import Board from '../models/Board.js';
import Column from '../models/Column.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

// Initialize Gemini SDK. It will automatically load process.env.GEMINI_API_KEY if not passed.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// ── Zod Schemas ─────────────────────────────────────────────────────────────

export const boardGenerationSchema = z.object({
  columns: z.array(
    z.object({
      name: z.string(),
      tasks: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          priority: z.enum(['low', 'medium', 'high', 'urgent']),
          labels: z.array(z.string()),
        })
      ),
    })
  ),
});

export const taskListSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
    })
  ),
});

export const subtasksSchema = z.object({
  subtasks: z.array(
    z.object({
      title: z.string(),
      completed: z.boolean().default(false),
    })
  ),
});

export const priorityAndLabelsSchema = z.object({
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  labels: z.array(z.string()),
});

export const sprintSummarySchema = z.object({
  headline: z.string(),
  completed: z.array(z.string()),
  inProgress: z.array(z.string()),
  risks: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export const workloadRecommendationSchema = z.object({
  summary: z.string(),
  recommendations: z.array(
    z.object({
      taskId: z.string(),
      taskTitle: z.string(),
      fromUserId: z.string().nullable(),
      fromUserName: z.string().nullable(),
      toUserId: z.string(),
      toUserName: z.string(),
      reason: z.string(),
    })
  ),
});

// ── Schema → Gemini JSON Schema converter ───────────────────────────────────

function convertZodToGeminiSchema(zodSchema) {
  // Try built-in zod v4 toJSONSchema if available
  if (typeof zodSchema.toJSONSchema === 'function') {
    return zodSchema.toJSONSchema();
  }
  const def = zodSchema._def;
  if (!def) return {};

  switch (def.typeName) {
    case 'ZodObject': {
      const properties = {};
      const required = [];
      for (const [key, value] of Object.entries(def.shape())) {
        properties[key] = convertZodToGeminiSchema(value);
        if (!value.isOptional()) {
          required.push(key);
        }
      }
      return { type: 'OBJECT', properties, required };
    }
    case 'ZodArray': {
      return { type: 'ARRAY', items: convertZodToGeminiSchema(def.type) };
    }
    case 'ZodString': {
      return { type: 'STRING' };
    }
    case 'ZodEnum': {
      return { type: 'STRING', enum: def.values };
    }
    case 'ZodBoolean': {
      return { type: 'BOOLEAN' };
    }
    case 'ZodDefault': {
      return convertZodToGeminiSchema(def.innerType);
    }
    default:
      return { type: 'STRING' };
  }
}

// ── Error handler ────────────────────────────────────────────────────────────

function handleGeminiError(error) {
  console.error('Gemini API Error:', error);
  if (error.status === 429 || (error.message && error.message.includes('429'))) {
    const rateLimitError = new Error('AI is busy, try again in a moment');
    rateLimitError.status = 429;
    throw rateLimitError;
  }
  throw error;
}

// ── AI Functions ─────────────────────────────────────────────────────────────

/**
 * Generate a full board layout (columns + tasks) from a prompt.
 */
export async function generateBoardFromPrompt(prompt) {
  try {
    const schema = convertZodToGeminiSchema(boardGenerationSchema);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a project planning assistant. Generate a structured project board layout based on the description: "${prompt}". Suggest standard Kanban columns (like Backlog, In Progress, Done, or specialized ones if relevant) and relevant tasks, including descriptions, priority levels, and labels.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const data = JSON.parse(response.text);
    return boardGenerationSchema.parse(data);
  } catch (error) {
    handleGeminiError(error);
  }
}

/**
 * Generate a flat list of actionable tasks from a user's goal description.
 * This is used by the AI Task Generator modal to create tasks directly in a column.
 */
export async function generateTasksForGoal(goal, count = 6) {
  try {
    const schema = convertZodToGeminiSchema(taskListSchema);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an agile project planning assistant. The user wants to accomplish: "${goal}".
Generate exactly ${count} actionable, well-defined tasks to achieve this goal.
Each task should have:
- A concise, specific title (action verb + deliverable)
- A 1-2 sentence description explaining what needs to be done
- An appropriate priority: urgent (blockers/critical path), high (core features), medium (standard work), low (nice-to-have)
Return tasks ordered by priority (most critical first).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const data = JSON.parse(response.text);
    return taskListSchema.parse(data);
  } catch (error) {
    handleGeminiError(error);
  }
}

/**
 * Suggest subtasks (checklist items) for a given task.
 */
export async function suggestSubtasks(taskTitle, taskDescription) {
  try {
    const schema = convertZodToGeminiSchema(subtasksSchema);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Suggest a checklist of 3-6 concrete, actionable subtasks for a task titled "${taskTitle}" with description: "${taskDescription || 'No description provided.'}".\nReturn them as a list of small, completable items.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const data = JSON.parse(response.text);
    return subtasksSchema.parse(data);
  } catch (error) {
    handleGeminiError(error);
  }
}

/**
 * Suggest priority and labels for a task.
 */
export async function suggestPriorityAndLabels(taskTitle, taskDescription, boardLabels = []) {
  try {
    const schema = convertZodToGeminiSchema(priorityAndLabelsSchema);
    const labelsStr = boardLabels.map(l => l.name).join(', ') || 'Bug, Feature, Improvement, Documentation';
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the task titled "${taskTitle}" with description: "${taskDescription || 'No description provided.'}". Classify its priority (low, medium, high, urgent) and suggest relevant labels from this list: [${labelsStr}].`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const data = JSON.parse(response.text);
    return priorityAndLabelsSchema.parse(data);
  } catch (error) {
    handleGeminiError(error);
  }
}

/**
 * Generate a sprint summary for an entire board.
 * Analyzes board state and returns structured insights.
 */
export async function generateSprintSummary(boardTitle, columns, tasks) {
  try {
    const schema = convertZodToGeminiSchema(sprintSummarySchema);

    // Build a concise board state description for the AI
    const boardState = columns.map(col => {
      const colTasks = tasks.filter(t => t.columnId.toString() === col._id.toString());
      const taskList = colTasks.map(t =>
        `  - [${t.priority.toUpperCase()}] "${t.title}"${t.dueDate ? ` (due: ${new Date(t.dueDate).toLocaleDateString()})` : ''}${t.assigneeId ? ' (assigned)' : ' (unassigned)'}`
      ).join('\n');
      return `Column "${col.title}" (${colTasks.length} tasks):\n${taskList || '  (empty)'}`;
    }).join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a scrum master analyzing a Kanban board called "${boardTitle}".
Here is the current board state:

${boardState}

Based on this board, generate a concise sprint summary with:
- headline: A 1-2 sentence high-level summary of progress and focus areas
- completed: Tasks/items that appear to be done (in Done/Completed columns)
- inProgress: Tasks actively being worked on
- risks: Urgent items, unassigned tasks, overdue items, blockers, or large backlogs
- recommendations: Concrete next steps and prioritization advice

Be specific, referencing actual task names. Keep each list item to 1 sentence.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const data = JSON.parse(response.text);
    return sprintSummarySchema.parse(data);
  } catch (error) {
    handleGeminiError(error);
  }
}

/**
 * Analyze team workload and suggest reassignments.
 */
export async function analyzeWorkload(boardId) {
  try {
    const board = await Board.findById(boardId).populate('members.userId');
    if (!board) throw new Error('Board not found');

    const membersData = board.members.map(m => {
      const u = m.userId || {};
      return {
        id: u._id ? u._id.toString() : '',
        name: u.name || '',
        email: u.email || '',
        activeTaskCount: u.activeTaskCount || 0,
        onTimeRate: u.onTimeRate || 0,
        onTimeCount: u.onTimeCount || 0,
        lateCount: u.lateCount || 0,
      };
    });

    const doneColumns = await Column.find({ boardId, title: /^(done|completed)$/i });
    const doneColumnIds = doneColumns.map(c => c._id);

    const tasks = await Task.find({
      boardId,
      columnId: { $nin: doneColumnIds }
    }).populate('columnId').populate('assigneeId');

    const tasksData = tasks.map(t => ({
      taskId: t._id.toString(),
      taskTitle: t.title,
      assigneeId: t.assigneeId ? t.assigneeId._id.toString() : null,
      assigneeName: t.assigneeId ? t.assigneeId.name : 'Unassigned',
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      priority: t.priority || 'medium',
      status: t.columnId ? t.columnId.title : 'Unknown'
    }));

    const schema = convertZodToGeminiSchema(workloadRecommendationSchema);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a workload balancing scrum master.
Analyze the workload data below for the project board.

Team members details (includes active tasks count, on-time rates, and completed/late tasks counts):
${JSON.stringify(membersData, null, 2)}

Pending and in-progress tasks on the board:
${JSON.stringify(tasksData, null, 2)}

Instructions:
1. Identify overloaded team members and recommend reassigning specific tasks to members with more capacity (lower activeTaskCount) and a better/equal on-time record (higher onTimeRate).
2. Do not penalize or flag members who have 0 completed tasks (onTimeCount + lateCount = 0) as unreliable — treat them as having no track record yet, not a poor one.
3. If there are 0 or 1 team members in the team list, you MUST return an empty recommendations array. Provide a summary explaining that task reassignment suggestions require at least two team members.
4. Do NOT recommend reassigning a task to the same person who already has it.
5. Do NOT recommend reassigning tasks to or from users who are not present in the team list.
6. Do NOT invent/hallucinate any tasks or users that are not explicitly provided in the data above.
7. For each recommendation, provide the taskId, taskTitle, fromUserId (or null if unassigned), fromUserName (or null if unassigned), toUserId, toUserName, and a clear reason for the reassignment.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const data = JSON.parse(response.text);
    return workloadRecommendationSchema.parse(data);
  } catch (error) {
    console.error('Workload analysis failed:', error);
    throw new Error('AI analysis failed, please try again');
  }
}

/**
 * Handle AI chat inquiries based on current board state.
 */
export async function chatWithAI(boardId, userMessage) {
  try {
    const board = await Board.findById(boardId);
    if (!board) throw new Error('Board not found');

    const columns = await Column.find({ boardId });
    const tasks = await Task.find({ boardId }).populate('assigneeId');

    // Describe current board layout and assignments concisely
    const boardState = columns.map(col => {
      const colTasks = tasks.filter(t => t.columnId.toString() === col._id.toString());
      const taskList = colTasks.map(t =>
        `  - [${t.priority.toUpperCase()}] "${t.title}" (status: ${col.title})${t.dueDate ? ` (due: ${new Date(t.dueDate).toLocaleDateString()})` : ''}${t.assigneeId ? ` (assigned to ${t.assigneeId.name})` : ' (unassigned)'}`
      ).join('\n');
      return `Column "${col.title}" (${colTasks.length} tasks):\n${taskList || '  (empty)'}`;
    }).join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an AI project management assistant for a board named "${board.title}".
A user is chatting with you. Answer their question or request based on the current board state provided below.

Current Board State:
${boardState}

User message: "${userMessage}"

Keep your response concise, helpful, and focused on the board's tasks, assignees, and columns. Make sure not to hallucinate tasks or columns. Respond in plain text or simple markdown formatting.`,
    });

    return response.text || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('AI chat failed:', error);
    throw error;
  }
}

