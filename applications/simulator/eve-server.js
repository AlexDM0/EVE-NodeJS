/**
 * Created by Alex on 4/24/14.
 */

//var codein = require("node-codein");
var Eve = require('evejs');

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
    {agentClass: "./agents/games/admin.js", name: "admin"}
  ],
  agentModules: [
    "./agents/agentModules/glowstepModule.js",
    "./agents/agentModules/localizationModule.js",
    "./agents/agentModules/simulationModule.js"
  ]

};

var myEve = new Eve(eveOptions);
