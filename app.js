const form = document.querySelector('#blueprintForm');
const scopeButtons = [...document.querySelectorAll('[data-scope]')];
const toast = document.querySelector('#toast');
let scope = 'expansive';
let toastTimer;

function activeSystems() {
  return [...document.querySelectorAll('#systemList input[type="checkbox"]:checked')].map(input => input.value);
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
}

function updateSystemCount() {
  const count = activeSystems().length;
  document.querySelector('#systemCount').textContent = `${String(count).padStart(2, '0')} SELECTED`;
}

function collectBlueprint() {
  const selected = activeSystems();
  const title = document.querySelector('#gameTitle').value.trim() || 'Untitled world';
  const pitch = document.querySelector('#gamePitch').value.trim();
  const genre = document.querySelector('#genre').value;
  const tone = document.querySelector('#tone').value;
  const scopeNames = { focused: 'Focused', expansive: 'Expansive', epic: 'Epic' };
  const scopePlan = {
    focused: ['Playable core loop', 'One polished region', 'One complete progression arc'],
    expansive: ['Playable core loop and signature activity', 'One dense region with systemic world events', 'Career, character, and progression loops', 'Expansion plan for additional regions and content'],
    epic: ['Core loop and one vertical-slice region', 'System dependency map and technical risk pass', 'Phased content plan with team and production assumptions', 'Expansion gates for additional regions, stories, and modes']
  };
  return {
    format: 'open-game-blueprint',
    version: 1,
    createdAt: new Date().toISOString(),
    game: {
      title, pitch, coreExperience: genre, tone, ambition: scopeNames[scope], originality: 'Original expression, world, characters, story, visual identity, audio, and implementation.',
      playerName: document.querySelector('#playerName').value.trim() || 'Racer',
      teamName: document.querySelector('#teamName').value.trim() || 'Open Team',
      rivalNames: document.querySelector('#rivalNames').value.split(',').map(name => name.trim()).filter(Boolean).slice(0, 7),
      trackName: document.querySelector('#trackName').value.trim() || 'Coastal Grand Circuit',
      trackLengthKm: Math.min(20, Math.max(1, Number(document.querySelector('#trackLengthKm').value) || 4.2)),
      raceLaps: Math.min(12, Math.max(1, Math.round(Number(document.querySelector('#raceLaps').value) || 3))),
      accentColor: '#df4b36'
    },
    systems: selected.map((name, index) => ({ id: `system-${index + 1}`, name, status: 'planned' })),
    production: {
      principle: 'Build a polished vertical slice, validate it through play, then expand connected systems in milestones.',
      firstPlayableSlice: ['One distinct playable area', selected[0] || 'One signature gameplay system', 'One character or world event that reacts to player action', 'One meaningful progression reward'],
      milestones: scopePlan[scope],
      dependencies: selected.length > 1 ? [`Prototype ${selected[0]} first`, `Connect ${selected.slice(1).join(', ')} through shared player and world state`, 'Add content only after the system loop is enjoyable'] : ['Prototype the selected system', 'Add one complete activity and a progression reward', 'Validate the loop before expanding content']
    },
    originalityReview: [
      'Use original names, characters, story, locations, art direction, audio, UI, and assets.',
      'Record the source and license for every third-party dependency and asset.',
      'Treat this blueprint as a design artifact, not legal clearance or a guarantee against claims.'
    ]
  };
}

