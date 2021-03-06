
let lambdaSVG = (wheretoplot, plotconf, uniqueId, svgWidth, svgHeight, margin) => {
    return {
        init: () => {
            let normalized = null;

            if (typeof margin === 'undefined' || margin == null) {
                margin = { top: 20, right: 100, bottom: 60, left: 100 };
            }
            else {
                margin.top = typeof margin.top === 'undefined' ? 20 : margin.top;
                margin.right = typeof margin.right === 'undefined' ? 20 : margin.right;
                margin.bottom = typeof margin.bottom === 'undefined' ? 20 : margin.bottom;
                margin.left = typeof margin.left === 'undefined' ? 20 : margin.left;
            }

            let width = svgWidth - margin.left - margin.right;
            let height = svgHeight - margin.top - margin.bottom;

            let svg = d3.select(wheretoplot).append("svg").attr("width", svgWidth).attr("height", svgHeight).attr("id", uniqueId);
            let chartGroup = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
            addRect("outline", chartGroup, { x: 0, y: 0 }, { x: width, y: height }, "black", "1px");

            d3.select("#onefive").remove();
            d3.select("#zoomin").remove();
            d3.select("#fitplotPlace").remove();
            d3.select("#refreshRateDiv").remove();
            d3.select("#analysismessage").remove();

            let isleft = plotconf.isleft;
            let isright = plotconf.isright;
            let xminmax = null, ylminmax = null, yrminmax = null;
            let npaths = plotconf.data_l.length + plotconf.data_r.length;

            if (isleft) {
                let xyminmax = getXYminmax(plotconf.data_l, [xminmax, ylminmax]);
                xminmax = xyminmax[0];
                ylminmax = xyminmax[1];
            }

            if (isright) {
                let xyminmax = getXYminmax(plotconf.data_r, [xminmax, yrminmax]);
                xminmax = xyminmax[0];
                yrminmax = xyminmax[1];
            }

            let xTimeScale = getTimeScale("x", xminmax, width);
            let xAxis = chartGroup.append("g")
                .classed("x-axis", true)
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(xTimeScale));

            let label_x = chartGroup.append("g")
                .attr("transform", `translate(${width * 0.5}, ${height + 20})`)
                .append("text")
                .attr("x", 0)
                .attr("y", 20)
                .attr("value", "x")
                .attr("text-anchor", "middle")
                .text("Date");

            let ylLinearScale = null, yrLinearScale = null, ylAxis = null, yrAxis = null, label_yl = null, label_yr = null, padding = 0;

            if (isleft) {
                padding = (ylminmax[1] - ylminmax[0]) * 0.1;
                ylminmax = [ylminmax[0] - padding, ylminmax[1] + padding];

                ylLinearScale = getLinearScale("yl", ylminmax, height);
                ylAxis = chartGroup.append("g")
                    .classed("yl-axis", true)
                    .call(d3.axisLeft(ylLinearScale));
                label_yl = chartGroup.append("g")
                    .attr("transform", "rotate(-90)")
                    .append("text")
                    .attr("y", -margin.left * 0.7) // horizontal position
                    .attr("x", -height * 0.5) // vertical position
                    .attr("value", "yl")
                    .attr("text-anchor", "middle")
                    .style("stroke", "black")
                    .text("Closing Value of Left Tickers");

                plotPaths(plotconf.data_l, plotconf.name_l, chartGroup, null, [xTimeScale, ylLinearScale], npaths, 0);
                addTickerSelections("yl", chartGroup, width, plotconf.name_l, npaths, 0);
            }

            if (isright) {
                padding = (yrminmax[1] - yrminmax[0]) * 0.1;
                yrminmax = [yrminmax[0] - padding, yrminmax[1] + padding];

                yrLinearScale = getLinearScale("yr", yrminmax, height);
                yrAxis = chartGroup.append("g")
                    .classed("yr-axis", true)
                    .attr("transform", `translate(${width}, 0)`)
                    .call(d3.axisRight(yrLinearScale));
                label_yr = chartGroup.append("g")
                    .attr("transform", "rotate(90)")
                    .append("text")
                    .attr("y", -width - margin.right * 0.7) // horizontal position
                    .attr("x", height * 0.5) // vertical position
                    .attr("value", "yr")
                    .attr("text-anchor", "middle")
                    .style("stroke", "black")
                    .text("Closing Value of Right Tickers");
                plotPaths(plotconf.data_r, plotconf.name_r, chartGroup, null, [xTimeScale, yrLinearScale], npaths, plotconf.data_l.length);
                addTickerSelections("yr", chartGroup, width, plotconf.name_r, npaths, plotconf.data_l.length);
            }

            let data_l0 = plotconf.data_l;
            let data_r0 = plotconf.data_r;
            let xScale0 = xTimeScale;
            let ylScale0 = ylLinearScale;
            let yrScale0 = yrLinearScale;

            let data_l = data_l0;
            let data_r = data_r0;
            let xScale = xScale0;
            let ylScale = ylScale0;
            let yrScale = yrScale0;

            let xy1 = null, xy2 = null;

            let toolTip = d3.tip()
                .attr("class", "d3-tip")
                .offset([0, 0])
                .html(d => `${d.name}<br>${dateFormatter(d.xy.x)}<br>${normalized == null ? currencyFormatter.format(d.xy.y) : parseInt(d.xy.y)} ${normalized == null ? "" : " %"}`);

            let tooltipCircles = setTooltips(chartGroup, null, isleft, isright, data_l, data_r
                , xScale, ylScale, yrScale, [0, 0], plotconf.name_l, plotconf.name_r, toolTip);
            tooltipCircles.call(data => toolTip.hide(data));
            chartGroup.selectAll("circle").remove();

            svg.on("mousewheel", () => {
                let xytmp = svgXY_to_chartXY(d3.mouse(d3.event.target), margin.left, margin.top);
                if (isinside(xytmp, [0, 0], [width, height])) {
                    tooltipCircles = setTooltips(chartGroup, tooltipCircles, isleft, isright, data_l, data_r
                        , xScale, ylScale, yrScale, xytmp, plotconf.name_l, plotconf.name_r, toolTip);
                }
                else {
                    chartGroup.selectAll("circle").remove();
                }
            });

            let requestID = null;
            let animationidx = -1;
            let paused = false;

            // d3.select("#zoomout").on("click", () => {
            svg.on("dblclick", () => {
                if (normalized != null) {
                    if (requestID != null) {
                        cancelAnimationFrame(requestID);
                        requestID = null;
                    }

                    normalized = null;
                    animationidx = -1;
                    paused = false;
                }

                data_l = data_l0;
                data_r = data_r0;

                let scales = redraw_ylyr([0, 0], [width, height], isleft, isright, xAxis, ylAxis, yrAxis, xScale0, ylScale0, yrScale0
                    , width, height, chartGroup, npaths, data_l, plotconf.name_l, data_r, plotconf.name_r);

                xScale = scales.xScale;
                ylScale = scales.ylScale;
                yrScale = scales.yrScale;

                xy1 = null;
                xy2 = null;

                if (isleft) label_yl.text("Closing Value of Left Tickers");
                if (isright) label_yr.text("Closing Value of Right Tickers");
            });

            svg.on("click", () => { //"click"
                if (normalized == null) {
                    let xytmp = svgXY_to_chartXY(d3.mouse(d3.event.target), margin.left, margin.top);
                    if (!isinside(xytmp, [0, 0], [width, height])) return;

                    let usetmp = true;
                    if (xy1 != null) {
                        if ((Math.abs(xytmp[0] - xy1[0]) < 10) || (Math.abs(xytmp[1] - xy1[1]) < 10)) {
                            usetmp = false;
                            xy1 = null;
                            d3.select("#selectionlineY").remove();
                            d3.select("#selectionlineX").remove();
                        }
                    }

                    if (usetmp && (xy2 != null)) {
                        if ((Math.abs(xytmp[0] - xy2[0]) < 10) || (Math.abs(xytmp[1] - xy2[1]) < 10)) {
                            usetmp = false;
                            xy2 = null;
                            d3.select("#selectionlineY2").remove();
                            d3.select("#selectionlineX2").remove();
                        }
                    }

                    if (usetmp) {
                        if (xy1 == null) {
                            xy1 = xytmp;
                            addLine("selectionlineY", chartGroup, { x: 0, y: xy1[1] }, { x: width, y: xy1[1] }, "lightblue", "2px");
                            addLine("selectionlineX", chartGroup, { x: xy1[0], y: 0 }, { x: xy1[0], y: height }, "lightblue", "2px");
                        }
                        else {
                            xy2 = xytmp;
                            addLine("selectionlineY2", chartGroup, { x: 0, y: xy2[1] }, { x: width, y: xy2[1] }, "lightpink", "2px");
                            addLine("selectionlineX2", chartGroup, { x: xy2[0], y: 0 }, { x: xy2[0], y: height }, "lightpink", "2px");
                        }
                    }

                    d3.select("#onefive").remove();
                    d3.select("#zoomin").remove();

                    if ((xy1 != null) && (xy2 != null)) {
                        d3.select(wheretoplot).append("div")
                            .append("button")
                            .attr("id", "zoomin")
                            .attr("type", "submit")
                            .attr("class", "btn btn-default")
                            .attr("position", "center")
                            .html("Zoom in selected region");

                        d3.select("#zoomin").on("click", () => {
                            let scales = redraw_ylyr(xy1, xy2, isleft, isright, xAxis, ylAxis, yrAxis, xScale, ylScale, yrScale
                                , width, height, chartGroup, npaths, data_l, plotconf.name_l, data_r, plotconf.name_r);

                            xScale = scales.xScale;
                            ylScale = scales.ylScale;
                            yrScale = scales.yrScale;
                            xy1 = null;
                            xy2 = null;
                        });
                    }
                    else if ((xy1 != null) || (xy2 != null)) {
                        d3.select(wheretoplot).append("div")
                            .append("button")
                            .attr("id", "onefive")
                            .attr("type", "submit")
                            .attr("class", "btn btn-default")
                            .attr("position", "center")
                            .html("Zoom in -1 year from selected date to +5 yrs<br>This will normalize data");

                        d3.select("#onefive").on("click", () => {
                            let selectedxy = xy1;
                            if (xy1 == null) selectedxy = xy2;

                            let yScale = yrScale;
                            if (isleft) yScale = ylScale;

                            let selecteddate = chartXY_to_XY(selectedxy, xScale, yScale)[0];

                            normalized = normalizeData(selecteddate, isleft, data_l, isright, data_r, width, height);

                            data_l = normalized.data_l;
                            data_r = normalized.data_r;

                            let scales = redraw_ylyr([0, 0], [width, height], isleft, isright, xAxis, ylAxis, yrAxis
                                , normalized.xScale, normalized.ylScale, normalized.yrScale, width, height
                                , chartGroup, npaths, data_l, plotconf.name_l, data_r, plotconf.name_r);

                            xScale = scales.xScale;
                            ylScale = scales.ylScale;
                            yrScale = scales.yrScale;
                            xy1 = null;
                            xy2 = null;

                            if (isleft) label_yl.text("Change in value (%)");
                            if (isright) label_yr.text("Change in value (%)");

                            selectedxy = [xScale(selecteddate), ylScale(0)];
                            addLine("selecteddateX", chartGroup, { x: selectedxy[0], y: 0 }, { x: selectedxy[0], y: height }, "gray", "1px");
                            addLine("selecteddateY", chartGroup, { x: 0, y: selectedxy[1] }, { x: width, y: selectedxy[1] }, "gray", "1px");

                            d3.select(wheretoplot).append("div").attr("id", "fitplotPlace");

                            let refreshRateDiv = d3.select(wheretoplot).append("div").attr("id", "refreshRateDiv");
                            refreshRateDiv.append("label").attr("for", "refreshRate").text("Enter refresh rate (msec) ");
                            refreshRateDiv.append("input").attr("id", "refreshRateInput")
                                .attr("name", "refreshRate").attr("type", "text").attr("value", "50");
                            refreshRateDiv.append("div").html("<br>");

                            d3.select(wheretoplot).append('div').attr("id", "analysismessage")
                                .html("Click mouse on plot area to start / pause / resume analysis<br>Analysis will be done only on <b>left top ticker and right bottom ticker</b>");

                            //     <div class="form-group">
                            //     <label for="example-form">Enter some text</label>
                            //     <input class="form-control" id="example-form-input" name="example-form" type="text">
                            //   </div>
                        });
                    }
                }
                else {
                    if (animationidx > 0) {
                        if (paused) {
                            paused = false;
                        }
                        else {
                            cancelAnimationFrame(requestID);
                            paused = true;
                            return;
                        }
                    }

                    d3.select("#analysismessage").remove();

                    let useleft = false, useright = false;

                    if (isleft) {
                        if (normalized.x0idx_l[0] > 0) useleft = true;
                    }

                    if (isright) {
                        if (normalized.x0idx_r[normalized.x0idx_r.length - 1] > 0) useright = true;
                    }

                    let ndata_l = normalized.data_l[0];
                    let ndata_r = normalized.data_r[normalized.data_r.length - 1];

                    let startidx = 0, endidx = 0;
                    if (useleft && useright) {
                        endidx = normalized.x0idx_l[0];

                        if (normalized.x0idx_l[0] > normalized.x0idx_r[normalized.x0idx_r.length - 1]) {
                            let x0 = ndata_r.x[0];
                            startidx = getBisectIdxFromPlotconfdata(ndata_l, x0);
                        }
                    }
                    else if (useleft) {
                        endidx = normalized.x0idx_l[0];
                    }
                    else if (useright) {
                        endidx = normalized.x0idx_r[normalized.x0idx_r.length - 1];
                    }
                    else return;

                    d3.event.preventDefault();
                    let refreshRate = d3.select("#refreshRateInput").property("value");

                    let animate = () => {
                        requestID = requestAnimationFrame(animate);

                        if (animationidx < 0) animationidx = startidx;

                        if (animationidx <= endidx) {
                            chartGroup.selectAll("circle").remove();

                            let cxy = [];
                            let ridx = animationidx;

                            d3.select("#fitplot").remove();

                            let plotcolor = getFixedColor(255, 0, 0);
                            let fitPlotSvg = d3.select("#fitplotPlace").append("svg").attr("width", svgWidth).attr("height", svgHeight).attr("id", "fitplot");

                            if (useleft) {
                                cxy.push({ x: xScale(ndata_l.x[animationidx]), y: ylScale(ndata_l.y[animationidx]) });

                                let data = getFitdata(ndata_l, animationidx);
                                let fitted = LinearRegression(data.x, data.y);
                                let dataNfit = { data: data, fit: fitted };

                                halfplotSVG(fitPlotSvg,ndata_l.x[animationidx], dataNfit, svgWidth, svgHeight, true, plotcolor, margin);
                                plotcolor = getFixedColor(0, 0, 255);

                                if (useright) ridx = getBisectIdxFromPlotconfdata(ndata_r, ndata_l.x[animationidx]);
                            }

                            if (useright) {
                                cxy.push({ x: xScale(ndata_r.x[ridx]), y: yrScale(ndata_r.y[ridx]) });

                                let data = getFitdata(ndata_r, ridx);
                                let fitted = LinearRegression(data.x, data.y);
                                let dataNfit = { data: data, fit: fitted };

                                halfplotSVG(fitPlotSvg,ndata_r.x[ridx], dataNfit, svgWidth, svgHeight, false, plotcolor, margin);
                            }

                            addTraceCircles(chartGroup, cxy, refreshRate); // draw circles every 100 ms

                            animationidx++;
                        } else {
                            cancelAnimationFrame(requestID);
                            animationidx = -1;
                        }
                    }

                    requestID = requestAnimationFrame(animate);
                }
            }); // end of on click
        } // end of init
    };
};

