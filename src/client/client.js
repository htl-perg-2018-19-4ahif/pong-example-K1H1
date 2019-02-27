window.addEventListener("load", async () => {
    ;
    /** Represents directions  */
    let Direction;
    (function (Direction) {
        Direction[Direction["top"] = 0] = "top";
        Direction[Direction["right"] = 1] = "right";
        Direction[Direction["bottom"] = 2] = "bottom";
        Direction[Direction["left"] = 3] = "left";
        Direction[Direction["leftPaddle"] = 4] = "leftPaddle";
        Direction[Direction["rightPaddle"] = 5] = "rightPaddle";
    })(Direction || (Direction = {}));
    ;
    // Get some information about the browser window and the ball. This information will
    // never change. So it makes sense to get it only once to make the rest of the program faster.
    const ball = document.getElementById('ball');
    const ballSize = { width: ball.clientWidth, height: ball.clientHeight };
    const ballHalfSize = splitSize(ballSize, 2);
    const clientSize = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
    const clientHalfSize = splitSize(clientSize, 2);
    //Paddle
    const paddle = document.getElementsByClassName('left_paddle')[0];
    const paddleHeight = paddle.clientHeight;
    const paddleHalfHeight = paddleHeight / 2;
    let currentPaddlePosition = paddle.clientTop;
    // Controls the speed of the movement (number of pixels per interval)
    const speed = 1;
    // Two helper variables that contain values during movement with cursor
    // keys. If currently not movement is happening, they are undefined.
    let interval;
    let direction;
    document.addEventListener('keydown', event => {
        // We have to check whether a movement is already in progress. This is
        // necessary because keydown events arrive often when key is
        // continuously pressed.
        if (!interval) {
            switch (event.code) {
                case 'ArrowDown':
                    direction = speed;
                    startMoving();
                    break;
                case 'ArrowUp':
                    direction = speed * -1;
                    startMoving();
                    break;
            }
        }
    });
    document.addEventListener('keyup', event => {
        switch (event.code) {
            case 'ArrowDown':
            case 'ArrowUp':
                stopMoving();
                break;
        }
    });
    // Setup handler for touch displays (pan operation)
    /*const hammertime = new Hammer(paddle);
    hammertime.get('pan').set({ direction: Hammer.DIRECTION_DOWN | Hammer.DIRECTION_UP });
    hammertime.on('pan', ev =>
      // Put center of paddle to the center of the user's finger
      movePaddle(ev.center.y - paddleHalfHeight));*/
    /** Helper function that starts movement when keydown happens */
    function startMoving() {
        // Move paddle every 4ms
        interval = setInterval(() => movePaddle(currentPaddlePosition + direction), 4);
    }
    /** Helper function that stops movement when keyup happens */
    function stopMoving() {
        clearInterval(interval);
        interval = direction = undefined;
    }
    /**
     * Helper function that moves the paddle to a given position
     * @param targetPosition Target position. No movement is done if target position is invalid
     */
    function movePaddle(targetPosition) {
        if (targetPosition >= 0 && (targetPosition + paddleHeight) <= document.documentElement.clientHeight) {
            currentPaddlePosition = targetPosition;
            // Note the 'px' at the end of the coordinates for CSS. Don't
            // forget it. Without the 'px', it doesn't work.
            paddle.style.setProperty('top', `${currentPaddlePosition}px`);
        }
    }
    let out;
    game();
    let score_left = 0;
    let score_right = 0;
    async function game() {
        out = false;
        // Move ball to center of the screen
        let ballCurrentPosition = { x: clientHalfSize.width, y: clientHalfSize.height };
        moveBall(ballCurrentPosition);
        // Calculate the random angle that the ball should initially travel.
        // Should be an angle between 27.5 and 45 DEG (=PI/8 and PI/4 RAD)
        const angle = Math.PI / 8 + Math.random() * Math.PI / 8;
        // Calculate the random quadrant into which the ball should initially travel.
        // 0 = upper right, 1 = lower right, 2 = lower left, 3 = upper left
        let quadrant = Math.floor(Math.random() * 4);
        do {
            // Calculate target.
            // X-coordinate iw either right or left border of browser window (depending on
            //              target quadrant)
            // y-coordinate is calculated using tangens angle function of angle
            //              (note: tan(angle) = delta-y / delta-x). The sign depends on
            //              the target quadrant)
            const targetX = (quadrant === 0 || quadrant === 1) ? clientSize.width - ballSize.width : 0;
            const targetBallPosition = {
                x: targetX,
                y: ballCurrentPosition.y + Math.tan(angle) * Math.abs(targetX - ballCurrentPosition.x) * ((quadrant === 0 || quadrant === 3) ? -1 : 1)
            };
            // Animate ball to calculated target position
            const borderTouch = await animateBall(ballCurrentPosition, targetBallPosition);
            // Based on where the ball touched the browser window, we change the new target quadrant.
            // Note that in this solution the angle stays the same.
            switch (borderTouch.touchDirection) {
                case Direction.left:
                    //points
                    score_right++;
                    $('.right_score')[0].innerHTML = score_right + "";
                    out = true;
                    break;
                case Direction.right:
                    //quadrant = (quadrant === 0) ? 3 : 2;
                    //points
                    score_left++;
                    $('.left_score')[0].innerHTML = score_left + "";
                    //ballCurrentPosition = { x: clientHalfSize.width, y: clientHalfSize.height };
                    //moveBall(ballCurrentPosition);
                    out = true;
                    break;
                case Direction.leftPaddle:
                    quadrant = (quadrant === 2) ? 1 : 0;
                    break;
                case Direction.rightPaddle:
                    quadrant = (quadrant === 0) ? 3 : 2;
                    break;
                case Direction.top:
                    quadrant = (quadrant === 0) ? 1 : 2;
                    break;
                case Direction.bottom:
                    quadrant = (quadrant === 2) ? 3 : 0;
                    break;
                default:
                    throw new Error('Invalid direction, should never happen');
            }
            // The touch position is the new current position of the ball.
            // Note that we fix the position here slightly in case a small piece of the ball has reached an area
            // outside of the visible browser window.
            ballCurrentPosition.x = Math.min(Math.max(borderTouch.touchPosition.x - ballHalfSize.width, 0) + ballHalfSize.width, clientSize.width);
            ballCurrentPosition.y = Math.min(Math.max(borderTouch.touchPosition.y - ballHalfSize.height, 0) + ballHalfSize.height, clientSize.height);
        } while (!out);
        game();
    }
    /**
     * Animate the ball from the current position to the target position. Stops
     * animation if border of browser window is reached.
     * @returns Position and direction where ball touched the border of the browser window
     *          at the end of the animation
     */
    function animateBall(currentBallPosition, targetBallPosition) {
        // Calculate x and y distances from current to target position
        const distanceToTarget = subtractPoints(targetBallPosition, currentBallPosition);
        // Use Pythagoras to calculate distance from current to target position
        const distance = Math.sqrt(distanceToTarget.width * distanceToTarget.width + distanceToTarget.height * distanceToTarget.height);
        // Variable defining the speed of the animation (pixels that the ball travels per interval)
        const pixelsPerInterval = 1;
        // Calculate distance per interval
        const distancePerInterval = splitSize(distanceToTarget, distance * pixelsPerInterval);
        // Return a promise that will resolve when animation is done
        return new Promise(res => {
            // Start at current ball position
            let animatedPosition = currentBallPosition;
            // Move point every 4ms
            const interval = setInterval(() => {
                // Move animated position by the distance it has to travel per interval
                animatedPosition = movePoint(animatedPosition, distancePerInterval);
                // Move the ball to the new position
                moveBall(animatedPosition);
                // Check if the ball touches the browser window's border
                let touchDirection;
                if (overlaps($('#ball'), $('.left_paddle'))) {
                    //links
                    touchDirection = Direction.leftPaddle;
                }
                if (overlaps($('#ball'), $('.right_paddle'))) {
                    //links
                    touchDirection = Direction.rightPaddle;
                }
                if ((animatedPosition.x - ballHalfSize.width) < 0) {
                    touchDirection = Direction.left;
                }
                if ((animatedPosition.y - ballHalfSize.height) < 0) {
                    touchDirection = Direction.top;
                }
                if ((animatedPosition.x + ballHalfSize.width) > clientSize.width) {
                    touchDirection = Direction.right;
                }
                if ((animatedPosition.y + ballHalfSize.height) > clientSize.height) {
                    touchDirection = Direction.bottom;
                }
                if (touchDirection !== undefined) {
                    // Ball touches border -> stop animation
                    clearInterval(interval);
                    res({ touchPosition: animatedPosition, touchDirection: touchDirection });
                }
            }, 4);
        });
    }
    /** Move the center of the ball to given position **/
    function moveBall(targetPosition) {
        // Note the 'px' at the end of the coordinates for CSS. Don't
        // forget it. Without the 'px', it doesn't work.
        const leftPos = `${targetPosition.x - ballHalfSize.width}px`;
        const topPos = `${targetPosition.y - ballHalfSize.height}px`;
        if (ball.style.left !== leftPos) {
            ball.style.setProperty('left', leftPos);
        }
        if (ball.style.top !== topPos) {
            ball.style.setProperty('top', topPos);
        }
    }
    /** Subtracts two points and returns the size between them */
    function subtractPoints(a, b) {
        return {
            width: a.x - b.x,
            height: a.y - b.y
        };
    }
    /** Moves a point by the given size */
    function movePoint(p, s) {
        return {
            x: p.x + s.width,
            y: p.y + s.height
        };
    }
    /** Divides the width and height of the given size by the given divider */
    function splitSize(s, divider) {
        return {
            width: s.width / divider,
            height: s.height / divider
        };
    }
});
let overlaps = (function () {
    function getPositions(elem) {
        let pos, width, height;
        pos = $(elem).position();
        width = $(elem).width();
        height = $(elem).height();
        return [[pos.left, pos.left + width], [pos.top, pos.top + height]];
    }
    function comparePositions(p1, p2) {
        let r1, r2;
        r1 = p1[0] < p2[0] ? p1 : p2;
        r2 = p1[0] < p2[0] ? p2 : p1;
        return r1[1] > r2[0] || r1[0] === r2[0];
    }
    return function (a, b) {
        let pos1 = getPositions(a), pos2 = getPositions(b);
        return comparePositions(pos1[0], pos2[0]) && comparePositions(pos1[1], pos2[1]);
    };
})();
/**************************************************************************
  Demo for a socket.io client
  NOTE: This code has not been optimized for size or speed. It was written
        with ease of understanding in mind.
**************************************************************************/
window.addEventListener('load', async () => {
    const keys = document.getElementById('keys');
    // Establish connection with socket.io server. Note that this just works
    // because `<script src="/socket.io/socket.io.js"></script>` is in index.html
    const socket = io();
    // Handle browser's keydown event
    document.addEventListener('keydown', event => {
        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
            // Send ArrowKey message to server
            socket.emit('ArrowKey', event.code);
        }
    });
    // Handle ArrowKey message received from server (i.e. user pressed
    // an arrow key in a different browser window).
    socket.on('ArrowKey', code => {
        // Add code of the pressed key to HTML list
        const newLi = document.createElement('li');
        newLi.innerText = code;
        keys.appendChild(newLi);
    });
});
