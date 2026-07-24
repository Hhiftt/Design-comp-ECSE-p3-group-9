const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#0a0a0a',
    scale: {
        parent: 'game-container',
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.Center.CENTER_BOTH,
        width: 800,
        height: 600
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// --- GLOBAL VARIABLES ---
let targets = [];
let notes = [];

// 6 Lanes total: Indexes 0-2 for P1, Indexes 3-5 for P2
const laneX = [
    100, 200, 300,  // Player 1 Lanes
    500, 600, 700   // Player 2 Lanes
]; 
const targetY = 520; 
const noteSpeed = 2; 
const colors = [0xff00ff, 0x00ffff, 0x39ff14, 0xff00ff, 0x00ffff, 0x39ff14]; 
const hitZoneRadius = 40; 
const perfectZoneRadius = 15;

// --- STATE ARRAYS ---
let isGameStarted = false; 
let isGameOver = false;
let isHardwareConnected = false; 
let notesSpawned = 0;
let globalHighScore = 0; 
const MAX_NOTES = 30; 

let scores = [0, 0];
let combos = [0, 0];
let maxCombos = [0, 0];
let perfects = [0, 0];
let goods = [0, 0];
let misses = [0, 0];

// UI Arrays & Objects
let scoreTexts = [];
let comboTexts = [];
let multiplierTexts = [];
let spawnerEvent;
let dividingLine; 

// --- 1. PRELOAD ASSETS ---
function preload() {
    this.load.audio('bgm', 'assets/background_track.mp3');
    this.load.audio('hitSound', 'assets/laser_hit.wav');
    this.load.audio('missSound', 'assets/error_buzz.wav');
}

// --- 2. CREATE SCENE ---
function create() {
    isGameStarted = false;
    isGameOver = false;
    notesSpawned = 0;
    scores = [0, 0];
    combos = [0, 0];
    maxCombos = [0, 0];
    perfects = [0, 0];
    goods = [0, 0];
    misses = [0, 0];
    
    targets = []; 
    notes = [];
    scoreTexts = [];
    comboTexts = [];
    multiplierTexts = [];

    this.sound.stopAll(); 

    // GENERATE PIXEL ART TEXTURES
    createPixelTexture(this, 'pixel_target', false);
    createPixelTexture(this, 'pixel_note', true);

    // DRAW RETRO BACKGROUND GRID
    let grid = this.add.graphics();
    grid.lineStyle(1, 0x222222, 0.8);
    for(let x = 0; x <= 800; x += 40) { grid.moveTo(x, 0); grid.lineTo(x, 600); }
    for(let y = 0; y <= 600; y += 40) { grid.moveTo(0, y); grid.lineTo(800, y); }
    grid.strokePath();
    grid.setDepth(0);

    // DRAW TWO PLAYFIELD TRACKS
    this.add.rectangle(200, 300, 300, 600, 0x000000, 0.6).setDepth(0);
    this.add.rectangle(50, 300, 2, 600, 0x555555).setDepth(0);
    this.add.rectangle(350, 300, 2, 600, 0x555555).setDepth(0);

    this.add.rectangle(600, 300, 300, 600, 0x000000, 0.6).setDepth(0);
    this.add.rectangle(450, 300, 2, 600, 0x555555).setDepth(0);
    this.add.rectangle(750, 300, 2, 600, 0x555555).setDepth(0);

    // DRAW 6 HIT TARGETS (PIXEL CIRCLES)
    for (let i = 0; i < 6; i++) {
        let target = this.add.sprite(laneX[i], targetY, 'pixel_target');
        target.setTint(colors[i]);
        target.setAlpha(0.6);
        target.setDepth(1);
        targets.push(target);
    }

    // DRAW 2-PLAYER UI
    const retroFont = '"Courier New", Courier, monospace';
    
    for (let p = 0; p < 2; p++) {
        let uiCenter = p === 0 ? 200 : 600;
        scoreTexts[p] = this.add.text(uiCenter + 140, 20, '000000', { font: `bold 32px ${retroFont}`, fill: '#ffffff' }).setOrigin(1, 0).setDepth(10); 
        multiplierTexts[p] = this.add.text(uiCenter - 140, 20, '', { font: `bold 18px ${retroFont}`, fill: '#00ffff' }).setOrigin(0, 0).setAlpha(0).setDepth(10);
        comboTexts[p] = this.add.text(uiCenter, 220, '', { font: `bold 48px ${retroFont}`, fill: '#ffffff', align: 'center' }).setOrigin(0.5).setAlpha(0).setDepth(10);
    }

    dividingLine = this.add.graphics();
    dividingLine.lineStyle(4, 0xffffff, 1);
    dividingLine.lineBetween(400, 0, 400, 600);
    dividingLine.setDepth(100).setVisible(false); 

    // SET UP KEYBOARD CONTROLS
    this.input.keyboard.on('keydown-Q', () => fireLaser(0, this));
    this.input.keyboard.on('keydown-W', () => fireLaser(1, this));
    this.input.keyboard.on('keydown-E', () => fireLaser(2, this));

    this.input.keyboard.on('keydown-U', () => fireLaser(3, this));
    this.input.keyboard.on('keydown-I', () => fireLaser(4, this));
    this.input.keyboard.on('keydown-O', () => fireLaser(5, this));

    // CRT SCANLINES EFFECT
    let scanlines = this.add.graphics();
    scanlines.fillStyle(0x000000, 0.25);
    for(let i = 0; i < 600; i += 4) {
        scanlines.fillRect(0, i, 800, 2);
    }
    scanlines.setDepth(300);

    // MAIN MENU OVERLAY
    let menuOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9).setDepth(200);
    let titleText = this.add.text(400, 180, 'NEON STRIKE', { font: `bold 72px ${retroFont}`, fill: '#ff00ff', stroke: '#00ffff', strokeThickness: 4 }).setOrigin(0.5).setDepth(200);
    
    let startBtn = this.add.text(400, 320, '> PRESS START <', { font: `bold 32px ${retroFont}`, fill: '#ffff00' }).setOrigin(0.5).setInteractive().setDepth(200);
    
    this.tweens.add({
        targets: startBtn,
        alpha: 0,
        duration: 500,
        yoyo: true,
        repeat: -1
    });

    let connectBtn;
    
    if (!isHardwareConnected) {
        connectBtn = this.add.text(400, 440, '[ INIT HARDWARE ]', { font: `bold 20px ${retroFont}`, fill: '#39ff14', backgroundColor: '#111111' }).setOrigin(0.5).setPadding(10).setInteractive().setDepth(200);
        connectBtn.setStroke('#39ff14', 2);

        connectBtn.on('pointerover', () => connectBtn.setFill('#ffffff'));
        connectBtn.on('pointerout', () => connectBtn.setFill('#39ff14'));

        connectBtn.on('pointerdown', async () => {
            await connectToArcadeHardware(this);
            isHardwareConnected = true; 
            connectBtn.setText('HARDWARE : OK');
            connectBtn.setFill('#555555');
            connectBtn.disableInteractive(); 
        });
    }

    startBtn.on('pointerdown', () => {
        menuOverlay.destroy();
        titleText.destroy();
        startBtn.destroy();
        
        if (connectBtn) connectBtn.destroy();

        dividingLine.setVisible(true);
        isGameStarted = true;
        
        if (this.cache.audio.exists('bgm')) {
            this.sound.play('bgm', { loop: true, volume: 0.5 });
        }
        
        spawnerEvent = this.time.addEvent({
            delay: 1500,
            callback: () => spawnNote(this),
            loop: true
        });
    });
}

