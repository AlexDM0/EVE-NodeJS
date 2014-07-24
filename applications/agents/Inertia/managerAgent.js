/**
 * Created by Alex on 7/23/14.
 */

var managerAgent = {RPCfunctions: {}};


// mandatory init function
managerAgent.init = function(Eve) {
  this.eve = Eve;
}

managerAgent.RPCfunctions.agentExists = function(params) {
  var agentName = params.name;
  if (this.eve.agents[agentName] !== undefined) {
    return "yes";
  }
  else {
    var newAgent = {agentClass: "./agents/Inertia/deviceAgent", name: agentName};
    this.eve.addAgent.call(this.eve, newAgent);
    return "created";
  }
}


module.exports = managerAgent;