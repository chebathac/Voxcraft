import * as THREE from 'three';

export class ProceduralCloudLayer {
  public scene: THREE.Scene;
  public group: THREE.Group;
  public instancedMesh: THREE.InstancedMesh;
  public cloudCount: number = 280;

  // Cloud layer configuration
  public altitude: number = 96; // Height above sea level (safely above trees & mountains)
  public cloudThickness: number = 4; // Authentic Minecraft 4-block cloud slab height
  public driftSpeed: number = 1.35; // Blocks per second horizontal wind drift
  public fieldRadius: number = 190; // Cloud deck radius around player (380x380 coverage)

  // Cloud block positions relative to cloud deck origin
  private initialOffsets: { x: number; y: number; z: number; sx: number; sz: number; shade: number }[] = [];
  private currentDriftX: number = 0;
  private currentDriftZ: number = 0;

  // Day-Night color definitions
  private dayColor = new THREE.Color(0xffffff);
  private dayUnderColor = new THREE.Color(0xd2dce6);
  private sunsetColor = new THREE.Color(0xff804d);
  private sunriseColor = new THREE.Color(0xffaa66);
  private twilightColor = new THREE.Color(0x5e4579);
  private nightColor = new THREE.Color(0x1a2640);

  private cloudMaterial: THREE.MeshLambertMaterial;
  private tmpDummy = new THREE.Object3D();
  private tmpColor = new THREE.Color();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Box geometry for single voxel cloud chunk (base size 1x1x1 scaled via matrix)
    const baseGeo = new THREE.BoxGeometry(1, 1, 1);

    // Double-sided translucent material with soft Lambertian sky shading
    this.cloudMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.84,
      depthWrite: false, // Prevents z-buffer fighting with distant skybox and stars
    });

    this.instancedMesh = new THREE.InstancedMesh(baseGeo, this.cloudMaterial, this.cloudCount);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.generateProceduralField();
    this.group.add(this.instancedMesh);
    this.scene.add(this.group);
  }

  // Generate Minecraft-style procedural cloud clusters using multi-octave coherent noise
  private generateProceduralField(): void {
    const dummy = this.tmpDummy;
    const span = this.fieldRadius * 2;
    const gridStep = 18;
    const cols = Math.floor(span / gridStep);

    let spawned = 0;

    // Sample a 2D cellular grid with multi-frequency pseudo-noise
    for (let gx = -cols / 2; gx <= cols / 2 && spawned < this.cloudCount; gx++) {
      for (let gz = -cols / 2; gz <= cols / 2 && spawned < this.cloudCount; gz++) {
        const wx = gx * gridStep;
        const wz = gz * gridStep;

        // Multi-octave Perlin-style coherent noise
        const n1 = Math.sin(wx * 0.035) * Math.cos(wz * 0.035);
        const n2 = Math.sin(wx * 0.08 + 1.3) * Math.cos(wz * 0.08 + 2.1) * 0.6;
        const n3 = Math.cos(wx * 0.018 - 0.7) * Math.sin(wz * 0.018 + 0.9) * 0.4;
        const density = (n1 + n2 + n3) / 1.8;

        // Threshold creates organic Minecraft cloud formations with clear blue sky gaps
        if (density > 0.08) {
          const sx = 14 + Math.abs(Math.sin(wx * 0.05)) * 18;
          const sz = 14 + Math.abs(Math.cos(wz * 0.05)) * 18;
          const sy = this.cloudThickness;
          const yOffset = Math.sin(wx * 0.1) * 1.2;
          const shade = 0.88 + Math.random() * 0.12;

          this.initialOffsets.push({
            x: wx,
            y: yOffset,
            z: wz,
            sx,
            sz,
            shade,
          });

          dummy.position.set(wx, this.altitude + yOffset, wz);
          dummy.scale.set(sx, sy, sz);
          dummy.updateMatrix();

          this.instancedMesh.setMatrixAt(spawned, dummy.matrix);
          this.tmpColor.setRGB(shade, shade, Math.min(1, shade + 0.02));
          this.instancedMesh.setColorAt(spawned, this.tmpColor);
          spawned++;
        }
      }
    }

    // Fill any remainder with smaller peripheral clouds
    while (spawned < this.cloudCount) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * (this.fieldRadius - 30);
      const wx = Math.cos(angle) * dist;
      const wz = Math.sin(angle) * dist;
      const sx = 12 + Math.random() * 16;
      const sz = 12 + Math.random() * 16;
      const yOffset = (Math.random() - 0.5) * 1.5;
      const shade = 0.9 + Math.random() * 0.1;

      this.initialOffsets.push({
        x: wx,
        y: yOffset,
        z: wz,
        sx,
        sz,
        shade,
      });

      dummy.position.set(wx, this.altitude + yOffset, wz);
      dummy.scale.set(sx, this.cloudThickness, sz);
      dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(spawned, dummy.matrix);
      this.tmpColor.setRGB(shade, shade, Math.min(1, shade + 0.02));
      this.instancedMesh.setColorAt(spawned, this.tmpColor);
      spawned++;
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  // Update cloud position, drift, wrapping around player, and day-night lighting (zero per-frame allocations)
  public update(delta: number, playerPos: THREE.Vector3, timeOfDay: number, sunElevation: number): void {
    this.currentDriftX += delta * this.driftSpeed;
    this.currentDriftZ += delta * (this.driftSpeed * 0.35);

    const dummy = this.tmpDummy;
    const span = this.fieldRadius * 2;

    for (let i = 0; i < this.initialOffsets.length; i++) {
      const c = this.initialOffsets[i];

      const wx = c.x + this.currentDriftX;
      const wz = c.z + this.currentDriftZ;

      const dx = wx - playerPos.x;
      const dz = wz - playerPos.z;

      const wrappedDx = ((dx % span) + span + this.fieldRadius) % span - this.fieldRadius;
      const wrappedDz = ((dz % span) + span + this.fieldRadius) % span - this.fieldRadius;

      dummy.position.set(playerPos.x + wrappedDx, this.altitude + c.y, playerPos.z + wrappedDz);
      dummy.scale.set(c.sx, this.cloudThickness, c.sz);
      dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;

    let targetColor: THREE.Color;
    let targetOpacity = 0.84;

    if (sunElevation > 0.18) {
      targetColor = this.dayColor;
      targetOpacity = 0.82;
    } else if (sunElevation > -0.08) {
      const t = (sunElevation + 0.08) / 0.26;
      const warmColor = timeOfDay < 0.5 ? this.sunriseColor : this.sunsetColor;
      targetColor = this.tmpColor.lerpColors(this.twilightColor, warmColor, t);
      targetOpacity = 0.88;
    } else {
      targetColor = this.nightColor;
      targetOpacity = 0.56;
    }

    this.cloudMaterial.color.lerp(targetColor, 0.08);
    this.cloudMaterial.opacity = THREE.MathUtils.lerp(this.cloudMaterial.opacity, targetOpacity, 0.08);
  }

  public dispose(): void {
    this.scene.remove(this.group);
    this.instancedMesh.geometry.dispose();
    this.cloudMaterial.dispose();
  }
}
