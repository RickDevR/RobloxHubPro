import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQpZosIqlg1lc5dT5UWgBHAMxzrcje6S4",
  authDomain: "chat-3d356.firebaseapp.com",
  projectId: "chat-3d356",
  storageBucket: "chat-3d356.firebasestorage.app",
  messagingSenderId: "750976196666",
  appId: "1:750976196666:web:4dc9a71b8253c3cad45503",
  measurementId: "G-CW820HNMB2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SECRET_EMAIL = "davidrosenberg545@gmail.com";
const ROLE_CODES = {
  owner: "6355",
  admin: "2285",
  moderator: "2255"
};

let currentUser = null;

const authScreen = document.getElementById("authScreen");
const authUsername = document.getElementById("authUsername");
const authPin = document.getElementById("authPin");
const authEmail = document.getElementById("authEmail");
const userDisplay = document.getElementById("userDisplay");
const roleNotice = document.getElementById("roleNotice");

function getRoleTagBadgeHtml(roleTag) {
  if (roleTag === "owner") return `<span class="tag-badge owner-badge">👑 OWNER</span>`;
  if (roleTag === "admin") return `<span class="tag-badge admin-badge">🛡️ ADMIN</span>`;
  if (roleTag === "moderator") return `<span class="tag-badge mod-badge">⚔️ MOD</span>`;
  return '';
}

document.getElementById("authSubmitBtn").onclick = async () => {
  const username = authUsername.value.trim().toLowerCase();
  const pin = authPin.value.trim();
  const email = authEmail.value.trim().toLowerCase();

  if (email !== SECRET_EMAIL) {
    return alert("Access Denied: Invalid Security Email.");
  }

  const uRef = doc(db, "users", username);
  const uSnap = await getDoc(uRef);

  if (!uSnap.exists() || uSnap.data().pin !== pin) {
    return alert("Invalid credentials.");
  }

  currentUser = uSnap.data();
  authScreen.style.display = "none";

  onSnapshot(uRef, (snap) => {
    if (snap.exists()) {
      currentUser = snap.data();
      const badgeHtml = getRoleTagBadgeHtml(currentUser.roleTag);
      userDisplay.innerHTML = `${currentUser.username} ${badgeHtml}`;
      roleNotice.innerText = currentUser.roleTag ? `Active Role: ${currentUser.roleTag.toUpperCase()}` : "Active Role: Standard User";
    }
  });
};

document.getElementById("applyRoleBtn").onclick = async () => {
  const selectedRole = document.getElementById("roleSelect").value;
  const enteredCode = document.getElementById("rolePasscode").value.trim();

  if (ROLE_CODES[selectedRole] !== enteredCode) {
    return alert(`Incorrect Passcode.`);
  }

  const uRef = doc(db, "users", currentUser.username.toLowerCase());
  await updateDoc(uRef, { roleTag: selectedRole });
  alert(`✓ Role successfully granted!`);
  document.getElementById("rolePasscode").value = "";
};

document.getElementById("revokeRoleBtn").onclick = async () => {
  const uRef = doc(db, "users", currentUser.username.toLowerCase());
  await updateDoc(uRef, { roleTag: "user" });
  alert("Revoked all role badges.");
};

document.getElementById("logoutBtn").onclick = () => location.reload();