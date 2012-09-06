/******************************************************************************
 * storage.js
 * Part of Ancho browser extension framework
 * Implements aji.storage
 * Copyright 2012 Salsita software (http://www.salsitasoft.com).
 ******************************************************************************/
  
//******************************************************************************
//* requires
var Event = require("Event.js").Event;
  
//******************************************************************************
//* main closure
(function(me){
  //============================================================================
  // private variables
  

  //============================================================================
  // public properties
    
  me.sync = null;
  me.local = null;
  //============================================================================
  // events
    
  me.onChanged = new Event();

  //============================================================================
  //============================================================================
  // main initialization


}).call(this, exports);