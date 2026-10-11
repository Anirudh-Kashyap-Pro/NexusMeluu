/**
 * NexusCare - macOS & iOS Classy Healthcare OS
 * Features:
 * 1. 3D Holographic Anatomy Model with Rotating Pedestal, Scanning Ring & Hotspots
 * 2. Left Telemetry Vitals (Blood Status, Animated ECG Heart Rate, Blood Sugar, Temperature Arc)
 * 3. Right Consulting Doctors Deck with Instant BookMyShow Theater Slot Booking
 * 4. Organ Floating Cards (Lungs, Brain, Heart)
 * 5. Floating iOS Health Assistant (Minor Triage, On-Call Doctor, Emergency 108)
 * 6. macOS Spotlight Search & View Switcher
 */

const appState = {
  currentView: 'anatomy', // 'anatomy', 'vacancies', 'partner', 'wellness'
  lang: 'en',
  bodyAngle: 'front', // 'front', 'back'
  bodyZoom: 1.0,
  
  // Patient Profile
  patient: {
    name: 'Ramesh Kumar',
    age: 54,
    gender: 'Male',
    condition: 'Cardiac Evaluation & Vitals Monitored',
    bloodStatus: '118/78',
    heartRate: 74,
    bloodSugar: 98,
    temperature: 36.6,
    oxygenLevel: 98,
    abhaId: '91-4820-1928-4011'
  },

  // Selected Booking
  selectedDoctor: 'Dr. Priya Nair',
  selectedDept: 'cardiology',
  selectedSeat: null,

  // Floating Chat State
  chatOpen: false
};

// ==========================================================================
// 1. Audio Synthesizer (Apple-style haptic tap and hospital chimes)
// ==========================================================================
class MacAudio {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  tap() {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }
  chime() {
    this.init();
    if (!this.ctx) return;
    try {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime + i * 0.14;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.07, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.5);
      });
    } catch (e) {}
  }
}
const macAudio = new MacAudio();

// ==========================================================================
// 2. Initialization & View Routing
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupSidebarNavigation();
  setup3DAnatomyStage();
  setupDoctorBookingDeck();
  setupBookMyShowCinemaSeats();
  setupFloatingChatbot();
  setupSpotlightSearch();
  setupBilingualToggle();

  // Render initial 3D model
  render3DAnatomyModel();
});

function setupSidebarNavigation() {
  document.querySelectorAll('.sidebar-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      macAudio.tap();
      const view = btn.dataset.view;
      if (view) switchMacView(view);
    });
  });
}

function switchMacView(viewId) {
  appState.currentView = viewId;

  // Update sidebar active state
  document.querySelectorAll('.sidebar-icon-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewId);
  });

  // Toggle views
  const allViews = ['anatomy-view', 'bms-view', 'partner-view', 'wellness-view'];
  allViews.forEach(id => document.getElementById(id)?.classList.add('hidden'));

  const target = document.getElementById(`${viewId}-view`);
  if (target) {
    target.classList.remove('hidden');
  }

  if (viewId === 'bms') {
    renderBookMyShowCinemaSeats();
  }
}

