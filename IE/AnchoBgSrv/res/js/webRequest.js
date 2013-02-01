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

function WebRequestListenerRecord(/*callback, filter, opt_extraInfoSpec*/) {
  debugger;
  var args = preprocessArguments('chrome.webRequest.webRequestEventInvoke', arguments, 'chrome.webRequest');

  this.callback = args.callback;
  this.invoke = function() {
    console.info("HANDLER CALLED ");
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
