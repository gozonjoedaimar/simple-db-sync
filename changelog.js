const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const changelogSchema = new Schema({
	operationType: {
		type: String,
		required: true,
	},
	documentId: {
		type: Schema.Types.ObjectId,
		required: true,
	},
	changes: {
		type: Object,
	},
	synced: {
		type: Boolean,
		default: false,
	},
}, { collection: 'changelog', timestamps: true });

module.exports = mongoose.model('Changelog', changelogSchema);
