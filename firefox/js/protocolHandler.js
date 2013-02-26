(function() {
  const Cc = Components.classes;
  const Ci = Components.interfaces;

  Components.utils.import("resource://gre/modules/NetUtil.jsm");
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

  const SCHEME = "chrome-extension";

  exports.classID = Components.ID("{b0a95b24-4270-4e74-8179-f170d6dab4a1}");

  var extensionURIs = {};

  exports.registerExtensionURI = function(id, URISpec) {
    extensionURIs[id] = NetUtil.newURI(URISpec, null, null);
  };

  exports.unregisterExtensionURI = function(id) {
    delete extensionURIs[id];
  };

  function AnchoProtocolHandler() {}

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
      let foo = NetUtil.newURI(path, null, baseURI);
      return foo;
    },

    newChannel: function(aURI) {
      let channel = NetUtil.newChannel(this._mapToFileURI(aURI), null, null);
      channel.originalURI = aURI;
      return channel;
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
      if (outer != null)
        throw Cr.NS_ERROR_NO_AGGREGATION;
      return new AnchoProtocolHandler().QueryInterface(iid);
    },

    QueryInterface: function(iid) {
      if (iid.equals(Ci.nsIFactory) ||
          iid.equals(Ci.nsISupports))
        return this;
      throw Cr.NS_ERROR_NO_INTERFACE;
    }
  };
}).call(this);
