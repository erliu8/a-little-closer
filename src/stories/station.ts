import type { Story } from '../game/story.ts';

// 末班车前的完整小故事。动作阈值的单位为轨道百分比、百分比每秒和毫秒。
export const stationStory = {
  start: 'headphones',
  initial: { scene: 'platform', position: 20, partnerPosition: 80, affection: 50 },
  scenes: { platform: { title: '末班车前的一只耳机' } },
  nodes: {
    // 台词时间交给玩家，直到按下动作选项才开动游戏钟。
    headphones: {
      kind: 'dialogue', speaker: '她', pose: 'offer',
      text: '她摘下一只耳机。「这首歌的副歌，你肯定喜欢。」',
      choices: [
        { id: 'listen', label: '好啊，一起听。', affection: 20, next: 'invitation' },
        { id: 'train', label: '先看看车来了没。', affection: -5, next: 'glance' },
      ],
    },
    invitation: {
      kind: 'dialogue', speaker: '她', pose: 'offer',
      text: '「过来一点，耳机线可没那么长。」她把手往你的方向伸了一下。',
      choices: [{ id: 'approach', label: '向她走近', next: 'first-step' }],
    },
    glance: {
      kind: 'dialogue', speaker: '她', pose: 'offer',
      text: '「还有一首歌的时间呢。」她看向隧道，又把耳机递过来。',
      choices: [{ id: 'approach', label: '回过头，向她走近', next: 'first-step' }],
    },
    'first-step': {
      kind: 'movement', speaker: '她', text: '「对，就在那儿。我把线递给你。」', pose: 'offer',
      movement: {
        range: [45, 54], limit: 57, maxSpeed: 115, holdMs: 360, durationMs: 11000,
        success: { next: 'tangle', affection: 16 },
        rushed: { next: 'startled', affection: -8 },
        late: { next: 'missed', affection: -6 },
      },
    },
    // 错过或向前太急都有具体回应；下一个动作仍给玩家挽回机会。
    startled: {
      kind: 'dialogue', speaker: '她', text: '「哎，等我一下。」她收回手，把缠住的线放到掌心。',
      choices: [{ id: 'wait', label: '给她留点空间', next: 'untangle' }],
    },
    missed: {
      kind: 'dialogue', speaker: '她', text: '前奏唱完了。她垂下手：「没事，刚好让我把线解开。」',
      choices: [{ id: 'wait', label: '在旁边等她', next: 'untangle' }],
    },
    tangle: {
      kind: 'dialogue', speaker: '她', text: '「等一下……线缠住了。」她低下头，就差最后一个小结。',
      choices: [{ id: 'wait', label: '停下来等她', next: 'untangle' }],
    },
    untangle: {
      kind: 'movement', speaker: '她', text: '「先别往前，马上就好。」松手停下，或稍稍退一步。',
      movement: {
        relative: true, range: [-12, 1], limit: 3, maxSpeed: 100, holdMs: 1000, durationMs: 8000,
        success: { next: 'together', affection: 18 },
        rushed: { next: 'second-chance', affection: -8 },
        late: { next: 'second-chance', affection: -6 },
      },
    },
    // 对方主动走近后，相对窗口让之前站得稍远的玩家也能听到副歌。
    together: {
      kind: 'dialogue', speaker: '她', pose: 'offer', partnerOffset: 18,
      text: '线解开了。她先向你挪了一步。「好了，再近一点？副歌要开始了。」',
      choices: [{ id: 'chorus', label: '听副歌', next: 'chorus' }],
    },
    'second-chance': {
      kind: 'dialogue', speaker: '她', pose: 'offer', partnerOffset: 18,
      text: '她重新理好耳机，走到你身边。「我们再试一次？这回慢慢来。」',
      choices: [{ id: 'chorus', label: '跟上她的节奏', next: 'chorus' }],
    },
    chorus: {
      kind: 'movement', speaker: '她', text: '「听，就是这一句。」你们之间还差半步。', pose: 'offer',
      movement: {
        relative: true, range: [5, 13], limit: 15, maxSpeed: 105, holdMs: 400, durationMs: 8000,
        success: { next: 'song', affection: 22 },
        rushed: { next: 'quiet', affection: -8 },
        late: { next: 'quiet', affection: -6 },
      },
    },
    song: {
      kind: 'dialogue', speaker: '你', text: '同一个音符，落在你们各自的一只耳朵里。末班车转过了弯。',
      choices: [
        { id: 'thank', label: '谢谢。我会记得这一句。', affection: 14, next: 'farewell' },
        { id: 'smile', label: '笑着把耳机还给她。', next: 'farewell' },
      ],
    },
    quiet: {
      kind: 'dialogue', speaker: '你', text: '你们错过了那句歌词。列车开近时，她还拿着那一只耳机。',
      choices: [
        { id: 'thank', label: '下次还想和你听这句。', affection: 14, next: 'farewell' },
        { id: 'return', label: '轻轻把耳机还给她。', next: 'farewell' },
      ],
    },
    // 满好感解锁发问。亲吻需要听见肯定的回应，玩家仍可选另一种告别。
    farewell: {
      kind: 'dialogue', speaker: '她', text: '「车到了。」她没有立刻转身。你想怎样跟她道别？',
      choices: [
        { id: 'ask', label: '可以亲你一下吗？', minAffection: 100, next: 'consent' },
        { id: 'tomorrow', label: '明天，再一起听？', next: 'next-song' },
      ],
    },
    consent: {
      kind: 'dialogue', speaker: '她', pose: 'offer', partnerOffset: 5,
      text: '「嗯，我也想。」她笑了，把最后半步走完。',
      choices: [
        { id: 'kiss', label: '轻轻吻她', next: 'platform-kiss' },
        { id: 'tomorrow', label: '牵着她的手，约好明天。', next: 'next-song' },
      ],
    },
    'platform-kiss': {
      kind: 'ending', speaker: '站台上的吻', pose: 'kiss', partnerOffset: 1,
      text: '车门亮了。你们轻轻吻了一下，耳机里那首歌还没唱完。',
    },
    'next-song': {
      kind: 'ending', speaker: '明天的歌', text: '「好啊。」车门合上的时候，你的手机亮了。是她发来的歌名。',
    },
  },
} as const satisfies Story;
