const {interval, defer} = require('rxjs');
const {take, repeat} = require('rxjs/operators');
const interact = require('interactjs');
const Tone = require('tone');
const recorder = new Tone.Recorder();
const synth = new Tone.PolySynth(Tone.Synth).connect(recorder).toDestination();
import {synthButtons} from './constants/synthButtons';
import {synthKeys} from './constants/synthKeys';

let autoSynthRange = 4;
let volume = 'high';
let on = false;
let autoSynthOn = false;
let sustain = 0;
let autoSynthIterationInterval = 1000;
let autoSynthInterval;
let buttonSocketOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
let autoSynthIterationCount;
let oscState = 1;

document.addEventListener('DOMContentLoaded', function () {
  initSliders();
  initInteractJs();
  getElements();
  setEventListeners();
});
const getMaxAutoPlayNoteDuration = (secsPerNote) => {
  let duration = sustain ? sustain : 0.01;
  if (duration > secsPerNote) {
    duration = secsPerNote;
  }
  return duration;
};

const playAutoSynthNote = (noteToPlay, autoSynthRange) => {
  if (noteToPlay !== 'NONE') {
    synth.triggerAttackRelease(noteToPlay, getMaxAutoPlayNoteDuration(autoSynthIterationInterval / 1000 / autoSynthRange));
  }
};
const addLabelHighlight = (buttonId) => {
  if (buttonId > 0 && buttonId < 11) {
    const label = synthButtons.find((synthButton) => synthButton.ButtonId === buttonId).Label.Element;
    label.classList.add('label-highlighted');
  }
};

const removeLabelHighlight = () => {
  synthButtons.forEach((synthButton) => {
    const label = synthButton.Label.Element;
    if (label.classList.contains('label-highlighted')) {
      label.classList.remove('label-highlighted');
    }
  });
};
const getNote = (keyCode) => {
  return synthKeys.find((synthKey) => synthKey.KeyCode === keyCode).Note;
};

const getNoteByButtonId = (buttonId) => {
  if (buttonId === 0) {
    return 'NONE';
  }
  return synthButtons.find((synthButton) => synthButton.ButtonId === buttonId).Note;
};
const initAutoSynth = () => {
  autoSynthIterationCount = -1;
  autoSynthInterval = defer(() => interval(autoSynthIterationInterval / autoSynthRange))
    .pipe(take(1), repeat())
    .subscribe((x) => {
      removeLabelHighlight();
      const range = autoSynthRange;
      autoSynthIterationCount++;
      if (autoSynthIterationCount === range || autoSynthIterationCount > range) {
        autoSynthIterationCount = 0;
      }
      const buttonId = buttonSocketOrder[autoSynthIterationCount];
      addLabelHighlight(buttonId);
      playAutoSynthNote(getNoteByButtonId(buttonId), autoSynthRange);
    });
};

const stopAutoSynth = () => {
  autoSynthInterval.unsubscribe();
  removeLabelHighlight();
};

const toggleSynthMode = () => {
  const modeKnob = document.getElementById('mode-knob');
  if (modeKnob) {
    if (!on) {
      modeKnob.style.transform = 'rotate(47.5deg)';
      on = true;
    } else if (on && autoSynthOn) {
      modeKnob.style.transform = 'rotate(0deg)';
      autoSynthOn = false;
      on = false;
      stopAutoSynth();
    } else {
      modeKnob.style.transform = 'rotate(95deg)';
      autoSynthOn = true;
      initAutoSynth();
    }
  }
};

const toggleSynthRange = () => {
  const rangeKnob = document.getElementById('range-knob');
  if (rangeKnob) {
    if (autoSynthRange === 4) {
      rangeKnob.style.transform = 'rotate(-31.6deg)';
      autoSynthRange = 6;
    } else if (autoSynthRange === 6) {
      rangeKnob.style.transform = 'rotate(-63.2deg)';
      autoSynthRange = 8;
    } else if (autoSynthRange === 8) {
      rangeKnob.style.transform = 'rotate(-95deg)';
      autoSynthRange = 10;
    } else if (autoSynthRange === 10) {
      rangeKnob.style.transform = 'rotate(0deg)';
      autoSynthRange = 4;
    }
  }
};
const startRecording = () => {
  recorder.start();
};

const stopRecording = async () => {
  const recording = await recorder.stop();
  const url = URL.createObjectURL(recording);
  const anchor = document.createElement('a');
  anchor.download = `recording-${Date.now()}.webm`;
  anchor.href = url;
  anchor.click();
};

const changeSynthOscillatorType = () => {
  if (oscState === 1) {
    oscState = 2;
    synth.set({
      oscillator: {type: 'sine'},
    });
  } else if (oscState === 2) {
    oscState = 3;
    synth.set({
      oscillator: {type: 'square'},
    });
  } else if (oscState === 3) {
    oscState = 4;
    synth.set({
      oscillator: {type: 'sawtooth'},
    });
  } else if (oscState === 4) {
    oscState = 1;
    synth.set({
      oscillator: {type: 'triangle'},
    });
  }
};

