var svg = d3.select("svg").attr("id", "chart");
var svgWidth = parseInt(svg.style('width'), 10),
	svgHeight = parseInt(svg.style('height'), 10),
	aspect = svgWidth / svgHeight;

var margin = {top: 20, right: 45, bottom: 30, left: 40},
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;
// add viewBox and preserveAspectRatio properties,
svg.attr("viewBox", "0 0 " + svgWidth + " " + svgHeight);

function draw(data, width, height) {
  var bisectDate = d3.bisector(d=> d.year).left;

  var x = d3.scaleTime().range([0, width]),
      y = d3.scaleLinear().range([height, 0])
      z = d3.scaleOrdinal(d3.schemeCategory10);

  var g = svg.append("g")
    .attr("class", "chart")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  var productsArr = Object.keys(data[0]).slice(1,7);
  var dataExtents = productsArr.map(function(products) {
        return d3.extent(data, d=>d[products]);
  });
  var extents = [d3.min(dataExtents, d=>d[0]),
        d3.max(dataExtents, d=>d[1])];

  x.domain(d3.extent(data, d=>d.year));
  y.domain([extents[0]/1.005, extents[1]*1.1]);

  productsArr.sort();
  z.domain(productsArr);


  var linesArr = [d3.line().x(d=>x(d.year)).y(d=>y(d[productsArr[0]])),
            d3.line().x(d=>x(d.year)).y(d=>y(d[productsArr[1]])),
            d3.line().x(d=>x(d.year)).y(d=>y(d[productsArr[2]])),
            d3.line().x(d=>x(d.year)).y(d=>y(d[productsArr[3]])),
            d3.line().x(d=>x(d.year)).y(d=>y(d[productsArr[4]])),
            d3.line().x(d=>x(d.year)).y(d=>y(d[productsArr[5]]))];

  /* Draw X and Y Axis (Moved down so that axis titles appear above chart lines */
  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
    .append("text")
      .attr("class", "axis-title")
      .attr("y", -10)
      .attr("x", width)
      .attr("dy", ".70em")
      .style("text-anchor", "end")
      .attr("fill", "#5D6971")
      .text("Year");

  g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y).ticks(6).tickFormat(d=>parseInt(d)+"%")).append("text")
      .attr("class", "axis-title")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".70em")
      .style("text-anchor", "end")
      .attr("fill", "#5D6971")
      .text("Percentage"); 

  /* Draw Legend */
  var legend = d3.select(".chart-wrapper").append("div").attr("class", "legend").style("width", width).style("height", height);
  for (var i = 0; i < productsArr.length; i++) {
    series = legend.append('div');
    series.append('div').attr("class", "series-marker").style("background-color", z(productsArr[i]));
    //capitalise first letter of each product
    var product = productsArr[i] == "natural_gas" ? "Natural Gas" : productsArr[i].charAt(0).toUpperCase() + productsArr[i].substr(1);
    series.append('p').text(product);
  }
  
  //SVG element creation rearranged this way in order to draw tooltips last to appear on top
  for (let i = 0; i < productsArr.length; i++) { 
      drawPath("line"+(i+1), linesArr[i], productsArr[i]);
  }

  var focus = g.append("g")
      .attr("class", "focus")
      .style("display", "none");

  focus.append("line")
      .attr("class", "x-hover-line hover-line")
      .attr("y1", 0)
      .attr("y2", height);

  for (let i = 0; i < productsArr.length; i++) { 
      createLine("line"+(i+1), linesArr[i], productsArr[i]);
  }

  svg.append("rect")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .on("mouseover", function() { focus.style("display", null); })
    .on("mouseout", function() { focus.style("display", "none"); })
    .on("mousemove", function(){
      mouseMove(this);
    });

  /*
    d3.mouse(this) gives us mouse co-ordinates
    x is a function of d3.scaleTime, x.invert returns the equivalent year value 
    bisectDate returns the index of the smaller year value in the array (because we used bisector().left)
    d0 is the data for the smaller year value
    d1 is the data for the bigger year value
    d compares to see the mouse is closer to which year in order to show the data for it on the line
   */
  function mouseMove(element) {
    var x0 = x.invert(d3.mouse(element)[0]),
        i = bisectDate(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.year > d1.year - x0 ? d1 : d0;
        index = d === d1 ? i : i - 1;
    focus.select(".x-hover-line")
        .attr("y2", height - y(d["max"]))
        .attr("transform", "translate(" + x(d.year) + "," + y(d["max"]) + ")");

    for (let i = 0; i < productsArr.length; i++) {
        toolTip(".gline"+(i+1), d.year, d[productsArr[i]]);
    }
  }

  function toolTip(className, year, product) {
    let elem = focus.select(className);
    elem.attr("transform", "translate(" + x(year) + "," + y(product) + ")");
    elem.select("text").text(function() { return product; });
  }

  // function toolTipNew(data, products) {
  //   //sort descending based on value
  //   function compare(a,b) {
  //     if (a.value > b.value)
  //       return -1;
  //     if (a.value < b.value)
  //       return 1;
  //     return 0;
  //   }
  //   let tempPercentage = [];
  //   Object.keys(data).forEach(function(key) {
  //     if (key != "year" && key != "max" && key != "min"){
  //       // tempPercentage.push([key, data[key]]);
  //       tempPercentage.push({product : key, value : data[key]});
  //     }
  //   });
  //   tempPercentage.sort(compare);

  //   for (let i = 0; i < products.length-1; i++) {
  //     var x0 = tempPercentage[i].value;
  //     var x1 = tempPercentage[i+1].value;
  //     var diff = Math.abs(x0-x1);
  //     if(diff < 1.4 ){
  //       var offset = (1.4-diff);
  //       tempPercentage[i].value = Math.round((x0 + offset) * 10) / 10;
  //     }
  //   }

  //   for (let i = 0; i < products.length; i++) {
  //     var productVal = tempPercentage.find(d=>d.product === products[i]).value;
  //     let elem = focus.select(".gline"+(i+1));
  //     elem.attr("transform", "translate(" + x(data.year) + "," + y(data[products[i]]) + ")");
  //     elem.select("text").text(function() { return data[products[i]]; });
  //   }
    
  // }

  function drawPath(name, line, product) {
    g.append("path")
      .datum(data)
      .attr("class", name)
      .attr("d", line)
      .style("stroke", d=> z(product));  
  }

  function createLine(name, line, product) {
    inner_g = focus.append("g").attr("class", "g"+name);

    inner_g.append("circle")
      .attr("class", "circle-tooltip")
      .attr("r", 3);

    inner_g.append("text")
      .attr("class", "text-tooltip")
      .attr("x", 15)
      .attr("dy", ".31em");
  }
};

