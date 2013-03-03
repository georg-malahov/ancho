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

/**
 * RequestFilterHandler - check if request fulfills specification of event handler
 * aFilter : chrome.webRequest.RequestFilter
 **/
function RequestFilterHandler(aFilter) {
  var filterData = aFilter;
  this.filter = function(aRequestDetails) {
    passed = false;
    for (var i = 0; !passed && i < filterData.urls.length; ++i) {
      passed = (matchUrl(aRequestDetails.url, filterData.urls[i]));
    }
    if (!passed) {
      return false;
    }

    //Filter types
    if (filterData.types) {
      passed = false;
      for (var i = 0; !passed && i < filterData.types.length; ++i) {
        passed = (filterData.types[i] == aRequestDetails.type);
      }
      if (!passed) {
        return false;
      }
    }

    if (filterData.tabId && aRequestDetails.tabId != filterData.tabId) {
      return false;
    }

    //TODO - filter by windowId - not provided in request details
    return true;
  }
}

/**
 * WebRequestListenerRecord - webRequest specialization of event listener wrapper
 * takes additional arguments - filter and opt_extraInfoSpec
 **/
function WebRequestListenerRecord(/*eventName, callback, filter, opt_extraInfoSpec*/) {
  var args = preprocessArguments('chrome.webRequest.webRequestEventInvoke', arguments, 'chrome.webRequest');
  var eventName = args.eventName;
  var requestFilter = new RequestFilterHandler(args.filter);

  this.callback = args.callback;
  this.invoke = function(details) {
    if (!requestFilter.filter(details)) {
      console.debug("Request event " + eventName + " was filtered out :" + details.url);
      return;
    }
    return addonAPI.callFunction(this.callback, arguments);
  }
};

/**
 * Event object for webRequest API - derived from basic Event object
 **/
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
