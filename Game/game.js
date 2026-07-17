const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#050505',
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

// 8 Lanes total: Indexes 0-3 for P1, Indexes 4-7 for P2
const laneX = [
    75, 158, 241, 325,  // Player 1 Lanes
    475, 558, 641, 725  // Player 2 Lanes
]; 
const targetY = 520; 
const noteSpeed = 5; 
const colors = [0xff0055, 0x00d4ff, 0x00ff77, 0xffdd00, 0xff0055, 0x00d4ff, 0x00ff77, 0xffdd00]; 
const hitZoneRadius = 50; 
const perfectZoneRadius = 20;

// --- STATE ARRAYS ---
let isGameStarted = false; 
let isGameOver = false;
let isHardwareConnected = false; 
let notesSpawned = 0;
let globalHighScore = 0; // Tracks the highest score across all replays
const MAX_NOTES = 20; 

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
let dividingLine; // Variable to hold the center line

// --- 1. PRELOAD ASSETS ---
function preload() {
    this.load.audio('bgm', 'assets/background_track.mp3');
    this.load.audio('hitSound', 'assets/laser_hit.wav');
    this.load.audio('missSound', 'assets/error_buzz.wav');
}

// --- 2. CREATE SCENE ---
function create() {
    // WIPE THE SLATE CLEAN FOR RESTARTS
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

    // DRAW TWO PLAYFIELD TRACKS
    this.add.rectangle(200, 300, 350, 600, 0x111111).setDepth(0);
    this.add.rectangle(25, 300, 2, 600, 0x333333).setDepth(0);
    this.add.rectangle(375, 300, 2, 600, 0x333333).setDepth(0);
    this.add.rectangle(200, targetY, 350, 2, 0xffffff).setAlpha(0.4).setDepth(1);

    this.add.rectangle(600, 300, 350, 600, 0x111111).setDepth(0);
    this.add.rectangle(425, 300, 2, 600, 0x333333).setDepth(0);
    this.add.rectangle(775, 300, 2, 600, 0x333333).setDepth(0);
    this.add.rectangle(600, targetY, 350, 2, 0xffffff).setAlpha(0.4).setDepth(1);

    // DRAW 8 HIT TARGETS
    for (let i = 0; i < 8; i++) {
        let target = this.add.circle(laneX[i], targetY, 35, colors[i]);
        target.setStrokeStyle(4, 0xffffff);
        target.setAlpha(0.3);
        target.setDepth(1);
        targets.push(target);
    }

    // DRAW 2-PLAYER UI
    for (let p = 0; p < 2; p++) {
        let uiCenter = p === 0 ? 200 : 600;
        scoreTexts[p] = this.add.text(uiCenter + 160, 20, '0', { font: 'bold 36px Arial', fill: '#ffffff' }).setOrigin(1, 0).setDepth(10); 
        multiplierTexts[p] = this.add.text(uiCenter - 160, 20, '', { font: 'bold 20px Arial', fill: '#00d4ff' }).setOrigin(0, 0).setAlpha(0).setDepth(10);
        comboTexts[p] = this.add.text(uiCenter, 220, '', { font: 'bold 42px Arial', fill: '#ffffff', align: 'center' }).setOrigin(0.5).setAlpha(0).setDepth(10);
    }

    // DRAW DIVIDING LINE (Hidden by default during the menu)
    dividingLine = this.add.rectangle(400, 300, 4, 600, 0xffffff).setDepth(100).setVisible(false); 

    // SET UP KEYBOARD CONTROLS
    this.input.keyboard.on('keydown-Q', () => fireLaser(0, this));
    this.input.keyboard.on('keydown-W', () => fireLaser(1, this));
    this.input.keyboard.on('keydown-E', () => fireLaser(2, this));
    this.input.keyboard.on('keydown-R', () => fireLaser(3, this));

    this.input.keyboard.on('keydown-U', () => fireLaser(4, this));
    this.input.keyboard.on('keydown-I', () => fireLaser(5, this));
    this.input.keyboard.on('keydown-O', () => fireLaser(6, this));
    this.input.keyboard.on('keydown-P', () => fireLaser(7, this));

    // --- MAIN MENU OVERLAY ---
    let menuOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85).setDepth(200);
    let titleText = this.add.text(400, 180, 'LASER ARCADE', { font: 'bold 64px Arial', fill: '#00d4ff' }).setOrigin(0.5).setDepth(200);
    
    let startBtn = this.add.text(400, 320, '[ START GAME ]', { font: 'bold 32px Arial', fill: '#ffdd00', backgroundColor: '#111111' }).setOrigin(0.5).setPadding(15).setInteractive().setDepth(200);
    
    startBtn.on('pointerover', () => startBtn.setFill('#ffffff'));
    startBtn.on('pointerout', () => startBtn.setFill('#ffdd00'));

    let connectBtn;
    
    // ONLY DRAW THE BUTTON IF WE HAVEN'T CONNECTED YET
    if (!isHardwareConnected) {
        connectBtn = this.add.text(400, 420, '[ CONNECT HARDWARE ]', { font: 'bold 24px Arial', fill: '#00ff77', backgroundColor: '#111111' }).setOrigin(0.5).setPadding(10).setInteractive().setDepth(200);

        connectBtn.on('pointerover', () => connectBtn.setFill('#ffffff'));
        connectBtn.on('pointerout', () => connectBtn.setFill('#00ff77'));

        connectBtn.on('pointerdown', async () => {
            await connectToArcadeHardware(this);
            isHardwareConnected = true; 
            connectBtn.setText('[ HARDWARE CONNECTED ]');
            connectBtn.setFill('#888888');
            connectBtn.disableInteractive(); 
        });
    }

    startBtn.on('pointerdown', () => {
        menuOverlay.destroy();
        titleText.destroy();
        startBtn.destroy();
        
        if (connectBtn) {
            connectBtn.destroy();
        }

        // Show the dividing line now that the game is starting
        dividingLine.setVisible(true);
        isGameStarted = true;
        
        if (this.cache.audio.exists('bgm')) {
            this.sound.play('bgm', { loop: true, volume: 0.5 });
        } else {
            console.warn("BGM not found - skipping audio to prevent crash.");
        }
        
        spawnerEvent = this.time.addEvent({
            delay: 800,
            callback: () => spawnNote(this),
            loop: true
        });
    });
}

