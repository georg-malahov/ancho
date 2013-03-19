var apiName = 'chrome.storage';

//------------------------------------------------------------
//          Types extracted for chrome.storage
//------------------------------------------------------------
var types = [
  {
    "id": "StorageChange",
    "properties": {
      "newValue": {
        "id": "newValue",
        "required": false,
        "type": "any"
      },
      "oldValue": {
        "id": "oldValue",
        "required": false,
        "type": "any"
      }
    },
    "type": "object"
  },
  {
    "id": "StorageArea",
    "type": "object"
  }
]

//------------------------------------------------------------
//          Methods extracted for chrome.storage
//------------------------------------------------------------
var methods = [
  { "id": "get",
    "items": [
      {
        "id" : "keys",
        "type": [
            "string",
            {
              "items": "string",
              "type": "array"
            },
            "object"
          ]
      },
      {
        "id": "callback",
        "required": true,
        "type": "function"
      }
    ],
    "type": "functionArguments"
  }, { 
    "id": "getBytesInUse",
    "items": [
      {
        "id" : "keys",
        "type": [
            "string",
            {
              "items": "string",
              "type": "array"
            }
          ]
      },
      {
        "id": "callback",
        "required": true,
        "type": "function"
      }
    ],
    "type": "functionArguments"
  }, { 
    "id": "set",
    "items": [
      {
        "id" : "items",
        "type": "object"
      },
      {
        "id": "callback",
        "required": false,
        "type": "function"
      }
    ],
    "type": "functionArguments"
  }, { 
    "id": "remove",
    "items": [
      {
        "id" : "keys",
        "type": [
            "string",
            {
              "items": "string",
              "type": "array"
            }
          ]
      },
      {
        "id": "callback",
        "required": false,
        "type": "function"
      }
    ],
    "type": "functionArguments"
  }, { 
    "id": "clear",
    "items": [
      {
        "id": "callback",
        "required": false,
        "type": "function"
      }
    ],
    "type": "functionArguments"
  }];


var typeChecking = require("typeChecking.js");
var validatorManager = typeChecking.validatorManager;

for (var i = 0; i < types.length; ++i) {
  validatorManager.addSpecValidatorWrapper(apiName + '.' + types[i].id, types[i]);
}

for (var i = 0; i < methods.length; ++i) {
  validatorManager.addSpecValidatorWrapper(apiName + '.' + 'StorageArea' + '.' + methods[i].id, methods[i]);
}


