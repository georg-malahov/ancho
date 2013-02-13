(function() {

  var Cu = Components.utils;

  Cu.import('resource://gre/modules/Services.jsm');

  //var Event = require('./event');
  var Utils = require('./utils');
  var WindowWatcher = require('./windowWatcher');
  var Config = require('./config');

  const PANEL_MARGIN_SIZE = 20;
  const PANEL_RESIZE_INTERVAL = 200;

  var BrowserActionAPI = function() {
    // TODO: this.onClicked = new Event();
    // TODO : get default button icon url
    var urlPrefix = Config.hostExtensionRoot;
    // FIXME: get default extension icon URL from manifest.json
    // FIXME: Config undefined here...
    this.iconEnabled = Config.browser_action
        && Config.browser_action.default_icon ? true : false;
    this.currentIcon = this.iconEnabled ? urlPrefix
        + Config.browser_action.default_icon : '';

    this.buttonId = '__ANCHO_CUSTOM_BUTTON__';
    var self = this;
    if (this.iconEnabled) {
      WindowWatcher.register(function(window) {
        self.startup(window);
      }, function(window) {
        self.shutdown(window);
      });
    }
  };

  BrowserActionAPI.prototype._installIcon = function(window) {
    var toolbarId = "nav-bar";
    var id = this.buttonId;
    var document = window.document;
    if (document.getElementById(id)) {
      // We already have the toolbar button.
      return;
    }
    var toolbar = document.getElementById(toolbarId);
    if (toolbar) {
      var toolbarButton = document.createElement("toolbarbutton");
      toolbarButton.setAttribute("id", id);
      toolbarButton.setAttribute("type", "button");
      toolbarButton.setAttribute("removable", "true");
      toolbarButton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
      toolbarButton.setAttribute("label", "button");

      document.getElementById("navigator-toolbox").palette.appendChild(toolbarButton);
      var currentset = toolbar.getAttribute("currentset").split(",");
      var index = currentset.indexOf(id);
      if (index == -1) {
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
      iframe.flex = 1;
      toolbarButton.appendChild(panel);
      panel.appendChild(iframe);
      toolbarButton.addEventListener('click', function(event) {
        if (event.target != toolbarButton) {
          // Only react when button itself is clicked (i.e. not the panel).
          return;
        }
        iframe.setAttribute('src', 'about:blank');
        panel.openPopup(toolbarButton, "after_start", 0, 0, false, false);

        // Deferred loading of scripting.js since we have a circular reference that causes
        // problems if we load it earlier.
        var loadHtml = require('./scripting').loadHtml;
        loadHtml(document, iframe, Config.hostExtensionRoot + Config.browser_action.default_popup, function() {
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
          function resizePopup() {
            if (body.scrollHeight != oldHeight && body.scrollWidth != oldWidth) {
              panel.height = body.scrollHeight + PANEL_MARGIN_SIZE;
              panel.width = body.scrollWidth + PANEL_MARGIN_SIZE;
              oldHeight = iframe.height = body.scrollHeight;
              oldWidth = iframe.width = body.scrollWidth;
            }
          }
          resizePopup();

          var interval = iframe.contentWindow.setInterval(function() {
            resizePopup();
          }, PANEL_RESIZE_INTERVAL);
          panel.addEventListener("popuphiding", function(event) {
            panel.removeEventListener("popuphiding", arguments.callee, false);
            iframe.contentWindow.clearInterval(interval);
          }, false);

          iframe.contentWindow.close = function() {
            panel.hidePopup();
          };
        });
      });
    }
    this._setIcon(window, this.currentIcon, true);
  };

  BrowserActionAPI.prototype.shutdown = function(window) {
    if (this.iconEnabled) {
      var id = this.buttonId;
      var element = window.document.getElementById(id);
      if (element) {
        element.parentNode.removeChild(element);
      }
    }
  };

  BrowserActionAPI.prototype.startup = function(window) {
    if (this.iconEnabled) {
      this._installIcon(window);
    }
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
    throw new Error('Unsupported method');
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
    this._updateIcon();
  };

  BrowserActionAPI.prototype._setIcon = function(window, iconUrl, notAttach) {
    var id = this.buttonId;
    var element = window.document.getElementById(id);
    // if the button is available set new icon
    if (element) {
      element.style.listStyleImage = 'url("' + iconUrl + '")';
    }
  };

  BrowserActionAPI.prototype._updateIcon = function() {
    var self = this;
    WindowWatcher.forAllWindows(function(window) {
      self._setIcon(window, self.currentIcon);
    });
  };

  module.exports = BrowserActionAPI;

}).call(this);
