let getXYlabelConf = (margin, width, height) => {
    let xylabelconf = [
        {
        },
        {  // this is for left y axis
            'y': -margin.left / 2, // horizontal position
            'x': -height / 2,          // vertical position
            'value': 'yl',
            // 'active': true,
            // 'inactive': false,
            'text': "Left Y Label"
        },
        { // this is for right y axis
            'y': width + margin.right / 2,
            'x': -height / 2,
            'value': 'yr',
            // 'active': false,
            // 'inactive': true,
            'text': "Rigth Y Label"
        }
    ];

    return xylabelconf;
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
    let parseTime = d3.timeParse("%Y-%m-%d");
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
        let xtmp = [];
        d.x.forEach(data => {
            xtmp.push(parseTime(data));
        });
        d.x = xtmp;

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

let lambSVG = (wheretoplot, plotconf, uniqueId, widthInput, heightInput, margin) => {
    return {
        init: () => {
            let svgWidth = widthInput;
            let svgHeight = heightInput;

            if (typeof margin === 'undefined' || margin == null) {
                margin = { top: 20, right: 40, bottom: 60, left: 100 };
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

            let isleft = plotconf.b_left;
            let isright = plotconf.b_right;
            let xminmax = null, ylminmax = null, yrminmax = null;

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

            let xLinearScale = getLinearScale("x", xminmax, width);
            let xAxis = chartGroup.append("g")
                .classed("x-axis", true)
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(xLinearScale));

            // let xlabel = chartGroup.append("g")
            //     .attr("transform", `translate(${width / 2}, ${height + 20})`)
            //     .append("text")
            //     .attr("x", 0)
            //     .attr("y", 20)
            //     .attr("value", "x")
            //     .text("X label here");

            let ylLinearScale = null, yrLinearScale = null, ylAxis = null, yrAxis = null, ylLabelsGroup = null, yrLabelsGroup = null;

            if (isleft) {
                ylLinearScale = getLinearScale("yl", ylminmax, height);
                ylAxis = chartGroup.append("g")
                    .classed("yl-axis", true)
                    .call(d3.axisLeft(ylLinearScale));
                ylLabelsGroup = chartGroup.append("g")
                    .attr("transform", "rotate(-90)")
            }

            if (isright) {
                yrLinearScale = getLinearScale("yr", yrminmax, height);
                yrAxis = chartGroup.append("g")
                    .classed("yr-axis", true)
                    .attr("transform", `translate(${width}, 0)`)
                    .call(d3.axisRight(yrLinearScale));
                yrLabelsGroup = chartGroup.append("g")
                    .attr("transform", `translate(${width}, 0)`)
                    .attr("transform", "rotate(-90)")
            }




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

let dkplot = (wheretoplot, plotconf) => {
    d3.select("#svgplot").remove();
    let lambRunner = lambSVG(wheretoplot, plotconf, "svgplot", window.innerWidth * 2 / 3, window.innerHeight * 2 / 3);
    lambRunner.init();
}

