var ShoppingListModel = require('../models/ShoppingList');

/*
 * GET home page.
 */
exports.indexGet = function(req, res) {
	res.render('index', {
		title: 'A Shopping List!'
	});
};

exports.listGetJson = function(req, res) {
	//TODO: match on group id as well
	ShoppingListModel.find({ Status: 'Open' }, function(err, lists) {
		if(err) {
			console.log('Error fetching shopping list from db ' + err);
			return;
		}

		var model = (lists && lists.length > 0 && lists[0]) || new ShoppingListModel();

		model.Items = model.Items || [];

		// model.Items.push({ Text: 'Mælk', Multiplicity: '' + model.Items.length });
		// model.Status = 'Open';
		// model.save();

		res.json(model);
	});
}

/*
 * POST home page
 */
 exports.indexPost = function(req, res) {
 	
 };