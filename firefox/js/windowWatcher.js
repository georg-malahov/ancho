(function() {

  var Cu = Components.utils;
  Cu.import('resource://gre/modules/Services.jsm');

  const BROWSER_WINDOW_TYPE = 'navigator:browser';

  function _isBrowserWindow(browserWindow) {
    return BROWSER_WINDOW_TYPE === browserWindow.document.documentElement.getAttribute('windowtype');
  }

  var WindowWatcherImpl = function() {
    this.registry = [];
    this.notificationListener = null;
  };

  WindowWatcherImpl.prototype.fire = function(isLoad, win) {
    for (var i=0; i<this.registry.length; i++) {
      var callback = isLoad ? this.registry[i].loader : this.registry[i].unloader;
      callback.call(callback, browserWindow, this.registry[i].context)
    }
  };

  WindowWatcherImpl.prototype.unload = function() {
    if (this.notificationListener != null) {
      Services.ww.unregisterNotification(this.notificationListener);
      this.notificationListener = null;
    }
    this.forAllWindows(this.fire.bind(this, false));
  };

  WindowWatcherImpl.prototype.load = function() {
    if (this.notificationListener == null) {
      var self = this;
      this.notificationListener = function(browserWindow, topic) {
        if (topic === "domwindowopened") {
          if ('complete' === browserWindow.document.readyState && _isBrowserWindow(browserWindow)) {
            self.fire(true, browserWindow);
          } else {
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
            self.fire(false, browserWindow);
          }
        }
      };
      Services.ww.registerNotification(this.notificationListener);
    }
  };

  WindowWatcherImpl.prototype.register = function(loader, unloader, context) {
    this.registry.push({
      loader: loader,
      unloader: unloader,
      context: context
    });

    // start listening of browser window open/close events
    this.load();

    // go through open windows and call loader there
    this.forAllWindows(function(browserWindow) {
      if ('complete' === browserWindow.document.readyState) {
        // Document is fully loaded so we can watch immediately.
        loader(browserWindow);
      } else {
        // Wait for the window to load before watching.
        browserWindow.addEventListener('load', function() {
          browserWindow.removeEventListener('load', arguments.callee, false);
          loader(browserWindow);
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

  module.exports = new WindowWatcherImpl();

}).call(this);
