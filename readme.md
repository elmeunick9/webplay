This a tiny video editor and playback system written in JavaScript. 

It does not render real video, instead it can be used to load standard media and other HTML elements in the browser and animate them on a timeline.

This program is not a UI for creating videos! The only interface available is for playback. Videos are edited directly in a JS file that can be loaded from the player.

# How to install
 * Download `index.html` in a folder in your computer.
 * Place any resources you want to load in the same folder (or subfolder).
    * Or you can load files on the internet that are publicly accessible through a link.
 * Create your *playback JS file* and place it anywhere, see `example.js`.
    * You may want to use helper functions available in `helpers.js`, copy-paste as needed.
 * Open `index.html` in your browser, click on the "Browse" button and select your *playback JS file*. You can now play the video. 

## Gotchas
 * When loading resources from a URL you may need to wait a bit for the resources to download before attempting to play.
 * Seeking on video is approximate, the playback will try to autocorrect by slightly changing the video speed as needed.

## Tricks
 * Edit the code of index.html directly to suit your needs. By doing so you can:
    * Change the video resolution (by default 1920x1080) and the animations framerate (by default 30fps).
    * Inject your playback JS file directly and remove the browse button, then upload everything into a static file server (e.g a bucket, or GitHub Pages, etc) to share the video.
    * Create your custom tweening functions or use a library.
 * To render the result into a real video you may use a screen capture program and play the video on full-screen with the toolbar hidden (press H key & space).
 * You have the full power of JS for video edition, use it, see `helpers.js` for examples on how to do some cool stuff, but also feel free to implement your own.

# Editing

## Basic usage
Your playback file should export a global `config` array where each item represents a track in the video. Tracks must be placed on a layer, where 1 is the bottom layer. Two tracks can not overlap on the same layer. Time is always in seconds. The order of the tracks does not matter, but they must specify start and end times. Example:

```
config = [
    // Video tracks
    {
        layerId: 1,
        mediaType: 'video',
        source: 'video1.mp4',
        startTime: 0,
        endTime: 10.0,
    },
    {
        layerId: 1,
        mediaType: 'video',
        source: 'video2.mp4',
        startTime: 10.0,
        endTime: 20.0,
    },

    // Voice over
    {
        layerId: 2,
        mediaType: 'audio',
        source: 'voice.mp3',
        startTime: 0,
        endTime: 20.0,
    },
]
```

## Trimming

You can trim from the start or end of any video or audio using the optional `trimStart` and `trimEnd` properties. Example:

```
config = [
    {
        layerId: 1,
        mediaType: 'video',
        source: 'video1.mp4',
        startTime: 0,
        trimStart: 5,
        endTime: 5.0,
    },
    {
        layerId: 1,
        mediaType: 'video',
        source: 'video1.mp4',
        startTime: 5.0,
        endTime: 10.0,
        trimEnd: 5,
    }
]
```

## Animations

Animations are performed through the `init` and `update` handlers. These properties take the created HTML element as parameter and can be used to modify it directly. Example:

```
config = [
    {
        layerId: 1,
        mediaType: 'video',
        source: 'video1.mp4',
        startTime: 0,
        endTime: 10,
        init: (element) => {
            element.style.opacity = 0;
        },
        update: (element, time, duration) => {
            element.style.opacity = time / duration;
        }
    }
]
```

Note that the `time` parameter is the time in seconds since the `startTime` of the track. The `init` handler is called on file load, while the `update` handler is called continuously between `startTime` and `endTime`.

### Tween

Included in the `index.html` code there is super-tiny tween library implementation. The usage is as follows:

```
tween.linear(time, startTime, startValue, endTime, endValue, fn)
tween.quadratic(time, startTime, startValue, endTime, endValue, fn)
```

Example:
```
config = [{
    [...]
    update: (element, time, duration) => {
        tween.linear(time, 0, 0, duration/2, 1, value => {
            element.style.opacity = value
        })
        tween.linear(time, duration/2, 1, duration, 1, value => {
            element.style.opacity = value
        })
    }
}]

```

#### Gotchas
Tween have no effect outside the time-frame specified, that means that out of bound updates may result in undefined behavior. For example, if the code above had only the first tween it would fail to set the opacity to 1 if you skip (i.e seek) directly to startTime + duration/2, since it will also skip the effect. To avoid this ensure tween effects cover the full length of the track without gaps.

#### Fade-in & Fade-out

This effects are common and can be implemented using the tween functions as follows:

```
const fade = (time, duration, span, max, fn) => {
    // Fade-in
    tween.quadratic(time, 0, 0, span, max, fn)

    // Constant
    tween.linear(time, span, max, duration - span, max, fn)

    // Fade-out
    tween.quadratic(time, duration - span, max, duration, 0, fn)
}
```

