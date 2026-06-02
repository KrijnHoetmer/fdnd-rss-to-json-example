import express from 'express'

import { Liquid } from 'liquidjs'

import { parseFeed } from 'feedsmith'

const app = express()

const engine = new Liquid()
app.engine('liquid', engine.express())

app.set('views', './views')

app.get('/', async function (request, response) {

  const tweakersResponse = await fetch('https://tweakers.net/feeds/mixed.xml')
  const tweakersResponseXML = await tweakersResponse.text()

  const { format, feed } = parseFeed(tweakersResponseXML)
  // console.log(feed) // Om te debuggen

  response.render('example.liquid', {items: feed.items})
})

app.listen(8123, function () {
  console.log(`Application started on http://localhost:8123`)
})