// dataNfit 
// console.log(plotcolor(0.5));

let halfplotSVG = (svg,fitdate, dataNfit, svgWidth, svgHeight, isleft, plotcolor, margin0) => {

    let data = [
        { x: dataNfit.data.x, y: dataNfit.data.y },
        { x: dataNfit.fit.x, y: dataNfit.fit.y }
    ]

    let width = (svgWidth - margin0.left - margin0.right) / 2;
    let height = svgHeight - margin0.top - margin0.bottom;

    let margin, rectid;
    if (isleft) {
        margin = { top: margin0.top, right: margin0.right + width, bottom: margin0.bottom, left: margin0.left };
        rectid = "outline_l";
    }
    else {
        margin = { top: margin0.top, right: margin0.right, bottom: margin0.bottom, left: margin0.left + width };
        rectid = "outline_r";
    }

    let chartGroup = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
    addRect(rectid, chartGroup, { x: 0, y: 0 }, { x: width, y: height }, "black", "1px");

    let xyminmax = getXYminmax(data, [null, null]);
    let xminmax = xyminmax[0];
    let yminmax = xyminmax[1];

    let xScale = getLinearScale("x", xminmax, width);
    let xAxis = chartGroup.append("g")
        .classed("x-axis", true)
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    let label_x = chartGroup.append("g")
        .attr("transform", `translate(${width * 0.5}, ${height + 20})`)
        .append("text")
        .attr("x", 0)
        .attr("y", 20)
        .attr("value", "x")
        .attr("text-anchor", "middle")
        .text("Days");

    let yScale = null, yAxis = null, label_y = null, padding = 0;
    padding = (yminmax[1] - yminmax[0]) * 0.1;
    yminmax = [yminmax[0] - padding, yminmax[1] + padding];
    yScale = getLinearScale("y", yminmax, height);
    let uniqueId,uniqueIdDate,uniqueIdslope,uniqueIdr2;

    if (isleft) {
        yAxis = chartGroup.append("g")
            .classed("yl-axis", true)
            .call(d3.axisLeft(yScale));
        label_y = chartGroup.append("g")
            .attr("transform", "rotate(-90)")
            .append("text")
            .attr("y", -margin.left * 0.7) // horizontal position
            .attr("x", -height * 0.5) // vertical position
            .attr("value", "y")
            .attr("text-anchor", "middle")
            .style("stroke", "black")
            .text("Change in value (%)");

            uniqueId = "fit_l";
            uniqueIdDate = "date_l";
            uniqueIdslope = "slope_l";
            uniqueIdr2 = "r2_l";
    }
    else {
        yAxis = chartGroup.append("g")
            .classed("yr-axis", true)
            .attr("transform", `translate(${width}, 0)`)
            .call(d3.axisRight(yScale));
        label_y = chartGroup.append("g")
            .attr("transform", "rotate(90)")
            .append("text")
            .attr("y", -width - margin.right * 0.7) // horizontal position
            .attr("x", height * 0.5) // vertical position
            .attr("value", "yr")
            .attr("text-anchor", "middle")
            .style("stroke", "black")
            .text("Change in value (%)");

            uniqueId = "fit_r";
            uniqueIdDate = "date_r";
            uniqueIdslope = "slope_r";
            uniqueIdr2 = "r2_r";
    }

    addFitCircles(chartGroup, { x: data[0].x, y: data[0].y }, xScale, yScale, plotcolor);
    addPath(uniqueId, chartGroup, { x: data[1].x, y: data[1].y }, xminmax, xScale, yScale, plotcolor(1.0));
    addText(uniqueIdDate,`Date: ${dateFormatter(fitdate)}`, chartGroup, { x: width/2, y: 20 }, plotcolor(1.0));
    addText(uniqueIdslope,`Slope: ${dataNfit.fit.m.toFixed(2)}`, chartGroup, { x: width/2, y: 40 }, plotcolor(1.0));
    addText(uniqueIdr2,`R2: ${dataNfit.fit.r2.toFixed(2)}`, chartGroup, { x: width/2, y: 60 }, plotcolor(1.0));
}
