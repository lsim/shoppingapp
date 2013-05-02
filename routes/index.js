var ShoppingListModel = require('../models/ShoppingList');
var ShoppingGroupModel = require('../models/ShoppingGroup');
var Deferred = require('JQDeferred');

/*
 * GET home page.
 */
exports.indexGet = function(req, res) {
	res.render('index', {
		title: 'A Shopping List!'
	});
};

function getOpenList(group, fields) {
    var openingList = Deferred();
    ShoppingListModel.findOne({ status: 'Open', ownerGroup: group._id }, fields, function(err, list) {
        if(err) {
            console.log('Error fetching shopping list from db ' + err);
            openingList.reject(err);
        } else {
            var model = list || new ShoppingListModel({status: 'Open', ownerGroup: group._id});
            openingList.resolve(model);
        }
    });
    return openingList.promise();
}

exports.listGetJson = function(req, res) {
    var group = req.group;
    ShoppingListModel.findOne({ status: 'Open', ownerGroup: group._id }, function(err, list) {
        if(err) {
            console.log('Error fetching shopping list from db ' + err);
            res.json(err);
        } else {
            var model = list || new ShoppingListModel({status: 'Open', ownerGroup: group._id});
            res.json(model);
        }
    });
}

exports.listGetFullJson = function(req, res) {
    var group = req.group;
    getOpenList(group, 'items.text').done(function(openList) {
        var mappedList = openList.items.map(function(item) { return item.text; });
        res.json({ title: group.name, items: mappedList });
    }).fail(res.json);
}

/*
 * POST list json
 */
exports.listSynchJson = function(req, res) {
    var group = req.group;
    //Look up the list in db so we can update it with the posted data
    ShoppingListModel.findOne({_id: req.body._id, ownerGroup: group._id }, function(err, list) {
        if(err) {
            console.log('Error fetching shopping list from db ' + err);
            return res.json(err);
        }
        var model = list || new ShoppingListModel({_id: req.body._id, status: req.body.status, ownerGroup: group._id});

        var origItems = model.items;
        var deletedItemIds = req.body.items.filter(function(item) { return item.isDeleted; }).map(function(item) { return item._id});
        var newItems = req.body.items.filter(function(item) { return item.isNew; });

        //Build updated item list
        model.items = model.items
            .filter(function(item) { return deletedItemIds.indexOf(item._id.toHexString()) < 0; })//Remove deleted items
            .concat(newItems);//Add new items

        model.save(function(err, list) {
            if(err) {
                console.log('db save failed: ' + err.message);
                model.items = origItems;//Revert list changes if the db save failed
            }
            //Return the shopping list as it looks after the persisting has taken place
            res.json(model);
        });
    });
};