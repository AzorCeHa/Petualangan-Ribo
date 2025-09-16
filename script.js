/* game.js
   RPG teks berbasis web dengan save/load (localStorage), export/import, autosave.
   LocalStorage key: "rpg_text_save_v1"
*/

/* ----- Elemen DOM (harus ada di HTML) ----- */
const storyElement = document.getElementById("story");
const choicesElement = document.getElementById("choices");
const statsElement = document.getElementById("stats");
const inventoryElement = document.getElementById("inventory");
const shopModal = document.getElementById("shop");
const shopItemsElement = document.getElementById("shop-items");
const closeShopBtn = document.getElementById("closeShop");
const confettiCanvas = document.getElementById("confetti-canvas");

/* ----- Config ----- */
const SAVE_KEY = "rpg_text_save_v1";
const AUTOSAVE_INTERVAL_MS = 5000; // autosave tiap 5 detik jika ada perubahan

/* ----- Player default ----- */
let player = {
  hp: 12,
  maxHp: 12,
  gold: 15,
  inventory: []
};

let currentScene = "start";
let dirty = false; // menandakan ada perubahan yang perlu disimpan

/* ----- Items yang dijual ----- */
const itemsForSale = [
  { name: "Potion", desc: "Memulihkan 5 HP", price: 8, effect: () => { player.hp = Math.min(player.hp + 5, player.maxHp); flash(statsElement); } },
  { name: "Pedang Kayu", desc: "Meningkatkan kekuatan serangan", price: 12 },
  { name: "Perisai Daun", desc: "Mengurangi kerusakan musuh", price: 10 },
];

/* ----- Utilities UI ----- */
function flash(element) {
  if (!element) return;
  element.classList.add("flash");
  setTimeout(() => element.classList.remove("flash"), 400);
}

function updateStats(flashUI = false) {
  if (!statsElement) return;
  statsElement.innerHTML = `💖 HP: <b>${player.hp}</b> / ${player.maxHp} &nbsp;&nbsp; 🪙 Gold: <b>${player.gold}</b>`;
  if (flashUI) flash(statsElement);
}

function updateInventory(flashUI = false) {
  if (!inventoryElement) return;
  if (player.inventory.length === 0) {
    inventoryElement.innerHTML = `🎒 Inventory: (Kosong)`;
  } else {
    inventoryElement.innerHTML =
      "🎒 Inventory: " +
      player.inventory.map((item, idx) => item.effect ?
        `<span class="inv-item" data-idx="${idx}" title="Klik untuk pakai">${escapeHtml(item.name)}</span>` :
        escapeHtml(item.name)
      ).join(", ");
  }
  if (flashUI) flash(inventoryElement);
}

/* safe escape untuk nama item/teks */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
}

/* ----- Shop UI ----- */
function showShop() {
  if (!shopModal || !shopItemsElement) return;
  shopModal.style.display = "block";
  shopItemsElement.innerHTML = "";
  itemsForSale.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "shop-item";
    div.innerHTML = `<span><b>${escapeHtml(item.name)}</b> - ${escapeHtml(item.desc)} <br>Harga: ${item.price} gold</span>
      <button data-idx="${idx}">Beli</button>`;
    shopItemsElement.appendChild(div);
  });
}

function buyItem(idx) {
  const item = itemsForSale[idx];
  if (!item) return;
  if (player.gold >= item.price) {
    player.gold -= item.price;
    // copy item object so effect functions remain available
    player.inventory.push(Object.assign({}, item));
    markDirty();
    updateStats(true);
    updateInventory(true);
    showConfetti();
    alert(`Kamu membeli ${item.name}!`);
  } else {
    alert("Gold kamu kurang!");
  }
}

if (closeShopBtn) {
  closeShopBtn.onclick = () => { if (shopModal) shopModal.style.display = "none"; };
}

window.onclick = function(event) {
  if (event.target === shopModal) {
    shopModal.style.display = "none";
  }
};

