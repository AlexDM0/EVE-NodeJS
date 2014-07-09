/**
 * Created by Alex on 4/24/14.
 */

var publishPortal = {RPCfunctions: {}};

publishPortal.init = function (Eve) {
  this.eve = Eve;
};


publishPortal.RPCfunctions.publish = function (params) {
  var topic = params.topic;
  if (this.eve.agents["_topicAgent_" + topic] !== undefined) {
    this.send("p2p://_topicAgent_" + topic, {method:'incoming',params:params,id:0}, null);
  }
};


module.exports = publishPortal;