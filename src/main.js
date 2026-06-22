import './style.css';

import * as THREE from 'three';
import TWEEN from 'three/addons/libs/tween.module.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

import { GOOGLE_CONFIG } from './config.js';

const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

let tokenClient;
let googleReady = false;

let camera;
let scene;
let renderer;
let controls;

const objects = [];
const targets = {
  table: [],
  sphere: [],
  helix: [],
  grid: []
};

const loginButton = document.getElementById('login-button');
const loginStatus = document.getElementById('login-status');

startAppSetup();

async function startAppSetup() {
  try {
    updateStatus('Loading Google API...');

    await Promise.all([
      loadScript('https://apis.google.com/js/api.js'),
      loadScript('https://accounts.google.com/gsi/client')
    ]);

    await initializeGoogleClient();

    googleReady = true;
    loginButton.disabled = false;
    updateStatus('Ready. Please sign in.');

    loginButton.addEventListener('click', handleLogin);
  } catch (error) {
    console.error(error);
    updateStatus('Google API failed to load. Check your internet connection and setup.');
  }
}

function updateStatus(message) {
  loginStatus.textContent = message;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);

    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;

    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
}

function initializeGoogleClient() {
  return new Promise((resolve, reject) => {
    if (!window.gapi || !window.google) {
      reject(new Error('Google libraries are not available yet.'));
      return;
    }

    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: GOOGLE_CONFIG.API_KEY,
          discoveryDocs: [DISCOVERY_DOC]
        });

        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          scope: SCOPES,
          callback: ''
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

function handleLogin() {
  if (!googleReady || !tokenClient) {
    alert('Google API is still loading. Please wait a few seconds.');
    return;
  }

  if (hasMissingConfig()) {
    alert(
      'Please open src/config.js and replace CLIENT_ID, API_KEY, and SPREADSHEET_ID before running the project.'
    );
    return;
  }

  tokenClient.callback = async (response) => {
    if (response.error) {
      console.error(response);
      alert('Google login failed.');
      return;
    }

    updateStatus('Loading Google Sheet data...');

    try {
      const people = await loadSheetData();

      if (people.length === 0) {
        alert('No valid data found in your Google Sheet.');
        return;
      }

      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');

      init(people);
      animate();
    } catch (error) {
      console.error(error);
      alert('Failed to load Google Sheet data. Check your Sheet ID, API key, range, and sharing permission.');
    }
  };

  tokenClient.requestAccessToken({ prompt: 'consent' });
}

function hasMissingConfig() {
  return (
    GOOGLE_CONFIG.CLIENT_ID.includes('PASTE_') ||
    GOOGLE_CONFIG.API_KEY.includes('PASTE_') ||
    GOOGLE_CONFIG.SPREADSHEET_ID.includes('PASTE_')
  );
}

/* ================================
   LOAD GOOGLE SHEET DATA
================================ */

async function loadSheetData() {
  const response = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_CONFIG.SPREADSHEET_ID,
    range: GOOGLE_CONFIG.RANGE
  });

  const rows = response.result.values;

  if (!rows || rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => String(header).trim());

  const people = rows.slice(1).map((row) => {
    const person = {};

    headers.forEach((header, index) => {
      person[header] = row[index] || '';
    });

    return person;
  });

  // The assignment data has 200 rows, matching 20x10 table and 5x4x10 grid.
  return people.filter((person) => person.Name).slice(0, 200);
}

/* ================================
   THREE.JS SETUP
================================ */

function init(people) {
  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );

  camera.position.z = 3400;

  scene = new THREE.Scene();

  createObjects(people);
  createTableTargets();
  createSphereTargets();
  createDoubleHelixTargets();
  createGridTargets();

  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('container').appendChild(renderer.domElement);

  controls = new TrackballControls(camera, renderer.domElement);
  controls.minDistance = 700;
  controls.maxDistance = 7500;
  controls.addEventListener('change', render);

  document.getElementById('table').addEventListener('click', () => transform(targets.table, 2000));
  document.getElementById('sphere').addEventListener('click', () => transform(targets.sphere, 2000));
  document.getElementById('helix').addEventListener('click', () => transform(targets.helix, 2000));
  document.getElementById('grid').addEventListener('click', () => transform(targets.grid, 2000));

  transform(targets.table, 2000);

  window.addEventListener('resize', onWindowResize);
}

/* ================================
   TILES
================================ */

function createObjects(people) {
  people.forEach((person, index) => {
    const element = createTile(person, index);
    const objectCSS = new CSS3DObject(element);

    objectCSS.position.x = Math.random() * 4000 - 2000;
    objectCSS.position.y = Math.random() * 4000 - 2000;
    objectCSS.position.z = Math.random() * 4000 - 2000;

    scene.add(objectCSS);
    objects.push(objectCSS);
  });
}

