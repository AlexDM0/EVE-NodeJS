var http = require('http');


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


  // get agent id from the full address.
  getAgentId : function(address) {
    return address.replace(this.prefix,"");
  },


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
      headers: {'X-Eve-SenderUrl' : this.prefix + senderId}
    };

    var me = this;
    var req = http.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (response) {
        me.eve.deliverReply(JSON.parse(response),senderId);
      });
    });

    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
    });

    // write data to request body
    req.write(JSON.stringify(message));
    req.end();
  },

  initiateServer : function() {
    // Configure our HTTP server to respond with Hello World to all requests.
    var me = this;
    this.server = http.createServer(function (request, response) {
      me.processRequest(request, response);
    });

    // Listen on port 8000, IP defaults to 127.0.0.1
    this.server.listen(this.port);

    // Put a friendly message on the terminal
    console.log("Server listening at http://127.0.0.1:" + this.port + this.path);
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
    if (url.substr(0,pathLength) == this.path) {
      var agentId = url.substr(pathLength);
      var senderId = request.headers['x-eve-senderurl'];
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
        message.params['_senderId'] = me.getAgentId(senderId);
        var recipientFound = me.eve.routeMessage(message, agentId);
        if (recipientFound == true) {
          // if this message is not a response (has a "method" method)
          if ("method" in message) {
            var callback;
            if (me.eve.callbacks[agentId][message.id] !== undefined) {
              callback = function(data) {
                data['id'] = message['id'];
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(data));
              };
            }
            else {
              response.writeHead(200, {'Content-Type': 'application/json'});
              response.end(JSON.stringify({result: "ok", error: 0}));
              callback = function(data) {};
            }
            me.eve.deliverMessage(message, agentId , callback);
          }
        }
        else if (agentId == "*") {
          response.writeHead(200, {'Content-Type': 'application/json'});
          response.end(JSON.stringify({result: "Published to topic: " + message.topic, error: 0}));
        }
        else {
          response.writeHead(200, {'Content-Type': 'application/json'});
          response.end(JSON.stringify({result: "Agent not found", error: 404}));
        }
      });
    }
  }
};

module.exports = HTTPImplementation;