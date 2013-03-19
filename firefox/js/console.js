(function() {

  function ConsoleAPI(state, contentWindow) {
  }

  ConsoleAPI.prototype = {
    error: function() {
      dump('ERROR: ');
      dump(this._toString.apply(this, arguments));
      dump('\n');
    },

    warn: function() {
      dump('Warning: ');
      dump(this._toString.apply(this, arguments));
      dump('\n');
    },

    log: function() {
      dump('Log: ');
      dump(this._toString.apply(this, arguments));
      dump('\n');
    },

    debug: function() {
      dump('Debug: ');
      dump(this._toString.apply(this, arguments));
      dump('\n');
    },

    _toString: function(args) {
      if ('undefined' === typeof(args)) {
        return 'undefined';
      }
      var s = '';
      for (var i = 0; i < arguments.length; i++) {
        if ('object' === typeof(arguments[i])) {
          s += JSON.stringify(arguments[i], null, 2);
        } else {
          s += arguments[i].toString();
        }
        if (i < arguments.length - 1) {
          s += ' ';
        }
      }
      return s;
    }
  };

  module.exports = ConsoleAPI;

}).call(this);
