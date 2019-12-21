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
    chartGroup.append("line")
        .attr("x1", xy1.x)
        .attr("y1", xy1.y)
        .attr("x2", xy2.x)
        .attr("y2", xy2.y)
        .attr("fill", "none")
        .attr("stroke", linecolor);
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

            let outlinecolor = "black";
            addLine(chartGroup, { x: 0, y: 0 }, { x: width, y: 0 }, outlinecolor);
            addLine(chartGroup, { x: 0, y: height }, { x: width, y: height }, outlinecolor);
            addLine(chartGroup, { x: 0, y: 0 }, { x: 0, y: height }, outlinecolor);
            addLine(chartGroup, { x: width, y: 0 }, { x: width, y: height }, outlinecolor);

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
                .attr("transform", `translate(${width / 2}, ${height + 20})`)
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
                    .attr("y", -margin.left * 2 / 3) // horizontal position
                    .attr("x", -height / 2) // vertical position
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
                    .attr("y", -width - margin.right * 2 / 3) // horizontal position
                    .attr("x", height / 2 - margin.bottom) // vertical position
                    .attr("value", "yr")
                    .text("Closing Value of Right Tickers");

                plotconf.data_r.forEach(xydata => {
                    addPath(chartGroup, xydata, xTimeScale, yrLinearScale, rgb(npaths, ipath));
                    ipath = ipath + 1;
                });
            }

            //         chartGroup.append("line")          // attach a line
            // .style("stroke", "black")  // colour the line
            // .attr("x1", 100)     // x position of the first end of the line
            // .attr("y1", 50)      // y position of the first end of the line
            // .attr("x2", 300)     // x position of the second end of the line
            // .attr("y2", 150);

            // chartGroup.selectAll("circle")
            // .data(medalData)
            // .enter()
            // .append("circle")
            // .attr("cx", d => xTimeScale(d.date))
            // .attr("cy", d => yLinearScale(d.medals))
            // .attr("r", "10")
            // .attr("fill", "gold")
            // .attr("stroke-width", "1")
            // .attr("stroke", "black");


            // if(isright){
            //     plotconf.data_r.forEach((d,i) => {
            //         console.log(plotconf.name_r[i]);
            //         console.log(d.x);
            //         console.log(d.y);
            //     });
            // }

        }
    };
};