const changeVolume = () => {
  const volumeButton = document.getElementsByClassName('switch-button')[0];
  if (volume === 'low') {
    volume = 'med';
    volumeButton.style.left = '10px';
    synth.volume.value = -5;
  } else if (volume === 'med') {
    volume = 'high';
    volumeButton.style.left = '19.55px';
    synth.volume.value = 0;
  } else if (volume === 'high') {
    volume = 'low';
    volumeButton.style.left = '0.45px';
    synth.volume.value = -10;
  }
};
const toggleButtonDrag = (buttonId) => {
  const button = synthButtons.find((synthButton) => synthButton.ButtonId === buttonId);
  if (button) {
    button.IsDragging = !button.IsDragging;
  }
};

const isButtonDragging = (buttonId) => {
  const button = synthButtons.find((synthButton) => synthButton.ButtonId === buttonId);
  if (button) {
    return button.IsDragging;
  }
};

const roundOffNumber = (num, places) => {
  const multiplier = parseInt('1' + '0'.repeat(places), 10);
  num = num * multiplier;
  return Math.round(num) / multiplier;
};

function setEventListeners() {
  window.addEventListener(
    'keydown',
    (e) => {
      if (isValidKey(e.key)) {
        if (!isKeyPressed(e.key)) {
          pressKey(e.key);
        }
      }
    },
    {passive: true}
  );
  window.addEventListener(
    'keyup',
    (e) => {
      if (isValidKey(e.key)) {
        releaseKey(e.key);
      }
    },
    {passive: true}
  );
  const sustainInput = document.getElementById('sustain-input');
  const rangeBtn = document.getElementById('range-btn');
  const volumeBtn = document.getElementById('volume-btn');
  const modeBtn = document.getElementById('mode-btn');
  const resetPlugsBtn = document.getElementById('reset-plugs-btn');
  const startRecordingBtn = document.getElementById('start-recording-btn');
  const stopRecordingBtn = document.getElementById('stop-recording-btn');
  const changeOscillatorBtn = document.getElementById('change-osc-btn');
  sustainInput.addEventListener('input', function () {
    const sustainValue = parseFloat(sustainInput.value, 10);
    sustain = isNaN(sustainValue) ? 0 : sustainValue;
  });
  rangeBtn.addEventListener('click', function () {
    toggleSynthRange();
  });
  volumeBtn.addEventListener('click', function () {
    changeVolume();
  });
  modeBtn.addEventListener('click', function () {
    toggleSynthMode();
  });
  resetPlugsBtn.addEventListener('click', function () {
    resetPlugs();
  });
  startRecordingBtn.addEventListener('click', function () {
    startRecording();
  });
  stopRecordingBtn.addEventListener('click', function () {
    stopRecording();
  });
  changeOscillatorBtn.addEventListener('click', function () {
    changeSynthOscillatorType();
  });
}

function getElements() {
  const keyElements = document.getElementsByClassName('key');
  const buttonElements = document.getElementsByClassName('button');
  const buttonLabels = document.getElementsByClassName('plug-label');
  for (let i = 0; i < keyElements.length; i++) {
    synthKeys.find((synthKey) => synthKey.ButtonId === i + 1).Element = keyElements[i];
  }
  for (let i = 0; i < buttonElements.length; i++) {
    const button = synthButtons.find((synthButton) => synthButton.ButtonId === i + 1);
    button.Element = buttonElements[i];
    button.Label.Element = buttonLabels[i];
  }
}

function initSliders() {
  setupSlider('vol-container', 'vol-slider', 'vol-button-container', (freqVal) => {
    const detuneAmnt = roundOffNumber(freqVal, 4) * 10000 - 3500;
    synth.set({detune: detuneAmnt});
  });
  setupSlider('speed-container', 'speed-slider', 'speed-button-container', (v) => {
    autoSynthIterationInterval = Math.round(roundOffNumber(v, 4) * 10000 - 8197) * -1;
  });
}

function setupSlider(containerClass, sliderClass, buttonClass, callback) {
  const containerEl = document.getElementsByClassName(containerClass)[0];
  const buttonEl = document.getElementsByClassName(buttonClass)[0];
  const trackEl = document.getElementsByClassName(sliderClass)[0];
  let activeDrag;

  containerEl.addEventListener('mousedown', (evt) => {
    activeDrag = evt;
    updateButton(evt, activeDrag, buttonEl, trackEl, callback);
  });
  containerEl.addEventListener('mousemove', (evt) => {
    updateButton(evt, activeDrag, buttonEl, trackEl, callback);
  });
  containerEl.addEventListener('mouseup', (evt) => {
    activeDrag = null;
  });
  containerEl.addEventListener('dragstart', (evt) => {
    evt.preventDefault();
  });
}

function updateButton(evt, activeDrag, buttonEl, trackEl, callback) {
  if (activeDrag) {
    const rect = trackEl.getBoundingClientRect();
    rect.y -= 15; // hack to get the button to show in the right place
    const maxHeight = rect.height + 5;
    const newY = Math.min(maxHeight, Math.max(20, evt.y - rect.y));
    buttonEl.style.top = newY + 'px';
    const newValue = (maxHeight - newY) / maxHeight;
    callback(newValue);
  }
}

