$(document).ready(function() {

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


	var currentlySelectedNode = null;

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



	function createEdgeBundle(coopJson){

		var diameter = 960,
			radius = diameter / 2,
			innerRadius = radius - 120;

		var cluster = d3.layout.cluster()
			.size([360, innerRadius])
			.sort(null)
			.value(function(d) { return d.size; });

		var bundle = d3.layout.bundle();

		var line = d3.svg.line.radial()
			.interpolate("bundle")
			.tension(.85)
			.radius(function(d) { return d.y; })
			.angle(function(d) { return d.x / 180 * Math.PI; });

		var svg = d3.select("#circle").append("svg")
			.attr("width", diameter)
			.attr("height", diameter)
			.append("g")
			.attr("transform", "translate(" + radius + "," + radius + ")");

		var link = svg.append("g").selectAll(".link"),
			node = svg.append("g").selectAll(".node");


		var nodes = cluster.nodes(packageHierarchy(coopJson)),
			links = packageImports(nodes);

		link = link
			.data(bundle(links))
			.enter().append("path")
			.each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
			.attr("class", "link")
			.attr("d", line);

		node = node
			.data(nodes.filter(function(n) { return !n.children; }))
			.enter().append("text")
			.attr("class", "node")
			.attr("dy", ".31em")
			.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
			.style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			.text(function(d) { return d.key; })
			.on("click",clickFunction);

		d3.select(self.frameElement).style("height", diameter + "px");



		function clickFunction(d) {

			//Check if same Node is clicked again
			var clickedAgain = false;
			if(currentlySelectedNode != null){ //if one node allready selected
				if(currentlySelectedNode.name == d.name){ //check if same node is klicked
					//console.log("selber knoten");
					clickedAgain = true;
					currentlySelectedNode = null;
				}else{  //or set new selected node
					currentlySelectedNode = d;
				}
			}else{//case no currently selected node
				currentlySelectedNode = d;
			}

			//updateDetailsView
			updateDetailView(currentlySelectedNode);

			//Reset Classes START
			link
				.classed("link--target", false)
				.classed("link--source", false);

			node
				.classed("node--target", false)
				.classed("node--source", false)
				.classed("node--selected", false)
				.attr("transform", function(n) { return "rotate(" + (n.x - 90) + ")translate(" + (n.y + 8) + ",0)" + (n.x < 180 ? "" : "rotate(180)"); });
			//Reset Classes END

			if(!clickedAgain){
				node
					.each(function(n) { n.target = n.source = false; });

				//Set Target and Source Nodes START
				link
					.classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
					.classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
					.filter(function(l) { return l.target === d || l.source === d; })
					.each(function() { this.parentNode.appendChild(this); });

				node
					.classed("node--target", function(n) { return n.target; })  //je nachdem ob true oder nicht wird als node target oder source gesetzt
					.classed("node--source", function(n) { return n.source; })
					.attr("transform", function(n) { if(n.target || n.source){ return "rotate(" + (n.x - 90) + ")translate(" + (n.y + 8) + ",0)" + (n.x < 180 ? "translate(5,0)" : "rotate(180)translate(-5,0)"); }else{return "rotate(" + (n.x - 90) + ")translate(" + (n.y + 8) + ",0)" + (n.x < 180 ? "" : "rotate(180)");} });
				//Set Target and Source Nodes END

				//Set Selected(Clicked) Node START
				node.filter(function(n) { return d.name == n.name; })
					.classed("node--selected",true)
					.attr("transform", function(n) { return "rotate(" + (n.x - 90) + ")translate(" + (n.y + 8) + ",0)" + (n.x < 180 ? "translate(5,0)" : "rotate(180)translate(-5,0)"); });
				//Set Selected(Clicked) Node END
			}
		}

		// Lazily construct the package hierarchy from class names.
		function packageHierarchy(classes) {
			var map = {};

			function find(name, data) {
				var node = map[name], i;
				if (!node) {
					node = map[name] = data || {name: name, children: []};
					if (name.length) {
						if(name.indexOf("root")>-1){
							node.parent = find(name.substring(0, i = name.indexOf(".")));
							node.parent.children.push(node);
							node.key = name.substring(i + 1);
						}
					}
				}
				return node;
			}

			classes.forEach(function(d) {
				find(d.name, d);
			});

			return map[""];
		}

		// Return a list of imports for the given array of nodes.
		function packageImports(nodes) {
			var map = {},
				imports = [];

			// Compute a map from name to node.
			nodes.forEach(function(d) {
				map[d.name] = d;
			});

			// For each import, construct a link from the source to target node.
			nodes.forEach(function(d) {
				//console.log("Name:"+d.name);
				//console.log(d.coAuthors);
				var othersValue = 0;
				if (d.coAuthors) d.coAuthors.forEach(function(i) {
					if(map[i]){
						imports.push({source: map[d.name], target: map[i] ,value: d.coAuthorsPublications[i]});
					}else{
						othersValue++;
					}
				});
				if(othersValue != 0){
					imports.push({source: map[d.name], target: map["root.Others"] ,value: othersValue});
				}
			});

			return imports;
		}
	}

	function updateDetailView(node){
		var newAuthorData = [];
		var newCoAuthorsData = [];
		var newPubData = [];
		if(node != null){ //falls nicht deselektiert wurde
			newAuthorData.push(node.name);
			newCoAuthorsData = node.coAuthors;
		}else{//deselektierung

		}

		//UPDATE AUTHOR START
		var auth = d3.select("#detail--auth").selectAll("text")
			.data(newAuthorData);

		//Add Text and update Input
		auth.enter().append("text");
		auth.text(function(d) { return d.substring(5); });
		// Remove old elements as needed.
		auth.exit().remove();
		//UPDATE AUTHOR END

		//UPDATE COAUTHORS START
		var coauths = d3.select("#detail--coauth").selectAll("text")
			.data(newCoAuthorsData);

		//Add Text and update Input
		coauths.enter().append("text");
		coauths.text(function(d) { return d.substring(5); });
		// Remove old elements as needed.
		coauths.exit().remove();
		//UPDATE COAUTHORS END

		//UPDATE COAUTHORS START
		//generate structure for publications
		publicationsJSON.forEach(function(actPublication){
			actPublication.authors.forEach(function(actAuthor){
				var aName = "root."+actAuthor.name;
				if(node.name == aName){
					var ooo = {};
					ooo.name = actPublication.title.name;
					ooo.url = [];
					if(actPublication.downloads.length != 0){
						ooo.url.push(actPublication.downloads[0]);
					}
					//newPubData.push(actPublication.title.name);
					newPubData.push(ooo);
				}
			});

		});

		var pub = d3.select("#detail--pub").selectAll("text")
			.data(newPubData);

		//Add Text and update Input
		pub.enter().append("text");
		pub.text(function(d) { return d.name; });
		pub.filter(function(d) { return d.url != 0; }).enter().append("a").html("heyhoe");
		//.append("a").attr("href", function(d){return (d.url.length != 0 ?  d.url[0] : "");}).html("(download)")
		// Remove old elements as needed.
		pub.exit().remove();
		//UPDATE COAUTHORS END
	}
});
