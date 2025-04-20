// Game variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let gameActive = false;
let gameTime = 0;
let score = 0;
let level = 1;
let health = 100;
let playerX, playerY;
let playerSpeed = 4;
let enemies = [];
let projectiles = [];
let experienceOrbs = [];
let particles = [];
let lastEnemySpawn = 0;
let enemySpawnInterval = 1000;
let gameInterval;
let gameTimeInterval;
let frameCount = 0;
let skillPoints = 0;
let levelUpPending = false;
let experience = 0;
let experienceToNextLevel = 250;

// Player properties
const playerSize = 30;
const playerColor = '#8a2be2';

// Skill system
const skills = {
    attack: {
        name: "공격력",
        emoji: "💥",
        level: 1,
        description: "공격력이 증가합니다",
        maxLevel: 5,
        effect: (level) => {
            return 10 + (level * 7);
        }
    },
    speed: {
        name: "공격 속도",
        emoji: "⚡",
        level: 1,
        description: "공격 속도가 증가합니다",
        maxLevel: 5,
        effect: (level) => {
            return Math.max(100, 600 - (level * 120));
        }
    },
    projectiles: {
        name: "발사체 수",
        emoji: "🔮",
        level: 1,
        description: "동시에 발사되는 발사체 수가 증가합니다",
        maxLevel: 3,
        effect: (level) => {
            return level + 1;
        }
    },
    experience: {
        name: "경험치 획득",
        emoji: "🌟",
        level: 1,
        description: "경험치 획득량이 증가합니다",
        maxLevel: 5,
        effect: (level) => {
            return 1 + (level * 0.3);
        }
    },
    health: {
        name: "체력 증가",
        emoji: "❤️",
        level: 1,
        description: "최대 체력이 증가합니다",
        maxLevel: 5,
        effect: (level) => {
            return 100 + (level * 30);
        }
    },
    magnet: {
        name: "자석 효과",
        emoji: "🧲",
        level: 1,
        description: "경험치 구슬을 더 멀리서도 흡수합니다",
        maxLevel: 3,
        effect: (level) => {
            return 100 + (level * 70);
        }
    },
    fire: {
        name: "화염 구체",
        emoji: "🔥",
        level: 0,
        description: "적을 불태우는 화염 구체를 발사합니다",
        maxLevel: 5,
        effect: (level) => {
            return level * 5;
        },
        unlocked: false
    },
    ice: {
        name: "얼음 화살",
        emoji: "❄️",
        level: 0,
        description: "적을 둔화시키는 얼음 화살을 발사합니다",
        maxLevel: 5,
        effect: (level) => {
            return 0.2 + (level * 0.15);
        },
        unlocked: false
    },
    lightning: {
        name: "번개 체인",
        emoji: "⚡",
        level: 0,
        description: "적들 사이를 튀어다니는 번개를 발사합니다",
        maxLevel: 5,
        effect: (level) => {
            return level + 2;
        },
        unlocked: false
    },
    poison: {
        name: "독 구름",
        emoji: "☠️",
        level: 0,
        description: "적을 중독시키는 구름을 생성합니다",
        maxLevel: 5,
        effect: (level) => {
            return level * 4;
        },
        unlocked: false
    },
    wind: {
        name: "회오리",
        emoji: "🌪️",
        level: 0,
        description: "주변 적들을 밀어내는 회오리를 생성합니다",
        maxLevel: 5,
        effect: (level) => {
            return 70 + (level * 30);
        },
        unlocked: false
    }
};

// Input handling
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Assets
const playerImage = new Image();
playerImage.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0Ij48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMCIgZmlsbD0iIzhhMmJlMiIvPjxwYXRoIGQ9Ik0yMiAyMmwxMCAxMG0wIDBsMTAtMTBNMjAgMzZjOCAxNSAyNCAxNSAzMiAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==';

const enemyImage = new Image();
enemyImage.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0Ij48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMCIgZmlsbD0iI2ZmNTU1NSIvPjxwYXRoIGQ9Ik0yMCAyMGwxMCAxMG0xNCAwbDEwLTEwTTIwIDM2YzggLTQgMTYgLTQgMzIgMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48L3N2Zz4=';

// 사운드 관리 객체
const sounds = {
    bgm: null,
    attack: null,
    hit: null,
    levelUp: null,
    gameOver: null,
    exp: null,
    fire: null,
    ice: null,
    lightning: null,
    poison: null,
    wind: null
};

// 오디오 컨텍스트와 노드들
let audioContext;
let masterGain;
let reverbNode;
let delayNode;
let compressorNode;

// 사운드 설정
const soundSettings = {
    bgmVolume: 0.5,
    sfxVolume: 0.7,
    reverbAmount: 0.3,
    delayAmount: 0.2
};

// Event listeners
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('restart-button').addEventListener('click', restartGame);

// 가시성 변경 이벤트 리스너 추가
document.addEventListener('visibilitychange', handleVisibilityChange);

// Key listeners
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

