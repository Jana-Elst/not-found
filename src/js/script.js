import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import logoSVG from '../../public/assets/logo.svg'
import light from '../../public/assets/studio_small_09_1k.jpeg'

import vertexShader from './shaders/vertex.glsl?raw';
import fragmentShader from './shaders/fragment.glsl?raw'

//-------------------- variables & constants --------------------//
//dom
const canvas = document.querySelector('canvas.c');

const scanlineCheckbox = document.getElementById('enableScanline');
const pixelate1Checkbox = document.getElementById('enablePixelate1');

//const
let size = {
    width: canvas.clientWidth,
    height: canvas.clientHeight
}

//--- variables
//xxx
let mouseX = 0;
let mouseY = 0;

//model
let svgGroup;
const scaleModel = 0.1;
const cameraZoom = 15;

//material model
const materialColor = 0xeeeeee;
const roughness = 0.25;
const metalness = 1.0;
const envMapIntensity = 1.5;

//extrusion
const depth = 8;
const curveSegments = 24;
const bevelSize = 1;
const bevelThickness = 0;
const bevelSegments = 1;

const clock = new THREE.Clock();

//shader
const noise = 0.2;
const darken = 0.0;
const denominator = { x: 213.0, y: 5.53 };
const negX = { x: -1.0, y: 1.0 };
const negY = { x: 1.0, y: -1.0 };
const glitchOffset1 = { x: 32.05, y: 236.0 };
const glitchOffset2 = { x: -62.05, y: -36.0 };
const randSeeds = { x: 12.9898, y: 78.233 };

let scanline = 0.6; //value between -0.9 - 0.9
let yScanline = 700; //value between -1000 - 1000 tientallen?

let pixelate1Size = 65; //value between -65 - 65
let pixelate2Size = 50; //value between 50 - 100
let pixelate3Size = 50;//value between 50

let enableScanline = true;
let enablePixelate1 = false;
let enablePixelate2 = false;

//-------------------- create threeJS scene --------------------//
//create scene
const scene = new THREE.Scene();

//create camera
const camera = new THREE.PerspectiveCamera(45, size.width / size.height, 0.1, 100);
camera.position.set(0, 0, cameraZoom);
scene.add(camera);

//add mouse manipulation -- if you want to turn and zoom the model
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;

//render
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});

renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.physicallyCorrectLights = true; //play with this
renderer.setClearColor(0xffffff, 0); // (color, alpha), transparent? alpha -> 0

//load environment
const textureLoader = new THREE.TextureLoader();
textureLoader.load(
    light,
    (envTexture) => {
        envTexture.mapping = THREE.EquirectangularReflectionMapping;
        envTexture.colorSpace = THREE.SRGBColorSpace;
        scene.environment = envTexture;
        scene.background = null;
    }
);

//create model
const loader = new SVGLoader();
loader.load(
    logoSVG,
    (data) => {
        //get paths
        const paths = data.paths;
        let geometries = [];

        const modelMaterial = new THREE.MeshStandardMaterial({
            color: materialColor,
            metalness: metalness,
            roughness: roughness,
            side: THREE.DoubleSide,
            envMapIntensity: envMapIntensity,
        });

        //create group & set scale
        svgGroup = new THREE.Group();
        svgGroup.scale.set(scaleModel, -(scaleModel), scaleModel);

        //extrude and manipulate paths
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];

            const shapes = SVGLoader.createShapes(path);
            for (let j = 0; j < shapes.length; j++) {
                const shape = shapes[j];

                const extrudeSettings = {
                    depth: depth,
                    curveSegments: curveSegments,
                    bevelEnabled: true,
                    bevelSize: bevelSize,
                    bevelThickness: bevelThickness,
                    bevelSegments: bevelSegments
                };

                //create new 3D model
                const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                geometries.push(geometry);
            }
        }

        const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, true);
        mergedGeometry.center();

        //add material to model
        const mesh = new THREE.Mesh(mergedGeometry, modelMaterial);
        svgGroup.add(mesh);
        scene.add(svgGroup);
    }
);

