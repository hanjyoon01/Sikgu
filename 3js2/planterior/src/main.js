import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/** Renderer */
const app = document.getElementById('app')
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
app.appendChild(renderer.domElement)

/** Scene & Camera */
const scene = new THREE.Scene()
const cubeLoader = new THREE.CubeTextureLoader()
const skybox = cubeLoader.load([
  '/textures/skybox/px.bmp', // +X
  '/textures/skybox/nx.bmp', // -X
  '/textures/skybox/py.bmp', // +Y
  '/textures/skybox/ny.bmp', // -Y
  '/textures/skybox/pz.bmp', // +Z
  '/textures/skybox/nz.bmp', // -Z
])
scene.background = skybox
scene.environment = skybox

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.06
controls.target.set(0, 0.5, 0)

/** Room with textured wallpaper & floor */
let ROOM_WIDTH = 15 // 방 가로
let ROOM_DEPTH = 15 // 방 세로
let WALL_HEIGHT = 6 // 벽 높이 (미터 단위 느낌)
const FLOOR_Y = 0

/** Lights */
scene.add(new THREE.AmbientLight(0xffe8c4, 0.35))
const dirLight = new THREE.DirectionalLight(0xffe8c4, 0.8)
dirLight.position.set(4, 8, 4)
dirLight.castShadow = true
dirLight.shadow.mapSize.set(2048, 2048)
dirLight.shadow.bias = -0.0002
dirLight.shadow.normalBias = 0.02
scene.add(dirLight)

// 태양 빛 (DirectionalLight)
const sun = new THREE.DirectionalLight(0xfff3d1, 1.2) // 약간 따뜻한 톤
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.bias = -0.0002
sun.shadow.normalBias = 0.02

// 태양 위치 (r=20, 고도 45°, 방위 -40° 정도)
let thetaDeg = -40
function updateSun(elevDeg = 45) {
  const elev = THREE.MathUtils.degToRad(elevDeg)
  const theta = THREE.MathUtils.degToRad(thetaDeg)
  const r = 20
  const x = r * Math.cos(elev) * Math.cos(theta)
  const y = r * Math.sin(elev)
  const z = r * Math.cos(elev) * Math.sin(theta)
  sun.position.set(x, y, z)
  sun.target.position.set(0, Math.max(ROOM_WIDTH, ROOM_DEPTH) * 0.35, 0) // 방 중앙 위를 향하게
  scene.add(sun.target)
}
updateSun(40) // 초기 고도 40°
scene.add(sun)

const s = 10 // 그림자 카메라 크기
sun.shadow.camera.left = -s
sun.shadow.camera.right = s
sun.shadow.camera.top = s
sun.shadow.camera.bottom = -s
sun.shadow.camera.near = 0.5
sun.shadow.camera.far = 50

// --- 공용 유틸(텍스처/캔버스) ---
const texLoader = new THREE.TextureLoader()
const maxAniso = renderer.capabilities.getMaxAnisotropy?.() ?? 1

function canvasTexture(cvs) {
  const t = new THREE.CanvasTexture(cvs)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = maxAniso
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
function makeCanvas(w = 512, h = 512) {
  const cvs = document.createElement('canvas')
  cvs.width = w
  cvs.height = h
  return { cvs, ctx: cvs.getContext('2d') }
}
function loadTiledTexture(url, repeatX, repeatY, rotate90 = false) {
  const t = texLoader.load(url)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeatX, repeatY)
  if (rotate90) {
    t.center.set(0.5, 0.5)
    t.rotation = Math.PI / 2
  }
  t.anisotropy = maxAniso
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* ===========================
  ① 홈 스타일 벽지(절차 생성)
  =========================== */
// 따뜻한 크림톤 바탕 + 아주 미세한 노이즈 + 은은한 세로 스트라이프
function createHomeWallpaperTexture({
  base = '#f4efe7',
  stripe = '#ecebe6',
  noise = 6,
  stripeWidth = 14,
  scale = 1.0,
} = {}) {
  const { cvs, ctx } = makeCanvas(512, 512)

  // 바탕
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 512, 512)

  // 은은한 세로 스트라이프
  for (let x = 0; x < 512; x += stripeWidth) {
    ctx.fillStyle = (x / stripeWidth) % 2 === 0 ? stripe : base
    ctx.globalAlpha = 0.25
    ctx.fillRect(x, 0, stripeWidth, 512)
  }
  ctx.globalAlpha = 1

  // 미세 노이즈로 페인트 질감
  const img = ctx.getImageData(0, 0, 512, 512)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = Math.random() * noise - noise / 2 // -noise/2 ~ +noise/2
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)

  const tex = canvasTexture(cvs)
  tex.repeat.set(1 * scale, 1 * scale)
  return tex
}

// 1m 당 타일 반복 기준
const metersPerRepeat = 6.0
let wallRepeatX = ROOM_WIDTH / metersPerRepeat // 앞/뒷벽 가로
let wallRepeatY = WALL_HEIGHT / metersPerRepeat // 벽 높이
let wallRepeatZ = ROOM_DEPTH / metersPerRepeat // 좌/우벽 가로
let floorRepeatX = ROOM_WIDTH / metersPerRepeat
let floorRepeatY = ROOM_DEPTH / metersPerRepeat

// ----- 격자(Grid)는 바닥 바로 위에 얇게 -----
let grid = new THREE.GridHelper(
  Math.max(ROOM_WIDTH, ROOM_DEPTH) - 0.02,
  24,
  0x475569,
  0x334155
)
grid.position.y = FLOOR_Y + 0.01
// scene.add(grid) // 필요하면 주석 해제

// ----- 바닥(Floor): 텍스처 + 그림자 수신 -----
let floorTex = loadTiledTexture(
  '/textures/wood_floor.jpg',
  floorRepeatX,
  floorRepeatY,
  false
)
let floorMat = new THREE.MeshStandardMaterial({
  map: floorTex,
  roughness: 0.85,
  metalness: 0.0,
  side: THREE.DoubleSide,
})
let floor = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
  floorMat
)
floor.rotation.x = -Math.PI / 2
floor.position.y = FLOOR_Y
floor.receiveShadow = true
scene.add(floor)

/* ---------- 외부 잔디 바닥 ---------- */

// Grass texture
const grassTex = texLoader.load('/textures/grass.jpg')
grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping
grassTex.repeat.set(100, 100) // 반복 횟수 (넓게 깔기)
grassTex.anisotropy = renderer.capabilities.getMaxAnisotropy()
grassTex.colorSpace = THREE.SRGBColorSpace

// Grass material
const grassMat = new THREE.MeshStandardMaterial({
  map: grassTex,
  roughness: 1.0,
  metalness: 0.0,
  side: THREE.DoubleSide,
})

// Grass plane (집보다 훨씬 큰 면)
let GRASS_SIZE = Math.max(ROOM_WIDTH, ROOM_DEPTH) * 10 // 방보다 10배 넓게
let grass = new THREE.Mesh(
  new THREE.PlaneGeometry(GRASS_SIZE, GRASS_SIZE),
  grassMat
)
grass.rotation.x = -Math.PI / 2
grass.position.y = FLOOR_Y - 0.001 // 실내 바닥과 거의 같은 높이
grass.receiveShadow = true

scene.add(grass)

// ----- 벽(Walls): 4개의 Plane으로 구성 (천장은 생략/단색 유지) -----
const wallGroup = new THREE.Group()
scene.add(wallGroup)

let wallGeoFB = new THREE.PlaneGeometry(ROOM_WIDTH, WALL_HEIGHT) // 앞/뒷벽
let wallGeoLR = new THREE.PlaneGeometry(ROOM_DEPTH, WALL_HEIGHT) // 좌/우벽
let ceilGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH)

