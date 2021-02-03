var XmlConvert = require('../');
var Unexpected = require('unexpected');

var expect = Unexpected.clone();



describe('xmlConvert', function () {
    describe('fromXml', function () {

        it('converts a single empty tag with no spec', function (done) {

            XmlConvert.fromXml('<someTag />', {}, function (err, value) {
                expect(err, 'to be null');
                done();
            });
        });

        it('converts a single emtpy tag with a spec', function (done) {

            XmlConvert.fromXml('<someTag />', {someTag: {}}, function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', {someTag: {}});
                done();
            });
        });

        it('converts a single tag with content and defaults', function (done) {

            XmlConvert.fromXml('<someTag>with content</someTag>', {}, function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', {someTag: {$content: 'with content'}});
                done();
            });
        });

        it('converts a single tag with content reduced', function (done) {

            XmlConvert.fromXml('<someTag>with content</someTag>', {someTag: {$content: false}}, function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', {someTag: 'with content'});
                done();
            });
        });

        it('converts attributes by default to properties', function (done) {

            XmlConvert.fromXml('<someTag id="1234" someAttrib="abc123">with content</someTag>',
                {},  // Default spec
                function (err, value) {
                    expect(err, 'to be null');
                    expect(value, 'to equal', {
                        someTag: {
                            $content: 'with content',
                            id: '1234',
                            someAttrib: 'abc123'
                        }
                    });
                    done();
                });
        });

        it('converts nested tags to sub-objects', function (done) {

            XmlConvert.fromXml('<someTag id="1234" someAttrib="abc123"> <nested anotherId="5432" /> </someTag>',
                {},  // Default spec
                function (err, value) {
                    expect(err, 'to be null');
                    expect(value, 'to equal', {
                        someTag: {
                            id: '1234',
                            someAttrib: 'abc123',
                            nested: {
                                anotherId: '5432'
                            }
                        }
                    });
                    done();
                });
        });

        it('converts nested tags to sub-objects, depth 3', function (done) {

            XmlConvert.fromXml('<someTag id="1234" someAttrib="abc123">' +
                '<nested anotherId="5432"> ' +
                '<subNested subId="999">subnested content</subNested>' +
                '</nested>' +
                '</someTag>',
                {},  // Default spec
                function (err, value) {
                    expect(err, 'to be null');
                    expect(value, 'to equal', {
                        someTag: {
                            id: '1234',
                            someAttrib: 'abc123',
                            nested: {
                                anotherId: '5432',
                                subNested: {
                                    subId: '999',
                                    $content: 'subnested content'
                                }
                            }
                        }
                    });
                    done();
                });
        });


        it('converts nested tags to sub-objects, depth 3, following the spec', function (done) {

            XmlConvert.fromXml('<someTag id="1234" someAttrib="abc123">' +
                '<nested anotherId="5432"> ' +
                '<subNested>subnested content</subNested>' +
                '</nested>' +
                '</someTag>',
                {
                    someTag: {
                        nested: {
                            subNested: {
                                $content: false
                            }
                        }
                    }
                },
                function (err, value) {
                    expect(err, 'to be null');
                    expect(value, 'to equal', {
                        someTag: {
                            id: '1234',
                            someAttrib: 'abc123',
                            nested: {
                                anotherId: '5432',
                                subNested: 'subnested content'
                            }
                        }
                    });
                    done();
                });
        });


        it('converts arrayElements to an array', function (done) {

            XmlConvert.fromXml('<someTag>' +
                '<nested anotherId="5432" />' +
                '<nested anotherId="1234" />' +
                '</someTag>',
                {
                    someTag: {
                        $content: false,
                        $arrayElement: true
                    }
                },
                function (err, value) {
                    expect(err, 'to be null');
                    expect(value, 'to equal', {
                        someTag: [
                            {nested: {anotherId: '5432'}},
                            {nested: {anotherId: '1234'}}
                        ]
                    });
                    done();
                });
        });

        it('converts arrayElements to an array with a named content', function (done) {

            XmlConvert.fromXml('<someTag id="abc">' +
                '<nested anotherId="5432" />' +
                '<nested anotherId="1234" />' +
                '</someTag>',
                {
                    someTag: {
                        $content: 'nested',
                        $arrayElement: true
                    }
                },
                function (err, value) {
                    expect(err, 'to be null');
                    expect(value, 'to equal', {
                        someTag: {
                            id: 'abc',
                            nested: [
                                {nested: {anotherId: '5432'}},
                                {nested: {anotherId: '1234'}}
                            ]
                        }
                    });
                    done();
                });
        });

        it('converts nested arrayElements', function (done) {

            XmlConvert.fromXml('<someTag id="abc">' +
                '<nested anotherId="5432">' +
                '<t1 id="ghi"/>' +
                '<t1 id="jkl"/>' +
                '</nested>' +
                '<nested anotherId="1234">' +
                '<t1 id="lmn"/>' +
                '<t1 id="opq"/>' +
                '</nested>' +
                '</someTag>',
                {
                    someTag: {
                        $content: 'children',
                        $arrayElement: true,
                        nested: {
                            $arrayElement: true,
                            $content: 't1elements'
                        }
                    }
                },
                function (err, value) {
                    expect(err, 'to be null');
                    expect(value, 'to equal', {
                        someTag: {
                            id: 'abc',
                            children: [
                                {nested: {anotherId: '5432', t1elements: [{t1: { id: 'ghi'}}, {t1: { id: 'jkl'}}]}},
                                {nested: {anotherId: '1234', t1elements: [{t1: { id: 'lmn'}}, {t1: { id: 'opq'}}]}}
                            ]
                        }
                    });
                    done();
                });
        });


        it('converts arrayElements to an array with different child elements', function (done) {

            XmlConvert.fromXml
            ('<someTag>' +
                  '<nested anotherId="5432" />' +
                  '<nest anotherId="1234"><subtag><t1>edam</t1><t1>blue</t1></subtag></nest>' +
                  '<nest anotherId="1235"><subtag><t1>cheddar</t1><t1>gouda</t1></subtag></nest>' +
                '</someTag>',
                {
                    someTag: {
                        $content: false,
                        $arrayElement: true,
                        nest: {
                            subtag: {
                                $arrayElement: true,
                                $content: false,
                                t1: { $content: false }
                            }
                        }
                    }
                },
                function (err, value) {
                    expect(err, 'to be null');
                    expect(value, 'to equal', {
                        someTag: [
                            {nested: {anotherId: '5432'}},
                            {nest: {anotherId: '1234', subtag: [{ t1: 'edam'}, {t1: 'blue'}]}},
                            {nest: {anotherId: '1235', subtag: [{ t1: 'cheddar'}, {t1: 'gouda'}]} }
                        ]
                    });
                    done();
                });
        });

        it('converts arrayElements to an array with different child elements', function (done) {
            XmlConvert.fromXml('<someTag>' +
                '<someNest anotherId="5432" />' +
                '<otherNest id="1234" />' +
                '</someTag>',
                {
                    someTag: {
                        $content: false,
                        $arrayElement: true
                    }
                },
                function (err, value) {
                    expect(err, 'to be null');
                    expect(value, 'to equal', {
                        someTag: [
                            {someNest: {anotherId: '5432'}},
                            {otherNest: {id: '1234'}}
                        ]
                    });
                    done();
                });

        });


        it('converts an array element with attributes and content', function (done) {

            XmlConvert.fromXml('<someTag>' +
                '<someNest anotherId="5432" />' +
                '<otherNest id="1234" />' +
                '</someTag>',
                {
                    someTag: {
                        $arrayElement: true
                    }
                },
                function (err, value) {
                    expect(err, 'to be null');
                    expect(value, 'to equal', {
                        someTag: {
                            $content: [
                                {someNest: {anotherId: '5432'}},
                                {otherNest: {id: '1234'}}
                            ]
                        }
                    });
                    done();
                });
        });

        it('converts a tag with named content', function (done) {

            XmlConvert.fromXml('<test id="123">http://example.com</test>', { test: { $content: 'url'}}, function (err, value) {

                expect(err, 'to be null');
                expect(value, 'to equal', { test: { id: '123', url: 'http://example.com'} } );
                done();
            });
        });

        it('converts nested $content:false arrays', function (done) {

            XmlConvert.fromXml('<test id="123">' +
                '<nest>' +

                    '<nested1>' +
                        '<entry id="a" />' +
                        '<entry id="b" />' +
                    '</nested1>' +
                    '<nested2>' +
                        '<entry id="c" />' +
                        '<entry id="d" />' +
                    '</nested2>' +
                '</nest>' +
             '</test>', {
                test: {
                    nest: {
                        $content: false,
                        $arrayElement: true,
                        nested1: {
                            $content: false,
                            $arrayElement: true
                        },
                        nested2: {
                            $content: false,
                            $arrayElement: true
                        }
                    }
                }
            }, function (err, value) {

                expect(err, 'to be null');
                expect(value, 'to equal', {
                    test: {
                        id: '123',
                        nest: [
                            {
                                nested1: [
                                    {entry: {id: 'a'}},
                                    {entry: {id: 'b'}}
                                ]
                            },
                            {
                                nested2: [
                                    { entry: { id: 'c' } },
                                    { entry: { id: 'd' } }
                                ]
                            }
                        ]
                    }
                });
                done();
            });

        });


        it('converts the example from the readme with all features', function (done) {

            var spec = {
                person: {
                    firstName: { $content: false },
                    lastName: { $content: false },
                    attributes: {
                        $arrayElement: true,
                        $content: false,
                        achievement: { $content: 'name' },
                        skill: { $content: 'name' }
                    }
                }
            };

            XmlConvert.fromXml(
                '<person id="195">' +
                    '<firstName>Alan</firstName>' +
                    '<lastName>Turing</lastName>' +
                    '<attributes>' +
                    '<skill id="CS101">Computer theory</skill>' +
                    '<achievement id="ENIG1">Code breaking</achievement>' +
                    '</attributes>' +
                    '</person>',
                spec, function (err, value) {

                    expect(err, 'to be null');

                    expect(value, 'to equal', {
                        person: {
                            id: '195',
                                firstName: 'Alan',
                                lastName: 'Turing',
                                attributes: [
                                {
                                    skill: {
                                        id: 'CS101',
                                        name: 'Computer theory'
                                    }
                                },
                                {
                                    achievement: {
                                        id: 'ENIG1',
                                        name: 'Code breaking'
                                    }
                                }
                            ]
                        }
                    });
                    done();
                });
        });

    });

    describe('toXml', function () {
       it('converts a single empty object to a tag', function (done) {
           XmlConvert.toXml({ test: {} }, {}, function (err, value) {
               expect(err, 'to be null');
               expect(value, 'to equal', '<test/>');
               done();
           });
       });

        it('converts a single string object to a tag', function (done) {
            XmlConvert.toXml({ test: 'some content'}, {}, function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', '<test>some content</test>');
                done();
            });
        });

        it('converts a single string object to a tag with a spec', function (done) {
            XmlConvert.toXml({ test: 'some content'}, { test: { $content: false } }, function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', '<test>some content</test>');
                done();
             });
        });

        it('converts a single tag with attributes', function (done) {
            XmlConvert.toXml({ test: { attr1: 'some attrib', attr2: 'some other attrib'} }, { }, function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', '<test attr1="some attrib" attr2="some other attrib"/>');
                done();
            });
        });

        it('converts a single tag with attributes and content', function (done) {
            XmlConvert.toXml({ test: { attr1: 'some attrib', attr2: 'some other attrib', $content: 'some content'} }, {}, function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', '<test attr1="some attrib" attr2="some other attrib">some content</test>');
                done();
            });
        });

        it('converts a single tag with attributes and sub-tags with no content', function (done) {
            XmlConvert.toXml(
                { test: { attr1: 'some attrib', subelem: 'some sub element'} },
                { test: { subelem: { $content: false }}}, function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', '<test attr1="some attrib"><subelem>some sub element</subelem></test>');
                done();
            });

        })

        it('converts a nested tag without a spec', function (done) {
            XmlConvert.toXml({ test: { attr1: 'some attrib', nested: { $content: 'some content' } } }, {}, function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', '<test attr1="some attrib"><nested>some content</nested></test>');
                done();
            });
        });

        it('converts a deep nested tag without a spec', function (done) {
            XmlConvert.toXml({
                test: {
                    attr1: 'some attrib',
                    nested: {
                        nestedId: 42,
                        subNested: {
                            $content: 'some content'
                        }
                    }
                }
            }, {}, function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', '<test attr1="some attrib"><nested nestedId="42"><subNested>some content</subNested></nested></test>');
                done();
            });
        });

        it('converts an array element with no attribs', function (done) {
            XmlConvert.toXml({
                test: {
                    attr1: 'some1',
                    nested: [
                        { elem1: { elem1attr1: 'abc'} },
                        { elem2: { elem2attr1: 'def'} },
                        { elem1: { elem1attr1: 'ghi'} }
                    ]
                }
            }, { test: { nested: { $arrayElement: true, $content: false }}},  function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', '<test attr1="some1"><nested>' +
                '<elem1 elem1attr1="abc"/>' +
                '<elem2 elem2attr1="def"/>' +
                '<elem1 elem1attr1="ghi"/>' +
                '</nested>' +
                '</test>');
                done();
            })
        });

        it('converts an array element with attribs', function (done) {
            XmlConvert.toXml({
                test: {
                    attr1: 'some1',
                    nested: {
                        nestedId: '123',
                        $content: [
                            {elem1: {elem1attr1: 'abc'}},
                            {elem2: {elem2attr1: 'def'}},
                            {elem1: {elem1attr1: 'ghi'}}
                        ]
                    }
                }
            }, { test: { nested: { $arrayElement: true }}},  function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', '<test attr1="some1"><nested nestedId="123">' +
                '<elem1 elem1attr1="abc"/>' +
                '<elem2 elem2attr1="def"/>' +
                '<elem1 elem1attr1="ghi"/>' +
                '</nested>' +
                '</test>');
                done();
            });
        });

        it('converts an element with string content where content is named', function (done) {

            XmlConvert.toXml({
                test: {
                    attr1: 'some1',
                    url: 'http://example.com'
                }
            }, { test: { $content: 'url' } }, function (err, value) {

                expect(err, 'to be null');
                expect(value, 'to equal', '<test attr1="some1">http://example.com</test>');
                done();
            });
        });

        it('converts an array element with attribs and named content', function (done) {
            XmlConvert.toXml({
                test: {
                    attr1: 'some1',
                    nested: {
                        nestedId: '123',
                        kids: [
                            {elem1: {elem1attr1: 'abc'}},
                            {elem2: {elem2attr1: 'def'}},
                            {elem1: {elem1attr1: 'ghi'}}
                        ]
                    }
                }
            }, { test: { nested: { $content: 'kids', $arrayElement: true }}},  function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', '<test attr1="some1"><nested nestedId="123">' +
                '<elem1 elem1attr1="abc"/>' +
                '<elem2 elem2attr1="def"/>' +
                '<elem1 elem1attr1="ghi"/>' +
                '</nested>' +
                '</test>');
                done();
            })
        });


        it('converts an array element with a spec for the child elements', function (done) {

            XmlConvert.toXml({
                test: {
                    attr1: 'some1',
                    nested: {
                        nestedId: '123',
                        kids: [
                            {elem1: 'abc'},
                            {elem2: {elem2attr1: 'def', elem2content: 'cheese'}},
                            {elem1: 'ghi'}
                        ]
                    }
                }
            }, {
                test: {
                    nested: {
                        $content: 'kids',
                        $arrayElement: true,
                        elem1: { $content: false },
                        elem2: { $content: 'elem2content' }
                    }
                }
            },  function (err, value) {
                expect(err, 'to be null');
                expect(value, 'to equal', '<test attr1="some1"><nested nestedId="123">' +
                '<elem1>abc</elem1>' +
                '<elem2 elem2attr1="def">cheese</elem2>' +
                '<elem1>ghi</elem1>' +
                '</nested>' +
                '</test>');
                done();
            })
        });


        it('converts the example from the readme with all features', function (done) {

            var spec = {
                person: {
                    firstName: { $content: false },
                    lastName: { $content: false },
                    attributes: {
                        $arrayElement: true,
                        $content: false,
                        achievement: { $content: 'name' },
                        skill: { $content: 'name' }
                    }
                }
            };

            XmlConvert.toXml(
                {
                    person: {
                        id: '195',
                        firstName: 'Alan',
                        lastName: 'Turing',
                        attributes: [
                            {
                                skill: {
                                    id: 'CS101',
                                    name: 'Computer theory'
                                }
                            },
                            {
                                achievement: {
                                    id: 'ENIG1',
                                    name: 'Code breaking'
                                }
                            }
                        ]
                    }
                }, spec, function (err, value) {
                    expect(err, 'to be null');
                    expect(value, 'to equal', '<person id="195">' +
                    '<firstName>Alan</firstName>' +
                    '<lastName>Turing</lastName>' +
                    '<attributes>' +
                    '<skill id="CS101">Computer theory</skill>' +
                    '<achievement id="ENIG1">Code breaking</achievement>' +
                    '</attributes>' +
                    '</person>');
                    done();
                });
        });

    });



});
