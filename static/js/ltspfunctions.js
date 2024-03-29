// Start requestAnimationFrame
let lastTime = 0;
let vendors = ['ms', 'moz', 'webkit', 'o'];
for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
        || window[vendors[x] + 'CancelRequestAnimationFrame'];
}

if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback, element) => {
        let currTime = new Date().getTime();
        let timeToCall = Math.max(0, 16 - (currTime - lastTime));
        let id = window.setTimeout(() => { callback(currTime + timeToCall); },
            timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
}

if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = id => {
        clearTimeout(id);
    };
}
// End requestAnimationFrame

let wait = ms => {
    let d = new Date();
    let d2 = null;
    do { d2 = new Date(); }
    while (d2 - d < ms);
    return true;
}

let dateFormatter = d3.timeFormat("%m/%d/%Y");

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
});

let getColor = (n, i, a) => {
    if (typeof a === 'undefined') a = 1.0;

    let r = 255;
    let g = 0;
    let b = 0;

    if (n > 1) {
        let hn = Math.floor(n / 2);
        r = Math.floor(255 - 510 * i / n);
        if (i >= hn) r = 0;

        i = n - 1 - i;
        b = Math.floor(255 - 510 * i / n);
        if (i >= hn) b = 0;

        g = 255 - r - b;
        if (g < 0) g = 0;
    }

    r = Math.floor(r);
    g = Math.floor(g);
    b = Math.floor(b);
    return ["rgba(", r, ",", g, ",", b, ",", a, ")"].join("");
}

//This is a lambda function
// Usage 
// plotcolor = rgb(255,0,0);
// plotcolor.a(0.5) will return "rgba(255,0,0,0.5)"
// plotcolor.rgb(0,0,255)
// plotcolor.a(0.3) will return "rgba(0,0,255,0.3)"
// 
let rgb = (rr, gg, bb) => {
    let r = rr;
    let g = gg;
    let b = bb;

    return {
        rgb: (rrr, ggg, bbb) => {
            r = rrr;
            g = ggg;
            b = bbb;
        },
        a: a => {
            return ["rgba(", r, ",", g, ",", b, ",", a, ")"].join("");
        }
    };
}

//This is a lambda function
// Usage plotcolor = getFixedColor(255,0,0);
// plotcolor(0.5) will return "rgba(255,0,0,0.5)"
let getFixedColor = (rr, gg, bb) => {
    let r = rr;
    let g = gg;
    let b = bb;

    return (a) => {
        if (typeof a === 'undefined') a = 1.0;
        return ["rgba(", r, ",", g, ",", b, ",", a, ")"].join("");
    };
}

let renderCircles = (circlesGroup, cxy) => {
    circlesGroup
        .transition()
        .duration(500)
        .attr("cx", (d, i) => d.x)
        .attr("cy", (d, i) => d.y);
    return circlesGroup;
}

let addTraceCircles = (chartGroup, cxy, ms) => { // cxy [{x: value,y:value},{x: value,y:value}]
    let n = cxy.length;
    let circlesGroup = chartGroup.selectAll("circle")
        .data(cxy)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 7)
        .attr("stroke", (d, i) => getColor(n, i))
        .attr("stroke-width", "1px")
        .attr("fill", (d, i) => getColor(n, i, 0.2))
        .attr("opacity", "1.0");
    wait(ms);
}

let addFitCircles = (chartGroup, xydata,xScale,yScale, plotcolor) => { // cxy [{x: value,y:value},{x: value,y:value}]
    let xy = [];
    xydata.x.forEach((xdata, i) => {
        xy.push({ x: xScale(xdata), y: yScale(xydata.y[i]) });
    });

    let circlesGroup = chartGroup.selectAll("circle")
        .data(xy)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 7)
        .attr("stroke", plotcolor(1.0))
        .attr("stroke-width", "1px")
        .attr("fill", plotcolor(0.2))
        .attr("opacity", "1.0");
}

