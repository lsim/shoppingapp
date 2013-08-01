    /**
    * Cross domain requests for Chrome.
    * XMLHttpRequest on the background page is free from CORP (Cross Origin Request Policy),
    * i.e. it can send requests to other domains.
    * A simple GET method realization is represented below
    */
     function get(url, callback) {    
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(data) {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    callback([null, data.srcElement.responseText]);
                } else {
                    callback(['Server said ' + (xhr.status || 'nothing')]);
                }
            }
        }
        // Note that any URL fetched here must be matched by a permission in
        // themanifest.json file!

        xhr.open('GET', url, true);
        xhr.send();
     }

    function post(url, bodyJson, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(data) {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    callback([null, data.srcElement.responseText]);
                } else {
                    callback(['Server said ' + (xhr.status || 'nothing')]);
                }
            }
        }
        // Note that any URL fetched here must be matched by a permission in
        // themanifest.json file!
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.send(bodyJson);
    }

    function onRequest(request, sender, callback) {
		if (request.action == 'xget') {
			get(request.url, callback);
        } else if(request.action == 'xpost') {
            post(request.url, request.bodyJson, callback);
        } else if(request.action == 'getLocalStorage') {
            var res = localStorage[request.key];
			callback([!res, res]);
        } else if(request.action == 'setLocalStorage') {
			localStorage[request.key] = request.value;
			callback([null]);
        } else if(request.action == 'getSessionStorage') {
            var res = sessionStorage[request.key];
			callback([!res, res]);
        } else if(request.action == 'setSessionStorage') {
			sessionStorage[request.key] = request.value;
			callback([null]);
		} else {
			callback([null]);
		}
     }

     // Registering the event handler.
     chrome.extension.onRequest.addListener(onRequest);
