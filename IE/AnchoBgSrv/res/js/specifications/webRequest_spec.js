var apiName = 'chrome.webRequest';


//------------------------------------------------------------
//          Types extracted for chrome.webRequest
//------------------------------------------------------------
var types = [
  {
    "id": "RequestFilter",
    "properties": {
      "tabId": {
        "id": "tabId",
        "required": false,
        "type": "integer"
      },
      "types": {
        "id": "types",
        "required": false,
        "items": { /*fixed manually*/
            "enum": [
              "main_frame",
              "sub_frame",
              "stylesheet",
              "script",
              "image",
              "object",
              "xmlhttprequest",
              "other"
            ],
            "type": "enumerated string"
        },
        "type": "array"
      },
      "urls": {
        "id": "urls",
        "required": true,
        "type": {
          "items": "string",
          "type": "array"
        }
      },
      "windowId": {
        "id": "windowId",
        "required": false,
        "type": "integer"
      }
    },
    "type": "object"
  },
  {
    "id": "HttpHeaders",
    "type": {
      "items": "object",
      "type": "array"
    }
  },
  {
    "id": "BlockingResponse",
    "properties": {
      "authCredentials": {
        "id": "authCredentials",
        "required": false,
        "type": "object"
      },
      "cancel": {
        "id": "cancel",
        "required": false,
        "type": "boolean"
      },
      "redirectUrl": {
        "id": "redirectUrl",
        "required": false,
        "type": "string"
      },
      "requestHeaders": {
        "id": "requestHeaders",
        "required": false,
        "type": "HttpHeaders"
      },
      "responseHeaders": {
        "id": "responseHeaders",
        "required": false,
        "type": "HttpHeaders"
      }
    },
    "type": "object"
  },
  {
    "id": "UploadData",
    "properties": {
      "bytes": {
        "id": "bytes",
        "required": false,
        "type": "any"
      },
      "file": {
        "id": "file",
        "required": false,
        "type": "string"
      }
    },
    "type": "object"
  }
];

//------------------------------------------------------------
//          Methods extracted for chrome.webRequest
//------------------------------------------------------------
  var methods = [
  {
    "id": "handlerBehaviorChanged",
    "items": [
      {
        "id": "callback",
        "required": false,
        "type": "function"
      }
    ],
    "type": "functionArguments"
  },
  //Added manually
  {
    "id": "webRequestEventInvoke",
    "items": [
      {
        "id": "eventName",
        "required": true,
        "type": "string"
      },
      {
        "id": "callback",
        "required": true,
        "type": "function"
      },
      {
        "id": "filter",
        "required": true,
        "type": "RequestFilter"
      },
      {
        "id": "opt_extraInfoSpec",
        "required": false,
        "type": {
          "items": "string",
          "type": "array"
        }
      }
    ],
    "type": "functionArguments"
  }
];

