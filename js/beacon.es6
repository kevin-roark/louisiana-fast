
let THREE = require('three');
let $ = require('jquery');
let SheenMesh = require('./sheen-mesh');
import {Dahmer} from './dahmer.es6';

let domContainer = $('body');
let dahmer = new Dahmer({$domContainer: domContainer});

export class Beacon {
  constructor(options) {
    this.active = false;
    this.isNear = false;

    this.position = options.position;
    this.nearbyCallback = options.nearbyCallback;
    this.nearDistance = options.nearDistance || 20;
    this.meshesNeedUpdate = options.meshesNeedUpdate !== undefined ? options.meshesNeedUpdate : false;
    this.shaneMesh = new SheenMesh(options);
  }

  update() {
    if (this.active && this.meshesNeedUpdate) {
      this.shaneMesh.update();
    }
  }

  activate(scene) {
    this.active = true;

    this.shaneMesh.addTo(scene, () => {
      if (!this.hasLoadedBefore) {
        this.meshWasLoaded();
      }
      this.hasLoadedBefore = true;
    });
  }

  deactivate(scene) {
    this.active = false;

    this.shaneMesh.removeFrom(scene);

    this.updateForFar();
  }

  meshWasLoaded() {}

  relayCameraPosition(cameraPosition) {
    var distanceSquared = this.position.distanceToSquared(cameraPosition);
    this.setNear(distanceSquared < this.nearDistance * this.nearDistance);
  }

  setNear(near) {
    if (near === this.isNear) {
      return;
    }

    if (near) {
      this.updateForNear();
    }
    else {
      this.updateForFar();
    }
  }

  updateForNear() {
    this.isNear = true;

    if (this.nearbyCallback) {
      this.nearbyCallback(this);
    }
  }

  updateForFar() {
    this.isNear = false;
  }
}

export class VideoBeacon extends Beacon {
  constructor(options) {
    options.modelName = '/js/models/tv.json';
    options.scale = 12;

    super(options);

    this.videoName = options.videoName;
    this.previewImageName = options.videoName + '.jpg';
  }

  meshWasLoaded() {
    super.meshWasLoaded();

    var geometry = new THREE.PlaneBufferGeometry(0.75, 0.75 * 0.5); // tuned to line up with tv
    var texture = THREE.ImageUtils.loadTexture(this.previewImageName);
    texture.minFilter = THREE.NearestFilter;
    var material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: texture,
      side: THREE.DoubleSide
    });
    var previewImageMesh = new THREE.Mesh(geometry, material);
    var mirrorPreviewMesh = previewImageMesh.clone();
    previewImageMesh.position.set(0, 0.29, 0.015); // tuned to line up with tv
    mirrorPreviewMesh.position.set(0, 0.29, -0.015);

    this.shaneMesh.mesh.add(previewImageMesh);
    this.shaneMesh.mesh.add(mirrorPreviewMesh);
  }

  updateForNear() {
    this.video = dahmer.makeVideo(this.videoName);
    $(this.video).addClass('beacon-video');

    super.updateForNear();

    this.video.play();
  }

  updateForFar() {
    super.updateForFar();

    if (this.video) {
      this.video.src = '';
      $(this.video).remove();
      this.video = null;
    }
  }
}
