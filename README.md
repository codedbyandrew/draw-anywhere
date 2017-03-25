## Install Guide:

Install Node.js LTS (https://nodejs.org/en/download/).
Tested functional with Node version 6.9.4 on macOS.

Note: if the npm install command fails with an ```EACCESS``` error you may have to run it again with ```sudo```:

```
$ cd /path/to/folder 
$ git clone https://github.com/codedbyandrew/draw-anywhere.git 
$ cd draw-anywhere 
$ npm install 
$ npm start
```
Entering text in the terminal will forward to the serial port if a terminal port has been opened.
