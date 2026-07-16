const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#050505',
    scene: {
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
    75, 158, 241, 325,  // Player 1 Lanes (Centered around 200)
    475, 558, 641, 725  // Player 2 Lanes (Centered around 600)
]; 
const targetY = 520; 
const noteSpeed = 5; 

// Colors repeated for both players (Magenta, Cyan, Green, Yellow)
const colors = [0xff0055, 0x00d4ff, 0x00ff77, 0xffdd00, 0xff0055, 0x00d4ff, 0x00ff77, 0xffdd00]; 

const hitZoneRadius = 50; 
const perfectZoneRadius = 20;

// --- 2-PLAYER STATE ARRAYS ---
let isGameOver = false;
let notesSpawned = 0;
const MAX_NOTES = 20; 

// Index 0 = P1, Index 1 = P2
let scores = [0, 0];
let combos = [0, 0];
let maxCombos = [0, 0];
let perfects = [0, 0];
let goods = [0, 0];
let misses = [0, 0];

// UI Arrays
let scoreTexts = [];
let comboTexts = [];
let multiplierTexts = [];
let spawnerEvent;

function create() {
    // 1. DRAW TWO PLAYFIELD TRACKS
    // Player 1 Track
    this.add.rectangle(200, 300, 350, 600, 0x111111).setDepth(0);
    this.add.rectangle(25, 300, 2, 600, 0x333333).setDepth(0);
    this.add.rectangle(375, 300, 2, 600, 0x333333).setDepth(0);
    this.add.rectangle(200, targetY, 350, 2, 0xffffff).setAlpha(0.4).setDepth(1);

    // Player 2 Track
    this.add.rectangle(600, 300, 350, 600, 0x111111).setDepth(0);
    this.add.rectangle(425, 300, 2, 600, 0x333333).setDepth(0);
    this.add.rectangle(775, 300, 2, 600, 0x333333).setDepth(0);
    this.add.rectangle(600, targetY, 350, 2, 0xffffff).setAlpha(0.4).setDepth(1);

    // 2. DRAW 8 HIT TARGETS
    for (let i = 0; i < 8; i++) {
        let target = this.add.circle(laneX[i], targetY, 35, colors[i]);
        target.setStrokeStyle(4, 0xffffff);
        target.setAlpha(0.3);
        target.setDepth(1);
        targets.push(target);
    }

    // 3. DRAW 2-PLAYER UI
    for (let p = 0; p < 2; p++) {
        let uiCenter = p === 0 ? 200 : 600;

        // Score (Top Right of their respective track)
        scoreTexts[p] = this.add.text(uiCenter + 160, 20, '0', { 
            font: 'bold 36px Arial', fill: '#ffffff' 
        }).setOrigin(1, 0).setDepth(10); 

        // Multiplier (Top Left of their respective track)
        multiplierTexts[p] = this.add.text(uiCenter - 160, 20, '', { 
            font: 'bold 20px Arial', fill: '#00d4ff' 
        }).setOrigin(0, 0).setAlpha(0).setDepth(10);

        // Combo
        comboTexts[p] = this.add.text(uiCenter, 220, '', { 
            font: 'bold 42px Arial', fill: '#ffffff', align: 'center' 
        }).setOrigin(0.5).setAlpha(0).setDepth(10);
    }

    // Divider Line Down the Middle of the Screen
    this.add.rectangle(400, 300, 4, 600, 0xffffff).setDepth(100);

    // 4. START SPAWNER
    spawnerEvent = this.time.addEvent({
        delay: 800,
        callback: spawnNote,
        callbackScope: this,
        loop: true
    });

    // 5. SET UP KEYBOARD CONTROLS (P1 = QWER, P2 = UIOP)
    this.input.keyboard.on('keydown-Q', () => fireLaser(0, this));
    this.input.keyboard.on('keydown-W', () => fireLaser(1, this));
    this.input.keyboard.on('keydown-E', () => fireLaser(2, this));
    this.input.keyboard.on('keydown-R', () => fireLaser(3, this));

    this.input.keyboard.on('keydown-U', () => fireLaser(4, this));
    this.input.keyboard.on('keydown-I', () => fireLaser(5, this));
    this.input.keyboard.on('keydown-O', () => fireLaser(6, this));
    this.input.keyboard.on('keydown-P', () => fireLaser(7, this));

    // Add this inside your create() function
    let connectBtn = this.add.text(400, 560, '[ CONNECT HARDWARE ]', { 
        font: 'bold 24px Arial', 
        fill: '#00ff77',
        backgroundColor: '#111111'
    }).setOrigin(0.5).setPadding(10).setInteractive().setDepth(100);

    // When the user clicks the text, it runs the USB connection function
    connectBtn.on('pointerdown', async () => {
        // We pass 'this' so the hardware function can trigger the laser in the current scene
        await connectToArcadeHardware(this);
    
        // Remove the button from the screen once connected
        connectBtn.destroy(); 
    });
}

