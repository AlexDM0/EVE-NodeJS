/**
 * Created by Alex on 4/24/14.
 */


var agentBase = require("../agentBase.js");
module.exports = agentBase(glowStep);

/****
 * Agent code below here:
 */

 /*
 this.send
 this.publish
 this.subscribe
 this.unsubscribe
 this.schedule
 this.clearSchedule // new
 this.repeat
 this.stopRepeating


 this.setColor // r,g,b
 this.agents = [] // up to date position array of agents
  */


var glowStep = {RPCfunctions: {}};

glowStep.init = function () {
  this.activeState = false;
  this.blocked = false;
  this.scheduledTimer = this.schedule(this.activate, 5000 + Math.random * 15000);
};

glowStep.activate = function() {
  if (this.activeState == false) {
    this.setColor(0,255,0);
    this.activeState = true;
    this.sendToNeighbours({method:'resetTimer',params:{},callback:null});
    this.schedule(this.deactivate, 3000);
  }
}

glowStep.deactivate = function() {
  if (this.activeState == true) {
    this.setColor(0,0,0);
    this.activeState = false;
    this.resetTimer();
  }
}

glowStep.resetTimer = function() {
  this.clearSchedule(this.scheduledTimer);
  this.scheduledTimer = this.schedule(this.activate, 5000 + Math.random * 15000);
}

glowStep.steppedOn = function() {
  if (this.activeState == false) {
    this.blocked = true;
    this.setColor(255,0,0);
  }
  else {
    this.RPCfunctions.flash({r:255,g:255,b:255},null);
    this.sendToNeighbours({method:'flash',params:{r:255,g:255,b:255},callback:null});

    var address = this.agents[Math.floor(Math.random() * this.agents.length)].agentName;
    this.send(address,{method:'activate',params:null,callback:null});
    this.deactivate();
  }
};

glowStep.steppedOff = function() {
  this.blocked = false;
  this.deactivate();
}



glowStep.RPCfunctions.resetTimer = function(params,callback) {
  this.resetTimer();
}

glowStep.RPCfunctions.activate = function(params,callback) {
  if (this.blocked == false) {
    this.activate();
  }
}

glowStep.RPCfunctions.flash = function(params,callback) {
  this.setColor(params.r,params.g,params.b);
  this.schedule(this.deactivate,50);
}







