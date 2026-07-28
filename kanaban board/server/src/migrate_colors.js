import mongoose from 'mongoose';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kanban';

const boardSchema = new mongoose.Schema({
  color: String,
});
const Board = mongoose.model('Board', boardSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Update all boards having the old green color to the new blue color
    const res = await Board.updateMany(
      { color: '#2f8159' },
      { color: '#1a7fd4' }
    );

    console.log(`Updated ${res.modifiedCount} boards from green (#2f8159) to blue (#1a7fd4).`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

run();
