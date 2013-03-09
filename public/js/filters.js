'use strict'

angular.module('shoppingApp.filters', []).
	filter('interpolate', ['version', function(version) {
		return function(text) {
			return String(text).replace(/\%VERSION\%/mg, version);
		};
	}]);