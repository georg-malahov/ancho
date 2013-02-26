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

  // Ancho APIs
  var ToolbarAPI = require('./toolbar');
  var ClipboardAPI = require('./clipboard');
  var ExternalAPI = require('./external');

  // System APIs
  var ConsoleAPI = require('./console');

  function exposeProperties(obj) {
    var exposedProps = {};
    for (prop in obj) {
      if (prop && prop[0] == '_') {
        // By convention, prefixing with a slash means private property.
        continue;
      }
      exposedProps[prop] = "r";
      if ('object' === typeof(obj[prop])) {
        exposeProperties(obj[prop]);
      }
    }
    obj.__exposedProps__ = exposedProps;
  }

  // export
  function API(contentWindow, extensionState) {

    this.chrome = {
      extension: new ExtensionAPI(extensionState, contentWindow),
      tabs: new TabsAPI(extensionState, contentWindow),
      windows: new WindowsAPI(extensionState, contentWindow),
      webRequest: new WebRequestAPI(extensionState, contentWindow),
      browserAction: new BrowserActionAPI(extensionState, contentWindow),
      cookies: new CookiesAPI(extensionState, contentWindow),
      history: new HistoryAPI(extensionState, contentWindow),
      debugger: new DebuggerAPI(extensionState, contentWindow),
      storage: {
        // FIXME TODO: conflicting prefix when more Ancho extensions are installed
        local: new StorageAPI(extensionState, contentWindow, 'local'),
        sync: new StorageAPI(extensionState, contentWindow, 'sync')
      }
    };
    exposeProperties(this.chrome);

    this.ancho = {
      toolbar: new ToolbarAPI(extensionState, contentWindow),
      clipboard: new ClipboardAPI(extensionState, contentWindow),
      external: new ExternalAPI(extensionState, contentWindow)
    };
    exposeProperties(this.ancho);

    this.console = new ConsoleAPI(extensionState, contentWindow);

  }

  module.exports = API;

}).call(this);
