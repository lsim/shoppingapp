'use strict'
define ['app'], (app) ->
  idCounter = 0
  ListItem = (item, isNew) ->
    @.isNew = isNew
    @.text = item.text
    @._id = if !isNew then item._id else 'tmpId' + idCounter++

  ShoppingListCtrl = ($scope, listAPIService, confirmService, $timeout) ->

    $scope.newItem =
      text: ''
    $scope.list =
      items: []

    $scope.deletionFilter = (item) -> !item.isDeleted

    $scope.addItem = () ->
      if not $scope.newItem.text
        return
      $scope.list.items.push(new ListItem({ text: $scope.newItem.text.trim() }, true))
      $scope.newItem.text = ''
      sendNewItems()

    sendPendingDeletions = () ->
      if !$scope.list._id then return
      deletees = _.filter($scope.list.items, (item) -> item.isDeleted)
      deletees.length and listAPIService.deleteItems(deletees.map((item) -> item._id), $scope.list._id, $scope.list.version)

    sendNewItems = () ->
      if !$scope.list._id then return
      newItems = _.filter($scope.list.items, (item) -> item.isNew).map (item) -> text: item.text
      newItems.length and listAPIService.addItems newItems, $scope.list._id, $scope.list.version

    $scope.deleteItem = (() ->
      doDelete = (deletee) ->
        if deletee.isNew
          $scope.list.items = _.filter $scope.list.items, (item) -> item._id != deletee._id
        else
          deletee.isDeleted = true
          sendPendingDeletions()
      # return
      (item) ->
        confirmService.yesNoConfirm('Delete item?', 'Are you sure you want to delete item "' + item.text + '"?')
        .then () -> doDelete(item)
    )()

    mergeChanges = (localList, serverList) ->
      # Ensure that new local items remain (which don't have a namesake in the server items)
      # Ensure that locally deleted items received from the server get marked as deleted

      # Identify added items that are not in the data received from the server
      newLocalItems = _.filter localList, (localItem) ->
        localItem.isNew and !_.some serverList, (serverItem) ->
          serverItem.text == localItem.text
      # Identify deleted items
      deletedLocalItems = _.filter localList, (localItem) ->
        localItem.isDeleted

      # Find items in the server list that are marked as deleted locally and mark them
      serverList.filter((item) ->
        _.some deletedLocalItems, (deletedItem) ->
          item._id == deletedItem._id
      ).forEach (item) ->
        item.isDeleted = true
      # Add new local items to the server list
      serverList.concat(newLocalItems)

    $scope.getLatest = (() ->
      getLatestPending = false
      #return
      () ->
        if getLatestPending then return
        getLatestPending = true
        listAPIService.getLatest().then (data) ->
          if data
            console.debug('Received fresh list ', data)
            serverList = data
            serverList.items = serverList.items.map (item) -> new ListItem(item, false)
            if $scope.list and $scope.list.items
              serverList.items = mergeChanges $scope.list.items, serverList.items
            $scope.list = serverList
            listAPIService.registerForSse($scope.list._id)
            # Trigger synch of pending changes (if there are any)
            sendNewItems() or sendPendingDeletions()
        .then (() -> getLatestPending = false), (() -> getLatestPending = false)
    )()

    $scope.$on 'event:listChange', (event, data) ->
      if $scope.list?._id != data.listId then return
      $scope.getLatest()

    $scope.$on 'event:auth-loggedOut', () ->
      $scope.list = null
      $scope.getLatest() # Will cause the login screen to appear

    $scope.$watch 'isOnline', (newValue) ->
      if typeof newValue is not "boolean" then return
      showFeedback 'Now ' + (if newValue then 'online' else 'offline')
      console.debug('Responding to new isOnline value: ', newValue)
      if newValue
        $scope.getLatest()# when response is processed, sse listener will be registered
      else
        listAPIService.unregisterForSse($scope.list._id)

    showFeedback = (() ->
      lastPromise = null
      #return
      (feedback) ->
        if lastPromise then $timeout.cancel(lastPromise)
        $scope.feedback = feedback
        lastPromise = $timeout (() ->
          $scope.feedback = ''
          lastPromise = null
        ), 5000
    )()
    $scope.$watch 'isVisible', (newValue) ->
      if newValue
        $scope.getLatest()
        showFeedback 'visibility reported'
      else if $scope.list
        listAPIService.unregisterForSse($scope.list._id)

    $scope.flushAppCache = () ->
      listAPIService.flushCache()

  ShoppingListCtrl.$inject = ['$scope', 'listAPIService', 'confirmService', '$timeout']
  app.module.controller('ShoppingListCtrl', ShoppingListCtrl)

  AppCtrl = ($scope, authAPIService) ->
    $scope.isLoggedIn = false;
    $scope.logout = () ->
      authAPIService.logout().then () ->
        $scope.isLoggedIn = false;

    $scope.$on 'event:auth-loginConfirmed', () ->
      $scope.isLoggedIn = true;

  AppCtrl.$inject = ['$scope', 'authAPIService', 'visibilityService']
  app.module.controller('AppCtrl', AppCtrl)
