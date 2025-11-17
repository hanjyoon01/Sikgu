import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function init3DScene(appElement: HTMLElement, toolbarElement: HTMLElement) {
  // WebGL 지원 확인
  function checkWebGL() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  if (!checkWebGL()) {
    console.error('WebGL is not supported in this environment');
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 40px; max-width: 500px; text-align: center; color: white;">
          <div style="font-size: 60px; margin-bottom: 15px;">⚠️</div>
          <h2 style="font-size: 24px; margin-bottom: 15px;">WebGL을 사용할 수 없습니다</h2>
          <p style="font-size: 16px; line-height: 1.6; opacity: 0.9;">
            현재 환경에서는 3D 뷰어를 표시할 수 없습니다.<br>
            브라우저의 개발자 도구에서 이 페이지를 새 탭으로 열거나,<br>
            WebGL을 지원하는 다른 브라우저를 사용해주세요.
          </p>
        </div>
      </div>
    `;
    appElement.appendChild(errorDiv);
    return () => {}; // 빈 cleanup 함수 반환
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (error) {
    console.error('THREE.WebGLRenderer: Error creating WebGL context.', error);
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 40px; max-width: 500px; text-align: center; color: white;">
          <div style="font-size: 60px; margin-bottom: 15px;">⚠️</div>
          <h2 style="font-size: 24px; margin-bottom: 15px;">WebGL을 사용할 수 없습니다</h2>
          <p style="font-size: 16px; line-height: 1.6; opacity: 0.9;">
            3D 렌더러를 초기화할 수 없습니다.<br>
            브라우저에서 WebGL을 활성화하거나,<br>
            WebGL을 지원하는 다른 브라우저를 사용해주세요.
          </p>
        </div>
      </div>
    `;
    appElement.appendChild(errorDiv);
    return () => {}; // 빈 cleanup 함수 반환
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(appElement.clientWidth, appElement.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  appElement.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const cubeLoader = new THREE.CubeTextureLoader();
  const skybox = cubeLoader.load([
    '/planterior-assets/textures/skybox/px.bmp',
    '/planterior-assets/textures/skybox/nx.bmp',
    '/planterior-assets/textures/skybox/py.bmp',
    '/planterior-assets/textures/skybox/ny.bmp',
    '/planterior-assets/textures/skybox/pz.bmp',
    '/planterior-assets/textures/skybox/nz.bmp',
  ]);
  scene.background = skybox;
  scene.environment = skybox;

  const camera = new THREE.PerspectiveCamera(
    60,
    appElement.clientWidth / appElement.clientHeight,
    0.1,
    100
  );
  camera.position.set(10, 8, 10);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 0.5, 0);

  const ROOM_SIZE = 15;
  const WALL_HEIGHT = 6;
  const FLOOR_Y = 0;

  scene.add(new THREE.AmbientLight(0xffe8c4, 0.35));
  const dirLight = new THREE.DirectionalLight(0xffe8c4, 0.8);
  dirLight.position.set(4, 8, 4);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.bias = -0.0002;
  dirLight.shadow.normalBias = 0.02;
  scene.add(dirLight);

  const sun = new THREE.DirectionalLight(0xfff3d1, 1.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.02;

  let thetaDeg = -40;
  function updateSun(elevDeg = 45) {
    const elev = THREE.MathUtils.degToRad(elevDeg);
    const theta = THREE.MathUtils.degToRad(thetaDeg);
    const r = 20;
    const x = r * Math.cos(elev) * Math.cos(theta);
    const y = r * Math.sin(elev);
    const z = r * Math.cos(elev) * Math.sin(theta);
    sun.position.set(x, y, z);
    sun.target.position.set(0, ROOM_SIZE * 0.35, 0);
    scene.add(sun.target);
  }
  updateSun(40);
  scene.add(sun);

  const s = 10;
  sun.shadow.camera.left = -s;
  sun.shadow.camera.right = s;
  sun.shadow.camera.top = s;
  sun.shadow.camera.bottom = -s;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 50;

  const texLoader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy?.() ?? 1;

  function canvasTexture(cvs: HTMLCanvasElement) {
    const t = new THREE.CanvasTexture(cvs);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = maxAniso;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function makeCanvas(w = 512, h = 512) {
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    return { cvs, ctx: cvs.getContext('2d')! };
  }

  function loadTiledTexture(url: string, repeatX: number, repeatY: number, rotate90 = false) {
    const t = texLoader.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX, repeatY);
    if (rotate90) {
      t.center.set(0.5, 0.5);
      t.rotation = Math.PI / 2;
    }
    t.anisotropy = maxAniso;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function createHomeWallpaperTexture({
    base = '#f4efe7',
    stripe = '#ecebe6',
    noise = 6,
    stripeWidth = 14,
    scale = 1.0,
  } = {}) {
    const { cvs, ctx } = makeCanvas(512, 512);

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 512, 512);

    for (let x = 0; x < 512; x += stripeWidth) {
      ctx.fillStyle = (x / stripeWidth) % 2 === 0 ? stripe : base;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(x, 0, stripeWidth, 512);
    }
    ctx.globalAlpha = 1;

    const img = ctx.getImageData(0, 0, 512, 512);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = Math.random() * noise - noise / 2;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);

    const tex = canvasTexture(cvs);
    tex.repeat.set(1 * scale, 1 * scale);
    return tex;
  }

  const metersPerRepeat = 6.0;
  const wallRepeatX = ROOM_SIZE / metersPerRepeat;
  const wallRepeatY = ROOM_SIZE / metersPerRepeat;
  const floorRepeat = ROOM_SIZE / metersPerRepeat;

  const floorTex = loadTiledTexture('/planterior-assets/textures/wood_floor.jpg', floorRepeat, floorRepeat, false);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE),
    floorMat
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  floor.receiveShadow = true;
  scene.add(floor);

  const grassTex = texLoader.load('/planterior-assets/textures/grass.jpg');
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(100, 100);
  grassTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  grassTex.colorSpace = THREE.SRGBColorSpace;

  const grassMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const GRASS_SIZE = ROOM_SIZE * 10;
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(GRASS_SIZE, GRASS_SIZE),
    grassMat
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = FLOOR_Y - 0.001;
  grass.receiveShadow = true;
  scene.add(grass);

  const wallGroup = new THREE.Group();
  scene.add(wallGroup);

  const wallGeo = new THREE.PlaneGeometry(ROOM_SIZE, WALL_HEIGHT);
  const ceilGeo = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);

  const wallpaperTexFB = createHomeWallpaperTexture({
    base: '#f4efe7',
    stripe: '#ecebe6',
    noise: 6,
    stripeWidth: 14,
    scale: 1.0,
  });
  const wallpaperTexLR = wallpaperTexFB.clone();

  const wallMatFB = new THREE.MeshStandardMaterial({
    map: wallpaperTexFB,
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  const wallMatLR = new THREE.MeshStandardMaterial({
    map: wallpaperTexLR,
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const wallFront = new THREE.Mesh(wallGeo, wallMatFB);
  wallFront.position.set(0, WALL_HEIGHT / 2, ROOM_SIZE / 2);
  wallFront.rotateY(Math.PI);
  wallFront.receiveShadow = true;
  wallGroup.add(wallFront);

  const wallBack = new THREE.Mesh(wallGeo, wallMatFB);
  wallBack.position.set(0, WALL_HEIGHT / 2, -ROOM_SIZE / 2);
  wallBack.receiveShadow = true;
  wallGroup.add(wallBack);

  const winW = 12, winH = 4;
  const winYCenter = 1 + winH / 2;

  function makeWallWithWindow(width: number, height: number, holeRect: { x: number; y: number; w: number; h: number }, material: THREE.Material) {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -height / 2);
    shape.lineTo(+width / 2, -height / 2);
    shape.lineTo(+width / 2, +height / 2);
    shape.lineTo(-width / 2, +height / 2);
    shape.lineTo(-width / 2, -height / 2);

    const hole = new THREE.Path();
    const { x, y, w, h } = holeRect;
    hole.moveTo(x - w / 2, y - h / 2);
    hole.lineTo(x + w / 2, y - h / 2);
    hole.lineTo(x + w / 2, y + h / 2);
    hole.lineTo(x - w / 2, y + h / 2);
    hole.lineTo(x - w / 2, y - h / 2);
    shape.holes.push(hole);

    const geom = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geom, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    return mesh;
  }

  const wallLeft = makeWallWithWindow(
    ROOM_SIZE,
    WALL_HEIGHT,
    { x: 0, y: winYCenter - WALL_HEIGHT / 2, w: winW, h: winH },
    wallMatLR
  );
  wallLeft.position.set(-ROOM_SIZE / 2, WALL_HEIGHT / 2, 0);
  wallLeft.rotateY(Math.PI / 2);
  scene.add(wallLeft);

  const wallRight = makeWallWithWindow(
    ROOM_SIZE,
    WALL_HEIGHT,
    { x: 0, y: winYCenter - WALL_HEIGHT / 2, w: winW, h: winH },
    wallMatLR
  );
  wallRight.position.set(ROOM_SIZE / 2, WALL_HEIGHT / 2, 0);
  wallRight.rotateY(-Math.PI / 2);
  scene.add(wallRight);

  const ceiling = new THREE.Mesh(
    ceilGeo,
    new THREE.MeshStandardMaterial({ color: 0xf7f7f7, roughness: 1, side: THREE.DoubleSide })
  );
  ceiling.position.set(0, WALL_HEIGHT, 0);
  ceiling.rotateX(Math.PI / 2);
  ceiling.receiveShadow = true;
  wallGroup.add(ceiling);

  interface ModelConfig {
    label: string;
    url: string;
    targetHeight: number;
    wallSnap?: boolean;
    showInToolbar?: boolean;
  }

  const MODEL_MAP: Record<string, ModelConfig> = {
    euphorbia_trigona: {
      label: '유포르비아 트리고나',
      url: '/planterior-assets/models/dynamic/big/Euphorbia_Trigona.glb',
      targetHeight: 5,
      showInToolbar: true,
    },
    paradise_plant: {
      label: '극락조',
      url: '/planterior-assets/models/dynamic/big/Paradise_Plant.glb',
      targetHeight: 4.5,
      showInToolbar: true,
    },
    rubber_tree: {
      label: '고무나무',
      url: '/planterior-assets/models/dynamic/big/Rubber_Tree.glb',
      targetHeight: 5,
      showInToolbar: true,
    },
    philodendron_congo: {
      label: '필로덴드론 콩고',
      url: '/planterior-assets/models/dynamic/big/Philodendron_Congo.glb',
      targetHeight: 4.3,
      showInToolbar: true,
    },
    areca_palm: {
      label: '아레카 야자',
      url: '/planterior-assets/models/dynamic/middle/Areca_Palm.glb',
      targetHeight: 3.5,
      showInToolbar: true,
    },
    monstera: {
      label: '몬스테라',
      url: '/planterior-assets/models/dynamic/middle/Monstera.glb',
      targetHeight: 3.5,
      showInToolbar: true,
    },
    spathiphyllum: {
      label: '스파티필룸',
      url: '/planterior-assets/models/dynamic/middle/Spathiphyllum.glb',
      targetHeight: 3.5,
      showInToolbar: true,
    },
    travelers_tree: {
      label: '여인초',
      url: '/planterior-assets/models/dynamic/middle/Travelers_Tree.glb',
      targetHeight: 3.5,
      showInToolbar: true,
    },
    calathea_orbifolia: {
      label: '칼라데아 오르비폴리아',
      url: '/planterior-assets/models/dynamic/small/Calathea_Orbifolia.glb',
      targetHeight: 2.2,
      showInToolbar: true,
    },
    golden_pothos: {
      label: '스킨답서스',
      url: '/planterior-assets/models/dynamic/small/Golden_Pothos.glb',
      targetHeight: 2.2,
      showInToolbar: true,
    },
    mini_cactus: {
      label: '미니 선인장',
      url: '/planterior-assets/models/dynamic/small/Mini_Cactus.glb',
      targetHeight: 2.2,
      showInToolbar: true,
    },
    tillandsia: {
      label: '틸란드시아',
      url: '/planterior-assets/models/dynamic/small/Tillandsia.glb',
      targetHeight: 2.2,
      showInToolbar: true,
    },
    sofa: {
      label: '소파',
      url: '/planterior-assets/models/static/Sofa.glb',
      targetHeight: 2,
      wallSnap: true,
      showInToolbar: false,
    },
    coffee_table: {
      label: '커피 테이블',
      url: '/planterior-assets/models/static/Coffee_Table.glb',
      targetHeight: 1.2,
      showInToolbar: false,
    },
    sideboard: {
      label: '사이드보드',
      url: '/planterior-assets/models/static/Sideboard.glb',
      targetHeight: 1.5,
      showInToolbar: false,
    },
    television: {
      label: '텔레비전',
      url: '/planterior-assets/models/static/Television.glb',
      targetHeight: 3,
      showInToolbar: false,
    },
    console_table: {
      label: '콘솔 테이블',
      url: '/planterior-assets/models/static/Console_Table.glb',
      targetHeight: 2,
      showInToolbar: false,
    },
    flower_vase: {
      label: '꽃병',
      url: '/planterior-assets/models/static/Flower_Vase.glb',
      targetHeight: 1.8,
      showInToolbar: false,
    },
  };

  function renderModelButtons() {
    if (!toolbarElement) return;
    const wrap = document.createElement('div');
    wrap.className = 'model-buttons-row';

    for (const [key, cfg] of Object.entries(MODEL_MAP)) {
      if (cfg.showInToolbar) {
        const btn = document.createElement('button');
        btn.dataset.model = key;
        btn.textContent = cfg.label;
        wrap.appendChild(btn);
      }
    }
    toolbarElement.insertBefore(wrap, toolbarElement.firstChild);
  }

  const loader = new GLTFLoader();
  const prototypeCache = new Map<string, THREE.Group>();
  const loadingCache = new Map<string, Promise<THREE.Group>>();

  function setShadow(obj: THREE.Object3D, cast: boolean, receive: boolean) {
    obj.traverse((c: any) => {
      if (c.isMesh) {
        c.castShadow = cast;
        c.receiveShadow = receive;
      }
    });
  }

  function ensurePrototype(url: string): Promise<THREE.Group> {
    if (prototypeCache.has(url)) return Promise.resolve(prototypeCache.get(url)!);
    if (loadingCache.has(url)) return loadingCache.get(url)!;

    const p = new Promise<THREE.Group>((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          const base = gltf.scene;
          setShadow(base, true, true);
          prototypeCache.set(url, base);
          resolve(base);
        },
        undefined,
        (err) => reject(err)
      );
    });
    loadingCache.set(url, p);
    return p;
  }

  const draggable: THREE.Object3D[] = [];

  function getHalfHeight(obj: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(obj);
    return (box.max.y - box.min.y) / 2 || 0.5;
  }

  function placeOnFloor(obj: THREE.Object3D, posXZ: THREE.Vector3) {
    const hh = getHalfHeight(obj);
    obj.position.set(posXZ.x, hh, posXZ.z);
  }

  function clampInRoomXZ(x: number, z: number, margin = 0.3) {
    const inner = ROOM_SIZE / 2 - margin;
    return {
      x: THREE.MathUtils.clamp(x, -inner, inner),
      z: THREE.MathUtils.clamp(z, -inner, inner),
    };
  }

  function pointInFrontOfCamera() {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const dir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
    const ray = new THREE.Ray(camera.position.clone(), dir);
    const hit = new THREE.Vector3();
    if (ray.intersectPlane(plane, hit)) {
      const { x, z } = clampInRoomXZ(hit.x, hit.z);
      return new THREE.Vector3(x, 0, z);
    }
    return new THREE.Vector3(0, 0, 0);
  }

  function randJitter() {
    return new THREE.Vector3(
      (Math.random() - 0.5) * 0.6,
      0,
      (Math.random() - 0.5) * 0.6
    );
  }

  function normalizeHeight(obj: THREE.Object3D, targetHeight = 1.2) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (size.y > 0) {
      const s = targetHeight / size.y;
      obj.scale.setScalar(s);
    }
  }

  function getNearestWallSide(posXZ: THREE.Vector3) {
    const half = ROOM_SIZE / 2;
    const dLeft = Math.abs(posXZ.x - -half);
    const dRight = Math.abs(posXZ.x - +half);
    const dBack = Math.abs(posXZ.z - -half);
    const dFront = Math.abs(posXZ.z - +half);
    const min = Math.min(dLeft, dRight, dBack, dFront);
    if (min === dLeft) return 'left';
    if (min === dRight) return 'right';
    if (min === dBack) return 'back';
    return 'front';
  }

  function getWorldSize(obj: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);
    return size;
  }

  function placeInFrontOf(obj: THREE.Object3D, target: THREE.Object3D, gap = 0.2) {
    obj.rotation.y = target.rotation.y;

    const sofaSize = getWorldSize(target);
    const tableSize = getWorldSize(obj);

    const fwd = new THREE.Vector3(0, 0, 1)
      .applyEuler(new THREE.Euler(0, target.rotation.y, 0))
      .normalize();

    const offset = sofaSize.z / 2 + tableSize.z / 2 + gap;

    const pos = target.position
      .clone()
      .add(new THREE.Vector3(fwd.x, 0, fwd.z).multiplyScalar(offset));

    const { x, z } = clampInRoomXZ(pos.x, pos.z);
    const hh = getHalfHeight(obj);
    obj.position.set(x, hh, z);
  }

  function placeAgainstWall(obj: THREE.Object3D, side: string, gap = 0.03) {
    switch (side) {
      case 'front':
        obj.rotation.y = Math.PI;
        break;
      case 'left':
        obj.rotation.y = -Math.PI / 2;
        break;
      case 'right':
        obj.rotation.y = Math.PI / 2;
        break;
      case 'back':
      default:
        obj.rotation.y = 0;
        break;
    }

    const size = getWorldSize(obj);
    const half = ROOM_SIZE / 2;

    const current = obj.position.clone();
    const hh = getHalfHeight(obj);

    if (side === 'back') {
      obj.position.set(current.x, hh, -half + size.z / 2 + gap);
    } else if (side === 'front') {
      obj.position.set(current.x, hh, +half - size.z / 2 - gap);
    } else if (side === 'left') {
      obj.position.set(-half + size.x / 2 + gap, hh, current.z);
    } else if (side === 'right') {
      obj.position.set(+half - size.x / 2 - gap, hh, current.z);
    }

    obj.userData.wallSide = side;
  }

  function placeBesideOnWall(obj: THREE.Object3D, base: THREE.Object3D, sideSign = +1, gap = 0.12) {
    obj.rotation.y = base.rotation.y;

    const right = new THREE.Vector3(1, 0, 0)
      .applyEuler(new THREE.Euler(0, base.rotation.y, 0))
      .normalize();

    const baseSize = getWorldSize(base);
    const objSize = getWorldSize(obj);
    const offset = baseSize.x / 2 + objSize.x / 2 + gap;

    const target = base.position
      .clone()
      .add(right.multiplyScalar(sideSign * offset));

    const { x, z } = clampInRoomXZ(target.x, target.z);
    const hh = getHalfHeight(obj);
    obj.position.set(x, hh, z);

    const wall = base.userData?.wallSide || 'front';
    placeAgainstWall(obj, wall, 0.02);
  }

  function oppositeSide(side: string) {
    switch (side) {
      case 'back':
        return 'front';
      case 'front':
        return 'back';
      case 'left':
        return 'right';
      case 'right':
        return 'left';
      default:
        return 'front';
    }
  }

  function placeOnTopOf(obj: THREE.Object3D, base: THREE.Object3D, gapY = 0.02) {
    obj.rotation.y = base.rotation.y;

    const baseBox = new THREE.Box3().setFromObject(base);
    const objBox = new THREE.Box3().setFromObject(obj);
    const objSize = new THREE.Vector3();
    objBox.getSize(objSize);

    const topY = baseBox.max.y;

    const pos = base.position.clone();
    const hh = objSize.y / 2;
    obj.position.set(pos.x, topY + hh + gapY, pos.z);
  }

  async function addModelByKey(key: string, posXZ: THREE.Vector3 | null = null) {
    const cfg = MODEL_MAP[key];
    if (!cfg) return;
    const base = await ensurePrototype(cfg.url);
    const model = base.clone(true);

    normalizeHeight(model, cfg.targetHeight);
    const spawn = (posXZ ?? pointInFrontOfCamera()).clone().add(randJitter());
    placeOnFloor(model, spawn);

    if (cfg.wallSnap) {
      const side = getNearestWallSide(spawn);
      if (!model.parent) scene.add(model);
      placeAgainstWall(model, side);
    } else {
      if (!model.parent) scene.add(model);
    }

    draggable.push(model);
  }

  const raycaster = new THREE.Raycaster();
  const mouseNDC = new THREE.Vector2();
  let selected: THREE.Object3D | null = null;
  let dragPlane: THREE.Plane | null = null;
  let dragOffset = new THREE.Vector3();
  let selectedHalfH = 0;
  let isPointerDown = false;

  function setMouseFromEvent(e: MouseEvent | PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pick(e: MouseEvent | PointerEvent) {
    setMouseFromEvent(e);
    raycaster.setFromCamera(mouseNDC, camera);
    const hits = raycaster.intersectObjects(draggable, true);
    if (hits.length) {
      let obj: any = hits[0].object;
      while (obj && !draggable.includes(obj)) obj = obj.parent;
      if (!obj) return;

      selected = obj;
      selectedHalfH = getHalfHeight(obj);
      dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -selectedHalfH);

      const hitPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane, hitPoint);
      dragOffset.copy(obj.position).sub(hitPoint);

      controls.enabled = false;
      renderer.domElement.style.cursor = 'grabbing';
    }
  }

  function move(e: MouseEvent | PointerEvent) {
    if (!selected || !dragPlane) return;
    setMouseFromEvent(e);
    raycaster.setFromCamera(mouseNDC, camera);
    const point = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(dragPlane, point)) {
      point.add(dragOffset);
      const { x, z } = clampInRoomXZ(point.x, point.z);

      const side = selected?.userData?.wallSide;
      if (side === 'back' || side === 'front') {
        selected.position.set(x, selectedHalfH, selected.position.z);
      } else if (side === 'left' || side === 'right') {
        selected.position.set(selected.position.x, selectedHalfH, z);
      } else {
        selected.position.set(x, selectedHalfH, z);
      }
    }
  }

  function drop() {
    if (selected) selected.position.y = selectedHalfH;
    selected = null;
    dragPlane = null;
    controls.enabled = true;
    renderer.domElement.style.cursor = 'default';
  }

  renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

  renderer.domElement.addEventListener('pointerdown', (e) => {
    if (e.button === 2) {
      setMouseFromEvent(e);
      raycaster.setFromCamera(mouseNDC, camera);
      const hits = raycaster.intersectObjects(draggable, true);
      if (hits.length) {
        let obj: any = hits[0].object;
        while (obj && !draggable.includes(obj)) obj = obj.parent;
        if (obj) {
          scene.remove(obj);
          const idx = draggable.indexOf(obj);
          if (idx !== -1) draggable.splice(idx, 1);
        }
      }
      return;
    }

    if (e.button === 0) {
      isPointerDown = true;
      pick(e);
    }
  });

  renderer.domElement.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;
    move(e);
  });

  window.addEventListener('pointerup', () => {
    isPointerDown = false;
    drop();
  });

  renderModelButtons();

  toolbarElement.addEventListener('click', (e: any) => {
    const key = e.target?.dataset?.model;
    if (!key) return;
    addModelByKey(key);
  });

  function onResize() {
    const width = appElement.clientWidth;
    const height = appElement.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener('resize', onResize);

  const hint = document.createElement('div');
  hint.className = 'planterior-hint';
  hint.innerHTML = `
<b>조작 방법</b><br/>
- 상단 버튼으로 식물 모델 추가<br/>
- 드래그: 바닥(XZ) 위 이동(높이 고정)<br/>
- 우클릭: 객체 삭제<br/>
- Orbit: 좌클릭 회전 / 휠 줌 / 우클릭 패닝
`;
  appElement.appendChild(hint);

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  (async function spawnInitialSofaAndTable() {
    const sofaCfg = MODEL_MAP.sofa;
    if (!sofaCfg) return;

    const sofaBase = await ensurePrototype(sofaCfg.url);
    const sofa = sofaBase.clone(true);
    normalizeHeight(sofa, sofaCfg.targetHeight);
    placeOnFloor(sofa, new THREE.Vector3(0, 0, 0));
    scene.add(sofa);

    placeAgainstWall(sofa, 'back', 0.03);
    const hh = getHalfHeight(sofa);
    sofa.position.set(0, hh, sofa.position.z);

    const tableCfg = MODEL_MAP.coffee_table;
    if (!tableCfg) return;

    const tableBase = await ensurePrototype(tableCfg.url);
    const table = tableBase.clone(true);
    normalizeHeight(table, tableCfg.targetHeight);

    scene.add(table);
    placeInFrontOf(table, sofa, 0.8);
  })();

  (async function spawnSideboardAndTV() {
    const sofa = draggable.find(
      (o: any) => o.userData?.kind === 'furniture' && /sofa/i.test(o.name || '')
    ) ||
      draggable.find(
        (o) => o.userData?.kind === 'furniture' && o.userData.wallSide
      ) ||
      null;

    const sofaSide = sofa?.userData?.wallSide;
    const boardSide = oppositeSide(sofaSide);

    const boardCfg = MODEL_MAP.sideboard;
    if (!boardCfg) return;
    const boardBase = await ensurePrototype(boardCfg.url);
    const board = boardBase.clone(true);
    board.userData.kind = 'furniture';
    normalizeHeight(board, boardCfg.targetHeight);

    placeOnFloor(board, new THREE.Vector3(0, 0, 0));
    scene.add(board);

    placeAgainstWall(board, boardSide, 0.02);
    const bh = getHalfHeight(board);
    if (boardSide === 'back' || boardSide === 'front')
      board.position.set(0, bh, board.position.z);
    if (boardSide === 'left' || boardSide === 'right')
      board.position.set(board.position.x, bh, 0);

    const tvCfg = MODEL_MAP.television;
    if (!tvCfg) return;
    const tvBase = await ensurePrototype(tvCfg.url);
    const tv = tvBase.clone(true);
    tv.userData.kind = 'furniture';
    normalizeHeight(tv, tvCfg.targetHeight);

    scene.add(tv);
    placeOnTopOf(tv, board, 0.015);

    board.userData.role = 'sideboard';
    tv.userData.role = 'tv';
  })();

  (async function spawnConsoleTableAndVaseOnFrontLeft() {
    const half = ROOM_SIZE / 2;

    const tCfg = MODEL_MAP.console_table;
    if (!tCfg) return;
    const tBase = await ensurePrototype(tCfg.url);
    const table = tBase.clone(true);
    table.userData.kind = 'furniture';
    normalizeHeight(table, tCfg.targetHeight);

    scene.add(table);
    placeAgainstWall(table, 'front', 0.02);

    const tSize = getWorldSize(table);
    const margin = 1.5;
    const hh = getHalfHeight(table);
    table.position.set(half - tSize.x / 2 - margin, hh, table.position.z);

    const vCfg = MODEL_MAP.flower_vase;
    if (!vCfg) return;
    const vBase = await ensurePrototype(vCfg.url);
    const vase = vBase.clone(true);
    vase.userData.kind = 'decor';
    normalizeHeight(vase, vCfg.targetHeight);

    scene.add(vase);
    placeOnTopOf(vase, table, 0.01);
  })();

  return () => {
    renderer.setAnimationLoop(null);
    renderer.dispose();
    window.removeEventListener('resize', onResize);
    if (appElement.contains(renderer.domElement)) {
      appElement.removeChild(renderer.domElement);
    }
  };
}
