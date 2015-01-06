/**
 * Created by Fabian on 03.01.2015.
 */

var scaleX;
var scaleY;
// Some necessary parameters:
var w = 600;
var h = 300;
var paddingBars=2;
var paddingSides = 25;
var totalYears=0;

// Receives a publications JSON, containing information about publications; mainly author and year
function createBarGraph(pubJSON){

    var dataset = new Array();
    var yearNow = new Date().getFullYear();

    // Remodeling the dataset for our purposes:
    // Each array slot holds a pair: [year, pubCount]
    pubJSON.forEach(function(d){
        var index = yearNow-parseInt(d.year);

        // Inserting a dummy for the newly found index:
        while(dataset.length < index+1)
            if(d.year < allFilters.years.from || d.year > allFilters.years.to)
                dataset.push([d.year, 0, "rgb(0,0,255);", []]);
            else
                dataset.push([d.year, 0, "rgb(255,0,0);", []]);

        // Writing the actual data:
        dataset[index][1]++;
        dataset[index][3].push(d);    // Just append the whole publication...
    });

    // Put 2015 at last place
    dataset.reverse();

    totalYears= dataset.length;

    // Preparing the scales, so the bars fit in width and height:
    // X-Axis: Years
    scaleX = d3.scale.linear()
        .domain([minYear,maxYear])
        .range([paddingSides, w-paddingSides*2]);   // ... on the width of the graph area
                                                    // thus enabling us to draw an x-Axis

    // Scaling the height of the bars
    scaleY = d3.scale.linear()                  // Mapping the values on the height...
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
            return scaleY(d[1]);
        })
        .attr("width", w/totalYears-paddingBars*2)
        .attr("height", function(d){
            return h-scaleY(d[1])-paddingSides;
        })
        .attr("style", function(d){
            return "fill: " + d[2];
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
            return scaleX(d[0]) + (w / totalYears) / 2;
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
            (w / totalYears) / 2 + ", " + (h-paddingSides)+ ")")
        .call(xAxis);

    //Appending y-Axis:
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + paddingSides + ", "+ "0)")
        .call(yAxis);



    // Adding a slider for selecting specific years:
    $("#barSlider").rangeSlider({
        bounds: {min:minYear, max:maxYear},
        defaultValues: {min:minYear, max:maxYear},
        scales: [
            {first:function(val){return val;},
            next: function(val){return val+2;}}
        ],
        step:1
    });

    $("#barSlider").on("valuesChanging", function(e, data){
        allFilters.years.from=data.values.min;
        allFilters.years.to=data.values.max;

        filterPubJSON();

    });

}

function drawBarGraph(JSONtoDisplay){

    allFilters.award.filterForAward=true;
    allFilters.award.filterValue=true;

    // Calculate new dataset based on filters:
    var dataset = new Array(totalYears);
    var yearNow = new Date().getFullYear();

    JSONtoDisplay.forEach(function(d) {
        var index = yearNow - parseInt(d.year);

        // Inserting a dummy for the newly found index:
        if(dataset[index] == null)
            // Apply year filter:
            if (d.year < allFilters.years.from || d.year > allFilters.years.to)
                //dataset.push([d.year, 0, "rgb(0,0,255);", []]);
                dataset[index] = [d.year, 0, "rgb(0,0,255);", []];
            else
                dataset[index] = [d.year, 0, "rgb(255,0,0);", []];

        // Write the actual data to the new dataset object:
        dataset[index][1]++;
        dataset[index][3].push(d);    // Just append the whole publication...
    });
    dataset.reverse();


    // Allocating new data to all rects:

    // Joining new data to existing data
    var svg = d3.select("#barChart").selectAll("rect")
        .data(dataset)
        .attr("class", "update");

    // Position all Data
    svg.enter().append("rect")
        .attr("class", "enter")
        .attr("x", function(d, i){
                return scaleX(d[0])+paddingBars;
        });

    // Height of all data:
    svg.attr("height", function(d){
            if(d != null)
                return h-scaleY(d[1])-paddingSides;
            else
                return 0;
        })
        .attr("y", function(d){
            if(d != null)
                return scaleY(d[1]);
            else
                return h-paddingSides;
        });

    // Remove unused data
    svg.exit().remove();

    svg.attr("style", function(d){ // Filling them respectively
        if(d != null)
            return "fill: " +  d[2] + ";";
    })
}