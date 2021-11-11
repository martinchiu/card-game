//花色img
const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]
//遊戲狀態機，定義遊戲所有的狀態
const GAME_STATE = {
  FirstCardAwaits : 'FirstCardAwaits',
  SecondCardAwaits : 'SecondCardAwaits',
  CardsMatchedFailed : 'CardsMatchedFailed',
  CardsMatched : 'CardsMatched',
  GameFinished : 'GameFinished'
}
//V_視覺呈現
const view = {
  //動態產生52張牌
  //牌面
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `<p>${number}</p>
      <img src="${symbol}" alt="花色">
      <p>${number}</p>`
  },
  //牌背
  getCardElement(index) {
    //改變花色＆字色
    const symbolIndex = Math.floor(index / 13)
    const color = symbolIndex === 1 || symbolIndex === 2 ? "red" : ""
    return `<div class="card back ${color}" data-index="${index}"></div>`
  },
  //遇到特殊數字要改成字母
  transformNumber(number) {
    switch(number) {
      case 1 :
        return 'A'
      case 11 :
        return 'J'
      case 12 :
        return 'Q'
      case 13 :
        return 'K'
      default :
        return number
    }
  },
  //將動態產生的牌隨機洗亂後呈現在畫面上
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },
  //翻牌函式
  flipCards(...cards) {
    cards.map(card => {
      //原本是背面，回傳正面
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      card.classList.add('back')
      card.innerHTML = null
    })
  },
  //新增配對成功牌的樣式
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },
  //渲染加分＆計次
  renderScore(score) {
    document.querySelector('.score').textContent = `Score: ${score}`
  },
  renderTriedTimes(times) {
    document.querySelector(".tried").textContent = `You've tried: ${times} times`
  },
  //配對失敗的動畫
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => {
        event.target.classList.remove('wrong'), { once: true }
      })
    })
  },
  //遊戲結束的畫面
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `<p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>`
    const header = document.querySelector('#header')
    header.before(div)
  }
}
//洗牌，隨機產生52張牌
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for(let index = number.length -1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  },
  //把排翻回去重置
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

//C_流程控制
const controller = {
  //初始化遊戲狀態
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },//依照不同的遊戲狀態，做不同的行為
  dispatchCardAction(card) {
    if(!card.classList.contains('back')) {
      return
    }
    switch(this.currentState) {
      case GAME_STATE.FirstCardAwaits :
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits :
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        //判斷是否配對成功
        if(model.isRevealedCardsMatched()) {
          //配對成功
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          if(model.score === 260) {
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          model.revealedCards = []
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          //配對失敗
          this.currentState = GAME_STATE.CardsMatchedFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(utility.resetCards,1000)
        }
        break
    }
  }
}
//M_資料管理
const model = {
  revealedCards: [],
  isRevealedCardsMatched() {
    const outcome = this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
    return outcome
  },
  score: 0,
  triedTimes: 0,
}
controller.generateCards()
//為每張牌加上點擊的事件監聽器
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})
