/**
 * Created by Alex on 4/24/14.
 */




/****
 * Agent code below here:
 */


var firefly = {RPCfunctions: {}};

firefly.init = function () {
  console.log(this.agentName + " added");
  this.currentColor = "off";
  this.fadeCounter = 0;
  this.threshold = 1000;
  this.charge = Math.random() * this.threshold;

  var mainLoopInterval = 10;
  this.repeat(this.mainLoop, mainLoopInterval);
  this.subscribe("lightOn",this.sync);
};

firefly.mainLoop = function() {
  if (this.charge >= this.threshold) {
    this.setColor(0,255,0);
    this.currentColor = "green";
    this.publish("lightOn",{id:this.agentName});
    this.fadeCounter = 10;
    this.charge = 0;
  }

  if (this.currentColor != 'off' && this.fadeCounter == 0) {
    this.setColor(0,0,0);
    this.currentColor = "off";
  }
  if (this.fadeCounter > 0) {
    this.fadeCounter -= 1;
  }

  this.charge += (0.05*this.threshold+1) - (0.05*this.charge);
  this.charge = Math.round(this.charge);
};


firefly.steppedOn = function() {
};

firefly.sync = function(data) {
  if (this.agentName != data.id) {
    this.charge += 2;
  }
};

module.exports = firefly;