let addTooltipCircles = (chartGroup, tooltipinputs, toolTip) => {
    n = tooltipinputs.length;
    let circlesGroup = chartGroup.selectAll("circle")
        .data(tooltipinputs)
        .enter()
        .append("circle")
        .attr("cx", d => d.cxy.x)
        .attr("cy", d => d.cxy.y)
        .attr("r", 7)
        .attr("stroke", (d, i) => getColor(n, i))
        .attr("stroke-width", "1px")
        .attr("fill", (d, i) => getColor(n, i, 0.2))
        .attr("opacity", "1.0");

    circlesGroup.call(toolTip);

    circlesGroup
        .on("mouseover", (data, i) => {
            toolTip.style("color", getColor(n, i))
            toolTip.show(data)
        })
        .on("mouseout", data => toolTip.hide(data));

    return circlesGroup;
}

let bisectX = d3.bisector(d => d.x).left;

let getBisectIdx = (xydata, x0) => {
    let i = bisectX(xydata, x0, 1), d0 = xydata[i - 1], d1 = d0;
    try {
        d1 = xydata[i];
        return (x0 - d0.x > d1.x - x0 ? i : i - 1);
    }
    catch (error) { return i - 1; }
}

let getXYdataFromPlotConf = (one_plotconf_data) => {
    let xydata = [];
    one_plotconf_data.x.forEach((date, i) => {
        xydata.push({ x: date, y: one_plotconf_data.y[i] });
    });

    return xydata;
}

let getBisectIdxFromPlotconfdata = (one_plotconf_data, x0) => {
    return getBisectIdx(getXYdataFromPlotConf(one_plotconf_data), x0);
}

let getOne_XY_CXY = (one_plotconf_data, xScale, yScale, chartxy) => {
    let xydata = [];
    one_plotconf_data.x.forEach((date, i) => {
        xydata.push({ x: date, y: one_plotconf_data.y[i] });
    });

    let x0 = chartXY_to_XY(chartxy, xScale, yScale)[0];
    let idx = getBisectIdx(xydata, x0);

    let onexy = xydata[idx];
    let onecxy = { x: xScale(onexy.x), y: yScale(onexy.y) };
    return { onexy: onexy, onecxy: onecxy };
}

let normalize_one_plotconf_data = (one_plotconf_data, x0, xstart, xend) => {
    let xydata = [];
    one_plotconf_data.x.forEach((date, i) => {
        if ((date >= xstart) && (date <= xend)) {
            xydata.push({ x: date, y: one_plotconf_data.y[i] });
        }
    });

    if (xydata.length == 0) return { data: { x: [], y: [] }, x0idx: -1 };

    let idx = getBisectIdx(xydata, x0);
    let y0 = xydata[idx].y;

    let x = [];
    let y = [];

    let ymin = 0.0, ymax = 0.0, ytmp;

    xydata.forEach(xy => {
        x.push(xy.x);
        ytmp = (xy.y - y0) * 100.0 / y0;

        if (ytmp < ymin) ymin = ytmp;
        else if (ytmp > ymax) ymax = ytmp;

        y.push(ytmp);
    });

    return { data: { x: x, y: y }, xminmax: [x[0], x[x.length - 1]], yminmax: [ymin, ymax], x0idx: idx };
}

// addLine("test",chartGroup,{x:chartXY[0],y:0},{x:chartXY[0],y:height},"gray","1px","stroke-dasharray","3, 3");
let addLine = (uniqueId, chartGroup, xy1, xy2, linecolor, strokewidth, linestyle, styleparam) => {
    if (uniqueId != null) {
        d3.select(`#${uniqueId}`).remove();
    }

    let oneline = chartGroup.append("line")
        .attr("x1", xy1.x)
        .attr("y1", xy1.y)
        .attr("x2", xy2.x)
        .attr("y2", xy2.y)
        .attr("fill", "none")
        .attr("stroke", linecolor)
        .attr("stroke-width", strokewidth);

    if (typeof linestyle !== 'undefined')
        oneline.style(linestyle, styleparam);

    if (uniqueId != null) {
        oneline.attr("id", uniqueId);
    }

    return oneline;
}

