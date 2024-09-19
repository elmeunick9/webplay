const fade = (time, duration, span, max, fn) => {
    tween.quadratic(time, 0, 0, span, max, fn)
    tween.linear(time, span, max, duration - span, max, fn)
    tween.quadratic(time, duration - span, max, duration, 0, fn)
}

/** Selects random element from an array, removes and returns it */
const pick = (arr) => {
    if (arr.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr.splice(randomIndex, 1)[0];
}

/** Creates a standard image track.
 * 
 * It implements fade-in & fade-out and centers the image.
 * 
 * @argument {number} layer - the layer id
 * @argument {string} img - the image, an array [url, x-offset, y-offset, scale] 
 * @argument {number} startTime - the start time
 * @argument {number} duration - the duration
 **/
const createImageTrack = (layer, img, startTime, duration = 50) => {
    return {
        layerId: layer,
        mediaType: 'image',
        source: img[0],
        startTime: startTime,
        endTime: startTime + duration,
        init: (element) => {
            element.style.cssText = `transform: translate(calc(-50% + 1920px / 2 + ${img[1]}px), calc(-50% + 1080px / 2 + ${img[2]}px)) scale(${img[3]});`;
            element.style.maxWidth = '1920px';
            element.style.maxHeight = '1080px';
            element.style.opacity = 0;
        },
        update: (element, time, duration) => {
            fade(time, duration, 20, 0.8, value => element.style.opacity = value)
        }
    }
}

let carry_time = 0
const t = (time) => {
    const parseColonTime = (str) => {
        const parts = str.split(':').reverse();
        if (parts.length === 2) return parseInt(parts[1]) * 60 + parseFloat(parts[0]);
        if (parts.length === 3) return parseInt(parts[2]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[0]);
        console.log(str);
        throw new Error('Invalid time format');
    };

    const parseTimeWithUnits = (str) => {
        const regex = /(\d+(\.\d+)?)(h|m|s|ms)?/;
        const match = str.match(regex);
        if (!match) {
            console.log(str);
            throw new Error('Invalid time format!');
        }

        const value = parseFloat(match[1]);
        const unit = match[3];

        if (unit) unit_used = true

        switch (unit) {
            case 'h': return value * 3600;
            case 'm': return value * 60;
            case 's': return value;
            case 'ms': return value / 1000;
            default: return value;
        }
    };

    if (typeof time === 'number') {
        carry_time = time;
        return carry_time;
    };

    let multiplier = 1;
    time = time.trim();
    if (time[0] !== '+' && time[0] !== '-') carry_time = 0;
    else {
        if (time[0] === '-') multiplier = -1;
        time = time.slice(1);
    }

    const chunks = time.split(' ').map(x => x.trim()).filter(x => x.length > 0);
    let dt = 0;

    chunks.forEach(chunk => {
        if (chunk.includes(':')) dt += parseColonTime(chunk);
        else dt += parseTimeWithUnits(chunk);
    });

    carry_time += dt * multiplier;
    return carry_time;
}

const repeat = (track, times = 2, fn) => {
    const duration = track.endTime - track.startTime;
    const arr = [];
    for (let i = 0; i < times; i++) {
        arr.push({
            ...track,
            startTime: track.startTime + duration * i,
            endTime: track.startTime + duration * (i + 1)
        });
    }

    fn && fn(track.startTime + duration * times);
    return arr;
}