// ==========================================================================
// 3. 3D Holographic Anatomy Stage (Inspired by Reference Images 1 & 2)
// ==========================================================================
function setup3DAnatomyStage() {
  // Zoom In / Out controls (Like in Image 2)
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
    macAudio.tap();
    if (appState.bodyZoom < 1.4) {
      appState.bodyZoom += 0.15;
      update3DBodyTransform();
    }
  });

  document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
    macAudio.tap();
    if (appState.bodyZoom > 0.75) {
      appState.bodyZoom -= 0.15;
      update3DBodyTransform();
    }
  });

  // Angle toggle (Front / Back)
  document.getElementById('btn-toggle-angle')?.addEventListener('click', () => {
    macAudio.tap();
    appState.bodyAngle = appState.bodyAngle === 'front' ? 'back' : 'front';
    const btn = document.getElementById('btn-toggle-angle');
    if (btn) btn.textContent = appState.bodyAngle === 'front' ? 'Anterior (Front)' : 'Posterior (Back)';
    update3DBodyTransform();
    showToast(`3D Perspective: ${appState.bodyAngle.toUpperCase()} view`);
  });

  // Hotspot Pin Clicks (Images 1 & 2)
  document.querySelectorAll('.hologram-pin').forEach(pin => {
    pin.addEventListener('click', () => {
      macAudio.chime();
      const region = pin.dataset.region;
      inspectHotspotRegion(region);
    });
  });

  // Bottom Floating Organ Cards (Lungs, Brain, Heart from Image 1)
  document.querySelectorAll('.organ-floating-card').forEach(card => {
    card.addEventListener('click', () => {
      macAudio.chime();
      const organ = card.dataset.organ;
      inspectOrganTelemetry(organ);
    });
  });
}

function update3DBodyTransform() {
  const bodySvg = document.getElementById('svg-3d-hologram-body');
  if (!bodySvg) return;

  const rotateY = appState.bodyAngle === 'back' ? '180deg' : '0deg';
  bodySvg.style.transform = `scale(${appState.bodyZoom}) rotateY(${rotateY})`;
  bodySvg.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
}

function render3DAnatomyModel() {
  const container = document.getElementById('svg-3d-body-canvas-wrap');
  if (!container) return;

  // Holographic 3D human body vector with illuminated ceramic contours and inner skeletal glow
  container.innerHTML = `
    <svg id="svg-3d-hologram-body" width="100%" height="500" viewBox="0 0 280 500" style="filter: drop-shadow(0 15px 35px rgba(0, 199, 190, 0.18));">
      <defs>
        <!-- Hologram Metallic Shimmer -->
        <linearGradient id="holoShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
          <stop offset="40%" stop-color="#e0f8f6" stop-opacity="0.85"/>
          <stop offset="70%" stop-color="#bbf0ed" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#7dd3fc" stop-opacity="0.5"/>
        </linearGradient>
        <radialGradient id="spineGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#00c7be" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#007aff" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Central Skeletal / Spinal Column Holographic Ray -->
      <line x1="140" y1="70" x2="140" y2="280" stroke="#00c7be" stroke-width="3" stroke-dasharray="4 3" opacity="0.6"/>

      <!-- Head & Cranium -->
      <ellipse cx="140" cy="50" rx="26" ry="32" fill="url(#holoShine)" stroke="#00c7be" stroke-width="1.5"/>
      <!-- Eyes & Visor Contour -->
      <path d="M 124 48 Q 140 52 156 48" stroke="#007aff" stroke-width="2" fill="none" opacity="0.7"/>

      <!-- Neck -->
      <path d="M 130 80 L 130 96 L 150 96 L 150 80 Z" fill="url(#holoShine)" stroke="#00c7be" stroke-width="1.2"/>

      <!-- Torso & Clavicle (Ceramic Athletic Silhouette) -->
      <path d="M 100 102 C 120 95, 160 95, 180 102 L 195 180 C 180 230, 155 270, 140 275 C 125 270, 100 230, 85 180 Z" 
            fill="url(#holoShine)" stroke="#00c7be" stroke-width="1.8"/>

      <!-- Chest Ribcage Hologram Contours -->
      <path d="M 112 130 Q 140 142 168 130 M 115 152 Q 140 164 165 152 M 120 174 Q 140 184 160 174" 
            stroke="rgba(0, 199, 190, 0.55)" stroke-width="1.8" fill="none"/>

      <!-- Upper Limbs (Shoulders & Arms) -->
      <path d="M 98 104 L 65 190 L 50 280 L 62 284 L 78 200 L 98 125 Z" fill="url(#holoShine)" stroke="#00c7be" stroke-width="1.2"/>
      <path d="M 182 104 L 215 190 L 230 280 L 218 284 L 202 200 L 182 125 Z" fill="url(#holoShine)" stroke="#00c7be" stroke-width="1.2"/>

      <!-- Pelvis & Hip Joint -->
      <ellipse cx="140" cy="275" rx="34" ry="18" fill="url(#holoShine)" stroke="#00c7be" stroke-width="1.5"/>

      <!-- Lower Limbs (Legs & Knees) -->
      <path d="M 112 285 L 102 380 L 96 465 L 118 465 L 126 385 L 134 285 Z" fill="url(#holoShine)" stroke="#00c7be" stroke-width="1.4"/>
      <path d="M 168 285 L 178 380 L 184 465 L 162 465 L 154 385 L 146 285 Z" fill="url(#holoShine)" stroke="#00c7be" stroke-width="1.4"/>

      <!-- Glowing Knee Joint Rings -->
      <ellipse cx="114" cy="382" rx="10" ry="6" fill="none" stroke="#00c7be" stroke-width="2"/>
      <ellipse cx="166" cy="382" rx="10" ry="6" fill="none" stroke="#00c7be" stroke-width="2"/>
    </svg>
  `;
}

