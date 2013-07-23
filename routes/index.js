var ShoppingListModel = require('../models/ShoppingList');
var ShoppingGroupModel = require('../models/ShoppingGroup');
var Deferred = require('JQDeferred');
var auth = require('./auth');
var sse = require('./sse');

module.exports = {
  registerEndpoints: function(app) {

    /*
     * GET home page.
     */
    app.get('/', auth.checkAuth(), function(req, res) {
      res.render('index', {
        title: 'A Shopping List!'
      });
    });

//    function getOpenList(group, fields) {
//      var openingList = Deferred();
//      ShoppingListModel.findOne({ status: 'Open', ownerGroup: group._id }, fields, function(err, list) {
//        if(err) {
//          console.log('Error fetching shopping list from db ' + err);
//          openingList.reject(err);
//        } else {
//          var model = list || new ShoppingListModel({status: 'Open', ownerGroup: group._id});
//          openingList.resolve(model);
//        }
//      });
//      return openingList.promise();
//    }

    app.get('/list', auth.checkAuth(true), function(req, res, next) {
      var group = req.group;
      ShoppingListModel.findOne({ status: 'Open', ownerGroup: group._id }, function(err, list) {
        if(err) {
          console.log('Error fetching shopping list from db ', err);
          next(err);
        } else {
          res.json({
            data: list || new ShoppingListModel({status: 'Open', ownerGroup: group._id})
          });
        }
      });
    });

//    app.get('/fulljson', auth.checkAuth(true), function(req, res) {
//      var group = req.group;
//      getOpenList(group, 'items.text').done(function(openList) {
//        var mappedList = openList.items.map(function(item) { return item.text; });
//        res.json({ title: group.name, items: mappedList });
//      }).fail(res.json);
//    });

    function wrapResult(err, status, data) {
      return {
        error: err,
        status: status || err ? 'error' : 'success',
        data: data
      }
    }

    /*
     * POST list json
     */
    app.post('/list', auth.checkAuth(true), function(req, res) {
      var group = req.group;

      var deletedItemIds = req.body.items.filter(function(item) { return item.isDeleted; }).map(function(item) { return item._id});
      var newItems = req.body.items.filter(function(item) { return item.isNew; });
      if(!(deletedItemIds && deletedItemIds.length) &&
        !(newItems && newItems.length)) {
        //No changes to the list were received.
        res.json(wrapResult(null));
        return;
      }
      //Make sure temporary client side ids don't cause trouble for our friend mongo
      //newItems.forEach(function(item) { delete item._id; });

      //Look up the list in db so we can update it with the posted data
      ShoppingListModel.findOne({_id: req.body._id, ownerGroup: group._id }, function(err, list) {
        if(err) {
          console.log('Error fetching shopping list from db ' + err);
          return res.json(wrapResult(err));
        }

        if(!list) {
          //A new list is being saved
          list = new ShoppingListModel({_id: req.body._id, status: req.body.status, ownerGroup: group._id, version: 0, items: newItems });
          list.save(function(err) {
            if(err) {
              console.log('List save FAIL ', list._id, list.version, err);
              return res.json(wrapResult(err));
            }
            console.log('List save SUCCESS ', list._id, list.version);
            sse.onListUpdate(list._id, list.version);
            res.json(wrapResult(null));
          });
        } else {
          //An existing list is being updated
          var oldVersion = list.version;

          //Build updated item list
          var updatedItemList = list.items
            .filter(function(item) { return deletedItemIds.indexOf(item._id.toHexString()) < 0; })//Remove deleted items
            .concat(newItems);//Add new items

          var query = { _id: list._id, version: oldVersion };
          var updateAction = {
            $set: {
              items: updatedItemList,
              version: oldVersion + 1
            }
          }
          ShoppingListModel.update(query, updateAction, function(err) {
            if(err) {
              //TODO: inspect to find out how to detect the concurrency conflict scenario
              //Concurrency conflict - what to do!?
              //List exists, but not in the expected version
              console.log('Concurrency conflict? ', list._id, list.version, err);
              return res.json(wrapResult(err, 'conflict'));
            }
            console.log('List update SUCCESS ', list._id, list.version);
            sse.onListUpdate(list._id, list.version);
            res.json(wrapResult(null));
          });
        }
      });
    });

    app.get('/suggest', auth.checkAuth(true), function(req, res) {
      res.json(['foo', 'bar', 'baz', 'knækbrød']);
    });
  }
};
