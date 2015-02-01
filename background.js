var connections = {};
var todos = [];

var noop = function() {}

function send(msg, callback) {
	chrome.serial.send(this.connectionId, str2ab(msg + '\r'), callback || noop);
}

var SMSManager = {
	delay: 500,
	init: function() {
		chrome.serial.getDevices(function(ports) {
			function connect(path) {
				chrome.serial.connect(path, {
					bitrate: 115200
				}, function(connectionInfo) {
					var id = connectionInfo.connectionId;
					connections[id] = connectionInfo;
					connections[id]['path'] = path;
					connections[id]['messages'] = [];
					connections[id]['message'] = '';
					connections[id]['send'] = send;
				});
			}

			for (var i = 0; i < ports.length; i++) {
				var port = ports[i];
				connect(port.path);
			};
		});
		//close
		chrome.runtime.onSuspend.addListener(function() {
			for (var id in connections) {
				var connection = connections[id];
				chrome.serial.disconnect(id, noop);
			};
		});
	},
	sendMessage: function(option, callback) {
		if (!option) {
			return;
		}
		if (!option.to || !option.message) {
			return;
		}
		connection = connections[option.connectionId];
		connection && connection.send('AT', function() {
			connection.send('AT+CMGF=1', function() {
				connection.send('AT+CMGS="{to}"'.replace('{to}', option.to));
				connection.send(option.message.concat(String.fromCharCode(26)), function() {
					callback && callback.call(connection);
				});
			});
		});
	},
	receiveMessage: function(info, connection) {
		console.log(info);
	}
};

SMSManager.init();

function decode(str) {
	return str.replace(/[\w\d]{4}/g, function(k) {
		return String.fromCharCode(parseInt(k, 16));
	});
}

function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint8Array(buf));
}

var onReceiveCallback = function(info) {
	var connection = connections[info.connectionId];
	var messages = connection.messages;
	var message = connection.message;

	if (info.data) {
		var str = ab2str(info.data);
		if (str.charAt(str.length - 1) === '\n') {
			message += str.substring(0, str.length - 1).trim();
			messages.push(message);
			console.log(message);
			if (message.match(/\+CMTI: "SM",(\d+)/)) {
				var id = RegExp.$1;
				connection.send('AT+CMGR=' + id);
			}

			if (message.match(/\+CMGR: "REC UNREAD",/)) {
				var array = message.replace(/"/g, '').split(/[,\n\r]+/);
				if (array[5] && array[5] === 'OK') {
					SMSManager.receiveMessage({
						from: array[1],
						date: array[2],
						time: array[3],
						content: decode(array[4])
					}, connection);
				}
			}
			message = '';
		} else {
			message += str;
		}
	}
};

chrome.serial.onReceive.addListener(onReceiveCallback);

// Convert string to ArrayBuffer
function str2ab(str) {
	var buf = new ArrayBuffer(str.length);
	var bufView = new Uint8Array(buf);
	for (var i = 0; i < str.length; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}