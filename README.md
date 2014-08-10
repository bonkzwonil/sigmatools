sigmatools
==========

Convert sigma rox 10.0 data to useable standard formats. slf2gpx


motivation
------
I bought myself a sigma rox 10.0 gps bike training computer. 
While it is a neat little device, the software and especially the export to strava sucks ass.
Their "data center 3" (besides that its adobe air crap), just fails to export correct data. For example all pauses are missing, Timezones are wrong. etcpp


But in the sigma own format "slf", all data seems to be present, even if sometimes in a very crude own way of doing things :)


So i digged into the fileformat and came up with a working solution for me: 


slf2gpx
------

slf2gps.js converts a sigma "slf" file to standard gpx with gpxtpx:TrackPointExtension extensions.


It can process the additional pause markers correctly, so the resulting gpx has correct timestamps for every track point!


In Basic usage it should suit your needs.


However you can also force it to not do some processing:


installation
------

prerequisites
-------
You need a working nodejs installation.
Probably do a ```pacman -S nodejs``` or whatever your distibution would like you to do...

Just clone the git repo and do a npm install:
```
git clone https://github.com/bonkzwonil/sigmatools.git
cd sigmatools
npm install
node slf2gpx.js input.slf output.gpx
```

usage:
------

```
Help: 
 -h or --help: this help
 -p or --nopauses: do not process pause markers. This will lead to wrong daytimes in trkpts
 -k or --keepnongps: do not filter out points without gps coords.
 -d or --debug: debug on
 -s or --silent: rig for silent running
```
 
 
 
 Im working on more tools to get rid of even using that "data center" software, so stay tuned while im analyzing the usb dumps :)
