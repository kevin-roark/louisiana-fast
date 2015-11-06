
var THREE = require('three');
var $ = require('jquery');
var buzz = require('./lib/buzz');
var kt = require('kutility');
var TWEEN = require('tween.js');

var modelLoader = require('./util/model-loader');
import {createGround, createWall, makePhysicsMaterial} from './util/builder.es6';
import {SheenScene} from './sheen-scene.es6';

var ColorPossibility = 0.42;
var SwampProbability = 0.33;
var MaxNumberOfGators = 36;

export class MainScene extends SheenScene {

  /// Init

  constructor(renderer, camera, scene, options) {
    super(renderer, camera, scene, options);

    this.name = "LA FAST";
    this.onPhone = options.onPhone || false;
    this.roomLength = 300;
    this.halfLength = this.roomLength/2;
  }

  /// Overrides

  enter() {
    super.enter();

    this.controlObject = this.controls.getObject();

    if (!this.domMode) {
      this.makeLights();
      this.makeSky();

      this.makeGroundTextures();
      this.ground = createGround({
        length: this.roomLength,
        y: 0,
        material: this.newStructureMaterial(null)
      });
      this.ground.addTo(this.scene);

      this.makeWallTextures();
      this.walls = [
        createWall({direction: 'back', roomLength: this.roomLength, wallHeight: this.roomLength}),
        createWall({direction: 'left', roomLength: this.roomLength, wallHeight: this.roomLength}),
        createWall({direction: 'right', roomLength: this.roomLength, wallHeight: this.roomLength}),
        createWall({direction: 'front', roomLength: this.roomLength, wallHeight: this.roomLength})
      ];
      this.walls.forEach((wall) => {
        wall.addTo(this.scene);
      });

      // start with one gator
      this.gators = [];
      this.makeGator();

      // move up
      this.controlObject.position.y = 5;
    }
  }

  doTimedWork() {
    super.doTimedWork();

    this.setupTicker();
    this.refreshGroundTexture(true);
    this.refreshWallTexture(true);

    var gatorAdditionInterval = setInterval(() => {
      if (this.gators.length < MaxNumberOfGators) {
        this.makeGator();
      }
      else {
        clearInterval(gatorAdditionInterval);
      }
    }, 2666);
  }

  update(dt) {
    super.update(dt);

    if (this.lightContainer && this.controlObject) {
      this.lightContainer.position.y = this.controlObject.position.y - 5;
    }

    if (this.gators) {
      for (var i = 0; i < this.gators.length; i++) {
        var gator = this.gators[i];
        gator.crawl();
        gator.grow();
      }
    }
  }

  // Interaction

  spacebarPressed() {

  }

  click() {

  }

  // Creation

  setupTicker() {
    var lines = [
      'Oh, Slidell?',
      'the, dirty, de.al',
      'should not be from, that place',
      'went to a swamp tour, right there, across the bridge'
    ];

    var index = 0;
    var doNextLine = () => {
      this.doTickerLine(lines[index], 8000, () => {
        index += 1;
        if (index < lines.length) {
          doNextLine();
        }
      });
    };

    doNextLine();
  }

  doTickerLine(text, duration, callback) {
    let $tickerEl = $('<div>' + text + '</div>');
    $tickerEl.css('position', 'fixed');
    $tickerEl.css('top', '40px');
    $tickerEl.css('left', '0px');
    $tickerEl.css('color', 'rgb(237, 48, 14)');
    $tickerEl.css('font-size', '40px');
    $tickerEl.css('font-weight', 'bold');
    $tickerEl.css('letter-spacing', '1px');

    var tickerTransform = {x: window.innerWidth};
    $tickerEl.css('transform', 'translate(' + tickerTransform.x + 'px, 0px)');

    this.domContainer.append($tickerEl);

    var tickerTransformTarget = {x: -$tickerEl.width()};
    var tween = new TWEEN.Tween(tickerTransform).to(tickerTransformTarget, duration);
    tween.onUpdate(() => {
      $tickerEl.css('transform', 'translate(' + tickerTransform.x + 'px, 0px)');
    });
    tween.onComplete(() => {
      $tickerEl.remove();
      if (callback) callback();
    });
    tween.start();
  }

