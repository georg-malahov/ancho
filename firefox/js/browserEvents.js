(function() {
  var Cc = Components.classes;
  var Ci = Components.interfaces;
  var Cu = Components.utils;

  var Utils = require('./utils');

  function BrowserEvents(tabbrowser, extensionState) {
    this.init = function(contentLoadedCallback) {
      function onContentLoaded(event) {
        var document = tabbrowser.contentDocument;
        // TODO: Implement for subframes
        var isFrame = (event.target instanceof Ci.nsIDOMHTMLDocument &&
          event.target != document);
        // We don't want to trigger the content scripts for about:blank.
        var hasContent = ('about:' !== document.location.protocol);
        if (hasContent && !isFrame) {
          if (contentLoadedCallback) {
            contentLoadedCallback(tabbrowser.contentWindow, document.location.href);
          }
        }
      }

      function unload() {
        tabbrowser.removeEventListener('DOMContentLoaded', onContentLoaded, false);
        container.removeEventListener('TabOpen', onTabOpen, false);
        container.removeEventListener('TabClose', onTabClose, false);
        container.removeEventListener('TabSelect', onTabSelect, false);
      }

      function onTabOpen(event) {
        extensionState.eventDispatcher.notifyListeners('tab.created', null,
          [ { id: Utils.getWindowId(tabbrowser.getBrowserForTab(event.target).contentWindow) } ]);
      }

      function onTabClose(event) {
        extensionState.eventDispatcher.notifyListeners('tab.removed', null,
          [ Utils.getWindowId(tabbrowser.getBrowserForTab(event.target).contentWindow), {} ]);
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
          var browser = tabbrowser.browsers[i];
          contentLoadedCallback(browser.contentWindow, browser.contentDocument.location.href);
        }
      }

      return unload;
    }
  }

  module.exports = BrowserEvents;
}).call(this);
