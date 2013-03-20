(function() {

  Cu.import('resource://gre/modules/Services.jsm');

  const Cc = Components.classes;

  let config = require('./config');

  let messages = {};
  let loaded = false;

  function loadMessages() {
    loaded = true;
    let protocolHandler = require('./protocolHandler');
    let utils = require('./utils');
    // TODO: Use the real extension ID.
    let rootURI = protocolHandler.getExtensionURI('ancho');
    let localeDir = rootURI.QueryInterface(Ci.nsIFileURL).file;
    localeDir.append('_locales');

    let entries = localeDir.directoryEntries;
    while (entries.hasMoreElements()) {
      let entry = entries.getNext().QueryInterface(Ci.nsIFile);
      let locale = entry.leafName;
      entry.append('messages.json');
      if (entry.exists()) {
        let entryURI = Services.io.newFileURI(entry);
        let json = utils.readStringFromUrl(entryURI);
        messages[locale] = JSON.parse(json);
      }
    }
  }

  function I18nAPI(state, contentWindow) {
    if (!loaded) {
      loadMessages();
    }
  }

  I18nAPI.prototype = {
    getMessage: function(messageName, substitutions) {
      let currentLocale = config.defaultLocale;
      if (messages[currentLocale]) {
        var info = messages[currentLocale][messageName];
        if (info && info.message) {
          // TODO - substitutions
          return info.message.replace(/\$\$/g, '$');
        }
      }
      return "";
    }
  };

  module.exports = I18nAPI;

}).call(this);
