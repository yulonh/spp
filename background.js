var connections = {};
var todos = [];

function send(msg, callback) {
	this.callback = callback;
	chrome.serial.send(this.connectionId, str2ab(msg + '\r'), function(sendInfo) {});
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
	},
	checkSMSReceived: function() {
		var time = this.delay;
		setTimeout(function() {


			setTimeout(arguments.callee, time);
		}, time);
	},
	sendMessage: function(option, callback) {
		if (!option) {
			return;
		}
		if (!option.to || !option.message) {
			return;
		}
		connection = connections[option.connectionId];
		connection && connection.send('AT', function(res) {
			res.indexOf('OK') !== -1 &&
				connection.send('AT+CMGF=1', function(res) {
					if (res.indexOf('OK') !== -1) {
						connection.send('AT+CMGS="{to}"'.replace('{to}', option.to));
						connection.send(option.message.concat(String.fromCharCode(26)), function(res) {
							callback && callback.call(connection, res);
						});
					}
				});
		});
	},
	receiveMessage: function(info) {
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

function onLineReceived(msg, connection) {

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

			if (message.match(/\+CMTI: "SM",(\d)/)) {
				var id = RegExp.$1;
				connection.send('AT+CMGR=' + id, function(res) {
					var array = res.replace(/"/g, '').split(/[,\n]/);
					if (array[6] && array[6] === 'OK') {
						SMSManager.receiveMessage({
							from: array[1],
							date: array[3],
							time: array[4],
							content: decode(array[5])
						});
					}
				});
			}
			connection.callback && connection.callback.call(connection, message);
			message = '';
		} else {
			message += str;
		}
	}
};

chrome.serial.onReceive.addListener(onReceiveCallback);

function writeSerial(connectionId, str, callback) {
		chrome.serial.send(connectionId, str2ab(str + '\r'), function(sendInfo) {});
	}
	// Convert string to ArrayBuffer
function str2ab(str) {
	var buf = new ArrayBuffer(str.length);
	var bufView = new Uint8Array(buf);
	for (var i = 0; i < str.length; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}