/**
 * Created by Fabian on 03.01.2015.
 */

//var scaleX;
//var scaleY;
// Some necessary parameters:
var w = 600;
var h = 300;
var paddingBars=2;
var paddingSides = 25;
var totalYears=0;
var scaleX;
var scaleY;

// Receives a publications JSON, containing information about publications; mainly author and year
function createBarGraph(){

    var dataset = getBarDataset();

    console.log(dataset);

    totalYears= dataset.length;

    // Preparing the scales, so the bars fit in width and height: X-Axis: Years
    scaleX = d3.scale.linear()
        .domain([minYear,maxYear])
        .range([paddingSides, w-paddingSides*2]);   // ... on the width of the graph area
                                                    // thus enabling us to draw an x-Axis

    // Scaling the height of the bars
    scaleY = d3.scale.linear()                  // Mapping the values on the height...
        .domain([0, d3.max(dataset, function(d){    // from the range of the dataset...
            return d.numbers[0].y1;
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
        .attr("height", h)
        .attr("id", "barSVG");

    // Creating hulls for the stacked bars:
    var barHulls = svg.selectAll(".hull")
        .data(dataset)
        .enter().append("g")
        .attr("class", "g")
        .attr("transform", function(d){
            return "translate(" + scaleX(d.year) + ",0)";
        });

    // Drawing the actual bars inside the hulls:
    barHulls.selectAll("rect")
        .data(function(d){return d.numbers;})
        .enter().append("rect")
        .attr("width", w/totalYears-paddingBars*2)
        .attr("y", function(d){
            return scaleY(d.y1);
        })
        .attr("height", function(d){
            return scaleY(d.y0)-scaleY(d.y1);
        })
        .style("fill", function(d, i){
            return pubColors[i];
        });

    // Labels for the total height of the bars:
    svg.selectAll("text")
        .data(dataset)
        .enter()
        .append("text")
        .text(function(d) {
            return d.numbers[1].y1;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i) {
            return scaleX(d.year) + (w / totalYears) / 2;
        })
        .attr("y", function(d) {
            return scaleY(d.numbers[0].y1)-5;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "black");

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

    var colorScale = d3.scale.ordinal()
        .range(pubColors)
        .domain(["Gesamtmenge", "Nach Filter", "Ausgewählt"]);

    var legend = svg.selectAll(".legend")
        .data(colorScale.domain().slice())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i){
            return "translate(50, " + (20+i*20) + ")";
        });

    legend.append("rect")
        .attr("height", 18)
        .attr("width", 18)
        .style("fill", colorScale);

    legend.append("text")
        .attr("x", 20)
        .attr("y", 8)
        .attr("dy", ".35em")
        .text(function(d) { return d; });


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

        update();
    });

}

/**
 * This function draws three different types of bars into the barGraph-Area.
 * The three types are encoded by color, and contain three degrees of information:
 * - All information: The whole publicationsJSON
 * - remaining information: What is left of the publicationsJSON, after the filters have been applied
 * - specific information: publications connected to a selected author (from currentlySelectedNode)
 */
function updateBarGraph(){

    // Calculate new dataset based on filters:
    var dataset = getBarDataset();

    // Allocating new data to all rects
    var allHulls = d3.select("#barSVG").selectAll("g")
        .data(dataset)
        .attr("class", "update");

    //Joining new data to existing data
    var rects = allHulls.selectAll("rect")
        .data(function(d){return d.numbers;})
        .attr("class", "update")
        .transition();

    // Height of all data:
    rects.duration(750).attr("y", function(d){
            return scaleY(d.y1);
        }).attr("height", function(d){
            return scaleY(d.y0)-scaleY(d.y1);
        }).style("fill", function(d, i){
            return pubColors[i];
        });

    rects.style("fill", function(d, i){
        return pubColors[i];
    });

    // Remove unused data
    allHulls.selectAll("rect")
        .data(function(d){return d.numbers;})
        .attr("class", "update").exit().remove();
}

function getBarDataset(){
    var dataset = new Array();
    var yearNow = new Date().getFullYear();

    // Read all Data:
    publicationsJSON.forEach(function(d){
        var index = yearNow-parseInt(d.year);

        // Write initial placeholders, if necessary:
        if(dataset[index] == null)
            dataset[index] = {
                year: d.year,
                // all, remaining, specific
                numbers: [{y0:0, y1:0}, {y0:0, y1:0}, {y0:0, y1:0}]
            }

        // Writing the actual data:
        dataset[index].numbers[0].y1++;
    });


    // Read filtered data:
    filteredJSON.forEach(function(d){
        var index = yearNow-parseInt(d.year);

        // No need for checking unll values, since all data have already been written:
        dataset[index].numbers[1].y1++;
    });


    // Read selected data:
    if(currentlySelectedNode != null)
        filteredJSON.forEach(function(d){
            var index = yearNow-parseInt(d.year);

            // Only count stuff from the selected author:
            var selected=false;
            d.authors.forEach(function(actAuthor){
                if(actAuthor.name == currentlySelectedNode.key)
                    selected=true;
            });

            if(selected)
            // Writing the actual data:
                dataset[index].numbers[2].y1++;
        });


    // Don't count doubles and triples: *remaining* must not be counted in *all*,
    // and *specific* must not be counted in *remaining*
    dataset.forEach(function(d){
        // all, remaining, specific
        d.numbers[0].y0 = d.numbers[1].y1;   // Since *specific* is a part of *remaining*, it must not be subtracted here...
        d.numbers[1].y0 = d.numbers[2].y1; // ... but here.
    });

    // Put 2015 at last place
    dataset.reverse();

    return dataset;
}