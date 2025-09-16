const storyElement = document.getElementById("story");
const choicesElement = document.getElementById("choices");
const statsElement = document.getElementById("stats");
const inventoryElement = document.getElementById("inventory");
const shopModal = document.getElementById("shop");
const shopItemsElement = document.getElementById("shop-items");
const closeShopBtn = document.getElementById("closeShop");
const confettiCanvas = document.getElementById("confetti-canvas");

let player = loadPlayer() || {
  hp: 12,
  gold: 15,
  inventory: [],
};

let currentScene = loadScene() || "start";

const itemsForSale = [
  {
    name: "Potion",
    desc: "Memulihkan 5 HP",
    price: 8,
    effect: () => {
      player.hp = Math.min(player.hp + 5, 12);
      showFlash(statsElement);
    }
  },
  {
    name: "Pedang Kayu",
    desc: "Meningkatkan kekuatan serangan",
    price: 12
  },
  {
    name: "Perisai Daun",
    desc: "Mengurangi kerusakan musuh",
    price: 10
  },
];

function showFlash(element) {
  element.classList.add("flash");
  setTimeout(() => element.classList.remove("flash"), 400);
}

function updateStats(flash = false) {
  statsElement.innerHTML = `💖 HP: <b>${player.hp}</b> &nbsp;&nbsp; 🪙 Gold: <b>${player.gold}</b>`;
  if (flash) showFlash(statsElement);
  saveGame();
}

function updateInventory(flash = false) {
  if (player.inventory.length === 0) {
    inventoryElement.innerHTML = `🎒 Inventory: (Kosong)`;
  } else {
    inventoryElement.innerHTML = "🎒 Inventory: " + player.inventory.map((item, idx) => item.effect ? `<span style="text-decoration:underline;cursor:pointer;color:#aaffcc" data-idx="${idx}" title="Klik untuk pakai">${item.name}</span>` : item.name).join(", ");
  }
  if (flash) showFlash(inventoryElement);
  saveGame();
}

function showShop() {
  shopModal.style.display = "block";
  shopItemsElement.innerHTML = "";
  itemsForSale.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "shop-item";
    div.innerHTML = `<span><b>${item.name}</b> - ${item.desc} <br>Harga: ${item.price} gold</span> <button onclick="buyItem(${idx})">Beli</button>`;
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
  // ... (scenes tetap sama)
};

function showScene(sceneName) {
  currentScene = sceneName;
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
  saveGame();
  if (player.hp <= 0) {
    storyElement.innerHTML = "Ribo pingsan! HP habis.<br><b>Petualangan berakhir.</b>";
    choicesElement.innerHTML = `<button onclick="restartGame()">Main Lagi</button>`;
    showFlash(statsElement);
    showConfetti();
    updateStats();
    updateInventory();
  }
}

function saveGame() {
  local