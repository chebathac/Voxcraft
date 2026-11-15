import * as THREE from 'three';
import { ProceduralCloudLayer } from './clouds';
import { GraphicsQuality } from './storage';
import { DimensionId } from './types';

export class MinecraftSky {
  public scene: THREE.Scene;
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public sunGroup: THREE.Group;
  public moonGroup: THREE.Group;
  public skyDome: THREE.Mesh;
  public cloudLayer: ProceduralCloudLayer;
  public stars: THREE.Points;

  public timeOfDay: number = 0.32; // Start in bright morning-daylight glow
  public autoCycle: boolean = true;
  public cycleSpeed: number = 0.0045;
  public dimension: DimensionId = 'overworld';

  private skyDomeGeo: THREE.SphereGeometry;
  private skyDomeVertY: Float32Array;
  private skyDomeColors: Float32Array;
  private lastDomeKey = '';

  // Reusable scratch colors to prevent GC spikes
  private cZenith = new THREE.Color();
  private cMid = new THREE.Color();
  private cHorizon = new THREE.Color();
  private cTmp = new THREE.Color();
  private cDayZenith = new THREE.Color(0x3a7be8);
  private cDayHorizon = new THREE.Color(0xbce0ff);
  private cTwilightZenith = new THREE.Color(0x1f1942);
  private cGoldenHorizon = new THREE.Color(0xf68444);
  private cNightZenith = new THREE.Color(0x060b16);
  private cNightHorizon = new THREE.Color(0x142038);
  private cSunDay = new THREE.Color(0xfff6dc);
  private cSunLow = new THREE.Color(0xffb56b);
  private cMoon = new THREE.Color(0x7c96d8);

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Atmospheric Fog (dynamically tuned via applyGraphicsQuality)
    this.scene.fog = new THREE.Fog(0xbce0ff, 42, 138);

    // Directional Sunlight / Moonlight with crisp normalBias
    this.dirLight = new THREE.DirectionalLight(0xfff6dc, 1.45);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 130;
    const d = 38;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0004;
    this.dirLight.shadow.normalBias = 0.025;
    this.scene.add(this.dirLight);

    // Hemisphere Light (sky blue top vs warm sunlit ground bounce)
    this.hemiLight = new THREE.HemisphereLight(0x88bfff, 0x5c4b39, 0.78);
    this.scene.add(this.hemiLight);

    // Multi-stop Vertex-Gradient Atmospheric Sky Dome
    this.skyDomeGeo = new THREE.SphereGeometry(185, 20, 12);
    const posAttr = this.skyDomeGeo.getAttribute('position');
    const vCount = posAttr.count;
    this.skyDomeVertY = new Float32Array(vCount);
    this.skyDomeColors = new Float32Array(vCount * 3);
    for (let i = 0; i < vCount; i++) {
      this.skyDomeVertY[i] = Math.max(0, Math.min(1, posAttr.getY(i) / 185));
    }
    this.skyDomeGeo.setAttribute('color', new THREE.BufferAttribute(this.skyDomeColors, 3));
    const domeMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.skyDome = new THREE.Mesh(this.skyDomeGeo, domeMat);
    this.skyDome.renderOrder = -10;
    this.scene.add(this.skyDome);

    // Classic square Minecraft Sun with layered golden bloom
    this.sunGroup = new THREE.Group();
    const sunGeo = new THREE.PlaneGeometry(15, 15);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfffef0,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    const haloGeo = new THREE.PlaneGeometry(26, 26);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffdf6e,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.z = -0.1;

