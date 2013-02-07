/******************************************************************************
 * tabs.js
 * Part of Ancho browser extension framework
 * Implements chrome.tabs
 * Copyright 2012 Salsita software (http://www.salsitasoft.com).
 ******************************************************************************/

//******************************************************************************
//* requires
var Event = require("events.js").Event;

exports.EventFactory = {

  /**
   * Creates specified event objects by invoking provided event constructor
   **/
  createEventsEx: function(targetAPI, instanceID, apiName, eventNames, EventConstructor) {
    for (i = 0; i < eventNames.length; ++i) {
      targetAPI[eventNames[i]] = new EventConstructor(apiName + '.' + eventNames[i], instanceID);
    }
  },

  /**
   * Creates specified event objects by invoking default event constructor
   **/
  createEvents: function(targetAPI, instanceID, apiName, eventNames) {
    this.createEventsEx(targetAPI, instanceID, apiName, eventNames, Event);
  },

  releaseEvents: function(instanceID, apiName, eventNames) {
    for (i = 0; i < eventNames.length; ++i) {
      addonAPI.removeEventObject(apiName + '.' + eventNames[i], instanceID);
    }
  }
};


//Type checking utilities - instanceof and typeof are not working well when used
//on objects from different script dispach instances

exports.isFunction = function(aArg) {
  return Object.prototype.toString.call(aArg) === '[object Function]'
    || aArg.constructor.toString().match('function Function');
}

exports.isObject = function(aArg) {
  return typeof (aArg) == 'object' && !exports.isFunction(aArg);
}

exports.isString = function(aArg) {
  return typeof(aArg) === 'string' || Object.prototype.toString.call(aArg) === '[object String]';
}

exports.isInteger = function(aArg) {
  return (typeof(aArg) === 'number') && (Math.ceil(aArg) === aArg);
}

exports.isNumber = function(aArg) {
  return (typeof (aArg) === 'number');
}

exports.isArray = function(aArg) {
  //Interface checking is probably only safe way to determine if aArg is array like object
  return aArg != undefined
    && aArg != null
    && !exports.isString(aArg)
    && ("length" in aArg)
    && ("push" in aArg);
  //This is not usable for array like objects: return Object.prototype.toString.call(aArg) === '[object Array]';
}

exports.typeName = function(aArg) {
  if (aArg === undefined) {
    return undefined;
  }

  var typeCheckers = {
    'function': exports.isFunction,
    'number': exports.isNumber,
    'string': exports.isString,
    'array': exports.isArray
  };

  for (var checker in typeCheckers) {
    if (typeCheckers[checker](aArg)) {
      return checker;
    }
  }
  return typeof (aArg);
}


exports.cleanWhiteSpace = function(aString) {
  if (typeof (aString) != 'string') {
    throw new Error('Expected string instead of :' + exports.typeName(aString));
  }
  return aString.replace(/^\s+|\s+$/g, '');
}


exports.stringColorRepresentation = function(aColor) {
  if (exports.isString(aColor)) {
    if (/#[0-9A-F]{6}/i.exec(aColor)) {
      return aColor;
    }
  } else if (exports.isArray(aColor)){
    if (aColor.length === 3) {
      var str = '#';
      for (var i = 0; i < 3; ++i) {
        var tmp = Math.max(0, Math.min(aColor[i], 255))
        str += tmp.toString(16);
      }
      return str;
    }
  }
  throw new Error('Unsupported color format');
}

/**
 * Url checking routine - chrome url patterns
 **/
exports.matchUrl = function(aUrl, aPattern) {
  if (!exports.isString(aUrl) || !exports.isString(aPattern)) {
    throw new Error("Wrong arguments to 'matchUrl()'");
  }
  if (aPattern == '<all_urls>') {
    return true;
  }
  var regexp = '^' + aPattern.replace(/\*/g, '.*') + '$';
  regexp = new RegExp(regexp);

  return regexp.test(aUrl);
}