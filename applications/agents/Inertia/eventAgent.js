/**
 * Created by Alex on 7/23/14.
 */

var eventAgent = {RPCfunctions: {}};

eventAgent.init = function() {
  // mandatory init function
  this.sensorType = "";
  this.data = {};
  this.dataTypes = {};


}

eventAgent.RPCfunctions.receiveEvent = function(params) {
  var event = params.event;
  this.sensorType = event['typeof'];

  for (var i = 0; i < event.ioTProperty.length; i++) {
    var ioTProperty = event.ioTProperty[i];
    if (this.data[ioTProperty.name] === undefined) {
      this.data[ioTProperty.name] = [];
    }
    if (this.dataTypes[ioTProperty.name] === undefined) {
      this.dataTypes[ioTProperty.name] = ioTProperty.unitOfMeasurement.value;
    }
    var data = {
      dataPoint: ioTProperty.ioTStateObservation[0].value,
      startTime: ioTProperty.ioTStateObservation[0].phenomenonTime,
      resultTime: ioTProperty.ioTStateObservation[0].resultTime
    }
    this.data[ioTProperty.name].push({data:data, token:0});
  }

  return {name: this.agentName, type: this.sensorType, data: this.data};
}


module.exports = eventAgent;