var ShoppingListModel = require('../models/ShoppingList');

/*
 * GET home page.
 */
exports.indexGet = function(req, res) {
	ShoppingListModel.find({ Status: 'Open' }, function(err, lists) {
		if(err)
			console.log('Error fetching shopping list from db ' + err);
		console.log('Fetched lists: ' + lists);
		var model = (lists && lists.length > 0 && lists[0]) || new ShoppingListModel();

		model.Items = model.Items || [];

		// model.Items.push({ Text: 'Mælk', Multiplicity: '' + model.Items.length });
		// model.Status = 'Open';
		// model.save();

		res.render('index', {
			title: 'A Shopping List!',
			list: model
		});
	});//TODO: match on group id as well
};

/*
 * POST home page
 */
 exports.indexPost = function(req, res) {
 	
 };