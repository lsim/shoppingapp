var ShoppingListModel = require('../models/ShoppingList');

/*
 * GET home page.
 */
exports.index = function(req, res) {
	var singleModel = ShoppingListModel.findOne().exec(function() {
		if(!singleModel)
			singleModel = new ShoppingListModel();
		if(!singleModel.Items)
			singleModel.Items = [];

		res.render('index', {
			title: 'A Shopping List!',
			list: singleModel
		});
	});
};