// --- 3. GAME LOGIC ---
function fireLaser(laneIndex, scene) {
    if (!isGameStarted || isGameOver) return; 

    let player = laneIndex < 3 ? 0 : 1; 
    let target = targets[laneIndex];

    // Swap to a filled white pixel circle to show activation
    target.setTexture('pixel_note');
    target.setTint(0xffffff);
    target.setAlpha(1);
    
    scene.time.delayedCall(80, () => {
        target.setTexture('pixel_target');
        target.setTint(colors[laneIndex]);
        target.setAlpha(0.6);
    });

    let hitSuccessful = false;

    for (let i = 0; i < notes.length; i++) {
        let note = notes[i];

        if (note.lane === laneIndex) {
            let distance = Math.abs(note.y - targetY);

            if (distance <= hitZoneRadius) {
                hitSuccessful = true;
                
                if (scene.cache.audio.exists('hitSound')) {
                    scene.sound.play('hitSound', { volume: 0.8 });
                }
                
                let isPerfect = distance <= perfectZoneRadius;
                if (isPerfect) perfects[player]++;
                else goods[player]++;

                combos[player]++;
                if (combos[player] > maxCombos[player]) maxCombos[player] = combos[player];

                let multiplier = Math.min(4, Math.floor(combos[player] / 10) + 1); 
                let points = (isPerfect ? 100 : 50) * multiplier;
                
                scores[player] += points;
                scoreTexts[player].setText(scores[player].toString().padStart(6, '0'));
                updateComboUI(scene, player, multiplier);

                let feedbackText = isPerfect ? "PERFECT" : "GOOD";
                let feedbackColor = isPerfect ? 0x39ff14 : 0x00ffff; 
                showFloatingText(scene, laneX[laneIndex], targetY - 40, feedbackText, feedbackColor);

                // Pixel explosion flash
                let flash = scene.add.sprite(laneX[laneIndex], targetY, 'pixel_note').setTint(0xffffff).setDepth(3);
                scene.tweens.add({ targets: flash, alpha: 0, scale: 1.5, duration: 150, onComplete: () => flash.destroy() });

                note.destroy();
                notes.splice(i, 1);
                break; 
            }
        }
    }

    if (!hitSuccessful) {
        handleWrongInput(scene, laneIndex, player);
    }
}

