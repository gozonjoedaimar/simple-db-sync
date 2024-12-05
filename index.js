const express = require('express');
const mongoose = require('mongoose');
const dbsync = require('./sync');

require('dotenv').config();

const Todo = require('./todo');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI);

app.set('view engine', 'pug');
app.use(express.static('public'));

app.get('/', async (_, res) => {
	const todos = await Todo.find({});
	res.render('index', {
		list: todos || [],
		currentconn: process.env.MONGODB_URI,
		envname: process.env.ENV_NAME,
	});
})

// show todos
app.get('/list', async (_, res) => {
	res.json({
		list: todos || [],
		currentconn: process.env.MONGODB_URI,
		localconn: process.env.LOCAL_DB,
		remoteconn: process.env.REMOTE_DB,
	})
});

// create new todo
app.get('/new', async (req, res) => {
	const data = req.query;
	const todo = new Todo({
		title: data.title || `Todo title (${Date.now()})`
	})

	await todo.save()
	console.log('New todo created');
	console.log(data)

	// redirect to home
	res.redirect('/sync')
});

// remove latest todo
app.get('/remove', async (req, res) => {
	const data = req.query;
	const q = data.id ? { _id: data.id } : {};
	const [todo] = await Todo.find(q).sort({ updatedAt: -1 });
	await todo.deleteOne();
	console.log('Todo removed');
	res.redirect('/sync')
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