// 홈 스타일 벽지 텍스처 생성 & 적용
const wallpaperTexFB = createHomeWallpaperTexture({
  base: '#f4efe7', // 따뜻한 크림톤
  stripe: '#ecebe6', // 아주 옅은 스트라이프
  noise: 6, // 노이즈 강도(3~8 추천)
  stripeWidth: 14, // 줄 너비(작으면 촘촘)
  scale: 1.0, // 패턴 스케일
})
// 좌/우 벽에도 같은 텍스처 사용 (필요시 회전)
// Plane의 UV가 이미 +Y가 세로 축이므로, 기본적으로 모든 벽에서 수직 줄 유지됨.
const wallpaperTexLR = wallpaperTexFB.clone()

const wallMatFB = new THREE.MeshStandardMaterial({
  map: wallpaperTexFB,
  roughness: 1.0,
  metalness: 0.0,
  side: THREE.DoubleSide,
})
const wallMatLR = new THREE.MeshStandardMaterial({
  map: wallpaperTexLR,
  roughness: 1.0,
  metalness: 0.0,
  side: THREE.DoubleSide,
})

// 초기 벽지 텍스처 반복 설정
wallpaperTexFB.repeat.set(wallRepeatX, wallRepeatY)
wallpaperTexLR.repeat.set(wallRepeatZ, wallRepeatY)

// 앞(남) 벽: z=+ROOM_DEPTH/2
let wallFront = new THREE.Mesh(wallGeoFB, wallMatFB)
wallFront.position.set(0, WALL_HEIGHT / 2, ROOM_DEPTH / 2)
wallFront.rotateY(Math.PI) // 안쪽을 보게 뒤집기
wallFront.receiveShadow = true
wallGroup.add(wallFront)

// 뒤(북) 벽: z=-ROOM_DEPTH/2
let wallBack = new THREE.Mesh(wallGeoFB, wallMatFB)
wallBack.position.set(0, WALL_HEIGHT / 2, -ROOM_DEPTH / 2)
wallBack.receiveShadow = true
wallGroup.add(wallBack)

// 창문 크기/위치 (미터 가정): 폭 12m, 높이 4m, 바닥에서 1m 띄움
const winW = 12,
  winH = 4
const winYCenter = 1 + winH / 2 // 바닥 0에서 창 중심 높이

// 좌(서) 벽: x = -ROOM_WIDTH/2 (왼쪽 벽)
let wallLeft = makeWallWithWindow(
  ROOM_DEPTH,
  WALL_HEIGHT,
  { x: 0, y: winYCenter - WALL_HEIGHT / 2, w: winW, h: winH }, // 로컬좌표로 변환
  wallMatLR
)
wallLeft.position.set(-ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0)
wallLeft.rotateY(Math.PI / 2)
scene.add(wallLeft)

// 우(동) 벽: x = +ROOM_WIDTH/2 (오른쪽 벽)
let wallRight = makeWallWithWindow(
  ROOM_DEPTH,
  WALL_HEIGHT,
  { x: 0, y: winYCenter - WALL_HEIGHT / 2, w: winW, h: winH },
  wallMatLR
)
wallRight.position.set(ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0)
wallRight.rotateY(-Math.PI / 2)
scene.add(wallRight)

// 참고: 기존 BoxGeometry(BackSide) "룸"은 제거함.
// 필요하면 천장 추가:
let ceiling = new THREE.Mesh(
  ceilGeo,
  new THREE.MeshStandardMaterial({
    color: 0xf7f7f7,
    roughness: 1,
    side: THREE.DoubleSide,
  })
)
ceiling.position.set(0, WALL_HEIGHT, 0)
ceiling.rotateX(Math.PI / 2)
ceiling.receiveShadow = true
wallGroup.add(ceiling)

/** ===== Models config (URL, 표준 높이) ===== */
/** ===== Models config (URL, 표준 높이) ===== */
const MODEL_MAP = {
  // 대형
  euphorbia_trigona: {
    label: '유포르비아 트리고나',
    url: '/models/dynamic/big/Euphorbia_Trigona.glb',
    targetHeight: 5,
    showInToolbar: true,
  },
  paradise_plant: {
    label: '극락조',
    url: '/models/dynamic/big/Paradise_Plant.glb',
    targetHeight: 4.5,
    showInToolbar: true,
  },
  rubber_tree: {
    label: '고무나무',
    url: '/models/dynamic/big/Rubber_Tree.glb',
    targetHeight: 5,
    showInToolbar: true,
  },
  stuckyi: {
    label: '스투키',
    url: '/models/dynamic/big/Stuckyi.glb',
    targetHeight: 4.3,
    showInToolbar: true,
  },

  // 중형
  areca_palm: {
    label: '아레카 야자',
    url: '/models/dynamic/middle/Areca_Palm.glb',
    targetHeight: 3.5,
    showInToolbar: true,
  },
  monstera: {
    label: '몬스테라',
    url: '/models/dynamic/middle/Monstera.glb',
    targetHeight: 3.5,
    showInToolbar: true,
  },
  spathiphyllum: {
    label: '스파티필룸',
    url: '/models/dynamic/middle/Spathiphyllum.glb',
    targetHeight: 3.5,
    showInToolbar: true,
  },
  travelers_tree: {
    label: '여인초',
    url: '/models/dynamic/middle/Travelers_Tree.glb',
    targetHeight: 3.5,
    showInToolbar: true,
  },

  // 소형
  calathea_orbifolia: {
    label: '칼라데아 오르비폴리아',
    url: '/models/dynamic/small/Calathea_Orbifolia.glb',
    targetHeight: 2.2,
    showInToolbar: true,
  },
  golden_pothos: {
    label: '스킨답서스',
    url: '/models/dynamic/small/Golden_Pothos.glb',
    targetHeight: 2.2,
    showInToolbar: true,
  },
  mini_cactus: {
    label: '미니 선인장',
    url: '/models/dynamic/small/Mini_Cactus.glb',
    targetHeight: 2.2,
    showInToolbar: true,
  },
  tillandsia: {
    label: '틸란드시아',
    url: '/models/dynamic/small/Tillandsia.glb',
    targetHeight: 2.2,
    showInToolbar: true,
  },

  // 가구구
  sofa: {
    label: '소파',
    url: '/models/static/Sofa.glb',
    targetHeight: 2,
    wallSnap: false, // 벽에 자동으로 붙지 않음
    showInToolbar: true,
  },
  coffee_table: {
    label: '커피 테이블',
    url: '/models/static/Coffee_Table.glb',
    targetHeight: 1.2, // 테이블 높이(대략 42cm)
    showInToolbar: true,
    canPlaceOn: true, // 위에 물건 올릴 수 있음
  },
  sideboard: {
    label: '사이드보드',
    url: '/models/static/Sideboard.glb',
    targetHeight: 1.5, // 전체 높이(대략 80cm)
    showInToolbar: true,
    canPlaceOn: true, // 위에 물건 올릴 수 있음
  },
  television: {
    label: '텔레비전',
    url: '/models/static/Television.glb',
    targetHeight: 3, // TV 전체 높이(대략 60cm)
    showInToolbar: true,
    onlyOnSideboard: true, // 사이드보드에만 올릴 수 있음
  },
  console_table: {
    label: '콘솔 테이블',
    url: '/models/static/Console_Table.glb',
    targetHeight: 2, // 테이블 약 75cm
    showInToolbar: true,
    canPlaceOn: true, // 위에 물건 올릴 수 있음
  },
  flower_vase: {
    label: '꽃병',
    url: '/models/static/Flower_Vase.glb',
    targetHeight: 1.8, // 꽃병 약 30cm
    showInToolbar: true,
  },
}

