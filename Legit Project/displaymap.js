var load = 0
var origins = [];
var methodtrans;
var shapes = [];
var marker, map;

function initMap() {
  load++;
  var select = document.getElementById("transportation");

  select.options[0] = new Option("Biking", 0);
  select.options[1] = new Option("Driving", 1);
  select.options[2] = new Option("Transit", 2);
  select.options[3] = new Option("Walking", 3);

  if (load == 2){
    //creates a map
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 14,
      center: {lat: 37.444359, lng: -122.159901},
      mapTypeId: google.maps.MapTypeId.TERRAIN
    });

    //setting up boundary coordinates for each region
    var regions = [];
    var baseLat = 37.449333, baseLong = -122.173600;
    var endSElat = 37.428431, endSElong = -122.139875, endNElat = 37.468876, endNElong = -122.155271;
    var SElatchange = endSElat - baseLat, SElongchange = endSElong - baseLong;
    var NElatchange = endNElat - baseLat, NElongchange = endNElong - baseLong;
    var SEdiv = 10, NEdiv = 8
    var count = 0;

    for (var i = 0; i < SEdiv; i++){
      for (var j = 0; j < NEdiv; j++){
        var startLat = baseLat + (SElatchange * i/SEdiv) + (NElatchange * j/NEdiv);
        var startLong = baseLong + (SElongchange * i/SEdiv) + (NElongchange * j/NEdiv);
        regions[count] = [
        {lat: startLat, lng: startLong},
        {lat: startLat + (SElatchange/SEdiv), lng: startLong + (SElongchange/SEdiv)},
        {lat: startLat + (SElatchange/SEdiv) + (NElatchange/NEdiv), lng: startLong + (SElongchange/SEdiv) + (NElongchange/NEdiv)},
        {lat: startLat + (NElatchange/NEdiv), lng: startLong + (NElongchange/NEdiv)},
        {lat: startLat, lng: startLong}
        ]
        count++;
      }
    }

    //obtaining midpoints for each region
    for (var i = 0; i < regions.length; i++){
      var mat = regions[i];
      var latsum = mat[0]["lat"] + mat[1]["lat"] + mat[2]["lat"] + mat[3]["lat"];
      latsum /= 4;
      var lngsum = mat[0]["lng"] + mat[1]["lng"] + mat[2]["lng"] + mat[3]["lng"];
      lngsum /= 4;
      origins[i] = new google.maps.LatLng(latsum, lngsum);
    }

    var destination = {lat: 37.444359, lng: -122.159902};

    //initializes destination marker
    marker = new google.maps.Marker({
      position: destination,
      window: new google.maps.InfoWindow({
       content: destination.lat + ", " + destination.lng,
       position: destination
     }),
      map: map,
      title: 'Destination'
    });
    google.maps.event.addListener(marker,"mouseover",function(){
      this.window.open(map, this);
      // console.log();
    });
    google.maps.event.addListener(marker,"mouseout",function(){
      this.window.close();
    });

    //code for changing transportation mode via radio buttons
    var trans = select.options[select.selectedIndex];
    methodtrans = google.maps.TravelMode.BICYCLING;

    select.onchange = function(){
      trans = select.options[select.selectedIndex];
      methodtrans = google.maps.TravelMode.BICYCLING;
      if(trans.text=="Biking"){
        methodtrans = google.maps.TravelMode.BICYCLING;
      }
      else if (trans.text == "Driving"){
        methodtrans = google.maps.TravelMode.DRIVING;
      }
      else if (trans.text == "Transit"){
        methodtrans = google.maps.TravelMode.TRANSIT;
      }
      else if (trans.text == "Walking"){
        methodtrans = google.maps.TravelMode.WALKING;
      }
      else {
        methodtrans = google.maps.TravelMode.DRIVING;
      }
      resetMap(destination, origins, shapes, methodtrans);
    }

    //code for switching marker on MAP click
    google.maps.event.addListener(map, "click", function(e){
      destination = e.latLng;
      console.log(destination.lat() + ", " + destination.lng());
      placeDest(destination);

      resetMap(destination, origins, shapes, methodtrans);

    });

    //setting regions' colors and display settings
    var colors = [];
    var times = [];
    count = 0;

    for (var i = 0; i < origins.length; i++){
      var datapoints = regions[i];
      shapes[i] = new google.maps.Polygon({
       paths: datapoints,
       map: map,
       tempColor: "",
       window: new google.maps.InfoWindow({
        content: "Loading...",
        position: origins[i]
      }),
       strokeColor: "",
       strokeOpacity: 0.35,
       strokeWeight: 1,
       fillColor: "",
       fillOpacity: 0.35,
       //clickable: false
     });

     //setting up mouseover features (infowindows, route highlight)
      var directionsDisplay = new google.maps.DirectionsRenderer({
        preserveViewport: true,
        suppressMarkers: true,
        suppressBicyclingLayer: true
      });
      var directionsService = new google.maps.DirectionsService();

      google.maps.event.addListener(shapes[i],"mouseover",function(){
        this.setOptions({fillColor: "#7723a4"});
        this.window.open(map, this);
        // console.log();
        directionsService.route({
          origin: this.window.position,
          destination: destination,
          travelMode: methodtrans
        }, function(result, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(result);
          }
          directionsDisplay.setMap(map);
        });
      });
      google.maps.event.addListener(shapes[i],"mouseout",function(){
        this.setOptions({fillColor: this.tempColor});
        this.window.close();
        directionsDisplay.setMap(null);
      });
      google.maps.event.addListener(shapes[i], "click", function(e){
        destination = e.latLng;
        // console.log(destination.lat() + ", " + destination.lng());
        placeDest(destination);
        resetMap(destination, origins, shapes, methodtrans);

      });
    }
    resetMap(destination, origins, shapes, methodtrans)
  }
}

