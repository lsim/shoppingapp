'use strict'
define [], () ->
  module: angular.module('shoppingApp', ['http-auth-interceptor'])
#  .config ['$routeProvider', ($routeProvider) ->
#    $routeProvider.when '/',
#      templateUrl: 'partials/shoppingList.html'
#      controller: controllers.ShoppingListCtrl
#    $routeProvider.otherwise
#      redirectTo: '/'
#  ]
