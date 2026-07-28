import Column from '../models/Column.js';
import User from '../models/User.js';
import Task from '../models/Task.js';

/**
 * Recalculate stats for a specific user and save them.
 */
export async function updateUserStats(userId) {
  if (!userId) return;
  try {
    const doneColumns = await Column.find({ title: /^(done|completed)$/i });
    const doneColumnIds = doneColumns.map(c => c._id);

    // Active tasks: assigned to user, not in a Done-type column
    const activeTaskCount = await Task.countDocuments({
      assigneeId: userId,
      columnId: { $nin: doneColumnIds }
    });

    // Completed tasks: assigned to user, in a Done-type column
    const completedTasks = await Task.find({
      assigneeId: userId,
      columnId: { $in: doneColumnIds }
    });

    let onTimeCount = 0;
    let lateCount = 0;

    for (const task of completedTasks) {
      if (!task.dueDate) {
        onTimeCount++;
      } else {
        const completedTime = task.completedAt || task.updatedAt || new Date();
        if (completedTime <= task.dueDate) {
          onTimeCount++;
        } else {
          lateCount++;
        }
      }
    }

    const totalCompleted = onTimeCount + lateCount;
    const onTimeRate = totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : 0;

    await User.findByIdAndUpdate(userId, {
      activeTaskCount,
      onTimeCount,
      lateCount,
      onTimeRate
    });
  } catch (error) {
    console.error(`Error updating stats for user ${userId}:`, error);
  }
}

/**
 * Determine if a column is a Done-type column by ID
 */
export async function isDoneColumn(columnId) {
  if (!columnId) return false;
  const col = await Column.findById(columnId);
  if (!col) return false;
  return /^(done|completed)$/i.test(col.title);
}
