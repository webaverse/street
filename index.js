import * as THREE from 'three';
import {BufferGeometryUtils} from 'BufferGeometryUtils';
import {scene, renderer, camera, runtime, world, physics, ui, app, appManager} from 'app';
import Simplex from './simplex-noise.js';

const parcelSize = 16;
const width = 10;
const height = 10;
const depth = 10;
const colorTargetSize = 64;
const voxelSize = 0.1;
const marchCubesTexSize = 2048;
const fov = 90;
const aspect = 1;
const raycastNear = 0.1;
const raycastFar = 100;
const raycastDepth = 3;
const walkSpeed = 0.0015;
const streetSize = new THREE.Vector3(10, 1, 1000);

const zeroVector = new THREE.Vector3(0, 0, 0);
const zeroQuaternion = new THREE.Quaternion();
const oneVector = new THREE.Vector3(1, 1, 1);
const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localRaycaster = new THREE.Raycaster();
const localRay = new THREE.Ray();
const localColor = new THREE.Color();
const localColor2 = new THREE.Color();

class MultiSimplex {
  constructor(seed, octaves) {
    const simplexes = Array(octaves);
    for (let i = 0; i < octaves; i++) {
      simplexes[i] = new Simplex(seed + i);
    }
    this.simplexes = simplexes;
  }
  noise2D(x, z) {
    let result = 0;
    for (let i = 0; i < this.simplexes.length; i++) {
      const simplex = this.simplexes[i];
      result += simplex.noise2D(x * (2**i), z * (2**i));
    }
    // result /= this.simplexes.length;
    return result;
  }
}

const simplex = new MultiSimplex('lol', 6);