let addRect = (uniqueId, chartGroup, xy1, xy2, linecolor, strokewidth, fillcolor) => {
    if (uniqueId != null) {
        d3.select(`#${uniqueId}`).remove();
    }

    if (typeof fillcolor === 'undefined' || fillcolor == null) fillcolor = "none";
    let xy = { x: d3.min([xy1.x, xy2.x]), y: d3.min([xy1.y, xy2.y]) }
    let width = Math.abs(xy1.x - xy2.x);
    let height = Math.abs(xy1.y - xy2.y);

    if ((width < 10) || (height < 10)) return false;

    let onerect = chartGroup.append("rect")
        .attr("x", xy.x)
        .attr("y", xy.y)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", fillcolor)
        .attr("stroke", linecolor)
        .attr("stroke-width", strokewidth);

    if (uniqueId != null) {
        onerect.attr("id", uniqueId);
    }

    return true;
}

let addPath = (uniqueId, chartGroup, xydata, xrange, xScale, yScale, pathcolor) => {

    if (xrange != null) {
        if (xrange[0] > xrange[1]) {
            let tmp = xrange[1];
            xrange[1] = xrange[0];
            xrange[0] = tmp;
        }
    }

    let xy = [];

    xydata.x.forEach((xdata, i) => {
        if (xrange == null) {
            xy.push({ x: xdata, y: xydata.y[i] });
        }
        else if ((xdata >= xrange[0]) && (xdata <= xrange[1])) {
            xy.push({ x: xdata, y: xydata.y[i] });
        }
    });

    let line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    if (uniqueId != null) {
        d3.select(`#${uniqueId}`).remove();
    }

    let onepath = chartGroup.append("path")
        .data([xy])
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", pathcolor);

    if (uniqueId != null) {
        onepath.attr("id", uniqueId);
    }
}

let getTimeScale = (chosenAxis, minMax, width_height) => {
    let min = minMax[0], max = minMax[1];
    if (min > max) {
        min = minMax[1];
        max = minMax[0];
    }

    let viewrange = [];

    if (chosenAxis == "x") viewrange = [0, width_height]
    else viewrange = [width_height, 0];

    let timeScale = d3.scaleTime()
        .domain([min, max])
        .range(viewrange);

    return timeScale;
}

let getLinearScale = (chosenAxis, minMax, width_height) => {
    let min = minMax[0], max = minMax[1];
    if (min > max) {
        min = minMax[1];
        max = minMax[0];
    }

    let viewrange = [];

    if (chosenAxis == "x") viewrange = [0, width_height]
    else viewrange = [width_height, 0];

    // let padd = (max - min) * 0.1;

    let linearScale = d3.scaleLinear()
        .domain([min, max])
        // .domain([min - padd, max + padd])
        .range(viewrange);

    return linearScale;
}

let getXYminmax = (dataset, xyminmax) => {
    let xminall = [], xmaxall = [], yminall = [], ymaxall = [];
    let minmaxtmp = [];

    if (xyminmax[0] != null) {
        xminall.push(xyminmax[0][0]);
        xmaxall.push(xyminmax[0][1]);
    }

    if (xyminmax[1] != null) {
        yminall.push(xyminmax[1][0]);
        ymaxall.push(xyminmax[1][1]);
    }

    xyminmax = [];

    dataset.forEach((d, i) => {
        minmaxtmp = d3.extent(d.x);
        xminall.push(minmaxtmp[0]);
        xmaxall.push(minmaxtmp[1]);

        minmaxtmp = d3.extent(d.y);
        yminall.push(minmaxtmp[0]);
        ymaxall.push(minmaxtmp[1]);
    });

    xyminmax.push([d3.min(xminall), d3.max(xmaxall)]);
    xyminmax.push([d3.min(yminall), d3.max(ymaxall)]);

    return xyminmax;
}

