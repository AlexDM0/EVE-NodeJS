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
  this.changeTime = this.getTime();
  this.timeoutThreshold = 1000;
  this.repeat(this.mainLoop,100);
};

glowStep.mainLoop = function () {
  if (this.getTime() - this.changeTime > this.timeoutThreshold) {
    this.setColor(0,0,0);
    this.currentColor = "off";
  }
}

// mandatory function
glowStep.steppedOn = function() {
  if (this.currentColor == "red") {
    this.setColor(0,255,0);
    this.currentColor = "green";
    this.changeTime = this.getTime();
  }
  else if (this.currentColor == "green") {
    this.setColor(0,0,255);
    this.currentColor = "blue";
    this.changeTime = this.getTime();
  }
  else { // blue or off
    this.setColor(255,0,0);
    this.currentColor = "red";
    this.changeTime = this.getTime();
  }
};

// mandatory function
glowStep.steppedOff = function () {

};


module.exports = glowStep;