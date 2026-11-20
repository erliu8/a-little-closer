// 自写的四小节短句在本机合成，桌面和网页端都无需下载音频。
const melody = [220, 329.63, 392, 369.99, 293.66, 329.63, 246.94, 293.66];

export function createAudio() {
  let context: AudioContext | undefined;
  let notes: OscillatorNode[] = [];
  let enabled = false;

  // 切换节点、暂停或关闭声音时，撤销整句中仍在排队的音符。
  function stop() {
    for (const note of notes) note.stop();
    notes = [];
  }

  // 音频设备由用户手势唤醒。平台拒绝启动时，调用方会显示实际错误。
  async function toggle() {
    if (enabled) {
      enabled = false;
      stop();
    } else {
      context ??= new AudioContext();
      await context.resume();
      enabled = true;
    }
    return enabled;
  }

  // 以游戏钟的进度选取乐句，从暂停处恢复时保持音画同步。
  function play(elapsedMs: number, remainingMs: number) {
    stop();
    if (!enabled || !context) return;
    const beat = 450;
    const start = context.currentTime + 0.015;
    for (let index = Math.ceil(elapsedMs / beat); index * beat < elapsedMs + remainingMs; index++) {
      const time = start + (index * beat - elapsedMs) / 1000;
      const voice = context.createOscillator();
      const volume = context.createGain();
      voice.type = 'sine';
      voice.frequency.value = melody[index % melody.length];
      volume.gain.setValueAtTime(0.0001, time);
      volume.gain.exponentialRampToValueAtTime(0.095, time + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);
      voice.connect(volume).connect(context.destination);
      voice.onended = () => { voice.disconnect(); volume.disconnect(); };
      voice.start(time);
      voice.stop(time + 0.34);
      notes.push(voice);
    }
  }
  return { toggle, play, stop };
}
