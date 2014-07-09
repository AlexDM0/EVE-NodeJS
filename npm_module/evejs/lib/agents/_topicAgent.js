/**
 * Created by Alex on 4/24/14.
 */

var topicAgent = {RPCfunctions: {}};

topicAgent.init = function (Eve) {
  this.topic = this.options.topic;
  this.subscribers = {};
  this.subscriberCount = 0;
  this.eve = Eve;
};

topicAgent.RPCfunctions.incoming = function (params) {
  var data = params.data;
  for (var agentId in this.subscribers) {
    var agent = this.eve.agents[agentId];
    if (agent === undefined) {
      delete this.subscribers[agentId]
    }
    else {
      for (var i = 0; i < this.subscribers[agentId].length; i++) {
        this.subscribers[agentId][i].call(agent,data);
      }
    }
  }
};

topicAgent.RPCfunctions.subscribe = function (params, agentId) {
  var callback = params.callback;
  this.subscriberCount += 1;
  if (this.subscribers[agentId] === undefined) {
    this.subscribers[agentId] = [];
  }
  this.subscribers[agentId].push(callback);
};

topicAgent.RPCfunctions.unsubscribe = function (params, agentId) {
  var callback = params.callback;
  if (this.subscribers[agentId] !== undefined) {
    // the agent has only subscribed to the topic with one callback.
    if (this.subscribers[agentId].length == 1 || callback === undefined || callback == null) {
      delete this.subscribers[agentId];
      this.subscriberCount -= 1;
    }
    else {
      // if there are more than one callbacks, delete the first match.
      for (var i = 0; i < this.subscribers[agentId].length; i++) {
        if (this.subscribers[agentId][i] == callback) {
          this.subscribers[agentId].splice(i,1);
          break;
        }
      }
    }
  }
};


module.exports = topicAgent;