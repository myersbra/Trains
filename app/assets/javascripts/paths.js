$.ajax({
    type: "GET",
    contentType: "application/json; charset=utf-8",
    url: "data",
    dataType: "json",
    success: function(data) {
        draw(data);
    },
    error: function(result) {
        error();
    }
});

var pathIDs = []
var possiblePaths = []


function draw(links) {

  var origin;
  var destination;
  var nodes = {};

// Compute the distinct nodes from the links.
links.forEach(function(link) {
  link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
  link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
});

var width = 600,
    height = 600,
    radius = 15;

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height])
    .linkDistance(function(d) { return d.value * 15; })
    .charge(-1500)
    .on("tick", tick)
    .start();

var svg = d3.select("#map")
    .attr("width", width)
    .attr("height", height);

svg.append("defs").selectAll("marker")
    .data(["arrow"])
  .enter().append("marker")
    .attr("id", function(d) { return d; })
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 4)
    .attr("markerHeight", 5)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5");

    svg.append("defs").selectAll("marker")
    .data(["selected-arrow"])
  .enter().append("marker")
    .attr("id", function(d) { return d; })
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 4)
    .attr("markerHeight", 5)
    .attr("orient", "auto")
    .attr("fill", "white")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5");

var path = svg.append("g").selectAll("path")
    .data(force.links())
  .enter().append("path")
    .attr("class", "link")
    .attr("id", function(d) { pathIDs.push(d.source.name + "-" + d.target.name); return d.source.name + "-" + d.target.name; })
    .attr("fill", "none")
    .attr("stroke-width", 3)
    // .attr("stroke", "black")
    // .attr("marker-end", "url(#arrow)");

var node = svg.append("g").selectAll("node")
    .data(force.nodes())
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", radius)
    .call(force.drag)
    .attr("name", function(d) { return d.name; })
    .attr("id", function(d) { return d.name; })
    .on("click", clickNode);

resetColors();

    function clickNode() {
      resetColors();

      origin = destination;
      destination = this;

      d3.select(origin).style("fill", "magenta");
      d3.select(destination).style("fill", "magenta");

      if (typeof origin !== 'undefined') {
        console.log(origin.getAttribute("name") + " => " + destination.getAttribute("name"));
        $.ajax({
        url: 'find_paths',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        type: 'POST',
        data: JSON.stringify({ data: {
          source: origin.getAttribute("name"),
          target: destination.getAttribute("name") }
        }),
        success: function (data) {
          newfunction(data);
        },
        error: function(result) {
          error();
        }
        });
      }
    };

function resetColors() {
      for (var i = 0; i < pathIDs.length; i++) {
        d3.select("#" + pathIDs[i]).style("stroke", "black").style("marker-end", "url(#arrow)");
      }

  d3.select(origin).style("fill", "white");
  d3.selectAll("circle").style("fill", "white").style("stroke", "black");
}

function newfunction(data) {
   console.log(data);

    var table = document.getElementById("table-body");

    // clear old routes
    while(table.rows.length > 0) {
      table.deleteRow(0);
    }

    if (data.length === 0) {
      var row = table.insertRow(-1);
      row.insertCell(0).innerHTML = "(no routes)";
    }
    else {

    for (var i = 0; i < data.length; i++) {
      var row = table.insertRow(-1);
      row.insertCell(0).innerHTML = i + 1;
      row.insertCell(1).innerHTML = data[i][1];
      row.insertCell(2).innerHTML = data[i][2];

      console.log(row);

      row.addEventListener("mouseover", function() {
        console.log("hover!")
        drawRoute(data, i - 1)
      });

    }

    drawRoute(data, 0)
  }

    function drawRoute(data, j) {
      resetColors();
      console.log(j)
      if (typeof data[0] !== 'undefined') {
        for (var i = 0; i < data[j][0].length; i++) {
          d3.select("#" + data[j][0][i]).style("fill", "magenta").style("stroke", "white");
            console.log(d3.select("#" + data[j][0][i] + "-" + data[j][0][i + 1]));
            var mypath = d3.select("#" + data[j][0][i] + "-" + data[j][0][i + 1]);
            console.log(mypath.style.fill);
            d3.select("#" + data[j][0][i] + "-" + data[j][0][i + 1]).style("stroke", "white").style("marker-end", "url(#selected-arrow)");
        }
      }
    }
}

var text = svg.append("g").selectAll("text")
    .data(force.nodes())
  .enter().append("text")
    .attr("x", 8)
    .attr("y", ".5em")
    // .attr("fill", "white")
    // .attr("stroke", "black")
    .text(function(d) { return d.name; });

function tick() {
  path.attr("d", linkArc);
  node.attr("transform", transform);
  text.attr("transform", transform);
}

function lineX2(d) {
    var length = Math.sqrt(Math.pow(d.target.y - d.source.y, 2) + Math.pow(d.target.x - d.source.x, 2));
    var scale = (length - radius) / length;
    var offset = (d.target.x - d.source.x) - (d.target.x - d.source.x) * scale;
    return d.target.x - offset;
};
function lineY2(d) {
    var length = Math.sqrt(Math.pow(d.target.y - d.source.y, 2) + Math.pow(d.target.x - d.source.x, 2));
    var scale = (length - radius) / length;
    var offset = (d.target.y - d.source.y) - (d.target.y - d.source.y) * scale;
    return d.target.y - offset;
};

function linkArc(d) {
  var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = Math.sqrt(dx * dx + dy * dy);
  return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + lineX2(d) + "," + lineY2(d);
}

function transform(d) {
  return "translate(" + d.x + "," + d.y + ")";
}

}

function error() {
    console.log("error");
}