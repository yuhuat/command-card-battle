/**
 * 三色指令卡战斗引擎 —— 纯逻辑，零依赖，可在浏览器和 Node 里跑
 *
 * 设计目标：把「抽五张、选三张、Arts/Quick/Buster 各有用处」这套回合制
 * 做成一个 40KB 以内、能塞进任何网页的引擎。
 *
 * 术语：
 *   A = Arts（蓝，攒宝具）  Q = Quick（绿，出暴击星）  B = Buster（红，伤害高）
 */

/** 职阶：beats 表示克制谁；狂阶特殊，打谁都是 1.5，挨打也是 1.5 */
export const CLASSES = {
  saber: { name: '剑', beats: ['lancer'], icon: '⚔️', color: '#3b82f6' },
  lancer: { name: '枪', beats: ['archer'], icon: '🔱', color: '#22c55e' },
  archer: { name: '弓', beats: ['saber'], icon: '🏹', color: '#eab308' },
  rider: { name: '骑', beats: ['caster'], icon: '🐎', color: '#a855f7' },
  caster: { name: '术', beats: ['assassin'], icon: '📖', color: '#06b6d4' },
  assassin: { name: '杀', beats: ['rider'], icon: '🗡️', color: '#64748b' },
  berserker: { name: '狂', beats: ['saber', 'lancer', 'archer', 'rider', 'caster', 'assassin'], icon: '💥', color: '#ef4444' },
}

export const CARD_TYPES = {
  A: { label: 'Arts', zh: '蓝', color: '#3b82f6', np: 20, stars: 0, damage: 1.0 },
  Q: { label: 'Quick', zh: '绿', color: '#22c55e', np: 10, stars: 4, damage: 1.15 },
  B: { label: 'Buster', zh: '红', color: '#ef4444', np: 5, stars: 1, damage: 1.65 },
}

/** 可复现的随机数（mulberry32） */
export function makeRng(seed = 1) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 职阶相性倍率：克制 1.5，被克 0.75，狂阶双向 1.5 */
export function affinity(attackerClass, defenderClass) {
  if (!CLASSES[attackerClass] || !CLASSES[defenderClass]) return 1
  if (attackerClass === 'berserker' && defenderClass !== 'berserker') return 1.5
  if (defenderClass === 'berserker' && attackerClass !== 'berserker') return 1.5
  if (CLASSES[attackerClass].beats.includes(defenderClass)) return 1.5
  if (CLASSES[defenderClass].beats.includes(attackerClass)) return 0.75
  return 1
}

/** 造一个从者 / 敌人 */
export function makeUnit({ id, name, klass, hp, atk, cards = ['A', 'Q', 'B'], npName = '宝具', np = 0 }) {
  return {
    id,
    name,
    klass,
    hp,
    maxHp: hp,
    atk,
    cards,
    np,
    npName,
    alive: true,
    isEnemy: false,
  }
}

/** 组建一场战斗 */
export function createBattle({ party, waves, seed = 1 }) {
  return {
    party: party.map((unit) => ({ ...unit })),
    waves: waves.map((wave) => wave.map((unit) => ({ ...unit, isEnemy: true }))),
    waveIndex: 0,
    enemies: waves.length ? waves[0].map((unit) => ({ ...unit, isEnemy: true })) : [],
    turn: 1,
    stars: 0,
    hand: [],
    rng: makeRng(seed),
    log: [],
    status: 'playing', // playing | victory | defeat
  }
}

const alive = (list) => list.filter((unit) => unit.alive)

