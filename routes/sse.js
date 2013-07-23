var auth = require('./auth');
var EventEmitter = require('events').EventEmitter;

var listUpdater = new EventEmitter();

//This is inspired by http://tomkersten.com/articles/server-sent-events-with-node/

module.exports = {
    registerEndpoints: function(app) {
        app.get('/update-stream/:listId', auth.checkAuth(true), function(req, res) {
            //Keep a counter, so we have an id to put on each sse
            var eventCount = 0;

            //let request last as long as necessary
            req.socket.setTimeout(Infinity);

            var listId = req.params.listId;
            console.log('sse client requested event stream for list: ' + listId);

            var updateHandler = function(newVersion) {
                eventCount++;

                res.write('id: ' + eventCount + '\n');
                res.write('data: { "id":"'+ listId + '", "version": "' + newVersion + '"}\n\n');
            };

            //Create a pub/sub listener for the specific list id the client is interested in
            listUpdater.on(listId, updateHandler);

            //Send headers for event-stream connection
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            res.write('\n');

            req.on('close', function() {
                console.log('Client closed event stream');
                listUpdater.removeListener(listId, updateHandler);
            });

        });
    },
    /*Call this when a list is updated*/
    onListUpdate: function(listId, newVersion) {
        console.log('onListUpdate', listId, newVersion);
        listUpdater.emit(listId, newVersion);
    }
};