function renderModelButtons() {
  const bar = document.querySelector('.toolbar')
  if (!bar) return
  // 모델 버튼 묶음을 넣을 컨테이너
  const wrap = document.createElement('div')
  wrap.className = 'row'
  // 기존에 같은 row가 있으면 제거(중복 방지)
  const old = bar.querySelector('.row.model-buttons')
  if (old) old.remove()
  wrap.classList.add('model-buttons')

  for (const [key, cfg] of Object.entries(MODEL_MAP)) {
    if (cfg.showInToolbar) {
      const btn = document.createElement('button')
      btn.dataset.model = key
      btn.textContent = cfg.label
      wrap.appendChild(btn)
    }
  }
  // 툴바 맨 앞에 끼워넣기 (원하면 위치 조절)
  bar.insertBefore(wrap, bar.firstChild)
}

/** ===== Loader & cache ===== */
const loader = new GLTFLoader()
const prototypeCache = new Map() // url -> loaded scene
const loadingCache = new Map() // url -> Promise

function setShadow(obj, cast, receive) {
  obj.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = cast
      c.receiveShadow = receive
    }
  })
}

function ensurePrototype(url) {
  if (prototypeCache.has(url)) return Promise.resolve(prototypeCache.get(url))
  if (loadingCache.has(url)) return loadingCache.get(url)

  const p = new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const base = gltf.scene
        setShadow(base, true, true)
        prototypeCache.set(url, base)
        resolve(base)
      },
      (progress) => {
        // 로딩 진행 상황 (선택사항)
        // console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%')
      },
      (err) => {
        console.error('Failed to load model:', url, err)
        reject(err)
      }
    )
  })
  loadingCache.set(url, p)
  return p
}

/** ===== Utilities ===== */
const draggable = []

/** ===== 방 상태 출력 함수 ===== */
function logRoomState(action = '') {
  const state = {
    action: action || '상태 확인',
    room: {
      width: ROOM_WIDTH,
      depth: ROOM_DEPTH,
      height: WALL_HEIGHT,
    },
    objects: draggable.map((obj) => {
      const modelKey = obj.userData?.modelKey
      const cfg = modelKey ? MODEL_MAP[modelKey] : null
      const placedOn = obj.userData?.placedOn
      const placedItems = obj.userData?.placedItems || []

      return {
        modelKey: modelKey || 'unknown',
        label: cfg?.label || '알 수 없음',
        position: {
          x: Math.round(obj.position.x * 100) / 100,
          y: Math.round(obj.position.y * 100) / 100,
          z: Math.round(obj.position.z * 100) / 100,
        },
        rotation: {
          y: Math.round(((obj.rotation.y * 180) / Math.PI) * 100) / 100, // 도 단위로 변환
        },
        placedOn: placedOn
          ? {
              modelKey: placedOn.userData?.modelKey || 'unknown',
              label:
                MODEL_MAP[placedOn.userData?.modelKey]?.label || '알 수 없음',
            }
          : null,
        placedItemsCount: placedItems.length,
        placedItems: placedItems.map((item) => ({
          modelKey: item.userData?.modelKey || 'unknown',
          label: MODEL_MAP[item.userData?.modelKey]?.label || '알 수 없음',
        })),
      }
    }),
  }

  console.log('=== 방 상태 ===', state)
  return state
}

function getHalfHeight(obj) {
  const box = new THREE.Box3().setFromObject(obj)
  return (box.max.y - box.min.y) / 2 || 0.5
}
function placeOnFloor(obj, posXZ) {
  const hh = getHalfHeight(obj)
  obj.position.set(posXZ.x, hh, posXZ.z)
}
function clampInRoomXZ(x, z, margin = 0.3) {
  const innerX = ROOM_WIDTH / 2 - margin
  const innerZ = ROOM_DEPTH / 2 - margin
  return {
    x: THREE.MathUtils.clamp(x, -innerX, innerX),
    z: THREE.MathUtils.clamp(z, -innerZ, innerZ),
  }
}
function pointInFrontOfCamera() {
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) // y=0
  const dir = new THREE.Vector3()
    .subVectors(controls.target, camera.position)
    .normalize()
  const ray = new THREE.Ray(camera.position.clone(), dir)
  const hit = new THREE.Vector3()
  if (ray.intersectPlane(plane, hit)) {
    const { x, z } = clampInRoomXZ(hit.x, hit.z)
    return new THREE.Vector3(x, 0, z)
  }
  return new THREE.Vector3(0, 0, 0)
}
function randJitter() {
  return new THREE.Vector3(
    (Math.random() - 0.5) * 0.6,
    0,
    (Math.random() - 0.5) * 0.6
  )
}
function normalizeHeight(obj, targetHeight = 1.2) {
  const box = new THREE.Box3().setFromObject(obj)
  const size = new THREE.Vector3()
  box.getSize(size)
  if (size.y > 0) {
    const s = targetHeight / size.y
    obj.scale.setScalar(s)
  }
}

// 어떤 벽이 가까운지 계산
function getNearestWallSide(posXZ) {
  const halfW = ROOM_WIDTH / 2
  const halfD = ROOM_DEPTH / 2
  const dLeft = Math.abs(posXZ.x - -halfW)
  const dRight = Math.abs(posXZ.x - +halfW)
  const dBack = Math.abs(posXZ.z - -halfD)
  const dFront = Math.abs(posXZ.z - +halfD)
  const min = Math.min(dLeft, dRight, dBack, dFront)
  if (min === dLeft) return 'left'
  if (min === dRight) return 'right'
  if (min === dBack) return 'back'
  return 'front'
}

// 회전이 반영된 실제 월드 크기
function getWorldSize(obj) {
  const box = new THREE.Box3().setFromObject(obj)
  const size = new THREE.Vector3()
  box.getSize(size)
  return size
}

// target(소파) 정면 방향으로 gap 만큼 띄워 앞에 배치
function placeInFrontOf(obj, target, gap = 0.2) {
  // 테이블 회전을 소파와 맞춤
  obj.rotation.y = target.rotation.y

  const sofaSize = getWorldSize(target)
  const tableSize = getWorldSize(obj)

  // 소파의 "정면" 방향 벡터 (y-회전만 고려)
  const fwd = new THREE.Vector3(0, 0, 1)
    .applyEuler(new THREE.Euler(0, target.rotation.y, 0))
    .normalize()

  // 두 물체의 하프-깊이 + 간격만큼 전방으로 이동
  const offset = sofaSize.z / 2 + tableSize.z / 2 + gap

  const pos = target.position
    .clone()
    .add(new THREE.Vector3(fwd.x, 0, fwd.z).multiplyScalar(offset))

  // 방 범위 클램프 + 바닥에 올리기
  const { x, z } = clampInRoomXZ(pos.x, pos.z)
  const hh = getHalfHeight(obj)
  obj.position.set(x, hh, z)
}

