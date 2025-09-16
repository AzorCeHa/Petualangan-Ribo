const storyElement = document.getElementById("story");
const choicesElement = document.getElementById("choices");
const statsElement = document.getElementById("stats");
const inventoryElement = document.getElementById("inventory");
const shopModal = document.getElementById("shop");
const shopItemsElement = document.getElementById("shop-items");
const closeShopBtn = document.getElementById("closeShop");
const confettiCanvas = document.getElementById("confetti-canvas");

let player = {
  hp: 12,
  gold: 15,
  inventory: [],
};

const itemsForSale = [
  { name: "Potion", desc: "Memulihkan 5 HP", price: 8, effect: () => { player.hp = Math.min(player.hp + 5, 12); showFlash(statsElement); } },
  { name: "Pedang Kayu", desc: "Meningkatkan kekuatan serangan", price: 12 },
  { name: "Perisai Daun", desc: "Mengurangi kerusakan musuh", price: 10 },
];

function showFlash(element) {
  element.classList.add("flash");
  setTimeout(() => element.classList.remove("flash"), 400);
}

function updateStats(flash=false) {
  statsElement.innerHTML = `💖 HP: <b>${player.hp}</b> &nbsp;&nbsp; 🪙 Gold: <b>${player.gold}</b>`;
  if (flash) showFlash(statsElement);
}

function updateInventory(flash=false) {
  if (player.inventory.length === 0) {
    inventoryElement.innerHTML = `🎒 Inventory: (Kosong)`;
  } else {
    inventoryElement.innerHTML =
      "🎒 Inventory: " +
      player.inventory.map((item, idx) => item.effect ?
        `<span style="text-decoration:underline;cursor:pointer;color:#aaffcc" data-idx="${idx}" title="Klik untuk pakai">${item.name}</span>` :
        item.name
      ).join(", ");
  }
  if (flash) showFlash(inventoryElement);
}

function showShop() {
  shopModal.style.display = "block";
  shopItemsElement.innerHTML = "";
  itemsForSale.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "shop-item";
    div.innerHTML = `<span><b>${item.name}</b> - ${item.desc} <br>Harga: ${item.price} gold</span>
      <button onclick="buyItem(${idx})">Beli</button>`;
    shopItemsElement.appendChild(div);
  });
}

function buyItem(idx) {
  const item = itemsForSale[idx];
  if (player.gold >= item.price) {
    player.gold -= item.price;
    player.inventory.push(item);
    updateStats(true);
    updateInventory(true);
    showConfetti();
    alert(`Kamu membeli ${item.name}!`);
  } else {
    alert("Gold kamu kurang!");
  }
}

closeShopBtn.onclick = () => {
  shopModal.style.display = "none";
};

window.onclick = function(event) {
  if (event.target == shopModal) {
    shopModal.style.display = "none";
  }
}

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
      showFlash(statsElement);
      scenes.fightMonster.text += attack + `<br>Kamu kehilangan ${damage} HP.`;
      showConfetti();
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
      player.inventory.push({ name: "Potion", desc: "Memulihkan 5 HP", price: 0, effect: () => { player.hp = Math.min(player.hp + 5, 12); showFlash(statsElement); } });
      showFlash(statsElement);
      showConfetti();
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
      if (idx>-1) { player.inventory.splice(idx,1); player.hp = Math.min(player.hp+5, 12); showFlash(statsElement); }
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
      player.hp = 12;
      player.gold = 15;
      player.inventory = [];
      showConfetti();
    },
    choices: [
      { text: "Mulai ulang", next: "start" }
    ]
  }
};

function showScene(sceneName) {
  const scene = scenes[sceneName];
  // Reset effect text on revisit
  if (sceneName === "fightMonster") scenes.fightMonster.text = "Ribo bertarung dengan monster.<br>";
  if (scene.effect) scene.effect();
  storyElement.classList.remove("fade");
  void storyElement.offsetWidth; // force reflow
  storyElement.classList.add("fade");
  storyElement.innerHTML = scene.text;
  choicesElement.innerHTML = '';
  scene.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.innerText = choice.text;
    btn.onclick = () => {
      if (choice.action) choice.action();
      showScene(choice.next);
    };
    choicesElement.appendChild(btn);
  });
  updateStats();
  updateInventory();
  if (player.hp <= 0) {
    storyElement.innerHTML = "Ribo pingsan! HP habis.<br><b>Petualangan berakhir.</b>";
    choicesElement.innerHTML = `<button onclick="showScene('restart')">Main Lagi</button>`;
    showFlash(statsElement);
    showConfetti();
    updateStats();
    updateInventory();
  }
}

// Allow item usage from inventory
inventoryElement.onclick = function(e) {
  if (e.target && e.target.tagName === 'SPAN') {
    const idx = parseInt(e.target.dataset.idx);
    let item = player.inventory[idx];
    if (item && item.effect) {
      item.effect();
      player.inventory.splice(idx, 1);
      updateStats(true);
      updateInventory(true);
      showConfetti();
      alert(`${item.name} digunakan!`);
    }
  }
};

function updateInventory(flash=false) {
  if (player.inventory.length === 0) {
    inventoryElement.innerHTML = `🎒 Inventory: (Kosong)`;
  } else {
    inventoryElement.innerHTML =
      "🎒 Inventory: " +
      player.inventory.map((item, idx) => item.effect ?
        `<span style="text-decoration:underline;cursor:pointer;color:#aaffcc" data-idx="${idx}" title="Klik untuk pakai">${item.name}</span>` :
        item.name
      ).join(", ");
  }
  if (flash) showFlash(inventoryElement);
}

// Confetti visual effect
function showConfetti() {
  const duration = 700;
  const end = Date.now() + duration;
  const colors = ['#ffd700', '#ffa500', '#aaffcc', '#fff176', '#ff7f50', '#ffeb3b'];
  let particles = [];
  let width = confettiCanvas.offsetWidth, height = confettiCanvas.offsetHeight;
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

showScene("start");
window.buyItem = buyItem;
window.showScene = showScene;