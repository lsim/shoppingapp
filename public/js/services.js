// Generated by CoffeeScript 1.6.3
(function() {
  'use strict';
  define(['app'], function(app) {
    app.module.factory('suggestionService', [
      '$http', function($http) {
        return function(term) {
          return $http.get('/suggest?term=' + encodeURIComponent(term));
        };
      }
    ]).factory('authAPIService', [
      '$http', '$q', function($http, $q) {
        var getData, getError;
        getData = function(response) {
          return response.data;
        };
        getError = function(response) {
          return $q.reject(response.data);
        };
        return {
          login: function(username, password) {
            return $http.post('login', {
              username: username,
              password: password
            }).then(getData, getError);
          },
          getGroups: function() {
            return $http.get('groups').then(getData, getError);
          },
          register: function(username, password, groupId, groupPassword) {
            return $http.post('register', {
              username: username,
              password: password,
              groupId: groupId,
              groupPassword: groupPassword
            }).then(getData, getError);
          },
          createGroup: function(groupName, groupPassword) {
            return $http.post('groups', {
              groupName: groupName,
              groupPassword: groupPassword
            }).then(getData, getError);
          }
        };
      }
    ]);
    angular.module('http-auth-interceptor', ['http-auth-interceptor-buffer']).factory('authService', [
      '$rootScope', 'httpBuffer', function($rootScope, httpBuffer) {
        return {
          loginConfirmed: function(data) {
            $rootScope.$broadcast('event:auth-loginConfirmed', data);
            return httpBuffer.retryAll();
          }
        };
      }
    ]).config([
      '$httpProvider', function($httpProvider) {
        var interceptor;
        interceptor = [
          '$rootScope', '$q', 'httpBuffer', function($rootScope, $q, httpBuffer) {
            var error, success;
            success = function(response) {
              return response;
            };
            error = function(response) {
              var deferred;
              if (response.status === 401 && !response.config.ignoreAuthModule) {
                deferred = $q.defer();
                httpBuffer.append(response.config, deferred);
                $rootScope.$broadcast('event:auth-loginRequired');
                return deferred.promise;
              }
              return $q.reject(response);
            };
            return function(promise) {
              return promise.then(success, error);
            };
          }
        ];
        return $httpProvider.responseInterceptors.push(interceptor);
      }
    ]);
    return angular.module('http-auth-interceptor-buffer', []).factory('httpBuffer', [
      '$injector', function($injector) {
        var $http, buffer, retryHttpRequest;
        buffer = [];
        $http = null;
        retryHttpRequest = function(config, deferred) {
          var errorCallback, successCallback;
          successCallback = function(response) {
            return deferred.resolve(response);
          };
          errorCallback = function(response) {
            return deferred.reject(response);
          };
          $http = $http || $injector.get('$http');
          return $http(config).then(successCallback, errorCallback);
        };
        return {
          append: function(config, deferred) {
            return buffer.push({
              config: config,
              deferred: deferred
            });
          },
          retryAll: function() {
            buffer.forEach(function(bufferItem) {
              return retryHttpRequest(bufferItem.config, bufferItem.deferred);
            });
            return buffer = [];
          }
        };
      }
    ]);
  });

}).call(this);
