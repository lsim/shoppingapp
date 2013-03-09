'use strict'

angular.module('shoppingApp', ['shoppingApp.filters', 'shoppingApp.services', 'shoppingApp.directives']).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.when('/', {templateUrl: 'partials/shoppingList.html', controller: ShoppingListCtrl});
		$routeProvider.otherwise({redirectTo: '/'});
	}]);