// Remove duplicate event listeners
document.removeEventListener('keydown', handleKeyDown);
document.removeEventListener('keyup', handleKeyUp);
document.removeEventListener('mousemove', handleMouseMove);
document.removeEventListener('click', handleClick);

// Skill selection setup
function setupSkillButtons() {
    const skillButtons = document.querySelectorAll('.skill-button');
    skillButtons.forEach(button => {
        button.addEventListener('click', function() {
            const skillType = this.getAttribute('data-skill');
            upgradeSkill(skillType);
            hideLevelUpScreen();
            resumeGame();
        });
    });
}

// Game initialization
function init() {
    // Set canvas dimensions to match container
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Initialize player position
    playerX = canvas.width / 2 - playerSize / 2;
    playerY = canvas.height / 2 - playerSize / 2;
    
    // Setup skill selection
    setupSkillButtons();
    
    // 사운드 초기화
    initSounds();
}

// Game loop
function gameLoop() {
    if (!gameActive || levelUpPending) return;
    
    frameCount++;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Handle player movement
    updatePlayer();
    
    // Handle projectiles
    updateProjectiles();
    
    // Handle experience orbs
    updateExperienceOrbs();
    
    // Handle particles
    updateParticles();
    
    // Check for enemy spawning
    if (Date.now() - lastEnemySpawn > enemySpawnInterval) {
        spawnEnemy();
        lastEnemySpawn = Date.now();
    }
    
    // Update and draw enemies
    updateEnemies();
    
    // Auto attack
    if (frameCount % Math.floor(60 * skills.speed.effect(skills.speed.level) / 1000) === 0) {
        fireProjectile();
    }
    
    // Check collisions
    checkCollisions();
    
    // Update HUD
    updateHUD();
    
    // Check for level up
    if (experience >= experienceToNextLevel) {
        showLevelUpScreen();
    }
    
    // Check for game over
    if (health <= 0) {
        endGame();
    }
}

// Player update
function updatePlayer() {
    // Movement with WASD
    if (keys.w && playerY > 0) playerY -= playerSpeed;
    if (keys.s && playerY < canvas.height - playerSize) playerY += playerSpeed;
    if (keys.a && playerX > 0) playerX -= playerSpeed;
    if (keys.d && playerX < canvas.width - playerSize) playerX += playerSpeed;
    
    // Draw player
    ctx.drawImage(playerImage, playerX, playerY, playerSize, playerSize);
}

// Experience orb update
function updateExperienceOrbs() {
    for (let i = experienceOrbs.length - 1; i >= 0; i--) {
        const orb = experienceOrbs[i];
        
        // Animate glow
        orb.glowSize = Math.sin(orb.animFrame) * 3 + 5;
        orb.animFrame += 0.1;
        
        // Draw glow
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size + orb.glowSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.fill();
        
        // Draw orb
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
            orb.x, orb.y, 0,
            orb.x, orb.y, orb.size
        );
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(1, '#0088ff');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Check collision with player
        const dx = playerX + playerSize / 2 - orb.x;
        const dy = playerY + playerSize / 2 - orb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const magnetRange = skills.magnet.effect(skills.magnet.level);
        
        if (distance < playerSize / 2 + orb.size) {
            // Add experience
            experience += orb.value;
            // Create collection effect
            createCollectionEffect(orb.x, orb.y, orb.value);
            // Remove orb
            experienceOrbs.splice(i, 1);
            playSound('exp');
        } else if (distance < magnetRange) {
            // Move towards player
            const speed = (magnetRange - distance) / 10;
            orb.x += (dx / distance) * speed;
            orb.y += (dy / distance) * speed;
        }
    }
}

