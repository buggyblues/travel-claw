import Phaser from 'phaser';
import { CITY_LOCATIONS } from '../data/cityLore';
import { renderCityModalContent } from '../renderers/cityModal';
import { renderHomePanel } from '../renderers/homePanel';
import { api } from '../systems/api';
import { createTone, drawPixelCatPortrait, makePhaserPixelCatTexture } from '../systems/pixelArt';
import type { Character, GameState, Location } from '../systems/types';
import type { UiRefs } from '../systems/ui';

type Marker = {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
};

type LandmarkMarker = {
  location: Location;
  sprite: Phaser.GameObjects.Star;
};

export class CozyWorldScene extends Phaser.Scene {
  private ui: UiRefs;
  private characters: Character[] = [];
  private currentCharacterId: string | null = null;
  private gameState: GameState | null = null;
  private markers = new Map<string, Marker>();
  private travelPath?: Phaser.GameObjects.Graphics;
  private mapOrigin = new Phaser.Math.Vector2(120, 100);
  private mapSize = new Phaser.Math.Vector2(960, 540);
  private audioCtx?: AudioContext;
  private worldContainer!: Phaser.GameObjects.Container;
  private worldGraphics!: Phaser.GameObjects.Graphics;
  private landmarkContainer!: Phaser.GameObjects.Container;
  private markerContainer!: Phaser.GameObjects.Container;
  private decorationContainer!: Phaser.GameObjects.Container;
  private landmarkMarkers: LandmarkMarker[] = [];
  private isDragging = false;
  private dragStart = new Phaser.Math.Vector2();
  private cameraStart = new Phaser.Math.Vector2();
  private dayOverlay?: Phaser.GameObjects.Rectangle;

  constructor(ui: UiRefs) {
    super('CozyWorldScene');
    this.ui = ui;
  }

  preload(): void {
    makePhaserPixelCatTexture(this, 'cat-traveler');
  }

  create(): void {
    this.worldContainer = this.add.container(0, 0);
    this.landmarkContainer = this.add.container(0, 0);
    this.markerContainer = this.add.container(0, 0);
    this.decorationContainer = this.add.container(0, 0);
    this.drawBackground();
    this.drawWorld();
    this.createDecorations();
    this.bindUi();
    this.bindMapControls();
    drawPixelCatPortrait(this.ui.heroPortrait);
    this.ui.authKeyInput.value = api.getAuthKey();
    this.updateAuthUi();
    void this.refreshAll().then(() => void this.autoBootstrapPlayer());
    this.time.addEvent({ delay: 10000, loop: true, callback: () => void this.refreshAll() });
  }