// --- 3. GAME LOGIC ---
function fireLaser(laneIndex, scene) {
    if (!isGameStarted || isGameOver) return; 

    let player = laneIndex < 4 ? 0 : 1; 
    let target = targets[laneIndex];

    target.setAlpha(1); 
    target.setStrokeStyle(8, 0xffffff); 
    scene.time.delayedCall(100, () => {
        target.setAlpha(0.3);
        target.setStrokeStyle(4, 0xffffff);
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
                scoreTexts[player].setText(scores[player]);
                updateComboUI(scene, player, multiplier);

                let feedbackText = isPerfect ? "PERFECT" : "GOOD";
                let feedbackColor = isPerfect ? 0x00ff77 : 0x00d4ff; 
                showFloatingText(scene, laneX[laneIndex], targetY - 40, feedbackText, feedbackColor);

                note.destroy();
                notes.splice(i, 1);
                break; 
            }
        }
    }

    if (!hitSuccessful) {
        handleMiss(scene, laneIndex, player);
    }
}

function handleMiss(scene, laneIndex, player) {
    if (scene.cache.audio.exists('missSound')) {
        scene.sound.play('missSound', { volume: 0.6 });
    }
    
    misses[player]++;
    showFloatingText(scene, laneX[laneIndex], targetY - 40, "MISS", 0xff0055);
    
    combos[player] = 0;
    scene.tweens.add({
        targets: [comboTexts[player], multiplierTexts[player]],
        alpha: 0,
        duration: 150
    });
}

function updateComboUI(scene, player, multiplier) {
    if (combos[player] >= 3) {
        comboTexts[player].setText(combos[player] + 'x');
        comboTexts[player].setAlpha(0.8);
        
        if (multiplier > 1) {
            multiplierTexts[player].setText('MULT: ' + multiplier + 'x');
            multiplierTexts[player].setAlpha(1);
        }

        scene.tweens.add({
            targets: comboTexts[player],
            scale: { from: 1.1, to: 1 },
            duration: 100,
            ease: 'Power2'
        });
    }
}

function showFloatingText(scene, x, y, message, color) {
    let text = scene.add.text(x, y, message, {
        font: 'bold 20px Arial', fill: '#ffffff'
    }).setOrigin(0.5).setTint(color).setDepth(10);

    scene.tweens.add({
        targets: text,
        y: y - 40, 
        alpha: 0,  
        duration: 300, 
        onComplete: () => text.destroy() 
    });
}

