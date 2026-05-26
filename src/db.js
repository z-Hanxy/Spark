import Dexie from 'dexie'

const db = new Dexie('ShanliangDB')

db.version(1).stores({
  folders: '++id, name, parentId',
  cards: '++id, folderId, question, answer',
})

db.version(2).stores({
  cards: '++id, folderId, question, answer, nextReviewDate, level, interval, reviewCount',
}).upgrade(async (tx) => {
  const now = Date.now()
  await tx.table('cards').toCollection().modify((card) => {
    card.nextReviewDate = now
    card.level = 0
    card.interval = 0
    card.reviewCount = 0
  })
})

db.version(3).stores({
  cards: '++id, folderId, question, answer, nextReviewDate, easeFactor, interval, repetitionCount',
}).upgrade(async (tx) => {
  await tx.table('cards').toCollection().modify((card) => {
    card.easeFactor = 2.5
    card.repetitionCount = card.reviewCount || 0
  })
})

db.version(4).stores({
  cards: '++id, folderId, question, answer, nextReviewDate, easeFactor, interval, repetitionCount',
  reviewLogs: '++id, cardId, rating, timestamp',
})

db.version(5).stores({
  reviewLogs: '++id, cardId, date, result',
}).upgrade(async (tx) => {
  await tx.table('reviewLogs').toCollection().modify((log) => {
    if (log.timestamp) {
      const d = new Date(log.timestamp)
      log.date = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-')
    } else {
      log.date = ''
    }
    log.result = log.rating || ''
  })
})

db.version(6).stores({
  cards: '++id, folderId, question, answer, nextReviewDate, easeFactor, interval, repetitionCount, state, stepIndex, repetition, lapseCount, dueDate',
}).upgrade(async (tx) => {
  const now = Date.now()
  await tx.table('cards').toCollection().modify((card) => {
    card.state = 'new'
    card.stepIndex = 0
    card.repetition = card.repetitionCount || 0
    card.lapseCount = 0
    card.dueDate = card.nextReviewDate || now
  })
})

db.version(7).stores({
  cards: '++id, folderId, question, answer, nextReviewDate, easeFactor, interval, repetitionCount, state, stepIndex, repetition, lapseCount, dueDate',
  reviewLogs: '++id, cardId, date, result, fromState, toState, intervalChange, easeFactorChange, timestamp',
})

db.version(8).stores({
  cards: '++id, folderId, question, answer, nextReviewDate, easeFactor, interval, repetitionCount, state, stepIndex, repetition, lapseCount, dueDate, cardType',
}).upgrade(async (tx) => {
  await tx.table('cards').toCollection().modify((card) => {
    card.cardType = 'qa'
  })
})

db.version(9).stores({
  cards: '++id, folderId, question, answer, nextReviewDate, easeFactor, interval, repetitionCount, state, stepIndex, repetition, lapseCount, dueDate, cardType, clozeText',
}).upgrade(async (tx) => {
  await tx.table('cards').toCollection().modify((card) => {
    card.clozeText = ''
  })
})

db.version(10).stores({
  cards: '++id, folderId, question, answer, nextReviewDate, easeFactor, interval, repetitionCount, state, stepIndex, repetition, lapseCount, dueDate, cardType, clozeText, clozeProcessedText',
}).upgrade(async (tx) => {
  await tx.table('cards').toCollection().modify((card) => {
    card.clozeProcessedText = card.clozeText || ''
  })
})

db.version(11).stores({
  cards: '++id, folderId, question, answer, nextReviewDate, easeFactor, interval, repetitionCount, state, stepIndex, repetition, lapseCount, dueDate, cardType, clozeText, clozeProcessedText, matchPairs',
}).upgrade(async (tx) => {
  await tx.table('cards').toCollection().modify((card) => {
    card.matchPairs = []
  })
})

export default db