// Create collection effect
function createCollectionEffect(x, y, value) {
    const particleCount = Math.min(10, Math.floor(value / 10));
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2;
        const size = Math.random() * 3 + 2;
        const lifetime = Math.random() * 30 + 20;
        
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size,
            lifetime,
            color: '#00ffff'
        });
    }
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.lifetime--;
        p.size *= 0.95;
        
        if (p.lifetime <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.lifetime / 30;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Find nearest enemy
function findNearestEnemy() {
    if (enemies.length === 0) return null;
    
    let nearestEnemy = enemies[0];
    let shortestDistance = Infinity;
    
    for (const enemy of enemies) {
        const dx = enemy.x + enemy.size / 2 - (playerX + playerSize / 2);
        const dy = enemy.y + enemy.size / 2 - (playerY + playerSize / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestEnemy = enemy;
        }
    }
    
    return nearestEnemy;
}

// Fire projectile at the nearest enemy
function fireProjectile() {
    const nearestEnemy = findNearestEnemy();
    if (!nearestEnemy) return;
    
    // Calculate direction to the nearest enemy
    const targetX = nearestEnemy.x + nearestEnemy.size / 2;
    const targetY = nearestEnemy.y + nearestEnemy.size / 2;
    const dx = targetX - (playerX + playerSize / 2);
    const dy = targetY - (playerY + playerSize / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const speed = 6;
    
    // Create and fire projectiles based on projectile skill level
    for (let i = 0; i < skills.projectiles.level; i++) {
        // Add slight angle variation for multiple projectiles
        let projectileAngle = angle;
        if (skills.projectiles.level > 1) {
            projectileAngle += (Math.random() * 0.3 - 0.15); // +/- 15 degrees variation
        }
        
        const vx = Math.cos(projectileAngle) * speed;
        const vy = Math.sin(projectileAngle) * speed;
        
        projectiles.push({
            x: playerX + playerSize / 2,
            y: playerY + playerSize / 2,
            vx,
            vy,
            size: 8,
            color: getProjectileColor(),
            damage: skills.attack.effect(skills.attack.level),
            type: 'normal'
        });
    }

    // 화염 스킬
    if (skills.fire.level > 0 && frameCount % 30 === 0) {
        projectiles.push({
            x: playerX + playerSize / 2,
            y: playerY + playerSize / 2,
            vx: Math.cos(angle) * speed * 0.8,
            vy: Math.sin(angle) * speed * 0.8,
            size: 12,
            color: '#ff4400',
            damage: skills.fire.effect(skills.fire.level) * 2,
            type: 'fire',
            burnDuration: 3
        });
        playSound('fire');
    }

    // 얼음 스킬
    if (skills.ice.level > 0 && frameCount % 45 === 0) {
        projectiles.push({
            x: playerX + playerSize / 2,
            y: playerY + playerSize / 2,
            vx: Math.cos(angle) * speed * 1.2,
            vy: Math.sin(angle) * speed * 1.2,
            size: 10,
            color: '#00ffff',
            damage: skills.attack.effect(skills.attack.level) * 0.8,
            type: 'ice',
            slowAmount: skills.ice.effect(skills.ice.level)
        });
        playSound('ice');
    }

    // 번개 스킬
    if (skills.lightning.level > 0 && frameCount % 60 === 0) {
        projectiles.push({
            x: playerX + playerSize / 2,
            y: playerY + playerSize / 2,
            vx: Math.cos(angle) * speed * 1.5,
            vy: Math.sin(angle) * speed * 1.5,
            size: 8,
            color: '#ffff00',
            damage: skills.attack.effect(skills.attack.level) * 1.2,
            type: 'lightning',
            chainsLeft: skills.lightning.effect(skills.lightning.level)
        });
        playSound('lightning');
    }

    // 독 스킬
    if (skills.poison.level > 0 && frameCount % 90 === 0) {
        projectiles.push({
            x: playerX + playerSize / 2,
            y: playerY + playerSize / 2,
            vx: Math.cos(angle) * speed * 0.5,
            vy: Math.sin(angle) * speed * 0.5,
            size: 20,
            color: '#00ff00',
            damage: skills.poison.effect(skills.poison.level) * 3,
            type: 'poison',
            duration: 5,
            poisonTick: 0
        });
        playSound('poison');
    }

    // 바람 스킬
    if (skills.wind.level > 0 && frameCount % 120 === 0) {
        projectiles.push({
            x: playerX + playerSize / 2,
            y: playerY + playerSize / 2,
            vx: Math.cos(angle) * speed * 0.3,
            vy: Math.sin(angle) * speed * 0.3,
            size: 30,
            color: '#ffffff',
            damage: skills.attack.effect(skills.attack.level) * 0.5,
            type: 'wind',
            pushForce: skills.wind.effect(skills.wind.level),
            duration: 2,
            angle: 0
        });
        playSound('wind');
    }
}

// Get projectile color based on skill levels
function getProjectileColor() {
    const totalLevel = skills.attack.level + skills.speed.level + skills.projectiles.level;
    
    if (totalLevel >= 10) return '#ff0099'; // Pink for high level
    if (totalLevel >= 7) return '#00ffff';  // Cyan for medium-high level
    if (totalLevel >= 5) return '#ffff00';  // Yellow for medium level
    return '#8a2be2';                       // Purple for low level
}

// Projectile update with no homing after initial launch
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        
        // 특수 효과 업데이트
        switch (p.type) {
            case 'poison':
                p.size = 20 + Math.sin(frameCount * 0.1) * 5;
                p.poisonTick += 1/60;
                if (p.poisonTick >= p.duration) {
                    projectiles.splice(i, 1);
                    continue;
                }
                break;
            case 'wind':
                p.angle += 0.2;
                p.duration -= 1/60;
                if (p.duration <= 0) {
                    projectiles.splice(i, 1);
                    continue;
                }
                break;
        }
        
        // Move projectile
        p.x += p.vx;
        p.y += p.vy;
        
        // Check if out of bounds
        if (p.x < -p.size || p.x > canvas.width + p.size || 
            p.y < -p.size || p.y > canvas.height + p.size) {
            projectiles.splice(i, 1);
            continue;
        }
        
        // Draw projectile with special effects
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        switch (p.type) {
            case 'fire':
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, '#ffff00');
                gradient.addColorStop(1, p.color);
                ctx.fillStyle = gradient;
                break;
            case 'ice':
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00ffff';
                break;
            case 'lightning':
                ctx.fillStyle = p.color;
                if (frameCount % 2 === 0) {
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#ffffff';
                }
                break;
            case 'poison':
                ctx.fillStyle = `${p.color}88`;
                break;
            case 'wind':
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                for (let j = 0; j < 3; j++) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size - j * 5, p.angle + j * Math.PI/3, p.angle + j * Math.PI/3 + Math.PI * 1.5);
                    ctx.stroke();
                }
                continue;
            default:
                ctx.fillStyle = p.color;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Enemy spawning and updating
