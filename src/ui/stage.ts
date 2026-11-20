import './stage.css';
import { drawPlatform, STAGE_HEIGHT, STAGE_WIDTH } from '../assets/platform.ts';
import { drawActors } from '../assets/actors.ts';
import type { Pose } from '../game/story.ts';

// 剧情层只交付位置、场景和姿态，画面组件无权修改好感或切换事件。
export interface StageFrame {
  scene: string;
  player: number;
  partner: number;
  pose: Pose;
}

// 每个场景独立提供背景画法与无障碍描述，可沿用同一套人物和互动。
const scenes = new Map([
  ['platform', { label: '暮色中的末班车站台', draw: drawPlatform }],
]);

// 不支持 Canvas 的宿主需明确报告错误，避免展示静止的空画面。
function surface() {
  const canvas = document.createElement('canvas');
  canvas.width = STAGE_WIDTH;
  canvas.height = STAGE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前环境无法创建 Canvas 2D 画面。');
  return { canvas, ctx };
}

// 每个舞台只保留一张背景缓存，按像素对齐的位置和姿态按需重绘。
export function createStage(parent: HTMLElement) {
  const { canvas, ctx } = surface();
  const background = surface();
  canvas.className = 'story-stage';
  canvas.setAttribute('role', 'img');
  parent.append(canvas);
  let last: StageFrame | undefined;

  function render(frame: StageFrame) {
    const player = Math.round(frame.player * 4.4);
    const partner = Math.round(frame.partner * 4.4);
    const sceneChanged = last?.scene !== frame.scene;
    if (!sceneChanged && last?.player === player && last.partner === partner && last.pose === frame.pose) return;
    const scene = scenes.get(frame.scene);
    if (!scene) throw new Error(`场景缺少画面：${frame.scene}`);

    // 静景只在换场时重绘，文字替代也只在场景或角色姿势发生变化时更新。
    if (sceneChanged) scene.draw(background.ctx);
    if (sceneChanged || last?.pose !== frame.pose) {
      const poseText = { idle: '两人面向彼此。', offer: '她向左递出一只耳机。', kiss: '两人向彼此靠近，轻轻接吻。' };
      canvas.setAttribute('aria-label', `${scene.label}。${poseText[frame.pose]}`);
    }
    ctx.drawImage(background.canvas, 0, 0);
    drawActors(ctx, frame.player, frame.partner, frame.pose);
    last = { scene: frame.scene, player, partner, pose: frame.pose };
  }
  return { render };
}