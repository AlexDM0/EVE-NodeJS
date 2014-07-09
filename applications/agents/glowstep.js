/**
 * Created by Alex on 4/24/14.
 */

/****
 * Agent code below here:
 */


var glowStep = {RPCfunctions: {}};

glowStep.init = function () {
  console.log(this.agentName + " added");

  this.lightColor = "black";
  this.colors = [ "black",
    "white",
    "red",
    "orange",
    "yellow",
    "green",
    "cyan",
    "blue",
    "purple",
    "pink"
  ];
  var mainLoopInterval = 1000;
  this.repeat(this.mainLoop, mainLoopInterval);
};

glowStep.mainLoop = function () {
  if (Date.now() - this.timeSinceChange > 2500) {
    this.lightColor = "black";
  }
};

glowStep.sendToNeighbours = function(message,callback) {
  var thresholdDistance = this.agents[Math.round(0.25 * this.agents.length)].r;
  for (var i = 0; i < this.agents.length; i++) {
    if (this.agents[i].r > thresholdDistance) {
      break;
    }
    else {
      this.send(this.agents[i].name, message, callback);
    }
  }
};

glowStep.steppedOn = function() {
  var newColor = this.colors[Math.floor(1 + Math.random()*9)];
  while (this.lightColor == newColor) { // unique color
    newColor = this.colors[Math.floor(Math.random()*10)];
  }
  this.lightColor = newColor;
  this.timeSinceChange = Date.now();
  this.sendToNeighbours({method:"setColor",params:{color:newColor}});
};


// these functions are callable from other agents
glowStep.RPCfunctions.setColor = function (params, callback) {
  this.lightColor = params.color;
  this.timeSinceChange = Date.now();
  return this.lightColor;
};


module.exports = glowStep;