import * as THREE from 'three';
// import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import {renderer, camera, runtime, world, universe, physics, ui, rig, app, appManager, popovers} from 'app';
import metaversefile from 'metaversefile';
import Simplex from './simplex-noise.js';
// import alea from './alea.js';
const {useFrame, useLocalPlayer, useCleanup, useMaterials, usePhysics} = metaversefile;

export default () => {
  // const {WebaverseShaderMaterial} = useMaterials();

  const parcelSize = 16;
  const width = 10;
  const height = 10;
  const depth = 10;
  // const colorTargetSize = 64;
  // const voxelSize = 0.1;
  // const marchCubesTexSize = 2048;
  // const fov = 90;
  // const aspect = 1;
  // const raycastNear = 0.1;
  // const raycastFar = 100;
  // const raycastDepth = 3;
  // const walkSpeed = 0.0015;
  const streetSize = new THREE.Vector3(300, 1, 300);

  const zeroVector = new THREE.Vector3(0, 0, 0);
  const zeroQuaternion = new THREE.Quaternion();
  const oneVector = new THREE.Vector3(1, 1, 1);
  const localVector = new THREE.Vector3();
  const localVector2 = new THREE.Vector3();
  const localVector3 = new THREE.Vector3();
  const localVector2D = new THREE.Vector2();
  const localQuaternion = new THREE.Quaternion();
  const localEuler = new THREE.Euler();
  const localMatrix = new THREE.Matrix4();
  // const gltfLoader = new GLTFLoader();
  // const textureLoader = new THREE.TextureLoader();

  const rootScene = new THREE.Object3D();
  // app.object.add(rootScene);

  /* const ambientLight = new THREE.AmbientLight(0xFFFFFF);
  rootScene.add(ambientLight);
  // rootScene.ambientLight = ambientLight;
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF);
  directionalLight.position.set(1, 2, 3);
  rootScene.add(directionalLight);
  // rootScene.directionalLight = directionalLight; */

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

  const gridSimplex = new MultiSimplex('lol', 6);
  // const gridSimplex2 = new MultiSimplex('lol2', 6);

  /* const ui = useUi();
  const w = 4;
  const popoverWidth = 600; // XXX
  const popoverHeight = 200;
  const popoverTarget = new THREE.Object3D();
  popoverTarget.position.set(6, 2, -4);
  const popoverTextMesh = (() => {
    const textMesh = ui.makeTextMesh('Multiplayer hub.\n[E] to enter', undefined, 0.5, 'center', 'middle');
    textMesh.position.z = 0.1;
    textMesh.scale.x = popoverHeight / popoverWidth;
    textMesh.color = 0xFFFFFF;
    return textMesh;
  })();
  const popoverMesh = ui.makePopoverMesh(popoverTextMesh, {
    width: popoverWidth,
    height: popoverHeight,
    target: popoverTarget,
  }); */

  /* function mod(a, n) {
    return ((a%n)+n)%n;
  }
  const floorMesh = (() => {
    const dims = [100, 500];
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
        float animationRadius = uAnimation * 10.;
        float currentRadius = length(center.xz - cameraPosition.xz);
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
        vec3 c = vec3(${new THREE.Color(0xCCCCCC).toArray().join(', ')});
        float a = (1.0-vDepth)*0.5;
        gl_FragColor = vec4(c, a);
      }
    `;
    const material = new THREE.ShaderMaterial({
      uniforms: {
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
  floorMesh.position.set(0, -0.02, 0);
  rootScene.add(floorMesh); */

  const stacksBoundingBox = new THREE.Box2(
    new THREE.Vector2(5, 0),
    new THREE.Vector2(105, 100),
  );
  const forestBoundingBox = new THREE.Box2(
    new THREE.Vector2(-40, -2),
    new THREE.Vector2(-5, 30),
  );
  const gridMesh = (() => {
    const geometry = (() => {
      const s = 300;
      // const maxManhattanDistance = localVector2D.set(0, 0).manhattanDistanceTo(localVector2D2.set(s/2, s/2));

      let geometry = new THREE.PlaneBufferGeometry(s, s, s, s)
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0))));

      for (let i = 0; i < geometry.attributes.position.array.length; i += 3) {
        const x = geometry.attributes.position.array[i];
        const z = geometry.attributes.position.array[i+2];
        const d = Math.abs(x); 
        const f = Math.min(Math.max((d - 5) / 30, 0), 1)**2;
        const y = -0.01 +
          Math.min(Math.max(gridSimplex.noise2D(x/500, z/500) * f * 30, 0), 100) *
          Math.min(stacksBoundingBox.distanceToPoint(new THREE.Vector2(x, z)), 1) *
          Math.min(forestBoundingBox.distanceToPoint(new THREE.Vector2(x, z)), 1);
        // console.log('got distance', z, d/maxDistance);
        geometry.attributes.position.array[i+1] = y;
      }
      
      /* const dynamicPositionYs = new Float32Array(geometry.attributes.position.array.length/3);
      for (let i = 0; i < dynamicPositionYs.length; i += 3) {
        const x = geometry.attributes.position.array[i*3];
        const z = geometry.attributes.position.array[i*3+2];

        // const d = Math.abs(x); 
        // const f = Math.min(Math.max((d - 5) / 30, 0), 1)**2;

        const y = gridSimplex2.noise2D(x/500, z/500) * 3;
        dynamicPositionYs[i] = y;
        dynamicPositionYs[i+1] = y;
        dynamicPositionYs[i+2] = y;
      }
      geometry.setAttribute('dynamicPositionY', new THREE.BufferAttribute(dynamicPositionYs, 1)); */

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
    })();

    const material = new THREE.ShaderMaterial({
      uniforms: {
        /* uBeat: {
          type: 'f',
          value: 1,
        },
        uBeat2: {
          type: 'f',
          value: 0,
        }, */
      },
      vertexShader: `\
         ${THREE.ShaderChunk.common}

        attribute float y;
        attribute vec3 barycentric;
        // attribute float dynamicPositionY;
        // uniform float uBeat2;
        varying float vUv;
        varying vec3 vBarycentric;
        varying vec3 vPosition;
        ${THREE.ShaderChunk.logdepthbuf_pars_vertex}

        void main() {
          vUv = uv.x;
          vBarycentric = barycentric;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position /* + vec3(0., dynamicPositionY * uBeat2, 0.) */, 1.0);

          ${THREE.ShaderChunk.logdepthbuf_vertex}
        }
      `,
      fragmentShader: `\
        // uniform float uBeat;
        precision highp float;
        precision highp int;

        #define PI 3.1415926535897932384626433832795

        varying vec3 vBarycentric;
        varying vec3 vPosition;

        const vec3 lineColor1 = vec3(${new THREE.Color(0x66bb6a).toArray().join(', ')});
        const vec3 lineColor2 = vec3(${new THREE.Color(0x9575cd).toArray().join(', ')});

        ${THREE.ShaderChunk.logdepthbuf_pars_fragment}

        float edgeFactor(vec3 bary, float width) {
          // vec3 bary = vec3(vBC.x, vBC.y, 1.0 - vBC.x - vBC.y);
          vec3 d = fwidth(bary);
          vec3 a3 = smoothstep(d * (width - 0.5), d * (width + 0.5), bary);
          return min(min(a3.x, a3.y), a3.z);
        }

        vec4 sRGBToLinear( in vec4 value ) {
          return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
        }

        void main() {
          vec3 c = mix(lineColor1, lineColor2, vPosition.y / 10.);
          // vec3 p = fwidth(vPosition);
          vec3 p = vPosition;
          float f = min(mod(p.x, 1.), mod(p.z, 1.));
          f = min(f, mod(1.-p.x, 1.));
          f = min(f, mod(1.-p.z, 1.));
          f *= 10.;
          float a = /*0.7 + */max(1. - f, 0.);
          if (a < 0.5) {
            discard;
          } else {
            gl_FragColor = vec4(c /* * uBeat */, a);
            gl_FragColor = sRGBToLinear(gl_FragColor);
          }

          ${THREE.ShaderChunk.logdepthbuf_fragment}
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,

      clipping: false,
      fog: false,
      lights: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  })();


  rootScene.add(gridMesh);
  gridMesh.position.set(0, -0.01, 0);
  // gridMesh.matrixWorldNeedsUpdate=true;
  gridMesh.updateMatrixWorld();
  const particlesMesh = (() => {
    const numParticles = 30000;
    const s = 0.1;
    const spread = 20;
    const geometry = (() => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(1000 * 9);
      for (let i = 0; i < positions.length; i += 9) {
        localVector.set(Math.random(), Math.random(), Math.random()).subScalar(0.5).multiplyScalar(s).toArray(positions, i);
        localVector.set(Math.random(), Math.random(), Math.random()).subScalar(0.5).multiplyScalar(s).toArray(positions, i+3);
        localVector.set(Math.random(), Math.random(), Math.random()).subScalar(0.5).multiplyScalar(s).toArray(positions, i+6);
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const barycentrics = new Float32Array(positions.length);
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
      const offset = new Float32Array(positions.length);
      for (let i = 0; i < geometry.attributes.position.array.length; i += 9) {
        localVector.set(Math.random(), Math.random(), Math.random()).subScalar(0.5).multiplyScalar(spread);
        localVector.toArray(offset, i);
        localVector.toArray(offset, i+3);
        localVector.toArray(offset, i+6);
      }
      geometry.setAttribute('offset', new THREE.BufferAttribute(offset, 3));
      const dynamicPositions = new Float32Array(positions.length);
      for (let i = 0; i < geometry.attributes.position.array.length; i += 9) {
        localVector.set(Math.random(), Math.random(), Math.random()).subScalar(0.5).multiplyScalar(5);
        localVector.toArray(dynamicPositions, i);
        localVector.toArray(dynamicPositions, i+3);
        localVector.toArray(dynamicPositions, i+6);
      }
      geometry.setAttribute('dynamicPosition', new THREE.BufferAttribute(dynamicPositions, 3));
      const dynamicRotations = new Float32Array(positions.length);
      for (let i = 0; i < geometry.attributes.position.array.length; i += 9) {
        localVector.set(Math.random(), Math.random(), Math.random()).subScalar(0.5).normalize();
        localVector.toArray(dynamicRotations, i);
        localVector.toArray(dynamicRotations, i+3);
        localVector.toArray(dynamicRotations, i+6);
      }
      geometry.setAttribute('dynamicRotation', new THREE.BufferAttribute(dynamicRotations, 3));
      const timeOffset = new Float32Array(positions.length/3);
      for (let i = 0; i < timeOffset.length; i += 3) {
        const r = Math.random();
        timeOffset[i] = r;
        timeOffset[i+1] = r;
        timeOffset[i+2] = r;
      }
      geometry.setAttribute('timeOffset', new THREE.BufferAttribute(timeOffset, 1));

      return geometry;
    })();

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: {
          type: 'f',
          value: 0,
        },
        /* uBeat: {
          type: 'f',
          value: 0,
        },
        uBeat2: {
          type: 'f',
          value: 0,
        }, */
        uTime: {
          type: 'f',
          value: 0,
        },
      },
      vertexShader: `\
          
        ${THREE.ShaderChunk.common}

        ${THREE.ShaderChunk.logdepthbuf_pars_vertex}

        vec3 applyQuaternion(vec3 v, vec4 q) { 
          return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
        }
        vec4 axisAngleToQuaternion(vec3 axis, float angle) {
          float half_angle = angle/2.;
          vec4 q;
          q.x = axis.x * sin(half_angle);
          q.y = axis.y * sin(half_angle);
          q.z = axis.z * sin(half_angle);
          q.w = cos(half_angle);
          return q;
        }
        vec4 mult(vec4 a, vec4 b) {
          return a * b;
        }
        vec3 applyAxisAngle(vec3 vector, vec3 axis, float angle) {
          return applyQuaternion(vector, axisAngleToQuaternion(axis, angle));
        }

        uniform float uTime;
        // uniform float uBeat2;
        // attribute float y;
        attribute vec3 offset;
        attribute vec3 barycentric;
        attribute vec3 dynamicPosition;
        attribute vec3 dynamicRotation;
        attribute float timeOffset;
        // varying float vUv;
        varying vec3 vBarycentric;
        // varying vec3 vPosition;
        void main() {
          // vUv = uv.x;
          vBarycentric = barycentric;
          // vPosition = position;
          vec3 p = position /* * (1. + uBeat2) */;
          vec3 o = offset + dynamicPosition * mod(timeOffset + uTime, 1.);
          o -= cameraPosition;
          o = mod(o, ${spread.toFixed(8)});
          o -= ${(spread/2).toFixed(8)};
          o += cameraPosition;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(applyAxisAngle(p, dynamicRotation, uTime * PI*2.) + o, 1.0);

          ${THREE.ShaderChunk.logdepthbuf_vertex}
        }
      `,
      fragmentShader: `\
        precision highp float;
        precision highp int;

        #define PI 3.1415926535897932384626433832795
        
        ${THREE.ShaderChunk.logdepthbuf_pars_fragment}

        uniform float uColor;
        // uniform float uBeat;
        varying vec3 vBarycentric;
        // varying vec3 vPosition;

        // const vec3 lineColor1 = vec3(${new THREE.Color(0x66bb6a).toArray().join(', ')});
        // const vec3 lineColor2 = vec3(${new THREE.Color(0x9575cd).toArray().join(', ')});

        float edgeFactor(vec3 bary, float width) {
          // vec3 bary = vec3(vBC.x, vBC.y, 1.0 - vBC.x - vBC.y);
          vec3 d = fwidth(bary);
          vec3 a3 = smoothstep(d * (width - 0.5), d * (width + 0.5), bary);
          return min(min(a3.x, a3.y), a3.z);
        }

        void main() {
          // vec3 c = mix(lineColor1, lineColor2, vPosition.y / 10.);
          vec3 c = vec3(uColor);
          float f = edgeFactor(vBarycentric, 1.);
          gl_FragColor = vec4(c /* * uBeat */, max(1. - f, 0.));
          // gl_FragColor = vec4(c, 1.);

          ${THREE.ShaderChunk.logdepthbuf_fragment}
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  })();
  rootScene.add(particlesMesh);

  const physics = usePhysics();
  const floorPhysicsId = physics.addBoxGeometry(
    new THREE.Vector3(0, -1000, 0),
    new THREE.Quaternion(),
    new THREE.Vector3(streetSize.x, 2000, streetSize.z).multiplyScalar(0.5),
    false
  );
  /* app.addEventListener('unload', () => {
    physics.removeGeometry(physicsId);
  }); */

  /* let beat = false;
  let beatReady = false;
  const listener = new THREE.AudioListener();
  rootScene.add(listener);
  const sound = new THREE.Audio(listener);
  new THREE.AudioLoader().load(`https://avaer.github.io/assets-private/mnleo.mp3`, function( buffer ) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    // sound.setVolume(0.5);
    // sound.play();
    beatReady = true;
  });
  const analyser = new THREE.AudioAnalyser(sound, 32);
  const _keydown = e => {
    switch (e.which) {
      case 77: { // M
        if (beatReady) {
          beat = !beat;
          if (beat) {
            sound.play();
          } else {
            sound.pause();
          }
        }
        break;
      }
    }
  };
  window.addEventListener('keydown', _keydown);
  app.addEventListener('unload', () => {
    window.removeEventListener('keydown', _keydown);
  }); */

  /* appManager.addEventListener('use', () => {
    universe.enterWorld({
      objects: [
        {
          position: [-3, 0, -10],
          contentId: 'https://avaer.github.io/shield/index.js',
        },
      ],
      extents: [
        portalMesh.boundingBox.min.toArray(),
        portalMesh.boundingBox.max.toArray(),
      ],
    });
    // rootScene.visible = !rootScene.visible;
  }); */

  /* app.addEventListener('activate', e => {
    console.log('got activate event', e, e.waitUntil);
  }); */

  useFrame(({timestamp}) => {
    // const transforms = rig.getRigTransforms();
    // const {position} = transforms[0];
    const {position} = useLocalPlayer();
    const f = 1 - Math.min(Math.max(-position.z / 30, -0.3), 0.3) / 0.3;

    // streetMesh.material.uniforms.uTime.value = (timestamp%10000)/20;
    // floorMesh.material.uniforms.uAnimation.value = (now%2000)/2000;
    particlesMesh.material.uniforms.uColor.value = f;
    particlesMesh.material.uniforms.uTime.value = (timestamp%10000)/10000;

    /* if (beat) {
      const fd = analyser.getFrequencyData();
      const v = fd[4];
      const beatValue = Math.min(v/255, 1);
      const beatValue2 = Math.min(v/255, 1);
      streetMesh.material.uniforms.uBeat.value = beatValue;
      gridMesh.material.uniforms.uBeat.value = beatValue;
      gridMesh.material.uniforms.uBeat2.value = beatValue2;
      particlesMesh.material.uniforms.uBeat.value = beatValue;
      particlesMesh.material.uniforms.uBeat2.value = beatValue2;
    } else {
      streetMesh.material.uniforms.uBeat.value = 1;
      gridMesh.material.uniforms.uBeat.value = 1;
      gridMesh.material.uniforms.uBeat2.value = 0;
      particlesMesh.material.uniforms.uBeat.value = 1;
      particlesMesh.material.uniforms.uBeat2.value = 0;
    } */
  });
  
  useCleanup(() => {
    // console.log('clean up street');
    physics.removeGeometry(floorPhysicsId);
  });

  return rootScene;
}
