// Generated by CoffeeScript 1.6.3
(function() {
  'use strict';
  define(['app'], function(app) {
    var ListItem, ShoppingListCtrl, idCounter;
    idCounter = 0;
    ListItem = function(item, isNew) {
      this.isNew = isNew;
      this.isDeleted = false;
      this.text = item.text;
      return this._id = !isNew ? item._id : 'tmpId' + idCounter++;
    };
    ShoppingListCtrl = function($scope, $http) {
      var handleSse, listenerListId, mergeChanges, registerForSse, sseSource;
      console.log('ShoppingListCtrl loading');
      $scope.newItem = {
        text: ''
      };
      $scope.confirm = null;
      $scope.addItem = function() {
        if (!$scope.newItem.text) {
          return;
        }
        $scope.list.items.push(new ListItem({
          text: $scope.newItem.text
        }, true));
        $scope.newItem.text = '';
        console.log('posting from add');
        return $scope.postChanges();
      };
      $scope.deleteItem = (function() {
        var doDelete;
        doDelete = function(itemId) {
          var deletee;
          deletee = _.find($scope.list.items, function(item) {
            return item._id === itemId;
          });
          if (deletee && deletee.isNew) {
            return $scope.list.items = _.filter($scope.list.items, function(item) {
              return item._id !== itemId;
            });
          } else {
            deletee && (deletee.isDeleted = true);
            console.log('posting from delete');
            return $scope.postChanges();
          }
        };
        return function(item) {
          if ($scope.confirm) {
            return $scope.confirm('Delete item?', 'Are you sure you want to delete item "' + item.text + '"?').then(function() {
              return doDelete(item._id);
            });
          } else {
            return doDelete(item._id);
          }
        };
      })();
      $scope.postChanges = function() {
        var changedItems;
        changedItems = $scope.list.items.filter(function(item) {
          return item.isNew || item.isDeleted;
        });
        changedItems.forEach(function(item) {
          if (item.isNew) {
            return delete item._id;
          }
        });
        return $http.post('list', {
          items: changedItems,
          _id: $scope.list._id,
          status: $scope.list.status,
          version: $scope.list.version
        }).success(function(data) {
          console.log('postChanges success', data);
          if (data.status === 'conflict') {
            return console.log('Concurrency conflict detected', data);
          }
        });
      };
      mergeChanges = function(localList, serverList) {
        var deletedLocalItems, newLocalItems;
        newLocalItems = _.filter(localList, function(localItem) {
          return localItem.isNew && !_.some(serverList, function(serverItem) {
            return serverItem.text === localItem.text;
          });
        });
        deletedLocalItems = _.filter(localList, function(localItem) {
          return localItem.isDeleted;
        });
        serverList.filter(function(item) {
          return _.some(deletedLocalItems, function(deletedItem) {
            return item._id === deletedItem._id;
          });
        }).forEach(function(item) {
          return item.isDeleted = true;
        });
        return serverList.concat(newLocalItems);
      };
      $scope.getLatest = function() {
        return $http.get('list').success(function(response) {
          var serverList;
          console.log('list fetched successful', response);
          if (response.data) {
            serverList = response.data;
            serverList.items = serverList.items.map(function(item) {
              return new ListItem(item, false);
            });
            if ($scope.list && $scope.list.items) {
              serverList.items = mergeChanges($scope.list.items, serverList.items);
            }
            $scope.list = serverList;
            return registerForSse($scope.list._id);
          }
        });
      };
      handleSse = function(msg) {
        console.log('Received sse: ', msg);
        return $scope.getLatest();
      };
      sseSource = null;
      listenerListId = null;
      registerForSse = function(listId) {
        if (listId === listenerListId) {
          return;
        }
        if (sseSource) {
          console.log('Unregistering old listener');
          sseSource.removeEventListener('message', handleSse);
        }
        console.log('Registering new listener');
        sseSource = new EventSource('/update-stream/' + listId);
        listenerListId = listId;
        return sseSource.addEventListener('message', handleSse, false);
      };
      return $scope.getLatest();
    };
    ShoppingListCtrl.$inject = ['$scope', '$http'];
    return app.module.controller('ShoppingListCtrl', ShoppingListCtrl);
  });

}).call(this);
