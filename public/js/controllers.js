'use strict';
define(function() {
  function ListItem(item, _isNew) {
    this.isNew = _isNew;
    this.isDeleted = false;
    this.text = item.text;
    this._id = item._id;
  }

  var ShoppingListCtrl = function ShoppingListCtrl($scope, $http) {
    console.log('ShoppingListCtrl loading');

    $scope.newItem = { text: '' };
    //confirm will hold a function when the ng-confirm directive has run
    $scope.confirm = null;

    //Initialize with data from the server
    $http.get('list').success(function(data) {
      $scope.list = data;
      registerForSse($scope.list._id);
      $scope.list.items = $scope.list.items.map(function(item) { return new ListItem(item, false); });
    });

    $scope.addItem = function() {
      if(!$scope.newItem.text)
        return;
      $scope.list.items.push(new ListItem({text: $scope.newItem.text }, true));
      $scope.newItem.text = '';
      console.log('posting from add')
      $scope.synchList();//Trigger asynchronous synchronization of the list with the server
    };

    $scope.deleteItem = (function() {
      var doDelete = function(itemId) {
        var deletees = $scope.list.items.filter(function(item) { return item._id == itemId });
        var deletee = deletees.length > 0 && deletees[0];
        deletee.isDeleted = true;
        console.log('posting from delete')
        $scope.synchList();
      };
      return function(itemId) {
        if($scope.confirm) {
          $scope.confirm('Delete item?', 'Are you sure you want to delete item with id '  + itemId + '?').done(function() {
            doDelete(itemId);
          });
        } else {
          doDelete(itemId);
        }
      };
    })();

    var synching = false;
    var synchPending = false;

    $scope.synchList = function() {
      //Send new list items in a post and receive an up-to-date list from the server in the response
      var synchItems = $scope.list.items.filter(function(item) { return item.isNew || item.isDeleted});
      if(synching) {
        synchPending = true;
        console.log('setting pending flag');
        return;
      }
      synching = true;
      $http.post('list', {
        items: synchItems,
        _id: $scope.list._id,
        status: $scope.list.status,
        ownerGroup: $scope.list.ownerGroup,
        closedDate: $scope.list.closedDate
      }).success(function(data) {
          synching = false;
          console.log('synch complete')
          $scope.list = data;
          registerForSse($scope.list._id);
          $scope.list.items = $scope.list.items.map(function(item) { return new ListItem(item, false); });
          if(synchPending) {
            console.log('unsetting pending flag');
            synchPending = false;
            $scope.synchList();
          }
        });
    };

    var handleSse = function(msg) {
      console.log('sse msg: ' + msg.data);
      $scope.synchList();
    };

    var sseSource = null;
    var listenerListId = null;
    var registerForSse = function(listId) {
      if(listId === listenerListId)
        return;
      if(sseSource) {
        console.log('Unregistering old listener');
        sseSource.removeEventListener('message', handleSse);
      }
      console.log('Registering new listener');
      sseSource = new EventSource('/update-stream/' + listId);
      listenerListId = listId;
      sseSource.addEventListener('message', handleSse, false);
    }
  }

  ShoppingListCtrl.$inject = ['$scope', '$http'];//Ensure minification doesn't break dependency injection

  return {
    ShoppingListCtrl: ShoppingListCtrl
  };

});
