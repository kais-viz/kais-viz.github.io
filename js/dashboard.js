//Load CSV file, then draw the dashboard
d3.tsv("data/world_cup_data.tsv").then(function(tsv_file) {
    tsv_file.forEach(function(d){
        goals = d.goals.split('-');
        d.team1_goals = +goals[0];
        d.team2_goals = +goals[1];
        d.attendance = +d.attendance;
        d.date = parseDate(d.date);
    })
    draw(tsv_file);    
});

var parseDate = function (d) {
    str = d.split('-');
    return new Date(str[2].substring(0,4),
        +str[1]-1,
        +str[0],
        str[2].substring(6,8),
        str[2].substring(9,11));
};

function draw(tsv_data) {
    var data = crossfilter(tsv_data),
        wcStage = data.dimension(d=>d.stage),
        wcYear = data.dimension(d=>d.date.getFullYear()),
        wcTeam1 = data.dimension(d=>d.team1),
        wcTeam2 = data.dimension(d=>d.team2),
        wcAttSumYear = wcYear.group().reduceSum(d=>d.attendance),//group on year and sum attendance
        wcAttSumStage = wcStage.group();

    //declare charts globally
    barChart = dc.barChart('#attendanceChart');
    rowChart = dc.rowChart('#stageChart');
    selectTeam1 = dc.selectMenu('#selectTeam1');
    selectTeam2 = dc.selectMenu('#selectTeam2');


    barChart
        .x(d3.scaleBand())
        .margins({top: 15, right: 20, bottom: 38, left: 60})
        .xUnits(dc.units.ordinal)
        .brushOn(false)
        .barPadding(0.06)
        .outerPadding(0.05)
        .dimension(wcYear)
        .group(wcAttSumYear)
        .xAxisLabel('Year')
        .elasticY(true)
        .yAxisLabel('Total Attendance')
        .renderlet(function(chart){
          chart.selectAll("g.x text")
            .attr('transform', "rotate(-65) translate(-19 -9)");
        });;

    apply_resizing(barChart);

    rowChartOrder = ["GROUP STAGE","1/8 FINAL","1/4 FINAL","1/2 FINAL","PLACES 3-4","FINAL ROUND","FINAL"];

    rowChart
        .width(280).height(202)
        .margins({top: 1, right: 20, bottom: 30, left: 7})
        .elasticX(true)
        .dimension(wcStage)
        .group(wcStage.group())
        .ordering(d=>stageOrder(d.key));

    selectTeam1
        .dimension(wcTeam1)
        .group(wcTeam1.group())
        .controlsUseVisibility(true)
        .multiple(true)
        .numberVisible(11);

    selectTeam2.dimension(wcTeam2)
        .height(300)
        .group(wcTeam2.group())
        .controlsUseVisibility(true)
        .multiple(true)
        .numberVisible(11);

    filteredData = crossfilter(wcStage.filter("FINAL").top(Infinity));
    wcWinners = filteredData.dimension(d=>d.team1);
    wcStage.filterAll();

    var winnersChart = dc.pieChart("#winnersChart");

    winnersChart.width(300)
        .height(190)
        .turnOffControls()
        .slicesCap(10)
        .innerRadius(25)
        .dimension(wcWinners)
        .group(wcWinners.group())
        .legend(dc.legend())
        .cx(175)
        .on('pretransition', function(chart) {
            chart.selectAll('text.pie-slice').text(function(d) {
                return dc.utils.printSingleValue((d.endAngle - d.startAngle) / (2*Math.PI) * 100) + '%';
            })
        });

    winnersChart.filter = function() {};

    dc.override(winnersChart, 'legendables', function() {
        var legendables = this._legendables();
        return legendables.filter(function(l) {
            return l.data > 0;
        });
    });

    dc.renderAll();
    AddXAxis(d3.select("#stageChart"), "No. of Matches");
    d3.selectAll(".dc-select-menu").classed("form-control", true);

    //Adds x-axis label
    function AddXAxis(chartToUpdate, displayText) {
        chartToUpdate.select('svg')
            .append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", chartToUpdate.select('svg').attr("width")/2)
            .attr("y", chartToUpdate.select('svg').attr("height"))
            .text(displayText);
    }

    //manual reordering
    function stageOrder(key) {
        if(key == "GROUP STAGE") return 0;
        else if(key == "1/8 FINAL") return 1;
        else if(key == "1/4 FINAL") return 2;
        else if(key == "1/2 FINAL") return 3;
        else if(key == "PLACES 3-4") return 4;
        else if(key == "FINAL ROUND") return 5;
        else if(key == "FINAL") return 6;
        else return 0;
    }
  
};

//reset filters based on tag id
function selectTeam(team) {
    var select =  team == "selectTeam1" ? selectTeam1 : selectTeam2;

    select.filterAll();
    dc.renderAll();
    d3.selectAll(".dc-select-menu").attr("class", "dc-select-menu form-control");
}