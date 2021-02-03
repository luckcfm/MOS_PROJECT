var Sax = require('sax');
var XmlBuilder = require('xmlbuilder');
var ObjectAssign = require('object-assign');

var internals = {};

internals.whitespaceOnly = /^\s*$/;


exports.fromXml = internals.fromXml = function (xml, spec, callback) {
    
    var strict = true;
    var parser = Sax.parser(strict);

    var output = {};

    var currentState = {
        parseState : spec,
        storeChild: function (node, value) {
            output[node.name] = value;
        },
        writeText: function () {
            console.error('Cannot writeText without first visiting element node');
        }
    };

    var parseState = [];

    // TODO: _.once(callback) for callback?
    parser.onerror = function (err)  {
        callback(err);
    };

    parser.onopentag = function (node) {

        var parentState = currentState;

        var thisParseState = currentState.parseState[node.name] || {};

        var thisState = {
            parentState: parentState,
            parseState: thisParseState,
            nodeName: node.name
        };


        if (thisParseState.$arrayElement) {
            var outputArray = [];
            var output;
            if (thisParseState.$content === false) {
                output = outputArray;
            } else {
                var nodeBase = ObjectAssign({}, node.attributes);
                nodeBase[thisParseState.$content || '$content'] = outputArray;
                output = nodeBase;
            }

            parentState.storeChild(node, output);


            thisState.storeChild = function (node, value) {
                var wrapper = {};
                wrapper[node.name] = value;
                outputArray.push(wrapper);
            };

            thisState.writeText = function (text) {
                // TODO: log an error
                // Can't write text to an $arrayElement
            }

        } else {

            var currentNode = node;

            if (thisParseState.$content === false ) {
                thisState.storeChild = function (node, value) {
                    console.warn('Cannot store child node `' + currentNode.name + '` as child of $content-false node');
                };

                thisState.writeText = function (text) {
                    parentState.storeChild(currentNode, text);
                }
            } else {


                nodeBase = ObjectAssign({}, node.attributes);

                parentState.storeChild(node, nodeBase);

                thisState.storeChild = function (node, value) {
                    nodeBase[node.name] = value;
                };


                thisState.writeText = function (text) {
                    nodeBase[thisParseState.$content || '$content'] = text;
                }
            }
        }

        parseState.push(thisState);
        currentState = thisState;
    };


    parser.onclosetag = function () {

        parseState.pop();
        currentState = parseState[parseState.length - 1];
    };


    parser.ontext = function (text) {

        if (!internals.whitespaceOnly.test(text)) {
            currentState.writeText(text);
        }
    };

    parser.onend = function () {
        callback(null, output);
    };

    parser.write(xml).close();
};

internals.convertToXml = function (builder, schema, jsObject) {

    if (typeof jsObject === 'string' || typeof jsObject === 'number') {
        builder.t(jsObject);
        return builder;
    }

    if (schema && schema.$arrayElement && Array.isArray(jsObject)) {
        return internals.arrayToXml(builder, schema, jsObject);
    }

    if (typeof jsObject === 'object' && jsObject !== null) {
        return internals.objectToXml(builder, schema, jsObject);
    }
};

internals.arrayToXml = function (builder, schema, jsObject) {

    jsObject.forEach(function (obj) {
        internals.objectToXml(builder, schema, obj);
    });
};

internals.objectToXml = function (builder, schema, jsObject) {

    if (typeof jsObject !== 'object') {
        throw new Error('Object expected, got ', typeof jsObject);
    }

    schema = schema || {};

    var contentName = schema.$content === false ? false : (schema.$content || '$content');

    var keys = Object.keys(jsObject);
    for(var index = 0; index < keys.length; ++index) {

        var schemaForKey = schema[keys[index]] || {};
        var keyIsContent = (keys[index] === contentName);

        if (keyIsContent) {
            internals.convertToXml(builder, schema, jsObject[keys[index]]);
        } else if (typeof(jsObject[keys[index]]) === 'object') {
            internals.convertToXml(builder.ele(keys[index]), schemaForKey, jsObject[keys[index]]);
        } else if (schemaForKey.$content === false) {
            internals.convertToXml(builder.ele(keys[index]), schemaForKey, jsObject[keys[index]]);
        } else {
            builder.att(keys[index], jsObject[keys[index]]);
        }
    }

    return builder;
};

exports.toXml = function (jsObject, spec, callback) {
    var firstKey = Object.keys(jsObject)[0];
    var builder = XmlBuilder.create(firstKey, {}, {}, { headless: true} );
    spec = spec || {};
    builder = internals.convertToXml(builder, spec[firstKey], jsObject[firstKey]);

    callback(null, builder.end());
};

