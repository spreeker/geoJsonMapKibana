// Create an Angular module for this plugin
var module = require('ui/modules').get('geojsonmap_vis');


module.controller('geoJsonMapController', function($scope, Private) {

	var filterManager = Private(require('ui/filter_manager'));

	$scope.filter = function(tag) {
		// Add a new filter via the filter manager
		filterManager.add(
			// The field to filter for, we can get it from the config
			$scope.vis.aggs.bySchemaName['locations'][0].params.field,
			// The value to filter for, we will read out the bucket key from the tag
			location.label,
			// Whether the filter is negated. If you want to create a negated filter pass '-' here
			null,
			// The index pattern for the filter
			$scope.vis.indexPattern.title
		);
	};

	$scope.$watch('esResponse', function(resp) {
		if (!resp) {
			$scope.locations = null;
			return;
		}

		if($scope.vis.aggs.bySchemaName['countries']== undefined)
		{
			$scope.locations = null;
			return;
		}

		// Retrieve the id of the configured tags aggregation
		var locationsAggId = $scope.vis.aggs.bySchemaName['countries'][0].id;
		// Retrieve the metrics aggregation configured
		var metricsAgg = $scope.vis.aggs.bySchemaName['countryvalue'][0];
		var buckets = resp.aggregations[locationsAggId].buckets;


		// Transform all buckets into tag objects
		$scope.locations = buckets.map(function(bucket) {
			// Use the getValue function of the aggregation to get the value of a bucket
			var key = bucket.key;
			var value = metricsAgg.getValue(bucket);
			// REMOVE substring to get origional vollcode 'A00a'. It is now used to join on '00a'.
			var key = key.substring(1, 4);
			return {
				key : key,
				value : value
			};

		});

		//console.log($scope.locations);

		// Draw Map

		try { $('#map').map.remove(); }
		catch(err) {}

		var data={};

		angular.forEach($scope.locations, function(test){
			//if(value.label!=undefined)
			data[test.key]=test.value;
		});


		console.log(data);

		// Test set
		//var data = [{buurtcode: "90a", value: 788}, {buurtcode: "90d", value: 478}, {buurtcode: "93h", value: 314}, {buurtcode: "29a", value: 288}, {buurtcode: "85a", value: 274}];

		var map = L.map('map', {
	                      maxBounds: [
	                          [52.269470, 4.72876], //southWest
	                          [52.4322, 5.07916] //northEast
	                      ]
	                  })
	                  .setView([52.379189, 4.899431], 11);


		// Add basemap
		var baseLayerOptions = {
		                  minZoom: 11,
		                  maxZoom: 21,
		                  subdomains: ['t1', 't2', 't3', 't4'],
		                  attribution: '&copy; <a href="http://api.datapunt.amsterdam.nl">Datapunt</a>',
		                  fadeAnimation: false
		              };

		var baseLayers = { 'Topografie': L.tileLayer('https://{s}.datapunt.amsterdam.nl/topo_google/{z}/{x}/{y}.png', baseLayerOptions)};
		baseLayers['Topografie'].addTo(map);

		// Add GeoJSON

		var geoJsonURL = $scope.vis.params.geoJsonURL;
		
		//TODO add editor string "code" value to parameter field as code
		//var geoJsonIdField = $parse('item.properties.'+ $scope.vis.params.geoJsonidField);
		
		
		$.when(
		    	data,
		    	$.getJSON(geoJsonURL)
			).done(function (a, b) {
			    // First get the two objects from json
			    var returnValues = a;
			    //console.log(returnValues);
			    var returnGeoJson = b[0];
			    //console.log(returnGeoJson);
			   
		    	
		    	// Add value from hash table to geojson properties
		    	returnGeoJson.features.forEach(function (item) {
		    		// Add item value to array of geojson by getting returnValues['02a'] for example which matches returnValue 02a: 833
		      		item.properties.value = returnValues[item.properties.code] || 0
		    	})
		    	console.log(returnGeoJson);
				// use geoJson
				drawGeoJson(returnGeoJson);  
		

			function drawGeoJson(returnGeoJson) {
				var choroplethLayer = L.choropleth(returnGeoJson, {
				    valueProperty: 'value',
				    //scale: ['#00A03C','#5ABD00','#B4E600','#FFF498','#F6B400','#FF9100','#FF0000'],
				    scale:[$scope.vis.params.colorMin,$scope.vis.params.colorMax],
				    steps: $scope.vis.params.colorSteps,
				    mode: 'k',
				    style: {
				      color: $scope.vis.params.strokeColor,
				      weight: $scope.vis.params.strokeWidth,
				      fillOpacity: 0.7
				    },
				    onEachFeature: onEachFeature
				    }).addTo(map)

				// Add legend (don't forget to add the CSS from index.html)
				var legend = L.control({ position: 'bottomright' })
				legend.onAdd = function (map) {
				    var div = L.DomUtil.create('div', 'info legend')
				    var limits = choroplethLayer.options.limits
				    var colors = choroplethLayer.options.colors
				    var labels = []

				    // Add min & max
				    div.innerHTML = '<div class="labels"><div class="min">' + limits[0] + '</div> \
							<div class="max">' + limits[limits.length - 1] + '</div></div>'

				    limits.forEach(function (limit, index) {
				      labels.push('<li style="background-color: ' + colors[index] + '"></li>')
				    })

				    div.innerHTML += '<ul>' + labels.join('') + '</ul>'
				    return div
				}

			  	legend.addTo(map)
				
				function highlightFeature(e) {
				    var layer = e.target;

				    layer.setStyle({
				        weight: 3,
				        color: '#666',
				        dashArray: '',
				        fillOpacity: 0.7
				    });

	 				// Create a popup with a unique ID linked to this record
			 		var popup = L.control({ position: 'topright' })
				  
					popup.onAdd = function (map) {
					    var div = L.DomUtil.create('div', 'feature legend')

					    var element = layer.feature.properties;
			      
					    // Add feature information
					    div.innerHTML = '<b>' + element.naam + '</b> ('+ element.code + ')<br>' + element.value.toString(); + '</div>'			
					    
					    return div
					}

			  		popup.addTo(map);

				    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
				        layer.bringToFront();
				    }
				
				}

				function resetHighlight(e) {
		 		   choroplethLayer.resetStyle(e.target);
		 		   // remove hover on feature popup
		 		   $(".feature.legend.leaflet-control").remove();
				}
				
				var zoomedIn;
				function zoomToFeature(e) {
					// True/false switcher to zoom to entire map after second click
					zoomedIn ^= true;
					if (zoomedIn == true){	
						map.fitBounds(e.target.getBounds());
				    } else {
				   		map.fitBounds(choroplethLayer.getBounds());
					}
				}

				function onEachFeature(feature, layer) {
				   layer.bindPopup('<b>' + feature.properties.naam + '</b> '+ feature.properties.code + '<br>' + feature.properties.value.toString());
				    layer.on({
				        mouseover: highlightFeature,
				        mouseout: resetHighlight,
				        click: zoomToFeature
				    });
				}
			// End of draw map
			}
		});
	});
});
