const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#ffffff',
  physics: {
    default: 'matter',
    matter: {
      gravity: {
        y: 0
      },
      debug: true,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

function preload() {

}

function create() {

  // Add resetGame function to the scene
  this.resetGame = () => {
    this.scene.restart();
  };

  this.matter.world.setBounds(0, 0, 800, 600, 32, true, true, true, true);

  // Create the player
  this.player = this.matter.add.image(100, 100, 'player');
  this.player.setBody({
    type: 'circle',
    width: 32,
    height: 32,
  });

  // Disable player rotation
  this.player.setFixedRotation();
  // Create walls
  createMazeWalls(this);

  // Set player position to the starting point
  this.player.setPosition(this.startPoint.x, this.startPoint.y);
  // Setup input
  this.cursors = this.input.keyboard.createCursorKeys();

  // Set up collisions
  this.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
    if (bodyA.label === 'wall' && bodyB.label === 'player') {
      console.log('Collided with a wall');
    }
  });

  this.timerText = this.add.text(10, 10, 'Time: 0', {
    fontSize: '20px',
    fill: '#000000'
  });
  this.timeRemaining = 60; // Adjust the time as needed
  this.timeEvent = this.time.addEvent({
    delay: 1000,
    callback: () => {
      this.timeRemaining--;
      this.timerText.setText(`Time: ${this.timeRemaining}`);

      if (this.timeRemaining <= 0) {
        this.timeEvent.remove();
        this.timerText.setText("You Lost!");
        this.scene.pause(); // Pause the scene
        setTimeout(() => {
          this.resetGame(); // Reset the game after a delay
        }, 3000);
      }
    },
    loop: true,
  });

}

function update() {
  const speed = 2;

  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-speed);
  } else if (this.cursors.right.isDown) {
    this.player.setVelocityX(speed);
  } else {
    this.player.setVelocityX(0);
  }

  if (this.cursors.up.isDown) {
    this.player.setVelocityY(-speed);
  } else if (this.cursors.down.isDown) {
    this.player.setVelocityY(speed);
  } else {
    this.player.setVelocityY(0);
  }

  // Check if the player reaches the end point
  if (
    Phaser.Geom.Rectangle.Overlaps(
      this.player.getBounds(),
      this.endPoint.getBounds()
    )
  ) {
    this.timeEvent.remove();
    this.timerText.setText(`You Won! Time: ${this.timeRemaining}`);
    this.scene.pause(); // Pause the scene
    setTimeout(() => {
      this.resetGame(); // Reset the game after a delay
    }, 3000);
  }
}

// ...

function createMazeWalls(scene) {
  const maze = generateMaze(25, 19);
  const wallSize = 32;

  maze.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell === '.') {
        const x = j * wallSize + wallSize / 2;
        const y = i * wallSize + wallSize / 2;
        const wall = scene.matter.add.rectangle(x, y, wallSize, wallSize, {
          isStatic: true,
          label: 'wall',
          render: {
            fillStyle: 0xffffff, // Set the wall color to white
          },
        });

        scene.matter.world.add(wall);
      } else if (cell === 'S') {
        // Draw start point
        const startX = j * wallSize + wallSize / 2;
        const startY = i * wallSize + wallSize / 2;
        scene.startPoint = scene.add.rectangle(startX, startY, wallSize, wallSize, 0x00ff00);
      } else if (cell === 'E') {
        // Draw end point
        const endX = j * wallSize + wallSize / 2;
        const endY = i * wallSize + wallSize / 2;
        scene.endPoint = scene.add.rectangle(endX, endY, wallSize, wallSize, 0xff0000);
      }
    });
  });
}

// ...

// function generateMaze(width, height, startX = 1, startY = 1) {
//   const maze = createEmptyMaze(width, height);
//   const stack = [
//     [startX, startY]
//   ];

//   const backtrackChance = 0.3; // Increase this value to make the maze more complex

//   while (stack.length > 0) {
//     const [x, y] = stack.pop();
//     maze[y][x] = ' ';

//     const directions = [{
//         x: 0,
//         y: -1
//       }, // up
//       {
//         x: 1,
//         y: 0
//       }, // right
//       {
//         x: 0,
//         y: 1
//       }, // down
//       {
//         x: -1,
//         y: 0
//       }, // left
//     ];

//     shuffleArray(directions);

//     let validDirections = 0;

//     for (const {
//         x: dx,
//         y: dy
//       } of directions) {
//       const nx = x + dx * 2;
//       const ny = y + dy * 2;

//       if (nx >= 0 && ny >= 0 && nx < width && ny < height && maze[ny][nx] === '.') {
//         validDirections++;
//         if (Math.random() > backtrackChance) {
//           maze[y + dy][x + dx] = ' ';
//           stack.push([nx, ny]);
//         }
//       }
//     }

//     if (validDirections === 0 && stack.length > 0) {
//       const randomIndex = Math.floor(Math.random() * stack.length);
//       stack.push(stack.splice(randomIndex, 1)[0]);
//     }
//   }

//   maze[startY][startX] = 'S'; // Start point
//   maze[height - 2][width - 2] = 'E'; // End point

//   return maze;
// }


function generateMaze(width, height, startX = 1, startY = 1) {
  const maze = createEmptyMaze(width, height);

  const visited = new Array(height).fill(null).map(() => new Array(width).fill(false));
  visited[startY][startX] = true;

  const walls = [
    [startX, startY, 0, -1],
    [startX, startY, 1, 0],
    [startX, startY, 0, 1],
    [startX, startY, -1, 0]
  ];

  while (walls.length > 0) {
    const randomIndex = Math.floor(Math.random() * walls.length);
    const [x, y, dx, dy] = walls.splice(randomIndex, 1)[0];

    const nx = x + dx * 2;
    const ny = y + dy * 2;

    if (nx >= 0 && ny >= 0 && nx < width && ny < height && !visited[ny][nx]) {
      maze[y + dy][x + dx] = ' ';
      visited[ny][nx] = true;

      walls.push([nx, ny, 0, -1]);
      walls.push([nx, ny, 1, 0]);
      walls.push([nx, ny, 0, 1]);
      walls.push([nx, ny, -1, 0]);
    } else {
      // If the current wall is not connected to an unvisited cell, reconnect it with its original cell
      maze[y][x] = ' ';
    }
  }

  maze[startY][startX] = 'S'; // Start point
  maze[height - 2][width - 2] = 'E'; // End point

  return maze;
}


function createEmptyMaze(width, height) {
  return new Array(height).fill(null).map(() => new Array(width).fill('.'));
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}