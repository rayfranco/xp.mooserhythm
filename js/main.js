$(function(){
var scene, camera, renderer, controls, material;

var light, pointLight, ambientLight;

var skull;

var config = {
  // Goose position
  gx: 13,
  gy: -30,
  gz: 0,

  // Nose position
  x: 0,
  y: 0,
  a: 65,

  // Light position
  lx: -50,
  ly: 0,
  lz: 60,

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

  // Show debug curve
  displaySkeleton: true,

  // Music
  bpm: 50,
};

var goose = null,
    gVertices,        // Goose vertices
    cx    = config.x,
    cy    = config.y,
    ca    = config.a;

init();
animate();

// Sets up the scene.
function init() {
  // Create the scene and set the scene size.
  scene = new THREE.Scene();
  var WIDTH = $(window).innerWidth(),
      HEIGHT = $(window).innerHeight();

  console.log(WIDTH, HEIGHT);

  // Create a renderer and add it to the DOM.
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(WIDTH, HEIGHT);
  $('#container').append(renderer.domElement);
  renderer.domElement.id = "context";
  // renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = false;
  renderer.shadowCameraNear = 3;
  renderer.shadowCameraNear = 3;
  renderer.shadowCameraFov = 50;
  renderer.shadowMapBias = 0.0039;
  renderer.shadowMapDarkness = 0.5;
  renderer.shadowMapWidth = 1024;
  renderer.shadowMapHeight = 1024;

  // Camera
  camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 1, 10000);
  camera.position.y = 50;

  scene.add(camera);

  // Controls
  controls = new THREE.GooseControls(camera, renderer.domElement);
  controls.settings.lookAt = new THREE.Vector3(0,camera.position.y,-100);


  // Lights

  light = new THREE.DirectionalLight( 0xffffff );
  light.position.set(config.lx, config.ly, config.lz);
  scene.add(light);

  pointLight = new THREE.PointLight( 0xc39854 );
  pointLight.position.set( 0, 0, 100 );
  scene.add( pointLight );

  ambientLight = new THREE.AmbientLight( 0x080808 );
  scene.add( ambientLight );

  // Helper
  // axes = new THREE.AxisHelper( 200 );
  // scene.add( axes );

  // GUI helper
  var h;
  var gui = new dat.GUI();

  h = gui.addFolder('Positions');
  h.add(config,'x',-1, 1).name('Nose X');
  h.add(config,'y',-1, 1).name('Nose Y');
  h.add(config,'a',50, 200).name('Wideness');
  h.add(config,'camX',-500, 500).name('Camera Position');

  // h.add(config,'gx',-20, 20).name('Goose X');
  // h.add(config,'gy',-30, 20).name('Goose Y');
  // h.add(config,'gz',-5, 5).name('Goose Z');

  h = gui.addFolder('Ambiant Light');
  h.add(config,'lx',-1.0, 1.0, 0.025).name('x');
  h.add(config,'ly',-1.0, 1.0, 0.025).name('y');
  h.add(config,'lz',-1.0, 1.0, 0.025).name('z');

  h = gui.addFolder('Point Light');
  h.add(config,'plx',-100.0, 100.0, 0.025).name('x');
  h.add(config,'ply',-100.0, 100.0, 0.025).name('y');
  h.add(config,'plz',0, 100.0, 0.025).name('z');

  h = gui.addFolder('Material');
  h.add(config, "hue", 0.0, 1.0, 0.025);
  h.add(config, "saturation", 0.0, 1.0, 0.025);
  h.add(config, "lightness", 0.0, 1.0, 0.025);

  h = gui.addFolder('Debug');
  h.add(config, "displaySkeleton");


  

  // Add background
  var plane = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshPhongMaterial({color: 0xEA4437, shading: THREE.FlatShading }));
  plane.receiveShadow = true;
  scene.add(plane);

  // Goose Material
  var shader = THREE.ShaderToon.toon2;
  var u = THREE.UniformsUtils.clone(shader.uniforms);
  var vs = shader.vertexShader;
  var fs = shader.fragmentShader;

  material = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: vs, 
    fragmentShader: fs
  });
  console.log(shader.uniforms);
  material.uniforms.uDirLightPos.value = light.position;
  material.uniforms.uDirLightColor.value = light.color;
  material.uniforms.uAmbientLightColor.value = ambientLight.color;
  material.uniforms.uBaseColor.value = new THREE.Color(0xFFE1A7);

  // Goose Shape

  loader = new THREE.JSONLoader();
  loader.load( "goose.js", function(geometry) {
    goose = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color: 0xFFE1A7, shading: THREE.FlatShading }));
    // goose = new THREE.Mesh(geometry, new THREE.ShaderMaterial(shader));
    goose.position.y = 0;
    goose.position.x = 0;
    goose.position.z = 0;
    goose.castShadow = true;
    // goose.receiveShadow = true;
    scene.add(goose);

    registerVertices();
    updateVertices();
  });
}

