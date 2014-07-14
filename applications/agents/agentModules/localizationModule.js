/**
 * Created by Alex on 4/24/14.
 */
module.exports = localizationModule;

/**
 * This function returns a constructor for an agent. It mixes in standard functions all agents can use.
 *
 * @param agentImplementation
 * @returns {Function}
 * @constructor
 */
function localizationModule(newAgent, EveSystem) {

  /** position Data & functions **/
  newAgent._connectedNodes = [];
  newAgent._fx = 0;
  newAgent._fy = 0;
  newAgent._vx = 100;
  newAgent._vy = 0;
  newAgent._x  = Math.random()*400+600;
  newAgent._y  = Math.random()*400+500;
  newAgent.gravityConstant = 100;
  newAgent.agents = [];
  newAgent.simulationCountdown = 10;

  /**
   * This function sends a message to all its connected nodes to tell them its new position.
   * @private
   */
  newAgent._updateConnectedNodes = function () {
    for (var i = 0; i < this._connectedNodes.length; i++) {
      this.send(this._connectedNodes[i].id,
        {method: "connectedToNode",
          params: {
            id: this.agentName,
            x: this._x,
            y: this._y,
            r: this._connectedNodes[i].r
          }
        }
        , null, null);
    }
  };

  /**
   * This function is called if a node either wants to connect or update its connected node with new position.
   * @param params
   * @param callback
   */
  newAgent.RPCfunctions.connectedToNode = function (params) {
    var alreadyConnected = false;
    for (var i = 0; i < this._connectedNodes.length; i++) {
      if (this._connectedNodes[i].id == params.id) {
        this._connectedNodes[i].x = params.x;
        this._connectedNodes[i].y = params.y;
        if (params.override) {
          this._connectedNodes[i].r = params.r;
        }
        alreadyConnected = true;
        break;
      }
    }
    if (alreadyConnected == false) {
      this._connectedNodes.push({
        id: params.id,
        x: params.x,
        y: params.y,
        r: this._convertToDistance(params.r)
      });
    }

    if (this.simulationCountdown > 0) {
      this.simulationCountdown -= 1;
    }
    else {
      this._calculateSpringForces();
    }
  };

  /**
   * newAgent function can be used to convert RSSI values to linear distances
   *
   * @param r
   * @returns {*}
   * @private
   */
  newAgent._convertToDistance = function (r) {
    return r;
  };

  /**
   * This function calculates the forces exerted by each of its neighbours on it and takes a step.
   * Once the step is taken, the position is updated and is published to the rest of the agents.
   * @private
   */
  newAgent._calculateSpringForces = function () {
    var edgeLength;
    var dx, dy, springForce, distance;

    this._fx = 0;
    this._fy = 0;

    dx = 500 - this._x;
    dy = 600 - this._y;
    distance = Math.sqrt(dx * dx + dy * dy);
    var gravityForce = (distance == 0) ? 0 : (this.gravityConstant / distance);
    this._fx = dx * gravityForce;
    this._fy = dy * gravityForce;

    // forces caused by the edges, modelled as springs
    for (var i = 0; i < this._connectedNodes.length; i++) {
      var node = this._connectedNodes[i];
      edgeLength = node.r;

      dx = node.x - this._x;
      dy = node.y - this._y;
      distance = Math.sqrt(dx * dx + dy * dy);

      if (distance == 0) {
        distance = 0.00001;
      }

      // the 1/distance is so the fx and fy can be calculated without sine or cosine.
      springForce = 0.4 * (edgeLength - distance) / distance; //  0.5 == springconstant

      this._fx -= dx * springForce;
      this._fy -= dy * springForce;
    }

    this._discreteStep();
    this._publishPosition();
  };


  /**
   * This takes a discrete step with damping and a max velocity limitation
   * @private
   */
  newAgent._discreteStep = function () {
    var interval = 0.025;
    var damping = 0.8;
    var maxVelocity = 60;

    var dx, dy, ax, ay;

    dx = damping * this._vx;                 // damping force
    ax = (this._fx - dx);                    // acceleration (mass at 1)
    this._vx += ax * interval;               // velocity
    this._vx = (Math.abs(this._vx) > maxVelocity) ? ((this._vx > 0) ? maxVelocity : -maxVelocity) : this._vx;
    this._x += this._vx * interval;          // position

    dy = damping * this._vy;                 // damping force
    ay = (this._fy - dy);                    // acceleration (mass at 1)
    this._vy += ay * interval;               // velocity
    this._vy = (Math.abs(this._vy) > maxVelocity) ? ((this._vy > 0) ? maxVelocity : -maxVelocity) : this._vy;
    this._y += this._vy * interval;         // position
  };


  /**
   * this publishes the IMAGINARY position to the other agents. Imaginary means the position the node thinks it is at.
   * @private
   */
  newAgent._publishPosition = function () {
    this.publish("positionData", {name: this.agentName, x: this._x, y: this._y});
  };

  /**
   * This processes the updated IMAGINARY position data. Imaginary means the position the node thinks it is at.
   * This function is called when a publishPosition of another node comes in.
   * @param data
   * @private
   */
  newAgent._processPositionData = function (data) {
    if (data.name != this.agentName) {
      var unknownAgent = true;
      var distance = Math.sqrt(Math.pow(this._x - data.x, 2) + Math.pow(this._y - data.y, 2));
      for (var i = 0; i < this.agents.length; i++) {
        if (data.name == this.agents[i].name) {
          unknownAgent = false;
          this.agents[i].x = data.x;
          this.agents[i].y = data.y;
          this.agents[i].r = distance;
          break;
        }
      }
      if (unknownAgent == true) {
        this.agents.push({name: data.name, x: data.x, y: data.y, r: distance});
      }
    }

    this.agents.sort(function (a, b) {
      return a.r - b.r;
    });
  };


  // init, function will be executed as if it was in the agent. It will not be stored in the agent.
  this.init = function() {}
  this.init.apply(newAgent);

  return newAgent;
}

