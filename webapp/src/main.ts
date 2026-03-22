import './styles/main.css';
import Phaser from 'phaser';
import { CozyWorldScene } from './game/scenes/CozyWorldScene';
import type { UiRefs } from './game/systems/ui';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('App container not found');
}

app.innerHTML = `
  <div class="shell">
    <div class="shell__topbar pixel-panel pixel-panel--gold">
      <div class="brand">
        <div class="brand__icon">🐾</div>
        <div>
          <div class="brand__title">Pixel Cat Odyssey</div>
          <div class="brand__subtitle">一只像素猫咪的世界旅行见闻录</div>
        </div>
      </div>
      <div class="topbar__right">
        <button id="quick-start-button" class="pixel-button pixel-button--mint">一键开玩</button>
        <div class="auth-cluster pixel-chip">
          <input id="auth-key-input" class="pixel-input" placeholder="输入 auth key" />
          <button id="save-auth-button" class="pixel-button">保存钥匙</button>
        </div>
        <div class="auth-cluster pixel-chip">
          <input id="register-name-input" class="pixel-input" placeholder="新建旅猫名字" />
          <button id="register-button" class="pixel-button pixel-button--rose">注册</button>
        </div>
        <label class="selector">
          <span>观察对象</span>
          <select id="player-select"></select>
        </label>
        <button id="open-home-button" class="pixel-button">家园</button>
        <button id="open-city-button" class="pixel-button pixel-button--rose">城市</button>
        <button id="use-current-button" class="pixel-button pixel-button--gold">看我的猫</button>
        <div class="server-pill" id="server-pill">连接中…</div>
      </div>
    </div>

    <div class="shell__main">
      <section class="canvas-wrap pixel-panel pixel-panel--sky">
        <div id="game-root" class="game-root"></div>
        <div class="map-note pixel-panel pixel-panel--ink">像素地图为风格化示意，不代表任何边界与主权立场。</div>
      </section>

      <aside class="hud-column">
        <section class="pixel-panel panel-card panel-card--hero">
          <div class="panel-card__title">旅行操作台</div>
          <div id="auth-status" class="status-banner">未绑定 auth key，将以旁观模式浏览。</div>
          <div class="action-row action-row--travel">
            <input id="destination-input" class="pixel-input pixel-input--wide" placeholder="输入目的地，如 Tokyo / Paris / Rome" />
            <button id="plan-travel-button" class="pixel-button">规划</button>
            <button id="start-travel-button" class="pixel-button pixel-button--gold">出发</button>
          </div>
          <div class="action-grid">
            <button class="pixel-button" data-action="explore">探索</button>
            <button class="pixel-button" data-action="photo">拍照</button>
            <button class="pixel-button" data-action="poem">写诗</button>
            <button class="pixel-button" data-action="interact">互动</button>
            <button class="pixel-button" data-action="rest">休息</button>
            <button class="pixel-button" data-action="eat">吃饭</button>
            <button class="pixel-button" data-action="quest">新任务</button>
            <button class="pixel-button" data-action="npc">遇 NPC</button>
            <button class="pixel-button" data-action="harvest">收花园</button>
          </div>
          <div class="action-row">
            <input id="note-input" class="pixel-input pixel-input--wide" placeholder="给世界留下一句温柔的猫猫笔记…" />
            <button class="pixel-button pixel-button--mint" data-action="note">留言</button>
          </div>
          <div id="action-status" class="status-banner status-banner--soft">提示：鼠标拖拽地图，滚轮缩放，点地图上的猫可以切换观察对象。</div>
        </section>

        <section class="pixel-panel panel-card panel-card--hero">
          <div class="panel-card__title">旅猫状态</div>
          <div class="hero-card">
            <div class="hero-card__portrait">
              <canvas id="hero-portrait" width="80" height="80"></canvas>
            </div>
            <div class="hero-card__meta">
              <div id="hero-name" class="hero-name">等待旅猫出现…</div>
              <div id="hero-location" class="hero-location">世界的某个角落</div>
              <div id="hero-weather" class="hero-weather">天气 · --</div>
            </div>
          </div>
          <div id="hero-stats" class="stat-grid"></div>
        </section>

        <section class="pixel-panel panel-card">
          <div class="panel-card__title">排行榜</div>
          <div id="leaderboard" class="list"></div>
        </section>

        <section class="pixel-panel panel-card">
          <div class="panel-card__title">当前任务</div>
          <div id="quests" class="list"></div>
        </section>
      </aside>
    </div>

    <div class="shell__bottom">
      <section class="pixel-panel panel-card panel-card--wide">
        <div class="panel-card__title">旅途见闻</div>
        <div class="triptych">
          <div>
            <div class="subheading">动态播报</div>
            <div id="feed" class="list list--tall"></div>
          </div>
          <div>
            <div class="subheading">留下的笔记</div>
            <div id="notes" class="list list--tall"></div>
          </div>
          <div>
            <div class="subheading">收集与社交</div>
            <div id="collections" class="list list--tall"></div>
          </div>
        </div>
      </section>
    </div>

    <div id="home-overlay" class="overlay-shell" hidden>
      <div class="overlay-backdrop"></div>
      <section class="overlay-card pixel-panel">
        <div class="overlay-card__header">
          <div>
            <div class="panel-card__title">猫咪家园</div>
            <div class="overlay-subtitle">像素旅舍 · 花园、朋友和旅途纪念都在这里</div>
          </div>
          <button id="close-home-button" class="pixel-button pixel-button--rose">关闭</button>
        </div>
        <div class="home-scene-wrap">
          <div id="home-scene" class="home-scene">
            <div class="home-sun"></div>
            <div class="home-house"></div>
            <div class="home-tree home-tree--1"></div>
            <div class="home-tree home-tree--2"></div>
            <div class="home-cat-bed"></div>
            <div class="home-garden-patch"></div>
          </div>
        </div>
        <div class="overlay-grid">
          <div>
            <div class="subheading">家园状态</div>
            <div id="home-stats" class="list"></div>
          </div>
          <div>
            <div class="subheading">猫猫朋友</div>
            <div id="home-friends" class="list"></div>
          </div>
          <div>
            <div class="subheading">收纳柜</div>
            <div id="home-backpack" class="list"></div>
          </div>
        </div>
      </section>
    </div>

    <div id="city-modal" class="overlay-shell" hidden>
      <div class="overlay-backdrop"></div>
      <section class="overlay-card overlay-card--city pixel-panel">
        <div class="overlay-card__header">
          <div>
            <div id="city-title" class="panel-card__title">城市详情</div>
            <div id="city-subtitle" class="overlay-subtitle">世界某处，正发生可爱的旅行故事</div>
          </div>
          <button id="close-city-button" class="pixel-button pixel-button--rose">关闭</button>
        </div>
        <div id="city-body" class="city-body"></div>
      </section>
    </div>
  </div>
`;

