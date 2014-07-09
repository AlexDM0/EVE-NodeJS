/**
 * Created by Alex on 4/24/14.
 */

/****
 * Agent code below here:
 */
var agentImplementation = {RPCfunctions: {}};

agentImplementation.init = function () {
  console.log(this.agentName + " added");
  var me = this;
  this.schedule(this.sendMessageToSelf,10);
  this.repeat(function() {me.publish("topic","hello");},1000);
  this.subscribe("topic",function(data) {console.log("from sub:",data);});
  this.schedule(this.stopRepeatingAll,5000);
};


agentImplementation.RPCfunctions.add = function (params, callback) {
  return params.a + params.b;
};


agentImplementation.sendMessageToSelf = function () {
  this.send(this.agentName, {method: "add", params: {a: 71, b: 12} },
    function (answer) {
      console.log('I have the answer (', this.agentName, ')', answer.result, answer.error, answer.id, answer);
    });
};

module.exports = agentImplementation;