/******************************************************************************
 * storage.js
 * Part of Ancho browser extension framework
 * Implements chrome.storage
 * Copyright 2012 Salsita software (http://www.salsitasoft.com).
 ******************************************************************************/

//******************************************************************************
//* requires
var Event = require("events.js").Event;
var EventFactory = require("utils.js").EventFactory;

var EVENT_LIST = ['onChanged'];
var API_NAME = 'storage';

var JSON = require("JSON.js");
var utils = require("utils.js");

require("storage_spec.js");
var preprocessArguments = require("typeChecking.js").preprocessArguments;
var notImplemented = require("typeChecking.js").notImplemented;

var StorageArea = function(aStorageType) {
  var mStorageType = aStorageType;

  this.get = function(keys, callback) {
    var args = preprocessArguments('chrome.storage.StorageArea.get', arguments);
    var items = {};
    var keyList = args.keys;
    if (utils.isString(args.keys)) {
      keyList = [args.keys];
    }
    if (utils.isArray(keyList)) {
      for (var i = 0; i < keyList.length; ++i) {
        var item = addonAPI.storageGet(mStorageType, keyList[i]);
        items[keyList[i]] = (item && JSON.parse(item)) || item;
      }
    } else {
      for (var key in keyList) {
        if (keyList.hasOwnProperty(key)) {
          var item = addonAPI.storageGet(mStorageType, key);
          item = (item && JSON.parse(item)) || item;
          if (item) {
            items[key] = item;
          } else {
            items[key] = keyList[key];
          }
        }
      }
    }
    args.callback(items);
  }

  this.getBytesInUse = function(keys, callback) {
    var args = notImplemented('chrome.storage.StorageArea.getBytesInUse', arguments);
    args.callback(-1);
  }

  this.set = function(items, callback) {
    var args = preprocessArguments('chrome.storage.StorageArea.set', arguments);
    for (var key in args.items) {
      if (args.items.hasOwnProperty(key)) {
        var value = args.items[key];
        var serializedValue = JSON.stringify(value);
        addonAPI.storageSet(mStorageType, key, serializedValue);
      }
    }
    //TODO - fire event
    args.callback && args.callback();
  }

  this.remove = function(keys, callback) {
    var args = preprocessArguments('chrome.storage.StorageArea.remove', arguments);
    if (utils.isString(args.keys)) {
      args.keys = [args.keys];
    }
    for (var i = 0; i < args.keys.length; ++i) {
      addonAPI.storageRemove(mStorageType, args.keys[i]);
    }
    //TODO - fire event
    args.callback && args.callback();
  }

  this.clear = function(callback) {
    var args = preprocessArguments('chrome.storage.StorageArea.clear', arguments);
    addonAPI.storageClear(mStorageType);
    //TODO - fire event
    args.callback && args.callback();
  }

  this.QUOTA_BYTES = 880;
};

//******************************************************************************
//* main closure
exports.createAPI = function(instanceID) {
  return new (function() {
  //============================================================================
  // private variables


  //============================================================================
  // public properties

  this.sync = null;
  this.local = new StorageArea('local');
  //============================================================================
  // events

  EventFactory.createEvents(this, instanceID, API_NAME, EVENT_LIST);

  //============================================================================
  //============================================================================
  // main initialization


})();
}

exports.releaseAPI = function(instanceID) {
  EventFactory.releaseEvents(instanceID, API_NAME, EVENT_LIST);
}
