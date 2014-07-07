

/****
 * Agent code below here:
 */
var gameOfLifeManager = {RPCfunctions: {}};

gameOfLifeManager.init = function (eve) {
  console.log(this.agentName + " added");
  this.startTimer = 0;
  this.amountOfAgents = this.options.width * this.options.height;
  this.finishedCount = 0;
  this.eve = eve;
};


gameOfLifeManager.RPCfunctions.end = function(params,callback) {
  callback({result:'ok', error:0});
  this.finishedCount += 1;
  if (this.finishedCount == this.amountOfAgents) {
    var timeElapsed = new Date().getTime() - this.startTimer;
    if ("http" in this.eve.transports) { // shutdown server
      this.eve.sendCallCounter *= 2; // 1 http call is a json back and forth: 2 RPC
    }
    console.log("Total time:", timeElapsed, "ms");
    console.log("Transport Type:",this.eve.defaultTransport, " total amount of calls: ", this.eve.sendCallCounter);
    console.log("calls per second: ", Math.round(this.eve.sendCallCounter/(0.001*timeElapsed)));
    if ("http" in this.eve.transports) { // shutdown server
      this.eve.transports['http'].server.close();
    }
  }
}

gameOfLifeManager.start = function () {
  this.startTimer = new Date().getTime();
  for (var i = 0; i < this.amountOfAgents; i++) {
    this.send("Agent_" + i,
      {method:'start', params:{}},
      null
      );
  }
};


var agentBase = require("./agentBase.js");
module.exports = agentBase(gameOfLifeManager);
