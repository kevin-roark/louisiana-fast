
let THREE = require('three');
let $ = require('jquery');
let SheenMesh = require('./sheen-mesh');
let VideoMesh = require('./util/video-mesh');
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
    this.isVertical = options.isVertical !== undefined ? options.isVertical : false;
    this.videoName = options.videoName;
    this.previewImageName = options.videoName + '.jpg';

    options.modelName = this.isVertical ? '/js/models/phone.json' : '/js/models/tv.json';
    options.scale = this.isVertical ? 4 : 12;

    super(options);
  }

  meshWasLoaded() {
    super.meshWasLoaded();

    var makePreviewMesh = () => {
      var geometry = this.isVertical ? new THREE.BoxGeometry(0.75 * 0.5, 0.75, 2) : new THREE.BoxGeometry(0.75, 0.75 * 0.5, 0.03); // tuned to line up with tv
      var texture = THREE.ImageUtils.loadTexture(this.previewImageName);
      texture.minFilter = THREE.NearestFilter;
      var material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: texture,
        side: THREE.DoubleSide
      });
      return new THREE.Mesh(geometry, material);
    };

    this.previewImageMesh = makePreviewMesh();
    this.previewImageMesh.position.set(0, 0.3, 0); // tuned to line up with tv
    this.shaneMesh.mesh.add(this.previewImageMesh);

    if (this.isVertical) {
      this.shaneMesh.mesh.rotation.x = Math.PI / 2;
      this.shaneMesh.mesh.rotation.y = Math.PI / 2;
      this.previewImageMesh.rotation.x = -Math.PI / 2;
      this.previewImageMesh.rotation.y = -Math.PI / 2;
      this.previewImageMesh.scale.set(3, 3, 3);
    }

    if (this.videoMesh) {
      this.videoMesh.addTo(this.shaneMesh.mesh);
      this.previewImageMesh.visible = false;
    }
  }

  updateForNear() {
    this.video = dahmer.makeVideo(this.videoName);
    $(this.video).addClass('beacon-video');

    super.updateForNear();

    this.video.play();

    this.videoMesh = new VideoMesh({
      video: this.video,
      meshWidth: 0.75,
      meshDepth: 0.03,
      videoWidth: 853,
      videoHeight: 480
    });
    this.videoMesh.mesh.position.set(0, 0.3, 0); // tuned to line up with tv

    if (this.shaneMesh.mesh) {
      this.videoMesh.addTo(this.shaneMesh.mesh);
      this.previewImageMesh.visible = false;
    }
  }

  updateForFar() {
    super.updateForFar();

    if (this.video) {
      this.video.src = '';
      $(this.video).remove();
      this.video = null;
    }

    if (this.videoMesh) {
      this.videoMesh.removeFrom(this.shaneMesh.mesh);
      this.videoMesh = null;
    }

    this.previewImageMesh.visible = true;
  }

  update() {
    super.update();

    if (this.videoMesh) {
      this.videoMesh.update();
    }
  }
}
