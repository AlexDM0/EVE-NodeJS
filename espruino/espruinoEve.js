
/**
 * Created by Alex on 4/24/14.
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
      console.log('I have the answer (', this.agentName, ')', answer.result, answer.error);
    });
};


var util = {};

/**
 * Create a semi UUID
 * 9e17 is close to max of var
 * @return {String} uuid
 */
util.getUID = function () {
  return Math.floor(Math.random() * 9e17).toString(36);
};

util.getType = function (object) {
  if (object === null) {
    return "null";
  }
  else if (object === undefined) {
    return "undefined";
  }
  else if (object.constructor === stringConstructor) {
    return "String";
  }
  else if (object.constructor === arrayConstructor) {
    return "Array";
  }
  else if (object.constructor === objectConstructor) {
    return "Object";
  }
  else {
    return "don't know";
  }
};


/**
 * This function returns a constructor for an agent. It mixes in standard functions all agents can use.
 *
 * @param agentImplementation
 * @returns {Function}
 * @constructor
 */
function AgentBase(agentImplementation) {

  return function(agentName, options, EveSystem) {

    var newAgent = Object.create(agentImplementation);

    // this mixes in utility functions
    // initializing some fields that may be useful
    newAgent.agentName = String(agentName);
    newAgent.options = options;
    newAgent.repeatIds = [];

    // send a message to agent: destination, message is JSON RPC object, callback is fired on callback, message ID used to identify callback.
//    message structure = {
//      address: transportPrefix + agentId,
//      origin: transportPrefix + agentId,
//      content: {
//        id: ###,
//        method: "functionName",
//        params: {}
//      }
//    }
    newAgent.send = function (destination, message, callback, messageId) {
      if (messageId === undefined) {message["id"] = util.getUID();}
      else                         {message['id'] = messageId;}

      EveSystem.sendMessage(destination, message, newAgent.agentName, callback);
    };

//    publish stucture = {
//      address: *,
//      origin: agentId,
//      UID:  ##,
//      content: {
//        topic: topicName,
//        data: {}   String | Number | object
//      }
//    }
    newAgent.publish = function (topic, message) {
      var messageContent = {data:message};
      messageContent["topic"] = topic;
      EveSystem.sendMessage.apply(EveSystem,["*", messageContent, newAgent.agentName, function() {}]);
    };

    // subscribe to a topic with a callback function.
    newAgent.subscribe = function (topic, callback) {
      EveSystem.subscribeAgent.apply(EveSystem,[newAgent.agentName, topic, callback]);
    };

    // unsubscribe from a topic. If the callback is not defined or null, the agent is fully unsubscribed from the topic.
    // if the topic is undefined or null, the agent is unsubscribed from all topics.
    newAgent.unsubscribe = function (topic, callback) {
      EveSystem.unsubscribeAgent.apply(EveSystem,[newAgent.agentName, topic, callback]);
    };

    // unsubscribe from all topics.
    newAgent.unsubscribeAll = function() {
      newAgent.unsubscribe(null,null);
    };

    // do something later
    newAgent.schedule = function(callback, time) {
      if (time == 0 || (typeof time != "number")) {
        setTimeout(callback.apply(newAgent),0);
      }
      else {
        setTimeout(function() { callback.apply(newAgent); }, time);
      }
    };

    // repeat a function. If this function has arguments, wrap it in an anonymous function!
    newAgent.repeat = function(callback, time) {
      if (time == 0 || (typeof time != "number")) {
        console.log("Cannot set repeat without a valid time (in ms).");
        return "";
      }
      else {
        var repeatId = setInterval(function() { callback.apply(newAgent); }, time);
        newAgent.repeatIds.push(repeatId);
        return repeatId;
      }
    };

    // stop repeating a certain repeat
    newAgent.stopRepeating = function (id) {
      clearInterval(id);
      newAgent.repeatIds.splice(newAgent.repeatIds.indexOf(id), 1);
    };

    // stop repeating all repeating functions
    newAgent.stopRepeatingAll = function () {
      for (var i = 0; i < newAgent.repeatIds.length; i++) {
        clearInterval(newAgent.repeatIds[i]);
        newAgent.repeatIds.shift();
        i--;
      }
    };

    // initialize the agent.
    newAgent.init(EveSystem);
    return newAgent;
  };
}




var P2PImplementation = {

  // required init function
  init : function(options, eve) {
    this.eve = eve;
    this.prefix = "p2p://";
  },

  getAgentId : function(address) {
    return address.replace(this.prefix,"");
  },

  receiveMessage : function(receiverAddress, message, senderId) {
    if (message.params === undefined) {
      message.params = {};
    }
    message.params['_senderId'] = senderId;
    var senderAddress = this.prefix + senderId;
    var agentId = this.getAgentId(receiverAddress);

    var recipientFound = this.eve.routeMessage(message, agentId);
    if (recipientFound == true) {
      if (message["method"] !== undefined) { // if this message is not a response (has a "method" method)
        var agent = this.eve.agents[agentId];
        var callback;
        if (this.eve.callbacks[agentId][message.id] !== undefined) {
          callback = function (data) {agent.send(senderAddress, data, null, message.id);};
        }
        else {
          callback = function(data) {};
        }

        this.eve.deliverMessage(message, agentId, callback);
      }
      else {
        this.eve.deliverReply(message, agentId);
      }
    }
  },

  sendMessage : function(receiverAddress, messageContent, senderId) {
    this.receiveMessage(receiverAddress, messageContent, senderId);
  }
};


