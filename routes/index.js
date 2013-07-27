var ShoppingListModel = require('../models/ShoppingList');
var ShoppingGroupModel = require('../models/ShoppingGroup');
var Deferred = require('JQDeferred');
var auth = require('./auth');
var sse = require('./sse');
var mongoose = require('mongoose');

module.exports = {
  registerEndpoints: function(app) {

    /*
     * GET home page.
     */
    app.get('/', function(req, res) {
      res.render('index', {
        title: 'A Shopping List!'
      });
    });

    app.get('/list', auth.checkAuth(true), function(req, res, next) {
      var group = req.group;
      ShoppingListModel.findOne({ status: 'Open', ownerGroup: group._id }, function(err, list) {
        if(err) {
          console.log('Error fetching shopping list from db ', err);
          next(err);
        } else {
          res.json(list || new ShoppingListModel({status: 'Open', ownerGroup: group._id}));
        }
      });
    });

    app.get('/suggest', auth.checkAuth(true), function(req, res) {
      res.json(['foo', 'knækbrød']);
    });

    app.post('/list/:listId/:version/item', auth.checkAuth(true), function(req, res, next) {
      var newItems = req.body;
      if(!newItems || !newItems.length)
        return res.send('ok');
      var listId = mongoose.Types.ObjectId(req.params.listId);
      var listVersion = parseInt(req.params.version, 10) || 0;

      var query = { _id: listId, version: listVersion };
      var action = {
        $set: {
          version: listVersion + 1
        },
        $pushAll: { items: newItems }
      };
      ShoppingListModel.update(query, action, function(err, numberAffected) {
        if(err) {
          console.log('Error adding items to list ', err, query, action, listVersion);
          return next(err);
        }
        if(numberAffected == 0)
          return next('concurrency_conflict');
        console.log('Successfully added items to list in version', newItems, listVersion);
        res.json('ok');
        sse.onListUpdate(listId, listVersion + 1);
      });
    });

    app.delete('/list/:listId/:version/item/:ids', auth.checkAuth(true), function(req, res, next) {
      var ids = req.params.ids.split(',');
      var listId = req.params.listId;
      var listVersion = parseInt(req.params.version, 10) || 0;

      var deletees = ids.map(function(id) { return mongoose.Types.ObjectId(id); });

      var query = { _id: listId, version: listVersion };
      var action = {
        $set: { version: listVersion + 1 },
        $pull: { items: { _id: { $in: deletees } } }
      };
      ShoppingListModel.update(query, action, function(err, numberAffected) {
        if(err) {
          console.log('Error updating list ', err, query, action, listVersion);
          return next(err);
        }
        if(numberAffected == 0)
          return next('concurrency_conflict');
        console.log('Successfully deleted items from version', ids, listVersion, query, deletees);
        res.json('ok');
        sse.onListUpdate(listId, listVersion + 1);
      });
    });
  }
};
