var width = window.innerWidth - 100,
    height = window.innerHeight - 110,
    scale = 270000,
    latitude = 37.7870,
    longitude = -122.4153,
    length = 0;

const DEBUG = false;

const start_date_input = document.getElementById("start_date");
const end_date_input = document.getElementById("end_date");
    
var svg;
var stations_json = {};
var trips, stations;
var selected_station = null;

var projection = d3.geoAlbers()
    .scale(650000)
    .rotate([-longitude, 0])
    .center([0, latitude]);
//.parallels([24, 43]);

// A path generator
const path = d3.geoPath()
    .projection(projection)

const render_stations = (stations, avg_station, trip_counts) => {
    //Clear existing circles
    svg.selectAll("circle").remove();

    // Add circles
    svg
        .selectAll("circle")
        .data(avg_station)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return projection([d.long, d.lat])[0]; })
        .attr("cy", function (d) { return projection([d.long, d.lat])[1]; })
        .attr("r", function (d) { return d.avg_docks_available * 1.5; }) // The radius of the circle is related to the avg number of docks available 
        .style("fill", "#A20025")
        .attr("stroke", "#A20025")
        .attr("stroke-width", 3)
        .attr("fill-opacity", .4)
        .on('mouseover', function (d) {
            // Text
            d3.select(this.parentNode)
                .append('text')
                .attr('dy', ".35em")
                .attr('id', 'temp')
                .text(d.target.__data__.name)
                .attr('fill', 'black')
                .attr('font-size', '4vw')
                .attr('font-family', 'Garamond, serif')
                .attr("x", "835")
                .attr("y", "65")
            // Text Box
            d3.select(this.parentNode)
                .insert("rect", "text")
                .attr('id', 'temp2')
                .attr("x", "820")
                .attr("y", "45")
                .attr("width", function (dx) {
                    length = d.target.__data__.name.length * 10 + 32
                    return length;
                })
                .attr("height", "3vw")
                .style("stroke", "#69b3a2")
                .style("opacity", .3);

            d3.select(this).style("fill", "#E4EEE3")
            d3.select(this).style("stroke", "#FF7870")
        })
        .on('mouseout', function (d) {
            d3.select(this.parentNode).selectAll('#temp').remove('#temp');
            d3.select(this.parentNode).selectAll('#temp2').remove('#temp2');
            d3.select(this).style("fill", "#A20025");
            d3.select(this).style("stroke", "#A20025");
        }).raise()
        .on("click", function (d, i) { //TODO COMPLETE MOUSE CLICK 
            const graph = []

            // Get all the trips of a certain station
            stations.forEach(function (dx, id) {
                // Get the REAL id of the station
                if (i.id == id) {
                    trip_counts.forEach(function (dy) {
                        if (dy.start_station_id == dx.id) {
                            graph.push({ 'start_station_id': dx.id, 'end_station_id': dy.end_station_id, 'count': dy.count });
                        }
                    });
                    return; // exit the cycle
                }
            });

            // Graph
            let graph_stack = svg.append('g')
                .attr('id', 'temp3')
                .attr('transform', 'translate(' + 55 + ',' + 100 + ')');

            // Color Scale => st
            var colorScale = d3.scaleLinear()
                .domain([d3.min(graph, function (dq) { return dq.end_station_id; }), d3.max(graph, function (dq) { return dq.end_station_id; })])
                .range(["red", "blue"]);

            // X axis -> end_station_id
            let x = d3.scaleBand()
                .domain([d3.min(graph, function (dq) { return dq.end_station_id; }), d3.max(graph, function (dq) { return dq.end_station_id; })])
                .range([0, length - 50]);

            graph_stack.append("g")
                .attr("transform", "translate(0,300)")
                .call(d3.axisBottom(x));

            // Y axis -> number of trips between the stations
            let y = d3.scaleLinear()
                .domain([d3.max(graph, function (dr) { return dr.count; }), 0])
                .range([0, 300]);

            graph_stack.append("g")
                .call(d3.axisLeft(y));

            graph_stack.append("g")
                .selectAll("g")
                .data(graph)
                .enter()
                .append("rect")
                .attr("opacity", .3)
                .attr("x", function (dg) {
                    return dg.end_station_id;
                })
                .attr("y", "0")
                .attr("height", function (dg) {
                    return dg.count % 300;
                })
                .attr("width", 6)
                .attr("fill", function (dg) { return colorScale(dg.start_station_id); })
                .attr("transform", function (dg) {
                    return "rotate(180, " + dg.end_station_id + ", 150)";
                });
            graph_stack.on('click', function (d) {
                d3.select(this.parentNode).selectAll('#temp3').remove('#temp3');
            }).raise()

        });

}

