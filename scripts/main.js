// scripts/main.js
// GSAP is loaded via script tags in HTML, so we access it from window
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

gsap.registerPlugin(ScrollTrigger);


/* ============================================
   BACKGROUND AUDIO CONTROL
   ============================================ */

const bgAudio = document.getElementById('bg-audio');
const memoryAudio = document.getElementById('memory-audio');
const panelAudio = document.getElementById('panel-audio');

let audioFadeInterval;
let memoryFadeInterval;
const FADE_DURATION = 1500; // 1.5 second fade
const FADE_STEPS = 60; // Number of volume steps
const MAX_VOLUME = 0.3; // Maximum volume (30%)
const MEMORY_MAX_VOLUME = 0.25; // Maximum volume for memory audio
let audioStarted = false;
let currentMemorySection = null;

// Function to start audio
function startAudio() {
  if (audioStarted) return;
  
  bgAudio.volume = 0;
  bgAudio.play().then(() => {
    audioStarted = true;
    fadeAudioIn();
  }).catch(err => {
    // Silent fail - audio will try again on next interaction
  });
}

// Start audio on ANY user interaction
const startOnInteraction = () => {
  startAudio();
  // Remove listeners after first successful start
  if (audioStarted) {
    document.removeEventListener('click', startOnInteraction);
    document.removeEventListener('scroll', startOnInteraction);
    document.removeEventListener('touchstart', startOnInteraction);
    document.removeEventListener('keydown', startOnInteraction);
  }
};

// Listen for any user interaction
document.addEventListener('click', startOnInteraction);
document.addEventListener('scroll', startOnInteraction, { passive: true });
document.addEventListener('touchstart', startOnInteraction, { passive: true });
document.addEventListener('keydown', startOnInteraction);

// Fade audio in
function fadeAudioIn() {
  clearInterval(audioFadeInterval);
  const stepTime = FADE_DURATION / FADE_STEPS;
  const volumeStep = MAX_VOLUME / FADE_STEPS;
  let currentStep = Math.floor(bgAudio.volume / volumeStep);

  audioFadeInterval = setInterval(() => {
    currentStep++;
    bgAudio.volume = Math.min(currentStep * volumeStep, MAX_VOLUME);
    
    if (bgAudio.volume >= MAX_VOLUME) {
      clearInterval(audioFadeInterval);
    }
  }, stepTime);
}

// Fade audio out
function fadeAudioOut() {
  clearInterval(audioFadeInterval);
  const stepTime = FADE_DURATION / FADE_STEPS;
  const volumeStep = MAX_VOLUME / FADE_STEPS;
  let currentStep = Math.floor(bgAudio.volume / volumeStep);

  audioFadeInterval = setInterval(() => {
    currentStep--;
    bgAudio.volume = Math.max(currentStep * volumeStep, 0);
    
    if (bgAudio.volume <= 0) {
      clearInterval(audioFadeInterval);
    }
  }, stepTime);
}


/* ============================================
   MEMORY AUDIO CONTROL
   ============================================ */

// Fade memory audio in
function fadeMemoryAudioIn(audioSrc) {
  // If it's the same audio, just ensure it's playing
  if (memoryAudio.src.includes(audioSrc) && !memoryAudio.paused) {
    return;
  }
  
  // Clear any existing fade
  clearInterval(memoryFadeInterval);
  
  // Set new source if different
  if (!memoryAudio.src.includes(audioSrc)) {
    memoryAudio.src = audioSrc;
    memoryAudio.volume = 0;
  }
  
  // Start playing
  memoryAudio.play().catch(err => console.log('Memory audio play failed:', err));
  
  // Fade in
  const stepTime = FADE_DURATION / FADE_STEPS;
  const volumeStep = MEMORY_MAX_VOLUME / FADE_STEPS;
  let currentStep = Math.floor(memoryAudio.volume / volumeStep);

  memoryFadeInterval = setInterval(() => {
    currentStep++;
    memoryAudio.volume = Math.min(currentStep * volumeStep, MEMORY_MAX_VOLUME);
    
    if (memoryAudio.volume >= MEMORY_MAX_VOLUME) {
      clearInterval(memoryFadeInterval);
    }
  }, stepTime);
}

