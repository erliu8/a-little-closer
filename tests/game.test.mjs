import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame } from '../src/game/engine.ts';
import { stationStory } from '../src/stories/station.ts';

// 测试用真实首章节点推进；每段输入由独立的位移采样和活跃时钟组成。
function firstStep(choice = 'listen') {
  const game = createGame(stationStory);
  game.choose(choice);
  game.choose('approach');
  return game;
}

function reachFarewell(game) {
  game.choose('wait');
  game.tick(1000);
  game.choose('chorus');
  game.move(9, 500);
  game.tick(400);
  game.choose('thank');
  return game;
}

test('完整走完首章，满好感后先询问，收到肯定答复后可亲吻', () => {
  const game = firstStep();
  game.move(27, 1500);
  game.tick(360);
  assert.equal(game.view().nodeId, 'tangle');
  reachFarewell(game);
  assert.equal(game.view().affection, 100);
  game.choose('ask');
  assert.match(game.view().text, /我也想/);
  game.choose('kiss');
  assert.equal(game.view().kind, 'ending');
  assert.equal(game.view().pose, 'kiss');
});

// 两种输入失误都只结算一次，之后的故事仍能挽回关系。
for (const [reason, delta, sampleMs] of [['速度', 12, 60], ['越界', 38, 2000]]) {
  test(`${reason}会引发单次提醒，仍可通过认真回应抵达满好感`, () => {
    const game = firstStep();
    const before = game.view().affection;
    game.move(delta, sampleMs);
    assert.equal(game.view().nodeId, 'startled');
    assert.ok(game.view().affection < before);
    const after = game.view();
    game.tick(10000);
    game.move(8, 30);
    assert.deepEqual(game.view(), after);
    reachFarewell(game);
    assert.equal(game.view().affection, 100);
  });
}

test('阅读对白不耗时，邀请确认后才计时；低好感可与她约定明日', () => {
  const game = createGame(stationStory);
  const intro = game.view();
  game.tick(100000);
  assert.deepEqual(game.view(), intro);
  game.choose('train');
  assert.ok(game.view().affection < intro.affection);
  game.choose('approach');
  game.tick(11000);
  assert.equal(game.view().nodeId, 'missed');
  game.choose('wait');
  game.tick(1000);
  game.choose('chorus');
  game.tick(8000);
  game.choose('return');
  assert.deepEqual(game.view().choices.map(choice => choice.id), ['tomorrow']);
  assert.throws(() => game.choose('ask'), /没有可用选项/);
  game.choose('tomorrow');
  assert.equal(game.view().nodeId, 'next-song');
});

test('前后移动会改变位置，离开目标区域会重新计算停留，停步时她能主动迈近', () => {
  const game = firstStep();
  game.move(27, 1500);
  game.tick(300);
  game.move(-6, 300);
  game.move(6, 300);
  game.tick(300);
  assert.equal(game.view().nodeId, 'first-step');
  game.tick(60);
  game.choose('wait');
  game.move(-8, 320);
  assert.equal(game.view().position, 39);
  const before = game.view().partnerPosition;
  game.tick(1000);
  assert.equal(game.view().nodeId, 'together');
  assert.ok(game.view().partnerPosition < before);
});

// 真实章节可在内容侧连接到另一个场景；重开一局不会共享位置或好感。
test('可通过数据跨场景并明确报告失效的剧情引用', () => {
  const story = {
    ...stationStory,
    scenes: { ...stationStory.scenes, carriage: { title: '车厢里' } },
    nodes: {
      ...stationStory.nodes,
      invitation: {
        kind: 'dialogue', scene: 'carriage', speaker: '她', text: '这边还有空位。',
        choices: [{ id: 'continue', label: '坐下来', affection: 10, next: 'missing-seat' }],
      },
    },
  };
  const game = createGame(story);
  game.choose('listen');
  assert.equal(game.view().sceneTitle, '车厢里');
  const before = game.view();
  assert.throws(() => game.choose('continue'), /剧情节点不存在：missing-seat/);
  assert.deepEqual(game.view(), before);
  assert.equal(createGame(story).view().sceneId, 'platform');
});
