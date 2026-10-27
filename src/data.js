/**
 * 示范数据：三个原创从者 + 三波敌人（不借用任何作品的素材与名字）
 */
import { makeUnit } from './engine.js'

export const DEMO_PARTY = [
  makeUnit({ id: 'p1', name: '铁砧', klass: 'saber', hp: 160, atk: 26, npName: '斩铁·一文字' }),
  makeUnit({ id: 'p2', name: '回声', klass: 'lancer', hp: 140, atk: 24, npName: '回声突刺' }),
  makeUnit({ id: 'p3', name: '雾灯', klass: 'caster', hp: 120, atk: 22, npName: '雾中灯塔' }),
]

const enemy = (id, name, klass, hp, atk) => makeUnit({ id, name, klass, hp, atk, isEnemy: true })

export const DEMO_WAVES = [
  [enemy('e1', '锈铁傀儡', 'assassin', 90, 11), enemy('e2', '锈铁傀儡·改', 'assassin', 110, 12)],
  [enemy('e3', '雾中猎手', 'archer', 130, 14), enemy('e4', '雾中猎手·首领', 'archer', 160, 16)],
  [enemy('e5', '终末的守门者', 'berserker', 260, 20)],
]