const render_connections = (trip_counts, selected_station) => {
    
    max_trips = d3.max(trip_counts, function (d) { return d.count });

    // Linear scale for width of connections
    connection_Width = d3.scaleLinear()
        .domain([0, max_trips])
        .range([0, 6])

    const link = []

    trip_counts.forEach(function (row) {
        station_1 = stations_json[row.start_station_id];
        station_2 = stations_json[row.end_station_id];

        // find number of trips between station_1 and station_2

        source = [+station_1.long, +station_1.lat]
        target = [+station_2.long, +station_2.lat]
        topush = { type: "LineString", coordinates: [source, target], count: row.count }

        link.push(topush)
    })

    // Add the path
    svg.selectAll("myPath")
        .data(link)
        .join("path")
        .attr("d", function (d) { return path(d) })
        .style("fill", "red")
        .style("stroke", "#A20025")
        .style("stroke-width", function (d) { return connection_Width(d.count); })
        .style("opacity", .3);
}

const render_map = (map_json) => {
    svg.selectAll("path").remove();

    svg.append("g")
        .selectAll("path")
        .data(map_json.features)
        .enter()
        .append("path")
        .attr("d", d3.geoPath().projection(projection))
        .style("fill", function () { return "#008938" })
        .attr("stroke", "white")
        .attr("stroke-width", .3)
        .style("opacity", .3);
}

const get_trip_counts = (trips) => {
    const trip_counts_json = {};
    const trip_counts = [];
    
    trips.forEach(function (row) {
        var name = row.start_station_id + "_" + row.end_station_id;

        if(trip_counts_json[name]){
            let count = trip_counts_json[name];
            trip_counts_json[name] = count + 1;
        } else {
            trip_counts_json[name] = 1;
        }
    })

    const counts = Object.keys(trip_counts_json);
    var start_station_id, end_station_id;
    var split;
    
    counts.forEach((name) => {
        split = name.split("_");
        start_station_id = split[0];
        end_station_id = split[1];

        trip_counts.push({start_station_id: start_station_id, end_station_id: end_station_id, count: trip_counts_json[name]});
    })

    return trip_counts;
    
}

const date_update = (e) => {
    document.getElementById("mainTitle").innerHTML = "San Francisco Bicycles (loading...)";

    load_data(false).then(({ stations, station_status, trips, trip_counts, map_json, avg_station }) => {

        trip_counts = get_trip_counts(trips);

        render_map(map_json);

        render_connections(trip_counts);

        render_stations(stations, avg_station, trip_counts);
        
        document.getElementById("mainTitle").innerHTML = "San Francisco Bicycles";
    })
    
}


const load_data = async (first_load) => {

    if(first_load) {
        stations = await d3.csv("data/station.csv", function (d) { return { id: d.id, name: d.name, lat: d.lat, long: d.long }; });
    }

    var start_date = new Date(start_date_input.value);
    var end_date = new Date(end_date_input.value);

    trips = await d3.csv("data/trip.csv", function (d) { 
        if(new Date(d.start_date) > start_date && new Date(d.end_date) < end_date) 
            return { start_date: d.start_date, end_date: d.end_date, start_station_id: d.start_station_id, end_station_id: d.end_station_id } 
    });

    const trip_counts = await d3.csv("data/trip_count.csv", function (d) { return { start_station_id: d.start_station_id, end_station_id: d.end_station_id, count: d.count } });

    const station_status = await d3.csv("data/status.csv", function (d) { 
        let dt = d.time;

        if(dt > start_date_input.value && dt < end_date_input.value) {
            return { station_id: d.station_id, docks_available: d.docks_available, date_time: dt } 
        }
    });

    const avgStatus = d3.group(station_status, d => d.station_id);

    const map_json = await d3.json("SFN.geojson");

    // Get the avg number of docks available
    const avgStatus_station = [];
    avgStatus.forEach(function (d, station_id) {
        avgStatus_station.push({ 'station_id': station_id, 'avg_docks_available': d3.mean(d, function (p) { return p.docks_available; }) });
    });

    // Merge the station list to the list of avg number of docks available
    const avg_station = [];
    avgStatus_station.forEach(function (t, station_id) {
        stations.forEach(function (d, id) {
            if (station_id == id) {
                avg_station.push({ 'id': id, 'name': d.name, 'lat': d.lat, 'long': d.long, 'avg_docks_available': t.avg_docks_available });
            }
        });
    });

    return { stations, station_status, trips, trip_counts, map_json, avg_station };

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

    start_date_input.addEventListener("change", date_update);
    end_date_input.addEventListener("change", date_update);

    load_data(true).then(({ stations, station_status, trips, trip_counts, map_json, avg_station }) => {

        stations.map((s) => { stations_json[s.id] = { lat: s.lat, long: s.long, name: s.name } });

        render_map(map_json);

        if(! DEBUG)
            trip_counts = get_trip_counts(trips);

        render_connections(trip_counts);

        render_stations(stations, avg_station, trip_counts);
    })

}

main();