const uiRefs: UiRefs = {
  playerSelect: document.querySelector('#player-select')!,
  serverPill: document.querySelector('#server-pill')!,
  quickStartButton: document.querySelector('#quick-start-button')!,
  openHomeButton: document.querySelector('#open-home-button')!,
  openCityButton: document.querySelector('#open-city-button')!,
  authKeyInput: document.querySelector('#auth-key-input')!,
  registerNameInput: document.querySelector('#register-name-input')!,
  destinationInput: document.querySelector('#destination-input')!,
  noteInput: document.querySelector('#note-input')!,
  authStatus: document.querySelector('#auth-status')!,
  actionStatus: document.querySelector('#action-status')!,
  saveAuthButton: document.querySelector('#save-auth-button')!,
  registerButton: document.querySelector('#register-button')!,
  useCurrentButton: document.querySelector('#use-current-button')!,
  planTravelButton: document.querySelector('#plan-travel-button')!,
  startTravelButton: document.querySelector('#start-travel-button')!,
  actionButtons: document.querySelectorAll<HTMLButtonElement>('[data-action]'),
  heroName: document.querySelector('#hero-name')!,
  heroLocation: document.querySelector('#hero-location')!,
  heroWeather: document.querySelector('#hero-weather')!,
  heroStats: document.querySelector('#hero-stats')!,
  leaderboard: document.querySelector('#leaderboard')!,
  quests: document.querySelector('#quests')!,
  feed: document.querySelector('#feed')!,
  notes: document.querySelector('#notes')!,
  collections: document.querySelector('#collections')!,
  heroPortrait: document.querySelector('#hero-portrait')!,
  homeOverlay: document.querySelector('#home-overlay')!,
  closeHomeButton: document.querySelector('#close-home-button')!,
  homeScene: document.querySelector('#home-scene')!,
  homeStats: document.querySelector('#home-stats')!,
  homeFriends: document.querySelector('#home-friends')!,
  homeBackpack: document.querySelector('#home-backpack')!,
  cityModal: document.querySelector('#city-modal')!,
  closeCityButton: document.querySelector('#close-city-button')!,
  cityTitle: document.querySelector('#city-title')!,
  citySubtitle: document.querySelector('#city-subtitle')!,
  cityBody: document.querySelector('#city-body')!,
};

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#86d9ff',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  pixelArt: true,
  antialias: false,
  scene: [new CozyWorldScene(uiRefs)],
});
