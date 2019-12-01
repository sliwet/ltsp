let rgb = (r, g, b) => {
    r = Math.floor(r);
    g = Math.floor(g);
    b = Math.floor(b);
    return ["rgb(",r,",",g,",",b,")"].join("");
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
            let r = 255;
            let g = 0;
            let b = 0;

            if (data.length > 1){
                let mult = 0;

                if( i == data.length - 1) mult = 1;
                else mult = i / (data.length - 1);
    
                r = 255 - 255 * mult;
                g = 255 * 2 * mult;
                b = 255 * mult;
    
                if (g > 255) g = g - 2 * (g - 255);
                if (g < 0) g= 0;
            }

            let trace = {
                type: "scatter",
                mode: "lines",
                name: "test",
                x: data[i].x,
                y: data[i].y,
                line: {
                    color: rgb(r,g,b)//"#17BECF"
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
