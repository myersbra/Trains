// AJAX call to pull graph data
$.ajax({
    type: "GET",
    contentType: "application/json; charset=utf-8",
    url: "data",
    dataType: "json",
    success: function(data) {
        drawMap(data);
    },
    error: function(result) {
        error();
    }
});

var pathIDs = []
var possiblePaths = []
var origin;
var destination;
var nodes = {};

function drawMap(links) {
  var width = 800,
    height = 600,
    radius = 15,
    charge = -1500;

  // Gather distinct nodes from data
  links.forEach(function(link) {
    link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
    link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
  });

  var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height])
    .linkDistance(function(d) { return d.value * radius; })
    .charge(charge)
    .on("tick", tick)
    .start();

  var svg = d3.select("#map")
    .attr("width", width)
    .attr("height", height);

  // Specifics for unselected arrowheads
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

  // ... and for selected arrowheads
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
    .attr("id", function(d) {
      pathIDs.push(d.source.name + "-" + d.target.name);
      return d.source.name + "-" + d.target.name;
    })
    .attr("fill", "none")
    .attr("stroke-width", 3);

  var node = svg.append("g").selectAll("node")
    .data(force.nodes())
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", radius)
    .call(force.drag)
    .attr("name", function(d) { return d.name; })
    .attr("id", function(d) { return d.name; })
    .on("click", clickNode);

  var text = svg.append("g").selectAll("text")
    .data(force.nodes())
    .enter().append("text")
    .attr("x", 8)
    .attr("y", ".5em")
    .attr("fill", "#e2e2ff")
    .text(function(d) { return d.name; });

  resetColors();

  function tick() {
    path.attr("d", linkArc);
    node.attr("transform", transform);
    text.attr("transform", transform);
  }

  function linkArc(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + lineX2(d) + "," + lineY2(d);
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

  function transform(d) {
    return "translate(" + d.x + "," + d.y + ")";
  }

  // Set listener for 'Get return route' button
  document.getElementById("return-btn").addEventListener("click", function(){
    [origin, destination] = [destination, origin];
    findPaths(origin, destination);
  });
}


function clickNode() {
    origin = destination;
    destination = this;
    resetColors();
    findPaths(origin, destination);
};

function resetColors() {
  for (var i = 0; i < pathIDs.length; i++) {
    d3.select("#" + pathIDs[i]).style("stroke", "black")
      .style("marker-end", "url(#arrow)");
  }

  d3.selectAll("circle").style("fill", "#200080").style("stroke", "black");
  d3.select(origin).style("fill", "magenta");
  d3.select(destination).style("fill", "magenta");
}

// AJAX call to server for pathfinding calculations
function findPaths(origin, destination) {
  if (typeof origin !== 'undefined') {
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
        updateTable(data);
        if (typeof data[0] !== 'undefined') {
          drawPath(data, 0);
        }
      },
      error: function(result) {
        error();
      }
    });
  }
}


function updateTable(data) {
  var table = document.getElementById("table-body");

  // clear old routes
  while(table.rows.length > 0) {
    table.deleteRow(0);
  }

  if (data.length === 0) {
    var row = table.insertRow(-1);
    row.insertCell(0).innerHTML = "(no routes)";
    resetColors();
  }
  else {
    for (var i = 0; i < data.length; i++) {
      var row = table.insertRow(-1);
      row.insertCell(0).innerHTML = i + 1;
      row.insertCell(1).innerHTML = data[i][1];
      row.insertCell(2).innerHTML = data[i][2];

      // Add path display on hover listener
      row.addEventListener("mouseover", function() {
        drawPath(data, this.cells[0].innerHTML - 1)
      });
    }
  }
}

function drawPath(data, routeNumber) {
  resetColors();
  var stops = data[routeNumber][0];
  for (var i = 0; i < stops.length; i++) {
    // Color path stops
    d3.select("#" + stops[i]).style("fill", "magenta").style("stroke", "white");
    // Color path arrows
    d3.select("#" + stops[i] + "-" + stops[i + 1]).style("stroke", "white")
      .style("marker-end", "url(#selected-arrow)");
  }
}

function error() {
    console.log("error");
}