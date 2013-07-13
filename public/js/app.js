'use strict'

require.config({
  baseUrl: 'js',
  paths: {
    angular: "lib/angular-unstable/angular"
  }
})

define(['controllers', 'angular'], function(controllers) {
  return {
    module: angular.module('shoppingApp', []).
      config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/', {templateUrl: 'partials/shoppingList.html', controller: controllers.ShoppingListCtrl});
        $routeProvider.otherwise({redirectTo: '/'});
      }])
  };
});
