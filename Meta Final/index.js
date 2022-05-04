var width = 700,
    height = 540,
    scale = 270000,
    latitude = 37.7750,
    longitude = -122.4183;

var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

var projection = d3.geoAlbers()
    .scale(scale)
    .rotate([-longitude, 0])
    .center([0, latitude])
    .parallels([24, 43]);

// Create data for circles:
var markers = [
    { long: -122.39997, lat: 37.795001, name: "Clay at Battery" },
    { long: -122.398436, lat: 37.79728, name: "Davis at Jackson" },
    { long: -122.402923, lat: 37.794230999999996, name: "Commercial at Montgomery" },
    { long: -122.40476699999999, lat: 37.795425, name: "Washington at Kearney" },
    { long: -122.403452, lat: 37.788975, name: "Post at Kearney" },
    { long: -122.398525, lat: 37.799953, name: "Embarcadero at Vallejo" },
];

// Draw map
d3.json("SFN.geojson", function (data) {
    svg.append("g")
        .selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", d3.geoPath().projection(projection))
        .style("fill", function () { return "#FF7870" })
        //.on("mouseover", function (e) { d3.select(this).style("fill", "#E4EEE3") })
        //.on("mouseout", function (e) { d3.select(this).style("fill", "#FF7870") })
        .attr("stroke", "white")
        .attr("stroke-width", .3)
        .style("opacity", .3)
});

// Add circles
svg
    .selectAll("circle")
    .data(markers)
    .enter()
    .append("circle")
    .attr("cx", function (d) { return projection([d.long, d.lat])[0] })
    .attr("cy", function (d) { return projection([d.long, d.lat])[1] })
    .attr("r", 14)
    .style("fill", "69b3a2")
    .attr("stroke", "#69b3a2")
    .attr("stroke-width", 3)
    .attr("fill-opacity", .4)
    .on('mouseover', function (d) {
        d3.select(this.parentNode)
            .append('text')
            .attr('dy', ".35em")
            .attr('id', 'temp')
            .text(d.name)
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
            .attr("width", d.name.length * 10)
            .attr("height", "40")
            .style("fill", "#E4EEE3");
    })
    .on('mouseout', function () {
        d3.select(this.parentNode).selectAll('#temp').remove('#temp');
        d3.select(this.parentNode).selectAll('#temp2').remove('#temp2');
    }).raise();

/*
// Draw Stations
d3.csv('station.csv')
    .row(function (data) {
        return {
            name: data.name,
            lat: parseFloat(data.lat),
            long: parseInt(data.long),
            origin: data.Origin,
            city: data.city
        };
    })
    .get(function (data) {
        console.log(data.city);
        svg
            .selectAll("stations")
            .data(data)
            .enter()
            .append('circle')
            .filter(function (d) { return d.city == "San Francisco" })
            .attr("cx", function (d) { return projection([d.long, d.lat])[0] })
            .attr("cy", function (d) { return projection([d.long, d.lat])[1] })
            .attr("r", 14)
            .style("fill", "69b3a2")
            .attr("stroke", "#69b3a2")
            .attr("stroke-width", 3)
            .attr("fill-opacity", .4)
    });
    */