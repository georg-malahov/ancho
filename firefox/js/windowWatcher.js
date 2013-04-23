(function() {

  var Cu = Components.utils;
  Cu.import('resource://gre/modules/Services.jsm');

  const BROWSER_WINDOW_TYPE = 'navigator:browser';

  function _isBrowserWindow(browserWindow) {
    return BROWSER_WINDOW_TYPE === browserWindow.document.documentElement.getAttribute('windowtype');
  }

  var WindowWatcherImpl = function() {
    this.registry = [];
  };

  WindowWatcherImpl.prototype.getContext = function(entry, win, remove) {
    for (var i=0; i<entry.contexts.length; i++) {
      if (win === entry.contexts[i].window) {
        var context = entry.contexts[i].context;
        if (remove) {
          entry.contexts.splice(i, 1);
        }
        return context;
      }
    }

    // This entry doesn't have a context yet for the specified window.
    var context = {};
    if (!remove) {
      entry.contexts.push({ window: win, context: context });
    }
    else {
      // TODO: Log failure to find context.
    }
    return context;
  };

  WindowWatcherImpl.prototype.fire = function(isLoad, win) {
    for (var i=0; i<this.registry.length; i++) {
      var callback = isLoad ? this.registry[i].loader : this.registry[i].unloader;
      callback.call(callback, win, this.getContext(this.registry[i], win, !isLoad));
    }
  };

  WindowWatcherImpl.prototype.unload = function() {
    Services.ww.unregisterNotification(this);
    this.forAllWindows(function(browserWindow) {
      this.fire(false, browserWindow);
    });
    this.registry = [];
  };

  WindowWatcherImpl.prototype.load = function() {
    Services.ww.registerNotification(this);
  };

  WindowWatcherImpl.prototype.register = function(loader, unloader) {
    var entry = {
      loader: loader,
      unloader: unloader,
      contexts: []
    };
    this.registry.push(entry);

    // start listening of browser window open/close events
    this.load();

    // go through open windows and call loader there
    var self = this;
    this.forAllWindows(function(browserWindow) {
      if ('complete' === browserWindow.document.readyState) {
        // Document is fully loaded so we can watch immediately.
        loader(browserWindow, self.getContext(entry, browserWindow));
      } else {
        // Wait for the window to load before watching.
        browserWindow.addEventListener('load', function() {
          browserWindow.removeEventListener('load', arguments.callee, false);
          loader(browserWindow, self.getContext(entry, browserWindow));
        });
      }
    });
  };

  WindowWatcherImpl.prototype.forAllWindows = function(callback) {
    var browserWindows = Services.wm.getEnumerator("navigator:browser");

    while (browserWindows.hasMoreElements()) {
      var browserWindow = browserWindows.getNext();
      callback.call(this, browserWindow);
    }
  };

  WindowWatcherImpl.prototype.isActiveBrowserWindow = function(browserWindow) {
    return browserWindow === Services.wm.getMostRecentWindow("navigator:browser");
  };

  WindowWatcherImpl.prototype.isActiveTab = function(browserWindow, tab) {
    return browserWindow.gBrowser.selectedTab === tab;
  };

  WindowWatcherImpl.prototype.observe = function(subject, topic, data) {
    var browserWindow = subject;
    if (topic === "domwindowopened") {
      if ('complete' === browserWindow.document.readyState && _isBrowserWindow(browserWindow)) {
        this.fire(true, browserWindow);
      } else {
        var self = this;
        browserWindow.addEventListener('load', function() {
          browserWindow.removeEventListener('load', arguments.callee, false);
          if (_isBrowserWindow(browserWindow)) {
            self.fire(true, browserWindow);
          }
        });
      }
    }
    if (topic === "domwindowclosed") {
      if (_isBrowserWindow(browserWindow)) {
        this.fire(false, browserWindow);
      }
    }
  };

  module.exports = new WindowWatcherImpl();

}).call(this);
