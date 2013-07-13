'use strict';
define(['app'], function(app) {
  app.module.factory('suggestionService', ['$http', function($http) {
      return function(term) {
        return $http.get('/suggest?term=' + encodeURIComponent(term));
      };
    }]);
});

