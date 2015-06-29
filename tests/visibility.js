module("Visibility", {

});



test("Mesh visibility", 8, function() {
     stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/visibility-mesh.html");

    var changeFunction = function(f) {
        return function(scene) {
            scene.ownerDocument.defaultView[f]();
            return scene;
        }
    };

    var checkInit = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),50,50);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Initially transparent");
        return s;
    });

    var checkInvisibleMesh = checkInit.then(changeFunction("addInvisbleMesh")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "display:none during insertion: Invisible mesh not rendered.");
        return s;
    });

    var makeVisibleStyleAttribute = checkInvisibleMesh.then(changeFunction("makeVisibleStyle")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Remove style attribute: Visible mesh has been rendered.");
        return s;
    });

    var makeInvisibleStyleAttribute = makeVisibleStyleAttribute.then(changeFunction("makeInvisibleStyle")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Set display none via attribute: Invisible mesh has not been rendered.");
        return s;
    });

    var makeInvisibleClass = makeInvisibleStyleAttribute.then(changeFunction("makeInvisibleClass")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Set class with display none: Invisible mesh has not been rendered.");
        return s;
    });

    var makeVisibleClass = makeInvisibleClass.then(changeFunction("makeVisibleClass")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Remove class with display none: Visible mesh has been rendered.");
        return s;
    });

    var makeInvisibleAPI = makeVisibleClass.then(changeFunction("makeInvisibleAPI")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Set display to none using style API: Invisible mesh has not been rendered.");
        return s;
    });


    makeInvisibleAPI.fin(QUnit.start).done();

});


test("Group visibility", 10, function() {
     stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/visibility-group.html");

    var changeFunction = function(f) {
        return function(scene) {
            scene.ownerDocument.defaultView[f]();
            return scene;
        }
    };

    var checkInit = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),50,50);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Initially transparent");
        return s;
    });

    var checkInvisibleGroup = checkInit.then(changeFunction("addInvisbleGroup")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "display:none during insertion: Invisible group not rendered.");
        return s;
    });

    var makeVisibleStyleAttribute = checkInvisibleGroup.then(changeFunction("makeVisibleStyle")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Remove style attribute: Visible group has been rendered.");
        return s;
    });

    var makeInvisibleStyleAttribute = makeVisibleStyleAttribute.then(changeFunction("makeInvisibleStyle")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Set display none via attribute: Invisible group has not been rendered.");
        return s;
    });

    var makeInvisibleClass = makeInvisibleStyleAttribute.then(changeFunction("makeInvisibleClass")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Set class with display none: Invisible group has not been rendered.");
        return s;
    });

    var makeVisibleClass = makeInvisibleClass.then(changeFunction("makeVisibleClass")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Remove class with display none: Visible group has been rendered.");
        return s;
    });

    var makeInvisibleAPI = makeVisibleClass.then(changeFunction("makeInvisibleAPI")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Set display to none using style API: Invisible group has not been rendered.");
        return s;
    });

    var addVisibleMeshToInvisibleGroup = makeInvisibleAPI.then(changeFunction("addVisibleMeshToInvisibleGroup")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Set display to none using style API: Invisible group has not been rendered.");
        return s;
    });

    var addInvisibleMeshToVisibleGroup = addVisibleMeshToInvisibleGroup.then(changeFunction("addInvisibleMeshToVisibleGroup")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 50, 50);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Set display to none using style API: Invisible group has not been rendered.");
        return s;
    });


    addInvisibleMeshToVisibleGroup.fin(QUnit.start).done();

});
