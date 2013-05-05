'use strict';

(function() {
    angular.module('shoppingApp.services', [])
        .factory('suggestionService', ['$http', function($http) {
            return function(term) {
                return $http.get('/suggest?term=' + encodeURIComponent(term));
            };
        }]);
})();

