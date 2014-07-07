/**
 * Created by Alex on 4/24/14.
 */

/****
 * Agent code below here:
 */
var agentImplementation = {RPCfunctions: {}};

agentImplementation.init = function () {
  console.log(this.agentName + " added");
  this.schedule(this.RPCfunctions.sendMessageToSelf,10);
  this.schedule(this.stopRepeatingAll,5000);
};


agentImplementation.RPCfunctions.add = function (params, callback) {
  callback({result: params.a + params.b, error:0 });
};


agentImplementation.RPCfunctions.sendMessageToSelf = function () {
  this.send(this.agentName, {method: "add", params: {a: 71, b: 12} },
    function (answer) {
      console.log('I have the answer (', this.agentName, ')', answer.result, answer.error, answer.id, answer);
    });
};

var agentBase = require("./agentBase.js");
module.exports = agentBase(agentImplementation);