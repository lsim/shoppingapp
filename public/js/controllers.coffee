'use strict'
define ['app'], (app) ->
  idCounter = 0
  ListItem = (item, isNew) ->
    @.isNew = isNew
    @.isDeleted = false
    @.text = item.text
    @._id = if !isNew then item._id else 'tmpId' + idCounter++

  ShoppingListCtrl = ($scope, $http) ->
    console.log('ShoppingListCtrl loading')

    $scope.newItem =
      text: ''
    #confirm will hold a function when the ng-confirm directive has run
    $scope.confirm = null

    $scope.addItem = () ->
      if not $scope.newItem.text
        return
      $scope.list.items.push(new ListItem({ text: $scope.newItem.text }, true))
      $scope.newItem.text = ''
      console.log('posting from add')
      $scope.postChanges()#Trigger asynchronous synchronization of the list with the server

    $scope.deleteItem = (() ->
      doDelete = (itemId) ->
        deletee = _.find($scope.list.items, (item) -> item._id == itemId)
        if deletee and deletee.isNew
          $scope.list.items = _.filter $scope.list.items, (item) -> item._id != itemId
        else
          deletee and deletee.isDeleted = true
          console.log('posting from delete')
          $scope.postChanges()
      # return
      (item) ->
        if $scope.confirm
          $scope.confirm('Delete item?', 'Are you sure you want to delete item "' + item.text + '"?').then () -> doDelete(item._id)
        else
          doDelete(item._id)
    )()

    #TODO: factor $http stuff into service where it belongs
    $scope.postChanges = () ->
      changedItems = $scope.list.items.filter (item) -> item.isNew or item.isDeleted
      changedItems.forEach (item) -> if item.isNew then delete item._id
      $http.post('list',
        items: changedItems,
        _id: $scope.list._id,
        status: $scope.list.status,
        version: $scope.list.version
      ).success (data) ->
        console.log('postChanges success', data)
        if data.status == 'conflict'
          console.log('Concurrency conflict detected', data)
        #TODO: handle failure - concurrency and otherwise

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
      $http.get('list').success (response) ->
        console.log('list fetched successfully', response)
        if response.data
          serverList = response.data
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

  ShoppingListCtrl.$inject = ['$scope', '$http']
  app.module.controller('ShoppingListCtrl', ShoppingListCtrl)
