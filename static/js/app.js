let rgb = (n,i) => {
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

        for (let i = 0; i < data.length; i++) {
            let trace = {
                type: "scatter",
                mode: "lines",
                name: "test",
                x: data[i].x,
                y: data[i].y,
                line: {
                    color: rgb(data.length,i)//"#17BECF"
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
