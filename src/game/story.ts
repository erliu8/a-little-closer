// 剧情只保存可移植的数据。桌面壳和浏览器可以共用同一份事件定义。
export type Pose = 'idle' | 'offer' | 'kiss';
export type Range = readonly [number, number];

export interface Choice {
  id: string;
  label: string;
  next: string;
  affection?: number;
  minAffection?: number;
}

// limit 是本步向前走的最远位置；relative 表示距离进入该节点时的位置。
export interface Movement {
  range: Range;
  relative?: boolean;
  limit: number;
  maxSpeed: number;
  holdMs: number;
  durationMs: number;
  success: Outcome;
  rushed: Outcome;
  late: Outcome;
}

interface Outcome {
  next: string;
  affection: number;
}

// 场景、姿势和对白独立于规则。靠近动作只有在双方同意的结尾才由剧情指定。
interface NodeBase {
  speaker: string;
  text: string;
  scene?: string;
  pose?: Pose;
  partnerOffset?: number;
}

export type StoryNode = NodeBase & (
  | { kind: 'dialogue'; choices: readonly Choice[] }
  | { kind: 'movement'; movement: Movement }
  | { kind: 'ending' }
);

// 每个故事可由多个章节文件的 scenes 和 nodes 组合；节点通过稳定 ID 串联。
export interface Story {
  start: string;
  initial: { scene: string; position: number; partnerPosition: number; affection: number };
  scenes: Readonly<Record<string, { title: string }>>;
  nodes: Readonly<Record<string, StoryNode>>;
}
