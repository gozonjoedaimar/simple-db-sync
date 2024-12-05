const mongoose = require('mongoose');

require('dotenv').config();

// create connections to local and remote db
const localDB = mongoose.createConnection(process.env.LOCAL_DB);
const remoteDB = mongoose.createConnection(process.env.REMOTE_DB);

async function getLastSyncedTimestamp() {
	const lastSynced = await localDB.collection('changelog').find({ synced: true }).sort({ updatedAt: -1 }).toArray();
	return lastSynced[0]?.updatedAt;
}

async function syncLocalToRemote() {
	const changes = await localDB.collection('changelog').find({ synced: false }).toArray();

	try {
		for (const change of changes) {
			const { operationType, documentId, changes } = change;

			switch (operationType) {
				case 'insert':
					await remoteDB.collection('todos').insertOne(changes);
					break;
				case 'update':
					await remoteDB.collection('todos').updateOne({ _id: documentId }, { $set: changes });
					break;
				case 'delete':
					await remoteDB.collection('todos').deleteOne({ _id: documentId });
					break;
			}

			await localDB.collection('changelog').updateOne(
				{ _id: change._id },
				{
					$set: {
						synced: true,
						updatedAt: new Date(),
					},
				}
			);
		}

	}
	catch (err) {
		console.error(err.message)
	}
}

async function syncRemoteToLocal() {
	const lastSynced = await getLastSyncedTimestamp();

	const changes = await remoteDB.collection('todos').find({ updatedAt: { $gt: lastSynced } }).toArray();

	try {
		for (const doc of changes) {
			await localDB.collection('todos').updateOne(
				{ _id: doc._id },
				{ $set: doc },
				{ upsert: true } // create if not exists
			)

			await localDB.collection('changelog').insertOne({
				operationType: 'update',
				documentId: doc._id,
				changes: doc,
				synced: true,
				updatedAt: new Date(),
				createdAt: new Date(),
			});
		}
	} catch (err) {
		console.error(err.message)
	}
}

module.exports = {
	syncLocalToRemote,
	syncRemoteToLocal,
	getLastSyncedTimestamp,
}
