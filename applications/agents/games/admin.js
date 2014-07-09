/****
 * Agent code below here:
 */
var agentImplementation = {RPCfunctions: {}};

agentImplementation.init = function (Eve) {
  console.log(this.agentName + " added");
  this.eve = Eve;
};

agentImplementation.RPCfunctions.ping = function () {
  return "pong";
};


agentImplementation.RPCfunctions.addAgent = function (params) {
  console.log(params)
  this.eve.addAgent.call(this.eve, params);
  return "Agent Added.";
};

agentImplementation.RPCfunctions.removeAgents = function () {
  for (var agentId in this.eve.agents) {
    if (this.eve.agents.hasOwnProperty(agentId)) {
      if (agentId != this.agentName) {
        this.eve.removeAgent.call(this.eve,agentId);
      }
    }
  }
  return "Agent Eliminated.";
};

agentImplementation.RPCfunctions.getStates = function () {
  var result = {};
  for (var agentId in this.eve.agents) {
    if (this.eve.agents.hasOwnProperty(agentId)) {
      if (agentId != "admin") {
        result[agentId] = {
          color: this.eve.agents[agentId].lightColor,
          x: this.eve.agents[agentId]._x,
          y: this.eve.agents[agentId]._y
        }
      }
    }
  }
  return result;
};

agentImplementation.RPCfunctions.connectNodes = function () {
  var agents = [];
  for (var agentId in this.eve.agents) {
    if (agentId != "admin") {
      agents.push(agentId);
    }
  }

  for (var i = 0; i < agents.length; i++) {
    var connected = 0;
    var agent = this.eve.agents[agents[i]];
    var connectedAgents = [];
    while (agent._connectedNodes.length < 15 && agent._connectedNodes.length < 0.75 * agents.length) {
      var agent2Id = agents[i];
      var unique = false;
      while (agents[i] == agent2Id || unique == false) {
        agent2Id = agents[Math.floor(Math.random() * agents.length)];
        unique = true;
        for (var j = 0; j < agent._connectedNodes.length; j++) {
          if (agent._connectedNodes[j].id == agent2Id) {
            unique = false;
          }
        }
      }
      var agent2 = this.eve.agents[agent2Id];
      var noiseFactor = 0.5;
      var realDistance = Math.sqrt(Math.pow(agent.x - agent2.x, 2) + Math.pow(agent.y - agent2.y, 2));
      var noiseDistance = realDistance * (1 + (Math.random() - 0.5) * noiseFactor);
      agent2.RPCfunctions.connectedToNode.call(agent2, {
        id: agent.agentName,
        x: agent._x,
        y: agent._y,
        r: noiseDistance
      }, null);
      agent.RPCfunctions.connectedToNode.call(agent, {
        id: agent2.agentName,
        x: agent2._x,
        y: agent2._y,
        r: noiseDistance
      }, null);
      connected += 1;
      console.log("agent:", agent.agentName, " is connected to: ", agent2.agentName);
      connectedAgents.push(agent2Id);
    }
    agent.repeat(agent._updateConnectedNodes, 250);
  }


  return "connected";
};

module.exports = agentImplementation;