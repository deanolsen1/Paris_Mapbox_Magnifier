// Javascript for map page

$(document).ready(function() {
	var markers;
	// Possible heat map layer var
	var zl = document.getElementById('leaflet-clickable');
    var SMFilter = [];
	var PageFilter = [];
	var thisPage = 9; //sets the first page of the counter to page 9
	var speed; //controls the interval of the increase/decrease speed functions.  
		//Speed acts as the inverse of time.  Increase in speed value == increase in pause
	var interval; //variable that holds several values for info data and speed

    L.mapbox.accessToken = 'pk.eyJ1IjoiZGVhbm9sc2VuMSIsImEiOiJ1dkxBdm9FIn0.kapau_lUukKIE93Y8I0A9g';

    var map = L.mapbox.map('map', 'deanolsen1.l6h0h2j6', 
    	{zoomControl : false, 
    	//removed attribution from bottom of map to credits page
    	attributionControl: false});
    // create zoom-in effect on map on load, comment out to disable
     // map.setView([48.876, 2.357], 8);
     //  window.setTimeout (function () {
     //   	map.setView([48.876, 2.357], 11)}, 2000);
     //  window.setTimeout (function () {
     //   	map.setView([48.876, 2.357], 13)}, 4000);
     //  window.setTimeout (function () {
     //   	map.setView([48.876, 2.357], 15)}, 6000);
      //uncomment following line for non-zoomed map view
       	map.setView([48.876, 2.357], 15);


	// extra way of zooming in -- has plus button and minus button for zooming
    new L.Control.Zoom({ position: 'topright' }).addTo(map);

    //load json data onto basemap; create tools
	$.getJSON("data/Locationsv4.geojson")
		.done(function(data) {

			var info = processData(data);
			createPropSymbols(info, data);
			createSliderUI(info.pages, info, data);
            menuSelection(info.SMs, info, data);
            updateMenu(info, data);
            sequenceInteractions(info, data);
		})
		.fail(function() { alert("There has been a problem loading the data.")});

    //dynamically created checkbox options with the number of markers after the option
	function menuSelection(SMs, info, data) {
        var SMOptions = [];
        for (var index in SMs) {
            SMOptions.push("<input type=\"checkbox\" name=\"SMFilter\" value=\""+ SMs[index] +"\">" + SMs[index] + "<br><i>&nbsp; &nbsp; &nbsp;&#40;cited " + info.SMCount[SMs[index]] + " times&#41;</i>" + "</input>");
        };

        //everytime click on the option, trigger the update Menu function
        $("#SubjectiveMarkers").html(SMOptions.join("<br />"));
        $("#SubjectiveMarkers").on("click", function(event) {
            updateMenu(info, data);
            	$(".pause").hide();
				$(".play").show();
				stopMap(info, data);
        });

		//selectall/ unselectall botton
  		$("#checkAllBtn").click(function(event) {   
            $("#SubjectiveMarkers :checkbox").each(function() {
                this.checked = true;                        
            });
            updateMenu(info, data);
            	$(".pause").hide();
				$(".play").show();
				stopMap(info, data);
        });

        $("#uncheckAllBtn").click(function(event) {   
            $("#SubjectiveMarkers :checkbox").each(function() {
                this.checked = false;                        
            });
            updateMenu(info, data);
        });  

		//change map view to match initial view above. function to reset map view when button is clicked - center on 10th Arron.

		$("#resetMapBtn").click(function(event) {   
            map.setView([48.876, 2.360], 15);
        	});
    }

    //Store the checked option in filter, count number of checkbox selection, call createPropSymbols function
    function updateMenu(info, data){
       	SMFilter = [];
       	$( "input:checkbox[name=SMFilter]:checked").each(function(){
           SMFilter.push($(this).val());
       	});

		$("#checkedNum").html(SMFilter.length + " categories are checked")		
        createPropSymbols(info, data);
    }

    //update pageline 
	function updatePages(info, data) {
		PageFilter = [];
		$( "input:output[name=PageFilter]:input change").each(function(){
			PageFilter.push($(this).val());
		});

	createPropSymbols(info, data);
	}

    //process geojson data; create required arrays
    function processData(data) {
        var pages = [];
        var pageTracker = [];
        var SMs = []
        var SMTracker = [];
        var SMCount = {};

        for (var feature in data.features) {
			var properties = data.features[feature].properties;

            //process page properties and store it in page Tracker array
            if (pageTracker[properties.Page] === undefined) {
                pages.push(properties.Page);
                pageTracker[properties.Page] = 1;
            }

            //process SM properties and store it in SM Tracker array
            if (SMTracker[properties.SM] === undefined) {
                SMs.push(properties.SM);
                SMTracker[properties.SM] = 1;
            }

            //process SM properties and count the number of each subjective markers
            if (SMCount[properties.SM] === undefined) {
            	SMCount[properties.SM] = 1;
            }
            else {
            	SMCount[properties.SM] += 1;
            }
		}
        return { 
            SMs : SMs,
            pages : pages.sort(function(a,b){return a - b}),
            SMCount : SMCount
        };
    };

    //function to create symbols
    function createPropSymbols(info, data, currentPage, speed) {
        if (map.hasLayer(markers)){
            map.removeLayer(markers);
        	};

       //filter to load the markers that are in selected pages or in check box
		markers = L.geoJson(data, {
            filter: function(feature, layer) {
			if (currentPage){
			//if page number matches currentPage, put feature on map
			if (feature.properties.Page == currentPage){
					return true;
			} else {
					return false;
					}
			} else {
				if ($.inArray(feature.properties.SM,SMFilter) !== -1) {  
                   return true;
            } else {
					return false;
				};
			}
        },

        //opacity of markers, transition time for black circle to appear
		pointToLayer: function(feature, latlng) {

			return L.circle(latlng, 200,{
                    fillColor: PropColor(feature.properties.SM),
				    color: PropColor(feature.properties.SM),
                    weight: 4,
                    clickable: false,
				    fillOpacity: 0.2,

                }).on({
                	//attach, style popups on mouseovers
					// add: function(g) {
					// 	this.transition();
					// 	this.setStyle({})
					// }


					mouseover: function(e) {
						this.openPopup();
						//black ring around markers
						this.setStyle({color: '#000000'});
					},
					mouseout: function(e) {
						this.closePopup();
						this.setStyle({color: PropColor(feature.properties.SM) });
					}
				});
			}
		}).addTo(map);
		// map.on(update);
		// map.on(zoom);
		updatePropSymbols();

	} // end createPropSymbols()

	//color of markers
    function PropColor(SM) {
        return "#CC2B0A";
    }

    //marker size, popup
    function updatePropSymbols() {
		markers.eachLayer(function(layer) {
			var props = layer.feature.properties;
			// size of circle markers
			var	radius = 100;
			var	popupContent = "<i><b>" + props.SM + "</b></i>" + " <br>"+ props.Address +"<br>page " + props.Page ;
			layer.setRadius(radius);
			layer.bindPopup(popupContent, { offset: new L.Point(0,10) });
            layer.options.color = PropColor(props.SM);
            layer.options.fillColor = PropColor(props.SM);
		});
	} // end updatePropSymbols


    //create the page timeline, chronological order of events
	function createSliderUI(Pages, info, data) {
		var sliderControl = L.control(
			//move slider to bottom right
			{ position: 'bottomright'} );

		sliderControl.onAdd = function(map) {
			var slider = L.DomUtil.create("input", "range-slider");
			L.DomEvent.addListener(slider, 'mousedown', function(e) {
				L.DomEvent.stopPropagation(e);
			});

			$(slider)
				.attr({'type':'range', 
                       'max': Pages[Pages.length-1], 
                       'min':Pages[0], 
                       'step': 1,
					   'width' : 4,
                       'value': String(Pages[0])})

		        .on('input change', function() {
					createPropSymbols(info, data, this.value);
					//text for slider bar
		            $(".temporal-legend").text("On page " + this.value);
		        });
			return slider;
		}
		sliderControl.addTo(map);
		createTemporalLegend(Pages [0]);
	} 

    //create page line time VCR control, starts out with pause button hidden until user clicks play button
	function sequenceInteractions(info, data) {
		$(".pause").hide();
		//play behavior
		$(".play").click(function(){
				$(".pause").show();
				$(".play").hide();
				map.setView([48.876, 2.357], 15);
				clearInterval(interval);
				speed = 250;
				animateMap(info, data, speed); 
				menuSelection(info.SMs, info, data);
				updateMenu();
			});

		//pause behavior; hides pause button if displayed and shows play button, stops all map action 
		$(".pause").click(function(){
				$(".pause").hide();
				$(".play").show();			
				stopMap(info, data, speed); 
			});

		//step behavior; stops map hides pause button if displayed and shows play button, increments data etc. by 1
		$(".step").click(function(){
			stopMap();
				$(".pause").hide();
				$(".play").show();
				step(info, data);
			});

		//back behavior; stops map hides pause button if displayed and shows play button, decrements data etc by 1
		$(".back").click(function(){
				stopMap();
				$(".pause").hide();
				$(".play").show();
				goBack(info, data);
			});

		//back behavior; stops map and changes buttons to cue user to change
		$(".back-full").click(function(){
				stopMap();
				$(".pause").hide();
				$(".play").show();
				backFull(info, data);
			});

		//full forward behavior - hides buttons and goes to end of timeline
		$(".step-full").click(function(){
				$(".pause").hide();
				$(".play").show();
				stepFull(info, data);
			});

		//decrease speed behavior, increases speed by 1/10 sec per click by lowering the interval 
		$(".faster").click(function(){
				if (speed>100) {
					speed = speed-100;
					clearInterval(interval);
					animateMap(info, data, speed); 
				}
				else (speed = 250);
				//extra code to ensure slider data progress at 1/4 second delay 
				//since initial speed starts at 250, changing by 100 would enable 
				//user to go outside of the bounds of either increase or decrease 
				//function by speed=50.  This handles that potential error 
			});

		//increase speed behavior, decreases speed by 1/10th sec per click by lowering the interval
		$(".slower").click(function(){
			if (speed<1000) {
			speed = speed+100;
			clearInterval(interval);
			animateMap(info, data, speed); 
			console.log(speed);
			}
			else {speed = 250};
			//extra code to ensure slider data progresses at 1/4 second delay 
			//since initial speed starts at 250, changing by 100 would enable 
			//user to go outsiude of the bounds of either increase or decrease 
			//function by speed=50.  This handles that potential error
			});
	}

	// create map animation
	function animateMap (info, data, speed) {
		interval = setInterval(function(){step(info, data)},speed);
	}
	//gives ability for map to stop in place by changing the speed and clearing the interval 
	function stopMap(info, data, speed){
		speed = 0;
		clearInterval(interval);
	}

	//function to set the counter and timeline back 1 without going past the first page (9)
	function goBack(info, data, speed){
		if (thisPage >9) {
			thisPage--; 
		}; 
		createPropSymbols(info, data, thisPage, speed);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "On Page " + thisPage);
	}

	//function to allow counter and data to increment by one
	function goForward(info, data, speed){
		thisPage++; 
		createPropSymbols(info, data, thisPage, speed);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "On Page " + thisPage);
	}
	//function to allow counter and data to increment by one
	function step(info, data, speed){
		if (thisPage <238) {
			thisPage++; 
			};
		createPropSymbols(info, data, thisPage,speed);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "On Page " + thisPage);
	}

	//takes the user to the last page (238)
	function stepFull(info, data, speed){
		thisPage=238; 
		createPropSymbols(info, data, thisPage);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "On Page " + thisPage);
	}

	//vcr control to first page, pg 9--book starts on pg 9
	function backFull(info, data, speed){
		thisPage=9; 
		createPropSymbols(info, data, thisPage);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "On Page " + thisPage);
	}

    //add page number demonstration 

	function createTemporalLegend(startTimestamp, speed) {
		var temporalLegend = L.control(
			//position to bottom right
			{ position: 'bottomright' });
		temporalLegend.onAdd = function(map) {
			var output = L.DomUtil.create("output", "temporal-legend");
			return output;
		}
		temporalLegend.addTo(map);
		$(".temporal-legend").text("On page " + startTimestamp);
	}	// end createTemporalLegend()

	// magnifier glass experiment
	var zoommap = L.mapbox.map('zoommap', 'deanolsen1.l4i434a2', {
    fadeAnimation: false,
    zoomControl: false,
    attributionControl: false
});


// Call update or zoom functions when
// these events occur.
map.on('click', update);
map.on('zoomend', zoom);

function zoom(e) {
    if (zoommap._loaded) zoommap.setZoom(e.target.getZoom() +1);
}

function update(e) {
    zl.style.top = ~~e.containerPoint.y + 50 + 'px';
    zl.style.left = ~~e.containerPoint.x + 50 + 'px';
    zoommap.setView(e.latlng, map.getZoom() + 0, true);
}

});
//end code