/** 牌库：每个活着的人 3 张，按 A/Q/B 顺序；一颗宝具卡另算 */
function buildDeck(battle) {
  const deck = []
  for (const unit of battle.party) {
    if (!unit.alive) continue
    for (const type of unit.cards) deck.push({ unitId: unit.id, type })
  }
  // Fisher-Yates，用战斗自己的随机源，便于测试复现
  const random = battle.rng
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

/** 抽五张（每回合开头调用）。暴击星会累积，用来算这一回合每张卡的暴击率 */
export function drawHand(battle, size = 5) {
  const deck = buildDeck(battle)
  battle.hand = deck.slice(0, Math.min(size, deck.length))
  return battle.hand
}

/** 把宝具卡插进手牌（NP 满时每回合一次） */
export function npCardFor(battle, unitId) {
  const unit = battle.party.find((item) => item.id === unitId)
  if (!unit || !unit.alive || unit.np < 100) return null
  return { unitId, type: 'NP' }
}

function enemyTurn(battle, pushLog) {
  for (const enemy of alive(battle.enemies)) {
    const targets = alive(battle.party)
    if (!targets.length) break
    const target = targets[Math.floor(battle.rng() * targets.length)]
    const base = enemy.atk * 0.9
    const mult = affinity(enemy.klass, target.klass)
    const damage = Math.max(1, Math.round(base * mult))
    target.hp = Math.max(0, target.hp - damage)
    if (target.hp === 0) target.alive = false
    pushLog(`${enemy.name} 攻击 ${target.name}，${damage} 伤害${mult > 1 ? '（克制）' : mult < 1 ? '（被克）' : ''}`)
  }
}

function nextWave(battle, pushLog) {
  const nextIndex = battle.waveIndex + 1
  if (nextIndex >= battle.waves.length) return false
  battle.waveIndex = nextIndex
  battle.enemies = battle.waves[battle.waveIndex].map((unit) => ({ ...unit, isEnemy: true }))
  pushLog(`第 ${battle.waveIndex + 1} 波敌人出现`)
  return true
}

/**
 * 打出一手牌（最多 3 张）。
 * @param {object} battle
 * @param {Array<{index:number}>} picks 手牌下标
 * @param {number} [targetId] 指定敌人；不传就打当前血量最低的
 * @returns {{ok:boolean, reason?:string, log:string[]}}
 */
export function playHand(battle, picks, targetId) {
  if (battle.status !== 'playing') return { ok: false, reason: '战斗已结束', log: [] }
  const chosen = picks.slice(0, 3)
  if (!chosen.length) return { ok: false, reason: '至少选一张卡', log: [] }
  const log = []
  const pushLog = (line) => {
    log.push(line)
    battle.log.push(line)
  }

  for (const pick of chosen) {
    // pick 可以是手牌下标 {index}，也可以直接给一张牌 {unitId, type}
    const card = pick && pick.type ? pick : battle.hand[pick?.index]
    if (!card) continue
    const unit = battle.party.find((item) => item.id === card.unitId)
    if (!unit || !unit.alive) continue

    if (card.type === 'NP') {
      if (unit.np < 100) {
        pushLog(`${unit.name} 的宝具还没准备好`)
        continue
      }
      const targets = alive(battle.enemies)
      if (!targets.length) break
      const damage = Math.round(unit.atk * 2.2 * affinity(unit.klass, targets[0].klass))
      // 宝具打全体
      for (const enemy of targets) {
        const hit = Math.round(damage * (enemy === targets[0] ? 1 : 0.85))
        enemy.hp = Math.max(0, enemy.hp - hit)
        if (enemy.hp === 0) enemy.alive = false
      }
      unit.np = 0
      pushLog(`${unit.name} 释放「${unit.npName}」，全体 ${damage} 伤害`)
      continue
    }

    const spec = CARD_TYPES[card.type]
    unit.np = Math.min(100, unit.np + spec.np)
    battle.stars = Math.min(40, battle.stars + spec.stars)

    const targets = alive(battle.enemies)
    if (!targets.length) break
    const target = targets.find((enemy) => enemy.id === targetId) || targets.reduce((low, enemy) => (enemy.hp < low.hp ? enemy : low), targets[0])
    const mult = affinity(unit.klass, target.klass)
    const crit = battle.rng() < Math.min(0.9, battle.stars * 0.05)
    const raw = unit.atk * spec.damage * mult * (crit ? 2 : 1)
    const damage = Math.max(1, Math.round(raw * (0.95 + battle.rng() * 0.1)))
    target.hp = Math.max(0, target.hp - damage)
    if (target.hp === 0) target.alive = false
    pushLog(
      `${unit.name} ${spec.zh}卡打 ${target.name}：${damage}${crit ? ' 暴击！' : ''}${mult > 1 ? ' 克制' : mult < 1 ? ' 被克' : ''}`,
    )
    if (!alive(battle.enemies).length) break
  }

  if (!alive(battle.enemies).length) {
    if (!nextWave(battle, pushLog)) {
      battle.status = 'victory'
      pushLog('战斗胜利')
      return { ok: true, log }
    }
  }

  if (!alive(battle.party).length) {
    battle.status = 'defeat'
    pushLog('队伍全灭')
    return { ok: true, log }
  }

  enemyTurn(battle, pushLog)
  if (!alive(battle.party).length) {
    battle.status = 'defeat'
    pushLog('队伍全灭')
    return { ok: true, log }
  }

  battle.turn += 1
  drawHand(battle)
  return { ok: true, log }
}

/** 供 UI 用的快照 */
export function snapshot(battle) {
  return {
    turn: battle.turn,
    wave: battle.waveIndex + 1,
    waves: battle.waves.length,
    stars: battle.stars,
    status: battle.status,
    party: battle.party.map(({ id, name, klass, hp, maxHp, np, npName, alive: isAlive }) => ({ id, name, klass, hp, maxHp, np, npName, alive: isAlive })),
    enemies: battle.enemies.map(({ id, name, klass, hp, maxHp, alive: isAlive }) => ({ id, name, klass, hp, maxHp, alive: isAlive })),
    hand: battle.hand,
  }
}
