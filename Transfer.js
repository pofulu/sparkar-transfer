//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– CONFIG

const TRANSFER_KEYWORD = '#';

const FROM_SCRIPT_PATTERN = 'NAME_KEY';    //i.e.: plane0_p

const POSITION_KEYWORD = 'p';
const SCALE_KEYWORD = 's';
const ROTATION_KEYWORD = 'r';

const PERCENTAGE_POSITION_KEYWORD = 'pp';

const WORLD_POSITION_KEYWORD = 'wp';
const WORLD_SCALE_KEYWORD = 'ws';
const WORLD_ROTATION_KEYWORD = 'wr';

//–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

const Scene = require('Scene');
const Reactive = require('Reactive');
const Patches = require('Patches');
const Diagnostics = require('Diagnostics');
const CameraInfo = require('CameraInfo');
const Units = require('Units');

const targets = Scene.root.findByPath(`**/*${TRANSFER_KEYWORD}*`);
const R2D = 57.2957795131;

//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– Method

/**
 * @returns {Promise<void>}
 */
targets.then(results => {
    const getName = sceneObject => sceneObject.name.replace(`${TRANSFER_KEYWORD}`, '').trim();

    groupBy(results, i => getName(i)).forEach(element => {
        if (element.length > 1) {
            let nameList = element.map(i => `"${i.name}"`);
            nameList[nameList.length - 1] += '  <--';
            nameList = nameList.join('\n');

            Diagnostics.log(`More than one object's origin name are "${getName(element[0])}", the value sent to patch will be only the last one:\n${nameList}`);
        }
    });

    const setAllFromScript = results.map(target => {
        const name = getName(target);
        const pattern = FROM_SCRIPT_PATTERN.replace('NAME', name);

        return Promise.all([
            Patches.inputs.setPoint(pattern.replace('KEY', POSITION_KEYWORD), target.transform.position),
            Patches.inputs.setPoint(pattern.replace('KEY', SCALE_KEYWORD), Reactive.pack3(target.transform.scaleX, target.transform.scaleY, target.transform.scaleZ)),
            Patches.inputs.setPoint(pattern.replace('KEY', ROTATION_KEYWORD), Reactive.pack3(target.transform.rotationX.mul(R2D), target.transform.rotationY.mul(R2D), target.transform.rotationZ.mul(R2D))),

            Patches.inputs.setPoint2D(pattern.replace('KEY', PERCENTAGE_POSITION_KEYWORD), Reactive.point2d(getPercX(target.transform.x), getPercY(target.transform.y))),

            Patches.inputs.setPoint(pattern.replace('KEY', WORLD_POSITION_KEYWORD), target.worldTransform.position),
            Patches.inputs.setPoint(pattern.replace('KEY', WORLD_SCALE_KEYWORD), Reactive.pack3(target.worldTransform.scaleX, target.worldTransform.scaleY, target.worldTransform.scaleZ)),
            Patches.inputs.setPoint(pattern.replace('KEY', WORLD_ROTATION_KEYWORD), Reactive.pack3(target.worldTransform.rotationX.mul(R2D), target.worldTransform.rotationY.mul(R2D), target.worldTransform.rotationZ.mul(R2D))),
        ]);
    })

    return Promise.all(setAllFromScript);
});

module.exports = new class TransferModule {
    logTrackedObjectNames() {
        return targets.then(results => Diagnostics.log(results.map(i => i.name)));
    }
}

//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– Utility

function groupBy(array, f) {
    let groups = {};
    array.forEach(function (o) {
        let group = JSON.stringify(f(o));
        groups[group] = groups[group] || [];
        groups[group].push(o);
    });
    return Object.keys(groups).map(function (group) {
        return groups[group];
    });
}

/**
 * @returns {ScalarSignal}
 */
function getPercX(transformX) {
    const widthMax = CameraInfo.previewSize.width.div(CameraInfo.previewSize.height).mul(Units.cm(25));
    return transformX.add(widthMax).div(widthMax.mul(2));
}

/**
 * @returns {ScalarSignal}
 */
function getPercY(transformY) {
    return Reactive.val(Units.cm(25)).sub(transformY).div(Units.cm(50));
}
