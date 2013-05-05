'use strict';

function ListItem(item, _isNew) {
	this.isNew = _isNew;
	this.isDeleted = false;
	this.text = item.text;
    this._id = item._id;
}

function ShoppingListCtrl($scope, $http) {

    $scope.newItem = { text: '' };

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
		$scope.synchList();//Trigger asynchronous synchronization of the list with the server
	};

    $scope.deleteItem = function(itemId) {
        var deletees = $scope.list.items.filter(function(item) { return item._id == itemId });
        var deletee = deletees.length > 0 && deletees[0];
        deletee.isDeleted = true;
        $scope.synchList();
    };

	$scope.synchList = function() {
		//Send new list items in a post and receive an up-to-date list from the server in the response
		var synchItems = $scope.list.items.filter(function(item) { return item.isNew || item.isDeleted});
		$http.post('list', { 
			items: synchItems,
			_id: $scope.list._id, 
			status: $scope.list.status,
			ownerGroup: $scope.list.ownerGroup, 
			closedDate: $scope.list.closedDate 
		}).success(function(data) {
			$scope.list = data;
            registerForSse($scope.list._id);
            $scope.list.items = $scope.list.items.map(function(item) { return new ListItem(item, false); });
		});
	};

    var handleSse = function(msg) {
        console.log('sse msg: ' + msg.data);
        $scope.synchList();
    }

    var sseSource = null;
    var listenerListId = null;
    var registerForSse = function(listId) {
//        if(listId === listenerListId)
//            return;
//        if(sseSource) {
//            console.log('Unregistering old listener');
//            sseSource.removeEventListener('message', handleSse);
//        }
//        console.log('Registering new listener');
//        sseSource = new EventSource('/update-stream/' + listId);
//        listenerListId = listId;
//        sseSource.addEventListener('message', handleSse, false);
    }
}

ShoppingListCtrl.$inject = ['$scope', '$http'];//Ensure minification doesn't break dependency injection
