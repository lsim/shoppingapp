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
            //console.debug('ngSuggest watch triggered ', scope.newItem);
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
    }).directive('ngConfirm', ['$compile', '$q', 'confirmService', function($compile, $q, confirmService) {
      return {//TODO: parametrize so that consumer can choose if yes or no is the default
        restrict: 'C',
        replace: true,
        template:
          "<div class='modal-dialog' data-ng-show='confirmTitle'>\
            <header class='bar-title'>\
                <h1 class='title'>{{confirmTitle}}</h1>\
                <a ng-click='handleReply(false)' class='button no-bn'>No</a>\
            </header>\
            <div class='content content-padded'>\
                <p class='question'>{{confirmQuestion}}</p>\
                <a ng-click='handleReply(true)' class='yes-bn button button-block'>Yes</a>\
            </div>\
          </div>",
        controller: ['$scope', function($scope) {
          $scope.confirmTitle = '';
          $scope.confirmQuestion = '';

          $scope.handleReply = function(userSaidYes) {
            $scope.confirmTitle = $scope.confirmQuestion = '';
            confirmService.confirmationHandled(userSaidYes);
          };
        }],
        link: function postLink($scope, elm) {
          $scope.$on('event:confirmationRequired', function(event, confirmationData) {
            $scope.confirmTitle = confirmationData.headline;
            $scope.confirmQuestion = confirmationData.yesNoQuestion;
          });
        }
      };
    }]).directive('authForm', ['authAPIService', 'authService', 'storageService', function(authAPIService, authService, storageService) {
      return {
        scope: {},
        controller: ['$scope', '$timeout', function($scope, $timeout) {
          function updateGroups() {
            return $scope.existingGroups = authAPIService.getGroups();
          }
          function clearFields() {
            $scope.username = $scope.password = $scope.password1 = $scope.password2 = $scope.groupName = $scope.groupPassword = $scope.groupPassword1 = $scope.groupPassword2 = $scope.feedback = '';
          }

          function loadStoredCredentials() {
            var login = storageService.local.get('rememberedLogin');
            $scope.username = login && login.username;
            $scope.password = login && login.password;
            $scope.rememberLogin = !!login.password
          }

          function saveCredentials(username, password, storePassword) {
            storageService.local.set('rememberedLogin', { username: username, password: storePassword ? password : '' });
          }

          // Call setDialogMode with falsy value to hide the auth dialog entirely
          $scope.setDialogMode = function(mode) {
            $scope.feedback = '';
            $scope.dialogMode = mode;
            if(mode == 'register') {
              $scope.headerTitle = 'Create user';
              updateGroups();
              $scope.headerLinkText = 'Create group'
              $scope.handleHeaderClick = function() { $scope.setDialogMode('createGroup'); };
            } else if(mode == 'createGroup') {
              $scope.headerTitle = 'Create group';
              $scope.headerLinkText = 'Cancel';
              $scope.handleHeaderClick = function() { $scope.setDialogMode('login'); };
            } else if(mode == 'login') {
              $scope.headerTitle = 'Please log in';
              loadStoredCredentials();
              $scope.headerLinkText = 'Create user';
              $scope.handleHeaderClick = function() { $scope.setDialogMode('register'); };
            }
          };
          $scope.setDialogMode(null);

          $scope.login = function(username, password, rememberLogin) {
            authAPIService.login(username, password).then(function(data) {
              authService.loginConfirmed(data);
              saveCredentials(username, password, rememberLogin);
              clearFields();
            }, function(reason) {
              $scope.feedback = 'Login failed: ' + reason;
            });
          };
          $scope.register = function(username, password, group, groupPassword) {
            authAPIService.register(username, password, group._id, groupPassword).then(function() {
              $scope.username = username;
              $scope.password = password;
              $scope.setDialogMode('login');
            }, function(reason) {
              $scope.feedback = 'Registration failed: ' + reason;
            });
          };
          $scope.createGroup = function(groupName, groupPassword) {
            authAPIService.createGroup(groupName, groupPassword).then(function() {
              updateGroups().then(function() {
                $timeout(function() {
                  //The following line assumes that existingGroups is set to a promise which resolves to an array of groups
                  $scope.selectedGroup = _.find($scope.existingGroups.$$v, function(group) { return group.name == groupName; });
                });
              });
              $scope.setDialogMode('register');
            }, function(reason) {
              $scope.feedback = 'Group creation failed: ' + reason;
            });
          };
        }],
        restrict: 'C',
        template:
          "<div class='modal-dialog' data-ng-show='dialogMode'>\
            <header class='bar-title'>\
              <h1 class='title'>{{headerTitle}}</h1>\
              <a ng-click='handleHeaderClick()' class='button'>{{headerLinkText}}</a>\
            </header>\
            <div class='content content-padded' data-ng-switch='dialogMode'>\
              <form data-ng-switch-when='login' data-ng-submit='login(username,password,rememberLogin)'>\
                <input type='text' data-ng-model='username' placeholder='Username' autofocus />\
                <input type='password' data-ng-model='password' placeholder='Password' />\
                <div style='text-align:right; margin:1em;'>\
                  <label>Remember me on this device<input type='checkbox' data-ng-model='rememberLogin' /></label>\
                </div>\
                <button class='button button-block'>Log in</button>\
              </form>\
              <form data-ng-switch-when='register' data-ng-submit='register(username,password1,selectedGroup,groupPassword)'>\
                <input type='text' data-ng-model='username' placeholder='Username' autofocus />\
                <input type='password' data-ng-model='password1' placeholder='Password' />\
                <input type='password' data-ng-model='password2' placeholder='Repeat password' />\
                <label> Select your shopping group\
                  <select data-ng-options='g.name for g in existingGroups' data-ng-model='selectedGroup' ></select>\
                </label>\
                <input type='password' data-ng-model='groupPassword' placeholder='Group password' />\
                <button class='button button-block'>Create user</button>\
              </form>\
              <form data-ng-switch-when='createGroup' data-ng-submit='createGroup(groupName, groupPassword1)'>\
                <input type='text' data-ng-model='groupName' placeholder='Group name' autofocus />\
                <input type='password' data-ng-model='groupPassword1' placeholder='Password' />\
                <input type='password' data-ng-model='groupPassword2' placeholder='Repeat password' />\
                <button class='button button-block'>Create group</button>\
              </form>\
              <div class='feedback'>{{feedback}}</div>\
            </div>\
          </div>",
        link: function postLink($scope) {
          $scope.$on('event:auth-loginRequired', function() {
            $scope.setDialogMode('login');
          });

          $scope.$on('event:auth-loginConfirmed', function() {
            $scope.setDialogMode(null);
          });
        }
      }
    }]);

});



