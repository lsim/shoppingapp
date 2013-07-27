'use strict'
define ['app'], (app) ->
  idCounter = 0
  ListItem = (item, isNew) ->
    @.isNew = isNew
    @.text = item.text
    @._id = if !isNew then item._id else 'tmpId' + idCounter++

  ShoppingListCtrl = ($scope, listAPIService, confirmService) ->

    $scope.newItem =
      text: ''

    $scope.deletionFilter = (item) -> !item.isDeleted

    $scope.addItem = () ->
      if not $scope.newItem.text
        return
      $scope.list.items.push(new ListItem({ text: $scope.newItem.text }, true))
      $scope.newItem.text = ''
      sendNewItems()

    sendPendingDeletions = () ->
      deletees = _.filter($scope.list.items, (item) -> item.isDeleted)
      deletees.length and listAPIService.deleteItems(deletees.map((item) -> item._id), $scope.list._id, $scope.list.version)

    sendNewItems = () ->
      newItems = _.filter($scope.list.items, (item) -> item.isNew).map (item) -> text: item.text
      newItems.length and listAPIService.addItems newItems, $scope.list._id, $scope.list.version

    $scope.deleteItem = (() ->
      doDelete = (deletee) ->
        if deletee.isNew
          $scope.list.items = _.filter $scope.list.items, (item) -> item._id != itemId
        else
          deletee.isDeleted = true
          console.debug('isDeleted set to true on item,items,phase ', deletee, $scope.list.items, $scope.$$phase)
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

    $scope.getLatest = () ->
      #TODO: ignore calls to this function that come in while a request is still pending
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

    $scope.$on 'event:listChange', (event, data) ->
      if $scope.list?._id != data.listId then return
      $scope.getLatest()

    $scope.$watch 'isOnline', (newValue) ->
      if typeof newValue is not "boolean" then return
      console.debug('Responsing to new isOnline value: ', newValue)
      if newValue
        $scope.getLatest()
      else
        listAPIService.unregisterForSse($scope.list._id)

    $scope.$watch 'isVisible', (newValue) ->
      if newValue
        $scope.getLatest()

  ShoppingListCtrl.$inject = ['$scope', 'listAPIService', 'confirmService', '$timeout', 'visibilityService']
  app.module.controller('ShoppingListCtrl', ShoppingListCtrl)
