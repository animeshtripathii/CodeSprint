import mongoose from 'mongoose';

async function fixDB() {
  await mongoose.connect('mongodb://127.0.0.1:27017/kanban');
  const db = mongoose.connection.db;
  
  // 1. Rename name -> title in columns
  const columns = await db.collection('columns').find({}).toArray();
  let colCount = 0;
  for (const col of columns) {
    if (col.name && !col.title) {
      await db.collection('columns').updateOne({ _id: col._id }, { $set: { title: col.name }, $unset: { name: 1 } });
      colCount++;
    }
  }
  console.log(`Migrated ${colCount} columns from name to title.`);
  
  // 2. Insert missing columns for boards without columns
  const boards = await db.collection('boards').find({}).toArray();
  let boardCount = 0;
  for (const board of boards) {
    const cCount = await db.collection('columns').countDocuments({ boardId: board._id });
    if (cCount === 0) {
      await db.collection('columns').insertMany([
        { boardId: board._id, title: 'Todo', position: 0, createdAt: new Date(), updatedAt: new Date() },
        { boardId: board._id, title: 'In Progress', position: 1, createdAt: new Date(), updatedAt: new Date() },
        { boardId: board._id, title: 'Review', position: 2, createdAt: new Date(), updatedAt: new Date() },
        { boardId: board._id, title: 'Done', position: 3, createdAt: new Date(), updatedAt: new Date() },
      ]);
      console.log('Fixed missing columns for board: ' + board._id);
      boardCount++;
    }
  }
  console.log(`Fixed missing columns for ${boardCount} boards.`);
  process.exit(0);
}

fixDB();
