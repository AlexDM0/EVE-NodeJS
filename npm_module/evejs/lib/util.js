
var util = {};

/**
 * Create a semi UUID
 * 9e17 is close to max of var
 * @return {String} uuid
 */
util.getUID = function() {
  return Math.floor(Math.random() * 9e17).toString(36);
}

util.getType = function(object) {
  if (object === null) {
    return "null";
  }
  else if (object === undefined) {
    return "undefined";
  }
  else if (object.constructor === stringConstructor) {
    return "String";
  }
  else if (object.constructor === arrayConstructor) {
    return "Array";
  }
  else if (object.constructor === objectConstructor) {
    return "Object";
  }
  else {
    return "don't know";
  }
}

module.exports = util;