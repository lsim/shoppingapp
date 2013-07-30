// Generated by CoffeeScript 1.6.3
(function() {
  'use strict';
  define(['app'], function(app) {
    app.module.factory('suggestionService', [
      '$http', '$q', '$timeout', function($http, $q, $timeout) {
        return function(term) {
          var deferred;
          deferred = $q.defer();
          $timeout((function() {
            return deferred.resolve([]);
          }), 200);
          return deferred.promise;
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
    ]).factory('listAPIService', [
      '$http', '$q', '$rootScope', 'connectivityService', function($http, $q, $rootScope) {
        var getData, getError, handleSse, sseListeners, _ref;
        getData = function(response) {
          return response.data;
        };
        getError = function(response) {
          return $q.reject(response.data);
        };
        sseListeners = [];
        handleSse = function(msg) {
          var event;
          event = JSON.parse(msg.data);
          console.log('Received list event: ', event);
          return $rootScope.$apply(function() {
            return $rootScope.$broadcast('event:listChange', event);
          });
        };
        if ((_ref = window.applicationCache) != null) {
          _ref.addEventListener('updateready', function() {
            return window.applicationCache.swapCache();
          });
        }
        return {
          getLatest: function() {
            return $http.get('list').then(getData, getError);
          },
          postChanges: function(listChanges, listId, listStatus, listVersion) {
            return $http.post('list', {
              items: listChanges,
              _id: listId,
              status: listStatus,
              version: listVersion
            }).then(getData, getError);
          },
          deleteItems: function(itemIds, listId, listVersion) {
            return $http["delete"]('list/' + listId + '/' + listVersion + '/item/' + itemIds.join(',')).then(getData, getError);
          },
          addItems: function(items, listId, listVersion) {
            return $http.post('list/' + listId + '/' + listVersion + '/item', items).then(getData, getError);
          },
          registerForSse: function(listId) {
            var sseListener;
            sseListener = _.find(sseListeners, function(listener) {
              return listener.listId === listId;
            });
            if (sseListener) {
              return;
            }
            sseListener = {
              listId: listId,
              sseSource: null
            };
            sseListeners.push(sseListener);
            sseListener.sseSource = new EventSource('/update-stream/' + listId);
            sseListener.sseSource.addEventListener('message', handleSse);
            return sseListener.sseSource.onmessage = function(e) {
              return console.debug('sse: onmessage fired with argument ', e);
            };
          },
          unregisterForSse: function(listId) {
            var sseListener;
            sseListener = _.find(sseListeners, function(listener) {
              return listener.listId === listId;
            });
            if (!sseListener) {
              return;
            }
            sseListener.sseSource.close();
            return sseListeners = _.without(sseListeners, sseListener);
          },
          flushCache: function() {
            return $http.post('flush').then(function(response) {
              if (!window.applicationCache) {
                return;
              }
              window.applicationCache.update();
              return getData(response);
            }, getError);
          }
        };
      }
    ]).factory('confirmService', [
      '$rootScope', '$q', function($rootScope, $q) {
        var deferred;
        deferred = null;
        return {
          yesNoConfirm: function(headline, yesNoQuestion) {
            deferred = $q.defer();
            $rootScope.$broadcast('event:confirmationRequired', {
              headline: headline,
              yesNoQuestion: yesNoQuestion
            });
            return deferred.promise;
          },
          confirmationHandled: function(userSaidYes) {
            if (!deferred) {
              return;
            }
            if (userSaidYes) {
              return deferred.resolve();
            } else {
              return deferred.reject();
            }
          }
        };
      }
    ]).factory('connectivityService', [
      '$rootScope', function($rootScope) {
        $rootScope.isOnline = true;
        window.addEventListener('offline', function() {
          return $rootScope.$apply(function() {
            return $rootScope.isOnline = false;
          });
        });
        return window.addEventListener('online', function() {
          return $rootScope.$apply(function() {
            return $rootScope.isOnline = true;
          });
        });
      }
    ]).factory('visibilityService', [
      '$rootScope', function($rootScope) {
        var hidden, onchange;
        $rootScope.isVisible = true;
        onchange = function() {
          console.debug('visibility event fired!');
          return $rootScope.$apply(function() {
            return $rootScope.isVisible = !document[hidden];
          });
        };
        hidden = "hidden";
        if (document.hasOwnProperty(hidden)) {
          return document.addEventListener("visibilitychange", onchange);
        } else if (typeof document[hidden = "mozHidden"] === 'boolean') {
          return document.addEventListener("mozvisibilitychange", onchange);
        } else if (document.hasOwnProperty(hidden = "webkitHidden")) {
          return document.addEventListener("webkitvisibilitychange", onchange);
        } else if (document.hasOwnProperty(hidden = "msHidden")) {
          return document.addEventListener("msvisibilitychange", onchange);
        }
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
