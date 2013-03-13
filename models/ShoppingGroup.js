var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var ShoppingGroupSchema = new Schema({
	id: ObjectId,
	name: { type: String, required: true },
	passwordHash: { type: String, required: true},
	users: [{
		userName: String,
		passwordHash: String
	}]
});

module.exports = mongoose.model('ShoppingGroup', ShoppingGroupSchema);
