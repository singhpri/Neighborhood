(function() {

    var map, schoolInfoWindow, selectedIcon, defaultIcon;
    var markers = [];
    var positions = [];

    function initMap() {

        var redmond = {
            lat: 47.673988,
            lng: -122.121513
        };
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 12,
            center: redmond
        });
        schoolInfoWindow = new google.maps.InfoWindow();
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
        request.done(function(data) {
            var title, location;
            var schoolItem;

            for (var i = 0; i < data.businesses.length; i++) {
                title = data.businesses[i].name;
                location = data.businesses[i].coordinates;
                location.lat = data.businesses[i].coordinates.latitude;
                location.lng = data.businesses[i].coordinates.longitude;
                schoolItem = {
                    title,
                    location
                };
                positions.push(schoolItem);
            }

            selectedIcon = iconColor('FFFF24');
            defaultIcon = iconColor('ff0000');

            for (var j = 0; j < positions.length; j++) {
                var marker = new google.maps.Marker({
                    icon: defaultIcon,
                    position: positions[j].location,
                    title: positions[j].title,
                    map: map
                });
                markers.push(marker);

                marker.addListener('mouseover', highlight);

                marker.addListener('mouseout', reset);

                marker.addListener('click', moreInfo);
            }
            ko.applyBindings(new listViewModel());
        });
        request.fail(function() {
            alert("Error");
        });
    }

    function highlight() {
        this.setIcon(selectedIcon);
    }

    function reset() {
        this.setIcon(defaultIcon);
    }

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


    function moreInfo() {
        var infowindow = schoolInfoWindow;
        var marker = this;
        var service = new google.maps.StreetViewService();
        var radius = 50;

        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });

        function processData(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div><div id="yelpInfo"></div>');
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

    function schoolList(name, flag) {
        var self = this;
        self.name = name;
        self.flag = ko.observable(flag);
    }

    function listViewModel() {
        var self = this;
        self.school = ko.observableArray([]);
        for (var i = 0; i < markers.length; i++) {
            self.school.push(new schoolList(markers[i].title, true));
        }

        self.mySchools = function() {
            var input = document.getElementById('myInput');
            var filter = input.value.toLowerCase();
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
        self.expand = function(e) {
            drawer.classList.toggle('open');
        };
    }
    google.maps.event.addDomListener(window, "load", initMap);
})();