  private bindUi(): void {
    this.ui.playerSelect.addEventListener('change', () => {
      this.currentCharacterId = this.ui.playerSelect.value || null;
      void this.refreshState();
      this.playUiTone(440);
    });

    this.ui.saveAuthButton.addEventListener('click', () => {
      api.setAuthKey(this.ui.authKeyInput.value.trim());
      this.updateAuthUi();
      this.playUiTone(392);
    });

    this.ui.quickStartButton.addEventListener('click', () => {
      void this.quickStart();
    });

    this.ui.registerButton.addEventListener('click', async () => {
      const name = this.ui.registerNameInput.value.trim();
      if (!name) return this.setActionStatus('先给旅猫起个名字吧～', true);
      const result = await api.register(name);
      if (!result) return this.setActionStatus('注册失败，请稍后再试。', true);
      api.setAuthKey(result.authKey);
      this.ui.authKeyInput.value = result.authKey;
      this.currentCharacterId = result.character.id;
      this.ui.playerSelect.value = result.character.id;
      this.updateAuthUi();
      this.setActionStatus(`欢迎 ${result.character.name} 入住旅猫世界！`, false);
      await this.refreshAll();
      this.playUiTone(523.25);
    });

    this.ui.useCurrentButton.addEventListener('click', async () => {
      const me = await api.getMyState();
      if (!me) return this.setActionStatus('还没有 auth key，先注册或保存你的钥匙。', true);
      this.currentCharacterId = me.character.id;
      this.ui.playerSelect.value = me.character.id;
      await this.refreshAll();
      this.setActionStatus(`正在追踪 ${me.character.name} 的旅程。`, false);
    });

    this.ui.openHomeButton.addEventListener('click', () => {
      this.ui.homeOverlay.hidden = false;
      this.renderHomeOverlay();
    });

    this.ui.closeHomeButton.addEventListener('click', () => {
      this.ui.homeOverlay.hidden = true;
    });

    this.ui.homeOverlay.querySelector('.overlay-backdrop')?.addEventListener('click', () => {
      this.ui.homeOverlay.hidden = true;
    });

    this.ui.openCityButton.addEventListener('click', () => {
      this.openCurrentCity();
    });

    this.ui.closeCityButton.addEventListener('click', () => {
      this.ui.cityModal.hidden = true;
    });

    this.ui.cityModal.querySelector('.overlay-backdrop')?.addEventListener('click', () => {
      this.ui.cityModal.hidden = true;
    });

    this.ui.planTravelButton.addEventListener('click', async () => {
      const destination = this.ui.destinationInput.value.trim();
      if (!destination) return this.setActionStatus('请输入目的地。', true);
      const result = await api.planTravel(destination);
      if (!result) return this.setActionStatus('规划旅行失败，确认 auth key 与目的地。', true);
      this.setActionStatus(`已规划前往 ${destination} 的旅程。`, false);
      await this.refreshAll();
      this.playUiTone(493.88);
    });

    this.ui.startTravelButton.addEventListener('click', async () => {
      const result = await api.startTravel();
      if (!result) return this.setActionStatus('出发失败：可能还没规划旅程，或猫猫太累了。', true);
      this.setActionStatus('喵～出发啦！世界正在展开。', false);
      await this.refreshAll();
      this.playUiTone(659.25);
    });

    this.ui.actionButtons.forEach((button) => {
      button.addEventListener('click', () => void this.handleAction(button.dataset.action ?? ''));
    });
  }

  private async autoBootstrapPlayer(): Promise<void> {
    if (api.getAuthKey()) return;
    if (this.characters.length > 0) return;
    await this.quickStart();
  }

  private async quickStart(): Promise<void> {
    const randomName = `咪咪${Math.floor(Math.random() * 900 + 100)}`;
    const result = await api.register(randomName);
    if (!result) return this.setActionStatus('一键开玩失败，请稍后重试。', true);
    api.setAuthKey(result.authKey);
    this.ui.authKeyInput.value = result.authKey;
    this.currentCharacterId = result.character.id;
    this.updateAuthUi();
    this.setActionStatus(`已为你生成旅猫 ${result.character.name}，现在就能直接玩。`, false);
    await this.refreshAll();
    this.playUiTone(698.46);
  }