  makeGator() {
    var grayscale = Math.random() > ColorPossibility;

    modelLoader('/js/models/gator.json', (geometry, materials) => {
      if (!materials) {
        var skinMap = THREE.ImageUtils.loadTexture('/media/skindisp.png');
        skinMap.wrapS = skinMap.wrapT = THREE.RepeatWrapping;
        skinMap.repeat.set(10, 10);

        materials = [new THREE.MeshPhongMaterial({
          color: grayscale ? 0x666666 : 0x00ff00,
          bumpMap: skinMap
        })];
      }

      var faceMaterial = new THREE.MeshFaceMaterial(materials);

      var gator = new THREE.Mesh(geometry, faceMaterial);
      gator.castShadow = true;
      gator.scale.set(7, 7, 7);
      gator.position.copy(this.niceGatorPosition());
      gator.rotation.y = Math.random() * Math.PI * 2;
      gator._trueMaterial = gator.material.materials[0];

      gator.resetCrawl = () => {
        gator.crawlTarget = this.niceGatorPosition();
        gator.crawlSteps = Math.round(Math.random() * 200) + 100;
        gator.crawlX = (gator.crawlTarget.x - gator.position.x) / gator.crawlSteps;
        gator.crawlZ = (gator.crawlTarget.z - gator.position.z) / gator.crawlSteps;
      };
      gator.resetCrawl();

      gator.crawl = () => {
        if (gator.crawlSteps <= 0) {
          gator.resetCrawl();
        }

        gator.position.x += gator.crawlX;
        gator.position.z += gator.crawlZ;
        gator.crawlSteps -= 1;
      };

      gator.resetGrowth = () => {
        gator.scaleTarget = Math.random() * 14 + 1;
        gator.growthSteps = Math.round(Math.random() * 200) + 100;
        gator.growthInterval = (gator.scaleTarget - gator.scale.x) / gator.growthSteps;
      };
      gator.resetGrowth();

      gator.grow = () => {
        if (gator.growthSteps <= 0) {
          gator.resetGrowth();
        }

        var scale = gator.scale.x + gator.growthInterval;
        gator.scale.set(scale, scale, scale);
        gator.position.y = -scale + 1;
        gator.growthSteps -= 1;
      };

      gator.toggleWireframe = (recurse) => {
        gator._trueMaterial.wireframe = !gator._trueMaterial.wireframe;

        if (recurse) {
          var nextToggle = kt.randInt(250, 1000);
          setTimeout(() => {
            gator.toggleWireframe(true);
          }, nextToggle);
        }
      };
      gator.toggleWireframe(true);

      if (!grayscale) {
        gator.toggleColor = (recurse) => {
          gator._trueMaterial.color = new THREE.Color(parseInt(Math.random() * 16777215));

          if (recurse) {
            var nextToggle = kt.randInt(250, 1000);
            setTimeout(() => {
              gator.toggleColor(true);
            }, nextToggle);
          }
        };
        gator.toggleColor(true);
      }

      this.scene.add(gator);
      this.gators.push(gator);
    });
  }

  niceGatorPosition() {
    var p = () => { return (Math.random() - 0.5) * (this.roomLength - 5); } ;
    return new THREE.Vector3(p(), -6, p());
  }

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

  makeSky() {
    // lifted from mrdoob.github.io/three.js/examples/webgl_lights_hemisphere.html
    var vertexShader = document.getElementById('skyVertexShader').textContent;
    var fragmentShader = document.getElementById('skyFragmentShader').textContent;
    var uniforms = {
      topColor: 	 { type: "c", value: new THREE.Color().setHSL(0.6, 1, 0.6) },
      bottomColor: { type: "c", value: new THREE.Color(0xccccff) },
      offset:		 { type: "f", value: 33 },
      exponent:	 { type: "f", value: 0.75 }
    };

    if (this.scene.fog) {
      this.scene.fog.color.copy(uniforms.bottomColor.value);
    }

    var skyGeo = new THREE.SphereGeometry(480, 32, 24);
    var skyMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      side: THREE.BackSide
    });

    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.sky);
  }

  makeGroundTextures() {
    var swampTextures = [
      THREE.ImageUtils.loadTexture('/media/swamp1.jpg'),
      THREE.ImageUtils.loadTexture('/media/swamp2.jpg'),
      THREE.ImageUtils.loadTexture('/media/swamp3.jpg'),
      THREE.ImageUtils.loadTexture('/media/swamp4.jpg'),
      THREE.ImageUtils.loadTexture('/media/swamp5.jpg')
    ];
    swampTextures.forEach(function(texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(8, 8);
    });

    this.groundTextures = swampTextures;
  }

  makeWallTextures() {
    this.wallTextures = [
      THREE.ImageUtils.loadTexture('/media/wall1.jpg'),
      THREE.ImageUtils.loadTexture('/media/wall2.jpg'),
      THREE.ImageUtils.loadTexture('/media/wall3.jpg'),
      THREE.ImageUtils.loadTexture('/media/wall4.jpg'),
      THREE.ImageUtils.loadTexture('/media/wall5.jpg'),
      THREE.ImageUtils.loadTexture('/media/wall6.jpg'),
      THREE.ImageUtils.loadTexture('/media/wall7.jpg'),
      THREE.ImageUtils.loadTexture('/media/wall8.jpg')
    ];
  }

  refreshGroundTexture(recurse) {
    var texture = (Math.random() < SwampProbability) ? kt.choice(this.groundTextures) : null;
    var material = this.newStructureMaterial(texture);
    this.ground.mesh.material = makePhysicsMaterial(material);
    this.ground.mesh.needsUpdate = true;

    if (recurse) {
      var nextRefresh = kt.randInt(250, 1000);
      setTimeout(() => {
        this.refreshGroundTexture(true);
      }, nextRefresh);
    }
  }

  refreshWallTexture(recurse) {
    var texture = (Math.random() < SwampProbability) ? kt.choice(this.wallTextures) : null;
    var material = this.newStructureMaterial(texture);
    var wall = kt.choice(this.walls);
    wall.mesh.material = makePhysicsMaterial(material);
    wall.mesh.needsUpdate = true;

    if (recurse) {
      var nextRefresh = kt.randInt(80, 500);
      setTimeout(() => {
        this.refreshWallTexture(true);
      }, nextRefresh);
    }
  }

  newStructureMaterial(map) {
    return new THREE.MeshPhongMaterial({
      color: 0x101010,
      side: THREE.DoubleSide,
      map: map ? map : null
    });
  }

}
