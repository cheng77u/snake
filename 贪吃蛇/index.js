
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scorePanel = document.getElementById('scorePanel');
        const gameOverText = document.getElementById('gameOver');
        const restartBtn = document.querySelector('.restartBtn');

        // 游戏配置
        const config = {
            gridSize: 20,
            initialSpeed: 150,
            speedIncrease: 1,
            colors: {
                snakeHead: '#FF5555',
                snakeBody: '#4CAF50',
                background: '#1A1A1A'
            },
            minSpeed: 70
        };

        // 游戏状态
        let snake = [];
        let food = {};
        let direction = 'right';
        let nextDirection = 'right';
        let score = 0;
        let gameLoop;
        let isGameOver = false;
        let touchStartX = 0;
        let touchStartY = 0;
        const minSwipeDistance = 30;

        function initGame() {
            // 动态调整网格大小
            config.gridSize = window.innerWidth < 600 ? 25 : 20;
            
            // 设置画布尺寸
            const maxSize = Math.min(window.innerWidth, 600);
            canvas.width = maxSize - (maxSize % config.gridSize);
            canvas.height = canvas.width * 0.8;
            
            // 初始化游戏状态
            snake = [{x: 5, y: 5}];
            direction = 'right';
            nextDirection = 'right';
            score = 0;
            isGameOver = false;
            scorePanel.textContent = `得分: ${score}`;
            gameOverText.style.display = 'none';
            
            generateFood();
            
            if (gameLoop) clearInterval(gameLoop);
            gameLoop = setInterval(gameStep, config.initialSpeed);
        }

        function generateFood() {
            const gridWidth = canvas.width / config.gridSize;
            const gridHeight = canvas.height / config.gridSize;
            
            while(true) {
                food = {
                    x: Math.floor(Math.random() * gridWidth),
                    y: Math.floor(Math.random() * gridHeight),
                    hue: Math.random() * 360,
                    size: 0
                };
                
                if (!snake.some(segment => segment.x === food.x && segment.y === food.y)) break;
            }
        }

        function gameStep() {
            if (isGameOver) return;

            const head = {...snake[0]};
            direction = nextDirection;
            
            switch(direction) {
                case 'up': head.y--; break;
                case 'down': head.y++; break;
                case 'left': head.x--; break;
                case 'right': head.x++; break;
            }

            if (checkCollision(head)) return gameOver();

            snake.unshift(head);

            if (head.x === food.x && head.y === food.y) {
                score += 10;
                scorePanel.textContent = `得分: ${score}`;
                generateFood();
                createFoodEffect();
                updateGameSpeed();
            } else {
                snake.pop();
            }

            draw();
        }

        function checkCollision(pos) {
            return pos.x < 0 || pos.x >= canvas.width/config.gridSize ||
                   pos.y < 0 || pos.y >= canvas.height/config.gridSize ||
                   snake.slice(1).some(s => s.x === pos.x && s.y === pos.y);
        }

        function draw() {
            ctx.fillStyle = config.colors.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 绘制食物
            ctx.fillStyle = `hsl(${food.hue}, 70%, 50%)`;
            ctx.beginPath();
            ctx.arc(
                food.x * config.gridSize + config.gridSize/2,
                food.y * config.gridSize + config.gridSize/2,
                config.gridSize/2 * Math.min(food.size++, 1),
                0, Math.PI * 2
            );
            ctx.fill();

            // 绘制蛇
            snake.forEach((segment, index) => {
                const size = config.gridSize;
                const x = segment.x * size;
                const y = segment.y * size;
                
                // 渐变颜色
                ctx.fillStyle = `hsl(${150 + index * 2}, 70%, ${50 - index}%)`;
                ctx.beginPath();
                ctx.roundRect(x, y, size, size, 5);
                ctx.fill();

                // 蛇头特效
                if (index === 0) {
                    ctx.shadowColor = config.colors.snakeHead;
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = config.colors.snakeHead;
                    ctx.beginPath();
                    ctx.arc(x + size/2, y + size/2, size/3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });
        }

        function createFoodEffect() {
            // 创建粒子动画
            const particles = 15;
            for(let i = 0; i < particles; i++) {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    background: hsl(${Math.random()*360}, 70%, 50%);
                    border-radius: 50%;
                    pointer-events: none;
                    left: ${food.x * config.gridSize + config.gridSize/2}px;
                    top: ${food.y * config.gridSize + config.gridSize/2}px;
                    transition: all 0.6s ease-out;
                `;
                document.body.appendChild(particle);

                requestAnimationFrame(() => {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * 50 + 30;
                    particle.style.transform = `translate(
                        ${Math.cos(angle) * distance}px,
                        ${Math.sin(angle) * distance}px
                    )`;
                    particle.style.opacity = '0';
                });

                setTimeout(() => particle.remove(), 600);
            }
        }

        function updateGameSpeed() {
            clearInterval(gameLoop);
            const newSpeed = Math.max(
                config.minSpeed,
                config.initialSpeed - score * config.speedIncrease
            );
            gameLoop = setInterval(gameStep, newSpeed);
        }

        function gameOver() {
            isGameOver = true;
            clearInterval(gameLoop);
            gameOverText.style.display = 'block';
            createFoodEffect();
        }

        // 事件处理
        function handleDirection(newDir) {
            const valid = {
                up: ['left', 'right'],
                down: ['left', 'right'],
                left: ['up', 'down'],
                right: ['up', 'down']
            };
            if (valid[newDir].includes(direction)) nextDirection = newDir;
        }

        // 键盘控制
        document.addEventListener('keydown', e => {
            const dirMap = {
                ArrowUp: 'up',
                ArrowDown: 'down',
                ArrowLeft: 'left',
                ArrowRight: 'right'
            };
            if (dirMap[e.key]) handleDirection(dirMap[e.key]);
        });

        // 触摸控制
        document.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > minSwipeDistance) {
                    handleDirection(dx > 0 ? 'right' : 'left');
                }
            } else {
                if (Math.abs(dy) > minSwipeDistance) {
                    handleDirection(dy > 0 ? 'down' : 'up');
                }
            }
        });

        // 按钮控制
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('touchstart', e => {
                e.preventDefault();
                handleDirection(e.target.dataset.direction);
            });
        });

        restartBtn.addEventListener('click', initGame);
        gameOverText.addEventListener('click', initGame);

        // 初始化
        window.addEventListener('resize', initGame);
        initGame();
  