function inspectHotspotRegion(region) {
  const regionData = {
    shoulder: { title: 'Injured & Pain (Right Clavicle)', desc: 'Mild rotator cuff inflammation detected. Range of motion: 82%. Orthopedic review advised.' },
    core: { title: 'Metabolism & Temperature (36.6°C)', desc: 'Body temperature is optimal. Fasting glucose at 98 mg/dL. Metabolic stability: 95%.' },
    chest: { title: 'Cardiac Activity (Heart Rate 74 BPM)', desc: 'Blood pressure 118/78 mmHg. Normal sinus rhythm on live ECG waveform. SpO2: 98%.' }
  };
  const r = regionData[region] || regionData.chest;
  alert(`🫀 3D Anatomical Telemetry:\n\n${r.title}\n${r.desc}`);
}

function inspectOrganTelemetry(organ) {
  const organData = {
    lungs: { name: 'Lungs & Respiratory', stat: 'SpO2 99% • Respiratory Rate 16 bpm • Clear' },
    brain: { name: 'Brain & Neurological', stat: 'Cranial Activity Optimal • Sleep Score 8/10' },
    heart: { name: 'Heart & Cardiovascular', stat: 'Resting HR 74 BPM • Cardiac Ejection Fraction 62%' }
  };
  const o = organData[organ] || organData.heart;
  alert(`🫀 Organ System Telemetry:\n\n${o.name}\nStatus: ${o.stat}`);
}

// ==========================================================================
// 4. Consulting Doctors Deck & Booking (Images 1 & 3)
// ==========================================================================
function setupDoctorBookingDeck() {
  document.querySelectorAll('.btn-book-black').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      macAudio.chime();
      const doc = btn.dataset.doc || 'Dr. Priya Nair';
      appState.selectedDoctor = doc;
      switchMacView('bms');
      showToast(`Selected ${doc}. Opening BookMyShow-style slot grid.`);
    });
  });
}

// ==========================================================================
// 5. BookMyShow Cinema Style Seat Booking
// ==========================================================================
function setupBookMyShowCinemaSeats() {
  document.getElementById('btn-confirm-bms-booking')?.addEventListener('click', () => {
    if (!appState.selectedSeat) {
      showToast('⚠️ Please tap on an available green slot first!');
      return;
    }
    macAudio.chime();
    const token = `NEX-BMS-${Math.floor(Math.random() * 800 + 100)}`;
    alert(`🎟️ BOOKING CONFIRMED!\n\nToken ID: ${token}\nDoctor: ${appState.selectedDoctor}\nSeat Slot: ${appState.selectedSeat}\nPatient: ${appState.patient.name}\nFee: ₹0 (PMJAY Cashless Verified)\n\nAdded to your Apple Wallet / NexusCare pass!`);
    appState.selectedSeat = null;
    renderBookMyShowCinemaSeats();
  });
}

