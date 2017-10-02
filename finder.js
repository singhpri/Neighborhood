//declare the global variables
var map, schoolInfoWindow, selectedIcon, defaultIcon;
//Create a new blank array for all the listing Markers
var markers = [];
//Create an array for the data pulled from Yelp
var positions = [];

//callback function
function initMap() {

    var redmond = {
        lat: 47.673988,
        lng: -122.121513
    };
    //Constructor to create the map
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: redmond
    });
    //define the InfoWindow
    schoolInfoWindow = new google.maps.InfoWindow();
    //Ajax request to get yelp data of preschools
    var request = $.ajax({
        "async": true,
        "crossDomain": true,
        "url": "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?term=preschool&latitude=47.673988&longitude=-122.121513",
        "method": "GET",
        "headers": {
            "authorization": "Bearer 9Pj--SWAuGOfObtpCllU8T60Idpse7ne3XxjHrL98T_uJEZa1u7zgcA6QkMxxzKUmAQ00Ty_cSiL1i-nQBVN-iQ6Gyt0LYzj-uLvaJwgSeP0VZhRfAvo6BYg2Qu8WXYx",
            "cache-control": "no-cache",
            "postman-token": "32cb1a94-c6ab-901c-1d58-b4594d656e8d"
        }
    });
    //Callback function once the data is finished loading
    request.done(function(data) {
        console.log(data);
        var title, location;
        var schoolItem;

        for (var i = 0; i < data.businesses.length; i++) {
            title = data.businesses[i].name;
            location = data.businesses[i].coordinates;
            location.lat = data.businesses[i].coordinates.latitude;
            location.lng = data.businesses[i].coordinates.longitude;
            rating = data.businesses[i].rating;
            schoolItem = {
                title,
                location,
                rating
            };
            positions.push(schoolItem);
        }
        //set variable to change the color of markers when selected
        selectedIcon = iconColor('FFFF24');
        //set variable to change the color of the markers back to default
        defaultIcon = iconColor('ff0000');
        //Create markers with the locations and titles received from Yelp data
        for (var j = 0; j < positions.length; j++) {
            var marker = new google.maps.Marker({
                icon: defaultIcon,
                position: positions[j].location,
                title: positions[j].title,
                rating: positions[j].rating,
                animation: google.maps.Animation.DROP,
                map: map
            });
            markers.push(marker);
            //Set event listener when the marker is selected
            marker.addListener('mouseover', highlight);
            //Set event listener when the marker is deselected
            marker.addListener('mouseout', reset);
            //Set event listener to get infowindow when the marker is clicked
            marker.addListener('click', moreInfo);
        }
        //Bind the markers to the viewmodel in knockout framework
        ko.applyBindings(new listViewModel());
    });
    //Alert the user if the Yelp request fails to load
    request.fail(function() {
        alert("Error");
    });
}
//Alert the user when the Google maps fail to load
function myFunction() {
    alert("Error caught!");
}
//this highlights the selected marker
function highlight() {
    this.setIcon(selectedIcon);
}
//resets the marker to original color
function reset() {
    this.setIcon(defaultIcon);
}

//this sets the desired color on the markers
function iconColor(pickColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + pickColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

//Creates the infowindow
function moreInfo() {

    var infowindow = schoolInfoWindow;
    var marker = this;
    var service = new google.maps.StreetViewService();
    var radius = 50;

    infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
    });

    function toggleBounce(marker) {
        if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
        } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
        }
    }

    this.setIcon(selectedIcon);
    for (var i = 0; i < markers.length; i++) {
        if (markers[i] !== marker) {
            markers[i].setIcon(defaultIcon);
            markers[i].setAnimation(null);
        } else {
            toggleBounce(markers[i]);
        }
    }
    //displays street view image on infowindow
    function processData(data, status) {
        if (status == google.maps.StreetViewStatus.OK) {
            var nearStreetViewLocation = data.location.latLng;
            infowindow.setContent('<div>' + marker.title + '</div>'+ '<p>Yelp rating: '+ marker.rating+'</p><div id="pano"></div><div id="yelpInfo"></div>');
            var panorama = new google.maps.StreetViewPanorama(
                document.getElementById('pano'), {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: 270,
                        pitch: 0
                    }
                });
        } else {
            infowindow.setContent('<div>' + marker.title + '</div><div>The image is not found.</div>');
        }
    }
    service.getPanoramaByLocation(marker.position, radius, processData);
    infowindow.open(map, marker);
}
//Constructor for the schoolList object -school name and a boolean
function schoolList(name, flag) {
    var self = this;
    self.name = name;
    self.flag = ko.observable(flag);
}
//create View model
function listViewModel() {
    var self = this;
    self.school = ko.observableArray([]);
    self.input = ko.observable("Search for preschools...");
    self.clickIcon = ko.observable(false);
    //Create schoolList objects
    for (var i = 0; i < markers.length; i++) {
        self.school.push(new schoolList(markers[i].title, true));
    }
    //Create a filter to selectively display schoolList objects
    self.mySchools = function() {
        var filter = self.input().toLowerCase();
        for (var i = 0; i < self.school().length; i++) {
            if (self.school()[i].name.toLowerCase().indexOf(filter) > -1) {
                self.school()[i].flag(true);
                markers[i].setMap(map);
            } else {
                self.school()[i].flag(false);
                markers[i].setMap(null);
            }
        }
    };
    //highlight the marker which corresponds to the selected schoolList object and open the infowindow
    self.getMarker = function(ident) {
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].title === ident.name) {
                markers[i].setIcon(selectedIcon);
                google.maps.event.trigger(markers[i], 'click');

            } else {
                markers[i].setIcon(defaultIcon);
            }
        }
    };
    //toggle the schoolList object array
    self.expand = function(e) {
        self.clickIcon(!self.clickIcon());
    };
}
