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
	ShoppingListModel.find({ status: 'Open' }, function(err, lists) {
		if(err) {
			console.log('Error fetching shopping list from db ' + err);
			return;
		}
		console.log('Got list from db: ' + (lists && lists.length > 0 && lists[0]));
		var model = (lists && lists.length > 0 && lists[0]) || new ShoppingListModel({status: 'Open'});

		res.json(model);
	});
}

/*
 * POST list json
 */
 exports.listSynchJson = function(req, res) {
 	var list = new ShoppingListModel(req.body);
 	console.log('posted list with _id ' + list._id);

    //Look up the list in db so we can update it with the posted data
 	ShoppingListModel.find({_id: req.body._id }, function(err, lists) {
		if(err) {
			console.log('Error fetching shopping list from db ' + err);
			res.json({});
		}
		var model = (lists && lists.length > 0 && lists[0]) || new ShoppingListModel({_id: req.body._id, status: req.body.status});

		var origItems = model.items;
		model.items = model.items.concat(req.body.items);

		model.save(function(err, list) {
			if(err) {
				console.log('db save failed: ' + err.message);
				model.items = origItems;//Revert addition of new list item if the db save failed
			}
            //Return the shopping list as it looks after the persisting has taken place
			res.json(model);
		});
 	});
 };