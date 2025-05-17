const loginScreen = document.getElementById("loginScreen");
const registerScreen = document.getElementById("registerScreen");
const app = document.getElementById("app");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");
const logoutBtn = document.getElementById("logoutBtn");
const themeToggle = document.getElementById("themeToggle");

const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const errorMessage = document.getElementById("errorMessage");

const userNameDisplay = document.getElementById("userNameDisplay");
const playlistList = document.getElementById("playlistList");
const playerMessage = document.getElementById("playerMessage");
const searchMusicBtn = document.getElementById("searchMusicBtn");
const musicSearchInput = document.getElementById("musicSearchInput");
const currentSongTitle = document.getElementById("currentSongTitle");
const showAvailableSongsBtn = document.getElementById("showAvailableSongsBtn");
const availableSongsList = document.getElementById("availableSongsList");
const songListContainer = document.getElementById("songListContainer");
const createPlaylistBtn = document.getElementById("createPlaylistBtn");

const playPauseBtn = document.getElementById("playPauseBtn");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const volumeSlider = document.getElementById("volumeSlider");
const progressBar = document.querySelector(".progressBar");
const progressBarFill = document.querySelector(".progressBarFill");
const currentTimeDisplay = document.getElementById("currentTime");
const durationDisplay = document.getElementById("duration");

// Adicionar constantes para o botão de playlist
const addToPlaylistBtn = document.getElementById("addToPlaylistBtn");
const playlistDropdown = document.getElementById("playlistDropdown");
const playlistDropdownItems = document.getElementById("playlistDropdownItems");

let isPlaying = false;
let currentSong = null;
let playerInterval = null;
let currentPlaylist = [];
let currentPlaylistIndex = 0;
let isRepeat = false;
let isShuffle = false;
let audioElement = null;
let ytPlayer = null;
let isYoutubeVideo = false;
let youtubeContainer = null;

function createYoutubeContainer() {
  if (!youtubeContainer) {
    youtubeContainer = document.createElement('div');
    youtubeContainer.id = 'youtubePlayer';
    youtubeContainer.style.display = 'none';
    youtubeContainer.style.position = 'absolute';
    youtubeContainer.style.top = '0';
    youtubeContainer.style.left = '0';
    youtubeContainer.style.width = '100%';
    youtubeContainer.style.height = '100%';
    document.getElementById('playerContainer').appendChild(youtubeContainer);
    
    // Carregar API do YouTube
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
}

// Função chamada automaticamente quando a API do YouTube carrega
window.onYouTubeIframeAPIReady = function() {
  console.log('YouTube API ready');
};

const musicas = {
  "Five Finger Death Punch": "assets/audio/Five Finger Death Punch - Wrong Side Of Heaven.mp3",
  "Before I Forget": "assets/audio/Slipknot - Before I Forget [OFFICIAL VIDEO] [HD].mp3",
  "wind of change": "assets/audio/Scorpions - Wind Of Change (Official Music Video).mp3",
  "aerials": "assets/audio/System Of A Down - Aerials (Official HD Video).mp3",
  "toxicity": "assets/audio/System Of A Down - Toxicity (Official HD Video).mp3",
};

function showErrorMessage(message, isError = true) {
  if (!errorMessage) return;
  
  errorMessage.textContent = message;
  errorMessage.classList.add("show");
  
  if (isError) {
    errorMessage.classList.add("error");
    errorMessage.classList.remove("success");
  } else {
    errorMessage.classList.add("success");
    errorMessage.classList.remove("error");
  }
  
  setTimeout(() => {
    errorMessage.classList.remove("show");
  }, 3000);
}

function tocarMusica(nome) {
  if (!nome) {
    return;
  }
  
  const url = musicas[nome];
  if (!url) {
    mostrarMusicasDisponiveis();
    return;
  }

  // Verificar se é um vídeo do YouTube
  if (url.startsWith('youtube:')) {
    const videoId = url.split(':')[1];
    tocarYouTubeVideo(videoId, nome);
    return;
  }

  // Se não for YouTube, limpar player anterior se existir
  if (ytPlayer) {
    ytPlayer.destroy();
    ytPlayer = null;
    if (youtubeContainer) {
      youtubeContainer.style.display = 'none';
    }
  }
  
  isYoutubeVideo = false;

  try {
    stopPlayerInterval();
    
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    
    audioElement = new Audio();
    
    audioElement.addEventListener('loadedmetadata', () => {
      const duration = audioElement.duration;
      durationDisplay.textContent = formatTime(duration);
    });
    
    audioElement.addEventListener('timeupdate', () => {
      updateProgress();
    });
    
    audioElement.addEventListener('ended', onSongEnd);
    
    audioElement.addEventListener('error', (e) => {
      console.error('Erro ao carregar áudio:', e);
    });
    
    audioElement.volume = volumeSlider.value / 100;
    
    audioElement.src = url;
    
    const playPromise = audioElement.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlaying = true;
          updatePlayPauseButton();
          currentSong = nome;
          currentSongTitle.textContent = nome;
          
          // Mostrar botão quando houver música tocando
          addToPlaylistBtn.style.display = "flex";
          
          // Usar o evento timeupdate para atualizações suaves
          // e um intervalo de backup para garantir atualizações frequentes
          playerInterval = setInterval(() => {
            if (!audioElement.paused) {
              updateProgress();
            }
          }, 50);
          
          document.querySelectorAll('.song-item').forEach(item => {
            item.classList.remove('playing');
            if (item.textContent === nome) {
              item.classList.add('playing');
            }
          });
        })
        .catch(error => {
          console.error('Erro ao iniciar reprodução:', error);
          isPlaying = false;
          updatePlayPauseButton();
        });
    }
    
  } catch (error) {
    console.error('Erro ao tocar música:', error);
  }
}

