/**
 * Created by Alex on 4/24/14.
 */

var util = require("../util");

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
    return newAgent;
  };
}

module.exports = AgentBase;