// 지정한 벽에 ‘등’이 닿도록 붙이고, 드래그시 벽 따라만 움직이게 세팅
function placeAgainstWall(obj, side, gap = 0.03) {
  // 1) 회전: 방 안쪽을 바라보게
  //   - back(z=-half)  → +Z 바라봄 (rotY = 0)
  //   - front(z=+half) → -Z (rotY = Math.PI)
  //   - left(x=-half)  → +X (rotY = -Math.PI/2)
  //   - right(x=+half) → -X (rotY =  Math.PI/2)
  switch (side) {
    case 'front':
      obj.rotation.y = Math.PI
      break
    case 'left':
      obj.rotation.y = -Math.PI / 2
      break
    case 'right':
      obj.rotation.y = Math.PI / 2
      break
    case 'back':
    default:
      obj.rotation.y = 0
      break
  }

  // 2) 회전이 적용된 상태에서 실제 월드 bbox 크기 측정
  const size = getWorldSize(obj)
  const halfW = ROOM_WIDTH / 2
  const halfD = ROOM_DEPTH / 2

  // 3) 벽에 밀착: 해당 축을 고정하고, 나머지 축은 현재 위치 유지
  const current = obj.position.clone()
  const hh = getHalfHeight(obj)

  if (side === 'back') {
    obj.position.set(current.x, hh, -halfD + size.z / 2 + gap)
  } else if (side === 'front') {
    obj.position.set(current.x, hh, +halfD - size.z / 2 - gap)
  } else if (side === 'left') {
    obj.position.set(-halfW + size.x / 2 + gap, hh, current.z)
  } else if (side === 'right') {
    obj.position.set(+halfW - size.x / 2 - gap, hh, current.z)
  }

  // 4) 드래그 제약 정보 저장 (벽을 따라만 이동)
  obj.userData.wallSide = side
}

// base의 "앞을 바라보는 기준"에서 오른쪽(+1) 또는 왼쪽(-1)으로 obj를 같은 벽에 나란히 배치
function placeBesideOnWall(obj, base, sideSign = +1, gap = 0.12) {
  // 회전 동일
  obj.rotation.y = base.rotation.y

  // 오른쪽 방향 벡터 (base의 y-회전 기준)
  const right = new THREE.Vector3(1, 0, 0)
    .applyEuler(new THREE.Euler(0, base.rotation.y, 0))
    .normalize()

  const baseSize = getWorldSize(base)
  const objSize = getWorldSize(obj)
  const offset = baseSize.x / 2 + objSize.x / 2 + gap

  // 가로(평행축)로만 이동
  const target = base.position
    .clone()
    .add(right.multiplyScalar(sideSign * offset))

  // 방 범위 보정 후 임시 위치
  const { x, z } = clampInRoomXZ(target.x, target.z)
  const hh = getHalfHeight(obj)
  obj.position.set(x, hh, z)

  // base와 같은 벽에 밀착
  const wall = base.userData?.wallSide || 'front'
  placeAgainstWall(obj, wall, 0.02)
}

// 소파가 붙은 벽의 반대편 벽을 구함
function oppositeSide(side) {
  switch (side) {
    case 'back':
      return 'front'
    case 'front':
      return 'back'
    case 'left':
      return 'right'
    case 'right':
      return 'left'
    default:
      return 'front'
  }
}

// base(거실장) 위 가운데에 obj(TV)를 올림
function placeOnTopOf(obj, base, gapY = 0.02) {
  // 회전은 거실장과 동일하게 맞춤 (정면 동일)
  obj.rotation.y = base.rotation.y

  // 월드 박스 사이즈/최상단 Y 계산
  const baseBox = new THREE.Box3().setFromObject(base)
  const objBox = new THREE.Box3().setFromObject(obj)
  const baseSize = new THREE.Vector3()
  const objSize = new THREE.Vector3()
  baseBox.getSize(baseSize)
  objBox.getSize(objSize)

  // 거실장 상단 높이
  const topY = baseBox.max.y

  // 거실장 중심 기준으로 TV 중심 정렬
  const pos = base.position.clone()
  const hh = objSize.y / 2
  obj.position.set(pos.x, topY + hh + gapY, pos.z)
}

/** ===== Create instance by key ===== */
async function addModelByKey(key, posXZ = null) {
  const cfg = MODEL_MAP[key]
  if (!cfg) {
    console.warn('Model config not found for key:', key)
    return
  }

  try {
    const base = await ensurePrototype(cfg.url)
    const model = base.clone(true)

    // 표준 높이로 정규화 후 배치 기준점 계산
    normalizeHeight(model, cfg.targetHeight)
    const spawn = (posXZ ?? pointInFrontOfCamera()).clone().add(randJitter())
    placeOnFloor(model, spawn)

    // 소파처럼 벽 스냅 대상이면, 가장 가까운 벽을 골라 붙임
    if (cfg.wallSnap) {
      const side = getNearestWallSide(spawn)
      // scene에 있어야 bbox가 제대로 나와서, 없으면 임시로 추가
      if (!model.parent) scene.add(model)
      placeAgainstWall(model, side)
    } else {
      // 일반 모델은 그냥 바닥에
      if (!model.parent) scene.add(model)
    }

    // 모델 키 저장 (나중에 canPlaceOn 확인용)
    model.userData.modelKey = key

    // 드래그 대상 등록
    // model.userData.kind =
    //   key.includes('sofa') || key.includes('coffee') ? 'furniture' : 'plant'
    // applyShadowPolicyTo(model) // ← 추가
    // scene.add(model)
    draggable.push(model)

    // 방 상태 출력
    logRoomState(`모델 생성: ${cfg.label}`)
  } catch (error) {
    console.error('Failed to add model:', key, error)
    alert(`모델 "${cfg.label}" 로딩에 실패했습니다. 콘솔을 확인하세요.`)
  }
}

/** ===== Drag & Delete ===== */
const raycaster = new THREE.Raycaster()
const mouseNDC = new THREE.Vector2()
let selected = null
let dragPlane = null
let dragOffset = new THREE.Vector3()
let selectedHalfH = 0
let isPointerDown = false
let previewModel = null // 프리뷰 모델
let previewBaseObj = null // 프리뷰가 표시되는 가구
let isDoubleClick = false // 더블클릭 발생 여부
let lastClickTime = 0 // 마지막 클릭 시간
let clickTimeout = null // 클릭 타임아웃

function setMouseFromEvent(e) {
  const rect = renderer.domElement.getBoundingClientRect()
  mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
}

function pick(e) {
  setMouseFromEvent(e)
  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(draggable, true) // recursive
  if (hits.length) {
    let obj = hits[0].object
    while (obj && !draggable.includes(obj)) obj = obj.parent
    if (!obj) return

    selected = obj
    selectedHalfH = getHalfHeight(selected)
    dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -selectedHalfH) // y=halfH

    const hitPoint = new THREE.Vector3()
    raycaster.ray.intersectPlane(dragPlane, hitPoint)
    dragOffset.copy(selected.position).sub(hitPoint)

    // 기존 프리뷰 제거
    removePreview()

    controls.enabled = false
    renderer.domElement.style.cursor = 'grabbing'
  }
}

function move(e) {
  if (!selected) return
  setMouseFromEvent(e)
  raycaster.setFromCamera(mouseNDC, camera)
  const point = new THREE.Vector3()
  if (raycaster.ray.intersectPlane(dragPlane, point)) {
    point.add(dragOffset)
    const { x, z } = clampInRoomXZ(point.x, point.z)

    // 가구 위에 올려놓은 경우, 드래그 시 부모 관계 해제
    if (selected.userData.placedOn) {
      const baseObj = selected.userData.placedOn
      if (baseObj.userData.placedItems) {
        const idx = baseObj.userData.placedItems.indexOf(selected)
        if (idx !== -1) {
          baseObj.userData.placedItems.splice(idx, 1)
        }
      }
      selected.userData.placedOn = null
    }

    // 이전 위치 저장 (위에 올려진 아이템들도 함께 이동시키기 위해)
    const oldPos = selected.position.clone()

    const side = selected?.userData?.wallSide
    if (side === 'back' || side === 'front') {
      // z 고정, x만 이동
      selected.position.set(x, selectedHalfH, selected.position.z)
    } else if (side === 'left' || side === 'right') {
      // x 고정, z만 이동
      selected.position.set(selected.position.x, selectedHalfH, z)
    } else {
      // 일반 자유 이동
      selected.position.set(x, selectedHalfH, z)
    }

    // 테이블 위에 올려진 아이템들도 함께 이동
    const placedItems = selected.userData?.placedItems
    if (placedItems && placedItems.length > 0) {
      const offset = new THREE.Vector3()
      offset.subVectors(selected.position, oldPos)

      placedItems.forEach((item) => {
        if (item && item.parent) {
          // 아이템도 같은 거리만큼 이동
          item.position.add(offset)
        }
      })
    }

    // 프리뷰 업데이트 (가구 위에 올릴 수 있는지 확인)
    updatePreview()
  }
}

