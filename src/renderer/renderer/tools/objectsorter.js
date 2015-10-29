var vec3 = require("gl-matrix").vec3;

/**
 *
 * @constructor
 */
var ObjectSorter = function () {

};

var c_bbox = new XML3D.Box();
var c_center = vec3.create();

XML3D.extend(ObjectSorter.prototype, {
    /**
     * @param {Array} sourceObjectArray
     * @param {XML3D.Mat4?} viewMatrix Matrix to apply to objects world space extend before sorting
     */
    sortObjects: function (sourceObjectArray, viewMatrix) {
        var presortOpaque = {}, presortTransparent = {};

        // Sort by transparency and z-index
        var obj;
        for (var i = 0, l = sourceObjectArray.length; i < l; i++) {
            obj = sourceObjectArray[i];
            if (obj.inFrustum === false) {
                continue;
            }
            if (obj.hasTransparency()) {
                if (!presortTransparent[obj._zIndex]) {
                    presortTransparent[obj._zIndex] = [obj];
                } else {
                    presortTransparent[obj._zIndex].push(obj);
                }
            } else {
                if (!presortOpaque[obj._zIndex]) {
                    presortOpaque[obj._zIndex] = [obj];
                } else {
                    presortOpaque[obj._zIndex].push(obj);
                }
            }
        }

        // Separate the scene into z-layers according to z-index
        var zLayers = Object.keys(presortOpaque).concat(Object.keys(presortTransparent));
        zLayers.sort(function(a,b) {
            return parseInt(a) - parseInt(b);
        });

        // Sort opaque z-buckets by shader
        var opaque = {};
        for (var i=0; i<zLayers.length; i++) {
            var key = zLayers[i];
            opaque[key] = {};
            for (var index in presortOpaque[key]) {
                var obj = presortOpaque[key][index];
                var program = obj.getProgram();
                opaque[key][program.id] = opaque[key][program.id] || [];
                opaque[key][program.id].push(obj);
            }
        }

        // Sort opaque shader buckets by depth for early z fails
        for (var zLayer in zLayers) {
            for (var progId in opaque[zLayer]) {
                var withinShader = opaque[zLayer][progId];
                var sortedArray = new Array(withinShader.length);
                for (i = 0; i < withinShader.length; i++) {
                    obj = withinShader[i];
                    obj.getWorldSpaceBoundingBox(c_bbox);
                    c_bbox.center(c_center);
                    viewMatrix && vec3.transformMat4(c_center, c_center, viewMatrix);
                    sortedArray[i] = {
                        obj: obj, depth: c_center.z
                    };
                }
                sortedArray.sort(function (a, b) {
                    return b.depth - a.depth;
                });
                opaque[zLayer][progId] = sortedArray.map(function (e) {
                    return e.obj;
                });
            }
        }

        //Sort transparent z-buckets back to front
        var transparent = {};
        for (var ind in zLayers) {
            var zLayer = zLayers[ind];
            var tlayer = [];
            for (var index in presortTransparent[zLayer]) {
                var obj = presortTransparent[zLayer][index];
                obj.getWorldSpaceBoundingBox(c_bbox);
                c_bbox.center(c_center);
                viewMatrix && vec3.transformMat4(c_center, c_center, viewMatrix);
                tlayer.push([obj, c_center.z]);
            }

            tlayer.sort(function (a, b) {
                return a[1] - b[1];
            });

            for (var i = 0; i < tlayer.length; i++) {
                tlayer[i] = tlayer[i][0];
            }

            transparent[zLayer] = tlayer;
        }

        // zLayers contains all unique z-index values in the scene, partitioning it into z-buckets
        return {
            opaque: opaque, transparent: transparent, zLayers : zLayers
        }
    }

});


module.exports = ObjectSorter;


