<!DOCTYPE html>
<html>
<head>
    <title>Pixel Space Shooter</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        body {
            margin: 0;
            padding: 0;
            background: black;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
            font-family: 'Courier New', monospace;
        }
        canvas {
            border: 2px solid white;
            background: black;
        }
        #score {
            position: absolute;
            top: 10px;
            left: 10px;
            color: white;
            font-size: 20px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div id="score">Score: 0</div>
    <canvas id="gameCanvas" width="800" height="600"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreElement = document.getElementById('score');

        // Game objects and variables
        const spaceship = {
            x: canvas.width / 2 - 20,
            y: canvas.height - 40,
            width: 40,
            height: 20,
            speed: 5,
            bullets: 1,
            isDragging: false
        };

        let asteroids = [];
        let bullets = [];
        let powerUps = [];
        let score = 0;
        let gameOver = false;
        let lastShotTime = 0;
        const shootInterval = 500; // Shoot every 500ms (0.5 seconds)

        // Load pixel art images (simulated by drawing)
        const pixelSize = 4; // Pixel size for pixelated look

        // Pixelated Spaceship (white outline, black fill, blocky shape)
        function drawSpaceship() {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'black';
            // Body (3x2 block grid for pixelated look)
            ctx.fillRect(spaceship.x + 10, spaceship.y, 20, 10); // Main body
            ctx.fillRect(spaceship.x, spaceship.y + 10, 40, 10); // Base
            // Outline the entire shape
            ctx.beginPath();
            ctx.moveTo(spaceship.x, spaceship.y);
            ctx.lineTo(spaceship.x + 40, spaceship.y);
            ctx.lineTo(spaceship.x + 40, spaceship.y + 20);
            ctx.lineTo(spaceship.x, spaceship.y + 20);
            ctx.closePath();
            ctx.stroke();
        }

        // Larger "II"-shaped bullet (solid white, bold, pixelated)
        function drawBullet(bullet) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4; // Thicker line for boldness
            ctx.beginPath();
            // Draw two vertical lines for "II" shape
            ctx.moveTo(bullet.x - 5, bullet.y - 20); // Left "I" top
            ctx.lineTo(bullet.x - 5, bullet.y + 20); // Left "I" bottom
            ctx.moveTo(bullet.x + 5, bullet.y - 20); // Right "I" top
            ctx.lineTo(bullet.x + 5, bullet.y + 20); // Right "I" bottom
            ctx.stroke();
        }

        // Asteroid (white outline, black fill, rotating)
        function drawAsteroid(asteroid) {
            ctx.save();
            ctx.translate(asteroid.x + asteroid.size / 2, asteroid.y + asteroid.size / 2);
            ctx.rotate(asteroid.rotation * Math.PI / 180);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, asteroid.size / 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'black';
            ctx.fill();
            ctx.restore();
        }

        // Power-up (blue circle)
        function drawPowerUp(powerUp) {
            ctx.strokeStyle = '#4a90e2';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(powerUp.x, powerUp.y, 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'black';
            ctx.fill();
        }

        // Handle dragging (mouse and touch)
        let dragStartX = 0;

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            if (mouseX >= spaceship.x && mouseX <= spaceship.x + spaceship.width &&
                e.clientY - rect.top >= spaceship.y && e.clientY - rect.top <= spaceship.y + spaceship.height) {
                spaceship.isDragging = true;
                dragStartX = mouseX - spaceship.x;
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (spaceship.isDragging && !gameOver) {
                const rect = canvas.getBoundingClientRect();
                let newX = e.clientX - rect.left - dragStartX;
                newX = Math.max(0, Math.min(newX, canvas.width - spaceship.width));
                spaceship.x = newX;
            }
        });

        canvas.addEventListener('mouseup', () => {
            spaceship.isDragging = false;
        });

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            if (touchX >= spaceship.x && touchX <= spaceship.x + spaceship.width &&
                touch.clientY - rect.top >= spaceship.y && touch.clientY - rect.top <= spaceship.y + spaceship.height) {
                spaceship.isDragging = true;
                dragStartX = touchX - spaceship.x;
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (spaceship.isDragging && !gameOver) {
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                let newX = touch.clientX - rect.left - dragStartX;
                newX = Math.max(0, Math.min(newX, canvas.width - spaceship.width));
                spaceship.x = newX;
            }
        });

        canvas.addEventListener('touchend', () => {
            spaceship.isDragging = false;
        });

        // Automatic shooting
        function autoShoot(timestamp) {
            if (!gameOver && timestamp - lastShotTime >= shootInterval) {
                for (let i = 0; i < spaceship.bullets; i++) {
                    bullets.push({
                        x: spaceship.x + spaceship.width / 2 + (i - (spaceship.bullets - 1) / 2) * 20, // Adjusted spacing for larger bullets
                        y: spaceship.y - 10,
                        speed: 7
                    });
                }
                lastShotTime = timestamp;
            }
        }

        // Spawn asteroids with size-based speed and rotation
        function spawnAsteroid() {
            const size = Math.random() * 40 + 20; // Random size between 20 and 60 pixels
            const speed = size < 40 ? Math.random() * 5 + 3 : Math.random() * 3 + 1; // Smaller asteroids move faster (3–8), larger slower (1–4)
            const rotationSpeed = size < 40 ? Math.random() * 8 + 3 : Math.random() * 3 + 1; // Smaller asteroids rotate faster (3–11), larger slower (1–4)
            asteroids.push({
                x: Math.random() * (canvas.width - size),
                y: -size,
                size: size,
                speed: speed,
                rotation: 0,
                rotationSpeed: rotationSpeed
            });
        }

        // Update game state
        function update(timestamp) {
            if (gameOver) return;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Automatic shooting
            autoShoot(timestamp);

            // Draw spaceship
            drawSpaceship();

            // Update and draw bullets
            bullets = bullets.filter(bullet => bullet.y > 0);
            bullets.forEach(bullet => {
                bullet.y -= bullet.speed;
                drawBullet(bullet);
            });

            // Update and draw asteroids
            asteroids.forEach(asteroid => {
                asteroid.y += asteroid.speed;
                asteroid.rotation += asteroid.rotationSpeed;
                drawAsteroid(asteroid);

                // Check collision with spaceship
                if (asteroid.y + asteroid.size > spaceship.y &&
                    asteroid.y < spaceship.y + spaceship.height &&
                    asteroid.x + asteroid.size > spaceship.x &&
                    asteroid.x < spaceship.x + spaceship.width) {
                    gameOver = true;
                    endGame();
                }

                // Check collision with bullets
                bullets.forEach((bullet, bulletIndex) => {
                    if (bullet.x > asteroid.x && bullet.x < asteroid.x + asteroid.size &&
                        bullet.y > asteroid.y && bullet.y < asteroid.y + asteroid.size) {
                        bullets.splice(bulletIndex, 1);
                        asteroids.splice(asteroids.indexOf(asteroid), 1);
                        score += 10;
                        if (Math.random() < 0.02) { // 2% chance for power-up
                            powerUps.push({
                                x: asteroid.x + asteroid.size / 2,
                                y: asteroid.y + asteroid.size / 2
                            });
                        }
                    }
                });
            });

            // Update and draw power-ups
            powerUps = powerUps.filter(powerUp => powerUp.y < canvas.height);
            powerUps.forEach(powerUp => {
                powerUp.y += 2;
                drawPowerUp(powerUp);

                // Check collision with spaceship
                if (powerUp.y + 10 > spaceship.y &&
                    powerUp.y - 10 < spaceship.y + spaceship.height &&
                    powerUp.x + 10 > spaceship.x &&
                    powerUp.x - 10 < spaceship.x + spaceship.width) {
                    powerUps.splice(powerUps.indexOf(powerUp), 1);
                    if (spaceship.bullets < 16) {
                        spaceship.bullets *= 2;
                    }
                }
            });

            // Remove off-screen asteroids and power-ups
            asteroids = asteroids.filter(asteroid => asteroid.y < canvas.height + asteroid.size);
            powerUps = powerUps.filter(powerUp => powerUp.y < canvas.height);

            // Spawn new asteroids (every 60 frames, ~1 second at 60 FPS)
            if (Math.random() < 0.02) {
                spawnAsteroid();
            }

            // Update score
            scoreElement.textContent = `Score: ${score}`;

            // Request next frame
            requestAnimationFrame(update);
        }

        // End game
        function endGame() {
            ctx.fillStyle = 'white';
            ctx.font = '40px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
            ctx.font = '20px "Courier New"';
            ctx.fillText('Refresh to Restart', canvas.width / 2, canvas.height / 2 + 40);
        }

        // Start the game
        requestAnimationFrame(update);
    </script>
</body>
</html>
