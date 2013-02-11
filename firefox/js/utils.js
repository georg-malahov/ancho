(function() {
  var Cc = Components.classes;
  var Ci = Components.interfaces;
  var Cu = Components.utils;
  var Cr = Components.results;

  Cu.import('resource://gre/modules/Services.jsm');

  exports.getWindowId = function(window) {
    return window.QueryInterface(Ci.nsIInterfaceRequestor).
      getInterface(Ci.nsIDOMWindowUtils).outerWindowID;
  };

  exports.getWindowForRequest = function(request) {
    // First get the load context
    var loadContext = null;
    try {
      // Try the notification callbacks
      loadContext = request.QueryInterface(Ci.nsIChannel).
        notificationCallbacks.getInterface(Ci.nsILoadContext);
    } catch (ex) {
      // Then try the load group
      try {
        if (request.loadGroup) {
          loadContext = request.loadGroup.notificationCallbacks.getInterface(Ci.nsILoadContext);
        }
      } catch(ex) {
      }
    }

    if (loadContext) {
      return loadContext.associatedWindow;
    }
    else {
      return null;
    }
  };

  exports.readStringFromUrl = function(url) {
    var channel = Services.io.newChannelFromURI(url);
    var channelInputStream = channel.open();

    // Get an intl-aware nsIConverterInputStream for the file
    var is = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream);
    is.init(channelInputStream, 'UTF-8', 1024, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

    // Read the file into string via buffer
    var data = '';
    var buffer = {};
    while (is.readString(4096, buffer) != 0) {
      data += buffer.value;
    }

    // Clean up
    is.close();
    channelInputStream.close();

    return data;
  };

  exports.getSender = function(extensionId, tabId) {
    return { id: extensionId, tab: { id: tabId } };
  };

  exports.getLoadContext = function(aRequest) {
    var loadContext = null;
    try {
      // first try the notification callbacks
      loadContext = aRequest
        .QueryInterface(Ci.nsIChannel)
        .notificationCallbacks
        .getInterface(Ci.nsILoadContext);
      return loadContext;
    } catch (ex) {
      // fail over to trying the load group
      try {
        if (!aRequest.loadGroup) {
          return null;
        }
        loadContext = aRequest
          .loadGroup
          .notificationCallbacks
          .getInterface(Ci.nsILoadContext);
        return loadContext;
      } catch(ex) {
        return null;
      }
    }
  };

  exports.removeFragment = function(str) {
    var pos = str.indexOf('#');
    if (pos != -1) {
      return str.substr(0, pos);
    } else {
      return str;
    }
  };

  // To consider:
  // Instead of adding error descriptions one by one as we see them,
  // take them all from https://developer.mozilla.org/en/docs/Table_Of_Errors
  // and create one big translating table.
  // Not for HTTP only, but for all possible errors (--> FirefoxErrors).
  // Note: not all errors are listed on the page (e.g. NS_ERROR_PARSED_DATA_CACHED)
  var FirefoxHttpErrors = {};
  FirefoxHttpErrors[Cr.NS_OK] = {code: 0, msg: 'SUCCESS'};
  FirefoxHttpErrors[Cr.NS_ERROR_UNKNOWN_HOST] = {code: 2, msg: 'UNKNOWN HOST'};
  FirefoxHttpErrors[Cr.NS_ERROR_REDIRECT_LOOP] = {code: 3, msg: 'REDIRECT LOOP'};
  FirefoxHttpErrors[Cr.NS_ERROR_PROXY_CONNECTION_REFUSED] = {code: 4, msg: 'PROXY REFUSED CONNECTION'};
  FirefoxHttpErrors[Cr.NS_ERROR_UNKNOWN_PROTOCOL] = {code: 5, msg: 'UNKNOWN PROTOCOL'};
  FirefoxHttpErrors[Cr.NS_ERROR_MALFORMED_URI] = {code: 6, msg: 'MALFORMED URI'};
  FirefoxHttpErrors[Cr.NS_ERROR_CONNECTION_REFUSED] = {code: 7, msg: 'CONNECTION REFUSED'};
  FirefoxHttpErrors[Cr.NS_ERROR_NET_TIMEOUT] = {code: 8, msg: 'NET TIMEOUT'};
  FirefoxHttpErrors[Cr.NS_ERROR_OFFLINE] = {code: 9, msg: 'OFFLINE'};
  FirefoxHttpErrors[Cr.NS_BINDING_REDIRECTED] = {code: 10, msg: 'REQUEST REDIRECTED'};
  FirefoxHttpErrors[Cr.NS_BINDING_RETARGETED] = {code: 11, msg: 'REQUEST RETARGETED'};
  FirefoxHttpErrors[Cr.NS_BINDING_ABORTED] = {code: 12, msg: 'REQUEST ABORTED'};
  FirefoxHttpErrors[Cr.NS_BINDING_FAILED] = {code: 13, msg: 'REQUEST FAILED'};
  FirefoxHttpErrors[Cr.NS_ERROR_ALREADY_CONNECTED] = {code: 14, msg: 'ALREADY CONNECTED'};
  FirefoxHttpErrors[Cr.NS_ERROR_NOT_CONNECTED] = {code: 15, msg: 'NOT CONNECTED'};
  FirefoxHttpErrors[Cr.NS_ERROR_IN_PROGRESS] = {code: 16, msg: 'BUSY'};
  FirefoxHttpErrors[Cr.NS_ERROR_NO_CONTENT] = {code: 17, msg: 'NO CONTENT'};
  FirefoxHttpErrors[Cr.NS_ERROR_PORT_ACCESS_NOT_ALLOWED] = {code: 18, msg: 'PORT ACCESS NOT ALLOWED'};
  FirefoxHttpErrors[Cr.NS_ERROR_SOCKET_CREATE_FAILED] = {code: 19, msg: 'SOCKET CREATE FAILED'};
  FirefoxHttpErrors[Cr.NS_ERROR_ALREADY_OPENED] = {code: 20, msg: 'ALREADY OPENED'};
  FirefoxHttpErrors[Cr.NS_ERROR_NET_INTERRUPT] = {code: 21, msg: 'NET INTERRUPT'};
  FirefoxHttpErrors[Cr.NS_ERROR_INVALID_CONTENT_ENCODING] = {code: 22, msg: 'INVALID CONTENT ENCODING'};
  // The following errors are not resolved when NS_ name is used...
  FirefoxHttpErrors[0x80540006 /* Cr.NS_IMAGELIB_ERROR_NO_DECODER */] = {code: 23, msg: 'IMAGELIB: NO DECODER'};
  FirefoxHttpErrors[0x805D0021 /* Cr.NS_ERROR_PARSED_DATA_CACHED */] = {code: 24, msg: 'DATA ALREADY CACHED AND PARSED, NO NEED TO REPARSE'};

  exports.mapHttpError = function(code) {
    var res = FirefoxHttpErrors[code];
    if (!res) {
      dump('Unknown HTTP request error. Code = ' + code + '\n');
      return {code: 999, msg: 'UNKNOWN_ERROR'};
    }
    return res;
  };

}).call(this);
