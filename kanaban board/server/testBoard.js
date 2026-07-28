import mongoose from 'mongoose';
import Board from './src/models/Board.js';

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/kanban');
  const board = await Board.findOne({ _id: '6a53924740c08972a16ce9e9' })
    .populate('members.userId')
    .lean();
  
  if (board) {
    const role = board.members.find(m => m.userId?._id?.toString() === '6a5388c7461ba9dbec633d95')?.role || 'member';
    console.log('Role:', role);
  }
  process.exit(0);
}

test();
