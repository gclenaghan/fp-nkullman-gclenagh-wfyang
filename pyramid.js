var mismatchmode = 0 //0 = pyramid, 1 = box plot

var pyramid_margin = {
      top: 50,
      right: 20,
      bottom: 24,
      left: 25,
      middle: 20
};

var pyramid_width = 400,
    pyramid_height = 150;

var box_width = 300, box_height = 50;

// CREATE SVG
var pyramid_svg = d3.select('#group').append('svg')
      .attr('width', pyramid_margin.left + pyramid_width + pyramid_margin.right)
      .attr('height', pyramid_margin.top + pyramid_height + pyramid_margin.bottom)
      // ADD A GROUP FOR THE SPACE WITHIN THE MARGINS
      .append('g')
        .attr('transform', translation(pyramid_margin.left, pyramid_margin.top));

d3.select("#mismatch_selector")
  .on("input", update_mismatchmode);

function updatePyramid(sites){
  /*  Updates either the pyramid or the box plot, whichever mode is selected
      using data from the selected sites. In each case, smoothly translate the chart
      as sites are selected or deselected (though the stats are recomputed entirely each time)
      The relevant data in each case is the number of mismatches each patient has with the
      vaccine sequence at the selected sites.*/
  if (mismatchmode == 0)
  {
    var possiblecounts = [];
    for(var patient in seqID_lookup){
      if(seqID_lookup[patient].mismatch != undefined){
        var mmcount = 0;
        for(var i = 0; i < sites.length; i++){
            mmcount += seqID_lookup[patient].mismatch[sites[i]]; 
        }
      }
      possiblecounts.push(mmcount);
    }
    var mincounts = d3.min(possiblecounts);
    var maxcounts = d3.max(possiblecounts);
    var skipcount = Math.ceil((maxcounts-mincounts)/16);
    var tickvals = d3.range(mincounts,maxcounts+1).filter(function(d,i){return (i % skipcount === 0)});
    var mdata = [];
    
    for(var i = 0; i < d3.max(possiblecounts)+1; i++){
        mdata.push({mismatches:i.toString(), vaccine:0, placebo:0});
        }
    for(var patient in seqID_lookup){
        if(seqID_lookup[patient].mismatch != undefined){
          mmcount = 0;
          for(var i = 0; i < sites.length; i++){
              mmcount += seqID_lookup[patient].mismatch[sites[i]]; 
          }
          if(seqID_lookup[patient].vaccine){
              mdata[mmcount].vaccine += 1;
          } else {
              mdata[mmcount].placebo += 1;
          }
        }  
    }
  var maxValue = Math.max(
    d3.max(mdata, function(d) { return d.vaccine/numvac; }),
    d3.max(mdata, function(d) { return d.placebo/numplac; })
  );
  if (mismatchmode == 0)
  {
    // the width of each side of the chart
  var regionWidth = pyramid_width/2 - pyramid_margin.middle;

    // these are the x-coordinates of the y-axes
  var pointA = regionWidth,
        pointB = pyramid_width - regionWidth;
    
  var xScale = d3.scale.linear()
      .domain([0, maxValue])
      .range([0, regionWidth])
      .nice();
   
  var yScale = d3.scale.ordinal()
      .domain(d3.range(mincounts,maxcounts+1))
      .rangeRoundBands([pyramid_height,0],0.1);

  var yAxisLeft = d3.svg.axis()
      .scale(yScale)
      .orient('right')
      .tickValues(tickvals)
      .tickSize(4,0)
      .tickPadding(pyramid_margin.middle-4);

  var yAxisRight = d3.svg.axis()
      .scale(yScale)
      .orient('left')
      .tickValues(tickvals)
      .tickSize(4,0)
      .tickFormat('');
      
  var xAxisRight = d3.svg.axis()
      .scale(xScale)
      .orient('bottom')
      .ticks(5)
      .tickFormat(d3.format(''));

  var xAxisLeft = d3.svg.axis()
      .scale(xScale.copy().range([pointA, 0]))
      .orient('bottom')
      .ticks(5)
      .tickFormat(d3.format(''));
      
  pyramid_svg.select(".axis.y.left")
            .transition()
            .call(yAxisLeft)
            .selectAll('text')
            .style('text-anchor', 'middle');
            
  pyramid_svg.select('.axis.y.right')
            .transition()
            .call(yAxisRight);
            
  pyramid_svg.transition()
            .select('.axis.x.left')
            .call(xAxisLeft);
  
  pyramid_svg.select('.axis.x.right')
            .transition()
            .call(xAxisRight);
            
  var leftBars = pyramid_svg.select('.lgroup')
                           .selectAll('.bar.left')
                           .data(mdata,id);
  leftBars.exit().remove();
  
  var rightBars = pyramid_svg.select('.rgroup')
                            .selectAll('.bar.right')
                            .data(mdata,id);
  rightBars.exit().remove();
  leftBars.enter().append('rect')
        .attr('class','bar left')
        .attr('x', 0)
        .attr('y', function(d) {return yScale(d.mismatches); })
        .attr('width', function(d) {return xScale(d.vaccine / numvac); })
        .attr('height', yScale.rangeBand())
        .style("fill","red");
    d3.selectAll(".bar.left>title").remove();
    d3.selectAll(".bar.left")
      .on("mouseover", function() {d3.select(this).attr("opacity", 0.5);})
      .on("mouseout", function() {d3.select(this).attr("opacity", 1);})
      .append("svg:title")
        .text(function(d){return ((d.vaccine/numvac)*100).toPrecision(2) + "% of patients";});
        
  rightBars.enter().append('rect')
        .attr('class','bar right')
        .attr('x', 0)
        .attr('y', function(d) {return yScale(d.mismatches); })
        .attr('width', function(d) {return xScale(d.placebo / numplac); })
        .attr('height', yScale.rangeBand())
        .style("fill","steelblue");
   d3.selectAll(".bar.right>title").remove();
   d3.selectAll(".bar.right")
      .on("mouseover", function() {d3.select(this).attr("opacity", 0.5);})
      .on("mouseout", function() {d3.select(this).attr("opacity", 1);})
      .append("svg:title")
        .text(function(d) {return ((d.placebo/numplac)*100).toPrecision(2) + "% of patients";});
  leftBars.transition()
          .attr('y', function(d) {return yScale(d.mismatches); })
          .attr('width', function(d) {return xScale(d.vaccine / numvac); })
          .attr('height', yScale.rangeBand());


  rightBars.transition()
           .attr('y', function(d) {return yScale(d.mismatches); })
           .attr('width', function(d) { return xScale(d.placebo / numplac); })
           .attr('height', yScale.rangeBand()); 
  }
  } else {
    //update box plot
    var mmdata = [[],[]]; 
    //mmdata[0] = array of the count of mismatches for each vaccine-recieving patient in selected region
    //mmdata[1] = same for placebo patients
    for (var patient in seqID_lookup)
    {
      if (seqID_lookup[patient].mismatch != undefined)
      {
        var mmcount = d3.sum(sites.map(function(d) { return seqID_lookup[patient].mismatch[d]; }));
        if (seqID_lookup[patient].vaccine)
        {
           mmdata[0].push(mmcount);
        } else {
           mmdata[1].push(mmcount);
        }
      }
    }
    
    var xscale = d3.scale.linear()
      .domain([0, Math.max(d3.max(mmdata[0]), d3.max(mmdata[1]))])
      .range([0, box_width])
      .nice(); 
    var yscale = d3.scale.ordinal()
      .domain([0, 1])
      .rangeRoundPoints([20, 100]);
    var xaxis = d3.svg.axis()
      .scale(xscale)
      .orient("bottom");
    var yaxis = d3.svg.axis()
      .scale(yscale)
      .orient("left")
      .tickFormat(function(d) { return ["Vaccine Group", "Placebo Group"][d]; });
    
    pyramid_svg.select(".xbox")
      .transition()
      .call(xaxis);
    pyramid_svg.select(".ybox")
      .transition()
      .call(yaxis);
    
    pyramid_svg.selectAll(".box")
      .data(mmdata)
      .each(update_box);
    
    function update_box(d, i)
    {
      /*  Computes the necessary statistics and updates the
          box plot as necessary */
      var box = d3.select(this);
      var arr = d.sort(d3.ascending);
      var q1 = d3.quantile(arr, .25),
        q2 = d3.quantile(arr, .5),
        q3 = d3.quantile(arr, .75);
        
      var lower_cutoff = q2 - 1.5*(q3-q1);
      var upper_cutoff = q2 + 1.5*(q3-q1);
    
      var outliers = arr.splice(0, _.sortedIndex(arr, lower_cutoff-.25)) //remove and save lower outliers
      outliers = outliers.concat(arr.splice(_.sortedIndex(arr, upper_cutoff+.25), Infinity)) //remove upper outliers
    
      var q0 = arr[0];
      var q4 = arr[arr.length-1];
    
      
     box.select(".middle50").transition()
      .attr("x", xscale(q1))
      .attr("y", -box_height/2)
      .attr("width", xscale(q3-q1))
      .attr("height", box_height);
      
    box.select(".median").transition()
      .attr("x1", xscale(q2))
      .attr("x2", xscale(q2))
      .attr("y1", -box_height/2)
      .attr("y2", box_height/2);
    
    box.select(".outer25.high").transition()
      .attr("x1", xscale(q3))
      .attr("x2", xscale(q4));
    box.select(".outer25.low").transition()
      .attr("x1", xscale(q0))
      .attr("x2", xscale(q1));
    box.select(".whisker.low").transition()
      .attr("x1", xscale(q0))
      .attr("x2", xscale(q0))
      .attr("y1", -box_height/2)
      .attr("y2", box_height/2);
    box.select(".whisker.high").transition()
      .attr("x1", xscale(q4))
      .attr("x2", xscale(q4))
      .attr("y1", -box_height/2)
      .attr("y2", box_height/2);
    
      var outlier_selection = box.selectAll(".outlier")
        .data(outliers);
      
      outlier_selection.transition()
        .attr("cx", xscale);
      outlier_selection.exit().transition()
        .attr("opacity", 0)
        .remove();
      outlier_selection.enter().append("circle")
          .attr("class", "outlier")
          .attr("cx", xscale)
          .attr("r", box_height/16);
    }
  }
  if (selected_sites.length === 0) {d3.selectAll(".bar.left,.bar.right").remove();}        
}
function drawPyramid(sites){
    var possiblecounts = [];
    for(var patient in seqID_lookup){
      if(seqID_lookup[patient].mismatch != undefined){
        var mmcount = 0;
        for(var i = 0; i < sites.length; i++){
            mmcount += seqID_lookup[patient].mismatch[sites[i]]; 
        }
      }
      possiblecounts.push(mmcount);
    }
    
    var mmdata = [];
    for(var i = 0; i < sites.length+1; i++){
        mmdata.push({mismatches:i.toString(), vaccine:0, placebo:0});
        }
    for(var patient in seqID_lookup){
        if(seqID_lookup[patient].mismatch != undefined){
          mmcount = 0;
          for(var i = 0; i < sites.length; i++){
              mmcount += seqID_lookup[patient].mismatch[sites[i]]; 
          }
          if(seqID_lookup[patient].vaccine){
              mmdata[mmcount].vaccine += 1;
          } else {
              mmdata[mmcount].placebo += 1;
          }
        }
        
    }
        
    // the width of each side of the chart
    var regionWidth = pyramid_width/2 - pyramid_margin.middle;
    var mincounts = d3.min(possiblecounts);
    var maxcounts = d3.max(possiblecounts);
    var skipcount = Math.ceil((maxcounts-mincounts)/16);
    var tickvals = d3.range(mincounts,maxcounts+1).filter(function(d,i){return (i % skipcount === 0)});
    var maxValue = Math.max(
      d3.max(mmdata, function(d) { return d.vaccine; })/numvac,
      d3.max(mmdata, function(d) { return d.placebo; })/numplac
    );

    // these are the x-coordinates of the y-axes
    var pointA = regionWidth,
        pointB = pyramid_width - regionWidth; 
    
    // the xScale goes from 0 to the width of a region
    //  it will be reversed for the left x-axis
    var xScale = d3.scale.linear()
      .domain([0, maxValue])
      .range([0, regionWidth])
      .nice();

    var yScale = d3.scale.ordinal()
      .domain(d3.range(mincounts,maxcounts+1))
      .rangeRoundBands([pyramid_height,0], 0.1);

    var yAxisLeft = d3.svg.axis()
      .scale(yScale)
      .orient('right')
      .ticks(tickvals)
      .tickSize(4,0)
      .tickPadding(pyramid_margin.middle-4);

    var yAxisRight = d3.svg.axis()
      .scale(yScale)
      .orient('left')
      .ticks(tickvals)
      .tickSize(4,0)
      .tickFormat('');

    var xAxisRight = d3.svg.axis()
      .scale(xScale)
      .orient('bottom')
      .ticks(5)
      .tickFormat(d3.format(''));

    var xAxisLeft = d3.svg.axis()
      .scale(xScale.copy().range([pointA, 0]))
      .orient('bottom')
      .ticks(5)
      .tickFormat(d3.format(''));

    var leftBarGroup = pyramid_svg.append('g')
      .attr('class', 'lgroup')
      .attr('transform', translation(pointA, 0) + 'scale(-1,1)');
    var rightBarGroup = pyramid_svg.append('g')
      .attr('class', 'rgroup')
      .attr('transform', translation(pointB, 0));

    pyramid_svg.append('g')
      .attr('class', 'axis y left')
      .attr('transform', translation(pointA, 0))
      .call(yAxisLeft)
      .selectAll('text')
      .style('text-anchor', 'middle');

    pyramid_svg.append('g')
      .attr('class', 'axis y right')
      .attr('transform', translation(pointB, 0))
      .call(yAxisRight);
     
     // draw title
    pyramid_svg.append("text")
      .attr("x",pyramid_width/2)
      .attr("y",-30)
      .style("text-anchor","middle")
      .style("font-size","15px")
      .text("Distribution of Mismatch Counts Across Selected Sites");
    // labels etc.  
    pyramid_svg.append('text')
      .text("Vaccine Group")
      .attr('x',0)
      .attr('y',0);
    pyramid_svg.append('text')
      .text("Placebo Group")
      .attr('x',330)
      .attr('y',0);
      
    pyramid_svg.append("text")
      .text("Number of Mismatches")
      .attr("x",pyramid_width/2)
      .attr("y",-2)
      .style("text-anchor","middle");

    pyramid_svg.append('g')
      .attr('class', 'axis x left')
      .attr('transform', translation(0, pyramid_height))
      .text("Vaccine Group")
      .call(xAxisLeft);

    pyramid_svg.append('g')
      .attr('class', 'axis x right')
      .attr('transform', translation(pointB, pyramid_height))
      .call(xAxisRight);

    leftBarGroup.selectAll('.bar.left')
      .data(mmdata)
      .enter().append('rect')
        .attr('class', 'bar left')
        .attr('x', 0)
        .attr('y', function(d) {return yScale(d.mismatches); })
        .attr('width', function(d) { return xScale(d.vaccine / numvac); })
        .attr('height', yScale.rangeBand())
        .style("fill","red");

    rightBarGroup.selectAll('.bar.right')
      .data(mmdata)
      .enter().append('rect')
        .attr('class', 'bar right')
        .attr('x', 0)
        .attr('y', function(d) { return yScale(d.mismatches); })
        .attr('width', function(d) { return xScale(d.placebo / numplac); })
        .attr('height', yScale.rangeBand()).style("fill","steelblue");
        
    if (selected_sites.length === 0) {d3.selectAll(".bar.right,.bar.left").remove();}
}

