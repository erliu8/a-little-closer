// 浏览器输入只产生轨道位移；互动时机和好感由游戏规则决定。
type MovementHandlers = {
  enabled: () => boolean;
  move: (delta: number, seconds: number) => void;
  pause: () => void;
};

export function bindMovement(track: HTMLElement, handlers: MovementHandlers): () => void {
  const subscriptions = new AbortController();
  const options = { signal: subscriptions.signal };
  const arrows = new Set<string>();
  let frame = 0;
  let lastFrame = 0;
  let drag: { id: number; x: number; time: number; width: number; needsShift: boolean } | null = null;

  // 先清空内部状态，再释放捕获，避免稍后送达的失捕事件重复处理。
  function stop(): void {
    arrows.clear();
    cancelAnimationFrame(frame);
    frame = 0;
    const id = drag?.id;
    drag = null;
    if (id !== undefined && track.hasPointerCapture(id)) track.releasePointerCapture(id);
  }

  // 方向键按真实帧间隔前进，两键同时按下时原地停步。
  function walk(now: number): void {
    frame = 0;
    if (!handlers.enabled()) return stop();
    const seconds = (now - lastFrame) / 1000;
    const direction = Number(arrows.has('ArrowRight')) - Number(arrows.has('ArrowLeft'));
    if (direction && seconds > 0) handlers.move(direction * 18 * seconds, seconds);
    lastFrame = now;
    if (arrows.size && handlers.enabled()) frame = requestAnimationFrame(walk);
    else stop();
  }

  // 不采用键盘自动重复频率，让不同系统下的步速一致。
  window.addEventListener('keydown', (event) => {
    if (!event.shiftKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    if (drag || !handlers.enabled()) return;
    event.preventDefault();
    if (event.repeat) return;
    arrows.add(event.key);
    if (!frame) {
      lastFrame = performance.now();
      frame = requestAnimationFrame(walk);
    }
  }, options);

  window.addEventListener('keyup', (event) => {
    if (event.key === 'Shift' && !event.shiftKey && (drag?.needsShift || arrows.size)) return stop();
    if (!arrows.delete(event.key)) return;
    if (!arrows.size) stop();
  }, options);

  // 从落指处计算相对位移，按在轨道任意位置都不会让角色瞬移。
  track.addEventListener('pointerdown', (event) => {
    const needsShift = event.pointerType !== 'touch';
    if (drag || !event.isPrimary || event.button !== 0 || (needsShift && !event.shiftKey) || !handlers.enabled()) return;
    event.preventDefault();
    stop();
    track.focus({ preventScroll: true });
    track.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, x: event.clientX, time: event.timeStamp,
      width: track.getBoundingClientRect().width, needsShift };
  }, options);

  // 高频鼠标事件按约两帧汇总，松手时提交最后一段实际拖动。
  function sample(event: PointerEvent, final: boolean): void {
    if (!drag || event.pointerId !== drag.id) return;
    if (!handlers.enabled() || (drag.needsShift && !event.shiftKey)) return stop();
    const elapsed = event.timeStamp - drag.time;
    if (elapsed <= 0 || (!final && elapsed < 32)) return;
    const delta = (event.clientX - drag.x) / drag.width * 100;
    drag.x = event.clientX;
    drag.time = event.timeStamp;
    if (delta) handlers.move(delta, elapsed / 1000);
  }
  track.addEventListener('pointermove', (event) => sample(event, false), options);
  track.addEventListener('pointerup', (event) => {
    if (event.pointerId !== drag?.id) return;
    sample(event, true);
    stop();
  }, options);

  // 取消、失捕、切出页面时清空输入，恢复焦点后必须重新操作。
  function cancelDrag(event: PointerEvent): void {
    if (event.pointerId === drag?.id) stop();
  }
  track.addEventListener('pointercancel', cancelDrag, options);
  track.addEventListener('lostpointercapture', cancelDrag, options);
  function pause(): void {
    stop();
    handlers.pause();
  }
  window.addEventListener('blur', pause, options);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  }, options);

  // 卸载页面适配层时一并解除监听和当前输入。
  return () => {
    subscriptions.abort();
    stop();
  };
}