function renderBlueprint(shouldScroll = false) {
  const blueprint = collectBlueprint();
  document.querySelector('#outputTitle').textContent = blueprint.game.title;
  document.querySelector('#outputPitch').textContent = blueprint.game.pitch || 'Add the experience you want players to have.';
  document.querySelector('#outputGenre').textContent = blueprint.game.coreExperience.toUpperCase();
  document.querySelector('#outputTone').textContent = blueprint.game.tone.toUpperCase();
  const list = document.querySelector('#outputSystems');
  list.replaceChildren();
  if (blueprint.systems.length === 0) {
    const empty = document.createElement('span');
    empty.textContent = 'Choose at least one system to plan your game.';
    list.append(empty);
  } else {
    for (const system of blueprint.systems) {
      const tag = document.createElement('span');
      tag.textContent = system.name;
      list.append(tag);
    }
  }
  if (shouldScroll) document.querySelector('#outputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  return blueprint;
}

function downloadBlueprint() {
  const data = renderBlueprint();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeTitle = data.game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'open-game';
  link.download = `${safeTitle}-blueprint.json`;
  link.click();
  URL.revokeObjectURL(url);
  notify('Blueprint exported as JSON.');
}

scopeButtons.forEach(button => button.addEventListener('click', () => {
  scope = button.dataset.scope;
  scopeButtons.forEach(option => option.classList.toggle('selected', option === button));
}));

document.querySelector('#systemList').addEventListener('change', event => {
  if (event.target.matches('input[type="checkbox"]')) {
    event.target.closest('.system-card').classList.toggle('checked', event.target.checked);
    updateSystemCount();
  }
});

form.addEventListener('submit', event => {
  event.preventDefault();
  renderBlueprint(true);
  notify('Your game blueprint is ready to shape.');
});

document.querySelector('#exportButton').addEventListener('click', downloadBlueprint);

document.querySelector('#saveButton').addEventListener('click', () => {
  const draft = {
    title: document.querySelector('#gameTitle').value,
    pitch: document.querySelector('#gamePitch').value,
    genre: document.querySelector('#genre').value,
    tone: document.querySelector('#tone').value,
    playerName: document.querySelector('#playerName').value,
    teamName: document.querySelector('#teamName').value,
    rivalNames: document.querySelector('#rivalNames').value,
    trackName: document.querySelector('#trackName').value,
    trackLengthKm: document.querySelector('#trackLengthKm').value,
    raceLaps: document.querySelector('#raceLaps').value,
    scope,
    selected: [...document.querySelectorAll('#systemList input[type="checkbox"]')].map(input => ({ value: input.value, checked: input.checked }))
  };
  localStorage.setItem('open-game-draft-v1', JSON.stringify(draft));
  notify('Draft saved in this browser.');
});

document.querySelector('#addSystem').addEventListener('click', () => {
  const dialog = document.createElement('div');
  dialog.className = 'custom-system-dialog';
  dialog.innerHTML = '<div class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialogHeading"><h3 id="dialogHeading">Add a game system</h3><p>Name a new system for your original game. You can connect it to the blueprint now and refine it later.</p><input maxlength="46" placeholder="e.g. Crew management & team orders" aria-label="New system name"><div class="dialog-actions"><button type="button" data-cancel>Cancel</button><button type="button" data-add>Add system</button></div></div>';
  document.body.append(dialog);
  const input = dialog.querySelector('input');
  input.focus();
  const close = () => dialog.remove();
  dialog.querySelector('[data-cancel]').addEventListener('click', close);
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  dialog.querySelector('[data-add]').addEventListener('click', () => {
    const value = input.value.trim();
    if (!value) { input.focus(); return; }
    if ([...document.querySelectorAll('#systemList input')].some(existing => existing.value.toLowerCase() === value.toLowerCase())) {
      input.setCustomValidity('That system is already in your blueprint.');
      input.reportValidity();
      return;
    }
    const label = document.createElement('label');
    label.className = 'system-card checked';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox'; checkbox.value = value; checkbox.checked = true;
    const icon = document.createElement('span'); icon.className = 'system-icon'; icon.textContent = '✧';
    const copy = document.createElement('span'); copy.className = 'system-copy';
    const strong = document.createElement('strong'); strong.textContent = value;
    const small = document.createElement('small'); small.textContent = 'Creator-defined system';
    copy.append(strong, small);
    const check = document.createElement('span'); check.className = 'system-check'; check.textContent = '✓';
    label.append(checkbox, icon, copy, check);
    document.querySelector('#systemList').append(label);
    updateSystemCount();
    close();
    notify('System added to your game.');
  });
});

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem('open-game-draft-v1') || 'null');
    if (!draft) return;
    document.querySelector('#gameTitle').value = draft.title || '';
    document.querySelector('#gamePitch').value = draft.pitch || '';
    document.querySelector('#genre').value = draft.genre || document.querySelector('#genre').options[0].value;
    document.querySelector('#tone').value = draft.tone || document.querySelector('#tone').options[0].value;
    document.querySelector('#playerName').value = draft.playerName || 'Racer';
    document.querySelector('#teamName').value = draft.teamName || 'Open Team';
    document.querySelector('#rivalNames').value = draft.rivalNames || 'Mika Vale, Tomas Reed, Aya Nakamura, Luca Serrano, Nia Brooks';
    document.querySelector('#trackName').value = draft.trackName || 'Coastal Grand Circuit';
    document.querySelector('#trackLengthKm').value = draft.trackLengthKm || '4.2';
    document.querySelector('#raceLaps').value = draft.raceLaps || '3';
    scope = draft.scope || 'expansive';
    scopeButtons.forEach(button => button.classList.toggle('selected', button.dataset.scope === scope));
    for (const saved of draft.selected || []) {
      const checkbox = [...document.querySelectorAll('#systemList input')].find(input => input.value === saved.value);
      if (checkbox) {
        checkbox.checked = saved.checked;
        checkbox.closest('.system-card').classList.toggle('checked', saved.checked);
      }
    }
    updateSystemCount();
  } catch {
    localStorage.removeItem('open-game-draft-v1');
  }
}

loadDraft();
updateSystemCount();
renderBlueprint();
