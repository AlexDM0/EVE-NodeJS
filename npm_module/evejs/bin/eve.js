/**
 * Created by Alex on 4/24/14.
 */

module.exports = Eve;
var agentBase = require("../lib/agentBase.js");

/**
 *  Eve handles the composition of messages, routing, delivering and implementing callbacks.
 *  p2p and http protocols are supported.
 *  @param {object} options |-{Array of objects}  options.transports
 *                            |_ {protocol: "protocolName"[, options: {transportSpecificOptions}]}
 *                          |-{Array of objects}  options.agents
 *                            |_ {agentClass: "path to *.js to require", name: "agentName"}
 *                          |-[{Array of Strings} options.agentModules]
 *                            |_ strings to require for agent modules
 */
function Eve(options) {
  this.agents = {};
  this.topics = {};
  this.callbacks = {};
  this.callbackTimeout = 1000; // ms
  this.transports = {};
  this.agentModules = options.agentModules;
  this.sendCallCounter = 0; // debug

  // the first transport is the default one.
  this.defaultTransport = options.transports[0].protocol;

  // load the required transports and add them to Eve
  if (options.hasOwnProperty("transports")) {
    for (var i = 0; i < options.transports.length; i++) {
      this.addTransport(options.transports[i]);
    }
  }

  // add agents
  if (options.hasOwnProperty("agents")) {
    for (i = 0; i < options.agents.length; i++) {
      this.addAgent(options.agents[i]);
    }
  }
}

/**
 * This function loads the required transport functions into Eve.
 * The input object contains a protocol and possibly options.
 *
 * @param {object} transport
 */
Eve.prototype.addTransport = function(transport) {
  console.log("Implementing transport protocol:", transport.protocol);
  if (transport.options === undefined) {
    transport.options = {};
  }

  this.transports[transport.protocol] = {};
  var implementation = require("../lib/transports/" + transport.protocol + ".js");
  for (var fn in implementation) {
    if (implementation.hasOwnProperty(fn)) {
      this.transports[transport.protocol][fn] = implementation[fn];
    }
  }

  // launching the init function runs the initial config of the transport layer
  this.transports[transport.protocol].init(transport.options, this);
};


/**
 * This function loads the agent implementation from the filename and initializes it.
 *
 * @param {object} agentDescription | {agentClass: "path to *.js to require", name: "agentName"}
 */
Eve.prototype.addAgent = function(agentDescription) {
  var agentName = agentDescription.name;
  var agentImplementation = agentDescription.agentClass;
  var options = agentDescription.options || {};

  if (this.agents[agentName] !== undefined) {
    console.log("ERROR: ", agentName, " already exists!");
  }
  else {
    this.callbacks[agentName] = {};
    var agent = agentBase(require("../../../" + agentImplementation));
    this.agents[agentName] = agent(agentName,options, this);

    if (this.agentModules !== undefined) {
      for (var i = 0; i < this.agentModules.length; i++) {
        var module = require("../../../" + this.agentModules[i]);
        module(this.agents[agentName], this);
      }
    }
  }
};


/**
 * Remove an agent specified with the agentId.
 *
 * @param {String} agentName | ID (== name) of agent to delete.
 */
Eve.prototype.removeAgent = function(agentName) {
  this.agents[agentName].stopRepeatingAll();
  this.unsubscribeAgent(agentName,null,null);
  delete this.callbacks[agentName];
  delete this.agents[agentName];
  console.log(agentName, "deleted.");
};


/**
 * once a message has been routed, this function delivers it. This means that the RPC function
 * defined in the method will be called with the params.
 *
 * This is only for direct messages, replies are handled differently.
 *
 * @param message
 * @param agentId
 * @param senderId
 */
Eve.prototype.deliverMessage = function(message, agentId, senderId) {
  var agent = this.agents[agentId];
  if (agent.RPCfunctions[message.method] !== undefined) {
    return {
      result:agent.RPCfunctions[message.method].apply(agent,[message.params, senderId]),
      error:0
    };
  }
  else {
    console.log("This agent (" + agentId + ") does not have function: ", message.method);
    return {
      result:"This agent (" + agentId + ") does not have function: " + message.method,
      error:1
    };
  }
};


/**
 * If a callback message is received, it is delivered as a reply to the correct agent.
 * Once the callback has been executed, the callback is removed.
 *
 * @param {object} reply   | reply json object: {result: *, error: 0 || 1}
 * @param {String} agentId | agentId (== agant name) of the agent who sent the original JSON-RPC call
 */
Eve.prototype.deliverReply = function (reply, agentId) {
  if (this.callbacks[agentId] !== undefined) {
    // if a callback function was bound to the reply of this message id, run it once.
    if (this.callbacks[agentId][reply.id] !== undefined) {
      this.callbacks[agentId][reply.id].call(this.agents[agentId], reply);
      delete this.callbacks[agentId][reply.id];
    }
  }
};


/**
 * This function determines the transport protocol based on the address prefix.
 * If there is no prefix (as denoted as everything before ://), the default transport is used.
 * It also adds a callback (if it is supplied) to listen for a reply on this message.
 *
 * @param address  | with or without prefix
 * @param message  | json RPC
 * @param senderId | without prefix
 * @param callback | function, null or undefined
 */
