(function() {

  var Cu = Components.utils;

  Cu.import('resource://gre/modules/Services.jsm');

  //var Event = require('./event');
  var Utils = require('./utils');
  var WindowWatcher = require('./windowWatcher');
  var Config = require('./config');

  const BUTTON_ID = '__ANCHO_BROWSER_ACTION_BUTTON__';
  const NAVIGATOR_TOOLBOX = "navigator-toolbox";
  const TOOLBAR_ID = "nav-bar";

  var BrowserActionService = {
    iconEnabled: false,
    currentIcon: null,
    buttonId: null,

    init: function() {
      // TODO: this.onClicked = new Event();
      this.iconEnabled = Config.browser_action
          && Config.browser_action.default_icon ? true : false;
      this.currentIcon = this.iconEnabled ? Config.hostExtensionRoot
          + Config.browser_action.default_icon : '';

      this.buttonId = BUTTON_ID;
      var self = this;

      WindowWatcher.register(function(win) {
        self.startup(win);
      }, function(win) {
        self.shutdown(win);
      });
    },

    installIcon: function(window) {
      var id = this.buttonId;
      var document = window.document;
      if (document.getElementById(id)) {
        // We already have the toolbar button.
        return;
      }
      var toolbar = document.getElementById(TOOLBAR_ID);
      if (!toolbar) {
        // No toolbar in this window so we're done.
        return;
      }
      var toolbarButton = document.createElement("toolbarbutton");
      toolbarButton.setAttribute("id", id);
      toolbarButton.setAttribute("type", "button");
      toolbarButton.setAttribute("removable", "true");
      toolbarButton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
      toolbarButton.setAttribute("label", Config.extensionName);
      toolbarButton.style.listStyleImage = "url(" + this.currentIcon + ")";

      document.getElementById(NAVIGATOR_TOOLBOX).palette.appendChild(toolbarButton);
      var currentset = toolbar.getAttribute("currentset").split(",");
      var index = currentset.indexOf(id);
      if (index === -1) {
        if (Config.firstRun) {
          // No button yet so add it to the toolbar.
          toolbar.appendChild(toolbarButton);
          toolbar.setAttribute("currentset", toolbar.currentSet);
          document.persist(toolbar.id, "currentset");
        }
      }
      else {
        var before = null;
        for (var i=index+1; i<currentset.length; i++) {
          before = document.getElementById(currentset[i]);
          if (before) {
            toolbar.insertItem(id, before);
            break;
          }
        }
        if (!before) {
          toolbar.insertItem(id);
        }
      }

      var panel = document.createElement("panel");
      var iframe = document.createElement("iframe");
      iframe.setAttribute('type', 'chrome');

      toolbarButton.appendChild(panel);
      panel.appendChild(iframe);

      var self = this;
      toolbarButton.addEventListener('click', function(event) { self.clickHandler(event); }, false);
      this.setIcon(window, this.currentIcon, true);
    },

    showPopup: function(panel, iframe, document) {
      // Deferred loading of scripting.js since we have a circular reference that causes
      // problems if we load it earlier.
      var loadHtml = require('./scripting').loadHtml;
      loadHtml(document, iframe, "chrome-extension://ancho/" + Config.browser_action.default_popup, function() {
        var body = iframe.contentDocument.body;
        // We need to intercept link clicks and open them in the current browser window.
        body.addEventListener("click", function(event) {
          var link = event.target;
          if (link.href) {
            event.preventDefault();
            var browser = document.getElementById("content");
            browser.contentWindow.open(link.href, link.target);
            return false;
          }
        }, false);

        // Remember the height and width of the popup.
        // Check periodically and resize it if necessary.
        var oldHeight = oldWidth = 0;
        function getPanelBorderWidth(which) {
          return parseFloat(document.defaultView.getComputedStyle(panel)['border' + which + 'Width']);
        }

        function resizePopup() {
          if (body.scrollHeight !== oldHeight && body.scrollWidth !== oldWidth) {
            oldHeight = iframe.height = (body.scrollHeight + 1);
            panel.height = oldHeight + getPanelBorderWidth('Top') + getPanelBorderWidth('Bottom');
            oldWidth = iframe.width = (body.scrollWidth + 1);
            panel.width = oldWidth + getPanelBorderWidth('Left') + getPanelBorderWidth('Right');
          }
        }

        iframe.contentDocument.addEventListener('MozScrolledAreaChanged', function(event) {
          resizePopup();
        }, false);
        iframe.contentWindow.close = function() {
          panel.hidePopup();
        };
      });
    },

    clickHandler: function(event) {
      if (!event.target || event.target.tagName !== "toolbarbutton") {
        // Only react when button itself is clicked (i.e. not the panel).
        return;
      }
      var self = this;
      var toolbarButton = event.target;
      var panel = toolbarButton.firstChild;
      var iframe = panel.firstChild;
      var document = event.target.ownerDocument;
      iframe.setAttribute('src', 'about:blank');
      panel.addEventListener('popupshown', function(event) {
        panel.removeEventListener('popupshown', arguments.callee, false);
        self.showPopup(panel, iframe, document);
      }, false);
      panel.openPopup(toolbarButton, "after_start", 0, 0, false, false);
    },

    setIcon: function(window, iconUrl, notAttach) {
      var id = this.buttonId;
      var element = window.document.getElementById(id);
      // if the button is available set new icon
      if (element) {
        element.style.listStyleImage = 'url("' + iconUrl + '")';
      }
    },

    updateIcon: function() {
      var self = this;
      WindowWatcher.forAllWindows(function(window) {
        self.setIcon(window, self.currentIcon);
      });
    },

    shutdown: function(window) {
      document = window.document;
      var toolbarButton = document.getElementById(this.buttonId);
      var toolbar = document.getElementById(TOOLBAR_ID);
      var palette = document.getElementById(NAVIGATOR_TOOLBOX).palette;
      toolbar.removeChild(toolbarButton);
      palette.removeChild(toolbarButton);
    },

    startup: function(window) {
      if (this.iconEnabled) {
        this.installIcon(window);
      }
    }
  };

  // Start the service once
  BrowserActionService.init();

  var BrowserActionAPI = function() {
  };

  BrowserActionAPI.prototype.getBadgeBackgroundColor = function() {
    throw new Error('Unsupported method');
  };

  BrowserActionAPI.prototype.getBadgeText = function() {
    throw new Error('Unsupported method');
  };

  BrowserActionAPI.prototype.getPopup = function() {
    throw new Error('Unsupported method');
  };

  BrowserActionAPI.prototype.getTitle = function() {
    throw new Error('Unsupported method');
  };

  BrowserActionAPI.prototype.setBadgeBackgroundColor = function() {
    throw new Error('Unsupported method');
  };

  BrowserActionAPI.prototype.setBadgeText = function() {
    // TODO: Implement this
    // throw new Error('Unsupported method');
  };

  BrowserActionAPI.prototype.setPopup = function() {
    throw new Error('Unsupported method');
  };

  BrowserActionAPI.prototype.setTitle = function() {
    throw new Error('Unsupported method');
  };

  BrowserActionAPI.prototype.setIcon = function(details) {
    if (details && details.path) {
      this.currentIcon = details.path;
    } else {
      throw new Error('Unsupported details when setting icon - '
          + JSON.stringify(details));
    }
    BrowserActionService.updateIcon();
  };


  module.exports = BrowserActionAPI;

}).call(this);
