/******************************************************************************
 * events.js
 * Part of Ancho browser extension framework
 * Implements chrome.events
 * Copyright 2012 Salsita software (http://www.salsitasoft.com).
 ******************************************************************************/

//******************************************************************************
//* class Event
(function(me) {

  function ListenerRecord(aEventName, aCallback) {
    this.callback = aCallback;
    this.eventName = aEventName;

    this.invoke = function() {
      //We cannot use apply - doesn't work for arrays from different script engines
      //http://stackoverflow.com/questions/7688070/why-is-comparing-the-constructor-property-of-two-windows-unreliable
      return addonAPI.callFunction(this.callback, arguments);
    }
  };

  me.Event = function(eventName, instanceID) {
    this._listeners = [];
    this._eventName = eventName;
    this._instanceID = instanceID;

    this.ListenerRecordConstructor = ListenerRecord;

    //console.debug('Created new event: ' + eventName + ' [' + instanceID + ']');
    var self = this;

    this._findListener = function(listener) {
      for (var i = 0; i < self._listeners.length; ++i) {
        if (self._listeners[i].callback === listener) {
          return i;
        }
      }
      return -1;
    }

    this.fire = function() {
      //console.debug('Firing event ' + self._eventName + ' - ' + self._listeners.length + ' listeners; instance:' + self._instanceID);
      var results = [];
      for (var i = 0; i < self._listeners.length; ++i) {
        try {
          var ret = self._listeners[i].invoke.apply(self._listeners[i], arguments);
          if (ret != undefined) {
            results.push(ret);
          }
        } catch (e) {
          console.error("Listener for " + self._eventName + " event has thrown an exception: " + e.description);
        }
      }
      if (results.length > 0) {
        return results;
      }
    }

    this.addListener = function(/*callback, ...*/) {
      var record = {};
      var args = [this._eventName].concat(Array.prototype.slice.call(arguments));
      self.ListenerRecordConstructor.apply(record, args);
      var i = self._findListener(record.callback);
      if (-1 != i) {
        self._listeners[i] = record;
      } else {
        self._listeners.push(record);
      }
    };

    this.removeListener = function(callback) {
      var i = self._findListener(callback);
      if (-1 != i) {
        self._listeners.splice(i, 1);
      }
    };

    this.hasListener = function(callback) {
      return self._findListener(callback) != -1;
    }

    this.hasListeners = function() {
      return self._listeners.length > 0;
    }

    if (instanceID != undefined) { //register only events with assigned instanceID
      addonAPI.addEventObject(eventName, instanceID, function() {
        return self.fire.apply(self, arguments);
      });
    }
  };

}).call(this, exports);

exports.createAPI = function(instanceID) {
  //We don't need special instances
  return exports;
}

exports.releaseAPI = function(instanceID) {
  //Nothing needs to be released
}