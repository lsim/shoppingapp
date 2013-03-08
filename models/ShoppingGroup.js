var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var ShoppingGroupSchema = new Schema({
	Id: ObjectId,
	Name: { type: String, required: true },
	PasswordHash: { type: String, required: true},
	Users: [{
		UserName: String,
		PasswordHash: String
	}]
});

module.exports = mongoose.model('ShoppingGroup', ShoppingGroupSchema);
