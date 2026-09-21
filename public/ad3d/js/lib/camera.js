/* ============================================================
   CameraRig — cinematic camera movements.
   ============================================================ */

(function (global) {
  const THREE = global.THREE;

  function ease(t) { return t * t * (3 - 2 * t); }

  class CameraRig {
    constructor(camera) {
      this.camera = camera;
    }

    dollyTo({ pos, look, fov = null, duration = 1500, hold = 0 }) {
      return this._tween({
        from: { pos: this.camera.position.clone(), look: this._currentLook(), fov: this.camera.fov },
        to: {
          pos: new THREE.Vector3().fromArray(pos),
          look: look ? new THREE.Vector3().fromArray(look) : this._currentLook(),
          fov: fov ?? this.camera.fov
        },
        duration, hold,
      });
    }

    orbitTo({ target, radius, angle, height, duration = 1500, hold = 0, fov = null }) {
      const endPos = new THREE.Vector3(
        target[0] + Math.cos(angle) * radius,
        target[1] + height,
        target[2] + Math.sin(angle) * radius
      );
      return this._tween({
        from: { pos: this.camera.position.clone(), look: this._currentLook(), fov: this.camera.fov },
        to: { pos: endPos, look: new THREE.Vector3().fromArray(target), fov: fov ?? this.camera.fov },
        duration, hold,
      });
    }

    shake(intensity = 0.05, duration = 500) {
      return new Promise((resolve) => {
        const start = performance.now();
        const base = this.camera.position.clone();
        const baseLook = this._currentLook();
        const step = () => {
          const t = (performance.now() - start) / duration;
          if (t >= 1) {
            this.camera.position.copy(base);
            this.camera.lookAt(baseLook);
            resolve();
            return;
          }
          const k = (1 - t) * intensity;
          this.camera.position.set(
            base.x + (Math.random() - 0.5) * k,
            base.y + (Math.random() - 0.5) * k,
            base.z + (Math.random() - 0.5) * k
          );
          this.camera.lookAt(baseLook);
          requestAnimationFrame(step);
        };
        step();
      });
    }

    _currentLook() {
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      return this.camera.position.clone().add(dir.multiplyScalar(10));
    }

    _tween({ from, to, duration, hold = 0 }) {
      return new Promise((resolve) => {
        const start = performance.now();
        const total = duration + hold;
        const baseLook = from.look.clone();
        const step = () => {
          const t = (performance.now() - start) / total;
          if (t >= 1) {
            this.camera.position.copy(to.pos);
            this.camera.lookAt(to.look);
            if (to.fov !== this.camera.fov) {
              this.camera.fov = to.fov;
              this.camera.updateProjectionMatrix();
            }
            resolve();
            return;
          }
          if (t * total < duration) {
            const k = ease(t * total / duration);
            this.camera.position.lerpVectors(from.pos, to.pos, k);
            const look = new THREE.Vector3().lerpVectors(baseLook, to.look, k);
            this.camera.lookAt(look);
            if (from.fov !== to.fov) {
              this.camera.fov = from.fov + (to.fov - from.fov) * k;
              this.camera.updateProjectionMatrix();
            }
          }
          requestAnimationFrame(step);
        };
        step();
      });
    }

    wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  }

  global.CameraRig = CameraRig;
})(window);
