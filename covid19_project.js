var map;
var tempData;
var dataarr = [new Map(),1,1];
var popmap = new Map();

function htmlsetup(){
      var d1 = new Date();
      d1 = d1.toISOString().slice(0,10);
      document.getElementById("date1").setAttribute("value", d1);
      createPopMap();
      console.log("done")
}
function createPopMap(){
  $.getJSON("/console.json", function(json) {
    }).done(function(json) {
      console.log("done")
      for(var i = 0; i<json["features"].length;i++){
        popmap.set(parseInt(json["features"][i].properties.GEO_ID),[json["features"][i].properties.population,json["features"][i].properties.CENSUSAREA, 1,json["features"][i].properties.NAME]);
      }
      console.log(popmap)
    }); 
    
}
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 40, lng: -95},
      zoom: 4.3,
      disableDefaultUI: true,
    });
  }
function toQueryInput(str){
  var y = str.substr(0,4);
  var m = str.substr(5,2);
  var d = str.substr(8,2);
  return y + m + d;
}

function csvJSON(csv){
var d = new Date(document.getElementById("date1").value).toISOString().slice(0,10);
  var lines=csv.split("\n");

  var result = [];

  var headers=lines[0].split(",");

  for(var i=1;i<lines.length;i++){
	  var obj = {};
    var currentline=lines[i].split(",");
    if (currentline[0]==d){

	  for(var j=0;j<headers.length;j++){
		  obj[headers[j]] = currentline[j];
	  }

	  result.push(obj);
  }
  }
  
  return result; //JavaScript object
}
  function submitButtonPressed() {
    
    clearDataLayer(map);

    var D1 = new Date(document.getElementById("date1").value).toISOString().slice(0,10);
    var d = toQueryInput(D1);
    console.log(dataarr);
    //var query1 = "https://delphi.cmu.edu/epidata/api.php?source=covidcast&data_source=fb-survey&signal=raw_cli&time_type=day&geo_type=county&time_values="+d+"&geo_value=*";
    //var query2 = "https://delphi.cmu.edu/epidata/api.php?source=covidcast&data_source=google-survey&signal=raw_cli&time_type=day&geo_type=county&time_values="+d+"&geo_value=*";
    var query3 = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv"
    //fetchDataEpidata(query1);
    fetchDataNYT(query3,d,"cases",0,1);
    //fetchDataEpidata(query2);
    
}

function fetchDataEpidata(query) {
    $.ajax({
        url: query,
        type: "GET",
        data: {
            "$limit": 1000000000
        }
    }).done(function(data) {
        tempData = data;
        createMap(data["epidata"]);
        console.log(dataarr)
drawCounties(map);
    }); 
}
function fetchDataNYT(query,d,type,n1,n2) {
    $.ajax({
        url: query,
        type: "GET",
        data: {
            "$limit": 1000000000
        }
    }).done(function(data) {
        tempData = data;
        var data1 = csvJSON(data,d);
        console.log(data1)
        createMapNYT(data1,type,n1,n2);
drawCounties(map);
    }); 
}
function drawCounties(map) {
    map.data.loadGeoJson("console.json");
    var map1 = dataarr[0];
    var county;
    console.log(dataarr)
    map.data.setStyle(function(feature) {
      
      county = parseInt(feature.getProperty("GEO_ID"));
      if(map1.has(county)){
            return ({
                fillColor: toHSL(map1.get(county)[0], dataarr[1],dataarr[2], 100, 50),
                strokeColor: "#000000",
                strokeWeight: 0.1
            });
        } else {
            return ({
                fillColor: "#000000",
                strokeColor: "#000000",
                strokeWeight: 0
            });
        }
    });

    map.data.addListener('mouseover', function(event) {
        map.data.revertStyle();
        map.data.overrideStyle(event.feature, {
            strokeWeight: 2
        });
        document.getElementById("infoBox").innerHTML = dataarr[0].get(parseInt(event.feature.getProperty("GEO_ID")))[1]
    });

    map.data.addListener('mouseout', function(event) {
        map.data.revertStyle();
        document.getElementById("infoBox").innerHTML = "Mouse over the regions for more information.";
    });
}

