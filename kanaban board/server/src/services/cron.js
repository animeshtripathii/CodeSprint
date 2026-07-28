import cron from 'node-cron';
import Task from '../models/Task.js';
import Column from '../models/Column.js';
import Notification from '../models/Notification.js';
import { createAndSendNotification } from './notification.js';

/**
 * Initializes cron jobs for the backend.
 * Checks for overdue tasks once per hour.
 */
export function initCronJobs() {
  cron.schedule('0 * * * *', async () => {
    console.log('Running overdue tasks check...');
    try {
      const now = new Date();

      // Find all Done/Completed columns
      const doneColumns = await Column.find({ title: /^(done|completed)$/i });
      const doneColumnIds = doneColumns.map(c => c._id);

      // Find tasks that are past their due date, not done, and assigned
      const overdueTasks = await Task.find({
        dueDate: { $lt: now },
        columnId: { $nin: doneColumnIds },
        assigneeId: { $ne: null }
      }).populate('boardId');

      for (const task of overdueTasks) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Anti-spam: check if an overdue alert was already created in the last 24 hours for this task
        const sentRecently = await Notification.findOne({
          userId: task.assigneeId,
          taskId: task._id,
          type: 'overdue',
          createdAt: { $gt: oneDayAgo }
        });

        if (!sentRecently) {
          const boardName = task.boardId ? task.boardId.title : 'your board';
          const message = `The task '${task.title}' on board '${boardName}' is overdue.`;

          await createAndSendNotification({
            userId: task.assigneeId,
            message,
            taskId: task._id,
            boardId: task.boardId._id || task.boardId,
            type: 'overdue'
          });
          console.log(`⏰ Notification dispatched: task '${task.title}' is overdue`);
        }
      }
    } catch (err) {
      console.error('Error running overdue cron job:', err);
    }
  });
  console.log('⏰ Cron jobs scheduler initialized');
}