function initInteractJs() {
  interact('.dropzone').dropzone({
    accept: '.drag-drop',
    overlap: 0.5,
    // ondropactivate: function (event) {},
    // ondropdeactivate: function (event) {},
    ondragenter: (event) => {
      const container = event.target;
      if (!isButtonDragging(parseInt(event.relatedTarget.id, 10))) {
        if (container.classList.contains('occupied')) {
          container.classList.remove('occupied');
        }
      }
    },
    ondragleave: (event) => {
      const target = event.relatedTarget;
      const children = target.children;
      for (let i = 0; i < children.length; i++) {
        if (children[i].classList.contains('cross')) {
          if (!children[i].classList.contains('d-none')) {
            children[i].classList.add('d-none');
          }
        }
      }
      target.classList.add('dragging');
      const buttonId = parseInt(target.id, 10);
      if (!isButtonDragging(buttonId)) {
        toggleButtonDrag(buttonId);
        event.target.classList.remove('occupied');
        const dropzoneId = event.target.id;
        buttonSocketOrder[dropzoneId - 1] = 0;
      }
    },
    ondrop: (event) => {
      const target = event.relatedTarget;
      const children = target.children;
      if (event.target.classList.contains('occupied')) {
        for (let i = 0; i < children.length; i++) {
          if (children[i].classList.contains('cross')) {
            children[i].classList.remove('d-none');
          }
        }
      } else {
        for (let i = 0; i < children.length; i++) {
          if (children[i].classList.contains('cross')) {
            if (!children[i].classList.contains('d-none')) {
              children[i].classList.add('d-none');
            }
          }
        }
        const buttonId = parseInt(target.id, 10);
        if (isButtonDragging(buttonId)) {
          toggleButtonDrag(buttonId);
        }
        event.target.classList.add('occupied');
        const dropzoneId = parseInt(event.target.id, 10);
        target.style.zIndex = 12 - dropzoneId;
        target.classList.remove('dragging');
        buttonSocketOrder[dropzoneId - 1] = buttonId;
        let postitionRelativeToParent;
        if (dropzoneId > buttonId) {
          postitionRelativeToParent = 'right';
        } else if (dropzoneId < buttonId) {
          postitionRelativeToParent = 'left';
        } else if (dropzoneId === buttonId) {
          postitionRelativeToParent = 'same';
        }
        let x;
        const y = 0;
        if (postitionRelativeToParent === 'same') {
          x = 0;
        } else if (postitionRelativeToParent === 'right') {
          x = (dropzoneId - buttonId) * 45;
        } else if (postitionRelativeToParent === 'left') {
          x = (buttonId - dropzoneId) * -45;
        }
        target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
      }
    },
  });

  const dragMoveListener = (event) => {
    const target = event.target;
    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
    target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
  };

  interact('.drag-drop').draggable({
    inertia: false,
    modifiers: [
      interact.modifiers.restrictRect({
        endOnly: true,
      }),
    ],
    autoScroll: true,
    listeners: {move: dragMoveListener},
  });
}

function resetPlugs() {
  buttonSocketOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  buttonSocketOrder.forEach((value) => {
    if (isButtonDragging(value)) {
      toggleButtonDrag(value);
    }
  });
  synthButtons.forEach((button) => {
    if (button.Element.classList.contains('dragging')) {
      button.Element.classList.remove('dragging');
    }
    const buttonChildren = button.Element.children;
    for (let i = 0; i < buttonChildren.length; i++) {
      if (buttonChildren[i].classList.contains('cross')) {
        if (!buttonChildren[i].classList.contains('d-none')) {
          buttonChildren[i].classList.add('d-none');
        }
      }
    }
    const buttonContainer = button.Element.parentElement;
    if (!buttonContainer.classList.contains('occupied')) {
      buttonContainer.classList.add('occupied');
    }
    button.Element.style.webkitTransform = button.Element.style.transform = 'translate(' + 0 + 'px, ' + 0 + 'px)';
    button.Element.style.zIndex = (12 - parseInt(button.Element.id, 10)).toString();
    button.Element.setAttribute('data-x', '0');
    button.Element.setAttribute('data-y', '0');
  });
}

function isValidKey(keyCode) {
  if (synthKeys.find((synthKey) => synthKey.KeyCode === keyCode)) {
    return true;
  }
  return false;
}

function isKeyPressed(keyCode) {
  return synthKeys.find((synthKey) => synthKey.KeyCode === keyCode).IsPressed;
}

function pressKey(keyCode) {
  const key = synthKeys.find((synthKey) => synthKey.KeyCode === keyCode);
  key.Element.classList.add('key-pressed');
  key.IsPressed = true;
  if (on) {
    synth.triggerAttack(getNote(keyCode));
  }
}

function releaseKey(keyCode) {
  const key = synthKeys.find((synthKey) => synthKey.KeyCode === keyCode);
  key.Element.classList.remove('key-pressed');
  key.IsPressed = false;
  synth.triggerRelease(getNote(keyCode), Tone.now() + sustain);
}
