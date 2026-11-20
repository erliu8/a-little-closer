import type { Choice, Pose, Range, Story, StoryNode } from './story.ts';

// 界面仅读取快照；浏览器事件、系统时钟与音效都由外层适配。
export interface GameView {
  nodeId: string;
  sceneId: string;
  sceneTitle: string;
  speaker: string;
  text: string;
  pose: Pose;
  kind: StoryNode['kind'];
  choices: readonly Pick<Choice, 'id' | 'label'>[];
  position: number;
  partnerPosition: number;
  affection: number;
  target: Range | null;
  remainingMs: number | null;
  durationMs: number | null;
}

const onTrack = (value: number) => Math.max(0, Math.min(100, value));

export function createGame(story: Story) {
  // 每局独立保存位置与时间。切回游戏时不需要用系统时间重建这些状态。
  let { position, partnerPosition, affection, scene: sceneId } = story.initial;
  let nodeId = story.start;
  let node: StoryNode;
  let anchor = 0;
  let remainingMs = 0;
  let heldMs = 0;
  let target: Range | null = null;

  // 跨场景跳转复用同一个入口；引用写错应指出具体节点，便于编剧定位。
  function enter(id: string) {
    const next = story.nodes[id];
    if (!next) throw new Error(`剧情节点不存在：${id}`);
    const nextSceneId = next.scene ?? sceneId;
    if (!story.scenes[nextSceneId]) throw new Error(`剧情场景不存在：${nextSceneId}`);
    sceneId = nextSceneId;
    node = next;
    nodeId = id;
    if (next.partnerOffset !== undefined) partnerPosition = onTrack(position + next.partnerOffset);
    heldMs = 0;
    target = null;
    if (next.kind === 'movement') {
      const motion = next.movement;
      anchor = motion.relative ? position : 0;
      target = [onTrack(anchor + motion.range[0]), onTrack(anchor + motion.range[1])];
      remainingMs = motion.durationMs;
    }
  }

  // 结算时立即离开节点，旧输入和下一帧计时不能对同一个事件加第二次分。
  function resolve(next: string, points: number) {
    enter(next);
    affection = onTrack(affection + points);
  }

  function choices() {
    return node.kind === 'dialogue'
      ? node.choices.filter(choice => affection >= (choice.minAffection ?? 0))
      : [];
  }

  enter(story.start);
  return {
    // 剧情元数据与可选对白均来自当前节点，显示层无需判断故事 ID。
    view(): GameView {
      return {
        nodeId, sceneId, sceneTitle: story.scenes[sceneId]!.title,
        speaker: node.speaker, text: node.text, pose: node.pose ?? 'idle', kind: node.kind,
        choices: choices().map(({ id, label }) => ({ id, label })),
        position, partnerPosition, affection, target,
        remainingMs: target ? remainingMs : null,
        durationMs: node.kind === 'movement' ? node.movement.durationMs : null,
      };
    },

    // 故意隐藏的选项也在规则层复核，不能绕开满好感和双方同意的流程。
    choose(id: string) {
      const choice = choices().find(candidate => candidate.id === id);
      if (!choice) throw new Error(`当前剧情没有可用选项：${id}`);
      resolve(choice.next, choice.affection ?? 0);
    },

    // 位移来自轨道百分比，速度来自输入采样时间；倒退同样由玩家控制。
    move(deltaPosition: number, elapsedMs: number) {
      if (node.kind !== 'movement' || !target || elapsedMs <= 0 || deltaPosition === 0) return;
      const motion = node.movement;
      const requested = position + deltaPosition;
      position = onTrack(Math.min(requested, partnerPosition));
      if (deltaPosition > 0 && (deltaPosition * 1000 > elapsedMs * motion.maxSpeed || requested > anchor + motion.limit)) {
        resolve(motion.rushed.next, motion.rushed.affection);
      } else if (position < target[0] || position > target[1]) {
        heldMs = 0;
      }
    },

    // 只有动作节点消耗舞台传来的活跃时间；停在目标距离足够久才完成。
    tick(elapsedMs: number) {
      if (node.kind !== 'movement' || !target || elapsedMs <= 0) return;
      const motion = node.movement;
      const activeMs = Math.min(elapsedMs, remainingMs);
      if (position >= target[0] && position <= target[1]) heldMs += activeMs;
      remainingMs -= activeMs;
      if (heldMs >= motion.holdMs) resolve(motion.success.next, motion.success.affection);
      else if (remainingMs <= 0) resolve(motion.late.next, motion.late.affection);
    },
  };
}
