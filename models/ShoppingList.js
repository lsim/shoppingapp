var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var ShoppingListSchema = new Schema({
	Id: ObjectId,
	Items: [{
		Text: String,
		Multiplicity: String,
		AddedBy: String
	}],
	Status: {type: String, required: true, enum: ['Closed','Open','Repeating']},
	OwnerGroup: ObjectId,
	ClosedDate: Date
});

module.exports = mongoose.model('ShoppingList', ShoppingListSchema);
