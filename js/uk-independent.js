/*
Use D3 to load the countries.geo.json and uk-independent.csv file
*/
var parse = d3.timeParse("%d/%m/%Y");
var format = d3.timeFormat("%b %d, %Y");
d3.json("data/countries.geo.json").then(function(file1) {
  d3.csv("data/uk-independent.csv").then(function(file2) {
    file2.forEach(function(d){
      d['date'] = format(parse(d['date']));
    })
    draw(file1, file2);
  });
});

d3.select(window).on('resize', resize);

function resize() {
  var svgWidth = parseInt(d3.select('#mercator-map').style('width'));
  var svgHeight = svgWidth/1.97,
      initialMargin = 75,
      margin = svgWidth < 1140 ? initialMargin*svgWidth/1140 : initialMargin,
      marginHeight = svgWidth < 1140 ? 45*svgWidth/1140 : 45,
      width = svgWidth - margin,
      height = svgHeight - margin;
      console.log(margin);

  var projection = d3.geoMercator()
    .scale([width/7])
    .translate([width/2.1, height/1.14]);

  var path = d3.geoPath().projection(projection);

  d3.select("#mercator-map").attr("width", svgWidth).attr("height", svgHeight+marginHeight);
  d3.select("svg").attr("width", svgWidth).attr("height", svgHeight+marginHeight);

  d3.selectAll("path").attr('d', path);
}

function draw(geoData, dataIndep) {
  "use strict";
  var svgWidth = parseInt(d3.select('#mercator-map').style('width'));
  var svgHeight = svgWidth/1.97,
      margin = svgWidth < 1140 ? 75*svgWidth/1140 : 75,
      marginHeight = svgWidth < 1140 ? 45*svgWidth/1140 : 45,
      width = svgWidth - margin,
      height = svgHeight - margin;

  var projection = d3.geoMercator()
    .scale(width/7)
    .translate([width / 2.1, height / 1.14]);

  var countryArr = []; // list of countries
  dataIndep.forEach(d=>countryArr.push(d.name));

  var tooltip = d3.select("#mercator-map").append("div") 
    .attr("class", "tooltip")       
    .style("opacity", 0);

  var svg = d3.select("#mercator-map")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight+marginHeight)
    .append('g')
    .attr('class', 'map');

  var path = d3.geoPath().projection(projection);
  var map = svg.selectAll('path')
    .data(geoData.features)
    .enter()
    .append('path')
    .attr('d', path)
    .style('fill', updateCountries)
    .style('stroke', '#666')
    .style('stroke-width', 0.5);

  var countryId = 0;
  var countryInterval = setInterval(function() {
    updateHeader(countryArr[countryId]);
    countryId++;
    d3.select("#mercator-map").on("click", function(){
    	clearInterval(countryInterval);
	    d3.select("h1").text("Countries that have gained independence from the UK");
	    pathTooltip();
    });

    if(countryId >= countryArr.length) {
      clearInterval(countryInterval);
      d3.select("h1").text("Countries that have gained independence from the UK");
      pathTooltip();
    }
  }, 1400);

  //if country is found in the array, return lightblue, else return white
  function updateCountries(d) {
    return countryArr.indexOf(d.properties.name) !== -1 ? "lightBlue" : "white";
  }

  // update title of the page with the current country, ordered alphabetically for now
  function updateHeader(country) {
    d3.select("h1")
    .text(country + "Countries that have gained its independence from the UK on " + getYear(country));
    // .text("Countries that have gained independence from the UK - " + country);

    svg.selectAll('path')
      .style('fill', d=>(country === d.properties.name) ? "lightblue" : "white")
      .style('stroke', '#666');
  }

  function getYear(country){
    return dataIndep.find(x=>x.name === country) !== undefined ? 
    dataIndep.find(x=>x.name === country).date : -1;
  }
  
  function pathTooltip () {
    var currentCountry;
    var currentFill;

    svg.selectAll('path')
      .style('fill', updateCountries)
      .style('stroke', '#666')
      .on("mouseover", function(d) { 
        currentCountry = this;
        currentFill = d3.select(this).style('fill');
        currentFill == "lightblue" ? d3.select(this).style('fill', '#9bc2cf') : d3.select(this).style('fill', '#f9f9f9');
        d3.select(this).style('stroke-width', '1px');
        var year = getYear(d.properties.name);
        tooltip.transition()    
          .duration(100)    
          .style("opacity", .9);    
        tooltip.html(year == -1 ? d.properties.name : d.properties.name + "<br/>" + getYear(d.properties.name))
          .style("left", (d3.mouse(this)[0] +25) + "px")   
          .style("top", (d3.mouse(this)[1]+15) + "px"); 
      })    
      .on("mouseout", function(d) {   
        d3.select(currentCountry).style('fill', currentFill);
        d3.select(currentCountry).style('stroke-width', '0.5px');
        tooltip.style("opacity", 0); 
      });
  }
};