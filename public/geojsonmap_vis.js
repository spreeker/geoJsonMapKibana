// Include the angular controller
require('plugins/geoJsonMap/geoJsonMap_visController');
require('plugins/geoJsonMap/lib/jquery/jquery.js');
require('plugins/geoJsonMap/lib/leaflet/leaflet.js');
//require('plugins/geoJsonMap/lib/leaflet_wms/leaflet.wms.js');
require('plugins/geoJsonMap/lib/leaflet/leaflet.css');
require('plugins/geoJsonMap/lib/leaflet_choropleth/choropleth.js');
require('plugins/geoJsonMap/css/geojsonmap.css');

// The provider function, which must return our new visualization type
function geoJsonMapProvider(Private) {
	var TemplateVisType = Private(require('ui/template_vis_type/template_vis_type'));
	// Include the Schemas class, which will be used to define schemas
	var Schemas = Private(require('ui/vis/schemas'));

	// Describe our visualization
	return new TemplateVisType({
		name: 'geoJsonMap', // The internal id of the visualization (must be unique)
		title: 'Buurt kaart', // The title of the visualization, shown to the user
		description: 'Gebieden kaart van de Gemeente Amsterdam met Leaflet.', // The description of this vis
		icon: 'fa-map', // The font awesome icon of this visualization
		template: require('plugins/geoJsonMap/geojsonmap_vis.html'), // The template, that will be rendered for this visualization
		params: {
			editor: require('plugins/geoJsonMap/geojsonmap_editor.html'), // Use this HTML as an options editor for this vis
			defaults: { // Set default values for paramters (that can be configured in the editor)
				baseLayerUrl : "https://t3.datapunt.amsterdam.nl/topo_google/{z}/{x}/{y}.png",
				strokeColor : "#D3D3D3",
				strokeWidth : 1,
				colorMin : "#FFFFFF",
				colorMax : "#FF0000",
				geoJsonURL : "https://map.datapunt.amsterdam.nl/maps/gebieden?REQUEST=Getfeature&VERSION=1.1.0&SERVICE=wfs&TYPENAME=buurt&srsName=EPSG:4326&count=10000&startindex=0&outputformat=geojson",
				geoJsonIdField : "code"
			}
		},
		// Define the aggregation your visualization accepts
		schemas: new Schemas([
				{
					group: 'metrics',
					name: 'countryvalue',
					title: 'Buurt waarde',
					min: 1,
					max: 1,
					aggFilter: ['count', 'avg', 'sum', 'min', 'max', 'cardinality', 'std_dev']
				},
				{
					group: 'buckets',
					name: 'countries',
					title: 'Buurtcode',
					min: 1,
					max: 1,
					aggFilter: '!geohash_grid'
				}
			])
	});
}

require('ui/registry/vis_types').register(geoJsonMapProvider);