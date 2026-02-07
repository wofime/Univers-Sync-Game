// --- JAVASCRIPT (Logique) ---

let peer;
let conn = null;
let myWord = "";
let friendWord = "";
let score = 0;
let readyMe = false;
let readyFriend = false;

// Sélecteurs DOM
const els = {
    lobby: document.getElementById('view-lobby'),
    game: document.getElementById('view-game'),
    myId: document.getElementById('my-id'),
    friendId: document.getElementById('friend-id'),
    gameInput: document.getElementById('game-input'),
    btnReady: document.getElementById('btn-ready'),
    btnNext: document.getElementById('btn-next'),
    score: document.getElementById('score'),
    victory: document.getElementById('victory-text'),
    meCard: document.getElementById('card-me'),
    friendCard: document.getElementById('card-friend'),
    chatPanel: document.getElementById('chat-panel'),
    chatMsgs: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input')
};

// --- LOGIQUE ID COURT (5 CHIFFRES) ---
function initShortPeer() {
    // Générer nombre entre 10000 et 99999
    const shortId = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Essayer de créer la connexion Peer avec cet ID
    peer = new Peer(shortId);

    peer.on('open', (id) => {
        els.myId.value = id;
    });

    // Si l'ID est déjà pris (erreur PeerJS), on réessaie
    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            initShortPeer(); // On boucle jusqu'à trouver un ID libre
        } else {
            console.error(err);
        }
    });
    
    // Écouteur si quelqu'un se connecte à nous
    peer.on('connection', (c) => {
        conn = c;
        setupConn();
        goToGame();
    });
}

// Démarrer la recherche d'ID
initShortPeer();

// --- LOGIQUE JEU ---

function connect() {
    const id = els.friendId.value.trim();
    if(!id) return alert("Entre un code");
    
    conn = peer.connect(id);
    conn.on('open', () => {
        setupConn();
        goToGame();
    });
    conn.on('error', () => alert("Connexion impossible. Code invalide ?"));
}

function setupConn() {
    conn.on('data', (data) => {
        if (data.type === 'WORD') {
            friendWord = data.val;
            readyFriend = true;
            els.friendCard.classList.add('ready');
            document.getElementById('friend-word-front').innerText = "PRÊT";
            checkReady();
        } else if (data.type === 'CHAT') {
            addMsg(data.val, 'friend');
        }
    });
    conn.on('close', () => alert("Déconnecté"));
}

function goToGame() {
    els.lobby.classList.remove('active');
    els.game.classList.add('active');
    showToast("Connecté !");
}

// Logique Jeu
function updateInput() {
    myWord = els.gameInput.value.trim();
    els.btnReady.disabled = myWord === "";
    document.getElementById('me-word-front').innerText = myWord || "?";
}

function sendWord() {
    if(!conn) return;
    readyMe = true;
    els.meCard.classList.add('ready');
    els.gameInput.disabled = true;
    els.btnReady.style.display = 'none'; // Cacher le bouton Prêt
    
    conn.send({ type: 'WORD', val: myWord });
    checkReady();
}

function checkReady() {
    if (readyMe && readyFriend) {
        setTimeout(revealCards, 500);
    }
}

function revealCards() {
    // Remplir le dos des cartes
    document.getElementById('me-word-back').innerText = myWord;
    document.getElementById('friend-word-back').innerText = friendWord;

    // Retourner les cartes
    document.querySelector('#card-me .card-inner').classList.add('flipped');
    document.querySelector('#card-friend .card-inner').classList.add('flipped');

    // Vérifier victoire
    if (myWord.toLowerCase() === friendWord.toLowerCase()) {
        score++;
        els.score.innerText = score;
        els.victory.innerText = "SYNCHRO !";
        els.victory.className = "win";
        els.btnNext.innerText = "Recommencer"; // Mot clé si victoire
    } else {
        els.victory.innerText = "";
        els.victory.className = "";
        els.btnNext.innerText = "Continuer"; // Mot clé si défaite
    }
    
    els.btnNext.style.display = 'block'; // Afficher le bouton de suite
}

function resetRound() {
    readyMe = false;
    readyFriend = false;
    myWord = "";
    friendWord = "";

    // Reset UI visuel
    document.querySelector('#card-me .card-inner').classList.remove('flipped');
    document.querySelector('#card-friend .card-inner').classList.remove('flipped');
    
    // Attendre la fin de l'animation pour reset le texte
    setTimeout(() => {
        document.getElementById('me-word-front').innerText = "?";
        document.getElementById('friend-word-front').innerText = "?";
        
        els.gameInput.value = "";
        els.gameInput.disabled = false;
        els.btnReady.style.display = 'block'; // Réafficher bouton Prêt
        els.btnReady.disabled = true;
        
        // Cacher le bouton "Continuer/Recommencer"
        els.btnNext.style.display = 'none';
        
        els.meCard.classList.remove('ready');
        els.friendCard.classList.remove('ready');
        els.victory.style.display = 'none'; // Utiliser display:none pour cacher le texte
        els.victory.className = "";
        
        els.gameInput.focus();
    }, 300);
}

// Logique Chat
function toggleChat() { els.chatPanel.classList.toggle('open'); }

function sendChat() {
    const txt = els.chatInput.value.trim();
    if(!txt || !conn) return;
    conn.send({ type: 'CHAT', val: txt });
    addMsg(txt, 'me');
    els.chatInput.value = "";
}

function addMsg(txt, who) {
    const d = document.createElement('div');
    d.className = `msg msg-${who}`;
    d.innerText = txt;
    els.chatMsgs.appendChild(d);
    els.chatMsgs.scrollTop = els.chatMsgs.scrollHeight;
}

// Utilitaire
function showToast(txt) {
    const t = document.getElementById('toast');
    t.innerText = txt;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}
