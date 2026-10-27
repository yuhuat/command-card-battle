/**
 * demo/app.js —— 把引擎接到 DOM 上：抽牌、选牌、出招、结算
 */
import { CLASSES, CARD_TYPES, createBattle, drawHand, npCardFor, playHand, snapshot } from '../src/engine.js'
import { DEMO_PARTY, DEMO_WAVES } from '../src/data.js'

const $ = (id) => document.getElementById(id)
const el = {
  turn: $('turn'),
  wave: $('wave'),
  stars: $('stars'),
  crit: $('crit'),
  enemies: $('enemies'),
  party: $('party'),
  hand: $('hand'),
  play: $('play'),
  restart: $('restart'),
  log: $('log'),
  overlay: $('overlay'),
  overlayTitle: $('overlay-title'),
  overlayDesc: $('overlay-desc'),
  overlayBtn: $('overlay-btn'),
}

let battle = null
let selected = [] // 选中的牌（对象本身，不是下标）

const klassText = (klass) => `${CLASSES[klass]?.icon || ''} ${CLASSES[klass]?.name || klass}`
const cardKey = (card) => `${card.unitId}:${card.type}`

function unitCard(unit, enemy = false) {
  const hpPct = Math.max(0, Math.round((unit.hp / unit.maxHp) * 100))
  return `
    <div class="unit ${unit.alive ? '' : 'dead'}">
      <div class="name"><span>${unit.name}</span><span class="klass">${klassText(unit.klass)}</span></div>
      <div class="bar hp"><i class="${hpPct <= 30 ? 'low' : ''}" style="width:${hpPct}%"></i></div>
      <div class="nums"><span>${unit.hp}/${unit.maxHp}</span>${enemy ? '' : `<span>NP ${unit.np}%</span>`}</div>
      ${enemy ? '' : `<div class="bar np"><i class="${unit.np >= 100 ? 'full' : ''}" style="width:${unit.np}%"></i></div>`}
    </div>`
}

function render() {
  const snap = snapshot(battle)
  el.turn.textContent = snap.turn
  el.wave.textContent = `${snap.wave}/${snap.waves}`
  el.stars.textContent = snap.stars
  el.crit.textContent = `${Math.round(Math.min(0.9, snap.stars * 0.05) * 100)}%`
  el.enemies.innerHTML = snap.enemies.map((unit) => unitCard(unit, true)).join('')
  el.party.innerHTML = snap.party.map((unit) => unitCard(unit)).join('')

  const npCards = snap.party
    .map((unit) => (unit.alive && unit.np >= 100 ? npCardFor(battle, unit.id) : null))
    .filter(Boolean)

  const cards = [...snap.hand, ...npCards]
  el.hand.innerHTML = cards
    .map((card) => {
      const unit = battle.party.find((item) => item.id === card.unitId)
      const spec = CARD_TYPES[card.type]
      const label = card.type === 'NP' ? '宝具' : `${spec.zh} ${spec.label}`
      const picked = selected.some((item) => cardKey(item) === cardKey(card))
      return `<button class="card ${card.type} ${picked ? 'selected' : ''}" data-key="${cardKey(card)}">
        <div class="type">${label}</div>
        <div class="who">${unit ? unit.name : ''}</div>
      </button>`
    })
    .join('')

  for (const button of el.hand.querySelectorAll('.card')) {
    button.addEventListener('click', () => toggle(cards.find((card) => cardKey(card) === button.dataset.key)))
  }

  el.play.disabled = selected.length === 0 || battle.status !== 'playing'
  el.log.innerHTML = battle.log.slice(-40).map((line) => `<div>${line}</div>`).join('')
  el.log.scrollTop = el.log.scrollHeight

  if (battle.status !== 'playing') {
    el.overlay.classList.remove('hidden')
    el.overlayTitle.textContent = battle.status === 'victory' ? '战斗胜利' : '队伍全灭'
    el.overlayDesc.textContent =
      battle.status === 'victory'
        ? `用了 ${battle.turn} 回合，打完 ${battle.waves.length} 波。`
        : `倒在第 ${battle.waveIndex + 1} 波，再试一次。`
  } else {
    el.overlay.classList.add('hidden')
  }
}

function toggle(card) {
  if (!card) return
  const key = cardKey(card)
  if (selected.some((item) => cardKey(item) === key)) {
    selected = selected.filter((item) => cardKey(item) !== key)
  } else if (selected.length < 3) {
    selected = [...selected, card]
  }
  render()
}

function start() {
  battle = createBattle({ party: DEMO_PARTY, waves: DEMO_WAVES, seed: Date.now() % 100000 })
  drawHand(battle)
  selected = []
  render()
}

el.play.addEventListener('click', () => {
  if (!selected.length) return
  playHand(battle, selected)
  selected = []
  render()
})

el.restart.addEventListener('click', start)
el.overlayBtn.addEventListener('click', start)

start()
