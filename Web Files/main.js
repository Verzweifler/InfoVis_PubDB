$(document).ready(function() {

	// Base-URL on which the URLs in the Publication-Objects build
	var baseURL = "http://www.medien.ifi.lmu.de/";

	var publicationsJSON = [],
		authorsJSON = [];

	// Request "mortifier" asks for the data
	$.get("http://localhost:3000/mortifier", function(data) {
		if(data.bool){
			// Publication format:
			/*
			{"id":"pub_1",
			"year":"2015",
			"authors":[
				{"name":"Daniel Buschek",
					"url":"http://www.medien.ifi.lmu.de/team/daniel.buschek/"},
				{"name":"Alexander De Luca",
					"url":"http://www.medien.ifi.lmu.de/team/alexander.de.luca/"},
				{"name":"Florian Alt",
					"url":"http://www.medien.ifi.lmu.de/team/florian.alt/"}],
			"title":{
				"url":"/forschung/publikationen/detail?pub=buschek2015chi",
				"name":"Improving Accuracy, Applicability and Usability of Keystroke Biometrics on Mobile Touchscreen Devices"},
			"description":{"html":""},
			"bibfile":"/pubdb/publications/pub/buschek2015chi/buschek2015chi.bib",
			"downloads":[],
			"award":false,
			"keywords":["keystroke dynamics","mobile","touch","biometrics"]}
			*/
			publicationsJSON = data.publications;

			// Authors format:
			/*
			{"name":"Daniel Buschek",
			"publications":["pub_1","pub_2","pub_11","pub_53","pub_91","pub_92"],
			"url":"http://www.medien.ifi.lmu.de/team/daniel.buschek/"}
			*/
			authorsJSON = data.authors;
			$('#publications').val(JSON.stringify(data.publications)).show();
			$('#authors').val(JSON.stringify(data.authors)).show();

			var coops = buildCoopJSON(data.publications);
			$('#loadingImage').hide();
			console.log(coops);

			createBarGraph(publicationsJSON);
		}else{
			$('#loadingImage').hide();
			$('#publications').val(data.msg).show();
		}
	})


});
