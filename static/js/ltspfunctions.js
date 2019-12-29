let dateFormatter = d3.timeFormat("%m/%d/%Y");

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
});

let bisectX = d3.bisector(d => d.x).left;

let getBisectIdx = (data, x0) => {
    let i = bisectX(data, x0, 1), d0 = data[i - 1], d1 = d0;
    try {
        d1 = data[i];
        return (x0 - d0.x > d1.x - x0 ? i : i - 1);
    }
    catch (error) { return i - 1; }
}

let rgb = (n, i, a) => {
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

let updateTooltips = (chartGroup, tooltipinputs,normalized) => {

    chartGroup.selectAll("circle").remove();
    let n = tooltipinputs.length;

    let circlesGroup = chartGroup.selectAll("circle")
        .data(tooltipinputs)
        .enter()
        .append("circle")
        .attr("cx", d => d.cxy.x)
        .attr("cy", d => d.cxy.y)
        .attr("r", 7)
        .attr("stroke", (d,i) => rgb(n, i))
        .attr("stroke-width", "1px")
        .attr("fill", (d,i) => rgb(n, i, 0.2))
        .attr("opacity", "1.0");

    let toolTip = d3.tip()
        .attr("class", "d3-tip")
        .offset([0, 0])
        .html(d => `${d.name}<br>${dateFormatter(d.xy.x)}<br>${normalized == null ?currencyFormatter.format(d.xy.y):parseInt(d.xy.y)} ${normalized ==null?"":" %"}`);

    circlesGroup.call(toolTip);

    circlesGroup
        .on("mouseover", (data,i) => {
            toolTip.style("color",rgb(n,i))
            toolTip.show(data)
        })
        .on("mouseout", data => toolTip.hide(data));
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

let normalize_one_plotconf_data = (one_plotconf_data,x0,xstart,xend) => {
    let xydata = [];
    one_plotconf_data.x.forEach((date, i) => {
        if((date >= xstart) && (date <= xend)){
            xydata.push({ x: date, y: one_plotconf_data.y[i] });
        }
    });

    let idx = getBisectIdx(xydata, x0);
    let y0 = xydata[idx].y;

    let x = [];
    let y = [];

    let ymin = 0.0,ymax = 0.0,ytmp;

    xydata.forEach( xy => {
        x.push(xy.x);
        ytmp = (xy.y - y0) * 100.0 / y0;
        
        if(ytmp < ymin) ymin = ytmp;
        else if(ytmp > ymax) ymax = ytmp;

        y.push(ytmp);
    });

    return {onedata:{x:x,y:y},xminmax:[x[0],x[x.length-1]],yminmax:[ymin,ymax]};
}

// addLine("test",chartGroup,{x:chartXY[0],y:0},{x:chartXY[0],y:height},"gray","1px","stroke-dasharray","3, 3");
let addLine = (uniqueID, chartGroup, xy1, xy2, linecolor, strokewidth, linestyle, styleparam) => {
    if (uniqueID != null) {
        d3.select(`#${uniqueID}`).remove();
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

    if (uniqueID != null) {
        oneline.attr("id", uniqueID);
    }

    return oneline;
}

let addRect = (uniqueID, chartGroup, xy1, xy2, linecolor, strokewidth, fillcolor) => {
    if (uniqueID != null) {
        d3.select(`#${uniqueID}`).remove();
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

    if (uniqueID != null) {
        onerect.attr("id", uniqueID);
    }

    return true;
}

let addPath = (uniqueID, chartGroup, xydata, xrange, xScale, yScale, pathcolor) => {

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

    if (uniqueID != null) {
        d3.select(`#${uniqueID}`).remove();
    }

    let onepath = chartGroup.append("path")
        .data([xy])
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", pathcolor);

    if (uniqueID != null) {
        onepath.attr("id", uniqueID);
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

let newMinmax = (newitem,old) => {
    if(old == null) return newitem;
    if(newitem[0] > old[0]) newitem[0] = old[0];
    if(newitem[1] < old[1]) newitem[1] = old[1];
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
let addText = (uniqueID, chartGroup, xy, color) => {
    d3.select(`#ticker-${uniqueID}`).remove();

    chartGroup.append("text")
        .attr("x", xy.x)
        .attr("y", xy.y)
        .attr("font-family", "sans-serif")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("width", "60px")
        .attr("text-anchor", "middle") // left middle right
        .attr("fill", color)
        .text(uniqueID)
        .attr("id", `#ticker-${uniqueID}`);
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
        addText(name, chartGroup, { x: x, y: (iy + 1) * 20 }, rgb(npaths, ipath));
        ipath = ipath + 1;
    });
}

let plotPaths = (data, names, chartGroup, xrange, xyScale, npaths, ipath) => {
    data.forEach((xydata, i) => {
        addPath(names[i], chartGroup, xydata, xrange, xyScale[0], xyScale[1], rgb(npaths, ipath));
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
        let dxy1 = chartXY_to_XY(xy1, xTimeScale, yrLinearScale);
        let dxy2 = chartXY_to_XY(xy2, xTimeScale, yrLinearScale);
        let xyScale = handleOnClickZoom(dxy1, dxy2, xAxis, "yr", yrAxis, width, height);
        yrLinearScale = xyScale[1];
        plotPaths(plotconf_data_r, plotconf_name_r, chartGroup, [dxy1[0], dxy2[0]], xyScale, npaths, plotconf_data_l.length);
        addTickerSelections("yr", chartGroup, width, plotconf_name_r, npaths, plotconf_data_l.length);
    }

    xTimeScale = xyScale[0];

    d3.select("#selectionlineX").remove();
    d3.select("#selectionlineY").remove();
    d3.select("#selectionlineX2").remove();
    d3.select("#selectionlineY2").remove();
    d3.select("#zoomin").remove();
    d3.select("#onefive").remove();
    d3.select("#selecteddateX").remove();
    d3.select("#selecteddateY").remove();
    d3.select("#analysismessage").remove();
    chartGroup.selectAll("circle").remove();
    d3.select("#analysisPlot").remove();

    return { xScale: xTimeScale, ylScale: ylLinearScale, yrScale: yrLinearScale };
}

let normalizeData = (selecteddate,isleft,plotconf_data_l,isright,plotconf_data_r,width,height) => {
    let startdate = new Date(selecteddate);
    startdate.setFullYear(startdate.getFullYear() - 1);
    // selecteddate.setDate(selecteddate.getDate() - 365);

    let enddate = new Date(selecteddate);
    enddate.setFullYear(enddate.getFullYear() + 5);

    let data_l = [],data_r = [],xminmax = null,yminmax = null;
    if(isleft){
        plotconf_data_l.forEach((one_plotconf_data,i) => {
            let normalized = normalize_one_plotconf_data(one_plotconf_data,selecteddate,startdate,enddate);
            data_l.push(normalized.onedata);
            xminmax = newMinmax(normalized.xminmax,xminmax);
            yminmax = newMinmax(normalized.yminmax,yminmax);
        });
    }

    if(isright){
        plotconf_data_r.forEach((one_plotconf_data,i) => {
            let normalized = normalize_one_plotconf_data(one_plotconf_data,selecteddate,startdate,enddate);
            data_r.push(normalized.onedata);
            xminmax = newMinmax(normalized.xminmax,xminmax);
            yminmax = newMinmax(normalized.yminmax,yminmax);
        });
    }

    xScale = getTimeScale("x", xminmax, width);
    ylScale = getLinearScale("y", yminmax, height);
    yrScale = ylScale;

    return {
        startdate:startdate,
        selecteddate:selecteddate,
        xminmax:xminmax,
        yminmax:yminmax,
        data_l:data_l,
        data_r:data_r,
        xScale:xScale,
        ylScale:ylScale,
        yrScale:yrScale
    };
}