function renderBookMyShowCinemaSeats() {
  const container = document.getElementById('bms-seat-rows-container');
  if (!container) return;

  const deskHeader = document.getElementById('bms-screen-doctor-name');
  if (deskHeader) {
    deskHeader.textContent = `CONSULTATION DESK: ${appState.selectedDoctor.toUpperCase()} • ROOM 204`;
  }

  const rows = [
    { label: 'A', count: 8, prefix: 'A' },
    { label: 'B', count: 10, prefix: 'B' },
    { label: 'C', count: 10, prefix: 'C' },
    { label: 'D', count: 8, prefix: 'D' }
  ];

  let html = '';
  rows.forEach(r => {
    html += `<div style="display:flex; align-items:center; gap:0.5rem;"><span style="width:24px; font-weight:800; color:var(--text-tertiary);">${r.label}</span>`;
    for (let i = 1; i <= r.count; i++) {
      const seatId = `${r.prefix}${i}`;
      const isOccupied = (i % 3 === 0 && r.label !== 'A');
      const isSelected = appState.selectedSeat === seatId;
      const statusClass = isSelected ? 'selected' : isOccupied ? 'occupied' : 'vacant';

      html += `
        <div class="seat-item ${statusClass}" onclick="onBmsSeatClick('${seatId}', ${isOccupied})">
          ${seatId}
        </div>
      `;
    }
    html += `</div>`;
  });

  container.innerHTML = html;

  const summary = document.getElementById('bms-selected-seat-label');
  if (summary) {
    summary.textContent = appState.selectedSeat ? `Selected Seat: ${appState.selectedSeat} (${appState.selectedDoctor})` : 'Select an open green seat above';
  }
}

window.onBmsSeatClick = function(seatId, isOccupied) {
  if (isOccupied) {
    macAudio.tap();
    showToast(`Slot ${seatId} is already BOOKED.`);
    return;
  }
  macAudio.tap();
  appState.selectedSeat = seatId;
  renderBookMyShowCinemaSeats();
  showToast(`Selected Slot: ${seatId}`);
};

// ==========================================================================
// 6. Floating iOS Health Assistant
// ==========================================================================
function setupFloatingChatbot() {
  const btn = document.getElementById('floating-ai-btn');
  const win = document.getElementById('ios-chat-window-box');
  const close = document.getElementById('btn-close-ios-chat');
  const send = document.getElementById('btn-send-ios-chat');
  const input = document.getElementById('ios-chat-input');

  if (btn && win) {
    btn.addEventListener('click', () => {
      macAudio.tap();
      appState.chatOpen = !appState.chatOpen;
      win.classList.toggle('hidden', !appState.chatOpen);
    });
  }

  if (close && win) {
    close.addEventListener('click', () => {
      macAudio.tap();
      appState.chatOpen = false;
      win.classList.add('hidden');
    });
  }

  if (send && input) {
    send.addEventListener('click', () => submitChat());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitChat();
    });
  }
}

function submitChat() {
  const input = document.getElementById('ios-chat-input');
  if (!input) return;
  const msg = input.value.trim();
  if (msg) {
    appendChatBubble(msg, 'user');
    input.value = '';
    handleAIChatReply(msg);
  }
}

function appendChatBubble(text, sender) {
  const box = document.getElementById('ios-chat-messages-scroll');
  if (!box) return;
  const b = document.createElement('div');
  b.className = `ios-bubble ${sender}`;
  b.innerHTML = text;
  box.appendChild(b);
  box.scrollTop = box.scrollHeight;
}

