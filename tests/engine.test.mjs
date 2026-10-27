/**
 * 引擎单测：node --test tests/
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  CLASSES,
  affinity,
  createBattle,
  drawHand,
  makeUnit,
  npCardFor,
  playHand,
  snapshot,
} from '../src/engine.js'
import { DEMO_PARTY, DEMO_WAVES } from '../src/data.js'

const battle = (seed = 42) => createBattle({ party: DEMO_PARTY, waves: DEMO_WAVES, seed })

test('职阶相性：克制 1.5、被克 0.75、狂阶双向 1.5', () => {
  assert.equal(affinity('saber', 'lancer'), 1.5)
  assert.equal(affinity('lancer', 'saber'), 0.75)
  assert.equal(affinity('saber', 'cinder'), 1)
  assert.equal(affinity('berserker', 'saber'), 1.5)
  assert.equal(affinity('saber', 'berserker'), 1.5)
  assert.equal(affinity('assassin', 'assassin'), 1)
})

test('每个职阶都有名字和克制列表', () => {
  for (const [key, value] of Object.entries(CLASSES)) {
    assert.equal(typeof value.name, 'string')
    assert.ok(Array.isArray(value.beats), `${key} 缺少 beats`)
  }
})

test('抽牌：五张，且都属于活着的人', () => {
  const b = battle()
  const hand = drawHand(b)
  assert.equal(hand.length, 5)
  for (const card of hand) {
    assert.ok(b.party.some((unit) => unit.id === card.unitId))
    assert.ok(['A', 'Q', 'B'].includes(card.type))
  }
})

test('同一个种子抽到的牌一样（可复现）', () => {
  const a = drawHand(battle(7)).map((card) => `${card.unitId}:${card.type}`)
  const c = drawHand(battle(7)).map((card) => `${card.unitId}:${card.type}`)
  assert.deepEqual(a, c)
})

test('Buster 比 Arts 伤害高，Arts 攒宝具，Quick 出星', () => {
  const b = createBattle({ party: [makeUnit({ id: 'u', name: '测试', klass: 'saber', hp: 100, atk: 20 })], waves: [[makeUnit({ id: 'e', name: '木桩', klass: 'saber', hp: 9999, atk: 0 })]], seed: 1 })
  b.hand = [{ unitId: 'u', type: 'B' }]
  const hpAfterB = (() => {
    const before = b.enemies[0].hp
    playHand(b, [{ index: 0 }])
    return before - b.enemies[0].hp
  })()

  const b2 = createBattle({ party: [makeUnit({ id: 'u', name: '测试', klass: 'saber', hp: 100, atk: 20 })], waves: [[makeUnit({ id: 'e', name: '木桩', klass: 'saber', hp: 9999, atk: 0 })]], seed: 1 })
  b2.hand = [{ unitId: 'u', type: 'A' }]
  const beforeA = b2.enemies[0].hp
  playHand(b2, [{ index: 0 }])
  const hpAfterA = beforeA - b2.enemies[0].hp

  assert.ok(hpAfterB > hpAfterA, `Buster ${hpAfterB} 应高于 Arts ${hpAfterA}`)
  assert.equal(b2.party[0].np, 20, 'Arts 应 +20 宝具值')

  const b3 = createBattle({ party: [makeUnit({ id: 'u', name: '测试', klass: 'saber', hp: 100, atk: 20 })], waves: [[makeUnit({ id: 'e', name: '木桩', klass: 'saber', hp: 9999, atk: 0 })]], seed: 3 })
  b3.hand = [{ unitId: 'u', type: 'Q' }]
  playHand(b3, [{ index: 0 }])
  assert.ok(b3.stars >= 4, `Quick 应出星，实际 ${b3.stars}`)
})

test('宝具要满 100 才能放，放完清零并打全体', () => {
  const b = createBattle({
    party: [makeUnit({ id: 'u', name: '测试', klass: 'saber', hp: 100, atk: 20, np: 100 })],
    waves: [[makeUnit({ id: 'e1', name: '木桩1', klass: 'saber', hp: 9999, atk: 0 }), makeUnit({ id: 'e2', name: '木桩2', klass: 'saber', hp: 9999, atk: 0 })]],
    seed: 5,
  })
  assert.ok(npCardFor(b, 'u'))
  const before = b.enemies.map((enemy) => enemy.hp)
  b.hand = [{ unitId: 'u', type: 'NP' }]
  playHand(b, [{ index: 0 }])
  assert.equal(b.party[0].np, 0)
  assert.ok(b.enemies.every((enemy, index) => enemy.hp < before[index]), '宝具应打全体')
})

test('连续出牌直到打完三波：状态是 victory', () => {
  const b = battle(11)
  let guard = 0
  while (b.status === 'playing' && guard < 200) {
    guard += 1
    drawHand(b)
    playHand(b, b.hand.slice(0, 3).map((_, index) => ({ index })))
  }
  assert.equal(b.status, 'victory')
  assert.equal(b.waveIndex, DEMO_WAVES.length - 1)
})

test('全灭判负', () => {
  const b = createBattle({
    party: [makeUnit({ id: 'u', name: '纸片', klass: 'saber', hp: 1, atk: 1 })],
    waves: [[makeUnit({ id: 'e', name: '巨像', klass: 'berserker', hp: 9999, atk: 999 })]],
    seed: 2,
  })
  b.hand = [{ unitId: 'u', type: 'A' }]
  playHand(b, [{ index: 0 }])
  assert.equal(b.status, 'defeat')
})

test('snapshot 只暴露需要的字段', () => {
  const b = battle()
  drawHand(b)
  const snap = snapshot(b)
  assert.equal(snap.hand.length, 5)
  assert.equal(snap.party.length, 3)
  assert.equal(snap.waves, DEMO_WAVES.length)
  assert.equal(typeof snap.enemies[0].hp, 'number')
})
