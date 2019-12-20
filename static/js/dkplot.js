// let traces = []

// // let xmin = d3.min(data[0].x);
// // let xmax = d3.max(data[0].x);
// // console.log(`Min: ${xmin} , Max: ${xmax}`);
// for (let i = 0; i < ld.length; i++) {
//     let trace = {
//         type: "scatter",
//         mode: "lines",
//         name: lt[i],
//         x: ld[i].x,
//         y: ld[i].y,
//         line: {
//             color: rgb(ld.length, i)
//         }
//     };

//     traces.push(trace);
// }

// let layout = {
//     title: `closing prices`,
//     // xaxis: {
//     //     range: [startDate, endDate],
//     //     type: "date"
//     // },
//     // yaxis: {
//     //     autorange: true,
//     //     type: "linear"
//     // }
// };

// Plotly.newPlot("infoplace", traces, layout);





let lambSVG = (plotconf, uniqueId, widthInput, heightInput, margin) => {
    return {
        init: function () {
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

            let svg = d3.select("#infoplace").append("svg").attr("width", svgWidth).attr("height", svgHeight).attr("id", uniqueId);
            let chartGroup = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

            // plotconf.b_dual
            // plotconf.b_left
            // plotconf.data_l
            // plotconf.data_r

            // let xx = [];
            // plotconf.data_l[0].x.forEach((element,i) => {
            //     xx.push(i);
            // });

            let hairData = plotconf.data_l;

            // // Step 2: Create scale functions
            // // ==============================
            let xLinearScale = d3.scaleLinear()
                .domain([d3.min(hairData, d => d.x), d3.max(hairData, d => d.x)])
                .range([0, width]);

            let yLinearScale = d3.scaleLinear()
                .domain([d3.min(hairData, d => d.y), d3.max(hairData, d => d.y)])
                .range([height, 0]);

            // Step 3: Create axis functions
            // ==============================
            let bottomAxis = d3.axisBottom(xLinearScale);
            let leftAxis = d3.axisLeft(yLinearScale);

            // Step 4: Append Axes to the chart
            // ==============================
            chartGroup.append("g")
                .attr("transform", `translate(0, ${height})`)
                .call(bottomAxis);

            chartGroup.append("g")
                .call(leftAxis);

            // Step 5: Create Circles
            // ==============================
            let circlesGroup = chartGroup.selectAll("circle")
                .data(hairData)
                .enter()
                .append("circle")
                .attr("cx", d => xLinearScale(d.x))
                .attr("cy", d => yLinearScale(d.y))
                .attr("r", "15")
                .attr("fill", "pink")
                .attr("opacity", ".5");

            // // Step 6: Initialize tool tip
            // // ==============================
            // let toolTip = d3.tip()
            //     .attr("class", "tooltip")
            //     .offset([80, -60])
            //     .html(function (d) {
            //         return (`${d.rockband}<br>Hair length: ${d.hair_length}<br>Hits: ${d.num_hits}`);
            //     });

            // // Step 7: Create tooltip in the chart
            // // ==============================
            // chartGroup.call(toolTip);

            // // Step 8: Create event listeners to display and hide the tooltip
            // // ==============================
            // circlesGroup.on("click", function (data) {
            //     toolTip.show(data, this);
            //     d3.select(this).transition()
            //         .duration(500)
            //         .attr("fill", "black")
            //         .style("opacity", "1");
            // })
            //     // onmouseout event
            //     .on("mouseout", function (data, index) {
            //         toolTip.hide(data);
            //         d3.select(this)
            //             .attr("fill", "pink").style("opacity", "0.5");
            //     });

            // // Create axes labels
            // chartGroup.append("text")
            //     .attr("transform", "rotate(-90)")
            //     .attr("y", 0 - margin.left + 40)
            //     .attr("x", 0 - (height / 2))
            //     .attr("dy", "1em")
            //     .attr("class", "axisText")
            //     .text("Number of Billboard 100 Hits");

            // chartGroup.append("text")
            //     .attr("transform", `translate(${width / 2}, ${height + margin.top + 30})`)
            //     .attr("class", "axisText")
            //     .text("Hair Metal Band Hair Length (inches)");
        }
    };
};

let dkplot = (plotconf) => {
    d3.select("#svgplot").remove();
    let lambRunner = lambSVG(plotconf, "svgplot", window.innerWidth * 2 / 3, window.innerHeight * 2 / 3);
    lambRunner.init();
}

