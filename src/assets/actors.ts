// 以等宽字符保存原创像素立绘，透明格可让同一套人物出现在不同场景。
type Paint = CanvasRenderingContext2D;
import type { Pose } from '../game/story.ts';

const colors: Record<string, string> = {
  o: '#29283b', h: '#463846', H: '#6e5260', f: '#efb799', F: '#ffd2ae',
  e: '#56404c', p: '#e29a90', c: '#87a8a0', C: '#b8ccc0', a: '#668783',
  s: '#774e60', S: '#e89186', t: '#a9616b', b: '#565a70', B: '#74798b',
  g: '#e2c8a6', k: '#39394f', w: '#e8ded0',
};

// 青灰外套和斜挎包让左侧角色的朝向在小画面上也看得清。
const player = [
  '.....oooooo....',
  '....ohHHHHho...',
  '...ohHHhhhhho..',
  '...ohhhhHHhho..',
  '...ohhhFFFFF...',
  '....ohfFFeFF...',
  '....ohfFFFFFf..',
  '.....ohFppFF...',
  '......offFF....',
  '.....oCCfCo....',
  '....oCCggCco...',
  '...oCCcCgCcco..',
  '...oCccCcgCco..',
  '...oCacCccgco..',
  '...occocccgco..',
  '...ofFocccsso..',
  '...offCccssso..',
  '.....occcsso...',
  '.....oBBBBbo...',
  '.....oBbooBo...',
  '.....oBboobo...',
  '.....oBboobo...',
  '.....oBboobo...',
  '.....okkoobo...',
  '....okggoogggo.',
];

// 深色长发和珊瑚色围巾与背景的暖车灯呼应。
const partner = [
  '....oooooo.....',
  '...ohHHHHho....',
  '..ohHHHhHHho...',
  '..ohHHhhhhhho..',
  '..oFhhhhhhhhho.',
  '..oFFeFhhhhhho.',
  '.fFFFFFfhhhhho.',
  '..FFppFfhhhhho.',
  '...FFFohhhhho..',
  '....otSSHhhho..',
  '...otSSSSshho..',
  '...otggSgShho..',
  '...ogggSgghho..',
  '...oggSogggso..',
  '...oggtogggso..',
  '...ofFoogggoo..',
  '...offgggggo...',
  '....ossssssso..',
  '....osstsssto..',
  '...osstssstso..',
  '...osstssstso..',
  '....oFFooffo...',
  '....oFFooffo...',
  '....okkoocco...',
  '...ogggoogggo..',
];

// 逐行贴像素，角色位置在这里取整以避免移动时产生模糊边。
function drawSprite(ctx: Paint, rows: string[], center: number) {
  const left = Math.round(center) - 7;
  const top = 128 - rows.length;
  for (const [y, row] of rows.entries()) {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') continue;
      ctx.fillStyle = colors[row[x]];
      ctx.fillRect(left + x, top + y, 1, 1);
    }
  }
}

// 位置条两端保留立绘半宽，亲吻演出将最后一步安排在两人之间。
export function drawActors(ctx: Paint, playerPosition: number, partnerPosition: number, pose: Pose) {
  let boy = Math.round(20 + playerPosition * 4.4);
  let girl = Math.round(20 + partnerPosition * 4.4);
  if (pose === 'kiss') {
    const middle = Math.round((boy + girl) / 2);
    boy = middle - 5;
    girl = middle + 5;
  }
  ctx.fillStyle = '#4c4456';
  for (const x of [boy, girl]) {
    ctx.fillRect(x - 8, 127, 17, 2);
    ctx.fillRect(x - 5, 129, 11, 1);
  }
  drawSprite(ctx, player, boy);
  drawSprite(ctx, partner, girl);

  // 递耳机时手伸向左边，耳机线仅在手边轻垂。
  if (pose === 'offer') {
    ctx.fillStyle = colors.g;
    ctx.fillRect(girl - 8, 116, 5, 2);
    ctx.fillStyle = colors.F;
    ctx.fillRect(girl - 10, 115, 3, 2);
    ctx.fillStyle = colors.w;
    ctx.fillRect(girl - 11, 113, 2, 2);
    ctx.fillRect(girl - 10, 117, 1, 4);
    ctx.fillRect(girl - 9, 121, 2, 1);
    ctx.fillRect(girl - 7, 118, 1, 3);
  }
}