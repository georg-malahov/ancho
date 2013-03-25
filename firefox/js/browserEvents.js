(function() {
  var Cc = Components.classes;
  var Ci = Components.interfaces;
  var Cu = Components.utils;

  var Utils = require('./utils');

  var prepareWindow = require('./scripting').prepareWindow;

  var progressListener = {
      // nsIWebProgressListener
      onLocationChange: function(aProgress, aRequest, aURI) {
        if (aURI.spec.indexOf('chrome-extension') === 0) {
          prepareWindow(aProgress.DOMWindow.wrappedJSObject);
        }
      },

      onStateChange: function() {},
      onProgressChange: function() {},
      onStatusChange: function() {},
      onSecurityChange: function() {}
  };

  function BrowserEvents(tabbrowser, extensionState) {
    this.init = function(contentLoadedCallback) {
      tabbrowser.addProgressListener(progressListener);
      function onContentLoaded(event) {
        var document = event.target;
        var win = document.defaultView;
        var browser = tabbrowser.mCurrentBrowser;
        // TODO: Implement for subframes
        var isFrame = ((document instanceof Ci.nsIDOMHTMLDocument) && win.frameElement);
        // We don't want to trigger the content scripts for about:blank.
        var hasContent = ('about:' !== document.location.protocol);
        if (hasContent && !isFrame) {
          if (browser._anchoCurrentLocation != document.location.href) {
            browser._anchoCurrentLocation = document.location.href;
            var tabId = Utils.getWindowId(browser.contentWindow);
            extensionState.eventDispatcher.notifyListeners('tab.updated', null,
              [ tabId, { url: document.location.href }, { id: tabId } ]);
          }
          if (contentLoadedCallback) {
            contentLoadedCallback(tabbrowser.contentWindow, document.location.href);
          }
        }
      }

      function unload() {
        tabbrowser.removeProgressListener(progressListener);
        tabbrowser.removeEventListener('DOMContentLoaded', onContentLoaded, false);
        container.removeEventListener('TabOpen', onTabOpen, false);
        container.removeEventListener('TabClose', onTabClose, false);
        container.removeEventListener('TabSelect', onTabSelect, false);
      }

      function onTabOpen(event) {
        let browser = tabbrowser.getBrowserForTab(event.target);
        browser._anchoCurrentLocation = browser.contentDocument.location.href;
        extensionState.eventDispatcher.notifyListeners('tab.created', null,
          [ { id: Utils.getWindowId(browser.contentWindow) } ]);
      }

      function onTabClose(event) {
        let browser = tabbrowser.getBrowserForTab(event.target);
        extensionState.eventDispatcher.notifyListeners('tab.removed', null,
          [ Utils.getWindowId(browser.contentWindow), {} ]);
      }

      function onTabSelect(event) {
        extensionState.eventDispatcher.notifyListeners('tab.activated', null,
          [ { tabId: Utils.getWindowId(tabbrowser.selectedBrowser.contentWindow) } ]);
      }

      tabbrowser.addEventListener('DOMContentLoaded', onContentLoaded, false);

      var container = tabbrowser.tabContainer;
      container.addEventListener('TabOpen', onTabOpen, false);
      container.addEventListener('TabClose', onTabClose, false);
      container.addEventListener('TabSelect', onTabSelect, false);

      // Trigger the content loaded callback on any tabs that are already open.
      if (contentLoadedCallback) {
        for (var i=0; i<tabbrowser.browsers.length; i++) {
          let browser = tabbrowser.browsers[i];
          let location = browser.contentDocument.location.href;
          browser._anchoCurrentLocation = location;
          contentLoadedCallback(browser.contentWindow, location);
        }
      }

      return unload;
    }
  }

  module.exports = BrowserEvents;
}).call(this);