function fireLaser(laneIndex, scene) {
    if (isGameOver) return; 

    // Determine which player fired (Lanes 0-3 = P1, 4-7 = P2)
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

function spawnNote() {
    if (notesSpawned >= MAX_NOTES) {
        spawnerEvent.remove();
        return;
    }

    // Pick a random lane for Player 1 (0 to 3)
    let p1Lane = Phaser.Math.Between(0, 3);
    // Player 2 gets the exact equivalent target (e.g., if P1 gets Target 2, P2 gets Target 2, which is index + 4)
    let p2Lane = p1Lane + 4;

    // Spawn for P1
    let note1 = this.add.circle(laneX[p1Lane], -50, 25, colors[p1Lane]).setDepth(2);
    note1.setBlendMode(Phaser.BlendModes.ADD); 
    note1.lane = p1Lane; 
    notes.push(note1);

    // Spawn identical note for P2
    let note2 = this.add.circle(laneX[p2Lane], -50, 25, colors[p2Lane]).setDepth(2);
    note2.setBlendMode(Phaser.BlendModes.ADD); 
    note2.lane = p2Lane; 
    notes.push(note2);
    
    notesSpawned++;
}

function update() {
    if (isGameOver) return;

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

function triggerGameOver(scene) {
    isGameOver = true;

    scene.tweens.add({
        targets: [...scoreTexts, ...comboTexts, ...multiplierTexts],
        alpha: 0,
        duration: 500
    });

    // Determine Winner for the Title
    let winnerText = "TIE GAME!";
    let winnerColor = '#ffffff';
    if (scores[0] > scores[1]) { winnerText = "PLAYER 1 WINS!"; winnerColor = '#00d4ff'; }
    if (scores[1] > scores[0]) { winnerText = "PLAYER 2 WINS!"; winnerColor = '#ff0055'; }
    
    scene.add.text(400, 50, winnerText, { font: 'bold 42px Arial', fill: winnerColor })
         .setOrigin(0.5).setDepth(30).setStroke('#000', 6);

    // DRAW BOTH PANELS
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
}

// This function requires a user to click a button on the webpage first!
async function connectToArcadeHardware(scene) {
    try {
        // 1. Prompt the user to select the USB MCU
        const port = await navigator.serial.requestPort();
        
        // 2. Open the connection (Make sure your friends set their MCU to this same baud rate!)
        await port.open({ baudRate: 115200 });
        console.log("Hardware Connected Successfully!");

        // 3. Set up a decoder to turn electrical signals into readable text
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();

        // 4. The Infinite Listening Loop
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                reader.releaseLock();
                break;
            }
            
            if (value) {
                // The incoming value might have hidden line breaks (like "4\r\n"). 
                // We clean it up, turn it into an integer, and fire the laser!
                let cleanValue = value.trim();
                let laneIndex = parseInt(cleanValue);
                
                // Ensure it's a valid lane (0 through 7) before firing
                if (!isNaN(laneIndex) && laneIndex >= 0 && laneIndex <= 7) {
                    fireLaser(laneIndex, scene);
                }
            }
        }
    } catch (error) {
        console.error("Failed to connect to hardware:", error);
    }
}