import { getCityLore } from '../data/cityLore';
import type { GameState } from '../systems/types';

export interface HomePanelRenderResult {
  statsHtml: string;
  friendsHtml: string;
  backpackHtml: string;
}

export function renderHomePanel(state: GameState | null): HomePanelRenderResult {
  if (!state) {
    return {
      statsHtml: '<div class="empty">先选择一只旅猫吧。</div>',
      friendsHtml: '<div class="empty">朋友们还在路上。</div>',
      backpackHtml: '<div class="empty">柜子里空空的。</div>',
    };
  }

  const { character, garden, titles, friends, backpack, weather, travelHistory, souvenirs } = state;
  const currentLore = getCityLore(character.currentLocation.name);
  const latestStop = travelHistory[travelHistory.length - 1]?.location?.name ?? '家园';

  const statsHtml = [
    `🏠 住客：${character.name}`,
    `🌤️ 家园天气：${weather.type}`,
    `🍀 花园：${garden.clovers} 三叶草 / ${garden.fourLeafClovers} 四叶草`,
    `🧳 最近一站：${latestStop}`,
    `🎁 带回家：${souvenirs.length} 件纪念品`,
    `🏅 展示称号：${titles.slice(0, 3).map((item) => item.name).join(' / ') || '暂未解锁'}`,
    `💌 家园灵感：${currentLore?.postcardTitle ?? '把今天喜欢的风景挂在墙上'}`,
  ].map((text) => `<div class="list-item"><div class="main">${text}</div></div>`).join('');

  const friendsHtml = friends.length > 0
    ? friends.slice(0, 8).map((friend) => `
      <div class="list-item">
        <div class="main">🐾 ${friend.name}</div>
        <div class="meta">友情值 ${friend.friendship} · 来访 ${friend.visitCount} 次</div>
      </div>
    `).join('')
    : '<div class="empty">今天还没有朋友来串门。</div>';

  const backpackHtml = backpack.length > 0
    ? backpack.slice(0, 8).map((slot) => `
      <div class="list-item">
        <div class="main">🎒 ${slot.item.name}</div>
        <div class="meta">× ${slot.quantity} · ${slot.item.description}</div>
      </div>
    `).join('')
    : '<div class="empty">收纳柜里还没有物品。</div>';

  return { statsHtml, friendsHtml, backpackHtml };
}
