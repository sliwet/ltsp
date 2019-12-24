let rgb = (n, i) => {
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
    return ["rgb(", r, ",", g, ",", b, ")"].join("");
}

// chartXYtoXY(chartXY,xTimeScale,ylLinearScale or yrLinearScale)
let chartXYtoXY = (chartXY, xScale, yScale) => {
    return [xScale.invert(chartXY[0]), yScale.invert(chartXY[1])];
}

let addLine = (uniqueID, chartGroup, xy1, xy2, linecolor) => {
    if (uniqueID != null) {
        d3.select(`#${uniqueID}`).remove();
    }

    let oneline = chartGroup.append("line")
        .attr("x1", xy1.x)
        .attr("y1", xy1.y)
        .attr("x2", xy2.x)
        .attr("y2", xy2.y)
        .attr("fill", "none")
        .attr("stroke", linecolor);

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

let addPath = (uniqueID, chartGroup, xydata, xScale, yScale, pathcolor) => {
    let xy = [];

    xydata.x.forEach((xdata, i) => {
        xy.push({ x: xdata, y: xydata.y[i] });
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

    if (chosenAxis == 'x') viewrange = [0, width_height]
    else viewrange = [width_height, 0];

    let timeScale = d3.scaleTime()
        .domain(minMax)
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

    if (chosenAxis == 'x') viewrange = [0, width_height]
    else viewrange = [width_height, 0];

    let padd = (max - min) * 0.1;

    let linearScale = d3.scaleLinear()
        .domain([min - padd, max + padd])
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

let svgXY_to_chartXY = (svgXY, leftmargin, topmargin) => {
    let chartXY = [0, 0];
    chartXY[0] = svgXY[0] - leftmargin; //margin.left;
    chartXY[1] = svgXY[1] - topmargin; //margin.top;
    return chartXY;
}

let isinside = (xy, xy1, xy2) => {
    let xminmax = d3.extent([xy1[0], xy2[0]]);
    let yminmax = d3.extent([xy1[1], xy2[1]]);

    if ((xy[0] >= xminmax[0]) && (xy[0] <= xminmax[1]) && (xy[1] >= yminmax[0]) && (xy[1] <= yminmax[1])) return true;
    else return false;
}

let lambdaSVG = (wheretoplot, plotconf, uniqueId, widthInput, heightInput, margin) => {
    return {
        init: () => {
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
            let npaths = 0;

            if (isleft) {
                npaths = npaths + plotconf.data_l.length;
                let xyminmax = getXYminmax(plotconf.data_l, [xminmax, ylminmax]);
                xminmax = xyminmax[0];
                ylminmax = xyminmax[1];
            }

            if (isright) {
                npaths = npaths + plotconf.data_r.length;
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
                .text("Date");

            let ylLinearScale = null, yrLinearScale = null, ylAxis = null, yrAxis = null, label_yl = null, label_yr = null;

            let ipath = 0;
            if (isleft) {
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
                    .text("Closing Value of Left Tickers");

                plotconf.data_l.forEach((xydata, i) => {
                    addPath(plotconf.name_l[i], chartGroup, xydata, xTimeScale, ylLinearScale, rgb(npaths, ipath));
                    ipath = ipath + 1;
                });
            }

            if (isright) {
                yrLinearScale = getLinearScale("yr", yrminmax, height);
                yrAxis = chartGroup.append("g")
                    .classed("yr-axis", true)
                    .attr("transform", `translate(${width}, 0)`)
                    .call(d3.axisRight(yrLinearScale));
                label_yr = chartGroup.append("g")
                    .attr("transform", "rotate(90)")
                    .append("text")
                    .attr("y", -width - margin.right * 0.7) // horizontal position
                    .attr("x", height * 0.5 - margin.bottom) // vertical position
                    .attr("value", "yr")
                    .text("Closing Value of Right Tickers");

                plotconf.data_r.forEach((xydata, i) => {
                    addPath(plotconf.name_r[i], chartGroup, xydata, xTimeScale, yrLinearScale, rgb(npaths, ipath));
                    ipath = ipath + 1;
                });
            }

            // mousedown, mousemove, mouseup, dblclick, click, dragstart, drag, dragend

            let xy1 = null, xy2 = null,zoombtn,onefivebtn;
            svg.on("click", () => { //"click"
                let xytmp = svgXY_to_chartXY(d3.mouse(d3.event.target), margin.left, margin.top);
                let usetmp = true;

                if (xy1 != null) {
                    if (Math.abs(xytmp[0] - xy1[0]) < 10) {
                        usetmp = false;
                        xy1 = null;
                        d3.select("#selectionlineX").remove();
                        d3.select("#selectionlineY").remove();
                    }
                }

                if (usetmp && (xy2 != null)) {
                    if (Math.abs(xytmp[0] - xy2[0]) < 10) {
                        usetmp = false;
                        xy2 = null;
                        d3.select("#selectionlineX2").remove();
                        d3.select("#selectionlineY2").remove();
                    }
                }

                if (usetmp) {
                    if (xy1 == null) {
                        if (isinside(xytmp, [0, 0], [width, height])) {
                            xy1 = xytmp;
                            addLine("selectionlineX", chartGroup, { x: xy1[0], y: 0 }, { x: xy1[0], y: height }, "gray");
                            addLine("selectionlineY", chartGroup, { x: 0, y: xy1[1] }, { x: width, y: xy1[1] }, "gray");
                        }
                    }
                    else {
                        if (isinside(xytmp, [0, 0], [width, height])) {
                            xy2 = xytmp;
                            addLine("selectionlineX2", chartGroup, { x: xy2[0], y: 0 }, { x: xy2[0], y: height }, "lightgray");
                            addLine("selectionlineY2", chartGroup, { x: 0, y: xy2[1] }, { x: width, y: xy2[1] }, "lightgray");
                        }
                    }
                }

                d3.select("#onefive").remove();
                d3.select("#zoomin").remove();

                if((xy1 != null) && (xy2 != null)){
                    d3.select(wheretoplot).append("div")
                    .append("button")
                    .attr("id", "zoomin")
                    .attr("type", "submit")
                    .attr("class", "btn btn-default")
                    .attr("position","center")
                    .text("Zoom in the selected region");

                    d3.select("#zoomin").on("click", () => {
                        console.log("Zoom in");
        
                    });
                }
                else if((xy1 != null) || (xy2 != null)){
                    d3.select(wheretoplot).append("div")
                    .append("button")
                    .attr("id", "onefive")
                    .attr("type", "submit")
                    .attr("class", "btn btn-default")
                    .attr("position","center")
                    .text("Zoom in from -1 Year to +5 years");

                    d3.select("#onefive").on("click", () => {
                        console.log("Onefive");
        
                    });
                }
            });

            svg.on("dblclick", () => {
                if (isleft) {
                    console.log(chartXYtoXY(xy1, xTimeScale, ylLinearScale));
                }

                if (isright) {
                    console.log(chartXYtoXY(xy1, xTimeScale, yrLinearScale));
                }
            });


            // svg.on("mousemove", () => {
            //     if (xy1 != null) {
            //         xy2 = svgXY_to_chartXY(d3.mouse(d3.event.target), margin.left, margin.top);
            //         addRect("selectionbox", chartGroup, { x: xy1[0], y: xy1[1] }, { x: xy2[0], y: xy2[1] }, "gray", "1px");
            //     }
            // });

            // svg.on("mouseup", () => {
            //     xy2 = svgXY_to_chartXY(d3.mouse(d3.event.target), margin.left, margin.top);
            //     let isrect = addRect("selectionbox", chartGroup, { x: xy1[0], y: xy1[1] }, { x: xy2[0], y: xy2[1] }, "gray", "1px");
            //     xy1 = null;

            //     if (isrect) {
            //         d3.select("#selectionline").remove();
            //     }
            //     else {
            //         if (isinside(xy2, [0, 0], [width, height])) {
            //             addLine("selectionline", chartGroup, { x: xy2[0], y: 0 }, { x: xy2[0], y: height }, "gray");
            //         }
            //     }

            //     if (isleft) {
            //         console.log(chartXYtoXY(xy2, xTimeScale, ylLinearScale));
            //     }

            //     if (isright) {
            //         console.log(chartXYtoXY(xy2, xTimeScale, yrLinearScale));
            //     }

            // });





        }
    };

};


