(function() {

  // Google Chrome APIs
  var ExtensionAPI = require('./extension');
  var TabsAPI = require('./tabs');
  var WindowsAPI = require('./windows');
  var WebRequestAPI = require('./webRequest');
  var BrowserActionAPI = require('./browserAction');
  var CookiesAPI = require('./cookies');
  var HistoryAPI = require('./history');
  var DebuggerAPI = require('./debugger');
  var StorageAPI = require('./storage');
  var I18nAPI = require('./i18n');

  // Ancho APIs
  var ToolbarAPI = require('./toolbar');
  var ClipboardAPI = require('./clipboard');
  var ExternalAPI = require('./external');

  // System APIs
  var ConsoleAPI = require('./console');

  function exposeProperties(obj) {
    var exposedProps = {};
    for (var prop in obj) {
      if (prop && prop[0] === '_') {
        // By convention, prefixing with a slash means private property.
        continue;
      }
      exposedProps[prop] = 'r';
      if ('object' === typeof(obj[prop])) {
        exposeProperties(obj[prop]);
      }
    }
    obj.__exposedProps__ = exposedProps;
  }

  // export
  function API(contentWindow, extensionState) {
    let chrome = {};
    chrome.extension = new ExtensionAPI(extensionState, contentWindow);
    chrome.tabs = new TabsAPI(extensionState, contentWindow, chrome);
    chrome.windows = new WindowsAPI(extensionState, contentWindow);
    chrome.webRequest = new WebRequestAPI(extensionState, contentWindow);
    chrome.browserAction = new BrowserActionAPI(extensionState, contentWindow);
    chrome.cookies = new CookiesAPI(extensionState, contentWindow);
    chrome.history = new HistoryAPI(extensionState, contentWindow);
    chrome.i18n = new I18nAPI(extensionState, contentWindow);
    chrome.debugger = new DebuggerAPI(extensionState, contentWindow);
    chrome.storage = {
      // FIXME TODO: conflicting prefix when more Ancho extensions are installed
      local: new StorageAPI(extensionState, contentWindow, 'local'),
      sync: new StorageAPI(extensionState, contentWindow, 'sync')
    };
    this.chrome = chrome;
    exposeProperties(this.chrome);

    this.ancho = {
      toolbar: new ToolbarAPI(extensionState, contentWindow),
      clipboard: new ClipboardAPI(extensionState, contentWindow),
      external: new ExternalAPI(extensionState, contentWindow)
    };
    exposeProperties(this.ancho);

    this.console = new ConsoleAPI(extensionState, contentWindow);
    exposeProperties(this.console);
  }

  module.exports = API;

}).call(this);
