# openTO.jkzhou.ca



Website: https://openTO.jkzhou.ca

## what is this?
openTO is your one dashboard to see what is happening around Toronto!
using publicly accessible data, all of this information is displayed and eaasily digested in one page

## what did I do?

- used next.js framework to program the site
- made a newspaper style front page with police, fire, ttc, and go sections that fits on one screen
- pulled live data from toronto police, toronto fire, the ttc, and metrolinx, refreshed every minute
- added a breaking news banner that rotates through the latest news
- added a police page with stats and a map of calls across the 16 police divisions
- added a fire page with stats and a map of active incidents at their nearest fire hall
- mini subway map to show closed stations and slow zones 
- added toronto weather using the open-meteo API
- used github actions to build a docker image on every push 
- runs on my homeserver using clodufare and nginx proxy manager

## to-dos
- store fire and police history in a database (sqlite prob)
- add the open government licence credit to the footer
- figure out what the HP police division is and label it properly

## notice: 
AI was used in the development of this site.