function tocarYouTubeVideo(videoId, nome) {
  createYoutubeContainer();
  
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
  
  isYoutubeVideo = true;
  isPlaying = true;
  currentSong = nome;
  currentSongTitle.textContent = nome;
  
  // Mostrar botão quando houver música tocando
  addToPlaylistBtn.style.display = "flex";
  
  // Atualizar interface visual
  document.querySelectorAll('.song-item').forEach(item => {
    item.classList.remove('playing');
    if (item.textContent === nome) {
      item.classList.add('playing');
    }
  });
  
  updatePlayPauseButton();
  
  // Se a API do YouTube já estiver carregada
  if (window.YT && window.YT.Player) {
    if (ytPlayer) {
      ytPlayer.destroy();
    }
    
    youtubeContainer.style.display = 'block';
    
    ytPlayer = new YT.Player('youtubePlayer', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        'autoplay': 1,
        'controls': 0,
        'rel': 0,
        'showinfo': 0
      },
      events: {
        'onReady': onYoutubePlayerReady,
        'onStateChange': onYoutubePlayerStateChange
      }
    });
  } else {
    // Se a API ainda não carregou, aguardar e tentar novamente
    showErrorMessage('Carregando player do YouTube...');
    setTimeout(() => {
      tocarYouTubeVideo(videoId, nome);
    }, 1000);
  }
}

function onYoutubePlayerReady(event) {
  event.target.playVideo();
  ytPlayer.setVolume(volumeSlider.value);
  
  // Iniciar atualização do tempo
  playerInterval = setInterval(() => {
    if (ytPlayer && ytPlayer.getCurrentTime) {
      const currentTime = ytPlayer.getCurrentTime();
      const duration = ytPlayer.getDuration();
      const percent = (currentTime / duration) * 100;
      
      progressBarFill.style.width = percent + "%";
      currentTimeDisplay.textContent = formatTime(currentTime);
      durationDisplay.textContent = formatTime(duration);
      
      if (currentTime >= duration - 0.5) {
        onSongEnd();
      }
    }
  }, 500);
}

function onYoutubePlayerStateChange(event) {
  // Estado 0 = vídeo terminou
  if (event.data === 0) {
    onSongEnd();
  }
}

