
// let buildMetadata = sample => {
//     let url = "/metadata/" + sample;
//     d3.json(url).then(samples_metadata => {
//       smetadata = d3.select("#sample-metadata");
//       smetadata.html('');
//       Object.entries(samples_metadata).forEach(([key, value]) => {
//         smetadata.append('div').html(`${key}: ${value}<br>`);
//       });

//       // The following code will do the same thing
//       // let samples_metadata_str = ``;
//       // Object.entries(samples_metadata).forEach(([key, value]) => {
//       //   samples_metadata_str = samples_metadata_str + `${key}: ${value}<br><br>`
//       // });
//       // d3.select("#sample-metadata").html(() => samples_metadata_str);

//       // let wfreq = samples_metadata.WFREQ;
//       // console.log(`dkwon@todo: ${wfreq} buildgauge`);
//       // @TODO
//       buildGauge(samples_metadata.WFREQ);
//     });
//   }

//   let buildCharts = sample => {
//     let url = "/samples/" + sample;
//     d3.json(url).then(response => {
//       let data = [];
//       response.otu_ids.forEach((value, index) => {
//         let datum = {
//           "x": response.otu_ids[index],
//           "y": response.sample_values[index],
//           "hovertext": response.otu_labels[index]
//         };

//         data.push(datum);
//       });
//       // console.log(data);

//       let bubletrace = {
//         x: data.map(row => row.x),
//         y: data.map(row => row.y),
//         hovertemplate: data.map(row => {
//           return `(${row.x},${row.y})<br>${row.hovertext}`;
//         }),
//         mode: 'markers',
//         marker: {
//           color: data.map(row => row.x),
//           size: data.map(row => row.y),
//         }
//       };

//       let bubblelayout = {
//         // title: 'Marker Size and Color',
//         xaxis: { title: "OTU ID" },
//         showlegend: false,
//         height: 500,
//         width: 1000
//       };

//       Plotly.newPlot('bubble', [bubletrace], bubblelayout);

//       data.sort((a, b) => {
//         return parseFloat(b.y) - parseFloat(a.y);
//       });

//       // Slice the first 10 objects for plotting
//       let selected = data.slice(0, 10);
//       // selected = selected.reverse();
//       // console.log(selected);

//       let trace = {
//         labels: selected.map(row => row.x),
//         values: selected.map(row => row.y),
//         // hovertemplate: data.map(row => row.hovertext),
//         hovertext: selected.map(row => row.hovertext),
//         type: 'pie'
//       };

//       let layout = {
//         width: 500,
//         height: 400
//         // title: "Pie Chart",
//       };

//       Plotly.newPlot("pie", [trace], layout);
//     });
//   }

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
}

let selectedTickers = []
let tickerChanged = newTicker => {
    selectedTickers.push(newTicker)
    console.log(selectedTickers);
    // buildCharts(newSample);
    // buildMetadata(newSample);
}

let infoChanged = newInfo => {
    let url = "/showinfo/" + newInfo;
    d3.json(url).then(info => {
        infoplace = d3.select("#infoplace");
        infoplace.html(info[0]);
        // infoplace.html(info[0][newInfo]);
    });
}

init();