Eve.prototype.sendMessage = function(address, message, senderId, callback) {
  this.sendCallCounter += 1;
  var me = this;
  var transportType, receiverAddress;
  if (address.indexOf("://") != -1) {
    receiverAddress = address;
    transportType = address.substring(0,4).replace(":","");
  }
  else {
    transportType = this.defaultTransport;
    receiverAddress = this.transports[this.defaultTransport].prefix + address;
  }

  // only register callback if the message is not a response, also add a timeout to the callback
  if (message["method"] !== undefined && callback !== undefined && callback !== null) {
    this.callbacks[senderId][message.id] = callback;
    setTimeout(function() {me.timeoutCallback(senderId, message.id)}, this.callbackTimeout);
  }

  process.nextTick(function() {me.transports[transportType].sendMessage(receiverAddress, message, senderId);});
};


/**
 * This times out a callback. It is removed from the list.
 *
 * @param {String} agentId   | agentId (== agant name) of the agent who sent the original JSON-RPC call
 * @param {String} messageId | unique ID of the message, used to keep track of the 'conversation'
 */
Eve.prototype.timeoutCallback = function(agentId, messageId) {
  if (this.callbacks[agentId] !== undefined) {
    // if a callback function was bound to the reply of this message id, delete it.
    if (this.callbacks[agentId][messageId] !== undefined) {
      delete this.callbacks[agentId][messageId];
    }
  }
};


/**
 * This function looks for the agent that is addressed by this message. If the message is published (agentId = *),
 * it is delivered to the subscribers.
 *
 * @param {Object} message   | JSON-RPC object
 * @param {String} agentId   | agentId (== agant name) of the agent who is the recipient of the message
 * @returns {boolean}        | message delivered (false for published)
 */
Eve.prototype.routeMessage = function(message, agentId) {
  if (agentId == "*") {
    // if an agent in this eve has subscribed to this topic, deliver it
    if (this.topics[message.topic] !== undefined) {
      this.deliverToSubscribers(message.topic, message.data);
    }
    return false;
  }
  else {
    if (this.agents[agentId] !== undefined) {
      return true;
    }
    else {
      return false;
    }
  }
};


/**** publish/subscribe functions: ****/

/**
 * This function delivers a published message to its subscribers.
 *
 * @param {String} topic    | Topic name
 * @param {object} message  | JSON message
 */
Eve.prototype.deliverToSubscribers = function(topic, message) {
  for (var agentId in this.topics[topic].agents) {
    var callbacks = this.topics[topic].agents[agentId].callbacks;
    for (var i = 0; i < callbacks.length; i++) {
      var agent = this.agents[agentId];
      var callback = callbacks[i];
      callback.apply(agent, [message]);
    }
  }
};


/**
 * Subscribe an agent to a topic. The callback is fired when something is published on the topic.
 *
 * @param {String}   agentId  | Id of agent to subscribe
 * @param {String}   topic    | Topic name
 * @param {function} callback | Function to handle the data published to the topic
 */
Eve.prototype.subscribeAgent = function(agentId, topic, callback) {
  // if no topic, create topic
  if (this.topics[topic] === undefined) {
    this.topics[topic] = {agents: {}, subscriberCount:0};
  }

  // if agent has not subscribed to this topic before, create agent slot
  if (this.topics[topic][agentId] === undefined) {
    this.topics[topic].agents[agentId] = {callbacks:[]};
  }

  // add the callback to the topic
  this.topics[topic].agents[agentId].callbacks.push(callback);

  // one more subscriber to this topic.
  this.topics[topic].subscriberCount += 1;
};


/**
 * Remove a subscription
 *
 * @param agentId
 * @param topic
 * @param [callback]
 * @returns {boolean}
 */
Eve.prototype.unsubscribeAgent = function(agentId, topic, callback) {
  // unsubscribe agent from all topics and cleanup
  if (topic === null || topic === undefined) {
    for (var topicName in this.topics) {
      if (this.topics[topicName].agents[agentId] !== undefined) {
        delete this.topics[topicName].agents[agentId];
        this.topics[topicName].subscriberCount -= 1;

        if (this.topics[topicName].subscriberCount == 0) {
          delete this.topics[topicName];
        }
      }
    }
    return;
  }

  // no agents are subscribed to this topic: return aborts execution of the rest of the function
  if (!topic   in this.topics)               {return;}
  if (!agentId in this.topics[topic].agents) {return;}

  // the agent has only subscribed to the topic with one callback.
  if (this.topics[topic].agents[agentId].callbacks.length == 1 || callback === undefined || callback == null) {
    delete this.topics[topic].agents[agentId];

    // one subscriber less to this topic
    this.topics[topic].subscriberCount -= 1;

    // if this was the last agent to unsubscribe, we can delete the topic.
    if (this.topics[topic].subscriberCount == 0) {
      delete this.topics[topic];
    }
  }
  else {
    // if there are more than one callbacks, delete the first match.
    for (var i = 0; i < this.topics[topic].agents[agentId].callbacks.length; i++) {
      if (this.topics[topic].agents[agentId].callbacks[i] == callback) {
        this.topics[topic].agents[agentId].callbacks.splice(i,1);
        break;
      }
    }
  }
  return;
};