function registerVertices() {
  gVertices = goose.geometry.clone().vertices;
}

// Bending curve vector
function skeleton(pos,mod) {
  return mod * (1/config.a*Math.pow(pos,2));
}

function tan(bx,mod) { // pos = x
  var dx, dy, ax, cx, ay, cy, ang;
  ax = bx-1;
  cx = bx+1;

  ay = skeleton(ax,mod);
  cy = skeleton(cx,mod);

  dx = ax-cx;
  dy = ay-cy;
  
  ang = Math.atan2(dy,dx);
  // ang += Math.PI/2;
  return ang;
}

function updateVertices() {
  var vertices = goose.geometry.vertices;

  goose.geometry.dynamic = true;

  // Pour chaque vertice (vecteur), je dois connaitre son point d'origine, applique la fonction bend vertice

  for(var i=0, len=vertices.length; i<len; i++) {
    var original = gVertices[i];
    var current  = vertices[i];
    // current.z = original.z - original.z * (original.x + config.x);
    // current.x = config.x * (1/(config.a+original.x)) + original.x;
    // current.x = config.x*(1/config.a*Math.pow(original.z - config.x * original.x * 0.5,2)) + original.x;
    var angx = tan(original.z,config.x);
    // var angy = tan(original.z,config.y);

    current.z = original.z + Math.sin(angx) * original.x;
    // current.z = current.z + Math.sin(angy) * original.y; // Works but better without
    current.x = skeleton(current.z,config.x) + original.x;
    current.y = skeleton(current.z,config.y) + original.y;
  }
  goose.geometry.verticesNeedUpdate = true;
}

function render() {

  // Curve Debug
  if (config.displaySkeleton) {
    displaySkeleton();
  }

  // Lights
  light.position.set(config.lx, config.ly, config.lz);
  light.position.normalize();

  pointLight.position.set(config.plx, config.ply, config.plz);
  pointLight.color.setHSL(config.lhue, config.lsaturation, config.llightness);

  if (goose) {
    // goose.material.uniforms.uBaseColor.value.setHSL(config.hue, config.saturation, config.lightness);
    goose.position.set(config.gx, config.gy, config.gz);
  }

  if (cx !== config.x || cy !== config.y || ca !== config.a) {
    updateVertices();
    cx = config.x;
    cy = config.y;
    ca = config.a;
  }

  renderer.render(scene, camera);
}

// Animate
function animate() {
  requestAnimationFrame(animate);
  render();
  controls.update(config.camX);
}


// DEBUG PURPOSE

// Draw base blue line for bending
function displaySkeleton() {
  if (skull) {
    scene.remove(skull);
    skull = null;
  }
  if (config.displaySkeleton) {
    // Draw skeleton
    var lineMaterial = new THREE.LineBasicMaterial({color: 0xff00ff});
    var lineGeometry = new THREE.Geometry();
    for(var i=0; i<500; i++) {
      lineGeometry.vertices.push(new THREE.Vector3(skeleton(i,config.x), skeleton(i,config.y), i));
    }
    skull = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(skull);
  }
}


});
