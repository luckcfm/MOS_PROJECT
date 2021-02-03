var js2xmlparser = require('js2xmlparser');
var msg_id = 1;
var mos_ID = "PLAYCAST.RIO.BAND.MOS";
var ncs_id = "SBDRJ-APP010";
var parseString = require('xml2js').parseString;
var to_json = require('xmljson').to_json;
var xmlJsConverter = require('xml-js-converter');
var utf8 = require('utf8');
var iconv  = require('iconv-lite');

function encode_utf8( s ){
    return unescape( encodeURIComponent( s ) );
}( '\u4e0a\u6d77' )

function unicodeToChar(text) {
   return text.replace(/\\u[\dA-F]{4}/gi, 
          function (match) {
               return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
          });
}

function leadingZero(n){
	if (n < 10){
		return "0"+n;
	}else{
		return n;
	}
}

function dateTimeNow(){
	var data = new Date();

	var me = leadingZero(data.getMonth());
	var d = leadingZero(data.getDate());
	var a = leadingZero(data.getFullYear());

	var h = leadingZero(data.getHours());
	var m = leadingZero(data.getMinutes());
	var s = leadingZero(data.getSeconds());
	return a+"-"+me+"-"+d+"T"+h+":"+m+":"+s;
}

function convertReq(mose){
	var xml = js2xmlparser.parse("mos", mose);
	xml = xml.trim();
	xml = iconv.encode(xml+"\r\n", 'UTF-16BE');

	return xml;
}

function cMosAck(){

}

cMosAck.prototype.setObjID 		= function(obj_id){this.objID = obj_id};
cMosAck.prototype.setObjRev 	= function(objRev){this.objRev = objRev};
cMosAck.prototype.setStatus 	= function(obj_id){this.status = status};
cMosAck.prototype.setStatusDesc = function(sDesc){this.statusDescription = sDesc};


function cHeartBeat(){
	this.time = {};
}

cHeartBeat.prototype.getTime = function(){ return this.time; };
cHeartBeat.prototype.setTime = function(time){this.time = time;};

function cMOS(){
	this.mosID = "";
	this.ncsID = "";
	this.messageID = "";
	//this.heartbeat = {};
}

cMOS.prototype.getMosID = function(){return this.mosID;};
cMOS.prototype.setMosID = function(id){this.mosID = id;};
cMOS.prototype.getNcsID = function(){return this.ncsID;};
cMOS.prototype.setNcsID = function(ncs_id){this.ncsID = ncs_id;};
cMOS.prototype.setMessageID = function(msg_id){this.messageID = msg_id;};
cMOS.prototype.getMessageID = function(){return this.messageID;};
cMOS.prototype.getHeartbeat	= function(){return this.heartbeat;};
cMOS.prototype.setHeartbeat = function(heartbeat){this.heartbeat = heartbeat;};

function criaMos(){
	var mos = new cMOS();
	mos.setMessageID(msg_id);
	mos.setMosID(mos_ID);
	mos.setNcsID (ncs_id);
	msg_id++;
	return mos;
}

function criaReqAll(){
	var mos = new cMOS();
	mos.setMessageID(msg_id);
	mos.setMosID(mos_ID);
	mos.setNcsID (ncs_id);
	msg_id++;

	mos.mosReqAll = {pause: "1"};

	return mos;
}

function criaReqMachInfo(){
	var mos = new cMOS();
	mos.setMessageID(msg_id);
	mos.setMosID(mos_ID);
	mos.setNcsID (ncs_id);
	msg_id++;

	mos.reqMachInfo = {};
	return mos;
}



function criaMachInfoReq(){
	var temp_mos = criaMos();

	temp_mos.reqMachInfo = {};

	return temp_mos
}

function criaMachAll(){
	var temp_mos = criaMos();
	temp_mos.listMachInfo = {
		manufacturer: "VIACAST",
		model: "PLACAST 3.0",
		hwRev: 0,
		swRev: 3.1,
		DOM: "001",
		SN: "001",
		ID: mos_ID,
		time: dateTimeNow(),
		opTime: 50,
		mosRev: "2.8.3",
		mosProfile0: "YES",
		mosProfile1: "NO",
		mosProfile2: "NO",
		mosProfile3: "NO",
		mosProfile4: "NO",
		mosProfile5: "NO",
		mosProfile6: "NO",
		mosProfile7: "NO"
	}

	return temp_mos;
}


function mosAck(){
}
mosAck.prototype.setObjID 				= function(id){this.objID = id};
mosAck.prototype.setObjRev 				= function(rev){this.objRev = rev};
mosAck.prototype.setStatus 				= function(status){this.status = status};
mosAck.prototype.setStatusDescription 	= function(statusD){this.statusDescription = statusD};

mosAck.prototype.getObjID 					= function(){return this.objID};
mosAck.prototype.getObjRev 					= function(){return this.objRev};
mosAck.prototype.getStatus  				= function(){return this.status};
mosAck.prototype.getStatusDescription 		= function(){return this.statusDescription };





function criaHeartBeat(){
	var hb = new cHeartBeat();
	hb.setTime(dateTimeNow());
	var mos = new cMOS();
	mos.setMessageID(msg_id);
	mos.setMosID(mos_ID);
	mos.setNcsID (ncs_id);
	mos.setHeartbeat(hb); 
	msg_id++;
	return mos;
}