function updateProgress() {
  if (!audioElement || audioElement.readyState < 2) return;
  
  try {
    const currentTime = audioElement.currentTime || 0;
    const duration = audioElement.duration || 0;
    
    if (isNaN(duration) || duration === 0) return;
    
    // Calculando porcentagem com precisão
    const percent = Math.min(100, Math.max(0, (currentTime / duration) * 100));
    
    // Atualizar a largura da barra de progresso diretamente
    requestAnimationFrame(() => {
      progressBarFill.style.width = percent + "%";
      currentTimeDisplay.textContent = formatTime(currentTime);
    });
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function getDurationInSeconds() {
  if (isYoutubeVideo && ytPlayer) {
    return ytPlayer.getDuration();
  }
  
  if (audioElement && !isNaN(audioElement.duration)) {
    return audioElement.duration;
  }
  
  const timeText = durationDisplay.textContent;
  const [minutes, seconds] = timeText.split(':').map(Number);
  return minutes * 60 + seconds;
}

function onSongEnd() {
  if (isRepeat && currentSong) {
    tocarMusica(currentSong);
  } else if (currentPlaylist.length > 0) {
    playNextSong();
  } else {
    resetPlayer();
  }
}

function stopPlayerInterval() {
  if (playerInterval) {
    clearInterval(playerInterval);
    playerInterval = null;
  }
}

function preserveProgressState() {
  if (audioElement && !isNaN(audioElement.duration)) {
    const currentTime = audioElement.currentTime;
    const duration = audioElement.duration;
    const percent = (currentTime / duration) * 100;
    
    progressBarFill.style.width = percent + "%";
    currentTimeDisplay.textContent = formatTime(currentTime);
  }
}

function resetPlayer() {
  stopPlayerInterval();
  
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
    
    // Limpar referências para evitar memory leaks
    audioElement.onloadedmetadata = null;
    audioElement.ontimeupdate = null;
    audioElement.onended = null;
    audioElement.onerror = null;
    audioElement.src = "";
  }
  
  if (ytPlayer) {
    ytPlayer.stopVideo();
  }
  
  isPlaying = false;
  updatePlayPauseButton();
  progressBarFill.style.width = "0%";
  currentTimeDisplay.textContent = "0:00";
  currentSongTitle.textContent = "Selecione uma música";
  
  // Ocultar botão quando não houver música
  addToPlaylistBtn.style.display = "none";
}

function updatePlayPauseButton() {
  const icon = playPauseBtn.querySelector(".material-icons");
  icon.textContent = isPlaying ? "pause" : "play_arrow";
}

function playNextSong() {
  if (currentPlaylist.length === 0) {
    return;
  }
  
  if (isShuffle) {
    currentPlaylistIndex = Math.floor(Math.random() * currentPlaylist.length);
  } else {
    currentPlaylistIndex = (currentPlaylistIndex + 1) % currentPlaylist.length;
  }
  
  tocarMusica(currentPlaylist[currentPlaylistIndex]);
}

function playPrevSong() {
  if (currentPlaylist.length === 0) {
    return;
  }
  
  if (isShuffle) {
    currentPlaylistIndex = Math.floor(Math.random() * currentPlaylist.length);
  } else {
    currentPlaylistIndex = (currentPlaylistIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
  }
  
  tocarMusica(currentPlaylist[currentPlaylistIndex]);
}

playPauseBtn.addEventListener('click', () => {
  if (!isPlaying) {
    if (currentSong) {
      if (isYoutubeVideo && ytPlayer) {
        ytPlayer.playVideo();
        isPlaying = true;
        updatePlayPauseButton();
      } else if (audioElement) {
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              isPlaying = true;
              updatePlayPauseButton();
              
              // Garantir que o intervalo de atualização esteja funcionando
              if (!playerInterval) {
                playerInterval = setInterval(() => {
                  updateProgress();
                }, 100);
              }
            })
            .catch(error => {
              console.error('Erro ao retomar reprodução:', error);
              showErrorMessage('Erro ao reproduzir a música. Tente novamente.');
            });
        }
      } else if (currentPlaylist.length > 0) {
        const musicNames = Object.keys(musicas);
        const randomIndex = Math.floor(Math.random() * musicNames.length);
        tocarMusica(musicNames[randomIndex]);
      }
    } else if (currentPlaylist.length > 0) {
      const musicNames = Object.keys(musicas);
      const randomIndex = Math.floor(Math.random() * musicNames.length);
      tocarMusica(musicNames[randomIndex]);
    }
  } else {
    if (isYoutubeVideo && ytPlayer) {
      ytPlayer.pauseVideo();
    } else if (audioElement) {
      audioElement.pause();
      
      // Preservar o estado da barra de progresso quando pausado
      preserveProgressState();
      
      // Parar o intervalo de atualização quando pausado
      stopPlayerInterval();
    }
    isPlaying = false;
    updatePlayPauseButton();
  }
});