function resize(data) {
  var targetWidth = parseInt(d3.select("#chart-wrapper").style("width")),
  aspect = 1.92;//known value 960/500
  width = targetWidth-margin.left-margin.right;
  
  //remove already existing svg elements and legend
  d3.select("svg").selectAll("*").remove();
  d3.selectAll(".legend").remove();

  //update svg's viewBox width/height
  svg.attr("viewBox", "0 0 " + targetWidth + " " + Math.round(targetWidth / aspect));
  draw(data, width, width/aspect);
}

//parse date as year
var parse = d3.timeParse("%Y");

d3.csv("data/sourcest.csv").then(function(data) {
  data.forEach(function(d){
    d.year = parse(d.year);
    d.renewable = Math.round(+d.renewable * 10) / 10;
    d.oil = Math.round(+d.oil * 10) / 10;
    d.nuclear = Math.round(+d.nuclear * 10) / 10;
    d.coal = Math.round(+d.coal * 10) / 10;
    d.natural_gas = Math.round(+d.natural_gas * 10) / 10;
    d.hydroelectric = Math.round(+d.hydroelectric * 10) / 10;
    d.max = d3.max(Object.values(d).slice(1));
    d.min = d3.min(Object.values(d).slice(1));
  })

  var targetWidth = parseInt(d3.select("#chart-wrapper").style("width")),
  aspect = 1.92;//known value
  tempWidth = targetWidth - margin.left - margin.right;
  targetHeight = targetWidth/1.92;
  tempHeight = targetHeight - margin.top - margin.bottom;
  svg.attr("viewBox", "0 0 " + targetWidth + " " + Math.round(targetWidth/1.92));
  
  draw(data, tempWidth , tempHeight);

  d3.select(window).on("resize.#chart-wrapper", function() {
    resize(data);
  });
});