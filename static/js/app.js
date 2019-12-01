let buildPlot = tickers => {
    let tickers_str = tickers[0];
    for (let i = 1; i < tickers.length; i++) {
        tickers_str = tickers_str + "_" + tickers[i];
    }
    
    let url = "/gettickerdata/" + tickers_str;

    d3.json(url).then(data => {
        let traces = []
        data.forEach(datum => {
            let trace = {
                type: "scatter",
                mode: "lines",
                name: "test",
                x: datum.x,
                y: datum.y,
                line: {
                    color: "#17BECF"
                }
            };

            traces.push(trace);
        })

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

        Plotly.newPlot("infoplace",traces, layout);
    });
}

let init = () => {
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
