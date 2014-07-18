/**
 * Created by Alex on 4/24/14.
 */

/****
 * Agent code below here:
 */
/*
 this.send
 this.publish
 this.subscribe
 this.unsubscribe
 this.schedule
 this.clearSchedule
 this.repeat
 this.stopRepeating


 this.setColor // r,g,b
 this.agents = [] // up-to-date position array of agents
 this.agentName // agentID
 */


var glowStep = {RPCfunctions: {}};

// mandatory function
glowStep.init = function () {
  this.currentColor = "off";
};

// mandatory function
glowStep.steppedOn = function() {
  if (this.currentColor == "red") {
    this.setColor(0,255,0);
    this.currentColor = "green";
  }
  else if (this.currentColor == "green") {
    this.setColor(0,0,255);
    this.currentColor = "blue";
  }
  else { // blue or off
    this.setColor(255,0,0);
    this.currentColor = "red";
  }
};

// mandatory function
glowStep.steppedOff = function () {

};


module.exports = glowStep;