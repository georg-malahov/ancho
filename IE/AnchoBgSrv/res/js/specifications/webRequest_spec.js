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
        "type": {
          "items": "enumerated",
          "type": "array"
        }
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

var typeChecking = require("typeChecking.js");
var validatorManager = typeChecking.validatorManager;

for (var i = 0; i < types.length; ++i) {
  validatorManager.addSpecValidatorWrapper(apiName + '.' + types[i].id, types[i]);
}

for (var i = 0; i < methods.length; ++i) {
  validatorManager.addSpecValidatorWrapper(apiName + '.' + methods[i].id, methods[i]);
}
