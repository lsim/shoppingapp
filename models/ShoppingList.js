var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var ShoppingListSchema = new Schema({
	items: [{
		text: String,
		mult: String,
		addedBy: String
	}],
	status: { type: String, required: true, enum: ['Closed','Open','Repeating']},
	ownerGroup: ObjectId,
	closedDate: Date
});

module.exports = mongoose.model('ShoppingList', ShoppingListSchema);