  private bindMapControls(): void {
    const camera = this.cameras.main;
    camera.setRoundPixels(true);
    camera.setBounds(0, 0, 1600, 1100);
    camera.centerOn(640, 360);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() || pointer.leftButtonDown()) {
        this.isDragging = true;
        this.dragStart.set(pointer.x, pointer.y);
        this.cameraStart.set(camera.scrollX, camera.scrollY);
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      camera.scrollX = this.cameraStart.x - (pointer.x - this.dragStart.x) / camera.zoom;
      camera.scrollY = this.cameraStart.y - (pointer.y - this.dragStart.y) / camera.zoom;
    });

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _objects: unknown, _deltaX: number, deltaY: number) => {
      camera.zoom = Phaser.Math.Clamp(camera.zoom - deltaY * 0.001, 0.7, 1.8);
    });
  }

  private async refreshAll(): Promise<void> {
    const health = await api.getHealth();
    this.ui.serverPill.textContent = health ? `在线 · v${health.version}` : '离线';
    this.ui.serverPill.classList.toggle('server-pill--offline', !health);

    const characters = await api.getCharacters();
    if (!characters) return;
    this.characters = characters;
    this.syncPlayerSelect();
    this.renderLeaderboard();
    this.renderMarkers();
    this.updateDayNightOverlay();

    if (!this.currentCharacterId && this.characters[0]) {
      this.currentCharacterId = this.characters[0].id;
      this.ui.playerSelect.value = this.currentCharacterId;
    }
    await this.refreshState();
  }

  private async refreshState(): Promise<void> {
    if (!this.currentCharacterId) return;
    const state = await api.getCharacterState(this.currentCharacterId);
    if (!state) return;
    const previousId = this.gameState?.character.id;
    this.gameState = state;
    this.renderHero(previousId !== state.character.id);
    this.renderQuests();
    this.renderFeed();
    this.renderNotes();
    this.renderCollections();
    this.renderTravelRoute();
    this.highlightCurrentMarker();
    this.focusCurrentCharacter();
    this.renderHomeOverlay();
  }

  private async handleAction(action: string): Promise<void> {
    const handlers: Record<string, () => Promise<unknown>> = {
      explore: () => api.explore(),
      photo: () => api.takePhoto(),
      poem: () => api.writePoem(),
      interact: () => api.interact(),
      rest: () => api.rest(),
      eat: () => api.eat(),
      quest: () => api.generateQuest(),
      npc: () => api.encounterNpc(),
      harvest: () => api.harvestGarden(),
      note: () => {
        const content = this.ui.noteInput.value.trim();
        if (!content) {
          this.setActionStatus('先写一句留言再发送吧。', true);
          return Promise.resolve(null);
        }
        return api.leaveMessage(content);
      },
    };
    const handler = handlers[action];
    if (!handler) return;
    const result = await handler();
    if (!result) return this.setActionStatus(`动作失败：${action} 这次没有成功。`, true);
    if (action === 'note') this.ui.noteInput.value = '';
    this.setActionStatus(`动作完成：${action}，旅猫世界已刷新。`, false);
    await this.refreshAll();
    this.playUiTone(587.33);
  }

  private updateAuthUi(): void {
    const authKey = api.getAuthKey();
    this.ui.authStatus.textContent = authKey
      ? `已绑定 auth key：${authKey.slice(0, 6)}••••${authKey.slice(-4)}，可直接在网页中操作旅猫。`
      : '未绑定 auth key，将以旁观模式浏览。';
    this.ui.authStatus.classList.toggle('status-banner--warn', !authKey);
  }

  private setActionStatus(message: string, isError: boolean): void {
    this.ui.actionStatus.textContent = message;
    this.ui.actionStatus.classList.toggle('status-banner--warn', isError);
  }

  private syncPlayerSelect(): void {
    const select = this.ui.playerSelect;
    const selected = this.currentCharacterId;
    select.innerHTML = '';
    for (const character of this.characters) {
      const option = document.createElement('option');
      option.value = character.id;
      option.textContent = `🐱 ${character.name}`;
      select.appendChild(option);
    }
    if (selected) select.value = selected;
  }

  private renderHero(changed: boolean): void {
    if (!this.gameState) return;
    const { character, weather } = this.gameState;
    this.ui.heroName.textContent = `🐱 ${character.name}`;
    this.ui.heroLocation.textContent = `${character.currentLocation.name} · ${character.currentLocation.city}, ${character.currentLocation.country}`;
    this.ui.heroWeather.textContent = `天气 · ${weather.type} · ${weather.description}`;

    const stats = [
      ['生命', character.stats.health, '#ff7a8a'],
      ['心情', character.stats.mood, '#ffc857'],
      ['疲劳', character.stats.fatigue, '#85c7f2'],
      ['饥饿', character.stats.hunger, '#f7a35c'],
      ['金币', character.stats.money, '#f4e285'],
      ['经验', character.stats.experience, '#9d94ff'],
    ];
    this.ui.heroStats.innerHTML = stats.map(([label, value, color]) => `
      <div class="stat-card">
        <div class="stat-card__label">${label}</div>
        <div class="stat-card__value">${value}</div>
        <div class="stat-card__bar"><span style="width:${Math.min(Number(value), 100)}%; background:${color}"></span></div>
      </div>
    `).join('');

    const palette = changed ? { scarf: '#9d94ff' } : undefined;
    drawPixelCatPortrait(this.ui.heroPortrait, palette);
    if (changed) this.playUiTone(523.25);
  }

  private renderLeaderboard(): void {
    if (this.characters.length === 0) {
      this.ui.leaderboard.innerHTML = '<div class="empty">暂无旅猫</div>';
      return;
    }
    const sorted = [...this.characters].sort((a, b) => b.stats.experience - a.stats.experience);
    this.ui.leaderboard.innerHTML = sorted.map((character, index) => `
      <button class="list-item leaderboard-item ${character.id === this.currentCharacterId ? 'is-active' : ''}" data-character-id="${character.id}">
        <span class="rank">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}</span>
        <span class="main">${character.name}</span>
        <span class="meta">⭐ ${character.stats.experience}</span>
      </button>
    `).join('');

    for (const node of this.ui.leaderboard.querySelectorAll<HTMLButtonElement>('[data-character-id]')) {
      node.onclick = () => {
        this.currentCharacterId = node.dataset.characterId ?? null;
        if (this.currentCharacterId) {
          this.ui.playerSelect.value = this.currentCharacterId;
          void this.refreshState();
          this.renderLeaderboard();
          this.playUiTone(659.25);
        }
      };
    }
  }

  private renderQuests(): void {
    if (!this.gameState || this.gameState.quests.length === 0) {
      this.ui.quests.innerHTML = '<div class="empty">今天先轻松逛逛吧～</div>';
      return;
    }
    this.ui.quests.innerHTML = this.gameState.quests.map((quest) => {
      const progress = Math.min(100, (quest.currentCount / Math.max(quest.targetCount, 1)) * 100);
      return `
        <article class="list-item quest-item ${quest.status === 'completed' ? 'is-complete' : ''}">
          <div class="main">${quest.status === 'completed' ? '✅' : '🌟'} ${quest.title}</div>
          <div class="meta">${quest.description}</div>
          <div class="progress"><span style="width:${progress}%"></span></div>
          <div class="meta">${quest.currentCount}/${quest.targetCount} · 奖励 ${quest.reward?.money ?? 0} 金币 / ${quest.reward?.xp ?? 0} XP</div>
        </article>
      `;
    }).join('');
  }

  private renderFeed(): void {
    if (!this.gameState) return;
    const items = [
      ...this.gameState.randomEvents.map((item) => ({ time: item.timestamp, text: `⚡ ${item.title}：${item.description}` })),
      ...this.gameState.npcEncounters.map((item) => ({ time: item.timestamp, text: `🐾 ${item.npc?.name ?? '神秘旅伴'}：${item.dialogue}` })),
      ...this.gameState.travelHistory.map((item) => ({ time: item.arrivedAt, text: `🗺️ 到达 ${item.location.name}` })),
    ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 14);

    this.ui.feed.innerHTML = items.length > 0
      ? items.map((item) => `<div class="list-item"><div class="main">${item.text}</div><div class="meta">${formatTime(item.time)}</div></div>`).join('')
      : '<div class="empty">世界正在缓缓流动中…</div>';
  }

  private renderNotes(): void {
    if (!this.gameState || this.gameState.messages.length === 0) {
      this.ui.notes.innerHTML = '<div class="empty">还没有旅人留下纸条。</div>';
      return;
    }
    this.ui.notes.innerHTML = this.gameState.messages.slice(0, 12).map((message) => `
      <div class="list-item">
        <div class="main">✉️ ${message.content}</div>
        <div class="meta">${message.author} · ${message.location.city} · ${formatTime(message.leftAt)}</div>
      </div>
    `).join('');
  }

  private renderCollections(): void {
    if (!this.gameState) return;
    const { friends, titles, backpack, photos, poems, artworks, souvenirs, lotteryHistory, garden } = this.gameState;
    const lines = [
      `📸 照片 ${photos.length} 张`,
      `📝 诗歌 ${poems.length} 首`,
      `🎨 画作 ${artworks.length} 幅`,
      `🎁 纪念品 ${souvenirs.length} 件`,
      `🐾 朋友 ${friends.length} 位`,
      `🏅 称号 ${titles.length} 个`,
      `🎒 背包 ${backpack.length} 格`,
      `🎰 抽奖 ${lotteryHistory.length} 次`,
      `🍀 三叶草 ${garden.clovers} / 四叶草 ${garden.fourLeafClovers}`,
    ];
    this.ui.collections.innerHTML = lines.map((text) => `<div class="list-item"><div class="main">${text}</div></div>`).join('');
  }

  private renderHomeOverlay(): void {
    const content = renderHomePanel(this.gameState);
    this.ui.homeStats.innerHTML = content.statsHtml;
    this.ui.homeFriends.innerHTML = content.friendsHtml;
    this.ui.homeBackpack.innerHTML = content.backpackHtml;
  }

  private openCurrentCity(): void {
    if (!this.gameState) return;
    this.openCityModal(this.gameState.character.currentLocation);
  }

  private openCityModal(location: Location): void {
    this.ui.cityTitle.textContent = `${location.name}`;
    this.ui.citySubtitle.textContent = `${location.city}, ${location.country} · 像素旅猫正在这里留下故事`;
    this.ui.cityBody.innerHTML = renderCityModalContent(location, this.gameState);
    this.ui.cityModal.hidden = false;
  }

  private renderMarkers(): void {
    for (const marker of this.markers.values()) {
      marker.sprite.destroy();
      marker.label.destroy();
    }
    this.markers.clear();

    for (const character of this.characters) {
      const pos = this.project(character.currentLocation.coordinates.lng, character.currentLocation.coordinates.lat);
      const sprite = this.add.sprite(pos.x, pos.y, 'cat-traveler-0').setOrigin(0.5, 1).setScale(0.72);
      sprite.setInteractive({ useHandCursor: true });
      this.markerContainer.add(sprite);
      const label = this.add.text(pos.x, pos.y + 8, character.name, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#23314d',
        backgroundColor: '#fff5dc',
        padding: { left: 5, right: 5, top: 2, bottom: 2 },
      }).setOrigin(0.5, 0);
      this.markerContainer.add(label);
      sprite.on('pointerdown', () => {
        this.currentCharacterId = character.id;
        this.ui.playerSelect.value = character.id;
        void this.refreshState();
        this.renderLeaderboard();
      });
      this.tweens.add({ targets: sprite, y: pos.y - 6, duration: 1200 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.time.addEvent({ delay: 220, loop: true, callback: () => {
        const frame = Number(sprite.getData('frame') ?? 0);
        const next = (frame + 1) % 4;
        sprite.setTexture(`cat-traveler-${next}`);
        sprite.setData('frame', next);
      } });
      this.markers.set(character.id, { id: character.id, sprite, label });
    }
    this.highlightCurrentMarker();
  }

  private highlightCurrentMarker(): void {
    for (const [id, marker] of this.markers.entries()) {
      const active = id === this.currentCharacterId;
      marker.sprite.setTint(active ? 0xffffff : 0xfff1cf);
      marker.label.setStyle({ backgroundColor: active ? '#ffdc8b' : '#fff5dc' });
      marker.label.setScale(active ? 1.03 : 1);
    }
  }

  private renderTravelRoute(): void {
    this.travelPath?.destroy();
    if (!this.gameState?.travelPlan?.route || this.gameState.travelPlan.route.length < 2) return;
    this.travelPath = this.add.graphics();
    this.travelPath.lineStyle(3, 0xff7eb6, 1);
    const route = this.gameState.travelPlan.route.map((step) => this.project(step.lng, step.lat));
    this.travelPath.beginPath();
    this.travelPath.moveTo(route[0].x, route[0].y);
    route.slice(1).forEach((point) => this.travelPath?.lineTo(point.x, point.y));
    this.travelPath.strokePath();
    this.markerContainer.add(this.travelPath);
  }

  private drawBackground(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x8be0ff, 0x8be0ff, 0xfff3d1, 0xfff3d1, 1);
    sky.fillRect(0, 0, width, height);

    const sun = this.add.circle(width - 130, 110, 50, 0xffef9f, 1);
    sun.setStrokeStyle(8, 0xffd166, 0.45);
    this.dayOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x1b2140, 0.06).setScrollFactor(0);

    for (let i = 0; i < 5; i += 1) {
      const cloud = this.add.container(170 + i * 220, 70 + (i % 2) * 40);
      cloud.add(this.add.ellipse(-25, 8, 70, 35, 0xffffff, 0.8));
      cloud.add(this.add.ellipse(0, 0, 90, 45, 0xffffff, 0.92));
      cloud.add(this.add.ellipse(28, 10, 55, 32, 0xffffff, 0.86));
      this.tweens.add({ targets: cloud, x: cloud.x + 40, duration: 12000 + i * 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  private drawWorld(): void {
    this.worldGraphics = this.add.graphics();
    const world = this.worldGraphics;
    this.worldContainer.add(world);
    world.fillStyle(0x6cc46f, 1);
    world.lineStyle(6, 0x3f7d44, 1);

    const polygons: Array<Array<[number, number]>> = [
      [[-168, 72], [-150, 62], [-135, 58], [-126, 48], [-110, 34], [-96, 18], [-78, 8], [-58, 20], [-52, 45], [-70, 58], [-110, 72]],
      [[-80, 8], [-72, -8], [-68, -25], [-62, -38], [-58, -52], [-48, -36], [-40, -18], [-36, -4], [-52, 6]],
      [[-12, 36], [4, 46], [12, 58], [28, 62], [42, 56], [36, 42], [22, 36], [10, 36], [2, 40]],
      [[-18, 16], [-8, 34], [10, 36], [24, 29], [38, 15], [32, -4], [24, -20], [16, -34], [0, -30], [-8, -8]],
      [[38, 12], [48, 34], [78, 46], [112, 58], [146, 50], [164, 66], [178, 62], [160, 44], [130, 18], [108, 0], [88, 6], [70, 22], [54, 24]],
      [[114, -10], [122, -22], [136, -34], [152, -34], [154, -18], [140, -8], [124, -10]],
    ];

    for (const polygon of polygons) {
      const points = polygon.map(([lng, lat]) => this.project(lng, lat));
      world.beginPath();
      world.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => world.lineTo(point.x, point.y));
      world.closePath();
      world.fillPath();
      world.strokePath();
    }

    for (const landmark of CITY_LOCATIONS) {
      const point = this.project(landmark.coordinates.lng, landmark.coordinates.lat);
      const star = this.add.star(point.x, point.y, 5, 5, 10, 0xf4d35e);
      star.setStrokeStyle(2, 0xd89216, 1);
      star.setInteractive(new Phaser.Geom.Circle(0, 0, 14), Phaser.Geom.Circle.Contains);
      star.on('pointerdown', () => this.openCityModal(landmark));
      this.landmarkContainer.add(star);
      this.landmarkMarkers.push({ location: landmark, sprite: star });
      this.tweens.add({ targets: star, alpha: 0.35, duration: 900 + Math.random() * 500, repeat: -1, yoyo: true });
    }
  }

  private createDecorations(): void {
    for (let i = 0; i < 30; i += 1) {
      const flower = this.add.circle(
        Phaser.Math.Between(100, this.scale.width - 80),
        Phaser.Math.Between(this.scale.height - 150, this.scale.height - 30),
        Phaser.Math.Between(2, 4),
        Phaser.Math.RND.pick([0xffadad, 0xffd6a5, 0xfdffb6, 0xcaffbf, 0xa0c4ff]),
      );
      this.decorationContainer.add(flower);
      this.tweens.add({ targets: flower, scale: 1.4, duration: 1200 + Math.random() * 1500, yoyo: true, repeat: -1 });
    }
  }

  private updateDayNightOverlay(): void {
    if (!this.dayOverlay || !this.gameState?.weather) return;
    const hour = new Date().getHours();
    const baseAlpha = hour >= 19 || hour < 6 ? 0.22 : hour >= 17 ? 0.12 : 0.04;
    const weatherBoost = ['stormy', 'foggy', 'rainy'].includes(this.gameState.weather.type) ? 0.08 : 0;
    this.dayOverlay.setAlpha(baseAlpha + weatherBoost);
  }

  private focusCurrentCharacter(): void {
    if (!this.currentCharacterId) return;
    const marker = this.markers.get(this.currentCharacterId);
    if (!marker) return;
    this.cameras.main.pan(marker.sprite.x, marker.sprite.y, 500, 'Sine.easeOut');
  }

  private project(lng: number, lat: number): Phaser.Math.Vector2 {
    const x = this.mapOrigin.x + ((lng + 180) / 360) * this.mapSize.x;
    const y = this.mapOrigin.y + ((90 - lat) / 180) * this.mapSize.y;
    return new Phaser.Math.Vector2(x, y);
  }

  private playUiTone(freq: number): void {
    if (!this.audioCtx) {
      const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.audioCtx = new Ctx();
    }
    createTone(this.audioCtx, freq, 0.18, 'square');
  }
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