//------------------------------------------------------------
//          Event object types for chrome.webRequest
//------------------------------------------------------------
  var eventTypes = [
  {
    "id": "onBeforeRequest.details",
    "properties": {
      "error": {
        "id": "error",
        "required": false,
        "type": "string"
      },
      "formData": {
        "id": "formData",
        "required": false,
        "type": "object"
      },
      "frameId": {
        "id": "frameId",
        "required": true,
        "type": "integer"
      },
      "method": {
        "id": "method",
        "required": true,
        "type": "string"
      },
      "parentFrameId": {
        "id": "parentFrameId",
        "required": true,
        "type": "integer"
      },
      "raw": {
        "id": "raw",
        "required": false,
        "type": {
          "items": "UploadData",
          "type": "array"
        }
      },
      "requestBody": {
        "id": "requestBody",
        "required": false,
        "type": "object"
      },
      "requestId": {
        "id": "requestId",
        "required": true,
        "type": "string"
      },
      "tabId": {
        "id": "tabId",
        "required": true,
        "type": "integer"
      },
      "timeStamp": {
        "id": "timeStamp",
        "required": true,
        "type": "double"
      },
      "type": {
        "id": "type",
        "required": true,
        "type": {
          "enum": [
            "main_frame",
            "sub_frame",
            "stylesheet",
            "script",
            "image",
            "object",
            "xmlhttprequest",
            "other"
          ],
          "type": "enumerated string"
        }
      },
      "url": {
        "id": "url",
        "required": true,
        "type": "string"
      }
    },
    "required": true,
    "type": "object"
  },
  {
    "id": "onBeforeSendHeaders.details",
    "properties": {
      "frameId": {
        "id": "frameId",
        "required": true,
        "type": "integer"
      },
      "method": {
        "id": "method",
        "required": true,
        "type": "string"
      },
      "parentFrameId": {
        "id": "parentFrameId",
        "required": true,
        "type": "integer"
      },
      "requestHeaders": {
        "id": "requestHeaders",
        "required": false,
        "type": "HttpHeaders"
      },
      "requestId": {
        "id": "requestId",
        "required": true,
        "type": "string"
      },
      "tabId": {
        "id": "tabId",
        "required": true,
        "type": "integer"
      },
      "timeStamp": {
        "id": "timeStamp",
        "required": true,
        "type": "double"
      },
      "type": {
        "id": "type",
        "required": true,
        "type": {
          "enum": [
            "main_frame",
            "sub_frame",
            "stylesheet",
            "script",
            "image",
            "object",
            "xmlhttprequest",
            "other"
          ],
          "type": "enumerated string"
        }
      },
      "url": {
        "id": "url",
        "required": true,
        "type": "string"
      }
    },
    "required": true,
    "type": "object"
  },
  {
    "id": "onSendHeaders.details",
    "properties": {
      "frameId": {
        "id": "frameId",
        "required": true,
        "type": "integer"
      },
      "method": {
        "id": "method",
        "required": true,
        "type": "string"
      },
      "parentFrameId": {
        "id": "parentFrameId",
        "required": true,
        "type": "integer"
      },
      "requestHeaders": {
        "id": "requestHeaders",
        "required": false,
        "type": "HttpHeaders"
      },
      "requestId": {
        "id": "requestId",
        "required": true,
        "type": "string"
      },
      "tabId": {
        "id": "tabId",
        "required": true,
        "type": "integer"
      },
      "timeStamp": {
        "id": "timeStamp",
        "required": true,
        "type": "double"
      },
      "type": {
        "id": "type",
        "required": true,
        "type": {
          "enum": [
            "main_frame",
            "sub_frame",
            "stylesheet",
            "script",
            "image",
            "object",
            "xmlhttprequest",
            "other"
          ],
          "type": "enumerated string"
        }
      },
      "url": {
        "id": "url",
        "required": true,
        "type": "string"
      }
    },
    "required": true,
    "type": "object"
  },
  {
    "id": "onHeadersReceived.deails",
    "properties": {
      "frameId": {
        "id": "frameId",
        "required": true,
        "type": "integer"
      },
      "method": {
        "id": "method",
        "required": true,
        "type": "string"
      },
      "parentFrameId": {
        "id": "parentFrameId",
        "required": true,
        "type": "integer"
      },
      "requestId": {
        "id": "requestId",
        "required": true,
        "type": "string"
      },
      "responseHeaders": {
        "id": "responseHeaders",
        "required": false,
        "type": "HttpHeaders"
      },
      "statusLine": {
        "id": "statusLine",
        "required": false,
        "type": "string"
      },
      "tabId": {
        "id": "tabId",
        "required": true,
        "type": "integer"
      },
      "timeStamp": {
        "id": "timeStamp",
        "required": true,
        "type": "double"
      },
      "type": {
        "id": "type",
        "required": true,
        "type": {
          "enum": [
            "main_frame",
            "sub_frame",
            "stylesheet",
            "script",
            "image",
            "object",
            "xmlhttprequest",
            "other"
          ],
          "type": "enumerated string"
        }
      },
      "url": {
        "id": "url",
        "required": true,
        "type": "string"
      }
    },
    "required": true,
    "type": "object"
  },
  {
    "id": "onAuthRequired.details",
    "properties": {
      "challenger": {
        "id": "challenger",
        "required": true,
        "type": "object"
      },
      "frameId": {
        "id": "frameId",
        "required": true,
        "type": "integer"
      },
      "host": {
        "id": "host",
        "required": true,
        "type": "string"
      },
      "isProxy": {
        "id": "isProxy",
        "required": true,
        "type": "boolean"
      },
      "method": {
        "id": "method",
        "required": true,
        "type": "string"
      },
      "parentFrameId": {
        "id": "parentFrameId",
        "required": true,
        "type": "integer"
      },
      "port": {
        "id": "port",
        "required": true,
        "type": "integer"
      },
      "realm": {
        "id": "realm",
        "required": false,
        "type": "string"
      },
      "requestId": {
        "id": "requestId",
        "required": true,
        "type": "string"
      },
      "responseHeaders": {
        "id": "responseHeaders",
        "required": false,
        "type": "HttpHeaders"
      },
      "scheme": {
        "id": "scheme",
        "required": true,
        "type": "string"
      },
      "statusLine": {
        "id": "statusLine",
        "required": false,
        "type": "string"
      },
      "tabId": {
        "id": "tabId",
        "required": true,
        "type": "integer"
      },
      "timeStamp": {
        "id": "timeStamp",
        "required": true,
        "type": "double"
      },
      "type": {
        "id": "type",
        "required": true,
        "type": {
          "enum": [
            "main_frame",
            "sub_frame",
            "stylesheet",
            "script",
            "image",
            "object",
            "xmlhttprequest",
            "other"
          ],
          "type": "enumerated string"
        }
      },
      "url": {
        "id": "url",
        "required": true,
        "type": "string"
      }
    },
    "required": true,
    "type": "object"
  },
  {
    "id": "onResponseStarted.details",
    "properties": {
      "frameId": {
        "id": "frameId",
        "required": true,
        "type": "integer"
      },
      "fromCache": {
        "id": "fromCache",
        "required": true,
        "type": "boolean"
      },
      "ip": {
        "id": "ip",
        "required": false,
        "type": "string"
      },
      "method": {
        "id": "method",
        "required": true,
        "type": "string"
      },
      "parentFrameId": {
        "id": "parentFrameId",
        "required": true,
        "type": "integer"
      },
      "requestId": {
        "id": "requestId",
        "required": true,
        "type": "string"
      },
      "responseHeaders": {
        "id": "responseHeaders",
        "required": false,
        "type": "HttpHeaders"
      },
      "statusCode": {
        "id": "statusCode",
        "required": true,
        "type": "integer"
      },
      "statusLine": {
        "id": "statusLine",
        "required": false,
        "type": "string"
      },
      "tabId": {
        "id": "tabId",
        "required": true,
        "type": "integer"
      },
      "timeStamp": {
        "id": "timeStamp",
        "required": true,
        "type": "double"
      },
      "type": {
        "id": "type",
        "required": true,
        "type": {
          "enum": [
            "main_frame",
            "sub_frame",
            "stylesheet",
            "script",
            "image",
            "object",
            "xmlhttprequest",
            "other"
          ],
          "type": "enumerated string"
        }
      },
      "url": {
        "id": "url",
        "required": true,
        "type": "string"
      }
    },
    "required": true,
    "type": "object"
  },
  {
    "id": "onBeforeRedirect.details",
    "properties": {
      "frameId": {
        "id": "frameId",
        "required": true,
        "type": "integer"
      },
      "fromCache": {
        "id": "fromCache",
        "required": true,
        "type": "boolean"
      },
      "ip": {
        "id": "ip",
        "required": false,
        "type": "string"
      },
      "method": {
        "id": "method",
        "required": true,
        "type": "string"
      },
      "parentFrameId": {
        "id": "parentFrameId",
        "required": true,
        "type": "integer"
      },
      "redirectUrl": {
        "id": "redirectUrl",
        "required": true,
        "type": "string"
      },
      "requestId": {
        "id": "requestId",
        "required": true,
        "type": "string"
      },
      "responseHeaders": {
        "id": "responseHeaders",
        "required": false,
        "type": "HttpHeaders"
      },
      "statusCode": {
        "id": "statusCode",
        "required": true,
        "type": "integer"
      },
      "statusLine": {
        "id": "statusLine",
        "required": false,
        "type": "string"
      },
      "tabId": {
        "id": "tabId",
        "required": true,
        "type": "integer"
      },
      "timeStamp": {
        "id": "timeStamp",
        "required": true,
        "type": "double"
      },
      "type": {
        "id": "type",
        "required": true,
        "type": {
          "enum": [
            "main_frame",
            "sub_frame",
            "stylesheet",
            "script",
            "image",
            "object",
            "xmlhttprequest",
            "other"
          ],
          "type": "enumerated string"
        }
      },
      "url": {
        "id": "url",
        "required": true,
        "type": "string"
      }
    },
    "required": true,
    "type": "object"
  },
  {
    "id": "onCompleted.details",
    "properties": {
      "frameId": {
        "id": "frameId",
        "required": true,
        "type": "integer"
      },
      "fromCache": {
        "id": "fromCache",
        "required": true,
        "type": "boolean"
      },
      "ip": {
        "id": "ip",
        "required": false,
        "type": "string"
      },
      "method": {
        "id": "method",
        "required": true,
        "type": "string"
      },
      "parentFrameId": {
        "id": "parentFrameId",
        "required": true,
        "type": "integer"
      },
      "requestId": {
        "id": "requestId",
        "required": true,
        "type": "string"
      },
      "responseHeaders": {
        "id": "responseHeaders",
        "required": false,
        "type": "HttpHeaders"
      },
      "statusCode": {
        "id": "statusCode",
        "required": true,
        "type": "integer"
      },
      "statusLine": {
        "id": "statusLine",
        "required": false,
        "type": "string"
      },
      "tabId": {
        "id": "tabId",
        "required": true,
        "type": "integer"
      },
      "timeStamp": {
        "id": "timeStamp",
        "required": true,
        "type": "double"
      },
      "type": {
        "id": "type",
        "required": true,
        "type": {
          "enum": [
            "main_frame",
            "sub_frame",
            "stylesheet",
            "script",
            "image",
            "object",
            "xmlhttprequest",
            "other"
          ],
          "type": "enumerated string"
        }
      },
      "url": {
        "id": "url",
        "required": true,
        "type": "string"
      }
    },
    "required": true,
    "type": "object"
  },
  {
    "id": "onErrorOccurred.details",
    "properties": {
      "error": {
        "id": "error",
        "required": true,
        "type": "string"
      },
      "frameId": {
        "id": "frameId",
        "required": true,
        "type": "integer"
      },
      "fromCache": {
        "id": "fromCache",
        "required": true,
        "type": "boolean"
      },
      "ip": {
        "id": "ip",
        "required": false,
        "type": "string"
      },
      "method": {
        "id": "method",
        "required": true,
        "type": "string"
      },
      "parentFrameId": {
        "id": "parentFrameId",
        "required": true,
        "type": "integer"
      },
      "requestId": {
        "id": "requestId",
        "required": true,
        "type": "string"
      },
      "tabId": {
        "id": "tabId",
        "required": true,
        "type": "integer"
      },
      "timeStamp": {
        "id": "timeStamp",
        "required": true,
        "type": "double"
      },
      "type": {
        "id": "type",
        "required": true,
        "type": {
          "enum": [
            "main_frame",
            "sub_frame",
            "stylesheet",
            "script",
            "image",
            "object",
            "xmlhttprequest",
            "other"
          ],
          "type": "enumerated string"
        }
      },
      "url": {
        "id": "url",
        "required": true,
        "type": "string"
      }
    },
    "required": true,
    "type": "object"
  }
];




var typeChecking = require("typeChecking.js");
var validatorManager = typeChecking.validatorManager;

for (var i = 0; i < types.length; ++i) {
  validatorManager.addSpecValidatorWrapper(apiName + '.' + types[i].id, types[i]);
}

for (var i = 0; i < methods.length; ++i) {
  validatorManager.addSpecValidatorWrapper(apiName + '.' + methods[i].id, methods[i]);
}

for (var i = 0; i < eventTypes.length; ++i) {
  validatorManager.addSpecValidatorWrapper(apiName + '.' + eventTypes[i].id, eventTypes[i]);
}
