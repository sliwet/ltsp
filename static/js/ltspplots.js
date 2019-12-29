
let lambdaSVG = (wheretoplot, plotconf, uniqueId, widthInput, heightInput, margin) => {
    return {
        init: () => {
            let normalized = null;
            let svgWidth = widthInput;
            let svgHeight = heightInput;

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

            let isleft = plotconf.b_left;
            let isright = plotconf.b_right;
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

            let ylLinearScale = null, yrLinearScale = null, ylAxis = null, yrAxis = null, label_yl = null, label_yr = null;

            let padding;

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

            // mousedown, mousemove, mouseup, dblclick, click, dragstart, drag, dragend
            let xTimeScale0 = xTimeScale;
            let ylLinearScale0 = ylLinearScale;
            let yrLinearScale0 = yrLinearScale;
            let xy1 = null, xy2 = null;

            svg.on("mousewheel", () => {
                let data_l = plotconf.data_l;
                let data_r = plotconf.data_r;
                let xScale = xTimeScale;
                let ylScale = ylLinearScale;
                let yrScale = yrLinearScale;

                if (normalized != null) {
                    data_l = normalized.data_l;
                    data_r = normalized.data_r;
                    xScale = normalized.xScale;
                    ylScale = normalized.yScale;
                    yrScale = normalized.yScale;
                }

                let xytmp = svgXY_to_chartXY(d3.mouse(d3.event.target), margin.left, margin.top);
                if (isinside(xytmp, [0, 0], [width, height])) {
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

                    updateTooltips(chartGroup, tooltipinputs, normalized);
                }
                else {
                    chartGroup.selectAll("circle").remove();
                }
            });

            // d3.select("#zoomout").on("click", () => {
            svg.on("dblclick", () => {
                normalized = null;
                let scales = redraw_ylyr([0, 0], [width, height], isleft, isright, xAxis, ylAxis, yrAxis, xTimeScale0, ylLinearScale0, yrLinearScale0
                    , width, height, chartGroup, npaths, plotconf.data_l, plotconf.name_l, plotconf.data_r, plotconf.name_r);

                if (isleft) label_yl.text("Closing Value of Left Tickers");
                if (isright) label_yr.text("Closing Value of Right Tickers");

                xy1 = null;
                xy2 = null;
                xTimeScale = scales.xScale;
                ylLinearScale = scales.ylScale;
                yrLinearScale = scales.yrScale;
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
                        d3.select("#infoplace").append("div")
                            .append("button")
                            .attr("id", "zoomin")
                            .attr("type", "submit")
                            .attr("class", "btn btn-default")
                            .attr("position", "center")
                            .html("Zoom in selected region");

                        d3.select("#zoomin").on("click", () => {
                            let scales = redraw_ylyr(xy1, xy2, isleft, isright, xAxis, ylAxis, yrAxis, xTimeScale, ylLinearScale, yrLinearScale
                                , width, height, chartGroup, npaths, plotconf.data_l, plotconf.name_l, plotconf.data_r, plotconf.name_r);

                            xy1 = null;
                            xy2 = null;
                            xTimeScale = scales.xScale;
                            ylLinearScale = scales.ylScale;
                            yrLinearScale = scales.yrScale;
                        });
                    }
                    else if ((xy1 != null) || (xy2 != null)) {
                        d3.select("#infoplace").append("div")
                            .append("button")
                            .attr("id", "onefive")
                            .attr("type", "submit")
                            .attr("class", "btn btn-default")
                            .attr("position", "center")
                            .html("Zoom in -1 year from selected date to +5 yrs<br>This will normalize data");

                        d3.select("#onefive").on("click", () => {
                            let selectedxy = xy1;
                            if (xy1 == null) selectedxy = xy2;

                            let yScale = yrLinearScale;
                            if (isleft) yScale = ylLinearScale;

                            let selecteddate = chartXY_to_XY(selectedxy, xTimeScale, yScale)[0];

                            normalized = normalizeData(selecteddate, isleft, plotconf.data_l, isright, plotconf.data_r);

                            normalized.xScale = getTimeScale("x", normalized.xminmax, width);
                            normalized.yScale = getLinearScale("y", normalized.yminmax, height);

                            let startxy = [normalized.xScale(normalized.xminmax[0]), 0];
                            let endxy = [normalized.xScale(normalized.xminmax[1]), height];

                            let scales = redraw_ylyr(startxy, endxy, isleft, isright, xAxis, ylAxis, yrAxis
                                , normalized.xScale, normalized.yScale, normalized.yScale, width, height
                                , chartGroup, npaths, normalized.data_l, plotconf.name_l, normalized.data_r, plotconf.name_r);

                            if (isleft) label_yl.text("Change in value (%)");
                            if (isright) label_yr.text("Change in value (%)");

                            xy1 = null;
                            xy2 = null;
                            xTimeScale = scales.xScale;
                            ylLinearScale = scales.ylScale;
                            yrLinearScale = scales.yrScale;

                            selectedxy = [normalized.xScale(selecteddate), normalized.yScale(0)];
                            addLine("selecteddateX", chartGroup, { x: selectedxy[0], y: 0 }, { x: selectedxy[0], y: height }, "gray", "1px");
                            addLine("selecteddateY", chartGroup, { x: 0, y: selectedxy[1] }, { x: width, y: selectedxy[1] }, "gray", "1px");

                            d3.select(wheretoplot).append('div')
                                .attr("id", "analysismessage")
                                .html("Click mouse on plot area to start / pause / resume analysis<br>Analysis will be done only on <b>Left top ticker</b>");
                        });
                    }
                }
                else {
                    d3.select("#analysismessage").remove();

                    console.log("input normalized behavior");
                }
            }); // end of on click
        } // end of init
    };
};
