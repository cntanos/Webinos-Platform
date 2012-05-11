/*******************************************************************************
*  Code contributed to the webinos project
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* Copyright 2011 Habib Virji, Samsung Electronics (UK) Ltd
* Copyright 2011 Alexander Futasz, Fraunhofer FOKUS
*******************************************************************************/

/**
* @description Session common has functions that are used by both Pzh and Pzp
* @author <a href="mailto:habib.virji@samsung.com">Habib Virji</a>
*/
var dns = require("dns");
var net = require("net");
var path = require("path");
var fs = require("fs");
var os = require("os");

var writeError = [];
var message = "";

var session_common = exports;

var validation   = require("./session_schema");


session_common.debug = function(num, msg) {
	"use strict";
	var info = true; // Change this if you want no prints from session manager
	var debug = true;

	if(num === "ERROR" || num === 1) {
		console.log("ERROR: " + msg);
	} else if((num === "INFO" || num === 2) & info) {
		console.log("INFO: " + msg);
	} else if((num === "DEBUG" || num === 3) && debug) {
		console.log("DEBUG: " + msg);
	}
};

session_common.debugPzh = function(id, type, msg) {
	var info = true; // Change this if you want no prints from session manager

	if (id !== null && typeof id !== "undefined" && typeof writeError[id] === "undefined"){
		var filepath = session_common.webinosConfigPath();
		var filename = path.join(filepath+"/logs/", id+".json");
		try{
			fs.exists(filename, function(status){
				// If file does not exist, we create it , create write stream does not create file directly :) ..
				if (!status) {
					fs.writeFile(filename, function(){
						writeError[id] = fs.createWriteStream(filename, { flags: "a", encoding:"utf8"});
					});
				} else {
					writeError[id] = fs.createWriteStream(filename, { flags: "a", encoding:"utf8"});
				}
			});

		} catch (err){
			console.log("Error Initializing logs" + err);
		}
	}

	if (typeof writeError[id] !== "undefined" && type === "ERROR") {
		writeError[id].write(msg);
	}

	if(type === "ERROR" || type === 1) {
		console.log("ERROR: " + msg);
	} else if((type === "INFO" || type === 2) & info) {
		console.log("INFO: " + msg);
	} else if((type === "DEBUG" || type === 3)) {
		console.log("DEBUG: " + msg);
	}
};
/**
 * @description: returns root path of .webinos folder. In this folder all information is stored.
 */
session_common.webinosConfigPath = function() {
	"use strict";
	var webinosDemo;
	switch(os.type().toLowerCase()){
		case "windows_nt":
			webinosDemo = path.resolve(process.env.appdata + "/webinos/");
			break;
		case "linux":
			switch(os.platform().toLowerCase()){
				case "android":
					webinosDemo = path.resolve(process.env.EXTERNAL_STORAGE + "/.webinos/");
					break;
				case "linux":
					webinosDemo = path.resolve(process.env.HOME + "/.webinos/");
					break;
			}
			break;
		case "darwin":
			webinosDemo = path.resolve(process.env.HOME + "/.webinos/");
			break;
	}

	return webinosDemo;
};

// global exception handler, which catches all unhandled exceptions,
// prints a trace and exits. the trace is better than the default.
/*process.addListener("uncaughtException", function (err) {
    console.log("Uncaught exception: " + err);
    console.trace();
    process.exit();
});*/

/** @desription It removes the connected PZP/Pzh details.
 */
session_common.removeClient = function(self, conn) {
	"use strict";
	var i, delId, delPzhId;

	for (var id in self.connectedPzp){
		if (self.connectedPzp[id].socket === conn) {
			delete self.connectedPzp[i];
			return id;
		}
	}
	// TODO: Remove PZH details...
};

/**
 * This function is call most as each data received first calls this function.
 * It removes appended # in the message. This is appended at both end to identify start and end of message.
 * Also message verify is done based on schema. 
 */
session_common.processedMsg = function(self, data, callback) {
	"use strict";
	var msg   = data.toString("utf8");
	var parse = {};
	if (typeof msg === "string") {
		 parse = JSON.parse(msg);
		 if ( parse.value.length !== parse.length) {
			
		
		 } else { 
			var data = parse.value.substr(0, parse.length);
			callback.call(self, parse.tag, data);
		 }
	} else {
		
	}
};

/**
 * @description: It uses both resolve and lookup to fetch IP address. Used before connecting to pzh
 */
session_common.resolveIP = function(serverName, callback) {
	if(net.isIP(serverName) !== 0) {		
		callback(serverName);
	} else {
		dns.resolve(serverName, function(err, addresses) {
			if (typeof err !== "undefined") {
				// try again with lookup
				dns.lookup(serverName, function(err, address, family) {
					if (err) {
						callback("undefined");
						return;
					}
					callback(address);
				});				
			} else {
				// resolve succeeded
				callback(addresses[0]);			
			}
		});
	}
};