function createTile(person, index) {
  const netWorth = parseNetWorth(person['Net Worth']);
  const colorClass = getNetWorthClass(netWorth);

  const element = document.createElement('article');
  element.className = `element ${colorClass}`;

  const safeName = escapeHtml(person.Name);
  const safeCountry = escapeHtml(person.Country);
  const safeInterest = escapeHtml(person.Interest);
  const safeAge = escapeHtml(person.Age);
  const safeNetWorth = escapeHtml(person['Net Worth']);
  const safePhoto = escapeAttribute(person.Photo);

  element.innerHTML = `
    <div class="number">#${index + 1}</div>
    <img class="photo" src="${safePhoto}" alt="${safeName}" loading="lazy">
    <div class="name">${safeName}</div>
    <div class="details">
      Age: ${safeAge}<br>
      ${safeCountry} • ${safeInterest}<br>
      <strong>${safeNetWorth}</strong>
    </div>
  `;

  const image = element.querySelector('.photo');
  image.addEventListener('error', () => {
    image.src = createPlaceholderAvatar(person.Name);
  });

  return element;
}

function parseNetWorth(value) {
  const raw = String(value || '').trim().toLowerCase();

  let multiplier = 1;

  if (raw.includes('m')) {
    multiplier = 1000000;
  } else if (raw.includes('k')) {
    multiplier = 1000;
  }

  const numeric = Number(raw.replace(/[^0-9.-]/g, ''));

  if (Number.isNaN(numeric)) {
    return 0;
  }

  return numeric * multiplier;
}

function getNetWorthClass(netWorth) {
  if (netWorth > 200000) {
    return 'green';
  }

  if (netWorth >= 100000) {
    return 'orange';
  }

  return 'red';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function createPlaceholderAvatar(name) {
  const initial = encodeURIComponent(String(name || '?').trim().charAt(0).toUpperCase() || '?');

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
      <rect width="100%" height="100%" fill="#1c2f36"/>
      <text x="50%" y="56%" text-anchor="middle" font-size="52" font-family="Arial" fill="#8ff">${initial}</text>
    </svg>
  `)}`;
}

/* ================================
   TABLE LAYOUT: 20 x 10
================================ */

function createTableTargets() {
  const TABLE_COLS = 20;
  const TABLE_ROWS = 10;

  const X_GAP = 150;
  const Y_GAP = 190;

  for (let i = 0; i < objects.length; i++) {
    const object = new THREE.Object3D();

    const col = i % TABLE_COLS;
    const row = Math.floor(i / TABLE_COLS);

    object.position.x = (col * X_GAP) - ((TABLE_COLS - 1) * X_GAP) / 2;
    object.position.y = -(row * Y_GAP) + ((TABLE_ROWS - 1) * Y_GAP) / 2;

    targets.table.push(object);
  }
}

/* ================================
   SPHERE LAYOUT
================================ */

function createSphereTargets() {
  const vector = new THREE.Vector3();
  const total = objects.length;

  for (let i = 0; i < total; i++) {
    const phi = Math.acos(-1 + (2 * i) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;

    const object = new THREE.Object3D();

    object.position.setFromSphericalCoords(950, phi, theta);

    vector.copy(object.position).multiplyScalar(2);
    object.lookAt(vector);

    targets.sphere.push(object);
  }
}

/* ================================
   DOUBLE HELIX LAYOUT
================================ */

function createDoubleHelixTargets() {
  const vector = new THREE.Vector3();

  for (let i = 0; i < objects.length; i++) {
    const object = new THREE.Object3D();

    const pairIndex = Math.floor(i / 2);
    const strand = i % 2;

    const theta = pairIndex * 0.34 + (strand === 0 ? 0 : Math.PI);
    const y = -(pairIndex * 17) + 850;

    object.position.setFromCylindricalCoords(900, theta, y);

    vector.x = object.position.x * 2;
    vector.y = object.position.y;
    vector.z = object.position.z * 2;

    object.lookAt(vector);

    targets.helix.push(object);
  }
}

/* ================================
   GRID LAYOUT: 5 x 4 x 10
   Displayed as 10 columns, 4 rows, 5 depth layers.
================================ */

function createGridTargets() {
  const GRID_X = 10;
  const GRID_Y = 4;
  const GRID_Z = 5;

  const X_GAP = 265;
  const Y_GAP = 310;
  const Z_GAP = 650;

  for (let i = 0; i < objects.length; i++) {
    const object = new THREE.Object3D();

    const x = i % GRID_X;
    const y = Math.floor(i / GRID_X) % GRID_Y;
    const z = Math.floor(i / (GRID_X * GRID_Y)) % GRID_Z;

    object.position.x = (x - (GRID_X - 1) / 2) * X_GAP;
    object.position.y = ((GRID_Y - 1) / 2 - y) * Y_GAP;
    object.position.z = (z - (GRID_Z - 1) / 2) * Z_GAP;

    targets.grid.push(object);
  }
}

/* ================================
   ANIMATION
================================ */

function transform(targetList, duration) {
  TWEEN.removeAll();

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    const target = targetList[i];

    new TWEEN.Tween(object.position)
      .to(
        {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: target.rotation.x,
          y: target.rotation.y,
          z: target.rotation.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
  }

  new TWEEN.Tween({})
    .to({}, duration * 2)
    .onUpdate(render)
    .start();
}

function animate() {
  requestAnimationFrame(animate);

  TWEEN.update();

  if (controls) {
    controls.update();
  }
}

function render() {
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();
}
