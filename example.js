config = [
    {
        layerId: 1,
        mediaType: 'video',
        source: 'http://docs.evostream.com/sample_content/assets/bun33s.mp4',
        trimStart: 10,
        startTime: 0,
        endTime: 10,
    },
    {
        layerId: 2,
        mediaType: 'image',
        source: 'https://placehold.co/600x400',
        startTime: 2,
        endTime: 10,
        init: (element) => {
            element.style.cssText = `transform: translate(calc(-50% + 1920px / 2), calc(-50% + 1080px / 2)) scale(0.7) rotate(${0}deg);`;
            element.style.opacity = 0;
        },
        update: (element, time, duration) => {
            tween.linear(time, 0, 0, duration, 360*duration, value => {
                element.style.cssText = `transform: translate(calc(-50% + 1920px / 2), calc(-50% + 1080px / 2)) scale(0.7) rotate(${value}deg);`;
            });
            tween.linear(time, 0, 0, duration, 1, value => element.style.opacity = value);
        }
    },
    {
        layerId: 3,
        mediaType: 'block',
        startTime: 5,
        endTime: 8,
        init: (element) => {
            element.style.opacity = 0.7;
            element.style.backgroundColor = 'green';
        },
    },
    {
        layerId: 4,
        mediaType: 'block',
        startTime: 5,
        endTime: 8,
        init: (element) => {
            element.style.marginTop = '400px';
            element.style.textAlign = 'center';
            element.style.color = 'white';
            element.style.fontSize = '130px';
        },
        update: (element, time, duration) => {
            element.innerHTML = `Count Down: ${(Math.ceil(duration - time)).toFixed(0)}`
        }
    },
]
