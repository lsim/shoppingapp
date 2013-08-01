var lsiexports = lsiexports || {};

(function() {

  var appModule = angular.module('irma-extension', ['slidingTab']);

  appModule.factory('baseUrlService', function() {
    var baseUrlPromise = lsiexports.getLocalStorage('serviceHostName');
    return function baseUrlService() {
      return baseUrlPromise;
    }
  });

  appModule.factory('loginService', ['baseUrlService', function(baseUrlService) {
    var baseUrlPromise = baseUrlService();
    return function loginService(userName, password) {
      var loggingIn = lsiexports.Deferred();

      baseUrlPromise.done(function baseUrlRetrieved(baseUrl) {
        lsiexports.post(baseUrl + '/login', JSON.stringify({ username: userName, password: password })).done(function() {
          loggingIn.resolve();
        }).fail(loggingIn.reject);
      }).fail(loggingIn.reject);
      return loggingIn.promise();
    };
  }]);

  appModule.factory('listService', ['baseUrlService', function(baseUrlService) {
    var baseUrlPromise = baseUrlService();
    return {
      load: function loadList(bypassCache) {
        var loadingList = lsiexports.Deferred();

        baseUrlPromise.done(function baseUrlRetrieved(baseUrl) {
          function noSessionDataHandler() {
            lsiexports.get(baseUrl + '/irmadata').then(function serverDataRetrieved(data) {
              lsiexports.setSessionStorage('recentList', data);
              loadingList.resolve($.parseJSON(data));
            }, loadingList.reject);
          }
          if(bypassCache) {
            noSessionDataHandler();
          } else {
            lsiexports.getSessionStorage('recentList').then(function(response) {
              var data = {};
              try {
                data = $.parseJSON(response);
              } catch(ex) {
                loadingList.reject('Bad response received');
              }
              loadingList.resolve(data);
            }, noSessionDataHandler);
          }
        }).fail(loadingList.reject);
        return loadingList.promise();
      },
      saveToCache: function saveListToCache(list) {
        var savingList = lsiexports.Deferred();
        lsiexports.setSessionStorage('recentList', JSON.stringify(list)).then(savingList.resolve, savingList.reject);
        return savingList.promise();
      }
    }
  }]);

  //Loads credentials stored in local/session storage
  appModule.factory('loadCredentialService', function() {
    return function loadCredentialService() {
      var loadingCredentials = lsiexports.Deferred();
      lsiexports.getLocalStorage('userName').done(function(userNameResponse) {
        lsiexports.getSessionStorage('userPass').done(function(passwordResponse) {
          loadingCredentials.resolve([userNameResponse, passwordResponse]);
        }).fail(function() { loadingCredentials.resolve([userNameResponse, null])});
      }).fail(loadingCredentials.reject);

      return loadingCredentials.promise();
    };
  });

  appModule.factory('searchTriggerService', function() {
    function injectScript(source) {
      //Courtesy of http://voodooattack.blogspot.dk/2010/01/writing-google-chrome-extension-how-to.html
      var elem = document.getElementById('injected-script');
      if(elem) {
        document.head.removeChild(elem);
      }
      elem = document.createElement("script");
      elem.type = "text/javascript";
      elem.innerHTML = source;
      elem.id = 'injected-script';

      return document.head.appendChild(elem);
    }
    return function searchTriggerService(term) {
      injectScript("\
            var searchScope = angular.element('#siteSearchTerm').scope();\
            if(!searchScope)\
                return false;\
            searchScope.$apply(function() {\
                searchScope.term = '" + term + "';\
                searchScope.suggest();\
            });\
            ");
    };
  });

  appModule.controller('IrmaExtensionCtrl', ['$scope', 'listService', 'loadCredentialService', 'loginService', 'searchTriggerService', function($scope, listService, loadCredentialService, loginService, searchTriggerService) {
    $scope.list = null;
    $scope.listLoaded = false;
    $scope.listTitleDisplay = '';
    $scope.$watch('list', function(newList) {
      $scope.listLoaded = newList && newList.items;
      $scope.listTitleDisplay = $scope.listLoaded ? newList.title : 'None loaded';
    });
    $scope.credentials = { userName: '', password: ''};
    $scope.credentialsStored = false;
    $scope.isLoggedIn = false;
    $scope.errorMessage = '';
    $scope.numPending = 0;
    $scope.tabExpanded = false;
    $scope.$watch('tabExpanded', function(newVal) {
      lsiexports.setSessionStorage('tabExpanded', newVal);
    });

    function ensureLoggedIn() {
      var working = lsiexports.Deferred();
      if($scope.isLoggedIn)
        setTimeout(working.resolve, 10);//Must either always resolve synchronously or never resolve synchronously
      else
        loginService($scope.credentials.userName, $scope.credentials.password).done(function authenticated() {
          working.resolve();
        }).fail(working.reject);
      return working.promise();
    }

    $scope.logout = function logout() {
      $scope.credentials.password = '';
      $scope.isLoggedIn = false;
      $scope.list = null;
    }

    $scope.loadListData = function loadListData(bypassCache) {
      //Ensure we have means of authenticating (or have authenticated already)
      if(!$scope.isLoggedIn && (!$scope.credentials.userName || !$scope.credentials.password)) {
        $scope.errorMessage = 'Please provide authentication';
        return;
      }
      if(!$scope.credentialsStored && $scope.credentials.userName && $scope.credentials.password) {
        $.when(lsiexports.setLocalStorage('userName', $scope.credentials.userName),
            lsiexports.setSessionStorage('userPass', $scope.credentials.password)).done(function() {
            $scope.$apply(function() {$scope.credentialsStored = true;});
          });
      }

      ensureLoggedIn().done(function authenticated() {
        $scope.$apply(function() { $scope.isLoggedIn = true });
        listService.load(bypassCache).done(function listLoaded(loadedList) {
          $scope.$apply(function() {
            $scope.errorMessage = '';
            $scope.list = loadedList;
          });
        }).fail(function(msg) {
            $scope.$apply(function() { $scope.errorMessage = 'List fetch failed: ' + msg; $scope.isLoggedIn = false; });
          });
      }).fail(function(msg) {
          $scope.$apply(function() { $scope.errorMessage = 'Login failed: ' + msg; $scope.isLoggedIn = false; });
        });
    };

    $scope.searchText = function(text) {//Inject a script into the dom thus causing it to be executed in the host page script context!
      searchTriggerService(text);
    };

    //Loads credentials from local/session storage
    $scope.loadStoredCredentials = function loadStoredCredentials() {
      return loadCredentialService().always(function(args) {
        if(!args || !args.length) return;
        $scope.$apply(function() {
          $scope.credentials.userName = args[0];
          $scope.credentials.password = args[1];
          $scope.credentialsStored = args[0] && args[1];
        });
      });
    };

    $scope.itemCheckStatusChanged = function itemCheckStatusChanged(item) {
      listService.saveToCache($scope.list);
    };

    lsiexports.Deferred = function Deferred() {
      var deferred = $.Deferred();
      if($scope.$$phase) {
        $scope.numPending++;
      } else {
        $scope.$apply(function() { $scope.numPending++; });
      }
      deferred.always(function() { $scope.$apply(function() { $scope.numPending--; })});
      return deferred;
    };

    //Load data from local/session storage
    lsiexports.getSessionStorage('tabExpanded').done(function(value) {
      $scope.$apply(function() {
        $scope.tabExpanded = value === 'true';//values come back from storage as strings
      });
    });
    $scope.loadStoredCredentials().done(function() {
      $scope.loadListData();
    });
  }]);

  lsiexports.Deferred = function() { return $.Deferred(); };
})();