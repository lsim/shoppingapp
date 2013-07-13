'use strict';
define(['app'], function(app) {
  app.module.directive('ngSuggest', function() {
      return {
        replace: true,
        restrict: 'E',
        transclude: true,
        template: "<div data-ng-transclude></div>",
        controller: function(suggestionService, $scope) {
          console.log('ng-suggest controller running');
          $scope.suggestions = [];
          $scope.ignoreTextChange = false;

          $scope.getSuggestions = function(term) {
            return suggestionService(term);
          };
          $scope.acceptSuggestion = function(suggestion) {
            $scope.ignoreTextChange = true;
            $scope.newItem.text = suggestion;
            setTimeout(function() { $scope.ignoreTextChange = false; }, 10);
            $scope.suggestions = [];
          };
        },
        link: function postLink(scope, elm, attrs) {
          console.log('ng-suggest postLink running');
          scope.$watch('newItem.text', function(newVal) {
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
    }).directive('ngConfirm', function($compile) {
      return {
        restrict: 'AC',
//                template: "<div id='confirm-modal' class='modal'>\
//                            <header class='bar-title'>\
//                                <h1 class='title'>{{confirmTitle}}</h1>\
//                                <a class='button no-bn' href='#confirm-modal'>No</a>\
//                            </header>\
//                            <div class='content content-padded'>\
//                                <p>{{confirmQuestion}}</p>\
//                                <a class='yes-bn button button-block' href='#confirm-modal'>Yes</a>\
//                            </div>\
//                           </div>",
        replace: false,
        scope: {
          showConfirmModal: '=ngConfirm'
        },
        controller: ['$scope', function(scope) {
          console.log('ng-confirm controller running');
          scope.deferred = null;
          scope.confirmTitle = '';
          scope.confirmQuestion = '';
          scope.showConfirmModal = function(title, question) {
            var deferred = $.Deferred();
            scope.confirmTitle = title;
            scope.confirmQuestion = question;
            scope.deferred = deferred;
            scope.setupModalDom(deferred);
            return deferred.promise();
          };
        }],
        link: function postLink(scope, elm) {
          console.log('ng-confirm postLink running');

          scope.setupModalDom = function(deferred) {
            console.log('deferred changed value: ' + deferred);
            if(!deferred) return;
            console.log('deferred changed value2');
            var node = $('body');
            var modalOverlay = $(modalOverlayMarkup);
            $compile(modalOverlay)(scope);
            node.append(modalOverlay);
            modalOverlay
              .fadeIn()
              .find('a.yes-bn')
              .one('mousedown', function() {
                deferred.resolve();
              })
              .end()
              .find('a.no-bn')
              .one('mousedown', function() {
                deferred.reject();
              });
            deferred.always(function() {
              modalOverlay.fadeOut().promise().done(function() {
                modalOverlay.remove();
                node.remove('.confirm-modal');
              });
            });
          };

          var modalOverlayMarkup = "<div class='confirm-modal' style='display:none;'>\
                                            <header class='bar-title'>\
                                                <h1 class='title'>{{confirmTitle}}</h1>\
                                                <a class='button no-bn'>No</a>\
                                            </header>\
                                            <div class='content content-padded'>\
                                                <p>{{confirmQuestion}}</p>\
                                                <a class='yes-bn button button-block'>Yes</a>\
                                            </div>\
                                           </div>";
        }
      };
    });

});