function translation(x,y) {
  return 'translate(' + x + ',' + y + ')';
}
  
function id(d){
  return d.mismatches;
}

function drawBoxplot(sites)
{
  //Create box plot for the first time (instead of updating as in updatePyramid())
  var leftmargin = 75;
  var mmdata = [[],[]];
  for (var patient in seqID_lookup)
  {
    if (seqID_lookup[patient].mismatch != undefined)
    {
      var mmcount = d3.sum(sites.map(function(d) { return seqID_lookup[patient].mismatch[d]; }));
      if (seqID_lookup[patient].vaccine)
      {
        mmdata[0].push(mmcount);
      } else {
        mmdata[1].push(mmcount);
      }
    }
  }
  
  var xscale = d3.scale.linear()
    .domain([0, Math.max(d3.max(mmdata[0]), d3.max(mmdata[1]))])
    .range([0, box_width])
    .nice();
  
  var yscale = d3.scale.ordinal()
    .domain([0, 1])
    .rangeRoundPoints([20, 100]);
  
  var xaxis = d3.svg.axis()
    .scale(xscale)
    .orient("bottom");
  
  var yaxis = d3.svg.axis()
    .scale(yscale)
    .orient("left")
    .tickFormat(function(d) { return ["Vaccine Group", "Placebo Group"][d]; });
  
    pyramid_svg.append("text")
      .attr("x",pyramid_width/2)
      .attr("y",-30)
      .style("text-anchor","middle")
      .style("font-size","15px")
      .text("Distribution of Mismatch Counts Across Selected Sites");
  
  pyramid_svg.selectAll(".box")
    .data(mmdata)
    .enter().append("g")
      .attr("class", "box")
      .attr("transform", function(d, i) {return translation(leftmargin, yscale(i)); })
      .each(create_box);
  function create_box(d, i)
  {
    var box = d3.select(this);
    var arr = d.sort(d3.ascending);
    var q1 = d3.quantile(arr, .25),
      q2 = d3.quantile(arr, .5),
      q3 = d3.quantile(arr, .75);
    
    var lower_cutoff = q2 - 1.5*(q3-q1);
    var upper_cutoff = q2 + 1.5*(q3-q1);
    
    var outliers = arr.splice(0, _.sortedIndex(arr, lower_cutoff-.25)) //remove and save lower outliers
    outliers = outliers.concat(arr.splice(_.sortedIndex(arr, upper_cutoff+.25), Infinity)) //remove upper outliers
    
    var q0 = arr[0];
    var q4 = arr[arr.length-1];
    
    box.append("rect")
      .attr("class", "middle50")
      .attr("x", xscale(q1))
      .attr("y", -box_height/2)
      .attr("width", xscale(q3-q1))
      .attr("height", box_height);
      
    box.append("line")
      .attr("class", "median")
      .attr("x1", xscale(q2))
      .attr("x2", xscale(q2))
      .attr("y1", -box_height/2)
      .attr("y2", box_height/2);
    
    box.append("line")
      .attr("class", "outer25 high")
      .attr("x1", xscale(q3))
      .attr("x2", xscale(q4));
    box.append("line")
      .attr("class", "outer25 low")
      .attr("x1", xscale(q0))
      .attr("x2", xscale(q1));
    box.append("line")
      .attr("class", "whisker low")
      .attr("x1", xscale(q0))
      .attr("x2", xscale(q0))
      .attr("y1", -box_height/2)
      .attr("y2", box_height/2);
      box.append("line")
      .attr("class", "whisker high")
      .attr("x1", xscale(q4))
      .attr("x2", xscale(q4))
      .attr("y1", -box_height/2)
      .attr("y2", box_height/2);
      
      box.selectAll(".outlier")
        .data(outliers)
        .enter().append("circle")
          .attr("class", "outlier")
          .attr("cx", xscale)
          .attr("r", box_height/16);
  }
  
  pyramid_svg.append("g")
    .attr("transform", translation(leftmargin, yscale(1)+box_height/2+10))
    .attr("class", "xbox axis")
    .call(xaxis)
    .append("text")
      .attr("transform", translation(xscale.range()[1]/2, 30))
      .style("text-anchor", "middle")
      .text("Number of Mismatches");
  
  pyramid_svg.append("g")
    .attr("class", "ybox axis")
    .attr("transform", translation(leftmargin-10, 0))
    .call(yaxis);
}

function update_mismatchmode()
{
  /*  Callback function for the selection of which chart to draw
      In each case, change mismatchmode and redraw everything.  */
  var parent = d3.select(pyramid_svg.node().parentNode);
  pyramid_svg.remove();
  pyramid_svg = parent.append('g')
        .attr('transform', translation(pyramid_margin.left, pyramid_margin.top));
  switch (d3.event.target.value)
  {
  case "pyramid":
    mismatchmode = 0;
    drawPyramid(selected_sites);
    return;
  case "box":
    mismatchmode = 1;
    drawBoxplot(selected_sites);
    return;
  }
}