// Fade memory audio out
function fadeMemoryAudioOut() {
  clearInterval(memoryFadeInterval);
  
  if (memoryAudio.paused) return;
  
  const stepTime = FADE_DURATION / FADE_STEPS;
  const volumeStep = MEMORY_MAX_VOLUME / FADE_STEPS;
  let currentStep = Math.floor(memoryAudio.volume / volumeStep);

  memoryFadeInterval = setInterval(() => {
    currentStep--;
    memoryAudio.volume = Math.max(currentStep * volumeStep, 0);
    
    if (memoryAudio.volume <= 0) {
      clearInterval(memoryFadeInterval);
      memoryAudio.pause();
      currentMemorySection = null;
    }
  }, stepTime);
}

// Setup memory section audio triggers
document.querySelectorAll('.memory').forEach(section => {
  const memoryAudioSrc = section.dataset.memoryAudio;
  
  if (memoryAudioSrc) {
    ScrollTrigger.create({
      trigger: section,
      start: "top 80%",
      end: "bottom 20%",
      onEnter: () => {
        currentMemorySection = section;
        fadeMemoryAudioIn(memoryAudioSrc);
      },
      onLeave: () => {
        if (currentMemorySection === section) {
          fadeMemoryAudioOut();
        }
      },
      onEnterBack: () => {
        currentMemorySection = section;
        fadeMemoryAudioIn(memoryAudioSrc);
      },
      onLeaveBack: () => {
        if (currentMemorySection === section) {
          fadeMemoryAudioOut();
        }
      }
    });
  }
});


/* ============================================
   PANEL HOVER AUDIO CONTROL
   ============================================ */

// Setup panel hover audio
document.querySelectorAll('.panel').forEach(panel => {
  const panelAudioSrc = panel.dataset.panelAudio;
  
  if (panelAudioSrc) {
    let isPlaying = false;
    
    panel.addEventListener('mouseenter', () => {
      // Stop any currently playing panel audio
      panelAudio.pause();
      panelAudio.currentTime = 0;
      
      // Set and play new audio
      panelAudio.src = panelAudioSrc;
      panelAudio.volume = 0.5; // Set volume for panel audio
      isPlaying = true;
      
      panelAudio.play().catch(err => {
        console.log('Panel audio play failed:', err);
        isPlaying = false;
      });
      
      // Track when audio ends naturally
      panelAudio.onended = () => {
        isPlaying = false;
      };
    });
    
    panel.addEventListener('mouseleave', () => {
      // Stop audio when mouse leaves
      if (isPlaying) {
        panelAudio.pause();
        panelAudio.currentTime = 0;
        isPlaying = false;
      }
    });
    
    // Handle touch devices
    panel.addEventListener('touchstart', () => {
      // Stop any currently playing panel audio
      panelAudio.pause();
      panelAudio.currentTime = 0;
      
      // Set and play new audio
      panelAudio.src = panelAudioSrc;
      panelAudio.volume = 0.5;
      
      panelAudio.play().catch(err => {
        console.log('Panel audio play failed:', err);
      });
    });
  }
});


// Monitor scroll position to control background audio
window.addEventListener('scroll', () => {
  if (!audioStarted) return;
  
  const landingHeight = document.querySelector('.landing').offsetHeight;
  const scrollPos = window.scrollY;
  
  // Fade based on scroll position
  if (scrollPos < landingHeight * 0.3) {
    // Still on landing page - fade in
    if (bgAudio.volume < MAX_VOLUME) {
      fadeAudioIn();
    }
  } else {
    // Scrolled past landing - fade out
    if (bgAudio.volume > 0) {
      fadeAudioOut();
    }
  }
});


/* ============================================
   PANEL REVEAL ANIMATION
   ============================================ */

gsap.utils.toArray('.memory').forEach(section => {
  const panels = section.querySelectorAll('.panel');

  gsap.fromTo(panels,
    {
      opacity: 0,
      y: 120,
      scale: 1
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.2,
      ease: "power4.out",
      stagger: 0.2,
      scrollTrigger: {
        trigger: section,
        start: "top 75%",
        toggleActions: "play none none none"
      }
    }
  );
});


/* ============================================
   GALLERY REVEAL ANIMATION
   ============================================ */

