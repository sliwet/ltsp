
let buildPlot = tickers => {
    let url = "/gettickerdata/" + tickers[0];

    d3.json(url).then(data => {
        let trace1 = {
            type: "scatter",
            mode: "lines",
            name: "test",
            x: data[0].x,
            y: data[0].y,
            line: {
                color: "#17BECF"
            }
        };

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

        Plotly.newPlot("infoplace", [trace1], layout);
    });

}

let init = () => {
    let selector = d3.select("#tickerSel");
    d3.json("/tickers").then((tickers) => {
        tickers.forEach(ticker => {
            selector
                .append("option")
                .property("value",ticker)
                .text(ticker);
        });
    });

    let selector2 = d3.select("#infoSel");
    d3.json("/infotypes").then((infotypes) => {
        infotypes.forEach(infotype => {
            selector2
                .append("option")
                .property("value",infotype)
                .text(infotype);
        });
    });

    let initialmessage = "<p>Use left selectors to explore stock data information</p>";
    d3.select("#infoplace").html(initialmessage);
}

let selectedTickers = []
let tickerChanged = newTicker => {
    d3.select("#infoplace").html("");
    selectedTickers.push(newTicker);

    tickerstr = "";
    selectedTickers.forEach( ticker => tickerstr = tickerstr + ticker + "<br>");
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
