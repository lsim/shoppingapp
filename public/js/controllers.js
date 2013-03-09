'use strict'

function ShoppingListCtrl($scope, $http) {
	$scope.list = {
 		Items: []
 	};

	$http.get('list').success(function(data) {
		$scope.list = data;
		$scope.list.forEach(function(elt) { elt.isNew = false; });
	});

	$scope.addItem = function() {
		$scope.list.Items.push({Text: $scope.itemText, Multiplicity: $scope.itemMultiplicity, isNew = true });
		$scope.itemText = $scope.itemMultiplicity = '';
	};

	$scope.synchList = function() {
		//Send new list items in a post and receive an up-to-date list from the server in the response
		
	};
}

ShoppingListCtrl.$inject = ['$scope', '$http'];//Ensure minification doesn't break dependency injection
