'use strict';
define(['app'], function(app) {
  app.module.directive('ngSuggest', function() {
      return {
        replace: true,
        restrict: 'E',
        transclude: true,
        template: "<div data-ng-transclude></div>",
        controller: function(suggestionService, $scope, $timeout) {
          console.log('ng-suggest controller running');
          $scope.suggestions = [];
          $scope.ignoreTextChange = false;

          $scope.getSuggestions = function(term) {
            return suggestionService(term);
          };
          $scope.acceptSuggestion = function(suggestion) {
            $scope.ignoreTextChange = true;
            $scope.newItem.text = suggestion;
            $timeout(function() { $scope.ignoreTextChange = false; }, 10);

            $scope.suggestions = [];
          };
        },
        link: function postLink(scope, elm, attrs) {
          console.log('ng-suggest postLink running');
          scope.$watch('newItem.text', function(newVal) {
            console.debug('ngSuggest watch triggered ', scope.newItem);
            if(scope.ignoreTextChange) return;
            if(newVal && newVal.length > 2) {
              scope.getSuggestions(newVal).then(function(suggestions) {
                scope.suggestions = suggestions ? suggestions.data : [];
              }, function() {
                console.error('Failed getting suggestions');
              });
            } else {
              scope.suggestions = [];
            }
          });
        }
      };
    }).directive('ngConfirm', ['$compile', '$q', function($compile, $q) {
      return {
        restrict: 'AC',
        replace: false,
        scope: {
          showConfirmModal: '=ngConfirm'
        },
        controller: ['$scope', function(scope) {
          console.log('ng-confirm controller running');
          scope.deferred = null;
          scope.confirmTitle = '';
          scope.confirmQuestion = '';
          //Make available on the parent scope the function to trigger a confirmation dialog
          scope.showConfirmModal = function(title, question) {
            var deferred = $q.defer();
            scope.confirmTitle = title;
            scope.confirmQuestion = question;
            scope.deferred = deferred;
            scope.setupModalDom(deferred);
            return deferred.promise;
          };
        }],
        link: function postLink(scope, elm) {
          console.log('ng-confirm postLink running');

          scope.setupModalDom = function(deferred) {
            console.log('deferred changed value: ',deferred);
            if(!deferred) return;
            console.log('deferred changed value2');
            var modalOverlay = angular.element(modalOverlayMarkup);
            $compile(modalOverlay)(scope);
            elm.append(modalOverlay);

            var cleanup = function() { modalOverlay.remove(); }
            deferred.promise.then(cleanup, cleanup);
          };

          var modalOverlayMarkup =
            "<div class='modal-dialog' >\
              <header class='bar-title'>\
                  <h1 class='title'>{{confirmTitle}}</h1>\
                  <a ng-click='deferred.reject()' class='button no-bn'>No</a>\
              </header>\
              <div class='content content-padded'>\
                  <p>{{confirmQuestion}}</p>\
                  <a ng-click='deferred.resolve()' class='yes-bn button button-block'>Yes</a>\
              </div>\
             </div>";
        }
      };
    }]).directive('authForm', ['authAPIService', 'authService', function(authAPIService, authService) {
      function hide(element) {
        element.addClass('hidden');
      }
      function show(element) {
        element.removeClass('hidden');
      }
      return {
        controller: ['$scope', function($scope) {
          function updateGroups() {
            $scope.existingGroups = authAPIService.getGroups();
          }
          function clearFields() {
            $scope.username = $scope.password = $scope.password1 = $scope.password2 = $scope.groupName = $scope.groupPassword = $scope.groupPassword1 = $scope.groupPassword2 = '';
          }
          $scope.handleHeaderClick = function() {
            if($scope.authTask == 'login') {
              $scope.authTask = 'register';
              $scope.headerLinkText = 'Create group'
            } else if($scope.authTask == 'register') {
              updateGroups();
              $scope.selectedGroup = null;
              $scope.authTask = 'createGroup';
              $scope.headerLinkText = 'Cancel';
            } else if(!$scope.authTask || $scope.authTask == 'createGroup') {
              $scope.authTask = 'login'
              $scope.headerLinkText = 'Create user';
            }
          };
          // Initialize authTask and headerLinkText with a call to handleHeaderClick
          $scope.handleHeaderClick();
          $scope.login = function(username, password) {
            authAPIService.login(username, password).then(function(data) {
              authService.loginConfirmed(data);
              clearFields();
            }, function(reason) {
              console.debug('Login failed: ', reason);
              //TODO: provide feedback on failure
            });
          };
          $scope.register = function(username, password, group, groupPassword) {
            authAPIService.register(username, password, group._id, groupPassword).then(function() {
              $scope.username = username;
              $scope.password = password;
              $scope.authTask = 'login';
            }, function(reason) {
              console.debug('Registration failed: ', reason);
              //TODO: provide feedback on failure
            });
          };
          $scope.createGroup = function(groupName, groupPassword) {
            authAPIService.createGroup(groupName, groupPassword).then(function() {
              updateGroups();
              //TODO: select created group in registration form
              $scope.authTask = 'register';
            }, function(reason) {
              console.debug('Group creation failed: ', reason);
              //TODO: provide feedback on failure
            });
          };
        }],
        restrict: 'C',
        template:
          "<div class='modal-dialog'>\
            <header class='bar-title'>\
              <h1 class='title'>Please log in</h1>\
              <a ng-click='handleHeaderClick()' class='button'>{{headerLinkText}}</a>\
            </header>\
            <div class='content content-padded'>\
              <form ng-switch='authTask'>\
                <span ng-switch-when='login'>\
                  <input type='text' data-ng-model='userName' placeholder='Username' />\
                  <input type='password' data-ng-model='password' placeholder='Password' />\
                  <button type='button' ng-click='login(userName,password)' class='button button-block'>Log in</button>\
                </span>\
                <span ng-switch-when='register'>\
                  <input type='text' data-ng-model='username' placeholder='Username' />\
                  <input type='password' data-ng-model='password1' placeholder='Password' />\
                  <input type='password' data-ng-model='password2' placeholder='Repeat password' />\
                  <label> Select your shopping group\
                    <select data-ng-options='g.name for g in existingGroups' data-ng-model='selectedGroup' />\
                  </label>\
                  <input type='password' data-ng-model='groupPassword' placeholder='Group password' />\
                  <button type='button' data-ng-click='register(username,password1,selectedGroup,groupPassword)' data-ng-disabled='!password1 || password1 !== password2' class='button button-block'>Create user</button>\
                </span>\
                <span ng-switch-when='createGroup'>\
                  <input type='text' data-ng-model='groupName' placeholder='Group name' />\
                  <input type='password' data-ng-model='groupPassword1' placeholder='Password' />\
                  <input type='password' data-ng-model='groupPassword2' placeholder='Repeat password' />\
                  <button type='button' data-ng-click='createGroup(groupName, groupPassword2)' data-ng-disabled='!groupPassword1 || groupPassword1 !== groupPassword2' class='button button-block'>Log in</button>\
                </span>\
              </form>\
            </div>\
          </div>",
        link: function postLink($scope, element, attrs) {
          hide(element);
          $scope.$on('event:auth-loginRequired', function() {
            $scope.authTask = 'login';
            show(element);
          });

          $scope.$on('event:auth-loginConfirmed', function() {
            hide(element);
          });
        }
      }
    }]).directive('waitingForAngular', function() {//This one serves to remove the angular FOUC
      return {
        restrict: 'C',
        link: function postLink($scope, element) {
          element.removeClass('waiting-for-angular');
        }
      }
    });

});