function spawnEnemy() {
    // Determine spawn position (outside the screen)
    let x, y;
    const size = 25 + Math.random() * 15;
    
    // 레벨에 따른 적 능력치 조정
    const baseSpeed = 1 + Math.random() * (level * 0.1);
    const baseHealth = 15 + (level * 8);
    const expValue = 50 + Math.floor(level * 15);
    
    // 적 타입 결정 (레벨이 높을수록 특수 적 등장 확률 증가)
    const enemyTypes = ['normal', 'fast', 'tank', 'boss'];
    let enemyType = 'normal';
    const specialEnemyChance = Math.min(0.5, level * 0.05); // 최대 50%
    
    if (Math.random() < specialEnemyChance) {
        enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    }
    
    // Random side (0: top, 1: right, 2: bottom, 3: left)
    const side = Math.floor(Math.random() * 4);
    
    switch (side) {
        case 0: // top
            x = Math.random() * canvas.width;
            y = -size;
            break;
        case 1: // right
            x = canvas.width + size;
            y = Math.random() * canvas.height;
            break;
        case 2: // bottom
            x = Math.random() * canvas.width;
            y = canvas.height + size;
            break;
        case 3: // left
            x = -size;
            y = Math.random() * canvas.height;
            break;
    }
    
    // 적 타입별 능력치 조정
    let speed = baseSpeed;
    let health = baseHealth;
    let color = '#ff5555';
    
    switch (enemyType) {
        case 'fast':
            speed = baseSpeed * 1.5;
            health = baseHealth * 0.7;
            color = '#ff9955';
            break;
        case 'tank':
            speed = baseSpeed * 0.7;
            health = baseHealth * 2;
            color = '#995555';
            break;
        case 'boss':
            speed = baseSpeed * 0.5;
            health = baseHealth * 5;
            color = '#ff0000';
            size *= 1.5;
            break;
    }
    
    // Create enemy object
    enemies.push({
        x,
        y,
        size,
        speed,
        health,
        maxHealth: health,
        experienceValue: expValue,
        type: enemyType,
        color: color
    });
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Move towards player
        const dx = playerX + playerSize / 2 - (enemy.x + enemy.size / 2);
        const dy = playerY + playerSize / 2 - (enemy.y + enemy.size / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize and apply speed
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
        
        // Draw enemy with health bar
        ctx.save();
        
        // Enemy glow effect
        if (enemy.type === 'boss') {
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 20;
        }
        
        // Draw enemy
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.size/2, enemy.y + enemy.size/2, enemy.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        const healthBarWidth = enemy.size;
        const healthBarHeight = 4;
        const healthPercentage = enemy.health / enemy.maxHealth;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x, enemy.y - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(enemy.x, enemy.y - 10, healthBarWidth * healthPercentage, healthBarHeight);
        
        ctx.restore();
    }
}

// Create experience orb at position
function createExperienceOrb(x, y, value) {
    const experienceMultiplier = skills.experience.effect(skills.experience.level);
    experienceOrbs.push({
        x,
        y,
        size: 5 + Math.random() * 3,
        value: Math.floor(value * experienceMultiplier),
        animFrame: Math.random() * Math.PI * 2,
        glowSize: 0
    });
}

