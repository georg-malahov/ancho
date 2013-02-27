(function() {
  const Cc = Components.classes;
  const Ci = Components.interfaces;

  function ChannelWrapper(channel) {
    this._channel = channel;
    this._propertyBag = channel.QueryInterface(Ci.nsIWritablePropertyBag2);
    this._listener = null;
  };

  ChannelWrapper.prototype = {
    QueryInterface: function(iid) {
      if (iid.equals(Ci.nsIChannel) ||
        iid.equals(Ci.nsIFileChannel) ||
        iid.equals(Ci.nsIRequest) ||
        iid.equals(Ci.nsIStreamListener) ||
        iid.equals(Ci.nsIRequestObserver) ||
        iid.equals(Ci.nsIWritablePropertyBag2) ||
        iid.equals(Ci.nsIPropertyBag2) ||
        iid.equals(Ci.nsIPropertyBag) ||
        iid.equals(Ci.nsISupports)) {
        return this;
      }
      else {
        return this._channel.QueryInterface(iid);
      }
    },

    // nsIWritablePropertyBag2
    setPropertyAsInt32: function(prop, value) { this._propertyBag.setPropertyAsInt32(prop, value); },
    setPropertyAsUint32: function(prop, value) { this._propertyBag.setPropertyAsUint32(prop, value); },
    setPropertyAsInt64: function(prop, value) { this._propertyBag.setPropertyAsInt64(prop, value); },
    setPropertyAsUint64: function(prop, value) { this._propertyBag.setPropertyAsUint64(prop, value); },
    setPropertyAsDouble: function(prop, value) { this._propertyBag.setPropertyAsDouble(prop, value); },
    setPropertyAsAString: function(prop, value) { this._propertyBag.setPropertyAsAString(prop, value); },
    setPropertyAsACString: function(prop, value) { this._propertyBag.setPropertyAsACString(prop, value); },
    setPropertyAsAUTF8String: function(prop, value) { this._propertyBag.setPropertyAsAUTF8String(prop, value); },
    setPropertyAsBool: function(prop, value) { this._propertyBag.setPropertyAsBool(prop, value); },
    setPropertyAsInterface: function(prop, value) { this._propertyBag.setPropertyAsInterface(prop, value); },

    // nsIPropertyBag2
    getPropertyAsInt32: function(prop) { return this._propertyBag.getPropertyAsInt32(prop); },
    getPropertyAsUint32: function(prop) { return this._propertyBag.getPropertyAsUint32(prop); },
    getPropertyAsInt64: function(prop) { return this._propertyBag.getPropertyAsInt64(prop); },
    getPropertyAsUint64: function(prop) { return this._propertyBag.getPropertyAsUint64(prop); },
    getPropertyAsDouble: function(prop) { return this._propertyBag.getPropertyAsDouble(prop); },
    getPropertyAsAString: function(prop) { return this._propertyBag.getPropertyAsAString(prop); },
    getPropertyAsACString: function(prop) { return this._propertyBag.getPropertyAsACString(prop); },
    getPropertyAsAUTF8String: function(prop) { return this._propertyBag.getPropertyAsAUTF8String(prop); },
    getPropertyAsBool: function(prop) { return this._propertyBag.getPropertyAsBool(prop); },
    getPropertyAsInterface: function(prop, iid, result) {
      return this._propertyBag.getPropertyAsInterface(prop, iid, result);
    },
    get: function(prop) { return this._propertyBag.get(prop); },
    hasKey: function(prop) { return this._propertyBag.hasKey(prop); },

    // nsIPropertyBag
    get enumerator() { return this._propertyBag.enumerator; },
    getProperty: function(name) { return this._propertyBag.getProperty(name); },

    // nsIFileChannel
    get file() { return this._channel.file; },

    // nsIStreamListener
    onDataAvailable: function(aRequest, aContext, aInputStream, aOffset, aCount) {
      let request = (aRequest === this._channel) ? this : aRequest;
      this._listener.onDataAvailable(request, aContext, aInputStream, aOffset, aCount);
    },

    // nsIRequestObserver
    onStartRequest: function(aRequest, aContext) {
      let request = (aRequest === this._channel) ? this : aRequest;
      this._listener.onStartRequest(request, aContext);
    },

    onStopRequest: function(aRequest, aContext, aStatusCode) {
      let request = (aRequest === this._channel) ? this : aRequest;
      this._listener.onStopRequest(request, aContext, aStatusCode);
    },

    // nsIChannel
    get originalURI() { return this._channel.originalURI; },
    set originalURI(value) { this._channel.originalURI = value; },
    get URI() { return this._channel.URI; },
    get owner() { return this._channel.owner; },
    set owner(value) { this._channel.owner = value; },
    get notificationCallbacks() { return this._channel.notificationCallbacks; },
    set notificationCallbacks(value) { this._channel.notificationCallbacks = value; },
    get securityInfo() { return this._channel.securityInfo; },
    get contentType() { return this._channel.contentType; },
    set contentType(value) { this._channel.contentType = value; },
    get contentCharset() { return this._channel.contentCharset; },
    set contentCharset(value) { this._channel.contentCharset = value; },
    get contentLength() { return this._channel.contentLength; },
    set contentLength(value) { this._channel.contentLength = value; },
    open: function() { return this._channel.open(); },
    asyncOpen: function(aListener, aContext) {
      this._listener = aListener;
      this._channel.asyncOpen(this, aContext);
    },
    get contentDisposition() { return this._channel.contentDisposition; },
    set contentDisposition(value) { this._channel.contentDisposition = value; },
    get contentDispositionFilename() { return this._channel.contentDispositionFilename; },
    set contentDispositionFilename(value) { this._channel.contentDispositionFilename = value; },
    get contentDispositionHeader() { return this._channel.contentDispositionHeader; },
    set contentDispositionHeader(value) { this._channel.contentDispositionHeader = value; },

    // nsIRequest
    get name() { return this._channel.name; },
    set name(value) { this._channel.name = value; },
    isPending: function() { return this._channel.isPending(); },
    get status() { return this._channel.status; },
    set status(value) { this._channel.status = value; },
    cancel: function(aStatus) { return this._channel.cancel(aStatus); },
    suspend: function() { return this._channel.suspend(); },
    resume: function() { return this._channel.resume(); },
    get loadGroup() { return this._channel.loadGroup; },
    set loadGroup(value) { this._channel.loadGroup = value; },
    get loadFlags() { return this._channel.loadFlags; },
    set loadFlags(value) { this._channel.loadFlags = value; }
  };

  module.exports = ChannelWrapper;
}).call(this);