let newMinmax = (newitem, old) => {
    if (old == null) return newitem;
    if (newitem[0] > old[0]) newitem[0] = old[0];
    if (newitem[1] < old[1]) newitem[1] = old[1];
    return newitem;
}

let XY_to_ChartXY = (xy, xScale, yScale) => {
    return [xScale(xy[0]), yScale(xy[1])];
}

let chartXY_to_XY = (chartXY, xScale, yScale) => {
    return [xScale.invert(chartXY[0]), yScale.invert(chartXY[1])];
}

let svgXY_to_chartXY = (svgXY, leftmargin, topmargin) => {
    return [svgXY[0] - leftmargin, svgXY[1] - topmargin];
}

let chartXY_to_svgXY = (chartXY, leftmargin, topmargin) => {
    return [chartXY[0] + leftmargin, chartXY[1] + topmargin];
}

let svgXY_to_XY = (svgXY, xScale, yScale, leftmargin, topmargin) => {
    let chartXY = [0, 0];
    chartXY[0] = svgXY[0] - leftmargin; //margin.left;
    chartXY[1] = svgXY[1] - topmargin; //margin.top;
    return [xScale.invert(chartXY[0]), yScale.invert(chartXY[1])];
}

let XY_to_svgXY = (xy, xScale, yScale, leftmargin, topmargin) => {
    return [xScale(xy[0]) + leftmargin, yScale(xy[1]) + topmargin];
}

let isinside = (xy, xy1, xy2) => {
    let xminmax = d3.extent([xy1[0], xy2[0]]);
    let yminmax = d3.extent([xy1[1], xy2[1]]);

    if ((xy[0] >= xminmax[0]) && (xy[0] <= xminmax[1]) && (xy[1] >= yminmax[0]) && (xy[1] <= yminmax[1])) return true;
    else return false;
}

let handleOnClickZoom = (dxy1, dxy2, xAxis, yl_yr, yAxis, width, height) => {
    xScale = getTimeScale("x", [dxy1[0], dxy2[0]], width);
    renderAxis("x", xAxis, xScale);

    yScale = getLinearScale(yl_yr, [dxy1[1], dxy2[1]], height);
    renderAxis(yl_yr, yAxis, yScale);

    return [xScale, yScale];
}

let renderAxis = (XorY, newAxis, scale) => {
    let axis = null;

    if (XorY == 'x') axis = d3.axisBottom(scale);
    else if (XorY == 'yl') axis = d3.axisLeft(scale);
    else axis = d3.axisRight(scale);

    newAxis.transition().duration(1000).call(axis);
    return newAxis;
}

//weight: "bold", "normal" , location: "left", "middle", "right"
let addText = (uniqueId,text, chartGroup, xy, color) => {
    d3.select(`#ticker-${uniqueId}`).remove();

    chartGroup.append("text")
        .attr("x", xy.x)
        .attr("y", xy.y)
        .attr("font-family", "sans-serif")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("width", "60px")
        .attr("text-anchor", "middle") // left middle right
        .attr("fill", color)
        .text(text)
        .attr("id", `#ticker-${uniqueId}`);
}

let addTickerSelections = (ylr, chartGroup, width, names, npaths, ipath) => {
    let ioffset = 0;
    let x = 50;
    if (ylr == 'yr') {
        ioffset = -ipath;
        x = width - 50;
    }

    names.forEach((name, i) => {
        let iy = ipath + ioffset;
        addText(name,name, chartGroup, { x: x, y: (iy + 1) * 20 }, getColor(npaths, ipath));
        ipath = ipath + 1;
    });
}

