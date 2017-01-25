// Code goes here

	// Test set
	var data = [{buurtcode: "90a", value: 788}, {buurtcode: "90d", value: 478}, {buurtcode: "93h", value: 314}, {buurtcode: "29a", value: 288}, {buurtcode: "85a", value: 274}];

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
		var overlays = {
              "Stadsdelen": L.tileLayer.wms('https://map.datapunt.amsterdam.nl/maps/gebieden', 
                              { layers: 'stadsdeel,stadsdeel_label',
                                format: 'image/png',
                                transparent: true
                                }),
              "Gebieden":   L.tileLayer.wms('https://map.datapunt.amsterdam.nl/maps/gebieden', 
                              { layers: 'gebiedsgerichtwerken,gebiedsgerichtwerken_label',
                                format: 'image/png',
                                transparent: true
                                }),
              "Wijken":     L.tileLayer.wms('https://map.datapunt.amsterdam.nl/maps/gebieden', 
                              { layers: 'buurtcombinatie,buurtcombinatie_label',
                                format: 'image/png',
                                transparent: true
                                }),
              "Buurten":    L.tileLayer.wms('https://map.datapunt.amsterdam.nl/maps/gebieden', 
                              { layers: 'buurt,buurt_label',
                                format: 'image/png',
                                transparent: true
                                })
              };             
            //Load control layers 
            L.control.layers(baseLayers,overlays).addTo(map); 
            // Load default baselayer
            baseLayers['Topografie'].addTo(map);
            // Load default overlay
            overlays['Buurten'].addTo(map);


		// Add GeoJSON

		var geoJsonURL = 'https://map.datapunt.amsterdam.nl/maps/gebieden';
		
		var start_at_zoom = 15;

		//TODO add editor string "code" value to parameter field as code
		var geoJsonIdField = 'id';
		
		function onEachFeature(feature, layer) {
		    // does this feature have a property named dz?
		    if (feature.properties && feature.properties.value) {
		        layer.bindPopup(feature.properties.value);
		    }
		}


		var choroplethLayer = new L.GeoJSON(
				null, {
					valueProperty: 'value',
					//scale: ['#00A03C','#5ABD00','#B4E600','#FFF498','#F6B400','#FF9100','#FF0000'],
					scale:#FFFFF,#FF0000],
					steps: 15,
					mode: 'k',
					style: {
					       color: #d3d3d3,
					      weight: 1,
			         fillOpacity: 0.7
					 },
					 onEachFeature: onEachFeature
				}).addTo(map);
		

		//function onEachFeature(feature, layer) {
			//layer.bindPopup(feature.properties.value.toString());
  		//	layer.on("mouseover", function (e) {		
  		//			var layer = e.target;
		//	    	layer.setStyle({
		//		        weight: 3,
		//		        color: '#666',
		//		        dashArray: '',
		//		        fillOpacity: 0.7
		//		    	});
  		//		});
  		//	layer.on("mouseout", function (e) {
  		//		layer.resetStyle(e.target);
    			
  		//		});
				 //  layer.on({
				 //       mouseover: highlightFeature(feature),
				 //       mouseout: resetHighlight(feature),
				   //     click: zoomToFeature
				 //  });
		//	}
		

		function wfsQuery() {
			var geoJsonUrl = 'https://map.datapunt.amsterdam.nl/maps/parkeervakken';
	        var defaultParameters = {
	            service: 'WFS',
	            version: '1.1.0',
	            request: 'getFeature',
	            typeName: 'alle_parkeervakken',
	            maxFeatures: 3000,
	            outputFormat: 'geoJson',
	            srsName: 'EPSG:4326'
			}
		    var customParams = {
		        bbox: map.getBounds().toBBoxString()
	      		};
	        var parameters = L.Util.extend(defaultParameters, customParams);
	        console.log(geoJsonUrl + L.Util.getParamString(parameters));

	        $.ajax({
	            jsonp: false,
	            url: geoJsonUrl + L.Util.getParamString(parameters),
	            //dataType: 'jsonp',
	            //jsonpCallback: 'getJson',
	            success: loadGeoJson
	       		});
			}

		function load_wfs() {
		    if (map.getZoom() > start_at_zoom) {
		        wfsQuery();
		   
		    } else {
		        alert("please zoom in to see the polygons!");
		        choroplethLayer.clearLayers();
		    	}
			}

		function loadGeoJson(dataGeoJson) {
		    //console.log(dataGeoJson);
		    //console.log(data);
		    $("#total").html(dataGeoJson.features.length);
		    choroplethLayer.clearLayers();
		 
			$.when(
			    	data,
			    	dataGeoJson
			    	//$.getJSON(geoJsonURL)
				).done(function (a, b) {
				    // First get the two objects from json
				    var returnValues = a;
				    //console.log(returnValues);
				    
				    var returnGeoJson = b;
			    	console.log(returnGeoJson);
			    	// Add value from hash table to geojson properties
			    	returnGeoJson.features.forEach(function (item) {
			    		// Add item value to array of geojson by getting returnValues['02a'] for example which matches returnValue 02a: 833
			      		item.properties.value = returnValues[item.properties[geoJsonIdField]] || 0;
			    	});
			    	console.log(returnGeoJson);
 
				    choroplethLayer.addData(returnGeoJson);
				   	//drawGeoJson(returnGeoJson);
				});
		}

		// Add legend (don't forget to add the CSS from index.html)
		function addLegend() {
	
			var legend = L.control({ position: 'bottomright' });
			legend.onAdd = function (map) {
			    var div = L.DomUtil.create('div', 'info legend');
			    var limits = choroplethLayer.options.limits;
			    var colors = choroplethLayer.options.colors;
			    var labels = [];

			    // Add min & max
			    div.innerHTML = '<div class="labels"><div class="min">' + limits[0] + '</div>'+
			    				'<div class="max">' + limits[limits.length - 1] + '</div></div>';

			    limits.forEach(function (limit, index) {
			      	labels.push('<li style="background-color: ' + colors[index] + '"></li>');
			    	});

			    div.innerHTML += '<ul>' + labels.join('') + '</ul>';
			   
			    return div;
			};

		  	legend.addTo(map);
		 }
		map.on('moveend', load_wfs);
		
		
		function highlightFeature(e) {
		    var layer = e.target;
		    layer.setStyle({
		        weight: 3,
		        color: '#666',
		        dashArray: '',
		        fillOpacity: 0.7
		    });
		    layer.openPopup();

		function resetHighlight(e) {
 		   choroplethLayer.resetStyle(e.target);
 		   // remove hover on feature popup
 		   //$(".feature.legend.leaflet-control").remove();
		}
		
			function drawGeoJson(returnGeoJson) {
				addLegend();
 				// Create a popup with a unique ID linked to this record
		 		var popup = L.control({ position: 'topright' });
			  
				popup.onAdd = function (map) {
				    var div = L.DomUtil.create('div', 'feature legend');

				    var element = layer.feature.properties;
		      
				    // Add feature information
				    //div.innerHTML = '<b>' + element.naam + '</b> ('+ element.code + ')<br>' + element.value.toString(); + '</div>';			

				    return div;
				};

		  		popup.addTo(map);
			    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
			        layer.bringToFront();
			    }
			
			}


			var zoomedIn;
			
			function zoomToFeature(e) {
				// True/false switcher to zoom to entire map after second click
				zoomedIn ^= true;
				if (zoomedIn === true){	
					map.fitBounds(e.target.getBounds());
			    } else {
			   		map.fitBounds(choroplethLayer.getBounds());
				}
			}

			
		// End of draw map
		}
			
	