function calcTime(dest, ori, index, shapes, methodtrans, times){
  var matrix = new google.maps.DistanceMatrixService;
  var time;
  matrix.getDistanceMatrix({
    origins: [ori[index]],
    destinations: [dest],
    travelMode: methodtrans,
    unitSystem: google.maps.UnitSystem.METRIC,
  }, function(response, status) {//upon completion
    if (status != google.maps.DistanceMatrixStatus.OK) {
      console.log(status);
      times[index]=-1;
      if(calcTimeDone(times)){
        console.log(times);
        calcValues(times);
      }
    }
    if (status == google.maps.DistanceMatrixStatus.OK) {
      var results = response.rows[0].elements;
      var destin = response.destinationAddresses[0];
      if (typeof(results[0].duration) == 'undefined'){
        time = -1
      } else {
        time = results[0].duration.value; //Goes to location and stores value of seconds into duration variable]
        }
      times[index]=time;
      if(calcTimeDone(times)){
        console.log(times);
        calcValues(times);
      }
    }
  });
}

function fieldSubmit(){
  var input = document.getElementById("address");
  console.log(input.value);
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({address: input.value}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      placeDest(results[0].geometry.location);

      for (var i = 0; i < origins.length; i++){
        calcTime(results[0].geometry.location, origins, i, shapes, methodtrans);
      }
      //console.log("calculated");
    }
  });
}

  function resetMap(destination, origins, shapes, methodtrans){
    var timetemp;
    var times = new Array(80);
    for (var i = 0; i < origins.length; i++){
      calcTime(destination, origins, i, shapes, methodtrans, times);
    }
  }

  function calcTimeDone(arr){
    var count=0;
    for(var i = 0;i < arr.length;i++){
      if(arr[i]!=null){
        count++;
      }
    }
    if(count==arr.length){
      return true;
    }
    else {
      return false;
    }
  }
  function resetLegend(mintime, maxtime, range){
    var firstincrement, secondincrement, thirdincrement, fourthincrement;
    firstincrement = "" + timeToWords(mintime) + " to " + timeToWords(range/4 + mintime);
    secondincrement = "" + timeToWords(mintime + range/4) + " to " + timeToWords(mintime + range/2);
    thirdincrement = "" + timeToWords(mintime + range/2) + " to " + timeToWords(mintime + range*3/4);
    fourthincrement = "" + timeToWords(mintime + range*3/4) + " to " + timeToWords(mintime + range);
    console.log(firstincrement);
    console.log(secondincrement);
    console.log(thirdincrement);
    console.log(fourthincrement);
    document.getElementById("first").innerHTML=firstincrement;
    document.getElementById("second").innerHTML=secondincrement;
    document.getElementById("third").innerHTML=thirdincrement;
    document.getElementById("fourth").innerHTML=fourthincrement;
  }
  function timeToWords(time){
    var minutes = Math.floor(time/60)
    var seconds = (time%60);
    if(minutes>0){
      return (minutes + " minutes and " + seconds + " seconds");
    }
    else{
      return (seconds + " seconds");
    }
  }
  function updateColors(times, mintime, maxtime, range, destins){
    for(var i = 0; i< times.length; i++){
      var time = times[i]
      if (time==undefined || time < 0){
        color = "#ababab";
      }
      else if(time < range/4 + mintime){
        color = "#ff0000";
      }
      else if(time < mintime+range/2){
        color = "#66ffff";
      }
      else if(time < mintime+range*3/4){
        color = "#66ff33";
      }
      else {
        color = "#3333cc";
      }

      shapes[i].setOptions({
        tempColor: color,
        strokeColor: color,
        fillColor: color
      });
      if (time > 0){
        shapes[i].window.setOptions({content: "Time to destination: " + timeToWords(time)});
      }
      else if (time == -1){
        shapes[i].window.setOptions({content: "OVER_QUERY_LIMIT"})
      }
      else {
        shapes[i].window.setOptions({content: "No route available"});
      }
    }
  }
function calcValues(times){
  var mintime, maxtime;
  for(var i = 0;i<times.length;i++){
    if(i==0){
      mintime=times[i];
      maxtime=times[i];
    }
    else if(times[i]<mintime && times[i]>0){
      mintime=times[i];
    }
    else if(times[i]>maxtime){
      maxtime=times[i];
    }
  }
  range=maxtime-mintime;
  updateColors(times, mintime, maxtime, range);
  resetLegend(mintime, maxtime, range);
}
function placeDest(dest){
  console.log(dest);
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({location: dest}, function(results, status) {
    console.log("function called");
    if (status == google.maps.GeocoderStatus.OK) {
      marker.window.setContent(results[0].formatted_address);
      marker.position = dest;
      console.log(results[0].formatted_address);
      marker.setMap(map);
    }
  });
}
