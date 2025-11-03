function* count() {
  yield 1
  yield 2
  yield 3
}

const gen = count()
console.log(gen.next().value) // 输出: 1
console.log(gen.next().value) // 输出: 1
console.log(gen.next().value) // 输出: 1

function* consumer() {
  const value = yield "Start"
  console.log(`Received: ${value}`)
  yield "End"
}

{
  const gen = consumer()
  const val1 = gen.next() // 输出: { value: "Start", done: false }
  console.log(val1)
  const val2 = gen.next("Data") // 输出: Received: Data
  console.log(val2)
}
