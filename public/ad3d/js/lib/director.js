/* ============================================================
   Director — orchestrates scenes with strict enter/hold/exit.
   ============================================================ */

(function (global) {
  class Director {
    constructor({ scene, camera, typography, cues, cameraRig, curtain }) {
      this.scene = scene;
      this.camera = camera;
      this.typography = typography;
      this.cues = cues;
      this.cameraRig = cameraRig;
      this.curtain = curtain;
      this._sceneList = [];
      this._currentRoot = null;
      this._currentDispose = null;
    }

    register(sceneEntry) { this._sceneList.push(sceneEntry); }

    async run() {
      this.cues.add("show-start");
      await new Promise((r) => setTimeout(r, 700));

      for (let i = 0; i < this._sceneList.length; i++) {
        const entry = this._sceneList[i];
        this.cues.add(`scene-enter`, entry.id);
        await this._playOne(entry);
        this.cues.add(`scene-exit`, entry.id);
      }

      this.cues.add("show-end");
      if (this.curtain) await this.curtain.down();
      await new Promise((r) => setTimeout(r, 900));
    }

    async _playOne(entry) {
      let bundle;
      try {
        bundle = entry.factory(this.scene);
      } catch (e) {
        console.error(`[Director] Scene ${entry.id} factory error:`, e);
        return;
      }
      if (!bundle || !bundle.root || !bundle.run) {
        console.error(`[Director] Scene ${entry.id} returned invalid bundle.`);
        return;
      }
      const { root, run, dispose } = bundle;
      this._currentRoot = root;
      this._currentDispose = dispose;
      this.scene.add(root);

      if (this.curtain) {
        try { await this.curtain.up(); } catch (_) {}
      }
      try {
        await run({
          camera: this.camera,
          cameraRig: this.cameraRig,
          typography: this.typography,
          cues: this.cues,
          curtain: this.curtain,
        });
      } catch (e) {
        console.error(`[Director] Scene ${entry.id} error:`, e);
      }

      if (this.curtain) {
        try { await this.curtain.down(); } catch (_) {}
      }
      // Always remove via scene.remove — never assume root.parent has removeChild.
      try { this.scene.remove(root); } catch (_) {}
      try { dispose && dispose(); } catch (e) { console.warn(`[Director] dispose ${entry.id}:`, e); }
      this._currentRoot = null;
      this._currentDispose = null;
      this.typography.forceClear();
    }
  }

  global.Director = Director;
})(window);
