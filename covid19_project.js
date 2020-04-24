var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 40, lng: -95},
      zoom: 3.6
    });
  }