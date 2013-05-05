'use strict';
(function() {
    angular.module('shoppingApp.directives', []).
        directive('ngSuggest', function() {
            return {
                replace: true,
                restrict: 'E',
                transclude: true,
                template: "<div data-ng-transclude></div>",
                //No new scope here as this directive extends the functionality of its context
                controller: function(suggestionService, $scope) {
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
        });
})();



