
function createEdgeBundle(coopJson){
    var currentlySelectedNode = null;

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
            console.log("Name:"+d.name);
            console.log(d.coAuthors);
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