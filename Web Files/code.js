/**
 * Created by Fabian on 02.01.2015.
 */

/**
 * Uses a globally visible filter object to apply set filters to the publicationJSON-object.
 * If a publication doesn't match a criteria, it is removed from the resul object.
 * @param toFilter the publicationJSON object that needs filtering.
 * @return a filtered publicationJSOn object.
 */
function filterPubJSON(){
    /*
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
        },
        minNumberOfPublications: 3
    };
    */
    var result = [];

    // Iterate over every publication
    publicationsJSON.forEach(function(actPub,index){
        var pushThis = true;

    // Filter for Years:
        if ((actPub.year < allFilters.years.from || actPub.year > allFilters.years.to)) {
            pushThis=false;
        }

        // Filter for Awards:
        if (allFilters.award.filterForAward) {
            // Filtering for awards:
            if (!((allFilters.award.filterValue && actPub.award) || (!allFilters.award.filterValue && !actPub.award))) {
                pushThis=false;
            }
        }

        if(pushThis)
            result.push(actPub);
    });

    console.log(result);
    drawBarGraph(result);
    return result;
}

function buildEdgeBundleJson(pubJSONArray){
    /*
    var generate = [
        {"name": "root.Manuel_Jose", "imports": ["root.vivant", "root.designer", "root.artista", "root.empreendedor"]},
        {"name": "root.vivant", "imports": []},
        {"name": "root.designer", "imports": []},
        {"name": "root.artista", "imports": []},
        {"name": "root.empreendedor", "imports": []}
    ];
    */


    var json = [];

    pubJSONArray.forEach(function(actPublication){

        // Iterating over contributing authors, adding them to the coopMap:
        actPublication.authors.forEach(function(actAuthor){
            var object = {};
            var inputAuthor = "root."+actAuthor.name;
            var index = json.map(function(e) { return e.name; }).indexOf(inputAuthor);

            if(index < 0){  //case not existend  -->add
                object.name = inputAuthor;
                object.totalPublications = 1;
                object.coAuthors = [];
                object.coAuthorsPublications = [];
                json.push(object);
                index = json.length-1;
            }else{   // case existed   --> publications ++
                json[index].totalPublications++;
            }

            // ... look at other authors...
            actPublication.authors.forEach(function(innerAuthor){

                // Do not connect an author with himself
                if(actAuthor.name != innerAuthor.name){

                    var coAuthor = "root."+innerAuthor.name;
                    var coIndex = json[index].coAuthors.map(function(e) { return e; }).indexOf(coAuthor);

                    if(coIndex < 0){
                        json[index].coAuthors.push(coAuthor);
                        json[index].coAuthorsPublications.push(1);
                    }else{
                      //basst  könnte man noch mit index rumspielen und ein 2tes array mit nem counter für gemeinsame publicationen machen
                      json[index].coAuthorsPublications[coIndex]++;
                    }

                }
            });

        });

    });

    var edgeReduced = json;
    var limit = 2;    //starte immer bei 2 (falls gekürzt werden muss, dann fallen alle weg die weniger als 2(also nur 1) werk haben
    var counter = 0;
    var lengthCounter = edgeReduced.length;

    var others = {};


    while(lengthCounter > 300){
        counter = 0;
        lengthCounter = 0;
        limit++;

        others = {};
        others.name = "root.Others";
        others.authors = [];
        others.coAuthors = [];
        others.coAuthorsPublications = [];
        others.totalPublications = 0;

        edgeReduced.forEach(function(author,index){
            if (author.totalPublications < limit){
                counter++;
                //erstell das others object
                others.authors.push(author.name);
                author.coAuthors.forEach(function(coAuthor){
                    var authIndex = others.coAuthors.map(function(e) { return e; }).indexOf(coAuthor);
                    if(authIndex < 0){
                        others.coAuthors.push(coAuthor);
                    }
                });
                delete edgeReduced[index];
            }else{
                lengthCounter++;
            }

        });
    }


    if(counter > 0){//falls eins weggefallen ist, füg den "Others" eintrag hinzu
        //console.log(others);
        //console.log("Authors: "+others.authors.length);
        //console.log("CoAuthors: "+others.coAuthors.length);
        //console.log("Allgemein Authors: "+ json.length);
        //var x = json.length-lengthCounter;
        //console.log("Dif: "+ x);

        //Add "Others" to coAuthors if they were reduced
        others.coAuthors.forEach(function(author){
            var authIndex = edgeReduced.map(function(e) { return e.name; }).indexOf(author);
            if (authIndex > -1){
                edgeReduced[authIndex].coAuthors.push("root.Others");
            }
        });

        edgeReduced.push(others);
    }

    allFilters.minNumberOfPublications = limit;

    return edgeReduced;

}