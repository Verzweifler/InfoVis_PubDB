/**
 * Created by Fabian on 03.01.2015.
 */

// Receives a publications JSON, containing information about publications; mainly author and year
function createBarGraph(pubJSON){

    var dataset = new Array();
    var minYear=3000;
    var maxYear = 0;

    dataset.push(0);

    pubJSON.forEach(function(d){
        var index = 2015-parseInt(d.year);
        if(d.year<minYear)
            minYear= d.year;

        if(d.year>maxYear)
            maxYear= d.year;

        if(dataset.length < index+1)
            dataset.push(0);

        dataset[index]++;
    });

    console.log(dataset);
    dataset.reverse();

    // Some necessary parameters:
    var w = 500;
    var h = 200;
    var paddingBars=1;

    // creating a svg object for displaying the bars:
    var svg = d3.select("#bars")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    // Preparing the scales, so the bars fit in width and height:
    // X-Axis: Years
    var scaleX = d3.scale.linear()
        .domain([minYear, maxYear])
        .range([0, w]);

    // Scaling the height of the bars
    var scaleY = d3.scale.linear()
        .domain([0, d3.max(dataset, function(d){
            return d;
        })])
        .range([0, h]);


    // Drawing the rectangles:
    svg.selectAll("rect")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", function(d, i){
            return i * (w/dataset.length);
        })
        .attr("y", function(d){
            return h-scaleY(d);
        })
        .attr("width", w/dataset.length-paddingBars)
        .attr("height", function(d){
            return scaleY(d);
        })
        .attr("onclick", function(d){
            return "alert(" + d + ");";
        });

    // Putting labels on it:
    svg.selectAll("text")
        .data(dataset)
        .enter()
        .append("text")
        .text(function(d) {
            return d;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i) {
            return i * (w / dataset.length) + (w / dataset.length - paddingBars) / 2;
        })
        .attr("y", function(d) {
            if(scaleY(d)>15){
                return h - scaleY(d)+14;
            } else
                return h - scaleY(d)-5;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", function(d){
            if(scaleY(d)>15)
                return "white";
            else
                return "black";
        });

    // Adding x-Axis:
    //svg.append("g")
    //    .attr("class", "axis")
    //    .call(d3.svg.axis()
    //        .scale(scaleX)
    //        .orient("bottom"))
    //    .attr("transform", "translate(0," + (h - paddingSides) + ")");
    //
    //// Adding y-Axis:
    //svg.append("g")
    //    .attr("class", "axis")
    //    .call(d3.svg.axis()
    //        .scale(scaleY)
    //        .orient("left")
    //        .ticks(10))
    //    .attr("transform", "translate(" + paddingSides + ",0)");
}
