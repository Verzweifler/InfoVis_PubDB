
PubDBtoJSONConverter = function() {
	this.pubJson = [];
	this.authorJson = [];
	this.bibCount = 0;
	this.authorsDone = false;
};




PubDBtoJSONConverter.prototype.buildPublicationJSON = function($pubObject, callback) {
	var $tableRow = $pubObject.find('tr'),
		_this = this;
		var currentYear;

	/*	<tr></tr> == publication object
	 *	traverse all table rows and extract data
	 */
	jQuery.each($tableRow, function(index) {
		if (jQuery(this).find('td').eq(0).hasClass('year_separator')) {
			currentYear = jQuery(this).find('td b').text();
		} else { // ignore year separators
			var object = {}; // single entry object

			object.id = 'pub_' + index;	// unique id
			object.year = currentYear;	// publication year
			object.authors = []; 		// array of authors (name, url)
			object.title = {};			// publication title
			object.description = {};	// publication description
			object.bibfile = "";		// url to bibfile
			object.downloads = [];		// array of download-links (pdf etc.)
			object.award = false;		// best-paper award?
			object.keywords = [];		//keywords for paper?


			$downloads = jQuery(this).find('td:nth-child(1)'); // download links in first td
			$contents = jQuery(this).find('td:nth-child(2)'); // other contents in second


			/*
			 CONTENT START
			 */

			if ($contents.find('img').length) {  // only entries with award-picture have won an award..
				object.award = true;
			}

			var contentsString = $contents.html();
			//console.log(contentsString);

			/*  split contents by breaks. 
			 *	first block = authors
			 *	second block = title
			 *	third block = description	*/
			var contentsArray = contentsString.split('<br />');

			var _authors = contentsArray[0]
				, _title = contentsArray[1]
				, _description = contentsArray[2];



			// authors:
			var authorsArray = _authors.split(',');

			for (var i = 0; i < authorsArray.length; i++) {
				var person = {};
				person.name = authorsArray[i].replace(/(<([^>]+)>)/ig, ""); // remove html tags from name 
				person.name = person.name.replace('\n\t\t', '');		// remove tabs etc.
				person.name = person.name.trim();

				try {
					person.url = jQuery(authorsArray[i]).attr('href');			// if surrounded by <a>-tag, keep href
				} catch(e) {
					//console.log("err at authors", e);
					person.url = null;
				}

				object.authors.push(person);
			}

			// title: 
			try {
				titleUrl = jQuery(_title).find('a').attr('href');
				titleName = jQuery(_title).find('a').text();
				object.title.url = titleUrl;
				object.title.name = titleName;
			} catch(e) {
				console.log("err at title", e);
			}



			// description:
			try {
				var firstObject = jQuery(_description)[0];


				var descriptionText = jQuery(firstObject).html();
				object.description.html = descriptionText;

			} catch(e){
				console.log("err at description + "+ jQuery(_description).length , e);
			}


			var bibFileLink = null;
			// bib-File:
			try {

				if($contents.length){
					for (var i = 0; i < $contents.find('a').length; i++) {
						if(jQuery($contents.find('a')[i]).text() === 'bib'){
							//console.log(jQuery($contents.find('a')[i]).attr('href'));
							bibFileLink = jQuery($contents.find('a')[i]).attr('href');
							_this.bibCount++;
							//console.log(_this.bibCount);
						}
					};
				}


				object.bibfile = bibFileLink;

			} catch(e){
				console.log("err at bibfile" , e);
			}



			/*
			 CONTENT END
			 ###############
			 DOWNLOADS START
			 */
			var $linkCollection = $downloads.find('a');

			jQuery.each($linkCollection, function() {
				object.downloads.push(jQuery(this).attr('href')); // add download links
			});

			/*
			 DOWNLOADS END
			 */

			// add current object to json-array
			_this.pubJson.push(object);
		}
	});

	// callback, when finished
	callback(_this.pubJson);
};




// extracts authors from json and creates new, author-centered json
PubDBtoJSONConverter.prototype.buildAuthorJSON = function(json, callback) {
	var authorNamesArray = [];

	var hash = function(obj){
		return obj.name;
	};

	// author hashmap
	var authorDictionary = {};

	// go through all publications
	for (var i = 0; i < json.length; i++) {
		// go through all authors of current publication
		for (var j = 0; j < json[i].authors.length; j++) {

			// if name is not part of authorNamesArray yet, add it and create author object
			if (authorNamesArray.indexOf(json[i].authors[j].name) < 0) {
				authorNamesArray.push(json[i].authors[j].name);
				var authorObject = {};

				// add this author name to object
				authorObject.name = json[i].authors[j].name.trim();

				// create new publications array and add current publication
				authorObject.publications = [];
				authorObject.publications.push(json[i].id);

				// unique id
				//authorObject.id = i+''+j; // author name is id

				// author url
				if (typeof(json[i].authors[j].url) !== 'undefined') {
					authorObject.url = json[i].authors[j].url;
				}

				// put author into "dictionary"
				authorDictionary[hash(authorObject)] = authorObject;
			} else {
				// get author from hashmap and add publication
				authorDictionary[json[i].authors[j].name.trim()].publications.push(json[i].id);
			}

		};
	};

	// convert to json-array
	var keys = [];

	for (var key in authorDictionary) {
		keys.push(key)
	}

	for (var i = 0; i < keys.length; i++) {
		this.authorJson.push(authorDictionary[keys[i]]);
	};

	// callback, when finished
	callback(this.authorJson);
};



module.exports = PubDBtoJSONConverter;
	