// Collision detection
function checkCollisions() {
    // Player-Enemy collision
    for (const enemy of enemies) {
        if (
            playerX < enemy.x + enemy.size &&
            playerX + playerSize > enemy.x &&
            playerY < enemy.y + enemy.size &&
            playerY + playerSize > enemy.y
        ) {
            // 피격 시 플레이어 깜빡임 효과
            const playerImg = document.querySelector('#game-canvas');
            playerImg.style.filter = 'brightness(200%)';
            setTimeout(() => {
                playerImg.style.filter = 'none';
            }, 100);

            // 적 넉백
            const dx = enemy.x + enemy.size/2 - (playerX + playerSize/2);
            const dy = enemy.y + enemy.size/2 - (playerY + playerSize/2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const knockback = 50;
            
            enemy.x += (dx / dist) * knockback;
            enemy.y += (dy / dist) * knockback;

            // 피격 파티클 생성
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                particles.push({
                    x: playerX + playerSize/2,
                    y: playerY + playerSize/2,
                    vx: Math.cos(angle) * 5,
                    vy: Math.sin(angle) * 5,
                    size: 3,
                    color: '#ff0000',
                    lifetime: 20
                });
            }

            health -= 1;
            document.getElementById('health-fill').style.width = `${health}%`;
            playSound('hit');
        }
        
        // 독 구름 효과
        if (enemy.poisoned) {
            enemy.poisonTimer -= 1/60;
            enemy.health -= enemy.poisonDamage/60;
            if (enemy.poisonTimer <= 0) {
                enemy.poisoned = false;
            }
        }
        
        // 얼음 효과
        if (enemy.slowed) {
            enemy.slowTimer -= 1/60;
            if (enemy.slowTimer <= 0) {
                enemy.slowed = false;
                enemy.speed /= enemy.slowAmount;
            }
        }
        
        // 화염 효과
        if (enemy.burning) {
            enemy.burnTimer -= 1/60;
            enemy.health -= enemy.burnDamage/60;
            if (enemy.burnTimer <= 0) {
                enemy.burning = false;
            }
        }
    }
    
    // Projectile-Enemy collision
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            // Check for collision
            const dx = p.x - (enemy.x + enemy.size / 2);
            const dy = p.y - (enemy.y + enemy.size / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < p.size + enemy.size / 2) {
                // Apply damage and effects
                switch (p.type) {
                    case 'fire':
                        enemy.health -= p.damage;
                        enemy.burning = true;
                        enemy.burnDamage = p.damage;
                        enemy.burnTimer = p.burnDuration;
                        break;
                    case 'ice':
                        enemy.health -= p.damage;
                        if (!enemy.slowed) {
                            enemy.slowed = true;
                            enemy.slowAmount = 1 - p.slowAmount;
                            enemy.speed *= enemy.slowAmount;
                            enemy.slowTimer = 2;
                        }
                        break;
                    case 'lightning':
                        enemy.health -= p.damage;
                        if (p.chainsLeft > 0) {
                            // Find nearest enemy for chain lightning
                            let nearestDist = Infinity;
                            let nearestEnemy = null;
                            for (const otherEnemy of enemies) {
                                if (otherEnemy !== enemy) {
                                    const chainDx = otherEnemy.x - enemy.x;
                                    const chainDy = otherEnemy.y - enemy.y;
                                    const chainDist = Math.sqrt(chainDx * chainDx + chainDy * chainDy);
                                    if (chainDist < nearestDist && chainDist < 200) {
                                        nearestDist = chainDist;
                                        nearestEnemy = otherEnemy;
                                    }
                                }
                            }
                            if (nearestEnemy) {
                                projectiles.push({
                                    x: enemy.x + enemy.size / 2,
                                    y: enemy.y + enemy.size / 2,
                                    vx: (nearestEnemy.x - enemy.x) / 10,
                                    vy: (nearestEnemy.y - enemy.y) / 10,
                                    size: p.size,
                                    color: p.color,
                                    damage: p.damage,
                                    type: 'lightning',
                                    chainsLeft: p.chainsLeft - 1
                                });
                            }
                        }
                        break;
                    case 'poison':
                        if (!enemy.poisoned) {
                            enemy.poisoned = true;
                            enemy.poisonDamage = p.damage;
                            enemy.poisonTimer = p.duration;
                        }
                        break;
                    case 'wind':
                        enemy.health -= p.damage;
                        const pushAngle = Math.atan2(dy, dx);
                        enemy.x += Math.cos(pushAngle) * p.pushForce;
                        enemy.y += Math.sin(pushAngle) * p.pushForce;
                        break;
                    default:
                        enemy.health -= p.damage;
                }
                
                // Remove projectile except for poison cloud and wind
                if (p.type !== 'poison' && p.type !== 'wind') {
                    projectiles.splice(i, 1);
                }
                
                // Check if enemy is destroyed
                if (enemy.health <= 0) {
                    createExperienceOrb(
                        enemy.x + enemy.size / 2,
                        enemy.y + enemy.size / 2,
                        enemy.experienceValue
                    );
                    enemies.splice(j, 1);
                    score += 100;
                    playSound('exp');
                }
                
                playSound('hit');
                
                break;
            }
        }
    }
}

// Update experience bar
function updateExperienceBar() {
    const expPercentage = (experience / experienceToNextLevel) * 100;
    document.getElementById('exp-fill').style.width = `${expPercentage}%`;
}

