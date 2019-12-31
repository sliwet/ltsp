
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
                    .style("stroke", "red")
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
                    .style("stroke", "blue")
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

            let circlesGroup = null;

            svg.on("mousewheel", () => {
                let xytmp = svgXY_to_chartXY(d3.mouse(d3.event.target), margin.left, margin.top);
                if (isinside(xytmp, [0, 0], [width, height])) {
                    if (circlesGroup != null) {
                        circlesGroup.call(data => toolTip.hide(data));
                        circlesGroup = null;
                        chartGroup.selectAll("circle").remove();
                    }

                    let tooltipinputs = [];
                    if (isleft) {
                        data_l.forEach((one_plotconf_data, i) => {
                            let xy_cxy = getOne_XY_CXY(one_plotconf_data, xScale, ylScale, xytmp);
                            tooltipinputs.push({ xy: xy_cxy.onexy, cxy: xy_cxy.onecxy, name: plotconf.name_l[i] });
                        });
                    }

                    if (isright) {
                        data_r.forEach((one_plotconf_data, i) => {
                            let xy_cxy = getOne_XY_CXY(one_plotconf_data, xScale, yrScale, xytmp);
                            tooltipinputs.push({ xy: xy_cxy.onexy, cxy: xy_cxy.onecxy, name: plotconf.name_r[i] });
                        });
                    }

                    circlesGroup = getCirclesGroup(chartGroup, tooltipinputs, toolTip);

                }
                else {
                    chartGroup.selectAll("circle").remove();
                }
            });

            // d3.select("#zoomout").on("click", () => {
            svg.on("dblclick", () => {
                normalized = null;

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

                            d3.select(wheretoplot).append('div')
                                .attr("id", "analysismessage")
                                .html("Click mouse on plot area to start / pause / resume analysis<br>Analysis will be done only on <b>left top ticker and right bottom ticker</b>");
                        });
                    }
                }
                else {
                    d3.select("#analysismessage").remove();
                    d3.select("#fitPlot").remove();

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

                    // for(let i = startidx;i <= endidx; i++){

                    // }



                    if(useleft) console.log(ndata_l.x[startidx]);
                    else console.log(ndata_r.x[startidx]);








                    // x0idx_l:x0idx_l,
                    // x0idx_r:x0idx_r,
                    // data_l: data_l,
                    // data_r: data_r,
                    // xScale: xScale,
                    // ylScale: ylScale,
                    // yrScale: yrScale


                    // data_l = normalized.data_l;
                    // data_r = normalized.data_r;
                    // xScale = normalized.xScale;
                    // ylScale = normalized.ylScale;
                    // yrScale = normalized.yrScale;







                    let test = new easyplotSVG(wheretoplot, normalized, "fitPlot", svgWidth, svgHeight);
                    test.test("print this");

                }
            }); // end of on click
        } // end of init
    };
};


// let plotconf = {
//     isleft: isleft, boolean
//     name_l: lt, ["name1","name2",...]
//     data_l: ld, [{x:[],y:[]},{x:[],y:[]},...]
//     isright: isright, boolean
//     name_r: rt, ["name1","name2",...]
//     data_r: rd, [{x:[],y:[]},{x:[],y:[]},...]
// }

class easyplotSVG {
    constructor(wheretoplot, plotconf, uniqueId, svgWidth, svgHeight, margin) {
        this.wheretoplot = wheretoplot;
        this.plotconf = plotconf;
        this.uniqueId = uniqueId;
        this.svgWidth = svgWidth;
        this.svgHeight = svgHeight;
        this.margin = margin;
    }

    test(strtest) {
        d3.select(this.wheretoplot).append("div").attr("id", this.uniqueId).html(`${this.wheretoplot} : ${strtest}`);
    }

}
