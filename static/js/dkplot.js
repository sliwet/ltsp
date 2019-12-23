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

let addLine = (chartGroup, xy1, xy2, linecolor) => {
    let oneline = chartGroup.append("line")
        .attr("x1", xy1.x)
        .attr("y1", xy1.y)
        .attr("x2", xy2.x)
        .attr("y2", xy2.y)
        .attr("fill", "none")
        .attr("stroke", linecolor);
    return oneline;
}

let addRect = (chartGroup, xy1, xy2, linecolor, strokewidth, fillcolor) => {
    if (typeof fillcolor === 'undefined' || fillcolor == null) fillcolor = "none";
    let xy = { x: d3.min([xy1.x, xy2.x]), y: d3.min([xy1.y, xy2.y]) }
    let width = Math.abs(xy1.x - xy2.x);
    let height = Math.abs(xy1.y - xy2.y);

    let onerect = chartGroup.append("rect")
        .attr("x", xy.x)
        .attr("y", xy.y)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", fillcolor)
        .attr("stroke", linecolor)
        .attr("stroke-width", strokewidth);

    return onerect;
}

let addPath = (chartGroup, xydata, xScale, yScale, pathcolor) => {
    let xy = [];

    xydata.x.forEach((xdata, i) => {
        xy.push({ x: xdata, y: xydata.y[i] });
    });

    let line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    chartGroup.append("path")
        .data([xy])
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", pathcolor);
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
            addRect(chartGroup, { x: 0, y: 0 }, { x: width, y: height }, "black", "1px");

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

                plotconf.data_l.forEach(xydata => {
                    addPath(chartGroup, xydata, xTimeScale, ylLinearScale, rgb(npaths, ipath));
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

                plotconf.data_r.forEach(xydata => {
                    addPath(chartGroup, xydata, xTimeScale, yrLinearScale, rgb(npaths, ipath));
                    ipath = ipath + 1;
                });
            }

            let xy1 = [0, 0], xy2 = [0, 0];
            svg.on("mousedown", () => { //"click"
                xy1 = svgXY_to_chartXY(d3.mouse(d3.event.target), margin.left, margin.top);
                if (isinside(xy1, [0, 0], [width, height])) {
                    d3.select("#selectionline").remove();
                    selectionline = addLine(chartGroup, { x: xy1[0], y: 0 }, { x: xy1[0], y: height }, "gray");
                    selectionline.attr("id", "selectionline");
                }
                console.log(xTimeScale.invert(xy1[0]));
                if (isleft) {
                    console.log(ylLinearScale.invert(xy1[1]));
                }

                if (isright) {
                    console.log(yrLinearScale.invert(xy1[1]));
                }
            });


            svg.on("mouseup", () => {
                xy2 = svgXY_to_chartXY(d3.mouse(d3.event.target), margin.left, margin.top);
                addRect(chartGroup, {x:xy1[0],y:xy1[1]},{x:xy2[0],y:xy2[1]}, "green", "1px");
                // console.log(`Position at mouseup: ${d3.mouse(d3.event.target)}`);

            });




            // svg.on("mousemove", () => {
            //     console.log(d3.mouse(d3.event.target));
            // });




            //     var dragBehavior = d3.behavior.drag();
            //     // .on("drag", dragMove)
            //     // .on("dragstart", dragStart)
            //     // .on("dragend", dragEnd);

            // svg.call(dragBehavior);


            // console.log(xTimeScale.invert(chartxy[0]));

            // // Normally we go from data to pixels, but here we're doing pixels to data
            // let newData= {
            //   x: Math.round( xScale.invert(coords[0])),  // Takes the pixel number to convert to number
            //   y: Math.round( yScale.invert(coords[1]))
            // };

            // dataset.push(newData);   // Push data to our array

            // svg.selectAll("circle")  // For new circle, go through the update process
            //   .data(dataset)
            //   .enter()
            //   .append("circle")
            //   .attr(circleAttrs)  // Get attributes from circleAttrs var
            //   .on("mouseover", handleMouseOver)
            //   .on("mouseout", handleMouseOut);





            // let chartbox = addRect(chartGroup,{x:0,y:0},{x:width,y:height},"black","1px");
            // chartbox
            //   .on("mouseover", () => {
            //     d3.select(d3.event.target)
            //       .attr("fill", "red");
            //   })
            //   .on("mouseout", () => {
            //     d3.select(d3.event.target)
            //       .attr("fill", "green");
            //   });



            //               function findObjectCoords(mouseEvent)
            // {
            //   var obj = document.getElementById("objectBox");
            //   var obj_left = 0;
            //   var obj_top = 0;
            //   var xpos;
            //   var ypos;
            //   while (obj.offsetParent)
            //   {
            //     obj_left += obj.offsetLeft;
            //     obj_top += obj.offsetTop;
            //     obj = obj.offsetParent;
            //   }
            //   if (mouseEvent)
            //   {
            //     //FireFox
            //     xpos = mouseEvent.pageX;
            //     ypos = mouseEvent.pageY;
            //   }
            //   else
            //   {
            //     //IE
            //     xpos = window.event.x + document.body.scrollLeft - 2;
            //     ypos = window.event.y + document.body.scrollTop - 2;
            //   }
            //   xpos -= obj_left;
            //   ypos -= obj_top;
            //   document.getElementById("objectCoords").innerHTML = xpos + ", " + ypos;
            // }
            // document.getElementById("objectBox").onmousemove = findObjectCoords;

        }
    };
};


