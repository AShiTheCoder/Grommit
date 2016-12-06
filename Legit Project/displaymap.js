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
      //console.log(mat)
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
      map: map,
      title: 'Destination'
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
      for (var i = 0; i < origins.length; i++){
        calcTime(destination, origins, i, shapes, methodtrans);
      }
    }

    //code for switching marker on MAP click
    google.maps.event.addListener(map, "click", function(e){
      destination = e.latLng;
      console.log(destination.lat() + ", " + destination.lng());

      marker.position = destination;
      marker.setMap(map);

      for (var i = 0; i < origins.length; i++){
        calcTime(destination, origins, i, shapes, methodtrans);
      }

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
       clickable: false
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

      var color;
      var matrix = new google.maps.DistanceMatrixService; //Making distance matrix
      matrix.getDistanceMatrix({
        origins: [origins[i]],
        destinations: [destination],
        travelMode: methodtrans,
        unitSystem: google.maps.UnitSystem.METRIC,
      }, function(response, status) { //upon completion
        if (status == google.maps.DistanceMatrixStatus.OK) {
          var results = response.rows[0].elements;
          var destin = response.destinationAddresses[0];
          times[count] = results[0].duration.text;
          time = results[0].duration.value; //Goes to location and stores value of seconds into duration variable]

          if(time < 200){
            color = "#ff0000";
            colors[count] = color;
          }
          else if(time < 350){
            color = "#66ffff";
            colors[count] = color;
          }
          else if(time < 500){
            color = "#66ff33";
            colors[count] = color;
          }
          else {
            color = "#3333cc";
            colors[count] = color;
          }
          shapes[count].setOptions({
            tempColor: colors[count],
            fillColor: colors[count],
            strokeColor: colors[count]
          });
          shapes[count].window.setOptions({content: "Time from " + destin + ": " + times[count]})
          count++;
        }
      });
    }
  }
}

function calcTime(dest, ori, index, shapes, methodtrans){
  var matrix = new google.maps.DistanceMatrixService;
  matrix.getDistanceMatrix({
    origins: [ori[index]],
    destinations: [dest],
    travelMode: methodtrans,
    unitSystem: google.maps.UnitSystem.METRIC,
  }, function(response, status) { //upon completion
    if (status != google.maps.DistanceMatrixStatus.OK) {
      console.log(status);
    }
    if (status == google.maps.DistanceMatrixStatus.OK) {
      var results = response.rows[0].elements;
      var destin = response.destinationAddresses[0];
      if (typeof(results[0].duration) == 'undefined'){
        time = -1
      } else {
        time = results[0].duration.value; //Goes to location and stores value of seconds into duration variable]
      }

      if (time < 0){
        color = "#ababab";
      }
      else if(time < 200 ){
        color = "#ff0000";
      }
      else if(time < 350){
        color = "#66ffff";
      }
      else if(time < 500){
        color = "#66ff33";
      }
      else {
        color = "#3333cc";
      }

      shapes[index].setOptions({
        tempColor: color,
        strokeColor: color,
        fillColor: color
      });
      if (time >= 0){
        shapes[index].window.setOptions({content: "Time from " + destin + ": " + results[0].duration.text});
      } else {
        shapes[index].window.setOptions({content: "No route available"});
      }
    } else {
      shapes[index].setOptions({
        tempColor: "#000000",
        strokeColor: "#000000",
        fillColor: "#000000"
      });
      shapes[index].window.setOptions({content: status});
    }
  });
}

function fieldSubmit(){
  var input = document.getElementById("address");
  console.log(input.value);
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({address: input.value}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      marker.position = results[0].geometry.location;
      marker.setMap(map);

      for (var i = 0; i < origins.length; i++){
        calcTime(results[0].geometry.location, origins, i, shapes, methodtrans);
      }
      console.log("calculated");
    }
  });
}