This is a standard utility function that you can find in `helpers.js`, just copy-paste it above your config declaration in your playback JS file.

You can use that function for volume instead of opacity as follows:

```
update: (element, time, duration) => {
    fade(time, duration, 10, 0.5, x => element.volume = x)
}
```

#### Transformations
Transformations include positioning, rotation and scaling. This can be achieved with the standard CSS property [transform](https://developer.mozilla.org/en-US/docs/Web/CSS/transform).

Example:
```
tween.linear(time, 0, 0, duration, 360*duration, value => {
    element.style.cssText = `transform: translate(calc(-50% + 1920px / 2), calc(-50% + 1080px / 2)) scale(0.7) rotate(${value}deg);`;
});
```

**Gotchas:**

* Only one transform CSS property is allowed at the same time, that means you must combine multiple transforms into one like in the example above.
* When combining multiple transforms, the order matters.
* If you use cssText (transform seems bugged?), it will replace any other CSS property you have defined, so make sure it's the first one you apply in the `update` handler.

## Timer

A basic timer functionality is implemented in the `helpers.js` file. It allows to use strings to specify time, as well as add or subtract time to the last timed value. E.g:

```
t(10)           = 10
t("10")         = 10
t("10s")        = 10
t("2m 10s")     = 60*2 + 10
t("02:10")      = 60*2 + 10
t("1:01:01.01") = 60*60*1 + 60*1 + 1 + 1/1000
t("00:00")      = 0
t("12.6s")      = 12.6
t("+ 3s")       = 12.6 + 3
t("+ 1:00")     = 12.6 + 3 + 60*1
t("- 1m")       = 12.6 + 3 + 60*1 - 60*1
```

You can use it to define tracks based on previous values like so:

```
config = [
    {
        layerId: 1,
        mediaType: 'video',
        source: 'video1.mp4',
        startTime: t("0:00"),
        endTime: t("+ 00:10"),
    },
    {
        layerId: 1,
        mediaType: 'video',
        source: 'video2.mp4',
        startTime: t("+ 0:00"),
        endTime: t("+ 00:10"),
    },
]
```

## Track creation functions

You can make functions that generate one or more tracks, an example for this is the included `repeat` function:

```
repeat(track, times = 2, fn = undefined)
```

You can use this function to insert a number of consecutive repetitions of the same track (e.g. loop a video/audio n times). The `fn` callback is used to inform about the calculated endTime of the last track (e.g. to set a timer for subsequent calls).

Example:

```
config = [
    ...repeat({
        layerId: 1,
        mediaType: 'video',
        source: 'video1.mp4',
        startTime: t("0:00"),
        endTime: t("+ 00:10"),
    }, 5, (time) => t(time)),
    {
        layerId: 1,
        mediaType: 'video',
        source: 'video2.mp4',
        startTime: t("+ 0:00"),
        endTime: t("+ 00:10"),
    },
]
```

### Generate slideshow

To create a slideshow first we need to create an array of all the image paths we want to include. There are many ways to do this but one of the easiest is to do so with a terminal, on windows with CMD go to the folder where your images are and run `dir`, on linux you can use the `ls` command. Copy all contents (`ctrl+c`).

You should get something like this:

```
09/19/2024  12:23 PM    <DIR>          .
09/19/2024  12:23 PM    <DIR>          ..
06/10/2021  06:53 PM         3,017,806 1600008809347.png
04/13/2024  04:58 PM           168,782 676DD33A11D.jpg
08/03/2020  04:01 PM            65,262 asssjsr0npe50.webp
```

We need to transform this into an array format:

```
const images = [
    "1600008809347.png",
    "676DD33A11D.jpg",
    "asssjsr0npe50.webp",
]
```

To do this you can either ask a LLM (ChatGPT), or use the multi-cursor feature of VSCode (Ctrl+Alt+Arrow to select the start of the line and the line end key on your keyboard).

Once you have the array you can create a function to generate a track from a random image using the included `pick` function, e.g:

```
const createImageTrack = () => ({
    layerId: 1,
    mediaType: 'image',
    source: pick(images),
    startTime: t("+ 00:00"),
    endTime: t("+ 00:10"),
    init: (element) => {
        element.style.cssText = `transform: translate(calc(-50% + 1920px / 2), calc(-50% + 1080px / 2));`;
        element.style.maxWidth = '1920px';
        element.style.maxHeight = '1080px';
        element.style.opacity = 0;
    },
    update: (element, time, duration) => {
        fade(time, duration, 20, 0.8, value => element.style.opacity = value)
    }
})
```

Then you use it like this:

```
config = [
    ...Array(50).fill(null).map(createImageTrack)
]
```

# License (MIT)

Copyright 2024 Robert Planas Jimenez

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.