function convertResponseToJson(data,socket){
	dados = data.toString("utf8");
	//console.log(dados);
	xml_full = dados.replace(/\0/g, '');
	//console.log(xml_full);
	parseString(xml_full, function(err,msg){
		//console.log(msg.mos.roCreate[0].story);
		if(msg != undefined){
			if(msg.mos.hasOwnProperty("mosReqAll")){
				console.log("Preciso responder com: ReqAll");
				var ack = new mosAck();
				ack.setObjID(msg.mos.messageID[0]);
				ack.setObjRev(1);
				ack.setStatus("ACK");
				ack.setStatusDescription("");

				var mos_resp 	= criaMos();
				mos_resp.mosAck = ack;
				
				socket.write(convertReq(mos_resp));
				//console.log(xml);
				return
			}
			if(msg.mos.hasOwnProperty("roStorySend")){
				console.log(msg.mos.roStorySend[0]);
				var id = msg.mos.roStorySend[0].roID;

				var ro_ack = criaMos();
				status = "OK";
				ro_ack.messageID = msg.mos.messageID;
				ro_ack.roAck = {roID: id, roStatus: "OK"};
				var resp = convertReq(ro_ack);
				console.log(resp.toString());
				socket.write(resp,'UTF-16BE');
				return;
			}
			if(msg.mos.hasOwnProperty("reqMachInfo")){
				console.log("Preciso responder com: MachInfo")
				var ack = new mosAck();
				ack.setObjID(msg.mos.messageID[0]);
				ack.setObjRev(1);
				ack.setStatus("ACK");
				ack.setStatusDescription("");

				var mos_resp 	= criaMos();
				mos_resp.mosAck = ack;
				
				socket.write(convertReq(mos_resp),function(err){
					console.log(err);
				});

				return;

			}
			if(msg.mos.hasOwnProperty("roReadyToAir")){
				console.log(msg.mos.roReadyToAir);
				var id = msg.mos.roReadyToAir[0];

				var ro_ack = criaMos();
				status = "OK";
				ro_ack.messageID = msg.mos.messageID;
				ro_ack.roAck = {roID: id, roStatus: "OK"};
				var resp = convertReq(ro_ack);
				console.log(resp.toString())
				socket.write(resp,'UTF-16BE');
				return;

			}


			if(msg.mos.hasOwnProperty("roCreate")){
			//	console.log(msg.mos.roCreate[0].story);
				
				// for(i = 0; i < msg.mos.roCreate[0].story.length; i++){
				// 	//console.log();
				// 	roAck.push({storyID:msg.mos.roCreate[0].story[i].storyID,status: "OK" });
				// }

				console.log(msg.mos.roCreate[0]);

				var id = msg.mos.roCreate[0].roID;

				var ro_ack = criaMos();
				status = "OK";
				ro_ack.messageID = msg.mos.messageID;
				ro_ack.roAck = {roID: id, roStatus: "OK"};

				var ack = new mosAck();
				ack.setObjID(msg.mos.messageID[0]);
				ack.setObjRev(1);
				ack.setStatus("ACK");
				ack.setStatusDescription("");
				//mos.mosAck = ack;
				var mos_resp 	= criaMos();
				//mos_resp.messageID = 509090;
				mos_resp.mosAck = ack;
				mos_resp.setMessageID(msg.mos.messageID[0]);
				//console.log();
				console.log(convertReq(ro_ack).toString());
				try{
					var resp = convertReq(ro_ack);
					socket.write(resp,'UTF-16BE');
				}catch(e){
					console.log(e);
					 var s = require('net').Socket();
					 	s.connect(10541,'SBDRJ-APP010');
					 	s.write(convertReq(mos_resp	));


					 	s.on('data',function(data){
					 	
					 });
				}
				return
			}
		
		}

	});
}

require('net').createServer(function (socket_1){
	console.log("Connected");
	socket_1.on('data', function(data){
		console.log(data.toString());
		//convertResponseToJson(data,socket);
		//console.log(data.toString());


    });
}).listen(10540);


require('net').createServer(function (socket_2){
	var dados = "";
        socket_2.on('data', function(data){
        	console.log("DATA2");
        	//console.log(data.toString())
        	//console.log(data.toString());
            dados += data;
           	
        //   	console.log(data.toString());
           //	
          //  socket.write(js2xmlparser.parse("mos", mos));
          var check = dados.toString().replace(/\0/g, '');
          if(check.indexOf("</mos>") > 0)
          {
          	convertResponseToJson(dados,socket_2);
          }
          
        });

        socket_2.on('end', function(){
        	console.log("fechei");
        	//console.log(dados);
        	convertResponseToJson(dados,socket_2);
        });

       
}).listen(10541);




require('net').createServer(function (socket){
        console.log("Connected");
        socket.on('data', function(data){
               mos = criaHeartBeat();
               //socket.write(js2xmlparser.parse("mos", mos));
        });

}).listen(9081);
//mos_req = criaReqMachInfo();
//mos_req = criaHeartBeat();
//mos_req = criaReqAll();
mos_req = criaMos();
mos_req.roReq = {roID: "SBDRJ-APP010;P_JRION\\W;4C364BB7-EEDE-4A04-A7EA2F7099CA7346"};


var s = require('net').Socket();
s.connect(10541,'SBDRJ-APP010');

//console.log(convertReq(mos_req).toString());
//s.write(convertReq(mos_req));


s.on('data',function(data){
	console.log("DADOS");
	console.log(data.toString());
});