let plotPaths = (data, names, chartGroup, xrange, xyScale, npaths, ipath) => {
    data.forEach((xydata, i) => {
        addPath(names[i], chartGroup, xydata, xrange, xyScale[0], xyScale[1], getColor(npaths, ipath));
        ipath = ipath + 1;
    });
}

let redraw_ylyr = (xy1, xy2, isleft, isright, xAxis, ylAxis, yrAxis, xTimeScale, ylLinearScale, yrLinearScale
    , width, height, chartGroup, npaths, plotconf_data_l, plotconf_name_l, plotconf_data_r, plotconf_name_r) => {

    let dxy1, dxy2, xyScale;
    if (isleft) {
        dxy1 = chartXY_to_XY(xy1, xTimeScale, ylLinearScale);
        dxy2 = chartXY_to_XY(xy2, xTimeScale, ylLinearScale);
        xyScale = handleOnClickZoom(dxy1, dxy2, xAxis, "yl", ylAxis, width, height);
        ylLinearScale = xyScale[1];
        plotPaths(plotconf_data_l, plotconf_name_l, chartGroup, [dxy1[0], dxy2[0]], xyScale, npaths, 0);
        addTickerSelections("yl", chartGroup, width, plotconf_name_l, npaths, 0);
    }

    if (isright) {
        dxy1 = chartXY_to_XY(xy1, xTimeScale, yrLinearScale);
        dxy2 = chartXY_to_XY(xy2, xTimeScale, yrLinearScale);
        xyScale = handleOnClickZoom(dxy1, dxy2, xAxis, "yr", yrAxis, width, height);
        yrLinearScale = xyScale[1];
        plotPaths(plotconf_data_r, plotconf_name_r, chartGroup, [dxy1[0], dxy2[0]], xyScale, npaths, plotconf_data_l.length);
        addTickerSelections("yr", chartGroup, width, plotconf_name_r, npaths, plotconf_data_l.length);
    }

    xTimeScale = xyScale[0];

    d3.select("#selectionlineX").remove();
    d3.select("#selectionlineY").remove();
    d3.select("#selectionlineX2").remove();
    d3.select("#selectionlineY2").remove();
    d3.select("#selecteddateX").remove();
    d3.select("#selecteddateY").remove();
    d3.select("#zoomin").remove();
    d3.select("#onefive").remove();
    d3.select("#fitplotPlace").remove();
    d3.select("#refreshRateDiv").remove();
    d3.select("#analysismessage").remove();
    chartGroup.selectAll("circle").remove();

    return { xScale: xTimeScale, ylScale: ylLinearScale, yrScale: yrLinearScale };
}

let normalizeData = (selecteddate, isleft, plotconf_data_l, isright, plotconf_data_r, width, height) => {
    let startdate = new Date(selecteddate);
    startdate.setFullYear(startdate.getFullYear() - 1);
    // selecteddate.setDate(selecteddate.getDate() - 365);

    let enddate = new Date(selecteddate);
    enddate.setFullYear(enddate.getFullYear() + 5);

    let data_l = [], data_r = [], xminmax = null, yminmax = null, x0idx_l = [], x0idx_r = [];
    if (isleft) {
        plotconf_data_l.forEach((one_plotconf_data, i) => {
            let normalized = normalize_one_plotconf_data(one_plotconf_data, selecteddate, startdate, enddate);
            data_l.push(normalized.data);
            x0idx_l.push(normalized.x0idx);
            if (normalized.data.x.length > 0) {
                xminmax = newMinmax(normalized.xminmax, xminmax);
                yminmax = newMinmax(normalized.yminmax, yminmax);
            }
        });
    }

    if (isright) {
        plotconf_data_r.forEach((one_plotconf_data, i) => {
            let normalized = normalize_one_plotconf_data(one_plotconf_data, selecteddate, startdate, enddate);
            data_r.push(normalized.data);
            x0idx_r.push(normalized.x0idx);
            if (normalized.data.x.length > 0) {
                xminmax = newMinmax(normalized.xminmax, xminmax);
                yminmax = newMinmax(normalized.yminmax, yminmax);
            }
        });
    }

    xScale = getTimeScale("x", xminmax, width);
    ylScale = getLinearScale("y", yminmax, height);
    yrScale = ylScale;

    return {
        x0idx_l: x0idx_l,
        x0idx_r: x0idx_r,
        data_l: data_l,
        data_r: data_r,
        xScale: xScale,
        ylScale: ylScale,
        yrScale: yrScale
    };
}