nextBtn.addEventListener('click', playNextSong);

prevBtn.addEventListener('click', playPrevSong);

shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.style.color = isShuffle ? "#1DB954" : "#aaa";
});

repeatBtn.addEventListener('click', () => {
  isRepeat = !isRepeat;
  repeatBtn.style.color = isRepeat ? "#1DB954" : "#aaa";
});

volumeSlider.addEventListener('input', (e) => {
  const volume = e.target.value;
  e.target.style.background = `linear-gradient(to right, #1DB954 0%, #1DB954 ${volume}%, #535353 ${volume}%, #535353 100%)`;
  
  if (audioElement) {
    audioElement.volume = volume / 100;
  }
  
  if (ytPlayer && ytPlayer.setVolume) {
    ytPlayer.setVolume(volume);
  }
});

progressBar.addEventListener('click', (e) => {
  if (!audioElement && !isYoutubeVideo) return;
  
  const rect = progressBar.getBoundingClientRect();
  const clickPosition = e.clientX - rect.left;
  const percent = clickPosition / rect.width;
  
  if (percent < 0 || percent > 1) return;
  
  // Atualizar a interface primeiro para feedback imediato
  progressBarFill.style.width = (percent * 100) + "%";
  
  if (isYoutubeVideo && ytPlayer) {
    const duration = ytPlayer.getDuration();
    const newTime = percent * duration;
    ytPlayer.seekTo(newTime, true);
    currentTimeDisplay.textContent = formatTime(newTime);
  } else if (audioElement && !isNaN(audioElement.duration)) {
    const duration = audioElement.duration;
    const newTime = percent * duration;
    audioElement.currentTime = newTime;
    currentTimeDisplay.textContent = formatTime(newTime);
  }
});

function initializePlaylist() {
  currentPlaylist = Object.keys(musicas);
}

function showPlayerMessage(message, isError = false) {
  playerMessage.innerHTML = `
    <div style="color: ${isError ? '#ff4444' : '#1DB954'}; 
               padding: 10px;
               background: ${isError ? 'rgba(255, 68, 68, 0.1)' : 'rgba(29, 185, 84, 0.1)'};
               border-radius: 5px;
               margin-top: 10px;">
      ${message}
    </div>
  `;
}

function mostrarListaDeMusicasDisponiveis() {
  songListContainer.innerHTML = '';
  
  Object.keys(musicas).forEach(nome => {
    const songItem = document.createElement('div');
    songItem.className = 'song-item';
    songItem.textContent = nome;
    songItem.addEventListener('click', () => {
      tocarMusica(nome);
      musicSearchInput.value = nome;
    });
    songListContainer.appendChild(songItem);
  });
  
  availableSongsList.classList.add('show');
}

showAvailableSongsBtn.addEventListener('click', () => {
  if (availableSongsList.classList.contains('show')) {
    availableSongsList.classList.remove('show');
  } else {
    mostrarListaDeMusicasDisponiveis();
  }
});

function mostrarMusicasDisponiveis() {
  mostrarListaDeMusicasDisponiveis();
}

window.tocarMusica = tocarMusica;

searchMusicBtn.addEventListener('click', () => {
  const nome = musicSearchInput.value.trim().toLowerCase();
  if (nome) {
    tocarMusica(nome);
    
    if (currentPlaylist.length === 0) {
      initializePlaylist();
      currentPlaylistIndex = currentPlaylist.indexOf(nome);
      if (currentPlaylistIndex === -1) currentPlaylistIndex = 0;
    }
  }
});

musicSearchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const nome = musicSearchInput.value.trim().toLowerCase();
    if (nome) {
      tocarMusica(nome);
      
      if (currentPlaylist.length === 0) {
        initializePlaylist();
        currentPlaylistIndex = currentPlaylist.indexOf(nome);
        if (currentPlaylistIndex === -1) currentPlaylistIndex = 0;
      }
    }
  }
});

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || {};
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
  return localStorage.getItem("currentUser");
}

function setCurrentUser(username) {
  localStorage.setItem("currentUser", username);
}

function logout() {
  localStorage.removeItem("currentUser");
  location.reload();
}

function updatePlaylistList() {
  const users = getUsers();
  const username = getCurrentUser();
  if (!username) return;
  
  const user = users[username];
  playlistList.innerHTML = "";
  
  if (user.playlists && Array.isArray(user.playlists) && user.playlists.length > 0 && typeof user.playlists[0] === 'string') {
    const oldPlaylists = [...user.playlists];
    user.playlists = oldPlaylists.map(name => ({ name, songs: [] }));
    saveUsers(users);
  }
  
  if (!user.playlists || !Array.isArray(user.playlists) || user.playlists.length === 0) {
    user.playlists = [{ name: 'Favoritas', songs: [] }];
    saveUsers(users);
  }

  user.playlists.forEach((playlist, index) => {
    const li = document.createElement("li");
    const playlistName = document.createElement("span");
    playlistName.textContent = playlist.name;
    playlistName.className = "playlist-name";
    
    const songCount = document.createElement("span");
    songCount.textContent = `${playlist.songs.length} música${playlist.songs.length !== 1 ? 's' : ''}`;
    songCount.className = "song-count";
    
    li.appendChild(playlistName);
    li.appendChild(songCount);
    
    li.addEventListener('click', () => {
      showPlaylistSongs(index);
    });
    
    li.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      
      if (currentSong) {
        addSongToPlaylist(currentSong, index);
      }
    });
    
    playlistList.appendChild(li);
  });
}

function showPlaylistSongs(playlistIndex) {
  const users = getUsers();
  const username = getCurrentUser();
  if (!username) return;
  
  const user = users[username];
  const playlist = user.playlists[playlistIndex];
  
  songListContainer.innerHTML = `
    <div class="playlist-header">
      <h3>${playlist.name}</h3>
      <p class="instruction-text">${playlist.songs.length > 0 ? 'Clique em uma música para tocar' : 'Nenhuma música adicionada'}</p>
    </div>
  `;
  
  if (playlist.songs.length > 0) {
    const songsContainer = document.createElement('div');
    songsContainer.className = 'song-list';
    
    playlist.songs.forEach((songName) => {
      const songItem = document.createElement('div');
      songItem.className = 'song-item';
      songItem.textContent = songName;
      songItem.addEventListener('click', () => {
        tocarMusica(songName);
        musicSearchInput.value = songName;
      });
      songsContainer.appendChild(songItem);
    });
    
    songListContainer.appendChild(songsContainer);
  }
  
  availableSongsList.classList.add('show');
}

createPlaylistBtn.addEventListener('click', () => {
  const playlistName = prompt('Digite o nome da nova playlist:');
  if (playlistName && playlistName.trim() !== '') {
    createNewPlaylist(playlistName.trim());
  }
});

function createNewPlaylist(name) {
  const users = getUsers();
  const username = getCurrentUser();
  if (!username) return;
  
  const user = users[username];
  
  if (user.playlists.some(pl => pl.name === name)) {
    return;
  }
  
  user.playlists.push({
    name: name,
    songs: []
  });
  
  saveUsers(users);
  
  updatePlaylistList();
}

function addSongToPlaylist(songName, playlistIndex) {
  const users = getUsers();
  const username = getCurrentUser();
  if (!username) return;
  
  const user = users[username];
  
  if (user.playlists[playlistIndex].songs.includes(songName)) {
    return;
  }
  
  user.playlists[playlistIndex].songs.push(songName);
  
  saveUsers(users);
  
  // Atualizar a interface
  updatePlaylistList();
}

showRegister.addEventListener("click", () => {
  loginScreen.classList.add("hidden");
  registerScreen.classList.remove("hidden");
  clearMessages();
});