// 프리뷰 제거 함수
function removePreview() {
  if (previewModel) {
    scene.remove(previewModel)
    previewModel = null
    previewBaseObj = null
  }
}

// 프리뷰 업데이트 함수
function updatePreview() {
  if (!selected) {
    removePreview()
    return
  }

  // 드래그 위치에서 아래로 레이캐스팅하여 가구 위에 올려놓을 수 있는지 확인
  const checkPoint = selected.position.clone()
  checkPoint.y += 1.0 // 객체 위에서 시작해서 아래로 쏘기

  const downRay = new THREE.Raycaster(
    checkPoint,
    new THREE.Vector3(0, -1, 0), // 아래 방향
    0, // near
    15 // far (충분히 긴 거리)
  )

  // 선택된 객체의 모델 키 확인
  const selectedKey = selected.userData?.modelKey
  const selectedCfg = selectedKey ? MODEL_MAP[selectedKey] : null

  // 선택된 객체가 가구인지 확인 (가구는 가구 위에 올릴 수 없음, 단 꽃병과 텔레비전은 예외)
  const isFurniture =
    selectedKey &&
    [
      'sofa',
      'coffee_table',
      'sideboard',
      // 'television', // 텔레비전은 사이드보드 위에 올릴 수 있음
      'console_table',
      // 'flower_vase', // 꽃병은 가구 위에 올릴 수 있음
    ].includes(selectedKey)

  // 가구는 가구 위에 올릴 수 없음 (꽃병과 텔레비전 제외)
  if (isFurniture) {
    removePreview()
    return
  }

  // canPlaceOn이 true인 가구들만 체크 (꽃병 제외)
  // 텔레비전의 경우 사이드보드만 허용
  const placeableFurniture = draggable.filter((obj) => {
    if (obj === selected) return false // 자기 자신은 제외
    const modelKey = obj.userData?.modelKey
    if (modelKey && MODEL_MAP[modelKey]) {
      const objCfg = MODEL_MAP[modelKey]

      // 꽃병 위에는 아무것도 올릴 수 없음
      if (modelKey === 'flower_vase') {
        return false
      }

      // 텔레비전인 경우 사이드보드만 허용
      if (selectedCfg?.onlyOnSideboard) {
        return modelKey === 'sideboard'
      }

      // 일반적으로 canPlaceOn이 true인 가구
      return objCfg.canPlaceOn || false
    }
    return false
  })

  // 레이캐스팅으로 가구 감지
  const hits = downRay.intersectObjects(placeableFurniture, true)

  // 레이캐스팅이 실패한 경우, 위치 기반으로 가장 가까운 가구 찾기
  let baseObj = null
  if (hits.length > 0) {
    baseObj = hits[0].object
    while (baseObj && !draggable.includes(baseObj)) baseObj = baseObj.parent
  } else {
    // 레이캐스팅 실패 시, 가장 가까운 가구 찾기
    let minDist = Infinity
    placeableFurniture.forEach((obj) => {
      const dist = selected.position.distanceTo(obj.position)
      if (dist < minDist && dist < 3) {
        // 3미터 이내
        minDist = dist
        baseObj = obj
      }
    })
  }

  // 가구 위에 올릴 수 있는 경우 프리뷰 표시
  if (baseObj && baseObj !== selected) {
    // 같은 가구 위면 프리뷰 위치만 업데이트
    if (previewBaseObj === baseObj && previewModel) {
      // 프리뷰 위치 업데이트 (가구 중심에 고정)
      const baseBox = new THREE.Box3().setFromObject(baseObj)
      const objBox = new THREE.Box3().setFromObject(previewModel)
      const objSize = new THREE.Vector3()
      objBox.getSize(objSize)

      const topY = baseBox.max.y
      const hh = objSize.y / 2
      // 가구의 중심 위치에 고정
      previewModel.position.set(
        baseObj.position.x,
        topY + hh + 0.01,
        baseObj.position.z
      )
      // 원본 모델의 회전도 반영
      previewModel.rotation.y = selected.rotation.y
    } else {
      // 새로운 가구 위에 올릴 수 있으면 프리뷰 생성
      removePreview()

      // 프리뷰 모델 생성 (원본의 클론)
      previewModel = selected.clone(true)

      // 프리뷰 모델을 반투명하게 만들기
      previewModel.traverse((child) => {
        if (child.isMesh) {
          if (child.material) {
            // Material이 배열인 경우 처리
            if (Array.isArray(child.material)) {
              child.material = child.material.map((mat) => {
                const previewMat = mat.clone()
                previewMat.transparent = true
                previewMat.opacity = 0.4
                previewMat.emissive = new THREE.Color(0x4488ff).multiplyScalar(
                  0.2
                ) // 약간의 파란색 발광
                return previewMat
              })
            } else {
              const previewMat = child.material.clone()
              previewMat.transparent = true
              previewMat.opacity = 0.4
              previewMat.emissive = new THREE.Color(0x4488ff).multiplyScalar(
                0.2
              ) // 약간의 파란색 발광
              child.material = previewMat
            }
            child.castShadow = false
            child.receiveShadow = false
          }
        }
      })

      // 가구 위에 배치
      placeOnTopOf(previewModel, baseObj, 0.01)
      previewModel.rotation.y = selected.rotation.y

      scene.add(previewModel)
      previewBaseObj = baseObj
    }
  } else {
    // 가구 위에 올릴 수 없으면 프리뷰 제거
    removePreview()
  }
}

