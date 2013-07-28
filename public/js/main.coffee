'use strict'
require.config
  baseUrl: 'js'
  paths:
    underscore: 'lib/underscore/underscore-min'
    angular: 'lib/angular-unstable/angular.min'
  shim: {}

console.debug('requiring core libraries')
define ['angular', 'underscore'], () ->
  console.debug('libraries loaded. Loading app..')

  require ['controllers', 'directives', 'filters', 'services'], () ->
    console.debug('angular elements loaded. Bootstrapping angular..')
    angular.bootstrap(document, ['shoppingApp'])
