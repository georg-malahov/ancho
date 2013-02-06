/******************************************************************************
 * webRequest.js
 * Part of Ancho browser extension framework
 * Implements chrome.webRequest
 * Copyright 2012 Salsita software (http://www.salsitasoft.com).
 ******************************************************************************/

//******************************************************************************
//* requires
var Event = require("events.js").Event;
var EventFactory = require("utils.js").EventFactory;

require("webRequest_spec.js");
var preprocessArguments = require("typeChecking.js").preprocessArguments;
var notImplemented = require("typeChecking.js").notImplemented;
var matchUrl = require("utils.js").matchUrl;


function RequestFilterHandler(aFilter) {
  var filterData = aFilter;
  this.filter = function(aRequestDetails) {
    passed = false;
    for (var i = 0; !passed && i < filterData.urls.length; ++i) {
      passed = passed || (matchUrl(aRequestDetails.url, filterData.urls[i]));
    }
    if (!passed) {
      return false;
    }

    //Filter types
    if (filterData.types) {
      var found = false;
      for (var i = 0; !found && i < filterData.types.length; ++i) {
        found = found || (filterData.types[i] == aRequestDetails.type);
      }
      passed = passed && found;
    }
    return passed;
  }
}


function WebRequestListenerRecord(/*callback, filter, opt_extraInfoSpec*/) {
  var args = preprocessArguments('chrome.webRequest.webRequestEventInvoke', arguments, 'chrome.webRequest');

  var requestFilter = new RequestFilterHandler(args.filter);

  this.callback = args.callback;
  this.invoke = function(details) {
    if (!requestFilter.filter(details)) {
      console.debug("Request filtered out " + details.url);
      return;
    }
    return addonAPI.callFunction(this.callback, arguments);
  }
};

var WebRequestEvent = function(eventName, instanceID) {
  Event.call(this, eventName, instanceID);

  this.ListenerRecordConstructor = WebRequestListenerRecord;
}

var EVENT_LIST = ['onAuthRequired',
                  'onBeforeRedirect',
                  'onBeforeRequest',
                  'onBeforeSendHeaders',
                  'onCompleted',
                  'onErrorOccurred',
                  'onHeadersReceived',
                  'onResponseStarted',
                  'onSendHeaders'];
var API_NAME = 'webRequest';
//******************************************************************************
//* main closure
exports.createAPI = function(instanceID) {
  return new (function() {
  //============================================================================
  // private variables


  //============================================================================
  // public methods

  //----------------------------------------------------------------------------
  // chrome.webRequest.handlerBehaviorChanged
  this.handlerBehaviorChanged = function(callback) {
    var args = notImplemented('chrome.webRequest.handlerBehaviorChanged', arguments);
  };

  //============================================================================
  // events

  EventFactory.createEventsEx(this, instanceID, API_NAME, EVENT_LIST, WebRequestEvent);

  //============================================================================
  //============================================================================
  // main initialization

})();
}

exports.releaseAPI = function(instanceID) {
  EventFactory.releaseEvents(instanceID, API_NAME, EVENT_LIST);
}
