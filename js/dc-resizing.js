var find_query = function () {
    var _map = window.location.search.substr(1).split('&').map(function (a) {
        return a.split('=');
    }).reduce(function (p, v) {
        if (v.length > 1)
            p[v[0]] = decodeURIComponent(v[1].replace(/\+/g, " "));
        else
            p[v[0]] = true;
        return p;
    }, {});
    return function (field) {
        return _map[field] || null;
    };
}();
var resizeMode = find_query('resize') || 'widhei';

function apply_resizing(chart, adjustX, adjustY, onresize) {
    if (resizeMode.toLowerCase() === 'viewbox') {
        chart
            .width(1000)
            .height(300)
            .useViewBoxResizing(true);
        d3.select(chart.anchor()).classed('fullsize', true);
    } else {
        adjustX = adjustX || 0;
        adjustY = adjustY || adjustX || 0;
        var wrapperWidth = parseInt(d3.select("#attendanceChart-wrapper").style('width'), 10) - 25;
        if (wrapperWidth < 570) {
            chart
                .width(wrapperWidth - adjustX)
                .height(260 - adjustY);
        }else {
            chart
                .width(wrapperWidth - adjustX)
                .height(300 - adjustY);
        }
        window.onresize = function () {
            var wrapperWidth = parseInt(d3.select("#attendanceChart-wrapper").style('width'), 10) - 5;
            if (onresize) {
                onresize(chart);
            }
            if (wrapperWidth < 570) {
                chart
                    .width(wrapperWidth - adjustX)
                    .height(260 - adjustY);
            }else {
                chart
                    .width(wrapperWidth - adjustX)
                    .height(300 - adjustY);
            }
            
            if (chart.rescale) {
                chart.rescale();
            }
            chart.redraw();
        };
    }
}
