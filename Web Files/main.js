
var minYear = 1994;
var maxYear = 2015;
// Reflects set filters
var allFilters = {
	years: {from: minYear,
			to: maxYear},
	title: "",
	description: "",
	keywords: [],
	authors: [],
	award: {	// We can't just put a boolean here! Otherwise we would always filter for awards
		filterForAward:false,	// True, if we want to filter for awards
		filterValue:false		// Value of the filter, if set
	}
};

var publicationsJSON = [],
	authorsJSON = [];

$(document).ready(function() {

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
			createBarGraph(publicationsJSON);

			// Authors format:
			/*
			{"name":"Daniel Buschek",
			"publications":["pub_1","pub_2","pub_11","pub_53","pub_91","pub_92"],
			"url":"http://www.medien.ifi.lmu.de/team/daniel.buschek/"}
			*/
			authorsJSON = data.authors;
			//$('#publications').val(JSON.stringify(data.publications)).show();
			//$('#authors').val(JSON.stringify(data.authors)).show();

			var filteredJSON = filterPubJSON(publicationsJSON);

			var edge = buildEdgeBundleJson(publicationsJSON);

			var counter = 0;
			var limit = 3;
			var edgeReduced = [];
			edge.forEach(function(d) {
				if (d.totalPublications < limit){
					counter++;
				}else{
					edgeReduced.push(d);
				}
			});
			var object = {};
			object.name = "root.Others";
			object.totalPublications = 1;
			object.coAuthors = [];
			object.coAuthorsPublications = [1];
			edgeReduced.push(object);

			createEdgeBundle(edgeReduced);

			$('#loadingImage').hide();
		}else{
			$('#loadingImage').hide();
			$('#publications').val(data.msg).show();
		}
	})
});