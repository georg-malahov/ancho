(function() {

  var Cc = Components.classes;
  var Ci = Components.interfaces;
  var Cu = Components.utils;

  Cu.import('resource://gre/modules/Services.jsm');

  var Event = require('./event');
  var Utils = require('./utils');
  var chrome;

  function TabsAPI(state, window, api) {
    chrome = api;
    this._window = window;
    this._state = state;
    this._tab = Utils.getWindowId(window);

    // Event handlers
    this.onCreated = new Event(window, this._tab, this._state, 'tab.created');
    this.onActivated = new Event(window, this._tab, this._state, 'tab.activated');
    this.onRemoved = new Event(window, this._tab, this._state, 'tab.removed');
    this.onUpdated = new Event(window, this._tab, this._state, 'tab.updated');
  }

  TabsAPI.prototype = {
    getCurrent: function(callback) {
      // TODO: Check whether we are really a tab
      callback({ id: this._tab});
    },

    sendRequest: function(tabId, request, callback) {
      var sender = Utils.getSender(this._state['id'], this._tab);
      this._state.eventDispatcher.notifyListeners('extension.request', tabId,
        [ request, sender, callback ]);
    },

    sendMessage: function(tabId, request, callback) {
      var sender = Utils.getSender(this._state['id'], this._tab);
      this._state.eventDispatcher.notifyListeners('extension.message', tabId,
        [ request, sender, callback ]);
    },

    query: function(queryInfo, callback) {
      let windows = [];
      let result = [];
      if (queryInfo.currentWindow ||
        (queryInfo.windowId && queryInfo.windowId === chrome.windows.WINDOW_ID_CURRENT)) {
        // Just the current window.
        let chromeWindow = Utils.getChromeWindow(this._window);
        let windowType = chromeWindow.document.documentElement.getAttribute("windowtype");
        if ('ancho-hidden' === windowType) {
          // We're in the background window, so use the most recent browser window.
          chromeWindow = Services.wm.getMostRecentWindow('navigator:browser');
          windows.push(chromeWindow);
        }
        else {
          windows.push(chromeWindow);
        }
      }
      else {
        var browserWindows = Services.wm.getEnumerator('navigator:browser');
        while (browserWindows.hasMoreElements()) {
          windows.push(browserWindows.getNext());
        }
      }

      function createTabFromBrowser(browser) {
        return {
          id: Utils.getWindowId(browser.contentWindow),
          url: browser.contentDocument.location.href
        }
      }

      for (let i=0; i<windows.length; i++) {
        let win = windows[i];
        let tabbrowser = win.document.getElementById('content');
        if (queryInfo.active) {
          result.push(createTabFromBrowser(tabbrowser.selectedBrowser));
        }
        else {
          for (let j=0; j<tabbrowser.browsers.length; j++) {
            result.push(createTabFromBrowser(tabbrowser.browsers[j]));
          }
        }
      }

      callback(result);
    },

    create: function(createProperties, callback) {
      if (!('active' in createProperties)) {
        createProperties.active = true;
      }
      var tabbrowser = this._getBrowserForWindowId(createProperties.windowId);
      var tab = tabbrowser.addTab(createProperties.url || 'about:blank');
      if (createProperties.active) {
        tabbrowser.selectedTab = tab;
      }
      if (callback) {
        callback({ id: Utils.getWindowId(tab.contentWindow) });
      }
    },

    update: function(tabId, updateProperties, callback) {
      if (typeof(tabId) != 'number') {
        // No tabId specified, shift the arguments
        callback = updateProperties;
        updateProperties = tabId;
        tabId = null;
      }
      var tabbrowser = this._getBrowserForWindowId(null);
      var browser = this._getBrowserForTabId(tabbrowser, tabId);

      var self = this;
      this._waitForDocShell(browser, 5, 200, function() {
        // TODO: before changing the URI, we shall unload the window
        // and make sure it is initialized again when the DOM is ready
        browser.loadURI(updateProperties.url);
        if (updateProperties.active) {
          tabbrowser.selectedBrowser = browser;
        }
        if (callback) {
          callback({ id: tabId ? tabId : Utils.getWindowId(browser.contentWindow) });
        }
      });
    },

    executeScript: function(tabId, executeScriptProperties, callback) {
      var tabbrowser = this._getBrowserForWindowId(null);
      var browser = this._getBrowserForTabId(tabbrowser, tabId);
      var doc = browser.contentDocument;
      if (doc && doc.body) {
        var scriptElement = doc.createElement('script');
        scriptElement.setAttribute('type', 'text/javascript');
        var tt = doc.createTextNode(executeScriptProperties.code);
        scriptElement.appendChild(tt);
        doc.body.appendChild(scriptElement);
      }
      if (callback) {
        callback();
      }
    },

    _waitForDocShell: function(object, pollTime, maxAttempts, callback) {
      var self = this;
      var timer = null;
      var iteration = 0;

      function _nextTick() {
        if (object.docShell) {
          self._window.clearInterval(timer);
          callback();
          return;
        }
        if (++iteration === maxAttempts) {
          self._window.clearInterval(timer);
        }
      };

      timer = self._window.setInterval(_nextTick, pollTime);
      _nextTick();
    },

    _getBrowserForTabId: function(tabbrowser, tabId) {
      if (!tabId) {
        return tabbrowser.selectedBrowser;
      }
      for (var i=0; i<tabbrowser.browsers.length; i++) {
        var browser = tabbrowser.browsers[i];
        if (Utils.getWindowId(browser.contentWindow) == tabId) {
          return tabbrowser.getBrowserAtIndex(i);
        }
      }
      return null;
    },

    _getBrowserForWindowId: function(windowId) {
      var browserWindow;
      if (!windowId) {
        browserWindow = Services.wm.getMostRecentWindow('navigator:browser');
      }
      else {
        var browserWindows = Services.wm.getEnumerator('navigator:browser');

        while (browserWindows.hasMoreElements()) {
          browserWindow = browserWindows.getNext();
          if (Utils.getWindowId(browserWindow) === windowId) {
            break;
          }
        }
      }
      return browserWindow.document.getElementById('content');
    }
  };

  module.exports = TabsAPI;

}).call(this);