let setTooltips = (chartGroup, circlesGroup, isleft, isright, data_l, data_r
    , xScale, ylScale, yrScale, xytmp, plotconf_name_l, plotconf_name_r, toolTip) => {
    if (circlesGroup != null) {
        circlesGroup.call(data => toolTip.hide(data));
        circlesGroup = null;
        chartGroup.selectAll("circle").remove();
    }

    let tooltipinputs = [];
    if (isleft) {
        data_l.forEach((one_plotconf_data, i) => {
            let xy_cxy = getOne_XY_CXY(one_plotconf_data, xScale, ylScale, xytmp);
            tooltipinputs.push({ xy: xy_cxy.onexy, cxy: xy_cxy.onecxy, name: plotconf_name_l[i] });
        });
    }

    if (isright) {
        data_r.forEach((one_plotconf_data, i) => {
            let xy_cxy = getOne_XY_CXY(one_plotconf_data, xScale, yrScale, xytmp);
            tooltipinputs.push({ xy: xy_cxy.onexy, cxy: xy_cxy.onecxy, name: plotconf_name_r[i] });
        });
    }

    return addTooltipCircles(chartGroup, tooltipinputs, toolTip);
}

let getFitdata = (data, animationidx) => {
    let nhalf = 5;
    let ii = [nhalf, 0, 0];

    ii[1] = animationidx - nhalf;

    if (ii[1] < 0) {
        ii[1] = 0;
        ii[0] = animationidx;
    }

    ii[2] = ii[1] + 2 * nhalf + 1;

    if (ii[2] > data.x.length) {
        ii[0] = nhalf + ii[2] - data.x.length;
        ii[2] = data.x.length;
        ii[1] = ii[2] - 2 * nhalf - 1;
    }

    let x = [], y = [];

    for (let i = ii[1]; i < ii[2]; i++) {
        x.push(i - ii[1] - ii[0]);
        y.push(data.y[i]);
    }

    return { x: x, y: y};
    // return { x: x, y: y, idx: ii[0] };
}

let Sum = x => {
    let sum = 0;
    for (let i = 0; i < x.length; i++) {
        sum += x[i];
    }
    return sum;
}

let SumXY = (x, y) => {
    let sumXY = 0;
    for (let i = 0; i < x.length; i++) {
        sumXY += x[i] * y[i];
    }
    return sumXY;
}

let SumSq = x => {
    let sumSq = 0;
    for (let i = 0; i < x.length; i++) {
        sumSq += x[i] * x[i];
    }
    return sumSq;
}

let LinearRegression = (xx, yy) => {
    if (yy == null) return null;
    else if (yy.length < 2) return null;

    let sumx = Sum(xx), sumy = Sum(yy), sumxy = SumXY(xx, yy);
    let n = xx.length;


    let Sxy = sumxy - sumx * sumy / n;
    let Sxx = SumSq(xx) - sumx * sumx / n;
    let Syy = SumSq(yy) - sumy * sumy / n;

    let m = Sxy / Sxx;
    let b = sumy / n - m * sumx / n;
    let r2 = Sxy * Sxy / Sxx / Syy;

    let x = [], y = [];

    xx.forEach(xval => {
        x.push(xval);
        y.push(b + m * xval);
    })

    return { b: b, m: m, r2: r2, x: x, y: y };
}

