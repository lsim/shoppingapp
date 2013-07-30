// Generated by CoffeeScript 1.6.3
(function() {
  var cachedFiles, timestamp, updateOfflineCache;

  cachedFiles = ['css/ratchet.css', 'css/style.css', 'js/app.js', 'js/main.js', 'js/controllers.js', 'js/directives.js', 'js/filters.js', 'js/services.js', 'js/lib/requirejs/require.min.js', 'js/lib/angular-unstable/angular.min.js', 'js/lib/underscore/underscore-min.js'];

  timestamp = null;

  (updateOfflineCache = function() {
    return timestamp = new Date().toISOString();
  })();

  module.exports = {
    registerEndpoints: function(app) {
      app.get('/app.cache', function(req, res) {
        console.log('app.cache with timestamp ', timestamp);
        return res.send('CACHE MANIFEST\n#' + timestamp + '\nCACHE:\n' + cachedFiles.join('\n') + '\nNETWORK:\n*');
      });
      return app.get('/flush', function(req, res) {
        updateOfflineCache();
        return res.send('app.cache updated with timestamp ' + timestamp);
      });
    },
    updateOfflineCache: updateOfflineCache
  };

}).call(this);