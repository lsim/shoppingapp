
cachedFiles = [
  'css/ratchet.css',
  'css/style.css',
  'js/app.js',
  'js/main.js',
  'js/controllers.js',
  'js/directives.js',
  'js/filters.js',
  'js/services.js',
  'js/lib/requirejs/require.min.js',
  'js/lib/angular-unstable/angular.min.js',
  'js/lib/underscore/underscore-min.js'
]

timestamp = null

(updateOfflineCache = () ->
  timestamp = new Date().toISOString())()

module.exports =
  registerEndpoints: (app) ->
    # Register endpoint for dynamic app.cache
    app.get '/app.cache', (req, res) ->
      console.log('app.cache with timestamp ', timestamp)
      res.send('CACHE MANIFEST\n#' + timestamp +
      '\nCACHE:\n' +
      cachedFiles.join('\n') +
      '\nNETWORK:\n*')

    # An endpoint mainly for debugging - not the least bit RESTful :)
    app.get '/flush', (req, res) ->
      updateOfflineCache()
      res.send('app.cache updated with timestamp ' + timestamp)

  updateOfflineCache: updateOfflineCache

