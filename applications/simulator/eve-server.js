/**
 * Created by Alex on 4/24/14.
 */

//var codein = require("node-codein");
var Eve = require('Evejs');

var eveOptions = {
  transports: [
    {protocol: "p2p"},
    {
      protocol: "http",
      options: {
        port: 3000,
        path: "agents/"
      }
    }
  ],
  agents: [
    {agentClass: "./agents/games/admin", name: "admin"}
  ],
  agentModules: [
    "publishSubscribe",
    "./agents/agentModules/glowstepModule",
    "./agents/agentModules/localizationModule",
    "./agents/agentModules/simulationModule"
  ]

};

var myEve = new Eve(eveOptions);
