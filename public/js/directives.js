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

          var modalOverlayMarkup = "<div class='confirm-modal' >\
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
    }]).directive('loginForm', [function() {
      return {
        restrict: 'C',
        template:
          "<form>" +
            "<input type='text' data-ng-model='userName' placeholder='Username' />" +
            "<input type='password' data-ng-model='password' placeholder='Password' />" +
            "<button type='button' ng-click='' class='button button-block'>Log in</button>" +
          "</form>",
        link: function($scope, element, attrs) {
          element.hide();
          $scope.$on('event:auth-loginRequired', function() {
            //TODO: show login
          });

          $scope.$on('event:auth-loginConfirmed', function() {
            //TODO: return to requested
          });
        }
      }
    }]).directive('waitingForAngular', function() {//This one serves to remove the angular FOUC
      return {
        restrict: 'C',
        link: function($scope, element) {
          element.removeClass('waiting-for-angular');
        }
      }
    });

});



