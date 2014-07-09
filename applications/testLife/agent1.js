/**
 * Created by Alex on 4/24/14.
 */

var Eve = require('evejs');

var eveOptions = {
  transports: [
    {
      protocol: "http",
      options: {
        port: 3000,
        path: "agents/"
      }
    }
  ],
  agents: [
    {agentClass: "./agents/test/agent1.js", name: "test"}
  ]
};
var eve = new Eve(eveOptions);
