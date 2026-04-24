import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/server/services/db.js';
import { buildKnowledgeUnitsFromSnapshot, createEmbeddingsForUnits } from '../src/server/services/knowledgeRagService.js';

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function loadSnapshotFromDatabase() {
  const db = mongoose.connection.db;
  const collectionNames = [
    'knowledge_base',
    'scripts',
    'training_data',
    'templates',
    'venue_rules',
    'global_settings',
  ];

  const snapshot = {};
  for (const name of collectionNames) {
    snapshot[name] = await db.collection(name).find({}).toArray();
  }
  return snapshot;
}

async function main() {
  await connectToDatabase();
  const db = mongoose.connection.db;
  const reset = hasFlag('--reset');
  const withEmbeddings = hasFlag('--with-embeddings');

  if (reset) {
    await db.collection('knowledge_units').deleteMany({});
  }

  const snapshot = await loadSnapshotFromDatabase();
  let units = buildKnowledgeUnitsFromSnapshot(snapshot);

  if (withEmbeddings) {
    units = await createEmbeddingsForUnits(units);
  }

  if (units.length === 0) {
    console.log('No knowledge units generated.');
    return;
  }

  const ops = units.map((unit) => ({
    updateOne: {
      filter: { _id: unit._id },
      update: { $set: unit },
      upsert: true,
    },
  }));

  const result = await db.collection('knowledge_units').bulkWrite(ops, { ordered: false });
  console.log(JSON.stringify({
    inserted: result.upsertedCount,
    matched: result.matchedCount,
    modified: result.modifiedCount,
    totalUnits: units.length,
    withEmbeddings,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {}
  });
