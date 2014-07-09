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
    var senderAddress = this.prefix + senderId;
    var agentId = this.getAgentId(receiverAddress);

    if (this.eve.agents[agentId] !== undefined) {
      if (message["method"] !== undefined) { // if this message is not a response (has a "method" method)
        var agent = this.eve.agents[agentId];
        var reply = this.eve.deliverMessage(message, agentId, senderId);
        if (reply.result !== undefined) {
          agent.send(senderAddress, data, null, message.id);
        }
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