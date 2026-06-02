import express from 'express'

import { Liquid } from 'liquidjs'

import { convertXML } from 'simple-xml-to-json'

const app = express()

const engine = new Liquid()
app.engine('liquid', engine.express())

app.set('views', './views')

app.get('/', async function (request, response) {

  const tweakersResponse = await fetch('https://tweakers.net/feeds/mixed.xml')
  const tweakersResponseXML = await tweakersResponse.text()

  const tweakersResponseJSON = convertXML(tweakersResponseXML)
  // console.log(tweakersResponseJSON) // Om te debuggen

  const items = tweakersResponseJSON.rss.children[0].channel.children.filter(function(child) {
    return Object.hasOwn(child, 'item')
  })

  console.log(items)

  response.render('example.liquid', {items: items})
})

app.listen(8123, function () {
  console.log(`Application started on http://localhost:8123`)
})