/**
 * Created by Alex on 4/24/14.
 */

//var codein = require("node-codein");
var Eve = require('evejs').eve;

var eveOptions = {
  transports: [
//    {protocol: "p2p"}
    {
      protocol: "http",
      options: {
        port: 3000,
        path: "agents/"
      }
    }
  ],
  agents: [
    {agentClass: "./agents/agent1.js", name: "test"}
  ]
};
var eve = new Eve(eveOptions);
