const keys = {}; 
const mouse = { x: 0, y: 0, down: false };

window.addEventListener('keydown', e => { 
    if (e.key === 'Escape') Game.togglePause(); 
    
    // Simple dev mode toggle with backslash key
    if (e.key === '\\') {
        if (typeof DevMode !== 'undefined') {
            DevMode.toggle();
        }
    }
    
    keys[e.key.toLowerCase()] = true; 
});

window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

window.addEventListener('mousemove', e => { 
    mouse.x = e.clientX; 
    mouse.y = e.clientY; 
});

window.addEventListener('mousedown', () => mouse.down = true);
window.addEventListener('mouseup', () => mouse.down = false);