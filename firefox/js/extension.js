(function() {

  var Cc = Components.classes;
  var Ci = Components.interfaces;
  var Cu = Components.utils;

  Cu.import('resource://gre/modules/Services.jsm');
  Cu.import("resource://gre/modules/NetUtil.jsm");

  var Utils = require('./utils');
  var Event = require('./event');
  var Config = require('./config');

  function sendHelper(self, tabId, request, callback, event) {
    // tabId is optional
    if ('number' !== typeof(tabId)) {
      callback = request;
      request = tabId;
      tabId = null;
    }
    callback = callback || function() {};

    var sender = Utils.getSender(self._state['id'], self._tab);
    event.fire([ request, sender, callback ], tabId);
  }

  function ExtensionAPI(state, window) {
    this._state = state;
    this._tab = Utils.getWindowId(window);
    // Event handlers
    this.onRequest = new Event(window, this._tab, this._state, 'extension.request');
    this.onMessage = new Event(window, this._tab, this._state, 'extension.message');
  }

  ExtensionAPI.prototype = {

    sendRequest: function(tabId, request, callback) {
      sendHelper(this, tabId, request, callback, this.onRequest);
    },

    sendMessage: function(tabId, request, callback) {
      sendHelper(this, tabId, request, callback, this.onMessage);
    },

    getURL: function(path) {
      var baseURI = NetUtil.newURI('chrome-extension://ancho/', null, null);
      var URI = NetUtil.newURI(path, null, baseURI);
      return URI.spec;
    }
  };

  module.exports = ExtensionAPI;

}).call(this);
