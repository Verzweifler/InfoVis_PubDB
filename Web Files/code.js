/**
 * Created by Fabian on 02.01.2015.
 */

function update(){
    currentlySelectedNode = null;
    updateDetailView(currentlySelectedNode);
    filteredJSON = filterPubJSON();
    updateBarGraph();
    if(filteredJSON.length != 0){
        var edge = buildEdgeBundleJson(filteredJSON);
        createEdgeBundle(edge);
    }else{
        d3.select("#circle").select("svg").remove();
    }
}

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
        //Keywords Filter
        if(allFilters.keywords.length != 0 && pushThis){
            if(actPub.keywords.length == 0){
                pushThis=false;
            }else{
                pushThis=false;
                actPub.keywords.forEach(function(actKeyword){
                    allFilters.keywords.forEach(function(filterKeyword){
                        if(actKeyword.toLowerCase().indexOf(filterKeyword) > -1){
                            pushThis = true;
                        }
                    });
                });


            }
        }
        //Titles Filter
        if(allFilters.titles.length != 0 && pushThis){
            pushThis=false;
            allFilters.titles.forEach(function(titleKeyword){
                if(actPub.title.name.toLowerCase().indexOf(titleKeyword) > -1){
                    pushThis = true;
                }
            });
        }
        //Authors Filter
        if(allFilters.authors.length != 0 && pushThis){
            pushThis=false;
            actPub.authors.forEach(function(actAuthor){
                allFilters.authors.forEach(function(filterAuthor){
                    if(actAuthor.name.toLowerCase().indexOf(filterAuthor) > -1){
                        pushThis = true;
                    }
                });
            });
        }


        if(pushThis) {
            result.push(actPub);
        }
    });

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
                object.pub = [];

                var publicationData = {};
                publicationData.name = actPublication.title.name;
                publicationData.url = [];
                if(actPublication.downloads.length != 0){
                    publicationData.url.push(actPublication.downloads[0]);
                }
                object.pub.push(publicationData);

                json.push(object);
                index = json.length-1;
            }else{   // case existed   --> publications ++
                json[index].totalPublications++;

                var publicationData = {};
                publicationData.name = actPublication.title.name;
                publicationData.url = [];
                if(actPublication.downloads.length != 0){
                    publicationData.url.push(actPublication.downloads[0]);
                }
                json[index].pub.push(publicationData);
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


    while(lengthCounter > maxAuthors){
        counter = 0;
        lengthCounter = 0;
        limit++;

        others = {};
        others.name = "root.Others";
        others.authors = [];
        others.coAuthors = [];
        others.coAuthorsPublications = [];
        others.totalPublications = 0;
        others.pub = [];

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
                author.pub.forEach(function(publication){
                    var pubIndex = others.pub.map(function(e) { return e.name; }).indexOf(publication.name);
                    if(pubIndex < 0){
                        others.pub.push(publication);
                    }
                });
                delete edgeReduced[index];
            }else{
                lengthCounter++;
            }

        });
    }


    if(counter > 0){//falls eins weggefallen ist, füg den "Others" eintrag hinzu

        //Add "Others" to coAuthors if they were reduced
        others.coAuthors.forEach(function(author){
            var authIndex = edgeReduced.map(function(e) { return e.name; }).indexOf(author);
            if (authIndex > -1){
                edgeReduced[authIndex].coAuthors.push("root.Others");
            }
        });
        others.totalPublications = others.pub.length;

        edgeReduced.push(others);
    }

    allFilters.minNumberOfPublications = limit;

    return edgeReduced;

}