function randomIntFromRange(min, max) {
    return Math.round(min + ( Math.random() * (max - min) ));
}

function getCollisionData(rect1, rect2) {
    // rect1 is current obj
    let collisionData = {
        collision: false,
        adjustmentsToRect1: null
    };
    let left1 = rect1.x,
        top1 = rect1.y,
        right1 = rect1.x + rect1.width,
        bottom1 = rect1.y + rect1.height,
        mid1Y = (top1 + bottom1) / 2;
    let left2 = rect2.x,
        top2 = rect2.y,
        right2 = rect2.x + rect2.width,
        bottom2 = rect2.y + rect2.height,
        mid2Y = (top2 + bottom2)/ 2;
    if (left1 < right2 &&
        right1 > left2 &&
        top1 < bottom2 &&
        bottom1 > top2
        ) {
            collisionData.collision = true;
            let dy = mid2Y - mid1Y / (rect2.width / 2);
            let newY1;
            if (dy > 0) { // If current obj violated from above , shift current obj upwards
                newY1 =  top2 - rect1.height;
            } else {
                newY1 = bottom2;
            }
            collisionData.adjustmentsToRect1 = {y: newY1};
    }
    return collisionData;
}