function handleWrongInput(scene, laneIndex, player) {
    if (scene.cache.audio.exists('missSound')) {
        scene.sound.play('missSound', { volume: 0.6 });
    }
    
    combos[player] = 0;
    scene.tweens.add({
        targets: [comboTexts[player], multiplierTexts[player]],
        alpha: 0,
        duration: 150
    });
    
    // Deduct points for hitting the wrong note
    let penalty = 25;
    scores[player] = Math.max(0, scores[player] - penalty);
    scoreTexts[player].setText(scores[player].toString().padStart(6, '0'));
    showFloatingText(scene, laneX[laneIndex], targetY - 40, "WRONG", 0xff0000);
}

function handleMiss(scene, laneIndex, player) {
    if (scene.cache.audio.exists('missSound')) {
        scene.sound.play('missSound', { volume: 0.6 });
    }
    
    misses[player]++;
    showFloatingText(scene, laneX[laneIndex], targetY - 40, "MISS", 0xff00ff);
}

function updateComboUI(scene, player, multiplier) {
    if (combos[player] >= 3) {
        comboTexts[player].setText(combos[player] + 'x');
        comboTexts[player].setAlpha(1);
        
        if (multiplier > 1) {
            multiplierTexts[player].setText('MULT:' + multiplier + 'x');
            multiplierTexts[player].setAlpha(1);
        }

        scene.tweens.add({
            targets: comboTexts[player],
            scale: { from: 1.2, to: 1 },
            duration: 100,
            ease: 'Bounce.easeOut'
        });
    }
}

function showFloatingText(scene, x, y, message, color) {
    let text = scene.add.text(x, y, message, {
        font: 'bold 22px "Courier New", Courier, monospace', fill: '#ffffff'
    }).setOrigin(0.5).setTint(color).setDepth(15);

    scene.tweens.add({
        targets: text,
        y: y - 50, 
        alpha: 0,  
        duration: 400, 
        onComplete: () => text.destroy() 
    });
}

function spawnNote(scene) {
    if (notesSpawned >= MAX_NOTES) {
        spawnerEvent.remove();
        return;
    }

    let p1Lane = Phaser.Math.Between(0, 2);
    let p2Lane = p1Lane + 3; 

    // Using the filled pixel texture for notes
    let note1 = scene.add.sprite(laneX[p1Lane], -50, 'pixel_note').setTint(colors[p1Lane]).setDepth(2);
    note1.setBlendMode(Phaser.BlendModes.ADD); 
    note1.lane = p1Lane; 
    notes.push(note1);

    let note2 = scene.add.sprite(laneX[p2Lane], -50, 'pixel_note').setTint(colors[p2Lane]).setDepth(2);
    note2.setBlendMode(Phaser.BlendModes.ADD); 
    note2.lane = p2Lane; 
    notes.push(note2);
    
    notesSpawned++;
}

function update() {
    if (!isGameStarted || isGameOver) return;

    for (let i = notes.length - 1; i >= 0; i--) {
        let note = notes[i];
        note.y += noteSpeed;

        if (note.y > targetY + hitZoneRadius) {
            let player = note.lane < 3 ? 0 : 1;
            handleMiss(this, note.lane, player);
            note.destroy(); 
            notes.splice(i, 1); 
        }
    }

    if (notesSpawned >= MAX_NOTES && notes.length === 0) {
        triggerGameOver(this);
    }
}

