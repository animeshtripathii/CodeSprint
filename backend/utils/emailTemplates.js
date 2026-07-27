const taskAssignedTemplate = ({ taskTitle, assigneeName, teamName, hackathonTitle }) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0f0f0f; color: #f1f1f1; border-radius: 12px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #6c63ff, #3ecf8e); padding: 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; color: #fff;">🎯 Task Assigned — CodeSprint</h1>
  </div>
  <div style="padding: 24px;">
    <p>Hi <strong>${assigneeName}</strong>,</p>
    <p>A new task has been assigned to you in <strong>${teamName}</strong> for <strong>${hackathonTitle}</strong>:</p>
    <div style="background: #1a1a2e; border-left: 4px solid #6c63ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <strong style="font-size: 18px;">${taskTitle}</strong>
    </div>
    <p>Log in to CodeSprint to view task details, update your status, and stay on track!</p>
    <a href="${process.env.CLIENT_URL}/tasks" style="display: inline-block; background: linear-gradient(135deg, #6c63ff, #3ecf8e); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">View Task</a>
  </div>
  <div style="padding: 16px; text-align: center; color: #888; font-size: 12px;">© 2026 CodeSprint. All rights reserved.</div>
</div>`;

const memberJoinedTemplate = ({ memberName, teamName, hackathonTitle }) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0f0f0f; color: #f1f1f1; border-radius: 12px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #6c63ff, #3ecf8e); padding: 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; color: #fff;">🎉 New Member Joined — CodeSprint</h1>
  </div>
  <div style="padding: 24px;">
    <p><strong>${memberName}</strong> has joined your team <strong>${teamName}</strong> for <strong>${hackathonTitle}</strong>.</p>
    <a href="${process.env.CLIENT_URL}/team" style="display: inline-block; background: linear-gradient(135deg, #6c63ff, #3ecf8e); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">View Team</a>
  </div>
  <div style="padding: 16px; text-align: center; color: #888; font-size: 12px;">© 2026 CodeSprint. All rights reserved.</div>
</div>`;

const submissionUpdatedTemplate = ({ projectName, teamName, status }) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0f0f0f; color: #f1f1f1; border-radius: 12px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #6c63ff, #3ecf8e); padding: 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; color: #fff;">📦 Submission Update — CodeSprint</h1>
  </div>
  <div style="padding: 24px;">
    <p>Your team <strong>${teamName}</strong>'s submission <strong>${projectName}</strong> status has changed to: <strong style="color: #3ecf8e;">${status.toUpperCase()}</strong>.</p>
    <a href="${process.env.CLIENT_URL}/submission" style="display: inline-block; background: linear-gradient(135deg, #6c63ff, #3ecf8e); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">View Submission</a>
  </div>
  <div style="padding: 16px; text-align: center; color: #888; font-size: 12px;">© 2026 CodeSprint. All rights reserved.</div>
</div>`;

const reviewPostedTemplate = ({ projectName, teamName, avgScore }) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0f0f0f; color: #f1f1f1; border-radius: 12px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #6c63ff, #3ecf8e); padding: 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; color: #fff;">⭐ Review Posted — CodeSprint</h1>
  </div>
  <div style="padding: 24px;">
    <p>A judge has submitted a review for <strong>${projectName}</strong> by team <strong>${teamName}</strong>.</p>
    <p>Current average score: <strong style="font-size: 24px; color: #3ecf8e;">${avgScore} / 10</strong></p>
    <a href="${process.env.CLIENT_URL}/leaderboard" style="display: inline-block; background: linear-gradient(135deg, #6c63ff, #3ecf8e); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">View Leaderboard</a>
  </div>
  <div style="padding: 16px; text-align: center; color: #888; font-size: 12px;">© 2026 CodeSprint. All rights reserved.</div>
</div>`;

const registrationTemplate = ({ userName, hackathonTitle, status }) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0f0f0f; color: #f1f1f1; border-radius: 12px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #6c63ff, #3ecf8e); padding: 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; color: #fff;">📋 Registration ${status} — CodeSprint</h1>
  </div>
  <div style="padding: 24px;">
    <p>Hi <strong>${userName}</strong>,</p>
    <p>Your registration for <strong>${hackathonTitle}</strong> has been <strong style="color: ${status === 'approved' ? '#3ecf8e' : '#ff4d4d'};">${status.toUpperCase()}</strong>.</p>
    <a href="${process.env.CLIENT_URL}/hackathons" style="display: inline-block; background: linear-gradient(135deg, #6c63ff, #3ecf8e); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">View Hackathon</a>
  </div>
  <div style="padding: 16px; text-align: center; color: #888; font-size: 12px;">© 2026 CodeSprint. All rights reserved.</div>
</div>`;

module.exports = { taskAssignedTemplate, memberJoinedTemplate, submissionUpdatedTemplate, reviewPostedTemplate, registrationTemplate };
