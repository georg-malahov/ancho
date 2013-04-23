(function() {

  var Cu = Components.utils;

  Cu.import('resource://gre/modules/Services.jsm');

  //var Event = require('./event');
  var Utils = require('./utils');
  var WindowWatcher = require('./windowWatcher');
  var Config = require('./config');

  const BUTTON_ID = '__ANCHO_BROWSER_ACTION_BUTTON__';
  const CANVAS_ID = '__ANCHO_BROWSER_ACTION_CANVAS__';
  const HBOX_ID = '__ANCHO_BROWSER_ACTION_HBOX__';
  const IMAGE_ID = '__ANCHO_BROWSER_ACTION_IMAGE__'
  const NAVIGATOR_TOOLBOX = 'navigator-toolbox';
  const TOOLBAR_ID = 'nav-bar';

  const BROWSER_ACTION_ICON_WIDTH = 19;
  const BROWSER_ACTION_ICON_HEIGHT = 19;

  var BrowserActionService = {
    iconEnabled: false,
    buttonId: null,
    badgeText: null,
    badgeBackgroundColor: "#f00",
    tabBadgeText: {},
    tabBadgeBackgroundColor: {},

    init: function() {
      // TODO: this.onClicked = new Event();
      this.iconEnabled = Config.browser_action && Config.browser_action.default_icon;

      this.buttonId = BUTTON_ID;
      var self = this;

      WindowWatcher.register(function(win, context) {
        self.startup(win);
        var tabbrowser = win.document.getElementById('content');
        var container = tabbrowser.tabContainer;
        context.listener = function() {
          self.setIcon(win, {});
        };
        container.addEventListener('TabSelect', context.listener, false);
      }, function(win, context) {
        var tabbrowser = win.document.getElementById('content');
        var container = tabbrowser.tabContainer;
        container.removeEventListener('TabSelect', context.listener, false);
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

      var iconPath = this.iconEnabled ? Config.hostExtensionRoot + Config.browser_action.default_icon : '';
      toolbarButton.style.listStyleImage = "url(" + iconPath + ")";

      var palette = document.getElementById(NAVIGATOR_TOOLBOX).palette;
      palette.appendChild(toolbarButton);

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

      var hbox = document.createElement("hbox");
      hbox.id = HBOX_ID;
      hbox.setAttribute('hidden', 'true');
      panel.appendChild(hbox);

      var self = this;
      toolbarButton.addEventListener('click', function(event) { self.clickHandler(event); }, false);
      this.setIcon(window, { path: iconPath });
    },

    showPopup: function(panel, iframe, document) {
      // Deferred loading of scripting.js since we have a circular reference that causes
      // problems if we load it earlier.
      var loadHtml = require('./scripting').loadHtml;
      loadHtml(document, iframe, "chrome-extension://ancho/" + Config.browser_action.default_popup, function() {
        var body = iframe.contentDocument.body;
        // Need to float the body so that it will resize to the contents of its children.
        if (!body.style.cssFloat) {
          body.style.cssFloat = 'left';
        }
        // We need to intercept link clicks and open them in the current browser window.
        body.addEventListener("click", function(event) {
          var link = event.target;
          if (link.href) {
            event.preventDefault();
            var browser = document.getElementById("content");
            browser.contentWindow.open(link.href, link.target);
            panel.hidePopup();
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
            oldHeight = iframe.height = body.scrollHeight + 1;
            oldWidth = iframe.width = body.scrollWidth + 1;
            panel.sizeTo(oldWidth + getPanelBorderWidth('Left') + getPanelBorderWidth('Right'),
              oldHeight + getPanelBorderWidth('Top') + getPanelBorderWidth('Bottom'));
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

    _drawButton: function(tabId, button, canvas) {
      var ctx = canvas.getContext("2d");
      ctx.textBaseline = "top";
      ctx.font = "bold 9px sans-serif";

      var text = this.getBadgeText(tabId);
      if (text)
      {
        var w = ctx.measureText(text).width;
        var h = 7;

        var rp = ((canvas.width - 4) > w) ? 2 : 1; // right padding = 2, or 1 if text is wider
        var x = canvas.width - w - rp;
        var y = canvas.height - h - 1; // 1 = bottom padding

        var color = this.getBadgeBackgroundColor(tabId);
        ctx.fillStyle = color;
        ctx.fillRect(x-rp, y-1, w+rp+rp, h+2);
        ctx.fillStyle = "#fff"; // text color
        ctx.fillText(text, x, y);
      }

      button.image = canvas.toDataURL("image/png", "");  // set new toolbar image
    },

    setIcon: function(window, details) {
      var document = window.document;
      var hbox = document.getElementById(HBOX_ID);
      var canvas = document.getElementById(CANVAS_ID);
      if (!canvas) {
        canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
        canvas.id = CANVAS_ID;
        hbox.appendChild(canvas);
      }
      var img = document.getElementById(IMAGE_ID);
      if (!img) {
        img = document.createElementNS('http://www.w3.org/1999/xhtml', 'img');
        img.id = IMAGE_ID;
        hbox.appendChild(img);
      }

      canvas.setAttribute("width", BROWSER_ACTION_ICON_WIDTH);
      canvas.setAttribute("height", BROWSER_ACTION_ICON_HEIGHT);
      var ctx = canvas.getContext("2d");

      var button = document.getElementById(this.buttonId);
      var browser = document.getElementById("content");
      var tabId = Utils.getWindowId(browser.contentWindow);

      var self = this;
      if (details.path) {
        img.onload = function() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          self._drawButton(tabId, button, canvas, ctx);
        };
        img.src = details.path;
      }
      else if (details.imageData) {
        ctx.putImageData(details.imageData, 0, 0);
        self._drawButton(tabId, button, canvas, ctx);
      }
      else {
        // No image provided so just update the badge using the existing image.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        self._drawButton(tabId, button, canvas, ctx);
      }
    },

    updateIcon: function(details) {
      var self = this;
      WindowWatcher.forAllWindows(function(window) {
        self.setIcon(window, details);
      });
    },

    shutdown: function(window) {
      if (this.iconEnabled) {
        document = window.document;
        var toolbarButton = document.getElementById(this.buttonId);
        var toolbar = document.getElementById(TOOLBAR_ID);
        if (toolbar.contains(toolbarButton)) {
          toolbar.removeChild(toolbarButton);
        }
      }
    },

    startup: function(window) {
      if (this.iconEnabled) {
        this.installIcon(window);
      }
    },

    getBadgeBackgroundColor: function(tabId) {
      if (this.tabBadgeBackgroundColor[tabId]) {
        return this.tabBadgeBackgroundColor[tabId];
      }
      else {
        return this.badgeBackgroundColor;
      }
    },

    getBadgeText: function(tabId) {
      if (this.tabBadgeText[tabId]) {
        return this.tabBadgeText[tabId];
      }
      else {
        return this.badgeText;
      }
    },

    setBadgeBackgroundColor: function(tabId, color) {
      if ('undefined' !== typeof(tabId)) {
        this.tabBadgeBackgroundColor[tabId] = color;
      }
      else {
        this.badgeBackgroundColor = color;
      }
      this.updateIcon({});
    },

    setBadgeText: function(tabId, text) {
      if ('undefined' !== typeof(tabId)) {
        this.tabBadgeText[tabId] = text;
      }
      else {
        this.badgeText = text;
      }
      this.updateIcon({});
    }
  };

  // Start the service once
  BrowserActionService.init();

  var BrowserActionAPI = function() {
  };

  BrowserActionAPI.prototype.getBadgeBackgroundColor = function(details, callback) {
    callback(BrowserActionService.getBadgeBackgroundColor(details.tabId));
  };

  BrowserActionAPI.prototype.getBadgeText = function(details, callback) {
    callback(BrowserActionService.getBadgeText(details.tabId));
  };

  BrowserActionAPI.prototype.getPopup = function() {
    throw new Error('Unsupported method');
  };

  BrowserActionAPI.prototype.getTitle = function() {
    throw new Error('Unsupported method');
  };

  BrowserActionAPI.prototype.setBadgeBackgroundColor = function(details) {
    function colorToString(color) {
      if ('string' === typeof(color)) {
        // TODO: Support three digit RGB codes.
        if (/#[0-9A-F]{6}/i.exec(color)) {
          return color;
        }
      } else if (Array.isArray(color)){
        if (color.length === 3) {
          // TODO: Support alpha.
          var str = '#';
          for (var i = 0; i < 3; ++i) {
            var tmp = Math.max(0, Math.min(color[i], 255))
            str += tmp.toString(16);
          }
          return str;
        }
      }
      throw new Error('Unsupported color format');
    }

    BrowserActionService.setBadgeBackgroundColor(details.tabId, colorToString(details.color));
  };

  BrowserActionAPI.prototype.setBadgeText = function(details) {
    BrowserActionService.setBadgeText(details.tabId, details.text);
  };

  BrowserActionAPI.prototype.setPopup = function() {
    throw new Error('Unsupported method');
  };

  BrowserActionAPI.prototype.setTitle = function() {
    throw new Error('Unsupported method');
  };

  BrowserActionAPI.prototype.setIcon = function(details) {
    BrowserActionService.updateIcon(details);
  };


  module.exports = BrowserActionAPI;

}).call(this);