gsap.utils.toArray('.gallery').forEach(gallery => {
  const items = gallery.querySelectorAll('.gallery-item');

  gsap.fromTo(items,
    {
      opacity: 0,
      y: 120,
      scale: 1
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.2,
      ease: "power4.out",
      stagger: 0.2,
      scrollTrigger: {
        trigger: gallery,
        start: "top 75%",
        toggleActions: "play none none none"
      }
    }
  );
});


/* ============================================
   HORIZONTAL SCROLL WITH WHEEL + SNAP
   ============================================ */

const panels = document.querySelectorAll('.panels');

panels.forEach(panel => {
  let isHovering = false;
  let scrollTimeout;

  // Track hover state
  panel.addEventListener('mouseenter', () => (isHovering = true));
  panel.addEventListener('mouseleave', () => (isHovering = false));

  // Enable horizontal scroll with vertical wheel
  panel.addEventListener('wheel', (e) => {
    if (!isHovering) return;
    e.preventDefault();
    panel.scrollLeft += e.deltaY;
  }, { passive: false });

  // Snap to nearest panel after scrolling stops
  panel.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(() => {
      const items = panel.querySelectorAll('.panel');
      const scrollLeft = panel.scrollLeft;
      const center = panel.offsetWidth / 2;

      let closest = null;
      let closestDist = Infinity;

      // Find the closest panel to center
      items.forEach(item => {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        const dist = Math.abs((scrollLeft + center) - itemCenter);
        
        if (dist < closestDist) {
          closest = item;
          closestDist = dist;
        }
      });

      // Scroll to center the closest panel
      if (closest) {
        panel.scrollTo({
          left: closest.offsetLeft - (panel.offsetWidth / 2 - closest.offsetWidth / 2),
          behavior: 'smooth'
        });
      }
    }, 200);
  });
});


/* ============================================
   LIGHTBOX FUNCTIONALITY
   ============================================ */

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxVideo = document.getElementById('lightbox-video');
const closeBtn = document.querySelector('.lightbox-close');
const prevBtn = document.querySelector('.lightbox-prev');
const nextBtn = document.querySelector('.lightbox-next');

let currentGalleryItems = [];
let currentIndex = 0;

// Open lightbox
function openLightbox(items, index) {
  currentGalleryItems = items;
  currentIndex = index;
  showMedia(currentIndex);
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close lightbox
function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  
  // Stop any playing video
  if (lightboxVideo.src) {
    lightboxVideo.pause();
    lightboxVideo.currentTime = 0;
  }
}

// Show media at index
function showMedia(index) {
  const item = currentGalleryItems[index];
  const type = item.dataset.type;
  const src = item.dataset.src;

  // Hide both media elements
  lightboxImg.style.display = 'none';
  lightboxVideo.style.display = 'none';

  // Show the appropriate one
  if (type === 'image') {
    lightboxImg.src = src;
    lightboxImg.style.display = 'block';
  } else if (type === 'video') {
    lightboxVideo.src = src;
    lightboxVideo.style.display = 'block';
    lightboxVideo.load();
  }

  // Update navigation buttons
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === currentGalleryItems.length - 1;
}

// Navigate to previous
function showPrevious() {
  if (currentIndex > 0) {
    currentIndex--;
    showMedia(currentIndex);
  }
}

// Navigate to next
function showNext() {
  if (currentIndex < currentGalleryItems.length - 1) {
    currentIndex++;
    showMedia(currentIndex);
  }
}

// Attach click listeners to all gallery items
document.querySelectorAll('.gallery').forEach(gallery => {
  const items = Array.from(gallery.querySelectorAll('.gallery-item'));
  
  items.forEach((item, index) => {
    item.addEventListener('click', () => {
      openLightbox(items, index);
    });
  });
});

// Close button
closeBtn.addEventListener('click', closeLightbox);

// Navigation buttons
prevBtn.addEventListener('click', showPrevious);
nextBtn.addEventListener('click', showNext);

// Close on background click
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    closeLightbox();
  }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  
  if (e.key === 'Escape') {
    closeLightbox();
  } else if (e.key === 'ArrowLeft') {
    showPrevious();
  } else if (e.key === 'ArrowRight') {
    showNext();
  }
});