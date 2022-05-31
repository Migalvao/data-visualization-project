var width = window.innerWidth - 100,
    height = window.innerHeight - 110,
    scale = 270000,
    latitude = 37.7860,
    longitude = -122.4153,
    longitude2 = -122.4503,
    length = 0;

const start_date_input = document.getElementById("start_date");
const end_date_input = document.getElementById("end_date");
    
var svg;
var stations_json = {};
var map_json;
var trips, stations, trip_counts;
var station_status;
var selected_station = null;

var projection = d3.geoAlbers()
    .scale(650000)
    .rotate([-longitude, 0])
    .center([0, latitude]);

var projection2 = d3.geoAlbers()
    .scale(650000)
    .rotate([-longitude2, 0])
    .center([0, latitude]);

// A path generator
const path = d3.geoPath()
    .projection(projection);

const path2 = d3.geoPath()
    .projection(projection2);

const render_stations = (stations, avg_station, trip_counts, current_projection) => {
    //Clear existing circles
    svg.selectAll("circle").remove();

    console.log("Rendering stations");
    const counts = Object.values(trip_counts);

    max_trips = d3.max(counts, function (d) { return d.count });
    min_trips = d3.min(counts, function (d) { return d.count });

    const station_Radius = d3.scaleLinear()
    .domain([0, max_trips])
    .range([0, 60]);

    // Add circles
    svg
        .selectAll("circle")
        .data(avg_station)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return current_projection([d.long, d.lat])[0]; })
        .attr("cy", function (d) { return current_projection([d.long, d.lat])[1]; })
        .attr("r", function (d) { return station_Radius(stations_json[d.id]['n_trips']); }) // The radius of the circle is related to the number of trips
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
                .text(d.target.__data__.name + " - " + stations_json[d.target.__data__.id]['n_trips'] + " trips")
                .attr('fill', 'black')
                .attr('font-size', '15px')
                .attr('font-family', 'monospace')
                .attr('font-weight', 'bold')
                .attr("x", "85")
                .attr("y", "65")
            // Text Box
            d3.select(this.parentNode)
                .append("rect", "text")
                .attr('id', 'temp2')
                .attr("x", "70")
                .attr("y", "45")
                .attr("width", function (dx) {
                    length = d.target.__data__.name.length * 10 + 150;
                    return length;
                })
                .attr("height", "3vw")
                .style("stroke", "#69b3a2")
                .style("opacity", .25);

            d3.select(this).style("fill", "#E4EEE3")
            d3.select(this).style("stroke", "#FF7870")
        })
        .on('mouseout', function (d) {
            d3.select(this.parentNode).selectAll('#temp').remove('#temp');
            d3.select(this.parentNode).selectAll('#temp2').remove('#temp2');

            d3.select(this).style("fill", "#A20025");
            d3.select(this).style("stroke", "#A20025");
        }).raise()
        .on("click", function (d, i) {
            const graph = []
            var stationName = "";
            selected_station = i.id;
            
            d3.selectAll('#temp').remove();
            d3.selectAll('#temp2').remove();

            render_map(map_json, projection2);
            render_connections(trip_counts, path2);
            render_stations(stations, avg_station, trip_counts, projection2);

            const station_status = status_single_station(selected_station);
            // aggregate data 
            

            // Removes the existing graph if there is any
            d3.select(this.parentNode).selectAll('#temp3').remove('#temp3');
            d3.select(this.parentNode).selectAll('#temp4').remove('#temp4');

            // Get all the trips of a certain station
            stations.forEach(function (dx, id) {
                // Get the REAL id of the station
                if (i.id == id) {
                    stationName = i.name;
                    trip_counts.forEach(function (dy) {
                        if (dy.start_station_id == dx.id) {
                            graph.push({ 'start_station_id': parseInt(dx.id), 'end_station_id': parseInt(dy.end_station_id), 'count': parseInt(dy.count) });
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
            var color;

            // X axis -> end_station_id
            let x = d3.scaleBand()
                .domain([d3.min(graph, function (dq) { return dq.end_station_id; }), d3.max(graph, function (dq) { return dq.end_station_id; })])
                .range([0, 500])
                .padding(0.2);

            // Y axis -> number of trips between the stations
            let y = d3.scaleLinear()
                .domain([0, d3.max(graph, function (dr) { return dr.count; })])
                .range([300, 0]);


            // Background rect of the graph
            graph_stack.append("rect")
                .attr("x", "-45")
                .attr("y", "-20")
                .attr("width", "600px")
                .attr("height", "360px")
                .style("fill", "#f5cfc1")
                .style("opacity", .2)
                .attr("border-radius", "7px");

            // Title
            graph_stack.append('text')
                .attr('dy', ".35em")
                .attr('id', 'temp3')
                .text(d.target.__data__.name)
                .attr('fill', 'black')
                .attr('font-size', '15px')
                .attr('font-family', 'Garamond')
                .attr("x", "-20")
                .attr("y", "0");

            // Display y axis
            graph_stack.append("g")
                .attr("transform", "translate(0,20)")
                .call(d3.axisLeft(y));


            // Display x axis 
            graph_stack.append("g")
                .attr("transform", "translate(0,320)")
                .call(d3.axisBottom(x));

            // Create rects
            graph_stack.append("g")
                .selectAll("g")
                .data(graph)
                .enter()
                .append("rect")
                .attr("opacity", .7)
                .attr('id', 'temp4')
                .attr("x", function (dg) {
                    return x(dg.end_station_id);
                })
                .attr("y", "-20")
                .attr("height", function (dg) {
                    return y(dg.count);
                })
                .attr("width", 2)
                .attr("fill", function (dg) { color = colorScale(dg.start_station_id); return color; })
                .attr("transform", function (dg) {
                    return "rotate(180, " + dg.end_station_id + ", 150)";
                });

            graph_stack.append("g")
                .append('text')
                .attr('dy', ".35em")
                .attr('id', 'temp6')
                .text("X")
                .attr('fill', 'black')
                .attr('font-size', "15px")
                .attr('font-family', 'cursive')
                .attr('font-weight', 'bold')
                .attr("x", "530px")
                .attr("y", "7")
                .on('click', function (dx) { // Click event to close the graph
                    d3.select(this.parentNode.parentNode.parentNode).selectAll('#temp3').remove('#temp3');
                    d3.select(this.parentNode.parentNode).selectAll('#temp4').remove('#temp4');
                    d3.select(this.parentNode).selectAll('#temp6').remove('#temp6');

                    selected_station = null;
                    console.log("closing graph");
                    
                    render_map(map_json, projection);
                    render_connections(trip_counts, path);
                    render_stations(stations, avg_station, trip_counts, projection);

                }).raise();

            // Mouse over event to display the data of each react in the graph
            graph_stack.selectAll("#temp4")
                .on('mouseover', function (dx) {
                    // Text
                    d3.select(this.parentNode)
                        .append('text')
                        .attr('dy', ".35em")
                        .attr('id', 'temp5')
                        .text(dx.target.__data__.count)
                        .attr('font-weight', 'bold')
                        .attr('fill', 'black')
                        .attr('font-size', '4vw')
                        .attr('font-family', 'monospace')
                        .attr("x", 30)
                        .attr("y", 40)

                    d3.select(this).style("fill", "#A20025");
                    d3.select(this).style("stroke", "#A20025");

                })
                .on('mouseout', function (dx) {
                    d3.select(this.parentNode).selectAll('#temp5').remove('#temp5');
                    d3.select(this).style("fill", color);
                    d3.select(this).style("stroke", "transparent");
                }).raise();
        });
}

const render_connections = (trip_counts, path) => {
    
    max_trips = d3.max(trip_counts, function (d) { return d.count });

    // Linear scale for width of connections
    connection_Width = d3.scaleLinear()
        .domain([0, max_trips])
        .range([0, 6])

    const link = []


    trip_counts.forEach(function (row) {

        // Checking if connections should be processed
        if(selected_station){
            if((selected_station.valueOf() != row.start_station_id.valueOf()) && (selected_station.valueOf() != row.start_station_id.valueOf()))
                return;
        }

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

const render_map = (map_json, projection) => {
    svg.selectAll("path").remove();
    d3.selectAll('#temp3').remove();
    d3.selectAll('#temp4').remove();

    svg.append("g")
        .selectAll("path")
        .data(map_json.features)
        .enter()
        .append("path")
        .attr("d", d3.geoPath().projection(projection))
        .style("fill", "#008938")
        .attr("stroke", "white")
        .attr("stroke-width", .3)
        .style("opacity", .3);
}

const get_trip_counts = (trips) => {
    const trip_counts_json = {};
    const trip_counts = [];

    Object.keys(stations_json).forEach((station) => {
        stations_json[station].n_trips = 0;
    })
    
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
        count = trip_counts_json[name];

        stations_json[start_station_id]['n_trips'] = stations_json[start_station_id]['n_trips'] || 0 + count;
        stations_json[end_station_id]['n_trips'] = stations_json[end_station_id]['n_trips'] || 0 + count;

        trip_counts.push({start_station_id: start_station_id, end_station_id: end_station_id, count: count});
    })
    
    return trip_counts;
    
}

const status_single_station = (id) => {

    return station_status.filter((s) => { return parseInt(s.station_id) == id })
}

const aggregate_data = (type, station_data) => {
    if(type == "weekday"){

    } else if(type == "month") {

    } else if(type == "hour"){

    } else {
        return [];
    }
}

const date_update = (e) => {
    document.getElementById("mainTitle").innerHTML = "San Francisco Bicycles (loading...)";

    load_data(false).then(({ stations, station_status, trips, trip_counts, map_json, avg_station }) => {

        trip_counts = get_trip_counts(trips);

        if(selected_station){
            render_map(map_json, projection2);
            render_connections(trip_counts, path2);
            render_stations(stations, avg_station, trip_counts, projection2);
            
        } else {
            render_map(map_json, projection);
            render_connections(trip_counts, path);
            render_stations(stations, avg_station, trip_counts, projection);
        }

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

    // trip_counts = await d3.csv("data/trip_count.csv", function (d) { return { start_station_id: d.start_station_id, end_station_id: d.end_station_id, count: d.count } });

    station_status = await d3.csv("data/status.csv", function (d) { 
        let dt = d.time;

        if(dt > start_date_input.value && dt < end_date_input.value) {
            return { station_id: d.station_id, docks_available: d.docks_available, date_time: dt } 
        }
    });

    const avgStatus = d3.group(station_status, d => d.station_id);

    map_json = await d3.json("SFN.geojson");

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
                avg_station.push({ 'id': d.id, 'name': d.name, 'lat': d.lat, 'long': d.long, 'avg_docks_available': t.avg_docks_available });
            }
        });
    });

    return { stations, station_status, trips, trip_counts, map_json, avg_station };

}

const main = () => {

    d3.select('#viz_container')
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

        render_map(map_json, projection);

        trip_counts = get_trip_counts(trips);

        render_connections(trip_counts, path);

        render_stations(stations, avg_station, trip_counts, projection);
    })

}

main();





