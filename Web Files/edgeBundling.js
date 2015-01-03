
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


    var nodes = cluster.nodes(coopJson),
        links = packageImports(nodes);

    svg.selectAll(".link")
        .data(bundle(links))
        .enter().append("path")
        .attr("class", "link")
        .attr("d", line);

    svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
        .append("text")
        .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
        .attr("dy", ".31em")
        .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
        .text(function(d) { return d.key(); });                                                                         //mal schaun obs klappt


    d3.select(self.frameElement).style("height", diameter + "px");


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

    function generateLinks(coopJson) {
        var links = [];
        //console.log(coopJson.authors);
        // For each import, construct a link from the source to target node.

        $.each(coopJson.authors,function(key,value) {
            if(value.coAuthors){
                $.each(value.coAuthors,function(key2,pubCount) {
                    var small;
                    var big;
                    if(key < key2){ //lex order
                        small = key;
                        big = key2;
                    }else{
                        small = key2;
                        big = key;
                    }
                    var added = false;
                    //check if allready added
                    $.each( links, function( index, link ){
                        if(link.source == small && link.target == big){
                            added = true;
                        }
                    });
                    if(!added){
                        links.push({source: small, target: big, value: pubCount});   //lex smaller is source
                    }
                });
            }
        });

        return links;
    }



}