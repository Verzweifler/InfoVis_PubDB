/**
 * Created by Fabian on 03.01.2015.
 */

// Receives a publications JSON, containing information about publications; mainly author and year
function createBarGraph(pubJSON){

    var dataset = new Array();
    var yearNow = new Date().getFullYear();
    var minYear = 1994;
    var maxYear = 2015;

    // Remodeling the dataset for our purposes:
    // Each array slot holds a pair: [year, pubCount]
    pubJSON.forEach(function(d){
        var index = yearNow-parseInt(d.year);

        // Inserting a dummy for the newly found index:
        if(dataset.length < index+1)
            dataset.push([d.year, 0, []]);

        // Writing the actual data:
        dataset[index][1]++;
        dataset[index][2].push(d);    // Just append the whole publication...
    });

    console.log(dataset);
    // Put 2015 at last place
    dataset.reverse();

    // Some necessary parameters:
    var w = 600;
    var h = 300;
    var paddingBars=2;
    var paddingSides = 25;

    // Preparing the scales, so the bars fit in width and height:
    // X-Axis: Years
    var scaleX = d3.scale.linear()
        .domain([minYear,maxYear])
        .range([paddingSides, w-paddingSides*2]);   // ... on the width of the graph area
                                                    // thus enabling us to draw an x-Axis

    // Scaling the height of the bars
    var scaleY = d3.scale.linear()                  // Mapping the values on the height...
        .domain([0, d3.max(dataset, function(d){    // from the range of the dataset...
            return d[1];
        })])
        .range([h-paddingSides, paddingSides]);     // ... to the height of the plotting area

    // Axis:
    var xAxis = d3.svg.axis()   // Create an axis
        .tickFormat(d3.format("Y"))// Scale it as years ...
        .scale(scaleX)          // using the x-Scale
        .orient("bottom");      // Values on the bottom of the axis

    var yAxis = d3.svg.axis()
        .scale(scaleY)
        .orient("left");

    // creating a svg object for displaying the bars:
    var svg = d3.select("#barChart")
        .append("svg")
        .attr("width", w)
        .attr("height", h);


    // Drawing the rectangles:
    svg.selectAll("rect")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", function(d, i){
            return scaleX(d[0])+paddingBars;
        })
        .attr("y", function(d){
            console.log(d);
            return scaleY(d[1]);
        })
        .attr("width", w/dataset.length-paddingBars*2)
        .attr("height", function(d){
            return h-scaleY(d[1])-paddingSides;
        })
        .attr("onclick", function(d){
            return "alert(\"" + d[0] + ": " + d[1] + " Arbeiten\");";
        });

    // Putting labels on it:
    svg.selectAll("text")
        .data(dataset)
        .enter()
        .append("text")
        .text(function(d) {
            return d[1];
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i) {
            return scaleX(d[0]) + (w / dataset.length) / 2;
        })
        .attr("y", function(d) {
            if(h-scaleY(d[1])>paddingSides+15){
                return scaleY(d[1])+14;
            } else
                return scaleY(d[1])-5;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", function(d){
            if(h-scaleY(d[1])>paddingSides+15)
                return "white";
            else
                return "black";
        });

    // Appending x-Axis:
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" +
            (w / dataset.length) / 2 + ", " + (h-paddingSides)+ ")")
        .call(xAxis);

    //Appending y-Axis:
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + paddingSides + ", "+ "0)")
        .call(yAxis);

    $("#barSlider").rangeSlider({
        bounds: {min:minYear, max:maxYear},
        defaultValues: {min:minYear+3, max:maxYear-1},
        scales: [
            {first:function(val){return val;},
            next: function(val){return val+2;}}
        ],
        step:1
    });

}