function drop(skipLog = false) {
  // 프리뷰 제거
  removePreview()

  if (selected) {
    // 드롭 위치에서 아래로 레이캐스팅하여 가구 위에 올려놓을 수 있는지 확인
    // 여러 지점에서 레이캐스팅하여 더 정확하게 감지
    const dropPoint = selected.position.clone()
    dropPoint.y += 1.0 // 객체 위에서 시작해서 아래로 쏘기

    const downRay = new THREE.Raycaster(
      dropPoint,
      new THREE.Vector3(0, -1, 0), // 아래 방향
      0, // near
      15 // far (충분히 긴 거리)
    )

    // 선택된 객체의 모델 키 확인
    const selectedKey = selected.userData?.modelKey
    const selectedCfg = selectedKey ? MODEL_MAP[selectedKey] : null

    // 선택된 객체가 가구인지 확인 (가구는 가구 위에 올릴 수 없음, 단 꽃병과 텔레비전은 예외)
    const isFurniture =
      selectedKey &&
      [
        'sofa',
        'coffee_table',
        'sideboard',
        // 'television', // 텔레비전은 사이드보드 위에 올릴 수 있음
        'console_table',
        // 'flower_vase', // 꽃병은 가구 위에 올릴 수 있음
      ].includes(selectedKey)

    // 가구는 가구 위에 올릴 수 없음 (꽃병과 텔레비전 제외) - 바닥에 배치
    if (isFurniture) {
      selected.position.y = selectedHalfH
      selected.userData.placedOn = null

      // 방 상태 출력 (실제로 객체를 드래그한 경우에만, 더블클릭이 아닐 때만)
      if (!skipLog) {
        logRoomState('객체 이동/배치')
      }

      selected = null
      dragPlane = null
      controls.enabled = true
      renderer.domElement.style.cursor = 'default'
      return
    }

    // canPlaceOn이 true인 가구들만 체크 (꽃병 제외)
    // 텔레비전의 경우 사이드보드만 허용
    const placeableFurniture = draggable.filter((obj) => {
      if (obj === selected) return false // 자기 자신은 제외
      const modelKey = obj.userData?.modelKey
      if (modelKey && MODEL_MAP[modelKey]) {
        const objCfg = MODEL_MAP[modelKey]

        // 꽃병 위에는 아무것도 올릴 수 없음
        if (modelKey === 'flower_vase') {
          return false
        }

        // 텔레비전인 경우 사이드보드만 허용
        if (selectedCfg?.onlyOnSideboard) {
          return modelKey === 'sideboard'
        }

        // 일반적으로 canPlaceOn이 true인 가구
        return objCfg.canPlaceOn || false
      }
      return false
    })

    // 레이캐스팅으로 가구 감지
    const hits = downRay.intersectObjects(placeableFurniture, true)

    // 레이캐스팅이 실패한 경우, 위치 기반으로 가장 가까운 가구 찾기
    let baseObj = null
    if (hits.length > 0) {
      baseObj = hits[0].object
      while (baseObj && !draggable.includes(baseObj)) baseObj = baseObj.parent
    } else {
      // 레이캐스팅 실패 시, 가장 가까운 가구 찾기
      let minDist = Infinity
      placeableFurniture.forEach((obj) => {
        const dist = selected.position.distanceTo(obj.position)
        if (dist < minDist && dist < 3) {
          // 3미터 이내
          minDist = dist
          baseObj = obj
        }
      })
    }

    if (baseObj && baseObj !== selected) {
      // 가구 위에 올려놓기
      placeOnTopOf(selected, baseObj, 0.01)

      // userData에 부모 정보 저장
      selected.userData.placedOn = baseObj
      if (!baseObj.userData.placedItems) {
        baseObj.userData.placedItems = []
      }
      if (!baseObj.userData.placedItems.includes(selected)) {
        baseObj.userData.placedItems.push(selected)
      }
    } else {
      // 바닥에 배치
      selected.position.y = selectedHalfH
      selected.userData.placedOn = null
    }

    // 방 상태 출력 (실제로 객체를 드래그한 경우에만, 더블클릭이 아닐 때만)
    if (!skipLog) {
      logRoomState('객체 이동/배치')
    }
  }

  selected = null
  dragPlane = null
  controls.enabled = true
  renderer.domElement.style.cursor = 'default'
}

/** Pointer & context menu */
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault())

renderer.domElement.addEventListener('pointerdown', (e) => {
  // 우클릭 → 삭제
  if (e.button === 2) {
    setMouseFromEvent(e)
    raycaster.setFromCamera(mouseNDC, camera)
    const hits = raycaster.intersectObjects(draggable, true)
    if (hits.length) {
      let obj = hits[0].object
      while (obj && !draggable.includes(obj)) obj = obj.parent
      if (obj) {
        // 테이블 위에 올려진 아이템들을 바닥에 배치
        const placedItems = obj.userData?.placedItems
        if (placedItems && placedItems.length > 0) {
          placedItems.forEach((item) => {
            if (item && item.parent) {
              // 바닥에 배치
              const hh = getHalfHeight(item)
              item.position.y = hh
              item.userData.placedOn = null
            }
          })
        }

        const modelKey = obj.userData?.modelKey
        const cfg = modelKey ? MODEL_MAP[modelKey] : null
        const label = cfg?.label || '알 수 없음'

        scene.remove(obj)
        const idx = draggable.indexOf(obj)
        if (idx !== -1) draggable.splice(idx, 1)

        // 방 상태 출력
        logRoomState(`객체 삭제: ${label}`)
      }
    }
    return
  }

  // 좌클릭 → 드래그
  if (e.button === 0) {
    // 더블클릭 감지: 짧은 시간 내 두 번 클릭하면 더블클릭으로 간주
    const now = Date.now()
    const timeSinceLastClick = now - lastClickTime
    lastClickTime = now

    // 이전 클릭 타임아웃이 있으면 취소
    if (clickTimeout) {
      clearTimeout(clickTimeout)
      clickTimeout = null
    }

    // 짧은 시간 내 두 번 클릭된 경우 더블클릭으로 간주하고 pick() 호출하지 않음
    if (timeSinceLastClick < 300) {
      // 더블클릭으로 간주, pick() 호출하지 않음
      return
    }

    // 더블클릭이 아닌 경우에만 pick() 호출
    // 하지만 잠시 후 더블클릭이 발생할 수 있으므로 타임아웃 설정
    clickTimeout = setTimeout(() => {
      // 타임아웃이 지나면 일반 클릭으로 처리
      clickTimeout = null
    }, 300)

    isPointerDown = true
    pick(e)
  }
})

renderer.domElement.addEventListener('pointermove', (e) => {
  if (!isPointerDown) return
  move(e)
})

window.addEventListener('pointerup', () => {
  isPointerDown = false
  // 더블클릭이 발생한 경우 drop()에서 출력하지 않도록 플래그 확인
  const wasDoubleClick = isDoubleClick
  if (wasDoubleClick) {
    isDoubleClick = false // 플래그 리셋
    selected = null // selected도 null로 설정
    return // 더블클릭인 경우 drop() 호출하지 않음
  }
  drop(false)
})

/** 더블클릭으로 객체 90도 회전 */
renderer.domElement.addEventListener('dblclick', (e) => {
  e.preventDefault()
  e.stopPropagation()
  // 더블클릭 플래그 설정
  isDoubleClick = true
  // 더블클릭은 드래그가 아니므로 selected를 null로 설정
  selected = null
  // 클릭 타임아웃 취소
  if (clickTimeout) {
    clearTimeout(clickTimeout)
    clickTimeout = null
  }

  setMouseFromEvent(e)
  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(draggable, true)

  if (hits.length) {
    let obj = hits[0].object
    while (obj && !draggable.includes(obj)) obj = obj.parent
    if (obj) {
      // Y축으로 90도 회전
      obj.rotation.y += Math.PI / 2

      // 위에 올라가 있는 아이템들도 함께 회전
      const placedItems = obj.userData?.placedItems
      if (placedItems && placedItems.length > 0) {
        placedItems.forEach((item) => {
          if (item && item.parent) {
            // 같은 각도만큼 회전
            item.rotation.y += Math.PI / 2
            // 회전 후 위치 재조정 (가구 위에 다시 올리기)
            placeOnTopOf(item, obj, 0.01)
          }
        })
      }

      // 벽에 붙은 객체의 경우, 회전 후에도 벽에 맞게 재배치
      const wallSide = obj.userData?.wallSide
      if (wallSide) {
        const hh = getHalfHeight(obj)
        const size = getWorldSize(obj)
        const halfW = ROOM_WIDTH / 2
        const halfD = ROOM_DEPTH / 2
        const gap = 0.03

        const current = obj.position.clone()

        // 회전 후 크기가 바뀌었을 수 있으므로 다시 계산
        if (wallSide === 'back') {
          obj.position.set(current.x, hh, -halfD + size.z / 2 + gap)
        } else if (wallSide === 'front') {
          obj.position.set(current.x, hh, +halfD - size.z / 2 - gap)
        } else if (wallSide === 'left') {
          obj.position.set(-halfW + size.x / 2 + gap, hh, current.z)
        } else if (wallSide === 'right') {
          obj.position.set(+halfW - size.x / 2 - gap, hh, current.z)
        }

        // 벽에 붙은 객체 위의 아이템들도 위치 재조정
        if (placedItems && placedItems.length > 0) {
          placedItems.forEach((item) => {
            if (item && item.parent) {
              placeOnTopOf(item, obj, 0.01)
            }
          })
        }
      } else {
        // 일반 객체는 높이만 재조정
        const hh = getHalfHeight(obj)
        obj.position.y = hh
      }

      // 방 상태 출력
      const modelKey = obj.userData?.modelKey
      const cfg = modelKey ? MODEL_MAP[modelKey] : null
      const label = cfg?.label || '알 수 없음'
      logRoomState(`객체 회전: ${label}`)
    }
  }
})

