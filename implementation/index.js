var width = window.innerWidth - 100,
    height = window.innerHeight - 80;
scale = 270000,
    latitude = 37.7880,
    longitude = -122.4153;

var svg;
var stations_json = {};

var projection = d3.geoAlbers()
    .scale(700000)
    .rotate([-longitude, 0])
    .center([0, latitude]);
// .parallels([24, 43]);

// A path generator
const path = d3.geoPath()
    .projection(projection)

const render_stations = (stations) => {
    // Add circles
    svg
        .selectAll("circle")
        .data(stations)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return projection([d.long, d.lat])[0]; })
        .attr("cy", function (d) { return projection([d.long, d.lat])[1]; })
        .attr("r", 14)
        .style("fill", "69b3a2")
        .attr("stroke", "#69b3a2")
        .attr("stroke-width", 3)
        .attr("fill-opacity", .4)
        .on('mouseover', function (d) {
            // console.log(d.target.__data__);
            d3.select(this.parentNode)
                .append('text')
                .attr('dy', ".35em")
                .attr('id', 'temp')
                .text(d.target.__data__.name)
                .attr('fill', 'black')
                .attr('font-size', '18px')
                .attr('font-family', 'Inria Sans')
                .attr("x", "20")
                .attr("y", "40")

            d3.select(this.parentNode)
                .insert("rect", "text")
                .attr('id', 'temp2')
                .attr("x", "0")
                .attr("y", "20")
                .attr("border-radius", "20px")
                .attr("width", d.target.__data__.name.length * 10)
                .attr("height", "40")
                .style("fill", "#E4EEE3");
        })
        .on('mouseout', function () {
            d3.select(this.parentNode).selectAll('#temp').remove('#temp');
            d3.select(this.parentNode).selectAll('#temp2').remove('#temp2');
        }).raise();
}

const render_connections = (trips, stations, trip_counts) => {

    const link = []

    trip_counts.forEach(function (row) {
        station_1 = stations_json[row.start_station_id];
        station_2 = stations_json[row.end_station_id];

        // console.log(row)
        // console.log(station_1, station_2);
        source = [+station_1.long, +station_1.lat]
        target = [+station_2.long, +station_2.lat]
        topush = { type: "LineString", coordinates: [source, target], size: row.count / 2500 }

        // console.log(topush);
        link.push(topush)
    })


    // Add the path
    svg.selectAll("myPath")
        .data(link)
        .join("path")
        .attr("d", function (d) { return path(d) })
        .style("fill", "red")
        .style("stroke", "#69b3a2")
        .style("stroke-width", function (d) { console.log(d.size); return d.size; });
}

const render_map = (map_json) => {
    svg.append("g")
        .selectAll("path")
        .data(map_json.features)
        .enter()
        .append("path")
        .attr("d", d3.geoPath().projection(projection))
        .style("fill", function () { return "#FF7870" })
        // .on("mouseover", function (e) { d3.select(this).style("fill", "#E4EEE3") })
        // .on("mouseout", function (e) { d3.select(this).style("fill", "#FF7870") })
        .attr("stroke", "white")
        .attr("stroke-width", .3)
        .style("opacity", .3);
}


const load_data = async () => {

    const stations = await d3.csv("data/station.csv", function (d) { return { id: d.id, name: d.name, lat: d.lat, long: d.long }; });

    const trips = await d3.csv("data/trip.csv", function (d) { return { start_date: d.start_date, end_date: d.end_date, start_station_id: d.start_station_id, end_station_id: d.end_station_id } });

    const trip_counts = await d3.csv("data/trip_count.csv", function (d) { return { start_station_id: d.start_station_id, end_station_id: d.end_station_id, count: d.count } });

    const station_status = await d3.csv("data/status.csv", function (d) { return { station_id: d.station_id, docks_available: d.docks_available, date_time: d.time } });

    const map_json = await d3.json("SFN.geojson");

    return { stations, station_status, trips, trip_counts, map_json };

}

const main = () => {

    d3.select('body')
        .append('svg')
        .style('width', width)
        .style('height', height)
        .style('background-color', 'rgb(222, 222, 222)')
        .style('display', 'block')
        .style('margin', 'auto');

    svg = d3.select('svg');

    load_data().then(({ stations, station_status, trips, trip_counts, map_json }) => {

        stations.map((s) => { stations_json[s.id] = { lat: s.lat, long: s.long, name: s.name } });

        render_map(map_json);

        render_connections(trip_counts, stations, trip_counts);

        render_stations(stations);
    })

}

main();





