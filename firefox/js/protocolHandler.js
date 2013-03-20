(function() {
  const Cc = Components.classes;
  const Ci = Components.interfaces;

  Components.utils.import("resource://gre/modules/NetUtil.jsm");
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

  var config = require('./config');
  var ChannelWrapper = require('./channelWrapper');

  const SCHEME = "chrome-extension";

  exports.classID = Components.ID("{b0a95b24-4270-4e74-8179-f170d6dab4a1}");

  var extensionURIs = {};

  exports.registerExtensionURI = function(id, uri) {
    extensionURIs[id] = uri;
  };

  exports.unregisterExtensionURI = function(id) {
    delete extensionURIs[id];
  };

  exports.getExtensionURI = function(id) {
    return extensionURIs[id];
  }

  function getLoadContext(aRequest) {
    try {
      // First try the notification callbacks.
      let loadContext = aRequest.QueryInterface(Ci.nsIChannel)
        .notificationCallbacks
        .getInterface(Ci.nsILoadContext);
      return loadContext;
    }
    catch (ex) {
      // Fail over to trying the load group.
      try {
        if (!aRequest.loadGroup) {
          return null;
        }
        let loadContext = aRequest.loadGroup.notificationCallbacks
          .getInterface(Ci.nsILoadContext);
        return loadContext;
      }
      catch (ex) {
        return null;
      }
    }
  }

  function isWebAccessible(path) {
    for (let i=0; i<config.webAccessibleResources.length; i++) {
      if (path.match(config.webAccessibleResources[i])) {
        return true;
      }
    }
    return false;
  }

  function onStartRequest(aRequest, aContext) {
    if (aRequest != this._channel) {
      return this._listener.onStartRequest(aRequest, aContext);
    }
    this._listener.onStartRequest(this, aContext);
    let loadContext = getLoadContext(aRequest);
    if (loadContext && loadContext.isContent && !isWebAccessible(this._channel.URI.path)) {
      throw Components.results.NS_ERROR_DOM_SECURITY_ERR;
    }
  }

  function AnchoProtocolHandler() {
  }

  AnchoProtocolHandler.prototype = {
    scheme: SCHEME,
    defaultPort: -1,
    protocolFlags: Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE |
                   Ci.nsIProtocolHandler.URI_INHERITS_SECURITY_CONTEXT,

    newURI: function(aSpec, aOriginCharset, aBaseURI) {
      let uri = Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIStandardURL);
      uri.init(Ci.nsIStandardURL.URLTYPE_STANDARD, null, aSpec, aOriginCharset, aBaseURI);
      return uri.QueryInterface(Ci.nsIURI);
    },

    _mapToFileURI: function(aURI) {
      var path = "." + aURI.path;
      let baseURI = extensionURIs[aURI.host];
      return NetUtil.newURI(path, null, baseURI);
    },

    newChannel: function(aURI) {
      let channel = NetUtil.newChannel(this._mapToFileURI(aURI), null, null);
      channel.originalURI = aURI;
      let wrapper = new ChannelWrapper(channel);
      // Monkey patch in our custom onStartRequest method.
      // This function rejects requests from content pages for resources that
      // are not whitelisted in the web_accessible_resources section of the
      // manifest.
      wrapper.onStartRequest = onStartRequest;
      return wrapper;
    },

    allowPort: function(aPort, aScheme) {
      return false;
    },

    QueryInterface: XPCOMUtils.generateQI([
      Ci.nsIProtocolHandler
    ]),

    classID: exports.classID
  };

  exports.componentFactory = {
    createInstance: function(outer, iid) {
      if (outer) {
        throw Cr.NS_ERROR_NO_AGGREGATION;
      }
      return new AnchoProtocolHandler().QueryInterface(iid);
    },

    QueryInterface: XPCOMUtils.generateQI([Ci.nsIFactory])
  };
}).call(this);
