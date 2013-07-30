// Generated by CoffeeScript 1.6.3
(function() {
  'use strict';
  define(['app'], function(app) {
    var ListItem, ShoppingListCtrl, idCounter;
    idCounter = 0;
    ListItem = function(item, isNew) {
      this.isNew = isNew;
      this.text = item.text;
      return this._id = !isNew ? item._id : 'tmpId' + idCounter++;
    };
    ShoppingListCtrl = function($scope, listAPIService, confirmService, $timeout) {
      var mergeChanges, sendNewItems, sendPendingDeletions, showFeedback;
      $scope.newItem = {
        text: ''
      };
      $scope.list = {
        items: []
      };
      $scope.deletionFilter = function(item) {
        return !item.isDeleted;
      };
      $scope.addItem = function() {
        if (!$scope.newItem.text) {
          return;
        }
        $scope.list.items.push(new ListItem({
          text: $scope.newItem.text.trim()
        }, true));
        $scope.newItem.text = '';
        return sendNewItems();
      };
      sendPendingDeletions = function() {
        var deletees;
        if (!$scope.list._id) {
          return;
        }
        deletees = _.filter($scope.list.items, function(item) {
          return item.isDeleted;
        });
        return deletees.length && listAPIService.deleteItems(deletees.map(function(item) {
          return item._id;
        }), $scope.list._id, $scope.list.version);
      };
      sendNewItems = function() {
        var newItems;
        if (!$scope.list._id) {
          return;
        }
        newItems = _.filter($scope.list.items, function(item) {
          return item.isNew;
        }).map(function(item) {
          return {
            text: item.text
          };
        });
        return newItems.length && listAPIService.addItems(newItems, $scope.list._id, $scope.list.version);
      };
      $scope.deleteItem = (function() {
        var doDelete;
        doDelete = function(deletee) {
          if (deletee.isNew) {
            return $scope.list.items = _.filter($scope.list.items, function(item) {
              return item._id !== deletee._id;
            });
          } else {
            deletee.isDeleted = true;
            return sendPendingDeletions();
          }
        };
        return function(item) {
          return confirmService.yesNoConfirm('Delete item?', 'Are you sure you want to delete item "' + item.text + '"?').then(function() {
            return doDelete(item);
          });
        };
      })();
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
      $scope.getLatest = (function() {
        var getLatestPending;
        getLatestPending = false;
        return function() {
          if (getLatestPending) {
            return;
          }
          getLatestPending = true;
          return listAPIService.getLatest().then(function(data) {
            var serverList;
            if (data) {
              console.debug('Received fresh list ', data);
              serverList = data;
              serverList.items = serverList.items.map(function(item) {
                return new ListItem(item, false);
              });
              if ($scope.list && $scope.list.items) {
                serverList.items = mergeChanges($scope.list.items, serverList.items);
              }
              $scope.list = serverList;
              listAPIService.registerForSse($scope.list._id);
              return sendNewItems() || sendPendingDeletions();
            }
          }).then((function() {
            return getLatestPending = false;
          }), (function() {
            return getLatestPending = false;
          }));
        };
      })();
      $scope.$on('event:listChange', function(event, data) {
        var _ref;
        if (((_ref = $scope.list) != null ? _ref._id : void 0) !== data.listId) {
          return;
        }
        return $scope.getLatest();
      });
      $scope.$watch('isOnline', function(newValue) {
        if (typeof newValue === !"boolean") {
          return;
        }
        showFeedback('Now ' + (newValue ? 'online' : 'offline'));
        console.debug('Responding to new isOnline value: ', newValue);
        if (newValue) {
          return $scope.getLatest();
        } else {
          return listAPIService.unregisterForSse($scope.list._id);
        }
      });
      showFeedback = (function() {
        var lastPromise;
        lastPromise = null;
        return function(feedback) {
          if (lastPromise) {
            $timeout.cancel(lastPromise);
          }
          $scope.feedback = feedback;
          return lastPromise = $timeout((function() {
            $scope.feedback = '';
            return lastPromise = null;
          }), 5000);
        };
      })();
      return $scope.$watch('isVisible', function(newValue) {
        if (newValue) {
          $scope.getLatest();
          return showFeedback('visibility reported');
        } else if ($scope.list) {
          return listAPIService.unregisterForSse($scope.list._id);
        }
      });
    };
    ShoppingListCtrl.$inject = ['$scope', 'listAPIService', 'confirmService', '$timeout', 'visibilityService'];
    return app.module.controller('ShoppingListCtrl', ShoppingListCtrl);
  });

}).call(this);
