(function() {
  var Cc = Components.classes;
  var Ci = Components.interfaces;
  var Cu = Components.utils;

  var Utils = require('./utils');

  var prepareWindow = require('./scripting').prepareWindow;

  function isContentBrowser(document) {
    if (!document.head || !document.body) {
      // Not an HTML document.
      return false;
    }
    if ('about:' === document.location.protocol) {
      return false;
    }
    // See https://bugzilla.mozilla.org/show_bug.cgi?id=863303
    // Currently there is a bug in Firefox and tabs opened by the session
    // saver are erroneously given the readyState 'complete', so we
    // need this hack to check whether they have really been loaded.
    if (!document.head.hasChildNodes() && !document.body.hasChildNodes()) {
      return false;
    }
    return true;
  }

  var progressListener = {
    // nsIWebProgressListener
    onLocationChange: function(aProgress, aRequest, aURI) {
      if (aURI.schemeIs('chrome-extension')) {
        prepareWindow(aProgress.DOMWindow.wrappedJSObject);
      }
      var document = aProgress.DOMWindow.document;
      var self = this;
      // The callback may be expecting DOMContentLoaded to be called, so we want to
      // trigger it before that event. We do this by hooking into invoking the callback
      // when the readystate changes to 'interactive'. This occurs just before the
      // DOMContentLoaded event.
      if ('loading' === document.readyState) {
        document.addEventListener('readystatechange', function(event) {
          if ('interactive' === document.readyState) {
            document.removeEventListener('readystatechange', arguments.callee, false);
            self.callback(document);
          }
        }, false);
      }
    },

    onStateChange: function() {},
    onProgressChange: function() {},
    onStatusChange: function() {},
    onSecurityChange: function() {}
  };

  function BrowserEvents(tabbrowser, extensionState) {
    this.init = function(contentLoadedCallback) {
      function onContentLoaded(document) {
        var win = document.defaultView;
        var browser = tabbrowser.mCurrentBrowser;
        // TODO: Implement for subframes
        var isFrame = ((document instanceof Ci.nsIDOMHTMLDocument) && win.frameElement);
        // We don't want to trigger the content scripts for about:blank.
        if (isContentBrowser(document) && !isFrame) {
          if (browser._anchoCurrentLocation != document.location.href) {
            browser._anchoCurrentLocation = document.location.href;
            var tabId = Utils.getWindowId(browser.contentWindow);
            extensionState.eventDispatcher.notifyListeners('tab.updated', null,
              [ tabId, { url: document.location.href }, { id: tabId } ]);
          }
          if (contentLoadedCallback) {
            contentLoadedCallback(document.defaultView, document.location.href);
          }
        }
      }

      progressListener.callback = onContentLoaded;
      tabbrowser.addProgressListener(progressListener);

      function unload() {
        tabbrowser.removeProgressListener(progressListener);
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

      var container = tabbrowser.tabContainer;
      container.addEventListener('TabOpen', onTabOpen, false);
      container.addEventListener('TabClose', onTabClose, false);
      container.addEventListener('TabSelect', onTabSelect, false);

      // Trigger the content loaded callback on any tabs that are already open.
      if (contentLoadedCallback) {
        for (var i=0; i<tabbrowser.browsers.length; i++) {
          let browser = tabbrowser.browsers[i];
          if (isContentBrowser(browser.contentDocument)) {
            let location = browser.contentDocument.location.href;
            browser._anchoCurrentLocation = location;
            if ('complete' === browser.contentDocument.readyState) {
              contentLoadedCallback(browser.contentWindow, location);
            }
          }
        }
      }

      return unload;
    }
  }

  module.exports = BrowserEvents;
}).call(this);