function clearDataLayer(map) {
    map.data.forEach(function(feature) {
        map.data.remove(feature);
    });
}

function toHSL(v, minv, maxv, brightness, saturation) {
    if (v > maxv) {
        var hsl = 0;
    } else {
        var hsl = 120 - 120 * ((v - minv) / (maxv - minv));
    }
    return "hsl(" + hsl + ", " + brightness + "%, " + saturation + "%)";
}

function createMap(arr){
  
  var minv = dataarr[1];
  var maxv = dataarr[2];
  for(var i = 0; i < arr.length;i++){
    var v1 = parseInt(arr[i]["geo_value"]);
    var v2 = [arr[i]["value"],arr[i]["sample_size"]];
    if(!dataarr[0].get(v1)){
      if (v2[0] > maxv) maxv = v2[0];
      if (v2[0] < minv) minv = v2[0];
      dataarr[0].set(v1,v2)
    }
  }
  dataarr= [dataarr[0],minv,maxv];
}
function createMapNYT(arr,type,n1,n2){
  console.log(arr)
  var startval;
  var aug;
  var county;
  county = parseInt(arr[0]["fips"]);
  if(type == "deaths"){
    startval = parseInt(arr[0]["deaths"]);
  }
  else startval = parseInt(arr[0]["cases"]);
  startval /= (popmap.get(county)[n1]/popmap.get(county)[n2]);
  var newDataArr = [new Map(),startval,startval];
  for(var i = 0; i < arr.length;i++){
      county = parseInt(arr[i]["fips"]);
      if(popmap.has(county)){
    aug = popmap.get(county)[n1]/popmap.get(county)[n2];
    console.log(n2)
    var v1 = county;
    if(type == "deaths"){
    var v2 = parseInt(arr[i]["deaths"])/aug;
  }
    else var v2 = parseInt(arr[i]["cases"])/aug;
    if(!newDataArr[0].get(v1)){
      if (v2 > newDataArr[2]) {
        newDataArr[2] = v2;
      }
      if (v2 < newDataArr[1]) {
        newDataArr[1] = v2;
        console.log(v1)}
        var str = '<p1 id="info">'+popmap.get(county)[3] + '</p1><p1 id="info">Population: ' + popmap.get(county)[0] + '</p1><p1 id="info">Area: ' + popmap.get(county)[1] +'</p1>';
        if(type == "deaths") str +=  'Deaths: ' + parseInt(arr[i]["deaths"]);
        else str += 'Cases:' + parseInt(arr[i]["Cases"]);
      newDataArr[0].set(v1,[v2,str])
    }
    }
  }
  dataarr= newDataArr;
}
// var j1;
// var j2;
// function JSONEdit(){
//   $.getJSON("/gz_2010_us_050_00_20m.json", function(json) {
    
// }).done(function(json) {
//   j1 = json;
//   console.log("1")
// }); 
// $.getJSON("/POP.json", function(json2) {
    
// }).done(function(json2) {
//   j2 = json2;
//   console.log("2")
// }); 
// }
// function JSONEdit2(){
//   var data = j1["features"][0].properties.GEO_ID
//   console.log(data)
//   for(var i = 0; i<j1["features"].length; i++){
//     j1["features"][i].properties.GEO_ID = j1["features"][i].properties.GEO_ID.substr(-5,5)
//     for(var k = 0; k<j2.length;k++){
//       if (j2[k].countyFIPS ==parseInt(j1["features"][i].properties.GEO_ID.substr(-5,5))){
//         j1["features"][i].properties.population = j2[k].population;
//       }
//       delete j1["features"][i].properties.STATE;
//       delete j1["features"][i].properties.COUNTY;
//       delete j1["features"][i].properties.LSAD;
//     }
//   }
//   console.log(j2[0].countyFIPS)
//   for(var i = 0; i<j1["features"].length; i++){
    
//   }
//   console.log(j1)
// }
