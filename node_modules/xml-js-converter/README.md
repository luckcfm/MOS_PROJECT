# First, a warning

We use semver, and we're starting at 1.0.0 in order to easily communicate API changes, 
without breaking semver. 

However, it's ***still beta*** and should be used with caution.


# xml-js-converter

Convert between an XML string and JavaScript objects (in both directions), following a specific schema. 

If you only need a generic conversion, you will probably find [https://www.npmjs.com/package/xml2js](xml2js) or [https://www.npmjs.com/package/xml2json](xml2json) suits your needs better.

What `xml-js-converter` allows you to do, is specify the way in which certain nodes are converted.
For instance, say you had the following XML:

```xml
<person id="195">
   <firstName>Alan</firstName>
   <lastName>Turing</lastName>
</person>
```

What you might want in JavaScript is

```javascript
{
    person: {
        id: '195',
        firstName: 'Alan',
        lastName: 'Turing'
    }
}
```

So the id attribute is a property, but so is the sub-element firstName. Converting back should
obviously do the same thing, so from the given JavaScript object, you get the same XML back.

## Collections / arrays

Say you had the following XML 
```xml
<person id="195">
   <firstName>Alan</firstName>
   <lastName>Turing</lastName>
   <skills>
      <skill id="CS101">Computer theory</skill>
      <skill id="ENIG1">Code breaking</skill>
   </skills>
</person>
```
_(The skills list is by no means exhaustive!)_

What you can obtain with `xml-js-converter` is the following JavaScript object:

```javascript
{
    person: {
        id: '195',
        firstName: 'Alan',
        lastName: 'Turing',
        skills: [
            { skill: {
                id: 'CS101',
                name: 'Computer theory'
            },
            { skill: {
                id: 'ENIG1',
                name: 'Code breaking'
            }
        ] 
    }
}
```

Notice the extra "skill" object - ie. an object with a single property "skill".  This is so that
you can have an array of sub-elements with different tag names.  For instance:


```xml
<person id="195">
   <firstName>Alan</firstName>
   <lastName>Turing</lastName>
   <attributes>
      <skill id="CS101">Computer theory</skill>
      <achievement id="ENIG1">Cracked the Enigma code</achievement>
   </attributes>
</person>
```

And end up with the JavaScript:


```javascript
{
    person: {
        id: '195',
        firstName: 'Alan',
        lastName: 'Turing',
        attributes: [
            { skill: {
                id: 'CS101',
                name: 'Computer theory'
            },
            { achievement: {
                id: 'ENIG1',
                name: 'Code breaking'
            }
        ] 
    }
}

```
# Usage

```
npm install xml-js-converter
```


```javascript

var xmlJsConverter = require('xml-js-converter');
```

## fromXml

``` 
fromXml(xmlAsString, specification, callback) 
```

Where callback is ``` function (err, value) { ... } ```, err is null unless there was an error,
and value is the javascript object. ```specification``` is defined in the next section.

```
xmlJsConverter.fromXml('<demo>text content</demo>', {}, function (err, value) {
    
    // value == { demo: { $content: 'text content' } }

});
```

## toXml

``` 
toXml(jsObject, specification, callback) 
```

Where callback is ```function (err, value) { ... } ```, err is null unless there was an error,
and value is a string with the XML.


## Specification

The specification can be an empty object.  Otherwise each property can define how to handle that tag name.

For instance:

```javascript
{
    test: {}
}
```

Would be a (useless, ie. "non-effect having") specification for:
```xml

<test>some content</test>
```

This would result in 


```javascript
{
    test: { 
        $content: 'some content'
    }
}
```

`$content` is the default name for the content of a tag.  You can override this in the spec by setting $content.

### $content

Set to a string to name the content property.
e.g.


```javascript
var spec = {
    test: {
        $content: 'name'
    }
};

xmlJsConverter.fromXml('<test>charles babbage</test>', spec, function (err, value) {
    // value == { 
    //       test: {
    //              name: 'charles babbage'
    //       }
    // };
});
```

Set to `false` to suppress the content. Note that attributes of the node will then be skipped,
as there is nowhere to define them.


e.g.


```javascript
var spec = {
    test: {
        $content: false
    }
};

xmlJsConverter.fromXml('<test>charles babbage</test>', spec, function (err, value) {
    // value == { 
    //       test: 'charles babbage'
    // };
});

```

To define `$content` for deeply nested elements, simply define the path to the elements.

e.g.


```javascript
var spec = {
    test: {
        name: {
            firstName: { $content: false },
            lastName: { $content: false }
        }
    }
};

xmlJsConverter.fromXml('<test><name>' + 
        '<firstName>charles</firstName>' + 
        '<lastName>babbage</lastName>' + 
        '</name></test>', spec, function (err, value) {
    // value == { 
    //       test: {
    //            name: {
    //                firstName: 'charles',
    //                lastName: 'babbage'
    //            }
    //        }
    // };
});

```



### $arrayElement

Set to true to include the children as an array.  Each child node will be an object with
a single property with the name of the tag, and then follow the conventions of sub-schema.

Note that the array will be the $content property, unless $content is also specified (either 
set as a name or to false to discard the attributes).

From the example above:


```xml
<person id="195">
   <firstName>Alan</firstName>
   <lastName>Turing</lastName>
   <attributes>
      <skill id="CS101">Computer theory</skill>
      <achievement id="ENIG1">Cracked the Enigma code</achievement>
   </attributes>
</person>
```

To obtain the following JavaScript:


```javascript
{
    person: {
        id: '195',
        firstName: 'Alan',
        lastName: 'Turing',
        attributes: [
            { skill: {
                id: 'CS101',
                name: 'Computer theory'
            },
            { achievement: {
                id: 'ENIG1',
                name: 'Code breaking'
            }
        ] 
    }
}

```

You'd use the specification: 

```javascript
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
```

Note how the `$arrayElement` is true, and also `$content` is false for the `attributes` element.
This suppresses the $content property for the array.  $content for array elements works exactly
the same as normal elements.

The specs for `achievement` and `skill` will be used for every `achievement` and `skill` element 
in the parent element.  If an unknown element occurs, it will simply use a default specification (`{}`)


# Contributing

Bugs, pull requests, comments all very welcome.

The tests are written in [mocha](http://mochajs.org), using the excellent [unexpected](https://github.com/unexpectedjs/unexpected) assertion library.

To run the tests, just call
```
npm test
```

# Versioning

We follow [semver](http://semver.org). We have started at version 1.0, not symbolise "production ready",
but to effectively communicate changes.


# Roadmap

Things we'd like soon:

* Support for numeric types
* Support to automatically case-switch (e.g. PascalCase in XML and camelCase in JS)

Things we'd like eventually:

* Support for naming nodes differently in JS and XML 
* Support for dropping the wrapper on arrayElements
  e.g. from 
  
  ```xml
  <people>
    <person name="monica" />
    <person name="steve" />
  </people>
  ``` 

To be transformed to

```javascript
  { people: [ { name: 'monica' }, { name: 'steve' } ] }
```


* Support for using an attribute as the "content"
  e.g. from

```xml
   <director>
      <person name="tim cook" />
   </director>
```

   To be transformed to 
```javascript
{
    director: {
        person: 'tim cook'
    }
}
```
This would also enable the `people` array in the previous example to be transformed to a simple array of strings.


