'use strict'
define ['app'], (app) ->
  idCounter = 0
  ListItem = (item, isNew) ->
    @.isNew = isNew
    @.isDeleted = false
    @.text = item.text
    @._id = if !isNew then item._id else 'tmpId' + idCounter++

  ShoppingListCtrl = ($scope, listAPIService, confirmService) ->

    $scope.newItem =
      text: ''

    $scope.addItem = () ->
      if not $scope.newItem.text
        return
      $scope.list.items.push(new ListItem({ text: $scope.newItem.text }, true))
      $scope.newItem.text = ''
      $scope.postChanges()#Trigger asynchronous synchronization of the list with the server

    $scope.deleteItem = (() ->
      doDelete = (itemId) ->
        deletee = _.find($scope.list.items, (item) -> item._id == itemId)
        if deletee and deletee.isNew
          $scope.list.items = _.filter $scope.list.items, (item) -> item._id != itemId
        else
          deletee and deletee.isDeleted = true
          $scope.postChanges()
      # return
      (item) ->
        confirmService.yesNoConfirm('Delete item?', 'Are you sure you want to delete item "' + item.text + '"?')
        .then () -> doDelete(item._id)
    )()

    $scope.postChanges = (retries) ->
      retries = if typeof retries is "number" then retries else 3
      changedItems = $scope.list.items.filter (item) -> item.isNew or item.isDeleted
      changedItems.forEach (item) -> if item.isNew then delete item._id
      listAPIService.postChanges(changedItems, $scope.list._id, $scope.list.status, $scope.list.version)
      .then (data) ->
        console.log('postChanges success', data)
        if data.status == 'conflict'
          console.log('Concurrency conflict detected', data)
          if retries is 0
            window.location.reload(true)
          else
            $scope.getLatest().then () ->
              $scope.postChanges(retries - 1)
        #TODO: handle general failure

    mergeChanges = (localList, serverList) ->
      # Ensure that new local items remain (which don't have a namesake in the server items)
      newLocalItems = _.filter localList, (localItem) ->
        localItem.isNew and !_.some serverList, (serverItem) ->
          serverItem.text == localItem.text
      # Ensure that locally deleted items received from the server get marked as deleted
      deletedLocalItems = _.filter localList, (localItem) ->
        localItem.isDeleted

      serverList.filter((item) ->
        _.some deletedLocalItems, (deletedItem) ->
          item._id == deletedItem._id
      ).forEach (item) -> item.isDeleted = true

      serverList.concat(newLocalItems)

    $scope.getLatest = () ->
      listAPIService.getLatest().then (data) ->
        if data
          serverList = data
          serverList.items = serverList.items.map (item) -> new ListItem(item, false)
          if $scope.list and $scope.list.items
            serverList.items = mergeChanges $scope.list.items, serverList.items
          $scope.list = serverList
          registerForSse($scope.list._id)

    handleSse = (msg) ->
      console.log('Received sse: ', msg)
      $scope.$apply(() -> $scope.getLatest())

    sseSource = null
    listenerListId = null
    registerForSse = (listId) ->
      if listId == listenerListId
        return
      if sseSource
        console.log('Unregistering old listener')
        sseSource.removeEventListener('message', handleSse)
      console.log('Registering new listener')
      sseSource = new EventSource('/update-stream/' + listId)
      listenerListId = listId
      sseSource.addEventListener('message', handleSse, false)

    #Initialize with data from the server
    $scope.getLatest()

  ShoppingListCtrl.$inject = ['$scope', 'listAPIService', 'confirmService']
  app.module.controller('ShoppingListCtrl', ShoppingListCtrl)
