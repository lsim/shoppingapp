'use strict'

function ListItem(item, _isNew) {
	this.isNew = _isNew;
	this.isDeleted = false;
	this.text = item.text;
	this.mult = item.mult;
}

function ShoppingListCtrl($scope, $http) {

  	$scope.itemMult = 1;

	$http.get('list').success(function(data) {
		$scope.list = data;
		$scope.list.items = $scope.list.items.map(ListItem);
	});

	$scope.addItem = function() {
		if(!$scope.itemText || !$scope.itemMult)
			return;
		$scope.list.items.push(new ListItem({text: $scope.itemText, mult: $scope.itemMult}, true));
		$scope.itemText = '';
		$scope.itemMult = 1;
		$scope.synchList();
	};

	$scope.synchList = function() {
		//Send new list items in a post and receive an up-to-date list from the server in the response
		var newItems = $scope.list.items.filter(function(item) { return item.isNew});
		$http.post('list', { 
			items: newItems, 
			_id: $scope.list._id, 
			status: $scope.list.status,
			ownerGroup: $scope.list.ownerGroup, 
			closedDate: $scope.list.closedDate 
		}).success(function(data) {
			$scope.list = data;
			$scope.list.items = $scope.list.items.map(ListItem);
		});
	};
}

ShoppingListCtrl.$inject = ['$scope', '$http'];//Ensure minification doesn't break dependency injection
