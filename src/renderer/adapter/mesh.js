XML3D.webgl.MAX_MESH_INDEX_COUNT = 65535;

//Adapter for <mesh>
(function() {

    var bboxAttributes = ["boundingBox"];

    /**
     * @constructor
     */
    var MeshInfo = function(type) {
        this.vbos = {};
        this.isIndexed = false;
        this.complete = false;
        this.glType = getGLTypeFromString(type);
        this.bbox = new window.XML3DBox();

        this.getElementCount = function() {
            try {
                return this.vbos.index[0].length;
            } catch(e) {
                return 0;
            }
        }
        this.getVertexCount = function() {
            try {
                return (this.vertexCount !== undefined ? this.vertexCount[0] : this.vbos.position[0].length / 3);
            } catch(e) {
                return 0;
            }
        }
        this.update = emptyFunction;
    }

    /**
     * @constructor
     */
    var MeshRenderAdapter = function(factory, node) {
        XML3D.webgl.TransformableAdapter.call(this, factory, node);

        this.initializeEventAttributes();
        this.dataAdapter = XML3D.base.resourceManager.getAdapter(this.node, XML3D.data);
        this.parentVisible = true;
        this.renderObject = null; // This is set by renderObject itself

        this.requestObject = {};
        this.computeRequest = null;
        this.bboxComputeRequest = null;
        this.createRenderNode();
    };

    XML3D.createClass(MeshRenderAdapter, XML3D.webgl.TransformableAdapter);

    var p = MeshRenderAdapter.prototype;

    p.createRenderNode = function() {
        var parent = this.factory.getAdapter(this.node.parentElement, XML3D.webgl.RenderAdapter);
        var parentNode = parent.getRenderNode ? parent.getRenderNode() : this.factory.renderer.scene.createRootNode();
        this.renderNode = this.factory.renderer.scene.createRenderObject({parent : parentNode, meshAdapter : this,
                         visible : !this.node.visible ? false : undefined});
    };

    /**
     * @param {XML3D.events.Notification} evt
     */
    p.notifyChanged = function(evt) {
        if( (evt.type == XML3D.events.ADAPTER_HANDLE_CHANGED ) && !evt.internalType ){
            if(evt.key == "shader"){
                this.updateShader(evt.adapter);
                if(evt.handleStatus == XML3D.base.AdapterHandle.STATUS.NOT_FOUND){
                    XML3D.debug.logWarning("Missing shader with id '" + evt.url + "', falling back to default shader.");
                }
            }
            return;
        } else if (evt.type == XML3D.events.NODE_INSERTED)
        // Node insertion is handled by the CanvasRenderAdapter
            return;
        else if (evt.type == XML3D.events.NODE_REMOVED)
            return this.factory.renderer.sceneTreeRemoval(evt);
        else if (evt.type == XML3D.events.THIS_REMOVED) {
            this.clearAdapterHandles();
            return;
        }

        var target = evt.internalType || evt.attrName || evt.wrapped.attrName;

        switch (target) {
            case "visible":
                this.renderNode.setLocalVisible(evt.wrapped.newValue === "true");
                break;

            case "src":
                // Handled by data component
                break;

            case "type":
                var newGLType = this.getGLTypeFromString(evt.wrapped.newValue);
                this.renderNode.mesh.glType = newGLType;
                break;

            default:
                XML3D.debug.logWarning("Unhandled mutation event in mesh adapter for parameter '"+target+"'", evt);
                break;
        }

    };

    p.getShaderHandle = function(){
        return this.getConnectedAdapterHandle("shader");
    }

    p.setShaderHandle = function(newHandle){
        this.connectAdapterHandle("shader", newHandle);
        if(newHandle && newHandle.status == XML3D.base.AdapterHandle.STATUS.NOT_FOUND){
            XML3D.debug.logError("Could not find <shader> element of url '" + newHandle.url);
        }
    };
    p.updateShader = function(adapter){
        var shaderName = this.factory.renderer.shaderManager.createShader(adapter,
            this.factory.renderer.scene.lights);
        this.renderNode.shader = shaderName;
        XML3D.debug.logInfo("New shader, clearing requests: ", shaderName);
        this.clearRequests(); // New shader, new requests
        this.renderNode.materialChanged();
        this.factory.renderer.requestRedraw("Shader changed.", false);
    }


    /**
     * @param {WebGLRenderingContext} gl
     * @param {number} type
     * @param {Object} data
     */
    var createBuffer = function(gl, type, data) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW);
        buffer.length = data.length;
        buffer.glType = getGLTypeFromArray(data);
        return buffer;
    };

    /**
     *
     * @param {Array<String>} meshRequests
     * @param {Array<String>} objectRequests
     */
    p.createRequests = function(meshRequests, objectRequests) {
        var that = this;
        this.computeRequest = this.computeRequest || this.dataAdapter.getComputeRequest(meshRequests,
            function(request, changeType) {
                that.dataChanged(request, changeType);
        });
        this.objectRequest = this.objectRequest || this.dataAdapter.getComputeRequest(objectRequests,
            function(request, changeType) {
                XML3D.debug.logInfo("Per object shader attributes changes not handled yet", request, changeType);
            });
        this.bboxComputeRequest = this.bboxComputeRequest || this.dataAdapter.getComputeRequest(bboxAttributes);
    };

    p.clearRequests = function() {
        this.computeRequest && this.computeRequest.clear();
        this.objectRequest && this.objectRequest.clear();
        this.computeRequest = this.objectRequest = null;
    }

    p.finishMesh = function() {
        var programObject = this.renderNode.shader.program;

        this.requestObject = programObject.material.meshRequest;

        this.createRequests(Object.keys(this.requestObject), Object.keys(programObject.uniforms));

        this.createMeshData();
        this.createPerObjectData();
        return this.renderNode.mesh.valid;
    }

    var emptyFunction = function() {};


    /**
     * @param {Xflow.data.Request} request
     * @param {Xflow.RESULT_STATE} state
     */
    p.dataChanged = function(request, state) {
        var obj = this.renderNode;
        switch(state) {
            case Xflow.RESULT_STATE.CHANGED_STRUCTURE:
                XML3D.debug.logInfo("Mesh structure changed", arguments);
                if(this.renderNode.can("dataStructureChanged"))
                    this.renderNode.dataStructureChanged();
                this.factory.renderer.requestRedraw("Mesh structure changed.");
                break;
            case Xflow.RESULT_STATE.CHANGED_DATA:
                XML3D.debug.logInfo("Mesh values changed", arguments);
                if(this.renderNode.can("dataValueChanged"))
                    this.renderNode.dataValueChanged();
                this.factory.renderer.requestRedraw("Mesh values changed.");
                break;
            default:
                XML3D.debug.logInfo("Unknown state: " + state);
        }
    };

    p.createPerObjectData = function() {
        var perObjectData = this.objectRequest.getResult();
        this.renderNode.setOverride(perObjectData);
    };

    /**
     *
     */
    p.createMeshData = function() {
        var obj = this.renderNode;
        obj.mesh = obj.mesh || new MeshInfo(this.node.type);

        var dataResult =  this.computeRequest.getResult();

        obj.mesh.valid = obj.mesh.complete = true; // Optimistic appraoch
        for ( var name in this.requestObject) {
            var attr = this.requestObject[name] || {};
            var entry = dataResult.getOutputData(name);
            /*if (entry == undefined) {
                if(attr.required) {
                    // This needs a structural change before we get the required signature
                    console.log("Invalid", name);
                    obj.mesh.valid = false;
                    return;
                }
                continue;
            }*/
            if(!entry || !entry.getValue()) {
                if(attr.required) {
                    XML3D.debug.logInfo("Mesh not complete, missing: ", name, entry);
                    obj.mesh.complete = false;
                }
                continue;
            }

            if (name == "vertexCount") {
                obj.mesh.vertexCount = entry.getValue();
                continue;
            }

            switch(entry.type) {
                case Xflow.DATA_TYPE.TEXTURE:
                    this.handleTexture(name, entry, obj.shader, obj.mesh);
                    break;
                default:
                    this.handleBuffer(name, attr, entry, obj.mesh);
            };
        }
        var bbox = this.calcBoundingBox();
        if(bbox)
            obj.mesh.bbox.set(bbox);

        obj.mesh.valid = true;
    };

    /**
     * @param {string} name
     * @param {Object} attr
     * @param {Xflow.BufferEntry} entry
     * @param {MeshInfo} meshInfo
     */
    p.handleBuffer = function(name, attr, entry, meshInfo) {
        var webglData = XML3D.webgl.getXflowEntryWebGlData(entry, this.factory.canvasId);
        var buffer = webglData.buffer;
        var gl = this.factory.renderer.gl;


        switch(webglData.changed) {
            case Xflow.DATA_ENTRY_STATE.CHANGED_VALUE:
                var bufferType = name == "index" ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;

                gl.bindBuffer(bufferType, buffer);
                gl.bufferSubData(bufferType, 0, entry.getValue());
                break;
            case Xflow.DATA_ENTRY_STATE.CHANGED_NEW:
            case Xflow.DATA_ENTRY_STATE.CHANGE_SIZE:
                if (name == "index") {
                    buffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(entry.getValue()));
                } else {
                    buffer = createBuffer(gl, gl.ARRAY_BUFFER, entry.getValue());
                }
                buffer.tupleSize = entry.getTupleSize();
                webglData.buffer = buffer;
                break;
            default:
                break;
        }

        meshInfo.vbos[name] = [];
        meshInfo.vbos[name][0] = buffer;
        meshInfo.isIndexed = meshInfo.isIndexed || name == "index";
        //if(meshInfo.isIndexed)
            //console.error("Indexed");

        webglData.changed = 0;
    }
    /**
     * @param {string} name
     * @param {Xflow.TextureEntry} entry
     * @param {string} shaderId
     * @param {MeshInfo} meshInfo
     */
    p.handleTexture = function(name, entry, shaderId, meshInfo) {
        var prog = this.factory.renderer.shaderManager.getShaderByURL(shaderId);
        meshInfo.sampler = meshInfo.sampler || {};
        var webglData = XML3D.webgl.getXflowEntryWebGlData(entry, this.factory.canvasId);

        if(webglData.changed && (name in prog.samplers)) {
            this.factory.renderer.shaderManager.createTextureFromEntry(entry, prog.samplers[name]);
        }
        webglData.changed = 0;
    }

    /**
     *
     */
    p.destroy = function() {
        this.renderNode.dispose();
        if (this.computeRequest)
            this.computeRequest.clear();
        if (this.bboxComputeRequest)
            this.bboxComputeRequest.clear();
        this.clearAdapterHandles();
    };

    /**
     * @return {window.XML3DBox}
     */
    p.getBoundingBox = function() {
        if(this.renderNode && this.renderNode.mesh) {
            return new window.XML3DBox(this.renderNode.mesh.bbox);
        }

        return new window.XML3DBox();
    };

    /**
     * @return {window.XML3DMatrix}
     */
    p.getWorldMatrix = function() {
        var m = new window.XML3DMatrix(),
            obj = this.renderNode;
        if(obj) {
            obj.getWorldMatrix(m._data);
        }
        return m;
    };

    /**
     * @private
     * @return {window.XML3DBox} the calculated bounding box of this mesh.
     */
    p.calcBoundingBox = function() {

        var bbox = new window.XML3DBox();

        // try to compute bbox using the boundingbox property of xflow
        var bboxResult = this.bboxComputeRequest.getResult();
        var bboxOutData = bboxResult.getOutputData("boundingBox");
        if (bboxOutData)
        {
            var bboxVal = bboxOutData.getValue();
            bbox.extend(bboxVal[0]);
            bbox.extend(bboxVal[1]);

            return bbox;
        }

        // compute bounding box from positions and indices, if present
        var dataResult = this.computeRequest.getResult();
        var posData = dataResult.getOutputData("position");
        if(!posData)
            return bbox;

        var positions = posData.getValue();

        var idxOutData = dataResult.getOutputData("index");
        var indices = idxOutData ? idxOutData.getValue() : null;

        return XML3D.webgl.calculateBoundingBox(positions, indices);
    };

    var getGLTypeFromArray = function(array) {
        var GL = window.WebGLRenderingContext;
        if (array instanceof Int8Array)
            return GL.BYTE;
        if (array instanceof Uint8Array)
            return GL.UNSIGNED_BYTE;
        if (array instanceof Int16Array)
            return GL.SHORT;
        if (array instanceof Uint16Array)
            return GL.UNSIGNED_SHORT;
        if (array instanceof Int32Array)
            return GL.INT;
        if (array instanceof Uint32Array)
            return GL.UNSIGNED_INT;
        if (array instanceof Float32Array)
            return GL.FLOAT;
        return GL.FLOAT;
    };

    /**
     * @param {string} typeName
     */
    function getGLTypeFromString(typeName) {
        var GL = window.WebGLRenderingContext;
        if (typeName && typeName.toLoweGLase)
            typeName = typeName.toLowerCase();
        switch (typeName) {
            case "triangles":
                return GL.TRIANGLES;
            case "tristrips":
                return GL.TRIANGLE_STRIP;
            case "points":
                return GL.POINTS;
            case "lines":
                return GL.LINES;
            case "linestrips":
                return GL.LINE_STRIP;
            default:
                return GL.TRIANGLES;
        }
    };

    // Export to XML3D.webgl namespace
    XML3D.webgl.MeshRenderAdapter = MeshRenderAdapter;

}());