const streetMesh = (() => {
  /* const geometry = (() => {
    const s = 32;
    // const maxManhattanDistance = localVector2D.set(0, 0).manhattanDistanceTo(localVector2D2.set(s/2, s/2));
    const maxDistance = localVector.set(s/2, s/2, 0).length();

    const topGeometry = new THREE.PlaneBufferGeometry(s, s, s, s)
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0))));

    const bottomGeometry = new THREE.PlaneBufferGeometry(s, s, s, s);
    const lines = [
      new THREE.Line3(new THREE.Vector3(-s/2, -s/2, 0), new THREE.Vector3(-s/2, s/2, 0)),
      new THREE.Line3(new THREE.Vector3(-s/2, s/2, 0), new THREE.Vector3(s/2, s/2, 0)),
      new THREE.Line3(new THREE.Vector3(s/2, s/2, 0), new THREE.Vector3(s/2, -s/2, 0)),
      new THREE.Line3(new THREE.Vector3(s/2, -s/2, 0), new THREE.Vector3(-s/2, -s/2, 0)),
    ];
    const _closestDistanceToLine = (x, y) => {
      localVector.set(x, y, 0);
      let result = Infinity;
      for (const line of lines) {
        const point = line.closestPointToPoint(localVector, true, localVector2);
        const d = localVector.distanceTo(point);
        if (d < result) {
          result = d;
        }
      }
      return result;
    };
    for (let i = 0; i < bottomGeometry.attributes.position.array.length; i += 3) {
      const x = bottomGeometry.attributes.position.array[i];
      const y = bottomGeometry.attributes.position.array[i+1];
      // console.log('got simplex', simplex.noise2D(x, y));
      const d = _closestDistanceToLine(x, y); // localVector2D.set(x, y).manhattanDistanceTo(localVector2D2);
      const z = (10 + simplex.noise2D(x/100, y/100)) * (d/maxDistance)**0.5;
      // console.log('got distance', z, d/maxDistance);
      bottomGeometry.attributes.position.array[i+2] = z;
    }
    bottomGeometry.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0))));

    let geometry = BufferGeometryUtils.mergeBufferGeometries([
      topGeometry,
      bottomGeometry,
    ]);
    geometry = geometry.toNonIndexed();
    const barycentrics = new Float32Array(geometry.attributes.position.array.length);
    let barycentricIndex = 0;
    for (let i = 0; i < geometry.attributes.position.array.length; i += 9) {
      barycentrics[barycentricIndex++] = 1;
      barycentrics[barycentricIndex++] = 0;
      barycentrics[barycentricIndex++] = 0;
      barycentrics[barycentricIndex++] = 0;
      barycentrics[barycentricIndex++] = 1;
      barycentrics[barycentricIndex++] = 0;
      barycentrics[barycentricIndex++] = 0;
      barycentrics[barycentricIndex++] = 0;
      barycentrics[barycentricIndex++] = 1;
    }
    geometry.setAttribute('barycentric', new THREE.BufferAttribute(barycentrics, 3));

    return geometry;
  })(); */

  const material = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: `\
      #define PI 3.1415926535897932384626433832795

      attribute float y;
      attribute vec3 barycentric;
      varying float vUv;
      varying vec3 vBarycentric;
      varying vec3 vPosition;
      void main() {
        vUv = uv.x;
        vBarycentric = barycentric;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `\
      varying vec3 vBarycentric;
      varying vec3 vPosition;
    
      // const float lineWidth = 1.0;
      const vec3 lineColor1 = vec3(${new THREE.Color(0xef5350).toArray().join(', ')});
      const vec3 lineColor2 = vec3(${new THREE.Color(0xff7043).toArray().join(', ')});

      float gridFactor (vec3 bary, float width, float feather) {
        float w1 = width - feather * 0.5;
        // vec3 bary = vec3(vBC.x, vBC.y, 1.0 - vBC.x - vBC.y);
        vec3 d = fwidth(bary);
        vec3 a3 = smoothstep(d * w1, d * (w1 + feather), bary);
        return min(min(a3.x, a3.y), a3.z);
      }
      float gridFactor (vec3 bary, float width) {
        // vec3 bary = vec3(vBC.x, vBC.y, 1.0 - vBC.x - vBC.y);
        vec3 d = fwidth(bary);
        vec3 a3 = smoothstep(d * (width - 0.5), d * (width + 0.5), bary);
        return min(min(a3.x, a3.y), a3.z);
      }

      void main() {
        vec3 c = mix(lineColor1, lineColor2, 2. + vPosition.y);
        gl_FragColor = vec4(c * (gridFactor(vBarycentric, 0.5) < 0.5 ? 0.9 : 1.0), 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
  const geometry = new THREE.BoxBufferGeometry(streetSize.x, streetSize.y, streetSize.z);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
})();
streetMesh.position.set(0, -1/2, 0);
app.object.add(streetMesh);

function mod(a, n) {
  return ((a%n)+n)%n;
}
const floorMesh = (() => {
  const dims = [16, 500];
  const dims2P1 = dims.map(n => 2*n+1);
  const planeBufferGeometry = new THREE.PlaneBufferGeometry(1, 1)
    .applyMatrix4(localMatrix.makeScale(0.95, 0.95, 1))
    .applyMatrix4(localMatrix.makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)))
    // .applyMatrix4(localMatrix.makeTranslation(0, 0.1, 0))
    .toNonIndexed();
  const numCoords = planeBufferGeometry.attributes.position.array.length;
  const numVerts = numCoords/3;
  const positions = new Float32Array(numCoords*dims2P1[0]*dims2P1[1]);
  const centers = new Float32Array(numCoords*dims2P1[0]*dims2P1[1]);
  const typesx = new Float32Array(numVerts*dims2P1[0]*dims2P1[1]);
  const typesz = new Float32Array(numVerts*dims2P1[0]*dims2P1[1]);
  let i = 0;
  for (let x = -dims[0]; x <= dims[0]; x++) {
    for (let z = -dims[1]; z <= dims[1]; z++) {
      const newPlaneBufferGeometry = planeBufferGeometry.clone()
        .applyMatrix4(localMatrix.makeTranslation(x, 0, z));
      positions.set(newPlaneBufferGeometry.attributes.position.array, i * newPlaneBufferGeometry.attributes.position.array.length);
      for (let j = 0; j < newPlaneBufferGeometry.attributes.position.array.length/3; j++) {
        localVector.set(x, 0, z).toArray(centers, i*newPlaneBufferGeometry.attributes.position.array.length + j*3);
      }
      let typex = 0;
      if (mod((x + parcelSize/2), parcelSize) === 0) {
        typex = 1/8;
      } else if (mod((x + parcelSize/2), parcelSize) === parcelSize-1) {
        typex = 2/8;
      }
      let typez = 0;
      if (mod((z + parcelSize/2), parcelSize) === 0) {
        typez = 1/8;
      } else if (mod((z + parcelSize/2), parcelSize) === parcelSize-1) {
        typez = 2/8;
      }
      for (let j = 0; j < numVerts; j++) {
        typesx[i*numVerts + j] = typex;
        typesz[i*numVerts + j] = typez;
      }
      i++;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('center', new THREE.BufferAttribute(centers, 3));
  geometry.setAttribute('typex', new THREE.BufferAttribute(typesx, 1));
  geometry.setAttribute('typez', new THREE.BufferAttribute(typesz, 1));
  /* const geometry = new THREE.PlaneBufferGeometry(300, 300, 300, 300)
    .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1)))); */
  const floorVsh = `
    #define PI 3.1415926535897932384626433832795
    uniform float uAnimation;
    attribute vec3 center;
    attribute float typex;
    attribute float typez;
    varying vec3 vPosition;
    varying float vTypex;
    varying float vTypez;
    varying float vDepth;

    float range = 1.0;

    void main() {
      float animationRadius = uAnimation * ${dims[0].toFixed(8)};
      float currentRadius = length(center.xz);
      float radiusDiff = abs(animationRadius - currentRadius);
      float height = max((range - radiusDiff)/range, 0.0);
      height = sin(height*PI/2.0);
      height *= 0.2;
      // height = 0.0;
      vec3 p = vec3(position.x, position.y + height, position.z);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
      vPosition = position + vec3(0.5, 0.0, 0.5);
      vTypex = typex;
      vTypez = typez;
      vDepth = gl_Position.z / 30.0;
    }
  `;
  const floorFsh = `
    uniform vec4 uCurrentParcel;
    uniform vec4 uHoverParcel;
    uniform vec4 uSelectedParcel;
    uniform vec3 uSelectedColor;
    // uniform float uAnimation;
    varying vec3 vPosition;
    varying float vTypex;
    varying float vTypez;
    varying float vDepth;
    void main() {
      vec3 c;
      float a;
      if (
        vPosition.x >= uSelectedParcel.x &&
        vPosition.z >= uSelectedParcel.y &&
        vPosition.x <= uSelectedParcel.z &&
        vPosition.z <= uSelectedParcel.w
      ) {
        c = uSelectedColor;
      } else {
        c = vec3(${new THREE.Color(0xEEEEEE).toArray().join(', ')});
        // c = vec3(0.3);
      }
      float add = 0.0;
      if (
        vPosition.x >= uHoverParcel.x &&
        vPosition.z >= uHoverParcel.y &&
        vPosition.x <= uHoverParcel.z &&
        vPosition.z <= uHoverParcel.w
      ) {
        add = 0.2;
      } else {
        vec3 f = fract(vPosition);
        if (vTypex >= 2.0/8.0) {
          if (f.x >= 0.8) {
            add = 0.2;
          }
        } else if (vTypex >= 1.0/8.0) {
          if (f.x <= 0.2) {
            add = 0.2;
          }
        }
        if (vTypez >= 2.0/8.0) {
          if (f.z >= 0.8) {
            add = 0.2;
          }
        } else if (vTypez >= 1.0/8.0) {
          if (f.z <= 0.2) {
            add = 0.2;
          }
        }
      }
      c += add;
      a = (1.0-vDepth)*0.5;
      gl_FragColor = vec4(c, a);
    }
  `;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      /* uTex: {
        type: 't',
        value: new THREE.Texture(),
      }, */
      uCurrentParcel: {
        type: 'v4',
        value: new THREE.Vector4(),
      },
      uHoverParcel: {
        type: 'v4',
        value: new THREE.Vector4(),
      },
      uSelectedParcel: {
        type: 'v4',
        value: new THREE.Vector4(-8, -8, 8, 8),
      },
      uSelectedColor: {
        type: 'c',
        value: new THREE.Color().setHex(0x5c6bc0),
      },
      uAnimation: {
        type: 'f',
        value: 0,
      },
    },
    vertexShader: floorVsh,
    fragmentShader: floorFsh,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  // mesh.castShadow = true;
  // mesh.receiveShadow = true;
  return mesh;
})();
// floorMesh.position.set(-8, 0, -8);
app.object.add(floorMesh);

const physicsId = physics.addBoxGeometry(streetMesh.position, streetMesh.quaternion, new THREE.Vector3(30, streetSize.y, streetSize.z).multiplyScalar(0.5), false);
/* app.addEventListener('unload', () => {
  physics.removeGeometry(physicsId);
}); */

let lastUpdateTime = Date.now();
renderer.setAnimationLoop(() => {
  const now = Date.now();

  floorMesh.material.uniforms.uAnimation.value = (now%2000)/2000;
  
  lastUpdateTime = now;
});