/** Toolbar actions */
renderModelButtons() // ← 버튼 자동 생성

document.querySelector('.toolbar').addEventListener('click', (e) => {
  const key = e.target?.dataset?.model
  if (!key) return
  addModelByKey(key)
})

/** Room size control */
const roomWidthInput = document.getElementById('room-width')
const roomDepthInput = document.getElementById('room-depth')
const roomHeightInput = document.getElementById('room-height')
const applyRoomSizeBtn = document.getElementById('apply-room-size')

applyRoomSizeBtn.addEventListener('click', () => {
  const width = parseFloat(roomWidthInput.value)
  const depth = parseFloat(roomDepthInput.value)
  const height = parseFloat(roomHeightInput.value)
  if (
    !isNaN(width) &&
    !isNaN(depth) &&
    !isNaN(height) &&
    width > 0 &&
    depth > 0 &&
    height > 0
  ) {
    updateRoomSize(width, depth, height)
  }
})

// Enter 키로도 적용 가능
roomWidthInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') applyRoomSizeBtn.click()
})
roomDepthInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') applyRoomSizeBtn.click()
})
roomHeightInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') applyRoomSizeBtn.click()
})

/** Resize */
window.addEventListener('resize', onResize)
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

/** UI hint */
const hint = document.createElement('div')
hint.className = 'hint'
hint.innerHTML = `
<b>조작 방법</b><br/>
- 상단 버튼으로 모델 추가<br/>
- 드래그: 바닥(XZ) 위 이동(높이 고정)<br/>
- 더블클릭: 객체 90도 회전<br/>
- 우클릭: 객체 삭제<br/>
- Orbit: 좌클릭 회전 / 휠 줌 / 우클릭 패닝<br/>
- 화살표 키/WASD: 카메라 이동
`
app.appendChild(hint)

/** 카메라를 방 안으로 제한하는 함수 */
function clampCameraToRoom() {
  const margin = 0.5 // 벽에서 떨어질 최소 거리
  const minY = 0.5 // 바닥에서 최소 높이
  const maxY = WALL_HEIGHT - 0.5 // 천장에서 최소 거리

  const halfW = ROOM_WIDTH / 2 - margin
  const halfD = ROOM_DEPTH / 2 - margin

  // 카메라 위치 제한
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -halfW, halfW)
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, minY, maxY)
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -halfD, halfD)

  // 타겟 위치도 방 안으로 제한
  controls.target.x = THREE.MathUtils.clamp(controls.target.x, -halfW, halfW)
  controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0, WALL_HEIGHT)
  controls.target.z = THREE.MathUtils.clamp(controls.target.z, -halfD, halfD)

  // 줌 범위도 방 크기에 맞게 업데이트
  controls.minDistance = 1
  controls.maxDistance = Math.max(ROOM_WIDTH, ROOM_DEPTH, WALL_HEIGHT) * 1.5
}

// 초기 카메라 위치를 방 안으로 설정
camera.position.set(
  Math.min(ROOM_WIDTH / 2 - 1, 8),
  WALL_HEIGHT * 0.6,
  Math.min(ROOM_DEPTH / 2 - 1, 8)
)

/** 화살표 키로 카메라 이동 */
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false,
}

const cameraMoveSpeed = 0.15 // 카메라 이동 속도

// 키보드 이벤트 리스너
window.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.code)) {
    keys[e.code] = true
    e.preventDefault()
  }
})

window.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.code)) {
    keys[e.code] = false
    e.preventDefault()
  }
})

// 카메라 이동 처리 함수
function handleCameraMovement() {
  if (
    !keys.ArrowUp &&
    !keys.ArrowDown &&
    !keys.ArrowLeft &&
    !keys.ArrowRight &&
    !keys.KeyW &&
    !keys.KeyS &&
    !keys.KeyA &&
    !keys.KeyD
  ) {
    return // 아무 키도 눌리지 않음
  }

  // 카메라의 현재 방향 계산
  const direction = new THREE.Vector3()
  camera.getWorldDirection(direction)

  // 수평면에서의 방향 (Y축 제거)
  const horizontalDirection = new THREE.Vector3(
    direction.x,
    0,
    direction.z
  ).normalize()

  // 오른쪽 방향 (카메라의 오른쪽)
  const rightDirection = new THREE.Vector3()
  rightDirection
    .crossVectors(horizontalDirection, new THREE.Vector3(0, 1, 0))
    .normalize()

  const moveVector = new THREE.Vector3(0, 0, 0)

  // 앞/뒤 이동 (위/아래 화살표 또는 W/S)
  if (keys.ArrowUp || keys.KeyW) {
    moveVector.add(horizontalDirection.clone().multiplyScalar(cameraMoveSpeed))
  }
  if (keys.ArrowDown || keys.KeyS) {
    moveVector.add(horizontalDirection.clone().multiplyScalar(-cameraMoveSpeed))
  }

  // 좌/우 이동 (좌/우 화살표 또는 A/D)
  if (keys.ArrowRight || keys.KeyD) {
    moveVector.add(rightDirection.clone().multiplyScalar(cameraMoveSpeed))
  }
  if (keys.ArrowLeft || keys.KeyA) {
    moveVector.add(rightDirection.clone().multiplyScalar(-cameraMoveSpeed))
  }

  // 카메라와 타겟 모두 이동
  camera.position.add(moveVector)
  controls.target.add(moveVector)
}

/** Loop */
renderer.setAnimationLoop(() => {
  handleCameraMovement() // 화살표 키로 카메라 이동
  controls.update()
  clampCameraToRoom() // 카메라를 방 안으로 제한
  renderer.render(scene, camera)
})

// 벽 중앙(로컬) 기준으로 직사각형 구멍을 뚫은 벽 생성
function makeWallWithWindow(width, height, holeRect, material) {
  // holeRect: { x, y, w, h } — 벽 로컬좌표(중앙 0,0), +x 오른쪽, +y 위
  const shape = new THREE.Shape()
  shape.moveTo(-width / 2, -height / 2)
  shape.lineTo(+width / 2, -height / 2)
  shape.lineTo(+width / 2, +height / 2)
  shape.lineTo(-width / 2, +height / 2)
  shape.lineTo(-width / 2, -height / 2)

  const hole = new THREE.Path()
  const { x, y, w, h } = holeRect
  hole.moveTo(x - w / 2, y - h / 2)
  hole.lineTo(x + w / 2, y - h / 2)
  hole.lineTo(x + w / 2, y + h / 2)
  hole.lineTo(x - w / 2, y + h / 2)
  hole.lineTo(x - w / 2, y - h / 2)
  shape.holes.push(hole)

  const geom = new THREE.ShapeGeometry(shape)
  const mesh = new THREE.Mesh(geom, material)
  mesh.receiveShadow = true
  mesh.castShadow = true // 벽 자체도 햇빛을 가려 창문 모양 그림자 생성
  return mesh
}