/* ----- Scenes ----- */
const scenes = {
  start: {
    text: "Ribo memulai petualangannya di sebuah desa kecil. Terdengar rumor tentang harta karun di hutan.<br><br>Apa yang akan dilakukan Ribo?",
    choices: [
      { text: "Pergi ke hutan", next: "forest" },
      { text: "Kunjungi toko di desa", action: showShop, next: "start" },
      { text: "Periksa inventory", action: () => updateInventory(true), next: "start" },
    ]
  },
  forest: {
    text: "Ribo masuk ke hutan lebat. Tiba-tiba muncul monster!<br>Apa yang akan dilakukan?",
    choices: [
      { text: "Lawan monster", next: "fightMonster" },
      { text: "Lari ke desa", next: "start" },
    ]
  },
  fightMonster: {
    text: "Ribo bertarung dengan monster.<br>",
    effect: () => {
      let damage = player.inventory.some(i=>i.name==="Perisai Daun") ? 2 : 4;
      player.hp -= damage;
      let attack = player.inventory.some(i=>i.name==="Pedang Kayu") ? "Dengan pedang kayu, seranganmu lebih kuat! Monster kalah dan kamu mendapat 12 gold." : "Kamu menang tipis! Monster kalah dan kamu dapat 8 gold.";
      player.gold += player.inventory.some(i=>i.name==="Pedang Kayu") ? 12 : 8;
      flash(statsElement);
      // jangan tambah teks berulang tiap kunjungan - kita simpan string dasar di showScene
      scenes.fightMonster.text = "Ribo bertarung dengan monster.<br>" + attack + `<br>Kamu kehilangan ${damage} HP.`;
      showConfetti();
      markDirty();
    },
    choices: [
      { text: "Jelajahi lebih dalam", next: "deepForest" },
      { text: "Kembali ke desa", next: "start" }
    ]
  },
  deepForest: {
    text: "Ribo menemukan sebuah peti misterius.",
    choices: [
      { text: "Buka peti", next: "openChest" },
      { text: "Kembali ke hutan", next: "forest" }
    ]
  },
  openChest: {
    text: "Isi peti: 20 gold dan sebuah Potion!",
    effect: () => {
      player.gold += 20;
      player.inventory.push({ name: "Potion", desc: "Memulihkan 5 HP", price: 0, effect: () => { player.hp = Math.min(player.hp + 5, player.maxHp); flash(statsElement); } });
      flash(statsElement);
      showConfetti();
      markDirty();
    },
    choices: [
      { text: "Pergi ke desa", next: "start" },
      { text: "Minum Potion", next: "drinkPotion" }
    ]
  },
  drinkPotion: {
    text: "Kamu meminum Potion. HP bertambah 5.",
    effect: () => {
      let idx = player.inventory.findIndex(i=>i.name==="Potion");
      if (idx > -1) { player.inventory.splice(idx,1); player.hp = Math.min(player.hp+5, player.maxHp); flash(statsElement); markDirty(); }
    },
    choices: [
      { text: "Kembali ke desa", next: "start" }
    ]
  },
  shop: {
    text: "Kamu berada di toko. Barang apa yang ingin kamu beli?",
    choices: [
      { text: "Beli item", action: showShop, next: "start" },
      { text: "Kembali ke desa", next: "start" },
    ]
  },
  restart: {
    text: "Game diulang.",
    effect: () => {
      player.hp = player.maxHp = 12;
      player.gold = 15;
      player.inventory = [];
      showConfetti();
      markDirty();
    },
    choices: [
      { text: "Mulai ulang", next: "start" }
    ]
  }
};

/* ----- Menampilkan scene ----- */
function showScene(sceneName) {
  currentScene = sceneName;
  const scene = scenes[sceneName];
  if (!scene) return;
  // reset baseline text jika perlu (hindari penumpukan teks)
  if (sceneName === "fightMonster" && !scene.text.startsWith("Ribo bertarung")) {
    scene.text = "Ribo bertarung dengan monster.<br>";
  }
  if (scene.effect) scene.effect();
  // animasi sederhana
  if (storyElement) {
    storyElement.classList.remove("fade");
    void storyElement.offsetWidth; // force reflow
    storyElement.classList.add("fade");
    storyElement.innerHTML = scene.text;
  }
  if (choicesElement) {
    choicesElement.innerHTML = '';
    (scene.choices || []).forEach(choice => {
      const btn = document.createElement('button');
      btn.innerText = choice.text;
      btn.onclick = () => {
        if (choice.action) choice.action();
        // simpan currentScene sebelum pindah agar save konsisten
        showScene(choice.next);
      };
      choicesElement.appendChild(btn);
    });
  }
  updateStats();
  updateInventory();
  // cek HP
  if (player.hp <= 0) {
    if (storyElement) storyElement.innerHTML = "Ribo pingsan! HP habis.<br><b>Petualangan berakhir.</b>";
    if (choicesElement) choicesElement.innerHTML = `<button onclick="showScene('restart')">Main Lagi</button>`;
    flash(statsElement);
    showConfetti();
    markDirty();
    updateStats();
    updateInventory();
  }
  markDirty(); // scene change = perubahan
}

