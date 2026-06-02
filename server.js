import express from 'express'

import { Liquid } from 'liquidjs'

import { parseFeed } from 'feedsmith'

import { JSDOM } from 'jsdom'

const app = express()

const engine = new Liquid()
app.engine('liquid', engine.express())

app.set('views', './views')

app.get('/tweakers', async function (request, response) {

  const tweakersResponse = await fetch('https://tweakers.net/feeds/mixed.xml')
  const tweakersResponseXML = await tweakersResponse.text()

  const { format, feed } = parseFeed(tweakersResponseXML)
  // console.log(feed) // Om te debuggen

  response.render('tweakers.liquid', {items: feed.items})
})

app.get('/funda', async function (request, response) {

  const fundaResponse = await fetch('https://www.funda.nl/zoeken/koop?selected_area=[%22nl%22,%22amsterdam%22]')
  const fundaResponseHTML = await fundaResponse.text()

  const { document } = (new JSDOM(fundaResponseHTML)).window
  // console.log(document) // Om te debuggen

  const headings = []
  document.querySelectorAll('#PageListings h2').forEach(function(heading) {
    headings.push(heading.textContent)
  })

  response.render('funda.liquid', {headings: headings})
})

app.get('/', function (request, response) {
  response.render('index.liquid')
})

app.listen(8123, function () {
  console.log(`Application started on http://localhost:8123`)
})