/**
 * Created by Alex on 4/24/14.
 */

module.exports = simulationModule;

/**
 * This function returns a constructor for an agent. It mixes in standard functions all agents can use.
 *
 * @param agentImplementation
 * @returns {Function}
 * @constructor
 */
function simulationModule(newAgent, EveSystem) {

  newAgent.x = 0;
  newAgent.y = 0;

  /**
   * This function can be called by the simulator if a user moves a node.
   *
   * @param params
   * @param callback
   */
  newAgent.RPCfunctions.setPosition = function (params, callback) {
    this.x = params.x;
    this.y = params.y;
    if (params.initialSetup != true) {
      this._publishRealPosition();
    }
    callback({result:"message received", error:0});
  };


  /**
   * This function is called by the GUI to draw the springs
   * @param params
   * @param callback
   */
  newAgent.RPCfunctions.getConnectedNodes = function(params,callback) {
    callback({result:this._connectedNodes, error:0});
  }

  /**
   * this publishes the REAL position to the other agents. Real is ground truth. This is used to get an RSSI estimate.
   * @private
   */
  newAgent._publishRealPosition = function () {
    this.publish("realPositionData",{name:this.agentName, x:this.x, y:this.y});
  }


  /**
   * this processes the real position data. This updates the real distance from node to node which is used to get an
   * simulated RSSI like distance indication.
   * @param data
   * @private
   */
  newAgent._processRealPositionData = function(data) {
    if (data.name != this.agentName) {
      var distance = Math.sqrt(Math.pow(this.x-data.x,2) + Math.pow(this.y-data.y,2));
      var noiseFactor = 0.5;
      var noiseDistance = distance * (1 + (Math.random()-0.5)*noiseFactor);
      var alreadyConnected = false;
      // we check if the node is connected to this node. If it is, update the distance (r).
      for (var i = 0; i < this._connectedNodes.length; i++) {
        if (this._connectedNodes[i].id == data.name) {
          this._connectedNodes[i].r = noiseDistance;
          console.log("updated DISTANCE")
          alreadyConnected = true;
          break;
        }
      }
      // since the connection is mutual, we have to send it back.
      if (alreadyConnected == true) {
        noiseDistance = distance * (1 + (Math.random()-0.5)*noiseFactor);
        this.send(data.name,{method:"connectedToNode",
            params: {
              id:this.agentName,
              x:this._x,
              y:this._y,
              r:this._convertToDistance(noiseDistance),
              override:true
            }
          }
          ,null,null);
      }
    }
  }

  return this;
}
