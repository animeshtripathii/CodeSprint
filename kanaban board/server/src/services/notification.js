import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';
import { io } from '../index.js';

// Setup Nodemailer transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

/**
 * Creates a notification in the database, emits a Socket.io event,
 * and sends an email if user SMTP details are configured.
 */
export async function createAndSendNotification({ userId, message, taskId, boardId, type }) {
  try {
    const userIdStr = String(userId);

    // 1. Create database notification record
    const notification = await Notification.create({
      userId: userIdStr,
      message,
      taskId: taskId || null,
      boardId,
      type,
    });

    // 2. Emit Socket.io event to user room (user:userId)
    if (io) {
      io.to(`user:${userIdStr}`).emit('notification:new', {
        id: notification._id.toString(),
        message: notification.message,
        taskId: notification.taskId ? notification.taskId.toString() : null,
        boardId: notification.boardId.toString(),
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt,
      });
    }

    // 3. Dispatch notification email using Nodemailer
    const User = (await import('../models/User.js')).default;
    const userObj = await User.findById(userId);
    
    if (userObj && userObj.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const appUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const boardLink = `${appUrl}/board/${boardId}`;
      const subject = type === 'overdue' ? 'Flowboard Alert: Task Overdue' : 'Flowboard Notice: New Task Assignment';

      const mailOptions = {
        from: `"Flowboard Alerts" <${process.env.EMAIL_USER}>`,
        to: userObj.email,
        subject,
        text: `${message}\n\nView board details: ${boardLink}`,
      };

      // Deliver asynchronously and catch failures without blocking application flow
      transporter.sendMail(mailOptions, (mailErr, info) => {
        if (mailErr) {
          console.error(`📧 SMTP send error for ${userObj.email}:`, mailErr.message);
        } else {
          console.log(`📧 Notification email sent to ${userObj.email}:`, info.response);
        }
      });
    }

    return notification;
  } catch (error) {
    console.error('Error in createAndSendNotification:', error);
  }
}
