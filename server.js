import express from 'express'

import { Liquid } from 'liquidjs'

import { parseFeed } from 'feedsmith'

import { JSDOM } from 'jsdom'

const app = express()

const engine = new Liquid()
app.engine('liquid', engine.express())

const scrapeAndUpdateTweakers = async function() {
  const tweakersActiveTopicsResponse = await fetch('https://gathering.tweakers.net/rss/list_activetopics')
  const tweakersActiveTopicsResponseXML = await tweakersActiveTopicsResponse.text()
  const { feed: tweakersActiveTopicsFeed } = parseFeed(tweakersActiveTopicsResponseXML)
  const tweakersLastPoster = tweakersActiveTopicsFeed.items[0].description.substring(13 + tweakersActiveTopicsFeed.items[0].description.indexOf('Last poster: '), tweakersActiveTopicsFeed.items[0].description.indexOf(' at '))
  const directusUserResponse = await fetch('https://fdnd-agency.directus.app/items/tweakers_users?' + new URLSearchParams({'filter[username]' : tweakersLastPoster}))
  const directusUserResponseJSON = await directusUserResponse.json()
  const tweakersLastPosterProfileResponse = await fetch('https://tweakers.net/gallery/' + tweakersLastPoster)
  const tweakersLastPosterProfileResponseHTML = await tweakersLastPosterProfileResponse.text()
  const { document: tweakersLastPosterProfileResponseDOM } = (new JSDOM(tweakersLastPosterProfileResponseHTML)).window
  const tweakersLastPosterProfileLink = tweakersLastPosterProfileResponseDOM.querySelector('a[href^="https://gathering.tweakers.net/forum/find/poster/"]')
  const tweakersLastPosterPostCount = tweakersLastPosterProfileLink.textContent.replace(/\./g, '')
  if (directusUserResponseJSON.data.length == 1) {
    await fetch('https://fdnd-agency.directus.app/items/tweakers_users', {
      method: 'PATCH',
      body: JSON.stringify({
        number_of_posts: tweakersLastPosterPostCount
      }),
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })
  } else {
    const tweakersLastPosterProfileRegistered = tweakersLastPosterProfileResponseDOM.querySelector('.registered').textContent
    const tweakersLastPosterProfileRegisteredDateParts = tweakersLastPosterProfileRegistered.substring(18, tweakersLastPosterProfileRegistered.indexOf(', laatste')).split(' ')
    const months = {januari: '01', februari: '02', maart: '03', april: '04', mei: '05', juni: '06', juli: '07', augustus: '08', september: '09', oktober: 10, november: 11, december: 12}
    const tweakersLastPosterProfileRegisteredDate = tweakersLastPosterProfileRegisteredDateParts[2] + '-' + months[tweakersLastPosterProfileRegisteredDateParts[1]] + '-' + tweakersLastPosterProfileRegisteredDateParts[0].padStart(2, '0')
    await fetch('https://fdnd-agency.directus.app/items/tweakers_users', {
      method: 'POST',
      body: JSON.stringify({
        member_since: tweakersLastPosterProfileRegisteredDate,
        username: tweakersLastPoster,
        forum_id: tweakersLastPosterProfileLink.getAttribute('href').substring(13 + tweakersLastPosterProfileLink.getAttribute('href').indexOf('/find/poster/')),
        number_of_posts: tweakersLastPosterPostCount
      }),
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    })
  }
}

scrapeAndUpdateTweakers()


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