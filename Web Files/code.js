/**
 * Created by Fabian on 02.01.2015.
 */

/**
 * Uses a globally visible filter object to apply set filters to the publicationJSON-object.
 * If a publication doesn't match a criteria, it is removed from the resul object.
 * @param toFilter the publicationJSON object that needs filtering.
 * @return a filtered publicationJSOn object.
 */
function filterPubJSON(toFilter){
    var result = toFilter;

    // Iterate over every publication
    result.forEach(function(actPub,index){
    // Filter for Years:
        if (actPub.year < allFilters.years.from || actPub.year > allFilters.years.to) {
            delete result[index];
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
    /*
    var json = [];
    var obj = {};
    obj.name = "root.Manuel_Jose";
    obj.imports = [];
    obj.imports.push("root.w");
    obj.imports.push("root.ys");
    json.push(obj);
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





    return json;

}