//-------------------- create shader --------------------//
const shaderTarget = new THREE.WebGLRenderTarget(size.width, size.height);
const sceneWithShader = new THREE.Scene();
const cameraSceneWithShader = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        iChannel0: { value: shaderTarget.texture },
        iTime: { value: 0 },
        iResolution: {
            value: new THREE.Vector2(size.width, size.height),
        },
        u_textureResolution: { value: new THREE.Vector2(size.width, size.height) },

        u_noise: { value: noise },
        u_darken: { value: darken },
        u_denominator: { value: new THREE.Vector2(denominator.x, denominator.y) },
        u_negX: { value: new THREE.Vector2(negX.x, negX.y) },
        u_negY: { value: new THREE.Vector2(negY.x, negY.y) },
        u_glitchOffset1: { value: new THREE.Vector2(glitchOffset1.x, glitchOffset1.y) },
        u_glitchOffset2: { value: new THREE.Vector2(glitchOffset2.x, glitchOffset2.y) },
        u_randSeeds: { value: new THREE.Vector2(randSeeds.x, randSeeds.y) },
        u_scanline: { value: scanline },
        u_yScanline: { value: yScanline },
        u_pixelate1Size: { value: pixelate1Size },
        u_pixelate2Size: { value: pixelate2Size },
        u_pixelate3Size: { value: pixelate3Size },

        u_enableScanline: { value: enableScanline },
        u_enablePixelate1: { value: enablePixelate1 },
        u_enablePixelate2: { value: enablePixelate2 }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true
});

const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial);
sceneWithShader.add(quad);

//---------- interaction model ----------//
const rotateModel = (model, time) => {
    model.rotation.y = time * 0.5;
    model.rotation.x = time * 0.2;
};

//-------------------- eventListeners --------------------//
window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth);
    mouseY = (event.clientY / window.innerHeight);

    pixelate1Size = 15 + (mouseX * (65 - 15));
    scanline = 0.1 + (mouseY * (0.9 - 0.1));
    yScanline = 10 + (mouseX * (1000 - 10));
});

scanlineCheckbox.addEventListener('change', (e) => {
    enableScanline = e.target.checked;
    shaderMaterial.uniforms.u_enableScanline.value = enableScanline;
});

pixelate1Checkbox.addEventListener('change', (e) => {
    enablePixelate1 = e.target.checked;
    shaderMaterial.uniforms.u_enablePixelate1.value = enablePixelate1;
});

const resize = () => {
    // Update size
    const rect = canvas.getBoundingClientRect();
    size.width = rect.width;
    size.height = rect.height;

    // Update camera
    camera.aspect = size.width / size.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(rect.width, rect.height, false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    //update the shader
    shaderTarget.setSize(size.width, size.height);
    shaderTarget.dispose();

    shaderMaterial.uniforms.iResolution.value.set(size.width, size.height);
    shaderMaterial.uniforms.u_textureResolution.value.set(size.width, size.height);
}

resize();
window.addEventListener('resize', resize);

//-------------------- draw --------------------//
const draw = () => {
    const time = clock.getElapsedTime();

    if (svgGroup) {
        rotateModel(svgGroup, time);
    }

    //update variables
    shaderMaterial.uniforms.u_pixelate1Size.value = pixelate1Size;
    shaderMaterial.uniforms.u_scanline.value = scanline;
    shaderMaterial.uniforms.u_yScanline.value = yScanline;

    //1. render model (offScreen)
    scene.background = null;
    renderer.setRenderTarget(shaderTarget);
    renderer.clear();
    renderer.render(scene, camera);

    //2. render with shader (on canvas)
    renderer.setRenderTarget(null);
    renderer.clear();

    shaderMaterial.uniforms.iTime.value = time;
    renderer.render(sceneWithShader, cameraSceneWithShader);

    requestAnimationFrame(draw);
}

draw();
