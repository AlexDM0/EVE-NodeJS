/**
 * Created by Alex on 7/9/14.
 */

/**
 * Created by Alex on 4/24/14.
 */

module.exports = pubSub;

/**
 * This function returns a constructor for an agent. It mixes in standard functions all agents can use.
 *
 * @param agentImplementation
 * @returns {Function}
 * @constructor
 */
function pubSub(newAgent, EveSystem) {

  if (EveSystem.transports['p2p'] === undefined) {
    EveSystem.addTransport.call(EveSystem, {protocol:"p2p"});
  }

  newAgent.publish = function (topic, data) {
    // create publish portal agent
    if (EveSystem.agents["_publishPortal"] === undefined) {
      var agent = {agentClass:"_publishPortal", name:"_publishPortal"};
      EveSystem.addAgent(agent, true);
    }

    // create topic agent
    if (EveSystem.agents["_topicAgent_" + topic] === undefined) {
      var agent = {agentClass:"_topicAgent", name:"_topicAgent_" + topic, options: {topic:topic}};
      EveSystem.addAgent(agent, true);
    }

    // send to publishPortal
    var messageContent = {method:"publish", params:{data: data, topic: topic}, id:0};
    this.send("p2p://_publishPortal", messageContent, null);
  };

  // subscribe to a topic with a callback function.
  newAgent.subscribe = function (topic, callback) {
    if (EveSystem.agents["_topicAgent_" + topic] === undefined) {
      var agent = {agentClass:"_topicAgent", name:"_topicAgent_" + topic, options: {topic:topic}}
      EveSystem.addAgent(agent, true);
    }

    var messageContent = {method:"subscribe", params:{callback: callback}, id:0};
    this.send("p2p://_topicAgent_" + topic, messageContent, null);
  };

  // unsubscribe from a topic. If the callback is not defined or null, the agent is fully unsubscribed from the topic.
  // if the topic is undefined or null, the agent is unsubscribed from all topics.
  newAgent.unsubscribe = function (topic, callback) {
    if (EveSystem.agents["_topicAgent_" + topic] !== undefined) {
      var messageContent = {method:"unsubscribe", params:{callback: callback}, id:0};
      this.send("p2p://_topicAgent_" + topic, messageContent, null);
    }
  };

  // unsubscribe from all topics.
  newAgent.unsubscribeAll = function() {
    if (EveSystem.agents["_topicAgent_" + topic] !== undefined) {
      var messageContent = {method:"unsubscribe", params:{callback: null}, id:0};
      this.send("p2p://_topicAgent_" + topic, messageContent, null);
    }
  };

  return newAgent;
}