showLogin.addEventListener("click", () => {
  registerScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  clearMessages();
});

registerBtn.addEventListener("click", () => {
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  const users = getUsers();

  if (!username || !password) {
    registerMessage.textContent = "Preencha todos os campos.";
    return;
  }

  if (/\s/.test(username)) {
    registerMessage.textContent = "Usuário não pode conter espaços.";
    return;
  }

  if (users[username]) {
    registerMessage.textContent = "Usuário já existe.";
    return;
  }

  users[username] = {
    password,
    playlists: []
  };

  saveUsers(users);
  registerMessage.textContent = "Conta criada com sucesso!";
  setTimeout(() => {
    document.getElementById("regUsername").value = "";
    document.getElementById("regPassword").value = "";
    registerScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    registerMessage.textContent = "";
  }, 1000);
});

loginBtn.addEventListener("click", () => {
  const username = document.getElementById("usernameInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();

  const users = getUsers();

  if (!users[username]) {
    loginMessage.textContent = "Usuário não encontrado.";
    return;
  }

  if (users[username].password !== password) {
    loginMessage.textContent = "Senha incorreta.";
    return;
  }

  setCurrentUser(username);
  showApp();
});

function showApp() {
  const username = getCurrentUser();
  if (!username) return;

  loginScreen.classList.add("hidden");
  registerScreen.classList.add("hidden");
  app.classList.remove("hidden");

  userNameDisplay.textContent = username;
  updatePlaylistList();
  clearInputs();
  
  // Inicializar estado do botão de adicionar à playlist
  if (!currentSong) {
    addToPlaylistBtn.style.display = "none";
  }
  
  initializePlaylist();
}

logoutBtn.addEventListener("click", logout);

function clearInputs() {
  document.getElementById("usernameInput").value = "";
  document.getElementById("passwordInput").value = "";
}

function clearMessages() {
  loginMessage.textContent = "";
  registerMessage.textContent = "";
}

function toggleTheme() {
  const htmlElement = document.documentElement;
  const currentTheme = htmlElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  htmlElement.setAttribute('data-theme', newTheme);
  
  const themeIcon = themeToggle.querySelector('.material-icons');
  themeIcon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
  
  localStorage.setItem('theme', newTheme);
}

themeToggle.addEventListener('click', toggleTheme);

window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = themeToggle.querySelector('.material-icons');
    themeIcon.textContent = savedTheme === 'dark' ? 'light_mode' : 'dark_mode';
  }
  
  const user = getCurrentUser();
  if (user) showApp();
});

// Adicionar ao final do arquivo, antes do window.addEventListener
addToPlaylistBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  
  if (!currentSong) {
    return;
  }
  
  playlistDropdown.classList.toggle('show');
  updatePlaylistDropdown();
});

function updatePlaylistDropdown() {
  const users = getUsers();
  const username = getCurrentUser();
  if (!username) return;
  
  const user = users[username];
  playlistDropdownItems.innerHTML = '';
  
  user.playlists.forEach((playlist, index) => {
    const playlistItem = document.createElement('div');
    playlistItem.className = 'playlistDropdownItem';
    
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = 'playlist_add';
    
    const text = document.createElement('span');
    text.textContent = playlist.name;
    
    playlistItem.appendChild(icon);
    playlistItem.appendChild(text);
    
    // Verificar se a música já está na playlist
    const songAlreadyInPlaylist = playlist.songs.includes(currentSong);
    if (songAlreadyInPlaylist) {
      icon.textContent = 'playlist_add_check';
    }
    
    playlistItem.addEventListener('click', () => {
      addSongToPlaylist(currentSong, index);
      playlistDropdown.classList.remove('show');
    });
    
    playlistDropdownItems.appendChild(playlistItem);
  });
}

// Fechar o dropdown ao clicar fora dele
document.addEventListener('click', (e) => {
  if (playlistDropdown.classList.contains('show') && 
      !playlistDropdown.contains(e.target) && 
      e.target !== addToPlaylistBtn) {
    playlistDropdown.classList.remove('show');
  }
});