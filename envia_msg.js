var js2xmlparser = require('js2xmlparser');
var msg_id = 1;
var mos_ID = "PLAYCAST.RIO.BAND.MOS";
var ncs_id = "SBDRJ-APP010";
var parseString = require('xml2js').parseString;
var to_json = require('xmljson').to_json;
var xmlJsConverter = require('xml-js-converter');
var utf8 = require('utf8');
var iconv  = require('iconv-lite');


var s = require('net').Socket();
s.connect(10540,'127.0.0.1');

mos = criaHeartBeat();
var xml = js2xmlparser.parse("mos", mos);
	//console.log(xml);
xml = iconv.encode(xml, 'UTF-16BE');
s.write(xml);


s.on('data',function(data){
	console.log("DADOS");
	console.log(data.toString());
})
