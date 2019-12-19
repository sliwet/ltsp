
let lambSVG = (datasetfile, uniqueId, widthInput, heightInput, margin) => {
    return {

        init: function () {
            let svgWidth = widthInput;
            let svgHeight = heightInput;

            if (typeof margin === 'undefined' || margin == null) {
                margin = {
                    top: 20,
                    right: 40,
                    bottom: 60,
                    left: 100
                };
            }
            else {
                margin.top = typeof margin.top === 'undefined' ? 20 : margin.top;
                margin.right = typeof margin.right === 'undefined' ? 20 : margin.right;
                margin.bottom = typeof margin.bottom === 'undefined' ? 20 : margin.bottom;
                margin.left = typeof margin.left === 'undefined' ? 20 : margin.left;
            }


            let width = svgWidth - margin.left - margin.right;
            let height = svgHeight - margin.top - margin.bottom;

            // Create an SVG wrapper, append an SVG group that will hold our chart, and shift the latter by left and top margins.
            let svg = d3.select("#infoplace")
                .append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight)
                .attr("id", uniqueId);



            let chartGroup = svg.append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`);

            // Import Data
            d3.csv(datasetfile).then(function (hairData) {

                // Step 1: Parse Data/Cast as numbers
                // ==============================
                hairData.forEach(function (data) {
                    data.hair_length = +data.hair_length;
                    data.num_hits = +data.num_hits;
                });

                // Step 2: Create scale functions
                // ==============================
                let xLinearScale = d3.scaleLinear()
                    .domain([20, d3.max(hairData, d => d.hair_length)])
                    .range([0, width]);

                let yLinearScale = d3.scaleLinear()
                    .domain([0, d3.max(hairData, d => d.num_hits)])
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
                    .attr("cx", d => xLinearScale(d.hair_length))
                    .attr("cy", d => yLinearScale(d.num_hits))
                    .attr("r", "15")
                    .attr("fill", "pink")
                    .attr("opacity", ".5");

                // Step 6: Initialize tool tip
                // ==============================
                let toolTip = d3.tip()
                    .attr("class", "tooltip")
                    .offset([80, -60])
                    .html(function (d) {
                        return (`${d.rockband}<br>Hair length: ${d.hair_length}<br>Hits: ${d.num_hits}`);
                    });

                // Step 7: Create tooltip in the chart
                // ==============================
                chartGroup.call(toolTip);

                // Step 8: Create event listeners to display and hide the tooltip
                // ==============================
                circlesGroup.on("click", function (data) {
                    toolTip.show(data, this);
                    d3.select(this).transition()
                        .duration(500)
                        .attr("fill", "black")
                        .style("opacity", "1");
                })
                    // onmouseout event
                    .on("mouseout", function (data, index) {
                        toolTip.hide(data);
                        d3.select(this)
                            .attr("fill", "pink").style("opacity", "0.5");
                    });

                // Create axes labels
                chartGroup.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 0 - margin.left + 40)
                    .attr("x", 0 - (height / 2))
                    .attr("dy", "1em")
                    .attr("class", "axisText")
                    .text("Number of Billboard 100 Hits");

                chartGroup.append("text")
                    .attr("transform", `translate(${width / 2}, ${height + margin.top + 30})`)
                    .attr("class", "axisText")
                    .text("Hair Metal Band Hair Length (inches)");
            }).catch(function (error) {
                console.log(error);
            });
        }
    };
};

function render(){
    d3.select("#svg-1").remove();
    let lambRunner1 = lambSVG("static/hairData.csv", "svg-1", window.innerWidth * 2 / 3, window.innerHeight * 2 / 3);
    lambRunner1.init();
}

window.addEventListener('resize', render);
render();