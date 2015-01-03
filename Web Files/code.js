/**
 * Created by Fabian on 02.01.2015.
 */

// Receives an array of publication JSON objects each containing id and authors (and other stuff we won't need here)
// Returns a JSON object containing each author together with a list of cooperations (authors and counter)
/*
Example for one publication with authors A, B, C:
coopMap{
    totalAuthorCount: 3
    totalPublicationsCount: 1
    authors: {
        authorA {
            totalPublications: 1
            author B: 1
            author C: 1
        }
         authorB {
             totalPublications: 1
             author A: 1
             author C: 1
         }
         authorC {
             totalPublications: 1
             author A: 1
             author B: 1
         }
        }
}
 */
function buildCoopJSON(pubJSONArray){

    // Result containing counters for number of authors and publications and authors
    var coopMap = {
        totalAuthorCount:       0,
        totalPublicationCount:  0,
        authors:                {}
    };

    // Iterate over publication array, inside: Iterate over contributing authors
    // 1st step: If an author is not yet present in the result, we add him to the result.
    // Each author has an object for each co-Author, containing a counter for total cooperations.
    // 2nd step: For each co-Author, the respective counter is incremented by 1.
    pubJSONArray.forEach(function(actPublication){

        // Iterating over contributing authors, adding them to the coopMap:
        actPublication.authors.forEach(function(actAuthor){
            // Step 1: Add author if necessary
            if(!coopMap.authors.hasOwnProperty(actAuthor.name)){
                coopMap.authors[actAuthor.name]={
                    totalPublications:0
                };
                coopMap.totalAuthorCount++;
            }
        });

        // All contributing authors are present in the coopMap.
        // Step 2: For each author, ...
        actPublication.authors.forEach(function(actAuthor){

            // ... look at other authors...
            actPublication.authors.forEach(function(innerAuthor){

                // Do not connect an author with himself
                if(actAuthor.name != innerAuthor.name){

                    // Register actAuthor for innerAuthor:
                    if(!coopMap.authors[actAuthor.name].hasOwnProperty([innerAuthor.name])){
                        // Add outer Author to innerAuthor's coop list
                        coopMap.authors[actAuthor.name][innerAuthor.name]=1;

                    } else {
                        // Authors already "know" each other: Just increment the counter
                        coopMap.authors[actAuthor.name][innerAuthor.name]++;
                    }

                }
            });
            // End of inner forEach: One author finished
            coopMap.authors[actAuthor.name].totalPublications++;
        });
        // End of outer forEach: Publication finished
        coopMap.totalPublicationCount++;

    });

    // All publications read

    return(coopMap);

}