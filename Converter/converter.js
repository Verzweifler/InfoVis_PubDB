var request = require('request');
var express = require('express');
var iconv   = require('iconv-lite');
var cors 	= require('cors');
var fs 		= require('fs');

// jquery needed for easy DOM-manipulation and reusablity of client library..
var jsdom = require("jsdom-nogyp"); 
var window = jsdom.jsdom().createWindow();
jQuery = require("jquery")(window);

// custom module for converting pubDB html to json
var pubdb 	= require('./lib/pubdb_module.js');
var converter = new pubdb();

var app = express();
app.use(cors()); // allow cross-origin resource-sharing
var router = express.Router();

// pubDB URL
var basePath = "http://www.medien.ifi.lmu.de"
	, dbPath = "/cgi-bin/search.pl?all:all:all:all:all"
	, pubHtml = "";

var pubJson = [];
var authorJson = [];

// send pubHtml on request
router.get('/',function(req,res){
	// get html and save in pubHtml
	request({"uri": basePath+dbPath, "content-type": "text/html;", "encoding": null}, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			pubHtml = iconv.decode(new Buffer(body), "latin1");
			console.log("publications requested");
			res.send(pubHtml);
		}
	});
});

// return base path
router.get('/base', function(req, res) {
	res.send(basePath);
});

// return publications
router.get('/publications', function(req, res) {
	request({"uri": basePath+dbPath, "content-type": "text/html;", "encoding": null}, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			pubHtml = iconv.decode(new Buffer(body), "latin1");
			
			// convert html to json and return json to client
			converter.buildPublicationJSON(jQuery(pubHtml), function(data) {
				pubJson = data;
				res.json(data);
			});

		}
	});
	//res.send("please use client library");
});

// return authors
router.get('/authors', function(req, res) {
	/*converter.buildAuthorJSON(pubJson, function(data) {
		console.log(data)
	});*/
	//res.send("please use client library");
});



request({"uri": basePath+dbPath, "content-type": "text/html;", "encoding": null}, function(err, response, body) {
	if (!err && response.statusCode == 200) {
		pubHtml = iconv.decode(new Buffer(body), "latin1");

		console.log("Die Daten sind jetzt da und bereit zum Verarbeiten");
		// convert html to json and return json to client
		converter.buildPublicationJSON(jQuery(pubHtml), function(data) {
			pubJson = data;
			//res.json(data);
			console.log("Die Daten sind jetzt in JSON Form");
			//console.log(data);
			//console.log(converter.bibCount);
			converter.buildAuthorJSON(pubJson, function(data) {
				console.log("Authors fertig");
				//console.log(data);
				authorJson = data;
				var counter = 0;
				var counter2 = 0;

				var assignment = []

				for(i = 0; i< pubJson.length ;i++)  {
					if(pubJson[i].bibfile != null){
						counter++;
						//console.log(counter);

						var object = {};
						object.id = pubJson[i].id;
						object.bibFile = pubJson[i].bibfile;
						assignment.push(object);
						//console.log(object);

						request({"uri": basePath+pubJson[i].bibfile, "content-type": "text/html;", "encoding": null}, function(err, response, body) {
							if (!err && response.statusCode == 200) {
								var bibHtml = iconv.decode(new Buffer(body), "latin1");
								counter2++;
								//console.log(counter2);
								//console.log(response.req.path);
								//console.log("new");
								//bibHtml Parsen
								//console.log(bibHtml);
								var bibLines = bibHtml.split("\n");
								var keywords = [];	//keywords for current paper
								for(j = 0; j < bibLines.length;j++){
									 if(bibLines[j].match("keywords")){

										var index = bibLines[j].indexOf("keywords");
										 var line = bibLines[j].substr(index);

										 //case for curly bracers
										if(line.match("{")){
											var  re = /{([^}]+)}/g;
										  line = re.exec(line);
											//console.log("Klammer");
											if(line != null){
												//console.log(line[1].trim());
												line = line[1].trim();
												var keywordArray = line.split(',');
												for (var k = 0; k < keywordArray.length; k++) {

													var word = keywordArray[k].trim();
													keywords.push(word);
												}

											} else{
												//console.log("leer");

											}

										}else if(line.match("\"")){ //case for quotes
											var  re = /"(.*?)"/g;
											line = re.exec(line);
											//console.log("Anführungzeichen");
											if(line != null){
												//console.log(line[1].trim());
												line = line[1].trim();
												var keywordArray = line.split(',');
												for (var k = 0; k < keywordArray.length; k++) {

													var word = keywordArray[k].trim();
													keywords.push(word);
												}

											} else{
												//console.log("leer");

											}
										}
									 }
								}
								//console.log(keywords);


								//assignment to pub_id
								var curPath = response.req.path;
								for(x = 0; x < assignment.length; x++){
									var obj = assignment[x];
									if(obj.bibFile == curPath){
										//console.log("match");
										var paperID = obj.id;

										for(y = 0; y < pubJson.length;y++){
											if(pubJson[y].id == paperID){
												pubJson[y].keywords = keywords;  //keywords added to the corresponding papers
												//console.log(pubJson[y]);
											}
										}

									}
								}
							}
						});
					}
				}
				//console.log(assignment);
			});

		});

	}
});


// return all the data
router.get('/mortifier', function(req, res) {
	if(converter.bibCount == 0){
		res.send("Not completed Loading, Zocken?");
	}  else{
		res.send("Alles fertig")
	}
});

app.use(router);

var server = app.listen(3000, function () {
 	var host = server.address().address;
 	var port = server.address().port;
 	console.log("Server running on port " + port);
});