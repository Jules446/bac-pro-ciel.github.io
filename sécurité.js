// --- Références éléments ---
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const closeLogin = document.getElementById('closeLogin');
const closeSignup = document.getElementById('closeSignup');
const userDisplay = document.getElementById('userDisplay');
const adminLink = document.getElementById('adminLink'); 
const membersContainer = document.getElementById('membersContainer');
const membersList = document.getElementById('membersList');

// --- Créer admin par défaut ---
if(!localStorage.getItem("admin")){
    localStorage.setItem("admin", JSON.stringify({username:"admin", password:"admin123", role:"admin"}));
}
if(!localStorage.getItem("Jules")){
    localStorage.setItem("Jules", JSON.stringify({username:"Jules", password:"Jules44690", role:"admin"}));
}

// --- Popups login/signup ---
loginBtn.addEventListener('click', () => loginForm.style.display='flex');
signupBtn.addEventListener('click', () => signupForm.style.display='flex');
closeLogin.addEventListener('click', () => loginForm.style.display='none');
closeSignup.addEventListener('click', () => signupForm.style.display='none');

// --- Fonction pour vérifier s'il y a des comptes ---
function hasAccounts(){
    return Object.keys(localStorage).some(key => {
        try {
            const u = JSON.parse(localStorage.getItem(key));
            return u && u.username;
        } catch(e) { return false; }
    });
}

// --- Création compte ---
document.getElementById('formSignup').addEventListener('submit', e=>{
    e.preventDefault();
    const prenom = document.getElementById('signupPrenom').value.trim();
    const nom = document.getElementById('signupNom').value.trim();
    const dob = document.getElementById('signupDob').value;
    const email = document.getElementById('signupEmail').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();

    if(localStorage.getItem(username)){
        alert('Nom d’utilisateur déjà utilisé !');
        return;
    }

    const user = { prenom, nom, dob, email, username, password, role:'client', banned:false, createdAt:new Date().toLocaleDateString() };
    localStorage.setItem(username, JSON.stringify(user));
    alert('Compte créé ! Vous pouvez maintenant vous connecter.');
    signupForm.style.display='none';
});

// --- Connexion ---
document.getElementById('formLogin').addEventListener('submit', e=>{
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const stored = localStorage.getItem(username);

    if(!stored){ alert('Utilisateur non trouvé !'); return; }
    const user = JSON.parse(stored);
    if(user.password !== password){ alert('Mot de passe incorrect !'); return; }
    if(user.banned){ alert("Compte banni !"); return; }

    loginUser(user);
});

// --- Gérer l'utilisateur connecté ---
function loginUser(user){
    localStorage.setItem('connectedUser', user.username);
    loginForm.style.display='none';
    loginBtn.style.display='none';
    signupBtn.style.display='none';
    logoutBtn.style.display='inline-block';
    userDisplay.textContent = `Bienvenue, ${user.prenom} ${user.nom} (${user.role}) !`;

    if(user.role === 'admin'){
        if(adminLink) adminLink.style.display='inline-block';
        displayMembers();
    }
}

// --- Déconnexion ---
logoutBtn.addEventListener('click', ()=>{
    localStorage.removeItem('connectedUser');
    loginBtn.style.display='inline-block';
    signupBtn.style.display='inline-block';
    logoutBtn.style.display='none';
    if(adminLink) adminLink.style.display='none';
    userDisplay.textContent='';
    if(membersContainer) membersContainer.style.display='none';
});

// --- Gestion membres (admin) ---
function displayMembers(){
    membersContainer.style.display='block';
    membersList.innerHTML='';

    Object.keys(localStorage).forEach(key=>{
        try{
            const user = JSON.parse(localStorage.getItem(key));
            if(!user.username || key==='connectedUser') return;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.username}</td>
                <td>
                    <select onchange="changeRole('${user.username}', this.value)">
                        <option value="client" ${user.role==='client'?'selected':''}>Client</option>
                        <option value="admin" ${user.role==='admin'?'selected':''}>Admin</option>
                    </select>
                </td>
                <td>
                    <button class="member-btn delete" onclick="deleteMember('${user.username}')">Supprimer</button>
                    <button class="member-btn reset" onclick="resetPassword('${user.username}')">Réinit MDP</button>
                </td>
            `;
            membersList.appendChild(tr);
        }catch(e){}
    });
}

function deleteMember(username){
    if(confirm('Voulez-vous vraiment supprimer cet utilisateur ?')){
        localStorage.removeItem(username);
        displayMembers();
    }
}

function changeRole(username, newRole){
    const user = JSON.parse(localStorage.getItem(username));
    user.role = newRole;
    localStorage.setItem(username, JSON.stringify(user));
    displayMembers();
}

function resetPassword(username){
    const newPass = prompt(`Nouveau mot de passe pour ${username} :`);
    if(!newPass) return;
    const user = JSON.parse(localStorage.getItem(username));
    user.password = newPass;
    localStorage.setItem(username, JSON.stringify(user));
    alert(`Mot de passe de ${username} réinitialisé !`);
    displayMembers();
}

// --- Popup automatique si pas connecté ---
function showLoginPopup(){
    const popup = document.createElement('div');
    popup.id = "autoLoginPopup";
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.left = '0';
    popup.style.width = '100%';
    popup.style.height = '100%';
    popup.style.background = 'rgba(0,0,0,0.7)';
    popup.style.display = 'flex';
    popup.style.justifyContent = 'center';
    popup.style.alignItems = 'center';
    popup.style.zIndex = '1000';

    popup.innerHTML = `
        <div style="background:#1a1a2e;padding:30px;border-radius:20px;text-align:center;color:white;">
            <h2>Connexion requise</h2>
            <p>Vous devez vous connecter pour accéder aux fonctionnalités.</p>
            <button id="popupLoginBtn" style="padding:12px 25px;border-radius:25px;background:#4a66ff;color:white;border:none;cursor:pointer;margin-top:10px;">Se connecter</button>
        </div>
    `;
    document.body.appendChild(popup);

    document.getElementById('popupLoginBtn').onclick = () => {
        popup.remove();
        loginForm.style.display = 'flex';
    };
}

// --- Initialisation au chargement ---
window.addEventListener('load', ()=>{
    if(!hasAccounts()){
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'inline-block';
        alert("Aucun compte existant. Veuillez créer un compte.");
    } else {
        loginBtn.style.display = 'inline-block';
        signupBtn.style.display = 'inline-block';
    }

    const connectedUsername = localStorage.getItem('connectedUser');
    if(connectedUsername){
        const user = JSON.parse(localStorage.getItem(connectedUsername));
        if(user) loginUser(user);
    } else {
        // Si personne n'est connecté, afficher popup
        showLoginPopup();
    }
});

// --- Likes texte principal ---
const likeBtn = document.getElementById("likeMainText");
const mainTextLikesSpan = document.getElementById("mainTextLikes");
let mainTextLikes = parseInt(localStorage.getItem("mainTextLikes") || 0);
let likedUsers = JSON.parse(localStorage.getItem("mainTextLikedUsers") || "[]");
mainTextLikesSpan.textContent = mainTextLikes;

likeBtn.onclick = () => {
    const user = getLoggedUsername();
    if(!user){ alert("Connectez-vous pour liker !"); return; }
    if(likedUsers.includes(user)){ alert("Vous avez déjà liké ce texte !"); return; }
    mainTextLikes++;
    likedUsers.push(user);
    localStorage.setItem("mainTextLikes", mainTextLikes);
    localStorage.setItem("mainTextLikedUsers", JSON.stringify(likedUsers));
    mainTextLikesSpan.textContent = mainTextLikes;
};
