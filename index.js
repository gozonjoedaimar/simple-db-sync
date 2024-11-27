const express = require('express');
const mongoose = require('mongoose');
const dbsync = require('./sync');

require('dotenv').config();

const Todo = require('./todo');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI);

// show todos
app.get('/', async (_, res) => {
	const todos = await Todo.find({});
	res.json({
		list: todos || [],
		currentconn: process.env.MONGODB_URI,
		localconn: process.env.LOCAL_DB,
		remoteconn: process.env.REMOTE_DB,
	})
});

// create new todo
app.get('/new', async (_, res) => {
	const todo = new Todo({
		title: `Todo title (${Date.now()})`
	})

	await todo.save()
	console.log('New todo created');

	// redirect to home
	res.redirect('/')
});

// remove latest todo
app.get('/remove', async (_, res) => {
	const todo = await Todo.findOne({}).sort({ updatedAt: -1 })
	await todo.remove()
	console.log('Todo removed');
	res.redirect('/')
})

app.get('/sync', async (_, res) => {
	await dbsync.syncLocalToRemote();
	await dbsync.getLastSyncedTimestamp();
	await dbsync.syncRemoteToLocal();
	res.redirect('/')
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}!`);
	console.log(`To add new item, navigate to http://localhost:${port}/new`);
	console.log(`To sync, navigate to http://localhost:${port}/sync`);
	console.log('Press Ctrl+C to quit.');
});