    const outerGlowGeo = new THREE.PlaneGeometry(42, 42);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    });
    const outerGlowMesh = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    outerGlowMesh.position.z = -0.2;

    this.sunGroup.add(sunMesh, haloMesh, outerGlowMesh);
    this.scene.add(this.sunGroup);

    // Classic square Minecraft Moon with cool silver aura
    this.moonGroup = new THREE.Group();
    const moonGeo = new THREE.PlaneGeometry(13, 13);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xf4f7ff,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    const moonAuraGeo = new THREE.PlaneGeometry(24, 24);
    const moonAuraMat = new THREE.MeshBasicMaterial({
      color: 0x8fb4ff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    });
    const moonAura = new THREE.Mesh(moonAuraGeo, moonAuraMat);
    moonAura.position.z = -0.1;
    const craterGeo = new THREE.PlaneGeometry(3.6, 3.6);
    const craterMat = new THREE.MeshBasicMaterial({ color: 0xc2cde0, depthWrite: false, fog: false });
    const crater1 = new THREE.Mesh(craterGeo, craterMat);
    crater1.position.set(-2, 2, 0.05);
    const crater2 = new THREE.Mesh(craterGeo, craterMat);
    crater2.position.set(2, -2, 0.05);
    this.moonGroup.add(moonMesh, moonAura, crater1, crater2);
    this.scene.add(this.moonGroup);

    // Twinkling Night Stars
    const starCount = 420;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 135;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 12;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xf0f6ff,
      size: 1.65,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    this.stars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.stars);

    // Procedural Minecraft Voxel Cloud Layer
    this.cloudLayer = new ProceduralCloudLayer(this.scene);
  }

  public applyGraphicsQuality(quality: GraphicsQuality, isMobile: boolean, isSoftwareGl: boolean): void {
    const fog = this.scene.fog as THREE.Fog | null;
    if (fog) {
      if (quality === 'smooth') {
        fog.near = 30;
        fog.far = 104;
      } else if (quality === 'high') {
        fog.near = 52;
        fog.far = 165;
      } else {
        fog.near = 42;
        fog.far = 138;
      }
    }

    const enableShadow = !isSoftwareGl && (quality === 'high' || (!isMobile && quality === 'balanced'));
    this.dirLight.castShadow = enableShadow;
    const targetRes = quality === 'high' && !isMobile ? 2048 : 1024;
    if (this.dirLight.shadow.mapSize.width !== targetRes) {
      this.dirLight.shadow.mapSize.width = targetRes;
      this.dirLight.shadow.mapSize.height = targetRes;
      if (this.dirLight.shadow.map) {
        this.dirLight.shadow.map.dispose();
        this.dirLight.shadow.map = null;
      }
    }
  }

  private updateSkyDomeColors(): void {
    const key = `${this.cZenith.getHexString()}_${this.cHorizon.getHexString()}`;
    if (key === this.lastDomeKey) return;
    this.lastDomeKey = key;

    this.cMid.lerpColors(this.cHorizon, this.cZenith, 0.45);
    const colAttr = this.skyDomeGeo.getAttribute('color') as THREE.BufferAttribute;
    const arr = this.skyDomeColors;
    for (let i = 0; i < this.skyDomeVertY.length; i++) {
      const h = this.skyDomeVertY[i];
      if (h < 0.32) {
        this.cTmp.lerpColors(this.cHorizon, this.cMid, h / 0.32);
      } else {
        const t = Math.pow((h - 0.32) / 0.68, 0.85);
        this.cTmp.lerpColors(this.cMid, this.cZenith, t);
      }
      arr[i * 3] = this.cTmp.r;
      arr[i * 3 + 1] = this.cTmp.g;
      arr[i * 3 + 2] = this.cTmp.b;
    }
    colAttr.needsUpdate = true;
  }

  public setDimension(dim: DimensionId): void {
    this.dimension = dim;
    const isOverworld = dim === 'overworld';
    this.sunGroup.visible = isOverworld;
    this.moonGroup.visible = isOverworld;
    this.cloudLayer.group.visible = isOverworld;
    this.lastDomeKey = '';
  }

  public update(delta: number, playerPos: THREE.Vector3): void {
    if (this.dimension === 'nether') {
      this.cZenith.setHex(0x290707);
      this.cHorizon.setHex(0x52120c);
      (this.stars.material as THREE.PointsMaterial).opacity = 0;
      this.updateSkyDomeColors();
      this.skyDome.position.copy(playerPos);
      if (!this.scene.background || !(this.scene.background instanceof THREE.Color)) {
        this.scene.background = this.cHorizon.clone();
      } else {
        this.scene.background.copy(this.cHorizon);
      }
      if (this.scene.fog) this.scene.fog.color.copy(this.cHorizon);
      this.dirLight.color.setHex(0xff9b6a);
      this.dirLight.intensity = 0.72;
      this.dirLight.position.set(playerPos.x + 15, playerPos.y + 35, playerPos.z + 12);
      this.dirLight.target.position.copy(playerPos);
      this.dirLight.target.updateMatrixWorld();
      this.hemiLight.color.setHex(0x9e3a28);
      this.hemiLight.groundColor.setHex(0x3a140d);
      this.hemiLight.intensity = 0.75;
      return;
    }

    if (this.dimension === 'end') {
      this.cZenith.setHex(0x04020a);
      this.cHorizon.setHex(0x160d29);
      (this.stars.material as THREE.PointsMaterial).opacity = 0.95;
      this.updateSkyDomeColors();
      this.skyDome.position.copy(playerPos);
      this.stars.position.copy(playerPos);
      if (!this.scene.background || !(this.scene.background instanceof THREE.Color)) {
        this.scene.background = this.cHorizon.clone();
      } else {
        this.scene.background.copy(this.cHorizon);
      }
      if (this.scene.fog) this.scene.fog.color.copy(this.cHorizon);
      this.dirLight.color.setHex(0xd8b4fe);
      this.dirLight.intensity = 0.65;
      this.dirLight.position.set(playerPos.x + 20, playerPos.y + 42, playerPos.z - 15);
      this.dirLight.target.position.copy(playerPos);
      this.dirLight.target.updateMatrixWorld();
      this.hemiLight.color.setHex(0x7e5bef);
      this.hemiLight.groundColor.setHex(0x1a122e);
      this.hemiLight.intensity = 0.68;
      return;
    }

    if (this.autoCycle) {
      this.timeOfDay = (this.timeOfDay + delta * this.cycleSpeed) % 1.0;
    }

    const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
    const orbitRadius = 110;

    const sunX = playerPos.x + Math.cos(angle) * orbitRadius;
    const sunY = playerPos.y + Math.sin(angle) * orbitRadius;
    const sunZ = playerPos.z + Math.cos(angle) * 24; // slight angled shadow sweep for crisp 3D block faces
    this.sunGroup.position.set(sunX, sunY, sunZ);
    this.sunGroup.lookAt(playerPos);

    const moonX = playerPos.x - Math.cos(angle) * orbitRadius;
    const moonY = playerPos.y - Math.sin(angle) * orbitRadius;
    const moonZ = playerPos.z - Math.cos(angle) * 24;
    this.moonGroup.position.set(moonX, moonY, moonZ);
    this.moonGroup.lookAt(playerPos);

    const sunElevation = Math.sin(angle);
    const isDay = sunY > playerPos.y - 10;

    if (isDay) {
      // Snap shadow camera center softly around player block grid to minimize shadow swimming
      this.dirLight.position.set(sunX, sunY, sunZ);
      this.dirLight.target.position.set(
        Math.round(playerPos.x / 2) * 2,
        Math.round(playerPos.y / 2) * 2,
        Math.round(playerPos.z / 2) * 2
      );
      const goldenFactor = THREE.MathUtils.clamp(1 - Math.max(0, sunElevation) * 3.2, 0, 1);
      this.dirLight.color.lerpColors(this.cSunDay, this.cSunLow, goldenFactor);
      this.dirLight.intensity = Math.max(0.22, ((sunY - playerPos.y) / orbitRadius) * 1.48);
    } else {
      this.dirLight.position.set(moonX, moonY, moonZ);
      this.dirLight.target.position.copy(playerPos);
      this.dirLight.color.copy(this.cMoon);
      this.dirLight.intensity = Math.max(0.14, ((moonY - playerPos.y) / orbitRadius) * 0.48);
    }
    this.dirLight.target.updateMatrixWorld();

    if (sunElevation > 0.16) {
      this.cZenith.copy(this.cDayZenith);
      this.cHorizon.copy(this.cDayHorizon);
      (this.stars.material as THREE.PointsMaterial).opacity = 0;
    } else if (sunElevation > -0.1) {
      const t = (sunElevation + 0.1) / 0.26;
      this.cZenith.lerpColors(this.cTwilightZenith, this.cDayZenith, t);
      this.cHorizon.lerpColors(this.cGoldenHorizon, this.cDayHorizon, t);
      (this.stars.material as THREE.PointsMaterial).opacity = 0.35 * (1 - t);
    } else {
      this.cZenith.copy(this.cNightZenith);
      this.cHorizon.copy(this.cNightHorizon);
      (this.stars.material as THREE.PointsMaterial).opacity = 0.9;
    }

    this.updateSkyDomeColors();
    this.skyDome.position.copy(playerPos);

    if (!this.scene.background || !(this.scene.background instanceof THREE.Color)) {
      this.scene.background = this.cHorizon.clone();
    } else {
      this.scene.background.copy(this.cHorizon);
    }
    if (this.scene.fog) {
      this.scene.fog.color.copy(this.cHorizon);
    }

    this.hemiLight.color.lerpColors(this.cHorizon, this.cZenith, 0.35);
    this.hemiLight.groundColor.setHex(isDay ? 0x5c4b39 : 0x161d2e);
    this.hemiLight.intensity = isDay ? 0.78 : 0.42;

    this.cloudLayer.update(delta, playerPos, this.timeOfDay, sunElevation);
    this.stars.position.copy(playerPos);
  }

  public setTime(val: number) {
    this.timeOfDay = Math.max(0, Math.min(1, val));
  }

  public dispose() {
    this.scene.remove(this.dirLight, this.hemiLight, this.sunGroup, this.moonGroup, this.skyDome, this.stars);
    this.skyDomeGeo.dispose();
    (this.skyDome.material as THREE.Material).dispose();
    this.sunGroup.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    this.moonGroup.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    this.stars.geometry.dispose();
    this.cloudLayer.dispose();
  }
}
