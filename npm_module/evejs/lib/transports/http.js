var http = require('http');


/**
 * HTTP Transport layer:
 *
 * transport layers are required to have an "init" and a "sendMessage" function. These are called from Eve.
 *
 * Supported Options:
 *
 * {Number} options.port | Port to listen on.
 * {String} options.path | Path, with or without leading and trailing slash (/)
 *
 * Address: http://127.0.0.1:PORTNUMBER/PATH
 */
var HTTPImplementation = {

  // required init function
  init : function(options, eve) {
    this.eve = eve;
    this.server = "";
    this.port = options.port || 3000;
    this.path = options.path || "agents/";
    if (this.path.slice(-1) != "/") {this.path += "/";}
    if (this.path[0] != "/")        {this.path = "/" + this.path;}

    this.prefix = "http://127.0.0.1:" + this.port + this.path;

    this.initiateServer();
  },

  /**
   *
   * @param receiverAddress
   * @param message
   * @param senderId
   */
  sendMessage : function(receiverAddress, message, senderId) {
    var agentId = this.getAgentId(receiverAddress);
    var host = receiverAddress.substr(7);
    var portIndex = host.indexOf(":");
    host = host.substr(0,portIndex);

    var options = {
      host: host,
      port: this.port,
      path: this.path + agentId,
      method: 'POST',
      headers: {
                'X-Eve-SenderUrl' : this.prefix + senderId, // used to get senderID
                'Content-type'    : "application/json"
               }
    };

    var me = this;
    var request = http.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (response) {
        me.eve.deliverReply(JSON.parse(response),senderId);
      });
    });

    request.on('error', function(e) {
      console.log('Problem with sendMessage to ' + receiverAddress + ': ' + e.message);
    });

    // write data to request body
    request.write(JSON.stringify(message));
    request.end();
  },


  /**
   *  Get agent id from the full address, if and only if the address is the prefix.
   */
  getAgentId : function(address) {
    return address.replace(this.prefix,"");
  },

  /**
   *  Configure a HTTP server listener
   */
  initiateServer : function() {
    if (this.server === undefined) {
      var me = this;
      this.server = http.createServer(function (request, response) {
        if (request.method == 'OPTIONS') {
          var headers = {};
          headers["Access-Control-Allow-Origin"] = "*";
          headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
          headers["Access-Control-Allow-Credentials"] = true;
          headers["Access-Control-Max-Age"] = '86400'; // 24 hours
          headers["Access-Control-Allow-Headers"] = "X-Requested-With, Access-Control-Allow-Origin, X-HTTP-Method-Override, Content-Type, Authorization, Accept";
          // respond to the request
          response.writeHead(200, headers);
          response.end();
        }
        else if (request.method == "POST") {
          me.processRequest(request, response);
        }
      });

      // Listen on port 8000, IP defaults to 127.0.0.1
      this.server.listen(this.port);

      // Put a friendly message on the terminal
      console.log("Server listening at http://127.0.0.1:" + this.port + this.path);
    }
    else {
      this.server.close();
      this.server = undefined;
      this.initiateServer();
    }
  },

  /**
   * This is the HTTP equivalent of receiveMessage.
   *
   * @param request
   * @param response
   */
  processRequest : function(request, response) {
    var url = request.url;
    var pathLength = this.path.length;
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Credentials"] = true;
    headers["Content-Type"] = 'application/json';
    if (url.substr(0,pathLength) == this.path) {
      var agentId = url.substr(pathLength);
      var senderId = this.getAgentId(request.headers['x-eve-senderurl']);
      var body = "";
      var me = this;
      request.on('data', function (data) {
        body += data;
        if (body.length > 1e6) {        // 1e6 == 1MB
          request.connection.destroy(); // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
        }
      });

      request.on('end', function () {
        var message = JSON.parse(body);
        response.writeHead(200, headers);
        var recipientFound = me.eve.routeMessage(message, agentId);
        if (recipientFound == true) {
          // if this message is not a response (has a "method" method)
          if ("method" in message) {
            var reply = me.eve.deliverMessage(message, agentId, senderId);
            if (reply.result !== undefined) {
              reply['id'] = message['id'];
              response.end(JSON.stringify(reply));
            }
            else {
              response.end(JSON.stringify({result: "No return value.", error: 0, id: message['id']}));
            }
          }
          else {
            response.end(JSON.stringify({result: "No method in message. Invalid JSON-RPC.", error: 1, id: message['id']}));
          }
        }
        else if (agentId == "*") {
          response.end(JSON.stringify({result: "Published to topic: " + message.topic, error: 0}));
        }
        else {
          response.end(JSON.stringify({result: "Agent not found", error: 404}));
        }
      });
    }
  }
};

module.exports = HTTPImplementation;