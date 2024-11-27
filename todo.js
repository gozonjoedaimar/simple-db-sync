const mongoose = require('mongoose');
const ChangeLog = require('./changelog');

const Schema = mongoose.Schema;

const todoSchema = new Schema({
	title: {
		type: String,
		required: true,
	},
	completed: {
		type: Boolean,
		default: false,
	},
}, { collection: 'todos', timestamps: true });

todoSchema.pre('save', function(next) {
	const changeLog = {
		operationType: this.isNew ? 'insert' : 'update',
		documentId: this._id,
		changes: this.toObject(),
		timestamp: new Date(),
	}

	ChangeLog.create(changeLog).finally(() => next());
})

todoSchema.pre('remove', function(next) {
	const changelog = {
		operationType: 'delete',
		documentId: this._id,
		timestamp: new Date(),
	}

	ChangeLog.create(changelog).finally(() => next());
})

module.exports = mongoose.model('Todo', todoSchema);
