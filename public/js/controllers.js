'use strict';

function ListItem(item, _isNew) {
	this.isNew = _isNew;
	this.isDeleted = false;
	this.text = item.text;
	this.mult = item.mult;
    this._id = item._id;
}

function ShoppingListCtrl($scope, $http) {

  	$scope.itemMult = 1;

    //Initialize with data from the server
	$http.get('list').success(function(data) {
		$scope.list = data;
		$scope.list.items = $scope.list.items.map(function(item) { return new ListItem(item, false); });
	});

	$scope.addItem = function() {
		if(!$scope.itemText || !$scope.itemMult)
			return;
		$scope.list.items.push(new ListItem({text: $scope.itemText, mult: $scope.itemMult}, true));
		$scope.itemText = '';
		$scope.itemMult = 1;
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
            $scope.list.items = $scope.list.items.map(function(item) { return new ListItem(item, false); });
		});
	};
}

ShoppingListCtrl.$inject = ['$scope', '$http'];//Ensure minification doesn't break dependency injection
