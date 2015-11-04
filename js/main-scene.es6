
var THREE = require('three');
var $ = require('jquery');
var buzz = require('./lib/buzz');
var kt = require('kutility');

var modelLoader = require('./util/model-loader');
import {createGround, createWall} from './util/builder.es6';
import {SheenScene} from './sheen-scene.es6';

export class MainScene extends SheenScene {

  /// Init

  constructor(renderer, camera, scene, options) {
    super(renderer, camera, scene, options);

    this.name = "LA FAST";
    this.onPhone = options.onPhone || false;
    this.roomLength = 300;
  }

  /// Overrides

  enter() {
    super.enter();

    this.controlObject = this.controls.getObject();

    if (!this.domMode) {
      this.makeLights();

      this.ground = createGround(this.roomLength, 0, (otherObject) => {});
      this.ground.addTo(this.scene);

      this.walls = [
        createWall({direction: 'back', roomLength: this.roomLength, wallHeight: this.roomLength}),
        createWall({direction: 'left', roomLength: this.roomLength, wallHeight: this.roomLength}),
        createWall({direction: 'right', roomLength: this.roomLength, wallHeight: this.roomLength}),
        createWall({direction: 'front', roomLength: this.roomLength, wallHeight: this.roomLength})
      ];
      this.walls.forEach((wall) => {
        wall.addTo(this.scene);
      });

      // give me a gator
      modelLoader('/js/models/gator.json', (geometry, materials) => {
        if (!materials) {
          var skinMap = THREE.ImageUtils.loadTexture('/media/skindisp.png');
          skinMap.wrapS = skinMap.wrapT = THREE.RepeatWrapping;
          skinMap.repeat.set(10, 10);

          materials = [new THREE.MeshPhongMaterial({
            color: 0x666666,
            bumpMap: skinMap
          })];
        }

        var faceMaterial = new THREE.MeshFaceMaterial(materials);

        this.gator = new THREE.Mesh(geometry, faceMaterial);
        this.gator.castShadow = true;
        this.gator.scale.set(7, 7, 7);
        this.gator.position.set(0, -5, -80);
        this.scene.add(this.gator);
      });

      // move up
      this.controlObject.position.y = 5;
    }
  }

  doTimedWork() {
    super.doTimedWork();

    this.toggleGatorWireframe();
  }

  update(dt) {
    super.update(dt);

    if (this.lightContainer && this.controlObject) {
      this.lightContainer.position.y = this.controlObject.position.y - 5;
    }
  }

  toggleGatorWireframe() {
    var material = this.gator.material.materials[0];
    material.wireframe = !material.wireframe;

    var nextToggle = kt.randInt(250, 1000);
    setTimeout(this.toggleGatorWireframe.bind(this), nextToggle);
  }

  // Interaction

  spacebarPressed() {

  }

  click() {

  }

  // Creation

  makeLights() {
    let container = new THREE.Object3D();
    this.scene.add(container);
    this.lightContainer = container;

    this.frontLight = makeDirectionalLight();
    this.frontLight.position.set(0, 125, 148);

    this.backLight = makeDirectionalLight();
    this.backLight.position.set(0, 125, -148);

    this.leftLight = makeDirectionalLight();
    this.leftLight.position.set(-148, 125, 0);

    this.rightLight = makeDirectionalLight();
    this.rightLight.position.set(148, 125, 0);

    this.spotLight = new THREE.SpotLight(0xffffff, 10.0, 220, 20, 20); // color, intensity, distance, angle, exponent, decay
    this.spotLight.position.set(0, 150, 0);
    this.spotLight.shadowCameraFov = 20;
    this.spotLight.shadowCameraNear = 1;
    setupShadow(this.spotLight);
    container.add(this.spotLight);

    this.lights = [this.frontLight, this.backLight, this.leftLight, this.rightLight, this.spotLight];

    function makeDirectionalLight() {
      var light = new THREE.DirectionalLight(0xffffff, 0.03);
      light.color.setHSL(0.1, 1, 0.95);

      container.add(light);
      return light;
    }

    function setupShadow(light) {
      light.castShadow = true;
      //light.shadowCameraFar = 500;
      light.shadowDarkness = 0.6;
      light.shadowMapWidth = light.shadowMapHeight = 2048;
    }

  }

}
