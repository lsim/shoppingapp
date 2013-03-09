'use strict'

angular.module('shoppingApp', ['shoppingApp.filters', 'shoppingApp.services', 'shoppingApp.directives']).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.when('/', {templateUrl: 'partials/shoppingList.jade', controller: ShoppingListCtrl});
		$routeProvider.otherwise({redirectTo: '/'});
	}]);


// requirejs.config({
// 	paths: {
// 		jquery: '//cdnjs.cloudflare.com/ajax/libs/jquery/1.9.1/jquery.min',
// 		angular: '//cdnjs.cloudflare.com/ajax/libs/angular.js/1.1.1/angular',
// 		jqm: '//code.jquery.com/mobile/1.2.0/jquery.mobile-1.2.0.min'
// 	}
// });

// require(['jquery', 'angular', './ShoppingListController'], function($) {
// 	//Do page initialization here
// });