function handleAIChatReply(query) {
  const q = query.toLowerCase();
  let reply = '';

  if (q.includes('acidity') || q.includes('heartburn') || q.includes('gas') || q.includes('cold') || q.includes('fever')) {
    reply = `
      <strong>💡 Minor Inconvenience Care (Save Hospital Trip):</strong><br>
      • Sip room-temperature water or fennel tea. Avoid caffeine.<br>
      • For mild fever/cold: warm saline gargles & rest.<br>
      <button class="btn-book-black" style="margin-top:6px; font-size:0.75rem;" onclick="startDoctorOnCall('Dr. Priya Nair')">📞 Arrange Live On-Call Doctor Audio</button>
    `;
  } else if (q.includes('chest') || q.includes('severe') || q.includes('emergency')) {
    reply = `
      <strong style="color:var(--ios-red);">🚨 CRITICAL EMERGENCY ALERT</strong><br>
      Immediate medical triage required at nearest trauma facility (AIIMS Cath Lab - 2.8 km away).<br>
      <button class="btn-book-black" style="background:var(--ios-red); margin-top:6px;" onclick="dispatchEmergencyServices()">🚑 Dispatch 108 Ambulance Now</button>
    `;
  } else {
    reply = `
      <strong>NexusCare Clinical Desk:</strong><br>
      I can help evaluate minor health symptoms, connect you on-call with a specialist, or book an appointment slot.
    `;
  }

  setTimeout(() => {
    macAudio.chime();
    appendChatBubble(reply, 'ai');
  }, 400);
}

window.startDoctorOnCall = function(doctorName) {
  macAudio.chime();
  alert(`📞 CONNECTING AUDIO TELE-CONSULTATION...\n\nDoctor: ${doctorName}\nStatus: Call Answered!\n\n"Hello Ramesh ji, this is ${doctorName} on NexusCare. I'm reviewing your real-time ECG and vitals. How can I assist you right now?"`);
};

window.dispatchEmergencyServices = function() {
  macAudio.chime();
  alert(`🚨 108 AMBULANCE DISPATCHED!\n\nVehicle DL-1C-4921 (Advanced Cardiac Life Support)\nDriver: Rajesh Kumar (+91 98112-90123)\nLive ETA: 7 mins to your location\nDestination: AIIMS Trauma Bay 01`);
  showToast('🚑 108 Ambulance en route! Live GPS tracking active.');
};

// ==========================================================================
// 7. Spotlight Search & Bilingual Toggle
// ==========================================================================
function setupSpotlightSearch() {
  const input = document.getElementById('macos-spotlight-input');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        macAudio.tap();
        const val = input.value.trim().toLowerCase();
        if (val.includes('cardio') || val.includes('heart') || val.includes('seat')) {
          switchMacView('bms');
          showToast('Spotlight: Opened BookMyShow Department Vacancies');
        } else {
          showToast(`Spotlight Search: Indexed records for "${val}"`);
        }
      }
    });
  }
}

function setupBilingualToggle() {
  document.getElementById('btn-lang-macos')?.addEventListener('click', () => {
    macAudio.tap();
    appState.lang = appState.lang === 'en' ? 'hi' : 'en';
    const btn = document.getElementById('btn-lang-macos');
    if (btn) btn.textContent = appState.lang === 'en' ? '🌐 हिन्दी' : '🌐 English';
    showToast(appState.lang === 'hi' ? 'भाषा बदलकर हिन्दी कर दी गई है' : 'Switched to English');
  });
}

// ==========================================================================
// 8. Toast Helper
// ==========================================================================
function showToast(msg) {
  const container = document.getElementById('macos-toast-stack');
  if (!container) return;

  const t = document.createElement('div');
  t.style.cssText = `
    background: rgba(28, 28, 30, 0.95);
    backdrop-filter: blur(16px);
    color: #ffffff;
    padding: 0.65rem 1.15rem;
    border-radius: 9999px;
    font-size: 0.82rem;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    animation: popIn 0.25s ease;
  `;
  t.textContent = msg;
  container.appendChild(t);

  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(-10px)';
    t.style.transition = 'all 0.3s ease';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}
window.showToast = showToast;
