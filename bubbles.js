function scrollBubbles() {
    var width = 1400;
    var height = 800;
    var yearCenters = {
        0: {x: width/2, y: height/2},
        2000: { x: 1*width/5 - 100, y: height / 2 },
        2004: { x: 2*width/5 - 100, y: height / 2 },
        2008: { x: 3*width/5 - 100, y: height / 2 },
        2012: { x: 4*width/5 - 100, y: height / 2 },
        2016: { x: 5*width/5 - 100, y: height / 2 }
    };
    
    // X locations of the year titles.
    var yearsTitleX = {
        2000: 1*width/5 - 100,
        2004: 2*width/5 - 100,
        2008: 3*width/5 - 100,
        2012: 4*width/5 - 100,
        2016: 5*width/5 - 100
    };
    var svg = null;
    var g = null;
    var margin = { top: 0, left: 20, bottom: 40, right: 10 };

    var lastIndex = -1;
    var activeIndex = 0;

    var activateFunctions = [];
    var updateFunctions = [];
    
    var simulation = d3.forceSimulation();
    var radiusScale = d3.scaleSqrt().domain([64,3434308]).range([0.5,15]);
    var colorScale = d3.scaleOrdinal()
        .domain(['Democrat', 'Republican'])
        .range(['blue', 'red']);
    var swingScale = function(majority,percentage){
        if (1-percentage >= 0.48) {
            return "purple";
        } else if (majority === "Democrat"){
            return "blue";
        } else if (majority === "Republican"){
            return "red";
        }
        // if (majority === "Democrat"){
        //     percentage = percentage*-1
        // }
        // var scaler = d3.scaleLinear()
        //     .domain([-1, 0, 1])
        //     .range(["red","purple","blue"]);
            
        // return scaler(0-percentage);
    }; 
    
    var forceX_Years = d3.forceX(function(d){
        return yearCenters[d.year].x+margin.left;
    });
    var forceY_Years = d3.forceY(function(d){
        return yearCenters[d.year].y;
    });

    var forceX_Split = d3.forceX(function(d){
        if (d.majority == "Democrat"){
            return width*(1/3)+margin.left;
        } else if (d.majority == "Republican"){
            return width*(3/4)+margin.left;
        } else {
            return width*(1/2);
        }
    });

    var forceY_Split = d3.forceY(function(d){
            return height*(1/2);
    });

    var forceX_Combine = d3.forceX(function(d){
        return width*(1/2)+margin.left;
    });

    var forceY_Combine = d3.forceY(function(d){
        return height*(1/2);
    });

    var forceCollide =  d3.forceCollide(function(d){
        return radiusScale(d.total)+2;
    });
    var charge = function(d) {
        return Math.pow(d.radius, 2.0) * 0.5
    }
    
    var chart = function (selection, year="2000") {
        selection.each(function (data) {
            svg = d3.select(this).selectAll('svg').data([data]);
            var svgE = svg.enter().append('svg');
            svg = svg.merge(svgE);

            svg.attr('width', width + margin.left + margin.right);
            svg.attr('height', height + margin.top + margin.bottom);

            svg.append('g');
            g = svg.select('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
            var filteredData = data.filter(function(d) { 
                if( (d["total"] > 0) && (Math.random() < 0.2)){ 
                    return d;
                } 
            });

            var counties = filteredData.map(function(d) {
                return {
                    id: d.county_fips,
                    name: d.county_name,
                    state: d.state,
                    majority: d.majority,
                    winning_percentage: d.percentage,
                    total: d.total,
                    year: d.year,
                    //color: d.color,
                    radius: radiusScale(d.total),
                    x: width/2,
                    y: height/2
                }
            });
            //console.log(counties)
            runNarrative(filteredData);
            setupSections();
        });
    };
    //console.log(g)
    var runNarrative = function(filteredNodes){
        g.append('text')
            .attr('class', 'title narrativeviz-title')
            .attr('x', width / 2)
            .attr('y', height / 3)
            .text('The Poltical Divide');
  
        g.append('text')
            .attr('class', 'sub-title narrativeviz-title')
            .attr('x', width / 2)
            .attr('y', (height / 3) + (height / 10))
            .text('U.S. Presidential Election Voting by Precinct.  Scroll Down')

        g.selectAll('.narrativeviz-title')
            .attr('opacity', 0);
  
        g.append('text')
            .attr('class', 'title countycount-title highlight')
            .attr('x', width / 2)
            .attr('y', height / 3)
            .text('> 3,000 Counties');
  
        g.append('text')
            .attr('class', 'sub-title countycount-title')
            .attr('x', width / 2)
            .attr('y', (height / 3) + (height / 5))
            .text('across the nation vote in the Presidential election');
  
        g.selectAll('.countycount-title')
            .attr('opacity', 0);
        
        simulation.nodes(filteredNodes)
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(function(d) {
                return radiusScale(d.total) + 2
            }))
            .force("many",d3.forceManyBody().distanceMin(10).distanceMax(50))
            //.force('charge', d3.forceManyBody().strength(-1))
            .force("x", d3.forceX(yearCenters[0].x).strength(0.04))
            .force("y", d3.forceY(yearCenters[0].y).strength(0.04))
            .alphaMin(0.03)
            .alphaTarget(0.1)
            .alphaDecay(0.035)
            .velocityDecay(0.8)
            //.force('charge', d3.forceManyBody().strength(0.09))
        
        var Tooltip = d3.select("#bubbles")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px");
        
        var mouseover = function(d) {
            Tooltip
            .style("opacity", 1)
        }
        var mousemove = function(d) {
            Tooltip
            .html('<u>' + d.county_name + ', ' + d.state + '</u>' + "<br>" +d.year+"<br>"+ d.total + " total votes <br>" + d.percentage*100 + "% going " + d.majority)
            .style("left", (d3.mouse(this)[0]+20) + "px")
            .style("top", (d3.mouse(this)[1]) + "px")
        }
        var mouseleave = function(d) {
        Tooltip
            .style("opacity", 0)
        }
        
        var circles = g.selectAll(".county")
            .data(filteredNodes)
            .enter().append("circle")
            .attr("class", "county")
            .attr("r", function(d){return radiusScale(d.total)})
            .attr("cx", width/2)
            .attr("cy", height/2)
            .attr("fill", "grey")
            .attr('opacity', 0)
            .on("mouseover", mouseover) // What to do when hovered
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
        
        simulation
            .on("tick", ticked);

        function ticked(){
            circles.attr("cx", function(d){
                return d.x;
            });
            circles.attr("cy", function(d){
                return d.y;
            });
        }
    };

    var setupSections = function () {
        activateFunctions[0] = showTitle;
        activateFunctions[1] = showCountTitle;
        activateFunctions[2] = showCounties;
        activateFunctions[3] = colorCounties;
        activateFunctions[4] = splitCounties;
        activateFunctions[5] = swingCounties;
		activateFunctions[6] = swingCounties;
    };

    function showTitle() {
        g.selectAll('.countycount-title')
          .transition()
          .duration(0)
          .attr('opacity', 0);
    
        g.selectAll('.narrativeviz-title')
          .transition()
          .duration(600)
          .attr('opacity', 1.0);
    }

    function showCountTitle() {
        g.selectAll('.narrativeviz-title')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.county')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.countycount-title')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);
        svg.selectAll('.year').remove();
    }

    function showCounties(){
        g.selectAll('.countycount-title')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.county')
            .transition()
            .duration(600)
            .attr('opacity', 1.0)
            .attr('fill', "grey");
        //show2000Title();
    }
    function colorCounties(){
        simulation
            .force("center", d3.forceCenter(width*(1/2), height*(1/2)))
            .force("many",d3.forceManyBody().distanceMin(10).distanceMax(50))
            .force("x",forceX_Combine.strength(0.08))
            .force("y",forceY_Combine.strength(0.08))
            .alphaMin(0.03)
            .alpha(1)
            .alphaDecay(0.035)
            .velocityDecay(0.4)
            .restart();
        g.selectAll('.county')
            .transition()
            .duration(600)
            .attr('fill',function(d){
                return colorScale(d.majority)
            })
            .attr('opacity', 1.0);
    }
    function splitCounties(){
        simulation
            .force("many",d3.forceManyBody().distanceMin(10).distanceMax(35))
            .force("x",forceX_Split.strength(0.04))
            .force("y",forceY_Split.strength(0.04))
            .alphaMin(0.03)
            .alpha(1)
            .alphaDecay(0.035)
            .velocityDecay(0.4)
            .restart();
        g.selectAll('.county')
            .transition()
            .duration(600)
            .attr('fill',function(d){
                return colorScale(d.majority)
            })
            .attr('opacity', 1.0);
    }
    function swingCounties(){
        groupBubbles();

        g.selectAll('.county')
            .transition()
            .duration(600)
            .attr('fill',function(d){
                return swingScale(d.majority, d.percentage)
            })
            .attr('opacity', 1.0);
    }
    function show2000Title() {
        // Another way to do this would be to create
        // the year texts once and then just hide them.
        svg.selectAll('.year').remove();
        var years = svg.selectAll('.year')
        .data(d3.keys({0: width/2}));
        years.enter().append('text')
          .attr('class', 'year')
          .attr('x', width/2)
          .attr('y', 40)
          .attr('text-anchor', 'middle')
          .text("2000");
    }
    function showYears() {
        // Another way to do this would be to create
        // the year texts once and then just hide them.
        svg.selectAll('.year').remove();
        var yearsData = d3.keys(yearsTitleX);
        var years = svg.selectAll('.year')
          .data(yearsData);
    
        years.enter().append('text')
          .attr('class', 'year')
          .attr('x', function (d) { return yearsTitleX[d]; })
          .attr('y', 40)
          .attr('text-anchor', 'middle')
          .text(function (d) { return d; });
    }
    function hideYears() {
        svg.selectAll('.year').remove();
        //show2000Title();
    }
    
    function splitToYears() {
        showYears();
        simulation
            .force("many",d3.forceManyBody().distanceMin(15).distanceMax(30))
            .force("x",forceX_Years.strength(0.04))
            .force("y",forceY_Years.strength(0.04))
            .alphaMin(0.03)
            .alpha(1)
            .alphaDecay(0.035)
            .velocityDecay(0.2)
            .restart();
    }
    function groupBubbles() {
        hideYears();
        simulation
            .force("center", d3.forceCenter(width*(1/2), height*(1/2)))
            .force("many",d3.forceManyBody().distanceMin(15).distanceMax(100))
            .force("x",forceX_Split.strength(0.08))
            .force("y",forceY_Split.strength(0.08))
            .alphaMin(0.03)
            .alpha(1)
            .alphaDecay(0.035)
            .velocityDecay(0.4)
            .restart();
    }

    chart.toggleDisplay = function (displayName) {
        if (displayName === 'ByYear') {
            splitToYears();
        } else {
            groupBubbles();
        }
    };
    
    chart.activate = function (index) {
        activeIndex = index;
        var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
        var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
        scrolledSections.forEach(function (i) {
            activateFunctions[i]();
        });
        lastIndex = activeIndex;
    };

    return chart;
};

var plot = scrollBubbles();
function setupButtons() {
    d3.select('#toolbar')
      .selectAll('.button')
      .on('click', function () {
        // Remove active class from all buttons
        d3.selectAll('.button').classed('active', false);
        // Find the button just clicked
        var button = d3.select(this);
  
        // Set it as the active button
        button.classed('active', true);
  
        // Get the id of the button
        var buttonId = button.attr('id');
  
        // Toggle the bubble chart based on
        // the currently clicked button.
        plot.toggleDisplay(buttonId);
        });
}
setupButtons();
d3.queue()
    .defer(d3.csv,"pres_year.csv")
    .await(ready)

function ready(error, data) {
    d3.select('#bubbles')
      .datum(data)
      .call(plot);
  
    var scroll = scroller()
      .container(d3.select('#graphic'));
  
    scroll(d3.selectAll('.step'));
  
    scroll.on('active', function (index) {
      d3.selectAll('.step')
        .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });
  
      plot.activate(index);
    });
}