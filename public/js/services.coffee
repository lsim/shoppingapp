'use strict'
define ['app'], (app) ->
  app.module.factory('suggestionService', ['$http', ($http) ->
    (term) ->
      $http.get('/suggest?term=' + encodeURIComponent(term))
  ])
  .factory('authAPIService', ['$http', '$q', ($http, $q) ->
    getData = (response) -> response.data
    getError = (response) -> $q.reject(response.data)
    #return/export:
    login: (username, password) ->
      $http.post('login', {username, password}).then getData, getError
    getGroups: () ->
      $http.get('groups').then getData, getError
    register: (username, password, groupId, groupPassword) ->
      $http.post('register', {username, password, groupId, groupPassword}).then getData, getError
    createGroup: (groupName, groupPassword) ->
      $http.post('groups', {groupName, groupPassword}).then getData, getError
  ])
  .factory('listAPIService', ['$http', '$q', ($http, $q) ->
    getData = (response) -> response.data
    getError = (response) -> $q.reject(response.data)
    #return/export
    getLatest: () -> $http.get('list').then getData, getError
    postChanges: (listChanges, listId, listStatus, listVersion) ->
      $http.post('list',
        items: listChanges,
        _id: listId,
        status: listStatus,
        version: listVersion
      ).then getData, getError
  ])
  .factory('confirmService', ['$rootScope', '$q', ($rootScope, $q) ->
    deferred = null
    #return/export:
    yesNoConfirm: (headline, yesNoQuestion) ->
      deferred = $q.defer()
      $rootScope.$broadcast('event:confirmationRequired', {headline, yesNoQuestion})
      deferred.promise

    # Confirmation providers call this when the user has chosen
    confirmationHandled: (userSaidYes) ->
      if !deferred then return
      if userSaidYes
        deferred.resolve()
      else
        deferred.reject()
  ])

  angular.module('http-auth-interceptor', ['http-auth-interceptor-buffer'])
  .factory('authService', ['$rootScope','httpBuffer', ($rootScope, httpBuffer) ->
    # call this function to indicate that authentication was successfull and trigger a
    # retry of all deferred requests.
    # @param data an optional argument to pass on to $broadcast which may be useful for
    # example if you need to pass through details of the user that was logged in
    loginConfirmed: (data) ->
      $rootScope.$broadcast('event:auth-loginConfirmed', data)
      httpBuffer.retryAll()
  ])

  # $http interceptor.
  # On 401 response (without 'ignoreAuthModule' option) stores the request
  # and broadcasts 'event:angular-auth-loginRequired'.
  .config(['$httpProvider', ($httpProvider) ->
    interceptor = ['$rootScope', '$q', 'httpBuffer', ($rootScope, $q, httpBuffer) ->
      success = (response) -> response

      error = (response) ->
        if response.status == 401 and !response.config.ignoreAuthModule
          deferred = $q.defer()
          httpBuffer.append(response.config, deferred)
          $rootScope.$broadcast('event:auth-loginRequired')
          return deferred.promise

        # otherwise, default behaviour
        $q.reject(response)

      return (promise) -> promise.then(success, error)
    ]
    $httpProvider.responseInterceptors.push(interceptor)
  ])

  #Private module, a utility, required internally by 'http-auth-interceptor'.

  angular.module('http-auth-interceptor-buffer', [])
  .factory('httpBuffer', ['$injector', ($injector) ->
    # Holds all the requests, so they can be re-requested in future.
    buffer = []

    # Service initialized later because of circular dependency problem.
    $http = null

    retryHttpRequest = (config, deferred) ->
      successCallback = (response) -> deferred.resolve(response)
      errorCallback = (response) -> deferred.reject(response)

      $http = $http or $injector.get('$http')
      $http(config).then(successCallback, errorCallback)

    # return
    # Appends HTTP request configuration object with deferred response attached to buffer.
    append: (config, deferred) ->
      buffer.push
        config: config,
        deferred: deferred
    # Retries all the buffered requests clears the buffer.
    retryAll: () ->
      buffer.forEach (bufferItem) ->
        retryHttpRequest(bufferItem.config, bufferItem.deferred)
      buffer = []
  ])