// Level up screen
function showLevelUpScreen() {
    levelUpPending = true;
    gameActive = false;
    
    // Update level and adjust difficulty
    level++;
    skillPoints++;
    
    // Reset experience for next level
    experience = 0;
    experienceToNextLevel = 250 * level;
    updateExperienceBar();
    
    enemySpawnInterval = Math.max(300, 1000 - (level * 70));
    
    // Update HUD
    document.getElementById('level').textContent = level;
    document.getElementById('skill-points').textContent = skillPoints;
    
    // 사용 가능한 스킬 목록 생성
    const availableSkills = [];
    
    // 기본 스킬들 중 최대 레벨이 아닌 것들 추가
    const basicSkills = ['attack', 'speed', 'projectiles', 'experience', 'health', 'magnet'];
    for (const skillType of basicSkills) {
        const skill = skills[skillType];
        if (skill.level < skill.maxLevel) {
            availableSkills.push(skillType);
        }
    }
    
    // 특수 스킬들 처리
    const specialSkills = ['fire', 'ice', 'lightning', 'poison', 'wind'];
    for (const skillType of specialSkills) {
        const skill = skills[skillType];
        // 해금되지 않았거나 최대 레벨이 아닌 스킬 추가
        if ((!skill.unlocked || skill.level < skill.maxLevel) && level >= 2) {
            availableSkills.push(skillType);
        }
    }
    
    console.log('Available skills:', availableSkills); // 디버깅용
    
    // 3개의 랜덤 스킬 선택
    const selectedSkills = [];
    while (selectedSkills.length < 3 && availableSkills.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableSkills.length);
        const skillType = availableSkills.splice(randomIndex, 1)[0];
        selectedSkills.push(skillType);
    }
    
    console.log('Selected skills:', selectedSkills); // 디버깅용
    
    // 스킬 버튼 업데이트
    const skillButtons = document.querySelectorAll('.skill-button');
    skillButtons.forEach((button, index) => {
        if (index < selectedSkills.length) {
            const skillType = selectedSkills[index];
            const skill = skills[skillType];
            const nextLevel = skill.level + 1;
            
            // 효과 텍스트 계산
            let effectText = '';
            if (skillType === 'fire') {
                effectText = `${skill.effect(skill.level)}→${skill.effect(nextLevel)} 데미지/초`;
            } else if (skillType === 'ice') {
                effectText = `${(skill.effect(skill.level)*100).toFixed(0)}%→${(skill.effect(nextLevel)*100).toFixed(0)}% 감속`;
            } else if (skillType === 'lightning') {
                effectText = `${skill.effect(skill.level)}→${skill.effect(nextLevel)} 체인`;
            } else if (skillType === 'poison') {
                effectText = `${skill.effect(skill.level)}→${skill.effect(nextLevel)} 독 데미지`;
            } else if (skillType === 'wind') {
                effectText = `${skill.effect(skill.level)}→${skill.effect(nextLevel)} 밀어내기`;
            } else {
                effectText = `${skill.effect(skill.level)}→${skill.effect(nextLevel)}`;
            }
            
            button.setAttribute('data-skill', skillType);
            button.innerHTML = `
                <span class="emoji">${skill.emoji}</span>
                <span class="name">${skill.name}</span>
                <span class="level">Lv.${skill.level} → ${nextLevel}</span>
                <span class="effect">${effectText}</span>
                <span class="description">${skill.description}</span>
            `;
            button.style.display = 'flex';
            button.disabled = false;
        } else {
            button.style.display = 'none';
        }
    });
    
    // Show skill selection UI
    document.getElementById('level-up-screen').classList.add('active');
    document.getElementById('game-screen').classList.remove('active');
    playSound('levelUp');
}

