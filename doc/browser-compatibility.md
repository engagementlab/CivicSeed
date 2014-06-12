# Browser compatibility and notes

Civic Seed utilizes the [SocketStream framework](http://www.socketstream.org/) to run on web sockets. Basic browser compatibility for web sockets is [here](http://caniuse.com/#search=sockets).

We have currently only tested on Chrome, Firefox, and Safari browsers, and primarily in the Mac OS X environment. We assume that the majority of students playing this game will have access to the latest browser technology and so are not worried about large amounts of backward compatibility with older browsers.

The Civic Seed static pages (non-game pages) are responsive and designed to work in mobile and tablet screens. The game itself is not in a responsive-width content area so for best compatibility the game should be played on screens over 960px wide.

In addition, while Civic Seed was meant to work on an iPad, there is currently a major bug causing it to freeze (see [issue #153](https://github.com/engagementgamelab/CivicSeed/issues/153)).
