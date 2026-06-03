import express from 'express'

import { Liquid } from 'liquidjs'

import { parseFeed } from 'feedsmith'

import { JSDOM } from 'jsdom'

const app = express()

const engine = new Liquid()
app.engine('liquid', engine.express())

app.set('views', './views')

app.get('/tweakers/:categorie', async function (request, response) {

  const tweakersResponse = await fetch('https://gathering.tweakers.net/rss/list_topics/' + request.params.categorie)
  const tweakersResponseXML = await tweakersResponse.text()

  const { format, feed } = parseFeed(tweakersResponseXML)
  console.log(feed) // Om te debuggen

  const items = []
  for (const item of feed.items) {
    items.push({
      title: item.title,
      link: item.link,
      replies: Number(item.description.substring(9, item.description.indexOf('\n')))
    })
  }

  items.sort(function(a, b) {
   if (a.replies < b.replies) {
    return 1;
   } else if (a.replies > b.replies) {
    return -1;
   }
   return 0;
  })

  // console.log(items)

  response.render('tweakers.liquid', {item: items[0]})
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