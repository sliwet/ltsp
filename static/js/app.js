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

let getTickerURL = (d) => {
    if (d.length == 0) return "/getempty";

    let d_str = d[0];
    if (d.length > 1) {
        for (let i = 1; i < d.length; i++) {
            d_str = d_str + "_" + d[i];
        }
    }
    return "/gettickerdata/" + d_str;
}

let buildPlot = (lt, rt) => {
    d3.json(getTickerURL(lt)).then(ld => {
        d3.json(getTickerURL(rt)).then(rd => {
            if (ld.length == 0){
                d3.select("#infoplace").html("");
                return;
            }

            let traces = []

            // let xmin = d3.min(data[0].x);
            // let xmax = d3.max(data[0].x);
            // console.log(`Min: ${xmin} , Max: ${xmax}`);
            for (let i = 0; i < ld.length; i++) {
                let trace = {
                    type: "scatter",
                    mode: "lines",
                    name: lt[i],
                    x: ld[i].x,
                    y: ld[i].y,
                    line: {
                        color: rgb(ld.length, i)
                    }
                };

                traces.push(trace);
            }

            let layout = {
                title: `closing prices`,
                // xaxis: {
                //     range: [startDate, endDate],
                //     type: "date"
                // },
                // yaxis: {
                //     autorange: true,
                //     type: "linear"
                // }
            };

            Plotly.newPlot("infoplace", traces, layout);
        });
    });
}

let leftTickers = []
let rightTickers = []

let handleTickerChange = newTicker => {
    d3.select("#infoplace").html("");

    let whichAxis = d3.select("#whichAxis").node().querySelector('input[name="axisradio"]:checked').value;
    let whichTickers = ""

    if (whichAxis == "leftAxis") {
        selectedTickers = leftTickers;
        whichTickers = "#leftTickers";
    }
    else {
        selectedTickers = rightTickers;
        whichTickers = "#rightTickers"
    }

    selectedTickers.push(newTicker);
    tickerstr = "";
    selectedTickers.forEach(ticker => tickerstr = tickerstr + ticker + "<br>");

    d3.select(whichTickers).html(tickerstr);

    buildPlot(leftTickers, rightTickers);
}

let handleInfoChange = newInfo => {
    let url = "/showinfo/" + newInfo;
    d3.json(url).then(info => {
        infoplace = d3.select("#infoplace");
        infoplace.html(info[0]); // infoplace.html(info[0][newInfo]);
    });
}

let handleClear = () => {
    leftTickers = []
    rightTickers = []
    d3.select("#leftTickers").html("");
    d3.select("#rightTickers").html("");
    d3.select("#infoplace").html("");
}

let init = () => {
    let initialmessage = "<p>Use left selectors to explore stock data information</p>";

    let infoNticker = [
        {
            menuitem: "Information",
            menuid: "infoSel",
            menuonchange: "handleInfoChange"
        },
        {
            menuitem: "Ticker",
            menuid: "tickerSel",
            menuonchange: "handleTickerChange"
        }
    ]

    let menuplace = d3.select("#menuplace");
    menuplace.html("");

    infoNticker.forEach(menu => {
        menuplace.append("div")
            .attr("class", "well")
            .html(`<h5>${menu.menuitem}</h5>`)
            .append("select")
            .attr("id", menu.menuid)
            .attr("onchange", `${menu.menuonchange}(this.value)`);
    });
    //     <div class="well">
    //     <h5>Information</h5>
    //     <select id="infoSel" onchange="handleInfoChange(this.value)"></select>
    //   </div>

    let tickerSel = d3.select("#tickerSel");
    d3.json("/tickers").then((tickers) => {
        tickers.forEach(ticker => {
            tickerSel
                .append("option")
                .property("value", ticker)
                .text(ticker);
        });
    });

    let infoSel = d3.select("#infoSel");
    d3.json("/infotypes").then((infotypes) => {
        infotypes.forEach(infotype => {
            infoSel
                .append("option")
                .property("value", infotype)
                .text(infotype);
        });
    });

    // Radio buttons
    rbuttonhtmls = [
        "<input type=\"radio\" name=\"axisradio\" value=\"leftAxis\" checked>Left\&nbsp;",
        "<input type=\"radio\" name=\"axisradio\" value=\"rightAxis\">Right "
    ]

    axisChoice = menuplace.append("form").text("Axis: ").attr("id", "whichAxis");
    rbuttonhtmls.forEach(d => {
        axisChoice.append("label").html(d);
    });

    // Selected tickers for left and right axis
    leftRight = [
        { text: "Left Tickers", id: "leftTickers" },
        { text: "Right Tickers", id: "rightTickers" }
    ];

    leftRight.forEach(d => {
        seltmp = menuplace.append("div")
            .attr("class", "panel panel-primary")

        seltmp.append("div")
            .attr("class", "panel-heading")
            .append("h3")
            .attr("class", "panel-title")
            .text(d.text)

        seltmp.append("div")
            .attr("id", d.id)
            .attr("class", "panel-body")
    })

    // Clear Selection
    menuplace.append("div")
        .append("button")
        .attr("id", "clearselection")
        .attr("type", "submit")
        .attr("class", "btn btn-default")
        .text("Clear Selection");

    menuplace.append("div").html("<br>")

    // Initial message
    d3.select("#infoplace").html(initialmessage);

    // Event handler
    d3.select("#clearselection").on("click", handleClear);
}

init();
