(function() {

/*
   Client portion of WebRequest API that provides access to events and methods.
   The actual implementation runs in the background window of the extension and
   fires the events. For the implementation, please see webRequestSingleton.js.
*/


  var Cc = Components.classes;
  var Ci = Components.interfaces;
  var Cu = Components.utils;

  Cu.import('resource://gre/modules/Services.jsm');

  var Event = require('./event');
  var Utils = require('./utils');

  // Special event that knows about web request filters.
  function WebRequestEvent(window, tabId, state, type) {
    var proxies = [];

    // Proxy that checks the filter before triggering the real listener.
    function ListenerProxy(listener, filter) {
      this.listener = listener;

      var urls = [];
      for (let i=0; i<filter.urls.length; i++) {
        urls.push(Utils.matchPatternToRegexp(filter.urls[i]));
      }

      function checkFilter(details, callback) {
        if (urls.length > 0) {
          let matched = false;
          for (let i=0; i<urls.length; i++) {
            if (details.url.match(urls[i])) {
              matched = true;
              break;
            }
          }
          if (!matched) {
            return;
          }
        }
        if (filter.types) {
          if (filter.types.indexOf(details.type) == -1) {
            return;
          }
        }
        if (filter.tabId) {
          if (filter.tabId != details.tabId) {
            return;
          }
        }
        // TODO: Implement filter.windowId
        callback();
      }

      this.sink = function(details, callback) {
        checkFilter(details, function() {
          this.listener.call(this, details, callback);
        });
      }
    }

    Event.call(this, window, tabId, state, type);

    var superAddListener = this.addListener;
    this.addListener = function(listener, filter) {
      var proxy = new ListenerProxy(listener, filter);
      superAddListener.call(this, proxy.sink);
      proxies.push(proxy);
    };

    var superRemoveListener = this.removeListener;
    this.removeListener = function(listener) {
      for (let i=0; i<proxies.length; i++) {
        if (proxies[i].listener === listener) {
          superRemoveListener(proxies[i].listener)
          proxies.splice(i, 1);
        }
      }
    }
  }

  var WebRequestAPI = function(state, window) {
    this._state = state;
    this._tab = Utils.getWindowId(window);

    this.onCompleted = new WebRequestEvent(window, this._tab, this._state, 'webRequest.completed');
    this.onHeadersReceived = new WebRequestEvent(window, this._tab, this._state, 'webRequest.headersReceived');
    this.onBeforeRedirect = new WebRequestEvent(window, this._tab, this._state, 'webRequest.beforeRedirect');
    this.onAuthRequired = new WebRequestEvent(window, this._tab, this._state, 'webRequest.authRequired');
    this.onBeforeSendHeaders = new WebRequestEvent(window, this._tab, this._state, 'webRequest.beforeSendHeaders');
    this.onErrorOccurred = new WebRequestEvent(window, this._tab, this._state, 'webRequest.errorOccurred');
    this.onResponseStarted = new WebRequestEvent(window, this._tab, this._state, 'webRequest.responseStarted');
    this.onSendHeaders = new WebRequestEvent(window, this._tab, this._state, 'webRequest.sendHeaders');
    this.onBeforeRequest = new WebRequestEvent(window, this._tab, this._state, 'webRequest.beforeRequest');
  };

  WebRequestAPI.prototype.handlerBehaviorChanged = function(callback) {
    // noop
    if (callback) {
      callback();
    }
  };

  module.exports = WebRequestAPI;

}).call(this);