// --- 4. GAME OVER & RESTART ---
function triggerGameOver(scene) {
    isGameOver = true;
    scene.sound.stopAll(); 

    dividingLine.setVisible(false);

    scene.tweens.add({
        targets: [...scoreTexts, ...comboTexts, ...multiplierTexts],
        alpha: 0,
        duration: 500
    });

    let winnerText = "DRAW";
    let winnerColor = '#ffffff';
    if (scores[0] > scores[1]) { winnerText = "PLAYER 1 WINS"; winnerColor = '#00ffff'; }
    if (scores[1] > scores[0]) { winnerText = "PLAYER 2 WINS"; winnerColor = '#ff00ff'; }
    
    let retroFont = '"Courier New", Courier, monospace';

    scene.add.text(400, 60, winnerText, { font: `bold 48px ${retroFont}`, fill: winnerColor })
         .setOrigin(0.5).setDepth(30).setStroke('#000', 8);

    let bestCurrentScore = Math.max(scores[0], scores[1]);
    if (bestCurrentScore > globalHighScore) {
        globalHighScore = bestCurrentScore;
    }

    scene.add.text(400, 110, "HI-SCORE: " + globalHighScore.toString().padStart(6, '0'), { font: `bold 24px ${retroFont}`, fill: '#ffff00' })
         .setOrigin(0.5).setDepth(30).setStroke('#000', 4);

    for (let p = 0; p < 2; p++) {
        let xCenter = p === 0 ? 200 : 600;
        let panelColor = p === 0 ? 0x00ffff : 0xff00ff;
        let pName = p === 0 ? "PLAYER 1" : "PLAYER 2";

        let totalAttempts = perfects[p] + goods[p] + misses[p];
        let accuracy = totalAttempts > 0 ? ((perfects[p] + (goods[p] * 0.5)) / totalAttempts) * 100 : 0;

        let panel = scene.add.rectangle(xCenter, 320, 340, 340, 0x000000, 0.9).setDepth(20);
        panel.setStrokeStyle(4, panelColor);

        scene.add.text(xCenter, 190, pName, { font: `bold 28px ${retroFont}`, fill: '#ffffff' }).setOrigin(0.5).setTint(panelColor).setDepth(20);

        let startY = 200;
        let spacing = 40;

        const addStat = (y, label, value, color = '#ffff00') => {
            scene.add.text(xCenter - 130, y, label, { font: `20px ${retroFont}`, fill: '#ffffff' }).setOrigin(0, 0.5).setDepth(20);
            scene.add.text(xCenter + 130, y, value.toString(), { font: `bold 20px ${retroFont}`, fill: color }).setOrigin(1, 0.5).setDepth(20);
        };

        addStat(startY, 'SCORE', scores[p].toString().padStart(6, '0'));
        addStat(startY + spacing, 'ACCURACY', accuracy.toFixed(1) + '%');
        addStat(startY + spacing * 2, 'MAX COMBO', maxCombos[p]);
        
        scene.add.rectangle(xCenter, startY + spacing * 2.8, 280, 2, 0x333333).setDepth(20);

        addStat(startY + spacing * 3.5, 'PERFECT', perfects[p], '#39ff14');
        addStat(startY + spacing * 4.5, 'GOOD', goods[p], '#00ffff');
        addStat(startY + spacing * 5.5, 'MISS', misses[p], '#ff00ff');
    }

    let restartBtn = scene.add.text(400, 540, '> INSERT COIN TO RESTART <', { 
        font: `bold 24px ${retroFont}`, fill: '#ffff00', backgroundColor: '#000000'
    }).setOrigin(0.5).setInteractive().setDepth(100);

    scene.tweens.add({
        targets: restartBtn,
        alpha: 0.2,
        duration: 600,
        yoyo: true,
        repeat: -1
    });

    restartBtn.on('pointerdown', () => scene.scene.restart());
    restartBtn.on('pointerover', () => restartBtn.setFill('#ffffff'));
    restartBtn.on('pointerout', () => restartBtn.setFill('#ffff00'));
}

// --- 5. HARDWARE INTEGRATION ---
async function connectToArcadeHardware(scene) {
    try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        console.log("Hardware Connected Successfully!");

        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                reader.releaseLock();
                break;
            }
            if (value) {
                let cleanValue = value.trim();
                let laneIndex = parseInt(cleanValue);
                if (!isNaN(laneIndex) && laneIndex >= 0 && laneIndex <= 5) {
                    fireLaser(laneIndex, scene);
                }
            }
        }
    } catch (error) {
        console.error("Failed to connect to hardware:", error);
    }
}

// --- 6. DYNAMIC PIXEL ART GENERATOR ---
function createPixelTexture(scene, key, isFilled) {
    let g = scene.make.graphics();
    let size = 5; // Size of each "pixel" block (12 * 5 = 60x60 texture)
    
    let map = isFilled ? [
        "    1111    ",
        "  11111111  ",
        " 1111111111 ",
        " 1111111111 ",
        "111111111111",
        "111111111111",
        "111111111111",
        "111111111111",
        " 1111111111 ",
        " 1111111111 ",
        "  11111111  ",
        "    1111    "
    ] : [
        "    1111    ",
        "  11000011  ",
        " 1000000001 ",
        " 1000000001 ",
        "100000000001",
        "100000000001",
        "100000000001",
        "100000000001",
        " 1000000001 ",
        " 1000000001 ",
        "  11000011  ",
        "    1111    "
    ];
    
    g.fillStyle(0xffffff, 1);
    
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === '1') {
                g.fillRect(x * size, y * size, size, size);
            }
        }
    }
    
    g.generateTexture(key, map[0].length * size, map.length * size);
    g.destroy();
}