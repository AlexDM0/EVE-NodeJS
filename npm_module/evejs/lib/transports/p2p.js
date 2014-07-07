/**
 * Created by Alex on 4/24/14.
 */
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

module.exports = P2PImplementation;