function hideLevelUpScreen() {
    document.getElementById('level-up-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
}

function upgradeSkill(skillType) {
    if (skillPoints > 0 && skills[skillType].level < skills[skillType].maxLevel) {
        skills[skillType].level++;
        if (!skills[skillType].unlocked) {
            skills[skillType].unlocked = true;
        }
        skillPoints--;
        document.getElementById('skill-points').textContent = skillPoints;
    }
}

function resumeGame() {
    levelUpPending = false;
    gameActive = true;
}

// HUD updates
function updateHUD() {
    document.getElementById('score').textContent = score.toLocaleString();
    document.getElementById('time').textContent = formatTime(gameTime);
    document.getElementById('health-fill').style.width = `${health}%`;
    
    // Update experience bar with animation
    const expPercentage = (experience / experienceToNextLevel) * 100;
    const expBar = document.getElementById('exp-fill');
    expBar.style.width = `${expPercentage}%`;
    
    // Add glow effect when close to level up
    if (expPercentage > 80) {
        expBar.style.boxShadow = '0 0 10px #00ffff';
    } else {
        expBar.style.boxShadow = 'none';
    }
    
    // Update level display with effect
    const levelDisplay = document.getElementById('level');
    if (levelDisplay.textContent !== level.toString()) {
        levelDisplay.textContent = level;
        levelDisplay.style.transform = 'scale(1.5)';
        setTimeout(() => {
            levelDisplay.style.transform = 'scale(1)';
        }, 200);
    }
}

// Format time function
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Game control functions
function startGame() {
    // Switch to game screen
    document.getElementById('menu-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    
    // Initialize game
    init();
    
    // Reset game variables
    gameActive = true;
    levelUpPending = false;
    gameTime = 0;
    score = 0;
    level = 1;
    health = 100;
    skillPoints = 0;
    experience = 0;
    experienceToNextLevel = 250;
    enemies = [];
    projectiles = [];
    experienceOrbs = [];
    particles = [];
    lastEnemySpawn = Date.now();
    
    // Reset skills
    for (const skillType in skills) {
        if (['attack', 'speed', 'projectiles', 'experience', 'health', 'magnet'].includes(skillType)) {
            skills[skillType].level = 1;
            skills[skillType].unlocked = true;
        } else {
            skills[skillType].level = 0;
            skills[skillType].unlocked = false;
        }
    }
    
    // Update HUD
    updateHUD();
    updateExperienceBar();
    
    // Start game loop
    gameInterval = setInterval(gameLoop, 1000 / 60);
    
    // Start game timer
    gameTimeInterval = setInterval(() => {
        if (gameActive && !levelUpPending) {
            gameTime++;
            score += 10;
        }
    }, 1000);
    
    // 게임 시작 시 배경음 재생
    initSounds();
    playSound('bgm');
}

function endGame() {
    gameActive = false;
    clearInterval(gameInterval);
    clearInterval(gameTimeInterval);
    
    // Update final score
    document.getElementById('final-score').textContent = score;
    
    // Switch to game over screen
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('game-over-screen').classList.add('active');
    
    // 게임 종료 시 배경음악 중지
    if (sounds.bgm) {
        sounds.bgm.mainGain.gain.value = 0;
        sounds.bgm.droneGain.gain.value = 0;
        sounds.bgm.rhythmGain.gain.value = 0;
        clearInterval(sounds.bgm.interval);
    }
    playSound('gameOver');
}

function restartGame() {
    document.getElementById('game-over-screen').classList.remove('active');
    startGame();
}

// Initialize the game when assets are loaded
window.addEventListener('load', () => {
    document.getElementById('menu-screen').classList.add('active');
});

// 사운드 초기화
function initSounds() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioContext.createGain();
        masterGain.connect(audioContext.destination);
        masterGain.gain.value = 0.5;
    }

    // 배경음악 생성
    if (!sounds.bgm) {
        // 메인 멜로디
        const mainOsc = audioContext.createOscillator();
        const mainGain = audioContext.createGain();
        const mainFilter = audioContext.createBiquadFilter();
        
        // 드론 음
        const droneOsc = audioContext.createOscillator();
        const droneGain = audioContext.createGain();
        const droneFilter = audioContext.createBiquadFilter();
        
        // 리듬 음
        const rhythmOsc = audioContext.createOscillator();
        const rhythmGain = audioContext.createGain();
        const rhythmFilter = audioContext.createBiquadFilter();
        
        // 설정
        mainOsc.type = 'sine';
        mainOsc.frequency.value = 220;
        mainGain.gain.value = 0.1;
        mainFilter.type = 'lowpass';
        mainFilter.frequency.value = 600;
        
        droneOsc.type = 'sawtooth';
        droneOsc.frequency.value = 55;
        droneGain.gain.value = 0.05;
        droneFilter.type = 'lowpass';
        droneFilter.frequency.value = 200;
        
        rhythmOsc.type = 'square';
        rhythmOsc.frequency.value = 110;
        rhythmGain.gain.value = 0.03;
        rhythmFilter.type = 'lowpass';
        rhythmFilter.frequency.value = 300;
        
        // 연결
        mainOsc.connect(mainFilter);
        mainFilter.connect(mainGain);
        mainGain.connect(masterGain);
        
        droneOsc.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(masterGain);
        
        rhythmOsc.connect(rhythmFilter);
        rhythmFilter.connect(rhythmGain);
        rhythmGain.connect(masterGain);
        
        // 리듬감 추가
        const bgmInterval = setInterval(() => {
            const time = audioContext.currentTime;
            
            // 메인 멜로디
            mainOsc.frequency.setValueAtTime(220, time);
            mainOsc.frequency.exponentialRampToValueAtTime(165, time + 0.5);
            mainOsc.frequency.exponentialRampToValueAtTime(220, time + 1);
            mainOsc.frequency.exponentialRampToValueAtTime(147, time + 1.5);
            mainOsc.frequency.exponentialRampToValueAtTime(220, time + 2);
            
            // 리듬 음
            rhythmGain.gain.setValueAtTime(0.03, time);
            rhythmGain.gain.setValueAtTime(0, time + 0.1);
            rhythmGain.gain.setValueAtTime(0.03, time + 0.2);
            rhythmGain.gain.setValueAtTime(0, time + 0.3);
            rhythmGain.gain.setValueAtTime(0.03, time + 0.4);
            rhythmGain.gain.setValueAtTime(0, time + 0.5);
            rhythmGain.gain.setValueAtTime(0.03, time + 0.6);
            rhythmGain.gain.setValueAtTime(0, time + 0.7);
            rhythmGain.gain.setValueAtTime(0.03, time + 0.8);
            rhythmGain.gain.setValueAtTime(0, time + 0.9);
            rhythmGain.gain.setValueAtTime(0.03, time + 1);
            rhythmGain.gain.setValueAtTime(0, time + 1.1);
            rhythmGain.gain.setValueAtTime(0.03, time + 1.2);
            rhythmGain.gain.setValueAtTime(0, time + 1.3);
            rhythmGain.gain.setValueAtTime(0.03, time + 1.4);
            rhythmGain.gain.setValueAtTime(0, time + 1.5);
            rhythmGain.gain.setValueAtTime(0.03, time + 1.6);
            rhythmGain.gain.setValueAtTime(0, time + 1.7);
            rhythmGain.gain.setValueAtTime(0.03, time + 1.8);
            rhythmGain.gain.setValueAtTime(0, time + 1.9);
        }, 2000);
        
        mainOsc.start();
        droneOsc.start();
        rhythmOsc.start();
        
        sounds.bgm = { 
            mainOsc: mainOsc,
            mainGain: mainGain,
            mainFilter: mainFilter,
            droneOsc: droneOsc,
            droneGain: droneGain,
            droneFilter: droneFilter,
            rhythmOsc: rhythmOsc,
            rhythmGain: rhythmGain,
            rhythmFilter: rhythmFilter,
            interval: bgmInterval
        };
    }
}

