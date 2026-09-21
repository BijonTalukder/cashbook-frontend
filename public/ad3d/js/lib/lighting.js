/* ============================================================
   LightingRig — cinematic lighting presets per scene.
   ============================================================ */

(function (global) {
  const THREE = global.THREE;

  class LightingRig {
    constructor(scene) {
      this.scene = scene;
      this.group = new THREE.Group();
      this.group.name = "LightingRig";
      scene.add(this.group);
      this.ambient = null;
      this.hemisphere = null;
      this.key = null;
      this.fill = null;
      this.rim = null;
    }

    warmShop() {
      this._clear();
      this.ambient = new THREE.AmbientLight(0xfff1d6, 0.35);
      this.hemisphere = new THREE.HemisphereLight(0xfff1d6, 0x5a3a22, 0.45);
      this.key = new THREE.DirectionalLight(0xfff1d6, 1.4);
      this.key.position.set(4, 6, 4);
      this.key.castShadow = true;
      this.key.shadow.mapSize.set(2048, 2048);
      this.key.shadow.camera.near = 0.5;
      this.key.shadow.camera.far = 30;
      this.key.shadow.camera.left = -8;
      this.key.shadow.camera.right = 8;
      this.key.shadow.camera.top = 6;
      this.key.shadow.camera.bottom = -6;
      this.key.shadow.bias = -0.0005;
      this.key.shadow.radius = 4;
      this.fill = new THREE.DirectionalLight(0xfae1a4, 0.35);
      this.fill.position.set(-4, 3, 2);
      this.rim = new THREE.DirectionalLight(0xfff1d6, 0.4);
      this.rim.position.set(0, 2, -6);
      this.group.add(this.ambient, this.hemisphere, this.key, this.fill, this.rim);
    }

    darkDramatic() {
      this._clear();
      this.ambient = new THREE.AmbientLight(0x1f2937, 0.25);
      this.hemisphere = new THREE.HemisphereLight(0x2a2f3e, 0x050810, 0.3);
      this.key = new THREE.SpotLight(0xfca5a5, 2.4, 18, Math.PI / 5, 0.4, 1.2);
      this.key.position.set(2, 6, 3);
      this.key.castShadow = true;
      this.key.shadow.mapSize.set(2048, 2048);
      this.key.shadow.bias = -0.0006;
      this.fill = new THREE.PointLight(0x10b981, 0.4, 12, 1.5);
      this.fill.position.set(-3, 2, 2);
      this.rim = new THREE.SpotLight(0x60a5fa, 1.2, 14, Math.PI / 6, 0.5, 1.2);
      this.rim.position.set(-2, 4, -4);
      this.group.add(this.ambient, this.hemisphere, this.key, this.fill, this.rim);
    }

    heroReveal() {
      this._clear();
      this.ambient = new THREE.AmbientLight(0xe2f5ec, 0.55);
      this.hemisphere = new THREE.HemisphereLight(0xffffff, 0x022c22, 0.5);
      this.key = new THREE.DirectionalLight(0xffffff, 1.8);
      this.key.position.set(5, 7, 5);
      this.key.castShadow = true;
      this.key.shadow.mapSize.set(2048, 2048);
      this.key.shadow.camera.left = -8;
      this.key.shadow.camera.right = 8;
      this.key.shadow.camera.top = 8;
      this.key.shadow.camera.bottom = -8;
      this.key.shadow.bias = -0.0004;
      this.key.shadow.radius = 6;
      this.fill = new THREE.DirectionalLight(0xa7f3d0, 0.7);
      this.fill.position.set(-5, 3, 2);
      this.rim = new THREE.DirectionalLight(0x10b981, 0.8);
      this.rim.position.set(0, 4, -6);
      this.group.add(this.ambient, this.hemisphere, this.key, this.fill, this.rim);
    }

    screenShow() {
      this._clear();
      this.ambient = new THREE.AmbientLight(0x1a1f2e, 0.4);
      this.hemisphere = new THREE.HemisphereLight(0xffffff, 0x0a0f1e, 0.3);
      this.key = new THREE.DirectionalLight(0xffffff, 1.0);
      this.key.position.set(0, 3, 5);
      this.fill = new THREE.DirectionalLight(0xa7f3d0, 0.3);
      this.fill.position.set(-3, 0, 3);
      this.rim = new THREE.PointLight(0x10b981, 0.6, 8, 1.5);
      this.rim.position.set(2, -1, -2);
      this.group.add(this.ambient, this.hemisphere, this.key, this.fill, this.rim);
    }

    calmBright() {
      this._clear();
      this.ambient = new THREE.AmbientLight(0xf5f5f4, 0.7);
      this.hemisphere = new THREE.HemisphereLight(0xffffff, 0xf5f5f4, 0.5);
      this.key = new THREE.DirectionalLight(0xffffff, 1.2);
      this.key.position.set(4, 7, 5);
      this.key.castShadow = true;
      this.key.shadow.mapSize.set(2048, 2048);
      this.key.shadow.bias = -0.0005;
      this.fill = new THREE.DirectionalLight(0xa7f3d0, 0.6);
      this.fill.position.set(-5, 3, 3);
      this.rim = new THREE.DirectionalLight(0xfbbf24, 0.3);
      this.rim.position.set(0, 3, -6);
      this.group.add(this.ambient, this.hemisphere, this.key, this.fill, this.rim);
    }

    digitalVoid() {
      this._clear();
      this.ambient = new THREE.AmbientLight(0x0a1628, 0.5);
      this.hemisphere = new THREE.HemisphereLight(0x0a1628, 0x000000, 0.4);
      this.key = new THREE.PointLight(0x10b981, 2.0, 14, 1.5);
      this.key.position.set(0, 0, 4);
      this.fill = new THREE.PointLight(0x34d399, 1.0, 12, 1.5);
      this.fill.position.set(-3, 1, 0);
      this.rim = new THREE.PointLight(0x60a5fa, 0.8, 10, 1.5);
      this.rim.position.set(3, -1, -2);
      this.group.add(this.ambient, this.hemisphere, this.key, this.fill, this.rim);
    }

    _clear() {
      while (this.group.children.length) this.group.children.pop();
      this.ambient = this.hemisphere = this.key = this.fill = this.rim = null;
    }

    dispose() {
      this._clear();
      this.scene.remove(this.group);
    }
  }

  global.LightingRig = LightingRig;
})(window);
