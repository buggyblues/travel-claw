export function drawPixelCatPortrait(canvas: HTMLCanvasElement, paletteOverride?: Partial<Record<string, string>>): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const p = 4;
  const colors = {
    fur: '#f8c48b',
    furShadow: '#d9915f',
    stripe: '#8b563d',
    eye: '#3c6e71',
    eyeLight: '#d6fff6',
    nose: '#ff9aa2',
    outline: '#53343b',
    scarf: '#ff6f91',
    ...paletteOverride,
  };

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grid = [
    '....11....11........',
    '...1111..1111.......',
    '..111111111111......',
    '..122222222221......',
    '.12222222222221.....',
    '.12233322233321.....',
    '.12222222222221.....',
    '.12222444222221.....',
    '.12222000222221.....',
    '..122222662221......',
    '..122222222221......',
    '...1225555221.......',
    '....12222221........',
    '.....111111.........',
    '......7777..........',
    '.....777777.........',
  ];
  const map: Record<string, string | null> = {
    '.': null,
    '0': colors.eyeLight,
    '1': colors.outline,
    '2': colors.fur,
    '3': colors.stripe,
    '4': colors.eye,
    '5': colors.nose,
    '6': colors.furShadow,
    '7': colors.scarf,
  };

  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      const color = map[grid[y][x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * p, y * p, p, p);
    }
  }
}

export function makePhaserPixelCatTexture(scene: Phaser.Scene, key: string): void {
  if (scene.textures.exists(`${key}-0`)) return;
  const cell = 4;
  const palette = {
    fur: '#f7c88f',
    furShadow: '#d99a5f',
    outline: '#563b2d',
    stripe: '#9c6644',
    scarf: '#ff5d8f',
    eye: '#2a9d8f',
    eyeLight: '#f5fff8',
  };
  const frames = [
    [
      '....11....11....','...1111..1111...','..111111111111..','..122222222221..','.12222222222221.','.12233322333221.','.12224422244221.','.12220022200221.','.12222222222221.','..122266666221..','..122222222221..','...1277777721...','...1777777771...','..11..11..11....',
    ],
    [
      '....11....11....','...1111..1111...','..111111111111..','..122222222221..','.12222222222221.','.12233322333221.','.12224422244221.','.12220022200221.','.12222222222221.','..122266666221..','..122222222221..','...1277777721...','..11.17777771...','...11...11..11..',
    ],
    [
      '....11....11....','...1111..1111...','..111111111111..','..122222222221..','.12222222222221.','.12233322333221.','.12224422244221.','.12220022200221.','.12222222222221.','..122266666221..','..122222222221..','...1277777721...','...1777777711...','....11..11..11..',
    ],
    [
      '....11....11....','...1111..1111...','..111111111111..','..122222222221..','.12222222222221.','.12233322333221.','.12224422244221.','.12220022200221.','.12222222222221.','..122266666221..','..122222222221..','...1277777721...','...17777777.11..','..11..11...11...',
    ],
  ];
  const colorMap: Record<string, string | null> = {
    '.': null,
    '0': palette.eyeLight,
    '1': palette.outline,
    '2': palette.fur,
    '3': palette.stripe,
    '4': palette.eye,
    '6': palette.furShadow,
    '7': palette.scarf,
  };
  frames.forEach((sprite, frameIndex) => {
    const canvasTexture = scene.textures.createCanvas(`${key}-${frameIndex}`, 64, 64);
    if (!canvasTexture) return;
    const ctx = canvasTexture.getContext();
    sprite.forEach((row, y) => {
      [...row].forEach((value, x) => {
        const color = colorMap[value];
        if (!color) return;
        ctx.fillStyle = color;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      });
    });
    canvasTexture.refresh();
  });
}

export function createTone(context: AudioContext, frequency: number, duration: number, type: OscillatorType, gainValue = 0.02): void {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = gainValue;
  osc.connect(gain);
  gain.connect(context.destination);
  const now = context.currentTime;
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}
