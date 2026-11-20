import './ui/theme.css';
import { createGame } from './game/engine.ts';
import { stationStory } from './stories/station.ts';
import { createStage } from './ui/stage.ts';
import { bindMovement } from './ui/controls.ts';
import { createAudio } from './ui/audio.ts';

// 所有 DOM 访问集中在浏览器入口，剧情和游戏钟可直接在 Node 内运行。
function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`缺少游戏界面元素：${id}`);
  return node as T;
}

const errorBox = element('error');
function report(error: unknown) {
  errorBox.textContent = error instanceof Error ? error.message : String(error);
  errorBox.hidden = false;
}

// 显示运行中的错误；浏览器仍保留原异常与调用栈。
window.addEventListener('error', event => report(event.error ?? event.message));
window.addEventListener('unhandledrejection', event => report(event.reason));

const stage = createStage(element('stage'));
const audio = createAudio();
const sound = element<HTMLButtonElement>('sound');
const track = element('track');
const player = element('player');
const partner = element('partner');
const target = element('target');
const clock = element('clock');
const timer = element<HTMLProgressElement>('time-left');
const affection = element('affection');
const title = element('scene-title');
const speaker = element('speaker');
const line = element('line');
const choices = element('choices');

let game = createGame(stationStory);
let frame = 0;
let lastTime = 0;
let displayedNode = '';
let movementActive = false;
let paused = false;

// 仅在限时动作中驱动游戏钟，阅读、暂停和后台标签页均不计时。
function tick(now: number) {
  frame = 0;
  game.tick(now - lastTime);
  lastTime = now;
  render();
}

function syncAudio() {
  const { remainingMs, durationMs } = game.view();
  if (paused || remainingMs === null || durationMs === null) audio.stop();
  else audio.play(durationMs - remainingMs, remainingMs);
}

function button(label: string, action: () => void) {
  const item = document.createElement('button');
  item.type = 'button';
  item.textContent = label;
  item.addEventListener('click', action);
  choices.append(item);
}

// 切出和手动暂停共用入口，恢复动作必须由玩家确认。
function setPaused(value: boolean) {
  if (paused === value || game.view().kind !== 'movement') return;
  paused = value;
  displayedNode = '';
  render();
  if (!paused) track.focus({ preventScroll: true });
}

// 只在换节点时替换对白与按钮，拖动中保留键盘焦点与读屏顺序。
function render() {
  const view = game.view();
  const active = view.kind === 'movement' && !paused;
  const changed = view.nodeId !== displayedNode;
  if (changed) {
    const focusChoices = choices.contains(document.activeElement) || document.activeElement === track;
    displayedNode = view.nodeId;
    title.textContent = view.sceneTitle;
    speaker.textContent = view.speaker;
    line.textContent = paused ? '已暂停。准备好后继续。' : view.text;
    affection.textContent = `好感 ${Math.round(view.affection)} / 100`;
    choices.replaceChildren();
    if (view.kind === 'ending') {
      button('再玩一次', () => { game = createGame(stationStory); displayedNode = ''; render(); });
    } else if (view.kind === 'movement') {
      button(paused ? '继续' : '暂停', () => setPaused(!paused));
    } else {
      for (const option of view.choices) button(option.label, () => { game.choose(option.id); render(); });
    }

    // 目标区只在动作中展示；转换节点时更新声轨、辅助输入状态和提示语。
    track.setAttribute('aria-disabled', String(!active));
    track.tabIndex = active ? 0 : -1;
    target.hidden = !view.target;
    if (view.target) {
      target.style.left = `${view.target[0]}%`;
      target.style.width = `${view.target[1] - view.target[0]}%`;
    }
    if (focusChoices && document.hasFocus()) {
      (active ? track : choices.querySelector('button'))?.focus({ preventScroll: true });
    }
    syncAudio();
  }

  // 倒计时和位置只由引擎快照驱动，画布可跳过相同位置的重绘。
  stage.render({ scene: view.sceneId, player: view.position, partner: view.partnerPosition, pose: view.pose });
  player.style.left = `${view.position}%`;
  partner.style.left = `${view.partnerPosition}%`;
  track.setAttribute('aria-valuenow', String(Math.round(view.position)));
  const range = view.target ? `，目标 ${Math.round(view.target[0])} 到 ${Math.round(view.target[1])}` : '';
  track.setAttribute('aria-valuetext', `位置 ${Math.round(view.position)}${range}`);
  clock.hidden = view.durationMs === null;
  if (view.durationMs !== null && view.remainingMs !== null) {
    timer.max = view.durationMs;
    timer.value = view.remainingMs;
  }
  if (active && !movementActive) lastTime = performance.now();
  movementActive = active;
  if (active && !frame) frame = requestAnimationFrame(tick);
  if (!active && frame) { cancelAnimationFrame(frame); frame = 0; }
}

// 平台输入与剧情结算分开，鼠标采样时间只用来判速。
bindMovement(track, {
  enabled: () => movementActive,
  move(delta, seconds) { game.move(delta, seconds * 1000); render(); },
  pause() { setPaused(true); },
});
sound.addEventListener('click', async () => {
  sound.disabled = true;
  try {
    const enabled = await audio.toggle();
    sound.setAttribute('aria-pressed', String(enabled));
    sound.textContent = enabled ? '关闭声音' : '开启声音';
    syncAudio();
  } finally {
    sound.disabled = false;
  }
});
render();