// 사운드 재생 함수
function playSound(soundName) {
    if (!audioContext) return;

    switch(soundName) {
        case 'bgm':
            if (sounds.bgm) {
                sounds.bgm.mainGain.gain.value = 0.1;
                sounds.bgm.mainFilter.frequency.value = 1000;
            }
            break;
        case 'attack':
            createAttackSound();
            break;
        case 'hit':
            createHitSound();
            break;
        case 'levelUp':
            createLevelUpSound();
            break;
        case 'gameOver':
            createGameOverSound();
            break;
        case 'exp':
            createExpSound();
            break;
        case 'fire':
            createFireSound();
            break;
        case 'ice':
            createIceSound();
            break;
        case 'lightning':
            createLightningSound();
            break;
        case 'poison':
            createPoisonSound();
            break;
        case 'wind':
            createWindSound();
            break;
    }
}

// 각종 효과음 생성 함수들
function createAttackSound() {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);
    
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 5;
    
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

function createHitSound() {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.2);
    
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
}

function createLevelUpSound() {
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    
    oscillator1.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(880, audioContext.currentTime);
    
    oscillator1.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.2);
    oscillator2.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator1.connect(gain);
    oscillator2.connect(gain);
    gain.connect(masterGain);
    
    oscillator1.start();
    oscillator2.start();
    oscillator1.stop(audioContext.currentTime + 0.2);
    oscillator2.stop(audioContext.currentTime + 0.2);
}

function createGameOverSound() {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(55, audioContext.currentTime + 0.5);
    
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
}

function createExpSound() {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);
    
    filter.type = 'highpass';
    filter.frequency.value = 500;
    
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

function createFireSound() {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.3);
    
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 3;
    
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
}

function createIceSound() {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.2);
    
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
}

function createLightningSound() {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1760, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);
    
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 5;
    
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

function createPoisonSound() {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.4);
    
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.4);
}

function createWindSound() {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.5);
    
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 2;
    
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
}

// 가시성 변경 처리 함수
function handleVisibilityChange() {
    if (document.hidden) {
        // 탭이 숨겨졌을 때 사운드 일시 정지
        if (sounds.bgm) {
            sounds.bgm.mainGain.gain.value = 0;
            sounds.bgm.droneGain.gain.value = 0;
            sounds.bgm.rhythmGain.gain.value = 0;
        }
        masterGain.gain.value = 0;
    } else {
        // 탭이 다시 보일 때 사운드 재개
        if (sounds.bgm) {
            sounds.bgm.mainGain.gain.value = soundSettings.bgmVolume * 0.1;
            sounds.bgm.droneGain.gain.value = soundSettings.bgmVolume * 0.05;
            sounds.bgm.rhythmGain.gain.value = soundSettings.bgmVolume * 0.03;
        }
        masterGain.gain.value = 1;
    }
}

// 팝업 관련 변수
let currentPopup = null;

// 팝업 열기 함수
function openPopup(popupId) {
    const popup = document.getElementById(popupId);
    const overlay = document.getElementById('overlay');
    
    if (popup && overlay) {
        currentPopup = popup;
        popup.style.display = 'block';
        overlay.style.display = 'block';
        
        // 팝업을 화면 중앙에 배치
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
    }
}

// 팝업 닫기 함수
function closePopup() {
    if (currentPopup) {
        currentPopup.style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
        currentPopup = null;
    }
}

// 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
    // 팝업 열기 버튼들
    document.getElementById('instructions-btn').addEventListener('click', () => openPopup('instructions-popup'));
    document.getElementById('privacy-btn').addEventListener('click', () => openPopup('privacy-popup'));
    document.getElementById('terms-btn').addEventListener('click', () => openPopup('terms-popup'));
    
    // 팝업 닫기 버튼들
    document.querySelectorAll('.popup-close').forEach(button => {
        button.addEventListener('click', closePopup);
    });
    
    // 오버레이 클릭 시 팝업 닫기
    document.getElementById('overlay').addEventListener('click', closePopup);
    
    // ESC 키로 팝업 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && currentPopup) {
            closePopup();
        }
    });
}); 