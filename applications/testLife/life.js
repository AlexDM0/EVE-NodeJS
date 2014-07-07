/**
 * Created by Alex on 4/24/14.
 */
var Eve = require('evejs').eve;
//
//agent1 = "0";
//
//var eveOptions = {
//  transports: [
//    {protocol: "http"}
//  ]
//  ,
//  agents: [
//    {agentClass: "./agents/agent1.js", name: agent1}
//  ]
//};
//
//var myEve = new Eve(eveOptions);


var gridWidth = 10;
var gridHeight = gridWidth;
var maxCycles = 10;
var gameOfLifeAgents = [];
//var states =
//  "-----" +
//  "-----" +
//  "-+++-" +
//  "-----" +
//  "-----";
var states = "";
for (var i = 0; i < gridWidth*gridHeight; i++) {
  var state = '-';
  if (Math.random() < 0.2) {
    state = '+';
  }
  gameOfLifeAgents.push({
    agentClass: './agents/gameOfLifeAgent.js',
    name: "Agent_" + i,
    options:{width:gridWidth, height:gridHeight, alive:states[i] || state, maxCycles:maxCycles}
  })
}

gameOfLifeAgents.push({
  agentClass:'./agents/gameOfLifeManager.js',
  name: "manager",
  options:{width:gridWidth, height:gridHeight}
})


var eveOptions = {
  transports: [
//    {protocol: "p2p"}
    {protocol: "http",options: {port: 3000,path: "agents/"}}
  ]
  ,
  agents: gameOfLifeAgents
};
var eve = new Eve(eveOptions);

var manager = eve.agents['manager'];
console.log("gridSize:", gridWidth, "x",gridHeight, ", with ", maxCycles, 'cycles');
setTimeout(function() {manager.start.call(manager);}, 50);

