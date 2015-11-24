
var THREE = require('three');

module.exports = VideoMesh;

function VideoMesh(options) {
  this.video = options.video;
  this.meshWidth = options.meshWidth || 150;
  this.meshHeight = options.meshHeight || this.meshWidth * 0.5;
  this.meshDepth = options.meshDepth || 0;

  this.videoImage = document.createElement('canvas');
  this.videoImage.width = options.videoWidth || 320;
  this.videoImage.height = options.videoHeight || 180;

  this.videoImageContext = this.videoImage.getContext('2d');
	this.videoImageContext.fillStyle = '#ffffff'; // background color if no video present
	this.videoImageContext.fillRect(0, 0, this.meshWidth, this.meshHeight);

  this.videoTexture = new THREE.Texture(this.videoImage);
  this.videoTexture.minFilter = THREE.LinearFilter;
  this.videoTexture.magFilter = THREE.LinearFilter;
  this.videoTexture.format = THREE.RGBFormat;
  this.videoTexture.generateMipmaps = false;

  this.videoMaterial = new THREE.MeshBasicMaterial({
    map: this.videoTexture,
    overdraw: true,
    side: THREE.DoubleSide
  });

  this.videoGeometry = this.meshDepth > 0 ? new THREE.BoxGeometry(this.meshWidth, this.meshHeight, this.meshDepth) : new THREE.PlaneGeometry(this.meshWidth, this.meshHeight);
  this.mesh = new THREE.Mesh(this.videoGeometry, this.videoMaterial);
}

VideoMesh.prototype.addTo = function(scene) {
  scene.add(this.mesh);
};

VideoMesh.prototype.removeFrom = function(scene) {
  scene.remove(this.mesh);
};

VideoMesh.prototype.update = function() {
  if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
    this.videoImageContext.drawImage(this.video, 0, 0);

    if (this.videoTexture) {
      this.videoTexture.needsUpdate = true;
    }
  }
};

VideoMesh.prototype.moveTo = function(x, y, z) {
  this.mesh.position.set(x, y + this.meshHeight / 2, z);
};

VideoMesh.prototype.rotateTo = function(rx, ry, rz) {
  this.mesh.rotation.set(rx, ry, rz);
};
