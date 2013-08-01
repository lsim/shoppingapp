/**
 * Created with JetBrains WebStorm.
 * User: los
 * Date: 27-04-13
 * Time: 10:06
 * To change this template use File | Settings | File Templates.
 */
//extension utility functions:
var lsiexports = lsiexports || {};
(function() {

    function get(url) {
        var getting = lsiexports.Deferred();
        chrome.extension.sendRequest({'action' : 'xget', 'url':url}, buildPromiseCallbackGet(getting));
        return getting.promise();
    }

    function post(url, bodyJson) {
        var posting = lsiexports.Deferred();
        chrome.extension.sendRequest({'action': 'xpost', 'url':url, 'bodyJson': bodyJson}, buildPromiseCallbackGet(posting));
        return posting.promise();
    }

    function buildPromiseCallbackGet(deferred) {
        return function(errVal) {
            if(errVal[0])
                deferred.reject(errVal[0]);
            else
                deferred.resolve(errVal[1]);
        }
    }

    function getLocalStorage(key) {
        var getting = lsiexports.Deferred();
        chrome.extension.sendRequest({action: "getLocalStorage", key: key}, buildPromiseCallbackGet(getting));
        return getting.promise();
    }
    function setLocalStorage(key, value) {
        var setting = lsiexports.Deferred();
        chrome.extension.sendRequest({action: "setLocalStorage", key: key, value: value }, setting.resolve);
        return setting.promise();
    }

    function getSessionStorage(key) {
        var getting = lsiexports.Deferred();
        chrome.extension.sendRequest({action: "getSessionStorage", key: key}, buildPromiseCallbackGet(getting));
        return getting.promise();
    }
    function setSessionStorage(key, value) {
        var setting = lsiexports.Deferred();
        chrome.extension.sendRequest({action: "setSessionStorage", key: key, value: value }, setting.resolve);
        return setting.promise();
    }

//    function getQueryString() {
//        var result = {}, queryString = location.search.substring(1),
//            re = /([^&=]+)=([^&]*)/g, m;
//
//        while (m = re.exec(queryString)) {
//            result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
//        }
//
//        return result;
//    }

    lsiexports.get = get;
    lsiexports.post = post;
    lsiexports.getLocalStorage = getLocalStorage;
    lsiexports.setLocalStorage = setLocalStorage;
    lsiexports.getSessionStorage = getSessionStorage;
    lsiexports.setSessionStorage = setSessionStorage;
//    lsiexports.getQueryString = getQueryString;
})();