/**
 * Created with JetBrains WebStorm.
 * User: los
 * Date: 26-04-13
 * Time: 13:34
 * To change this template use File | Settings | File Templates.
 */

var tabModule = angular.module('slidingTab', []);

tabModule.directive('slidingTab', function factory() {
    var expandedAnimTarget = null,
        collapsedAnimTarget = null;
    return {
        controller: function slidingTabCtrl($scope) {
            $scope.side || ($scope.side = 'right');
            $scope.tabExpanded = false;
            $scope.expand = function expand() {
                if($scope.tabExpanded) return;
                $scope.$apply(function() { $scope.tabExpanded = true;});
            };
            $scope.collapse = function collapse() {
                if(!$scope.tabExpanded) return;
                $scope.$apply(function() { $scope.tabExpanded = false;});
            };
            $scope.toggleExpanded = function toggleExpanded() {
                $scope.$apply(function() { $scope.tabExpanded = !$scope.tabExpanded; });
            };
            $scope.setSide = function setSide(side) {
                if(side === 'left') {
                    expandedAnimTarget = { left: 0 };
                    collapsedAnimTarget = { left: -250 };
                } else {
                    expandedAnimTarget = { right: 0 };
                    collapsedAnimTarget = { right: -250 };
                }
            };
        },
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: {
            tabHeader: '@',
            side: '@',
            tabExpanded: '='
        },
        template: "<div class='sliding-tab' data-ng-transclude ><div class='sliding-tabheader' >{{tabHeader}}</div></div>",
        link: function postLink(scope, iElement) {
            scope.$watch('tabExpanded', function(newVal) {
                iElement.stop().animate(newVal ? expandedAnimTarget : collapsedAnimTarget);
            });
            scope.$watch('side', function(newSide) {
                scope.setSide(newSide);
                var otherSide = newSide === 'left' ? 'right' : 'left';
                iElement.stop().hide()
                    .addClass('tab-' + newSide)
                    .removeClass('tab-' + otherSide)
                    .css(otherSide, '')
                    .css(collapsedAnimTarget).show();
            });

            iElement.find('.sliding-tabheader').on('click', function() {
                scope.toggleExpanded();
            });
        }
    };
});