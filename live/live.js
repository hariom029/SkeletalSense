let net;
let videoElement;
let outputCanvas;
let ctx;

// Accuracy variables
let numCorrectKeypoints = 0;
let totalKeypoints = 0;
let accuracy = 0;

async function setup() {
    net = await posenet.load();
    videoElement = document.getElementById('videoElement');
    outputCanvas = document.getElementById('outputCanvas');
    ctx = outputCanvas.getContext('2d');

    startVideo();
}

async function startVideo() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;

    videoElement.onloadedmetadata = () => {
        videoElement.play();
        requestAnimationFrame(detectPose);
    };
}

async function detectPose() {
    const poses = await net.estimateMultiplePoses(videoElement, {
        flipHorizontal: false,
        maxDetections: 5,
        scoreThreshold: 0.5
    });

    updateAccuracy(poses); // Update accuracy

    drawPoses(poses);
    requestAnimationFrame(detectPose);
}

function updateAccuracy(poses) {
    numCorrectKeypoints = 0;
    totalKeypoints = 0;

    for (const pose of poses) {
        const keypoints = pose.keypoints;
        totalKeypoints += keypoints.length;

        for (const keypoint of keypoints) {
            if (keypoint.score > 0.2) {
                numCorrectKeypoints++;
            }
        }
    }

    accuracy = (numCorrectKeypoints / totalKeypoints) * 100;
    accuracy = isNaN(accuracy) ? 0 : accuracy; // Handle NaN case
}

function drawPoses(poses) {
    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

    for (const pose of poses) {
        drawKeypoints(pose.keypoints);
        drawSkeleton(pose.keypoints);
    }

    displayAccuracy(); // Display accuracy
}

function drawSkeleton(keypoints) {
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, 0.1);

    for (const pair of adjacentKeyPoints) {
        const [pointA, pointB] = pair;
        if (pointA.score > 0.2 && pointB.score > 0.2) {
            ctx.beginPath();
            ctx.moveTo(pointA.position.x, pointA.position.y);
            ctx.lineTo(pointB.position.x, pointB.position.y);
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

function drawKeypoints(keypoints) {
    const facialKeypoints = ["leftEye", "rightEye", "nose", "leftEar", "rightEar"];
    let min_x = Number.MAX_SAFE_INTEGER;
    let max_x = Number.MIN_SAFE_INTEGER;
    let min_y = Number.MAX_SAFE_INTEGER;
    let max_y = Number.MIN_SAFE_INTEGER;

    for (const keypoint of keypoints) {
        if (keypoint.score > 0.2) {
            ctx.beginPath();
            ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();

            if (facialKeypoints.includes(keypoint.part)) {
                min_x = Math.min(min_x, keypoint.position.x);
                max_x = Math.max(max_x, keypoint.position.x);
                min_y = Math.min(min_y, keypoint.position.y);
                max_y = Math.max(max_y, keypoint.position.y);
            }
        }
    }

    if (min_x !== Number.MAX_SAFE_INTEGER && max_x !== Number.MIN_SAFE_INTEGER &&
        min_y !== Number.MAX_SAFE_INTEGER && max_y !== Number.MIN_SAFE_INTEGER) {
        const centerX = (min_x + max_x) / 2;
        const centerY = (min_y + max_y) / 2;
        const radius = Math.max(max_x - min_x, max_y - min_y) / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function displayAccuracy() {
    const accuracyDisplay = document.getElementById('accuracyDisplay');
    accuracyDisplay.textContent = `Accuracy: ${accuracy.toFixed(2)}%`;
}

setup();
