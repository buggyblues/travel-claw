import { getCityLore } from '../data/cityLore';
import type { GameState, Location } from '../systems/types';

export function renderCityModalContent(location: Location, state: GameState | null): string {
  const lore = getCityLore(location.name);
  const activities = state
    ? [
        ...state.photos.filter((item) => item.location.name === location.name).slice(0, 3).map((item) => `📸 拍摄于 ${formatTime(item.takenAt)}`),
        ...state.poems.filter((item) => item.location.name === location.name).slice(0, 2).map((item) => `📝 《${item.title}》`),
        ...state.artworks.filter((item) => item.location.name === location.name).slice(0, 2).map((item) => `🎨 ${item.title}`),
        ...state.messages.filter((item) => item.location.name === location.name).slice(0, 2).map((item) => `✉️ ${item.content}`),
      ]
    : [];

  const travelPrompts = lore?.travelDiaryPrompts ?? ['放慢脚步，看看这里的光。', '拍一张今天最喜欢的角落。'];
  const rumors = lore?.npcRumors ?? ['据说今天会遇到温柔的旅伴。'];
  const snacks = lore?.signatureSnacks ?? ['热茶', '小饼干'];
  const hiddenSpots = lore?.hiddenSpots ?? ['城市转角的长椅'];
  const localTips = lore?.localTips ?? ['如果不知道做什么，就先散步。'];
  const palette = lore?.palette ?? ['#ffe5b4', '#ffd6e0', '#cde7ff'];

  return `
    <div class="city-grid">
      <div class="city-card pixel-chip">
        <div class="subheading">城市气质</div>
        <div class="city-hero">
          <div class="city-emoji">🏙️</div>
          <div>
            <div class="main">${location.name}</div>
            <div class="meta">${location.city}, ${location.country}</div>
            <div class="meta">${lore?.vibe ?? location.description ?? '这里有风、有光、有旅猫的脚印。'}</div>
          </div>
        </div>
        <div class="city-swatches">
          ${palette.map((color) => `<span class="city-swatches__item" style="background:${color}"></span>`).join('')}
        </div>
        <div class="city-copy">
          <div class="main">${lore?.postcardTitle ?? `来自 ${location.city} 的明信片`}</div>
          <div class="meta">${lore?.postcardBody ?? '旅猫正在这里慢慢收集世界。'} </div>
          <div class="meta">气候印象：${lore?.climate ?? '今天的风温柔又适合旅行。'}</div>
        </div>
      </div>

      <div class="city-card pixel-chip">
        <div class="subheading">最近见闻</div>
        <div class="list">
          ${activities.length > 0 ? activities.map((text) => `<div class="list-item"><div class="main">${text}</div></div>`).join('') : '<div class="empty">还没有特别的记录，去这里走走吧。</div>'}
        </div>
      </div>

      <div class="city-card pixel-chip">
        <div class="subheading">本地小贴士</div>
        <div class="list">
          ${localTips.map((text) => `<div class="list-item"><div class="main">💡 ${text}</div></div>`).join('')}
        </div>
      </div>

      <div class="city-card pixel-chip">
        <div class="subheading">隐藏角落</div>
        <div class="list">
          ${hiddenSpots.map((text) => `<div class="list-item"><div class="main">🗺️ ${text}</div></div>`).join('')}
        </div>
      </div>

      <div class="city-card pixel-chip">
        <div class="subheading">适合带回家的味道</div>
        <div class="list">
          ${snacks.map((text) => `<div class="list-item"><div class="main">🍡 ${text}</div></div>`).join('')}
        </div>
      </div>

      <div class="city-card pixel-chip">
        <div class="subheading">旅途灵感</div>
        <div class="list">
          ${travelPrompts.map((text) => `<div class="list-item"><div class="main">📝 ${text}</div></div>`).join('')}
        </div>
      </div>

      <div class="city-card pixel-chip city-card--wide">
        <div class="subheading">街头传闻</div>
        <div class="list">
          ${rumors.map((text) => `<div class="list-item"><div class="main">🐾 ${text}</div></div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
