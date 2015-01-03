
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

    var svg = d3.select("body").append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .append("g")
        .attr("transform", "translate(" + radius + "," + radius + ")");

    d3.json("readme-flare-imports.json", function(error, classes) {
        var nodes = cluster.nodes(packageHierarchy(classes)),
            links = packageImports(nodes);

        svg.selectAll(".link")
            .data(bundle(links))
            .enter().append("path")
            .attr("class", "link")
            .attr("d", line);

        svg.selectAll(".node")
            .data(nodes.filter(function(n) { return !n.children; }))
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
            .append("text")
            .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
            .attr("dy", ".31em")
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
            .text(function(d) { return d.key; });
    });

    d3.select(self.frameElement).style("height", diameter + "px");

// Lazily construct the package hierarchy from class names.
    function packageHierarchy(classes) {
        var map = {};

        function find(name, data) {
            var node = map[name], i;
            if (!node) {
                node = map[name] = data || {name: name, children: []};
                if (name.length) {
                    node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
                    node.parent.children.push(node);
                    node.key = name.substring(i + 1);
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
            if (d.imports) d.imports.forEach(function(i) {
                imports.push({source: map[d.name], target: map[i]});
            });
        });

        return imports;
    }




    // Result containing counters for number of authors and publications and authors
    var coopMap = {
        totalAuthorCount:       0,
        totalPublicationCount:  0,
        authors:                {}
    };

    // Iterate over publication array, inside: Iterate over contributing authors
    // 1st step: If an author is not yet present in the result, we add him to the result.
    // Each author has an object for co-Authors, and a counter for total cooperations.
    // 2nd step: For each co-Author, the respective counter is incremented by 1.
    pubJSONArray.forEach(function(actPublication){

        // Iterating over contributing authors, adding them to the coopMap:
        actPublication.authors.forEach(function(actAuthor){
            // Step 1: Add author if necessary
            if(!coopMap.authors.hasOwnProperty(actAuthor.name)){
                coopMap.authors[actAuthor.name]={
                    coAuthors:{},
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
                        coopMap.authors[actAuthor.name].coAuthors[innerAuthor.name]=1;

                    } else {
                        // Authors alreay "know" each other: Just increment the counter
                        coopMap.authors[actAuthor.name].coAuthors[innerAuthor.name]++;
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