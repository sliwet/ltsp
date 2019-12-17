let init = () => {
    let infoNticker = [
        {
            menuitem: "Information",
            menuid: "infoSel",
            menuonchange: "infoChanged"
        },
        {
            menuitem: "Ticker",
            menuid: "tickerSel",
            menuonchange: "tickerChanged"
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
    //     <select id="infoSel" onchange="infoChanged(this.value)"></select>
    //   </div>

    menuplace.append("div")
        .append("button")
        .attr("id", "clearselection")
        .attr("type", "submit")
        .attr("class", "btn btn-default")
        .text("Clear Selection");

    menuplace.append("div").html("<br>")

    test = menuplace.append("div")
        .attr("class", "panel panel-primary")

    test.append("div")
        .attr("class", "panel-heading")
        .append("h3")
        .attr("class", "panel-title")
        .text("Selected Tickers")

    test.append("div")
        .attr("id", "selectedtickers")
        .attr("class", "panel-body")

    let selector = d3.select("#tickerSel");
    d3.json("/tickers").then((tickers) => {
        tickers.forEach(ticker => {
            selector
                .append("option")
                .property("value", ticker)
                .text(ticker);
        });
    });

    let selector2 = d3.select("#infoSel");
    d3.json("/infotypes").then((infotypes) => {
        infotypes.forEach(infotype => {
            selector2
                .append("option")
                .property("value", infotype)
                .text(infotype);
        });
    });

    let initialmessage = "<p>Use left selectors to explore stock data information</p>";
    d3.select("#infoplace").html(initialmessage);
}

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

let buildPlot = tickers => {
    let tickers_str = tickers[0];
    for (let i = 1; i < tickers.length; i++) {
        tickers_str = tickers_str + "_" + tickers[i];
    }

    let url = "/gettickerdata/" + tickers_str;

    d3.json(url).then(data => {
        let traces = []

        // let xmin = d3.min(data[0].x);
        // let xmax = d3.max(data[0].x);
        // console.log(`Min: ${xmin} , Max: ${xmax}`);
        for (let i = 0; i < data.length; i++) {
            let trace = {
                type: "scatter",
                mode: "lines",
                name: tickers[i],
                x: data[i].x,
                y: data[i].y,
                line: {
                    color: rgb(data.length, i)
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
}

let selectedTickers = []

let tickerChanged = newTicker => {
    d3.select("#infoplace").html("");
    selectedTickers.push(newTicker);

    tickerstr = "";
    selectedTickers.forEach(ticker => tickerstr = tickerstr + ticker + "<br>");
    d3.select("#selectedtickers").html(tickerstr);

    buildPlot(selectedTickers);
}

let infoChanged = newInfo => {
    let url = "/showinfo/" + newInfo;
    d3.json(url).then(info => {
        infoplace = d3.select("#infoplace");
        infoplace.html(info[0]); // infoplace.html(info[0][newInfo]);
    });
}

let handleClear = () => {
    selectedTickers = []
    d3.select("#selectedtickers").html("");
}

d3.select("#clearselection").on("click", handleClear);

init();
