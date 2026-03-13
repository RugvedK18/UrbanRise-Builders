import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function ConstructionSite() {
  const mountRef = useRef(null);
  const ctrl = useRef({ down: false, lx: 0, rotY: 0.35, camZ: 75 });
  const rafRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const iv = setInterval(() => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // ── RENDERER ──────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050a12);
    scene.fog = new THREE.FogExp2(0x050a12, 0.0065);

    const camera = new THREE.PerspectiveCamera(44, el.clientWidth / el.clientHeight, 0.1, 500);
    camera.position.set(0, 38, 75);
    camera.lookAt(0, 7, 0);

    // ── LIGHTS ────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1a2d44, 5.5));

    const sun = new THREE.DirectionalLight(0xfff8e8, 5.5);
    sun.position.set(55, 100, 45);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
    sun.shadow.camera.top  =  80; sun.shadow.camera.bottom = -30;
    sun.shadow.camera.far  = 280; sun.shadow.bias = -0.0015;
    scene.add(sun);

    const blueRim = new THREE.DirectionalLight(0x3366bb, 1.6);
    blueRim.position.set(-50, 30, -40);
    scene.add(blueRim);

    scene.add(new THREE.HemisphereLight(0x1a2d44, 0x0a0c08, 1.8));

    // Work flood lights
    const flood1 = new THREE.PointLight(0xffcc44, 3.5, 65);
    flood1.position.set(-22, 18, -14);
    scene.add(flood1);
    const flood2 = new THREE.PointLight(0xffcc44, 3.5, 65);
    flood2.position.set(22, 18, -14);
    scene.add(flood2);

    // ── ROOT GROUP ────────────────────────────────────
    const root = new THREE.Group();
    scene.add(root);

    // ── HELPERS ───────────────────────────────────────
    // M: material factory
    const M = (hex, r = 0.82, m = 0.05, ex = {}) =>
      new THREE.MeshStandardMaterial({ color: hex, roughness: r, metalness: m, ...ex });

    // BX: box, y = BOTTOM face of box
    const BX = (parent, w, h, d, mat, x, y, z, ry = 0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y + h * 0.5, z);
      if (ry) mesh.rotation.y = ry;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // CY: cylinder, y = BOTTOM face
    const CY = (parent, rt, rb, h, seg, mat, x, y, z) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
      mesh.position.set(x, y + h * 0.5, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // ── SHARED MATERIALS ──────────────────────────────
    const mat = {
      dirt:    M(0x4a3a20, 0.97),
      dirt2:   M(0x6b4c2a, 0.97),
      conc:    M(0x8a9298, 0.84, 0.04),
      dkConc:  M(0x3c4450, 0.90, 0.02),
      steel:   M(0xb8cad4, 0.14, 0.96),
      glass:   M(0x5599cc, 0.04, 0.10, { transparent: true, opacity: 0.72 }),
      glassLt: M(0xf5e090, 0.04, 0.05, { transparent: true, opacity: 0.65, emissive: 0xd49000, emissiveIntensity: 0.3 }),
      rebar:   M(0x607888, 0.40, 0.80),
      scaff:   M(0xd4a030, 0.48, 0.55),
      plank:   M(0x8b5e3c, 0.88),
      road:    M(0x181e28, 0.96),
      stripe:  M(0xffd060, 0.5, 0, { emissive: 0xffa000, emissiveIntensity: 0.25 }),
      cone:    M(0xff4400, 0.60),
      lamp:    M(0xffffcc, 0.15, 0.2, { emissive: 0xffffcc, emissiveIntensity: 1.1 }),
      fPost:   M(0xb07818, 0.60, 0.30),
      fence:   M(0xd4a020, 0.55, 0.45),
      gold:    M(0xd4960e, 0.28, 0.72, { emissive: 0x7a4400, emissiveIntensity: 0.1 }),
      shed:    M(0x4a7030, 0.70),
      bags:    M(0xdddccc, 0.88),
      brick:   M(0xbb4422, 0.85),
      rock:    M(0x4a4038, 0.95),
      tyre:    M(0x111111, 0.96),
      rim:     M(0x555a60, 0.40, 0.65),
      // Vehicles
      excOr:   M(0xE8A200, 0.40, 0.20),
      excDark: M(0x222222, 0.70, 0.20),
      excCab:  M(0x88aacc, 0.05, 0.10, { transparent: true, opacity: 0.65 }),
      dumpYel: M(0xF0C000, 0.38, 0.22),
      mixRed:  M(0xCC2200, 0.42, 0.22),
      mixDrum: M(0xDD8800, 0.38, 0.25),
      bullYel: M(0xE0A800, 0.40, 0.20),
      forkRed: M(0xDD1111, 0.38, 0.22),
      trkBody: M(0x252830, 0.85, 0.30),
      chrm:    M(0xccddee, 0.08, 0.98),
      // Workers
      skin:    M(0xddbb99, 0.90),
      jeans:   M(0x1e3a7a, 0.90),
      vest:    M(0xff6600, 0.65),
      vestY:   M(0xffaa00, 0.65),
      helmY:   M(0xFFCC00, 0.45, 0.10),
      helmW:   M(0xffffff, 0.45, 0.10),
      helmR:   M(0xff2200, 0.45, 0.10),
      helmO:   M(0xff8800, 0.45, 0.10),
    };

    // ═══════════════════════════════════════════════════
    // 1. TERRAIN & GROUND
    // ═══════════════════════════════════════════════════
    const groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      M(0x070d08, 0.99)
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    // Site pad (slightly raised)
    BX(root, 80, 0.24, 66, mat.dirt, 0, 0, 0);

    // Compacted gravel paths inside site
    BX(root, 78, 0.06, 12, M(0x606870, 0.92), 0, 0.24, 0);      // main internal road
    BX(root, 12, 0.06, 64, M(0x606870, 0.92), 0, 0.24, 0);      // cross road

    // Road (surrounding)
    BX(root, 10, 0.20, 68, mat.road, -31, 0, 0);
    BX(root, 10, 0.20, 68, mat.road,  31, 0, 0);
    BX(root, 80, 0.20, 10, mat.road,   0, 0, 29);

    // Road stripes
    for (let i = -6; i <= 6; i++) {
      BX(root, 0.25, 0.02, 3.0, mat.stripe, -31, 0.21, i * 5.5);
      BX(root, 0.25, 0.02, 3.0, mat.stripe,  31, 0.21, i * 5.5);
    }

    // ═══════════════════════════════════════════════════
    // 2. SITE FENCE
    // ═══════════════════════════════════════════════════
    const FX = 36, FZ = 31;
    // Posts
    for (let i = -7; i <= 7; i++) {
      BX(root, 0.16, 2.6, 0.16, mat.fPost,  i * 5.1, 0.24,  FZ);
      BX(root, 0.16, 2.6, 0.16, mat.fPost,  i * 5.1, 0.24, -FZ);
    }
    for (let i = -6; i <= 6; i++) {
      BX(root, 0.16, 2.6, 0.16, mat.fPost, -FX, 0.24, i * 5.1);
      BX(root, 0.16, 2.6, 0.16, mat.fPost,  FX, 0.24, i * 5.1);
    }
    // Rails
    BX(root, 72, 0.07, 0.07, mat.fence, 0, 1.8,  FZ);
    BX(root, 72, 0.07, 0.07, mat.fence, 0, 1.1,  FZ);
    BX(root, 72, 0.07, 0.07, mat.fence, 0, 1.8, -FZ);
    BX(root, 72, 0.07, 0.07, mat.fence, 0, 1.1, -FZ);
    BX(root, 0.07, 0.07, 62, mat.fence, -FX, 1.8, 0);
    BX(root, 0.07, 0.07, 62, mat.fence,  FX, 1.8, 0);
    // Gate
    BX(root, 0.28, 3.2, 0.28, mat.gold, -4.5, 0.24, FZ);
    BX(root, 0.28, 3.2, 0.28, mat.gold,  4.5, 0.24, FZ);
    BX(root, 9.5, 0.24, 0.24, mat.gold, 0, 3.2, FZ);
    // Warning sign on fence
    BX(root, 4.5, 2.4, 0.26, M(0xf5a500, 0.50), 0, 0.24, FZ + 0.2);

    // ═══════════════════════════════════════════════════
    // 3. BUILDING UNDER CONSTRUCTION
    // ═══════════════════════════════════════════════════
    const BLD_X = 0, BLD_Z = -6;
    const BW = 26, BD = 18, WALL = 0.45;

    // Foundation
    BX(root, BW + 2.5, 1.6, BD + 2.5, M(0x4a5060, 0.92, 0.03), BLD_X, 0.24, BLD_Z);

    // Floor builder function - returns top-of-walls Y
    const buildFloor = (bottomY, wallH, complete) => {
      // Slab
      BX(root, BW, 0.35, BD, mat.conc, BLD_X, bottomY, BLD_Z);
      const wallBase = bottomY + 0.35;
      if (!complete) return wallBase;

      // Walls
      BX(root, BW, wallH, WALL, mat.dkConc, BLD_X, wallBase, BLD_Z + BD * 0.5);
      BX(root, BW, wallH, WALL, mat.dkConc, BLD_X, wallBase, BLD_Z - BD * 0.5);
      BX(root, WALL, wallH, BD, mat.dkConc, BLD_X - BW * 0.5, wallBase, BLD_Z);
      BX(root, WALL, wallH, BD, mat.dkConc, BLD_X + BW * 0.5, wallBase, BLD_Z);

      // Corner columns
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([sx,sz]) =>
        BX(root, 0.45, wallH, 0.45, mat.steel,
          BLD_X + sx * (BW*0.5 - 0.2), wallBase, BLD_Z + sz * (BD*0.5 - 0.2))
      );
      // Mid columns
      [-BW*0.25, 0, BW*0.25].forEach(cx =>
        BX(root, 0.38, wallH, 0.38, mat.steel, BLD_X+cx, wallBase, BLD_Z+BD*0.5-0.2)
      );

      // Windows
      for (let w = -4; w <= 4; w++) {
        const gm = (w % 2 === 0) ? mat.glassLt : mat.glass;
        BX(root, 2.5, wallH - 0.9, 0.09, gm, BLD_X+w*2.8, wallBase+0.45, BLD_Z+BD*0.5+0.06);
        BX(root, 2.5, wallH - 0.9, 0.09, mat.glass, BLD_X+w*2.8, wallBase+0.45, BLD_Z-BD*0.5-0.06);
      }

      // Gold accent band
      BX(root, BW+0.2, 0.15, BD+0.2, mat.gold, BLD_X, wallBase+wallH-0.075, BLD_Z);

      return wallBase + wallH;
    };

    const T1 = buildFloor(1.84, 4.0, true);
    const T2 = buildFloor(T1,   3.6, true);
    // Floor 3 slab only
    BX(root, BW, 0.35, BD, mat.conc, BLD_X, T2, BLD_Z);
    const F3B = T2 + 0.35;

    // Steel frame floor 3
    const stCols = [
      [-12, 8.8], [-12, -8.8], [-6, 8.8], [-6, -8.8],
      [0,   8.8], [0,   -8.8], [ 6, 8.8], [ 6, -8.8],
      [12,  8.8], [12,  -8.8],
    ];
    stCols.forEach(([cx, cz]) =>
      BX(root, 0.36, 4.5, 0.36, mat.steel, BLD_X+cx, F3B, BLD_Z+cz)
    );
    const beamTop = F3B + 4.5;
    BX(root, BW, 0.26, 0.26, mat.steel, BLD_X, beamTop, BLD_Z+8.8);
    BX(root, BW, 0.26, 0.26, mat.steel, BLD_X, beamTop, BLD_Z-8.8);
    BX(root, 0.26, 0.26, BD,  mat.steel, BLD_X-12, beamTop, BLD_Z);
    BX(root, 0.26, 0.26, BD,  mat.steel, BLD_X+12, beamTop, BLD_Z);
    BX(root, 0.26, 0.26, BD,  mat.steel, BLD_X,    beamTop, BLD_Z);

    // Rebar sticking up
    for (let r = 0; r < 22; r++) {
      CY(root, 0.04, 0.04, 1.8 + Math.random() * 0.8, 6, mat.rebar,
        BLD_X + (Math.random()-0.5)*23, T2+0.35, BLD_Z + (Math.random()-0.5)*15);
    }

    // ── Scaffolding ──
    const SF = BLD_Z + BD*0.5 + 1.6;
    const SB = BLD_Z - BD*0.5 - 1.6;
    const SCAFF_FH = 4.0;
    for (let lv = 0; lv < 3; lv++) {
      const sy = lv * SCAFF_FH;
      for (let sx = -13; sx <= 13; sx += 3.25) {
        CY(root, 0.075, 0.075, SCAFF_FH, 8, mat.scaff, BLD_X+sx, sy, SF);
        CY(root, 0.075, 0.075, SCAFF_FH, 8, mat.scaff, BLD_X+sx, sy, SB);
      }
      BX(root, 28.5, 0.07, 0.07, mat.scaff, BLD_X, sy+SCAFF_FH-0.04, SF);
      BX(root, 28.5, 0.07, 0.07, mat.scaff, BLD_X, sy+SCAFF_FH*0.5,  SF);
      BX(root, 28.5, 0.07, 0.07, mat.scaff, BLD_X, sy+SCAFF_FH-0.04, SB);
      BX(root, 28.5, 0.07, 0.07, mat.scaff, BLD_X, sy+SCAFF_FH*0.5,  SB);
      // Planks
      for (let p = -1; p <= 1; p++) {
        BX(root, 28.0, 0.10, 0.55, mat.plank, BLD_X, sy+SCAFF_FH-0.05, SF+p*0.24);
        BX(root, 28.0, 0.10, 0.55, mat.plank, BLD_X, sy+SCAFF_FH-0.05, SB+p*0.24);
      }
    }

    // ═══════════════════════════════════════════════════
    // 4. TOWER CRANE (complete, realistic)
    // ═══════════════════════════════════════════════════
    const craneG = new THREE.Group();
    craneG.position.set(26, 0, -4);
    root.add(craneG);

    // Mast — 16 sections, 4-chord lattice
    const MN = 16, MFH = 2.2;
    for (let f = 0; f < MN; f++) {
      const y = f * MFH;
      [[-0.52,-0.52],[-0.52,0.52],[0.52,-0.52],[0.52,0.52]].forEach(([cx,cz]) =>
        BX(craneG, 0.22, MFH, 0.22, mat.excOr, cx, y, cz)
      );
      // Horizontal bracing at top and mid of each section
      BX(craneG, 1.12, 0.07, 0.07, mat.excOr, 0, y+MFH-0.04, -0.52);
      BX(craneG, 1.12, 0.07, 0.07, mat.excOr, 0, y+MFH-0.04,  0.52);
      BX(craneG, 0.07, 0.07, 1.12, mat.excOr, -0.52, y+MFH-0.04, 0);
      BX(craneG, 0.07, 0.07, 1.12, mat.excOr,  0.52, y+MFH-0.04, 0);
      BX(craneG, 1.12, 0.07, 0.07, mat.excOr, 0, y+MFH*0.5, -0.52);
      BX(craneG, 1.12, 0.07, 0.07, mat.excOr, 0, y+MFH*0.5,  0.52);
      BX(craneG, 0.07, 0.07, 1.12, mat.excOr, -0.52, y+MFH*0.5, 0);
      BX(craneG, 0.07, 0.07, 1.12, mat.excOr,  0.52, y+MFH*0.5, 0);
    }
    const MASTH = MN * MFH;

    // Slewing platform + cab
    BX(craneG, 2.8, 0.55, 2.8, mat.excOr, 0, MASTH, 0);
    BX(craneG, 2.4, 2.2, 2.4, mat.excOr, 0, MASTH+0.55, 0);
    BX(craneG, 2.0, 1.85, 2.0, mat.excCab, 0, MASTH+0.7, 0);

    // Jib group (rotates Y)
    const jibG = new THREE.Group();
    jibG.position.set(0, MASTH+2.75, 0);
    craneG.add(jibG);

    const JL = 22, CL = 9;
    // Main jib
    BX(jibG, JL, 0.28, 0.28, mat.excOr, -(JL*0.5 - CL*0.5 - 0.3), 0, 0);
    // Counter jib
    BX(jibG, CL, 0.28, 0.28, mat.excOr, CL*0.5 + 0.5, 0, 0);
    // A-frame mast
    BX(jibG, 0.14, 6.5, 0.14, mat.excOr, 0, 0.14, 0);
    // Struts (from A-frame tip to jib tip)
    const strutMat = M(0xFFCC00, 0.4, 0.22);
    BX(jibG, 0.09, 0.09, 0.09, strutMat, -(JL-CL)*0.45, 6.4, 0);
    // Counterweight
    BX(jibG, 4.5, 2.2, 2.0, M(0x222222, 0.80), CL+1.5, 0.14, 0);

    // Trolley (moves along jib)
    const trolleyG = new THREE.Group();
    trolleyG.position.set(-JL*0.5, -0.22, 0);
    jibG.add(trolleyG);
    BX(trolleyG, 0.7, 0.4, 0.7, M(0xff2200, 0.4, 0.3), 0, 0, 0);

    // Cable + hook
    const cableGroup = new THREE.Group();
    cableGroup.position.set(0, -0.4, 0);
    trolleyG.add(cableGroup);
    const cableMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,1,6), mat.steel);
    cableMesh.castShadow = false;
    cableGroup.add(cableMesh);
    const hookG = new THREE.Group();
    hookG.position.set(0, -1.25, 0);
    cableGroup.add(hookG);
    BX(hookG, 0.75, 0.5, 0.42, mat.steel, 0, 0, 0);
    // Hook curve
    const hkGeo = new THREE.TorusGeometry(0.28, 0.07, 8, 14, Math.PI);
    const hkMesh = new THREE.Mesh(hkGeo, mat.steel);
    hkMesh.rotation.z = Math.PI;
    hkMesh.position.set(0, -0.58, 0);
    hookG.add(hkMesh);
    // Hanging load
    [-0.32, 0, 0.32].forEach(bz => BX(hookG, 4.8, 0.26, 0.26, mat.steel, 0, -1.0, bz));

    // ═══════════════════════════════════════════════════
    // 5. EXCAVATOR (no overlap, correct proportions)
    // ═══════════════════════════════════════════════════
    const excRoot = new THREE.Group();
    excRoot.position.set(-22, 0.30, 14);
    excRoot.rotation.y = 0.55;
    root.add(excRoot);

    // ── Undercarriage (ground level) ──
    const UC_W = 6.8, UC_H = 0.9, UC_TRACK_W = 1.55;
    BX(excRoot, UC_W, UC_H, UC_TRACK_W, M(0x1a1a1a, 0.95), 0, 0, -(UC_TRACK_W*0.5 + 0.42));
    BX(excRoot, UC_W, UC_H, UC_TRACK_W, M(0x1a1a1a, 0.95), 0, 0,  (UC_TRACK_W*0.5 + 0.42));
    // Track detail - cleats
    for (let tc = -3; tc <= 3; tc++) {
      BX(excRoot, UC_W, 0.12, UC_TRACK_W+0.1, M(0x2a2a2a, 0.90), 0, UC_H, tc*0.55-0.55, 0);
    }
    // Sprocket wheels
    [-3.0, -1.5, 0, 1.5, 3.0].forEach(wx => {
      CY(excRoot, 0.5, 0.5, UC_TRACK_W*2+0.88, 12, M(0x2a2a2a, 0.70, 0.50), wx, UC_H*0.5, 0);
    });
    // Track frame center bar
    BX(excRoot, UC_W, UC_H-0.1, 1.2, M(0x333333, 0.85), 0, 0.05, 0);

    // ── Upper body (sits on undercarriage) ──
    const UB_Y = UC_H;   // top of undercarriage
    const UB_H = 1.7;
    BX(excRoot, 5.8, UB_H, 2.4, mat.excOr, 0, UB_Y, 0);
    // Engine cover / back hump
    BX(excRoot, 2.2, 0.65, 2.2, mat.excOr, 1.5, UB_Y+UB_H, 0.1);
    // Counterweight rear
    BX(excRoot, 2.8, 1.1, 2.5, M(0x1a1e22, 0.88), 2.2, UB_Y, 0);
    // Exhaust pipe
    CY(excRoot, 0.09, 0.09, 1.8, 8, M(0x888888, 0.50, 0.40), 2.55, UB_Y+UB_H, -0.7);
    CY(excRoot, 0.14, 0.09, 0.22, 8, M(0x888888, 0.50, 0.40), 2.55, UB_Y+UB_H+1.8, -0.7);

    // ── Cab (on top of upper body, offset to front-left) ──
    const CAB_Y = UB_Y + UB_H;
    const CAB_H = 2.1;
    BX(excRoot, 2.7, CAB_H, 2.35, mat.excOr, -0.6, CAB_Y, 0);
    // Cab glass (slightly inset on all sides)
    BX(excRoot, 2.3, 1.75, 0.10, mat.excCab, -0.6, CAB_Y+0.18, 1.18);    // front glass
    BX(excRoot, 2.3, 1.75, 0.10, mat.excCab, -0.6, CAB_Y+0.18, -1.18);   // rear glass
    BX(excRoot, 0.10, 1.75, 2.0, mat.excCab, -1.95, CAB_Y+0.18, 0);      // left glass
    BX(excRoot, 0.10, 1.75, 2.0, mat.excCab, 0.75,  CAB_Y+0.18, 0);      // right glass
    BX(excRoot, 2.7,  0.22, 2.35, mat.excOr, -0.6, CAB_Y+CAB_H-0.11, 0); // roof

    // ── Arm system (boom → stick → bucket) ──
    // Boom pivot: right front of upper body
    const boomPiv = new THREE.Group();
    boomPiv.position.set(-2.7, UB_Y + 1.0, 0);
    excRoot.add(boomPiv);
    boomPiv.rotation.z = 0.25; // natural rest angle

    // Boom: tapered rectangular arm
    const boomMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 4.2, 0.36),
      mat.excOr
    );
    boomMesh.position.set(0, 2.1, 0);  // pivot is at bottom of boom
    boomMesh.castShadow = true;
    boomPiv.add(boomMesh);

    // Stick pivot (at tip of boom)
    const stickPiv = new THREE.Group();
    stickPiv.position.set(0, 4.2, 0);
    boomPiv.add(stickPiv);
    stickPiv.rotation.z = 0.45;

    const stickMesh = new THREE.Mesh(new THREE.BoxGeometry(0.30, 3.0, 0.30), mat.excOr);
    stickMesh.position.set(0, 1.5, 0);
    stickMesh.castShadow = true;
    stickPiv.add(stickMesh);

    // Bucket pivot (at tip of stick)
    const bucketPiv = new THREE.Group();
    bucketPiv.position.set(0, 3.0, 0);
    stickPiv.add(bucketPiv);
    bucketPiv.rotation.z = -0.55;

    // Bucket body
    BX(bucketPiv, 0.22, 0.60, 1.40, mat.excOr, -0.55, 0, 0);
    BX(bucketPiv, 1.22, 0.22, 1.40, mat.excOr, 0, 0, 0);
    BX(bucketPiv, 1.22, 0.60, 0.22, mat.excOr, 0, 0, -0.72);
    BX(bucketPiv, 1.22, 0.60, 0.22, mat.excOr, 0, 0,  0.72);
    // Cutting teeth
    [-0.45, -0.15, 0.15, 0.45].forEach(tz =>
      BX(bucketPiv, 0.28, 0.12, 0.10, M(0xcccccc, 0.15, 0.90), -0.95, -0.28, tz)
    );

    // Hydraulic cylinders (visual only - fixed positions)
    BX(excRoot, 0.12, 2.8, 0.12, mat.chrm, -2.45, UB_Y+1.0, 0.35);
    BX(excRoot, 0.12, 2.8, 0.12, mat.chrm, -2.45, UB_Y+1.0, -0.35);

    // ═══════════════════════════════════════════════════
    // 6. DUMP TRUCK (precise, no overlap)
    // ═══════════════════════════════════════════════════
    const dumpRoot = new THREE.Group();
    dumpRoot.position.set(-11, 0.30, 20);
    dumpRoot.rotation.y = 0.6;
    root.add(dumpRoot);

    // ── Chassis: bottom reference = y=0 in dumpRoot ──
    const CH_H  = 0.55;  // chassis height
    const WH_R  = 0.78;  // wheel radius
    const WH_W  = 0.55;  // wheel width
    const WH_Y  = WH_R;  // wheel center Y (touching ground)
    const CH_Y  = WH_R + 0.04; // chassis bottom rests on axle tops

    // Main chassis rail (long, thin)
    BX(dumpRoot, 9.0, CH_H, 0.45, mat.trkBody, 0, CH_Y, -1.1);
    BX(dumpRoot, 9.0, CH_H, 0.45, mat.trkBody, 0, CH_Y,  1.1);
    BX(dumpRoot, 0.45, CH_H, 2.7, mat.trkBody, -4.3, CH_Y, 0);
    BX(dumpRoot, 0.45, CH_H, 2.7, mat.trkBody,  4.3, CH_Y, 0);
    BX(dumpRoot, 0.45, CH_H, 2.7, mat.trkBody, 0, CH_Y, 0);

    // ── Cab ──
    const CAB_BASE = CH_Y + CH_H;
    BX(dumpRoot, 3.0, 2.8, 2.9, mat.dumpYel, -3.0, CAB_BASE, 0);
    // Windshield
    BX(dumpRoot, 2.5, 1.9, 0.10, mat.excCab, -3.0, CAB_BASE+0.45, 1.46);
    // Side windows
    BX(dumpRoot, 0.10, 1.5, 1.8, mat.excCab, -4.5, CAB_BASE+0.65, 0);
    BX(dumpRoot, 0.10, 1.5, 1.8, mat.excCab, -1.5, CAB_BASE+0.65, 0);
    // Cab roof
    BX(dumpRoot, 3.0, 0.18, 2.9, mat.dumpYel, -3.0, CAB_BASE+2.8-0.09, 0);
    // Bumper / front grille
    BX(dumpRoot, 0.22, 1.5, 2.9, mat.trkBody, -4.65, CAB_BASE, 0);
    BX(dumpRoot, 0.22, 0.4, 2.9, mat.chrm, -4.65, CAB_BASE+0.9, 0);
    // Headlights
    BX(dumpRoot, 0.08, 0.28, 0.42,
      M(0xffffcc, 0.1, 0.1, { emissive: 0xffffcc, emissiveIntensity: 0.6 }),
      -4.7, CAB_BASE+1.2, -0.9);
    BX(dumpRoot, 0.08, 0.28, 0.42,
      M(0xffffcc, 0.1, 0.1, { emissive: 0xffffcc, emissiveIntensity: 0.6 }),
      -4.7, CAB_BASE+1.2,  0.9);
    // Exhaust
    CY(dumpRoot, 0.09, 0.09, 1.5, 8, M(0x888888, 0.50, 0.40), -2.1, CAB_BASE+2.8, -1.1);

    // ── Dump bed (pivot at rear of chassis) ──
    const bedPivot = new THREE.Group();
    bedPivot.position.set(3.5, CH_Y + CH_H, 0);
    dumpRoot.add(bedPivot);

    // Bed floor
    BX(bedPivot, 6.2, 0.22, 3.0, mat.dumpYel, 0, 0, 0);
    // Bed walls
    BX(bedPivot, 6.2, 1.8, 0.22, mat.dumpYel, 0, 0.22, -1.5);
    BX(bedPivot, 6.2, 1.8, 0.22, mat.dumpYel, 0, 0.22,  1.5);
    BX(bedPivot, 0.22, 1.8, 3.0, mat.dumpYel, -3.1, 0.22, 0);
    // Tailgate (hinged - stays closed when not tilting)
    BX(bedPivot, 0.22, 1.8, 3.0, mat.dumpYel, 3.1, 0.22, 0);
    // Dirt load
    BX(bedPivot, 5.8, 1.1, 2.6, mat.dirt2, 0, 0.22, 0);
    // Hydraulic ram (visual)
    BX(dumpRoot, 0.20, 2.2, 0.20, mat.chrm, 2.5, CH_Y+CH_H, 0);

    // ── Wheels (6 total, correct positions) ──
    const addWheel = (px, pz) => {
      // Tyre
      const t = new THREE.Mesh(new THREE.CylinderGeometry(WH_R, WH_R, WH_W, 16), mat.tyre);
      t.rotation.x = Math.PI / 2;
      t.position.set(px, WH_Y, pz);
      t.castShadow = true;
      dumpRoot.add(t);
      // Rim
      const r = new THREE.Mesh(new THREE.CylinderGeometry(WH_R*0.55, WH_R*0.55, WH_W+0.06, 12), mat.rim);
      r.rotation.x = Math.PI / 2;
      r.position.set(px, WH_Y, pz);
      dumpRoot.add(r);
      // Hub
      CY(dumpRoot, 0.14, 0.14, WH_W+0.10, 8, M(0x888888, 0.4, 0.7), px, WH_Y - 0.14*0.5 + 0.07, pz);
    };
    // Front axle (2 wheels), rear bogies (4 wheels)
    [[-3.8, -1.45], [-3.8, 1.45],   // front
      [2.0, -1.45],  [2.0,  1.45],  // rear1
      [3.6, -1.45],  [3.6,  1.45]]  // rear2
      .forEach(([px, pz]) => addWheel(px, pz));

    // ═══════════════════════════════════════════════════
    // 7. CONCRETE MIXER TRUCK
    // ═══════════════════════════════════════════════════
    const mixRoot = new THREE.Group();
    mixRoot.position.set(15, 0.30, 18);
    mixRoot.rotation.y = -1.45;
    root.add(mixRoot);

    const MWH_R = 0.72, MWH_W = 0.50, MWH_Y = MWH_R;
    const MCH_H = 0.52, MCH_Y = MWH_Y + 0.05;

    // Chassis
    BX(mixRoot, 9.5, MCH_H, 0.50, mat.trkBody, 0, MCH_Y, -1.1);
    BX(mixRoot, 9.5, MCH_H, 0.50, mat.trkBody, 0, MCH_Y,  1.1);
    BX(mixRoot, 0.50, MCH_H, 2.7, mat.trkBody, -4.5, MCH_Y, 0);
    BX(mixRoot, 0.50, MCH_H, 2.7, mat.trkBody,  4.5, MCH_Y, 0);

    const MCAB_BASE = MCH_Y + MCH_H;
    // Cab
    BX(mixRoot, 2.9, 2.7, 2.8, mat.mixRed, -3.3, MCAB_BASE, 0);
    BX(mixRoot, 2.4, 1.85, 0.10, mat.excCab, -3.3, MCAB_BASE+0.42, 1.42);
    BX(mixRoot, 0.10, 1.55, 1.9, mat.excCab, -4.75, MCAB_BASE+0.55, 0);
    BX(mixRoot, 0.10, 1.55, 1.9, mat.excCab, -1.85, MCAB_BASE+0.55, 0);
    BX(mixRoot, 2.9, 0.18, 2.8, mat.mixRed, -3.3, MCAB_BASE+2.7-0.09, 0);
    BX(mixRoot, 0.22, 1.4, 2.8, mat.trkBody, -4.8, MCAB_BASE, 0);
    // Headlights
    BX(mixRoot, 0.08, 0.28, 0.42,
      M(0xffffcc, 0.1, 0.1, { emissive: 0xffffcc, emissiveIntensity: 0.6 }),
      -4.86, MCAB_BASE+1.1, -0.85);
    BX(mixRoot, 0.08, 0.28, 0.42,
      M(0xffffcc, 0.1, 0.1, { emissive: 0xffffcc, emissiveIntensity: 0.6 }),
      -4.86, MCAB_BASE+1.1,  0.85);
    // Exhaust
    CY(mixRoot, 0.09, 0.09, 1.4, 8, M(0x888888, 0.50, 0.40), -2.2, MCAB_BASE+2.7, -1.1);

    // Water tank (between cab and drum)
    BX(mixRoot, 1.5, 1.1, 2.2, M(0x2255aa, 0.65, 0.30), -1.2, MCAB_BASE, 0);

    // Drum sub-frame
    BX(mixRoot, 5.5, 0.55, 2.6, M(0x333840, 0.80, 0.25), 2.0, MCAB_BASE, 0);

    // Drum (rotating) - group to allow spin
    const drumG = new THREE.Group();
    drumG.position.set(2.2, MCAB_BASE + 0.55 + 1.18, 0);
    drumG.rotation.z = 0.28;  // slight tilt
    mixRoot.add(drumG);

    const drumMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.18, 0.95, 4.8, 18), mat.mixDrum
    );
    drumMesh.castShadow = true;
    drumG.add(drumMesh);
    // Drum ribs
    for (let r = -4; r <= 4; r++) {
      const rib = new THREE.Mesh(
        new THREE.CylinderGeometry(1.21, 0.98, 0.14, 18), M(0x1a1a1a, 0.80)
      );
      rib.position.y = r * 0.55;
      drumG.add(rib);
    }
    // Drum discharge chute
    BX(mixRoot, 2.6, 0.15, 0.38, M(0x888888, 0.60, 0.40), 5.0, MCAB_BASE+0.55, 0);

    // Wheels
    const addMixWheel = (px, pz) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(MWH_R, MWH_R, MWH_W, 16), mat.tyre);
      t.rotation.x = Math.PI / 2;
      t.position.set(px, MWH_Y, pz);
      t.castShadow = true;
      mixRoot.add(t);
      const r = new THREE.Mesh(new THREE.CylinderGeometry(MWH_R*0.52, MWH_R*0.52, MWH_W+0.06, 12), mat.rim);
      r.rotation.x = Math.PI / 2;
      r.position.set(px, MWH_Y, pz);
      mixRoot.add(r);
    };
    [[-3.5,-1.35],[-3.5,1.35],[1.2,-1.35],[1.2,1.35],[2.8,-1.35],[2.8,1.35]]
      .forEach(([px,pz]) => addMixWheel(px, pz));

    // ═══════════════════════════════════════════════════
    // 8. BULLDOZER (precise, no overlap)
    // ═══════════════════════════════════════════════════
    const bullRoot = new THREE.Group();
    bullRoot.position.set(-8, 0.30, 21);
    bullRoot.rotation.y = -0.25;
    root.add(bullRoot);

    const BUL_TRK_W = 1.6;
    const BUL_TRK_H = 0.82;

    // Tracks (left and right)
    BX(bullRoot, 6.2, BUL_TRK_H, BUL_TRK_W, M(0x1a1a1a, 0.95), 0, 0, -(BUL_TRK_W*0.5+0.45));
    BX(bullRoot, 6.2, BUL_TRK_H, BUL_TRK_W, M(0x1a1a1a, 0.95), 0, 0,  (BUL_TRK_W*0.5+0.45));
    // Track grouser detail
    for (let tc = -3; tc <= 3; tc++) {
      BX(bullRoot, 6.2, 0.11, BUL_TRK_W+0.12, M(0x2a2a2a, 0.90), 0, BUL_TRK_H, tc*0.52, 0);
    }
    // Idler and sprocket
    [-2.8, 2.8].forEach(wx => {
      CY(bullRoot, 0.50, 0.50, BUL_TRK_W*2+0.95, 12, M(0x2a2a2a, 0.70, 0.50), wx, BUL_TRK_H*0.5, 0);
    });
    CY(bullRoot, 0.32, 0.32, BUL_TRK_W*2+0.95, 10, M(0x333333, 0.80), 0, BUL_TRK_H*0.5, 0);

    // Main body (sits on tracks)
    const BUL_BODY_Y = BUL_TRK_H;
    BX(bullRoot, 5.2, 1.7, 2.8, mat.bullYel, 0, BUL_BODY_Y, 0);
    // Engine deck
    BX(bullRoot, 2.4, 0.65, 2.6, mat.bullYel, 1.2, BUL_BODY_Y+1.7, 0.1);
    // Exhaust stack
    CY(bullRoot, 0.09, 0.09, 1.6, 8, M(0x888888, 0.50, 0.40), 2.2, BUL_BODY_Y+1.7, -0.8);
    CY(bullRoot, 0.15, 0.09, 0.24, 8, M(0x888888, 0.50, 0.40), 2.2, BUL_BODY_Y+1.7+1.6, -0.8);

    // Cab
    const BUL_CAB_Y = BUL_BODY_Y + 1.7;
    const BUL_CAB_H = 2.1;
    BX(bullRoot, 2.6, BUL_CAB_H, 2.7, mat.bullYel, -0.4, BUL_CAB_Y, 0);
    BX(bullRoot, 2.2, 1.72, 0.10, mat.excCab, -0.4, BUL_CAB_Y+0.18, 1.36);
    BX(bullRoot, 2.2, 1.72, 0.10, mat.excCab, -0.4, BUL_CAB_Y+0.18, -1.36);
    BX(bullRoot, 0.10, 1.72, 2.2, mat.excCab, -1.7, BUL_CAB_Y+0.18, 0);
    BX(bullRoot, 0.10, 1.72, 2.2, mat.excCab, 0.9,  BUL_CAB_Y+0.18, 0);
    BX(bullRoot, 2.6, 0.20, 2.7, mat.bullYel, -0.4, BUL_CAB_Y+BUL_CAB_H-0.10, 0);

    // ROPS (rollover protection frame)
    BX(bullRoot, 0.10, 0.10, 2.7, mat.steel, -1.5, BUL_CAB_Y+BUL_CAB_H, 0);
    BX(bullRoot, 0.10, 0.10, 2.7, mat.steel,  0.7, BUL_CAB_Y+BUL_CAB_H, 0);

    // Blade + push frame
    BX(bullRoot, 0.25, 3.0, 4.2, mat.bullYel, -3.7, BUL_BODY_Y+0.5, 0);
    // Blade cutting edge
    BX(bullRoot, 0.20, 3.0, 4.2, M(0xcccccc, 0.15, 0.90), -3.85, BUL_BODY_Y+0.5, 0);
    // Push arms
    BX(bullRoot, 3.2, 0.20, 0.20, mat.bullYel, -2.1, BUL_BODY_Y+0.9, 1.5);
    BX(bullRoot, 3.2, 0.20, 0.20, mat.bullYel, -2.1, BUL_BODY_Y+0.9, -1.5);
    // Hydraulic cylinders
    BX(bullRoot, 2.8, 0.15, 0.15, mat.chrm, -2.0, BUL_BODY_Y+1.5,  0.7);
    BX(bullRoot, 2.8, 0.15, 0.15, mat.chrm, -2.0, BUL_BODY_Y+1.5, -0.7);

    // ═══════════════════════════════════════════════════
    // 9. FORKLIFT (clean & realistic)
    // ═══════════════════════════════════════════════════
    const forkRoot = new THREE.Group();
    forkRoot.position.set(20, 0.30, 13);
    forkRoot.rotation.y = 2.25;
    root.add(forkRoot);

    const FK_WH_R = 0.40, FK_WH_Y = FK_WH_R;

    // Body/counterweight
    BX(forkRoot, 3.2, 1.4, 1.9, mat.forkRed, 0, FK_WH_Y*2, 0);
    // Counterweight (rear)
    BX(forkRoot, 0.65, 1.3, 1.9, M(0x1a1a1a, 0.88), 1.65, FK_WH_Y*2, 0);
    // Engine cover
    BX(forkRoot, 1.4, 0.45, 1.7, mat.forkRed, 0.6, FK_WH_Y*2+1.4, 0.1);

    // Cab with ROPS
    const FK_CAB_Y = FK_WH_Y*2 + 1.4;
    BX(forkRoot, 1.9, 2.1, 1.8, mat.forkRed, -0.35, FK_CAB_Y, 0);
    BX(forkRoot, 1.6, 1.75, 0.10, mat.excCab, -0.35, FK_CAB_Y+0.17, 0.91);
    BX(forkRoot, 0.10, 1.75, 1.5, mat.excCab, -1.25, FK_CAB_Y+0.17, 0);
    BX(forkRoot, 0.10, 1.75, 1.5, mat.excCab,  0.55, FK_CAB_Y+0.17, 0);

    // ROPS frame
    BX(forkRoot, 0.10, 2.2, 0.10, mat.steel, -1.22, FK_CAB_Y, -0.82);
    BX(forkRoot, 0.10, 2.2, 0.10, mat.steel, -1.22, FK_CAB_Y,  0.82);
    BX(forkRoot, 0.10, 2.2, 0.10, mat.steel,  0.52, FK_CAB_Y, -0.82);
    BX(forkRoot, 0.10, 2.2, 0.10, mat.steel,  0.52, FK_CAB_Y,  0.82);
    BX(forkRoot, 1.78, 0.10, 0.10, mat.steel, -0.35, FK_CAB_Y+2.2, -0.82);
    BX(forkRoot, 1.78, 0.10, 0.10, mat.steel, -0.35, FK_CAB_Y+2.2,  0.82);
    BX(forkRoot, 0.10, 0.10, 1.74, mat.steel, -1.22, FK_CAB_Y+2.2, 0);
    BX(forkRoot, 0.10, 0.10, 1.74, mat.steel,  0.52, FK_CAB_Y+2.2, 0);

    // Mast (front - two uprights)
    CY(forkRoot, 0.10, 0.10, 3.8, 8, mat.steel, -1.45, FK_WH_Y*2,  0.48);
    CY(forkRoot, 0.10, 0.10, 3.8, 8, mat.steel, -1.45, FK_WH_Y*2, -0.48);
    // Mast cross members
    BX(forkRoot, 0.10, 0.10, 1.05, mat.steel, -1.45, FK_WH_Y*2+1.2, 0);
    BX(forkRoot, 0.10, 0.10, 1.05, mat.steel, -1.45, FK_WH_Y*2+2.6, 0);

    // Fork carriage + forks (animated up/down)
    const forkCarriage = new THREE.Group();
    forkCarriage.position.set(-1.45, FK_WH_Y*2 + 1.8, 0);
    forkRoot.add(forkCarriage);
    BX(forkCarriage, 0.18, 0.55, 1.10, mat.steel, 0, 0, 0);
    BX(forkCarriage, 2.4, 0.10, 0.16, M(0xbbbbbb, 0.22, 0.82), -1.2, -0.25, 0.32);
    BX(forkCarriage, 2.4, 0.10, 0.16, M(0xbbbbbb, 0.22, 0.82), -1.2, -0.25, -0.32);
    // Pallet
    BX(forkCarriage, 1.7, 0.18, 0.72, M(0x8B4513, 0.90), -1.2, -0.14, 0);
    // Brick load on pallet
    BX(forkCarriage, 1.55, 0.60, 0.65, mat.brick, -1.2, 0.09, 0);

    // Wheels
    const addForkWheel = (px, pz) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(FK_WH_R, FK_WH_R, 0.32, 14), mat.tyre);
      t.rotation.x = Math.PI / 2;
      t.position.set(px, FK_WH_Y, pz);
      t.castShadow = true;
      forkRoot.add(t);
      const r = new THREE.Mesh(new THREE.CylinderGeometry(FK_WH_R*0.55, FK_WH_R*0.55, 0.36, 10), mat.rim);
      r.rotation.x = Math.PI / 2;
      r.position.set(px, FK_WH_Y, pz);
      forkRoot.add(r);
    };
    [[-0.85, 0.82],[-0.85,-0.82],[1.15,0.82],[1.15,-0.82]]
      .forEach(([px,pz]) => addForkWheel(px, pz));

    // ═══════════════════════════════════════════════════
    // 10. WORKERS (detailed, anatomically correct)
    // ═══════════════════════════════════════════════════
    const makeWorker = (helMat, vestMat) => {
      const g = new THREE.Group();
      // Boots
      BX(g, 0.24, 0.15, 0.32, M(0x1a1a1a, 0.95), -0.13, 0, 0.04);
      BX(g, 0.24, 0.15, 0.32, M(0x1a1a1a, 0.95),  0.13, 0, 0.04);
      // Legs
      const lL = BX(g, 0.22, 0.84, 0.22, mat.jeans, -0.13, 0.15, 0);
      const rL = BX(g, 0.22, 0.84, 0.22, mat.jeans,  0.13, 0.15, 0);
      // Belt
      BX(g, 0.52, 0.12, 0.30, M(0x3a2a1a, 0.88), 0, 0.99, 0);
      // Torso
      BX(g, 0.50, 0.68, 0.30, vestMat, 0, 1.11, 0);
      // Hi-vis stripes
      BX(g, 0.52, 0.07, 0.32, M(0xffffff, 0.50), 0, 1.27, 0);
      BX(g, 0.52, 0.07, 0.32, M(0xffffff, 0.50), 0, 1.12, 0);
      // Arms
      const lA = BX(g, 0.18, 0.58, 0.18, vestMat, -0.35, 1.13, 0);
      const rA = BX(g, 0.18, 0.58, 0.18, vestMat,  0.35, 1.13, 0);
      // Neck
      CY(g, 0.10, 0.10, 0.18, 7, mat.skin, 0, 1.79, 0);
      // Head
      const head = BX(g, 0.34, 0.34, 0.30, mat.skin, 0, 1.97, 0);
      // Helmet dome
      CY(g, 0.20, 0.20, 0.18, 10, helMat, 0, 2.02 + 0.09, 0);
      // Helmet brim
      CY(g, 0.25, 0.25, 0.05, 10, helMat, 0, 1.99, 0);
      return { g, lL, rL, lA, rA };
    };

    const workers = [
      { ...makeWorker(mat.helmY, mat.vest),  x:  5, y: 0.30, z:  9, ph: 0.0, wa: 2.5, ax:'x' },
      { ...makeWorker(mat.helmW, mat.vest),  x: -6, y: 0.30, z:  9, ph: 1.6, wa: 2.0, ax:'x' },
      { ...makeWorker(mat.helmR, mat.vest),  x: 11, y: 0.30, z:  4, ph: 2.2, wa: 2.2, ax:'z' },
      { ...makeWorker(mat.helmO, mat.vestY), x: -4, y: T1+SCAFF_FH*2-0.10, z: SF+0.30, ph:0.8, wa:2.0, ax:'x' },
      { ...makeWorker(mat.helmY, mat.vest),  x:  7, y: T1+SCAFF_FH*2-0.10, z: SF+0.30, ph:2.5, wa:2.5, ax:'x' },
      { ...makeWorker(mat.helmW, mat.vestY), x:-11, y: 0.30, z:  4, ph: 1.0, wa: 2.3, ax:'z' },
      { ...makeWorker(mat.helmR, mat.vest),  x:  2, y: 0.30, z: 16, ph: 3.0, wa: 2.8, ax:'x' },
      { ...makeWorker(mat.helmY, mat.vest),  x: 18, y: 0.30, z:  5, ph: 3.5, wa: 2.0, ax:'z' },
      { ...makeWorker(mat.helmO, mat.vest),  x:  0, y: T2+SCAFF_FH*2-0.10, z: SF+0.30, ph:1.4, wa:2.2, ax:'x' },
    ];
    workers.forEach(w => { w.g.position.set(w.x, w.y, w.z); root.add(w.g); });

    // ═══════════════════════════════════════════════════
    // 11. SITE DETAILS & PROPS
    // ═══════════════════════════════════════════════════
    // Rebar bundle (ground)
    for (let r = 0; r < 10; r++) {
      CY(root, 0.055, 0.055, 5.5, 6, mat.rebar, 21 + r*0.14, 0.30+r*0.11, 1.5);
    }

    // Cement bags stack
    for (let c = 0; c < 4; c++) for (let l = 0; l < 3; l++) {
      BX(root, 0.82, 0.42, 0.52, mat.bags, 10 + c*0.84, 0.30+l*0.42, 23);
    }

    // Brick pallets
    for (let c = 0; c < 5; c++) for (let r = 0; r < 3; r++) for (let l = 0; l < 3; l++) {
      BX(root, 0.52, 0.25, 0.25, mat.brick,
        -17+c*0.54, 0.30+l*0.26, -19+r*0.27);
    }

    // Pipe bundle
    for (let p = 0; p < 9; p++) {
      CY(root, 0.09, 0.09, 5.2, 8,
        M(0x778899, 0.50, 0.55), 20+p*0.19, 0.30+p*0.18, 5);
    }

    // Tool shed
    BX(root, 6.5, 3.2, 4.8, mat.shed, -26, 0.30, 22);
    BX(root, 6.7, 0.22, 5.0, M(0x3a5a24, 0.80), -26, 3.52, 22);
    BX(root, 1.5, 2.5, 0.12, M(0x333333, 0.80), -26, 0.30, 20.12);
    // Shed window
    BX(root, 1.2, 0.85, 0.12, mat.glass, -23.7, 1.5, 20.12);

    // Portable toilet
    BX(root, 1.5, 2.8, 1.5, M(0x1144bb, 0.65), 27, 0.30, 22);
    BX(root, 1.3, 2.4, 1.3, M(0x2255cc, 0.55), 27, 0.50, 22);
    BX(root, 0.80, 2.0, 0.12, M(0x0a2288, 0.70), 27, 0.50, 21.12);

    // Safety cones (at transition zones)
    [[7,28],[0,28],[-7,28],[14,28],[-14,28],[23,2],[-23,2],[10,12],[-10,12]].forEach(([cx,cz]) => {
      CY(root, 0.03, 0.28, 0.72, 10, mat.cone, cx, 0.30, cz);
      CY(root, 0.30, 0.30, 0.06, 10, M(0xffffff, 0.50), cx, 1.02, cz);
    });

    // Work light towers
    [[-26, -16], [26, -16]].forEach(([lx, lz]) => {
      CY(root, 0.10, 0.10, 14.5, 8, M(0x888888, 0.50, 0.40), lx, 0.30, lz);
      BX(root, 0.09, 0.09, 3.5, M(0x888888, 0.50, 0.40), lx-1.0, 12.8, lz);
      BX(root, 0.09, 0.09, 3.5, M(0x888888, 0.50, 0.40), lx+1.0, 12.8, lz);
      BX(root, 2.4, 0.72, 0.55, mat.lamp, lx, 14.02, lz);
    });

    // Concrete pump
    BX(root, 5.5, 1.5, 2.4, M(0xcc4400, 0.50, 0.20), -5, 0.30, -18);
    CY(root, 0.14, 0.14, 9.0, 8, M(0xdd6600, 0.40, 0.30), -3.5, 0.30+3.8, -18);
    BX(root, 4.5, 0.15, 0.15, M(0xdd6600, 0.40, 0.30), -1.5, 0.30+9.0, -18);
    CY(root, 0.72, 0.72, 0.45, 14,
      M(0xcc4400, 0.50, 0.20), -5, 0.30+1.5, -18);  // pump wheel

    // Fuel tank
    BX(root, 2.2, 1.6, 1.2, M(0x223344, 0.75, 0.35), 27, 0.30, 15);
    CY(root, 0.12, 0.12, 0.8, 8, M(0x555555, 0.50, 0.40), 26.7, 1.90, 15.2);

    // Rocks scattered
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    [[28,-22,1.2],[30,-18,0.8],[-28,-22,1.5],[-30,-18,0.9],[33,10,1.1]]
      .forEach(([x,z,s]) => {
        const r = new THREE.Mesh(rockGeo, mat.rock);
        r.scale.setScalar(s);
        r.position.set(x, 0.3, z);
        r.rotation.set(Math.random(), Math.random(), Math.random());
        r.castShadow = true; r.receiveShadow = true;
        scene.add(r);
      });

    // ═══════════════════════════════════════════════════
    // 12. SKY — Custom GLSL gradient (dusk/moonrise)
    // ═══════════════════════════════════════════════════
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: `
        varying vec3 vPos;
        void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec3 vPos;
        void main(){
          float h = normalize(vPos).y;
          // Deep navy zenith -> indigo mid -> dark teal horizon
          vec3 zenith  = vec3(0.03, 0.06, 0.18);
          vec3 midSky  = vec3(0.06, 0.10, 0.28);
          vec3 horizon = vec3(0.12, 0.18, 0.32);
          vec3 c = mix(horizon, midSky, smoothstep(0.0, 0.30, h));
          c = mix(c, zenith, smoothstep(0.20, 0.85, h));
          // Subtle warm glow low on the horizon
          float glow = pow(max(0.0, 1.0 - h * 4.0), 3.0);
          c += vec3(0.35, 0.18, 0.06) * glow * 0.55;
          gl_FragColor = vec4(c, 1.0);
        }
      `,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(380, 24, 14), skyMat));

    // Stars
    const sBuf = new Float32Array(1200);
    for (let i = 0; i < 400; i++) {
      const a = Math.random()*Math.PI*2, p = Math.acos(2*Math.random()-1), r = 220+Math.random()*50;
      sBuf[i*3]   = r*Math.sin(p)*Math.cos(a);
      sBuf[i*3+1] = Math.abs(r*Math.cos(p))+50;
      sBuf[i*3+2] = r*Math.sin(p)*Math.sin(a);
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(sBuf, 3));
    scene.add(new THREE.Points(sGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.55, transparent: true, opacity: 0.70 })));

    // Moon
    const moonM = M(0xeeeedd, 0.50, 0, { emissive: 0xddcc88, emissiveIntensity: 0.65 });
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(6, 18, 18), moonM);
    moonMesh.position.set(90, 130, -190);
    scene.add(moonMesh);
    const moonPt = new THREE.PointLight(0xddeeff, 1.1, 700);
    moonPt.position.copy(moonMesh.position);
    scene.add(moonPt);

    // Background city silhouette
    const cityMat = M(0x0a0e18, 0.99, 0, { emissive: 0x0d1428, emissiveIntensity: 0.12 });
    const winMat  = M(0xffe8a0, 0.5, 0, { emissive: 0xffe8a0, emissiveIntensity: 1.4, transparent: true, opacity: 0.88 });
    [[-60,-30,9,35,9],[-52,-30,7,22,7],[-68,-30,6,15,6],
     [60,-30,10,40,9],[54,-30,7,26,7],[68,-30,5,18,5],
     [0,-50,12,20,10],[-20,-44,7,16,7],[20,-44,8,24,7]].forEach(([x,z,w,h,d]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cityMat);
      b.position.set(x, h*0.5, z); scene.add(b);
      for (let wi = 0; wi < 10; wi++) {
        const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.28), winMat);
        wm.position.set(x+(Math.random()-0.5)*(w-0.8), Math.random()*(h-2)+1, z+d*0.5+0.02);
        scene.add(wm);
      }
    });

    // Dust particles
    const dustCount = 100;
    const dPos = new Float32Array(dustCount*3), dVel = new Float32Array(dustCount*3);
    for (let i = 0; i < dustCount; i++) {
      dPos[i*3]   = (Math.random()-0.5)*60;
      dPos[i*3+1] = Math.random()*18;
      dPos[i*3+2] = (Math.random()-0.5)*50;
      dVel[i*3]   = (Math.random()-0.5)*0.018;
      dVel[i*3+1] = 0.015+Math.random()*0.02;
      dVel[i*3+2] = (Math.random()-0.5)*0.018;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    scene.add(new THREE.Points(dustGeo,
      new THREE.PointsMaterial({ color: 0xddbb88, size: 0.22, transparent: true, opacity: 0.30, depthWrite: false })));

    // ═══════════════════════════════════════════════════
    // 13. CONTROLS
    // ═══════════════════════════════════════════════════
    const c = ctrl.current;
    const onDown = e => { c.down=true; c.lx=e.clientX??e.touches?.[0]?.clientX??0; };
    const onUp   = () => { c.down=false; };
    const onMove = e => {
      if (!c.down) return;
      const cx = e.clientX??e.touches?.[0]?.clientX??0;
      c.rotY += (cx-c.lx)*0.007; c.lx=cx;
    };
    const onWheel = e => { c.camZ = Math.max(38,Math.min(130,c.camZ+e.deltaY*0.06)); };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown, { passive:true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive:true });
    el.addEventListener("wheel", onWheel, { passive:true });

    // ═══════════════════════════════════════════════════
    // 14. ANIMATION LOOP
    // ═══════════════════════════════════════════════════
    let t = 0, frame = 0;
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      t += 0.016; frame++;

      if (!c.down) c.rotY += 0.001;
      root.rotation.y = c.rotY;

      // Camera smooth zoom
      camera.position.z += (c.camZ - camera.position.z)*0.06;
      camera.position.y = camera.position.z * 0.50;
      camera.lookAt(0, 7, 0);

      // Crane jib sweep
      jibG.rotation.y = Math.sin(t*0.13)*0.52;
      // Trolley
      trolleyG.position.x = -JL*0.5 + JL*0.5*(0.55+Math.sin(t*0.18)*0.42);
      // Cable extend/retract
      const cLen = 5+Math.abs(Math.sin(t*0.14))*9;
      cableMesh.scale.y = cLen;
      cableMesh.position.y = -cLen*0.5;
      hookG.position.y = -cLen-0.38;

      // Mixer drum spin
      drumMesh.rotation.y += 0.020;
      // Drum ribs counter-spin effect (children after drumMesh)
      drumG.rotation.y += 0.020;

      // Dump bed tilt cycle
      bedPivot.rotation.x = 0.06 + Math.abs(Math.sin(t*0.07))*0.32;

      // Bulldozer drive
      bullRoot.position.x = -8 + Math.sin(t*0.10)*4.0;

      // Forklift move + fork lift
      forkRoot.position.z = 13 + Math.sin(t*0.14)*3.5;
      forkCarriage.position.y = FK_WH_Y*2+1.8 + Math.abs(Math.sin(t*0.14))*1.8;

      // Excavator arm dig cycle
      boomPiv.rotation.z  = 0.25 + Math.sin(t*0.22)*0.20;
      stickPiv.rotation.z = 0.45 + Math.sin(t*0.22+1.0)*0.28;
      bucketPiv.rotation.z = -0.55 + Math.sin(t*0.22+2.0)*0.32;

      // Workers walk
      workers.forEach((w,i) => {
        const sp = 1.0+(i%3)*0.30;
        const cyc = Math.sin(t*sp+w.ph);
        w.lL.rotation.x =  cyc*0.35;
        w.rL.rotation.x = -cyc*0.35;
        w.lA.rotation.x = -cyc*0.28;
        w.rA.rotation.x =  cyc*0.28;
        const mv = Math.sin(t*sp*0.5+w.ph)*w.wa;
        if (w.ax==='x') w.g.position.x = w.x+mv;
        else w.g.position.z = w.z+mv;
        w.g.position.y = w.y + Math.abs(Math.sin(t*sp*2+w.ph))*0.04;
        w.g.rotation.y = Math.cos(t*sp*0.5+w.ph)>0
          ? (w.ax==='x'? Math.PI*0.5:0)
          : (w.ax==='x'?-Math.PI*0.5:Math.PI);
      });

      // Dust (every 3rd frame)
      if (frame%3===0) {
        for (let i=0;i<dustCount;i++) {
          dPos[i*3]  +=dVel[i*3];
          dPos[i*3+1]+=dVel[i*3+1];
          dPos[i*3+2]+=dVel[i*3+2];
          if (dPos[i*3+1]>22) {
            dPos[i*3]  =(Math.random()-0.5)*60;
            dPos[i*3+1]=0;
            dPos[i*3+2]=(Math.random()-0.5)*50;
          }
        }
        dustGeo.attributes.position.needsUpdate=true;
      }

      // Flood light flicker
      flood1.intensity = 3.2+Math.sin(t*7.1)*0.28;
      flood2.intensity = 3.2+Math.sin(t*6.5+1)*0.28;

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w=el.clientWidth, h=el.clientHeight;
      camera.aspect=w/h; camera.updateProjectionMatrix();
      renderer.setSize(w,h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    setTimeout(()=>setLoaded(true), 500);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      el.removeEventListener("mousedown",onDown);
      el.removeEventListener("touchstart",onDown);
      window.removeEventListener("mouseup",onUp);
      window.removeEventListener("touchend",onUp);
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("touchmove",onMove);
      el.removeEventListener("wheel",onWheel);
      if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  const SCAFF_FH = 4.0;
  const PH = 1.6;
  const T1 = 1.84 + 0.35 + 4.0;
  const T2 = T1 + 3.6;
  const SF = -6 + 9 + 1.6;

  return (
    <div style={{
      width:"100%", height:"520px",
      background:"#050a12", position:"relative", overflow:"hidden",
      borderRadius:6, fontFamily:"'Courier New',monospace",
    }}>
      <div ref={mountRef} style={{ width:"100%", height:"100%", cursor:"grab" }} />

      {/* ── TOP BAR ── */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:60,
        background:"linear-gradient(to bottom,rgba(5,10,18,0.95) 0%,transparent 100%)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 24px",
        opacity:loaded?1:0, transition:"opacity 1.2s ease",
        pointerEvents:"none",
      }}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{
            width:40,height:40,
            border:"1px solid rgba(245,158,11,0.55)",
            background:"rgba(245,158,11,0.08)",
            backdropFilter:"blur(10px)",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>
            <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
              <rect x="3" y="1" width="12" height="18" stroke="#f59e0b" strokeWidth="1.1" fill="none"/>
              <rect x="5.5" y="4"   width="2" height="2" fill="#f59e0b" opacity="0.9"/>
              <rect x="10.5" y="4"  width="2" height="2" fill="#f59e0b" opacity="0.9"/>
              <rect x="5.5" y="8"   width="2" height="2" fill="#f59e0b" opacity="0.9"/>
              <rect x="10.5" y="8"  width="2" height="2" fill="#f59e0b" opacity="0.9"/>
              <rect x="5.5" y="12"  width="2" height="2" fill="#f59e0b" opacity="0.45"/>
              <rect x="10.5" y="12" width="2" height="2" fill="#f59e0b" opacity="0.45"/>
              <line x1="1" y1="19" x2="17" y2="19" stroke="#f59e0b" strokeWidth="1.1"/>
              <line x1="9" y1="1"  x2="9" y2="-0.5" stroke="#f59e0b" strokeWidth="1.1"/>
            </svg>
          </div>
          <div>
            <div style={{color:"#f59e0b",fontSize:15,letterSpacing:"0.24em",fontFamily:"Georgia,serif",lineHeight:1}}>APEX</div>
            <div style={{color:"rgba(255,255,255,0.28)",fontSize:7,letterSpacing:"0.38em",marginTop:3}}>CONSTRUCTION GROUP</div>
          </div>
        </div>

        {/* Project label */}
        <div style={{textAlign:"center"}}>
          <div style={{color:"rgba(245,158,11,0.45)",fontSize:7.5,letterSpacing:"0.30em",marginBottom:3}}>PROJECT</div>
          <div style={{color:"rgba(255,255,255,0.72)",fontSize:10,letterSpacing:"0.20em"}}>MERIDIAN TOWER — SITE APX-2024</div>
        </div>

        {/* Right: time + badge */}
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{textAlign:"right"}}>
            <div style={{color:"rgba(255,255,255,0.20)",fontSize:7,letterSpacing:"0.20em"}}>SITE TIME</div>
            <div style={{color:"#f59e0b",fontSize:14,letterSpacing:"0.10em",marginTop:1}}>{time}</div>
          </div>
          <div style={{
            display:"flex",alignItems:"center",gap:6,
            padding:"6px 12px",
            border:"1px solid rgba(16,185,129,0.40)",
            background:"rgba(16,185,129,0.06)",
            backdropFilter:"blur(8px)",
          }}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#10b981",display:"inline-block",animation:"lp 1.8s ease-in-out infinite"}}/>
            <span style={{color:"#10b981",fontSize:8,letterSpacing:"0.20em"}}>SITE ACTIVE</span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM OVERLAY ── */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        padding:"80px 24px 20px",
        background:"linear-gradient(to top,rgba(5,10,18,0.97) 0%,rgba(5,10,18,0.52) 55%,transparent 100%)",
        display:"flex", alignItems:"flex-end", justifyContent:"space-between",
        opacity:loaded?1:0, transition:"opacity 1.8s ease 0.7s",
        pointerEvents:"none",
      }}>
        {/* Left: hero text */}
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{width:22,height:1,background:"rgba(245,158,11,0.55)"}}/>
            <span style={{color:"rgba(245,158,11,0.65)",fontSize:7.5,letterSpacing:"0.38em"}}>DOWNTOWN CORE · EST. COMPLETION DEC 2025</span>
          </div>
          <h2 style={{
            margin:0, fontFamily:"Georgia,'Times New Roman',serif",
            fontWeight:300, fontSize:"clamp(14px,2.4vw,26px)",
            color:"#fff", letterSpacing:"0.06em", lineHeight:1.22,
            textShadow:"0 4px 40px rgba(0,0,0,0.99)",
          }}>
            Building <span style={{color:"#f59e0b",fontStyle:"italic"}}>Tomorrow</span><br/>
            Rising from the Ground Up
          </h2>
          <p style={{margin:"7px 0 0",color:"rgba(255,255,255,0.24)",fontSize:9,letterSpacing:"0.18em"}}>
            9 Workers · 5 Vehicles · 3 Floors Active
          </p>
        </div>

        {/* Right: stats */}
        <div style={{textAlign:"right"}}>
          <div style={{display:"flex",gap:18,justifyContent:"flex-end",marginBottom:10}}>
            {[["FLOORS","3/12"],["HEIGHT","42M"],["CRANE","ACTIVE"]].map(([k,v])=>(
              <div key={k}>
                <div style={{color:"rgba(255,255,255,0.22)",fontSize:7,letterSpacing:"0.14em"}}>{k}</div>
                <div style={{color:"rgba(245,200,120,0.88)",fontSize:12,marginTop:2,fontFamily:"Georgia,serif"}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{width:155}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{color:"rgba(255,255,255,0.24)",fontSize:7,letterSpacing:"0.15em"}}>OVERALL PROGRESS</span>
              <span style={{color:"#f59e0b",fontSize:7}}>34%</span>
            </div>
            <div style={{height:2,background:"rgba(255,255,255,0.08)",borderRadius:1}}>
              <div style={{height:2,width:"34%",background:"linear-gradient(to right,#b06000,#f59e0b,#fcd34d)",borderRadius:1}}/>
            </div>
          </div>
        </div>
      </div>

      {/* Drag hint */}
      <div style={{
        position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",
        opacity:loaded?0.28:0,transition:"opacity 2.5s ease 1.5s",
        pointerEvents:"none",display:"flex",alignItems:"center",gap:6,
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 6h10M7.5 3.5l2.5 2.5-2.5 2.5M4.5 3.5L2 6l2.5 2.5" stroke="white" strokeWidth="0.85" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{color:"white",fontSize:8,letterSpacing:"0.18em"}}>DRAG · SCROLL ZOOM</span>
      </div>

      {/* Vignette */}
      <div style={{
        position:"absolute",inset:0,pointerEvents:"none",
        background:"radial-gradient(ellipse at 50% 42%,transparent 38%,rgba(5,10,18,0.52) 100%)",
      }}/>

      <style>{`@keyframes lp{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  );
}