/* ----- Inventory click untuk gunakan item ----- */
if (inventoryElement) {
  inventoryElement.addEventListener('click', function(e) {
    const target = e.target;
    if (target && target.classList.contains('inv-item')) {
      const idx = parseInt(target.dataset.idx);
      const item = player.inventory[idx];
      if (item && item.effect) {
        item.effect();
        player.inventory.splice(idx, 1);
        updateStats(true);
        updateInventory(true);
        showConfetti();
        alert(`${item.name} digunakan!`);
        markDirty();
      }
    }
  });
}

/* ----- Confetti ----- */
function showConfetti() {
  if (!confettiCanvas) return;
  const duration = 700;
  const end = Date.now() + duration;
  const colors = ['#ffd700', '#ffa500', '#aaffcc', '#fff176', '#ff7f50', '#ffeb3b'];
  let particles = [];
  let width = confettiCanvas.offsetWidth || 300, height = confettiCanvas.offsetHeight || 150;
  confettiCanvas.width = width; confettiCanvas.height = height;
  for (let i = 0; i < 25; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height / 2,
      r: 6 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 2 + Math.random() * 2,
      angle: Math.random() * Math.PI * 2
    });
  }
  function draw() {
    let ctx = confettiCanvas.getContext("2d");
    ctx.clearRect(0,0,width,height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }
  function update() {
    particles.forEach(p => {
      p.y += p.speed;
      p.x += Math.sin(p.angle) * 2;
      p.angle += 0.02;
      if (p.y > height) p.y = -10;
    });
  }
  let animation = setInterval(() => {
    update(); draw();
    if (Date.now() > end) {
      clearInterval(animation);
      confettiCanvas.getContext("2d").clearRect(0,0,width,height);
    }
  }, 35);
}

/* ----- Save / Load ----- */
function markDirty() {
  dirty = true;
}

function saveGame(slot = "default") {
  try {
    const payload = {
      player,
      currentScene,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(SAVE_KEY + "_" + slot, JSON.stringify(payload));
    dirty = false;
    // beri umpan balik kecil
    flash(statsElement);
    console.log("Game saved to slot:", slot);
    return true;
  } catch (e) {
    console.error("Gagal menyimpan:", e);
    return false;
  }
}

function loadGame(slot = "default") {
  try {
    const raw = localStorage.getItem(SAVE_KEY + "_" + slot);
    if (!raw) { console.warn("Tidak ada save di slot:", slot); return false; }
    const payload = JSON.parse(raw);
    if (payload.player) {
      player = payload.player;
      // pastikan ada maxHp
      if (!player.maxHp) player.maxHp = 12;
    }
    if (payload.currentScene) currentScene = payload.currentScene;
    // tampilkan dan beri umpan balik
    updateStats(true);
    updateInventory(true);
    showScene(currentScene || "start");
    dirty = false;
    console.log("Loaded save from slot:", slot, "savedAt:", payload.savedAt);
    return true;
  } catch (e) {
    console.error("Gagal memuat save:", e);
    return false;
  }
}

function deleteSave(slot = "default") {
  localStorage.removeItem(SAVE_KEY + "_" + slot);
  console.log("Deleted save slot", slot);
}

/* ----- Export / Import (JSON string) ----- */
function exportSave(slot = "default") {
  const raw = localStorage.getItem(SAVE_KEY + "_" + slot);
  if (!raw) return null;
  // return base64 agar aman saat copy/paste
  return btoa(unescape(encodeURIComponent(raw)));
}

function importSave(base64String, slot = "default") {
  try {
    const raw = decodeURIComponent(escape(atob(base64String)));
    // validasi
    const payload = JSON.parse(raw);
    localStorage.setItem(SAVE_KEY + "_" + slot, raw);
    console.log("Imported save to slot:", slot);
    return true;
  } catch (e) {
    console.error("Import gagal:", e);
    return false;
  }
}

/* ----- Autosave loop ----- */
setInterval(() => {
  if (dirty) {
    saveGame("default");
  }
}, AUTOSAVE_INTERVAL_MS);

/* ----- Expose beberapa fungsi untuk tombol/manual ----- */
window.saveGame = saveGame;
window.loadGame = loadGame;
window.deleteSave = deleteSave;
window.exportSave = exportSave;
window.importSave = importSave;
window.buyItem = buyItem;
window.showScene = showScene;

/* ----- Inisialisasi: coba load otomatis, kalau tidak ada mulai baru ----- */
(function init() {
  // coba load otomatis dari slot default
  const loaded = loadGame("default");
  if (!loaded) {
    // pastikan state awal ditampilkan
    updateStats();
    updateInventory();
    showScene("start");
  }
})();
