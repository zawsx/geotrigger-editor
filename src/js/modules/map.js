GeotriggerEditor.module('Map', function(Map, App, Backbone, Marionette, $, _) {

  // Draw Submodule
  // --------------

  var Draw = {
    editLayer: null,

    tools: {
      // drivetime: null,
      polygon: null,
      radius: null
    },

    // Draw Layer initializer
    // ----------------------

    init: function() {
      // Initialize the FeatureGroup to store editable layers
      this.editLayer = new L.FeatureGroup();
      Map.instance.addLayer(this.editLayer);

      //Initialize new Draw Handlers
      this.tools.polygon = new L.Draw.Polygon(Map.instance, App.Config.polygonOptions);
      this.tools.radius = new L.Draw.Circle(Map.instance, App.Config.circleOptions);

      // drivetime tool will be enabled in later version
      // this.tools.drivetime = new L.Draw.Marker(Map.instance, App.Config.drivetimeOptions);

      App.vent.on('map:draw:clear', this.clear, this);
      App.vent.on('map:draw:tool:enable', this.enableTool, this);
      App.vent.on('map:draw:edit:add-layer', function(layer) {
        this.editLayer.addLayer(layer);
      }, this);

      // Draw Created Event, fires once at the end of draw
      Map.instance.on('draw:created', function(e) {
        var type = e.layerType;
        var layer = e.layer;

        // if (type === 'marker') {
        //   layer.options.draggable = true;
        //   layer.on('dragend', function(){
        //     console.log('recalculate drivetime', [this._latlng.lat, this._latlng.lng]);
        //   });
        // } else {
        //   layer.editing.enable();
        // }

        layer.editing.enable();

        App.vent.trigger('map:draw:clear');
        App.vent.trigger('map:draw:edit:add-layer', layer);
        App.vent.trigger('controls:tools:disable-draw');
        App.vent.trigger('trigger:new');
      });
    },

    polygon: function(geo, id) {

      polygon = new L.GeoJSON(geo, {
        style: function(feature) {
          return App.Config.polygonOptions.shapeOptions;
        }
      });

      polygon.addTo(Map.instance);

      polygon.triggerId = id;

      polygon.on("click", function(e){
        console.log(e.target.triggerId);
      });

      return polygon;
    },

    radius: function(geo) {
      var circle = L.circle(
        [geo.latitude, geo.longitude],
        geo.distance,
        App.Config.circleOptions.shapeOptions
      );
      circle.addTo(Map.instance);
      return circle;
    },

    clearShape: function(shape) {
      Map.instance.removeLayer(shape);
    },

    clear: function() {
      this.editLayer.clearLayers();
    },

    enableTool: function(str) {
      this.disableTool();
      this.tools[str].enable();
    },

    disableTool: function(str) {
      for (var i in this.tools) {
        if (typeof str === 'undefined' || i === str) {
          this.tools[i].disable();
        }
      }
    }

  };

  // Map Module
  // ----------

  _.extend(Map, {

    // Map Initializer
    // ---------------

    init: function(el) {
      // L.Icon.Default.imagePath = App.Config.imagePath;
      this.instance = L.map(el).setView(App.Config.Map.center, App.Config.Map.zoom);
      this.instance.zoomControl.setPosition('topright');
      L.esri.basemapLayer(App.Config.Map.basemap).addTo(this.instance);

      this.Draw.init();
    },

    zoomToLayer: function(layer) {
      this.instance.fitBounds(layer.getBounds(), {
        paddingTopLeft: [App.listDrawerRegion.$el.width(), 0]
      });
    },

    Draw: Draw
  });

});