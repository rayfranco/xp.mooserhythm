(function(){
    var defaults = {
        // Goose position
        gx: 13,
        gy: -30,
        gz: 0,

        // Nose position
        x: 0,
        y: 0,
        a: 200,

        // Light position
        lx: -200,
        ly: 200,
        lz: 200,

        // Point light position
        plx: 0,
        ply: 0,
        plz: 0,

        // Light color
        lhue: 50,
        lsaturation: 0.37,
        llightness: 1,

        // Goose color
        hue: 0.41,
        saturation: 0.31,
        lightness: 0.99,

        // Camera position
        camX: 0,

        // Music
        bpm: 50,

        debug: false,
    }

    APP.Goose = function(settings) {

        this.settings = $.extend(defaults,settings);

        // Local vars definitions

        this.width;         // Width of the scene
        this.height;        // Height of the scene
        this.scene;         // THREE Scene
        this.renderer;      // WebGL Renderer
        this.camera;        // THREE Camera
        this.controls;      // THREE Controls
        this.light;         // Directional Light
        this.pointLight;    // Point Light
        this.ambientLight;  // Ambiant Light

        // Local references definitions

        this.verticesO;     // Original shape vertices
        this.cx = settings.x;
        this.cy = settings.y;
        this.ca = settings.a;

        // Start the engine

        this.init();
        this.animate();

        return this;
    };

    APP.Goose.prototype.init = function() {

        var h, gui, plane, loader;

        this.scene = new THREE.Scene();

        // Create a renderer and add it to the DOM.
        this.renderer = new THREE.WebGLRenderer({antialias:true});

        $('#container').append(this.renderer.domElement);

        this.renderer.domElement.id = "context";
        this.renderer.shadowMapEnabled = true;
        this.renderer.shadowMapSoft = false;
        // this.renderer.shadowCameraNear = 3;
        // this.renderer.shadowCameraFov = 50;
        // this.renderer.shadowMapBias = 0.0039;
        // this.renderer.shadowMapDarkness = 0.5;
        // this.renderer.shadowMapWidth = 1024;
        // this.renderer.shadowMapHeight = 1024;

        // Camera
        // this.camera = new THREE.OrthographicCamera(-500, 500, 500, 500, 1, 10000);
        this.camera = new THREE.PerspectiveCamera(45, 1.28, 1, 10000);
        this.camera.position.y = 50;
        this.scene.add(this.camera);

        this._resizeHandler(); // Set the renderer size

        // Controls
        // this.controls = new THREE.TrackballControls(this.camera);
        this.controls = new THREE.PeerControls(this.camera, this.renderer.domElement);
        this.controls.settings.lookAt = new THREE.Vector3(0,this.camera.position.y,-100);


        // Lights
        this.light = new THREE.DirectionalLight(0xffffff, 1.68);
        this.light.position.set(this.settings.lx, this.settings.ly, this.settings.lz);
        this.light.position.normalize();
        this.light.castShadow = true;
        this.light.lookAt(new THREE.Vector3(100,100,100));
        this.scene.add(this.light);

        this.pointLight = new THREE.PointLight(0xc39854);
        this.pointLight.position.set(0, 0, 100);
        this.pointLight.shadowCameraVisible = true;
        this.scene.add(this.pointLight);

        this.ambientLight = new THREE.AmbientLight(0x080808);
        this.pointLight.shadowCameraVisible = true;
        this.scene.add(this.ambientLight);

        // Helper
        // if (this.settings.debug) {
        //     axes = new THREE.AxisHelper( 200 );
        //     this.scene.add( axes );
        // }

        // GUI helper
        this._setupGUI();

        // Add background
        var plane = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshPhongMaterial({color: 0xEA4437, shading: THREE.FlatShading }));
        plane.receiveShadow = true;
        this.scene.add(plane);

        // // Goose Material
        // var shader = THREE.ShaderToon.toon2;
        // var u = THREE.UniformsUtils.clone(shader.uniforms);
        // var vs = shader.vertexShader;
        // var fs = shader.fragmentShader;

        // material = new THREE.ShaderMaterial({
        //   uniforms: u,
        //   vertexShader: vs, 
        //   fragmentShader: fs
        // });
        // material.uniforms.uDirLightPos.value = light.position;
        // material.uniforms.uDirLightColor.value = light.color;
        // material.uniforms.uAmbientLightColor.value = ambientLight.color;
        // material.uniforms.uBaseColor.value = new THREE.Color(0xFFE1A7);

        // Goose Shape

        loader = new THREE.JSONLoader();
        loader.load( "js/data/shape.js", function(geometry) {
          this.goose = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color: 0xFFE1A7, shading: THREE.FlatShading }));
          // goose = new THREE.Mesh(geometry, new THREE.ShaderMaterial(shader));
          this.goose.position.y = 0;
          this.goose.position.x = 0;
          this.goose.position.z = 0;
          this.goose.castShadow = true;

          this.scene.add(this.goose);

          this.verticesO = this.goose.geometry.clone().vertices;

          this._updateVertices();
        }.bind(this));

        // Add Text

        // var text3d = new THREE.TextGeometry('Merry Christmas', {
        //     size: 30,
        //     height: 3,
        //     curveSegments: 20,
        //     font: "helvetiker"
        // });

        // text3d.computeBoundingBox();
        // var centerOffset = -0.5 * (text3d.boundingBox.max.x - text3d.boundingBox.min.x);

        // var textMaterial = new THREE.MeshPhongMaterial({
        //     color: 0xffffff
        // });
        // text = new THREE.Mesh(text3d, textMaterial);

        // text.castShadow = true;
        // text.position.x = centerOffset;
        // text.position.y = 70;
        // text.position.z = 0;
        // text.rotation.x = 0;
        // text.rotation.y = 0;

        // group = new THREE.Object3D();
        // group.add(text);

        // this.scene.add(group);

        $(window).on('resize',this._resizeHandler.bind(this));
    };

    APP.Goose.prototype.render = function() {
        
        // Curve Debug
        if (this.settings.debug) {
            this.light.shadowCameraVisible = true;
            this._displayBone();
        } else {
            this.light.shadowCameraVisible = false;
            this.scene.remove(this.bone);
        }

        // Lights
        this.light.position.set(this.settings.lx, this.settings.ly, this.settings.lz);
        // this.light.position.normalize();

        this.pointLight.position.set(this.settings.plx, this.settings.ply, this.settings.plz);
        this.pointLight.color.setHSL(this.settings.lhue, this.settings.lsaturation, this.settings.llightness);

        if (this.goose) {
          // goose.material.uniforms.uBaseColor.value.setHSL(this.settings.hue, settings.saturation, settings.lightness);
          this.goose.position.set(this.settings.gx, this.settings.gy, this.settings.gz);
        }

        if (this.cx !== this.settings.x || this.cy !== this.settings.y || this.ca !== this.settings.a) {
          this._updateVertices();
          this.cx = this.settings.x;
          this.cy = this.settings.y;
          this.ca = this.settings.a;
        }

        this.renderer.render(this.scene, this.camera);
    };

    APP.Goose.prototype.animate = function() {
        requestAnimationFrame(this.animate.bind(this));
        this.render();
        // this.controls.update(this.settings.camX);
        this.controls.update();
    };

    APP.Goose.prototype.moveHead = function(x,y) {
        this.settings.x = x;
        this.settings.y = y;
    }

    // Vertices modifier
    APP.Goose.prototype._updateVertices = function() {

        if (!this.goose) return;

        var vertices = this.goose.geometry.vertices;

        this.goose.geometry.dynamic = true;

        // Pour chaque vertex (vecteur), je dois connaitre son point d'origine, applique la fonction bend vertice

        for (var i=0, len=vertices.length; i<len; i++) {
            var vertexO, vertex, angx;

            vertexO = this.verticesO[i];
            vertex  = vertices[i];
            // vertex.z = vertexO.z - vertexO.z * (vertexO.x + settings.x);
            // vertex.x = settings.x * (1/(this.settings.a+vertexO.x)) + vertexO.x;
            // vertex.x = settings.x*(1/settings.a*Math.pow(vertexO.z - settings.x * vertexO.x * 0.5,2)) + vertexO.x;
            angx = this._tan(vertexO.z,this.settings.x);
            // var angy = tan(vertexO.z,settings.y);

            vertex.z = vertexO.z + Math.sin(angx) * vertexO.x;
            vertex.x = this._bone(vertex.z,this.settings.x) + vertexO.x;
            vertex.y = this._bone(vertex.z,this.settings.y) + vertexO.y;
        }

        this.goose.geometry.verticesNeedUpdate = true;
    }

    // Bone function (bended curve)
    APP.Goose.prototype._bone = function(pos,mod) {
        return mod * (1/this.settings.a*Math.pow(pos,2));
    };

    // Draw the bone
    APP.Goose.prototype._displayBone = function () {
        if (this.bone) {
          this.scene.remove(this.bone);
          this.bone = null;
        }
        if (this.settings.debug) {
          // Draw bone
          var lineMaterial = new THREE.LineBasicMaterial({color: 0xff00ff});
          var lineGeometry = new THREE.Geometry();
          for(var i=0; i<500; i++) {
            lineGeometry.vertices.push(new THREE.Vector3(this._bone(i,this.settings.x), this._bone(i,this.settings.y), i));
          }
          this.bone = new THREE.Line(lineGeometry, lineMaterial);
          this.scene.add(this.bone);
        }
    };

    // Get the vertex tangent relative to the bone
    APP.Goose.prototype._tan = function(bx,mod) {
        var dx, dy, ax, cx, ay, cy, ang;

        ax = bx-1;
        cx = bx+1;

        ay = this._bone(ax,mod);
        cy = this._bone(cx,mod);

        dx = ax-cx;
        dy = ay-cy;
        
        ang = Math.atan2(dy,dx);

        return ang;
    };

    APP.Goose.prototype._resizeHandler = function() {
        this.width  = $(window).innerWidth(),
        this.height = $(window).innerHeight();

        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width/this.height;
        this.camera.updateProjectionMatrix();
    };

    APP.Goose.prototype._setupGUI = function() {
        var h;
        var gui = new dat.GUI();

        h = gui.addFolder('Positions');
        h.add(this.settings,'x',-1, 1).name('Nose X');
        h.add(this.settings,'y',-1, 1).name('Nose Y');
        h.add(this.settings,'a',50, 200).name('Wideness');
        h.add(this.settings,'camX',-500, 500).name('Camera Position');

        // h.add(this.settings,'gx',-20, 20).name('Goose X');
        // h.add(this.settings,'gy',-30, 20).name('Goose Y');
        // h.add(this.settings,'gz',-5, 5).name('Goose Z');

        h = gui.addFolder('Directional Light Light');
        h.add(this.settings,'lx',-1000.0, 1000.0, 0.025).name('x');
        h.add(this.settings,'ly',-1000.0, 1000.0, 0.025).name('y');
        h.add(this.settings,'lz',-1000.0, 1000.0, 0.025).name('z');

        h = gui.addFolder('Point Light');
        h.add(this.settings,'plx',-100.0, 100.0, 0.025).name('x');
        h.add(this.settings,'ply',-100.0, 100.0, 0.025).name('y');
        h.add(this.settings,'plz',0, 100.0, 0.025).name('z');

        h = gui.addFolder('Material');
        h.add(this.settings, "hue", 0.0, 1.0, 0.025);
        h.add(this.settings, "saturation", 0.0, 1.0, 0.025);
        h.add(this.settings, "lightness", 0.0, 1.0, 0.025);

        h = gui.addFolder('Debug');
        h.add(this.settings, "debug");
    }
})();