/**
 *  Eve handles the composition of messages, routing, delivering and implementing callbacks.
 */
function Eve(options) {
  this.agents = {};
  this.topics = {};
  this.callbacks = {};
  this.transports = {};
  this.agentModules = options.agentModules;
  this.sendCallCounter = 0;

  // the first transport is the default one.
  this.defaultTransport = options.transports[0].protocol;

  // load the required transports and add them to Eve
      this.addTransport(options.transports[0]);

  // add agents
  if (options.hasOwnProperty("agents")) {
    for (var i = 0; i < options.agents.length; i++) {
      this.addAgent(options.agents[i]);
    }
  }
}


/**
 * This function loads the required transport functions into eve.
 * The input object contains a protocol and an options object containing a prefix.
 *
 * @param {object} transport
 */
Eve.prototype.addTransport = function(transport) {
  if (transport.options === undefined) {
    transport.options = {};
  }

  this.transports[transport.protocol] = {};
  console.log("Implementing transport protocol:", transport.protocol);
  var implementation = P2PImplementation;
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
 * @param agentDescription
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
    var agent = AgentBase(agentImplementation);
    this.agents[agentName] = agent(agentName,options, this);

    if (this.agentModules !== undefined) {
      for (var i = 0; i < this.agentModules.length; i++) {
        var module = this.agentModules[i];
        module(this.agents[agentName], this);
      }
    }
  }
};


/**
 * Remove an agent specified with the agentId.
 *
 * @param agentName
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
 * defined in the method will be called with the params. The callback is preconstructed and provided
 * to this function.
 *
 * This is only for direct messages, replies are handled differently.
 *
 * @param message
 * @param agentId
 * @param callback
 */
Eve.prototype.deliverMessage = function(message, agentId, callback) {
  var agent = this.agents[agentId];
  if (agent.RPCfunctions[message.method] !== undefined) {
    agent.RPCfunctions[message.method].apply(agent,[message.params,callback]);
  }
  else {
    console.log("This agent (" + agentId + ") does not have function: ", message.method);
  }
};

/**
 * If a callback message is received, it is delivered as a reply to the correct agent.
 * Once the callback has been executed, the callback is removed.
 *
 * @param message
 * @param agentId
 */
Eve.prototype.deliverReply = function (message, agentId) {
  if (this.callbacks[agentId] !== undefined) {
    // if a callback function was bound to the reply of this message id, run it once.
    if (this.callbacks[agentId][message.id] !== undefined) {
      this.callbacks[agentId][message.id].call(this.agents[agentId], message);
      delete this.callbacks[agentId][message.id];
    }
  }
};


/**
 * This function composes (by calling the composeMessage) and sends a message over the required
 * transport layer. It also adds a callback (if it is supplied) to listen for a reply on this message.
 *
 * @param address
 * @param message
 * @param senderId
 * @param callback
 */
Eve.prototype.sendMessage = function(address, message, senderId, callback) {
  this.sendCallCounter += 1;
  var transportType, receiverAddress;
  if (address.indexOf("://") != -1) {
    receiverAddress = address;
    transportType = address.substring(0,4).replace(":","");
  }
  else {
    transportType = this.defaultTransport;
    receiverAddress = this.transports[this.defaultTransport].prefix + address;
  }

  // only register callback if the message is not a response
  if (message["method"] !== undefined && callback !== undefined && callback !== null) {
    this.callbacks[senderId][message.id] = callback;
  }

  var me = this;
  setTimeout(function() {me.transports[transportType].sendMessage(receiverAddress, message, senderId);},0);
};

/**
 * This function looks for the agent that is addressed by this message. If the message is a publish,
 * it is delivered to the subscribers.
 *
 * @param {Object} message | JSON-RPC object
 * @returns {boolean}      | message ends here or not
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
 * @param topic
 * @param message
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
 * @param agentId
 * @param topic
 * @param callback
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
    for (var topicIdx in this.topics) {
      if (this.topics[topicIdx].agents[agentId] !== undefined) {
        delete this.topics[topicIdx].agents[agentId];
        this.topics[topicIdx].subscriberCount -= 1;

        if (this.topics[topicIdx].subscriberCount == 0) {
          delete this.topics[topicIdx];
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

var eveOptions = {
  transports: [
    {protocol: "p2p"}
  ],
  agents: [
    {agentClass: agentImplementation, name: "test"}
  ]
};
var eve = new Eve(eveOptions);
