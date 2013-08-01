

module.exports =
  registerEndpoints: (app) ->

    # Serve out the chrome extension that provides
    app.get '/extension.crx', (req, res) ->
      #res.header 'Content-Type', 'application/x-chrome-extension'
      res.header('Content-Type', 'application/do-not-install')# Stop chrome from attempting to install the extension directly (chrome won't allow this)
      res.sendfile 'IrmaTorvetExtension.crx', (err) ->
        if err then console.log('Failed serving the extension: ' + err)
