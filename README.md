# 三色指令卡战斗引擎（cardbattle）

一个**零依赖**的回合制战斗引擎：每回合抽 5 张牌、选 3 张，Arts / Quick / Buster 三种卡各有分工，加上职阶三角相性与宝具。约 400 行 JS，能直接塞进任何网页，也能在 Node 里跑单测。

> 玩法参考了「指令卡 + 从者」这一类回合制的通用设计（机制不受版权保护），代码、角色名、美术全部原创，不含任何第三方素材。

## 为什么做这个

想给网页小游戏找个**现成的、能改的**战斗内核：要么是大型框架（Cocos/Phaser）里自己从零写，要么是 Unity 项目不好嵌网页。中间这块——"卡片选择 + 相性 + NP 充能"的纯逻辑——其实两百多行就够，但每次都重写。

所以把它抽出来：**引擎只算数值，UI 你随便接**。demo 是一个不到 300 行的 DOM 界面，证明它可以做得很薄。

## 特性

- **抽 5 选 3**：牌库按存活成员动态生成，Fisher-Yates 洗牌，同一种子可复现
- **三色卡分工**：Arts 攒 NP（+20）、Quick 出暴击星（+4）、Buster 高倍率（×1.65）
- **职阶相性**：剑→枪→弓→剑、骑→术→杀→骑，克制 1.5、被克 0.75；狂阶双向 1.5
- **宝具**：NP 满 100 后手牌里出现宝具卡，全体伤害，放完清零
- **暴击**：星数 × 5% 上限 90%，暴击 ×2
- **多波次**：打完一波自动进下一波，最后一波清空即胜利
- **可复现 RNG**：`seed` 固定，单测和回放都靠它
- 零运行时依赖，Node 18+ / 现代浏览器

## 快速开始

```bash
git clone <repo> && cd cardbattle
npm test                     # node --test，9 个用例
npm run demo                 # 起一个零依赖静态服务器，打开 http://127.0.0.1:5173/
```

> demo 用了 ES module，直接双击 `demo/index.html` 在 Chrome 下会被 CORS 拦，必须走 http 服务（`npm run demo` 或 `python -m http.server`）。

## 在代码里用

```js
import { createBattle, drawHand, playHand, snapshot } from './src/engine.js'

const battle = createBattle({
  party: [
    { id: 'p1', name: '铁砧', klass: 'saber', hp: 160, maxHp: 160, atk: 26, cards: ['A','Q','B'], np: 0, npName: '斩铁', alive: true },
    // …
  ],
  waves: [[ /* 敌人数组 */ ], [ /* 第二波 */ ]],
  seed: 42,
})

drawHand(battle)                 // 抽 5 张
playHand(battle, [               // 出 3 张，按顺序结算
  { unitId: 'p1', type: 'Q' },   // 也可以传 { index: 0 }
  { unitId: 'p1', type: 'B' },
  { unitId: 'p2', type: 'A' },
])
snapshot(battle)                 // 给 UI 用的只读快照
```

### 卡牌数值

| 卡 | 伤害倍率 | NP | 暴击星 |
|---|---|---|---|
| Arts（蓝） | ×1.00 | +20 | 0 |
| Quick（绿） | ×1.15 | +10 | +4 |
| Buster（红） | ×1.65 | +5 | +1 |
| 宝具 | ×2.20（全体，副目标 ×0.85） | 清零 | — |

改数值只要动 `src/engine.js` 顶部的 `CARD_TYPES`；职阶关系在 `CLASSES`，想加 Alter Ego / Ruler 这类额外职阶，补一条 `{ name, beats: [] }` 就行。

## 目录

```
src/engine.js    引擎（相性、抽牌、结算、敌人 AI、快照）
src/data.js      示范数据：三个原创从者 + 三波敌人
demo/            DOM 版可玩 demo
tests/           9 个单测（相性 / 抽牌 / 卡牌差异 / 宝具 / 胜负 / 快照）
scripts/serve.mjs 零依赖静态服务器
```

## 已知取舍

- 没有后排替补、没有技能 CD、没有令咒——这些是刻意留给使用方扩展的，引擎越小越好嵌；
- 敌人 AI 只是"随机挑一个活人打"，够 demo 用，做正式游戏要换成行为表；
- 暴击星跨回合累积、不上限消费（上限 40），和原版那种"分配星星"不同，简化了交互。

## 路线图

- [ ] 技能与冷却（每骑 2 技能）
- [ ] 目标选择 UI（现在固定打残血）
- [ ] 存档 / 回放（靠 seed 已经能做到）
- [ ] 额外的裁定职阶（Ruler / Avenger / Alter Ego）
- [ ] 一个 3 关的剧情模式做示例

## 许可

MIT。拿去改、商用、嵌进自己的游戏都行，不用署名。
