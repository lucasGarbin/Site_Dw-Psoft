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
let youtubeAPIReady = false;

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

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api'; 
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
}

window.onYouTubeIframeAPIReady = function() {
  console.log('YouTube API ready');
  youtubeAPIReady = true;
};

async function searchMusic(query) {
  try {
    const apiKey = 'AIzaSyBaSnmFK5KdN-BxVrcBHjqFdFRq5q4mm0w';
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`);
    const data = await response.json();

    if (data.error) {
        console.error('Erro da API do YouTube:', data.error.message);
        showErrorMessage(`Erro da API: ${data.error.message}. Verifique sua chave ou limites de uso.`, true);
        return [];
    }

    return data.items.map(item => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      thumbnail: item.snippet.thumbnails.default.url
    }));
  } catch (error) {
    console.error('Erro ao buscar músicas:', error);
    showErrorMessage('Erro ao buscar músicas. Verifique sua conexão ou a chave da API.', true);
    return [];
  }
}

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

async function showAvailableSongsFromSearch() {
  const searchQuery = musicSearchInput.value.trim();
  if (!searchQuery) {
    showPlayerMessage("Digite algo para buscar", true);
    return;
  }

  availableSongsList.innerHTML = '<div class="loading">Buscando músicas...</div>';
  availableSongsList.classList.add('show');
  songListContainer.innerHTML = '';

  try {
    const songs = await searchMusic(searchQuery);

    if (songs.length === 0) {
      availableSongsList.innerHTML = '<p class="instruction-text">Nenhuma música encontrada</p>';
      return;
    }

    const searchResultsContainer = document.createElement('div');
    searchResultsContainer.innerHTML = `
      <h3>Resultados da busca</h3>
      <p class="instruction-text">Clique em uma música para reproduzir ou adicione a uma playlist</p>
    `;
    const songListDiv = document.createElement('div');
    songListDiv.className = 'song-list';

    songs.forEach(song => {
      const songItem = document.createElement('div');
      songItem.className = 'song-item';
      songItem.dataset.videoId = song.videoId;
      songItem.dataset.title = song.title;

      songItem.innerHTML = `
        <img src="${song.thumbnail}" alt="${song.title}" style="width: 120px; height: 90px; object-fit: cover; margin-bottom: 8px;">
        <div>${song.title}</div>
      `;

      songItem.addEventListener('click', () => {
        tocarMusica({ name: song.title, videoId: song.videoId });
      });

      songItem.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        currentSong = { name: song.title, videoId: song.videoId };
        addToPlaylistBtn.style.display = "flex";
        playlistDropdown.classList.add('show');
        updatePlaylistDropdown();
      });

      songListDiv.appendChild(songItem);
    });

    searchResultsContainer.appendChild(songListDiv);
    availableSongsList.innerHTML = '';
    availableSongsList.appendChild(searchResultsContainer);

  } catch (error) {
    console.error('Erro ao mostrar músicas:', error);
    availableSongsList.innerHTML = '<p class="instruction-text">Erro ao buscar músicas</p>';
  }
}

function tocarMusica(songDetails) {
  if (!songDetails || !songDetails.videoId || !songDetails.name) {
    showErrorMessage('Detalhes da música incompletos para reprodução.');
    return;
  }

  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }

  isYoutubeVideo = true;
  isPlaying = true;
  currentSong = songDetails;
  currentSongTitle.textContent = songDetails.name;

  addToPlaylistBtn.style.display = "flex";

  document.querySelectorAll('.song-item').forEach(item => {
    item.classList.remove('playing');
    if (item.dataset.videoId === songDetails.videoId) {
      item.classList.add('playing');
    }
  });

  updatePlayPauseButton();

  createYoutubeContainer();

  if (youtubeAPIReady && window.YT && window.YT.Player) {
    if (ytPlayer) {
      ytPlayer.destroy();
    }

    youtubeContainer.style.display = 'block';

    ytPlayer = new YT.Player('youtubePlayer', {
      height: '100%',
      width: '100%',
      videoId: songDetails.videoId,
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
    showErrorMessage('Carregando player do YouTube... Tente novamente em instantes.');
  }
}

function onYoutubePlayerReady(event) {
  event.target.playVideo();
  ytPlayer.setVolume(volumeSlider.value);

  stopPlayerInterval();
  playerInterval = setInterval(() => {
    if (ytPlayer && ytPlayer.getCurrentTime) {
      const currentTime = ytPlayer.getCurrentTime();
      const duration = ytPlayer.getDuration();

      if (isNaN(duration) || duration <= 0) {
        progressBarFill.style.width = "0%";
        currentTimeDisplay.textContent = "0:00";
        durationDisplay.textContent = "0:00";
        return;
      }

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
  if (event.data === YT.PlayerState.ENDED) {
    onSongEnd();
  }
  if (event.data === YT.PlayerState.PAUSED) {
    isPlaying = false;
    updatePlayPauseButton();
    stopPlayerInterval();
  }
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    updatePlayPauseButton();
    if (!playerInterval) {
      onYoutubePlayerReady({ target: ytPlayer });
    }
  }
}

function updateProgress() {
  if (!audioElement || audioElement.readyState < 2) return;

  try {
    const currentTime = audioElement.currentTime || 0;
    const duration = audioElement.duration || 0;

    if (isNaN(duration) || duration === 0) return;

    const percent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

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
  if (isYoutubeVideo && ytPlayer && ytPlayer.getDuration) {
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
    audioElement.src = "";
  }

  if (ytPlayer) {
    ytPlayer.stopVideo();
  }

  isPlaying = false;
  updatePlayPauseButton();
  progressBarFill.style.width = "0%";
  currentTimeDisplay.textContent = "0:00";
  durationDisplay.textContent = "0:00";
  currentSongTitle.textContent = "Selecione uma música";
  currentSong = null;
  addToPlaylistBtn.style.display = "none";
}

function updatePlayPauseButton() {
  const icon = playPauseBtn.querySelector(".material-icons");
  icon.textContent = isPlaying ? "pause" : "play_arrow";
}

function playNextSong() {
  if (currentPlaylist.length === 0) {
    showPlayerMessage("A playlist está vazia.", true);
    resetPlayer();
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
    showPlayerMessage("A playlist está vazia.", true);
    resetPlayer();
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
  if (!currentSong) {
    if (currentPlaylist.length > 0) {
      currentPlaylistIndex = 0;
      tocarMusica(currentPlaylist[currentPlaylistIndex]);
    } else {
      showPlayerMessage("Nenhuma música selecionada. Busque por uma música primeiro.", true);
    }
    return;
  }

  if (!isPlaying) {
    if (isYoutubeVideo && ytPlayer) {
      ytPlayer.playVideo();
    } else if (audioElement) {
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Erro ao retomar reprodução:', error);
          showErrorMessage('Erro ao reproduzir a música. Tente novamente.');
        });
      }
    }
    isPlaying = true;
    updatePlayPauseButton();
  } else {
    if (isYoutubeVideo && ytPlayer) {
      ytPlayer.pauseVideo();
    } else if (audioElement) {
      audioElement.pause();
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
  showPlayerMessage(`Modo aleatório: ${isShuffle ? 'ATIVADO' : 'DESATIVADO'}`, false);
});

repeatBtn.addEventListener('click', () => {
  isRepeat = !isRepeat;
  repeatBtn.style.color = isRepeat ? "#1DB954" : "#aaa";
  showPlayerMessage(`Repetir: ${isRepeat ? 'ATIVADO' : 'DESATIVADO'}`, false);
});

volumeSlider.addEventListener('input', (e) => {
  const volume = e.target.value;
  e.target.style.background = `linear-gradient(to right, #1DB954 0%, #1DB954 ${volume}%, #535353 ${volume}%, #535353 100%)`;

  if (audioElement) {
    audioElement.volume = volume / 100;
  }

  if (ytPlayer && ytPlayer.setVolume) {
    ytPlayer.setVolume(parseInt(volume));
  }
});

progressBar.addEventListener('click', (e) => {
  if (!currentSong) return;

  const rect = progressBar.getBoundingClientRect();
  const clickPosition = e.clientX - rect.left;
  const percent = clickPosition / rect.width;

  if (percent < 0 || percent > 1) return;

  progressBarFill.style.width = (percent * 100) + "%";

  if (isYoutubeVideo && ytPlayer) {
    const duration = ytPlayer.getDuration();
    if (isNaN(duration) || duration <= 0) return;
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
}

//espero que nao seja feio fazer isso, amem!
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
  setTimeout(() => {
    playerMessage.innerHTML = '';
  }, 3000);
}

function mostrarListaDeMusicasDisponiveis() {
  songListContainer.innerHTML = '<p class="instruction-text">Use a busca para encontrar músicas ou selecione uma playlist.</p>';
  availableSongsList.classList.add('show');
}

showAvailableSongsBtn.addEventListener('click', () => {
  if (!musicSearchInput.value.trim()) {
    mostrarListaDeMusicasDisponiveis();
  } else {
    showAvailableSongsFromSearch();
  }
});

searchMusicBtn.addEventListener('click', () => {
  showAvailableSongsFromSearch();
});

musicSearchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    showAvailableSongsFromSearch();
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

  if (user.playlists && Array.isArray(user.playlists) && user.playlists.length > 0 && typeof user.playlists[0] === 'string') {
    const oldPlaylists = [...user.playlists];
    user.playlists = oldPlaylists.map(name => ({ name, songs: [] }));
    saveUsers(users);
  }

  if (!user.playlists || !Array.isArray(user.playlists) || user.playlists.length === 0) {
    user.playlists = [{ name: 'Favoritas', songs: [] }];
    saveUsers(users);
  }

  playlistList.innerHTML = "";

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
      currentPlaylist = playlist.songs;
      currentPlaylistIndex = 0;
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

    playlist.songs.forEach((songDetails, index) => {
      const songItem = document.createElement('div');
      songItem.className = 'song-item';
      songItem.textContent = songDetails.name;

      songItem.dataset.videoId = songDetails.videoId;

      songItem.addEventListener('click', () => {
        tocarMusica(songDetails);
        musicSearchInput.value = songDetails.name;
        currentPlaylist = playlist.songs;
        currentPlaylistIndex = index;
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

  if (user.playlists.some(pl => pl.name.toLowerCase() === name.toLowerCase())) {
    showErrorMessage(`Playlist "${name}" já existe.`, true);
    return;
  }

  user.playlists.push({
    name: name,
    songs: []
  });

  saveUsers(users);
  showErrorMessage(`Playlist "${name}" criada com sucesso!`, false);
  updatePlaylistList();
}

function addSongToPlaylist(songDetails, playlistIndex) {
  const users = getUsers();
  const username = getCurrentUser();
  if (!username) return;

  const user = users[username];
  const playlist = user.playlists[playlistIndex];

  if (playlist.songs.some(s => s.videoId === songDetails.videoId)) {
    showPlayerMessage(`"${songDetails.name}" já está na playlist "${playlist.name}".`, true);
    return;
  }

  playlist.songs.push(songDetails);
  saveUsers(users);
  showPlayerMessage(`"${songDetails.name}" adicionada à playlist "${playlist.name}"!`, false);
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

  if (!currentSong) {
    addToPlaylistBtn.style.display = "none";
  }
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

  createYoutubeContainer();
});

addToPlaylistBtn.addEventListener('click', (e) => {
  e.stopPropagation();

  if (!currentSong) {
    showPlayerMessage("Selecione uma música primeiro para adicionar à playlist.", true);
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

  if (!user.playlists || user.playlists.length === 0) {
    playlistDropdownItems.innerHTML = '<div class="playlistDropdownItem disabled">Nenhuma playlist criada.</div>';
    return;
  }

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

    const songAlreadyInPlaylist = currentSong && playlist.songs.some(s => s.videoId === currentSong.videoId);
    if (songAlreadyInPlaylist) {
      icon.textContent = 'playlist_add_check';
    }

    playlistItem.addEventListener('click', () => {
      if (currentSong) {
        addSongToPlaylist(currentSong, index);
      }
      playlistDropdown.classList.remove('show');
    });

    playlistDropdownItems.appendChild(playlistItem);
  });
}

document.addEventListener('click', (e) => {
  if (playlistDropdown.classList.contains('show') &&
    !playlistDropdown.contains(e.target) &&
    e.target !== addToPlaylistBtn) {
    playlistDropdown.classList.remove('show');
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const createPlaylistBtn = document.getElementById("createPlaylistBtn");

  createPlaylistBtn.addEventListener("click", () => {
    const playlistName = prompt("Digite o nome da nova playlist:");
    if (playlistName && playlistName.trim() !== "") {
      adicionarPlaylist(playlistName.trim());
    }
  });
});

function adicionarPlaylist(nome) {
  const playlistList = document.getElementById("playlistList");

  const novaLi = document.createElement("li");
  novaLi.textContent = nome;

  const contador = document.createElement("span");
  contador.className = "song-count";
  contador.textContent = "0 músicas";

  novaLi.appendChild(contador);
  playlistList.appendChild(novaLi);
}
