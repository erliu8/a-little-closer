// 站台使用固定像素坐标绘制，角色移动时复用同一幅背景。
export const STAGE_WIDTH = 480;
export const STAGE_HEIGHT = 156;

type Paint = CanvasRenderingContext2D;

// 用整像素铺色，避免小灯、站台边线和人物衣摆在放大后发虚。
function rect(ctx: Paint, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// 城市的窗灯和楼高由位置决定，整场重绘后仍是同一座城市。
function skyline(ctx: Paint, base: number, far: boolean) {
  const step = far ? 12 : 18;
  for (let x = -6, i = 0; x < STAGE_WIDTH; x += step, i++) {
    const h = (far ? 8 : 12) + ((i * 19 + i * i * 3) % (far ? 22 : 28));
    const y = base - h;
    rect(ctx, far ? '#675777' : '#48455f', x, y, step - 1, h);
    if (i % 3 === 0) rect(ctx, far ? '#675777' : '#48455f', x + 3, y - 4, 4, 5);
    for (let row = 0; row < h - 5; row += 5) {
      for (let col = 2; col < step - 3; col += 4) {
        if ((row + col + i * 3) % 7 < 2) {
          rect(ctx, far ? '#a07987' : '#c28784', x + col, y + row + 3, 2, 1);
        }
      }
    }
  }
}

// 多层色带、远岸与通勤列车把人物留在最清楚的前景轮廓上。
export function drawPlatform(ctx: Paint) {
  const sky = ctx.createLinearGradient(0, 0, 0, 96);
  sky.addColorStop(0, '#272c50');
  sky.addColorStop(0.43, '#575078');
  sky.addColorStop(0.76, '#ae7785');
  sky.addColorStop(1, '#f1a483');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

  // 薄云、几颗初星和阶梯形月面构成傍晚天空。
  for (const [x, y, w] of [[29,40,44],[126,47,59],[187,31,30],[230,49,46],[380,37,59],[421,44,34]]) {
    rect(ctx, '#89718a', x, y, w, 1);
    rect(ctx, '#796783', x + 8, y - 1, Math.max(3, w - 22), 1);
  }
  for (const [x, y] of [[43,20],[119,14],[173,34],[207,16],[243,28],[278,9],[351,19],[408,16],[448,30]]) {
    rect(ctx, '#ecd4bf', x, y, 1, 1);
  }
  rect(ctx, '#eec3a8', 329, 20, 8, 13);
  rect(ctx, '#f8d9b7', 327, 22, 12, 9);
  rect(ctx, '#ffe2bf', 326, 24, 14, 5);
  skyline(ctx, 89, true);
  skyline(ctx, 99, false);

  // 远处电车车窗和车头灯形成地平线的一条暖光。
  rect(ctx, '#36364d', 184, 92, 296, 12);
  rect(ctx, '#b78283', 201, 86, 279, 2);
  rect(ctx, '#88717d', 196, 88, 284, 3);
  rect(ctx, '#6b6273', 190, 91, 290, 9);
  rect(ctx, '#55536a', 187, 94, 9, 6);
  for (let x = 200, i = 0; x < 480; x += 14, i++) {
    rect(ctx, i % 4 === 0 ? '#b68d87' : '#ddb296', x, 90, 9, 5);
    rect(ctx, '#897880', x + 4, 90, 1, 5);
  }
  rect(ctx, '#ffdfab', 188, 96, 4, 2);
  rect(ctx, '#c28681', 191, 98, 289, 1);

  // 对岸栏杆与铁轨之间留下窄缝，区分站台的纵深。
  rect(ctx, '#363449', 0, 101, 480, 12);
  for (let x = 8; x < 480; x += 27) rect(ctx, '#4b4354', x, 97, 2, 11);
  rect(ctx, '#695663', 0, 98, 480, 1);
  rect(ctx, '#bb9183', 0, 107, 480, 1);
  rect(ctx, '#282b40', 0, 109, 480, 2);
  rect(ctx, '#90777a', 0, 112, 480, 1);

  // 雨棚左重右轻，在画框里自然围住人物和开阔的天空。
  rect(ctx, '#232a3d', 0, 0, 150, 5);
  for (let y = 0; y < 10; y++) rect(ctx, '#303247', 0, y + 4, 149 - y * 2, 1);
  rect(ctx, '#856773', 0, 13, 131, 2);
  rect(ctx, '#262b3c', 0, 15, 125, 2);
  for (const x of [9, 71]) {
    rect(ctx, '#292c3d', x, 15, 4, 105);
    rect(ctx, '#756274', x + 3, 19, 1, 99);
    for (let k = 0; k < 12; k++) rect(ctx, '#38394a', x + 4 + k, 27 - k, 2, 2);
  }
  rect(ctx, '#c68f83', 22, 17, 54, 2);
  rect(ctx, '#ffe2ae', 24, 17, 49, 1);

  // 月台前沿、站柱和长椅的脚都落在同一条透视基线上。
  rect(ctx, '#625563', 0, 114, 480, 37);
  rect(ctx, '#b69387', 0, 114, 480, 2);
  rect(ctx, '#51495b', 0, 118, 480, 1);
  for (let x = -40; x < 480; x += 43) {
    for (let y = 0; y < 25; y++) rect(ctx, '#574d60', x - Math.floor(y / 3), 119 + y, 1, 1);
  }
  rect(ctx, '#ba9480', 0, 137, 480, 1);
  rect(ctx, '#d7a47e', 0, 139, 480, 3);
  for (let x = 2; x < 480; x += 5) rect(ctx, '#98746f', x, 140, 2, 1);
  rect(ctx, '#806974', 0, 143, 480, 2);
  rect(ctx, '#3a394e', 0, 145, 480, 11);

  // 站牌的车次号属于场景本身，画面说明由上层界面提供。
  rect(ctx, '#282c40', 34, 18, 2, 7);
  rect(ctx, '#282c40', 60, 18, 2, 7);
  rect(ctx, '#20283b', 27, 24, 43, 14);
  rect(ctx, '#8a7c87', 27, 24, 43, 1);
  rect(ctx, '#efbf91', 32, 28, 2, 6);
  rect(ctx, '#efbf91', 35, 28, 2, 6);
  rect(ctx, '#8f8793', 42, 29, 20, 1);
  rect(ctx, '#666778', 42, 32, 14, 1);
  for (const y of [102, 106, 112]) rect(ctx, '#ad8079', 29, y, 49, 2);
  rect(ctx, '#674f5c', 29, 114, 49, 2);
  for (const x of [34, 70]) rect(ctx, '#343346', x, 104, 2, 16);

  // 路灯用低透明度光晕，灯芯仍保持像素边缘。
  for (const x of [154, 398]) {
    rect(ctx, '#504657', x, 61, 2, 54);
    rect(ctx, '#967878', x + 1, 62, 1, 50);
    rect(ctx, '#4f485b', x - 10, 60, 12, 2);
    const glow = ctx.createRadialGradient(x - 8, 63, 0, x - 8, 63, 16);
    glow.addColorStop(0, 'rgba(255,200,139,.38)');
    glow.addColorStop(1, 'rgba(255,200,139,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 24, 47, 32, 32);
    rect(ctx, '#f9ce9c', x - 11, 62, 7, 2);
  }
}