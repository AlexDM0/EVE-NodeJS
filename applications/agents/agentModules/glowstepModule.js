/**
 * Created by Alex on 4/24/14.
 */

module.exports = glowstepModule;

/**
 * This function returns a constructor for an agent. It mixes in standard functions all agents can use.
 *
 * @param agentImplementation
 * @returns {Function}
 * @constructor
 */
function glowstepModule(newAgent, EveSystem) {

  newAgent.lightColor = '0,0,0';

  newAgent.RPCfunctions.steppedOn = function (params) {
    this.steppedOn();
    return this.lightColor;
  };

  newAgent.setColor = function (r, g, b) {
    this.lightColor = r + ',' + g + ',' + b;
  };

  return newAgent;
}