/** ===== 방 크기 변경 함수 ===== */
function updateRoomSize(width, depth, height) {
  // 최소 크기 제한
  const minSize = 5
  const maxSize = 50
  const minHeight = 3
  const maxHeight = 15
  ROOM_WIDTH = THREE.MathUtils.clamp(width, minSize, maxSize)
  ROOM_DEPTH = THREE.MathUtils.clamp(depth, minSize, maxSize)
  WALL_HEIGHT = THREE.MathUtils.clamp(height, minHeight, maxHeight)

  // 텍스처 반복 업데이트
  wallRepeatX = ROOM_WIDTH / metersPerRepeat
  wallRepeatY = WALL_HEIGHT / metersPerRepeat // 벽 높이 기준
  wallRepeatZ = ROOM_DEPTH / metersPerRepeat // 좌/우벽 가로 기준
  floorRepeatX = ROOM_WIDTH / metersPerRepeat
  floorRepeatY = ROOM_DEPTH / metersPerRepeat

  // 바닥 업데이트
  floor.geometry.dispose()
  floor.geometry = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH)
  floorTex.repeat.set(floorRepeatX, floorRepeatY)

  // 잔디 업데이트
  GRASS_SIZE = Math.max(ROOM_WIDTH, ROOM_DEPTH) * 10
  grass.geometry.dispose()
  grass.geometry = new THREE.PlaneGeometry(GRASS_SIZE, GRASS_SIZE)

  // 격자 업데이트
  if (grid.parent) scene.remove(grid)
  grid.dispose()
  grid = new THREE.GridHelper(
    Math.max(ROOM_WIDTH, ROOM_DEPTH) - 0.02,
    24,
    0x475569,
    0x334155
  )
  grid.position.y = FLOOR_Y + 0.01
  // scene.add(grid) // 필요하면 주석 해제

  // 벽 업데이트
  // 앞/뒷벽 - 각각 독립적인 geometry로 업데이트
  if (wallFront.geometry !== wallGeoFB) {
    wallFront.geometry.dispose()
  }
  if (wallBack.geometry !== wallGeoFB) {
    wallBack.geometry.dispose()
  }
  wallGeoFB.dispose()
  wallGeoFB = new THREE.PlaneGeometry(ROOM_WIDTH, WALL_HEIGHT)

  // 벽지 텍스처 반복 업데이트
  // 앞/뒷벽: 가로(ROOM_WIDTH) x 세로(WALL_HEIGHT)
  wallpaperTexFB.repeat.set(wallRepeatX, wallRepeatY)
  // 좌/우벽: 가로(ROOM_DEPTH) x 세로(WALL_HEIGHT)
  wallpaperTexLR.repeat.set(wallRepeatZ, wallRepeatY)

  // 앞벽 업데이트
  wallFront.geometry = new THREE.PlaneGeometry(ROOM_WIDTH, WALL_HEIGHT)
  wallFront.position.set(0, WALL_HEIGHT / 2, ROOM_DEPTH / 2)

  // 뒷벽 업데이트
  wallBack.geometry = new THREE.PlaneGeometry(ROOM_WIDTH, WALL_HEIGHT)
  wallBack.position.set(0, WALL_HEIGHT / 2, -ROOM_DEPTH / 2)

  // 좌/우벽 - 창문이 있어서 재생성 필요
  scene.remove(wallLeft)
  scene.remove(wallRight)
  if (wallLeft.geometry) wallLeft.geometry.dispose()
  if (wallRight.geometry) wallRight.geometry.dispose()

  wallLeft = makeWallWithWindow(
    ROOM_DEPTH,
    WALL_HEIGHT,
    { x: 0, y: winYCenter - WALL_HEIGHT / 2, w: winW, h: winH },
    wallMatLR
  )
  wallLeft.position.set(-ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0)
  wallLeft.rotateY(Math.PI / 2)
  scene.add(wallLeft)

  wallRight = makeWallWithWindow(
    ROOM_DEPTH,
    WALL_HEIGHT,
    { x: 0, y: winYCenter - WALL_HEIGHT / 2, w: winW, h: winH },
    wallMatLR
  )
  wallRight.position.set(ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0)
  wallRight.rotateY(-Math.PI / 2)
  scene.add(wallRight)

  // 천장 업데이트
  if (ceiling.geometry !== ceilGeo) {
    ceiling.geometry.dispose()
  }
  ceilGeo.dispose()
  ceilGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH)
  ceiling.geometry = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH)
  // 천장 위치도 높이에 맞게 업데이트
  ceiling.position.set(0, WALL_HEIGHT, 0)

  // 태양 타겟 위치 업데이트
  sun.target.position.set(0, Math.max(ROOM_WIDTH, ROOM_DEPTH) * 0.35, 0)

  // 기존 객체들을 방 범위 내로 재조정
  draggable.forEach((obj) => {
    const { x, z } = clampInRoomXZ(obj.position.x, obj.position.z)

    // 가구 위에 올라가 있는 아이템인 경우 가구 위에 유지
    const placedOn = obj.userData?.placedOn
    if (placedOn && placedOn.parent) {
      // 가구의 위치도 먼저 재조정
      const baseXZ = clampInRoomXZ(placedOn.position.x, placedOn.position.z)
      const baseHh = getHalfHeight(placedOn)
      placedOn.position.set(baseXZ.x, baseHh, baseXZ.z)

      // 가구 위의 아이템 위치 재조정
      placeOnTopOf(obj, placedOn, 0.01)
    } else {
      // 바닥에 있는 객체는 바닥 높이로 재조정
      const hh = getHalfHeight(obj)
      obj.position.set(x, hh, z)
    }
  })

  // 카메라도 방 범위 내로 재조정
  clampCameraToRoom()

  // 방 상태 출력
  logRoomState(`방 크기 변경: ${width}m x ${depth}m x ${height}m`)
}

// 식물/가구에 따라 그림자 정책 적용
function applyShadowPolicyTo(obj) {
  const kind = obj.userData?.kind || 'plant'
  obj.traverse((c) => {
    if (!c.isMesh) return
    // 기본: 식물 castShadow 끔(리프 많으면 비용 큼), 가구는 켬
    if (kind === 'plant') {
      c.castShadow = currentQuality === 'high' // 고사양에서만 식물 그림자
      c.receiveShadow = true
    } else {
      c.castShadow = currentQuality !== 'low'
      c.receiveShadow = true
    }
  })
}

function reapplyShadowPolicyAll() {
  draggable.forEach(applyShadowPolicyTo)
}

// 퀄리티 프리셋 적용
function applyQuality(mode = 'low') {
  currentQuality = mode

  // 1) 해상도(DPR) 다운스케일
  const targetDPR =
    mode === 'high'
      ? deviceDPR
      : mode === 'medium'
      ? Math.min(deviceDPR, 1.5)
      : 1 // low
  renderer.setPixelRatio(targetDPR)
  renderer.setSize(window.innerWidth, window.innerHeight)

  // 2) 섀도우 해상도/알고리즘
  const mapSize = mode === 'high' ? 2048 : mode === 'medium' ? 1024 : 512 // low
  renderer.shadowMap.type =
    mode === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap // medium/low

  // 메인 태양 라이트 찾아서 조정(네 코드에선 dirLight 또는 sun 중 하나)
  const mainDirLight = scene.children.find((o) => o.isDirectionalLight)
  if (mainDirLight) {
    mainDirLight.shadow.mapSize.set(mapSize, mapSize)
    mainDirLight.shadow.bias = -0.0002
    mainDirLight.shadow.normalBias = mode === 'high' ? 0.02 : 0.04
    // 그림자 카메라 폭을 줄이면 선명하지만 커팅 위험 → 중간값 유지
  }

  // 3) 격자 표시/숨김
  if (grid) grid.visible = mode !== 'low'

  // 4) 텍스처 필터링 강도
  const aniso = mode === 'high' ? 8 : mode === 'medium' ? 4 : 1 // low
  setGlobalAnisotropy(aniso)

  // 5) 오브젝트 그림자 정책 재적용
  reapplyShadowPolicyAll()
}
