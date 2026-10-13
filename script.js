
document.addEventListener("DOMContentLoaded", () => {

  // ==========================================
  // BACKGROUND VIDEO + CD SWITCHING + SOUND
  // ==========================================

  const video = document.getElementById("bg-video");
  const cds = document.querySelectorAll(".cd-item");

  if (video) {
    video.volume = 0.6;
    video.muted = false;

    // Create speaker button if it doesn't exist
    let soundButton = document.getElementById("video-sound-toggle");

    if (!soundButton) {
      soundButton = document.createElement("button");
      soundButton.id = "video-sound-toggle";
      soundButton.type = "button";
      document.body.appendChild(soundButton);
    }

    soundButton.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20"
        fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 5 6 9H3v6h3l5 4V5Z"></path>
        <path class="sound-wave" d="M15.5 8.5a5 5 0 0 1 0 7"></path>
        <path class="sound-wave" d="M18.5 5.5a9 9 0 0 1 0 13"></path>
      </svg>
    `;

    Object.assign(soundButton.style, {
      position: "fixed",
      top: "28px",
      left: "28px",
      right: "auto",
      zIndex: "99999",
      width: "26px",
      height: "26px",
      padding: "0",
      margin: "0",
      display: "grid",
      placeItems: "center",
      border: "none",
      outline: "none",
      boxShadow: "none",
      borderRadius: "0",
      background: "transparent",
      color: "rgba(255,255,255,0.85)",
      cursor: "pointer",
      appearance: "none",
      WebkitAppearance: "none"
    });

    function updateSoundButton() {
      const waves = soundButton.querySelectorAll(".sound-wave");

      soundButton.setAttribute(
        "aria-label",
        video.muted ? "Turn sound on" : "Turn sound off"
      );

      soundButton.title = video.muted
        ? "Turn sound on"
        : "Turn sound off";

      soundButton.style.opacity = video.muted ? "0.65" : "1";

      waves.forEach((wave) => {
        wave.style.display = video.muted ? "none" : "block";
      });
    }

    // Speaker button toggles sound ON/OFF
    soundButton.addEventListener("click", async (event) => {
      event.stopPropagation();

      video.volume = 0.6;
      video.muted = !video.muted;

      try {
        if (video.paused) {
          await video.play();
        }
      } catch (error) {
        console.warn("Video playback failed:", error);
      }

      updateSoundButton();
    });

    // Switch background video when a CD is clicked
    cds.forEach((cd) => {
      cd.addEventListener("click", async () => {
        const source = cd.dataset.video;
        if (!source) return;

        cds.forEach((item) => {
          item.classList.remove("active");
        });

        cd.classList.add("active");

        const wasMuted = video.muted;

        video.src = source;
        video.load();
        video.volume = 0.6;
        video.muted = wasMuted;

        try {
          await video.play();
        } catch (error) {
          console.warn("Could not play background video:", error);
        }

        updateSoundButton();
      });
    });

    // Attempt autoplay WITH sound at 60% volume
    async function startBackgroundVideo() {
      video.volume = 0.6;
      video.muted = false;

      try {
        await video.play();
      } catch (error) {
        // Browser may block autoplay with sound.
        // Keep the video playing silently as a fallback.
        video.muted = true;

        try {
          await video.play();
        } catch (playError) {
          console.warn("Background autoplay blocked:", playError);
        }
      }

      updateSoundButton();
    }

    startBackgroundVideo();
    updateSoundButton();
  }


  // ==========================================
  // MUSIC PLAYER CONTROLS
  // ==========================================

  const audio = document.getElementById("audio");
  const playButton = document.getElementById("play");
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const progress = document.getElementById("progress");
  const currentTimeLabel = document.getElementById("current-time");
  const durationLabel = document.getElementById("duration");

  if (audio) {
    // Set separate music player volume to 60%
    audio.volume = 0.6;

    // Play / pause
    if (playButton) {
      playButton.addEventListener("click", async () => {
        if (audio.paused) {
          try {
            await audio.play();
          } catch (error) {
            console.warn("Music playback failed:", error);
          }
        } else {
          audio.pause();
        }
      });
    }

    // Previous button: restart current track
    if (prevButton) {
      prevButton.addEventListener("click", async () => {
        audio.currentTime = 0;

        try {
          await audio.play();
        } catch (error) {
          console.warn("Could not restart music:", error);
        }
      });
    }

    // Next button: restart current track
    if (nextButton) {
      nextButton.addEventListener("click", async () => {
        audio.currentTime = 0;

        try {
          await audio.play();
        } catch (error) {
          console.warn("Could not restart music:", error);
        }
      });
    }

    // Format seconds as M:SS
    function formatTime(seconds) {
      if (!Number.isFinite(seconds)) return "0:00";

      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);

      return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
    }

    // Update timestamps
    audio.addEventListener("loadedmetadata", () => {
      if (durationLabel) {
        durationLabel.textContent = formatTime(audio.duration);
      }
    });

    // Update progress bar and time
    audio.addEventListener("timeupdate", () => {
      if (currentTimeLabel) {
        currentTimeLabel.textContent = formatTime(audio.currentTime);
      }

      if (durationLabel) {
        durationLabel.textContent = formatTime(audio.duration);
      }

      if (
        progress &&
        Number.isFinite(audio.duration) &&
        audio.duration > 0
      ) {
        const percentage = (audio.currentTime / audio.duration) * 100;

        progress.value = percentage;
        progress.style.setProperty("--progress", `${percentage}%`);
      }
    });

    // Seek through the track
    if (progress) {
      progress.addEventListener("input", () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          audio.currentTime =
            (Number(progress.value) / 100) * audio.duration;
        }
      });
    }
  }


  // ==========================================
  // DRAGGABLE MUSIC PLAYER
  // ==========================================

  const player = document.querySelector(".music-player");

  if (player) {
    const dragHandle =
      player.querySelector(".player-header") ||
      player.querySelector(".music-player-header");

    if (dragHandle) {
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;

      dragHandle.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;

        // Don't start dragging from buttons or inputs
        if (event.target.closest("button, input, a")) return;

        const rect = player.getBoundingClientRect();

        dragging = true;
        startX = event.clientX;
        startY = event.clientY;
        startLeft = rect.left;
        startTop = rect.top;

        player.style.left = `${rect.left}px`;
        player.style.top = `${rect.top}px`;
        player.style.right = "auto";
        player.style.bottom = "auto";
        player.style.transform = "none";

        dragHandle.style.cursor = "grabbing";

        try {
          dragHandle.setPointerCapture(event.pointerId);
        } catch (error) {}
      });

      dragHandle.addEventListener("pointermove", (event) => {
        if (!dragging) return;

        const maxLeft = window.innerWidth - player.offsetWidth;
        const maxTop = window.innerHeight - player.offsetHeight;

        const newLeft = startLeft + event.clientX - startX;
        const newTop = startTop + event.clientY - startY;

        player.style.left =
          `${Math.max(0, Math.min(newLeft, maxLeft))}px`;

        player.style.top =
          `${Math.max(0, Math.min(newTop, maxTop))}px`;
      });

      function stopDragging() {
        dragging = false;
        dragHandle.style.cursor = "";
      }

      dragHandle.addEventListener("pointerup", stopDragging);
      dragHandle.addEventListener("pointercancel", stopDragging);
      dragHandle.addEventListener("lostpointercapture", stopDragging);
    }
  }


  // ==========================================
  // CINEMATIC MOUSE GLOW + SPARKLE TRAIL
  // ==========================================

  const sparkleLayer = document.getElementById("sparkle-layer");

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (sparkleLayer && !reduceMotion) {
    let lastSparkTime = 0;

    document.addEventListener("mousemove", (event) => {
      const x = event.clientX;
      const y = event.clientY;

      sparkleLayer.style.setProperty("--mouse-x", `${x}px`);
      sparkleLayer.style.setProperty("--mouse-y", `${y}px`);
      sparkleLayer.classList.add("mouse-glow-active");

      const now = performance.now();
      if (now - lastSparkTime < 28) return;

      lastSparkTime = now;

      const spark = document.createElement("span");
      spark.className = "mouse-spark";

      const size = Math.random() * 3 + 1.5;
      const driftX = (Math.random() - 0.5) * 28;
      const driftY = (Math.random() - 0.5) * 28;

      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;

      spark.style.setProperty("--spark-size", `${size}px`);
      spark.style.setProperty("--drift-x", `${driftX}px`);
      spark.style.setProperty("--drift-y", `${driftY}px`);

      sparkleLayer.appendChild(spark);

      setTimeout(() => {
        spark.remove();
      }, 650);
    });

    document.addEventListener("mouseout", (event) => {
      if (!event.relatedTarget) {
        sparkleLayer.classList.remove("mouse-glow-active");
      }
    });

    document.addEventListener("mouseenter", () => {
      sparkleLayer.classList.add("mouse-glow-active");
    });
  }

});

/* Literally Me - Real Visitor Counter */
(async function initVisitorCounter() {
 const SUPABASE_URL = "https://rbisknxhaaiweiblhnib.supabase.co";
const SUPABASE_KEY = "sb_publishable_1FtPiuyz2Mapv3vGsp9AKA_4I7Ysn8Z";

  const viewsEl = document.getElementById("total-views");
  const visitorsEl = document.getElementById("unique-visitors");

  if (!viewsEl || !visitorsEl) return;

  try {
    let visitorId = localStorage.getItem("literally_me_visitor_id");

    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("literally_me_visitor_id", visitorId);
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/track_visit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ p_visitor_id: visitorId })
      }
    );

    if (!response.ok) {
      throw new Error(`Counter error: ${response.status}`);
    }

    const data = await response.json();

    viewsEl.textContent = Number(data.total_views).toLocaleString("en-IN");
    visitorsEl.textContent = Number(data.unique_visitors).toLocaleString("en-IN");

  } catch (error) {
    console.error("Visitor counter error:", error);
  }
})();
