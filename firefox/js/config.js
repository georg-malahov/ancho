(function() {

  module.exports = {
    // Name of the extension
    extensionName: null,
    // Are we running it for the first time?
    firstRun: false,
    // Path to hosted browser extension code.
    hostExtensionPath: '/content/chrome-ext/',
    // An array of objects describing the content scripts that should be applied
    // to webpages. Each content script has a `matches` property that decribes the
    // URLs that it should be applied to and a `js` property containing an array
    // of scripts that should be applied if the URLs match.
    contentScripts: [],
    // An array of script filenames to load into background page.
    backgroundScripts: [],
    // Filename of HTML to load into background window.
    backgroundPage: null,
    // Patterns for resources that can be accessed from content pages.
    webAccessibleResources: [],
    // Locale to use if browser is not configured otherwise.
    defaultLocale: 'en',
    // Init function for calculated values.
    _init: function() {
      // A URL prefix to hosted browser extesnion code.
      this.hostExtensionRoot = 'chrome://ancho' + this.hostExtensionPath;
      return this;
    }
  }._init();

}).call(this);