function spawnNote(scene) {
    if (notesSpawned >= MAX_NOTES) {
        spawnerEvent.remove();
        return;
    }

    let p1Lane = Phaser.Math.Between(0, 3);
    let p2Lane = p1Lane + 4;

    let note1 = scene.add.circle(laneX[p1Lane], -50, 25, colors[p1Lane]).setDepth(2);
    note1.setBlendMode(Phaser.BlendModes.ADD); 
    note1.lane = p1Lane; 
    notes.push(note1);

    let note2 = scene.add.circle(laneX[p2Lane], -50, 25, colors[p2Lane]).setDepth(2);
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
            let player = note.lane < 4 ? 0 : 1;
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

    // Hide the dividing line when the game is over
    dividingLine.setVisible(false);

    scene.tweens.add({
        targets: [...scoreTexts, ...comboTexts, ...multiplierTexts],
        alpha: 0,
        duration: 500
    });

    let winnerText = "TIE GAME!";
    let winnerColor = '#ffffff';
    if (scores[0] > scores[1]) { winnerText = "PLAYER 1 WINS!"; winnerColor = '#00d4ff'; }
    if (scores[1] > scores[0]) { winnerText = "PLAYER 2 WINS!"; winnerColor = '#ff0055'; }
    
    scene.add.text(400, 45, winnerText, { font: 'bold 42px Arial', fill: winnerColor })
         .setOrigin(0.5).setDepth(30).setStroke('#000', 6);

    // Update and Display Global High Score
    let bestCurrentScore = Math.max(scores[0], scores[1]);
    if (bestCurrentScore > globalHighScore) {
        globalHighScore = bestCurrentScore;
    }

    scene.add.text(400, 95, "ALL-TIME HIGH SCORE: " + globalHighScore, { font: 'bold 22px Arial', fill: '#ffdd00' })
         .setOrigin(0.5).setDepth(30).setStroke('#000', 4);

    for (let p = 0; p < 2; p++) {
        let xCenter = p === 0 ? 200 : 600;
        let panelColor = p === 0 ? 0x00d4ff : 0xff0055;
        let pName = p === 0 ? "PLAYER 1" : "PLAYER 2";

        let totalAttempts = perfects[p] + goods[p] + misses[p];
        let accuracy = totalAttempts > 0 ? ((perfects[p] + (goods[p] * 0.5)) / totalAttempts) * 100 : 0;

        let panel = scene.add.rectangle(xCenter, 340, 360, 480, 0x000000, 0.85).setDepth(20);
        panel.setStrokeStyle(2, panelColor);

        scene.add.text(xCenter, 140, pName + ' RESULTS', { font: 'bold 28px Arial', fill: '#ffffff' }).setOrigin(0.5).setTint(panelColor).setDepth(20);

        let startY = 200;
        let spacing = 45;

        const addStat = (y, label, value, color = '#ffdd00') => {
            scene.add.text(xCenter - 140, y, label, { font: '22px Arial', fill: '#ffffff' }).setOrigin(0, 0.5).setDepth(20);
            scene.add.text(xCenter + 140, y, value.toString(), { font: 'bold 22px Arial', fill: color }).setOrigin(1, 0.5).setDepth(20);
        };

        addStat(startY, 'SCORE:', scores[p]);
        addStat(startY + spacing, 'ACCURACY:', accuracy.toFixed(2) + '%');
        addStat(startY + spacing * 2, 'MAX COMBO:', maxCombos[p] + 'x');
        
        scene.add.rectangle(xCenter, startY + spacing * 2.8, 300, 2, 0x333333).setDepth(20);

        addStat(startY + spacing * 3.5, 'PERFECT:', perfects[p], '#00ff77');
        addStat(startY + spacing * 4.5, 'GOOD:', goods[p], '#00d4ff');
        addStat(startY + spacing * 5.5, 'MISS:', misses[p], '#ff0055');
    }

    // RESTART BUTTON
    let restartBtn = scene.add.text(400, 560, '[ RESTART GAME ]', { 
        font: 'bold 28px Arial', fill: '#ffdd00', backgroundColor: '#111111'
    }).setOrigin(0.5).setPadding(10).setInteractive().setDepth(100);

    restartBtn.on('pointerdown', () => scene.scene.restart());
    restartBtn.on('pointerover', () => restartBtn.setFill('#ffffff'));
    restartBtn.on('pointerout', () => restartBtn.setFill('#ffdd00'));
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
                if (!isNaN(laneIndex) && laneIndex >= 0 && laneIndex <= 7) {
                    fireLaser(laneIndex, scene);
                }
            }
        }
    } catch (error) {
        console.error("Failed to connect to hardware:", error);
    }
}