let net;
let uploadedImage;
let outputCanvas;
let ctx;
let accuracyDisplay;

async function setup() {
    net = await posenet.load();
    uploadedImage = document.getElementById('uploadedImage');
    outputCanvas = document.getElementById('outputCanvas');
    ctx = outputCanvas.getContext('2d');
    accuracyDisplay = document.getElementById('accuracyDisplay');

    // Trigger pose detection when a file is uploaded
    document.getElementById('uploadInput').addEventListener('change', handleFileUpload);
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    const blobURL = URL.createObjectURL(file);

    // Set the uploaded image as the source for uploadedImage
    uploadedImage.src = blobURL;

    // When the image is loaded, detect the pose and resize the canvas
    uploadedImage.onload = async function () {
        await detectPose();
    };
}

async function detectPose() {
    // Resize the canvas to fit both the image and the pose
    outputCanvas.width = uploadedImage.width;
    outputCanvas.height = uploadedImage.height;

    const poses = await net.estimateMultiplePoses(uploadedImage, {
        flipHorizontal: false,
        maxDetections: 5,
        scoreThreshold: 0.5
    });

    drawPoses(poses);

    // Calculate and display accuracy
    const accuracy = calculateAccuracy(poses);
    displayAccuracy(accuracy);
}

function drawPoses(poses) {
    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

    for (const pose of poses) {
        drawKeypoints(pose.keypoints);
        drawSkeleton(pose.keypoints);
    }
}

function drawKeypoints(keypoints) {
    for (const keypoint of keypoints) {
        if (keypoint.score > 0.2) {
            ctx.beginPath();
            ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
        }
    }

    // Enclose facial keypoints in a circle
    const facialKeypoints = ["leftEye", "rightEye", "nose", "leftEar", "rightEar"];
    const facialPoints = keypoints.filter(keypoint => facialKeypoints.includes(keypoint.part));

    if (facialPoints.length > 0) {
        const minX = Math.min(...facialPoints.map(p => p.position.x));
        const minY = Math.min(...facialPoints.map(p => p.position.y));
        const maxX = Math.max(...facialPoints.map(p => p.position.x));
        const maxY = Math.max(...facialPoints.map(p => p.position.y));

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const radius = Math.max(maxX - minX, maxY - minY) / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
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

function calculateAccuracy(poses) {
    // Assuming some accuracy calculation logic here
    // You can replace this with your actual accuracy calculation method
    return Math.random() * 100; // Just a random value for demonstration
}

function displayAccuracy(accuracy) {
    accuracyDisplay.textContent = `Accuracy: ${accuracy.toFixed(2)}%`;
}

setup();
